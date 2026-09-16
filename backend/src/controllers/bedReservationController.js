import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Hospital from '../models/Hospital.js';
import BedReservation from '../models/BedReservation.js';
import { emitBedUpdate, emitBedHoldAlert, emitBedHoldStatusChange } from '../services/socket.js';

// Bounded in-memory store for OTPs with auto-cleanup
// phone -> { hash: string, expiresAt: number, attempts: number }
const otpStore = new Map();

// Helper to hash OTP with salt
const hashOtp = (phone, otp) => {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'swasthya_setu_otp_salt')
    .update(`${phone}:${otp}`)
    .digest('hex');
};

// Periodic cleanup of expired OTP entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);

// Request Verification OTP (Patient Verification Guard)
export const requestOtp = async (req, res) => {
  try {
    const { phone, hospitalId, bedType } = req.body;
    const cleanPhone = String(phone || '').trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6-9.' });
    }

    // Rate limiting per phone number: max 1 OTP request per 30 seconds
    const existing = otpStore.get(cleanPhone);
    if (existing && existing.lastRequestedAt && (Date.now() - existing.lastRequestedAt < 30000)) {
      const waitSec = Math.ceil((30000 - (Date.now() - existing.lastRequestedAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
    }

    // Verify bed availability if hospitalId and bedType are provided
    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (hospital) {
        if (bedType) {
          const avail = hospital.beds?.[bedType]?.available || 0;
          if (avail <= 0) {
            return res.status(400).json({
              error: `No ${bedType.toUpperCase()} beds are currently available at this hospital.`
            });
          }
        }
        const totalAvail = (hospital.beds?.icu?.available || 0) +
          (hospital.beds?.general?.available || 0) +
          (hospital.beds?.ventilator?.available || 0);
        if (totalAvail <= 0) {
          return res.status(400).json({
            error: 'No beds are currently available at this hospital. All beds are occupied.'
          });
        }
      }
    }

    // Cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashed = hashOtp(cleanPhone, rawOtp);

    otpStore.set(cleanPhone, {
      hash: hashed,
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastRequestedAt: Date.now()
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.json({
      message: `Verification OTP sent to +91-${cleanPhone}`,
      expiresInSeconds: 300,
      // In development / demo mode, return OTP for convenience, but omit in production
      ...(isProduction ? {} : { otp: rawOtp })
    });
  } catch (error) {
    console.error('Error in /request-otp:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
};

// Verify Phone OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = String(phone || '').trim().replace(/[\s\-\+]/g, '');

    const record = otpStore.get(cleanPhone);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired or was not requested.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    const providedHash = hashOtp(cleanPhone, String(otp).trim());
    if (record.hash !== providedHash) {
      record.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification OTP.' });
    }

    // Clear the verified OTP
    otpStore.delete(cleanPhone);

    // Issue a short-lived verification token (15 mins) for bed hold authorization
    const secret = process.env.JWT_SECRET;
    const verificationToken = jwt.sign(
      { phone: cleanPhone, verified: true, purpose: 'bed_reservation' },
      secret,
      { expiresIn: '15m' }
    );

    res.json({
      verified: true,
      message: 'Phone number verified successfully.',
      verificationToken
    });
  } catch (error) {
    console.error('Error in /verify-otp:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// Atomic Concurrency-Safe Bed Reservation (10-minute hold)
export const reserveBed = async (req, res) => {
  try {
    const {
      bedType = 'icu',
      patientName,
      contactPhone,
      holdMinutes = 10,
      verificationToken,
      age,
      gender,
      emergencyNotes
    } = req.body;
    const hospitalId = req.params.id;

    if (!patientName || !contactPhone) {
      return res.status(400).json({ error: 'Patient name and contact phone are required' });
    }

    const cleanPhone = String(contactPhone).trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid contact phone. Please enter a valid 10-digit mobile number starting with 6-9.' });
    }

    // If verificationToken is passed, verify it matches phone
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        if (decoded.phone !== cleanPhone || decoded.purpose !== 'bed_reservation') {
          return res.status(403).json({ error: 'Invalid or mismatched verification token' });
        }
      } catch (err) {
        return res.status(403).json({ error: 'Verification token expired or invalid. Please verify phone again.' });
      }
    }

    if (!['icu', 'general', 'ventilator'].includes(bedType)) {
      return res.status(400).json({ error: 'Invalid bed type specified' });
    }

    // Verify hospital exists and has availability
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const availableBeds = hospital.beds?.[bedType]?.available || 0;
    if (availableBeds <= 0) {
      return res.status(400).json({
        error: `No ${bedType.toUpperCase()} beds are currently available at ${hospital.name}.`
      });
    }

    const totalAvail = (hospital.beds?.icu?.available || 0) +
      (hospital.beds?.general?.available || 0) +
      (hospital.beds?.ventilator?.available || 0);
    if (totalAvail <= 0) {
      return res.status(400).json({
        error: `No beds are currently available at ${hospital.name}. All beds are occupied.`
      });
    }

    // Prevent duplicate active holds for the same phone number
    const activeHold = await BedReservation.findOne({
      contactPhone: cleanPhone,
      status: 'reserved',
      expiresAt: { $gt: new Date() }
    }).populate('hospitalId');

    if (activeHold) {
      const remainingSeconds = Math.max(0, Math.round((new Date(activeHold.expiresAt).getTime() - Date.now()) / 1000));
      return res.status(409).json({
        error: 'An active bed reservation already exists for this phone number. Please use or release your current hold before creating a new one.',
        hasActiveHold: true,
        existingReservationCode: activeHold.reservationCode,
        existingReservation: activeHold,
        hospital: activeHold.hospitalId,
        expiresInSeconds: remainingSeconds
      });
    }

    // Cryptographically secure human-readable reservation code
    const randomSuffix = crypto.randomInt(100000, 999999).toString();
    const reservationCode = `SS-HOLD-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    // MONGO DB ATOMIC TRANSACTION CHECK
    const filter = {
      _id: hospitalId,
      [`beds.${bedType}.available`]: { $gt: 0 } // Concurrency safety
    };
    const update = {
      $inc: { [`beds.${bedType}.available`]: -1 },
      $set: { lastUpdated: new Date() }
    };

    const updatedHospital = await Hospital.findOneAndUpdate(filter, update, { new: true });

    if (!updatedHospital) {
      return res.status(409).json({
        error: 'Bed no longer available. Another patient reserved the last remaining bed.'
      });
    }

    const reservation = new BedReservation({
      hospitalId,
      bedType,
      patientName: patientName.trim(),
      contactPhone: cleanPhone,
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender).trim() : '',
      emergencyNotes: emergencyNotes ? String(emergencyNotes).trim() : '',
      reservationCode,
      status: 'reserved',
      expiresAt
    });

    await reservation.save();

    emitBedUpdate(hospitalId, updatedHospital.beds);
    emitBedHoldAlert(hospitalId, reservation, updatedHospital.name);

    const secret = process.env.JWT_SECRET;
    const holdToken = secret ? jwt.sign(
      {
        reservationCode,
        hospitalId: hospitalId.toString(),
        role: 'patient_hold'
      },
      secret,
      { expiresIn: `${holdMinutes + 5}m` }
    ) : null;

    res.status(201).json({
      success: true,
      message: 'Bed reserved successfully (10-minute hold active)',
      reservation: {
        ...reservation.toObject(),
        hospitalName: updatedHospital.name
      },
      hospital: updatedHospital,
      holdToken,
      expiresInSeconds: holdMinutes * 60
    });
  } catch (error) {
    console.error('Error reserving bed:', error);
    res.status(500).json({ error: 'Failed to complete atomic bed reservation' });
  }
};

// Confirm Bed Admission (Converts hold into permanent occupied status)
// Only transitions: reserved -> confirmed
export const confirmReservation = async (req, res) => {
  try {
    const { code } = req.params;

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: 'reserved' },
      { status: 'confirmed' },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation code not found or already processed' });
    }

    emitBedHoldStatusChange(code, {
      status: 'confirmed',
      hospitalId: reservation.hospitalId,
      message: 'Bed admission confirmed'
    });

    res.json({ message: 'Bed admission confirmed', reservation });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ error: 'Failed to confirm bed reservation' });
  }
};

// Release Bed Hold (Cancels reservation & restores bed count atomically)
// Only transitions: reserved -> released
export const releaseReservation = async (req, res) => {
  try {
    const { code } = req.params;

    // Scope check: If patient hold token, it must match this specific reservation code
    if (req.user?.role === 'patient_hold') {
      if (req.user.reservationCode !== code) {
        return res.status(403).json({ error: 'Hold token does not match reservation code' });
      }
    } else if (req.user?.role === 'admin' && req.user.hospitalId) {
      // Scope check: If hospital admin, it must match their hospital
      const checkRes = await BedReservation.findOne({ reservationCode: code }).select('hospitalId');
      if (checkRes && checkRes.hospitalId?.toString() !== req.user.hospitalId?.toString()) {
        return res.status(403).json({ error: 'Access forbidden: Hospital mismatch' });
      }
    } else if (!req.user) {
      // If unauthenticated, require matching contact phone number
      const callerPhone = (req.body?.phone || req.body?.contactPhone || '').replace(/\D/g, '').slice(-10);
      if (!callerPhone) {
        return res.status(401).json({ error: 'Authentication required. Please provide a valid hold token, admin credentials, or contact phone.' });
      }
      const existing = await BedReservation.findOne({ reservationCode: code, status: 'reserved' });
      if (!existing) {
        return res.status(404).json({ error: 'Active reservation not found or already processed' });
      }
      const resPhone = existing.contactPhone.replace(/\D/g, '').slice(-10);
      if (resPhone !== callerPhone) {
        return res.status(403).json({ error: 'Provided phone number does not match this reservation' });
      }
    }

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: 'reserved' },
      { status: 'released' },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Active reservation not found or already processed' });
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      reservation.hospitalId,
      {
        $inc: { [`beds.${reservation.bedType}.available`]: 1 },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );

    if (updatedHospital) {
      emitBedUpdate(updatedHospital._id, updatedHospital.beds);
    }

    emitBedHoldStatusChange(code, {
      status: 'released',
      hospitalId: reservation.hospitalId,
      message: 'Bed hold released & bed count restored'
    });

    res.json({
      message: 'Bed hold released & bed count restored',
      reservation,
      hospital: updatedHospital
    });
  } catch (error) {
    console.error('Error releasing reservation:', error);
    res.status(500).json({ error: 'Failed to release reservation hold' });
  }
};

// Discharge Patient (Frees up bed, sets status to discharged & increments available bed count atomically)
// Only transitions: confirmed -> discharged (cannot jump directly from reserved)
export const dischargePatient = async (req, res) => {
  try {
    const { code } = req.params;

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: 'confirmed' },
      { status: 'discharged' },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Active admitted patient reservation not found or already discharged' });
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      reservation.hospitalId,
      {
        $inc: { [`beds.${reservation.bedType}.available`]: 1 },
        $set: { lastUpdated: new Date() }
      },
      { new: true }
    );

    if (updatedHospital) {
      emitBedUpdate(updatedHospital._id, updatedHospital.beds);
    }

    emitBedHoldStatusChange(code, {
      status: 'discharged',
      hospitalId: reservation.hospitalId,
      message: 'Patient discharged & bed restored to live available inventory'
    });

    res.json({ message: 'Patient discharged & bed restored to live available inventory', reservation });
  } catch (error) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
};

// Check status of a bed reservation by reservation code (Used by client to verify if hold is still active)
export const getReservationStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const reservation = await BedReservation.findOne({ reservationCode: code })
      .select('reservationCode status expiresAt hospitalId bedType patientName')
      .lean();

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation code not found', exists: false });
    }

    const isExpired = reservation.status === 'reserved' && new Date(reservation.expiresAt) <= new Date();

    res.json({
      exists: true,
      reservationCode: reservation.reservationCode,
      status: isExpired ? 'expired' : reservation.status,
      bedType: reservation.bedType,
      hospitalId: reservation.hospitalId,
      patientName: reservation.patientName,
      expiresAt: reservation.expiresAt,
      isExpired
    });
  } catch (err) {
    console.error('Error fetching reservation status:', err);
    res.status(500).json({ error: 'Failed to fetch reservation status' });
  }
};

// Fetch live bed holds/reservations for hospital admin
export const getHospitalReservations = async (req, res) => {
  try {
    const { id } = req.params;

    const reservations = await BedReservation.find({ hospitalId: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching hospital reservations:', error);
    res.status(500).json({ error: 'Failed to fetch bed reservations' });
  }
};

// Lookup active bed reservation by phone number
export const getActiveHoldByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = String(phone).trim().replace(/[\s\-\+]/g, '').slice(-10);
    const activeHold = await BedReservation.findOne({
      contactPhone: new RegExp(`${cleanPhone}$`),
      status: 'reserved',
      expiresAt: { $gt: new Date() }
    }).populate('hospitalId');

    if (!activeHold) {
      return res.json({ hasActiveHold: false });
    }

    const remainingSeconds = Math.max(0, Math.round((new Date(activeHold.expiresAt).getTime() - Date.now()) / 1000));
    res.json({
      hasActiveHold: true,
      reservation: activeHold,
      hospital: activeHold.hospitalId,
      expiresInSeconds: remainingSeconds
    });
  } catch (error) {
    console.error('Error looking up active hold by phone:', error);
    res.status(500).json({ error: 'Failed to lookup active hold' });
  }
};

// Direct Walk-In / Offline Patient Admission (Hospital Counter Entry)
export const createWalkinAdmission = async (req, res) => {
  try {
    const {
      patientName,
      contactPhone,
      bedType = 'icu',
      age,
      gender,
      notes,
      emergencyNotes,
      doctorName
    } = req.body;
    const hospitalId = req.params.id;

    if (!patientName?.trim()) {
      return res.status(400).json({ error: 'Patient name is required for admission' });
    }

    if (!['icu', 'general', 'ventilator'].includes(bedType)) {
      return res.status(400).json({ error: 'Invalid bed category specified' });
    }

    // Verify hospital exists and has available beds
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const availableBeds = hospital.beds?.[bedType]?.available || 0;
    if (availableBeds <= 0) {
      return res.status(400).json({
        error: `No ${bedType.toUpperCase()} beds are currently available at ${hospital.name}.`
      });
    }

    // Clean phone or fallback for emergency walk-ins
    const cleanPhone = contactPhone
      ? String(contactPhone).trim().replace(/[\s\-\+]/g, '')
      : 'Walk-In Patient';

    // Unique Cryptographic Walk-In Admission Code
    const randomSuffix = crypto.randomInt(100000, 999999).toString();
    const reservationCode = `SS-WALKIN-${randomSuffix}`;

    // MONGO DB ATOMIC TRANSACTION CHECK
    const filter = {
      _id: hospitalId,
      [`beds.${bedType}.available`]: { $gt: 0 }
    };
    const update = {
      $inc: { [`beds.${bedType}.available`]: -1 },
      $set: { lastUpdated: new Date() }
    };

    const updatedHospital = await Hospital.findOneAndUpdate(filter, update, { new: true });
    if (!updatedHospital) {
      return res.status(409).json({
        error: 'Bed no longer available. All beds in this category are occupied.'
      });
    }

    // Walk-in patients are directly admitted (status: 'confirmed')
    const reservation = new BedReservation({
      hospitalId,
      bedType,
      patientName: patientName.trim(),
      contactPhone: cleanPhone,
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender).trim() : '',
      emergencyNotes: (emergencyNotes || notes || '').trim(),
      reservationCode,
      status: 'confirmed', // DIRECT ADMISSION
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days active until discharge
    });

    await reservation.save();

    // Broadcast authoritative bed count update to all clients and hospitals in real-time
    emitBedUpdate(hospitalId, updatedHospital.beds);
    emitBedHoldStatusChange(reservationCode, {
      status: 'confirmed',
      hospitalId,
      message: `Offline patient ${patientName} directly admitted to ${(bedType).toUpperCase()} Bed`
    });

    res.status(201).json({
      success: true,
      message: `Patient ${patientName} admitted successfully to ${(bedType).toUpperCase()} Bed`,
      reservation: {
        ...reservation.toObject(),
        hospitalName: updatedHospital.name
      },
      hospital: updatedHospital
    });
  } catch (error) {
    console.error('Error creating walkin admission:', error);
    res.status(500).json({ error: error.message || 'Failed to process walk-in patient admission' });
  }
};

// Update Patient Clinical Case Sheet & Allot Doctor
export const updatePatientCaseSheet = async (req, res) => {
  try {
    const { code } = req.params;
    const {
      chiefComplaint,
      diagnosis,
      injuryDetails,
      triagePriority,
      doctorName,
      doctorSpecialty,
      vitals,
      clinicalNotes,
      age,
      gender
    } = req.body;

    const reservation = await BedReservation.findOne({ reservationCode: code });
    if (!reservation) {
      return res.status(404).json({ error: 'Patient reservation record not found' });
    }

    if (chiefComplaint !== undefined) reservation.chiefComplaint = String(chiefComplaint).trim();
    if (diagnosis !== undefined) reservation.diagnosis = String(diagnosis).trim();
    if (injuryDetails !== undefined) reservation.injuryDetails = String(injuryDetails).trim();
    if (triagePriority !== undefined) reservation.triagePriority = triagePriority;
    if (clinicalNotes !== undefined) reservation.clinicalNotes = String(clinicalNotes).trim();
    if (age !== undefined && age !== '') reservation.age = Number(age);
    if (gender !== undefined && gender !== '') reservation.gender = String(gender).trim();

    if (doctorName !== undefined) {
      const cleanDoctorName = String(doctorName).trim();
      reservation.assignedDoctor = {
        name: cleanDoctorName,
        specialty: String(doctorSpecialty || reservation.assignedDoctor?.specialty || '').trim(),
        assignedAt: cleanDoctorName ? (reservation.assignedDoctor?.assignedAt || new Date()) : null
      };
    }

    if (vitals && typeof vitals === 'object') {
      reservation.vitals = {
        bp: vitals.bp !== undefined ? String(vitals.bp).trim() : (reservation.vitals?.bp || ''),
        pulse: vitals.pulse !== undefined ? String(vitals.pulse).trim() : (reservation.vitals?.pulse || ''),
        spO2: vitals.spO2 !== undefined ? String(vitals.spO2).trim() : (reservation.vitals?.spO2 || ''),
        temperature: vitals.temperature !== undefined ? String(vitals.temperature).trim() : (reservation.vitals?.temperature || ''),
        recordedAt: new Date()
      };
    }

    await reservation.save();

    // Broadcast live update to hospital dashboard
    emitBedHoldStatusChange(code, {
      status: reservation.status,
      hospitalId: reservation.hospitalId,
      chiefComplaint: reservation.chiefComplaint,
      diagnosis: reservation.diagnosis,
      injuryDetails: reservation.injuryDetails,
      triagePriority: reservation.triagePriority,
      assignedDoctor: reservation.assignedDoctor,
      vitals: reservation.vitals,
      message: `Medical case sheet updated for ${reservation.patientName}`
    });

    res.json({
      success: true,
      message: `Case sheet updated successfully for ${reservation.patientName}`,
      reservation
    });
  } catch (error) {
    console.error('Error updating patient case sheet:', error);
    res.status(500).json({ error: 'Failed to update patient case sheet' });
  }
};


import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BedReservation from '../models/BedReservation.js';
import { emitBedUpdate, emitBedHoldAlert } from '../services/socket.js';

const otpStore = new Map();

// Request Verification OTP (Patient Verification Guard)
export const requestOtp = async (req, res) => {
  try {
    const { phone, hospitalId, bedType } = req.body;
    const cleanPhone = String(phone || '').trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6-9.' });
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      message: `Verification OTP sent to +91-${cleanPhone}`,
      expiresInSeconds: 300,
      otp
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

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid verification OTP.' });
    }

    otpStore.delete(cleanPhone);
    res.json({ verified: true, message: 'Phone number verified successfully.' });
  } catch (error) {
    console.error('Error in /verify-otp:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// Atomic Concurrency-Safe Bed Reservation (10-minute hold)
export const reserveBed = async (req, res) => {
  try {
    const { bedType = 'icu', patientName, contactPhone, holdMinutes = 10 } = req.body;
    const hospitalId = req.params.id;

    if (!patientName || !contactPhone) {
      return res.status(400).json({ error: 'Patient name and contact phone are required' });
    }

    const cleanPhone = String(contactPhone).trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid contact phone. Please enter a valid 10-digit mobile number starting with 6-9.' });
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
    });

    if (activeHold) {
      return res.status(429).json({
        error: 'An active bed reservation already exists for this phone number. Please use or release your current hold before creating a new one.',
        existingReservationCode: activeHold.reservationCode
      });
    }

    const reservationCode = `SS-HOLD-${Math.floor(100000 + Math.random() * 900000)}`;
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
      patientName,
      contactPhone,
      reservationCode,
      status: 'reserved',
      expiresAt
    });

    await reservation.save();

    emitBedUpdate(hospitalId, updatedHospital.beds);
    emitBedHoldAlert(hospitalId, reservation, updatedHospital.name);

    res.status(201).json({
      message: 'Bed reserved successfully (10-minute hold active)',
      reservation: {
        ...reservation.toObject(),
        hospitalName: updatedHospital.name
      },
      expiresInSeconds: holdMinutes * 60
    });
  } catch (error) {
    console.error('Error reserving bed:', error);
    res.status(500).json({ error: 'Failed to complete atomic bed reservation' });
  }
};

// Confirm Bed Admission (Converts hold into permanent occupied status)
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

    res.json({ message: 'Bed admission confirmed', reservation });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ error: 'Failed to confirm bed reservation' });
  }
};

// Release Bed Hold (Cancels reservation & restores bed count atomically)
export const releaseReservation = async (req, res) => {
  try {
    const { code } = req.params;

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

    res.json({ message: 'Bed hold released & bed count restored', reservation });
  } catch (error) {
    console.error('Error releasing reservation:', error);
    res.status(500).json({ error: 'Failed to release reservation hold' });
  }
};

// Discharge Patient (Frees up bed, sets status to discharged & increments available bed count atomically)
export const dischargePatient = async (req, res) => {
  try {
    const { code } = req.params;

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: { $in: ['confirmed', 'reserved'] } },
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

    res.json({ message: 'Patient discharged & bed restored to live available inventory', reservation });
  } catch (error) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ error: 'Failed to discharge patient' });
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

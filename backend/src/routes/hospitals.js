import { Router } from 'express';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import BedReservation from '../models/BedReservation.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emitBedUpdate, emitRegistrationRequest, emitBedHoldAlert } from '../services/socket.js';
import { haversineDistance, calculateHospitalScore, getCoordinatesForCity, geocodeFullAddress } from '../utils/geo.js';

import { mockHospitals, mockReservations } from '../utils/mockStore.js';
import mongoose from 'mongoose';

const router = Router();

// Get all hospitals with filters
router.get('/', async (req, res) => {
  try {
    const { city, state, bedType, hasAvailability, includeUnverified, limit = 50, page = 1 } = req.query;
    
    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      let filtered = [...mockHospitals];
      if (includeUnverified !== 'true') {
        filtered = filtered.filter(h => h.isVerified !== false);
      }
      if (city) filtered = filtered.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
      if (state) filtered = filtered.filter(h => h.state.toLowerCase().includes(state.toLowerCase()));
      if (hasAvailability === 'true' && bedType) {
        filtered = filtered.filter(h => h.beds?.[bedType]?.available > 0);
      }
      return res.json({
        hospitals: filtered,
        pagination: { total: filtered.length, page: 1, limit: 50, pages: 1 }
      });
    }

    const filter = {};
    if (includeUnverified !== 'true') {
      filter.isVerified = true;
    }
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (hasAvailability === 'true' && bedType) {
      filter[`beds.${bedType}.available`] = { $gt: 0 };
    }

    const hospitals = await Hospital.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ lastUpdated: -1 })
      .lean();

    const total = await Hospital.countDocuments(filter);

    res.json({
      hospitals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.json({ hospitals: mockHospitals, pagination: { total: mockHospitals.length, page: 1, limit: 50, pages: 1 } });
  }
});

/**
 * GET /api/hospitals/pending/queue
 * Superadmin queue for unverified hospital registration requests
 */
router.get('/pending/queue', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const pending = mockHospitals.filter(h => h.isVerified === false);
      return res.json({ queue: pending });
    }

    const pending = await Hospital.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ queue: pending });
  } catch (error) {
    console.error('Error fetching pending hospitals queue:', error);
    res.status(500).json({ error: 'Failed to fetch pending hospitals queue' });
  }
});

// Search hospitals by location
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, radius = 50, bedType } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng)) {
      res.status(400).json({ error: 'Invalid latitude or longitude' });
      return;
    }

    const hospitals = await Hospital.find({
      emergencyServices: true,
      isVerified: true
    }).lean();

    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = haversineDistance(
        userLat, userLng,
        hospital.coordinates?.lat, hospital.coordinates?.lng
      );
      return { ...hospital, distance };
    }).filter(h => h.distance <= radiusKm);

    let filtered = hospitalsWithDistance;
    if (bedType) {
      filtered = filtered.filter(h => {
        const beds = h.beds?.[bedType];
        return beds && beds.available > 0;
      });
    }

    filtered.sort((a, b) => a.distance - b.distance);

    const scored = filtered.map(hospital => ({
      ...hospital,
      score: calculateHospitalScore(hospital, bedType)
    }));

    res.json({
      hospitals: scored.slice(0, 10),
      userLocation: { lat: userLat, lng: userLng }
    });
  } catch (error) {
    console.error('Error searching hospitals:', error);
    res.status(500).json({ error: 'Failed to search hospitals' });
  }
});

// Get hospital statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const verifiedHospitals = await Hospital.countDocuments({ isVerified: true });
    
    const bedStats = await Hospital.aggregate([
      {
        $group: {
          _id: null,
          totalICU: { $sum: '$beds.icu.total' },
          availableICU: { $sum: '$beds.icu.available' },
          totalGeneral: { $sum: '$beds.general.total' },
          availableGeneral: { $sum: '$beds.general.available' },
          totalVentilator: { $sum: '$beds.ventilator.total' },
          availableVentilator: { $sum: '$beds.ventilator.available' }
        }
      }
    ]);

    res.json({
      totalHospitals,
      verifiedHospitals,
      beds: bedStats[0] || {
        totalICU: 0,
        availableICU: 0,
        totalGeneral: 0,
        availableGeneral: 0,
        totalVentilator: 0,
        availableVentilator: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get unverified hospital approval queue (Superadmin only)
router.get('/pending/queue', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const pending = mockHospitals.filter(h => h.isVerified === false || h.verificationStatus === 'pending');
      return res.json({ queue: pending });
    }

    const pending = await Hospital.find({
      $or: [
        { isVerified: false },
        { verificationStatus: 'pending' }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({ queue: pending });
  } catch (error) {
    console.error('Error fetching pending verification queue:', error);
    res.status(500).json({ error: 'Failed to fetch verification queue' });
  }
});

// ─── STATIC ROUTES (MUST BE BEFORE /:id ROUTES) ───────────────────────────
const otpStore = new Map();

// Request Verification OTP (Patient Verification Guard)
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = String(phone || '').trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6-9.' });
    }

    const demoOtp = '123456';
    otpStore.set(cleanPhone, { otp: demoOtp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      message: 'Verification OTP sent successfully (Demo OTP: 123456)',
      expiresInSeconds: 300,
      demoOtp
    });
  } catch (error) {
    console.error('Error in /request-otp:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Verify Phone OTP
router.post('/verify-otp', async (req, res) => {
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
});

// Confirm Bed Admission (Converts hold into permanent occupied status)
router.post('/reservations/:code/confirm', async (req, res) => {
  try {
    const { code } = req.params;

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const resv = mockReservations.find(r => r.reservationCode === code);
      if (!resv) return res.status(404).json({ error: 'Reservation code not found' });
      resv.status = 'confirmed';
      return res.json({ message: 'Bed admission confirmed', reservation: resv });
    }

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: 'reserved' },
      { status: 'confirmed' },
      { new: true }
    );

    if (!reservation) {
      res.status(404).json({ error: 'Reservation code not found or already processed' });
      return;
    }

    res.json({ message: 'Bed admission confirmed', reservation });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ error: 'Failed to confirm bed reservation' });
  }
});

// Release Bed Hold (Cancels reservation & restores bed count atomically)
router.post('/reservations/:code/release', async (req, res) => {
  try {
    const { code } = req.params;

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const resv = mockReservations.find(r => r.reservationCode === code && r.status === 'reserved');
      if (!resv) return res.status(404).json({ error: 'Active reservation not found' });
      
      resv.status = 'released';
      const hospital = mockHospitals.find(h => h._id === resv.hospitalId || h.id === resv.hospitalId);
      if (hospital && hospital.beds[resv.bedType]) {
        hospital.beds[resv.bedType].available += 1;
        emitBedUpdate(hospital._id || hospital.id, hospital.beds);
      }
      return res.json({ message: 'Bed hold released & bed count restored', reservation: resv });
    }

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: 'reserved' },
      { status: 'released' },
      { new: true }
    );

    if (!reservation) {
      res.status(404).json({ error: 'Active reservation not found or already processed' });
      return;
    }

    // Atomically increment available bed count back
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
});

// Discharge Patient (Frees up bed, sets status to discharged & increments available bed count atomically)
router.post('/reservations/:code/discharge', async (req, res) => {
  try {
    const { code } = req.params;

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const resv = mockReservations.find(r => r.reservationCode === code && (r.status === 'confirmed' || r.status === 'reserved'));
      if (!resv) return res.status(404).json({ error: 'Active admitted patient reservation not found' });
      
      resv.status = 'discharged';
      const hospital = mockHospitals.find(h => h._id === resv.hospitalId || h.id === resv.hospitalId);
      if (hospital && hospital.beds[resv.bedType]) {
        hospital.beds[resv.bedType].available += 1;
        emitBedUpdate(hospital._id || hospital.id, hospital.beds);
      }
      return res.json({ message: 'Patient discharged & bed restored to live available inventory', reservation: resv });
    }

    const reservation = await BedReservation.findOneAndUpdate(
      { reservationCode: code, status: { $in: ['confirmed', 'reserved'] } },
      { status: 'discharged' },
      { new: true }
    );

    if (!reservation) {
      res.status(404).json({ error: 'Active admitted patient reservation not found or already discharged' });
      return;
    }

    // Atomically increment available bed count back
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
});

// Verify or reject a hospital registration (Superadmin only)
router.patch('/:id/verify', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { status = 'approved' } = req.body;
    const isApproved = status === 'approved';

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const target = mockHospitals.find(h => h._id === req.params.id);
      if (target) {
        target.isVerified = isApproved;
        target.verificationStatus = status;
        target.lastUpdated = new Date().toISOString();
        return res.json({ message: `Hospital ${status} successfully`, hospital: target });
      }
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: isApproved,
        verificationStatus: status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    res.json({ message: `Hospital ${status} successfully`, hospital });
  } catch (error) {
    console.error('Error verifying hospital:', error);
    res.status(500).json({ error: 'Failed to verify hospital' });
  }
});

// Create hospital (Superadmin only)
router.post('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      coordinates,
      phone,
      email,
      beds,
      specialties,
      emergencyServices = true,
      isVerified = true
    } = req.body;

    if (!name || !address || !city || !state || !coordinates || !phone || !email) {
      res.status(400).json({ error: 'Missing required hospital fields' });
      return;
    }

    const defaultBeds = {
      icu: { total: beds?.icu?.total || 0, available: beds?.icu?.available || 0 },
      general: { total: beds?.general?.total || 0, available: beds?.general?.available || 0 },
      ventilator: { total: beds?.ventilator?.total || 0, available: beds?.ventilator?.available || 0 }
    };

    const hospital = new Hospital({
      name,
      address,
      city,
      state,
      coordinates,
      phone,
      email,
      beds: defaultBeds,
      specialties: specialties || [],
      emergencyServices,
      isVerified
    });

    await hospital.save();

    res.status(201).json({ message: 'Hospital created successfully', hospital });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ error: 'Failed to create hospital' });
  }
});

// Get single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).lean();
    
    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    const bloodStock = await BloodStock.find({ hospitalId: hospital._id }).lean();

    res.json({ hospital, bloodStock });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
});

// Update hospital details (Superadmin only)
router.put('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    res.json({ message: 'Hospital details updated', hospital });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ error: 'Failed to update hospital details' });
  }
});

// Delete hospital (Superadmin only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    await BloodStock.deleteMany({ hospitalId: req.params.id });

    res.json({ message: 'Hospital and associated blood stock deleted' });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({ error: 'Failed to delete hospital' });
  }
});

// Update bed availability (Admin & Superadmin)
router.put('/:id/beds', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { beds } = req.body;
    const hospitalId = req.params.id;

    if (!beds) {
      res.status(400).json({ error: 'Beds payload is required' });
      return;
    }

    if (req.user?.role !== 'superadmin' && 
        req.user?.hospitalId?.toString() !== hospitalId) {
      res.status(403).json({ error: 'Not authorized for this hospital' });
      return;
    }

    const existingHospital = await Hospital.findById(hospitalId);
    if (!existingHospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    // Merge existing bed structure safely
    const updatedBeds = {
      icu: {
        total: beds.icu?.total ?? existingHospital.beds.icu.total,
        available: beds.icu?.available ?? existingHospital.beds.icu.available
      },
      general: {
        total: beds.general?.total ?? existingHospital.beds.general.total,
        available: beds.general?.available ?? existingHospital.beds.general.available
      },
      ventilator: {
        total: beds.ventilator?.total ?? existingHospital.beds.ventilator.total,
        available: beds.ventilator?.available ?? existingHospital.beds.ventilator.available
      }
    };

    existingHospital.beds = updatedBeds;
    existingHospital.lastUpdated = new Date();
    await existingHospital.save();

    emitBedUpdate(hospitalId, updatedBeds);

    res.json({ 
      hospital: existingHospital
    });
  } catch (error) {
    console.error('Error updating beds:', error);
    res.status(500).json({ error: 'Failed to update bed availability' });
  }
});

// Atomic Concurrency-Safe Bed Reservation (10-minute hold)
router.post('/:id/reserve-bed', async (req, res) => {
  try {
    const { bedType = 'icu', patientName, contactPhone, holdMinutes = 10 } = req.body;
    const hospitalId = req.params.id;

    if (!patientName || !contactPhone) {
      res.status(400).json({ error: 'Patient name and contact phone are required' });
      return;
    }

    // Phone format validation (10-digit Indian number or standard 10-12 digits)
    const cleanPhone = String(contactPhone).trim().replace(/[\s\-\+]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400).json({ error: 'Invalid contact phone. Please enter a valid 10-digit mobile number starting with 6-9.' });
      return;
    }

    if (!['icu', 'general', 'ventilator'].includes(bedType)) {
      res.status(400).json({ error: 'Invalid bed type specified' });
      return;
    }

    // Prevent duplicate active holds for the same phone number
    if (mongoose.connection.readyState === 1 && !global.isDemoMode) {
      const activeHold = await BedReservation.findOne({
        contactPhone: cleanPhone,
        status: 'reserved',
        expiresAt: { $gt: new Date() }
      });

      if (activeHold) {
        res.status(429).json({
          error: 'An active bed reservation already exists for this phone number. Please use or release your current hold before creating a new one.',
          existingReservationCode: activeHold.reservationCode
        });
        return;
      }
    }

    const reservationCode = `SS-HOLD-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    // DEMO MODE / FALLBACK HANDLER
    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const targetHospital = mockHospitals.find(h => h._id === hospitalId || h.id === hospitalId);
      if (!targetHospital || !targetHospital.beds?.[bedType] || targetHospital.beds[bedType].available <= 0) {
        return res.status(409).json({ 
          error: 'Bed no longer available. Another patient reserved the last remaining bed.' 
        });
      }

      // Decrement bed count atomically in mock store
      targetHospital.beds[bedType].available -= 1;
      targetHospital.lastUpdated = new Date().toISOString();

      const newReservation = {
        _id: `res_${Date.now()}`,
        hospitalId,
        hospitalName: targetHospital.name,
        bedType,
        patientName,
        contactPhone,
        reservationCode,
        status: 'reserved',
        expiresAt: expiresAt.toISOString()
      };
      mockReservations.push(newReservation);
      emitBedUpdate(hospitalId, targetHospital.beds);

      return res.status(201).json({
        message: 'Bed reserved successfully (10-minute hold active)',
        reservation: newReservation,
        expiresInSeconds: holdMinutes * 60
      });
    }

    // MONGO DB ATOMIC TRANSACTION CHECK
    // Uses findOneAndUpdate with conditional query: beds.<bedType>.available > 0
    const filter = {
      _id: hospitalId,
      [`beds.${bedType}.available`]: { $gt: 0 } // Guaranteed concurrency safety!
    };
    const update = {
      $inc: { [`beds.${bedType}.available`]: -1 },
      $set: { lastUpdated: new Date() }
    };

    const updatedHospital = await Hospital.findOneAndUpdate(filter, update, { new: true });

    if (!updatedHospital) {
      res.status(409).json({
        error: 'Bed no longer available. Another patient reserved the last remaining bed.'
      });
      return;
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
});

/**
 * GET /api/hospitals/:id/reservations
 * Fetch live bed holds/reservations for hospital admin
 */
router.get('/:id/reservations', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      const list = mockReservations.filter(r => r.hospitalId === id);
      return res.json({ reservations: list });
    }

    const reservations = await BedReservation.find({ hospitalId: id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching hospital reservations:', error);
    res.status(500).json({ error: 'Failed to fetch bed reservations' });
  }
});

// Public registration request for new hospitals
router.post('/register-request', async (req, res) => {
  try {
    const {
      name,
      type = 'private',
      licenseNumber,
      address,
      city,
      state,
      phone,
      email,
      password,
      generalBeds = 100,
      icuBeds = 20,
      ventilatorBeds = 5,
      specialties = ['Emergency', 'ICU', 'General Care']
    } = req.body;

    if (!name || !city || !email || !password) {
      return res.status(400).json({ error: 'Hospital Name, City, Admin Email, and Password are required' });
    }

    // Check if user already exists
    if (mongoose.connection.readyState === 1 && !global.isDemoMode) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'An admin account with this email already exists' });
      }
    }

    const regNo = licenseNumber || `HFR-${Date.now().toString().slice(-6)}`;

    // Automatically geocode full hospital address or city via OpenStreetMap
    const coordinates = (req.body.lat && req.body.lng) 
      ? { lat: Number(req.body.lat), lng: Number(req.body.lng) } 
      : await geocodeFullAddress(address, city, state);

    // Create unverified hospital
    const newHospital = new Hospital({
      name,
      type,
      registrationNumber: regNo,
      address: address || `${city}, ${state || 'India'}`,
      city,
      state: state || 'India',
      phone: phone || '+91-9876543210',
      email,
      isVerified: false,
      isSimulated: false,
      beds: {
        general: { total: Number(generalBeds), available: Number(generalBeds) },
        icu: { total: Number(icuBeds), available: Number(icuBeds) },
        ventilator: { total: Number(ventilatorBeds), available: Number(ventilatorBeds) },
      },
      specialties: Array.isArray(specialties) ? specialties : [specialties],
      coordinates,
      lastUpdated: new Date()
    });

    await newHospital.save();

    // Create admin user (inactive until Super Admin approval)
    const newAdmin = new User({
      email,
      password,
      name: `${name} Admin`,
      role: 'admin',
      hospitalId: newHospital._id,
      isActive: false
    });

    await newAdmin.save();

    // Broadcast live notification to Super Admin Control Room via WebSockets
    emitRegistrationRequest('hospital', newHospital);

    res.status(201).json({
      message: 'Hospital registration application submitted successfully! Super Admin review pending.',
      hospital: newHospital,
      adminEmail: email
    });
  } catch (error) {
    console.error('Error submitting hospital registration request:', error);
    res.status(500).json({ error: 'Failed to submit hospital registration application: ' + error.message });
  }
});

/**
 * GET /api/hospitals/pending/queue
 * Superadmin queue for unverified hospitals
 */
router.get('/pending/queue', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const pending = await Hospital.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ queue: pending });
  } catch (error) {
    console.error('Error fetching pending hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch pending hospitals' });
  }
});

// Super Admin approval & verification endpoint
router.patch('/:id/verify', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, isBlockchainVerified: true, lastUpdated: new Date() },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Activate hospital admin user if pending
    const hospObjId = new mongoose.Types.ObjectId(hospital._id);
    await User.updateMany(
      {
        $or: [
          { hospitalId: hospObjId },
          { hospitalId: hospital._id.toString() },
          { email: hospital.email },
          { email: hospital.adminEmail }
        ]
      },
      { $set: { isActive: true } }
    );

    res.json({ message: `${hospital.name} verified and approved successfully!`, hospital });
  } catch (error) {
    console.error('Error verifying hospital:', error);
    res.status(500).json({ error: 'Failed to verify hospital' });
  }
});

export default router;

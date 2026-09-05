import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import { emitRegistrationRequest } from '../services/socket.js';
import { geocodeFullAddress } from '../utils/geo.js';
import { mockHospitals } from '../utils/mockStore.js';

// Public registration request for new hospitals
export const registerHospitalRequest = async (req, res) => {
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
};

// Superadmin queue for unverified hospitals
export const getPendingQueue = async (req, res) => {
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
    console.error('Error fetching pending hospitals queue:', error);
    res.status(500).json({ error: 'Failed to fetch verification queue' });
  }
};

// Super Admin approval & verification endpoint
export const verifyHospital = async (req, res) => {
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
        isBlockchainVerified: isApproved,
        verificationStatus: status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // If approved, activate hospital admin user
    if (isApproved) {
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
    }

    res.json({ message: `${hospital.name} ${status} successfully!`, hospital });
  } catch (error) {
    console.error('Error verifying hospital:', error);
    res.status(500).json({ error: 'Failed to verify hospital' });
  }
};

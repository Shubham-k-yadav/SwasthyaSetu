import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import { emitRegistrationRequest } from '../services/socket.js';
import { geocodeFullAddress } from '../utils/geo.js';

// Public registration request for new hospitals
export const registerHospitalRequest = async (req, res) => {
  try {
    const {
      name,
      type = 'private',
      licenseNumber,
      registrationNumber,
      address,
      city,
      state,
      phone,
      email,
      password,
      generalBeds = 0,
      icuBeds = 0,
      ventilatorBeds = 0,
      specialties = [],
      emergencyServices = false
    } = req.body;

    if (!name || !city || !email || !password) {
      return res.status(400).json({ error: 'Hospital Name, City, Admin Email, and Password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An admin account with this email already exists' });
      }
    }

    const regNo = (licenseNumber || registrationNumber || '').trim() || `HFR-${Date.now().toString().slice(-6)}`;

    // Automatically geocode full hospital address or city via OpenStreetMap
    const coordinates = (req.body.lat && req.body.lng) 
      ? { lat: Number(req.body.lat), lng: Number(req.body.lng) } 
      : await geocodeFullAddress(address, city, state);

    const parsedSpecialties = Array.isArray(specialties) 
      ? specialties.filter(s => typeof s === 'string' && s.trim().length > 0)
      : (typeof specialties === 'string' && specialties.trim() ? [specialties.trim()] : []);

    const isEmergencyEnabled = emergencyServices === true || emergencyServices === 'true' || emergencyServices === 1;

    // Create unverified hospital
    const newHospital = new Hospital({
      name: name.trim(),
      type,
      registrationNumber: regNo,
      licenseNumber: regNo,
      address: address || `${city}, ${state || 'India'}`,
      city: city.trim(),
      state: state || 'India',
      phone: phone || '+91-9876543210',
      email: cleanEmail,
      adminEmail: cleanEmail,
      isVerified: false,
      isSimulated: false,
      beds: {
        general: { total: Math.max(0, Number(generalBeds) || 0), available: Math.max(0, Number(generalBeds) || 0) },
        icu: { total: Math.max(0, Number(icuBeds) || 0), available: Math.max(0, Number(icuBeds) || 0) },
        ventilator: { total: Math.max(0, Number(ventilatorBeds) || 0), available: Math.max(0, Number(ventilatorBeds) || 0) },
      },
      specialties: parsedSpecialties,
      emergencyServices: isEmergencyEnabled,
      coordinates,
      lastUpdated: new Date()
    });

    await newHospital.save();

    // Create admin user (inactive until Super Admin approval)
    const newAdmin = new User({
      email: cleanEmail,
      password,
      name: `${name.trim()} Admin`,
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
      adminEmail: cleanEmail
    });
  } catch (error) {
    console.error('Error submitting hospital registration request:', error);
    res.status(500).json({ error: 'Failed to submit hospital registration application: ' + error.message });
  }
};

// Superadmin queue for unverified hospitals
export const getPendingQueue = async (req, res) => {
  try {
    const pending = await Hospital.find({
      $or: [
        { isVerified: false },
        { verificationStatus: 'pending' }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Enrich missing emails or license numbers from linked User account
    const enrichedQueue = await Promise.all(pending.map(async (hosp) => {
      let adminEmail = hosp.adminEmail || hosp.email;
      if (!adminEmail) {
        const linkedUser = await User.findOne({
          $or: [
            { hospitalId: hosp._id },
            { hospitalId: hosp._id.toString() }
          ]
        }).lean();
        if (linkedUser) {
          adminEmail = linkedUser.email;
        }
      }

      return {
        ...hosp,
        email: adminEmail || hosp.email || 'N/A',
        adminEmail: adminEmail || hosp.adminEmail || 'N/A',
        registrationNumber: hosp.registrationNumber || hosp.licenseNumber || hosp.registrationCertificate || 'HFR-SYSTEM-PENDING',
        licenseNumber: hosp.licenseNumber || hosp.registrationNumber || 'HFR-SYSTEM-PENDING'
      };
    }));

    res.json({ queue: enrichedQueue });
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

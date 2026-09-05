import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Ambulance from '../models/Ambulance.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ambulanceLocationLimiter } from '../middleware/rateLimiter.js';
import { getIO, emitRegistrationRequest } from '../services/socket.js';

const router = express.Router();

// Helper to broadcast live ambulance location updates via WebSockets
const emitAmbulanceUpdate = (ambulanceData) => {
  try {
    const io = getIO();
    const payload = {
      ambulanceId: ambulanceData._id || ambulanceData.id,
      hospitalId: ambulanceData.hospitalId,
      vehicleNumber: ambulanceData.vehicleNumber,
      driverName: ambulanceData.driverName,
      driverPhone: ambulanceData.driverPhone,
      lat: ambulanceData.currentLat,
      lng: ambulanceData.currentLng,
      status: ambulanceData.status,
      equipmentLevel: ambulanceData.equipmentLevel,
      updatedAt: new Date().toISOString()
    };

    // Broadcast to public emergency pages & clients
    io.emit('ambulance-updates', payload);

    // Broadcast to specific hospital room if linked
    if (ambulanceData.hospitalId) {
      io.to(`hospital-${ambulanceData.hospitalId}`).emit('hospital-ambulance-update', payload);
    }
  } catch (err) {
    console.warn('Socket broadcast warning (ambulance-updates):', err.message);
  }
};

/**
 * POST /api/ambulances/register-request
 * Public endpoint to register an ambulance vehicle & driver
 */
router.post('/register-request', async (req, res) => {
  try {
    const {
      vehicleNumber,
      driverName,
      driverPhone,
      equipmentLevel = 'Advanced Life Support (ALS)',
      hospitalId,
      hospitalName,
      email,
      password,
      currentLat = 28.6139,
      currentLng = 77.2090
    } = req.body;

    if (!vehicleNumber || !driverName || !driverPhone) {
      return res.status(400).json({ error: 'Vehicle Number, Driver Name, and Contact Phone are required' });
    }

    const cleanVehicle = vehicleNumber.trim().toUpperCase();
    const driverToken = crypto.randomBytes(16).toString('hex');

    if (mongoose.connection.readyState === 1) {
      const existing = await Ambulance.findOne({ vehicleNumber: cleanVehicle });
      if (existing) {
        return res.status(400).json({ error: 'An ambulance with this vehicle number is already registered' });
      }
    }

    const newAmbulance = new Ambulance({
      vehicleNumber: cleanVehicle,
      driverName,
      driverPhone,
      equipmentLevel,
      driverToken,
      hospitalId: hospitalId || null,
      hospitalName: hospitalName || 'Independent Operator',
      currentLat: Number(currentLat),
      currentLng: Number(currentLng),
      status: 'available',
      isVerified: false,
      isSimulated: false,
      lastUpdated: new Date()
    });

    await newAmbulance.save();

    emitRegistrationRequest('ambulance', newAmbulance);

    res.status(201).json({
      message: 'Ambulance registration submitted successfully! Super Admin review pending.',
      ambulance: newAmbulance,
      driverLink: `/driver/${driverToken}`
    });
  } catch (error) {
    console.error('Error registering ambulance:', error);
    res.status(500).json({ error: 'Failed to submit ambulance registration: ' + error.message });
  }
});

/**
 * GET /api/ambulances/pending/queue
 * Superadmin queue for unverified ambulances
 */
router.get('/pending/queue', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const pending = await Ambulance.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ queue: pending });
  } catch (error) {
    console.error('Error fetching pending ambulances:', error);
    res.status(500).json({ error: 'Failed to fetch pending ambulances' });
  }
});

/**
 * GET /api/ambulances/hospital/:hospitalId
 * Fetch all ambulances registered under a specific hospital
 */
router.get('/hospital/:hospitalId', authenticate, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const ambulances = await Ambulance.find({ hospitalId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ ambulances });
  } catch (error) {
    console.error('Error fetching hospital ambulances:', error);
    res.status(500).json({ error: 'Failed to fetch hospital ambulances' });
  }
});

/**
 * POST /api/ambulances/hospital-add
 * Hospital admin adds/registers an ambulance directly for their hospital
 */
router.post('/hospital-add', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { vehicleNumber, driverName, driverPhone, equipmentLevel = 'Advanced Life Support (ALS)', hospitalId, hospitalName } = req.body;
    
    if (!vehicleNumber || !driverName || !driverPhone) {
      return res.status(400).json({ error: 'Vehicle Number, Driver Name, and Driver Phone are required' });
    }

    const cleanVehicle = vehicleNumber.trim().toUpperCase();
    const targetHospitalId = hospitalId || req.user?.hospitalId || req.user?.hospital;

    if (mongoose.connection.readyState === 1) {
      const existing = await Ambulance.findOne({ vehicleNumber: cleanVehicle });
      if (existing) {
        return res.status(400).json({ error: `Ambulance with vehicle number ${cleanVehicle} is already registered in the system.` });
      }
    }

    // Attempt to fetch hospital coordinates if available
    let lat = 25.4331;
    let lng = 81.8476;
    let hName = hospitalName || req.user?.name || 'Hospital Ambulance';

    if (targetHospitalId && mongoose.connection.readyState === 1) {
      try {
        const Hospital = mongoose.model('Hospital');
        const hDoc = await Hospital.findById(targetHospitalId).lean();
        if (hDoc) {
          if (hDoc.coordinates?.lat) lat = hDoc.coordinates.lat;
          if (hDoc.coordinates?.lng) lng = hDoc.coordinates.lng;
          if (hDoc.name) hName = hDoc.name;
        }
      } catch (err) {}
    }

    const tokenStr = crypto.randomBytes(8).toString('hex');

    const newAmbulance = new Ambulance({
      vehicleNumber: cleanVehicle,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      equipmentLevel,
      hospitalId: targetHospitalId,
      hospitalName: hName,
      isVerified: true, // Auto-verified when added by authorized hospital admin
      status: 'available',
      driverToken: tokenStr,
      currentLat: lat,
      currentLng: lng,
      lastUpdated: new Date()
    });

    await newAmbulance.save();

    res.status(201).json({
      message: `Ambulance ${cleanVehicle} added successfully to your hospital fleet!`,
      ambulance: newAmbulance,
      driverLink: `/driver/${tokenStr}`
    });
  } catch (error) {
    console.error('Error adding hospital ambulance:', error);
    res.status(500).json({ error: 'Failed to add ambulance: ' + (error.message || 'Server Error') });
  }
});

/**
 * PATCH /api/ambulances/:id/status
 * Update ambulance status (available, busy, maintenance, offline)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ambulanceId = req.params.id;
    let ambulance = null;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(ambulanceId)) {
        ambulance = await Ambulance.findByIdAndUpdate(
          ambulanceId,
          { status, lastUpdated: new Date() },
          { new: true }
        );
      } else {
        ambulance = await Ambulance.findOneAndUpdate(
          { driverToken: ambulanceId },
          { status, lastUpdated: new Date() },
          { new: true }
        );
      }
    }

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }
    emitAmbulanceUpdate(ambulance);
    res.json({ message: 'Ambulance status updated successfully', ambulance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * PATCH /api/ambulances/:id/verify
 * Superadmin verifies and approves ambulance operator
 */
router.patch('/:id/verify', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, status: 'available', lastUpdated: new Date() },
      { new: true }
    );

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json({
      message: `Ambulance ${ambulance.vehicleNumber} verified successfully!`,
      ambulance,
      driverLink: `/driver/${ambulance.driverToken || ambulance._id}`
    });
  } catch (error) {
    console.error('Error verifying ambulance:', error);
    res.status(500).json({ error: 'Failed to verify ambulance' });
  }
});

/**
 * POST /api/ambulances/:id/update-location
 * Mobile driver endpoint pushing real-time GPS coordinates
 * Rate limited: Max 1 request per 10 seconds per ambulance/IP
 */
router.post('/:id/update-location', ambulanceLocationLimiter, async (req, res) => {
  try {
    const { lat, lng, status, token } = req.body;
    const ambulanceId = req.params.id;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude (lat) and Longitude (lng) are required' });
    }

    const updateFields = {
      currentLat: Number(lat),
      currentLng: Number(lng),
      lastUpdated: new Date()
    };

    if (status && ['available', 'en_route', 'busy', 'offline'].includes(status)) {
      updateFields.status = status;
    }

    let ambulance = null;
    if (mongoose.connection.readyState === 1) {
      // Find by ID or driverToken
      if (mongoose.Types.ObjectId.isValid(ambulanceId)) {
        ambulance = await Ambulance.findByIdAndUpdate(
          ambulanceId,
          { $set: updateFields },
          { new: true }
        );
      } else {
        ambulance = await Ambulance.findOneAndUpdate(
          { driverToken: ambulanceId },
          { $set: updateFields },
          { new: true }
        );
      }
    }

    if (!ambulance) {
      // Fallback response object
      ambulance = {
        _id: ambulanceId,
        id: ambulanceId,
        vehicleNumber: 'AMB-108',
        driverName: 'Driver',
        currentLat: Number(lat),
        currentLng: Number(lng),
        status: status || 'available'
      };
    }

    // Broadcast live WebSocket update
    emitAmbulanceUpdate(ambulance);

    res.json({
      message: 'Ambulance location updated successfully',
      ambulance
    });
  } catch (error) {
    console.error('Error updating ambulance location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * GET /api/ambulances/active
 * Public endpoint to fetch all active, verified ambulances
 */
router.get('/active', async (req, res) => {
  try {
    const activeAmbulances = await Ambulance.find({
      isVerified: { $ne: false },
      status: { $ne: 'offline' }
    }).sort({ createdAt: -1 }).lean();

    res.json({ ambulances: activeAmbulances });
  } catch (error) {
    console.error('Error fetching active ambulances:', error);
    res.json({ ambulances: [] });
  }
});

/**
 * GET /api/ambulances/:id
 * Public endpoint to fetch single ambulance details by ID or driverToken
 */
router.get('/:id', async (req, res) => {
  try {
    let ambulance = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        ambulance = await Ambulance.findById(req.params.id).lean();
      } else {
        ambulance = await Ambulance.findOne({ driverToken: req.params.id }).lean();
      }
    }

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    res.json({ ambulance });
  } catch (error) {
    console.error('Error fetching ambulance by ID:', error);
    res.status(500).json({ error: 'Failed to fetch ambulance' });
  }
});

export default router;

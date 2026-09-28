import { Router } from 'express';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emergencySosLimiter } from '../middleware/rateLimiter.js';
import { emitEmergencyAlert, emitSOSNew, emitSOSStatusUpdate } from '../services/socket.js';
import { haversineDistance } from '../utils/geo.js';

import mongoose from 'mongoose';

const router = Router();

// Create emergency request
router.post('/request', emergencySosLimiter, async (req, res) => {
  try {
    const {
      patientName,
      contactPhone,
      location,
      emergencyType,
      bedType,
      sosTriggerType,
      notes
    } = req.body;

    const selectedBedType = bedType || 'icu';

    if (!contactPhone || !location || !emergencyType) {
      res.status(400).json({ error: 'Contact phone, emergency type, and location are required' });
      return;
    }

    let priority = 'high';
    if (['cardiac', 'stroke', 'trauma'].includes(emergencyType)) {
      priority = 'critical';
    } else if (['accident', 'respiratory'].includes(emergencyType)) {
      priority = 'high';
    }

    const hospitals = await Hospital.find({
      emergencyServices: true,
      [`beds.${selectedBedType}.available`]: { $gt: 0 }
    }).lean();

    const hospitalsWithDistance = hospitals.map(hospital => ({
      ...hospital,
      distance: haversineDistance(
        location?.lat || location?.coordinates?.lat || 28.6139,
        location?.lng || location?.coordinates?.lng || 77.2090,
        hospital.coordinates?.lat || 28.6139,
        hospital.coordinates?.lng || 77.2090
      )
    })).sort((a, b) => a.distance - b.distance);

    const recommendedHospitals = hospitalsWithDistance.slice(0, 3).map(h => h._id);

    const emergency = new EmergencyRequest({
      patientName: patientName || 'Emergency Patient',
      contactPhone,
      location,
      emergencyType,
      bedType: selectedBedType,
      priority,
      notes,
      status: 'searching',
      recommendedHospitals,
      sosTriggerType: sosTriggerType || '1_click_sos'
    });

    await emergency.save();

    // Extract city for socket alert (explicit city > address extraction)
    const targetCity = location.city || (location.address ? (
      location.address.match(/,\s*([^,]+)(?:,\s*[A-Z]{2}|\s*$)/)?.[1] || location.address.split(',').pop()?.trim()
    ) : null);

    if (targetCity) {
      emitEmergencyAlert(targetCity, {
        id: emergency._id,
        emergencyType,
        bedType,
        priority,
        location: { lat: location.lat, lng: location.lng }
      });
    }

    const populatedEmergency = await EmergencyRequest.findById(emergency._id)
      .populate('recommendedHospitals', 'name address phone coordinates beds')
      .lean();

    // Authoritative real-time SOS broadcast to hospitals and control room
    emitSOSNew(populatedEmergency);

    res.status(201).json({
      emergency: populatedEmergency,
      recommendedHospitals: hospitalsWithDistance.slice(0, 3).map(h => ({
        id: h._id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        distance: h.distance.toFixed(1),
        availableBeds: h.beds[selectedBedType]?.available || 0,
        coordinates: h.coordinates
      }))
    });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({ error: 'Failed to create emergency request' });
  }
});

// Get emergency request status
router.get('/request/:id', async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id)
      .populate('assignedHospital', 'name address phone coordinates')
      .populate('recommendedHospitals', 'name address phone coordinates')
      .lean();

    if (!emergency) {
      res.status(404).json({ error: 'Emergency request not found' });
      return;
    }

    res.json({ emergency });
  } catch (error) {
    console.error('Error fetching emergency:', error);
    res.status(500).json({ error: 'Failed to fetch emergency request' });
  }
});

// Update emergency status (Admin only)
router.put('/request/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, assignedHospital, estimatedArrival, notes } = req.body;
    
    // Authorization check: Hospital admins can only update emergencies assigned or recommended to their hospital
    if (req.user?.role !== 'superadmin') {
      const existingEmergency = await EmergencyRequest.findById(req.params.id);
      if (!existingEmergency) {
        return res.status(404).json({ error: 'Emergency request not found' });
      }

      const userHospitalId = req.user?.hospitalId?.toString();
      const isAssigned = existingEmergency.assignedHospital?.toString() === userHospitalId;
      const isRecommended = existingEmergency.recommendedHospitals?.some(h => h.toString() === userHospitalId);

      if (!isAssigned && !isRecommended) {
        return res.status(403).json({ error: 'Access denied: You can only manage emergencies assigned or dispatched to your hospital.' });
      }
    }

    const updateData = {};
    if (status && ['pending', 'dispatched', 'admitted', 'resolved', 'cancelled'].includes(status)) {
      updateData.status = status;
    }
    // Only superadmin or authorized hospital can reassign hospital
    if (assignedHospital && req.user?.role === 'superadmin') {
      updateData.assignedHospital = assignedHospital;
    }
    if (estimatedArrival) updateData.estimatedArrival = estimatedArrival;
    if (notes) updateData.notes = String(notes).trim().slice(0, 1000);
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const emergency = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedHospital', 'name address phone')
     .populate('assignedAmbulance', 'vehicleNumber driverName driverPhone currentLat currentLng equipmentLevel status');

    if (!emergency) {
      res.status(404).json({ error: 'Emergency request not found' });
      return;
    }

    emitSOSStatusUpdate(emergency._id, {
      status: emergency.status,
      assignedHospital: emergency.assignedHospital,
      assignedAmbulance: emergency.assignedAmbulance,
      ambulanceDetails: emergency.ambulanceDetails,
      message: `Emergency status updated to ${emergency.status}`
    });

    res.json({ emergency });
  } catch (error) {
    console.error('Error updating emergency:', error);
    res.status(500).json({ error: 'Failed to update emergency request' });
  }
});

// Get active emergencies for hospital or control room
router.get('/active', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const filter = {
      status: { $in: ['pending', 'searching', 'assigned', 'dispatched', 'in_transit'] }
    };

    if (req.user?.role !== 'superadmin' && req.user?.hospitalId) {
      filter.$or = [
        { assignedHospital: req.user.hospitalId },
        { recommendedHospitals: req.user.hospitalId }
      ];
    }

    const emergencies = await EmergencyRequest.find(filter)
      .populate('assignedHospital', 'name phone address coordinates')
      .populate('recommendedHospitals', 'name phone address coordinates')
      .populate('assignedAmbulance', 'vehicleNumber driverName driverPhone currentLat currentLng equipmentLevel status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ emergencies });
  } catch (error) {
    console.error('Error fetching active emergencies:', error);
    res.status(500).json({ error: 'Failed to fetch active emergencies' });
  }
});

// Dispatch ambulance for emergency
router.post('/request/:id/dispatch', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { ambulanceId, etaMinutes, notes } = req.body;
    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    let ambulance = null;
    if (ambulanceId) {
      ambulance = await Ambulance.findById(ambulanceId);
    } else if (req.user?.hospitalId) {
      ambulance = await Ambulance.findOne({
        hospitalId: req.user.hospitalId,
        status: 'available'
      });
    }

    if (!ambulance) {
      ambulance = await Ambulance.findOne({ status: 'available' });
    }

    const assignedHospId = req.user?.hospitalId || emergency.recommendedHospitals?.[0] || null;
    const eta = Number(etaMinutes) || emergency.estimatedArrival || 10;

    emergency.status = 'dispatched';
    if (assignedHospId) emergency.assignedHospital = assignedHospId;
    emergency.dispatchedAt = new Date();
    emergency.estimatedArrival = eta;
    if (notes) emergency.notes = (emergency.notes ? emergency.notes + ' | ' : '') + String(notes).trim();

    if (ambulance) {
      emergency.assignedAmbulance = ambulance._id;
      emergency.ambulanceDetails = {
        vehicleNumber: ambulance.vehicleNumber,
        driverName: ambulance.driverName,
        driverPhone: ambulance.driverPhone,
        currentLat: ambulance.currentLat,
        currentLng: ambulance.currentLng,
        equipmentLevel: ambulance.equipmentLevel
      };

      ambulance.status = 'en_route';
      ambulance.lastUpdated = new Date();
      await ambulance.save();
    }

    await emergency.save();

    const populated = await EmergencyRequest.findById(emergency._id)
      .populate('assignedHospital', 'name phone address coordinates')
      .populate('assignedAmbulance', 'vehicleNumber driverName driverPhone currentLat currentLng equipmentLevel status')
      .lean();

    emitSOSStatusUpdate(emergency._id, {
      status: 'dispatched',
      assignedHospital: populated.assignedHospital,
      assignedAmbulance: populated.assignedAmbulance,
      ambulanceDetails: emergency.ambulanceDetails,
      etaMinutes: eta,
      message: `Ambulance ${emergency.ambulanceDetails?.vehicleNumber || 'Emergency Unit'} dispatched with ETA ~${eta} mins`
    });

    res.json({
      message: 'Ambulance dispatched successfully',
      emergency: populated
    });
  } catch (error) {
    console.error('Error dispatching ambulance:', error);
    res.status(500).json({ error: 'Failed to dispatch ambulance' });
  }
});

// Acknowledge and prep ER bed for emergency
router.post('/request/:id/accept-bed', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const hospitalId = req.user?.hospitalId || req.body.hospitalId;
    emergency.assignedHospital = hospitalId;
    emergency.status = 'assigned';
    await emergency.save();

    const populated = await EmergencyRequest.findById(emergency._id)
      .populate('assignedHospital', 'name phone address coordinates')
      .lean();

    emitSOSStatusUpdate(emergency._id, {
      status: 'assigned',
      assignedHospital: populated.assignedHospital,
      message: `${populated.assignedHospital?.name || 'Hospital'} accepted emergency request and prepped ER Bed.`
    });

    res.json({
      message: 'Hospital accepted emergency patient',
      emergency: populated
    });
  } catch (error) {
    console.error('Error accepting emergency:', error);
    res.status(500).json({ error: 'Failed to accept emergency' });
  }
});

// Get all emergencies for admin
router.get('/admin/all', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status, priority, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    
    if (req.user?.role !== 'superadmin' && req.user?.hospitalId) {
      filter.$or = [
        { assignedHospital: req.user.hospitalId },
        { recommendedHospitals: req.user.hospitalId }
      ];
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const emergencies = await EmergencyRequest.find(filter)
      .populate('assignedHospital', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await EmergencyRequest.countDocuments(filter);

    res.json({
      emergencies,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({ error: 'Failed to fetch emergency requests' });
  }
});

// Get emergency statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await EmergencyRequest.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          today: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$emergencyType', count: { $sum: 1 } } }
          ],
          avgResponseTime: [
            { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
            {
              $project: {
                responseTime: {
                  $divide: [
                    { $subtract: ['$resolvedAt', '$createdAt'] },
                    60000
                  ]
                }
              }
            },
            { $group: { _id: null, avg: { $avg: '$responseTime' } } }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      total: result.total[0]?.count || 0,
      today: result.today[0]?.count || 0,
      byStatus: result.byStatus,
      byType: result.byType,
      avgResponseTimeMinutes: Math.round(result.avgResponseTime[0]?.avg || 0)
    });
  } catch (error) {
    console.error('Error fetching emergency stats:', error);
    res.status(500).json({ error: 'Failed to fetch emergency statistics' });
  }
});

export default router;

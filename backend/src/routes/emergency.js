import { Router } from 'express';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Hospital from '../models/Hospital.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emergencySosLimiter } from '../middleware/rateLimiter.js';
import { emitEmergencyAlert } from '../services/socket.js';
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
      recommendedHospitals
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

    res.status(201).json({
      emergency: populatedEmergency,
      recommendedHospitals: hospitalsWithDistance.slice(0, 3).map(h => ({
        id: h._id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        distance: h.distance.toFixed(1),
        availableBeds: h.beds[bedType]?.available || 0,
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
    
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedHospital) updateData.assignedHospital = assignedHospital;
    if (estimatedArrival) updateData.estimatedArrival = estimatedArrival;
    if (notes) updateData.notes = notes;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    const emergency = await EmergencyRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedHospital', 'name address phone');

    if (!emergency) {
      res.status(404).json({ error: 'Emergency request not found' });
      return;
    }

    res.json({ emergency });
  } catch (error) {
    console.error('Error updating emergency:', error);
    res.status(500).json({ error: 'Failed to update emergency request' });
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

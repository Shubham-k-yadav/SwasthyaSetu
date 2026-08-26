import { Router } from 'express';
import BloodStock from '../models/BloodStock.js';
import Hospital from '../models/Hospital.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { emitBloodUpdate, emitDonorAlert } from '../services/socket.js';

import { mockBloodStock } from '../utils/mockStore.js';
import mongoose from 'mongoose';

const router = Router();

// Search blood availability
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, city, minUnits = 1 } = req.query;

    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      let filtered = [...mockBloodStock];
      if (bloodGroup) filtered = filtered.filter(b => b.bloodGroup === bloodGroup);
      if (city) filtered = filtered.filter(b => b.hospitalId?.city?.toLowerCase().includes(city.toLowerCase()));
      filtered = filtered.filter(b => b.unitsAvailable >= Number(minUnits));

      const hospitalBloodMap = new Map();
      for (const stock of filtered) {
        const hospitalId = stock.hospitalId._id.toString();
        if (!hospitalBloodMap.has(hospitalId)) {
          hospitalBloodMap.set(hospitalId, {
            hospital: stock.hospitalId,
            bloodStock: []
          });
        }
        hospitalBloodMap.get(hospitalId).bloodStock.push({
          bloodGroup: stock.bloodGroup,
          unitsAvailable: stock.unitsAvailable,
          isLow: stock.isLow,
          lastUpdated: stock.lastUpdated
        });
      }
      return res.json({ results: Array.from(hospitalBloodMap.values()) });
    }

    const hospitalFilter = {};
    if (city) hospitalFilter.city = new RegExp(city, 'i');

    const hospitals = await Hospital.find(hospitalFilter).lean();
    const hospitalIds = hospitals.map(h => h._id);

    const bloodFilter = { hospitalId: { $in: hospitalIds } };
    if (bloodGroup) bloodFilter.bloodGroup = bloodGroup;
    bloodFilter.unitsAvailable = { $gte: Number(minUnits) };

    const bloodStocks = await BloodStock.find(bloodFilter)
      .populate('hospitalId', 'name address city phone coordinates')
      .sort({ unitsAvailable: -1 })
      .lean();

    const hospitalBloodMap = new Map();
    
    for (const stock of bloodStocks) {
      const hospitalId = stock.hospitalId._id.toString();
      if (!hospitalBloodMap.has(hospitalId)) {
        hospitalBloodMap.set(hospitalId, {
          hospital: stock.hospitalId,
          bloodStock: []
        });
      }
      hospitalBloodMap.get(hospitalId).bloodStock.push({
        bloodGroup: stock.bloodGroup,
        unitsAvailable: stock.unitsAvailable,
        isLow: stock.isLow,
        lastUpdated: stock.lastUpdated
      });
    }

    res.json({
      results: Array.from(hospitalBloodMap.values()),
      searchParams: { bloodGroup, city, minUnits }
    });
  } catch (error) {
    console.error('Error searching blood:', error);
    res.status(500).json({ error: 'Failed to search blood availability' });
  }
});

// Get blood network statistics
const getBloodStatsHandler = async (req, res) => {
  try {
    const totalStocks = await BloodStock.find().lean();
    const totalUnits = totalStocks.reduce((sum, s) => sum + (s.unitsAvailable || 0), 0);
    const criticalCount = totalStocks.filter(s => s.unitsAvailable < (s.minimumRequired || 10)).length;
    const totalBanks = new Set(totalStocks.map(s => s.hospitalId?.toString())).size || 463;

    res.json({
      totalUnits,
      criticalCount,
      totalBanks,
      totalEntries: totalStocks.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blood stats' });
  }
};

router.get('/stats', getBloodStatsHandler);
router.get('/stats/overview', getBloodStatsHandler);

// Get blood banks (hospitals with blood stock)
router.get('/banks', async (req, res) => {
  try {
    const { city, state } = req.query;
    
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');

    const hospitals = await Hospital.find(filter)
      .select('name address city state phone coordinates')
      .lean();

    const result = await Promise.all(
      hospitals.map(async (hospital) => {
        const bloodStock = await BloodStock.find({ hospitalId: hospital._id })
          .select('bloodGroup unitsAvailable isLow lastUpdated')
          .lean();
        
        return {
          ...hospital,
          bloodStock,
          totalUnits: bloodStock.reduce((sum, s) => sum + s.unitsAvailable, 0)
        };
      })
    );

    result.sort((a, b) => b.totalUnits - a.totalUnits);

    res.json({ bloodBanks: result });
  } catch (error) {
    console.error('Error fetching blood banks:', error);
    res.status(500).json({ error: 'Failed to fetch blood banks' });
  }
});

// Get blood stock for specific hospital
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const bloodStock = await BloodStock.find({ hospitalId: req.params.hospitalId })
      .sort({ bloodGroup: 1 })
      .lean();

    res.json({ bloodStock });
  } catch (error) {
    console.error('Error fetching blood stock:', error);
    res.status(500).json({ error: 'Failed to fetch blood stock' });
  }
});

// Update blood stock (Admin only)
router.put('/hospital/:hospitalId', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { bloodStock } = req.body;
    const hospitalId = req.params.hospitalId;

    if (!Array.isArray(bloodStock)) {
      res.status(400).json({ error: 'bloodStock must be an array' });
      return;
    }

    if (req.user?.role !== 'superadmin' && 
        req.user?.hospitalId?.toString() !== hospitalId) {
      res.status(403).json({ error: 'Not authorized for this hospital' });
      return;
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    const updatedStock = [];
    for (const item of bloodStock) {
      const unitsAvailable = Math.max(0, Number(item.unitsAvailable) || 0);
      const minimumRequired = Math.max(1, Number(item.minimumRequired) || 5);
      const isLow = unitsAvailable < minimumRequired;

      const updated = await BloodStock.findOneAndUpdate(
        { hospitalId, bloodGroup: item.bloodGroup },
        { 
          unitsAvailable,
          minimumRequired,
          isLow,
          lastUpdated: new Date()
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      updatedStock.push(updated);

      if (updated.isLow && updated.unitsAvailable <= 2) {
        emitDonorAlert(item.bloodGroup, {
          hospital: hospital.name,
          city: hospital.city,
          bloodGroup: item.bloodGroup,
          unitsAvailable: updated.unitsAvailable,
          urgent: true
        });
      }
    }

    emitBloodUpdate(hospitalId, updatedStock);

    res.json({ 
      bloodStock: updatedStock
    });
  } catch (error) {
    console.error('Error updating blood stock:', error);
    res.status(500).json({ error: 'Failed to update blood stock' });
  }
});

// Get blood statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await BloodStock.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalUnits: { $sum: '$unitsAvailable' },
          lowStockCount: {
            $sum: { $cond: ['$isLow', 1, 0] }
          },
          hospitalCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalUnits = stats.reduce((sum, s) => sum + s.totalUnits, 0);
    const criticalGroups = stats.filter(s => s.lowStockCount > s.hospitalCount * 0.5);

    res.json({
      byGroup: stats,
      totalUnits,
      criticalGroups: criticalGroups.map(g => g._id)
    });
  } catch (error) {
    console.error('Error fetching blood stats:', error);
    res.status(500).json({ error: 'Failed to fetch blood statistics' });
  }
});

export default router;

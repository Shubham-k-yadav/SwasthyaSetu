import { Router } from 'express';
import Donor from '../models/Donor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();

// Register as a donor
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      bloodGroup,
      city,
      state,
      address,
      coordinates,
      age,
      weight
    } = req.body;

    if (!name || !phone || !email || !bloodGroup || !city || !state || !age || !weight) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (age < 18 || age > 65) {
      res.status(400).json({ error: 'Donors must be between 18 and 65 years old' });
      return;
    }

    if (weight < 50) {
      res.status(400).json({ error: 'Donors must weigh at least 50 kg' });
      return;
    }

    const existingDonor = await Donor.findOne({
      $or: [{ phone }, { email }]
    });

    if (existingDonor) {
      res.status(409).json({ error: 'Donor with this phone or email already exists' });
      return;
    }

    const donor = new Donor({
      name,
      phone,
      email,
      bloodGroup,
      city,
      state,
      address,
      coordinates,
      age,
      weight,
      isAvailable: true,
      healthStatus: 'eligible'
    });

    await donor.save();

    res.status(201).json({
      message: 'Successfully registered as a donor',
      donor: {
        id: donor._id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        city: donor.city
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'Donor with this phone or email already exists' });
      return;
    }
    console.error('Error registering donor:', error);
    res.status(500).json({ error: 'Failed to register donor' });
  }
});

// Search donors
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, city, limit = 20 } = req.query;

    const filter = {
      isAvailable: true,
      healthStatus: 'eligible'
    };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) {
      const sanitizedCity = String(city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.city = new RegExp(sanitizedCity, 'i');
    }

    const eligibleDate = new Date();
    eligibleDate.setDate(eligibleDate.getDate() - 56);

    filter.$or = [
      { lastDonation: { $exists: false } },
      { lastDonation: { $lte: eligibleDate } }
    ];

    const donors = await Donor.find(filter)
      .select('name bloodGroup city state lastDonation totalDonations')
      .limit(Number(limit))
      .sort({ totalDonations: -1 })
      .lean();

    res.json({ donors, total: donors.length });
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors' });
  }
});

// Update donor availability
router.put('/:id/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );

    if (!donor) {
      res.status(404).json({ error: 'Donor not found' });
      return;
    }

    res.json({ donor });
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ error: 'Failed to update donor' });
  }
});

// Record donation
router.post('/:id/donate', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      res.status(404).json({ error: 'Donor not found' });
      return;
    }

    if (donor.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (Date.now() - new Date(donor.lastDonation).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastDonation < 56) {
        res.status(400).json({ 
          error: `Donor must wait ${56 - daysSinceLastDonation} more days before donating` 
        });
        return;
      }
    }

    donor.lastDonation = new Date();
    donor.totalDonations += 1;
    await donor.save();

    res.json({
      message: 'Donation recorded successfully',
      donor: {
        name: donor.name,
        totalDonations: donor.totalDonations,
        nextEligibleDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({ error: 'Failed to record donation' });
  }
});

// Get donor statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const availableDonors = await Donor.countDocuments({ 
      isAvailable: true, 
      healthStatus: 'eligible' 
    });

    const byBloodGroup = await Donor.aggregate([
      { $match: { isAvailable: true, healthStatus: 'eligible' } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const byCity = await Donor.aggregate([
      { $match: { isAvailable: true, healthStatus: 'eligible' } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalDonors,
      availableDonors,
      byBloodGroup,
      byCity
    });
  } catch (error) {
    console.error('Error fetching donor stats:', error);
    res.status(500).json({ error: 'Failed to fetch donor statistics' });
  }
});

// Delete donor (Admin/Superadmin only)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) {
      res.status(404).json({ error: 'Donor not found' });
      return;
    }

    res.json({ message: 'Donor removed successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ error: 'Failed to delete donor' });
  }
});

export default router;

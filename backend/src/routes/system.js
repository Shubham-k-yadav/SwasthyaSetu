import express from 'express';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodBank from '../models/BloodBank.js';
import Ambulance from '../models/Ambulance.js';

const router = express.Router();

/**
 * GET /api/system/status
 * Returns live counts of verified hospitals, blood banks, and ambulances
 */
router.get('/status', async (req, res) => {
  try {
    let verifiedHospitalsCount = 0;
    let verifiedBloodBanksCount = 0;
    let verifiedAmbulancesCount = 0;

    if (mongoose.connection.readyState === 1) {
      verifiedHospitalsCount = await Hospital.countDocuments({ isVerified: true });
      verifiedBloodBanksCount = await BloodBank.countDocuments({ isVerified: true });
      verifiedAmbulancesCount = await Ambulance.countDocuments({ isVerified: true });
    }

    res.json({
      verifiedHospitalsCount,
      verifiedBloodBanksCount,
      verifiedAmbulancesCount
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.json({
      verifiedHospitalsCount: 0,
      verifiedBloodBanksCount: 0,
      verifiedAmbulancesCount: 0
    });
  }
});

export default router;

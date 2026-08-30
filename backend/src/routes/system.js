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
    let pendingHospitalsCount = 0;
    let pendingBloodBanksCount = 0;
    let pendingAmbulancesCount = 0;

    if (mongoose.connection.readyState === 1) {
      verifiedHospitalsCount = await Hospital.countDocuments({ isVerified: { $ne: false } });
      verifiedBloodBanksCount = await BloodBank.countDocuments({ isVerified: { $ne: false } });
      verifiedAmbulancesCount = await Ambulance.countDocuments({ isVerified: { $ne: false } });

      pendingHospitalsCount = await Hospital.countDocuments({ isVerified: false });
      pendingBloodBanksCount = await BloodBank.countDocuments({ isVerified: false });
      pendingAmbulancesCount = await Ambulance.countDocuments({ isVerified: false });
    }

    res.json({
      verifiedHospitalsCount,
      verifiedBloodBanksCount,
      verifiedAmbulancesCount,
      pendingHospitalsCount,
      pendingBloodBanksCount,
      pendingAmbulancesCount,
      totalPendingCount: pendingHospitalsCount + pendingBloodBanksCount + pendingAmbulancesCount
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.json({
      verifiedHospitalsCount: 0,
      verifiedBloodBanksCount: 0,
      verifiedAmbulancesCount: 0,
      totalPendingCount: 0
    });
  }
});

export default router;

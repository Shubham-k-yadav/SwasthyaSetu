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
      databaseConnected: mongoose.connection.readyState === 1,
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
      databaseConnected: false,
      verifiedHospitalsCount: 0,
      verifiedBloodBanksCount: 0,
      verifiedAmbulancesCount: 0,
      totalPendingCount: 0
    });
  }
});

/**
 * POST /api/system/contact
 * Handle contact form submissions
 */
router.post('/contact', async (req, res) => {

  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    console.log(`[Contact Form Received] From: ${name} (${email}, Phone: ${phone || 'N/A'}) - Subject: ${subject || 'General Inquiry'}`);
    console.log(`Message: ${message}`);

    res.json({
      success: true,
      message: 'Thank you for reaching out! Our 24/7 coordination & support team has received your message and will respond shortly.'
    });
  } catch (error) {
    console.error('Error handling contact form:', error);
    res.status(500).json({ error: 'Failed to submit contact request' });
  }
});

export default router;


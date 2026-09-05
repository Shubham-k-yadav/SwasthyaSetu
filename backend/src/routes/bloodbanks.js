import express from 'express';
import mongoose from 'mongoose';
import BloodBank from '../models/BloodBank.js';
import BloodStock from '../models/BloodStock.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { getIO, emitRegistrationRequest } from '../services/socket.js';

const router = express.Router();

// Helper to broadcast live blood stock updates via WebSockets
const emitBloodUpdate = (bloodBankId, stockData) => {
  try {
    const io = getIO();
    io.emit('blood-stock-update', {
      bloodBankId,
      stockData,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Socket broadcast warning (blood-stock-update):', err.message);
  }
};

/**
 * POST /api/bloodbanks/register-request
 * Public endpoint to submit a Blood Bank registration application
 */
router.post('/register-request', async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      address,
      city,
      state = 'India',
      phone,
      email,
      password,
      initialStock = {}
    } = req.body;

    if (!name || !city || !email || !password) {
      return res.status(400).json({ error: 'Blood Bank Name, City, Admin Email, and Password are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'An admin account with this email already exists' });
      }
    }

    const regNo = licenseNumber || `BB-LIC-${Date.now().toString().slice(-6)}`;

    // Parse Google Maps location link or coordinates
    const rawMapUrl = (req.body.googleMapsUrl || req.body.mapLink || '').trim();
    let lat = req.body.lat ? Number(req.body.lat) : 25.4316;
    let lng = req.body.lng ? Number(req.body.lng) : 81.8520;
    if (rawMapUrl) {
      const match = rawMapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                    rawMapUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                    rawMapUrl.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        lat = Number(match[1]);
        lng = Number(match[2]);
      }
    }
    const finalMapUrl = rawMapUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    // Create BloodStock document for this blood bank
    const newStock = new BloodStock({
      city,
      state,
      bloodGroups: {
        'A+': Number(initialStock['A+'] || 10),
        'A-': Number(initialStock['A-'] || 5),
        'B+': Number(initialStock['B+'] || 15),
        'B-': Number(initialStock['B-'] || 4),
        'AB+': Number(initialStock['AB+'] || 8),
        'AB-': Number(initialStock['AB-'] || 2),
        'O+': Number(initialStock['O+'] || 20),
        'O-': Number(initialStock['O-'] || 3)
      },
      lastUpdated: new Date()
    });

    await newStock.save();

    // Create unverified Blood Bank
    const newBloodBank = new BloodBank({
      name,
      licenseNumber: regNo,
      address: address || `${city}, ${state}`,
      city,
      state,
      phone: phone || '+91-9876543210',
      adminEmail: email,
      googleMapsUrl: finalMapUrl,
      isVerified: false,
      isBlockchainVerified: false,
      isSimulated: false,
      linkedBloodStockId: newStock._id,
      coordinates: { lat, lng },
      lastUpdated: new Date()
    });

    await newBloodBank.save();

    // Link BloodBank ID to BloodStock
    newStock.bloodBankId = newBloodBank._id;
    await newStock.save();

    // Create admin User for Blood Bank
    const newAdmin = new User({
      email,
      password,
      name: `${name} Admin`,
      role: 'blood_bank_admin',
      bloodBankId: newBloodBank._id,
      isActive: true
    });

    await newAdmin.save();

    emitRegistrationRequest('bloodbank', newBloodBank);

    res.status(201).json({
      message: 'Blood Bank registration application submitted successfully! Super Admin review pending.',
      bloodBank: newBloodBank,
      adminEmail: email
    });
  } catch (error) {
    console.error('Error in blood bank registration:', error);
    res.status(500).json({ error: 'Failed to submit blood bank application: ' + error.message });
  }
});

/**
 * GET /api/bloodbanks/pending/queue
 * Superadmin queue for unverified blood banks
 */
router.get('/pending/queue', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const pending = await BloodBank.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = pending.map(b => ({
      ...b,
      googleMapsUrl: b.googleMapsUrl || (b.coordinates?.lat && b.coordinates?.lng
        ? `https://www.google.com/maps/search/?api=1&query=${b.coordinates.lat},${b.coordinates.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.name || '') + ' ' + (b.address || ''))}`)
    }));

    res.json({ queue: enriched });
  } catch (error) {
    console.error('Error fetching pending blood bank queue:', error);
    res.status(500).json({ error: 'Failed to fetch pending blood banks' });
  }
});

/**
 * PATCH /api/bloodbanks/:id/verify
 * Superadmin verifies and approves blood bank
 */
router.patch('/:id/verify', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const bloodBank = await BloodBank.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, isBlockchainVerified: true, lastUpdated: new Date() },
      { new: true }
    );

    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }

    // Activate linked user if needed
    await User.updateMany({ bloodBankId: bloodBank._id }, { $set: { isActive: true } });

    res.json({ message: `${bloodBank.name} verified and approved successfully!`, bloodBank });
  } catch (error) {
    console.error('Error verifying blood bank:', error);
    res.status(500).json({ error: 'Failed to verify blood bank' });
  }
});

/**
 * PUT /api/bloodbanks/:id/stock
 * Scoped update for blood_bank_admin to update blood quantities
 */
router.put('/:id/stock', authenticate, authorize('blood_bank_admin', 'superadmin'), async (req, res) => {
  try {
    const { bloodGroups } = req.body;
    const bloodBankId = req.params.id;

    // Check user scoping if role is blood_bank_admin
    if (req.user.role === 'blood_bank_admin' && String(req.user.bloodBankId) !== String(bloodBankId)) {
      return res.status(403).json({ error: 'Unauthorized to update this blood bank stock' });
    }

    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      return res.status(404).json({ error: 'Blood bank not found' });
    }

    let stockDoc = await BloodStock.findOne({ bloodBankId });
    if (!stockDoc && bloodBank.linkedBloodStockId) {
      stockDoc = await BloodStock.findById(bloodBank.linkedBloodStockId);
    }

    if (!stockDoc) {
      stockDoc = new BloodStock({
        bloodBankId,
        city: bloodBank.city,
        state: bloodBank.state,
        bloodGroups: {}
      });
    }

    if (bloodGroups && typeof bloodGroups === 'object') {
      for (const [group, qty] of Object.entries(bloodGroups)) {
        if (typeof qty === 'number' && qty >= 0) {
          stockDoc.bloodGroups.set(group, qty);
        }
      }
    }

    stockDoc.lastUpdated = new Date();
    await stockDoc.save();

    bloodBank.lastUpdated = new Date();
    await bloodBank.save();

    // Broadcast live WebSocket update
    emitBloodUpdate(bloodBank._id, stockDoc.bloodGroups);

    res.json({
      message: 'Blood stock updated successfully',
      stock: stockDoc,
      bloodBank
    });
  } catch (error) {
    console.error('Error updating blood stock:', error);
    res.status(500).json({ error: 'Failed to update blood stock' });
  }
});

/**
 * GET /api/bloodbanks/all
 * Returns all verified blood banks
 */
router.get('/all', async (req, res) => {
  try {
    const banks = await BloodBank.find({ isVerified: true })
      .populate('linkedBloodStockId')
      .lean();
    res.json({ bloodBanks: banks });
  } catch (error) {
    console.error('Error fetching blood banks:', error);
    res.status(500).json({ error: 'Failed to fetch blood banks' });
  }
});

export default router;

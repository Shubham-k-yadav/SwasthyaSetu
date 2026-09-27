import { Router } from 'express';
import crypto from 'crypto';
import Donor from '../models/Donor.js';
import BloodBank from '../models/BloodBank.js';
import BloodStock from '../models/BloodStock.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { getIO } from '../services/socket.js';
import mongoose from 'mongoose';

const router = Router();

// Haversine distance calculation in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * POST /api/donors/register
 * Register as a donor & generate digital QR donor pass
 */
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
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (age < 18 || age > 65) {
      return res.status(400).json({ error: 'Donors must be between 18 and 65 years old' });
    }

    if (weight < 50) {
      return res.status(400).json({ error: 'Donors must weigh at least 50 kg' });
    }

    // Check existing
    let donor = await Donor.findOne({
      $or: [{ phone }, { email }]
    });

    if (donor) {
      // If already registered, update and return their digital pass
      donor.name = name;
      donor.bloodGroup = bloodGroup;
      donor.city = city;
      donor.state = state || donor.state;
      donor.address = address || donor.address;
      donor.age = age;
      donor.weight = weight;
      if (coordinates?.lat && coordinates?.lng) {
        donor.coordinates = coordinates;
      }
      if (!donor.donorCardId) {
        donor.donorCardId = `DONOR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      }
      await donor.save();

      return res.status(200).json({
        message: 'Welcome back! Your digital donor pass is ready.',
        donor: {
          id: donor._id,
          donorCardId: donor.donorCardId,
          name: donor.name,
          phone: donor.phone,
          email: donor.email,
          bloodGroup: donor.bloodGroup,
          city: donor.city,
          state: donor.state,
          coordinates: donor.coordinates,
          totalDonations: donor.totalDonations,
          lastDonation: donor.lastDonation,
          nextEligibleDate: donor.nextEligibleDate,
          healthStatus: donor.healthStatus,
          canDonate: donor.canDonate()
        }
      });
    }

    // New donor registration
    const donorCardId = `DONOR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    donor = new Donor({
      donorCardId,
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
      message: 'Successfully registered as a voluntary blood donor',
      donor: {
        id: donor._id,
        donorCardId: donor.donorCardId,
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        state: donor.state,
        coordinates: donor.coordinates,
        totalDonations: donor.totalDonations || 0,
        lastDonation: null,
        nextEligibleDate: null,
        healthStatus: donor.healthStatus,
        canDonate: true
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Donor with this phone or email already exists' });
    }
    console.error('Error registering donor:', error);
    res.status(500).json({ error: 'Failed to register donor' });
  }
});

/**
 * GET /api/donors/card/:identifier
 * Lookup donor by donorCardId (e.g. DONOR-XXXXXX), phone, or _id
 * Used when Blood Bank Admin scans QR code or types ID
 */
router.get('/card/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    let query = {
      $or: [
        { donorCardId: identifier.toUpperCase().trim() },
        { phone: identifier.trim() }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query.$or.push({ _id: identifier });
    }

    const donor = await Donor.findOne(query).lean();

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found with this QR Pass / ID' });
    }

    const canDonate = !donor.nextEligibleDate || new Date(donor.nextEligibleDate) <= new Date();

    res.json({
      donor: {
        id: donor._id,
        donorCardId: donor.donorCardId,
        name: donor.name,
        phone: donor.phone,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        state: donor.state,
        address: donor.address,
        age: donor.age,
        weight: donor.weight,
        totalDonations: donor.totalDonations || 0,
        lastDonation: donor.lastDonation,
        nextEligibleDate: donor.nextEligibleDate,
        healthStatus: donor.healthStatus,
        canDonate,
        donationHistory: (donor.donationHistory || []).slice(-5).reverse()
      }
    });
  } catch (error) {
    console.error('Error fetching donor card:', error);
    res.status(500).json({ error: 'Failed to fetch donor card' });
  }
});

/**
 * GET /api/donors/nearby-banks
 * Returns blood banks within 10 km (or nearest available facilities) based on donor GPS
 */
router.get('/nearby-banks', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm) || 10;
    const bloodGroup = req.query.bloodGroup;

    // Fetch all verified blood banks
    const banks = await BloodBank.find({ isVerified: true })
      .populate('linkedBloodStockId')
      .lean();

    const results = [];

    for (const b of banks) {
      const bLat = b.coordinates?.lat;
      const bLng = b.coordinates?.lng;

      let distance = null;
      if (!isNaN(lat) && !isNaN(lng) && bLat && bLng) {
        distance = calculateDistanceKm(lat, lng, bLat, bLng);
      }

      // Live stock units
      const stockObj = b.linkedBloodStockId?.bloodGroups || {};
      const targetUnits = bloodGroup ? Number(stockObj[bloodGroup] ?? 0) : null;
      const totalUnits = Object.values(stockObj).reduce((s, q) => s + (Number(q) || 0), 0);

      const mapUrl = b.googleMapsUrl || (bLat && bLng
        ? `https://www.google.com/maps/search/?api=1&query=${bLat},${bLng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.city)}`);

      results.push({
        id: b._id,
        name: b.name,
        city: b.city,
        state: b.state,
        address: b.address,
        phone: b.phone,
        adminEmail: b.adminEmail,
        distanceKm: distance,
        isWithin10Km: distance !== null ? distance <= radiusKm : true,
        availableUnitsForGroup: targetUnits,
        totalStockUnits: totalUnits,
        googleMapsUrl: mapUrl
      });
    }

    // Sort: banks with known distance sorted ascending, then others
    results.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });

    // Filter within 10 km if user coordinates were provided and we found matches
    const within10Km = results.filter(r => r.distanceKm !== null && r.distanceKm <= radiusKm);
    const finalBanks = within10Km.length > 0 ? within10Km : results.slice(0, 6);

    res.json({
      bloodBanks: finalBanks,
      totalFound: finalBanks.length,
      within10KmCount: within10Km.length,
      userCoordinates: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null
    });
  } catch (error) {
    console.error('Error finding nearby blood banks:', error);
    res.status(500).json({ error: 'Failed to find nearby blood banks' });
  }
});

/**
 * GET /api/donors/verified-walkins
 * Returns list of donors who visited a blood bank, had their QR scanned, and completed a donation
 * Supports filtering by bloodBankId so each blood bank can view only their walk-in donors
 */
router.get('/verified-walkins', async (req, res) => {
  try {
    const { bloodGroup, city, bloodBankId, status = 'all', limit = 150 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter['donationHistory.status'] = status;
    } else {
      filter['donationHistory.status'] = { $in: ['approved', 'deferred'] };
    }

    if (bloodBankId && bloodBankId !== 'all') {
      filter['donationHistory.bloodBankId'] = bloodBankId;
    }
    if (bloodGroup && bloodGroup !== 'all') {
      filter['donationHistory.bloodGroup'] = bloodGroup;
    }
    if (city && city !== 'all') {
      const sanitizedCity = String(city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.city = new RegExp(sanitizedCity, 'i');
    }

    const donors = await Donor.find(filter)
      .select('name bloodGroup city state address phone email lastDonation nextEligibleDate totalDonations donationHistory donorCardId age weight')
      .sort({ lastDonation: -1 })
      .limit(Number(limit))
      .lean();

    const verifiedRecords = [];
    donors.forEach(donor => {
      const records = (donor.donationHistory || []).filter(d => 
        status === 'all' || !status ? (d.status === 'approved' || d.status === 'deferred') : d.status === status
      );
      records.forEach(donation => {
        // If bloodBankId filter applied, ensure match
        if (bloodBankId && bloodBankId !== 'all' && String(donation.bloodBankId) !== String(bloodBankId)) {
          return;
        }
        // If bloodGroup filter applied, ensure match
        if (bloodGroup && bloodGroup !== 'all' && donation.bloodGroup !== bloodGroup) {
          return;
        }

        verifiedRecords.push({
          id: donation._id || `${donor._id}-${donation.donationDate}`,
          donorId: donor._id,
          donorCardId: donor.donorCardId,
          name: donor.name,
          phone: donor.phone,
          email: donor.email,
          bloodGroup: donation.bloodGroup || donor.bloodGroup,
          city: donor.city,
          state: donor.state,
          address: donor.address,
          age: donor.age,
          weight: donor.weight,
          unitsDonated: donation.unitsDonated || 0,
          bagId: donation.bagId,
          certificateId: donation.certificateId,
          bloodBankId: donation.bloodBankId,
          bloodBankName: donation.bloodBankName || 'Authorized Blood Bank',
          donationDate: donation.donationDate,
          nextEligibleDate: donation.nextEligibleDate || donor.nextEligibleDate,
          hemoglobin: donation.hemoglobin,
          bloodPressure: donation.bloodPressure,
          status: donation.status || 'approved',
          deferralReason: donation.deferralReason,
          deferralPeriodDays: donation.deferralPeriodDays,
          recordedBy: donation.recordedBy,
          totalDonations: donor.totalDonations,
          isQrVerified: true
        });
      });
    });

    verifiedRecords.sort((a, b) => new Date(b.donationDate) - new Date(a.donationDate));

    res.json({
      verifiedDonors: verifiedRecords,
      totalCount: verifiedRecords.length,
      uniqueDonorsCount: donors.length
    });
  } catch (error) {
    console.error('Error fetching verified walk-in donors:', error);
    res.status(500).json({ error: 'Failed to fetch verified walk-in donors' });
  }
});

/**
 * POST /api/donors/record-donation
 * Blood Bank Admin records donation after medical screening
 * 1. Validates donor & screening
 * 2. Increments Blood Bank live stock in database
 * 3. Sets 90-day cooling period on donor
 * 4. Triggers appreciation certificate & email to donor
 */
router.post('/record-donation', authenticate, authorize('blood_bank_admin', 'superadmin', 'admin'), async (req, res) => {
  try {
    const {
      donorIdentifier,
      bloodBankId,
      unitsDonated = 1,
      bloodGroup,
      bagId,
      hemoglobin,
      bloodPressure,
      status = 'approved',
      deferralReason,
      notes
    } = req.body;

    if (!donorIdentifier) {
      return res.status(400).json({ error: 'Donor identifier (ID or Phone) is required' });
    }

    // Find donor
    let query = {
      $or: [
        { donorCardId: String(donorIdentifier).toUpperCase().trim() },
        { phone: String(donorIdentifier).trim() }
      ]
    };
    if (mongoose.Types.ObjectId.isValid(donorIdentifier)) {
      query.$or.push({ _id: donorIdentifier });
    }

    const donor = await Donor.findOne(query);
    if (!donor) {
      return res.status(404).json({ error: 'Donor record not found' });
    }

    // Identify Blood Bank
    const targetBloodBankId = bloodBankId || req.user?.bloodBankId || req.user?.bloodBank?._id;
    let bloodBank = null;
    if (targetBloodBankId && mongoose.Types.ObjectId.isValid(targetBloodBankId)) {
      bloodBank = await BloodBank.findById(targetBloodBankId).populate('linkedBloodStockId');
    }
    const bloodBankName = bloodBank?.name || req.user?.name || 'Authorized Blood Bank';
    const bloodBankCity = bloodBank?.city || donor.city || 'India';

    // Effective blood group
    const effectiveBloodGroup = bloodGroup || donor.bloodGroup;

    // Handle Temporary Deferral
    if (status === 'deferred') {
      const days = Number(req.body.deferralPeriodDays) || 14;
      const nextEligibleDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const deferralRecord = {
        bloodBankId: bloodBank?._id,
        bloodBankName,
        donationDate: new Date(),
        unitsDonated: 0,
        bloodGroup: effectiveBloodGroup,
        hemoglobin: Number(hemoglobin) || undefined,
        bloodPressure: bloodPressure || undefined,
        status: 'deferred',
        deferralReason: deferralReason || 'Temporary medical deferral',
        deferralPeriodDays: days,
        nextEligibleDate,
        recordedBy: req.user?.email || 'Blood Bank Staff'
      };

      donor.donationHistory.push(deferralRecord);
      donor.healthStatus = 'temporary_deferral';
      donor.isAvailable = false;
      donor.nextEligibleDate = nextEligibleDate;
      await donor.save();

      return res.json({
        message: 'Donor temporarily deferred. Record updated successfully.',
        donor: {
          id: donor._id,
          name: donor.name,
          healthStatus: donor.healthStatus,
          isAvailable: donor.isAvailable,
          nextEligibleDate: donor.nextEligibleDate
        },
        record: deferralRecord
      });
    }

    // Approved Donation Flow
    const certificateId = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const generatedBagId = bagId || `BAG-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const donationDate = new Date();
    const nextEligibleDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days cooling period

    const donationRecord = {
      bloodBankId: bloodBank?._id,
      bloodBankName,
      donationDate,
      unitsDonated: Number(unitsDonated) || 1,
      bloodGroup: effectiveBloodGroup,
      bagId: generatedBagId,
      hemoglobin: Number(hemoglobin) || undefined,
      bloodPressure: bloodPressure || undefined,
      status: 'approved',
      certificateId,
      recordedBy: req.user?.email || 'Blood Bank Staff'
    };

    donor.totalDonations = (donor.totalDonations || 0) + (Number(unitsDonated) || 1);
    donor.lastDonation = donationDate;
    donor.nextEligibleDate = nextEligibleDate;
    donor.healthStatus = 'eligible';
    donor.donationHistory.push(donationRecord);
    await donor.save();

    // AUTO-INCREMENT BLOOD BANK INVENTORY STOCK
    let stockUpdated = false;
    let newStockUnits = null;

    if (bloodBank) {
      let bloodStock = bloodBank.linkedBloodStockId;
      if (!bloodStock) {
        bloodStock = await BloodStock.findOne({ bloodBankId: bloodBank._id });
      }

      if (bloodStock) {
        const groups = bloodStock.bloodGroups || {};
        const currentQty = Number(groups[effectiveBloodGroup] ?? 0);
        const updatedQty = currentQty + (Number(unitsDonated) || 1);

        bloodStock.bloodGroups = {
          ...groups,
          [effectiveBloodGroup]: updatedQty
        };
        bloodStock.lastUpdated = new Date();
        await bloodStock.save();

        stockUpdated = true;
        newStockUnits = updatedQty;

        // Broadcast real-time stock update across all connected dashboards
        const io = getIO();
        if (io) {
          io.emit('blood-stock-updated', {
            bloodBankId: bloodBank._id,
            bloodBankName: bloodBank.name,
            bloodGroup: effectiveBloodGroup,
            newUnits: updatedQty,
            timestamp: new Date().toISOString()
          });
        }
      }
    }


    res.status(201).json({
      message: `Successfully recorded donation! Added ${unitsDonated} unit(s) of ${effectiveBloodGroup} to stock.`,
      donor: {
        id: donor._id,
        donorCardId: donor.donorCardId,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: effectiveBloodGroup,
        totalDonations: donor.totalDonations,
        lastDonation: donor.lastDonation,
        nextEligibleDate: donor.nextEligibleDate
      },
      donationRecord,
      certificate: {
        certificateId,
        donorName: donor.name,
        bloodGroup: effectiveBloodGroup,
        unitsDonated: Number(unitsDonated) || 1,
        bagId: generatedBagId,
        bloodBankName,
        bloodBankCity,
        donationDate,
        nextEligibleDate
      },
      stockUpdated,
      newStockUnits
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({ error: 'Failed to record donation: ' + error.message });
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
    eligibleDate.setDate(eligibleDate.getDate() - 90);

    filter.$or = [
      { lastDonation: { $exists: false } },
      { lastDonation: { $lte: eligibleDate } }
    ];

    const donors = await Donor.find(filter)
      .select('name bloodGroup city state lastDonation nextEligibleDate totalDonations')
      .limit(Number(limit))
      .sort({ totalDonations: -1 })
      .lean();

    res.json({ donors, total: donors.length });
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({ error: 'Failed to search donors' });
  }
});

// Get donor statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const availableDonors = await Donor.countDocuments({ 
      isAvailable: true, 
      healthStatus: 'eligible',
      $or: [
        { nextEligibleDate: { $exists: false } },
        { nextEligibleDate: { $lte: new Date() } }
      ]
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

export default router;

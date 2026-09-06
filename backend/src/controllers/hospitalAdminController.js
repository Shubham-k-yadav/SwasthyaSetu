import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import BedUpgradeRequest from '../models/BedUpgradeRequest.js';
import { emitRegistrationRequest, emitBedUpgradeRequest, emitBedUpdate } from '../services/socket.js';
import { geocodeFullAddress, extractCoordinatesFromGoogleUrl } from '../utils/geo.js';

// Public registration request for new hospitals
export const registerHospitalRequest = async (req, res) => {
  try {
    const {
      name,
      type = 'private',
      licenseNumber,
      registrationNumber,
      address,
      city,
      state,
      phone,
      email,
      password,
      generalBeds = 0,
      icuBeds = 0,
      ventilatorBeds = 0,
      specialties = [],
      emergencyServices = false
    } = req.body;

    if (!name || !city || !email || !password) {
      return res.status(400).json({ error: 'Hospital Name, City, Admin Email, and Password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An admin account with this email already exists' });
      }
    }

    const regNo = (licenseNumber || registrationNumber || '').trim() || `HFR-${Date.now().toString().slice(-6)}`;

    // Parse Google Maps location link if provided
    const rawMapUrl = (req.body.googleMapsUrl || req.body.mapLink || '').trim();
    const googleCoords = rawMapUrl ? await extractCoordinatesFromGoogleUrl(rawMapUrl) : null;

    // Automatically geocode full hospital address or city via OpenStreetMap if coordinates not passed
    const coordinates = (req.body.lat && req.body.lng) 
      ? { lat: Number(req.body.lat), lng: Number(req.body.lng) } 
      : (googleCoords)
        ? { lat: googleCoords.lat, lng: googleCoords.lng }
        : await geocodeFullAddress(address, city, state);

    const finalGoogleMapsUrl = rawMapUrl || '';

    const parsedSpecialties = Array.isArray(specialties) 
      ? specialties.filter(s => typeof s === 'string' && s.trim().length > 0)
      : (typeof specialties === 'string' && specialties.trim() ? [specialties.trim()] : []);

    const isEmergencyEnabled = emergencyServices === true || emergencyServices === 'true' || emergencyServices === 1;

    // Create unverified hospital
    const newHospital = new Hospital({
      name: name.trim(),
      type,
      registrationNumber: regNo,
      licenseNumber: regNo,
      address: address || `${city}, ${state || 'India'}`,
      city: city.trim(),
      state: state || 'India',
      phone: phone || '+91-9876543210',
      email: cleanEmail,
      adminEmail: cleanEmail,
      googleMapsUrl: finalGoogleMapsUrl,
      isVerified: false,
      isSimulated: false,
      beds: {
        general: { total: Math.max(0, Number(generalBeds) || 0), available: Math.max(0, Number(generalBeds) || 0) },
        icu: { total: Math.max(0, Number(icuBeds) || 0), available: Math.max(0, Number(icuBeds) || 0) },
        ventilator: { total: Math.max(0, Number(ventilatorBeds) || 0), available: Math.max(0, Number(ventilatorBeds) || 0) },
      },
      specialties: parsedSpecialties,
      emergencyServices: isEmergencyEnabled,
      coordinates,
      lastUpdated: new Date()
    });

    await newHospital.save();

    // Create admin user (inactive until Super Admin approval)
    const newAdmin = new User({
      email: cleanEmail,
      password,
      name: `${name.trim()} Admin`,
      role: 'admin',
      hospitalId: newHospital._id,
      isActive: false
    });

    await newAdmin.save();

    // Broadcast live notification to Super Admin Control Room via WebSockets
    emitRegistrationRequest('hospital', newHospital);

    res.status(201).json({
      message: 'Hospital registration application submitted successfully! Super Admin review pending.',
      hospital: newHospital,
      adminEmail: cleanEmail
    });
  } catch (error) {
    console.error('Error submitting hospital registration request:', error);
    res.status(500).json({ error: 'Failed to submit hospital registration application: ' + error.message });
  }
};

// Superadmin queue for unverified hospitals
export const getPendingQueue = async (req, res) => {
  try {
    const pending = await Hospital.find({
      $or: [
        { isVerified: false },
        { verificationStatus: 'pending' }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Enrich missing emails or license numbers from linked User account
    const enrichedQueue = await Promise.all(pending.map(async (hosp) => {
      let adminEmail = hosp.adminEmail || hosp.email;
      if (!adminEmail) {
        const linkedUser = await User.findOne({
          $or: [
            { hospitalId: hosp._id },
            { hospitalId: hosp._id.toString() }
          ]
        }).lean();
        if (linkedUser) {
          adminEmail = linkedUser.email;
        }
      }

      const googleMapsUrl = hosp.googleMapsUrl || (hosp.coordinates?.lat && hosp.coordinates?.lng
        ? `https://www.google.com/maps/search/?api=1&query=${hosp.coordinates.lat},${hosp.coordinates.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((hosp.name || '') + ' ' + (hosp.address || ''))}`);

      return {
        ...hosp,
        email: adminEmail || hosp.email || 'N/A',
        adminEmail: adminEmail || hosp.adminEmail || 'N/A',
        registrationNumber: hosp.registrationNumber || hosp.licenseNumber || hosp.registrationCertificate || 'HFR-SYSTEM-PENDING',
        licenseNumber: hosp.licenseNumber || hosp.registrationNumber || 'HFR-SYSTEM-PENDING',
        googleMapsUrl
      };
    }));

    res.json({ queue: enrichedQueue });
  } catch (error) {
    console.error('Error fetching pending hospitals queue:', error);
    res.status(500).json({ error: 'Failed to fetch verification queue' });
  }
};

// Super Admin approval & verification endpoint
export const verifyHospital = async (req, res) => {
  try {
    const { status = 'approved' } = req.body;
    const isApproved = status === 'approved';

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: isApproved,
        isBlockchainVerified: isApproved,
        verificationStatus: status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // If approved, activate hospital admin user
    if (isApproved) {
      const hospObjId = new mongoose.Types.ObjectId(hospital._id);
      await User.updateMany(
        {
          $or: [
            { hospitalId: hospObjId },
            { hospitalId: hospital._id.toString() },
            { email: hospital.email },
            { email: hospital.adminEmail }
          ]
        },
        { $set: { isActive: true } }
      );
    }

    res.json({ message: `${hospital.name} ${status} successfully!`, hospital });
  } catch (error) {
    console.error('Error verifying hospital:', error);
    res.status(500).json({ error: 'Failed to verify hospital' });
  }
};

// Submit Bed Capacity Upgrade Request (Hospital Admin)
export const createBedUpgradeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedBeds, reason, documentUrl } = req.body;

    // Check authority: user must be admin of this hospital or superadmin
    const userHospId = req.user.hospitalId ? String(req.user.hospitalId._id || req.user.hospitalId) : null;
    if (req.user.role !== 'superadmin' && userHospId !== String(id)) {
      return res.status(403).json({ error: 'Unauthorized to submit upgrade request for this hospital' });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for capacity upgrade is required' });
    }

    if (!requestedBeds) {
      return res.status(400).json({ error: 'Requested bed capacity numbers are required' });
    }

    // Check if there is already a pending request
    const existingPending = await BedUpgradeRequest.findOne({
      hospitalId: id,
      status: 'pending'
    });

    if (existingPending) {
      return res.status(400).json({
        error: 'A bed capacity upgrade request is already pending review by Super Admin.',
        pendingRequest: existingPending
      });
    }

    const currentBeds = {
      icu: { total: hospital.beds?.icu?.total || 0 },
      general: { total: hospital.beds?.general?.total || 0 },
      ventilator: { total: hospital.beds?.ventilator?.total || 0 }
    };

    const newRequestedBeds = {
      icu: { total: Math.max(currentBeds.icu.total, Number(requestedBeds.icu?.total ?? currentBeds.icu.total)) },
      general: { total: Math.max(currentBeds.general.total, Number(requestedBeds.general?.total ?? currentBeds.general.total)) },
      ventilator: { total: Math.max(currentBeds.ventilator.total, Number(requestedBeds.ventilator?.total ?? currentBeds.ventilator.total)) }
    };

    // Check if any bed count actually increased
    const hasIncrease = 
      newRequestedBeds.icu.total > currentBeds.icu.total ||
      newRequestedBeds.general.total > currentBeds.general.total ||
      newRequestedBeds.ventilator.total > currentBeds.ventilator.total;

    if (!hasIncrease) {
      return res.status(400).json({
        error: 'Requested total beds must be greater than current registered capacity in at least one category.'
      });
    }

    const upgradeReq = new BedUpgradeRequest({
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      requestedBy: req.user._id,
      requesterEmail: req.user.email,
      currentBeds,
      requestedBeds: newRequestedBeds,
      reason: reason.trim(),
      documentUrl: documentUrl || '',
      status: 'pending'
    });

    await upgradeReq.save();

    emitBedUpgradeRequest(upgradeReq);

    res.status(201).json({
      message: 'Bed capacity upgrade request submitted successfully! Super Admin review pending.',
      request: upgradeReq
    });
  } catch (error) {
    console.error('Error submitting bed upgrade request:', error);
    res.status(500).json({ error: 'Failed to submit bed upgrade request: ' + error.message });
  }
};

// Get upgrade requests for a single hospital (Hospital Admin / Super Admin)
export const getHospitalUpgradeRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const userHospId = req.user.hospitalId ? String(req.user.hospitalId._id || req.user.hospitalId) : null;
    if (req.user.role !== 'superadmin' && userHospId !== String(id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const requests = await BedUpgradeRequest.find({ hospitalId: id }).sort({ createdAt: -1 }).lean();
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching hospital upgrade requests:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade requests' });
  }
};

// Get all upgrade requests queue (Super Admin only)
export const getAllBedUpgradeRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await BedUpgradeRequest.find(filter)
      .populate('hospitalId', 'name city state phone isVerified address')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching bed upgrade queue:', error);
    res.status(500).json({ error: 'Failed to fetch bed upgrade queue' });
  }
};

// Review Bed Upgrade Request: Approve or Reject (Super Admin only)
export const handleBedUpgradeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "approve" or "reject"' });
    }

    const upgradeReq = await BedUpgradeRequest.findById(requestId);
    if (!upgradeReq) {
      return res.status(404).json({ error: 'Upgrade request not found' });
    }

    if (upgradeReq.status !== 'pending') {
      return res.status(400).json({ error: `Request has already been ${upgradeReq.status}` });
    }

    upgradeReq.reviewedBy = req.user._id;
    upgradeReq.reviewedAt = new Date();

    if (action === 'approve') {
      upgradeReq.status = 'approved';
      await upgradeReq.save();

      // Update Hospital's registered bed capacity in database
      const hospital = await Hospital.findById(upgradeReq.hospitalId);
      if (hospital) {
        if (!hospital.beds) hospital.beds = {};
        if (!hospital.beds.icu) hospital.beds.icu = { total: 0, available: 0 };
        if (!hospital.beds.general) hospital.beds.general = { total: 0, available: 0 };
        if (!hospital.beds.ventilator) hospital.beds.ventilator = { total: 0, available: 0 };

        hospital.beds.icu.total = upgradeReq.requestedBeds.icu.total;
        hospital.beds.general.total = upgradeReq.requestedBeds.general.total;
        hospital.beds.ventilator.total = upgradeReq.requestedBeds.ventilator.total;
        hospital.lastUpdated = new Date();

        await hospital.save();

        emitBedUpdate(hospital._id, hospital.beds);
      }

      return res.json({
        message: `Capacity upgrade for ${upgradeReq.hospitalName} approved successfully!`,
        request: upgradeReq
      });
    } else {
      upgradeReq.status = 'rejected';
      upgradeReq.rejectionReason = rejectionReason || 'Request rejected by platform administration.';
      await upgradeReq.save();

      return res.json({
        message: `Capacity upgrade for ${upgradeReq.hospitalName} rejected.`,
        request: upgradeReq
      });
    }
  } catch (error) {
    console.error('Error reviewing bed upgrade request:', error);
    res.status(500).json({ error: 'Failed to process bed upgrade review: ' + error.message });
  }
};


import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import { haversineDistance, calculateHospitalScore } from '../utils/geo.js';
import { mockHospitals } from '../utils/mockStore.js';
import { emitBedUpdate } from '../services/socket.js';

// Get all hospitals with filters
export const getHospitals = async (req, res) => {
  try {
    const { city, state, bedType, hasAvailability, includeUnverified, limit = 50, page = 1 } = req.query;
    
    if (global.isDemoMode || mongoose.connection.readyState !== 1) {
      let filtered = [...mockHospitals];
      if (includeUnverified !== 'true') {
        filtered = filtered.filter(h => h.isVerified !== false);
      }
      if (city) filtered = filtered.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
      if (state) filtered = filtered.filter(h => h.state.toLowerCase().includes(state.toLowerCase()));
      if (hasAvailability === 'true' && bedType) {
        filtered = filtered.filter(h => h.beds?.[bedType]?.available > 0);
      }
      return res.json({
        hospitals: filtered,
        pagination: { total: filtered.length, page: 1, limit: 50, pages: 1 }
      });
    }

    const filter = {};
    if (includeUnverified !== 'true') {
      filter.isVerified = true;
    }
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (hasAvailability === 'true' && bedType) {
      filter[`beds.${bedType}.available`] = { $gt: 0 };
    }

    const hospitals = await Hospital.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ lastUpdated: -1 })
      .lean();

    const total = await Hospital.countDocuments(filter);

    res.json({
      hospitals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.json({ hospitals: mockHospitals, pagination: { total: mockHospitals.length, page: 1, limit: 50, pages: 1 } });
  }
};

// Search hospitals by location and radius
export const searchHospitals = async (req, res) => {
  try {
    const { lat, lng, radius = 50, bedType } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const hospitals = await Hospital.find({
      emergencyServices: true,
      isVerified: true
    }).lean();

    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = haversineDistance(
        userLat, userLng,
        hospital.coordinates?.lat, hospital.coordinates?.lng
      );
      return { ...hospital, distance };
    }).filter(h => h.distance <= radiusKm);

    let filtered = hospitalsWithDistance;
    if (bedType) {
      filtered = filtered.filter(h => {
        const beds = h.beds?.[bedType];
        return beds && beds.available > 0;
      });
    }

    filtered.sort((a, b) => a.distance - b.distance);

    const scored = filtered.map(hospital => ({
      ...hospital,
      score: calculateHospitalScore(hospital, bedType)
    }));

    res.json({
      hospitals: scored.slice(0, 10),
      userLocation: { lat: userLat, lng: userLng }
    });
  } catch (error) {
    console.error('Error searching hospitals:', error);
    res.status(500).json({ error: 'Failed to search hospitals' });
  }
};

// Get hospital statistics overview
export const getHospitalStats = async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const verifiedHospitals = await Hospital.countDocuments({ isVerified: true });
    
    const bedStats = await Hospital.aggregate([
      {
        $group: {
          _id: null,
          totalICU: { $sum: '$beds.icu.total' },
          availableICU: { $sum: '$beds.icu.available' },
          totalGeneral: { $sum: '$beds.general.total' },
          availableGeneral: { $sum: '$beds.general.available' },
          totalVentilator: { $sum: '$beds.ventilator.total' },
          availableVentilator: { $sum: '$beds.ventilator.available' }
        }
      }
    ]);

    res.json({
      totalHospitals,
      verifiedHospitals,
      beds: bedStats[0] || {
        totalICU: 0,
        availableICU: 0,
        totalGeneral: 0,
        availableGeneral: 0,
        totalVentilator: 0,
        availableVentilator: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get single hospital by ID
export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).lean();
    
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const bloodStock = await BloodStock.find({ hospitalId: hospital._id }).lean();

    res.json({ hospital, bloodStock });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
};

// Create hospital (Superadmin only)
export const createHospital = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      coordinates,
      phone,
      email,
      beds,
      specialties,
      emergencyServices = true,
      isVerified = true
    } = req.body;

    if (!name || !address || !city || !state || !coordinates || !phone || !email) {
      return res.status(400).json({ error: 'Missing required hospital fields' });
    }

    const defaultBeds = {
      icu: { total: beds?.icu?.total || 0, available: beds?.icu?.available || 0 },
      general: { total: beds?.general?.total || 0, available: beds?.general?.available || 0 },
      ventilator: { total: beds?.ventilator?.total || 0, available: beds?.ventilator?.available || 0 }
    };

    const hospital = new Hospital({
      name,
      address,
      city,
      state,
      coordinates,
      phone,
      email,
      beds: defaultBeds,
      specialties: specialties || [],
      emergencyServices,
      isVerified
    });

    await hospital.save();

    res.status(201).json({ message: 'Hospital created successfully', hospital });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ error: 'Failed to create hospital' });
  }
};

// Update hospital details (Superadmin only)
export const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    res.json({ message: 'Hospital details updated', hospital });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ error: 'Failed to update hospital details' });
  }
};

// Delete hospital (Superadmin only)
export const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    await BloodStock.deleteMany({ hospitalId: req.params.id });

    res.json({ message: 'Hospital and associated blood stock deleted' });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({ error: 'Failed to delete hospital' });
  }
};

// Update bed availability (Admin & Superadmin)
export const updateBeds = async (req, res) => {
  try {
    const { beds } = req.body;
    const hospitalId = req.params.id;

    if (!beds) {
      return res.status(400).json({ error: 'Beds payload is required' });
    }

    if (req.user?.role !== 'superadmin' && 
        req.user?.hospitalId?.toString() !== hospitalId) {
      return res.status(403).json({ error: 'Not authorized for this hospital' });
    }

    const existingHospital = await Hospital.findById(hospitalId);
    if (!existingHospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    // Merge existing bed structure safely
    const updatedBeds = {
      icu: {
        total: beds.icu?.total ?? existingHospital.beds.icu.total,
        available: beds.icu?.available ?? existingHospital.beds.icu.available
      },
      general: {
        total: beds.general?.total ?? existingHospital.beds.general.total,
        available: beds.general?.available ?? existingHospital.beds.general.available
      },
      ventilator: {
        total: beds.ventilator?.total ?? existingHospital.beds.ventilator.total,
        available: beds.ventilator?.available ?? existingHospital.beds.ventilator.available
      }
    };

    existingHospital.beds = updatedBeds;
    existingHospital.lastUpdated = new Date();
    await existingHospital.save();

    emitBedUpdate(hospitalId, updatedBeds);

    res.json({ 
      hospital: existingHospital
    });
  } catch (error) {
    console.error('Error updating beds:', error);
    res.status(500).json({ error: 'Failed to update bed availability' });
  }
};

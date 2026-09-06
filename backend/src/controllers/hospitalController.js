import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import { haversineDistance, calculateHospitalScore } from '../utils/geo.js';
import { emitBedUpdate } from '../services/socket.js';

// Get all hospitals with filters
export const getHospitals = async (req, res) => {
  try {
    const { city, state, bedType, hasAvailability, includeUnverified, limit = 50, page = 1 } = req.query;

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

    const sanitizedHospitals = hospitals.map(h => ({
      ...h,
      googleMapsUrl: (h.googleMapsUrl || '').trim()
    }));

    res.json({
      hospitals: sanitizedHospitals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals', hospitals: [] });
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
      googleMapsUrl: (hospital.googleMapsUrl || '').trim(),
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

    hospital.googleMapsUrl = (hospital.googleMapsUrl || '').trim();
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
      googleMapsUrl = '',
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
      googleMapsUrl: (googleMapsUrl || '').trim(),
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

    const isSuperAdmin = req.user?.role === 'superadmin';

    // Strict validation: Hospital Admin cannot increase total beds beyond verified registered capacity,
    // and available beds can never exceed total capacity.
    for (const type of ['icu', 'general', 'ventilator']) {
      const existingTotal = Number(existingHospital.beds?.[type]?.total) || 0;
      
      // If Hospital Admin tries to alter total capacity beyond registered
      if (!isSuperAdmin && beds[type]?.total !== undefined && Number(beds[type].total) > existingTotal) {
        return res.status(400).json({
          error: `Cannot increase registered ${type.toUpperCase()} bed capacity beyond ${existingTotal}. Total capacity is locked by registration. Contact Super Admin to request quota expansion.`
        });
      }

      const effectiveTotal = (isSuperAdmin && beds[type]?.total !== undefined)
        ? Math.max(0, Number(beds[type].total) || 0)
        : existingTotal;

      // Check if available exceeds total
      if (beds[type]?.available !== undefined) {
        const reqAvail = Number(beds[type].available);
        if (reqAvail > effectiveTotal) {
          return res.status(400).json({
            error: `Available ${type.toUpperCase()} beds (${reqAvail}) cannot exceed the hospital's registered capacity of ${effectiveTotal} beds.`
          });
        }
        if (reqAvail < 0) {
          return res.status(400).json({
            error: `Available ${type.toUpperCase()} beds cannot be negative.`
          });
        }
      }
    }

    // Merge existing bed structure safely with numeric validation & boundary constraints
    const updatedBeds = {
      icu: {
        total: isSuperAdmin && beds.icu?.total !== undefined 
          ? Math.max(0, Number(beds.icu.total) || 0) 
          : (Number(existingHospital.beds?.icu?.total) || 0),
        available: beds.icu?.available !== undefined 
          ? Math.min(
              isSuperAdmin && beds.icu?.total !== undefined ? Math.max(0, Number(beds.icu.total) || 0) : (Number(existingHospital.beds?.icu?.total) || 0),
              Math.max(0, Number(beds.icu.available) || 0)
            ) 
          : (Number(existingHospital.beds?.icu?.available) || 0)
      },
      general: {
        total: isSuperAdmin && beds.general?.total !== undefined 
          ? Math.max(0, Number(beds.general.total) || 0) 
          : (Number(existingHospital.beds?.general?.total) || 0),
        available: beds.general?.available !== undefined 
          ? Math.min(
              isSuperAdmin && beds.general?.total !== undefined ? Math.max(0, Number(beds.general.total) || 0) : (Number(existingHospital.beds?.general?.total) || 0),
              Math.max(0, Number(beds.general.available) || 0)
            ) 
          : (Number(existingHospital.beds?.general?.available) || 0)
      },
      ventilator: {
        total: isSuperAdmin && beds.ventilator?.total !== undefined 
          ? Math.max(0, Number(beds.ventilator.total) || 0) 
          : (Number(existingHospital.beds?.ventilator?.total) || 0),
        available: beds.ventilator?.available !== undefined 
          ? Math.min(
              isSuperAdmin && beds.ventilator?.total !== undefined ? Math.max(0, Number(beds.ventilator.total) || 0) : (Number(existingHospital.beds?.ventilator?.total) || 0),
              Math.max(0, Number(beds.ventilator.available) || 0)
            ) 
          : (Number(existingHospital.beds?.ventilator?.available) || 0)
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

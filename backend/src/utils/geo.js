/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const userLat = parseFloat(lat1);
  const userLng = parseFloat(lon1);
  const targetLat = parseFloat(lat2);
  const targetLng = parseFloat(lon2);

  if (isNaN(userLat) || isNaN(userLng) || isNaN(targetLat) || isNaN(targetLng)) {
    return 999999;
  }

  const R = 6371; // Radius of Earth in km
  const dLat = toRad(targetLat - userLat);
  const dLon = toRad(targetLng - userLng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLat)) * Math.cos(toRad(targetLat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Known Geocoding Dictionary for Indian Cities with micro-spread offset
 */
const CITY_COORDINATES = {
  'prayagraj': { lat: 25.4358, lng: 81.8463 },
  'allahabad': { lat: 25.4358, lng: 81.8463 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'gorakhpur': { lat: 26.7606, lng: 83.3732 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'greater noida': { lat: 28.4744, lng: 77.5040 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'raipur': { lat: 21.2514, lng: 81.6296 },
  'bilaspur': { lat: 22.0797, lng: 82.1391 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'dehradun': { lat: 30.3165, lng: 78.0322 }
};

export function getCoordinatesForCity(cityName) {
  const cleanCity = String(cityName || '').toLowerCase().trim();
  const found = CITY_COORDINATES[cleanCity];

  // Add small micro-jitter (+/- 0.008 deg ~800m) so multiple facilities in the same city don't overlap exact center
  const jitterLat = (Math.random() - 0.5) * 0.012;
  const jitterLng = (Math.random() - 0.5) * 0.012;

  if (found) {
    return {
      lat: Number((found.lat + jitterLat).toFixed(4)),
      lng: Number((found.lng + jitterLng).toFixed(4))
    };
  }

  // Default fallback (center of India - Nagpur) with micro offset
  return {
    lat: Number((21.1458 + jitterLat).toFixed(4)),
    lng: Number((79.0882 + jitterLng).toFixed(4))
  };
}

/**
 * OpenStreetMap Live Address Geocoding with City Dictionary Fallback
 */
export async function geocodeFullAddress(address, city, state) {
  try {
    const fullQuery = [address, city, state, 'India'].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SwasthyaSetu-Emergency-Platform/1.0' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          lat: Number(parseFloat(data[0].lat).toFixed(4)),
          lng: Number(parseFloat(data[0].lon).toFixed(4))
        };
      }
    }
  } catch (err) {
    console.warn('OpenStreetMap geocoding fallback triggered:', err.message);
  }

  return getCoordinatesForCity(city);
}

/**
 * Calculates a match score for a hospital based on distance, bed availability, verification, etc.
 */
export function calculateHospitalScore(hospital, bedType) {
  let score = 0;
  
  const distance = typeof hospital.distance === 'number' ? hospital.distance : 0;
  const distanceScore = Math.max(0, 100 - distance * 2);
  score += distanceScore * 0.4;
  
  if (bedType && hospital.beds && hospital.beds[bedType]) {
    const beds = hospital.beds[bedType];
    const availabilityRatio = beds.available / Math.max(beds.total, 1);
    score += availabilityRatio * 100 * 0.35;
  } else if (hospital.beds) {
    const totalAvailable = (hospital.beds.icu?.available || 0) + 
                          (hospital.beds.general?.available || 0) + 
                          (hospital.beds.ventilator?.available || 0);
    const totalBeds = (hospital.beds.icu?.total || 1) + 
                     (hospital.beds.general?.total || 1) + 
                     (hospital.beds.ventilator?.total || 1);
    score += (totalAvailable / Math.max(totalBeds, 1)) * 100 * 0.35;
  }
  
  if (hospital.isVerified) score += 15;
  if (hospital.blockchainHash) score += 10;
  
  return Math.round(score);
}

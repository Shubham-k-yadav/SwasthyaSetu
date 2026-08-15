/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const userLat = parseFloat(lat1);
  const userLng = parseFloat(lon1);
  const targetLat = parseFloat(lat2);
  const targetLng = parseFloat(lon2);

  if (isNaN(userLat) || isNaN(userLng) || isNaN(targetLat) || isNaN(targetLng)) {
    return 999999; // Return high distance if invalid coordinates
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

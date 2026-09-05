/**
 * Utility functions for hospital navigation, map directions, and coordinate resolution.
 */

/**
 * Resolves precise coordinates for a hospital:
 * 1. Checks hospital.coordinates.lat and lng (numbers or numeric strings)
 * 2. If invalid or 0,0, parses coordinates from hospital.googleMapsUrl if present
 */
export function getHospitalCoordinates(hospital) {
  if (!hospital) return null;

  let lat = hospital.coordinates?.lat;
  let lng = hospital.coordinates?.lng;

  if (typeof lat === 'string') lat = parseFloat(lat);
  if (typeof lng === 'string') lng = parseFloat(lng);

  if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }

  // Attempt extraction from Google Maps URL if available
  const url = (hospital.googleMapsUrl || hospital.mapLink || '').trim();
  if (url) {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                  url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                  url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                  url.match(/loc:(-?\d+\.\d+)\+(-?\d+\.\d+)/) ||
                  url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      const parsedLat = parseFloat(match[1]);
      const parsedLng = parseFloat(match[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
  }

  return null;
}

/**
 * Generates the Google Maps navigation/direction URL according to user specification:
 * - If hospital has a verified Google Maps link (`googleMapsUrl` not empty): use it directly!
 * - If Google Maps link is empty: fallback to directions using hospital's address.
 * - If address is missing: fallback to coordinates or name search.
 */
export function getHospitalDirectionUrl(hospital) {
  if (!hospital) return '';

  const rawGoogleUrl = (hospital.googleMapsUrl || hospital.mapLink || '').trim();
  
  // 1. Prioritize hospital's Google link if non-empty
  if (rawGoogleUrl && (rawGoogleUrl.startsWith('http://') || rawGoogleUrl.startsWith('https://'))) {
    return rawGoogleUrl;
  }

  // 2. Fallback to hospital's physical address for directions
  const fullAddress = [
    hospital.name,
    hospital.address,
    hospital.city,
    hospital.state
  ].filter(Boolean).map(s => String(s).trim()).filter(Boolean).join(', ');

  if (fullAddress) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
  }

  // 3. Fallback to coordinates
  const coords = getHospitalCoordinates(hospital);
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }

  // 4. Fallback to name search
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name || 'Hospital')}`;
}

/**
 * Directly opens hospital directions / Google Maps in a new browser tab.
 */
export function openHospitalDirections(hospital) {
  if (!hospital) return;
  const url = getHospitalDirectionUrl(hospital);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

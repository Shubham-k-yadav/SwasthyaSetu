 
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, Shield } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icons based on availability
const createCustomIcon = (available) => {
  let color = '#059669'; // green
  if (available === 0) {
    color = '#DC2626'; // red
  } else if (available < 10) {
    color = '#D97706'; // amber
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 11px;
        ">${available}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};









// Component to handle map center updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export function HospitalMap({ 
  hospitals, 
  selectedHospital, 
  onHospitalSelect,
  userLocation
}) {
  const [mapReady, setMapReady] = useState(false);

  // Default center (India)
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  // Calculate center & zoom based on selected hospital or city filtering
  let center = defaultCenter;
  let zoom = defaultZoom;

  const validHospitals = hospitals.filter(
    h => h?.coordinates && typeof h.coordinates.lat === 'number' && typeof h.coordinates.lng === 'number'
  );

  if (selectedHospital?.coordinates) {
    center = [selectedHospital.coordinates.lat, selectedHospital.coordinates.lng];
    zoom = 14;
  } else if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
    zoom = 12;
  } else if (validHospitals.length > 0) {
    // Check if hospitals belong to a single city
    const uniqueCities = new Set(validHospitals.map(h => h.city));
    if (uniqueCities.size === 1) {
      const avgLat = validHospitals.reduce((sum, h) => sum + h.coordinates.lat, 0) / validHospitals.length;
      const avgLng = validHospitals.reduce((sum, h) => sum + h.coordinates.lng, 0) / validHospitals.length;
      center = [avgLat, avgLng];
      zoom = 11;
    } else {
      // Multiple cities: center on India overview
      center = defaultCenter;
      zoom = 5;
    }
  }

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="h-[400px] bg-secondary/50 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="h-[300px] sm:h-[400px] rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: 'user-marker',
              html: `
                <div style="
                  background-color: #3B82F6;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 0 2px #3B82F6, 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hospital Markers */}
        {hospitals.map(hospital => {
          const totalAvailable = hospital.beds.icu.available + 
                                hospital.beds.general.available + 
                                hospital.beds.ventilator.available;
          
          return (
            <Marker
              key={hospital._id}
              position={[hospital.coordinates.lat, hospital.coordinates.lng]}
              icon={createCustomIcon(totalAvailable)}
              eventHandlers={{
                click: () => onHospitalSelect?.(hospital)
              }}
            >
              <Popup minWidth={280} maxWidth={320}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight">{hospital.name}</h3>
                    {hospital.isVerified && (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{hospital.address}</p>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-sm font-bold">{hospital.beds.icu.available}</p>
                      <p className="text-xs text-muted-foreground">ICU</p>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-sm font-bold">{hospital.beds.general.available}</p>
                      <p className="text-xs text-muted-foreground">General</p>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <p className="text-sm font-bold">{hospital.beds.ventilator.available}</p>
                      <p className="text-xs text-muted-foreground">Ventilator</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-1"
                      onClick={() => window.open(`tel:${hospital.phone}`, '_self')}
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

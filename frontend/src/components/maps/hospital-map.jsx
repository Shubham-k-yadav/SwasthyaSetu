 
import React, { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, Shield, Radio, Clock, Route, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Distance calculation helper (Haversine formula)
const calcDistKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
};

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
  hospitals = [], 
  selectedHospital, 
  onHospitalSelect,
  userLocation,
  ambulances = []
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
    const uniqueCities = new Set(validHospitals.map(h => h.city));
    if (uniqueCities.size === 1) {
      const avgLat = validHospitals.reduce((sum, h) => sum + h.coordinates.lat, 0) / validHospitals.length;
      const avgLng = validHospitals.reduce((sum, h) => sum + h.coordinates.lng, 0) / validHospitals.length;
      center = [avgLat, avgLng];
      zoom = 12;
    } else {
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
        <span className="text-muted-foreground">Loading Uber-style Live Map...</span>
      </div>
    );
  }

  // Find active tracking ambulance for Uber-style HUD
  const activeAmb = ambulances.find(a => (a.currentLat || a.lat) && (a.currentLng || a.lng));
  const destLocation = userLocation || (selectedHospital?.coordinates ? selectedHospital.coordinates : (validHospitals[0]?.coordinates || null));

  let liveDistance = null;
  let liveEtaMins = null;

  if (activeAmb && destLocation) {
    const ambLat = activeAmb.currentLat || activeAmb.lat;
    const ambLng = activeAmb.currentLng || activeAmb.lng;
    liveDistance = calcDistKm(ambLat, ambLng, destLocation.lat, destLocation.lng);
    if (liveDistance !== null) {
      liveEtaMins = Math.max(1, Math.round((liveDistance / 35) * 60));
    }
  }

  return (
    <div className="relative z-0 isolate h-[340px] sm:h-[450px] rounded-xl overflow-hidden border shadow-md">
      {/* Uber-style Live Radar HUD Banner */}
      {activeAmb && (
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none">
          <div className="bg-slate-950/90 text-white p-3 rounded-xl backdrop-blur-md border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0">
                <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-red-400">🚑 {activeAmb.vehicleNumber || 'Emergency Ambulance'}</span>
                  <Badge variant="outline" className="text-[10px] bg-red-950 text-red-400 border-red-800">
                    {activeAmb.status?.toUpperCase() || 'LIVE GPS'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Driver: <strong className="text-white">{activeAmb.driverName || 'Verified Driver'}</strong> ({activeAmb.driverPhone || '+91 108'})
                </p>
              </div>
            </div>

            {liveDistance !== null && (
              <div className="flex items-center gap-4 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">DISTANCE</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Route className="h-3.5 w-3.5" /> {liveDistance} km
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-400 block text-[10px]">ESTIMATED ETA</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ~{liveEtaMins} mins
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  width: 18px;
                  height: 18px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            })}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold text-xs text-blue-600">📍 Patient Pickup Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Uber-Style Live Ambulance Route Polylines & Markers */}
        {ambulances.map((amb) => {
          const ambLat = amb.currentLat || amb.lat;
          const ambLng = amb.currentLng || amb.lng;
          if (!ambLat || !ambLng) return null;

          const ambId = amb._id || amb.id || amb.vehicleNumber;

          // Route destination (Patient location or target Hospital)
          const targetDest = userLocation || (selectedHospital?.coordinates ? selectedHospital.coordinates : (validHospitals[0]?.coordinates || null));

          return (
            <Fragment key={ambId}>
              {/* Uber-style Animated Route Polyline Line */}
              {targetDest && (
                <Polyline
                  positions={[
                    [ambLat, ambLng],
                    [targetDest.lat, targetDest.lng]
                  ]}
                  color="#EF4444"
                  weight={5}
                  opacity={0.85}
                  dashArray="8, 8"
                />
              )}

              {/* Pulsating Uber-style Ambulance Marker */}
              <Marker
                position={[ambLat, ambLng]}
                icon={L.divIcon({
                  className: 'ambulance-uber-marker',
                  html: `
                    <div class="uber-ambulance-wrapper">
                      <div class="uber-pulse-ring"></div>
                      <div style="
                        background-color: #EF4444;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        z-index: 10;
                      ">🚑</div>
                    </div>
                  `,
                  iconSize: [34, 34],
                  iconAnchor: [17, 17],
                  popupAnchor: [0, -17]
                })}
              >
                <Popup minWidth={240}>
                  <div className="p-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-red-600 text-sm">
                      <span>🚑 {amb.vehicleNumber || 'Emergency Ambulance'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Driver: <strong>{amb.driverName || 'Driver'}</strong> ({amb.driverPhone || '+91 108'})</p>
                    <p className="text-[11px] text-muted-foreground">Hospital: {amb.hospitalName || 'Independent SOS Operator'}</p>
                    
                    {targetDest && (
                      <div className="p-1.5 rounded bg-red-50 text-red-700 font-mono text-[11px] font-bold border border-red-200">
                        ⚡ Distance to Destination: {calcDistKm(ambLat, ambLng, targetDest.lat, targetDest.lng)} km (~{Math.max(1, Math.round(((calcDistKm(ambLat, ambLng, targetDest.lat, targetDest.lng) || 1) / 35) * 60))} mins)
                      </div>
                    )}

                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                      {amb.equipmentLevel || 'Advanced Life Support (ALS)'}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {/* Hospital Markers */}
        {hospitals.map(hospital => {
          if (!hospital.coordinates?.lat || !hospital.coordinates?.lng) return null;
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

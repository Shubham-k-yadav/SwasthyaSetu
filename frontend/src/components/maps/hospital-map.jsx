 
import React, { useEffect, useState, useRef, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, Shield, Radio, Clock, Route, Activity, ExternalLink } from 'lucide-react';
import { getHospitalCoordinates, openHospitalDirections } from '@/lib/navigation';
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

// Component to handle smooth animated map flyTo and zoom updates
function MapUpdater({ center, zoom, selectedHospitalId, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && typeof center[0] === 'number') {
      map.flyTo(center, zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
      if (selectedHospitalId && markerRefs?.current?.[selectedHospitalId]) {
        const timer = setTimeout(() => {
          try {
            markerRefs.current[selectedHospitalId]?.openPopup();
          } catch (e) {}
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [map, center, zoom, selectedHospitalId]);
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

  // Resolve hospitals with coordinates (including those parsed from googleMapsUrl)
  const validHospitalsWithCoords = hospitals
    .map(h => ({ hospital: h, coords: getHospitalCoordinates(h) }))
    .filter(item => item.coords !== null);

  const validHospitals = validHospitalsWithCoords.map(item => item.hospital);
  const defaultHospitalCoord = validHospitalsWithCoords[0]?.coords || null;

  const selectedCoords = getHospitalCoordinates(selectedHospital);

  if (selectedCoords) {
    center = [selectedCoords.lat, selectedCoords.lng];
    zoom = 16;
  } else if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
    zoom = 12;
  } else if (validHospitalsWithCoords.length > 0) {
    const uniqueCities = new Set(validHospitalsWithCoords.map(item => item.hospital.city).filter(Boolean));
    if (uniqueCities.size === 1) {
      const avgLat = validHospitalsWithCoords.reduce((sum, item) => sum + item.coords.lat, 0) / validHospitalsWithCoords.length;
      const avgLng = validHospitalsWithCoords.reduce((sum, item) => sum + item.coords.lng, 0) / validHospitalsWithCoords.length;
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
  const destLocation = userLocation || selectedCoords || defaultHospitalCoord;

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

  const markerRefs = useRef({});
  const selectedHospitalId = selectedHospital?._id || selectedHospital?.id || null;

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
                  <span className="font-black tracking-wide text-xs sm:text-sm">LIVE EMERGENCY RADAR</span>
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] animate-pulse">
                    GPS ACTIVE
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Vehicle: <span className="text-white font-bold">{activeAmb.vehicleNumber || 'Dispatch #108'}</span>
                  {activeAmb.driverName && <span> • Driver: {activeAmb.driverName}</span>}
                </p>
              </div>
            </div>

            {liveDistance !== null && (
              <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-lg px-3 py-1.5 self-stretch sm:self-auto justify-between sm:justify-start">
                <div>
                  <p className="text-[10px] uppercase font-bold text-red-400">Live Distance</p>
                  <p className="font-mono font-bold text-base text-red-300">{liveDistance} km</p>
                </div>
                <div className="h-6 w-px bg-red-800/50"></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-red-400">Est. Arrival</p>
                  <p className="font-mono font-bold text-base text-red-300">~{liveEtaMins} min</p>
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
        <MapUpdater 
          center={center} 
          zoom={zoom} 
          selectedHospitalId={selectedHospitalId}
          markerRefs={markerRefs}
        />

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
          const targetDest = userLocation || selectedCoords || defaultHospitalCoord;

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
          const coords = getHospitalCoordinates(hospital);
          if (!coords) return null;
          
          const totalAvailable = (hospital.beds?.icu?.available || 0) + 
                                (hospital.beds?.general?.available || 0) + 
                                (hospital.beds?.ventilator?.available || 0);
          
          const hasGoogleUrl = Boolean(hospital.googleMapsUrl && hospital.googleMapsUrl.trim());

          const hospId = hospital._id || hospital.id;

          return (
            <Marker
              key={hospId}
              ref={el => {
                if (el) markerRefs.current[hospId] = el;
              }}
              position={[coords.lat, coords.lng]}
              icon={createCustomIcon(totalAvailable)}
              eventHandlers={{
                click: (e) => {
                  onHospitalSelect?.(hospital);
                  const map = e.target._map;
                  if (map) {
                    map.flyTo([coords.lat, coords.lng], 16, { duration: 1 });
                  }
                }
              }}
            >
              <Popup minWidth={280} maxWidth={320}>
                <div className="space-y-3 p-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base leading-tight text-gray-950 dark:text-white">{hospital.name}</h3>
                      {hasGoogleUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ✓ Verified Google Maps Pin
                        </span>
                      )}
                    </div>
                    {hospital.isVerified && (
                      <Badge variant="secondary" className="gap-1 shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Shield className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div 
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-start gap-1 group transition-colors"
                    onClick={() => openHospitalDirections(hospital)}
                    title="Click to view hospital address in Google Maps"
                  >
                    <span className="leading-snug">{hospital.address || `${hospital.city}, ${hospital.state || 'India'}`}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-secondary rounded-lg">
                      <p className="text-sm font-bold">{hospital.beds?.icu?.available || 0}</p>
                      <p className="text-[11px] text-muted-foreground">ICU</p>
                    </div>
                    <div className="p-2 bg-secondary rounded-lg">
                      <p className="text-sm font-bold">{hospital.beds?.general?.available || 0}</p>
                      <p className="text-[11px] text-muted-foreground">General</p>
                    </div>
                    <div className="p-2 bg-secondary rounded-lg">
                      <p className="text-sm font-bold">{hospital.beds?.ventilator?.available || 0}</p>
                      <p className="text-[11px] text-muted-foreground">Ventilator</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {hospital.phone && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-1 text-xs"
                        onClick={() => window.open(`tel:${hospital.phone}`, '_self')}
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        Call
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                      onClick={() => openHospitalDirections(hospital)}
                    >
                      <Navigation className="h-3 w-3" />
                      Get Directions
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

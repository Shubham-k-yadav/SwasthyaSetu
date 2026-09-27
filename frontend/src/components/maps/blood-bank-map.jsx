import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation,
  Phone,
  Droplets,
  ShieldCheck,
  MapPin,
  ExternalLink,
  LocateFixed,
  Maximize2
} from 'lucide-react';
import { getHospitalCoordinates } from '@/lib/navigation';
import 'leaflet/dist/leaflet.css';

// Haversine distance calculator
const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

// Custom Blood Bank pin icon
const createBloodBankIcon = (totalUnits = 0, isSelected = false) => {
  const bgColor = isSelected ? '#b91c1c' : '#dc2626'; // dark red if selected
  const borderColor = isSelected ? '#fbbf24' : '#ffffff'; // gold border if selected
  const scale = isSelected ? 'scale(1.15)' : 'scale(1)';

  return L.divIcon({
    className: 'custom-blood-marker',
    html: `
      <div style="
        transform: ${scale};
        transition: transform 0.2s ease;
        position: relative;
        width: 36px;
        height: 36px;
      ">
        <div style="
          background-color: ${bgColor};
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid ${borderColor};
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: 800;
            font-size: 11px;
            font-family: ui-sans-serif, system-ui;
          ">${totalUnits > 99 ? '99+' : totalUnits}</span>
        </div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -4px;
            left: -4px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border: 2px solid #fbbf24;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Pulsing user location GPS icon
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        z-index: 2;
      "></div>
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 32px;
        height: 32px;
        background-color: rgba(59, 130, 246, 0.35);
        border-radius: 50%;
        animation: pulse 2s infinite;
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Helper component for smooth map pan / flyTo
function MapController({ center, zoom, selectedBankId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && typeof center[0] === 'number') {
      map.flyTo(center, zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });

      if (selectedBankId && markerRefs?.current?.[selectedBankId]) {
        const timer = setTimeout(() => {
          try {
            markerRefs.current[selectedBankId]?.openPopup();
          } catch (e) {}
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [map, center, zoom, selectedBankId]);

  return null;
}

export function BloodBankMap({
  bloodBanks = [],
  selectedBank = null,
  onBankSelect = () => {},
  className = ''
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default NCR
  const [mapZoom, setMapZoom] = useState(11);
  const markerRefs = useRef({});

  // 1. Detect user geolocation
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  // 2. Resolve coordinates for all blood banks
  const validBanks = bloodBanks.map((b) => {
    const coords = getHospitalCoordinates(b) || (b.coordinates?.lat && b.coordinates?.lng
      ? { lat: Number(b.coordinates.lat), lng: Number(b.coordinates.lng) }
      : null) || (b.city?.toLowerCase().includes('noida') ? { lat: 28.5355, lng: 77.3910 } : null);

    // Calculate total units across all blood groups
    const stockList = Array.isArray(b.bloodStock) ? b.bloodStock : [];
    const totalUnits = stockList.reduce((acc, curr) => acc + (Number(curr.unitsAvailable) || 0), 0);

    const dist = userLocation && coords
      ? calcDistanceKm(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
      : b.distance;

    return {
      ...b,
      resolvedCoords: coords,
      totalUnits,
      calculatedDist: dist
    };
  }).filter((b) => Boolean(b.resolvedCoords));

  // 3. Center map on selection or first bank or user
  useEffect(() => {
    if (selectedBank) {
      const coords = getHospitalCoordinates(selectedBank) || (selectedBank.coordinates?.lat
        ? { lat: Number(selectedBank.coordinates.lat), lng: Number(selectedBank.coordinates.lng) }
        : null);

      if (coords) {
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(13);
        return;
      }
    }

    if (validBanks.length > 0) {
      setMapCenter([validBanks[0].resolvedCoords.lat, validBanks[0].resolvedCoords.lng]);
      setMapZoom(11);
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(12);
    }
  }, [selectedBank, validBanks.length]);

  const handleLocateMe = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(13);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(13);
        },
        () => alert('Unable to access current GPS position. Please enable location permissions.')
      );
    }
  };

  const handleFitAll = () => {
    if (validBanks.length > 0) {
      const avgLat = validBanks.reduce((sum, b) => sum + b.resolvedCoords.lat, 0) / validBanks.length;
      const avgLng = validBanks.reduce((sum, b) => sum + b.resolvedCoords.lng, 0) / validBanks.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(11);
    }
  };

  return (
    <div className={`relative w-full h-[360px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md ${className}`}>
      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleLocateMe}
          className="h-9 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md hover:bg-white text-xs font-bold gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
          title="Zoom to my location"
        >
          <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">My Location</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleFitAll}
          className="h-9 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md hover:bg-white text-xs font-bold gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
          title="Fit all blood banks"
        >
          <Maximize2 className="w-3.5 h-3.5 text-red-600" />
          <span className="hidden sm:inline">Fit All ({validBanks.length})</span>
        </Button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
          <span>Blood Bank (Units)</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse" />
            <span>You</span>
          </div>
        )}
      </div>

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          center={mapCenter}
          zoom={mapZoom}
          selectedBankId={selectedBank?._id || selectedBank?.id}
          markerRefs={markerRefs}
        />

        {/* User live position marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="text-center p-1 text-xs">
                <strong className="block text-blue-600">Your Current Location</strong>
                <span className="text-muted-foreground text-[10px]">Real-time GPS detected</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Blood Bank markers */}
        {validBanks.map((bank) => {
          const bankId = bank._id || bank.id;
          const isSelected = selectedBank && (selectedBank._id === bankId || selectedBank.id === bankId);
          const icon = createBloodBankIcon(bank.totalUnits, isSelected);

          return (
            <Marker
              key={bankId}
              position={[bank.resolvedCoords.lat, bank.resolvedCoords.lng]}
              icon={icon}
              ref={(ref) => {
                if (ref) markerRefs.current[bankId] = ref;
              }}
              eventHandlers={{
                click: () => onBankSelect(bank)
              }}
            >
              <Popup className="blood-bank-popup" minWidth={240}>
                <div className="p-1 space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-slate-900 block leading-tight">
                        {bank.hospitalName || bank.name}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      {bank.address || `${bank.city}, ${bank.state}`}
                    </p>
                    {bank.calculatedDist && (
                      <Badge variant="outline" className="mt-1 text-[10px] font-bold text-blue-600 border-blue-200">
                        {bank.calculatedDist} km from you
                      </Badge>
                    )}
                  </div>

                  {/* Stock chips in popup */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Available Blood Reserves
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {(bank.bloodStock || []).slice(0, 8).map((st) => (
                        <div
                          key={st.bloodGroup}
                          className={`text-center p-1 rounded font-mono text-[10px] border ${
                            st.isLow || st.unitsAvailable < 5
                              ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className="block font-bold">{st.bloodGroup}</span>
                          <span className="block font-semibold">{st.unitsAvailable}u</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                    {bank.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${bank.phone}`, '_self')}
                        className="flex-1 h-7 text-[11px] px-2 gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        if (bank.googleMapsUrl) {
                          window.open(bank.googleMapsUrl, '_blank');
                        } else {
                          const q = encodeURIComponent(`${bank.hospitalName || bank.name} ${bank.city}`);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                        }
                      }}
                      className="flex-1 h-7 text-[11px] px-2 gap-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      <Navigation className="w-3 h-3" />
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

export default BloodBankMap;

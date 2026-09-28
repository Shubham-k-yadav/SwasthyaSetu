import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Siren,
  Phone,
  Navigation,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Share2,
  X,
  RefreshCw,
  ExternalLink,
  Radio,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
const patientIcon = L.divIcon({
  className: 'custom-patient-marker',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: rgba(239, 68, 68, 0.4);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #dc2626;
        border: 3px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: bold;
      ">
        SOS
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: #2563eb;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      font-weight: bold;
    ">
      🏥
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ambulanceIcon = L.divIcon({
  className: 'custom-ambulance-marker',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: rgba(245, 158, 11, 0.4);
        animation: pulse 1s infinite;
      "></div>
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background-color: #d97706;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        🚑
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Auto-fit map bounds helper component
function MapBoundsUpdater({ points }) {
  const map = useMap();
  useEffect(() => {
    const validPoints = points.filter(p => p && p[0] && p[1] && !isNaN(p[0]) && !isNaN(p[1]));
    if (validPoints.length > 0) {
      if (validPoints.length === 1) {
        map.setView(validPoints[0], 14);
      } else {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [points, map]);
  return null;
}

const STATUS_STEPS = [
  { key: 'searching', label: 'SOS Broadcasted', desc: 'Alerting nearest hospital ERs & fleet' },
  { key: 'assigned', label: 'Hospital Accepted', desc: 'ER Bed reserved for patient' },
  { key: 'dispatched', label: 'Ambulance En Route', desc: 'Response vehicle dispatched' },
  { key: 'in_transit', label: 'Patient Onboard', desc: 'Heading towards hospital' },
  { key: 'admitted', label: 'Safely Admitted', desc: 'Reached medical facility' }
];

export function LiveSOSTracker({ emergency, onCancelEmergency }) {
  const [liveEmergency, setLiveEmergency] = useState(emergency);
  const [etaCountdown, setEtaCountdown] = useState(emergency?.estimatedArrival || 10);
  const [activeAmbulancePos, setActiveAmbulancePos] = useState(null);

  // Sync prop changes
  useEffect(() => {
    setLiveEmergency(emergency);
    if (emergency?.estimatedArrival) {
      setEtaCountdown(emergency.estimatedArrival);
    }
  }, [emergency]);

  // ETA countdown tick
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000); // decrement each minute
    return () => clearInterval(timer);
  }, []);

  // Compute points for map
  const patientLat = liveEmergency?.location?.lat || 28.6139;
  const patientLng = liveEmergency?.location?.lng || 77.2090;

  const hospitalLat = liveEmergency?.assignedHospital?.coordinates?.lat ||
    liveEmergency?.recommendedHospitals?.[0]?.coordinates?.lat ||
    (patientLat + 0.015);
  const hospitalLng = liveEmergency?.assignedHospital?.coordinates?.lng ||
    liveEmergency?.recommendedHospitals?.[0]?.coordinates?.lng ||
    (patientLng + 0.015);

  const ambLat = activeAmbulancePos?.lat ||
    liveEmergency?.ambulanceDetails?.currentLat ||
    (patientLat - 0.012);
  const ambLng = activeAmbulancePos?.lng ||
    liveEmergency?.ambulanceDetails?.currentLng ||
    (patientLng - 0.012);

  const isDispatched = liveEmergency?.status === 'dispatched' || liveEmergency?.status === 'in_transit';
  const isAssigned = liveEmergency?.status === 'assigned' || isDispatched || liveEmergency?.status === 'admitted';

  const mapPoints = [
    [patientLat, patientLng],
    ...(isAssigned ? [[hospitalLat, hospitalLng]] : []),
    ...(isDispatched ? [[ambLat, ambLng]] : [])
  ];

  // WhatsApp Emergency Share Link
  const handleShareWhatsApp = () => {
    const trackingUrl = window.location.href;
    const mapsLink = `https://maps.google.com/?q=${patientLat},${patientLng}`;
    const text = encodeURIComponent(
      `🚨 EMERGENCY SOS ALERT! 🚨\nPatient: ${liveEmergency?.patientName || 'Emergency Patient'}\nCondition: ${liveEmergency?.emergencyType?.toUpperCase() || 'Emergency'}\nStatus: ${liveEmergency?.status?.toUpperCase()}\n\n📍 Patient GPS Location:\n${mapsLink}\n\n🔗 Live SwasthyaSetu Tracking:\n${trackingUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const getStepIndex = (status) => {
    if (status === 'searching' || status === 'pending') return 0;
    if (status === 'assigned') return 1;
    if (status === 'dispatched') return 2;
    if (status === 'in_transit') return 3;
    if (status === 'admitted' || status === 'resolved') return 4;
    return 0;
  };

  const currentStepIdx = getStepIndex(liveEmergency?.status);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Urgent Alert Banner */}
      <div className={cn(
        "rounded-2xl p-4 sm:p-5 border-2 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-white",
        liveEmergency?.status === 'dispatched' || liveEmergency?.status === 'in_transit'
          ? "bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 border-amber-400"
          : liveEmergency?.status === 'assigned'
            ? "bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 border-blue-400"
            : "bg-gradient-to-r from-red-600 via-rose-600 to-red-800 border-red-500 animate-pulse"
      )}>
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Siren className="h-6 w-6 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full">
                Active SOS: {liveEmergency?.emergencyType?.toUpperCase()}
              </span>
              <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                Bed: {liveEmergency?.bedType?.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black mt-1">
              {liveEmergency?.status === 'dispatched'
                ? `Ambulance Dispatched • ETA ~${etaCountdown} Minutes!`
                : liveEmergency?.status === 'assigned'
                  ? `Hospital Confirmed: ${liveEmergency?.assignedHospital?.name || 'Emergency Center'}`
                  : 'Broadcasting Live SOS to Nearest Hospitals & Ambulances...'}
            </h3>
          </div>
        </div>

        {/* Quick Emergency Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5 shadow-md cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Share with Family
          </Button>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-black shadow-md"
          >
            <Phone className="h-3.5 w-3.5" />
            Call 108
          </a>
        </div>
      </div>

      {/* Progress Steps Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            {STATUS_STEPS.map((s, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={s.key}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all",
                    isCurrent
                      ? "bg-red-50 dark:bg-red-950/40 border-red-500 shadow-xs"
                      : isPast
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-muted-foreground"
                        : "bg-muted/30 border-muted opacity-60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Radio className="h-4 w-4 text-red-600 animate-pulse" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs font-bold leading-tight", isCurrent ? "text-red-600" : isPast ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Map & Dispatch Unit Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Interactive Real-Time Map (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border shadow-sm h-[380px] sm:h-[440px] relative z-0">
          <MapContainer
            center={[patientLat, patientLng]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapBoundsUpdater points={mapPoints} />

            {/* Patient Marker */}
            <Marker position={[patientLat, patientLng]} icon={patientIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong className="text-red-600 block">🚨 Patient Location</strong>
                  <span>{liveEmergency?.patientName || 'Emergency Patient'}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Phone: {liveEmergency?.contactPhone}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Assigned Hospital Marker */}
            {isAssigned && (
              <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-blue-600 block">🏥 {liveEmergency?.assignedHospital?.name || 'Assigned Hospital'}</strong>
                    <p className="text-[10px] text-muted-foreground">Emergency Department Ready</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Ambulance Marker */}
            {isDispatched && (
              <Marker position={[ambLat, ambLng]} icon={ambulanceIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-amber-600 block">🚑 Ambulance En Route</strong>
                    <p>{liveEmergency?.ambulanceDetails?.vehicleNumber || 'Emergency Unit'}</p>
                    <p className="text-[10px] text-muted-foreground">Driver: {liveEmergency?.ambulanceDetails?.driverName}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Polyline Route */}
            {isDispatched && (
              <Polyline
                positions={[
                  [ambLat, ambLng],
                  [patientLat, patientLng],
                  ...(isAssigned ? [[hospitalLat, hospitalLng]] : [])
                ]}
                color="#dc2626"
                weight={4}
                dashArray="6, 8"
              />
            )}
          </MapContainer>

          {/* Map Status Overlay */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-md text-xs font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Satellite Tracking Active</span>
          </div>
        </div>

        {/* Right: Emergency Units & Contact Cards (1 Col) */}
        <div className="space-y-3">
          {/* Dispatched Ambulance Card */}
          {liveEmergency?.ambulanceDetails ? (
            <Card className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Activity className="h-4 w-4" />
                    <span>Dispatched Ambulance</span>
                  </div>
                  <Badge className="bg-amber-600 text-white text-[10px]">
                    ETA ~{etaCountdown} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2 text-xs">
                <div>
                  <h4 className="font-mono font-black text-base text-foreground">
                    {liveEmergency.ambulanceDetails.vehicleNumber}
                  </h4>
                  <p className="text-muted-foreground text-[11px]">
                    Driver: <strong>{liveEmergency.ambulanceDetails.driverName || 'Designated Driver'}</strong>
                  </p>
                  {liveEmergency.ambulanceDetails.equipmentLevel && (
                    <Badge variant="outline" className="text-[10px] mt-1 font-semibold">
                      {liveEmergency.ambulanceDetails.equipmentLevel}
                    </Badge>
                  )}
                </div>

                {liveEmergency.ambulanceDetails.driverPhone && (
                  <a
                    href={`tel:${liveEmergency.ambulanceDetails.driverPhone}`}
                    className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Ambulance Driver ({liveEmergency.ambulanceDetails.driverPhone})
                  </a>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <Clock className="h-6 w-6 text-red-500 animate-spin mx-auto" />
                <p className="font-semibold text-foreground">Waiting for Ambulance Dispatch</p>
                <p className="text-[11px]">Hospital is currently assigning the nearest available paramedic unit.</p>
              </CardContent>
            </Card>
          )}

          {/* Assigned Hospital Card */}
          {liveEmergency?.assignedHospital ? (
            <Card className="border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                    <Building2 className="h-4 w-4" />
                    <span>Emergency Hospital</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 font-bold">
                    ER Bed Ready
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {liveEmergency.assignedHospital.name}
                  </h4>
                  <p className="text-muted-foreground text-[11px] truncate">
                    {liveEmergency.assignedHospital.address || 'Medical Centre'}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  {liveEmergency.assignedHospital.phone && (
                    <a
                      href={`tel:${liveEmergency.assignedHospital.phone}`}
                      className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg border bg-white dark:bg-slate-900 font-semibold text-xs hover:bg-muted"
                    >
                      <Phone className="h-3 w-3 text-blue-600" />
                      Call ER
                    </a>
                  )}
                  <a
                    href={`https://maps.google.com/?q=${hospitalLat},${hospitalLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Navigation className="h-3 w-3" />
                    Navigate
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <Building2 className="h-6 w-6 text-blue-500 animate-pulse mx-auto" />
                <p className="font-semibold text-foreground">Notifying 3 Nearest Hospitals</p>
                <p className="text-[11px]">Matching ICU/General bed availability in real-time.</p>
              </CardContent>
            </Card>
          )}

          {/* Cancel SOS Option */}
          {onCancelEmergency && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelEmergency}
              className="w-full text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium"
            >
              Cancel / Resolve Emergency SOS
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveSOSTracker;

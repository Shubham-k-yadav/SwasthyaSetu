import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Navigation, Radio, ShieldCheck, MapPin, Loader2, Power, AlertCircle, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

export default function DriverLocationPage() {
  const { ambulanceId } = useParams();
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState('available');
  const [location, setLocation] = useState(null);
  const [lastPushed, setLastPushed] = useState(null);
  const [ambulanceInfo, setAmbulanceInfo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const intervalRef = useRef(null);

  useEffect(() => {
    if (ambulanceId) {
      api.ambulances.getById(ambulanceId)
        .then(res => setAmbulanceInfo(res.ambulance))
        .catch(() => setAmbulanceInfo({ vehicleNumber: ambulanceId, driverName: 'Ambulance Driver' }));
    }
  }, [ambulanceId]);

  const sendLocationUpdate = (lat, lng) => {
    if (!ambulanceId) return;
    setIsSending(true);
    setErrorMsg('');

    api.ambulances.updateLocation(ambulanceId, { lat, lng, status })
      .then(res => {
        setLastPushed(new Date());
        setIsSending(false);
      })
      .catch(err => {
        setIsSending(false);
        setErrorMsg(err.message || 'Location push failed');
      });
  };

  const getPositionAndSend = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        sendLocationUpdate(latitude, longitude);
      },
      (err) => {
        console.warn('GPS Error:', err);
        // Fallback Delhi GPS for demo
        const demoLat = 28.6139 + (Math.random() - 0.5) * 0.01;
        const demoLng = 77.2090 + (Math.random() - 0.5) * 0.01;
        setLocation({ lat: demoLat, lng: demoLng });
        sendLocationUpdate(demoLat, demoLng);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isSharing) {
      getPositionAndSend();
      intervalRef.current = setInterval(() => {
        getPositionAndSend();
      }, 2000); // Push location every 2 seconds
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSharing, status]);

  const toggleSharing = () => {
    if (!isSharing) {
      setIsSharing(true);
      toast.success('Live GPS location sharing turned ON.');
    } else {
      setIsSharing(false);
      toast.info('Live GPS location sharing turned OFF.');
    }
  };

  const handleStatusSelect = (newStatus) => {
    setStatus(newStatus);
    if (!ambulanceId) return;

    const latToUse = location?.lat || ambulanceInfo?.currentLat || 25.4331;
    const lngToUse = location?.lng || ambulanceInfo?.currentLng || 81.8476;

    setIsSending(true);
    api.ambulances.updateLocation(ambulanceId, { lat: latToUse, lng: lngToUse, status: newStatus })
      .then(res => {
        setLastPushed(new Date());
        setIsSending(false);
        toast.success(`Ambulance status updated live to ${newStatus.toUpperCase()}`);
      })
      .catch(err => {
        setIsSending(false);
        toast.error('Failed to broadcast status change');
      });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-lg space-y-6">
          {/* Driver Header */}
          <div className="text-center space-y-2">
            <Badge variant="outline" className="gap-1 text-primary border-primary/30 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              SwasthyaSetu Driver Portal
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Ambulance GPS Dispatch</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vehicle: <strong className="text-foreground">{ambulanceInfo?.vehicleNumber || ambulanceId || 'AMB-108'}</strong> | Driver: <strong>{ambulanceInfo?.driverName || 'Verified Driver'}</strong>
            </p>
          </div>

          {/* Big Location Toggle Button Card */}
          <Card className={cn(
            'border-2 transition-all shadow-lg text-center',
            isSharing ? 'border-emerald-500 bg-emerald-500/5' : 'border-muted'
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">GPS Location Broadcast</CardTitle>
              <CardDescription className="text-xs">
                {isSharing ? 'Transmitting live coordinates to Emergency SOS network every 2s' : 'Location broadcast is currently paused'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-4">
              <div className="flex justify-center">
                <Button
                  onClick={toggleSharing}
                  size="lg"
                  className={cn(
                    'h-32 w-32 rounded-full flex flex-col items-center justify-center gap-2 text-white font-black shadow-xl transition-all active:scale-95',
                    isSharing
                      ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse ring-4 ring-emerald-500/30'
                      : 'bg-destructive hover:bg-destructive/90'
                  )}
                >
                  <Power className="h-10 w-10" />
                  <span className="text-xs tracking-wider uppercase">
                    {isSharing ? 'LIVE (ON)' : 'START GPS'}
                  </span>
                </Button>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5 text-left bg-card p-3 rounded-xl border">
                <label className="text-xs font-semibold text-muted-foreground">Ambulance Operational Status</label>
                <Select value={status} onValueChange={handleStatusSelect}>
                  <SelectTrigger className="font-bold text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">🟢 Available for Dispatch</SelectItem>
                    <SelectItem value="en_route">🟡 En Route to Patient</SelectItem>
                    <SelectItem value="busy">🔴 Transporting Patient (Busy)</SelectItem>
                    <SelectItem value="offline">⚪ Offline / Off-Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live Coordinates Display */}
              <div className="p-4 rounded-xl bg-muted/60 text-left space-y-2 text-xs border">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Live Position
                  </span>
                  {isSending && (
                    <span className="flex items-center gap-1 text-primary animate-pulse font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" /> Pushing...
                    </span>
                  )}
                </div>

                {location ? (
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono font-bold pt-1">
                    <div className="bg-background p-2 rounded border">Lat: {location.lat.toFixed(5)}</div>
                    <div className="bg-background p-2 rounded border">Lng: {location.lng.toFixed(5)}</div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-2 italic">Turn ON button to acquire GPS location</p>
                )}

                {lastPushed && (
                  <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Radio className="h-3 w-3 text-emerald-500 animate-ping" />
                    Last successful push: {lastPushed.toLocaleTimeString()}
                  </p>
                )}

                {errorMsg && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errorMsg}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

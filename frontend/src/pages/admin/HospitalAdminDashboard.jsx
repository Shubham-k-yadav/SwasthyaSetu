import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Bed,
  Heart,
  Wind,
  CheckCircle2,
  Clock,
  RefreshCw,
  Save,
  ShieldCheck,
  Phone,
  Siren,
  Plus,
  Copy,
  ExternalLink,
  Navigation,
  Zap,
  UserCheck,
  XCircle,
  AlertTriangle,
  User,
  Sliders,
  ListFilter,
  QrCode,
  Camera,
  CheckCircle,
  VideoOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { connectSocket, getSocket, joinHospitalRoom } from '@/lib/socket';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || user?.hospital?._id || user?.hospital;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inventory';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  
  const [hospital, setHospital] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingBeds, setUpdatingBeds] = useState(false);
  const [addingAmbulance, setAddingAmbulance] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Instant QR Scanner Modal & Html5Qrcode State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [isVerifyingScan, setIsVerifyingScan] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [bedsForm, setBedsForm] = useState({
    icuAvailable: 0,
    icuTotal: 0,
    generalAvailable: 0,
    generalTotal: 0,
    ventilatorAvailable: 0,
    ventilatorTotal: 0,
  });

  const [ambForm, setAmbForm] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    equipmentLevel: 'ALS Ambulance (Advanced Life Support)'
  });

  const fetchHospitalData = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [hospRes, ambRes, resvRes] = await Promise.all([
        api.hospitals.getById(hospitalId).catch(() => null),
        api.ambulances.getByHospital(hospitalId, token).catch(() => ({ ambulances: [] })),
        api.hospitals.getReservations(hospitalId, token).catch(() => ({ reservations: [] }))
      ]);

      const h = hospRes?.hospital || hospRes;
      if (h) {
        setHospital(h);
        if (h.beds) {
          setBedsForm({
            icuAvailable: h.beds.icu?.available || 0,
            icuTotal: h.beds.icu?.total || 0,
            generalAvailable: h.beds.general?.available || 0,
            generalTotal: h.beds.general?.total || 0,
            ventilatorAvailable: h.beds.ventilator?.available || 0,
            ventilatorTotal: h.beds.ventilator?.total || 0,
          });
        }
      }
      setAmbulances(ambRes?.ambulances || []);
      setReservations(resvRes?.reservations || []);
    } catch (err) {
      console.error('Error fetching hospital admin details:', err);
      toast.error('Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, [hospitalId]);

  // Robust HTML5 QR Code Scanner Lifecycle
  useEffect(() => {
    let html5QrcodeScanner = null;

    if (scanModalOpen) {
      setCameraError('');
      // Small timeout to allow DOM node #qr-reader to render
      const timer = setTimeout(() => {
        const element = document.getElementById('qr-reader');
        if (element) {
          html5QrcodeScanner = new Html5Qrcode('qr-reader');
          const config = { fps: 10, qrbox: { width: 220, height: 220 } };

          html5QrcodeScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              const cleanCode = decodedText.trim().toUpperCase().replace(/.*(SS-HOLD-\d+).*/, '$1');
              setScannedCodeInput(cleanCode);
              toast.success(`🎯 QR Pass Detected: ${cleanCode}`);
              // Auto admit on camera detection!
              handleAutoConfirmScan(cleanCode);
              if (html5QrcodeScanner) {
                html5QrcodeScanner.stop().catch(() => {});
              }
            },
            () => {
              // Frame scanning...
            }
          ).catch((err) => {
            console.warn('Html5Qrcode camera error:', err);
            setCameraError('Camera access denied or unequipped. Don\'t worry, you can scan via USB/Bluetooth reader or enter code manually below.');
          });
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
          html5QrcodeScanner.stop().catch(() => {}).finally(() => {
            html5QrcodeScanner.clear();
          });
        }
      };
    }
  }, [scanModalOpen]);

  // Real-time WebSocket listening for incoming patient bed holds & ambulance fleet updates
  useEffect(() => {
    if (!hospitalId) return;
    connectSocket();
    joinHospitalRoom(hospitalId);

    const s = getSocket();
    const handleBedHoldAlert = (data) => {
      toast.warning(`🚨 EMERGENCY BED HOLD: Patient ${data.patientName} (+91-${data.contactPhone}) held a ${data.bedType?.toUpperCase()} bed!`, {
        duration: 12000
      });
      fetchHospitalData();
    };

    const handleAmbulanceUpdate = (data) => {
      setAmbulances(prev => {
        const ambId = data.ambulanceId || data._id || data.id;
        const exists = prev.some(a => (a._id || a.id) === ambId);
        if (exists) {
          return prev.map(a => {
            if ((a._id || a.id) === ambId) {
              return {
                ...a,
                status: data.status || a.status,
                currentLat: data.lat || data.currentLat || a.currentLat,
                currentLng: data.lng || data.currentLng || a.currentLng,
                driverName: data.driverName || a.driverName,
                driverPhone: data.driverPhone || a.driverPhone
              };
            }
            return a;
          });
        }
        return prev;
      });
    };

    s.on('hospital-bed-hold', handleBedHoldAlert);
    s.on('ambulance-updates', handleAmbulanceUpdate);
    s.on('hospital-ambulance-update', handleAmbulanceUpdate);

    return () => {
      s.off('hospital-bed-hold', handleBedHoldAlert);
      s.off('ambulance-updates', handleAmbulanceUpdate);
      s.off('hospital-ambulance-update', handleAmbulanceUpdate);
    };
  }, [hospitalId]);

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    if (!hospitalId) return;
    setUpdatingBeds(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const bedsPayload = {
        icu: { available: Number(bedsForm.icuAvailable), total: Number(bedsForm.icuTotal) },
        general: { available: Number(bedsForm.generalAvailable), total: Number(bedsForm.generalTotal) },
        ventilator: { available: Number(bedsForm.ventilatorAvailable), total: Number(bedsForm.ventilatorTotal) }
      };

      await api.hospitals.updateBeds(hospitalId, bedsPayload, token);
      toast.success('Hospital bed availability updated live across network!');
      fetchHospitalData();
    } catch (err) {
      toast.error('Failed to update bed inventory');
    } finally {
      setUpdatingBeds(false);
    }
  };

  const handleConfirmAdmission = async (code) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.hospitals.confirmReservation(code, token);
      toast.success(`🎉 Patient admission confirmed for Code: ${code}!`);
      fetchHospitalData();
    } catch (err) {
      toast.error('Failed to confirm admission');
    }
  };

  const handleAutoConfirmScan = async (code) => {
    setIsVerifyingScan(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.hospitals.confirmReservation(code, token);
      toast.success(`🎉 INSTANT ADMISSION SUCCESS! Pass ${code} Verified & Patient Admitted!`);
      setScannedCodeInput('');
      setScanModalOpen(false);
      fetchHospitalData();
    } catch (err) {
      toast.error(err.message || `Failed to verify code ${code}`);
    } finally {
      setIsVerifyingScan(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scannedCodeInput.trim()) {
      toast.error('Please enter or scan a valid reservation code / QR payload');
      return;
    }
    const cleanCode = scannedCodeInput.trim().toUpperCase().replace(/.*(SS-HOLD-\d+).*/, '$1');
    handleAutoConfirmScan(cleanCode);
  };

  const handleReleaseHold = async (code) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.hospitals.releaseReservation(code, token);
      toast.success('Bed hold released! Bed restored to live available inventory.');
      fetchHospitalData();
    } catch (err) {
      toast.error('Failed to release hold');
    }
  };

  const handleDischargePatient = async (code, bedType) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.hospitals.dischargeReservation(code, token);
      toast.success(`🏥 Patient Discharged! 1 ${(bedType || 'bed').toUpperCase()} restored to live available inventory.`);
      fetchHospitalData();
    } catch (err) {
      toast.error('Failed to discharge patient');
    }
  };

  const handleAddAmbulance = async (e) => {
    e.preventDefault();
    if (!ambForm.vehicleNumber || !ambForm.driverName || !ambForm.driverPhone) {
      toast.error('Please fill vehicle number, driver name, and phone');
      return;
    }
    setAddingAmbulance(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const res = await api.ambulances.addHospitalAmbulance({
        ...ambForm,
        hospitalId,
        hospitalName: hospital?.name || user?.name || 'Hospital'
      }, token);

      toast.success(res?.message || `Ambulance ${ambForm.vehicleNumber} registered to your fleet!`);
      setAmbForm({ vehicleNumber: '', driverName: '', driverPhone: '', equipmentLevel: 'ALS Ambulance (Advanced Life Support)' });
      setShowAddForm(false);
      fetchHospitalData();
    } catch (err) {
      console.error('Add ambulance error:', err);
      toast.error(err.message || err.error || 'Failed to add ambulance to fleet');
    } finally {
      setAddingAmbulance(false);
    }
  };

  const handleStatusChange = async (ambId, newStatus) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.ambulances.updateStatus(ambId, newStatus, token);
      toast.success('Ambulance status updated!');
      fetchHospitalData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const copyDriverLink = (driverToken, ambId) => {
    const fullUrl = `${window.location.origin}/driver/${driverToken || ambId}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Driver GPS Tracking link copied to clipboard!');
  };

  const hospitalName = hospital?.name || user?.hospital?.name || user?.name || 'Your Hospital';
  const activeHoldsCount = reservations.filter(r => r.status === 'reserved' || r.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5">
              Hospital Staff Portal
            </Badge>
            <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
              Verified Node
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1.5 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            {hospitalName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            📍 {hospital?.address || hospital?.city || 'India'} | Real-time bed availability & emergency controls
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setScanModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm text-xs"
          >
            <QrCode className="h-4 w-4" />
            Scan Patient QR Pass
          </Button>

          <Button onClick={fetchHospitalData} disabled={loading} variant="outline" className="gap-2 text-xs">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Quick Overview Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="bg-card border-red-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ICU Beds</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-red-600">{bedsForm.icuAvailable} <span className="text-xs text-muted-foreground font-normal">/ {bedsForm.icuTotal}</span></h3>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600">
              <Heart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-blue-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">General Beds</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-blue-600">{bedsForm.generalAvailable} <span className="text-xs text-muted-foreground font-normal">/ {bedsForm.generalTotal}</span></h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Bed className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-cyan-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ventilators</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-cyan-600">{bedsForm.ventilatorAvailable} <span className="text-xs text-muted-foreground font-normal">/ {bedsForm.ventilatorTotal}</span></h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600">
              <Wind className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-amber-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Patient Holds</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-amber-600">{activeHoldsCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CLEAN SUB-TAB NAVIGATION BAR */}
      <Tabs defaultValue="inventory" value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="inventory" className="gap-2 font-bold text-xs py-2 data-[state=active]:bg-background shadow-xs">
            <Save className="h-3.5 w-3.5 text-primary" />
            Bed Inventory Controls
          </TabsTrigger>
          <TabsTrigger value="holds" className="gap-2 font-bold text-xs py-2 data-[state=active]:bg-background shadow-xs relative">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Patient Bed Holds
            {activeHoldsCount > 0 && (
              <Badge className="ml-1 bg-amber-600 text-white text-[10px] px-1.5 py-0 rounded-full">
                {activeHoldsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ambulances" className="gap-2 font-bold text-xs py-2 data-[state=active]:bg-background shadow-xs">
            <Siren className="h-3.5 w-3.5 text-amber-600" />
            Ambulance Fleet ({ambulances.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BED INVENTORY CONTROLS */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Live Bed Inventory Controls
              </CardTitle>
              <CardDescription className="text-xs">
                Update your hospital's bed availability. Changes broadcast live instantly to patients and emergency services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateBeds} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* ICU Section */}
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <h4 className="font-bold text-sm text-foreground">ICU Beds</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Available ICU Beds</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.icuAvailable}
                        onChange={(e) => setBedsForm({ ...bedsForm, icuAvailable: e.target.value })}
                        className="font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Total ICU Capacity</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.icuTotal}
                        onChange={(e) => setBedsForm({ ...bedsForm, icuTotal: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* General Section */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-blue-600" />
                      <h4 className="font-bold text-sm text-foreground">General Beds</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Available General Beds</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.generalAvailable}
                        onChange={(e) => setBedsForm({ ...bedsForm, generalAvailable: e.target.value })}
                        className="font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Total General Capacity</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.generalTotal}
                        onChange={(e) => setBedsForm({ ...bedsForm, generalTotal: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Ventilator Section */}
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-600" />
                      <h4 className="font-bold text-sm text-foreground">Ventilators</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Available Ventilators</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.ventilatorAvailable}
                        onChange={(e) => setBedsForm({ ...bedsForm, ventilatorAvailable: e.target.value })}
                        className="font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Total Ventilator Units</label>
                      <Input
                        type="number"
                        min="0"
                        value={bedsForm.ventilatorTotal}
                        onChange={(e) => setBedsForm({ ...bedsForm, ventilatorTotal: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updatingBeds} size="lg" className="gap-2 font-bold px-8">
                    {updatingBeds ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save & Broadcast Live Updates
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INCOMING PATIENT BED HOLDS */}
        <TabsContent value="holds" className="space-y-4">
          <Card className="border-amber-500/30 bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600 animate-pulse" />
                  <CardTitle className="text-lg font-bold">Incoming Patient Bed Holds (10-Min Concurrency Lock)</CardTitle>
                  <Badge className="bg-amber-600 text-white text-xs">{activeHoldsCount} Active Holds</Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Real-time patient bed holds placed via SwasthyaSetu. Scan patient QR code or click Admit to confirm arrival.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setScanModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shrink-0"
              >
                <QrCode className="h-4 w-4" />
                Scan Patient QR Pass
              </Button>
            </CardHeader>

            <CardContent>
              {reservations.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <Zap className="h-8 w-8 mx-auto text-amber-500/40" />
                  <p className="font-semibold text-foreground">No Incoming Patient Bed Holds</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    When a patient holds an emergency bed at {hospitalName}, their contact details, bed type, and live 10-min countdown timer will appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.map((resv) => {
                    const isReserved = resv.status === 'reserved' || resv.status === 'active';
                    const isConfirmed = resv.status === 'confirmed';
                    const isDischarged = resv.status === 'discharged';
                    const isReleased = resv.status === 'released' || resv.status === 'expired';

                    return (
                      <div
                        key={resv._id || resv.reservationCode}
                        className={cn(
                          'flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs transition-all',
                          isReserved && 'border-amber-500/40 bg-amber-500/5',
                          isConfirmed && 'border-emerald-500/30 bg-emerald-500/5',
                          isDischarged && 'border-blue-500/20 bg-blue-500/5',
                          isReleased && 'border-slate-200 opacity-60'
                        )}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-muted border text-foreground">
                              {resv.reservationCode}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-extrabold uppercase',
                                isReserved && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                                isConfirmed && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                                isDischarged && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                                isReleased && 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                              )}
                            >
                              {resv.status?.toUpperCase() || 'HOLD'}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                              {(resv.bedType || 'ICU').toUpperCase()} BED
                            </Badge>
                          </div>

                          <p className="text-xs text-foreground font-semibold">
                            👤 Patient: <strong className="text-foreground">{resv.patientName}</strong> | 📞 Mobile: <strong>+91-{resv.contactPhone}</strong>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            📅 Placed: {new Date(resv.createdAt || Date.now()).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isReserved && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmAdmission(resv.reservationCode)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-8"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Admit Patient
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReleaseHold(resv.reservationCode)}
                                className="text-xs font-semibold border-red-500/30 text-red-600 hover:bg-red-50 h-8 gap-1.5"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Release Hold
                              </Button>
                            </>
                          )}
                          {isConfirmed && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1">
                                ✔ Admitted
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDischargePatient(resv.reservationCode, resv.bedType)}
                                className="text-xs font-bold border-blue-500/30 text-blue-600 hover:bg-blue-50 h-8 gap-1.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Discharge & Free Bed
                              </Button>
                            </div>
                          )}
                          {isDischarged && (
                            <Badge variant="outline" className="text-xs font-bold border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                              🏥 Cured & Discharged (+1 Bed Restored)
                            </Badge>
                          )}
                          {isReleased && (
                            <Badge variant="outline" className="text-xs font-semibold text-slate-500">
                              Released / Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AMBULANCE FLEET CONTROL */}
        <TabsContent value="ambulances" className="space-y-4">
          <Card className="border-amber-500/30 bg-card shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Siren className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg font-bold">Hospital Ambulance Fleet Control</CardTitle>
                  <Badge className="bg-amber-600 text-white text-xs">{ambulances.length} Vehicles</Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Register and manage your hospital's ambulance fleet. Share location links with drivers to broadcast live GPS location.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-semibold shrink-0"
              >
                <Plus className="h-4 w-4" />
                {showAddForm ? 'Cancel Add' : 'Register New Ambulance'}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Add Ambulance Form */}
              {showAddForm && (
                <form onSubmit={handleAddAmbulance} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    🚑 Add New Ambulance to {hospitalName}
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Vehicle Reg Number *</label>
                      <Input
                        required
                        placeholder="e.g. DL-01-AMB-108"
                        value={ambForm.vehicleNumber}
                        onChange={(e) => setAmbForm({ ...ambForm, vehicleNumber: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Driver Name *</label>
                      <Input
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={ambForm.driverName}
                        onChange={(e) => setAmbForm({ ...ambForm, driverName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Driver Phone Number *</label>
                      <Input
                        required
                        placeholder="e.g. +91-9876543210"
                        value={ambForm.driverPhone}
                        onChange={(e) => setAmbForm({ ...ambForm, driverPhone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Equipment Level</label>
                      <Select
                        value={ambForm.equipmentLevel}
                        onValueChange={(val) => setAmbForm({ ...ambForm, equipmentLevel: val })}
                      >
                        <SelectTrigger className="w-full text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALS Ambulance (Advanced Life Support)">ALS (Advanced Life Support)</SelectItem>
                          <SelectItem value="BLS Ambulance (Basic Life Support)">BLS (Basic Life Support)</SelectItem>
                          <SelectItem value="ICU Mobile Unit">ICU Mobile Unit</SelectItem>
                          <SelectItem value="Patient Transport">Patient Transport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={addingAmbulance} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5">
                      {addingAmbulance ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Register & Generate Driver Link
                    </Button>
                  </div>
                </form>
              )}

              {/* Live Uber-Style Fleet Tracking Map for Hospital Admin */}
              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                    <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                    Live Fleet Tracking Radar & Uber-style Navigation Map
                  </h4>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">LIVE GPS STREAM</Badge>
                </div>
                <HospitalMap 
                  hospitals={hospital ? [hospital] : []}
                  selectedHospital={hospital}
                  userLocation={hospital?.coordinates ? { lat: hospital.coordinates.lat, lng: hospital.coordinates.lng } : null}
                  ambulances={ambulances}
                />
              </div>

              {/* Ambulances List */}
              {ambulances.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <Siren className="h-8 w-8 mx-auto text-amber-500/50" />
                  <p className="font-semibold text-foreground">No Ambulances Registered Yet</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Click <strong>"Register New Ambulance"</strong> above to add your hospital's emergency response vehicles and get live GPS driver tracking links.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ambulances.map((amb) => {
                    const ambId = amb._id || amb.id;
                    return (
                      <div key={ambId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">🚑 {amb.vehicleNumber}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold',
                                amb.status === 'available'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : amb.status === 'busy'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                              )}
                            >
                              {(amb.status || 'available').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Driver: <strong>{amb.driverName}</strong> | 📞 {amb.driverPhone} | Type: {amb.equipmentLevel || 'ALS'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={amb.status || 'available'}
                            onValueChange={(newStatus) => handleStatusChange(ambId, newStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs font-semibold">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">🟢 Available</SelectItem>
                              <SelectItem value="busy">🟡 On Emergency</SelectItem>
                              <SelectItem value="maintenance">🔴 Maintenance</SelectItem>
                              <SelectItem value="offline">⚪ Offline</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold gap-1"
                            onClick={() => copyDriverLink(amb.driverToken, ambId)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy Driver GPS Link
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-primary gap-1"
                            onClick={() => window.open(`/driver/${amb.driverToken || ambId}`, '_blank')}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Portal
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 📷 INSTANT PATIENT QR PASS SCANNER MODAL WITH HTML5 QR CODE */}
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-emerald-600 font-extrabold">
              <QrCode className="h-6 w-6 text-emerald-600" />
              Instant Patient QR Pass Scanner
            </DialogTitle>
            <DialogDescription className="text-xs">
              Point camera at patient's digital QR ticket or printed PDF pass to confirm bed admission instantly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScanSubmit} className="space-y-4 py-2">
            {/* HTML5 Live Camera QR Scanner Feed */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black min-h-[220px]">
              <div id="qr-reader" className="w-full text-white" />

              {cameraError && (
                <div className="p-6 text-center space-y-2 text-white/80">
                  <VideoOff className="h-10 w-10 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-amber-300 max-w-xs mx-auto">
                    Camera Access Notice
                  </p>
                  <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Scan Payload / Reservation Code *</label>
              <Input
                autoFocus
                placeholder="e.g. SS-HOLD-353619"
                className="font-mono text-center text-lg font-black tracking-widest uppercase h-12 border-emerald-500/40 focus:ring-emerald-500"
                value={scannedCodeInput}
                onChange={(e) => setScannedCodeInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setScanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isVerifyingScan} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs">
                {isVerifyingScan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Verify Pass & Admit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

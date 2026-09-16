import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Bed,
  Heart,
  Wind,
  RefreshCw,
  Save,
  Siren,
  Zap,
  QrCode,
  UserPlus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { connectSocket, getSocket, joinHospitalRoom } from '@/lib/socket';
import { toast } from 'sonner';

import {
  BedInventoryManager,
  PatientReservationsTable,
  AdmissionQrScannerModal,
  AmbulanceFleetManager,
  RequestBedUpgradeModal,
  WalkinAdmissionModal,
  PatientCaseSheetModal
} from '@/components/admin/dashboard';


export default function HospitalAdminDashboard() {
  const { user } = useAuth();
  const rawHosp = user?.hospitalId || user?.hospital;
  const hospitalId = typeof rawHosp === 'object' && rawHosp !== null
    ? String(rawHosp._id || rawHosp.id || '')
    : (rawHosp ? String(rawHosp) : '');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = (searchParams.get('tab') || 'inventory').toLowerCase();
  const activeTab = (rawTab === 'reservations' || rawTab === 'holds' || rawTab === 'patient-holds')
    ? 'holds'
    : (rawTab === 'fleet' || rawTab === 'ambulances')
      ? 'ambulances'
      : 'inventory';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab === 'holds' ? 'reservations' : newTab === 'ambulances' ? 'fleet' : 'inventory' });
  };
  
  const [hospital, setHospital] = useState(() => user?.hospital || null);
  const [ambulances, setAmbulances] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingBeds, setUpdatingBeds] = useState(false);
  const [addingAmbulance, setAddingAmbulance] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Instant QR Scanner Modal State
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [isVerifyingScan, setIsVerifyingScan] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Direct Walk-In Offline Emergency Admission Modal State
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);

  // Emergency Patient Case Sheet & Doctor Allotment Modal State
  const [caseSheetModalOpen, setCaseSheetModalOpen] = useState(false);
  const [selectedCaseReservation, setSelectedCaseReservation] = useState(null);

  // Bed Capacity Upgrade Modal & State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [pendingUpgradeRequest, setPendingUpgradeRequest] = useState(null);

  const [bedsForm, setBedsForm] = useState(() => ({
    icuAvailable: user?.hospital?.beds?.icu?.available ?? 0,
    icuTotal: user?.hospital?.beds?.icu?.total ?? 0,
    generalAvailable: user?.hospital?.beds?.general?.available ?? 0,
    generalTotal: user?.hospital?.beds?.general?.total ?? 0,
    ventilatorAvailable: user?.hospital?.beds?.ventilator?.available ?? 0,
    ventilatorTotal: user?.hospital?.beds?.ventilator?.total ?? 0,
  }));

  const [ambForm, setAmbForm] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    equipmentLevel: 'ALS Ambulance (Advanced Life Support)'
  });

  // Sync hospital from auth if loaded
  useEffect(() => {
    if (user?.hospital && (!hospital || !hospital.beds)) {
      setHospital(user.hospital);
      if (user.hospital.beds) {
        setBedsForm({
          icuAvailable: user.hospital.beds.icu?.available ?? 0,
          icuTotal: user.hospital.beds.icu?.total ?? 0,
          generalAvailable: user.hospital.beds.general?.available ?? 0,
          generalTotal: user.hospital.beds.general?.total ?? 0,
          ventilatorAvailable: user.hospital.beds.ventilator?.available ?? 0,
          ventilatorTotal: user.hospital.beds.ventilator?.total ?? 0,
        });
      }
    }
  }, [user]);

  const fetchHospitalData = async (showLoading = false) => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [hospRes, ambRes, resvRes, upgradesRes] = await Promise.all([
        api.hospitals.getById(hospitalId).catch(() => null),
        api.ambulances.getByHospital(hospitalId, token).catch(() => ({ ambulances: [] })),
        api.hospitals.getReservations(hospitalId, token).catch(() => ({ reservations: [] })),
        api.hospitals.getHospitalBedUpgrades(hospitalId, token).catch(() => ({ requests: [] }))
      ]);

      const h = hospRes?.hospital || hospRes;
      if (h && (h._id || h.id || h.name)) {
        setHospital(h);
        if (h.beds) {
          setBedsForm({
            icuAvailable: h.beds.icu?.available ?? 0,
            icuTotal: h.beds.icu?.total ?? 0,
            generalAvailable: h.beds.general?.available ?? 0,
            generalTotal: h.beds.general?.total ?? 0,
            ventilatorAvailable: h.beds.ventilator?.available ?? 0,
            ventilatorTotal: h.beds.ventilator?.total ?? 0,
          });
        }
      }
      setAmbulances(ambRes?.ambulances || []);
      if (Array.isArray(resvRes?.reservations)) {
        setReservations(resvRes.reservations);
      }

      const pendingReq = (upgradesRes?.requests || []).find(r => r.status === 'pending');
      setPendingUpgradeRequest(pendingReq || null);
    } catch (err) {
      console.error('Error fetching hospital admin details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBedUpgrade = async (data) => {
    const token = localStorage.getItem('swasthya_setu_token') || user?.token;
    await api.hospitals.requestBedUpgrade(hospitalId, data, token);
    fetchHospitalData(false);
  };

  useEffect(() => {
    fetchHospitalData(true);
  }, [hospitalId]);

  // Real-time WebSocket listening for incoming patient bed holds & ambulance updates
  useEffect(() => {
    const token = localStorage.getItem('swasthya_setu_token') || user?.token;
    connectSocket(token);

    if (hospitalId) {
      joinHospitalRoom(hospitalId);
    }

    const s = getSocket();

    const playAlertChime = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}
    };

    const seenAlerts = new Set();

    const handleBedHoldAlert = (data) => {
      console.log('🚨 [HospitalAdminDashboard] Received live bed hold alert:', data);
      if (!data) return;

      const code = String(data.reservationCode || data.reservationId || '');
      if (code) {
        if (seenAlerts.has(code)) {
          console.log(`[HospitalAdminDashboard] Skipping duplicate hold alert for ticket ${code}`);
          return;
        }
        seenAlerts.add(code);
      }

      const cleanIncomingHosp = String(data.hospitalId || '');
      const cleanMyHosp = String(hospitalId || '');

      // Check if alert belongs to this hospital or if user is superadmin
      if (!cleanMyHosp || !cleanIncomingHosp || cleanIncomingHosp === cleanMyHosp || user?.role === 'superadmin') {
        // 1. Instant 0ms optimistic injection of ticket into table!
        setReservations(prev => {
          if (prev.some(r => r.reservationCode === code)) return prev;
          const newReservation = {
            _id: data.reservationId || `resv_${Date.now()}`,
            reservationCode: data.reservationCode,
            patientName: data.patientName || 'Emergency Patient',
            contactPhone: data.contactPhone || 'N/A',
            bedType: data.bedType || 'icu',
            status: data.status || 'reserved',
            createdAt: data.createdAt || new Date().toISOString(),
            expiresAt: data.expiresAt || new Date(Date.now() + 600000).toISOString()
          };
          return [newReservation, ...prev];
        });

        // 2. Background server reconciliation (bed counts are updated authoritatively via handleBedUpdate)
        fetchHospitalData(false);
      }
    };

    const handleReservationStatusChange = (data) => {
      console.log('⚡ [HospitalAdminDashboard] Reservation status change received:', data);
      if (data?.reservationCode && data?.status) {
        setReservations(prev => prev.map(r => {
          if (r.reservationCode === data.reservationCode) {
            return { ...r, status: data.status };
          }
          return r;
        }));
      }
      fetchHospitalData(false);
    };

    const handleBedUpdate = (data) => {
      if (!data || !data.hospitalId) return;
      if (String(data.hospitalId) === String(hospitalId)) {
        if (data.beds) {
          setHospital(prev => prev ? { ...prev, beds: { ...prev.beds, ...data.beds } } : prev);
          setBedsForm({
            icuAvailable: data.beds.icu?.available ?? 0,
            icuTotal: data.beds.icu?.total ?? 0,
            generalAvailable: data.beds.general?.available ?? 0,
            generalTotal: data.beds.general?.total ?? 0,
            ventilatorAvailable: data.beds.ventilator?.available ?? 0,
            ventilatorTotal: data.beds.ventilator?.total ?? 0,
          });
        }
      }
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

    const handleCustomAdminHold = (e) => {
      if (e?.detail) handleBedHoldAlert(e.detail);
    };
    window.addEventListener('swasthya_admin_bed_hold', handleCustomAdminHold);

    s.on('hospital-bed-hold', handleBedHoldAlert);
    s.on('reservation-status-updated', handleReservationStatusChange);
    s.on('bed-update', handleBedUpdate);
    s.on('ambulance-updates', handleAmbulanceUpdate);
    s.on('hospital-ambulance-update', handleAmbulanceUpdate);

    return () => {
      window.removeEventListener('swasthya_admin_bed_hold', handleCustomAdminHold);
      s.off('hospital-bed-hold', handleBedHoldAlert);
      s.off('reservation-status-updated', handleReservationStatusChange);
      s.off('bed-update', handleBedUpdate);
      s.off('ambulance-updates', handleAmbulanceUpdate);
      s.off('hospital-ambulance-update', handleAmbulanceUpdate);
    };
  }, [hospitalId, user?.token, user?.role]);

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    if (!hospitalId) return;

    const icuAvail = Number(bedsForm.icuAvailable) || 0;
    const icuTotal = Number(bedsForm.icuTotal) || 0;
    const genAvail = Number(bedsForm.generalAvailable) || 0;
    const genTotal = Number(bedsForm.generalTotal) || 0;
    const ventAvail = Number(bedsForm.ventilatorAvailable) || 0;
    const ventTotal = Number(bedsForm.ventilatorTotal) || 0;

    if (icuAvail > icuTotal) {
      toast.error(`Available ICU beds (${icuAvail}) cannot exceed verified capacity (${icuTotal})`);
      return;
    }
    if (genAvail > genTotal) {
      toast.error(`Available General beds (${genAvail}) cannot exceed verified capacity (${genTotal})`);
      return;
    }
    if (ventAvail > ventTotal) {
      toast.error(`Available Ventilators (${ventAvail}) cannot exceed verified capacity (${ventTotal})`);
      return;
    }

    setUpdatingBeds(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const bedsPayload = {
        icu: { available: icuAvail, total: icuTotal },
        general: { available: genAvail, total: genTotal },
        ventilator: { available: ventAvail, total: ventTotal }
      };

      const res = await api.hospitals.updateBeds(hospitalId, bedsPayload, token);
      const updatedH = res?.hospital;
      if (updatedH) {
        setHospital(updatedH);
        if (updatedH.beds) {
          setBedsForm({
            icuAvailable: updatedH.beds.icu?.available ?? 0,
            icuTotal: updatedH.beds.icu?.total ?? 0,
            generalAvailable: updatedH.beds.general?.available ?? 0,
            generalTotal: updatedH.beds.general?.total ?? 0,
            ventilatorAvailable: updatedH.beds.ventilator?.available ?? 0,
            ventilatorTotal: updatedH.beds.ventilator?.total ?? 0,
          });
        }
      }
      toast.success('Hospital bed availability updated live across network!');
      fetchHospitalData();
    } catch (err) {
      toast.error(err.message || err.error || 'Failed to update bed inventory');
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

  const handleWalkinAdmission = async (formData) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const res = await api.hospitals.createWalkinAdmission(hospitalId, formData, token);
      if (res?.success) {
        toast.success(`Direct walk-in admission confirmed for ${formData.patientName}! Slip Code: ${res.reservation?.reservationCode}`);
        fetchHospitalData();
      }
      return res;
    } catch (err) {
      toast.error(err.message || err.error || 'Failed to complete direct walk-in admission');
      throw err;
    }
  };

  const handleOpenCaseSheet = (resv) => {
    setSelectedCaseReservation(resv);
    setCaseSheetModalOpen(true);
  };

  const handleSaveCaseSheet = async (code, formData) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const res = await api.hospitals.updateCaseSheet(code, formData, token);
      fetchHospitalData();
      return res;
    } catch (err) {
      console.error('Error saving case sheet:', err);
      throw err;
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

  const copyDriverLink = (ambId) => {
    const link = `${window.location.origin}/driver/${ambId}`;
    navigator.clipboard.writeText(link);
    toast.success('Driver live GPS tracking link copied to clipboard!');
  };

  if (loading && !hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Connecting to hospital terminal...</p>
      </div>
    );
  }

  const hospitalName = hospital?.name || user?.name || 'Hospital Terminal';
  const activeHoldsCount = reservations.filter(r => r.status === 'reserved' || r.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Hospital Name & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">LIVE SYSTEM OPERATIONAL</span>
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => setWalkinModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-sm text-xs"
          >
            <UserPlus className="h-4 w-4" />
            + Direct Walk-In (ऑफलाइन भर्ती)
          </Button>

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

        <Card className="bg-card border-purple-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ventilators</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-purple-600">{bedsForm.ventilatorAvailable} <span className="text-xs text-muted-foreground font-normal">/ {bedsForm.ventilatorTotal}</span></h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <Wind className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-amber-500/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Patient Holds</p>
              <h3 className="text-2xl font-extrabold mt-0.5 text-amber-600">{activeHoldsCount} <span className="text-xs text-muted-foreground font-normal">10-min locks</span></h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS CONTAINER */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 border">
          <TabsTrigger value="inventory" className="gap-2 font-bold text-xs py-2 data-[state=active]:bg-background shadow-xs">
            <Bed className="h-3.5 w-3.5 text-primary" />
            Live Bed Inventory
          </TabsTrigger>
          <TabsTrigger value="holds" className="gap-2 font-bold text-xs py-2 data-[state=active]:bg-background shadow-xs relative">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            Patient Holds
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
          <BedInventoryManager
            bedsForm={bedsForm}
            setBedsForm={setBedsForm}
            updatingBeds={updatingBeds}
            onUpdateBeds={handleUpdateBeds}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            pendingUpgradeRequest={pendingUpgradeRequest}
          />
        </TabsContent>

        {/* TAB 2: INCOMING PATIENT BED HOLDS */}
        <TabsContent value="holds" className="space-y-4">
          <PatientReservationsTable
            reservations={reservations}
            activeHoldsCount={activeHoldsCount}
            hospitalName={hospitalName}
            hospital={hospital}
            onOpenScanModal={() => setScanModalOpen(true)}
            onOpenWalkinModal={() => setWalkinModalOpen(true)}
            onOpenCaseSheet={handleOpenCaseSheet}
            onConfirmAdmission={handleConfirmAdmission}
            onReleaseHold={handleReleaseHold}
            onDischargePatient={handleDischargePatient}
          />
        </TabsContent>

        {/* TAB 3: AMBULANCE FLEET CONTROL */}
        <TabsContent value="ambulances" className="space-y-4">
          <AmbulanceFleetManager
            hospital={hospital}
            hospitalName={hospitalName}
            ambulances={ambulances}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            ambForm={ambForm}
            setAmbForm={setAmbForm}
            addingAmbulance={addingAmbulance}
            onAddAmbulance={handleAddAmbulance}
            onStatusChange={handleStatusChange}
            onCopyDriverLink={copyDriverLink}
          />
        </TabsContent>
      </Tabs>

      {/* DIRECT WALK-IN OFFLINE EMERGENCY ADMISSION MODAL */}
      <WalkinAdmissionModal
        open={walkinModalOpen}
        onOpenChange={setWalkinModalOpen}
        hospital={hospital}
        bedsForm={bedsForm}
        onSubmitWalkin={handleWalkinAdmission}
      />

      {/* INSTANT PATIENT QR PASS SCANNER MODAL */}
      <AdmissionQrScannerModal
        open={scanModalOpen}
        onOpenChange={setScanModalOpen}
        scannedCodeInput={scannedCodeInput}
        setScannedCodeInput={setScannedCodeInput}
        isVerifyingScan={isVerifyingScan}
        cameraError={cameraError}
        setCameraError={setCameraError}
        onAutoConfirmScan={handleAutoConfirmScan}
        onScanSubmit={handleScanSubmit}
      />

      {/* REQUEST BED CAPACITY UPGRADE MODAL */}
      <RequestBedUpgradeModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
        hospital={hospital}
        onSubmitUpgrade={handleSubmitBedUpgrade}
      />

      {/* EMERGENCY PATIENT CASE SHEET & DOCTOR ALLOTMENT MODAL */}
      <PatientCaseSheetModal
        open={caseSheetModalOpen}
        onOpenChange={setCaseSheetModalOpen}
        reservation={selectedCaseReservation}
        hospital={hospital}
        onSaveCaseSheet={handleSaveCaseSheet}
      />
    </div>
  );
}

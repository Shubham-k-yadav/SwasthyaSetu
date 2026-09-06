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
  QrCode
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
  AmbulanceFleetManager
} from '@/components/admin/dashboard';

export default function HospitalAdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || user?.hospital?._id || user?.hospital;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inventory';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
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

  // Real-time WebSocket listening for incoming patient bed holds & ambulance updates
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

      {/* SUB-TAB NAVIGATION BAR */}
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
          <BedInventoryManager
            bedsForm={bedsForm}
            setBedsForm={setBedsForm}
            updatingBeds={updatingBeds}
            onUpdateBeds={handleUpdateBeds}
          />
        </TabsContent>

        {/* TAB 2: INCOMING PATIENT BED HOLDS */}
        <TabsContent value="holds" className="space-y-4">
          <PatientReservationsTable
            reservations={reservations}
            activeHoldsCount={activeHoldsCount}
            hospitalName={hospitalName}
            onOpenScanModal={() => setScanModalOpen(true)}
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
    </div>
  );
}

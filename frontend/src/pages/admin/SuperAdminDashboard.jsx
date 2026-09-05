import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Droplets,
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Siren,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

import { connectSocket, getSocket, onRegistrationRequest } from '@/lib/socket';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    verifiedHospitalsCount: 0,
    verifiedBloodBanksCount: 0,
    verifiedAmbulancesCount: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [pendingBloodBanks, setPendingBloodBanks] = useState([]);
  const [pendingAmbulances, setPendingAmbulances] = useState([]);
  const [pendingTab, setPendingTab] = useState('hospitals');
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState(null);

  const fetchStatusAndQueues = async () => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [sysStatus, hospQueue, bbQueue, ambQueue] = await Promise.all([
        api.system?.getStatus?.().catch(() => null),
        api.hospitals.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.bloodbanks.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.ambulances.getPendingQueue(token).catch(() => ({ queue: [] }))
      ]);

      const hospList = hospQueue?.queue || hospQueue || [];
      const bbList = bbQueue?.queue || bbQueue || [];
      const ambList = ambQueue?.queue || ambQueue || [];

      setPendingHospitals(hospList);
      setPendingBloodBanks(bbList);
      setPendingAmbulances(ambList);

      if (sysStatus) {
        setStats({
          verifiedHospitalsCount: Number(sysStatus.verifiedHospitalsCount || 0),
          verifiedBloodBanksCount: Number(sysStatus.verifiedBloodBanksCount || 0),
          verifiedAmbulancesCount: Number(sysStatus.verifiedAmbulancesCount || 0),
        });
      } else {
        // Fetch active lists over public API as robust fallback
        const [hRes, bRes, aRes] = await Promise.all([
          api.hospitals.getAll().catch(() => ({ hospitals: [] })),
          api.bloodbanks.getAll().catch(() => ({ bloodBanks: [] })),
          api.ambulances.getActive().catch(() => ({ ambulances: [] }))
        ]);

        setStats({
          verifiedHospitalsCount: Number((hRes?.hospitals || hRes || []).length || 0),
          verifiedBloodBanksCount: Number((bRes?.bloodBanks || bRes || []).length || 0),
          verifiedAmbulancesCount: Number((aRes?.ambulances || aRes || []).length || 0),
        });
      }
    } catch (err) {
      console.error('Error loading Super Admin dashboard:', err);
    }
  };

  useEffect(() => {
    connectSocket();
    fetchStatusAndQueues();

    const handleNewRequest = (data) => {
      toast.warning(`🔔 New Registration Request: ${data.name} (${data.type.toUpperCase()}) from ${data.city} is waiting for your approval!`, {
        duration: 10000
      });
      fetchStatusAndQueues();
    };

    onRegistrationRequest(handleNewRequest);

    return () => {
      try {
        getSocket().off('new-registration-request', handleNewRequest);
      } catch (err) {}
    };
  }, [user]);

  const handleVerifyHospital = async (id) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.hospitals.verify(id, token);
      toast.success('Hospital verified and activated on live network!');
      fetchStatusAndQueues();
    } catch (err) {
      toast.error('Failed to verify hospital');
    }
  };

  const handleVerifyBloodBank = async (id) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.bloodbanks.verify(id, token);
      toast.success('Blood bank verified successfully!');
      fetchStatusAndQueues();
    } catch (err) {
      toast.error('Failed to verify blood bank');
    }
  };

  const handleVerifyAmbulance = async (id) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const res = await api.ambulances.verify(id, token);
      toast.success(`Ambulance verified! Driver Link: ${res.driverLink || '/driver/' + id}`);
      fetchStatusAndQueues();
    } catch (err) {
      toast.error('Failed to verify ambulance');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatusAndQueues();
    setIsRefreshing(false);
  };

  const totalPendingCount = pendingHospitals.length + pendingBloodBanks.length + pendingAmbulances.length;

  return (
    <div className="space-y-8">
      {/* Super Admin Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5">
              Super Admin Control Room
            </Badge>
            <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
              Pan-India Live Node
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">
            National Emergency Network Control Room
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time verification queue & pan-India emergency network governance
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2 shrink-0">
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh Network Data
        </Button>
      </div>

      {/* Network Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-primary/20 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Hospitals</p>
              <h3 className="text-3xl font-extrabold mt-1 text-primary">{stats.verifiedHospitalsCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified & Active</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-emerald-500/20 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Blood Banks</p>
              <h3 className="text-3xl font-extrabold mt-1 text-emerald-600">{stats.verifiedBloodBanksCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified & Active</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Droplets className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-red-500/20 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Ambulances</p>
              <h3 className="text-3xl font-extrabold mt-1 text-red-600">{stats.verifiedAmbulancesCount}</h3>
              <p className="text-[11px] text-red-600 font-medium mt-0.5">GPS Live Tracking</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
              <Siren className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-amber-500/20 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-3xl font-extrabold mt-1 text-amber-600">{totalPendingCount}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Action Required</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Super Admin Verification Queue */}
      <Card className="border-amber-500/30 bg-amber-500/5 shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Facility & Transport Verification Queue</CardTitle>
              {totalPendingCount > 0 && (
                <Badge className="bg-amber-600 text-white font-bold text-xs">{totalPendingCount} New</Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              Review and approve newly registered hospitals, blood banks, and ambulance operators in 1-click
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border">
            <Button
              size="sm"
              variant={pendingTab === 'hospitals' ? 'default' : 'ghost'}
              className="h-7 text-xs px-3 font-semibold"
              onClick={() => setPendingTab('hospitals')}
            >
              Hospitals ({pendingHospitals.length})
            </Button>
            <Button
              size="sm"
              variant={pendingTab === 'bloodbanks' ? 'default' : 'ghost'}
              className="h-7 text-xs px-3 font-semibold"
              onClick={() => setPendingTab('bloodbanks')}
            >
              Blood Banks ({pendingBloodBanks.length})
            </Button>
            <Button
              size="sm"
              variant={pendingTab === 'ambulances' ? 'default' : 'ghost'}
              className="h-7 text-xs px-3 font-semibold"
              onClick={() => setPendingTab('ambulances')}
            >
              Ambulances ({pendingAmbulances.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {pendingTab === 'hospitals' && (
            pendingHospitals.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500" />
                <p className="font-semibold text-foreground">All Hospital Applications Approved</p>
                <p>No pending hospital onboarding requests in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingHospitals.map((h) => (
                  <div key={h._id || h.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card rounded-xl border shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">{h.name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">📍 {h.city}, {h.state || 'India'} | 📞 {h.phone} | 🔑 {h.adminEmail || h.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setSelectedHospitalForDetails(h)}
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0"
                        onClick={() => handleVerifyHospital(h._id || h.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Verify & Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {pendingTab === 'bloodbanks' && (
            pendingBloodBanks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500" />
                <p className="font-semibold text-foreground">All Blood Bank Applications Approved</p>
                <p>No pending blood bank onboarding requests in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBloodBanks.map((bb) => (
                  <div key={bb._id || bb.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card rounded-xl border shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">🩸 {bb.name}</h4>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">📍 {bb.city}, {bb.state || 'India'} | 🔑 {bb.adminEmail} | 📜 License: {bb.licenseNumber}</p>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0" onClick={() => handleVerifyBloodBank(bb._id || bb.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verify & Approve
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}

          {pendingTab === 'ambulances' && (
            pendingAmbulances.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500" />
                <p className="font-semibold text-foreground">All Ambulance Applications Approved</p>
                <p>No pending ambulance onboarding requests in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAmbulances.map((amb) => (
                  <div key={amb._id || amb.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card rounded-xl border shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">🚑 {amb.vehicleNumber}</h4>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Driver: {amb.driverName} | 📞 {amb.driverPhone} | Hospital: {amb.hospitalName || 'Independent Operator'}</p>
                    </div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0" onClick={() => handleVerifyAmbulance(amb._id || amb.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verify & Generate Link
                    </Button>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Hospital Detailed Inspection Modal */}
      <Dialog open={!!selectedHospitalForDetails} onOpenChange={(open) => !open && setSelectedHospitalForDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedHospitalForDetails && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">
                        {selectedHospitalForDetails.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Hospital Infrastructure & Verification Application Review
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 capitalize font-bold">
                    {selectedHospitalForDetails.verificationStatus || 'Pending'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* General Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Facility Type</span>
                    <span className="font-semibold capitalize text-foreground">
                      {selectedHospitalForDetails.type || 'Private Hospital'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Registration / License No.</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedHospitalForDetails.registrationNumber || selectedHospitalForDetails.licenseNumber || 'HFR-SYSTEM-PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Contact Phone</span>
                    <span className="font-semibold text-foreground">
                      📞 {selectedHospitalForDetails.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Admin / Official Email</span>
                    <span className="font-semibold text-foreground">
                      ✉️ {selectedHospitalForDetails.adminEmail || selectedHospitalForDetails.email || 'N/A'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Complete Physical Address</span>
                    <span className="text-foreground font-medium">
                      📍 {selectedHospitalForDetails.address}, {selectedHospitalForDetails.city}, {selectedHospitalForDetails.state || 'India'}
                    </span>
                  </div>
                  {selectedHospitalForDetails.coordinates && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground block font-medium">GPS Coordinates (Live Map Node)</span>
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        Lat: {selectedHospitalForDetails.coordinates.lat}, Lng: {selectedHospitalForDetails.coordinates.lng}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bed Capacity Infrastructure */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Declared Bed Capacity Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">General Beds</span>
                      <span className="text-2xl font-black text-blue-600 block mt-0.5">
                        {selectedHospitalForDetails.beds?.general?.total || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospitalForDetails.beds?.general?.available || 0} Available
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">ICU Beds</span>
                      <span className="text-2xl font-black text-red-600 block mt-0.5">
                        {selectedHospitalForDetails.beds?.icu?.total || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospitalForDetails.beds?.icu?.available || 0} Available
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">Ventilators</span>
                      <span className="text-2xl font-black text-amber-600 block mt-0.5">
                        {selectedHospitalForDetails.beds?.ventilator?.total || 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospitalForDetails.beds?.ventilator?.available || 0} Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Departments & Medical Specialties
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(selectedHospitalForDetails.specialties) && selectedHospitalForDetails.specialties.length > 0 ? (
                      selectedHospitalForDetails.specialties.map((spec, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-medium px-2.5 py-1">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No specific departments declared</span>
                    )}
                  </div>
                </div>

                {/* Emergency Services */}
                <div className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                  <span className="font-semibold text-foreground">24/7 Emergency & Critical Care Status</span>
                  <Badge variant="outline" className={cn(
                    "font-bold text-[10px] px-2 py-0.5",
                    selectedHospitalForDetails.emergencyServices === true
                      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30"
                      : "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-500/30"
                  )}>
                    {selectedHospitalForDetails.emergencyServices === true ? '✓ 24/7 Emergency Enabled' : '✗ 24/7 Emergency Disabled'}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="border-t pt-4 flex sm:justify-between items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedHospitalForDetails(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  onClick={() => {
                    handleVerifyHospital(selectedHospitalForDetails._id || selectedHospitalForDetails.id);
                    setSelectedHospitalForDetails(null);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify & Approve Hospital
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const fetchStatusAndQueues = async () => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [sysStatus, hospQueue, bbQueue, ambQueue] = await Promise.all([
        api.system?.getStatus?.().catch(() => null),
        api.hospitals.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.bloodbanks.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.ambulances.getPendingQueue(token).catch(() => ({ queue: [] }))
      ]);

      if (sysStatus) {
        setStats({
          verifiedHospitalsCount: sysStatus.verifiedHospitalsCount || 0,
          verifiedBloodBanksCount: sysStatus.verifiedBloodBanksCount || 0,
          verifiedAmbulancesCount: sysStatus.verifiedAmbulancesCount || 0,
        });
      }
      setPendingHospitals(hospQueue?.queue || hospQueue || []);
      setPendingBloodBanks(bbQueue?.queue || bbQueue || []);
      setPendingAmbulances(ambQueue?.queue || ambQueue || []);
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
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0" onClick={() => handleVerifyHospital(h._id || h.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verify & Approve
                    </Button>
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
    </div>
  );
}

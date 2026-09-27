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
  Eye,
  MapPin,
  ExternalLink,
  Search,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [allBloodBanks, setAllBloodBanks] = useState([]);
  const [bloodBankSearch, setBloodBankSearch] = useState('');
  const [bloodBankCityFilter, setBloodBankCityFilter] = useState('all');
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState(null);
  const [selectedBloodBankForDetails, setSelectedBloodBankForDetails] = useState(null);

  const fetchStatusAndQueues = async () => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [sysStatus, hospQueue, bbQueue, ambQueue, allBbRes] = await Promise.all([
        api.system?.getStatus?.().catch(() => null),
        api.hospitals.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.bloodbanks.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.ambulances.getPendingQueue(token).catch(() => ({ queue: [] })),
        api.bloodbanks.getAll().catch(() => ({ bloodBanks: [] }))
      ]);

      const hospList = hospQueue?.queue || hospQueue || [];
      const bbList = bbQueue?.queue || bbQueue || [];
      const ambList = ambQueue?.queue || ambQueue || [];
      const allBanks = allBbRes?.bloodBanks || allBbRes || [];

      setPendingHospitals(hospList);
      setPendingBloodBanks(bbList);
      setPendingAmbulances(ambList);
      setAllBloodBanks(allBanks);

      if (sysStatus) {
        setStats({
          verifiedHospitalsCount: Number(sysStatus.verifiedHospitalsCount || 0),
          verifiedBloodBanksCount: allBanks.length || Number(sysStatus.verifiedBloodBanksCount || 0),
          verifiedAmbulancesCount: Number(sysStatus.verifiedAmbulancesCount || 0),
        });
      } else {
        // Fetch active lists over public API as robust fallback
        const [hRes, aRes] = await Promise.all([
          api.hospitals.getAll().catch(() => ({ hospitals: [] })),
          api.ambulances.getActive().catch(() => ({ ambulances: [] }))
        ]);

        setStats({
          verifiedHospitalsCount: Number((hRes?.hospitals || hRes || []).length || 0),
          verifiedBloodBanksCount: allBanks.length,
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

  const bloodBankCities = ['all', ...new Set(allBloodBanks.map(b => b.city).filter(Boolean))];

  const filteredAllBloodBanks = allBloodBanks.filter((bb) => {
    const q = bloodBankSearch.toLowerCase().trim();
    const matchesSearch = !q || (
      bb.name?.toLowerCase().includes(q) ||
      bb.city?.toLowerCase().includes(q) ||
      bb.state?.toLowerCase().includes(q) ||
      bb.licenseNumber?.toLowerCase().includes(q) ||
      bb.adminEmail?.toLowerCase().includes(q)
    );
    const matchesCity = bloodBankCityFilter === 'all' || bb.city?.toLowerCase() === bloodBankCityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

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

        <Card 
          className="bg-card border-emerald-500/20 shadow-xs cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all group"
          onClick={() => {
            const el = document.getElementById('all-blood-banks-directory-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Blood Banks</p>
              <h3 className="text-3xl font-extrabold mt-1 text-emerald-600">{stats.verifiedBloodBanksCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 group-hover:underline flex items-center gap-1">
                View All Blood Banks ↓
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
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
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={bb.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bb.name + ' ' + bb.city)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-muted font-medium text-muted-foreground hover:text-foreground h-8"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google Maps
                      </a>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0" onClick={() => handleVerifyBloodBank(bb._id || bb.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Verify & Approve
                      </Button>
                    </div>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${amb.currentLat || 25.4316},${amb.currentLng || 81.8520}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-muted font-medium text-muted-foreground hover:text-foreground h-8"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Live GPS
                      </a>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 shrink-0" onClick={() => handleVerifyAmbulance(amb._id || amb.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Verify & Generate Link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* All Registered Blood Banks Directory */}
      <Card id="all-blood-banks-directory-section" className="border-slate-200 dark:border-slate-800 shadow-sm scroll-mt-20">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3 border-b">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600">
                <Droplets className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg font-bold">
                National Blood Banks Directory
              </CardTitle>
              <Badge className="bg-red-600 text-white font-bold text-xs">
                {filteredAllBloodBanks.length} Facilities
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Live inventory overview and inspection of all approved blood banks and storage facilities
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search blood bank, city, license..."
                value={bloodBankSearch}
                onChange={(e) => setBloodBankSearch(e.target.value)}
                className="pl-8 h-8 w-48 sm:w-60 text-xs rounded-lg"
              />
              {bloodBankSearch && (
                <button
                  onClick={() => setBloodBankSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {bloodBankCities.length > 2 && (
              <select
                value={bloodBankCityFilter}
                onChange={(e) => setBloodBankCityFilter(e.target.value)}
                className="h-8 text-xs px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
              >
                <option value="all">All Cities</option>
                {bloodBankCities.filter(c => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <Link to="/admin/bloodbanks">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                <Building2 className="h-3.5 w-3.5 text-red-600" />
                Blood Banks Page
              </Button>
            </Link>

            <Link to="/admin/blood">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                <Droplets className="h-3.5 w-3.5 text-red-600" />
                Stock Table
              </Button>
            </Link>

            <a href="/blood" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                Public Finder
              </Button>
            </a>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {filteredAllBloodBanks.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Droplets className="h-8 w-8 mx-auto text-red-400 opacity-60" />
              <p className="font-semibold text-foreground text-sm">
                {allBloodBanks.length === 0 ? "No verified blood banks registered yet." : "No blood banks match your search criteria."}
              </p>
              {bloodBankSearch && (
                <Button variant="ghost" size="sm" onClick={() => setBloodBankSearch('')} className="text-xs text-primary">
                  Clear Search Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredAllBloodBanks.map((bb) => {
                const stockObj = bb.linkedBloodStockId?.bloodGroups || {};
                const stockEntries = Object.entries(stockObj);
                const totalUnits = stockEntries.reduce((sum, [, qty]) => sum + (Number(qty) || 0), 0);
                const mapUrl = bb.googleMapsUrl || (bb.coordinates?.lat && bb.coordinates?.lng
                  ? `https://www.google.com/maps/search/?api=1&query=${bb.coordinates.lat},${bb.coordinates.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((bb.name || '') + ' ' + (bb.city || ''))}`);

                return (
                  <div key={bb._id || bb.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    {/* Facility Info Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {bb.name}
                          </h4>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                          {bb.licenseNumber && (
                            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                              Lic: {bb.licenseNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{bb.address || `${bb.city}, ${bb.state || 'India'}`}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                          {bb.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {bb.phone}
                            </span>
                          )}
                          {bb.adminEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {bb.adminEmail}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200">
                          {totalUnits} Units Total
                        </Badge>
                      </div>
                    </div>

                    {/* 8 Blood Groups Inventory Mini-Grid */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Live Reserves by Blood Group
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => {
                          const units = Number(stockObj[group] ?? 0);
                          const isCritical = units < 5;
                          const isLow = units >= 5 && units < 15;
                          return (
                            <div
                              key={group}
                              className={`p-1.5 rounded-lg border text-center transition-all ${
                                isCritical
                                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300 font-bold'
                                  : isLow
                                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-300 font-semibold'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <span className="text-[10px] font-bold block leading-none">{group}</span>
                              <span className="text-xs font-mono font-extrabold block mt-0.5">{units}u</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        Last synced: {bb.lastUpdated ? new Date(bb.lastUpdated).toLocaleDateString() : 'Live'}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-muted font-medium text-muted-foreground hover:text-foreground h-7"
                        >
                          <MapPin className="h-3 w-3 text-red-500" />
                          View Map ↗
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBloodBankForDetails(bb)}
                          className="h-7 text-xs px-2.5 font-semibold gap-1"
                        >
                          <Eye className="h-3 w-3 text-primary" />
                          Inspect Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  <div className="sm:col-span-2 p-3 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-600" />
                        Exact Google Maps Location & Verification Node:
                      </span>
                      {selectedHospitalForDetails.coordinates && (
                        <span className="font-mono text-xs text-muted-foreground block">
                          Lat: {selectedHospitalForDetails.coordinates.lat}, Lng: {selectedHospitalForDetails.coordinates.lng}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const mapUrl = selectedHospitalForDetails.googleMapsUrl || (
                        selectedHospitalForDetails.coordinates?.lat && selectedHospitalForDetails.coordinates?.lng
                          ? `https://www.google.com/maps/search/?api=1&query=${selectedHospitalForDetails.coordinates.lat},${selectedHospitalForDetails.coordinates.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedHospitalForDetails.name + ' ' + selectedHospitalForDetails.city)}`
                      );
                      return (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open in Google Maps ↗
                        </a>
                      );
                    })()}
                  </div>
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

      {/* Blood Bank Detailed Inspection Modal */}
      <Dialog open={!!selectedBloodBankForDetails} onOpenChange={(open) => !open && setSelectedBloodBankForDetails(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedBloodBankForDetails && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 shrink-0">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">
                        {selectedBloodBankForDetails.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Official Blood Bank & Storage Facility Records
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verified
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Facility Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">License / Reg Number</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedBloodBankForDetails.licenseNumber || 'BB-LIC-ACTIVE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">City & State</span>
                    <span className="font-semibold text-foreground">
                      {selectedBloodBankForDetails.city}, {selectedBloodBankForDetails.state || 'India'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Emergency Contact</span>
                    <span className="font-semibold text-foreground">
                      📞 {selectedBloodBankForDetails.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Admin / Official Email</span>
                    <span className="font-semibold text-foreground">
                      ✉️ {selectedBloodBankForDetails.adminEmail || 'N/A'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Complete Physical Address</span>
                    <span className="text-foreground font-medium">
                      📍 {selectedBloodBankForDetails.address || `${selectedBloodBankForDetails.city}, ${selectedBloodBankForDetails.state || 'India'}`}
                    </span>
                  </div>
                </div>

                {/* Google Maps Location */}
                <div className="p-3 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-red-600" />
                      Google Maps Location & Navigation:
                    </span>
                    {selectedBloodBankForDetails.coordinates && (
                      <span className="font-mono text-xs text-muted-foreground block">
                        Lat: {selectedBloodBankForDetails.coordinates.lat}, Lng: {selectedBloodBankForDetails.coordinates.lng}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const mapUrl = selectedBloodBankForDetails.googleMapsUrl || (
                      selectedBloodBankForDetails.coordinates?.lat && selectedBloodBankForDetails.coordinates?.lng
                        ? `https://www.google.com/maps/search/?api=1&query=${selectedBloodBankForDetails.coordinates.lat},${selectedBloodBankForDetails.coordinates.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBloodBankForDetails.name + ' ' + selectedBloodBankForDetails.city)}`
                    );
                    return (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open in Google Maps ↗
                      </a>
                    );
                  })()}
                </div>

                {/* 8-Group Detailed Stock Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Current Units Available by Blood Group
                    </h4>
                    <span className="text-xs font-bold text-red-600">
                      Total: {
                        Object.values(selectedBloodBankForDetails.linkedBloodStockId?.bloodGroups || {})
                          .reduce((s, q) => s + (Number(q) || 0), 0)
                      } Units
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((grp) => {
                      const units = Number(selectedBloodBankForDetails.linkedBloodStockId?.bloodGroups?.[grp] ?? 0);
                      const isCritical = units < 5;
                      const isLow = units >= 5 && units < 15;
                      return (
                        <div
                          key={grp}
                          className={`p-3 rounded-xl border text-center ${
                            isCritical
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900/50'
                              : isLow
                              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50'
                          }`}
                        >
                          <span className="text-xs font-extrabold text-foreground block">{grp}</span>
                          <span className="text-xl font-black font-mono block mt-1">
                            {units}
                          </span>
                          <span className={`text-[10px] font-bold block mt-0.5 ${
                            isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {isCritical ? 'Critical' : isLow ? 'Low Stock' : 'Adequate'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t pt-4 flex sm:justify-between items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedBloodBankForDetails(null)}>
                  Close
                </Button>
                <Link to="/admin/blood" onClick={() => setSelectedBloodBankForDetails(null)}>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5">
                    <Droplets className="h-3.5 w-3.5" />
                    Manage Blood Inventory ↗
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

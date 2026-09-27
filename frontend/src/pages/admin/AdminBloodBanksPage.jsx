import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { connectSocket, getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { BloodBankRegisterModal } from '@/components/BloodBankRegisterModal';
import {
  Droplets,
  Building2,
  ShieldCheck,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Eye,
  AlertTriangle,
  LayoutGrid,
  List,
  Activity,
  Plus,
  QrCode
} from 'lucide-react';
import { DonorIntakeModal } from '@/components/admin/blood/DonorIntakeModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AdminBloodBanksPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [verifiedBloodBanks, setVerifiedBloodBanks] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedBloodBankForDetails, setSelectedBloodBankForDetails] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [isDonorIntakeOpen, setIsDonorIntakeOpen] = useState(false);

  // Fetch verified blood banks and pending queue
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const [allRes, pendingRes] = await Promise.all([
        api.bloodbanks.getAll().catch(() => ({ bloodBanks: [] })),
        isSuperAdmin
          ? api.bloodbanks.getPendingQueue(token).catch(() => ({ queue: [] }))
          : Promise.resolve({ queue: [] }),
      ]);

      const verified = allRes?.bloodBanks || allRes || [];
      const pending = pendingRes?.queue || pendingRes || [];

      setVerifiedBloodBanks(verified);
      setPendingQueue(pending);
    } catch (err) {
      console.error('Failed to fetch blood banks:', err);
      toast.error('Failed to load blood banks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket subscription for real-time registrations & stock changes
    const token = localStorage.getItem('swasthya_setu_token') || user?.token;
    connectSocket(token);
    const s = getSocket();

    const handleNewRegistration = () => {
      toast.info('New blood bank registration request received!');
      fetchData();
    };

    s?.on('blood-bank-registered', handleNewRegistration);
    s?.on('blood-stock-updated', fetchData);

    return () => {
      s?.off('blood-bank-registered', handleNewRegistration);
      s?.off('blood-stock-updated', fetchData);
    };
  }, [isSuperAdmin]);

  // Handle Verify & Approve
  const handleVerify = async (id, name) => {
    setVerifyingId(id);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      await api.bloodbanks.verify(id, token);
      toast.success(`Verified and approved ${name || 'Blood Bank'}!`);
      fetchData();
      if (selectedBloodBankForDetails?._id === id || selectedBloodBankForDetails?.id === id) {
        setSelectedBloodBankForDetails(null);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      toast.error('Failed to verify blood bank: ' + (err.message || 'Server error'));
    } finally {
      setVerifyingId(null);
    }
  };

  // Combine for full directory
  const allBloodBanks = useMemo(() => {
    const list = [
      ...pendingQueue.map((bb) => ({ ...bb, isVerified: false })),
      ...verifiedBloodBanks.map((bb) => ({ ...bb, isVerified: true })),
    ];
    return list;
  }, [pendingQueue, verifiedBloodBanks]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = allBloodBanks.length;
    const verified = verifiedBloodBanks.length;
    const pending = pendingQueue.length;
    const totalUnits = verifiedBloodBanks.reduce((sum, bb) => {
      const groups = bb.linkedBloodStockId?.bloodGroups || {};
      return sum + Object.values(groups).reduce((s, qty) => s + (Number(qty) || 0), 0);
    }, 0);

    return { total, verified, pending, totalUnits };
  }, [allBloodBanks, verifiedBloodBanks, pendingQueue]);

  // Dynamic list of cities
  const cities = useMemo(() => {
    const set = new Set(allBloodBanks.map((b) => b.city).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [allBloodBanks]);

  // Filtered blood banks
  const filteredBloodBanks = useMemo(() => {
    return allBloodBanks.filter((bb) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (bb.name || '').toLowerCase().includes(q) ||
        (bb.city || '').toLowerCase().includes(q) ||
        (bb.state || '').toLowerCase().includes(q) ||
        (bb.licenseNumber || '').toLowerCase().includes(q) ||
        (bb.adminEmail || '').toLowerCase().includes(q) ||
        (bb.phone || '').toLowerCase().includes(q);

      // City filter
      const matchesCity = cityFilter === 'all' || bb.city?.toLowerCase() === cityFilter.toLowerCase();

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && bb.isVerified) ||
        (statusFilter === 'pending' && !bb.isVerified);

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [allBloodBanks, searchQuery, cityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Blood Banks Directory
            </h1>
            <Badge className="bg-red-600 text-white font-bold text-xs">
              {stats.total} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Super Admin national registry, operational verification & live stock monitoring for blood storage facilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="gap-1.5 text-xs font-semibold h-9"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Link to="/admin/blood">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
              <Droplets className="h-3.5 w-3.5 text-red-600" />
              Blood Stock View
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsDonorIntakeOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold h-9 shadow-xs"
          >
            <QrCode className="h-3.5 w-3.5" />
            Scan Donor QR / Intake
          </Button>

          <BloodBankRegisterModal>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs font-bold h-9 shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              Register Blood Bank
            </Button>
          </BloodBankRegisterModal>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600">
                <Droplets className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.total}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Blood Banks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.verified}</p>
                <p className="text-xs text-muted-foreground font-medium">Verified & Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.pending}</p>
                <p className="text-xs text-muted-foreground font-medium">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black">{stats.totalUnits}</p>
                <p className="text-xs text-muted-foreground font-medium">Live Blood Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Queue Section (Shown when pending requests exist) */}
      {isSuperAdmin && pendingQueue.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10 shadow-xs">
          <CardHeader className="pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-100">
                  Pending Blood Bank Approvals Queue
                </CardTitle>
                <Badge className="bg-amber-500 text-white font-bold text-xs">
                  {pendingQueue.length} Pending
                </Badge>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Action Required
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {pendingQueue.map((bb) => {
              const mapUrl = bb.googleMapsUrl || (bb.coordinates?.lat && bb.coordinates?.lng
                ? `https://www.google.com/maps/search/?api=1&query=${bb.coordinates.lat},${bb.coordinates.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((bb.name || '') + ' ' + (bb.city || ''))}`);

              return (
                <div
                  key={bb._id || bb.id}
                  className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-background flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {bb.name}
                      </h4>
                      <Badge variant="outline" className="font-mono text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold">
                        Lic: {bb.licenseNumber || 'PENDING'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {bb.city}, {bb.state || 'India'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      <span>{bb.address || `${bb.city}, ${bb.state || 'India'}`}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                      {bb.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {bb.phone}
                        </span>
                      )}
                      {bb.adminEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {bb.adminEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-lg hover:bg-muted font-medium text-muted-foreground hover:text-foreground h-8"
                    >
                      <MapPin className="h-3 w-3 text-red-500" />
                      Map ↗
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBloodBankForDetails(bb)}
                      className="h-8 text-xs font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      disabled={verifyingId === (bb._id || bb.id)}
                      onClick={() => handleVerify(bb._id || bb.id, bb.name)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      {verifyingId === (bb._id || bb.id) ? 'Verifying...' : 'Approve & Activate'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Directory Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search blood bank, license, city, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-9 text-xs px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
              >
                <option value="all">All Cities</option>
                {cities.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-xs px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Approval</option>
              </select>

              {(searchQuery || cityFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCityFilter('all');
                    setStatusFilter('all');
                  }}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shrink-0 self-end md:self-center">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-2.5 text-xs gap-1 font-semibold"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-2.5 text-xs gap-1 font-semibold"
              >
                <List className="h-3.5 w-3.5" />
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Directory Body */}
      {filteredBloodBanks.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-16 text-center text-muted-foreground space-y-2">
            <Droplets className="h-10 w-10 mx-auto text-red-400 opacity-60" />
            <p className="font-semibold text-foreground text-sm">
              {allBloodBanks.length === 0 ? 'No blood banks registered in the system yet.' : 'No blood banks match your search/filter criteria.'}
            </p>
            <p className="text-xs">Try adjusting your search query or city filter.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredBloodBanks.map((bb) => {
            const stockObj = bb.linkedBloodStockId?.bloodGroups || {};
            const stockEntries = Object.entries(stockObj);
            const totalUnits = stockEntries.reduce((sum, [, qty]) => sum + (Number(qty) || 0), 0);
            const mapUrl = bb.googleMapsUrl || (bb.coordinates?.lat && bb.coordinates?.lng
              ? `https://www.google.com/maps/search/?api=1&query=${bb.coordinates.lat},${bb.coordinates.lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((bb.name || '') + ' ' + (bb.city || ''))}`);

            return (
              <div
                key={bb._id || bb.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-foreground truncate">
                        {bb.name}
                      </h3>
                      {bb.isVerified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </Badge>
                      )}
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

                {/* 8-Group Mini-Grid */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Live Reserves by Blood Group
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {BLOOD_GROUPS.map((group) => {
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
                    Last sync: {bb.lastUpdated ? new Date(bb.lastUpdated).toLocaleDateString() : 'Live'}
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
                    {!bb.isVerified && (
                      <Button
                        size="sm"
                        disabled={verifyingId === (bb._id || bb.id)}
                        onClick={() => handleVerify(bb._id || bb.id, bb.name)}
                        className="h-7 text-xs px-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold">Facility Name</TableHead>
                  <TableHead className="text-xs font-bold">City & State</TableHead>
                  <TableHead className="text-xs font-bold">License No.</TableHead>
                  <TableHead className="text-xs font-bold">Contact</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-center">Total Units</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBloodBanks.map((bb) => {
                  const stockObj = bb.linkedBloodStockId?.bloodGroups || {};
                  const totalUnits = Object.values(stockObj).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
                  const mapUrl = bb.googleMapsUrl || (bb.coordinates?.lat && bb.coordinates?.lng
                    ? `https://www.google.com/maps/search/?api=1&query=${bb.coordinates.lat},${bb.coordinates.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((bb.name || '') + ' ' + (bb.city || ''))}`);

                  return (
                    <TableRow key={bb._id || bb.id} className="hover:bg-muted/40">
                      <TableCell className="font-semibold text-xs py-3">
                        <div>
                          <p className="font-bold text-foreground">{bb.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs">{bb.address}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{bb.city}</span>, <span className="text-muted-foreground">{bb.state || 'India'}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {bb.licenseNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="text-foreground">{bb.phone || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">{bb.adminEmail || '—'}</p>
                      </TableCell>
                      <TableCell>
                        {bb.isVerified ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-xs">
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200">
                          {totalUnits}u
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                            title="Open Google Maps"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBloodBankForDetails(bb)}
                            className="h-7 text-xs px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Details
                          </Button>
                          {!bb.isVerified && (
                            <Button
                              size="sm"
                              disabled={verifyingId === (bb._id || bb.id)}
                              onClick={() => handleVerify(bb._id || bb.id, bb.name)}
                              className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detailed Blood Bank Inspection Modal */}
      <Dialog
        open={!!selectedBloodBankForDetails}
        onOpenChange={(open) => !open && setSelectedBloodBankForDetails(null)}
      >
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
                  {selectedBloodBankForDetails.isVerified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Facility Details Grid */}
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
                    {BLOOD_GROUPS.map((grp) => {
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
                <div className="flex items-center gap-2">
                  {!selectedBloodBankForDetails.isVerified && (
                    <Button
                      size="sm"
                      disabled={verifyingId === (selectedBloodBankForDetails._id || selectedBloodBankForDetails.id)}
                      onClick={() => handleVerify(selectedBloodBankForDetails._id || selectedBloodBankForDetails.id, selectedBloodBankForDetails.name)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Verify
                    </Button>
                  )}
                  <Link to="/admin/blood" onClick={() => setSelectedBloodBankForDetails(null)}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5">
                      <Droplets className="h-3.5 w-3.5" />
                      Manage Blood Stock ↗
                    </Button>
                  </Link>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Walk-in Donor Intake & QR Verification Modal */}
      <DonorIntakeModal
        open={isDonorIntakeOpen}
        onOpenChange={setIsDonorIntakeOpen}
        onDonationRecorded={fetchData}
      />
    </div>
  );
}

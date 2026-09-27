import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  Droplets,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Activity,
  Plus,
  Minus,
  Clock,
  ExternalLink,
  Sparkles,
  Info,
  QrCode,
  Heart,
  Users,
  Award,
  Calendar,
  Download,
  FileCheck,
  Mail,
  Search,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { connectSocket, getSocket } from '@/lib/socket';
import { BloodBankMap } from '@/components/maps/blood-bank-map';
import { DonorIntakeModal } from '@/components/admin/blood/DonorIntakeModal';
import { cn } from '@/lib/utils';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SAFE_STOCK_TARGET = 30;
const CRITICAL_STOCK_THRESHOLD = 5;

export default function BloodBankAdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'donors' ? 'donors' : 'inventory';

  const [bloodBank, setBloodBank] = useState(user?.bloodBank || null);
  const [isDonorIntakeOpen, setIsDonorIntakeOpen] = useState(false);
  const [stock, setStock] = useState({
    'A+': 0,
    'A-': 0,
    'B+': 0,
    'B-': 0,
    'AB+': 0,
    'AB-': 0,
    'O+': 0,
    'O-': 0,
  });
  const [initialStock, setInitialStock] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Walk-in Donors State for this Blood Bank
  const [donorsList, setDonorsList] = useState([]);
  const [isLoadingDonors, setIsLoadingDonors] = useState(false);
  const [donorSearch, setDonorSearch] = useState('');
  const [donorBloodGroupFilter, setDonorBloodGroupFilter] = useState('all');
  const [selectedDonorForCert, setSelectedDonorForCert] = useState(null);

  const bloodBankId = user?.bloodBankId || user?.bloodBank?._id;

  const fetchBloodBankData = useCallback(async (showToast = false) => {
    if (!bloodBankId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.bloodbanks.getById(bloodBankId);
      if (res?.bloodBank) {
        setBloodBank(res.bloodBank);
      }
      if (res?.stock?.bloodGroups) {
        const loadedGroups = {};
        BLOOD_GROUPS.forEach((bg) => {
          loadedGroups[bg] = Number(res.stock.bloodGroups[bg] ?? 0);
        });
        setStock(loadedGroups);
        setInitialStock(loadedGroups);
        if (res.stock.lastUpdated) {
          setLastSaved(new Date(res.stock.lastUpdated));
        }
      }
      if (showToast) {
        toast.success('Blood bank data refreshed successfully');
      }
    } catch (err) {
      console.error('Error loading blood bank details:', err);
      toast.error('Failed to load real-time stock. Using cached data.');
    } finally {
      setIsLoading(false);
    }
  }, [bloodBankId]);

  const fetchWalkinDonors = useCallback(async () => {
    if (!bloodBankId) return;
    setIsLoadingDonors(true);
    try {
      const res = await api.donors.getVerifiedWalkins({ bloodBankId });
      setDonorsList(res?.verifiedDonors || []);
    } catch (err) {
      console.error('Failed to load walk-in donors for this blood bank:', err);
    } finally {
      setIsLoadingDonors(false);
    }
  }, [bloodBankId]);

  useEffect(() => {
    fetchBloodBankData();
    fetchWalkinDonors();
  }, [fetchBloodBankData, fetchWalkinDonors]);

  // Real-time socket listener
  useEffect(() => {
    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const handleStockUpdate = (data) => {
      if (data?.bloodBankId && String(data.bloodBankId) === String(bloodBankId)) {
        if (data.stock) {
          const updated = {};
          BLOOD_GROUPS.forEach((bg) => {
            updated[bg] = Number(data.stock[bg] ?? 0);
          });
          setStock(updated);
          setInitialStock(updated);
          setLastSaved(new Date());
          toast.info('Blood stock was updated in real time');
        }
      }
    };

    socket.on('blood-stock-update', handleStockUpdate);

    return () => {
      socket.off('blood-stock-update', handleStockUpdate);
    };
  }, [bloodBankId]);

  const handleStockChange = (group, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setStock((prev) => ({
      ...prev,
      [group]: num,
    }));
  };

  const adjustStock = (group, delta) => {
    setStock((prev) => {
      const current = prev[group] || 0;
      const nextVal = Math.max(0, current + delta);
      return {
        ...prev,
        [group]: nextVal,
      };
    });
  };

  const handleSaveStock = async () => {
    if (!bloodBankId) {
      toast.error('No Blood Bank facility linked to this admin account.');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('swasthya_setu_token');
      const res = await api.bloodbanks.updateStock(bloodBankId, stock, token);
      
      setInitialStock({ ...stock });
      setLastSaved(new Date());
      toast.success(res?.message || 'Blood inventory updated and broadcast to national network!');
    } catch (err) {
      console.error('Error saving stock:', err);
      toast.error(err.message || 'Failed to update stock. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = BLOOD_GROUPS.some(
    (bg) => stock[bg] !== initialStock[bg]
  );

  // Statistics
  const totalUnits = Object.values(stock).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const criticalGroups = BLOOD_GROUPS.filter((bg) => (stock[bg] || 0) < CRITICAL_STOCK_THRESHOLD);
  const healthyGroups = BLOOD_GROUPS.filter((bg) => (stock[bg] || 0) >= 15);

  // Walk-in Donors Filtered List
  const filteredDonors = useMemo(() => {
    return donorsList.filter((d) => {
      const q = donorSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.bagId?.toLowerCase().includes(q) ||
        d.donorCardId?.toLowerCase().includes(q) ||
        d.certificateId?.toLowerCase().includes(q);

      const matchesGroup =
        donorBloodGroupFilter === 'all' || d.bloodGroup === donorBloodGroupFilter;

      return matchesQuery && matchesGroup;
    });
  }, [donorsList, donorSearch, donorBloodGroupFilter]);

  const donorSummary = useMemo(() => {
    const totalDonations = donorsList.length;
    const totalUnitsCollected = donorsList.reduce(
      (sum, d) => sum + (Number(d.unitsDonated) || 1),
      0
    );
    const uniqueDonorsCount = new Set(
      donorsList.map((d) => d.donorId || d.donorCardId || d.name)
    ).size;
    return { totalDonations, totalUnitsCollected, uniqueDonorsCount };
  }, [donorsList]);

  // Download PDF certificate for a verified donor
  const handleDownloadPDF = (donorRecord) => {
    if (!donorRecord) return;

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Outer Border
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, 271, 184);

      // Header Banner
      doc.setFillColor(220, 38, 38);
      doc.rect(14, 14, 269, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CERTIFICATE OF APPRECIATION', 148.5, 26, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'NATIONAL VOLUNTARY LIFE-SAVING BLOOD DONATION NETWORK',
        148.5,
        34,
        { align: 'center' }
      );

      doc.setFontSize(8);
      doc.text(
        `Official Certificate Ref: ${donorRecord.certificateId || 'CERT-ACTIVE'}`,
        148.5,
        41,
        { align: 'center' }
      );

      // Body text
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(12);
      doc.text('This is proudly presented to', 148.5, 62, { align: 'center' });

      // Donor Name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(donorRecord.name || 'Honorable Life Saver', 148.5, 76, {
        align: 'center',
      });

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.8);
      doc.line(75, 80, 222, 80);

      // Appreciation Paragraph
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `In grateful recognition of your voluntary walk-in donation at ${
          donorRecord.bloodBankName || bloodBank?.name || 'Authorized Blood Bank'
        }. Your noble contribution directly helps save precious lives in critical emergencies.`,
        148.5,
        92,
        { align: 'center', maxWidth: 220 }
      );

      // Donation Details Grid Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(40, 105, 217, 44, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);

      // Row 1
      doc.text('Blood Group:', 50, 116);
      doc.setTextColor(220, 38, 38);
      doc.text(donorRecord.bloodGroup || 'N/A', 90, 116);

      doc.setTextColor(30, 41, 59);
      doc.text('Units Donated:', 150, 116);
      doc.text(`${donorRecord.unitsDonated || 1} Unit (350ml)`, 195, 116);

      // Row 2
      doc.text('Blood Bag Barcode:', 50, 128);
      doc.setTextColor(15, 23, 42);
      doc.text(donorRecord.bagId || 'BAG-VERIFIED', 90, 128);

      doc.text('Donation Center:', 150, 128);
      doc.text(
        donorRecord.bloodBankName || bloodBank?.name || 'Blood Bank Facility',
        195,
        128,
        { maxWidth: 55 }
      );

      // Row 3
      doc.text('Donation Date:', 50, 140);
      doc.text(
        new Date(donorRecord.donationDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        90,
        140
      );

      doc.text('Next Eligible Date:', 150, 140);
      doc.setTextColor(5, 150, 105);
      doc.text(
        donorRecord.nextEligibleDate
          ? new Date(donorRecord.nextEligibleDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'After 90 Days',
        195,
        140
      );

      // Signatures
      doc.setDrawColor(148, 163, 184);
      doc.line(50, 172, 105, 172);
      doc.line(190, 172, 245, 172);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Authorized Medical Officer', 77.5, 178, { align: 'center' });
      doc.text(
        donorRecord.bloodBankName || bloodBank?.name || 'Blood Bank Authority',
        217.5,
        178,
        { align: 'center' }
      );

      // Official Stamp Circle
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(1.2);
      doc.circle(148.5, 168, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(220, 38, 38);
      doc.text('SWASTHYA SETU', 148.5, 166, { align: 'center' });
      doc.text('VERIFIED DONATION', 148.5, 171, { align: 'center' });

      doc.save(
        `Blood-Donation-Certificate-${(donorRecord.name || 'Donor').replace(
          /\s+/g,
          '_'
        )}.pdf`
      );
      toast.success('Official Certificate PDF generated and downloaded!');
    } catch (err) {
      console.error('Error creating PDF certificate:', err);
      toast.error('Failed to generate PDF certificate.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Facility Information */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs backdrop-blur-md border-0">
                <Droplets className="w-3.5 h-3.5 mr-1" />
                Authorized Blood Bank Portal
              </Badge>
              <Badge className="bg-emerald-500/90 text-white text-xs border-0 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified by Super Admin
              </Badge>
              <span className="flex items-center gap-1.5 text-xs bg-white/15 px-2.5 py-0.5 rounded-full text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sync Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {bloodBank?.name || user?.name || 'Blood Bank Facility'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-red-100 pt-1">
              {bloodBank?.licenseNumber && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 opacity-80" />
                  Lic: <strong className="font-mono">{bloodBank.licenseNumber}</strong>
                </span>
              )}
              {(bloodBank?.city || bloodBank?.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 opacity-80" />
                  {bloodBank.city}, {bloodBank.state}
                </span>
              )}
              {bloodBank?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 opacity-80" />
                  {bloodBank.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <Button
              onClick={() => setIsDonorIntakeOpen(true)}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold h-10 px-4 shadow-md gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Scan Donor QR / Intake
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBloodBankData(true);
                fetchWalkinDonors();
              }}
              disabled={isLoading || isLoadingDonors}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3.5 backdrop-blur-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${
                  isLoading || isLoadingDonors ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </Button>
            {activeTab === 'inventory' && (
              <Button
                onClick={handleSaveStock}
                disabled={isSaving || !hasUnsavedChanges}
                size="sm"
                className="bg-white text-red-600 hover:bg-red-50 text-xs font-bold h-10 px-5 shadow-md"
              >
                <Save className={`w-4 h-4 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Publish Changes' : 'Saved'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Dashboard Segmented Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSearchParams({})}
            className={cn(
              "h-9 px-4 text-xs font-bold gap-2 rounded-lg cursor-pointer transition-all",
              activeTab === 'inventory'
                ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm font-extrabold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Droplets className="w-4 h-4 text-red-600" />
            Blood Stock & Inventory
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSearchParams({ tab: 'donors' })}
            className={cn(
              "h-9 px-4 text-xs font-bold gap-2 rounded-lg cursor-pointer transition-all relative",
              activeTab === 'donors'
                ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm font-extrabold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Walk-in Donors (QR Scanned)
            {donorsList.length > 0 && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center font-bold ml-1 rounded-full">
                {donorsList.length}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {activeTab === 'donors' ? (
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Private facility records &bull; {donorsList.length} verified walk-ins
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Activity className="w-4 h-4 text-blue-600" />
              National Real-time Inventory Synced
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BLOOD STOCK & INVENTORY MANAGEMENT                */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Blood Units
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {totalUnits}{' '}
                    <span className="text-xs font-normal text-muted-foreground">Units</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastSaved
                      ? `Updated ${lastSaved.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Live synchronized'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Critical Deficit Groups
                  </p>
                  <p className="text-3xl font-extrabold text-red-600 mt-1">
                    {criticalGroups.length}{' '}
                    <span className="text-xs font-normal text-muted-foreground">/ 8 Groups</span>
                  </p>
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    {criticalGroups.length > 0
                      ? `Needs donation (${criticalGroups.join(', ')})`
                      : 'No severe deficits'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Adequate Stock Groups
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {healthyGroups.length}{' '}
                    <span className="text-xs font-normal text-muted-foreground">/ 8 Groups</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Sufficient for emergency needs
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    QR Walk-in Donors
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {donorsList.length}{' '}
                    <span className="text-xs font-normal text-muted-foreground">Donors</span>
                  </p>
                  <button
                    onClick={() => setSearchParams({ tab: 'donors' })}
                    className="text-[11px] text-primary hover:underline font-semibold inline-flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    View Donors Directory &rarr;
                  </button>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donor Walk-in QR Quick Action Card */}
          <Card className="border-red-200 dark:border-red-900/60 bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-slate-900 dark:to-red-950/20 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground">
                      Walk-in Blood Donor Verification & Intake
                    </h3>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      Auto Stock Sync
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan donor digital QR pass or enter Donor ID to verify credentials, log medical screening, auto-increment inventory, and email official appreciation certificates.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setSearchParams({ tab: 'donors' })}
                  variant="outline"
                  className="font-bold text-xs h-10 px-4 gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  View Donors ({donorsList.length})
                </Button>
                <Button
                  onClick={() => setIsDonorIntakeOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Verify & Record Donation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Unsaved Changes Floating Banner */}
          {hasUnsavedChanges && (
            <div className="sticky top-18 z-20 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span className="text-xs sm:text-sm font-bold">
                  You have unsaved inventory modifications! Click Publish to sync changes with public users and hospitals.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStock({ ...initialStock })}
                  className="bg-transparent hover:bg-white/20 text-white border-white/30 text-xs h-8"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveStock}
                  disabled={isSaving}
                  className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs h-8 shadow"
                >
                  {isSaving ? 'Publishing...' : 'Publish Now'}
                </Button>
              </div>
            </div>
          )}

          {/* Blood Inventory Management Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-red-600" />
                  Real-time Blood Stock Management
                </h2>
                <p className="text-xs text-muted-foreground">
                  Adjust stock counts for each blood group. Changes update the national live database immediately upon publishing.
                </p>
              </div>

              <Button
                onClick={handleSaveStock}
                disabled={isSaving || !hasUnsavedChanges}
                className="hidden sm:inline-flex bg-red-600 hover:bg-red-700 font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Publish All Stock
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BLOOD_GROUPS.map((group) => {
                const count = stock[group] ?? 0;
                const isCritical = count < CRITICAL_STOCK_THRESHOLD;
                const isModerate = count >= CRITICAL_STOCK_THRESHOLD && count < 15;
                const progressPercent = Math.min(
                  100,
                  Math.round((count / SAFE_STOCK_TARGET) * 100)
                );

                return (
                  <Card
                    key={group}
                    className={`border transition-all duration-200 ${
                      isCritical
                        ? 'border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
                        : isModerate
                        ? 'border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                              isCritical
                                ? 'bg-red-600 text-white'
                                : isModerate
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            }`}
                          >
                            {group}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground block">
                              Blood Group
                            </span>
                            <span className="font-extrabold text-sm text-foreground">
                              {group} Negative/Positive
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={isCritical ? 'destructive' : isModerate ? 'secondary' : 'default'}
                          className={`text-[10px] font-bold ${
                            !isCritical && !isModerate ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                          }`}
                        >
                          {isCritical ? 'Deficit' : isModerate ? 'Moderate' : 'Optimal'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Capacity Target ({SAFE_STOCK_TARGET} units)</span>
                          <span className="font-bold text-foreground">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical
                                ? 'bg-red-600'
                                : isModerate
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => adjustStock(group, -1)}
                            disabled={count <= 0}
                            className="h-8 w-8 text-slate-700 dark:text-slate-200"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => adjustStock(group, -5)}
                            disabled={count < 5}
                            className="h-8 px-2 text-[10px] font-bold text-muted-foreground"
                          >
                            -5
                          </Button>
                        </div>

                        <div className="relative flex-1 max-w-[90px]">
                          <Input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => handleStockChange(group, e.target.value)}
                            className="h-9 text-center font-black text-lg p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground pointer-events-none">
                            u
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => adjustStock(group, 1)}
                            className="h-8 w-8 text-slate-700 dark:text-slate-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => adjustStock(group, 5)}
                            className="h-8 px-2 text-[10px] font-bold text-muted-foreground"
                          >
                            +5
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Facility Official Details */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-600" />
                Blood Bank Registered Facility Details
              </CardTitle>
              <CardDescription className="text-xs">
                Official licensing, contact numbers, and verified administrative profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">Facility Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.name || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">License / Registration</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.licenseNumber || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">Official Email</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.adminEmail || user?.email || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">City & State</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.city || 'N/A'}, {bloodBank?.state || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">Emergency Contact</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.phone || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <span className="text-muted-foreground block">GPS Coordinates</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                    {bloodBank?.coordinates?.lat?.toFixed(4) || 'N/A'},{' '}
                    {bloodBank?.coordinates?.lng?.toFixed(4) || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facility GPS Location & Map Preview */}
          {bloodBank && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Facility GPS Location & Dispatch Map
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time geographic position mapped for emergency blood requests and ambulance pickup.
                  </CardDescription>
                </div>
                {bloodBank.googleMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1 h-8"
                    onClick={() => window.open(bloodBank.googleMapsUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Google Maps
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <BloodBankMap
                  bloodBanks={[
                    {
                      ...bloodBank,
                      hospitalName: bloodBank.name,
                      bloodStock: Object.entries(stock).map(([g, u]) => ({
                        bloodGroup: g,
                        unitsAvailable: u,
                      })),
                    },
                  ]}
                  selectedBank={{
                    ...bloodBank,
                    hospitalName: bloodBank.name,
                    bloodStock: Object.entries(stock).map(([g, u]) => ({
                      bloodGroup: g,
                      unitsAvailable: u,
                    })),
                  }}
                  className="h-[280px] sm:h-[340px]"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QR WALK-IN DONORS DIRECTORY (FACILITY EXCLUSIVE)   */}
      {/* ======================================================== */}
      {activeTab === 'donors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Banner */}
          <Card className="border-emerald-200 dark:border-emerald-950/60 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/20 shadow-xs">
            <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-foreground">
                      QR Walk-in Donors Directory
                    </h2>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      Facility Private Access
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                    Authorized records of voluntary donors who visited <strong>{bloodBank?.name || 'this facility'}</strong>, scanned their digital QR pass, cleared medical screening, and contributed life-saving blood.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
                <Button
                  onClick={fetchWalkinDonors}
                  disabled={isLoadingDonors}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold h-10 px-3.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1.5 ${isLoadingDonors ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={() => setIsDonorIntakeOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 gap-2 shadow-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Scan Donor QR / Intake
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Donor Stats Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Walk-in Donations
                  </p>
                  <p className="text-3xl font-extrabold text-foreground mt-1">
                    {donorSummary.totalDonations}{' '}
                    <span className="text-xs font-normal text-muted-foreground">Times</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Verified by medical officer
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Units Collected
                  </p>
                  <p className="text-3xl font-extrabold text-red-600 mt-1">
                    {donorSummary.totalUnitsCollected}{' '}
                    <span className="text-xs font-normal text-muted-foreground">Units</span>
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Auto-added to facility inventory
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Unique Voluntary Donors
                  </p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-1">
                    {donorSummary.uniqueDonorsCount}{' '}
                    <span className="text-xs font-normal text-muted-foreground">Donors</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Registered in digital life-saver network
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Blood Group Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Donor Name, Card ID (DONOR-...), Bag Barcode, or Phone..."
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Group:
              </span>
              <button
                onClick={() => setDonorBloodGroupFilter('all')}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md font-bold transition-all cursor-pointer",
                  donorBloodGroupFilter === 'all'
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                All ({donorsList.length})
              </button>
              {BLOOD_GROUPS.map((bg) => {
                const count = donorsList.filter((d) => d.bloodGroup === bg).length;
                if (count === 0 && donorBloodGroupFilter !== bg) return null;
                return (
                  <button
                    key={bg}
                    onClick={() => setDonorBloodGroupFilter(bg)}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-md font-bold transition-all cursor-pointer shrink-0",
                      donorBloodGroupFilter === bg
                        ? "bg-red-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    )}
                  >
                    {bg} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Walk-in Donors Cards / List */}
          {isLoadingDonors ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                Loading walk-in donor records for {bloodBank?.name}...
              </p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-foreground">
                  {donorsList.length === 0
                    ? 'No QR Walk-in Donors Recorded Yet'
                    : 'No matching donors found'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {donorsList.length === 0
                    ? 'When a donor arrives at this blood bank and presents their digital QR pass, scan it using the button below to record their donation.'
                    : 'Try clearing your search query or blood group filter.'}
                </p>
              </div>
              {donorsList.length === 0 ? (
                <Button
                  onClick={() => setIsDonorIntakeOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 gap-2 cursor-pointer shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  Scan First Donor QR
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDonorSearch('');
                    setDonorBloodGroupFilter('all');
                  }}
                  className="text-xs font-semibold h-8"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDonors.map((donor) => (
                <div
                  key={donor.id}
                  className="bg-card border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row: Avatar, Name, Group Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center font-extrabold text-base shrink-0">
                          {donor.bloodGroup}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-foreground">
                              {donor.name}
                            </h4>
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border-0 px-2 py-0">
                              QR Scanned
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                            <span>{donor.donorCardId || 'DONOR-PASS'}</span>
                            {donor.age && <span>&bull; {donor.age} yrs</span>}
                            {donor.weight && <span>&bull; {donor.weight} kg</span>}
                          </p>
                        </div>
                      </div>

                      <Badge className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 shadow-2xs">
                        {donor.bloodGroup}
                      </Badge>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Donation Date:
                        </span>
                        <span className="font-semibold text-foreground">
                          {new Date(donor.donationDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Blood Bag Barcode:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {donor.bagId || 'BAG-VERIFIED'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Certificate ID:
                        </span>
                        <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                          {donor.certificateId || 'CERT-ACTIVE'}
                        </span>
                      </div>

                      {(donor.hemoglobin || donor.bloodPressure) && (
                        <div className="flex items-center justify-between pt-1 border-t border-dashed">
                          <span className="text-muted-foreground">Screening Vitals:</span>
                          <span className="font-medium text-foreground">
                            {donor.hemoglobin ? `Hb: ${donor.hemoglobin} g/dL` : ''}{' '}
                            {donor.bloodPressure ? `| BP: ${donor.bloodPressure}` : ''}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {donor.city ? `${donor.city}, ${donor.state || 'India'}` : 'Location logged'}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30"
                        >
                          {donor.unitsDonated || 1} Unit Collected
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div className="flex items-center gap-2">
                      {donor.phone && (
                        <a
                          href={`tel:${donor.phone}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {donor.phone}
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDonorForCert(donor)}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-red-600" />
                        View Certificate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPDF(donor)}
                        className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Official Certificate Preview Modal */}
      <Dialog
        open={!!selectedDonorForCert}
        onOpenChange={(open) => !open && setSelectedDonorForCert(null)}
      >
        <DialogContent className="max-w-lg p-5 rounded-2xl">
          {selectedDonorForCert && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>

              <div>
                <Badge className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5">
                  Verified Life Saver Certificate
                </Badge>
                <h3 className="text-xl font-black text-foreground mt-1.5">
                  {selectedDonorForCert.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Walk-in Donation completed at{' '}
                  <strong>{selectedDonorForCert.bloodBankName}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs text-left">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Blood Group:</span>
                  <span className="font-black text-red-600">
                    {selectedDonorForCert.bloodGroup}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Units Donated:</span>
                  <span className="font-bold text-foreground">
                    {selectedDonorForCert.unitsDonated || 1} Unit (350ml)
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Blood Bag Barcode:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedDonorForCert.bagId || 'BAG-VERIFIED'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Certificate ID:</span>
                  <span className="font-mono text-muted-foreground">
                    {selectedDonorForCert.certificateId || 'CERT-ACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-muted-foreground">Donation Date:</span>
                  <span className="font-bold text-foreground">
                    {new Date(selectedDonorForCert.donationDate).toLocaleDateString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDonorForCert(null)}
                  className="flex-1 text-xs h-9"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadPDF(selectedDonorForCert)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Walk-in Donor Intake & QR Verification Modal */}
      <DonorIntakeModal
        open={isDonorIntakeOpen}
        onOpenChange={setIsDonorIntakeOpen}
        onDonationRecorded={() => {
          fetchBloodBankData(true);
          fetchWalkinDonors();
        }}
        bloodBankName={bloodBank?.name}
      />
    </div>
  );
}

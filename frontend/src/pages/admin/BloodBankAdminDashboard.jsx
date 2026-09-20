import { useState, useEffect, useCallback } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { connectSocket, getSocket } from '@/lib/socket';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SAFE_STOCK_TARGET = 30;
const CRITICAL_STOCK_THRESHOLD = 5;

export default function BloodBankAdminDashboard() {
  const { user } = useAuth();
  const [bloodBank, setBloodBank] = useState(user?.bloodBank || null);
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

  useEffect(() => {
    fetchBloodBankData();
  }, [fetchBloodBankData]);

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
              variant="outline"
              size="sm"
              onClick={() => fetchBloodBankData(true)}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3.5 backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleSaveStock}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 text-xs font-bold h-10 px-5 shadow-md"
            >
              <Save className={`w-4 h-4 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Publish Changes' : 'Saved'}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Blood Units
              </p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalUnits} <span className="text-xs font-normal text-muted-foreground">Units</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastSaved ? `Updated ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live synchronized'}
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
                {criticalGroups.length} <span className="text-xs font-normal text-muted-foreground">/ 8 Groups</span>
              </p>
              <p className="text-[11px] text-red-500 mt-1 font-medium">
                {criticalGroups.length > 0 ? `Needs immediate donation (${criticalGroups.join(', ')})` : 'No severe deficits'}
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
                {healthyGroups.length} <span className="text-xs font-normal text-muted-foreground">/ 8 Groups</span>
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
                Public Search Status
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Visible to Public
              </p>
              <a
                href="/blood"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 mt-1"
              >
                Open Public Finder <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

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
            const progressPercent = Math.min(100, Math.round((count / SAFE_STOCK_TARGET) * 100));

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
                            : 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                        }`}
                      >
                        {group}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">Group {group}</CardTitle>
                        <CardDescription className="text-[11px]">
                          Target: {SAFE_STOCK_TARGET} units
                        </CardDescription>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        isCritical
                          ? 'text-red-600 border-red-300 bg-red-100 dark:bg-red-950/50'
                          : isModerate
                          ? 'text-amber-600 border-amber-300 bg-amber-100 dark:bg-amber-950/50'
                          : 'text-emerald-600 border-emerald-300 bg-emerald-100 dark:bg-emerald-950/50'
                      }`}
                    >
                      {isCritical ? 'Critical' : isModerate ? 'Moderate' : 'Good'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3.5">
                  {/* Stock Level Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Reserve Fill</span>
                      <span className="font-semibold">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCritical
                            ? 'bg-red-500'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantity Control Input and Quick Buttons */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => adjustStock(group, -1)}
                      disabled={count <= 0}
                      className="h-9 w-9 rounded-lg shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>

                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleStockChange(group, e.target.value)}
                        className="text-center font-mono font-bold text-base h-9 rounded-lg"
                      />
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => adjustStock(group, 1)}
                      className="h-9 w-9 rounded-lg shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Bulk increment / decrement chips */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStock(group, -5)}
                        disabled={count <= 0}
                        className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
                      >
                        -5
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStock(group, 5)}
                        className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustStock(group, 10)}
                        className="text-[10px] font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Facility Details Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Facility Profile & Verification
          </CardTitle>
          <CardDescription className="text-xs">
            Government registration and contact parameters mapped to this facility.
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
                {bloodBank?.coordinates?.lat?.toFixed(4) || 'N/A'}, {bloodBank?.coordinates?.lng?.toFixed(4) || 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

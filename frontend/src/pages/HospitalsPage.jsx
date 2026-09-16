import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { HospitalCard } from '@/components/hospital/hospital-card';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Hospital as HospitalIcon,
  Bed,
  Heart,
  Wind,
  Search,
  Grid,
  List,
  MapPin,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { connectSocket, getSocket, onBedUpdate } from '@/lib/socket';
import { useLanguage } from '@/lib/language-context';
import { HospitalMap } from '@/components/maps/hospital-map';
import { openHospitalDirections } from '@/lib/navigation';

const bedTypes = ['All Types', 'icu', 'general', 'ventilator'];

function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default' }) {
  const variantStyles = {
    default: {
      bg: 'bg-white dark:bg-card border-gray-100 dark:border-gray-800',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-full',
      valueColor: 'text-gray-900 dark:text-white',
    },
    success: {
      bg: 'bg-white dark:bg-card border-gray-100 dark:border-gray-800',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-full',
      valueColor: 'text-gray-900 dark:text-white',
    },
    warning: {
      bg: 'bg-white dark:bg-card border-gray-100 dark:border-gray-800',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-full',
      valueColor: 'text-gray-900 dark:text-white',
    },
    critical: {
      bg: 'bg-white dark:bg-card border-gray-100 dark:border-gray-800',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-full',
      valueColor: 'text-gray-900 dark:text-white',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div className={cn(
      'rounded-xl sm:rounded-2xl border p-2.5 sm:p-4 shadow-xs transition-all flex items-center justify-between gap-2',
      currentVariant.bg
    )}>
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className={cn('text-base sm:text-2xl font-bold tracking-tight leading-tight', currentVariant.valueColor)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[8px] sm:text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <div className={cn('h-8 w-8 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-2xs', currentVariant.iconBg)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}
    </div>
  );
}

export default function HospitalsPage() {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedBedType, setSelectedBedType] = useState('All Types');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showMap, setShowMap] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.hospitals.getAll({ limit: 500 });
        setHospitals(res.hospitals || []);
      } catch (error) {
        console.error('Error fetching live hospitals from backend:', error);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    connectSocket();
    const socket = getSocket();

    // 1. Real-Time Socket.io broadcasts from backend
    const handleBedUpdate = (data) => {
      if (!data || !data.hospitalId) return;
      const targetId = String(data.hospitalId);
      setHospitals((prev) =>
        prev.map((h) => {
          if (String(h._id || h.id) === targetId) {
            return {
              ...h,
              beds: {
                ...h.beds,
                ...(data.beds || {})
              },
              lastUpdated: data.timestamp || new Date()
            };
          }
          return h;
        })
      );
    };

    onBedUpdate(handleBedUpdate);

    // 2. Instant zero-latency optimistic bed count updates
    const handleLocalBedChange = (event) => {
      const { hospitalId, bedType, delta, beds } = event.detail || {};
      if (!hospitalId) return;
      const targetId = String(hospitalId);
      setHospitals((prev) =>
        prev.map((h) => {
          if (String(h._id || h.id) === targetId) {
            if (beds) {
              return { ...h, beds: { ...h.beds, ...beds }, lastUpdated: new Date() };
            }
            if (bedType && delta) {
              const currentAvail = Number(h.beds?.[bedType]?.available || 0);
              const newAvail = Math.max(0, currentAvail + delta);
              return {
                ...h,
                beds: {
                  ...h.beds,
                  [bedType]: {
                    ...h.beds?.[bedType],
                    available: newAvail
                  }
                },
                lastUpdated: new Date()
              };
            }
          }
          return h;
        })
      );
    };

    window.addEventListener('swasthya_bed_updated', handleLocalBedChange);

    return () => {
      socket.off('bed-update', handleBedUpdate);
      window.removeEventListener('swasthya_bed_updated', handleLocalBedChange);
    };
  }, []);

  const dynamicCities = ['All Cities', ...Array.from(new Set(hospitals.map(h => h.city).filter(Boolean)))];

  const filteredHospitals = hospitals.filter(hospital => {
    const q = searchQuery.toLowerCase().trim();
    const specialtiesStr = Array.isArray(hospital.specialties) ? hospital.specialties.join(' ') : '';
    const matchesSearch = !q || 
      (hospital.name || '').toLowerCase().includes(q) ||
      (hospital.address || '').toLowerCase().includes(q) ||
      (hospital.city || '').toLowerCase().includes(q) ||
      (hospital.state || '').toLowerCase().includes(q) ||
      specialtiesStr.toLowerCase().includes(q);

    const matchesCity = selectedCity === 'All Cities' || hospital.city === selectedCity;
    const matchesBedType = selectedBedType === 'All Types' || 
                          (hospital.beds?.[selectedBedType]?.available > 0);
    return matchesSearch && matchesCity && matchesBedType;
  });

  const totalICUBeds = hospitals.reduce((acc, h) => acc + (h.beds?.icu?.available || 0), 0);
  const totalICUCapacity = hospitals.reduce((acc, h) => acc + (h.beds?.icu?.total || 0), 0);
  const totalGenBeds = hospitals.reduce((acc, h) => acc + (h.beds?.general?.available || 0), 0);
  const totalGenCapacity = hospitals.reduce((acc, h) => acc + (h.beds?.general?.total || 0), 0);
  const totalVentBeds = hospitals.reduce((acc, h) => acc + (h.beds?.ventilator?.available || 0), 0);

  const handleGetDirections = (hospital) => {
    openHospitalDirections(hospital);
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    // Smoothly bring map into view so user sees the pin zooming in
    const mapViewport = document.getElementById('hospital-live-map-viewport');
    if (mapViewport) {
      const rect = mapViewport.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        mapViewport.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <Header />
      <PlatformStatusBanner />
      
      <main className="flex-1 py-4 sm:py-8 md:py-10 pb-24 sm:pb-12 w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 w-full">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 dark:bg-card px-2.5 py-0.5 text-[9px] sm:text-xs font-semibold w-fit">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                </span>
                {t('liveBedTracker')}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              {t('hospitalsDirectoryTitle')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl font-medium leading-normal">
              {t('hospitalsDirectoryDesc')}
            </p>
          </div>

          {/* Stats Cards (2x2 on mobile, 4-col on tablet/desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 sm:h-28 rounded-2xl" />
              ))
            ) : (
              <>
                <StatsCard 
                  title={t('liveHospitalNetwork')} 
                  value={hospitals.length}
                  subtitle={`${hospitals.filter(h => h.isVerified).length} verified`}
                  icon={HospitalIcon}
                />
                <StatsCard 
                  title={t('icuBeds')} 
                  value={totalICUBeds}
                  subtitle={`of ${totalICUCapacity} total`}
                  icon={Heart}
                  variant={totalICUBeds < 10 ? 'critical' : 'success'}
                />
                <StatsCard 
                  title={t('generalBeds')} 
                  value={totalGenBeds}
                  subtitle={`of ${totalGenCapacity} total`}
                  icon={Bed}
                  variant="success"
                />
                <StatsCard 
                  title={t('ventilatorBeds')} 
                  value={totalVentBeds}
                  subtitle="Available Units"
                  icon={Wind}
                  variant={totalVentBeds < 5 ? 'warning' : 'success'}
                />
              </>
            )}
          </div>

          {/* Interactive Map */}
          {showMap && (
            <div id="hospital-live-map-viewport" className="mb-4 sm:mb-6 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs animate-in fade-in scroll-mt-24">
              <HospitalMap 
                hospitals={filteredHospitals}
                selectedHospital={selectedHospital}
                onHospitalSelect={setSelectedHospital}
              />
            </div>
          )}

          {/* DESKTOP SEARCH & FILTERS (100% Original Desktop Layout, hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('searchHospitalsPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 text-sm bg-card shadow-xs rounded-xl border-gray-200"
              />
            </div>

            <div className="w-48">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-11 text-sm bg-card shadow-xs rounded-xl border-gray-200">
                  <SelectValue placeholder={t('allCities')} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={selectedBedType} onValueChange={setSelectedBedType}>
                <SelectTrigger className="h-11 text-sm bg-card shadow-xs rounded-xl border-gray-200">
                  <SelectValue placeholder={t('allBedTypes')} />
                </SelectTrigger>
                <SelectContent>
                  {bedTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'All Types' ? t('allBedTypes') : type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex border rounded-xl bg-card p-0.5 shadow-xs shrink-0">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 font-medium rounded-lg cursor-pointer"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
                {t('grid')}
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 font-medium rounded-lg cursor-pointer"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                {t('list')}
              </Button>
            </div>
          </div>

          {/* MOBILE SEARCH & FILTERS (Dedicated compact stack matching home aesthetic) */}
          <div className="block md:hidden space-y-2.5 mb-4">
            {/* Search Input + Map Button Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={t('searchHospitalsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-10 text-xs bg-white dark:bg-card shadow-xs rounded-xl border-gray-200 dark:border-gray-800 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className={cn(
                  "h-10 px-3 text-xs font-bold gap-1.5 rounded-full shrink-0 transition-all cursor-pointer shadow-xs",
                  showMap 
                    ? "bg-red-600 text-white hover:bg-red-700" 
                    : "border-gray-200 bg-white dark:bg-card text-gray-800 dark:text-gray-200 hover:bg-gray-50"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{showMap ? t('hideMap') : t('mapView')}</span>
              </Button>
            </div>

            {/* City + Bed Type Row (Clean 50/50 split) */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full h-10 text-xs bg-white dark:bg-card shadow-xs rounded-xl border-gray-200 dark:border-gray-800 font-semibold">
                  <SelectValue placeholder={t('allCities')} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBedType} onValueChange={setSelectedBedType}>
                <SelectTrigger className="w-full h-10 text-xs bg-white dark:bg-card shadow-xs rounded-xl border-gray-200 dark:border-gray-800 font-semibold">
                  <SelectValue placeholder={t('allBedTypes')} />
                </SelectTrigger>
                <SelectContent>
                  {bedTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'All Types' ? t('allBedTypes') : type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-3 text-xs text-gray-500 font-medium">
            <span>{t('showingHospitals')} <strong className="text-gray-900 dark:text-white font-bold">{filteredHospitals.length}</strong> {t('hospitalsText')}</span>
            {filteredHospitals.some(h => h.isVerified) && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {t('verifiedFacilitiesLive')}
              </span>
            )}
          </div>

          {/* Hospital Cards Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="text-center py-16 px-4 bg-muted/30 rounded-2xl border border-dashed my-6 space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                <HospitalIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-bold">{t('noHospitalsTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('noHospitalsDesc')}
                </p>
              </div>
              <div className="pt-2">
                <Link to="/register?type=hospital">
                  <Button size="lg" className="gap-2 font-bold bg-primary text-primary-foreground shadow-md">
                    <Building2 className="h-5 w-5" />
                    {t('registerFacilityCTA')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className={cn(
              'grid gap-4 sm:gap-6',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {filteredHospitals.map(hospital => (
                <HospitalCard 
                  key={hospital._id || hospital.id} 
                  hospital={hospital}
                  initialBedType={selectedBedType && selectedBedType !== 'All Types' ? selectedBedType.toLowerCase() : 'icu'}
                  isSelected={Boolean(selectedHospital && (selectedHospital._id === hospital._id || selectedHospital.id === hospital.id))}
                  onViewDetails={() => handleSelectHospital(hospital)}
                  onGetDirections={() => handleGetDirections(hospital)}
                  showDistance
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

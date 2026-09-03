import { useState, useEffect } from 'react';
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
import { useLanguage } from '@/lib/language-context';
import { HospitalMap } from '@/components/maps/hospital-map';

const bedTypes = ['All Types', 'icu', 'general', 'ventilator'];

function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default' }) {
  const variantStyles = {
    default: {
      bg: 'bg-white dark:bg-card border-gray-200 dark:border-gray-800',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      valueColor: 'text-gray-900 dark:text-white',
    },
    success: {
      bg: 'bg-white dark:bg-card border-emerald-200 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-white dark:bg-card border-amber-200 dark:border-amber-900/30',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
    critical: {
      bg: 'bg-white dark:bg-card border-red-200 dark:border-red-900/30',
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      valueColor: 'text-red-600 dark:text-red-400',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div className={cn(
      'rounded-2xl border p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-md flex items-center justify-between gap-3',
      currentVariant.bg
    )}>
      <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className={cn('text-xl sm:text-3xl font-black tracking-tight leading-tight', currentVariant.valueColor)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <div className={cn('h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs', currentVariant.iconBg)}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
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
  const [showMap, setShowMap] = useState(true);

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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates?.lat},${hospital.coordinates?.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <Header />
      <PlatformStatusBanner />
      
      <main className="flex-1 py-4 sm:py-8 md:py-10 w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 w-full">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                Live Bed Tracker
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {t('hospitalsDirectoryTitle')}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              {t('hospitalsDirectoryDesc')}
            </p>
          </div>

          {/* Stats Cards (2x2 on mobile, 4-col on tablet/desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
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
                  title="ICU Beds" 
                  value={totalICUBeds}
                  subtitle={`of ${totalICUCapacity} total`}
                  icon={Heart}
                  variant={totalICUBeds < 10 ? 'critical' : 'success'}
                />
                <StatsCard 
                  title="General Beds" 
                  value={totalGenBeds}
                  subtitle={`of ${totalGenCapacity} total`}
                  icon={Bed}
                  variant="success"
                />
                <StatsCard 
                  title="Ventilators" 
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
            <div className="mb-6 sm:mb-8 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in">
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
                className="h-9 px-3 text-xs gap-1.5 font-medium rounded-lg"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
                Grid
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm"
                className="h-9 px-3 text-xs gap-1.5 font-medium rounded-lg"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>

          {/* MOBILE SEARCH & FILTERS (Dedicated compact stack, zero horizontal overflow) */}
          <div className="block md:hidden space-y-2 mb-4">
            {/* Search Input + Map Button Row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('searchHospitalsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs bg-card shadow-xs rounded-xl border-gray-200"
                />
              </div>
              <Button
                variant={showMap ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="h-10 px-2.5 text-xs font-semibold gap-1 rounded-xl border-gray-200 shrink-0"
              >
                <MapPin className="h-3.5 w-3.5 text-red-600" />
                <span>{showMap ? 'Hide Map' : 'Map'}</span>
              </Button>
            </div>

            {/* City + Bed Type Row (Clean 50/50 split) */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-10 text-xs bg-card shadow-xs rounded-xl border-gray-200">
                  <SelectValue placeholder={t('allCities')} />
                </SelectTrigger>
                <SelectContent>
                  {dynamicCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBedType} onValueChange={setSelectedBedType}>
                <SelectTrigger className="h-10 text-xs bg-card shadow-xs rounded-xl border-gray-200">
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
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground font-medium">
            <span>Showing {filteredHospitals.length} hospitals</span>
            {filteredHospitals.some(h => h.isVerified) && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                ✓ Verified network availability
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
                <HospitalRegisterModal>
                  <Button size="lg" className="gap-2 font-bold bg-primary text-primary-foreground shadow-md">
                    <Building2 className="h-5 w-5" />
                    {t('registerFacilityCTA')}
                  </Button>
                </HospitalRegisterModal>
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
                  onViewDetails={() => setSelectedHospital(hospital)}
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

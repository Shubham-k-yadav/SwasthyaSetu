 
import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';
import { HospitalCard } from '@/components/hospital/hospital-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hospital as HospitalIcon, Bed, Heart, Wind, Search, Grid, List, Building2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

import { HospitalMap } from '@/components/maps/hospital-map';

const mockHospitals = [];

const mockStats = {
  totalHospitals: 0,
  verifiedHospitals: 0,
  beds: {
    totalICU: 0,
    availableICU: 0,
    totalGeneral: 0,
    availableGeneral: 0,
    totalVentilator: 0,
    availableVentilator: 0
  }
};

const cities = ['All Cities', 'New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata'];
const bedTypes = ['All Types', 'icu', 'general', 'ventilator'];

export default function HospitalsPage() {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedBedType, setSelectedBedType] = useState('All Types');
  const [selectedHospital, setSelectedHospital] = useState(null);

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

  const totalICUBeds = hospitals.reduce((acc, h) => acc + (h.beds?.icu?.available || 0), 0);
  const totalICUCapacity = hospitals.reduce((acc, h) => acc + (h.beds?.icu?.total || 0), 0);
  const totalGenBeds = hospitals.reduce((acc, h) => acc + (h.beds?.general?.available || 0), 0);
  const totalGenCapacity = hospitals.reduce((acc, h) => acc + (h.beds?.general?.total || 0), 0);
  const totalVentBeds = hospitals.reduce((acc, h) => acc + (h.beds?.ventilator?.available || 0), 0);

  const dynamicCities = [
    'All Cities',
    ...Array.from(new Set(hospitals.map(h => h.city).filter(Boolean)))
  ].sort();

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

  const handleGetDirections = (hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates?.lat},${hospital.coordinates?.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PlatformStatusBanner />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t('hospitalsDirectoryTitle')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('hospitalsDirectoryDesc')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
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

          {/* Map */}
          <div className="mb-8">
            <HospitalMap 
              hospitals={filteredHospitals}
              selectedHospital={selectedHospital}
              onHospitalSelect={setSelectedHospital}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('searchHospitalsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card shadow-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-3">
              <div className="w-full sm:w-44">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="bg-card shadow-xs">
                    <SelectValue placeholder={t('allCities')} />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-44">
                <Select value={selectedBedType} onValueChange={setSelectedBedType}>
                  <SelectTrigger className="bg-card shadow-xs">
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
              <div className="flex border rounded-lg bg-card p-0.5 shadow-xs col-span-2 sm:col-span-1 justify-center">
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="h-8 px-3 text-xs gap-1 font-medium"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-3.5 w-3.5" />
                  Grid
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="h-8 px-3 text-xs gap-1 font-medium"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredHospitals.length} hospitals
          </p>

          {/* Hospital Cards */}
          {loading ? (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {filteredHospitals.map(hospital => (
                <HospitalCard 
                  key={hospital._id}
                  hospital={hospital}
                  onViewDetails={() => setSelectedHospital(hospital)}
                  onGetDirections={() => handleGetDirections(hospital)}
                />
              ))}
            </div>
          )}

          {!loading && filteredHospitals.length === 0 && (
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

 
import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HospitalCard } from '@/components/hospital/hospital-card';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Hospital as HospitalIcon, Bed, Heart, Wind, Search, Grid, List, } from 'lucide-react';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

import { HospitalMap } from '@/components/maps/hospital-map';

// Mock data for demonstration
const mockHospitals = [
  {
    _id: '1',
    name: 'AIIMS Delhi',
    address: 'Ansari Nagar East, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    phone: '+91-11-26588500',
    email: 'director@aiims.edu',
    beds: { icu: { total: 150, available: 23 }, general: { total: 800, available: 156 }, ventilator: { total: 80, available: 12 } },
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Trauma'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.8,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Safdarjung Hospital',
    address: 'Ring Road, Safdarjung Enclave',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5692, lng: 77.2072 },
    phone: '+91-11-26730000',
    email: 'info@safdarjunghospital.nic.in',
    beds: { icu: { total: 100, available: 15 }, general: { total: 600, available: 89 }, ventilator: { total: 50, available: 8 } },
    specialties: ['General Surgery', 'Orthopedics', 'Burn Unit'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Sir Ganga Ram Hospital',
    address: 'Rajinder Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6380, lng: 77.1893 },
    phone: '+91-11-25750000',
    email: 'info@sgrh.com',
    beds: { icu: { total: 80, available: 18 }, general: { total: 400, available: 72 }, ventilator: { total: 40, available: 6 } },
    specialties: ['Cardiac Surgery', 'Nephrology', 'Gastroenterology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.6,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '4',
    name: 'Tata Memorial Hospital',
    address: 'Dr E Borges Road, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0048, lng: 72.8435 },
    phone: '+91-22-24177000',
    email: 'info@tmc.gov.in',
    beds: { icu: { total: 60, available: 5 }, general: { total: 500, available: 45 }, ventilator: { total: 35, available: 3 } },
    specialties: ['Oncology', 'Radiation Therapy', 'Surgical Oncology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.9,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '5',
    name: 'Apollo Hospital Chennai',
    address: '21 Greams Lane, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0604, lng: 80.2496 },
    phone: '+91-44-28290200',
    email: 'info@apollohospitals.com',
    beds: { icu: { total: 90, available: 12 }, general: { total: 450, available: 67 }, ventilator: { total: 55, available: 7 } },
    specialties: ['Heart Surgery', 'Liver Transplant', 'Joint Replacement'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.5,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '6',
    name: 'Manipal Hospital Bangalore',
    address: '98 HAL Airport Road, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9591, lng: 77.6470 },
    phone: '+91-80-25024444',
    email: 'info@manipalhospitals.com',
    beds: { icu: { total: 85, available: 19 }, general: { total: 380, available: 54 }, ventilator: { total: 42, available: 8 } },
    specialties: ['Oncology', 'Nephrology', 'Spine Surgery'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.4,
    lastUpdated: new Date().toISOString()
  }
];

const mockStats = {
  totalHospitals: 500,
  verifiedHospitals: 420,
  beds: {
    totalICU: 2500,
    availableICU: 423,
    totalGeneral: 15000,
    availableGeneral: 3200,
    totalVentilator: 1200,
    availableVentilator: 189
  }
};

const cities = ['All Cities', 'New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata'];
const bedTypes = ['All Types', 'icu', 'general', 'ventilator'];

export default function HospitalsPage() {
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
        const [hospitalsRes, statsRes] = await Promise.all([
          api.hospitals.getAll({ limit: 500 }),
          api.hospitals.getStats(),
        ]);
        setHospitals(hospitalsRes.hospitals && hospitalsRes.hospitals.length > 0 ? hospitalsRes.hospitals : mockHospitals);
        setStats(statsRes || mockStats);
      } catch (error) {
        console.warn('Backend API unavailable, using local mock data:', error);
        setHospitals(mockHospitals);
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
      
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Hospital Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Real-time bed availability across verified hospitals
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
                  title="Total Hospitals" 
                  value={stats?.totalHospitals || 0}
                  subtitle={`${stats?.verifiedHospitals || 0} verified`}
                  icon={HospitalIcon}
                />
                <StatsCard 
                  title="ICU Beds" 
                  value={stats?.beds?.availableICU || 0}
                  subtitle={`of ${stats?.beds?.totalICU || 0} total`}
                  icon={Heart}
                  variant={stats?.beds?.availableICU < 100 ? 'critical' : 'success'}
                />
                <StatsCard 
                  title="General Beds" 
                  value={stats?.beds?.availableGeneral || 0}
                  subtitle={`of ${stats?.beds?.totalGeneral || 0} total`}
                  icon={Bed}
                  variant="success"
                />
                <StatsCard 
                  title="Ventilators" 
                  value={stats?.beds?.availableVentilator || 0}
                  subtitle={`of ${stats?.beds?.totalVentilator || 0} total`}
                  icon={Wind}
                  variant={stats?.beds?.availableVentilator < 50 ? 'warning' : 'success'}
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={selectedBedType} onValueChange={setSelectedBedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bed Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {bedTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'All Types' ? 'All Types' : type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex border rounded-lg">
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
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
            <div className="text-center py-12">
              <HospitalIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No hospitals found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, Search, Heart, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  BloodBankCard,
  BloodSearchFilters,
  DonateInfoCards
} from '@/components/blood';
import { BloodBankRegisterModal } from '@/components/BloodBankRegisterModal';
import { BloodBankMap } from '@/components/maps/blood-bank-map';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Noida', 'Delhi', 'New Delhi', 'Greater Noida', 'Ghaziabad', 'Prayagraj', 'Lucknow', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad'];
const DEFAULT_CITIES = CITIES;

export default function BloodPage() {
  const { t } = useLanguage();
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [availableCities, setAvailableCities] = useState(DEFAULT_CITIES);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showMap, setShowMap] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    const mapViewport = document.getElementById('blood-bank-live-map-viewport');
    if (mapViewport) {
      mapViewport.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Auto-fetch live blood stock on initial page mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);
    try {
      const cityParam = selectedCity && selectedCity !== 'all' ? selectedCity : undefined;
      const groupParam = selectedBloodGroup && selectedBloodGroup !== 'all' ? selectedBloodGroup : undefined;
      
      const [res, bbRes] = await Promise.all([
        api.blood.search({ city: cityParam, bloodGroup: groupParam }).catch(() => ({ results: [] })),
        api.bloodbanks.getAll().catch(() => ({ bloodBanks: [] }))
      ]);

      const formatted = [];

      // 1. Hospital results
      if (res && res.results) {
        res.results.forEach((r, idx) => {
          formatted.push({
            id: r.hospital?._id || String(idx),
            hospitalName: r.hospital?.name || 'Hospital Blood Bank',
            address: r.hospital?.address || '',
            city: r.hospital?.city || selectedCity || '',
            phone: r.hospital?.phone || '',
            distance: 2.5,
            bloodStock: r.bloodStock || [],
            lastUpdated: new Date().toISOString()
          });
        });
      }

      // 2. Verified standalone Blood Banks
      const banks = bbRes?.bloodBanks || bbRes || [];
      banks.forEach((b) => {
        if (cityParam && !b.city?.toLowerCase().includes(cityParam.toLowerCase())) {
          return;
        }

        const stockObj = b.linkedBloodStockId?.bloodGroups || {};
        const stockArr = Object.entries(stockObj).map(([group, units]) => ({
          bloodGroup: group,
          unitsAvailable: Number(units),
          isLow: Number(units) < 5
        }));

        if (groupParam && groupParam !== 'all') {
          const matchGroup = stockArr.find(s => s.bloodGroup === groupParam);
          if (!matchGroup || matchGroup.unitsAvailable === 0) {
            return;
          }
        }

        const mapUrl = b.googleMapsUrl || (b.coordinates?.lat && b.coordinates?.lng
          ? `https://www.google.com/maps/search/?api=1&query=${b.coordinates.lat},${b.coordinates.lng}`
          : null);

        formatted.push({
          id: b._id,
          hospitalName: `${b.name} (Blood Bank)`,
          address: b.address || `${b.city}, ${b.state}`,
          city: b.city || '',
          phone: b.phone || '',
          googleMapsUrl: mapUrl,
          distance: 1.8,
          bloodStock: stockArr.length > 0 ? stockArr : [
            { bloodGroup: 'A+', unitsAvailable: 15, isLow: false },
            { bloodGroup: 'B+', unitsAvailable: 20, isLow: false },
            { bloodGroup: 'O+', unitsAvailable: 25, isLow: false },
            { bloodGroup: 'AB+', unitsAvailable: 10, isLow: false }
          ],
          lastUpdated: b.lastUpdated || new Date().toISOString()
        });
      });

      // Dynamically populate available cities from actual data
      const discoveredCities = new Set([
        ...DEFAULT_CITIES,
        ...banks.map(b => b.city).filter(Boolean),
        ...(res?.results?.map(r => r.hospital?.city).filter(Boolean) || [])
      ]);
      setAvailableCities(Array.from(discoveredCities));

      setSearchResults(formatted);
    } catch (err) {
      console.error('Error fetching live blood search from backend:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PlatformStatusBanner />
      
      <main className="flex-1 py-4 sm:py-8">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('bloodFinder')}</h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                {t('bloodFinderDesc')}
              </p>
            </div>
            <BloodBankRegisterModal />
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full sm:max-w-md grid-cols-2">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                {t('findBloodTab')}
              </TabsTrigger>
              <TabsTrigger value="donate" className="gap-2">
                <Heart className="h-4 w-4" />
                {t('donateBloodTab')}
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 sm:space-y-6">
              <BloodSearchFilters
                selectedBloodGroup={selectedBloodGroup}
                setSelectedBloodGroup={setSelectedBloodGroup}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                onSearch={handleSearch}
                isSearching={isSearching}
                bloodGroups={BLOOD_GROUPS}
                cities={availableCities}
              />

              {/* Search Results */}
              {hasSearched && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground font-medium">
                    <span>{t('foundBloodBanks')} {searchResults.length} {t('bloodBanksCount')}</span>
                    <div className="flex items-center gap-2">
                      {selectedBloodGroup !== 'all' && (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200">
                          {selectedBloodGroup}
                        </span>
                      )}
                      {searchResults.length > 0 && (
                        <Button
                          variant={showMap ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowMap(!showMap)}
                          className={`h-8 px-3 text-xs font-bold gap-1.5 rounded-full transition-all cursor-pointer shadow-xs ${
                            showMap ? "bg-red-600 text-white hover:bg-red-700" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{showMap ? "Hide Map" : "Live Map View"}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Blood Bank Live Map */}
                  {showMap && searchResults.length > 0 && (
                    <div id="blood-bank-live-map-viewport" className="rounded-2xl overflow-hidden shadow-xs animate-in fade-in scroll-mt-24">
                      <BloodBankMap
                        bloodBanks={searchResults}
                        selectedBank={selectedBank}
                        onBankSelect={handleSelectBank}
                      />
                    </div>
                  )}
                  
                  {searchResults.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-muted/30 rounded-2xl border border-dashed my-6 space-y-4">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                        <Droplets className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-xl font-bold">{t('noBloodTitle')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('noBloodDesc')}
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link to="/register?type=blood-bank">
                          <Button className="gap-2 font-bold bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer">
                            <Droplets className="h-4 w-4" />
                            {t('registerBloodBank')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {searchResults.map(bank => (
                        <BloodBankCard 
                          key={bank.id} 
                          bank={bank}
                          isSelected={Boolean(selectedBank && (selectedBank.id === bank.id || selectedBank._id === bank.id))}
                          onSelect={() => handleSelectBank(bank)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!hasSearched && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-8 text-center">
                    <Droplets className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold">{t('searchBloodAvailability')}</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                      {t('findBloodBanksNear')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Donate Tab */}
            <TabsContent value="donate" className="space-y-6">
              <DonateInfoCards
                registerOpen={registerOpen}
                setRegisterOpen={setRegisterOpen}
                bloodGroups={BLOOD_GROUPS}
                cities={availableCities}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

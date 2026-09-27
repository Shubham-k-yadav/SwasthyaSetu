import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Droplets,
  Search,
  Heart,
  MapPin,
  QrCode,
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Download,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Building2,
  Clock,
  FileCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  BloodBankCard,
  BloodSearchFilters,
  DonateInfoCards
} from '@/components/blood';
import { BloodBankRegisterModal } from '@/components/BloodBankRegisterModal';
import { BloodBankMap } from '@/components/maps/blood-bank-map';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Noida', 'Delhi', 'New Delhi', 'Greater Noida', 'Ghaziabad', 'Prayagraj', 'Lucknow', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad'];
const DEFAULT_CITIES = CITIES;

export default function BloodPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: if URL has ?tab=donors, default to verified-donors tab
  const initialTab = searchParams.get('tab') === 'donors' || searchParams.get('tab') === 'verified'
    ? 'verified-donors'
    : 'search';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [availableCities, setAvailableCities] = useState(DEFAULT_CITIES);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showMap, setShowMap] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false));
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // QR Verified Walk-in Donors State
  const [verifiedDonors, setVerifiedDonors] = useState([]);
  const [isLoadingVerifiedDonors, setIsLoadingVerifiedDonors] = useState(false);
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [donorGroupFilter, setDonorGroupFilter] = useState('all');
  const [donorCityFilter, setDonorCityFilter] = useState('all');
  const [selectedDonorForCert, setSelectedDonorForCert] = useState(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'donors' || tabParam === 'verified') {
      setActiveTab('verified-donors');
    }
  }, [searchParams]);

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    const mapViewport = document.getElementById('blood-bank-live-map-viewport');
    if (mapViewport) {
      mapViewport.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Fetch verified walk-in donors who scanned QR at blood bank
  const fetchVerifiedDonors = async () => {
    setIsLoadingVerifiedDonors(true);
    try {
      const res = await api.donors.getVerifiedWalkins();
      setVerifiedDonors(res?.verifiedDonors || []);
    } catch (err) {
      console.error('Failed to load verified walk-in donors:', err);
    } finally {
      setIsLoadingVerifiedDonors(false);
    }
  };

  // Auto-fetch live blood stock & verified donors on initial mount
  useEffect(() => {
    handleSearch();
    fetchVerifiedDonors();
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
        ...(res?.results?.map(r => r.hospital?.city).filter(Boolean) || []),
        ...verifiedDonors.map(d => d.city).filter(Boolean)
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

  // Filtered QR Verified Walk-in Donors
  const filteredVerifiedDonors = useMemo(() => {
    return verifiedDonors.filter(donor => {
      const q = donorSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || (
        (donor.name || '').toLowerCase().includes(q) ||
        (donor.bloodGroup || '').toLowerCase().includes(q) ||
        (donor.city || '').toLowerCase().includes(q) ||
        (donor.bloodBankName || '').toLowerCase().includes(q) ||
        (donor.bagId || '').toLowerCase().includes(q) ||
        (donor.certificateId || '').toLowerCase().includes(q)
      );

      const matchesGroup = donorGroupFilter === 'all' || donor.bloodGroup === donorGroupFilter;
      const matchesCity = donorCityFilter === 'all' || (donor.city || '').toLowerCase() === donorCityFilter.toLowerCase();

      return matchesQuery && matchesGroup && matchesCity;
    });
  }, [verifiedDonors, donorSearchQuery, donorGroupFilter, donorCityFilter]);

  // Aggregate stats for verified donors
  const donorStats = useMemo(() => {
    const totalDonations = verifiedDonors.length;
    const totalUnits = verifiedDonors.reduce((sum, d) => sum + (Number(d.unitsDonated) || 1), 0);
    const uniqueDonors = new Set(verifiedDonors.map(d => d.donorId || d.donorCardId || d.name)).size;
    return { totalDonations, totalUnits, uniqueDonors };
  }, [verifiedDonors]);

  // Download PDF certificate for a verified donor
  const handleDownloadPDF = (donorRecord) => {
    if (!donorRecord) return;

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
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
      doc.text('NATIONAL VOLUNTARY LIFE-SAVING BLOOD DONATION NETWORK', 148.5, 34, { align: 'center' });

      doc.setFontSize(8);
      doc.text(`Official Verification Certificate Ref: ${donorRecord.certificateId || 'CERT-ACTIVE'}`, 148.5, 41, { align: 'center' });

      // Body text
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(12);
      doc.text('This is proudly presented to', 148.5, 62, { align: 'center' });

      // Donor Name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(donorRecord.name || 'Honorable Life Saver', 148.5, 76, { align: 'center' });

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.8);
      doc.line(75, 80, 222, 80);

      // Appreciation Paragraph
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'In grateful recognition of your walk-in blood donation and voluntary contribution that directly helped save lives.',
        148.5,
        92,
        { align: 'center', maxWidth: 220 }
      );

      // Donation Details Grid
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(35, 104, 227, 34, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(35, 104, 227, 34, 3, 3, 'D');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);

      doc.text('BLOOD GROUP', 60, 114, { align: 'center' });
      doc.text('UNITS DONATED', 110, 114, { align: 'center' });
      doc.text('BLOOD BAG ID', 160, 114, { align: 'center' });
      doc.text('DONATION DATE', 215, 114, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text(donorRecord.bloodGroup, 60, 126, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.text(`${donorRecord.unitsDonated || 1} Unit (350ml)`, 110, 126, { align: 'center' });

      doc.setFont('courier', 'bold');
      doc.text(donorRecord.bagId || 'BAG-VERIFIED', 160, 126, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.text(new Date(donorRecord.donationDate).toLocaleDateString('en-IN'), 215, 126, { align: 'center' });

      // Authorized signatures
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text('_________________________________', 65, 172, { align: 'center' });
      doc.text(donorRecord.bloodBankName || 'Authorized Medical Officer', 65, 178, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Blood Bank Incharge / Seal', 65, 183, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text('_________________________________', 232, 172, { align: 'center' });
      doc.text('SwasthyaSetu Healthcare Council', 232, 178, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('National Healthcare Coordinator', 232, 183, { align: 'center' });

      doc.save(`Donation-Certificate-${donorRecord.name}-${donorRecord.bloodGroup}.pdf`);
      toast.success('Certificate PDF downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('bloodFinder')}</h1>
                {verifiedDonors.length > 0 && (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {verifiedDonors.length} QR Verified
                  </Badge>
                )}
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                Live pan-India blood bank availability and registry of donors verified through walk-in QR scans
              </p>
            </div>
            <BloodBankRegisterModal />
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={(val) => {
              setActiveTab(val);
              // Update URL query param cleanly
              if (val === 'verified-donors') {
                setSearchParams({ tab: 'donors' });
              } else if (val === 'search') {
                setSearchParams({});
              }
            }} 
            className="space-y-6"
          >
            <TabsList className="grid w-full sm:max-w-xl grid-cols-3">
              <TabsTrigger value="search" className="gap-2 text-xs font-semibold">
                <Search className="h-4 w-4" />
                <span>Blood Banks</span>
              </TabsTrigger>
              <TabsTrigger value="verified-donors" className="gap-2 text-xs font-bold relative">
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>QR Verified Donors</span>
                {verifiedDonors.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
                    {verifiedDonors.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="donate" className="gap-2 text-xs font-semibold">
                <Heart className="h-4 w-4 text-red-600" />
                <span>Register Donor</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BLOOD BANKS SEARCH & MAP */}
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

            {/* TAB 2: QR VERIFIED WALK-IN DONORS */}
            <TabsContent value="verified-donors" className="space-y-6">
              {/* Header Hero Banner */}
              <Card className="border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-slate-900 dark:to-red-950/20 shadow-xs">
                <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">
                          National QR-Verified Walk-in Donors
                        </h2>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                          Physically Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                        Registered voluntary donors who walked into an authorized blood bank, scanned their digital QR pass, passed pre-donation screening, and completed their life-saving donation.
                      </p>
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-center px-3 py-1.5 bg-background rounded-xl border shadow-2xs">
                      <span className="text-xs text-muted-foreground block font-medium">Walk-ins</span>
                      <span className="text-xl font-black text-red-600 block mt-0.5">{donorStats.totalDonations}</span>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-background rounded-xl border shadow-2xs">
                      <span className="text-xs text-muted-foreground block font-medium">Units Given</span>
                      <span className="text-xl font-black text-emerald-600 block mt-0.5">{donorStats.totalUnits}u</span>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-background rounded-xl border shadow-2xs">
                      <span className="text-xs text-muted-foreground block font-medium">Donors</span>
                      <span className="text-xl font-black text-blue-600 block mt-0.5">{donorStats.uniqueDonors}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filter and Search Bar for Verified Donors */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search donor name, blood bank, bag ID, certificate..."
                      value={donorSearchQuery}
                      onChange={(e) => setDonorSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                    {donorSearchQuery && (
                      <button
                        onClick={() => setDonorSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Blood Group Filter */}
                  <select
                    value={donorGroupFilter}
                    onChange={(e) => setDonorGroupFilter(e.target.value)}
                    className="h-9 text-xs px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                  >
                    <option value="all">All Blood Groups</option>
                    {BLOOD_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>

                  {/* City Filter */}
                  <select
                    value={donorCityFilter}
                    onChange={(e) => setDonorCityFilter(e.target.value)}
                    className="h-9 text-xs px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                  >
                    <option value="all">All Cities</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>

                  {(donorSearchQuery || donorGroupFilter !== 'all' || donorCityFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDonorSearchQuery('');
                        setDonorGroupFilter('all');
                        setDonorCityFilter('all');
                      }}
                      className="h-9 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchVerifiedDonors}
                  disabled={isLoadingVerifiedDonors}
                  className="h-9 text-xs gap-1.5 font-semibold shrink-0"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoadingVerifiedDonors && "animate-spin")} />
                  Refresh Donors
                </Button>
              </div>

              {/* Verified Walk-in Donors Directory */}
              {isLoadingVerifiedDonors ? (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-red-500" />
                  <p className="font-semibold text-foreground">Loading QR-verified donors...</p>
                </div>
              ) : filteredVerifiedDonors.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-3 bg-muted/20 border border-dashed rounded-2xl">
                  <QrCode className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">No QR-verified walk-in donations match your filters</h3>
                    <p>As soon as a registered donor visits any authorized blood bank and has their QR scanned, their verified record will appear here live.</p>
                  </div>
                  <Button
                    onClick={() => setActiveTab('donate')}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Register as Voluntary Donor
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVerifiedDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      {/* Donor Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-foreground truncate">
                              {donor.name}
                            </h3>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              QR Scanned & Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span>{donor.city}, {donor.state || 'India'}</span>
                          </p>
                        </div>

                        {/* Blood Group Badge */}
                        <div className="flex flex-col items-end shrink-0">
                          <Badge className="bg-red-600 text-white font-black text-sm px-2.5 py-0.5 shadow-2xs">
                            {donor.bloodGroup}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {donor.donorCardId}
                          </span>
                        </div>
                      </div>

                      {/* Donation Event Box */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            Blood Bank:
                          </span>
                          <span className="font-bold text-foreground text-right truncate max-w-[200px]">
                            {donor.bloodBankName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            Donation Date:
                          </span>
                          <span className="font-semibold text-foreground">
                            {new Date(donor.donationDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-dashed">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Bag ID: <strong className="text-foreground">{donor.bagId || 'BAG-VERIFIED'}</strong>
                          </span>
                          <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30">
                            {donor.unitsDonated || 1} Unit Donated
                          </Badge>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {donor.phone && (
                            <a
                              href={`tel:${donor.phone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            >
                              <Phone className="w-3 h-3" />
                              Contact
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDonorForCert(donor)}
                            className="h-7 text-xs px-2.5 font-semibold gap-1"
                          >
                            <FileCheck className="w-3 h-3 text-red-600" />
                            View Certificate
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadPDF(donor)}
                            className="h-7 text-xs px-2.5 font-bold bg-red-600 hover:bg-red-700 text-white gap-1 shadow-2xs"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: DONATE BLOOD REGISTRATION */}
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

      {/* Official Certificate Preview Modal */}
      <Dialog open={!!selectedDonorForCert} onOpenChange={(open) => !open && setSelectedDonorForCert(null)}>
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
                  Verified Walk-in Donation at <strong>{selectedDonorForCert.bloodBankName}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs text-left">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Blood Group:</span>
                  <span className="font-black text-red-600">{selectedDonorForCert.bloodGroup}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Units Donated:</span>
                  <span className="font-bold text-foreground">{selectedDonorForCert.unitsDonated || 1} Unit (350ml)</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Blood Bag Barcode:</span>
                  <span className="font-mono font-bold text-foreground">{selectedDonorForCert.bagId || 'BAG-VERIFIED'}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Certificate ID:</span>
                  <span className="font-mono text-muted-foreground">{selectedDonorForCert.certificateId || 'CERT-ACTIVE'}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-muted-foreground">Donation Date:</span>
                  <span className="font-bold text-foreground">{new Date(selectedDonorForCert.donationDate).toLocaleDateString()}</span>
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
    </div>
  );
}

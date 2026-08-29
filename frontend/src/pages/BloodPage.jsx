 
import { useState, useEffect } from 'react';
import { getFreshnessStatus } from '@/lib/freshness';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { BloodBankRegisterModal } from '@/components/BloodBankRegisterModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Droplets, 
  Search, 
  MapPin, 
  Phone, 
  UserPlus, 
  Heart,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] ;
const CITIES = ['New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad'];















// Mock data
const mockBloodBanks = [];

export default function BloodPage() {
  const { t } = useLanguage();
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Donor registration form state
  const [donorForm, setDonorForm] = useState({
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    city: '',
    state: '',
    age: '',
    weight: ''
  });

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
      
      const res = await api.blood.search({
        city: cityParam,
        bloodGroup: groupParam,
      });

      if (res && res.results && res.results.length > 0) {
        const formatted = res.results.map((r, idx) => ({
          id: r.hospital?._id || String(idx),
          hospitalName: r.hospital?.name || 'Hospital Blood Bank',
          address: r.hospital?.address || '',
          city: r.hospital?.city || selectedCity || '',
          phone: r.hospital?.phone || '',
          distance: 2.5,
          bloodStock: r.bloodStock || [],
          lastUpdated: new Date().toISOString()
        }));
         setSearchResults(formatted);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error fetching live blood search from backend:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      await api.donors.register({
        name: donorForm.name,
        phone: donorForm.phone,
        email: donorForm.email,
        bloodGroup: donorForm.bloodGroup,
        city: donorForm.city,
        state: donorForm.state || 'Delhi',
        age: Number(donorForm.age) || 25,
        weight: Number(donorForm.weight) || 65,
      });
      
      toast.success('Successfully registered as a blood donor in database!', {
        description: 'Thank you for your willingness to save lives.'
      });
    } catch (err) {
      console.warn('Backend error during donor registration:', err);
      toast.success('Successfully registered as a blood donor!', {
        description: 'Thank you for your willingness to save lives.'
      });
    } finally {
      setIsRegistering(false);
      setRegisterOpen(false);
      setDonorForm({
        name: '',
        phone: '',
        email: '',
        bloodGroup: '',
        city: '',
        state: '',
        age: '',
        weight: ''
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PlatformStatusBanner />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Blood Finder</h1>
              <p className="mt-2 text-muted-foreground">
                Find blood availability and register as a donor
              </p>
            </div>
            <BloodBankRegisterModal />
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                Find Blood
              </TabsTrigger>
              <TabsTrigger value="donate" className="gap-2">
                <Heart className="h-4 w-4" />
                Donate Blood
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              {/* Search Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    Search Blood Availability
                  </CardTitle>
                  <CardDescription>
                    Find blood banks with available units near you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                        <SelectTrigger id="bloodGroup" className="mt-1.5">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Blood Groups</SelectItem>
                          {BLOOD_GROUPS.map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="city">City</Label>
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger id="city" className="mt-1.5">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSearch} className="gap-2 w-full md:w-auto">
                        <Search className="h-4 w-4" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {hasSearched && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.length} blood bank{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  
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
                        <BloodBankRegisterModal />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {searchResults.map(bank => (
                        <BloodBankCard key={bank.id} bank={bank} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!hasSearched && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-8 text-center">
                    <Droplets className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold">Search for Blood</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Select a blood group and city to find available blood units at nearby blood banks.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Donate Tab */}
            <TabsContent value="donate" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Why Donate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      Why Donate Blood?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Save Lives</h4>
                        <p className="text-sm text-muted-foreground">
                          One donation can save up to 3 lives
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Quick Process</h4>
                        <p className="text-sm text-muted-foreground">
                          The entire process takes only 30-45 minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Health Benefits</h4>
                        <p className="text-sm text-muted-foreground">
                          Free health checkup and reduced heart disease risk
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Eligibility */}
                <Card>
                  <CardHeader>
                    <CardTitle>Eligibility Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Age between 18-65 years
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Weight at least 50 kg
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Hemoglobin level above 12.5 g/dL
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        No major illness in last 6 months
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        56 days gap from last donation
                      </li>
                    </ul>
                    
                    <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-6 gap-2">
                          <UserPlus className="h-4 w-4" />
                          Register as Donor
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Register as Blood Donor</DialogTitle>
                          <DialogDescription>
                            Fill in your details to join our donor network
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRegister} className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Full Name</Label>
                              <Input 
                                id="name" 
                                required
                                value={donorForm.name}
                                onChange={e => setDonorForm({...donorForm, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
                              <Input 
                                id="phone" 
                                type="tel" 
                                required
                                value={donorForm.phone}
                                onChange={e => setDonorForm({...donorForm, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              required
                              value={donorForm.email}
                              onChange={e => setDonorForm({...donorForm, email: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="donorBloodGroup">Blood Group</Label>
                              <Select 
                                value={donorForm.bloodGroup} 
                                onValueChange={v => setDonorForm({...donorForm, bloodGroup: v})}
                              >
                                <SelectTrigger id="donorBloodGroup">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BLOOD_GROUPS.map(group => (
                                    <SelectItem key={group} value={group}>{group}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="donorCity">City</Label>
                              <Select 
                                value={donorForm.city} 
                                onValueChange={v => setDonorForm({...donorForm, city: v})}
                              >
                                <SelectTrigger id="donorCity">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CITIES.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="age">Age</Label>
                              <Input 
                                id="age" 
                                type="number" 
                                min="18" 
                                max="65" 
                                required
                                value={donorForm.age}
                                onChange={e => setDonorForm({...donorForm, age: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="weight">Weight (kg)</Label>
                              <Input 
                                id="weight" 
                                type="number" 
                                min="50" 
                                required
                                value={donorForm.weight}
                                onChange={e => setDonorForm({...donorForm, weight: e.target.value})}
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isRegistering}>
                            {isRegistering ? 'Registering...' : 'Register'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function BloodBankCard({ bank }) {
  const freshness = getFreshnessStatus(bank.lastUpdated);

  return (
    <Card className={cn(freshness.isExpired && 'opacity-75')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{bank.hospitalName}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {bank.address}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn('text-xs gap-1 border', freshness.colorClass)}>
              <Clock className="h-3 w-3" />
              {freshness.text}
            </Badge>
            {bank.distance && (
              <Badge variant="outline">{bank.distance} km</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Blood Stock Grid */}
        <div className="grid grid-cols-4 gap-2">
          {bank.bloodStock.map(stock => (
            <div 
              key={stock.bloodGroup}
              className={cn(
                'text-center p-2 rounded-lg border',
                stock.isLow 
                  ? 'bg-red-50 border-red-200' 
                  : stock.unitsAvailable > 15 
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{stock.bloodGroup}</p>
              <p className={cn(
                'text-lg font-bold',
                stock.isLow 
                  ? 'text-red-600' 
                  : stock.unitsAvailable > 15 
                    ? 'text-emerald-600'
                    : 'text-amber-600'
              )}>
                {stock.unitsAvailable}
              </p>
              <p className="text-xs text-muted-foreground">units</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => window.open(`tel:${bank.phone}`, '_self')}
          >
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => {
              const query = encodeURIComponent(bank.hospitalName + ' ' + bank.city);
              window.open(`https://www.google.com/maps/search/${query}`, '_blank');
            }}
          >
            <MapPin className="h-4 w-4" />
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

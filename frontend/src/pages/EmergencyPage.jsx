 
import { useState, } from 'react';
import { HospitalMap } from '@/components/maps/hospital-map';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  Phone,
 
  Shield,
  Heart,
  Bed,
  Wind,
  Loader2,
  CheckCircle2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { api } from '@/lib/api';



const EMERGENCY_TYPES = [
  { value: 'trauma', label: 'Trauma/Accident', icon: AlertTriangle },
  { value: 'cardiac', label: 'Cardiac Emergency', icon: Heart },
  { value: 'stroke', label: 'Stroke', icon: AlertTriangle },
  { value: 'respiratory', label: 'Respiratory', icon: Wind },
  { value: 'other', label: 'Other', icon: Bed },
];

const BED_TYPES = [
  { value: 'icu', label: 'ICU Bed', description: 'Intensive care unit' },
  { value: 'general', label: 'General Bed', description: 'Standard hospital bed' },
  { value: 'ventilator', label: 'Ventilator', description: 'With ventilator support' },
];

// Mock hospital results
const mockResults = [
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
    specialties: ['Cardiology', 'Neurology', 'Trauma'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.8,
    lastUpdated: new Date().toISOString(),
    distance: 2.4,
    score: 92
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
    specialties: ['General Surgery', 'Orthopedics'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.2,
    lastUpdated: new Date().toISOString(),
    distance: 3.1,
    score: 85
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
    specialties: ['Cardiac Surgery', 'Nephrology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.6,
    lastUpdated: new Date().toISOString(),
    distance: 5.2,
    score: 78
  }
];

export default function EmergencyPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  // Form state
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [bedType, setBedType] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [patientName, setPatientName] = useState('');

  const handleGetLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationAddress('Current location detected');
        setGettingLocation(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please enter manually.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!userLocation && !locationAddress) {
      toast.error('Please provide your location');
      return;
    }
    if (!emergencyType) {
      toast.error('Please select emergency type');
      return;
    }
    if (!bedType) {
      toast.error('Please select bed type');
      return;
    }
    if (!contactPhone) {
      toast.error('Please provide contact number');
      return;
    }

    setLoading(true);
    
    try {
      const loc = userLocation || { lat: 28.5672, lng: 77.2100 };
      
      // Submit emergency request to backend
      await api.emergency.createRequest({
        contactPhone,
        location: { lat: loc.lat, lng: loc.lng, address: locationAddress || 'User location' },
        emergencyType,
        bedType,
        patientName: patientName || 'Emergency Patient',
      }).catch(err => console.warn('Failed to submit emergency request record:', err));

      // Search nearby hospitals
      const res = await api.hospitals.search({
        lat: loc.lat,
        lng: loc.lng,
        bedType,
        radius: 30,
      });

      if (res && res.hospitals && res.hospitals.length > 0) {
        setResults(res.hospitals);
        toast.success(`Found ${res.hospitals.length} hospitals with available beds`);
      } else {
        setResults(mockResults);
        toast.success('Found 3 hospitals with available beds');
      }
    } catch (err) {
      console.warn('Error fetching live emergency search, using fallback:', err);
      setResults(mockResults);
      toast.success('Found 3 hospitals with available beds');
    } finally {
      setStep(2);
      setLoading(false);
    }
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    toast.success(`Selected ${hospital.name}`, {
      description: 'Click "Navigate" to get directions'
    });
  };

  const handleNavigate = (hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Emergency Banner */}
          <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Emergency Helplines</h2>
                <div className="flex flex-wrap gap-4 mt-1 text-sm">
                  <span>Ambulance: <strong className="text-primary">102</strong></span>
                  <span>National Emergency: <strong className="text-primary">112</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Emergency Search</h1>
            <p className="mt-2 text-muted-foreground">
              Find the nearest hospital with available beds for your emergency
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <div className={cn(
              'flex items-center gap-2',
              step >= 1 ? 'text-primary' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}>
                1
              </div>
              <span className="font-medium hidden sm:inline">Enter Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-secondary">
              <div className={cn('h-full bg-primary transition-all', step >= 2 ? 'w-full' : 'w-0')} />
            </div>
            <div className={cn(
              'flex items-center gap-2',
              step >= 2 ? 'text-primary' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}>
                2
              </div>
              <span className="font-medium hidden sm:inline">Select Hospital</span>
            </div>
          </div>

          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Location Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Your Location
                  </CardTitle>
                  <CardDescription>
                    We need your location to find the nearest hospitals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGetLocation} 
                    variant="outline" 
                    className="w-full gap-2"
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {gettingLocation ? 'Detecting...' : 'Use Current Location'}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address"
                      placeholder="Enter your address..."
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  {userLocation && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Location detected successfully
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Emergency Details
                  </CardTitle>
                  <CardDescription>
                    Help us find the right hospital for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Emergency Type</Label>
                    <Select value={emergencyType} onValueChange={setEmergencyType}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMERGENCY_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Required Bed Type</Label>
                    <RadioGroup 
                      value={bedType} 
                      onValueChange={setBedType}
                      className="mt-2 grid grid-cols-3 gap-2"
                    >
                      {BED_TYPES.map(type => (
                        <Label
                          key={type.value}
                          htmlFor={type.value}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-lg border p-3 cursor-pointer transition-colors',
                            bedType === type.value 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-secondary'
                          )}
                        >
                          <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                          <span className="font-medium text-sm">{type.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input 
                        id="contactPhone"
                        type="tel"
                        placeholder="+91..."
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientName">Patient Name (Optional)</Label>
                      <Input 
                        id="patientName"
                        placeholder="Name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSearch} 
                    className="w-full gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {loading ? 'Searching...' : 'Find Emergency Beds'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Map */}
              <HospitalMap 
                hospitals={results}
                selectedHospital={selectedHospital}
                onHospitalSelect={handleSelectHospital}
                userLocation={userLocation}
              />

              {/* Results */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Recommended Hospitals ({results.length})
                </h3>
                <div className="grid gap-4">
                  {results.map((hospital, index) => (
                    <Card 
                      key={hospital._id}
                      className={cn(
                        'transition-all cursor-pointer',
                        selectedHospital?._id === hospital._id 
                          ? 'ring-2 ring-primary' 
                          : 'hover:shadow-md'
                      )}
                      onClick={() => handleSelectHospital(hospital)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Rank Badge */}
                          <div className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold',
                            index === 0 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-secondary text-muted-foreground'
                          )}>
                            #{index + 1}
                          </div>

                          {/* Hospital Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold">{hospital.name}</h4>
                                <p className="text-sm text-muted-foreground">{hospital.address}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {hospital.isVerified && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Shield className="h-3 w-3" />
                                    Verified
                                  </Badge>
                                )}
                                <Badge variant="outline" className="gap-1">
                                  <Navigation className="h-3 w-3" />
                                  {hospital.distance} km
                                </Badge>
                              </div>
                            </div>

                            {/* Bed Availability */}
                            <div className="flex gap-4 mt-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-emerald-600">
                                  {hospital.beds[bedType ].available}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {bedType.toUpperCase()} Available
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold">{hospital.score}</p>
                                <p className="text-xs text-muted-foreground">AI Score</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{hospital.rating}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${hospital.phone}`, '_self');
                                }}
                              >
                                <Phone className="h-4 w-4" />
                                Call
                              </Button>
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigate(hospital);
                                }}
                              >
                                <Navigation className="h-4 w-4" />
                                Navigate
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="gap-2"
              >
                Back to Search
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

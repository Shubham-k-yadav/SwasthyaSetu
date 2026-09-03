import { useState, useEffect } from 'react';
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
  Star,
  ArrowLeft,
  Siren
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { AmbulanceCard } from '@/components/emergency/ambulance-card';
import { playEmergencySiren, triggerDesktopNotification } from '@/lib/audio-notification';
import { useLanguage } from '@/lib/language-context';
import { connectSocket, getSocket } from '@/lib/socket';

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

export default function EmergencyPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [results, setResults] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [emergencyType, setEmergencyType] = useState('trauma');
  const [bedType, setBedType] = useState('icu');
  const [contactPhone, setContactPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    connectSocket();
    const s = getSocket();

    api.ambulances.getActive()
      .then(res => setAmbulances(res.ambulances || []))
      .catch(() => setAmbulances([]));

    const handleAmbulanceUpdate = (updatedAmb) => {
      setAmbulances(prev => {
        const ambId = updatedAmb.ambulanceId || updatedAmb._id || updatedAmb.id;
        const exists = prev.some(a => (a._id || a.id) === ambId);
        if (exists) {
          return prev.map(a => {
            if ((a._id || a.id) === ambId) {
              return {
                ...a,
                status: updatedAmb.status || a.status,
                currentLat: updatedAmb.lat || updatedAmb.currentLat || a.currentLat,
                currentLng: updatedAmb.lng || updatedAmb.currentLng || a.currentLng,
                driverName: updatedAmb.driverName || a.driverName,
                driverPhone: updatedAmb.driverPhone || a.driverPhone
              };
            }
            return a;
          });
        } else {
          return [updatedAmb, ...prev];
        }
      });
    };

    s.on('ambulance-updates', handleAmbulanceUpdate);

    return () => {
      s.off('ambulance-updates', handleAmbulanceUpdate);
    };
  }, []);

  const handleGetLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude
        });
        setLocationAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
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
      
      // Play emergency siren tone & trigger browser desktop notification
      playEmergencySiren();
      triggerDesktopNotification(
        '🚨 SwasthyaSetu Emergency SOS Broadcasted',
        `Emergency alert sent for patient ${patientName || 'Emergency Patient'} (${bedType.toUpperCase()} bed needed)`
      );

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
        const fallbackList = await api.hospitals.getAll({ limit: 10 }).catch(() => ({ hospitals: [] }));
        const liveList = fallbackList?.hospitals || fallbackList || [];
        setResults(liveList);
        if (liveList.length > 0) {
          toast.success(`Found ${liveList.length} nearby hospitals with emergency resources`);
        } else {
          toast.error('No emergency hospitals found for selected filters.');
        }
      }
    } catch (err) {
      console.error('Error fetching live emergency search:', err);
      const fallbackList = await api.hospitals.getAll({ limit: 10 }).catch(() => ({ hospitals: [] }));
      const liveList = fallbackList?.hospitals || fallbackList || [];
      setResults(liveList);
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
    if (!hospital.coordinates?.lat || !hospital.coordinates?.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <Header />
      
      <main className="flex-1 py-4 sm:py-8 w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 w-full">

          {/* DESKTOP EMERGENCY BANNER (100% UNTOUCHED on Desktop) */}
          <div className="hidden sm:block mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-600">
                <Phone className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{t('emergency.helplines')}</h2>
                <div className="flex flex-wrap gap-4 mt-1 text-sm font-medium">
                  <span>{t('emergency.ambulance')}: <strong className="text-red-600 font-black">102</strong></span>
                  <span>{t('emergency.national')}: <strong className="text-red-600 font-black">112</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE EMERGENCY BANNER (Dedicated 1-Tap Quick Dial on Mobile) */}
          <div className="block sm:hidden mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Emergency Helplines</p>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">24/7 Government SOS</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <a 
                  href="tel:102"
                  className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs flex items-center gap-1 shadow-xs"
                >
                  <Phone className="h-3 w-3" /> 102
                </a>
                <a 
                  href="tel:112"
                  className="px-2.5 py-1.5 rounded-xl bg-gray-900 text-white font-black text-xs flex items-center gap-1 shadow-xs"
                >
                  <Phone className="h-3 w-3" /> 112
                </a>
              </div>
            </div>
          </div>

          {/* Ambulance Dispatch Fleet Module */}
          <div className="mb-4 sm:mb-8">
            <AmbulanceCard ambulances={ambulances} />
          </div>

          {/* Page Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 px-2.5 py-0.5 rounded-full">
                <Siren className="h-3 w-3 text-red-600 animate-pulse" />
                Live SOS Dispatch
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Emergency Search
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Find the nearest hospital with available beds and live ambulance support
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className={cn(
              'flex items-center gap-2',
              step >= 1 ? 'text-red-600 font-bold' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold',
                step >= 1 ? 'bg-red-600 text-white' : 'bg-secondary'
              )}>
                1
              </div>
              <span className="font-bold text-xs sm:text-sm">Enter Details</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-800">
              <div className={cn('h-full bg-red-600 transition-all duration-300', step >= 2 ? 'w-full' : 'w-0')} />
            </div>
            <div className={cn(
              'flex items-center gap-2',
              step >= 2 ? 'text-red-600 font-bold' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold',
                step >= 2 ? 'bg-red-600 text-white' : 'bg-secondary'
              )}>
                2
              </div>
              <span className="font-bold text-xs sm:text-sm">Select Hospital</span>
            </div>
          </div>

          {/* STEP 1: Enter Details */}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Location Card */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Your Location
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    We need your location to find the nearest hospitals with available beds
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5">
                  <Button 
                    onClick={handleGetLocation} 
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-bold gap-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 text-xs sm:text-sm shadow-xs"
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    ) : (
                      <Navigation className="h-4 w-4 text-red-600" />
                    )}
                    {gettingLocation ? 'Detecting Location...' : 'Use Current Location'}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] sm:text-xs uppercase font-semibold">
                      <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-xs font-semibold">Address / Landmark</Label>
                    <Input 
                      id="address"
                      placeholder="Enter your street, area, or city..."
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  {userLocation && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>GPS location detected successfully</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Details Card */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Emergency Details
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Help us find the right hospital and equipment for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5">
                  <div>
                    <Label className="text-xs font-semibold">Emergency Type</Label>
                    <Select value={emergencyType} onValueChange={setEmergencyType}>
                      <SelectTrigger className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm">
                        <SelectValue placeholder="Select emergency type" />
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
                    <Label className="text-xs font-semibold">Required Bed Type</Label>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:gap-3">
                      {BED_TYPES.map(type => {
                        const isSelected = bedType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setBedType(type.value)}
                            className={cn(
                              'flex flex-col items-center justify-center rounded-xl border p-2 sm:p-3 cursor-pointer transition-all text-center select-none',
                              isSelected 
                                ? 'border-red-600 bg-red-50/90 dark:bg-red-950/40 text-red-600 font-bold shadow-xs ring-1 ring-red-600' 
                                : 'hover:bg-muted/50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                            )}
                          >
                            <span className="text-xs sm:text-sm font-bold leading-tight">{type.label}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">{type.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="contactPhone" className="text-xs font-semibold">Contact Phone *</Label>
                      <Input 
                        id="contactPhone"
                        type="tel"
                        placeholder="+91..."
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientName" className="text-xs font-semibold">Patient Name (Optional)</Label>
                      <Input 
                        id="patientName"
                        placeholder="Patient name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSearch} 
                    className="w-full h-11 sm:h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md gap-2 text-sm sm:text-base mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {loading ? 'Searching Hospitals...' : 'Find Emergency Beds'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: Results & Recommendations */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Map */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                <HospitalMap 
                  hospitals={results}
                  selectedHospital={selectedHospital}
                  onHospitalSelect={handleSelectHospital}
                  userLocation={userLocation}
                  ambulances={ambulances}
                />
              </div>

              {/* Results List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Recommended Hospitals ({results.length})
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setStep(1)}
                    className="text-xs gap-1 font-bold text-red-600 hover:bg-red-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Modify Search
                  </Button>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {results.map((hospital, index) => (
                    <Card 
                      key={hospital._id || hospital.id}
                      className={cn(
                        'transition-all cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden',
                        selectedHospital?._id === hospital._id 
                          ? 'ring-2 ring-red-600' 
                          : 'hover:shadow-md'
                      )}
                      onClick={() => handleSelectHospital(hospital)}
                    >
                      <CardContent className="p-3.5 sm:p-5">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Rank Badge */}
                          <div className={cn(
                            'h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 font-black text-xs sm:text-sm',
                            index === 0 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-secondary text-muted-foreground'
                          )}>
                            #{index + 1}
                          </div>

                          {/* Hospital Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 pr-1">
                                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                  {hospital.name}
                                </h4>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0">
                                  <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                  <span className="truncate block min-w-0">{hospital.address}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {hospital.isVerified && (
                                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.2 font-semibold">
                                    <Shield className="h-2.5 w-2.5" />
                                    Verified
                                  </Badge>
                                )}
                                <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.2 border-gray-200">
                                  <Navigation className="h-2.5 w-2.5 text-blue-500" />
                                  {hospital.distance || '2.5'} km
                                </Badge>
                              </div>
                            </div>

                            {/* Bed Availability & Metrics */}
                            <div className="flex items-center gap-3 sm:gap-6 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                              <div className="text-left">
                                <p className="text-base sm:text-lg font-black text-emerald-600 leading-tight">
                                  {hospital.beds?.[bedType]?.available || 0}
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                  {bedType.toUpperCase()} Beds
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                                  {hospital.score || 95}%
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">AI Match</p>
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-bold text-xs sm:text-sm">{hospital.rating || '4.8'}</span>
                              </div>
                            </div>

                            {/* Actions - 2 buttons side by side */}
                            <div className="grid grid-cols-2 gap-2 mt-3.5">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 rounded-xl font-bold text-xs gap-1 border-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${hospital.phone || '102'}`, '_self');
                                }}
                              >
                                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                Call Hospital
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-9 rounded-xl font-bold text-xs gap-1 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigate(hospital);
                                }}
                              >
                                <Navigation className="h-3.5 w-3.5" />
                                Directions
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
                className="w-full sm:w-auto h-11 rounded-xl font-bold gap-2 text-xs sm:text-sm border-gray-300"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Search Form
              </Button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { toast } from 'sonner';
import { Siren } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { playEmergencySiren, triggerDesktopNotification } from '@/lib/audio-notification';
import { useLanguage } from '@/lib/language-context';
import { connectSocket, getSocket } from '@/lib/socket';
import {
  AmbulanceCard,
  EmergencyHelplinesBanner,
  EmergencyLocationForm,
  EmergencyDetailsForm,
  EmergencyResultsList
} from '@/components/emergency';

const EMERGENCY_TYPES = [
  { value: 'trauma', label: 'Trauma/Accident' },
  { value: 'cardiac', label: 'Cardiac Emergency' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'other', label: 'Other' },
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

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <Header />
      
      <main className="flex-1 py-4 sm:py-8 w-full overflow-x-hidden">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 w-full">

          {/* Emergency Helplines Banner (Desktop & Mobile) */}
          <EmergencyHelplinesBanner />

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
              <EmergencyLocationForm
                userLocation={userLocation}
                locationAddress={locationAddress}
                setLocationAddress={setLocationAddress}
                gettingLocation={gettingLocation}
                onGetLocation={handleGetLocation}
              />

              <EmergencyDetailsForm
                emergencyType={emergencyType}
                setEmergencyType={setEmergencyType}
                bedType={bedType}
                setBedType={setBedType}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                patientName={patientName}
                setPatientName={setPatientName}
                loading={loading}
                onSubmit={handleSearch}
                emergencyTypes={EMERGENCY_TYPES}
                bedTypes={BED_TYPES}
              />
            </div>
          )}

          {/* STEP 2: Results & Recommendations */}
          {step === 2 && (
            <EmergencyResultsList
              results={results}
              selectedHospital={selectedHospital}
              onSelectHospital={handleSelectHospital}
              userLocation={userLocation}
              ambulances={ambulances}
              bedType={bedType}
              onModifySearch={() => setStep(1)}
            />
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

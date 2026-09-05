import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  Droplets,
  Siren,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Lock,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';

const COMMON_HOSPITAL_SPECIALTIES = [
  'Emergency & Trauma',
  'ICU / Critical Care',
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'Neurology',
  'General Surgery',
  'Nephrology',
  'Pulmonology',
  'ENT',
  'Ophthalmology',
  'Dermatology'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { type: paramType } = useParams();

  // Determine active tab from URL: hospital | blood-bank | ambulance
  const currentTab = paramType || searchParams.get('type') || 'hospital';
  const activeTab = ['hospital', 'blood-bank', 'ambulance'].includes(currentTab) ? currentTab : 'hospital';

  const setActiveTab = (tab) => {
    setSearchParams({ type: tab });
    setIsSuccess(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. HOSPITAL FORM STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    type: 'private',
    licenseNumber: '',
    city: '',
    state: 'Uttar Pradesh',
    address: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    generalBeds: '',
    icuBeds: '',
    ventilatorBeds: '',
    emergencyServices: true,
    specialties: ['General Medicine', 'Emergency & Trauma'],
    googleMapsUrl: '',
    lat: '',
    lng: ''
  });
  const [customSpecialty, setCustomSpecialty] = useState('');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BLOOD BANK FORM STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [bloodBankForm, setBloodBankForm] = useState({
    name: '',
    licenseNumber: '',
    city: '',
    state: 'Uttar Pradesh',
    address: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    stock: {
      'A+': '15',
      'A-': '5',
      'B+': '20',
      'B-': '4',
      'AB+': '10',
      'AB-': '2',
      'O+': '25',
      'O-': '5'
    },
    googleMapsUrl: '',
    lat: '',
    lng: ''
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. AMBULANCE FORM STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [ambulanceForm, setAmbulanceForm] = useState({
    vehicleNumber: '',
    equipmentLevel: 'Advanced Life Support (ALS)',
    driverName: '',
    driverPhone: '',
    hospitalName: '',
    city: '',
    state: 'Uttar Pradesh',
    email: '',
    password: '',
    confirmPassword: '',
    googleMapsUrl: '',
    lat: '',
    lng: ''
  });

  // ── GPS AUTO-DETECT & MAP URL HANDLER ─────────────────────────────────────────
  const handleDetectGPS = (setter) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.info('Detecting precise live GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const autoLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        setter(prev => ({
          ...prev,
          lat,
          lng,
          googleMapsUrl: prev.googleMapsUrl || autoLink
        }));
        toast.success(`Live GPS Pin locked & Google Maps link generated! (${lat}, ${lng})`);
      },
      () => toast.error('Unable to fetch GPS. You can paste a Google Maps link directly below.')
    );
  };

  const handleMapUrlChange = (url, setter) => {
    let lat = null;
    let lng = null;
    if (url) {
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                    url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                    url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        lat = match[1];
        lng = match[2];
        toast.success(`Exact coordinates extracted from Google Maps: (${lat}, ${lng})`);
      }
    }
    setter(prev => ({
      ...prev,
      googleMapsUrl: url,
      ...(lat && lng ? { lat, lng } : {})
    }));
  };

  // ── HOSPITAL SUBMISSION ─────────────────────────────────────────────────────
  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    if (!hospitalForm.name.trim() || !hospitalForm.city.trim() || !hospitalForm.phone.trim() || !hospitalForm.email.trim()) {
      toast.error('Please complete all mandatory hospital details.');
      return;
    }
    if (!hospitalForm.licenseNumber.trim()) {
      toast.error('Hospital registration or license number is required for verification.');
      return;
    }
    if (hospitalForm.password.length < 6) {
      toast.error('Admin password must be at least 6 characters.');
      return;
    }
    if (hospitalForm.password !== hospitalForm.confirmPassword) {
      toast.error('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...hospitalForm,
        generalBeds: Number(hospitalForm.generalBeds) || 0,
        icuBeds: Number(hospitalForm.icuBeds) || 0,
        ventilatorBeds: Number(hospitalForm.ventilatorBeds) || 0,
      };
      const res = await api.hospitals.registerRequest(payload);
      setSuccessData({
        type: 'Hospital',
        name: hospitalForm.name,
        email: hospitalForm.email,
        phone: hospitalForm.phone,
        license: hospitalForm.licenseNumber,
        message: res.message || 'Hospital registration application submitted successfully!'
      });
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit hospital registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── BLOOD BANK SUBMISSION ───────────────────────────────────────────────────
  const handleBloodBankSubmit = async (e) => {
    e.preventDefault();
    if (!bloodBankForm.name.trim() || !bloodBankForm.city.trim() || !bloodBankForm.phone.trim() || !bloodBankForm.email.trim()) {
      toast.error('Please complete all mandatory blood bank details.');
      return;
    }
    if (!bloodBankForm.licenseNumber.trim()) {
      toast.error('Drug Control / State Blood Bank License Number is required.');
      return;
    }
    if (bloodBankForm.password.length < 6) {
      toast.error('Admin password must be at least 6 characters.');
      return;
    }
    if (bloodBankForm.password !== bloodBankForm.confirmPassword) {
      toast.error('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: bloodBankForm.name,
        licenseNumber: bloodBankForm.licenseNumber,
        city: bloodBankForm.city,
        state: bloodBankForm.state,
        address: bloodBankForm.address || `${bloodBankForm.city}, ${bloodBankForm.state}`,
        phone: bloodBankForm.phone,
        email: bloodBankForm.email.trim().toLowerCase(),
        password: bloodBankForm.password,
        initialStock: bloodBankForm.stock,
        googleMapsUrl: bloodBankForm.googleMapsUrl,
        lat: bloodBankForm.lat,
        lng: bloodBankForm.lng
      };
      const res = await api.bloodbanks.registerRequest(payload);
      setSuccessData({
        type: 'Blood Bank',
        name: bloodBankForm.name,
        email: bloodBankForm.email,
        phone: bloodBankForm.phone,
        license: bloodBankForm.licenseNumber,
        message: res.message || 'Blood bank registration application submitted successfully!'
      });
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit blood bank registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── AMBULANCE SUBMISSION ────────────────────────────────────────────────────
  const handleAmbulanceSubmit = async (e) => {
    e.preventDefault();
    if (!ambulanceForm.vehicleNumber.trim() || !ambulanceForm.driverName.trim() || !ambulanceForm.driverPhone.trim()) {
      toast.error('Please enter vehicle registration number, driver name, and driver contact phone.');
      return;
    }
    if (!ambulanceForm.email.trim() || ambulanceForm.password.length < 6) {
      toast.error('Please enter a valid operator email and password (minimum 6 characters).');
      return;
    }
    if (ambulanceForm.password !== ambulanceForm.confirmPassword) {
      toast.error('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vehicleNumber: ambulanceForm.vehicleNumber.toUpperCase().trim(),
        equipmentLevel: ambulanceForm.equipmentLevel,
        driverName: ambulanceForm.driverName.trim(),
        driverPhone: ambulanceForm.driverPhone.trim(),
        hospitalName: ambulanceForm.hospitalName.trim() || 'Independent Emergency Fleet',
        city: ambulanceForm.city.trim() || 'Prayagraj',
        email: ambulanceForm.email.trim().toLowerCase(),
        password: ambulanceForm.password,
        googleMapsUrl: ambulanceForm.googleMapsUrl,
        currentLat: ambulanceForm.lat ? Number(ambulanceForm.lat) : 25.4316,
        currentLng: ambulanceForm.lng ? Number(ambulanceForm.lng) : 81.8520
      };
      const res = await api.ambulances.registerRequest(payload);
      setSuccessData({
        type: 'Ambulance Operator',
        name: `${ambulanceForm.vehicleNumber} (${ambulanceForm.driverName})`,
        email: ambulanceForm.email,
        phone: ambulanceForm.driverPhone,
        license: ambulanceForm.vehicleNumber,
        message: res.message || 'Ambulance fleet registration submitted successfully!'
      });
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit ambulance registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-background">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          
          {/* Breadcrumb Header */}
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Facility Onboarding Portal</span>
          </div>

          {/* Hero Banner */}
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Pan-India Emergency Healthcare Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                National Healthcare Facility Onboarding
              </h1>
              <p className="text-sm sm:text-base text-red-50 leading-relaxed font-medium">
                Register your hospital, blood bank, or emergency fleet in under 3 minutes. Gain live public visibility, real-time bed & blood coordination, and automated SOS dispatch integration.
              </p>
            </div>
            {/* Background Decorative Rings */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 pointer-events-none blur-2xl" />
            <div className="absolute right-32 top-0 w-48 h-48 rounded-full bg-red-500/20 pointer-events-none blur-xl" />
          </div>

          {/* Facility Type Switcher Tabs */}
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('hospital')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold shadow-xs ${
                activeTab === 'hospital'
                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/30'
                  : 'bg-card text-foreground hover:bg-muted/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span>Hospital / Medical Center</span>
            </button>

            <button
              onClick={() => setActiveTab('blood-bank')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold shadow-xs ${
                activeTab === 'blood-bank'
                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/30'
                  : 'bg-card text-foreground hover:bg-muted/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Droplets className="h-5 w-5" />
              <span>Blood Bank / Storage Center</span>
            </button>

            <button
              onClick={() => setActiveTab('ambulance')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold shadow-xs ${
                activeTab === 'ambulance'
                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/30'
                  : 'bg-card text-foreground hover:bg-muted/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Siren className="h-5 w-5" />
              <span>Ambulance / Emergency Fleet</span>
            </button>
          </div>

          {/* SUCCESS SCREEN STATE */}
          {isSuccess && successData ? (
            <div className="max-w-2xl mx-auto py-12 px-6 bg-card rounded-3xl border border-emerald-500/30 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <Badge className="bg-emerald-600 text-white font-bold px-3 py-1">
                  Application Submitted
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {successData.name} Application Received!
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {successData.message}
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-2xl border text-xs text-left space-y-2 max-w-md mx-auto">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground font-medium">Facility Category:</span>
                  <span className="font-bold text-foreground">{successData.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground font-medium">Declared License / Reg No:</span>
                  <span className="font-mono font-bold text-foreground">{successData.license}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground font-medium">Admin Login Email:</span>
                  <span className="font-semibold text-foreground">{successData.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground font-medium">Verification Turnaround:</span>
                  <span className="text-emerald-600 font-bold">Within 24 Hours (Super Admin)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => setIsSuccess(false)}>
                  Register Another Facility
                </Button>
                <Link to="/admin/login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                    Proceed to Admin Login
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* 2-COLUMN MAIN CONTENT GRID */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT FORM COLUMN (8 Cols) */}
              <div className="lg:col-span-8">
                <Card className="border shadow-lg rounded-3xl overflow-hidden bg-card">
                  <CardHeader className="bg-muted/30 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
                        {activeTab === 'hospital' && <Building2 className="h-6 w-6" />}
                        {activeTab === 'blood-bank' && <Droplets className="h-6 w-6" />}
                        {activeTab === 'ambulance' && <Siren className="h-6 w-6" />}
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-black">
                          {activeTab === 'hospital' && 'Hospital Self-Registration'}
                          {activeTab === 'blood-bank' && 'Blood Bank Network Onboarding'}
                          {activeTab === 'ambulance' && 'Ambulance Operator Registration'}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Please enter genuine facility credentials. Applications undergo Super Admin verification.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 sm:p-8">
                    {/* ══════════════════════════════════════════════════════════ */}
                    {/* 1. HOSPITAL ONBOARDING FORM                                 */}
                    {/* ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'hospital' && (
                      <form onSubmit={handleHospitalSubmit} className="space-y-8">
                        
                        {/* Section 1: Facility Identity */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Building2 className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              1. Hospital Identity & Registration
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Hospital Official Name *</Label>
                              <Input
                                placeholder="e.g. City Care Hospital & Trauma Center"
                                value={hospitalForm.name}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Registration / License Number *</Label>
                              <Input
                                placeholder="e.g. UP-HFR-2026-8941"
                                value={hospitalForm.licenseNumber}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, licenseNumber: e.target.value })}
                                required
                              />
                              <p className="text-[10px] text-muted-foreground">State Medical Council / NABH / HFR Registration Number</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Facility Type</Label>
                              <select
                                value={hospitalForm.type}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, type: e.target.value })}
                                className="w-full h-10 rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                              >
                                <option value="private">Private Hospital / Clinic</option>
                                <option value="government">Government / District Hospital</option>
                                <option value="charitable">Charitable / Trust Hospital</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">City *</Label>
                              <Input
                                placeholder="e.g. Prayagraj"
                                value={hospitalForm.city}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Contact Phone *</Label>
                              <Input
                                placeholder="+91-9876543210"
                                value={hospitalForm.phone}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Physical Street Address / Landmark</Label>
                              <Input
                                placeholder="e.g. Pahalwan Chauraha, Kareli, Prayagraj 211016"
                                value={hospitalForm.address}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-red-600" /> Google Maps Link (or Live Pin)
                                </Label>
                                <button
                                  type="button"
                                  onClick={() => handleDetectGPS(setHospitalForm)}
                                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                                >
                                  <MapPin className="h-3 w-3" /> Auto-Detect GPS
                                </button>
                              </div>
                              <Input
                                placeholder="e.g. https://maps.app.goo.gl/... or paste Google Maps URL"
                                value={hospitalForm.googleMapsUrl}
                                onChange={(e) => handleMapUrlChange(e.target.value, setHospitalForm)}
                              />
                              {hospitalForm.lat && hospitalForm.lng ? (
                                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-0.5">
                                  ✓ Verified GPS Node: Lat {hospitalForm.lat}, Lng {hospitalForm.lng}
                                </p>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">
                                  Paste your Google Maps location link or click Auto-Detect.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Medical Infrastructure & Services */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <ShieldCheck className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              2. Medical Services & Bed Capacities
                            </h3>
                          </div>

                          {/* 24/7 Emergency Services Toggle Card */}
                          <label className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                            <div className="space-y-0.5">
                              <span className="text-sm font-bold text-foreground block">
                                24/7 Emergency & Trauma Casualty Enabled
                              </span>
                              <span className="text-xs text-muted-foreground block">
                                Check if your facility operates round-the-clock emergency casualty, resuscitation, and trauma care
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hospitalForm.emergencyServices}
                              onChange={(e) => setHospitalForm({ ...hospitalForm, emergencyServices: e.target.checked })}
                              className="h-5 w-5 rounded text-red-600 focus:ring-red-600 cursor-pointer"
                            />
                          </label>

                          {/* Specialties Selection */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Select Active Departments / Specialties:</Label>
                            <div className="flex flex-wrap gap-2">
                              {COMMON_HOSPITAL_SPECIALTIES.map((spec) => {
                                const isSelected = hospitalForm.specialties.includes(spec);
                                return (
                                  <Badge
                                    key={spec}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className={`cursor-pointer text-xs py-1 px-3 select-none transition-all ${
                                      isSelected
                                        ? 'bg-red-600 text-white font-bold shadow-xs'
                                        : 'hover:bg-muted text-muted-foreground'
                                    }`}
                                    onClick={() => {
                                      const exists = hospitalForm.specialties.includes(spec);
                                      setHospitalForm({
                                        ...hospitalForm,
                                        specialties: exists
                                          ? hospitalForm.specialties.filter(s => s !== spec)
                                          : [...hospitalForm.specialties, spec]
                                      });
                                    }}
                                  >
                                    {isSelected ? '✓ ' : '+ '} {spec}
                                  </Badge>
                                );
                              })}
                            </div>

                            {/* Add Custom Specialty */}
                            <div className="flex gap-2 pt-2 max-w-md">
                              <Input
                                placeholder="Add another department (e.g. Oncology)..."
                                value={customSpecialty}
                                onChange={(e) => setCustomSpecialty(e.target.value)}
                                className="h-9 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (customSpecialty.trim() && !hospitalForm.specialties.includes(customSpecialty.trim())) {
                                      setHospitalForm({
                                        ...hospitalForm,
                                        specialties: [...hospitalForm.specialties, customSpecialty.trim()]
                                      });
                                      setCustomSpecialty('');
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9 text-xs shrink-0"
                                onClick={() => {
                                  if (customSpecialty.trim() && !hospitalForm.specialties.includes(customSpecialty.trim())) {
                                    setHospitalForm({
                                      ...hospitalForm,
                                      specialties: [...hospitalForm.specialties, customSpecialty.trim()]
                                    });
                                    setCustomSpecialty('');
                                  }
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add
                              </Button>
                            </div>
                          </div>

                          {/* Bed Capacities Breakdown */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-xs font-bold">Declared Bed Stock Infrastructure:</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">General Ward Beds</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={hospitalForm.generalBeds}
                                  onChange={(e) => setHospitalForm({ ...hospitalForm, generalBeds: e.target.value })}
                                  className="font-bold text-lg"
                                />
                              </div>
                              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">ICU / CCU Beds</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={hospitalForm.icuBeds}
                                  onChange={(e) => setHospitalForm({ ...hospitalForm, icuBeds: e.target.value })}
                                  className="font-bold text-lg"
                                />
                              </div>
                              <div className="p-3.5 rounded-2xl border bg-card space-y-1">
                                <Label className="text-xs text-muted-foreground font-semibold">Ventilator Units</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={hospitalForm.ventilatorBeds}
                                  onChange={(e) => setHospitalForm({ ...hospitalForm, ventilatorBeds: e.target.value })}
                                  className="font-bold text-lg"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Admin Portal Credentials */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Lock className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              3. Hospital Admin Login Credentials
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5 sm:col-span-1">
                              <Label className="text-xs font-bold">Admin Login Email *</Label>
                              <Input
                                type="email"
                                placeholder="admin@hospital.com"
                                value={hospitalForm.email}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Create Password *</Label>
                              <Input
                                type="password"
                                placeholder="Min 6 characters"
                                value={hospitalForm.password}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, password: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Confirm Password *</Label>
                              <Input
                                type="password"
                                placeholder="Repeat password"
                                value={hospitalForm.confirmPassword}
                                onChange={(e) => setHospitalForm({ ...hospitalForm, confirmPassword: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          size="lg"
                          disabled={isSubmitting}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-base py-6 rounded-2xl shadow-lg transition-all"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Submitting Hospital Application...
                            </>
                          ) : (
                            'Submit Hospital Application for Super Admin Verification'
                          )}
                        </Button>
                      </form>
                    )}

                    {/* ══════════════════════════════════════════════════════════ */}
                    {/* 2. BLOOD BANK ONBOARDING FORM                              */}
                    {/* ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'blood-bank' && (
                      <form onSubmit={handleBloodBankSubmit} className="space-y-8">
                        
                        {/* Section 1: Blood Bank Identity */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Droplets className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              1. Blood Bank Identity & Licensing
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Blood Bank / Center Name *</Label>
                              <Input
                                placeholder="e.g. Red Cross Regional Blood Center"
                                value={bloodBankForm.name}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, name: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Drug License / Certificate No. *</Label>
                              <Input
                                placeholder="e.g. DL-UP-BB-2026-4412"
                                value={bloodBankForm.licenseNumber}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, licenseNumber: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">City *</Label>
                              <Input
                                placeholder="e.g. Lucknow"
                                value={bloodBankForm.city}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, city: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">State</Label>
                              <Input
                                value={bloodBankForm.state}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, state: e.target.value })}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Helpline / Contact Phone *</Label>
                              <Input
                                placeholder="+91-9876543210"
                                value={bloodBankForm.phone}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, phone: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Physical Address / Center Location</Label>
                              <Input
                                placeholder="e.g. Civil Hospital Complex, Hazratganj, Lucknow"
                                value={bloodBankForm.address}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, address: e.target.value })}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-red-600" /> Google Maps Link (or Live Pin)
                                </Label>
                                <button
                                  type="button"
                                  onClick={() => handleDetectGPS(setBloodBankForm)}
                                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                                >
                                  <MapPin className="h-3 w-3" /> Auto-Detect GPS
                                </button>
                              </div>
                              <Input
                                placeholder="e.g. https://maps.app.goo.gl/... or paste Google Maps URL"
                                value={bloodBankForm.googleMapsUrl}
                                onChange={(e) => handleMapUrlChange(e.target.value, setBloodBankForm)}
                              />
                              {bloodBankForm.lat && bloodBankForm.lng ? (
                                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-0.5">
                                  ✓ Verified GPS Node: Lat {bloodBankForm.lat}, Lng {bloodBankForm.lng}
                                </p>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">
                                  Paste your Google Maps location link or click Auto-Detect.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Initial Blood Stock Units */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Droplets className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              2. Initial Available Blood Stock (Units)
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {BLOOD_GROUPS.map((group) => (
                              <div key={group} className="p-3 rounded-2xl border bg-card text-center space-y-1">
                                <span className="text-sm font-black text-red-600 block">{group}</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={bloodBankForm.stock[group]}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBloodBankForm(prev => ({
                                      ...prev,
                                      stock: { ...prev.stock, [group]: val }
                                    }));
                                  }}
                                  className="text-center font-bold text-base"
                                />
                                <span className="text-[10px] text-muted-foreground">Units in Stock</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Section 3: Admin Credentials */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Lock className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              3. Blood Bank Admin Credentials
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Admin Email *</Label>
                              <Input
                                type="email"
                                placeholder="bloodbank@redcross.org"
                                value={bloodBankForm.email}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, email: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Create Password *</Label>
                              <Input
                                type="password"
                                placeholder="Min 6 characters"
                                value={bloodBankForm.password}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, password: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Confirm Password *</Label>
                              <Input
                                type="password"
                                placeholder="Repeat password"
                                value={bloodBankForm.confirmPassword}
                                onChange={(e) => setBloodBankForm({ ...bloodBankForm, confirmPassword: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          size="lg"
                          disabled={isSubmitting}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-base py-6 rounded-2xl shadow-lg transition-all"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Submitting Blood Bank Application...
                            </>
                          ) : (
                            'Submit Blood Bank for Super Admin Verification'
                          )}
                        </Button>
                      </form>
                    )}

                    {/* ══════════════════════════════════════════════════════════ */}
                    {/* 3. AMBULANCE OPERATOR ONBOARDING FORM                      */}
                    {/* ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'ambulance' && (
                      <form onSubmit={handleAmbulanceSubmit} className="space-y-8">
                        
                        {/* Section 1: Vehicle & Fleet Identity */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Siren className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              1. Ambulance Vehicle & Equipment
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Vehicle Registration Number *</Label>
                              <Input
                                placeholder="e.g. UP 70 AB 1234"
                                value={ambulanceForm.vehicleNumber}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, vehicleNumber: e.target.value })}
                                required
                              />
                              <p className="text-[10px] text-muted-foreground">Official RTO Registration Plate</p>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Life Support Equipment Level</Label>
                              <select
                                value={ambulanceForm.equipmentLevel}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, equipmentLevel: e.target.value })}
                                className="w-full h-10 rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                              >
                                <option value="Advanced Life Support (ALS)">Advanced Life Support (ALS) with Ventilator</option>
                                <option value="Basic Life Support (BLS)">Basic Life Support (BLS) with Oxygen</option>
                                <option value="Patient Transport (PTS)">Patient Transport (PTS)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Operating Base City *</Label>
                              <Input
                                placeholder="e.g. Prayagraj"
                                value={ambulanceForm.city}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, city: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Affiliated Hospital / Organization (Optional)</Label>
                              <Input
                                placeholder="e.g. City Care Hospital or Independent"
                                value={ambulanceForm.hospitalName}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, hospitalName: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Driver Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Phone className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              2. Assigned Driver & Live Location
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Driver Full Name *</Label>
                              <Input
                                placeholder="e.g. Ramesh Kumar"
                                value={ambulanceForm.driverName}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driverName: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Driver Contact Phone *</Label>
                              <Input
                                placeholder="+91-9876543210"
                                value={ambulanceForm.driverPhone}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driverPhone: e.target.value })}
                                required
                              />
                              <p className="text-[10px] text-muted-foreground">Emergency dispatch SMS & location links will be sent here</p>
                            </div>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => handleDetectGPS(setAmbulanceForm)}
                              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                            >
                              <MapPin className="h-3.5 w-3.5" /> Auto-Detect Current Ambulance GPS Pin
                            </button>
                            {ambulanceForm.lat && ambulanceForm.lng && (
                              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 pt-1">
                                ✓ Live Coordinates Locked: {ambulanceForm.lat}, {ambulanceForm.lng}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Operator Login */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Lock className="h-4 w-4 text-red-600" />
                            <h3 className="font-extrabold text-sm uppercase tracking-wide text-foreground">
                              3. Driver / Fleet Operator Login Credentials
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Operator Email *</Label>
                              <Input
                                type="email"
                                placeholder="driver@ambulance.com"
                                value={ambulanceForm.email}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, email: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Create Password *</Label>
                              <Input
                                type="password"
                                placeholder="Min 6 characters"
                                value={ambulanceForm.password}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, password: e.target.value })}
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold">Confirm Password *</Label>
                              <Input
                                type="password"
                                placeholder="Repeat password"
                                value={ambulanceForm.confirmPassword}
                                onChange={(e) => setAmbulanceForm({ ...ambulanceForm, confirmPassword: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          size="lg"
                          disabled={isSubmitting}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-base py-6 rounded-2xl shadow-lg transition-all"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Submitting Ambulance Registration...
                            </>
                          ) : (
                            'Submit Ambulance Fleet for Super Admin Verification'
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT ASIDE COLUMN (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Benefits Card */}
                <Card className="border shadow-md rounded-3xl bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-red-600" />
                      Why Join SwasthyaSetu?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                      <div>
                        <strong className="text-foreground block">Instant Live Discoverability:</strong>
                        Your hospital, ICU beds, or blood stocks become discoverable to thousands of patients across India in real time.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                      <div>
                        <strong className="text-foreground block">Integrated SOS Dispatch:</strong>
                        Direct emergency alert dispatch routed directly to nearest ambulance drivers and hospital casualty wards.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                      <div>
                        <strong className="text-foreground block">Verified Network Trust:</strong>
                        Government and private hospitals with verified credentials receive the official verified badge.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">✓</div>
                      <div>
                        <strong className="text-foreground block">Admin Control Room:</strong>
                        Full-featured dashboard to update bed availability, manage patient admissions, and track blood stock.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Process Card */}
                <Card className="border shadow-md rounded-3xl bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      Verification Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</div>
                      <div>
                        <span className="font-bold text-foreground block">Submit Credentials</span>
                        <span className="text-muted-foreground">Fill in license number and bed/stock breakdown.</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</div>
                      <div>
                        <span className="font-bold text-foreground block">Super Admin Review</span>
                        <span className="text-muted-foreground">Application appears in the Super Admin verification queue.</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</div>
                      <div>
                        <span className="font-bold text-foreground block">Account Activated</span>
                        <span className="text-muted-foreground">Log into the Hospital Admin Dashboard and update real-time stock.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Already have an account */}
                <div className="p-4 rounded-2xl border bg-card text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Already have a registered account?</p>
                  <Link to="/admin/login">
                    <Button variant="outline" className="w-full text-xs font-bold gap-1.5">
                      Log In to Admin Dashboard
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

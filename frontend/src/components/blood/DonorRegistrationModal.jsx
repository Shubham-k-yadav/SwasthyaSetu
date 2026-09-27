import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  QrCode,
  Download,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Droplets,
  Heart,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Printer,
  Search,
  Check,
  Copy,
  BookmarkCheck,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { cn } from '@/lib/utils';

export function DonorRegistrationModal({
  open,
  onOpenChange,
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  cities = ['New Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Kolkata', 'Hyderabad', 'Prayagraj', 'Varanasi', 'Lucknow', 'Patna'],
  initialMode = 'register',
  initialDonor = null
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState('form'); // 'form' | 'pass'
  const [modalMode, setModalMode] = useState(initialMode === 'retrieve' ? 'retrieve' : 'register'); // 'register' | 'retrieve'
  const [retrieveInput, setRetrieveInput] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [savedDonor, setSavedDonor] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [donorForm, setDonorForm] = useState({
    name: '',
    phone: '',
    email: '',
    bloodGroup: '',
    city: '',
    state: '',
    age: '',
    weight: '',
    address: ''
  });

  const [registeredDonor, setRegisteredDonor] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyBanks, setNearbyBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [passActiveTab, setPassActiveTab] = useState('pass'); // 'pass' | 'nearby'
  const passCardRef = useRef(null);

  // Load saved donor from localStorage on mount or modal open
  useEffect(() => {
    try {
      const stored = localStorage.getItem('swasthya_setu_donor_card');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.donorCardId || parsed.phone)) {
          setSavedDonor(parsed);
          if (initialMode === 'pass') {
            displayDonorPass(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage donor card:', e);
    }
  }, [open, initialMode]);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    if (initialMode === 'retrieve') {
      setModalMode('retrieve');
    } else if (initialMode === 'register') {
      setModalMode('register');
    }
  }, [initialMode]);

  // Direct load if initialDonor prop is provided
  useEffect(() => {
    if (initialDonor) {
      displayDonorPass(initialDonor);
    }
  }, [initialDonor]);

  // Detect GPS Location on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.log('Location not granted or unavailable:', err.message);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // Fetch nearby blood banks once donor is registered
  const fetchNearbyBanks = async (donor) => {
    setIsLoadingBanks(true);
    try {
      const lat = userLocation?.lat || donor?.coordinates?.lat;
      const lng = userLocation?.lng || donor?.coordinates?.lng;

      const res = await api.donors.getNearbyBanks({
        lat,
        lng,
        radiusKm: 10,
        bloodGroup: donor?.bloodGroup
      });

      setNearbyBanks(res?.bloodBanks || []);
    } catch (err) {
      console.error('Failed to load nearby blood banks:', err);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Reusable helper to display QR pass, persist to localStorage, and fetch 10km blood banks
  const displayDonorPass = async (donor) => {
    if (!donor) return;
    setRegisteredDonor(donor);

    // Save to localStorage immediately so refreshing page or closing never loses it!
    try {
      localStorage.setItem('swasthya_setu_donor_card', JSON.stringify(donor));
      setSavedDonor(donor);
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    // Generate QR Code data URL containing the Donor Card ID
    const qrCodeString = donor.donorCardId || donor.id || donor.phone;
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeString, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }

    // Fetch nearby blood banks within 10 km
    fetchNearbyBanks(donor);

    // Switch to Pass Step
    setStep('pass');
  };

  // Copy Donor ID to clipboard
  const handleCopyDonorId = () => {
    if (!registeredDonor?.donorCardId) return;
    navigator.clipboard.writeText(registeredDonor.donorCardId);
    setCopiedId(true);
    toast.success('Donor ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle donor pass retrieval via Mobile, Email, or Donor ID
  const handleRetrievePass = async (e) => {
    if (e) e.preventDefault();
    const query = retrieveInput.trim();
    if (!query) {
      toast.error('Please enter your mobile number, email, or Donor ID');
      return;
    }

    setIsRetrieving(true);
    try {
      const res = await api.donors.getCard(query);
      if (res?.donor) {
        await displayDonorPass(res.donor);
        toast.success(`Welcome back, ${res.donor.name}!`, {
          description: `Donor ID: ${res.donor.donorCardId}. Your QR pass has been loaded.`
        });
      } else {
        toast.error('No donor record found with this Mobile, Email, or Donor ID');
      }
    } catch (err) {
      console.error('Donor retrieval error:', err);
      toast.error(err.message || 'Pass not found. Please verify your mobile number or email.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const payload = {
        name: donorForm.name.trim(),
        phone: donorForm.phone.trim(),
        email: donorForm.email.trim(),
        bloodGroup: donorForm.bloodGroup,
        city: donorForm.city,
        state: donorForm.state || 'India',
        address: donorForm.address || `${donorForm.city}, India`,
        age: Number(donorForm.age) || 25,
        weight: Number(donorForm.weight) || 65,
        coordinates: userLocation
      };

      const res = await api.donors.register(payload);
      const donor = res?.donor;

      if (!donor) throw new Error('Registration response missing donor details');

      await displayDonorPass(donor);

      toast.success(res.message || 'Congratulations! Digital Donor Pass Issued', {
        description: `Donor ID: ${donor.donorCardId}. Please show this QR at any blood bank to donate.`
      });
    } catch (err) {
      console.error('Donor registration error:', err);
      toast.error(err.message || 'Failed to register as donor. Please check your details.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Download Donor Pass as PDF
  const handleDownloadPDF = () => {
    if (!registeredDonor) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148] // A6 Pocket ID Card size
      });

      // Background header
      doc.setFillColor(220, 38, 38); // Red-600
      doc.rect(0, 0, 105, 30, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('SWASTHYASETU BLOOD DONOR PASS', 52.5, 12, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('National Life-Saving Voluntary Blood Network', 52.5, 17, { align: 'center' });

      doc.setFontSize(7);
      doc.text(`CARD ID: ${registeredDonor.donorCardId || 'DONOR-ACTIVE'}`, 52.5, 23, { align: 'center' });

      // White card body
      doc.setFillColor(255, 255, 255);

      // Donor Information
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(registeredDonor.name || 'Blood Donor', 52.5, 38, { align: 'center' });

      // Blood Group Highlight
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(32, 42, 41, 10, 2, 2, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Blood Group: ${registeredDonor.bloodGroup}`, 52.5, 49, { align: 'center' });

      // Details Table
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      doc.text(`Phone: ${registeredDonor.phone}`, 20, 58);
      doc.text(`Email: ${registeredDonor.email}`, 20, 63);
      doc.text(`City: ${registeredDonor.city}, ${registeredDonor.state || 'India'}`, 20, 68);

      // Add QR Code
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 32, 73, 41, 41);
      }

      // Footer Instructions
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.text('Show this QR at any authorized blood bank reception desk.', 52.5, 120, { align: 'center' });
      doc.text('Admin scans to auto-fill records and award life-saving credit.', 52.5, 124, { align: 'center' });

      doc.setFillColor(241, 245, 249);
      doc.rect(0, 132, 105, 16, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Emergency Helpline: 108 / 102 | swasthyasetu.org', 52.5, 140, { align: 'center' });

      doc.save(`Donor-Pass-${registeredDonor.donorCardId || 'Card'}.pdf`);
      toast.success('Donor Pass PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation failed:', err);
      toast.error('Failed to generate PDF. You can take a screenshot of your QR card.');
    }
  };

  // Reset modal when closed
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // Delay reset so transition finishes
      setTimeout(() => {
        setStep('form');
        setRegisteredDonor(null);
        setQrDataUrl('');
        setNearbyBanks([]);
        setPassActiveTab('pass');
        setModalMode(initialMode === 'retrieve' ? 'retrieve' : 'register');
        setRetrieveInput('');
        setDonorForm({
          name: '',
          phone: '',
          email: '',
          bloodGroup: '',
          city: '',
          state: '',
          age: '',
          weight: '',
          address: ''
        });
      }, 300);
    }
    if (onOpenChange) onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full mt-6 gap-2 cursor-pointer font-bold bg-red-600 hover:bg-red-700 text-white shadow-md">
          <UserPlus className="h-4 w-4" />
          {t('registerDonorBtn')}
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(
        "max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl transition-all duration-200",
        step === 'pass' ? "sm:max-w-xl" : "sm:max-w-md"
      )}>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {modalMode === 'register' ? t('registerAsBloodDonor') : 'Retrieve Donor QR Pass'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {modalMode === 'register' 
                      ? 'Get an instant digital QR pass & discover blood banks within 10 km' 
                      : 'Recover your QR Pass or PDF anytime using your Mobile, Email, or Donor ID'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Quick Access: Saved Donor Pass on This Device */}
            {savedDonor && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/20 border border-red-200 dark:border-red-900/60 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <BookmarkCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {savedDonor.name} <span className="text-red-600">({savedDonor.bloodGroup})</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {savedDonor.donorCardId || 'Saved Pass'} • {savedDonor.phone}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => displayDonorPass(savedDonor)}
                  className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white font-bold shrink-0 ml-2 shadow-xs cursor-pointer gap-1"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Open QR Pass
                </Button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-lg bg-muted p-1 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setModalMode('register')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md font-semibold text-center transition-all cursor-pointer",
                  modalMode === 'register'
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                New Registration
              </button>
              <button
                type="button"
                onClick={() => setModalMode('retrieve')}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  modalMode === 'retrieve'
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Search className="h-3.5 w-3.5" />
                Find / Retrieve My Pass
              </button>
            </div>

            {modalMode === 'retrieve' ? (
              /* RETRIEVE PASS MODE */
              <form onSubmit={handleRetrievePass} className="space-y-4 pt-1">
                <div className="rounded-xl border border-red-200/60 dark:border-red-900/40 p-3.5 bg-red-50/50 dark:bg-red-950/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <QrCode className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Forgot to download or refreshed the page?</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No problem! Enter the <strong>Mobile Number</strong>, <strong>Email</strong>, or <strong>Donor ID</strong> you used during registration. We'll instantly restore your QR code and PDF download.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="retrieveQuery" className="text-xs font-semibold">
                    Enter Mobile Number / Email / Donor ID *
                  </Label>
                  <div className="relative">
                    <Input
                      id="retrieveQuery"
                      placeholder="e.g. 9876543210 or name@example.com"
                      value={retrieveInput}
                      onChange={(e) => setRetrieveInput(e.target.value)}
                      className="h-10 text-xs pr-10"
                      required
                      autoFocus
                    />
                    <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isRetrieving || !retrieveInput.trim()}
                  className="w-full h-10 font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm text-xs gap-2"
                >
                  {isRetrieving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Searching Donor Pass...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Find & Retrieve My QR Pass
                    </>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setModalMode('register')}
                    className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    ← Want to register as a new donor? Click here
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegister} className="space-y-4 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="donorName" className="text-xs font-semibold">{t('fullName')} *</Label>
                  <Input 
                    id="donorName" 
                    placeholder="e.g. Rahul Sharma"
                    required
                    value={donorForm.name}
                    onChange={e => setDonorForm({...donorForm, name: e.target.value})}
                    className="h-9 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="donorPhone" className="text-xs font-semibold">{t('phone')} *</Label>
                  <Input 
                    id="donorPhone" 
                    type="tel" 
                    placeholder="10-digit mobile"
                    required
                    value={donorForm.phone}
                    onChange={e => setDonorForm({...donorForm, phone: e.target.value})}
                    className="h-9 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="donorEmail" className="text-xs font-semibold">{t('email')} *</Label>
                <Input 
                  id="donorEmail" 
                  type="email" 
                  placeholder="your.email@example.com (for PDF Certificate)"
                  required
                  value={donorForm.email}
                  onChange={e => setDonorForm({...donorForm, email: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="donorBloodGroup" className="text-xs font-semibold">{t('bloodGroup')} *</Label>
                  <Select 
                    value={donorForm.bloodGroup} 
                    onValueChange={v => setDonorForm({...donorForm, bloodGroup: v})}
                    required
                  >
                    <SelectTrigger id="donorBloodGroup" className="h-9 text-xs mt-1">
                      <SelectValue placeholder={t('selectBloodGroup')} />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(group => (
                        <SelectItem key={group} value={group} className="font-bold text-xs">{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="donorCity" className="text-xs font-semibold">{t('city')} *</Label>
                  <Select 
                    value={donorForm.city} 
                    onValueChange={v => setDonorForm({...donorForm, city: v})}
                    required
                  >
                    <SelectTrigger id="donorCity" className="h-9 text-xs mt-1">
                      <SelectValue placeholder={t('selectCity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city} className="text-xs">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="donorAge" className="text-xs font-semibold">{t('ageYears')} (18-65) *</Label>
                  <Input 
                    id="donorAge" 
                    type="number" 
                    min="18" 
                    max="65" 
                    placeholder="25"
                    required
                    value={donorForm.age}
                    onChange={e => setDonorForm({...donorForm, age: e.target.value})}
                    className="h-9 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="donorWeight" className="text-xs font-semibold">{t('weightKg')} (Min 50kg) *</Label>
                  <Input 
                    id="donorWeight" 
                    type="number" 
                    min="50" 
                    placeholder="65"
                    required
                    value={donorForm.weight}
                    onChange={e => setDonorForm({...donorForm, weight: e.target.value})}
                    className="h-9 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="donorAddress" className="text-xs font-semibold">Locality / Address (Optional)</Label>
                <Input 
                  id="donorAddress" 
                  placeholder="e.g. Civil Lines, Near Metro Station"
                  value={donorForm.address}
                  onChange={e => setDonorForm({...donorForm, address: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>

              {userLocation && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  <span>GPS Location detected! Nearby blood banks within 10 km will be shown.</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-10 font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm text-xs" 
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating Digital Pass...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Generate Digital QR Donor Pass
                  </span>
                )}
              </Button>
            </form>
          )}
        </>
      ) : (
          /* STEP 2: DIGITAL DONOR PASS & NEARBY 10 KM BLOOD BANKS */
          <div className="space-y-4">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      Digital Donor Pass Issued!
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Official Volunteer ID: <span className="font-mono font-bold text-foreground">{registeredDonor?.donorCardId}</span>
                    </DialogDescription>
                  </div>
                </div>
                <Badge className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5">
                  {registeredDonor?.bloodGroup}
                </Badge>
              </div>

              {/* Sub-Tabs: Donor Pass vs Nearby 10km Banks */}
              <div className="flex items-center gap-2 pt-3">
                <Button
                  size="sm"
                  variant={passActiveTab === 'pass' ? 'default' : 'outline'}
                  onClick={() => setPassActiveTab('pass')}
                  className={cn(
                    "flex-1 text-xs h-8 font-semibold gap-1.5",
                    passActiveTab === 'pass' ? "bg-red-600 hover:bg-red-700 text-white" : ""
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  My QR Donor Card
                </Button>
                <Button
                  size="sm"
                  variant={passActiveTab === 'nearby' ? 'default' : 'outline'}
                  onClick={() => setPassActiveTab('nearby')}
                  className={cn(
                    "flex-1 text-xs h-8 font-semibold gap-1.5",
                    passActiveTab === 'nearby' ? "bg-red-600 hover:bg-red-700 text-white" : ""
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  Nearby Blood Banks ({nearbyBanks.length})
                </Button>
              </div>
            </DialogHeader>

            {passActiveTab === 'pass' ? (
              /* DIGITAL DONOR CARD */
              <div className="space-y-4">
                <div 
                  ref={passCardRef}
                  className="relative rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-slate-900 dark:to-red-950/20 p-5 shadow-sm text-center space-y-3"
                >
                  <div className="flex items-center justify-between border-b pb-2 text-xs">
                    <span className="font-bold text-red-600 tracking-wider uppercase text-[10px]">
                      National Blood Donor Pass
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                      ID: {registeredDonor?.donorCardId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-foreground">
                      {registeredDonor?.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {registeredDonor?.city}, {registeredDonor?.state || 'India'}
                    </p>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950 rounded-xl border shadow-xs max-w-[210px] mx-auto">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Donor QR Pass" 
                        className="w-40 h-40 object-contain rounded"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin text-red-500" />
                      </div>
                    )}
                    <span className="font-mono text-[11px] font-black text-slate-900 dark:text-white mt-1">
                      {registeredDonor?.donorCardId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 max-w-xs mx-auto">
                    <div className="p-2 rounded-lg bg-card border text-center shadow-xs">
                      <span className="text-[10px] text-muted-foreground block font-medium">Blood Group</span>
                      <span className="text-base font-black text-red-600 block leading-tight mt-0.5">
                        {registeredDonor?.bloodGroup}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-card border text-center shadow-xs">
                      <span className="text-[10px] text-muted-foreground block font-medium">Status</span>
                      <span className="text-xs font-bold text-emerald-600 block leading-tight mt-1 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Eligible
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-1">
                    "Show this QR code at any blood bank reception. Admin will scan it to verify and record your donation."
                  </p>
                </div>

                {/* Card Actions */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleDownloadPDF}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Download Official Pass (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyDonorId}
                      className="font-semibold text-xs h-9 gap-1.5 cursor-pointer"
                    >
                      {copiedId ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          Copied ID!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-muted-foreground" />
                          Copy ID
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPassActiveTab('nearby')}
                      className="font-semibold text-xs h-9 gap-1.5 cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-red-500" />
                      10 KM Banks ({nearbyBanks.length})
                    </Button>
                  </div>

                  {/* Device Persistence Notice */}
                  <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Saved on this device! You won't lose this pass on page refresh.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setRegisteredDonor(null);
                        setQrDataUrl('');
                      }}
                      className="text-muted-foreground hover:text-foreground underline ml-2 shrink-0 cursor-pointer text-[10px]"
                    >
                      Register Another
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* NEARBY BLOOD BANKS (WITHIN 10 KM) */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                    Authorized Blood Banks in Your Area:
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Target: {registeredDonor?.bloodGroup}
                  </Badge>
                </div>

                {isLoadingBanks ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-red-500" />
                    <p>Locating blood banks near your coordinates...</p>
                  </div>
                ) : nearbyBanks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-2 border rounded-xl">
                    <MapPin className="h-6 w-6 text-red-400 mx-auto" />
                    <p className="font-semibold text-foreground text-sm">No blood banks detected within 10 km</p>
                    <p>You can check the national directory on the Blood page for nearby regional centres.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                    {nearbyBanks.map((bank) => (
                      <div
                        key={bank.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {bank.name}
                            </h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                              <span className="truncate">{bank.address || `${bank.city}, ${bank.state || 'India'}`}</span>
                            </p>
                            {bank.phone && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{bank.phone}</span>
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            {bank.distanceKm !== null ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                                {bank.distanceKm} km away
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                {bank.city}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t text-xs">
                          {bank.availableUnitsForGroup !== null && (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {registeredDonor?.bloodGroup} Stock: <strong className="text-red-600">{bank.availableUnitsForGroup} units</strong>
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {bank.phone && (
                              <a
                                href={`tel:${bank.phone}`}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-lg hover:bg-muted font-medium text-muted-foreground hover:text-foreground h-7"
                              >
                                <Phone className="h-3 w-3" />
                                Call
                              </a>
                            )}
                            <a
                              href={bank.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white h-7 shadow-xs"
                            >
                              <Navigation className="h-3 w-3" />
                              Directions ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DonorRegistrationModal;

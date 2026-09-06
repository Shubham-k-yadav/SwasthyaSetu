import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Lock,
  Plus,
  Loader2,
  CheckCircle2,
  Heart,
  Bed,
  Wind
} from 'lucide-react';

const INDIAN_STATES_AND_UTS = [
  'Andaman & Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

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

export function AddHospitalModal({
  open,
  onOpenChange,
  onSuccess
}) {
  const [form, setForm] = useState({
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
    specialties: ['General Medicine', 'Emergency & Trauma', 'ICU / Critical Care'],
    googleMapsUrl: '',
    lat: '',
    lng: ''
  });

  const [customSpecialty, setCustomSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setForm({
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
      specialties: ['General Medicine', 'Emergency & Trauma', 'ICU / Critical Care'],
      googleMapsUrl: '',
      lat: '',
      lng: ''
    });
    setCustomSpecialty('');
  };

  const handleMapUrlChange = (url) => {
    setForm(prev => {
      const next = { ...prev, googleMapsUrl: url };
      try {
        const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
          next.lat = atMatch[1];
          next.lng = atMatch[2];
          return next;
        }
        const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (qMatch) {
          next.lat = qMatch[1];
          next.lng = qMatch[2];
          return next;
        }
      } catch {
        // pass
      }
      return next;
    });
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.info('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(prev => ({
          ...prev,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          googleMapsUrl: prev.googleMapsUrl || `https://www.google.com/maps?q=${latitude},${longitude}`
        }));
        toast.success(`Pinned: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (err) => {
        console.error(err);
        toast.error('Could not detect location. Please paste Google Maps link.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.city.trim() || !form.email.trim()) {
      toast.error('Hospital name, city, and admin email are required.');
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token');

      const payload = {
        name: form.name.trim(),
        type: form.type,
        licenseNumber: form.licenseNumber.trim() || `HFR-${Date.now().toString().slice(-6)}`,
        registrationNumber: form.licenseNumber.trim() || `HFR-${Date.now().toString().slice(-6)}`,
        city: form.city.trim(),
        state: form.state,
        address: form.address.trim() || `${form.city}, ${form.state}`,
        phone: form.phone.trim() || '+91-9876543210',
        email: form.email.trim().toLowerCase(),
        password: form.password || 'HospitalAdmin@2026',
        generalBeds: Math.max(0, Number(form.generalBeds) || 0),
        icuBeds: Math.max(0, Number(form.icuBeds) || 0),
        ventilatorBeds: Math.max(0, Number(form.ventilatorBeds) || 0),
        emergencyServices: form.emergencyServices,
        specialties: form.specialties,
        googleMapsUrl: form.googleMapsUrl.trim(),
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        isVerified: true
      };

      const res = await api.hospitals.create(payload, token);
      toast.success(res.message || 'Hospital added and verified successfully!');

      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding hospital:', err);
      toast.error(err.message || 'Failed to add hospital');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Add & Onboard Hospital
                <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2">Super Admin Direct</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Directly configure, verify, and activate a healthcare facility and its admin account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Section 1: Facility Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-1.5">
              <Building2 className="h-4 w-4 text-red-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide text-foreground">
                1. Hospital Identity & Registration
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Hospital Official Name *</Label>
                <Input
                  placeholder="e.g. City Care Hospital & Trauma Center"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Registration / License Number</Label>
                <Input
                  placeholder="e.g. UP-HFR-2026-8941"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Facility Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                >
                  <option value="private">Private Hospital / Clinic</option>
                  <option value="government">Government / District Hospital</option>
                  <option value="charitable">Charitable / Trust Hospital</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">State *</Label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                >
                  {INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">City *</Label>
                <Input
                  placeholder="e.g. Prayagraj"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Physical Street Address / Landmark</Label>
                <Input
                  placeholder="e.g. Pahalwan Chauraha, Kareli"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Contact Phone *</Label>
                <Input
                  placeholder="+91-9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 bg-muted/30 p-3 rounded-xl border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-red-600" /> Google Maps Link (or Live Pin)
                </Label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> Auto-Detect GPS
                </button>
              </div>
              <Input
                placeholder="Paste Google Maps share link or coordinates URL (e.g. https://maps.app.goo.gl/...)"
                value={form.googleMapsUrl}
                onChange={(e) => handleMapUrlChange(e.target.value)}
                className="text-xs"
              />
              {form.lat && form.lng ? (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-0.5">
                  ✓ Verified GPS Node: Lat {form.lat}, Lng {form.lng}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Paste Google Maps share link. If left empty, location is automatically geocoded from address and city.
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Medical Infrastructure & Services */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-1.5">
              <ShieldCheck className="h-4 w-4 text-red-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide text-foreground">
                2. Medical Services & Bed Capacities
              </h3>
            </div>

            {/* 24/7 Emergency Services Toggle Card */}
            <label className="flex items-center justify-between p-3 rounded-xl border bg-card cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  24/7 Emergency & Trauma Casualty Enabled
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Check if facility operates round-the-clock emergency casualty and resuscitation services
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.emergencyServices}
                onChange={(e) => setForm({ ...form, emergencyServices: e.target.checked })}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-600 cursor-pointer"
              />
            </label>

            {/* Specialties Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Select Active Departments / Specialties:</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_HOSPITAL_SPECIALTIES.map((spec) => {
                  const isSelected = form.specialties.includes(spec);
                  return (
                    <Badge
                      key={spec}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer text-[11px] py-0.5 px-2.5 select-none transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white font-bold shadow-xs'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                      onClick={() => {
                        const exists = form.specialties.includes(spec);
                        setForm({
                          ...form,
                          specialties: exists
                            ? form.specialties.filter(s => s !== spec)
                            : [...form.specialties, spec]
                        });
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '} {spec}
                    </Badge>
                  );
                })}
              </div>

              {/* Add Custom Specialty */}
              <div className="flex gap-2 pt-1 max-w-md">
                <Input
                  placeholder="Add custom specialty (e.g. Dialysis)..."
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customSpecialty.trim() && !form.specialties.includes(customSpecialty.trim())) {
                        setForm({
                          ...form,
                          specialties: [...form.specialties, customSpecialty.trim()]
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
                  className="h-8 text-xs shrink-0"
                  onClick={() => {
                    if (customSpecialty.trim() && !form.specialties.includes(customSpecialty.trim())) {
                      setForm({
                        ...form,
                        specialties: [...form.specialties, customSpecialty.trim()]
                      });
                      setCustomSpecialty('');
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Bed Capacities Breakdown */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold">Certified Bed Stock Capacity (Verified Limits):</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border bg-card space-y-1 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-bold">
                    <Bed className="h-3.5 w-3.5" /> General Ward Beds
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.generalBeds}
                    onChange={(e) => setForm({ ...form, generalBeds: e.target.value })}
                    className="font-bold text-center text-lg h-9"
                  />
                </div>
                <div className="p-3 rounded-xl border bg-card space-y-1 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 font-bold">
                    <Heart className="h-3.5 w-3.5" /> ICU / CCU Beds
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.icuBeds}
                    onChange={(e) => setForm({ ...form, icuBeds: e.target.value })}
                    className="font-bold text-center text-lg h-9"
                  />
                </div>
                <div className="p-3 rounded-xl border bg-card space-y-1 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1 text-xs text-cyan-600 font-bold">
                    <Wind className="h-3.5 w-3.5" /> Ventilator Units
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={form.ventilatorBeds}
                    onChange={(e) => setForm({ ...form, ventilatorBeds: e.target.value })}
                    className="font-bold text-center text-lg h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Admin Portal Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-1.5">
              <Lock className="h-4 w-4 text-red-600" />
              <h3 className="font-extrabold text-xs uppercase tracking-wide text-foreground">
                3. Hospital Admin Login Account Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Admin Email *</Label>
                <Input
                  type="email"
                  placeholder="admin@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Password</Label>
                <Input
                  type="password"
                  placeholder="Default: HospitalAdmin@2026"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              If password is left blank, a secure default temporary password (<code>HospitalAdmin@2026</code>) is assigned.
            </p>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !form.name.trim() || !form.city.trim() || !form.email.trim()}
              className="gap-1.5 font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating & Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Add & Verify Hospital
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddHospitalModal;

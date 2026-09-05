import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, ShieldCheck, Mail, Lock, Phone, MapPin, CheckCircle2, Loader2, AlertCircle, Plus, X } from 'lucide-react';
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
import { useLanguage } from '@/lib/language-context';

const COMMON_DEPARTMENTS = [
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
  'ENT'
];

export function HospitalRegisterModal({ children }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [customSpecialty, setCustomSpecialty] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'private',
    licenseNumber: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    password: '',
    generalBeds: '',
    icuBeds: '',
    ventilatorBeds: '',
    emergencyServices: true,
    specialties: ['General Medicine'],
    lat: '',
    lng: ''
  });

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Hospital name is required';
    if (!formData.licenseNumber.trim()) errs.licenseNumber = 'Registration / License number is required';
    if (!formData.city.trim()) errs.city = 'City name is required';
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid admin email is required';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleSpecialty = (dept) => {
    setFormData(prev => {
      const exists = prev.specialties.includes(dept);
      return {
        ...prev,
        specialties: exists
          ? prev.specialties.filter(s => s !== dept)
          : [...prev.specialties, dept]
      };
    });
  };

  const handleAddCustomSpecialty = (e) => {
    e.preventDefault();
    if (!customSpecialty.trim()) return;
    if (!formData.specialties.includes(customSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, customSpecialty.trim()]
      }));
    }
    setCustomSpecialty('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.hospitals.registerRequest({
        ...formData,
        generalBeds: Number(formData.generalBeds) || 0,
        icuBeds: Number(formData.icuBeds) || 0,
        ventilatorBeds: Number(formData.ventilatorBeds) || 0,
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error(err.message || 'Registration application failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setOpen(false);
    setErrors({});
    setFormData({
      name: '',
      type: 'private',
      licenseNumber: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      password: '',
      generalBeds: '',
      icuBeds: '',
      ventilatorBeds: '',
      emergencyServices: true,
      specialties: ['General Medicine'],
      lat: '',
      lng: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-xs">
            <Building2 className="h-4 w-4" />
            {t('registerHospital')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            Hospital Self-Onboarding
          </DialogTitle>
          <DialogDescription className="text-xs">
            Register your hospital or clinic with genuine credentials for direct verification.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Application Submitted Successfully!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your hospital application is in the Super Admin Verification Queue. Our verification team will review your license <strong className="text-foreground">({formData.licenseNumber})</strong> and notify you at <strong className="text-foreground">{formData.email}</strong>.
              </p>
            </div>
            <Button onClick={handleReset} className="mt-4 font-bold px-6">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Hospital Basics */}
            <div className="space-y-3 p-3.5 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> 1. Hospital Details & Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hospital Name *</Label>
                  <Input
                    name="name"
                    placeholder="e.g. City Care Hospital"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Registration / License No. *</Label>
                  <Input
                    name="licenseNumber"
                    placeholder="e.g. UP-HFR-2026-8941"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={errors.licenseNumber ? 'border-red-500' : ''}
                  />
                  {errors.licenseNumber && <p className="text-[10px] text-red-500 font-semibold">{errors.licenseNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Facility Type</Label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border bg-background px-3 text-xs focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="private">Private Hospital / Clinic</option>
                    <option value="government">Government Hospital</option>
                    <option value="charitable">Trust / Charitable Hospital</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City *</Label>
                  <Input
                    name="city"
                    placeholder="e.g. Prayagraj"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-[10px] text-red-500 font-semibold">{errors.city}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Contact Phone *</Label>
                  <Input
                    name="phone"
                    placeholder="+91-9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Street Address / Landmark</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        toast.info('Detecting exact hospital GPS location...');
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormData(prev => ({
                              ...prev,
                              lat: pos.coords.latitude.toFixed(4),
                              lng: pos.coords.longitude.toFixed(4)
                            }));
                            toast.success(`GPS Pin set to exact location! (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
                          },
                          () => toast.error('Unable to access GPS. Address will be geocoded automatically.')
                        );
                      }
                    }}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" /> Auto-Detect My GPS Pin
                  </button>
                </div>
                <Input
                  name="address"
                  placeholder="e.g. MG Marg, Kareli, Prayagraj"
                  value={formData.address}
                  onChange={handleChange}
                />
                {formData.lat && formData.lng && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    ✔ Custom GPS Coordinates Attached: {formData.lat}, {formData.lng}
                  </p>
                )}
              </div>
            </div>

            {/* Specialties & Emergency Status */}
            <div className="space-y-3 p-3.5 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                🩺 2. Departments & Emergency Care
              </h4>

              {/* Emergency Status Checkbox */}
              <label className="flex items-center gap-2.5 p-2 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  name="emergencyServices"
                  checked={formData.emergencyServices}
                  onChange={handleChange}
                  className="h-4 w-4 rounded text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    24/7 Emergency & Critical Care Available
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Check if facility operates round-the-clock emergency casualty and trauma response
                  </span>
                </div>
              </label>

              {/* Specialties Selectable Chips */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Active Departments / Specialties:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DEPARTMENTS.map((dept) => {
                    const isSelected = formData.specialties.includes(dept);
                    return (
                      <Badge
                        key={dept}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs select-none transition-all ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                            : 'hover:bg-muted font-normal text-muted-foreground'
                        }`}
                        onClick={() => toggleSpecialty(dept)}
                      >
                        {isSelected ? '✓ ' : '+ '} {dept}
                      </Badge>
                    );
                  })}
                </div>

                {/* Custom Specialty Adder */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Other specialty (e.g. Urology, Dermatology)..."
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSpecialty(e);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={handleAddCustomSpecialty}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Bed Capacities */}
            <div className="space-y-3 p-3.5 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                🛏️ 3. Bed Capacities (Declared)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">General Beds</Label>
                  <Input
                    type="number"
                    name="generalBeds"
                    placeholder="0"
                    value={formData.generalBeds}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">ICU Beds</Label>
                  <Input
                    type="number"
                    name="icuBeds"
                    placeholder="0"
                    value={formData.icuBeds}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Ventilators</Label>
                  <Input
                    type="number"
                    name="ventilatorBeds"
                    placeholder="0"
                    value={formData.ventilatorBeds}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="space-y-3 p-3.5 bg-primary/5 rounded-xl border border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> 4. Create Admin Account
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Admin Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="admin@hospital.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Password *</Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password}</p>}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 font-bold py-2.5 shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                'Submit Registration'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

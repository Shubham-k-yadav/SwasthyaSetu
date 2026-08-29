import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, ShieldCheck, Mail, Lock, Phone, MapPin, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/lib/language-context';

export function HospitalRegisterModal({ children }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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
    generalBeds: '50',
    icuBeds: '10',
    ventilatorBeds: '2',
  });

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Hospital name is required';
    if (!formData.city.trim()) errs.city = 'City name is required';
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid admin email is required';
    if (!formData.password || formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.hospitals.registerRequest(formData);
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
      generalBeds: '50',
      icuBeds: '10',
      ventilatorBeds: '2',
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            Hospital Self-Onboarding
          </DialogTitle>
          <DialogDescription className="text-xs">
            Register your hospital or clinic in under 2 minutes. Instant verification queue.
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
                Your registration is submitted for verification. Our verification team will contact you at <strong className="text-foreground">{formData.phone}</strong> within 24 hours to verify and activate your account.
              </p>
            </div>
            <Button onClick={handleReset} className="mt-4 font-bold px-6">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Hospital Basics */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> 1. Hospital Details
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City *</Label>
                  <Input
                    name="city"
                    placeholder="e.g. Noida / New Delhi"
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
                  placeholder="e.g. MG Marg, Civil Lines, Prayagraj"
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

            {/* Bed Capacities */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                🛏️ 2. Total Bed Capacity
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">General Beds</Label>
                  <Input
                    type="number"
                    name="generalBeds"
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
                    value={formData.icuBeds}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Ventilator Beds</Label>
                  <Input
                    type="number"
                    name="ventilatorBeds"
                    value={formData.ventilatorBeds}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="space-y-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> 3. Create Login Account
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

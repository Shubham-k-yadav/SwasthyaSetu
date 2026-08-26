import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, ShieldCheck, Mail, Lock, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react';
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

export function HospitalRegisterModal({ children }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    generalBeds: '100',
    icuBeds: '20',
    ventilatorBeds: '5',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.email || !formData.password) {
      toast.error('Please fill in Hospital Name, City, Admin Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.hospitals.registerRequest(formData);
      setIsSuccess(true);
      toast.success('Hospital registration application submitted successfully!');
    } catch (err) {
      console.error('Registration failed:', err);
      toast.error(err.message || 'Failed to submit registration application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setOpen(false);
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
      generalBeds: '100',
      icuBeds: '20',
      ventilatorBeds: '5',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-xs">
            <Building2 className="h-4 w-4" />
            Register Hospital
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Building2 className="h-6 w-6 text-primary" />
            Hospital Onboarding & Registration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Apply to connect your hospital to the SwasthyaSetu National Emergency Network
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your hospital application for <strong className="text-foreground">{formData.name}</strong> has been submitted to the National Health Super Admin.
              </p>
            </div>
            <div className="p-4 bg-muted/60 rounded-xl text-left text-xs space-y-1 max-w-md mx-auto border">
              <p>📍 <strong>City:</strong> {formData.city}</p>
              <p>🔑 <strong>Admin Login Email:</strong> {formData.email}</p>
              <p>⏱️ <strong>Status:</strong> <span className="text-amber-600 font-semibold">Pending Super Admin Verification</span></p>
            </div>
            <Button onClick={handleReset} className="mt-4">
              Close Window
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Hospital Basics */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> 1. Hospital Identification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hospital Full Name *</Label>
                  <Input
                    name="name"
                    placeholder="e.g. Fortis Hospital Noida"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hospital Type</Label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full h-9 rounded-md border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                  >
                    <option value="private">Private Hospital</option>
                    <option value="government">Government Hospital</option>
                    <option value="charitable">Charitable / Trust</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Registration / HFR License No.</Label>
                  <Input
                    name="licenseNumber"
                    placeholder="e.g. HFR-DEL-2026-9182"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Emergency Contact Phone</Label>
                  <Input
                    name="phone"
                    placeholder="+91-9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> 2. Location & Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City *</Label>
                  <Input
                    name="city"
                    placeholder="e.g. Noida / New Delhi"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">State / Territory</Label>
                  <Input
                    name="state"
                    placeholder="e.g. Uttar Pradesh"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Address</Label>
                <Input
                  name="address"
                  placeholder="Sector 62, Near Electronic City, Noida"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Initial Bed Capacity */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                🛏️ 3. Initial Bed Capacities
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">General Beds</Label>
                  <Input
                    type="number"
                    name="generalBeds"
                    value={formData.generalBeds}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">ICU Beds</Label>
                  <Input
                    type="number"
                    name="icuBeds"
                    value={formData.icuBeds}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Ventilator Beds</Label>
                  <Input
                    type="number"
                    name="ventilatorBeds"
                    value={formData.ventilatorBeds}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="space-y-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> 4. Create Hospital Admin Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Admin Login Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="admin@yourhospital.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Admin Password *</Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Create strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 font-bold py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Hospital Registration Application'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

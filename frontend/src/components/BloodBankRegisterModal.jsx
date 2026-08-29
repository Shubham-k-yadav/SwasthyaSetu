import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Droplets, ShieldCheck, Mail, Lock, Phone, MapPin, CheckCircle, Loader2, Building2 } from 'lucide-react';
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

export function BloodBankRegisterModal({ children }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    password: '',
    stockApos: '15',
    stockAneg: '5',
    stockBpos: '20',
    stockBneg: '4',
    stockABpos: '10',
    stockABneg: '2',
    stockOpos: '25',
    stockOneg: '5',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.email || !formData.password) {
      toast.error('Please fill in Blood Bank Name, City, Admin Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state || 'India',
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        initialStock: {
          'A+': Number(formData.stockApos || 0),
          'A-': Number(formData.stockAneg || 0),
          'B+': Number(formData.stockBpos || 0),
          'B-': Number(formData.stockBneg || 0),
          'AB+': Number(formData.stockABpos || 0),
          'AB-': Number(formData.stockABneg || 0),
          'O+': Number(formData.stockOpos || 0),
          'O-': Number(formData.stockOneg || 0),
        }
      };

      await api.bloodbanks.registerRequest(payload);
      setIsSuccess(true);
      toast.success('Blood bank onboarding application submitted!');
    } catch (err) {
      toast.error(err.message || 'Blood bank registration application failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setOpen(false);
    setFormData({
      name: '',
      licenseNumber: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      password: '',
      stockApos: '15',
      stockAneg: '5',
      stockBpos: '20',
      stockBneg: '4',
      stockABpos: '10',
      stockABneg: '2',
      stockOpos: '25',
      stockOneg: '5',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 border-red-500/30 text-red-600 hover:bg-red-500/10 font-semibold text-xs">
            <Droplets className="h-4 w-4" />
            {t('registerBloodBank') || 'Register Blood Bank'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-red-600">
            <Droplets className="h-6 w-6 text-red-600" />
            Blood Bank Onboarding & Registration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Apply to connect your regional blood bank to the SwasthyaSetu National Health Network
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
                Your blood bank application for <strong className="text-foreground">{formData.name}</strong> has been submitted to the National Health Super Admin.
              </p>
            </div>
            <Button onClick={handleReset} className="mt-4">
              Close Window
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Blood Bank Details */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-red-600" /> 1. Blood Bank Identification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Blood Bank Full Name *</Label>
                  <Input
                    name="name"
                    placeholder="e.g. Red Cross Blood Bank Delhi"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">License / Drug Reg No.</Label>
                  <Input
                    name="licenseNumber"
                    placeholder="e.g. BB-LIC-98124"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City *</Label>
                  <Input
                    name="city"
                    placeholder="e.g. New Delhi"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">State / Territory</Label>
                  <Input
                    name="state"
                    placeholder="e.g. Delhi NCR"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Address</Label>
                <Input
                  name="address"
                  placeholder="Street address, landmark, PIN code"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Admin Credentials */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> 2. Designated Admin Credentials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Admin Login Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="bloodbank.admin@hospital.org"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Account Password *</Label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Contact Phone</Label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Initial Stock Estimate */}
            <div className="space-y-3 p-3 bg-muted/40 rounded-xl border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-red-500" /> 3. Initial Units Available per Blood Group
              </h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">A+</Label>
                  <Input name="stockApos" type="number" min="0" value={formData.stockApos} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">A-</Label>
                  <Input name="stockAneg" type="number" min="0" value={formData.stockAneg} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">B+</Label>
                  <Input name="stockBpos" type="number" min="0" value={formData.stockBpos} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">B-</Label>
                  <Input name="stockBneg" type="number" min="0" value={formData.stockBneg} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">AB+</Label>
                  <Input name="stockABpos" type="number" min="0" value={formData.stockABpos} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">AB-</Label>
                  <Input name="stockABneg" type="number" min="0" value={formData.stockABneg} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">O+</Label>
                  <Input name="stockOpos" type="number" min="0" value={formData.stockOpos} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
                <div className="space-y-1 text-center">
                  <Label className="text-[11px] font-bold text-red-600">O-</Label>
                  <Input name="stockOneg" type="number" min="0" value={formData.stockOneg} onChange={handleChange} className="text-center h-8 text-xs" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

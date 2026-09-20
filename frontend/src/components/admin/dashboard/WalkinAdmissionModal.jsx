import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Heart, Bed, Wind, AlertCircle, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { printOrDownloadTicket, downloadTicketPdf } from '@/components/hospital/bed-ticket-dialog';

export function WalkinAdmissionModal({
  open,
  onOpenChange,
  hospital,
  bedsForm,
  onSubmitWalkin
}) {
  const [patientName, setPatientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bedType, setBedType] = useState('icu');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const icuAvail = Number(bedsForm?.icuAvailable ?? hospital?.beds?.icu?.available ?? 0);
  const genAvail = Number(bedsForm?.generalAvailable ?? hospital?.beds?.general?.available ?? 0);
  const ventAvail = Number(bedsForm?.ventilatorAvailable ?? hospital?.beds?.ventilator?.available ?? 0);
  const totalAvail = icuAvail + genAvail + ventAvail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }

    const targetAvail = bedType === 'icu' ? icuAvail : bedType === 'general' ? genAvail : ventAvail;
    if (targetAvail <= 0) {
      toast.error(`No ${bedType.toUpperCase()} beds are available for admission.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        contactPhone: contactPhone.trim() || 'Walk-in / Offline Patient',
        bedType,
        age: age ? Number(age) : undefined,
        gender,
        notes: notes.trim()
      };

      const result = await onSubmitWalkin(payload);

      toast.success(`🎉 Patient ${patientName} admitted successfully to ${bedType.toUpperCase()} Bed!`);

      // Download official admission PDF slip immediately
      if (result?.reservation) {
        await downloadTicketPdf({
          reservation: result.reservation,
          hospital: result.hospital || hospital,
          patientName: payload.patientName,
          contactPhone: payload.contactPhone,
          bedType,
          age: payload.age,
          gender: payload.gender
        });
      }

      // Reset form
      setPatientName('');
      setContactPhone('');
      setAge('');
      setNotes('');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Failed to complete walk-in admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Direct Walk-In Admission
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hospital emergency counter entry for offline / casualty patients (सीधी ऑफलाइन भर्ती)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {totalAvail <= 0 ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-center space-y-1.5 my-2">
            <AlertCircle className="h-6 w-6 mx-auto text-red-600" />
            <p className="font-bold text-sm">All Hospital Beds Occupied</p>
            <p className="text-xs text-red-600/80">No vacant beds are currently available at this facility for direct admission.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Step 1: Select Bed Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Select Bed Category to Allocate *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'icu', label: 'ICU Bed', avail: icuAvail, icon: Heart, color: 'text-red-600' },
                  { id: 'general', label: 'General Bed', avail: genAvail, icon: Bed, color: 'text-blue-600' },
                  { id: 'ventilator', label: 'Ventilator', avail: ventAvail, icon: Wind, color: 'text-cyan-600' }
                ].map((b) => {
                  const isAvail = b.avail > 0;
                  const isSelected = bedType === b.id && isAvail;
                  const Icon = b.icon;

                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setBedType(b.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all relative select-none flex flex-col items-center justify-center',
                        isAvail ? 'cursor-pointer' : 'cursor-not-allowed opacity-40 bg-gray-100/50 dark:bg-gray-800/40',
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 font-bold shadow-xs text-blue-700 ring-1 ring-blue-600'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 mb-1', b.color)} />
                      <span className="text-xs font-bold leading-tight">{b.label}</span>
                      <span className={cn('text-xs font-extrabold mt-0.5', isAvail ? 'text-emerald-600' : 'text-red-500 line-through')}>
                        {b.avail} Available
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Patient Name & Attendant Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="patientName" className="text-xs font-semibold">
                  Patient Full Name *
                </Label>
                <Input
                  id="patientName"
                  placeholder="e.g. Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="h-9.5 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-xs font-semibold">
                  Attendant / Patient Mobile
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">+91</span>
                  <Input
                    id="contactPhone"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 h-9.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs font-semibold">
                  Age (Years)
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  placeholder="e.g. 45"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-9.5 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Gender
                </Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-9.5 rounded-md border border-input bg-background px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Female">Female (महिला)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </div>
            </div>

            {/* Step 4: Emergency Notes / Complaint */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Chief Complaint / Emergency Notes (Optional)
              </Label>
              <Input
                id="notes"
                placeholder="e.g. Trauma accident, chest pain, high fever, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9.5 text-xs"
              />
            </div>

            {/* Information Banner */}
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                <strong>Instant Real-Time Sync:</strong> Submitting will immediately decrement hospital available bed inventory across SwasthyaSetu and generate an official printable admission receipt.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9.5 text-xs"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-sm"
                disabled={isSubmitting || totalAvail <= 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Admitting Patient...' : 'Confirm & Admit Patient (सीधा भर्ती करें)'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WalkinAdmissionModal;

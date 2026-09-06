import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ShieldCheck, Heart, Bed, Wind, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

export function RequestBedUpgradeModal({
  open,
  onOpenChange,
  hospital,
  onSubmitUpgrade
}) {
  const currentIcu = hospital?.beds?.icu?.total ?? 0;
  const currentGeneral = hospital?.beds?.general?.total ?? 0;
  const currentVent = hospital?.beds?.ventilator?.total ?? 0;

  const [requestedIcu, setRequestedIcu] = useState(currentIcu);
  const [requestedGeneral, setRequestedGeneral] = useState(currentGeneral);
  const [requestedVent, setRequestedVent] = useState(currentVent);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && hospital) {
      setRequestedIcu(hospital.beds?.icu?.total ?? 0);
      setRequestedGeneral(hospital.beds?.general?.total ?? 0);
      setRequestedVent(hospital.beds?.ventilator?.total ?? 0);
      setReason('');
    }
  }, [open, hospital]);

  const icuDelta = Number(requestedIcu) - currentIcu;
  const genDelta = Number(requestedGeneral) - currentGeneral;
  const ventDelta = Number(requestedVent) - currentVent;
  const hasIncrease = icuDelta > 0 || genDelta > 0 || ventDelta > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasIncrease) {
      toast.error('Requested total beds must exceed current capacity in at least one category.');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason or expansion note for this request.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitUpgrade({
        requestedBeds: {
          icu: { total: Number(requestedIcu) },
          general: { total: Number(requestedGeneral) },
          ventilator: { total: Number(requestedVent) }
        },
        reason: reason.trim()
      });
      toast.success('Capacity upgrade request submitted! Super Admin will review shortly.');
      onOpenChange(false);
    } catch (err) {
      console.error('Upgrade request error:', err);
      toast.error(err.message || 'Failed to submit upgrade request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Request Bed Capacity Upgrade
              </DialogTitle>
              <DialogDescription className="text-xs">
                Official infrastructure upgrade application for {hospital?.name || 'your hospital'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-sm">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Upon approval by Platform Super Admin, your registered bed capacity will update immediately, unlocking higher daily bed limits for patient intake and emergency reservations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* ICU Beds */}
            <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Heart className="h-3.5 w-3.5 text-red-600" />
                  <span>ICU Beds</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Now: {currentIcu}
                </Badge>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground block font-medium">New Total Limit</label>
                <Input
                  type="number"
                  min={currentIcu}
                  value={requestedIcu}
                  onChange={(e) => setRequestedIcu(Math.max(currentIcu, Number(e.target.value) || 0))}
                  className="font-bold text-center text-base"
                />
              </div>

              <div className="text-center">
                {icuDelta > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    +{icuDelta} Beds
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No change</span>
                )}
              </div>
            </div>

            {/* General Beds */}
            <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Bed className="h-3.5 w-3.5 text-blue-600" />
                  <span>General Beds</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Now: {currentGeneral}
                </Badge>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground block font-medium">New Total Limit</label>
                <Input
                  type="number"
                  min={currentGeneral}
                  value={requestedGeneral}
                  onChange={(e) => setRequestedGeneral(Math.max(currentGeneral, Number(e.target.value) || 0))}
                  className="font-bold text-center text-base"
                />
              </div>

              <div className="text-center">
                {genDelta > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    +{genDelta} Beds
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No change</span>
                )}
              </div>
            </div>

            {/* Ventilators */}
            <div className="p-3.5 rounded-xl border bg-card flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                  <Wind className="h-3.5 w-3.5 text-cyan-600" />
                  <span>Ventilators</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Now: {currentVent}
                </Badge>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground block font-medium">New Total Limit</label>
                <Input
                  type="number"
                  min={currentVent}
                  value={requestedVent}
                  onChange={(e) => setRequestedVent(Math.max(currentVent, Number(e.target.value) || 0))}
                  className="font-bold text-center text-base"
                />
              </div>

              <div className="text-center">
                {ventDelta > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    +{ventDelta} Units
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No change</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Reason / Infrastructure Expansion Details <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="e.g., Added a new 10-bed ICU wing on the 3rd floor equipped with multipara monitors and oxygen pipelines..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs resize-none"
              required
            />
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !hasIncrease || !reason.trim()}
              className="gap-1.5 font-bold bg-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Submit Upgrade Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RequestBedUpgradeModal;

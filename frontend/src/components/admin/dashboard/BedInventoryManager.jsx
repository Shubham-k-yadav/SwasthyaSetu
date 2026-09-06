import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RefreshCw, Heart, Bed, Wind, Lock, ShieldCheck, Info } from 'lucide-react';

export function BedInventoryManager({
  bedsForm,
  setBedsForm,
  updatingBeds,
  onUpdateBeds
}) {
  const icuTotal = Number(bedsForm.icuTotal) || 0;
  const generalTotal = Number(bedsForm.generalTotal) || 0;
  const ventilatorTotal = Number(bedsForm.ventilatorTotal) || 0;

  const icuAvail = Number(bedsForm.icuAvailable) || 0;
  const generalAvail = Number(bedsForm.generalAvailable) || 0;
  const ventilatorAvail = Number(bedsForm.ventilatorAvailable) || 0;

  const hasOverflow = icuAvail > icuTotal || generalAvail > generalTotal || ventilatorAvail > ventilatorTotal;

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Live Bed Inventory Controls
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Update real-time bed availability. Changes broadcast live instantly to patients and emergency services.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold shrink-0 self-start sm:self-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified Capacity Limits Active</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informative quota notice */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fixed Registered Capacity:</strong> Total bed counts are certified during registration and locked by Super Admin verification. You can update currently available beds (between <strong>0</strong> and your verified maximum capacity). To upgrade total bed capacity, submit updated medical licenses to Super Admin.
          </p>
        </div>

        <form onSubmit={onUpdateBeds} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* ICU Section */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-600" />
                  <h4 className="font-bold text-sm text-foreground">ICU Beds</h4>
                </div>
                <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Max {icuTotal}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-muted-foreground font-medium">Available ICU Beds</label>
                  <span className="text-[11px] font-semibold text-muted-foreground">0 – {icuTotal} max</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={icuTotal}
                  value={bedsForm.icuAvailable}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setBedsForm({ ...bedsForm, icuAvailable: '' });
                    } else {
                      const num = Number(raw);
                      setBedsForm({ ...bedsForm, icuAvailable: Math.min(icuTotal, Math.max(0, num)) });
                    }
                  }}
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  <span>Registered Total Capacity</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Verified Limit</span>
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border text-sm font-bold text-muted-foreground select-none">
                  <span>{icuTotal} Total Beds</span>
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* General Section */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-foreground">General Beds</h4>
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Max {generalTotal}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-muted-foreground font-medium">Available General Beds</label>
                  <span className="text-[11px] font-semibold text-muted-foreground">0 – {generalTotal} max</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={generalTotal}
                  value={bedsForm.generalAvailable}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setBedsForm({ ...bedsForm, generalAvailable: '' });
                    } else {
                      const num = Number(raw);
                      setBedsForm({ ...bedsForm, generalAvailable: Math.min(generalTotal, Math.max(0, num)) });
                    }
                  }}
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  <span>Registered Total Capacity</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Verified Limit</span>
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border text-sm font-bold text-muted-foreground select-none">
                  <span>{generalTotal} Total Beds</span>
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Ventilator Section */}
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-cyan-600" />
                  <h4 className="font-bold text-sm text-foreground">Ventilators</h4>
                </div>
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Max {ventilatorTotal}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-muted-foreground font-medium">Available Ventilators</label>
                  <span className="text-[11px] font-semibold text-muted-foreground">0 – {ventilatorTotal} max</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={ventilatorTotal}
                  value={bedsForm.ventilatorAvailable}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setBedsForm({ ...bedsForm, ventilatorAvailable: '' });
                    } else {
                      const num = Number(raw);
                      setBedsForm({ ...bedsForm, ventilatorAvailable: Math.min(ventilatorTotal, Math.max(0, num)) });
                    }
                  }}
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                  <span>Registered Total Units</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Verified Limit</span>
                </label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border text-sm font-bold text-muted-foreground select-none">
                  <span>{ventilatorTotal} Total Units</span>
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updatingBeds || hasOverflow} size="lg" className="gap-2 font-bold px-8">
              {updatingBeds ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Broadcast Live Updates
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BedInventoryManager;

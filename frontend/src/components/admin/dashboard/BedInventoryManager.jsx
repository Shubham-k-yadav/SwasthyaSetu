import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RefreshCw, Heart, Bed, Wind } from 'lucide-react';

export function BedInventoryManager({
  bedsForm,
  setBedsForm,
  updatingBeds,
  onUpdateBeds
}) {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Save className="h-5 w-5 text-primary" />
          Live Bed Inventory Controls
        </CardTitle>
        <CardDescription className="text-xs">
          Update your hospital's bed availability. Changes broadcast live instantly to patients and emergency services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onUpdateBeds} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* ICU Section */}
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                <h4 className="font-bold text-sm text-foreground">ICU Beds</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Available ICU Beds</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.icuAvailable}
                  onChange={(e) => setBedsForm({ ...bedsForm, icuAvailable: e.target.value })}
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Total ICU Capacity</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.icuTotal}
                  onChange={(e) => setBedsForm({ ...bedsForm, icuTotal: e.target.value })}
                />
              </div>
            </div>

            {/* General Section */}
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-blue-600" />
                <h4 className="font-bold text-sm text-foreground">General Beds</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Available General Beds</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.generalAvailable}
                  onChange={(e) => setBedsForm({ ...bedsForm, generalAvailable: e.target.value })}
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Total General Capacity</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.generalTotal}
                  onChange={(e) => setBedsForm({ ...bedsForm, generalTotal: e.target.value })}
                />
              </div>
            </div>

            {/* Ventilator Section */}
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-cyan-600" />
                <h4 className="font-bold text-sm text-foreground">Ventilators</h4>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Available Ventilators</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.ventilatorAvailable}
                  onChange={(e) => setBedsForm({ ...bedsForm, ventilatorAvailable: e.target.value })}
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Total Ventilator Units</label>
                <Input
                  type="number"
                  min="0"
                  value={bedsForm.ventilatorTotal}
                  onChange={(e) => setBedsForm({ ...bedsForm, ventilatorTotal: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updatingBeds} size="lg" className="gap-2 font-bold px-8">
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

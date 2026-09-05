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
import { Bed } from 'lucide-react';

export function EditBedsModal({
  open,
  onOpenChange,
  editingHospital,
  bedFormData,
  setBedFormData,
  onSave
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bed className="h-5 w-5 text-primary" />
            Update Bed Availability
          </DialogTitle>
          <DialogDescription>
            {editingHospital ? editingHospital.name : 'Hospital Bed Management'} ({editingHospital?.city})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          {/* General Beds */}
          <div className="p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200">
            <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300 mb-2">🛏️ General Ward Beds</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Available Beds</Label>
                <Input
                  type="number"
                  value={bedFormData.generalAvail}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, generalAvail: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Total Capacity</Label>
                <Input
                  type="number"
                  value={bedFormData.generalTotal}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, generalTotal: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* ICU Beds */}
          <div className="p-3 border rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border-amber-200">
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-300 mb-2">🤍 ICU Beds</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Available ICU Beds</Label>
                <Input
                  type="number"
                  value={bedFormData.icuAvail}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, icuAvail: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Total ICU Capacity</Label>
                <Input
                  type="number"
                  value={bedFormData.icuTotal}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, icuTotal: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Ventilator Beds */}
          <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/10 border-blue-200">
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">🌬️ Ventilator Beds</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Available Ventilator Beds</Label>
                <Input
                  type="number"
                  value={bedFormData.ventAvail}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, ventAvail: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Total Ventilator Capacity</Label>
                <Input
                  type="number"
                  value={bedFormData.ventTotal}
                  onChange={(e) => setBedFormData(prev => ({ ...prev, ventTotal: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            Save Bed Updates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditBedsModal;

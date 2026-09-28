import React, { useState } from 'react';
import {
  Siren,
  Phone,
  Navigation,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  RefreshCw,
  ExternalLink,
  Radio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function EmergencySOSManager({
  emergencies = [],
  ambulances = [],
  hospitalName = '',
  loading = false,
  onRefresh,
  onDispatchAmbulance,
  onAcceptBed,
  onResolveEmergency
}) {
  const [selectedEmergencyForDispatch, setSelectedEmergencyForDispatch] = useState(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [etaInput, setEtaInput] = useState(10);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  const availableAmbulances = ambulances.filter(a => a.status === 'available');

  const handleOpenDispatchModal = (emg) => {
    setSelectedEmergencyForDispatch(emg);
    setSelectedAmbulanceId(availableAmbulances[0]?._id || availableAmbulances[0]?.id || '');
    setEtaInput(emg.estimatedArrival || 10);
    setDispatchNotes('');
  };

  const handleConfirmDispatch = async () => {
    if (!selectedEmergencyForDispatch) return;
    setIsSubmittingDispatch(true);
    try {
      await onDispatchAmbulance(
        selectedEmergencyForDispatch._id || selectedEmergencyForDispatch.id,
        {
          ambulanceId: selectedAmbulanceId,
          etaMinutes: Number(etaInput) || 10,
          notes: dispatchNotes
        }
      );
      setSelectedEmergencyForDispatch(null);
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Siren className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              Emergency SOS Command Center
              <Badge className="bg-white/20 text-white text-[10px] font-bold border-0">
                Live Receiver
              </Badge>
            </h3>
            <p className="text-xs text-red-100">
              Real-time incoming citizen SOS alerts broadcasted to {hospitalName || 'your hospital'}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1.5 h-8 self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh SOS Queue
        </Button>
      </div>

      {/* Emergency List */}
      {emergencies.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">No Active SOS Incidents</h4>
            <p className="text-xs max-w-sm mx-auto">
              All incoming emergency requests have been resolved. The system is actively monitoring real-time dispatch channels.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {emergencies.map((emg) => {
            const isCritical = emg.priority === 'critical';
            const isDispatched = emg.status === 'dispatched' || emg.status === 'in_transit';
            const isAssigned = emg.status === 'assigned';
            const isSearching = emg.status === 'searching' || emg.status === 'pending';

            return (
              <Card
                key={emg._id || emg.id}
                className={cn(
                  "border-2 transition-all shadow-xs",
                  isCritical ? "border-red-500/50 bg-red-50/20 dark:bg-red-950/10" : "border-amber-500/30",
                  isDispatched ? "border-emerald-500/50" : ""
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                          isCritical ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                        )}>
                          {emg.emergencyType || 'Emergency'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          Bed: {emg.bedType?.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-extrabold text-foreground">
                        {emg.patientName || 'Emergency Patient'}
                      </CardTitle>
                    </div>

                    <Badge
                      className={cn(
                        "text-[10px] font-bold capitalize",
                        isDispatched
                          ? "bg-emerald-600 text-white"
                          : isAssigned
                            ? "bg-blue-600 text-white"
                            : "bg-red-600 text-white animate-pulse"
                      )}
                    >
                      {emg.status === 'searching' ? 'Awaiting Dispatch' : emg.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3 text-xs">
                  {/* Location & Contact Details */}
                  <div className="rounded-xl bg-muted/40 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-red-500" />
                        Callback: <strong className="text-foreground">{emg.contactPhone}</strong>
                      </span>
                      {emg.contactPhone && (
                        <a
                          href={`tel:${emg.contactPhone}`}
                          className="text-red-600 hover:underline font-bold text-[11px]"
                        >
                          Call Direct ↗
                        </a>
                      )}
                    </div>

                    {emg.location && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Navigation className="h-3 w-3 text-blue-500 shrink-0" />
                          <span className="truncate">{emg.location.address || `GPS: ${emg.location.lat?.toFixed(4)}, ${emg.location.lng?.toFixed(4)}`}</span>
                        </span>
                        <a
                          href={`https://maps.google.com/?q=${emg.location.lat},${emg.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-bold text-[11px] shrink-0 ml-2"
                        >
                          Map ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Dispatched Ambulance Information if active */}
                  {emg.ambulanceDetails && (
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <Activity className="h-3.5 w-3.5" />
                          Ambulance: {emg.ambulanceDetails.vehicleNumber}
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          ETA ~{emg.estimatedArrival || 10}m
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Driver: {emg.ambulanceDetails.driverName} ({emg.ambulanceDetails.driverPhone})
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isSearching && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenDispatchModal(emg)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Dispatch Ambulance
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAcceptBed(emg._id || emg.id)}
                          className="font-bold text-xs h-8 gap-1.5 cursor-pointer"
                        >
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          Accept Bed Only
                        </Button>
                      </>
                    )}

                    {isAssigned && !isDispatched && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenDispatchModal(emg)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Dispatch Ambulance Unit
                      </Button>
                    )}

                    {isDispatched && (
                      <Button
                        size="sm"
                        onClick={() => onResolveEmergency(emg._id || emg.id, 'admitted')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Patient Admitted
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dispatch Ambulance Modal */}
      <Dialog
        open={Boolean(selectedEmergencyForDispatch)}
        onOpenChange={(open) => { if (!open) setSelectedEmergencyForDispatch(null); }}
      >
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Dispatch Ambulance to Emergency
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Patient: <strong className="text-foreground">{selectedEmergencyForDispatch?.patientName}</strong> ({selectedEmergencyForDispatch?.emergencyType})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs font-semibold block mb-1">
                Select Ambulance from Fleet *
              </Label>
              {availableAmbulances.length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-bold">No available ambulances in hospital fleet.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    System will auto-dispatch nearest city response unit or request mutual aid.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {availableAmbulances.map((amb) => (
                    <div
                      key={amb._id || amb.id}
                      onClick={() => setSelectedAmbulanceId(amb._id || amb.id)}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all",
                        selectedAmbulanceId === (amb._id || amb.id)
                          ? "border-red-600 bg-red-50/50 dark:bg-red-950/20 font-bold"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <div>
                        <span className="font-mono text-sm block">{amb.vehicleNumber}</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          Driver: {amb.driverName} ({amb.driverPhone})
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {amb.equipmentLevel || 'ALS'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold block mb-1">
                  Estimated Arrival (Minutes) *
                </Label>
                <Input
                  type="number"
                  min="2"
                  max="60"
                  value={etaInput}
                  onChange={(e) => setEtaInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-1">
                  ER Bed Ready
                </Label>
                <div className="h-9 flex items-center px-3 border rounded-lg bg-muted/30 text-xs font-bold text-red-600">
                  {selectedEmergencyForDispatch?.bedType?.toUpperCase()} Bed
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold block mb-1">
                Driver Instructions / Medical Notes (Optional)
              </Label>
              <Input
                placeholder="e.g. Oxygen cylinder prepped, severe bleeding"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedEmergencyForDispatch(null)}
                className="flex-1 text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDispatch}
                disabled={isSubmittingDispatch}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
              >
                {isSubmittingDispatch ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Confirm & Send Ambulance
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmergencySOSManager;

import React from 'react';
import {
  Siren,
  Phone,
  Navigation,
  AlertTriangle,
  Zap,
  Building2,
  X,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function IncomingSOSModal({
  open,
  emergency,
  onClose,
  onQuickDispatch,
  onAcceptBed
}) {
  if (!emergency) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-2 border-red-600 rounded-3xl bg-background shadow-2xl">
        {/* Flashing Urgency Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-5 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-2 animate-bounce shadow-lg">
              <Siren className="h-9 w-9 text-white animate-spin-slow" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest bg-black/30 px-3 py-0.5 rounded-full border border-white/20">
              🚨 CRITICAL INCOMING EMERGENCY SOS
            </span>
            <DialogTitle className="text-xl sm:text-2xl font-black mt-2 text-white">
              Patient Needs Immediate Care!
            </DialogTitle>
          </div>
        </div>

        {/* Emergency Info Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Patient Name</span>
              <h4 className="text-base font-extrabold text-foreground">
                {emergency.patientName || 'Emergency Patient'}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bed Required</span>
              <Badge className="bg-red-600 text-white font-black block text-xs mt-0.5">
                {emergency.bedType?.toUpperCase()} BED
              </Badge>
            </div>
          </div>

          {/* Condition & Phone Banner */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border bg-red-50/50 dark:bg-red-950/20 border-red-500/30">
              <span className="text-[10px] text-red-600 font-bold block uppercase">Condition</span>
              <span className="text-xs font-black capitalize text-foreground">
                {emergency.emergencyType || 'Emergency'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border bg-muted/30">
              <span className="text-[10px] text-muted-foreground font-bold block uppercase">Contact</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {emergency.contactPhone}
              </span>
            </div>
          </div>

          {/* Location details */}
          {emergency.location && (
            <div className="p-2.5 rounded-xl border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Navigation className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="truncate text-muted-foreground">
                  {emergency.location.address || `GPS: ${emergency.location.lat?.toFixed(4)}, ${emergency.location.lng?.toFixed(4)}`}
                </span>
              </div>
              <a
                href={`https://maps.google.com/?q=${emergency.location.lat},${emergency.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-bold shrink-0 ml-2"
              >
                Map ↗
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={() => onQuickDispatch(emergency)}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black text-xs gap-2 shadow-lg cursor-pointer animate-pulse"
            >
              <Zap className="h-4 w-4" />
              ⚡ Accept & Dispatch Ambulance Unit
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onAcceptBed(emergency._id || emergency.id)}
                className="h-9 text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                Reserve Bed Only
              </Button>

              <Button
                variant="ghost"
                onClick={onClose}
                className="h-9 text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1"
              >
                <VolumeX className="h-3.5 w-3.5" />
                Silence / Dismiss
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingSOSModal;

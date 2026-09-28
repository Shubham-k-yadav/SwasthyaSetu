import React, { useState, useEffect } from 'react';
import { Siren, AlertTriangle, Zap, Phone, Navigation, HeartPulse, Activity, ShieldAlert, X, RefreshCw, CheckCircle2 } from 'lucide-react';
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

const QUICK_CONDITIONS = [
  { id: 'cardiac', label: 'Heart / Chest Pain', icon: HeartPulse, bedType: 'icu', priority: 'critical', color: 'from-rose-500 to-red-600' },
  { id: 'trauma', label: 'Accident / Trauma', icon: AlertTriangle, bedType: 'icu', priority: 'critical', color: 'from-amber-500 to-red-600' },
  { id: 'respiratory', label: 'Severe Breathlessness', icon: Activity, bedType: 'ventilator', priority: 'high', color: 'from-blue-500 to-indigo-600' },
  { id: 'stroke', label: 'Brain Stroke / Paralysis', icon: Zap, bedType: 'icu', priority: 'critical', color: 'from-purple-500 to-pink-600' },
  { id: 'other', label: 'General Emergency', icon: ShieldAlert, bedType: 'general', priority: 'high', color: 'from-emerald-500 to-teal-600' }
];

export function InstantSOSTrigger({ onTriggerSOS, isTriggering, userLocation, onGetLocation }) {
  const [selectedCondition, setSelectedCondition] = useState(QUICK_CONDITIONS[0]);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [phoneInput, setPhoneInput] = useState(() => {
    return localStorage.getItem('swasthya_setu_user_phone') || '';
  });
  const [patientNameInput, setPatientNameInput] = useState(() => {
    return localStorage.getItem('swasthya_setu_user_name') || '';
  });

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdownOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdownOpen && countdown === 0) {
      setCountdownOpen(false);
      executeSOS();
    }
    return () => clearTimeout(timer);
  }, [countdownOpen, countdown]);

  const handleStartSOS = () => {
    if (!phoneInput || phoneInput.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number for emergency callback');
      return;
    }

    // Save phone to localStorage for rapid reuse
    localStorage.setItem('swasthya_setu_user_phone', phoneInput.trim());
    if (patientNameInput) {
      localStorage.setItem('swasthya_setu_user_name', patientNameInput.trim());
    }

    // Reset countdown and open confirmation modal
    setCountdown(3);
    setCountdownOpen(true);
  };

  const cancelSOS = () => {
    setCountdownOpen(false);
    setCountdown(3);
    toast.info('Emergency SOS cancelled');
  };

  const executeSOS = () => {
    onTriggerSOS({
      patientName: patientNameInput.trim() || 'Emergency Patient',
      contactPhone: phoneInput.trim(),
      emergencyType: selectedCondition.id,
      bedType: selectedCondition.bedType,
      priority: selectedCondition.priority,
      sosTriggerType: '1_click_sos'
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/40 bg-gradient-to-br from-red-600 via-rose-700 to-slate-950 p-5 sm:p-8 text-white shadow-2xl">
      {/* Decorative background glow & pulse rings */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Column: Information & Condition Chips */}
        <div className="space-y-4 max-w-xl text-center lg:text-left w-full">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md border border-white/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            24x7 REAL-TIME SOS DISPATCH NETWORK
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              One-Click Instant Emergency SOS
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed">
              Auto-locates your GPS, notifies the nearest 3 hospital emergency rooms, and prepares ambulance dispatch within seconds.
            </p>
          </div>

          {/* Quick Condition Selector */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-red-200 block uppercase tracking-wider text-[11px]">
              Select Patient Emergency Condition:
            </span>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {QUICK_CONDITIONS.map((cond) => {
                const Icon = cond.icon;
                const isSelected = selectedCondition.id === cond.id;
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setSelectedCondition(cond)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                      isSelected
                        ? "bg-white text-red-700 border-white shadow-lg scale-105"
                        : "bg-white/10 hover:bg-white/20 text-white border-white/15 backdrop-blur-sm"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{cond.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact & GPS details row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <Label className="text-[11px] font-semibold text-red-200 block mb-1">
                Emergency Callback Number *
              </Label>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="h-9 bg-black/30 border-white/20 text-white placeholder:text-white/50 text-xs rounded-xl focus-visible:ring-white"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-red-200 block mb-1">
                Patient Name (Optional)
              </Label>
              <Input
                placeholder="e.g. Rahul / Family Member"
                value={patientNameInput}
                onChange={(e) => setPatientNameInput(e.target.value)}
                className="h-9 bg-black/30 border-white/20 text-white placeholder:text-white/50 text-xs rounded-xl focus-visible:ring-white"
              />
            </div>
          </div>

          {/* GPS status pill */}
          <div className="flex items-center justify-between gap-2 text-xs bg-black/25 rounded-xl p-2.5 border border-white/10">
            <div className="flex items-center gap-2 truncate">
              <Navigation className={cn("h-4 w-4 shrink-0", userLocation ? "text-emerald-400" : "text-amber-300")} />
              <span className="text-[11px] truncate">
                {userLocation
                  ? `GPS Detected: (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
                  : 'GPS location needed for accurate dispatch'}
              </span>
            </div>
            {!userLocation && (
              <Button
                size="sm"
                type="button"
                onClick={onGetLocation}
                className="h-7 text-[11px] font-bold bg-white text-red-700 hover:bg-red-50 shrink-0"
              >
                Detect GPS
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Giant Pulsating SOS Button */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full sm:w-auto py-2">
          <div className="relative group">
            {/* Glowing animated pulse rings */}
            <div className="absolute -inset-4 rounded-full bg-red-500/40 blur-xl animate-pulse group-hover:bg-red-400/60" />
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 to-amber-500 blur-sm animate-spin-slow opacity-75" />

            <button
              type="button"
              disabled={isTriggering}
              onClick={handleStartSOS}
              className={cn(
                "relative flex flex-col items-center justify-center h-44 w-44 sm:h-52 sm:w-52 rounded-full",
                "bg-gradient-to-br from-red-500 via-rose-600 to-red-800 text-white",
                "border-4 border-white/80 shadow-[0_0_50px_rgba(239,68,68,0.7)]",
                "transition-all duration-300 transform active:scale-95 hover:scale-105 cursor-pointer",
                isTriggering ? "opacity-75 cursor-not-allowed" : ""
              )}
            >
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/20 flex items-center justify-center mb-2 animate-bounce">
                <Siren className="h-7 w-7 sm:h-9 sm:w-9 text-white animate-pulse" />
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-widest uppercase">
                SOS
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-red-100 tracking-wider mt-0.5 uppercase">
                Tap for Instant Help
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 text-[11px] text-red-200/90 font-medium">
            <Phone className="h-3 w-3 text-red-300" />
            <span>National Emergency: <strong>108 / 112</strong></span>
          </div>
        </div>
      </div>

      {/* Countdown Emergency Confirmation Modal */}
      <Dialog open={countdownOpen} onOpenChange={(open) => { if (!open) cancelSOS(); }}>
        <DialogContent className="sm:max-w-md p-6 text-center border-2 border-red-500 rounded-3xl bg-slate-950 text-white">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center animate-pulse">
              <Siren className="h-9 w-9 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">
              Broadcasting Emergency SOS...
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300">
              Triggering real-time broadcast to nearest hospital emergency departments and ambulance fleet.
            </DialogDescription>
          </DialogHeader>

          {/* Big countdown digit */}
          <div className="my-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border-4 border-red-500/30 flex items-center justify-center bg-red-500/10">
                <span className="text-6xl font-black text-red-500 animate-scale-up">
                  {countdown}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Emergency: <strong className="text-white">{selectedCondition.label}</strong> • Phone: <strong className="text-white">{phoneInput}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={cancelSOS}
              className="flex-1 h-11 border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 cursor-pointer"
            >
              <X className="h-4 w-4 text-slate-400" />
              Cancel / False Alarm
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCountdownOpen(false);
                executeSOS();
              }}
              className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-black text-xs gap-1.5 shadow-lg cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              Dispatch Immediately Now!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstantSOSTrigger;

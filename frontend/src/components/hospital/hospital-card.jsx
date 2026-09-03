import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MapPin,
  Phone,
  Clock,
  Shield,
  Navigation,
  Bed,
  Heart,
  Wind,
  Zap,
  CheckCircle,
  AlertCircle,
  Printer
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { getFreshnessStatus } from '@/lib/freshness';
import { hospitalApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { BedTicketDialog, printOrDownloadTicket } from './bed-ticket-dialog';

export function HospitalCard({
  hospital,
  initialBedType = 'icu',
  onViewDetails,
  onGetDirections,
  showDistance = false
}) {
  const { t } = useLanguage();
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'confirmed'
  const [bedType, setBedType] = useState(() => {
    const valid = ['icu', 'general', 'ventilator'];
    const clean = String(initialBedType || '').toLowerCase();
    return valid.includes(clean) ? clean : 'icu';
  });
  const [patientName, setPatientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [error, setError] = useState('');

  useEffect(() => {
    const valid = ['icu', 'general', 'ventilator'];
    const clean = String(initialBedType || '').toLowerCase();
    if (valid.includes(clean)) {
      setBedType(clean);
    }
  }, [initialBedType]);

  const totalAvailable = (hospital.beds?.icu?.available || 0) +
    (hospital.beds?.general?.available || 0) +
    (hospital.beds?.ventilator?.available || 0);

  const hasAvailability = totalAvailable > 0;
  const freshness = getFreshnessStatus(hospital.lastUpdated);

  // Live countdown timer effect for active bed reservation
  useEffect(() => {
    let timer;
    if (step === 'confirmed' && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!patientName || !contactPhone) {
      setError('Patient name and contact phone are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await hospitalApi.requestOtp(contactPhone);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndReserve = async (e) => {
    e.preventDefault();
    if (!otpInput) {
      setError('Please enter the OTP sent to your phone.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await hospitalApi.verifyOtp(contactPhone, otpInput);
      const chosenBedType = bedType || 'icu';
      const res = await hospitalApi.reserveBed(hospital._id || hospital.id, {
        bedType: chosenBedType,
        patientName,
        contactPhone,
        holdMinutes: 10
      });
      const confirmedRes = {
        ...res.reservation,
        bedType: res.reservation?.bedType || chosenBedType
      };
      setReservation(confirmedRes);
      setSecondsRemaining(res.expiresInSeconds || 600);
      setStep('confirmed');
    } catch (err) {
      setError(err.message || 'Failed to complete bed reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!reservation?.reservationCode) return;
    setIsReleasing(true);
    try {
      await hospitalApi.releaseReservation(reservation.reservationCode);
      setReservation(null);
      setStep('input');
      setIsReserveOpen(false);
    } catch (err) {
      setError('Failed to release bed hold.');
    } finally {
      setIsReleasing(false);
    }
  };

  const handleModalClose = (open) => {
    setIsReserveOpen(open);
    if (!open && step !== 'confirmed') {
      setStep('input');
      setError('');
    }
  };

  return (
    <>
      <Card className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border-primary/10',
        (!hasAvailability || freshness.isExpired) && 'opacity-75'
      )}>
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-start justify-between gap-2 w-full min-w-0">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold leading-snug">{hospital.name}</CardTitle>
                {hospital.isVerified ? (
                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-500/20 font-semibold text-[10px] px-1.5 py-0.2 shrink-0">
                    <Shield className="h-2.5 w-2.5" />
                    {t('verified')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-500/20 text-[10px] px-1.5 py-0.2 shrink-0">
                    {t('unverified')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                <span className="truncate block min-w-0">{hospital.address}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
              <Badge
                variant="outline"
                className={cn('text-[10px] sm:text-[11px] gap-1 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs', freshness.colorClass)}
              >
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {freshness.text}
              </Badge>
              {showDistance && hospital.distance && (
                <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5 border-gray-200">
                  <Navigation className="h-2.5 w-2.5 text-blue-500" />
                  {hospital.distance.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3.5 sm:p-5 pt-0 sm:pt-0">
          {/* Bed Availability */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <BedIndicator
              label="ICU"
              icon={Heart}
              available={hospital.beds?.icu?.available || 0}
              total={hospital.beds?.icu?.total || 0}
              isSelected={bedType === 'icu'}
              onClick={() => {
                setBedType('icu');
                setError('');
                setIsReserveOpen(true);
              }}
            />
            <BedIndicator
              label="General"
              icon={Bed}
              available={hospital.beds?.general?.available || 0}
              total={hospital.beds?.general?.total || 0}
              isSelected={bedType === 'general'}
              onClick={() => {
                setBedType('general');
                setError('');
                setIsReserveOpen(true);
              }}
            />
            <BedIndicator
              label="Ventilator"
              icon={Wind}
              available={hospital.beds?.ventilator?.available || 0}
              total={hospital.beds?.ventilator?.total || 0}
              isSelected={bedType === 'ventilator'}
              onClick={() => {
                setBedType('ventilator');
                setError('');
                setIsReserveOpen(true);
              }}
            />
          </div>

          {/* Hospital Contact Info */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1.5 border-t border-gray-100 dark:border-gray-800">
            {hospital.phone ? (
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200 hover:text-red-600 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>{hospital.phone}</span>
              </a>
            ) : (
              <span className="text-gray-400">Phone not listed</span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>24/7 Emergency</span>
            </div>
          </div>

          {/* Actions (2 Buttons Side-by-Side on Mobile & Desktop) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl shadow-xs"
              onClick={() => { setError(''); setIsReserveOpen(true); }}
              disabled={!hasAvailability}
            >
              <Zap className="h-3.5 w-3.5" />
              {t('holdBed')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 font-semibold text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl border-gray-300 hover:bg-gray-50"
              onClick={onGetDirections}
              disabled={!hasAvailability}
            >
              <Navigation className="h-3.5 w-3.5 text-gray-600" />
              {t('directions')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Bed Hold Modal */}
      <Dialog open={isReserveOpen} onOpenChange={handleModalClose}>
        <DialogContent className="w-[94vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="h-5 w-5 text-amber-500" />
              {step === 'confirmed' ? 'Bed Reservation Ticket' : 'Verified Bed Hold (10-Min Limit)'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {hospital.name} — Concurrency lock & phone OTP verification active.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'input' && (
            <form onSubmit={handleRequestOtp} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone Number</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">+91</span>
                  <Input
                    id="contactPhone"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className="pl-12"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">Select Bed Category to Hold</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'icu', label: 'ICU Bed', avail: hospital.beds?.icu?.available ?? 0 },
                    { type: 'general', label: 'General Bed', avail: hospital.beds?.general?.available ?? 0 },
                    { type: 'ventilator', label: 'Ventilator', avail: hospital.beds?.ventilator?.available ?? 0 }
                  ].map(b => {
                    const isSelected = bedType === b.type;
                    return (
                      <button
                        key={b.type}
                        type="button"
                        disabled={b.avail <= 0}
                        onClick={() => setBedType(b.type)}
                        className={cn(
                          'p-2.5 rounded-xl border text-center transition-all cursor-pointer relative select-none',
                          isSelected 
                            ? 'border-2 border-red-600 bg-red-50 dark:bg-red-950/40 font-bold shadow-xs text-red-600 ring-1 ring-red-600' 
                            : 'border-gray-200 dark:border-gray-800 hover:bg-muted/50 text-gray-700 dark:text-gray-300',
                          b.avail <= 0 && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <p className="text-xs font-bold leading-tight">{b.label}</p>
                        <p className={cn('text-sm font-black mt-0.5', b.avail > 0 ? (isSelected ? 'text-red-600' : 'text-emerald-600') : 'text-red-500')}>
                          {b.avail} left
                        </p>
                        {isSelected && (
                          <span className="inline-block text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.2 rounded-full mt-1">
                            ✓ Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11" disabled={isSubmitting}>
                {isSubmitting ? 'Generating One-Time Lock...' : 'Proceed with Phone Verification'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtpAndReserve} className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                📱 OTP sent to <strong>+91-{contactPhone}</strong> (Demo OTP: <strong>123456</strong>)
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  className="font-mono text-center tracking-widest text-lg font-bold"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('input')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying & Holding...' : 'Verify OTP & Hold Bed'}
                </Button>
              </div>
            </form>
          )}

          {step === 'confirmed' && reservation && (
            <div className="space-y-2.5 sm:space-y-3.5 py-1">
              <div className="p-2.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-600" />
                  <h3 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300">
                    Bed Hold Active!
                  </h3>
                </div>

                <div className="p-1.5 sm:p-2.5 rounded-lg bg-background font-mono font-black text-lg sm:text-2xl text-primary tracking-widest border shadow-xs">
                  {reservation.reservationCode}
                </div>

                {/* Compact Scannable Admission QR Code Image */}
                <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 shadow-xs my-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reservation.reservationCode)}`}
                    alt="Admission QR Code"
                    className="w-24 h-24 sm:w-40 sm:h-40 object-contain rounded-lg border bg-white p-1"
                  />
                  <span className="text-[9px] sm:text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold mt-1 uppercase">
                    📱 Show QR Pass at Hospital Desk
                  </span>
                </div>

                {/* Live Countdown Timer Display */}
                <div className="p-1.5 sm:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs">⏳ Time Remaining:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">
                    {secondsRemaining > 0 ? formatTimer(secondsRemaining) : 'EXPIRED'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] sm:text-xs grid grid-cols-2 gap-1 text-muted-foreground border-t pt-2">
                <p className="truncate">👤 <strong>Patient:</strong> {patientName}</p>
                <p>🛏️ <strong>Bed:</strong> {(bedType || 'ICU').toUpperCase()}</p>
                <p className="col-span-2 truncate">🏥 <strong>Hospital:</strong> {hospital.name}</p>
              </div>

              <Button
                variant="outline"
                className="w-full h-9 sm:h-9 text-xs sm:text-sm rounded-xl gap-2 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50 font-medium"
                onClick={() => printOrDownloadTicket({ reservation, hospital, patientName, contactPhone, bedType })}
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Print / Save PDF Ticket (with QR Code)
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button variant="outline" className="h-9 sm:h-9 text-xs sm:text-sm rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleReleaseHold} disabled={isReleasing}>
                  {isReleasing ? 'Releasing...' : 'Release Hold'}
                </Button>
                <Button className="h-9 sm:h-9 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => setIsReserveOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Bed Ticket Dialog with QR Code */}
      <BedTicketDialog
        open={isTicketOpen}
        onOpenChange={setIsTicketOpen}
        reservation={reservation}
        hospital={hospital}
        patientName={patientName}
        contactPhone={contactPhone}
        bedType={bedType}
      />
    </>
  );
}

function BedIndicator({ label, icon: Icon, available, total, onClick, isSelected }) {
  const percentage = total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0;

  let statusColor = 'bg-emerald-500';
  let textColor = 'text-emerald-600 dark:text-emerald-400';
  if (percentage === 0) {
    statusColor = 'bg-red-500';
    textColor = 'text-red-600 dark:text-red-400';
  } else if (percentage < 30) {
    statusColor = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        'rounded-xl border p-2 text-center transition-all select-none',
        onClick ? 'cursor-pointer' : '',
        isSelected 
          ? 'border-red-500 bg-red-50/60 dark:bg-red-950/30 shadow-xs ring-1 ring-red-500' 
          : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-card hover:border-gray-300 dark:hover:border-gray-700'
      )}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground truncate">{label}</span>
      </div>
      <p className={cn('text-base sm:text-xl font-black tracking-tight leading-tight', textColor)}>{available}</p>
      <div className="my-1 h-1 sm:h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden w-full">
        <div
          className={cn('h-full rounded-full transition-all duration-500', statusColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[9px] sm:text-[11px] text-muted-foreground font-medium">of {total}</p>
    </div>
  );
}

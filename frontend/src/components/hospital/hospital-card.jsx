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
import { BedTicketDialog } from './bed-ticket-dialog';

export function HospitalCard({ 
  hospital, 
  onViewDetails, 
  onGetDirections,
  showDistance = false 
}) {
  const { t } = useLanguage();
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'confirmed'
  const [bedType, setBedType] = useState('icu');
  const [patientName, setPatientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [error, setError] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);

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
      const res = await hospitalApi.reserveBed(hospital._id || hospital.id, {
        bedType,
        patientName,
        contactPhone,
        holdMinutes: 10
      });
      setReservation(res.reservation);
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
        'overflow-hidden transition-all hover:shadow-lg',
        (!hasAvailability || freshness.isExpired) && 'opacity-75'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-tight">{hospital.name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{hospital.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {hospital.isVerified ? (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  <Shield className="h-3 w-3" />
                  {t('verified')}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {t('unverified')}
                </Badge>
              )}
              <Badge className={cn('text-xs gap-1 border', freshness.colorClass)}>
                <Clock className="h-3 w-3" />
                {freshness.text}
              </Badge>
              {showDistance && hospital.distance && (
                <Badge variant="outline" className="gap-1">
                  <Navigation className="h-3.5 w-3.5" />
                  {hospital.distance.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bed Availability */}
          <div className="grid grid-cols-3 gap-3">
            <BedIndicator 
              label={t('icuBeds')} 
              icon={Heart}
              available={hospital.beds?.icu?.available || 0} 
              total={hospital.beds?.icu?.total || 0} 
            />
            <BedIndicator 
              label={t('generalBeds')} 
              icon={Bed}
              available={hospital.beds?.general?.available || 0} 
              total={hospital.beds?.general?.total || 0} 
            />
            <BedIndicator 
              label={t('ventilatorBeds')} 
              icon={Wind}
              available={hospital.beds?.ventilator?.available || 0} 
              total={hospital.beds?.ventilator?.total || 0} 
            />
          </div>

          {/* Hospital Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{hospital.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>24/7 Emergency</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={() => { setError(''); setIsReserveOpen(true); }}
              disabled={!hasAvailability}
            >
              <Zap className="h-4 w-4" />
              {t('holdBed')}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={onGetDirections}
              disabled={!hasAvailability}
            >
              <Navigation className="h-4 w-4" />
              {t('directions')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Bed Hold Modal */}
      <Dialog open={isReserveOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-amber-500" />
              {step === 'confirmed' ? 'Bed Reservation Ticket' : 'Verified Bed Hold (10-Min Limit)'}
            </DialogTitle>
            <DialogDescription>
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
                <Label htmlFor="bedType">Select Bed Type</Label>
                <Select value={bedType} onValueChange={setBedType}>
                  <SelectTrigger id="bedType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icu">ICU Bed ({hospital.beds?.icu?.available || 0} available)</SelectItem>
                    <SelectItem value="general">General Bed ({hospital.beds?.general?.available || 0} available)</SelectItem>
                    <SelectItem value="ventilator">Ventilator Bed ({hospital.beds?.ventilator?.available || 0} available)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pname">Patient Full Name</Label>
                <Input
                  id="pname"
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pphone">Emergency Mobile Number (+91)</Label>
                <Input
                  id="pphone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">10-digit mobile number required for OTP verification.</p>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Verification OTP...' : 'Request Verification OTP'}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyAndReserve} className="space-y-4 py-2">
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
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  Bed Hold Active!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Present code at admission counter ({hospital.name}):
                </p>
                <div className="p-2.5 rounded-lg bg-background font-mono font-black text-2xl text-primary tracking-widest border shadow-xs">
                  {reservation.reservationCode}
                </div>
                
                {/* Live Countdown Timer Display */}
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">⏳ Hold Time Remaining:</span>
                  <span className="font-mono font-black text-lg text-amber-600 dark:text-amber-400">
                    {secondsRemaining > 0 ? formatTimer(secondsRemaining) : 'EXPIRED'}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-1 text-muted-foreground border-t pt-2">
                <p>👤 <strong>Patient:</strong> {patientName}</p>
                <p>🛏️ <strong>Bed Type:</strong> {bedType.toUpperCase()}</p>
                <p>📞 <strong>Phone:</strong> +91-{contactPhone}</p>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50 font-medium"
                onClick={() => setIsTicketOpen(true)}
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF Ticket (with QR Code)
              </Button>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleReleaseHold} disabled={isReleasing}>
                  {isReleasing ? 'Releasing...' : 'Release Hold'}
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setIsReserveOpen(false)}>
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

function BedIndicator({ label, icon: Icon, available, total }) {
  const percentage = total > 0 ? (available / total) * 100 : 0;
  
  let statusColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  if (percentage === 0) {
    statusColor = 'bg-red-500';
    textColor = 'text-red-700';
  } else if (percentage < 30) {
    statusColor = 'bg-amber-500';
    textColor = 'text-amber-700';
  }

  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-xl font-bold', textColor)}>{available}</p>
      <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', statusColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">of {total}</p>
    </div>
  );
}

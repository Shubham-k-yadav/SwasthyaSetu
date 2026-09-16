import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hospitalApi } from '@/lib/api';
import { printOrDownloadTicket } from './bed-ticket-dialog';
import { useLanguage } from '@/lib/language-context';
import { toast } from 'sonner';
import { getSocket, connectSocket } from '@/lib/socket';

export function BedHoldModal({
  open,
  onOpenChange,
  hospital,
  bedType,
  setBedType,
  onReservationSuccess
}) {
  const { t } = useLanguage();
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'confirmed'
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [contactPhone, setContactPhone] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [holdToken, setHoldToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [error, setError] = useState('');

  const icuAvail = Number(hospital?.beds?.icu?.available) || 0;
  const genAvail = Number(hospital?.beds?.general?.available) || 0;
  const ventAvail = Number(hospital?.beds?.ventilator?.available) || 0;
  const totalAvailable = icuAvail + genAvail + ventAvail;

  // Auto-switch to an available bed category whenever modal opens or hospital/bedType changes
  useEffect(() => {
    if (!open) return;
    const currentAvail = Number(hospital?.beds?.[bedType]?.available) || 0;
    if (currentAvail <= 0) {
      if (icuAvail > 0) setBedType('icu');
      else if (genAvail > 0) setBedType('general');
      else if (ventAvail > 0) setBedType('ventilator');
    }
  }, [open, hospital, bedType, icuAvail, genAvail, ventAvail, setBedType]);

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

  // Real-Time Socket listener for admin/superadmin release
  useEffect(() => {
    if (!open || !reservation?.reservationCode) return;
    const currentCode = reservation.reservationCode;

    connectSocket();
    const socket = getSocket();

    const handleStatusChange = (data) => {
      if (data?.reservationCode === currentCode) {
        if (data.status === 'released' || data.status === 'expired' || data.status === 'discharged') {
          sessionStorage.removeItem(`ss_hold_${currentCode}`);
          localStorage.removeItem('swasthya_active_bed_hold');
          setReservation(null);
          setHoldToken('');
          setStep('input');
          onOpenChange(false);
          window.dispatchEvent(new Event('bed_hold_updated'));
          toast.info(data.status === 'expired'
            ? 'Bed hold expired.'
            : 'Bed hold was released by the hospital administrator.'
          );
        }
      }
    };

    socket.on('reservation-status-updated', handleStatusChange);
    return () => {
      socket.off('reservation-status-updated', handleStatusChange);
    };
  }, [open, reservation?.reservationCode, onOpenChange]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModalClose = (isOpen) => {
    onOpenChange(isOpen);
    if (!isOpen && step !== 'confirmed') {
      setStep('input');
      setError('');
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!patientName?.trim() || !contactPhone?.trim()) {
      setError('Patient name and contact phone are required.');
      return;
    }
    if (!patientAge || Number(patientAge) < 1 || Number(patientAge) > 125) {
      setError('Please enter a valid patient age (1 to 125 years).');
      return;
    }
    if (totalAvailable <= 0) {
      setError('No beds are currently available at this hospital.');
      return;
    }
    const chosenBedAvail = Number(hospital?.beds?.[bedType]?.available) || 0;
    if (chosenBedAvail <= 0) {
      setError(`No ${bedType?.toUpperCase()} beds are currently available to hold. Please select another category.`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await hospitalApi.requestOtp(contactPhone, {
        hospitalId: hospital._id || hospital.id,
        bedType
      });
      setReceivedOtp(res.otp || '');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndReserve = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!otpInput) {
      setError('Please enter the OTP sent to your phone.');
      return;
    }
    const chosenBedType = bedType || 'icu';
    const chosenBedAvail = Number(hospital?.beds?.[chosenBedType]?.available) || 0;
    if (chosenBedAvail <= 0) {
      setError(`No ${chosenBedType.toUpperCase()} beds are currently available.`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await hospitalApi.verifyOtp(contactPhone, otpInput);
      const res = await hospitalApi.reserveBed(hospital._id || hospital.id, {
        bedType: chosenBedType,
        patientName: patientName.trim(),
        contactPhone,
        age: Number(patientAge),
        gender: patientGender,
        holdMinutes: 10
      });
      const confirmedRes = {
        ...res.reservation,
        bedType: res.reservation?.bedType || chosenBedType,
        age: res.reservation?.age || Number(patientAge),
        gender: res.reservation?.gender || patientGender
      };
      if (res.holdToken) {
        setHoldToken(res.holdToken);
        sessionStorage.setItem(`ss_hold_${confirmedRes.reservationCode}`, res.holdToken);
      }
      setReservation(confirmedRes);
      setSecondsRemaining(res.expiresInSeconds || 600);
      setStep('confirmed');

      // Persist active hold in localStorage so page refresh never loses the ticket
      const holdData = {
        reservation: confirmedRes,
        hospital: {
          _id: hospital._id || hospital.id,
          name: hospital.name,
          address: hospital.address,
          city: hospital.city,
          contact: hospital.contact
        },
        holdToken: res.holdToken,
        patientName: patientName.trim(),
        contactPhone,
        age: Number(patientAge),
        gender: patientGender,
        bedType: confirmedRes.bedType,
        expiresAt: new Date(Date.now() + (res.expiresInSeconds || 600) * 1000).toISOString()
      };
      localStorage.setItem('swasthya_active_bed_hold', JSON.stringify(holdData));
      window.dispatchEvent(new Event('bed_hold_updated'));
      window.dispatchEvent(new CustomEvent('swasthya_bed_updated', {
        detail: {
          hospitalId: hospital._id || hospital.id,
          bedType: confirmedRes.bedType,
          beds: res.hospital?.beds
        }
      }));

      if (onReservationSuccess) {
        onReservationSuccess(confirmedRes);
      }
    } catch (err) {
      // Auto-recover active hold if one already exists for this phone
      if (err.hasActiveHold && err.existingReservation) {
        const recovered = {
          ...err.existingReservation,
          bedType: err.existingReservation.bedType || chosenBedType
        };
        setReservation(recovered);
        setSecondsRemaining(err.expiresInSeconds || 600);
        setStep('confirmed');

        const holdData = {
          reservation: recovered,
          hospital: err.hospital || hospital,
          holdToken: null,
          patientName: err.existingReservation.patientName || patientName,
          contactPhone,
          bedType: recovered.bedType,
          expiresAt: new Date(Date.now() + (err.expiresInSeconds || 600) * 1000).toISOString()
        };
        localStorage.setItem('swasthya_active_bed_hold', JSON.stringify(holdData));
        window.dispatchEvent(new Event('bed_hold_updated'));
        return;
      }
      setError(err.message || 'Failed to complete bed reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseHold = async () => {
    if (!reservation?.reservationCode) return;
    setIsReleasing(true);
    try {
      const activeToken = holdToken || sessionStorage.getItem(`ss_hold_${reservation.reservationCode}`);
      const releaseRes = await hospitalApi.releaseReservation(reservation.reservationCode, {
        token: activeToken,
        contactPhone
      });
      sessionStorage.removeItem(`ss_hold_${reservation.reservationCode}`);
      localStorage.removeItem('swasthya_active_bed_hold');
      window.dispatchEvent(new Event('bed_hold_updated'));
      window.dispatchEvent(new CustomEvent('swasthya_bed_updated', {
        detail: {
          hospitalId: reservation?.hospitalId || hospital._id || hospital.id,
          bedType: reservation?.bedType || bedType,
          beds: releaseRes?.hospital?.beds
        }
      }));
      setReservation(null);
      setHoldToken('');
      setStep('input');
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to release bed hold.');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="w-[94vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 text-amber-500" />
            {step === 'confirmed' ? t('bedTicketTitle') : t('bedHoldModalTitle')}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {hospital.name} — {t('concurrencyLockNotice')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {totalAvailable <= 0 && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold">{t('noBedsAvailable')}</p>
              <p className="text-xs mt-0.5">{t('noBedsAvailableToHold')}</p>
            </div>
          </div>
        )}

        {step === 'input' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="patientName">{t('patientName')}</Label>
              <Input
                id="patientName"
                placeholder={t('enterPatientName')}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={totalAvailable <= 0}
                required
              />
            </div>

            {/* Age & Gender Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="patientAge">{t('patientAge')} *</Label>
                <Input
                  id="patientAge"
                  type="number"
                  min="1"
                  max="125"
                  placeholder="e.g. 45"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  disabled={totalAvailable <= 0}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="patientGender">{t('patientGender')} *</Label>
                <select
                  id="patientGender"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  disabled={totalAvailable <= 0}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
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
                  disabled={totalAvailable <= 0}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-800 dark:text-gray-200">{t('selectBedCategoryHold')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'icu', label: t('icuBed'), avail: icuAvail },
                  { type: 'general', label: t('generalBed'), avail: genAvail },
                  { type: 'ventilator', label: t('ventilator'), avail: ventAvail }
                ].map((b) => {
                  const isAvailable = b.avail > 0;
                  const isSelected = isAvailable && bedType === b.type;
                  return (
                    <button
                      key={b.type}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          setBedType(b.type);
                          setError('');
                        }
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all relative select-none',
                        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 bg-gray-100/60 dark:bg-gray-800/40',
                        isSelected 
                          ? 'border-2 border-red-600 bg-red-50 dark:bg-red-950/40 font-bold shadow-xs text-red-600 ring-1 ring-red-600' 
                          : 'border-gray-200 dark:border-gray-800 hover:bg-muted/50 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <p className="text-xs font-bold leading-tight">{b.label}</p>
                      <p className={cn('text-sm font-black mt-0.5', isAvailable ? (isSelected ? 'text-red-600' : 'text-emerald-600') : 'text-red-500 line-through')}>
                        {b.avail} {t('bedsLeft')}
                      </p>
                      {isSelected ? (
                        <span className="inline-block text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.2 rounded-full mt-1">
                          ✓ {t('selected')}
                        </span>
                      ) : !isAvailable ? (
                        <span className="inline-block text-[9px] font-bold uppercase text-red-500 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.2 rounded-full mt-1">
                          {t('fullZeroLeft')}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isSubmitting || totalAvailable <= 0 || (Number(hospital?.beds?.[bedType]?.available) || 0) <= 0}
            >
              {totalAvailable <= 0 
                ? t('noBedsAvailableToHold') 
                : (Number(hospital?.beds?.[bedType]?.available) || 0) <= 0
                  ? t('selectedBedCategoryFull')
                  : (isSubmitting ? t('generatingLock') : t('proceedPhoneVerification'))}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtpAndReserve} className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              📱 {t('otpSentTo')} <strong>+91-{contactPhone}</strong>
              {receivedOtp && (
                <span> (Verification Code: <strong>{receivedOtp}</strong>)</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">{t('enterOtp')}</Label>
              <Input
                id="otp"
                maxLength={6}
                placeholder={receivedOtp || "Enter 6-digit OTP"}
                className="font-mono text-center tracking-widest text-lg font-bold"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('input')} className="flex-1">
                {t('back')}
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? t('verifyingHolding') : t('verifyOtpHold')}
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
                  {t('bedHoldActive')}
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
                  📱 {t('showQrAtDesk')}
                </span>
              </div>

              {/* Live Countdown Timer Display */}
              <div className="p-1.5 sm:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs">⏳ {t('timeRemaining')}</span>
                <span className="font-mono font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">
                  {secondsRemaining > 0 ? formatTimer(secondsRemaining) : 'EXPIRED'}
                </span>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs grid grid-cols-2 gap-1 text-muted-foreground border-t pt-2">
              <p className="truncate">👤 <strong>{t('patientLabel')}</strong> {patientName} {patientAge ? `(${patientAge}y, ${patientGender})` : ''}</p>
              <p>🛏️ <strong>{t('bedLabel')}</strong> {(bedType || 'ICU').toUpperCase()}</p>
              <p className="col-span-2 truncate">🏥 <strong>{t('hospitalLabel')}</strong> {hospital.name}</p>
            </div>

            <Button
              variant="outline"
              className="w-full h-9 sm:h-9 text-xs sm:text-sm rounded-xl gap-2 border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50 font-medium"
              onClick={() => printOrDownloadTicket({
                reservation,
                hospital,
                patientName,
                contactPhone,
                bedType,
                age: patientAge || reservation?.age,
                gender: patientGender || reservation?.gender
              })}
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('printTicket')}
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <Button variant="outline" className="h-9 sm:h-9 text-xs sm:text-sm rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleReleaseHold} disabled={isReleasing}>
                {isReleasing ? t('releasing') : t('releaseHold')}
              </Button>
              <Button className="h-9 sm:h-9 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => onOpenChange(false)}>
                {t('done')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BedHoldModal;

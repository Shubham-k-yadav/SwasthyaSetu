import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, X, Clock, ShieldCheck, Printer, Trash2, FileText } from 'lucide-react';
import { BedTicketDialog } from './bed-ticket-dialog';
import { hospitalApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { toast } from 'sonner';
import { getSocket, connectSocket } from '@/lib/socket';

export function ActiveBedHoldBanner() {
  const { t } = useLanguage();
  const [activeHold, setActiveHold] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const activeHoldRef = useRef(activeHold);
  activeHoldRef.current = activeHold;

  // Clear hold from client storage & state
  const clearHold = (notifyMessage = null) => {
    const currentCode = activeHoldRef.current?.reservation?.reservationCode;
    localStorage.removeItem('swasthya_active_bed_hold');
    if (currentCode) {
      sessionStorage.removeItem(`ss_hold_${currentCode}`);
    }
    setActiveHold(null);
    setTicketOpen(false);
    window.dispatchEvent(new Event('bed_hold_updated'));
    if (notifyMessage) {
      toast.info(notifyMessage);
    }
  };

  // Read active hold from localStorage
  const loadActiveHold = () => {
    try {
      const stored = localStorage.getItem('swasthya_active_bed_hold');
      if (!stored) {
        setActiveHold(null);
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed || !parsed.reservation || !parsed.expiresAt) {
        clearHold();
        return;
      }

      const diffSec = Math.floor((new Date(parsed.expiresAt).getTime() - Date.now()) / 1000);
      if (diffSec <= 0) {
        clearHold();
        return;
      }

      setActiveHold(parsed);
      setSecondsRemaining(diffSec);
    } catch {
      setActiveHold(null);
    }
  };

  useEffect(() => {
    loadActiveHold();

    // 1. Listen for local storage & custom events
    const handleUpdate = () => loadActiveHold();
    window.addEventListener('bed_hold_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // 2. Real-Time Socket listener for admin/system release & status changes
    connectSocket();
    const socket = getSocket();

    const handleReservationStatusChange = (data) => {
      if (!data || !data.reservationCode) return;
      const current = activeHoldRef.current;
      const stored = localStorage.getItem('swasthya_active_bed_hold');
      let storedCode = null;
      try {
        storedCode = JSON.parse(stored)?.reservation?.reservationCode;
      } catch (e) {}

      const myCode = current?.reservation?.reservationCode || storedCode;
      if (myCode && myCode === data.reservationCode) {
        console.log(`⚡ [ActiveBedHoldBanner] Live status update for ${myCode}: ${data.status}`);
        if (data.status === 'released' || data.status === 'expired' || data.status === 'discharged') {
          clearHold(
            data.status === 'expired'
              ? 'Your 10-minute bed hold has expired. Bed count was restored.'
              : 'Your bed hold was released by the administrator. Token has been cleared.'
          );
        } else if (data.status === 'confirmed') {
          try {
            if (stored) {
              const p = JSON.parse(stored);
              p.reservation.status = 'confirmed';
              localStorage.setItem('swasthya_active_bed_hold', JSON.stringify(p));
              setActiveHold({ ...p });
              toast.success('Your bed admission was confirmed by the hospital staff!');
            }
          } catch (e) {}
        }
      }
    };

    socket.on('reservation-status-updated', handleReservationStatusChange);

    return () => {
      window.removeEventListener('bed_hold_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      socket.off('reservation-status-updated', handleReservationStatusChange);
    };
  }, []);

  // Server-side verification: Periodically & on focus verify hold is still 'reserved'
  useEffect(() => {
    if (!activeHold?.reservation?.reservationCode) return;
    const code = activeHold.reservation.reservationCode;

    const verifyWithServer = async () => {
      try {
        const res = await hospitalApi.getReservationStatus(code);
        if (res && res.status) {
          if (res.status === 'confirmed') {
            setActiveHold(prev => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                reservation: {
                  ...prev.reservation,
                  status: 'confirmed'
                }
              };
              localStorage.setItem('swasthya_active_bed_hold', JSON.stringify(updated));
              return updated;
            });
          } else if (res.status === 'released' || res.status === 'expired' || res.status === 'discharged') {
            console.log(`[ActiveBedHoldBanner] Server verified status for ${code}: ${res.status}. Clearing.`);
            clearHold(res.status === 'discharged' ? 'Patient has been discharged by the hospital.' : 'Your bed hold was released or expired.');
          }
        }
      } catch (err) {
        // If reservation no longer exists on server, remove from storage
        if (err?.status === 404 || err?.message?.includes('not found')) {
          clearHold();
        }
      }
    };

    // Immediate check on mount
    verifyWithServer();

    // Check when user switches back to this tab
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        verifyWithServer();
      }
    };
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Poll server every 6 seconds as seamless fallback
    const pollTimer = setInterval(verifyWithServer, 6000);

    return () => {
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
    };
  }, [activeHold?.reservation?.reservationCode]);

  // Countdown timer interval (only active while in 'reserved' hold step)
  useEffect(() => {
    if (!activeHold || activeHold.reservation?.status === 'confirmed') return;

    const timer = setInterval(() => {
      const diffSec = Math.floor((new Date(activeHold.expiresAt).getTime() - Date.now()) / 1000);
      if (diffSec <= 0) {
        clearInterval(timer);
        clearHold('Your 10-minute bed hold has expired. The bed was returned to live availability.');
      } else {
        setSecondsRemaining(diffSec);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeHold]);

  const handleRelease = async () => {
    if (!activeHold?.reservation?.reservationCode) return;
    setIsReleasing(true);
    try {
      const releaseRes = await hospitalApi.releaseReservation(activeHold.reservation.reservationCode, {
        token: activeHold.holdToken,
        contactPhone: activeHold.contactPhone
      });
      clearHold('Bed hold released! Inventory restored to live network.');
      window.dispatchEvent(new CustomEvent('swasthya_bed_updated', {
        detail: {
          hospitalId: activeHold.hospital?._id || activeHold.hospital?.id || activeHold.reservation?.hospitalId,
          bedType: activeHold.bedType,
          beds: releaseRes?.hospital?.beds
        }
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to release bed hold.');
    } finally {
      setIsReleasing(false);
    }
  };

  const isConfirmed = activeHold?.reservation?.status === 'confirmed';

  if (!activeHold || (!isConfirmed && secondsRemaining <= 0)) {
    return null;
  }

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reservation = activeHold.reservation;
  const hospital = activeHold.hospital;

  return (
    <>
      <div 
        className={`fixed z-[9998] bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl p-3 sm:p-3.5 transition-all animate-in slide-in-from-bottom-5 duration-300 border-2 ${
          isConfirmed ? 'border-emerald-500 shadow-emerald-500/10' : 'border-sky-500 shadow-sky-500/10'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Status icon + details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ring-1 ${
              isConfirmed 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 ring-emerald-400/40' 
                : 'bg-sky-100 dark:bg-sky-950 text-sky-600 ring-sky-400/40'
            }`}>
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  {hospital?.name || 'Bed Reserved'}
                </span>
                <span className={`inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${
                  isConfirmed 
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 border-emerald-300' 
                    : 'text-sky-700 bg-sky-50 dark:bg-sky-950 border-sky-200'
                }`}>
                  {reservation.reservationCode}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {(activeHold.bedType || 'ICU').toUpperCase()} BED
                </span>
                <span>•</span>
                {isConfirmed ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✓ Admitted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono font-bold text-red-600 dark:text-red-400">
                    <Clock className="h-3 w-3 animate-pulse text-red-600" />
                    {formatTimer(secondsRemaining)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              className={`h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold text-white rounded-xl shadow-xs gap-1.5 ${
                isConfirmed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
              onClick={() => setTicketOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{isConfirmed ? 'Admission Slip' : 'QR Pass'}</span>
            </Button>

            {!isConfirmed && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 sm:h-8.5 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl"
                onClick={handleRelease}
                disabled={isReleasing}
                title="Release Hold"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full Ticket Dialog */}
      <BedTicketDialog
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        reservation={reservation}
        hospital={hospital}
        patientName={activeHold.patientName}
        contactPhone={activeHold.contactPhone}
        bedType={activeHold.bedType}
        age={activeHold.age || reservation?.age}
        gender={activeHold.gender || reservation?.gender}
      />
    </>
  );
}

export default ActiveBedHoldBanner;

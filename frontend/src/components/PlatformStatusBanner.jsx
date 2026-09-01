import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PlatformStatusBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    systemApi.getSystemStatus()
      .then(res => setStatus(res))
      .catch(() => {
        setStatus({ verifiedHospitalsCount: 0, verifiedBloodBanksCount: 0, verifiedAmbulancesCount: 0 });
      });
  }, []);

  if (dismissed) {
    return null;
  }

  const hospCount = Math.max(3, status?.verifiedHospitalsCount || 0);
  const bloodCount = Math.max(1, status?.verifiedBloodBanksCount || 0);

  return (
    <div className="bg-red-50/90 dark:bg-card border-b border-red-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold transition-all relative">
      <div className="container mx-auto max-w-[1440px] flex items-center justify-between gap-2">
        
        {/* Banner Left Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
          <span className="truncate sm:whitespace-normal">
            <strong className="font-bold text-red-600">{hospCount} Hospitals</strong> &{' '}
            <strong className="font-bold text-red-600">{bloodCount} Blood Banks</strong> Live.
            <span className="hidden sm:inline"> Are you a hospital or blood bank?</span>
          </span>
        </div>

        {/* Banner Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <HospitalRegisterModal>
            <Button size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs px-2.5 sm:px-3.5 font-bold gap-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xs whitespace-nowrap">
              Join Network
              <ArrowRight className="h-3 w-3 hidden sm:inline-block" />
            </Button>
          </HospitalRegisterModal>

          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 sm:p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

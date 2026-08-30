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
    <div className="bg-red-50/90 border-b border-red-100 text-gray-800 px-4 py-2 text-xs font-semibold transition-all">
      <div className="container mx-auto max-w-[1440px] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <ShieldCheck className="h-4 w-4 text-red-600 shrink-0" />
          <span>
            <strong className="font-bold text-red-600">{hospCount} verified hospitals</strong> and{' '}
            <strong className="font-bold text-red-600">{bloodCount} blood banks</strong> are live on SwasthyaSetu. Are you a hospital or blood bank?
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HospitalRegisterModal>
            <Button size="sm" className="h-7 text-xs px-3.5 font-bold gap-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xs">
              Join the Network
              <ArrowRight className="h-3 w-3" />
            </Button>
          </HospitalRegisterModal>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

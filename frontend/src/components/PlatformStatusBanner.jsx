import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';
import { Building2, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PlatformStatusBanner() {
  const { t } = useLanguage();
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

  const hospCount = status?.verifiedHospitalsCount || 0;
  const bloodCount = status?.verifiedBloodBanksCount || 0;

  return (
    <div className="bg-primary/10 border-b border-primary/20 text-foreground px-4 py-2 text-xs font-medium transition-all">
      <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 animate-pulse" />
          <span>
            <strong className="font-bold text-primary">{hospCount}</strong> {t('platformStatusText')}{' '}
            <strong className="font-bold text-primary">{bloodCount}</strong> {t('platformStatusTextBlood')}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HospitalRegisterModal>
            <Button size="sm" variant="default" className="h-7 text-xs px-3 font-semibold gap-1 bg-primary text-primary-foreground shadow-xs">
              {t('joinNetworkCTA')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </HospitalRegisterModal>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

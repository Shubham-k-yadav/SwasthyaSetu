import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';

export function DemoModeBanner() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    systemApi.getSystemStatus()
      .then(res => setStatus(res))
      .catch(() => {
        setStatus({ demoMode: true, realHospitalsCount: 0, simulatedHospitalsCount: 463 });
      });
  }, []);

  if (!status?.demoMode || dismissed) {
    return null;
  }

  const realCount = status.realHospitalsCount || 0;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-medium transition-all">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {t('demoModeAlert')} <strong className="font-bold underline">{realCount}</strong> {t('demoModeLiveCount')}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 dark:text-amber-400 hover:text-foreground p-1 rounded-md transition-colors"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

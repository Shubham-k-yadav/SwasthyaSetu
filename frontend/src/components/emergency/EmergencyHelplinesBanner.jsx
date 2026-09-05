import { Phone } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function EmergencyHelplinesBanner() {
  const { t } = useLanguage();

  return (
    <>
      {/* DESKTOP EMERGENCY BANNER */}
      <div className="hidden sm:block mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-600">
            <Phone className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{t('emergency.helplines')}</h2>
            <div className="flex flex-wrap gap-4 mt-1 text-sm font-medium">
              <span>{t('emergency.ambulance')}: <strong className="text-red-600 font-black">102</strong></span>
              <span>{t('emergency.national')}: <strong className="text-red-600 font-black">112</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE EMERGENCY BANNER (1-Tap Quick Dial) */}
      <div className="block sm:hidden mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Emergency Helplines</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">24/7 Government SOS</p>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <a 
              href="tel:102"
              className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white font-black text-xs flex items-center gap-1 shadow-xs"
            >
              <Phone className="h-3 w-3" /> 102
            </a>
            <a 
              href="tel:112"
              className="px-2.5 py-1.5 rounded-xl bg-gray-900 text-white font-black text-xs flex items-center gap-1 shadow-xs"
            >
              <Phone className="h-3 w-3" /> 112
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmergencyHelplinesBanner;

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { systemApi } from '@/lib/api';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// In-memory tracking across client-side router navigation
let initialPathname = null;
let hasNavigatedAfterLoad = false;
let isGloballyDismissed = false;

export function PlatformStatusBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(isGloballyDismissed);
  const [mobileVisible, setMobileVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (initialPathname === null) {
      initialPathname = location.pathname;
    } else if (initialPathname !== location.pathname) {
      hasNavigatedAfterLoad = true;
    }
  }, [location.pathname]);

  useEffect(() => {
    let timer;
    systemApi.getSystemStatus()
      .then(res => {
        setStatus(res);
        // Show mobile floating popup for 3 seconds
        if (!isGloballyDismissed && !hasNavigatedAfterLoad) {
          setMobileVisible(true);
          timer = setTimeout(() => {
            setMobileVisible(false);
          }, 3000);
        }
      })
      .catch(() => {
        setStatus({ verifiedHospitalsCount: 0, verifiedBloodBanksCount: 0, verifiedAmbulancesCount: 0 });
      });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const hospCount = status?.verifiedHospitalsCount ?? 0;
  const bloodCount = status?.verifiedBloodBanksCount ?? 0;

  const handleDismiss = () => {
    isGloballyDismissed = true;
    setDismissed(true);
    setMobileVisible(false);
  };

  return (
    <>
      {/* 1. Mobile UI: 3-Second Floating Popup Pill */}
      {mobileVisible && !isGloballyDismissed && (
        <aside 
          aria-live="polite"
          className="block md:hidden fixed top-14 left-1/2 -translate-x-1/2 z-[9990] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300 max-w-[92vw]"
        >
          <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 border border-red-200 dark:border-red-900/60 shadow-xl rounded-full px-3.5 py-1.5 text-[11px] font-bold text-gray-800 dark:text-gray-100 backdrop-blur-md whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            <span className="truncate">
              <span className="text-red-600">{hospCount} Hospitals</span> &{' '}
              <span className="text-red-600">{bloodCount} Blood Banks</span> Live.
            </span>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-0.5 p-0.5 rounded-full"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Desktop UI: Standard Top Alert Banner */}
      {!dismissed && !hasNavigatedAfterLoad && !isGloballyDismissed && (
        <div className="hidden md:block bg-red-50/90 dark:bg-card border-b border-red-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 text-xs font-semibold transition-all relative">
          <div className="container mx-auto max-w-[1440px] flex items-center justify-between gap-2">
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ShieldCheck className="h-4 w-4 text-red-600 shrink-0" />
              <span>
                {hospCount > 0 || bloodCount > 0 ? (
                  <>
                    <strong className="font-bold text-red-600">{hospCount} Hospitals</strong> &{' '}
                    <strong className="font-bold text-red-600">{bloodCount} Blood Banks</strong> Live.
                  </>
                ) : (
                  <strong className="font-bold text-red-600">National Healthcare Network Live.</strong>
                )}
                <span> Are you a hospital or blood bank?</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link to="/register">
                <Button size="sm" className="h-7 text-xs px-3.5 font-bold gap-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xs whitespace-nowrap cursor-pointer">
                  Join Network
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>

              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

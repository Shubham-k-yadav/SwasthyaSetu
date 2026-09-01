import { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default Chrome install mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleTriggerInstall = () => {
      handleInstallClick();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual install guide (iOS Safari or Android fallback)
      setShowGuideModal(true);
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating Mobile PWA Install Banner */}
      <div className="fixed bottom-18 left-3 right-3 z-[9990] block md:hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-900/95 dark:bg-card/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
              S
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-white leading-tight">Install SwasthyaSetu App</h4>
              <p className="text-[10px] text-gray-300 font-medium leading-tight mt-0.5">
                Instant 1-tap emergency access on home screen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-8 text-xs px-3 rounded-xl shadow-md gap-1"
              onClick={handleInstallClick}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </Button>
            <button
              onClick={() => setShowBanner(false)}
              className="h-8 w-8 text-gray-400 hover:text-white flex items-center justify-center rounded-lg"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Install Guide Dialog */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Smartphone className="h-6 w-6" />
                <h3 className="font-black text-base text-gray-900 dark:text-white">Install SwasthyaSetu App</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 rounded-lg flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Android (Chrome):
                </p>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  Browser Top-Right menu (⋮) par click karke <strong>"Add to Home Screen"</strong> ya <strong>"Install App"</strong> select karein.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> iPhone (Safari):
                </p>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  Niche <strong>Share Button (⎋)</strong> par tap karein, phir scroll karke <strong>"Add to Home Screen"</strong> par click karein.
                </p>
              </div>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 rounded-xl"
              onClick={() => setShowGuideModal(false)}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

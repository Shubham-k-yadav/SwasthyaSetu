import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl bg-slate-900 text-white p-4 shadow-2xl border border-sky-500/30 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
        <Smartphone className="h-6 w-6" />
      </div>
      <div className="flex-1 text-xs space-y-0.5">
        <p className="font-bold text-sm text-white">Install SwasthyaSetu App</p>
        <p className="text-slate-300">Add 1-click emergency hospital & bed tracker to your phone home screen.</p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <Button size="xs" className="bg-sky-500 hover:bg-sky-600 text-white gap-1 text-xs px-2.5 py-1" onClick={handleInstallClick}>
          <Download className="h-3.5 w-3.5" />
          Install
        </Button>
        <button className="text-[10px] text-slate-400 hover:text-white text-center mt-0.5" onClick={() => setShowBanner(false)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

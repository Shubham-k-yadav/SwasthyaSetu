import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, RefreshCw, CheckCircle, VideoOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

export function AdmissionQrScannerModal({
  open,
  onOpenChange,
  scannedCodeInput,
  setScannedCodeInput,
  isVerifyingScan,
  cameraError,
  setCameraError,
  onAutoConfirmScan,
  onScanSubmit
}) {
  useEffect(() => {
    let html5QrcodeScanner = null;

    if (open) {
      setCameraError('');
      const timer = setTimeout(() => {
        const element = document.getElementById('qr-reader');
        if (element) {
          html5QrcodeScanner = new Html5Qrcode('qr-reader');
          const config = { fps: 10, qrbox: { width: 220, height: 220 } };

          html5QrcodeScanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              const cleanCode = decodedText.trim().toUpperCase().replace(/.*(SS-HOLD-\d+).*/, '$1');
              setScannedCodeInput(cleanCode);
              toast.success(`🎯 QR Pass Detected: ${cleanCode}`);
              onAutoConfirmScan(cleanCode);
              if (html5QrcodeScanner) {
                html5QrcodeScanner.stop().catch(() => {});
              }
            },
            () => {}
          ).catch((err) => {
            console.warn('Html5Qrcode camera error:', err);
            setCameraError('Camera access denied or unequipped. You can scan via USB/Bluetooth reader or enter code manually below.');
          });
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
          html5QrcodeScanner.stop().catch(() => {}).finally(() => {
            html5QrcodeScanner.clear();
          });
        }
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-emerald-600 font-extrabold">
            <QrCode className="h-6 w-6 text-emerald-600" />
            Instant Patient QR Pass Scanner
          </DialogTitle>
          <DialogDescription className="text-xs">
            Point camera at patient's digital QR ticket or printed PDF pass to confirm bed admission instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onScanSubmit} className="space-y-4 py-2">
          {/* HTML5 Live Camera QR Scanner Feed */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black min-h-[220px]">
            <div id="qr-reader" className="w-full text-white" />

            {cameraError && (
              <div className="p-6 text-center space-y-2 text-white/80">
                <VideoOff className="h-10 w-10 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-amber-300 max-w-xs mx-auto">
                  Camera Access Notice
                </p>
                <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Scan Payload / Reservation Code *</label>
            <Input
              autoFocus
              placeholder="e.g. SS-HOLD-353619"
              className="font-mono text-center text-lg font-black tracking-widest uppercase h-12 border-emerald-500/40 focus:ring-emerald-500"
              value={scannedCodeInput}
              onChange={(e) => setScannedCodeInput(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isVerifyingScan} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs">
              {isVerifyingScan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Verify Pass & Admit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AdmissionQrScannerModal;

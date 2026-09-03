import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, Shield } from 'lucide-react';

export function printOrDownloadTicket({ reservation, hospital, patientName, contactPhone, bedType }) {
  if (!reservation || !hospital) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bed_Ticket_${reservation.reservationCode}</title>
        <style>
          @page { size: auto; margin: 8mm; }
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; color: #0f172a; background: #fff; }
          .ticket { max-width: 480px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 16px; padding: 20px; background: #ffffff; }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; }
          .logo { font-size: 20px; font-weight: 900; color: #0284c7; margin: 0; }
          .sub { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }
          .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; display: inline-block; margin-top: 8px; }
          .code-box { background: #f0f9ff; border: 2px solid #38bdf8; border-radius: 12px; padding: 10px; text-align: center; margin: 14px 0; }
          .code-title { font-size: 10px; color: #0369a1; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .code { font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #0369a1; margin-top: 4px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0; font-size: 12px; }
          .label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; }
          .value { font-weight: 700; color: #0f172a; margin-top: 2px; }
          .qr-container { text-align: center; margin: 14px 0; }
          .qr-img { border: 2px solid #e2e8f0; border-radius: 12px; padding: 6px; background: white; width: 140px; height: 140px; }
          .footer { border-top: 2px dashed #cbd5e1; padding-top: 10px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1 class="logo">🏥 SwasthyaSetu (स्वास्थ्य सेतु)</h1>
            <div class="sub">Official Emergency Hospital Bed Reservation Slip</div>
            <div class="badge">✓ 10-Minute Bed Hold Active</div>
          </div>
          
          <div class="code-box">
            <div class="code-title">Hospital Desk Confirmation Code</div>
            <div class="code">${reservation.reservationCode}</div>
          </div>

          <div class="details-grid">
            <div>
              <div class="label">Patient Name</div>
              <div class="value">${patientName || reservation.patientName || 'Emergency Patient'}</div>
            </div>
            <div>
              <div class="label">Bed Type</div>
              <div class="value" style="color: #d97706; font-weight: 800;">${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED</div>
            </div>
            <div>
              <div class="label">Hospital Name</div>
              <div class="value">${hospital.name}</div>
            </div>
            <div>
              <div class="label">Contact Mobile</div>
              <div class="value">+91-${contactPhone || reservation.contactPhone}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="label">Hospital Address</div>
              <div class="value">${hospital.address || ''}, ${hospital.city || ''}</div>
            </div>
          </div>

          <div class="qr-container">
            <div style="font-size: 10px; color: #64748b; margin-bottom: 6px; font-weight: 600;">Present QR Code at Hospital Counter for Instant Admission</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reservation.reservationCode)}" class="qr-img" alt="Admission QR Code" />
            <div style="font-size: 10px; font-family: monospace; color: #0284c7; margin-top: 4px; font-weight: bold;">PASS: ${reservation.reservationCode}</div>
          </div>

          <div class="footer">
            <p style="margin: 3px 0;"><strong>Notice:</strong> This bed hold is locked for 10 minutes. Present this slip at emergency counter.</p>
            <p style="margin: 3px 0;">SwasthyaSetu Real-Time Emergency Coordination Network</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Hidden iframe technique: directly triggers native browser print / save-as-pdf dialog in 1 click!
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 350);
}

export function BedTicketDialog({ open, onOpenChange, reservation, hospital, patientName, contactPhone, bedType }) {
  if (!reservation || !hospital) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-primary">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            Official Bed Hold Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/40 border border-sky-200 dark:border-sky-800 text-center space-y-2.5">
            <Badge className="bg-emerald-600 text-white gap-1 px-2.5 py-0.5 text-[11px] sm:text-xs">
              <Shield className="h-3.5 w-3.5" />
              10-Minute Hold Locked
            </Badge>

            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Desk Confirmation Code</p>
              <div className="p-2 sm:p-3 rounded-xl bg-background font-mono font-black text-xl sm:text-2xl text-sky-700 dark:text-sky-400 tracking-widest border shadow-xs mt-1">
                {reservation.reservationCode}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-300 shadow-xs my-1">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reservation.reservationCode)}`}
                alt="Emergency Bed Hold Admission QR Code"
                className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg border bg-white p-1"
              />
              <span className="text-[10px] font-mono text-sky-700 dark:text-sky-300 font-bold mt-1.5 uppercase">
                📱 Present QR Pass at Hospital Counter
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-3 space-y-1.5 text-xs">
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Patient Name:</span>
              <span className="font-bold text-foreground truncate max-w-[180px]">{patientName || reservation.patientName}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Reserved Bed Type:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{(bedType || reservation.bedType).toUpperCase()} BED</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-muted-foreground">Hospital:</span>
              <span className="font-bold text-foreground truncate max-w-[180px]">{hospital.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Phone:</span>
              <span className="font-bold text-foreground">+91-{contactPhone || reservation.contactPhone}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="h-10 sm:h-9 text-xs sm:text-sm rounded-xl" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              className="h-10 sm:h-9 text-xs sm:text-sm rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1.5" 
              onClick={() => printOrDownloadTicket({ reservation, hospital, patientName, contactPhone, bedType })}
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

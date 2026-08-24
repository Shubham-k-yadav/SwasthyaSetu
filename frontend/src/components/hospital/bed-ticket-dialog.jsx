import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, Shield, MapPin, Phone, Clock, AlertTriangle } from 'lucide-react';
import { ReservationQRCode } from './qr-code';

export function BedTicketDialog({ open, onOpenChange, reservation, hospital, patientName, contactPhone, bedType }) {
  if (!reservation || !hospital) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bed Reservation Ticket - ${reservation.reservationCode}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #0f172a; }
            .ticket { max-width: 500px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 16px; padding: 24px; background: #ffffff; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
            .logo { font-size: 24px; font-weight: 900; color: #0284c7; margin: 0; }
            .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .code-box { background: #f0f9ff; border: 2px solid #38bdf8; border-radius: 12px; padding: 12px; text-align: center; margin: 16px 0; }
            .code { font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 3px; color: #0369a1; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; font-size: 13px; }
            .label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; }
            .value { font-weight: 700; color: #0f172a; margin-top: 2px; }
            .qr-container { text-align: center; margin: 16px 0; }
            .footer { border-top: 2px dashed #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1 class="logo">🏥 SwasthyaSetu (स्वास्थ्य सेतु)</h1>
              <div class="sub">Official Emergency Hospital Bed Reservation Slip</div>
            </div>
            
            <div style="text-align: center;">
              <span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700;">
                ✓ 10-Minute Bed Hold Active
              </span>
            </div>

            <div class="code-box">
              <div style="font-size: 11px; color: #0369a1; font-weight: 700; text-transform: uppercase;">Hospital Desk Confirmation Code</div>
              <div class="code">${reservation.reservationCode}</div>
            </div>

            <div class="details-grid">
              <div>
                <div class="label">Patient Name</div>
                <div class="value">${patientName || reservation.patientName || 'Emergency Patient'}</div>
              </div>
              <div>
                <div class="label">Bed Type Reserved</div>
                <div class="value" style="color: #d97706; font-size: 15px;">${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED</div>
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
                <div class="value">${hospital.address}, ${hospital.city}</div>
              </div>
            </div>

            <div class="qr-container">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">Present QR Code at Hospital Counter</div>
            </div>

            <div class="footer">
              <p><strong>Note:</strong> This bed hold is atomically locked for 10 minutes. If the patient does not report within 10 minutes, the hold expires automatically.</p>
              <p>SwasthyaSetu Real-Time Emergency Coordination Network</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Official Bed Hold Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ticket Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/40 border border-sky-200 dark:border-sky-800 text-center space-y-3">
            <Badge className="bg-emerald-600 text-white gap-1 px-3 py-1">
              <Shield className="h-3.5 w-3.5" />
              10-Minute Hold Locked
            </Badge>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Desk Confirmation Code</p>
              <div className="p-3 rounded-xl bg-background font-mono font-black text-2xl text-sky-700 dark:text-sky-400 tracking-widest border shadow-sm mt-1">
                {reservation.reservationCode}
              </div>
            </div>

            {/* QR Code Component */}
            <div className="flex justify-center pt-1">
              <ReservationQRCode
                code={reservation.reservationCode}
                hospitalName={hospital.name}
                size={140}
              />
            </div>
          </div>

          {/* Details Summary */}
          <div className="rounded-xl border p-3 space-y-2 text-xs">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Patient Name:</span>
              <span className="font-bold text-foreground">{patientName || reservation.patientName}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Reserved Bed Type:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{(bedType || reservation.bedType).toUpperCase()} BED</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground">Hospital:</span>
              <span className="font-bold text-foreground">{hospital.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Phone:</span>
              <span className="font-bold text-foreground">+91-{contactPhone || reservation.contactPhone}</span>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button className="flex-1 bg-sky-600 hover:bg-sky-700 text-white gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print / Save PDF Ticket
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

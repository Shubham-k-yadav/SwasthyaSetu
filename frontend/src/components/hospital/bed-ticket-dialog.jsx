import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, Shield, ShieldCheck, Download, Award, FileText } from 'lucide-react';

export function printOrDownloadTicket({ reservation, hospital, patientName, contactPhone, bedType, age, gender }) {
  if (!reservation || !hospital) return;

  const displayAge = age || reservation.age;
  const displayGender = gender || reservation.gender;
  const ageGenderStr = [displayAge ? `${displayAge} Yrs` : '', displayGender].filter(Boolean).join(' • ') || '—';

  const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'admitted';
  const formattedDate = new Date(reservation.updatedAt || reservation.createdAt || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const regNumber = hospital.registrationNumber || hospital.licenseNumber || 'DL-MED-SEC-2026';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${isConfirmed ? 'Admission_Receipt_' : 'Bed_Ticket_'}${reservation.reservationCode}</title>
        <style>
          @page { size: auto; margin: 8mm; }
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; color: #0f172a; background: #fff; }
          .ticket { max-width: 520px; margin: 0 auto; border: 2px solid ${isConfirmed ? '#16a34a' : '#0284c7'}; border-radius: 16px; padding: 22px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 14px; margin-bottom: 14px; }
          .logo { font-size: 20px; font-weight: 900; color: ${isConfirmed ? '#16a34a' : '#0284c7'}; margin: 0; }
          .sub { font-size: 11px; color: #475569; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge { background: ${isConfirmed ? '#dcfce7' : '#dbeafe'}; color: ${isConfirmed ? '#15803d' : '#1d4ed8'}; border: 1px solid ${isConfirmed ? '#86efac' : '#93c5fd'}; padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 800; display: inline-block; margin-top: 8px; }
          .stamp { border: 2.5px solid #16a34a; background: #f0fdf4; color: #15803d; border-radius: 10px; padding: 8px 14px; text-align: center; margin: 12px 0; font-weight: 900; font-size: 13px; letter-spacing: 1px; }
          .code-box { background: ${isConfirmed ? '#f0fdf4' : '#f0f9ff'}; border: 2px solid ${isConfirmed ? '#86efac' : '#38bdf8'}; border-radius: 12px; padding: 10px; text-align: center; margin: 12px 0; }
          .code-title { font-size: 10px; color: ${isConfirmed ? '#166534' : '#0369a1'}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .code { font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: 2.5px; color: ${isConfirmed ? '#15803d' : '#0369a1'}; margin-top: 4px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0; font-size: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
          .label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; }
          .value { font-weight: 800; color: #0f172a; margin-top: 2px; }
          .qr-container { text-align: center; margin: 14px 0; }
          .qr-img { border: 2px solid #cbd5e1; border-radius: 12px; padding: 6px; background: white; width: 130px; height: 130px; }
          .footer { border-top: 2px dashed #cbd5e1; padding-top: 12px; text-align: center; font-size: 10px; color: #64748b; line-height: 1.5; }
          .security-tag { font-family: monospace; font-size: 9px; color: #94a3b8; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1 class="logo">🏥 SwasthyaSetu (स्वास्थ्य सेतु)</h1>
            <div class="sub">${isConfirmed ? 'Official Emergency Hospital Admission Slip' : 'Official Emergency Bed Reservation Slip'}</div>
            <div class="badge">
              ${isConfirmed ? '✓ OFFICIALLY ADMITTED & CONFIRMED' : '✓ 10-Minute Bed Hold Active'}
            </div>
          </div>
          
          ${isConfirmed ? `
            <div class="stamp">
              ★ OFFICIAL HOSPITAL ADMISSION RECORD ★<br/>
              <span style="font-size: 10px; font-weight: 700; letter-spacing: normal;">Certified by ${hospital.name} • Reg No: ${regNumber}</span>
            </div>
          ` : ''}

          <div class="code-box">
            <div class="code-title">${isConfirmed ? 'Permanent Admission Registration ID' : 'Hospital Desk Confirmation Code'}</div>
            <div class="code">${reservation.reservationCode}</div>
          </div>

          <div class="details-grid">
            <div>
              <div class="label">Patient Name</div>
              <div class="value">${patientName || reservation.patientName || 'Emergency Patient'}</div>
            </div>
            <div>
              <div class="label">Age & Gender</div>
              <div class="value">${ageGenderStr}</div>
            </div>
            <div>
              <div class="label">Allocated Bed Category</div>
              <div class="value" style="color: #d97706; font-weight: 800;">${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED</div>
            </div>
            <div>
              <div class="label">Verified Contact Mobile</div>
              <div class="value">+91-${contactPhone || reservation.contactPhone}</div>
            </div>
            <div>
              <div class="label">Hospital / Healthcare Facility</div>
              <div class="value">${hospital.name}</div>
            </div>
            <div>
              <div class="label">Attending Doctor</div>
              <div class="value" style="color: #0f172a; font-weight: 800;">
                ${reservation.assignedDoctor?.name ? `Dr. ${reservation.assignedDoctor.name} (${reservation.assignedDoctor.specialty || 'Specialist'})` : 'Awaiting Specialist Allotment'}
              </div>
            </div>
            <div>
              <div class="label">Admission / Hold Date</div>
              <div class="value">${formattedDate}</div>
            </div>
            <div>
              <div class="label">Admission Status</div>
              <div class="value" style="color: ${isConfirmed ? '#16a34a' : '#d97706'}; font-weight: 900;">
                ${isConfirmed ? '✓ CONFIRMED (ADMITTED)' : '⏳ RESERVED (HELD)'}
              </div>
            </div>
            ${(reservation.diagnosis || reservation.chiefComplaint || reservation.injuryDetails) ? `
              <div style="grid-column: span 2; background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 10px 12px; border-radius: 10px; margin-top: 4px;">
                ${(reservation.diagnosis || reservation.chiefComplaint) ? `
                  <div style="margin-bottom: 4px;">
                    <span class="label" style="color: #0369a1;">Clinical Diagnosis / Problem:</span>
                    <strong style="font-size: 12px; color: #0f172a; display: block; margin-top: 2px;">${reservation.diagnosis || reservation.chiefComplaint}</strong>
                  </div>
                ` : ''}
                ${reservation.injuryDetails ? `
                  <div>
                    <span class="label" style="color: #b45309;">Injury & Trauma Assessment:</span>
                    <strong style="font-size: 12px; color: #b45309; display: block; margin-top: 2px;">${reservation.injuryDetails}</strong>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            <div style="grid-column: span 2;">
              <div class="label">Facility Full Address</div>
              <div class="value">${hospital.address || ''}, ${hospital.city || ''}</div>
            </div>
          </div>

          <div class="qr-container">
            <div style="font-size: 10px; color: #475569; margin-bottom: 6px; font-weight: 700;">
              ${isConfirmed ? 'Scan for Digital Admission Verification & Medical Record' : 'Present QR Code at Hospital Desk for Immediate Admission'}
            </div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reservation.reservationCode)}" class="qr-img" alt="Admission Verification QR" />
            <div style="font-size: 10px; font-family: monospace; color: ${isConfirmed ? '#16a34a' : '#0284c7'}; margin-top: 4px; font-weight: bold;">
              AUTH CODE: ${reservation.reservationCode}
            </div>
          </div>

          <div class="footer">
            <p style="margin: 3px 0;"><strong>Legal Notice:</strong> This digital receipt is generated under the SwasthyaSetu Emergency Healthcare Coordination Framework.</p>
            <p style="margin: 3px 0;">It serves as official digital proof of bed reservation and inpatient admission verification at <strong>${hospital.name}</strong>.</p>
            <div class="security-tag">REF: SS-VERIFY-${reservation.reservationCode}-${String(hospital._id || hospital.id || '').slice(-6).toUpperCase()}</div>
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

export function BedTicketDialog({ open, onOpenChange, reservation, hospital, patientName, contactPhone, bedType, age, gender }) {
  if (!reservation || !hospital) return null;

  const displayAge = age || reservation.age;
  const displayGender = gender || reservation.gender;

  const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'admitted';
  const formattedDate = new Date(reservation.updatedAt || reservation.createdAt || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-primary">
            {isConfirmed ? (
              <>
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <span>Official Admission Slip</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600" />
                <span>Emergency Bed Hold Ticket</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Status Box */}
          <div className={`p-3.5 sm:p-4 rounded-2xl text-center space-y-2.5 border ${
            isConfirmed
              ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-emerald-500/30'
              : 'bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/40 dark:to-emerald-950/40 border-sky-200 dark:border-sky-800'
          }`}>
            <Badge className={`gap-1 px-3 py-0.5 text-xs font-bold text-white shadow-xs ${isConfirmed ? 'bg-emerald-600' : 'bg-sky-600'}`}>
              {isConfirmed ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
              {isConfirmed ? '✓ Officially Admitted & Confirmed' : '10-Minute Hold Locked'}
            </Badge>

            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isConfirmed ? 'Permanent Hospital Admission Code' : 'Hospital Desk Confirmation Code'}
              </p>
              <div className={`p-2 sm:p-2.5 rounded-xl font-mono font-black text-xl sm:text-2xl tracking-widest border shadow-xs mt-1 bg-background ${
                isConfirmed ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300' : 'text-sky-700 dark:text-sky-400 border-sky-200'
              }`}>
                {reservation.reservationCode}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs my-1">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reservation.reservationCode)}`}
                alt="Emergency Admission QR Code"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-lg border bg-white p-1"
              />
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold mt-1.5 uppercase">
                {isConfirmed ? '✓ Digital Verified Proof of Admission' : '📱 Present QR Pass at Hospital Counter'}
              </span>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-xl border p-3.5 space-y-2 text-xs bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground font-medium">Patient Name:</span>
              <span className="font-bold text-foreground truncate max-w-[200px]">{patientName || reservation.patientName}</span>
            </div>
            {(displayAge || displayGender) && (
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground font-medium">Age & Gender:</span>
                <span className="font-bold text-foreground">
                  {displayAge ? `${displayAge} yrs` : ''}{displayAge && displayGender ? ' • ' : ''}{displayGender || ''}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground font-medium">Allocated Bed:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{(bedType || reservation.bedType).toUpperCase()} BED</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground font-medium">Hospital Name:</span>
              <span className="font-bold text-foreground truncate max-w-[200px]">{hospital.name}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground font-medium">Contact Phone:</span>
              <span className="font-bold text-foreground font-mono">+91-{contactPhone || reservation.contactPhone}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5">
              <span className="text-muted-foreground font-medium">Attending Doctor:</span>
              <span className="font-bold text-foreground truncate max-w-[200px]">
                {reservation.assignedDoctor?.name ? `Dr. ${reservation.assignedDoctor.name}` : 'Awaiting Allotment'}
              </span>
            </div>
            {(reservation.diagnosis || reservation.chiefComplaint || reservation.injuryDetails) && (
              <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] space-y-1 my-1">
                {(reservation.diagnosis || reservation.chiefComplaint) && (
                  <p><strong>🩺 Condition:</strong> {reservation.diagnosis || reservation.chiefComplaint}</p>
                )}
                {reservation.injuryDetails && (
                  <p className="text-amber-700 dark:text-amber-400"><strong>🩹 Injury / Trauma:</strong> {reservation.injuryDetails}</p>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Timestamp:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>
          </div>

          {/* Legal Verification Banner */}
          {isConfirmed && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <Award className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                <strong>Official Admission Record:</strong> Verified by {hospital.name} staff. This receipt serves as your digital proof of emergency hospital bed admission.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="h-10 sm:h-9.5 text-xs sm:text-sm rounded-xl font-medium" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
              className={`h-10 sm:h-9.5 text-xs sm:text-sm rounded-xl text-white font-bold gap-1.5 shadow-sm ${
                isConfirmed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
              }`} 
              onClick={() => printOrDownloadTicket({
                reservation,
                hospital,
                patientName,
                contactPhone,
                bedType,
                age: displayAge,
                gender: displayGender
              })}
            >
              <Printer className="h-4 w-4" />
              {isConfirmed ? 'Download Admission Slip (PDF)' : 'Print / Save PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

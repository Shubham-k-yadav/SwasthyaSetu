import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle2, Shield, ShieldCheck, Download, Award, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Helper to fetch QR code image as Base64 Data URL for embedding in jsPDF
 */
async function getQrDataUrl(code) {
  if (!code) return null;
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(code)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not fetch QR code image for PDF:', err);
    return null;
  }
}

/**
 * Downloads a high-resolution, pixel-perfect, printable PDF document directly to user's device
 */
export async function downloadTicketPdf({ reservation, hospital, patientName, contactPhone, bedType, age, gender }) {
  if (!reservation || !hospital) return;

  const toastId = toast.loading('Generating PDF document...');

  try {
    const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'admitted';
    const displayAge = age || reservation.age;
    const displayGender = gender || reservation.gender;
    const ageGenderStr = [displayAge ? `${displayAge} Yrs` : '', displayGender].filter(Boolean).join(' • ') || '—';

    const formattedDate = new Date(reservation.updatedAt || reservation.createdAt || Date.now()).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const regNumber = hospital.registrationNumber || hospital.licenseNumber || 'DL-MED-SEC-2026';
    const hospitalAddress = [hospital.address, hospital.city, hospital.state].filter(Boolean).join(', ');

    // Fetch QR Code Data URL
    const qrDataUrl = await getQrDataUrl(reservation.reservationCode);

    // Initialize jsPDF (A4 portrait: 210 x 297 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer security border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(10, 10, 190, 277, 4, 4);

    // Inner accent border
    if (isConfirmed) {
      doc.setDrawColor(22, 163, 74);
    } else {
      doc.setDrawColor(2, 132, 199);
    }
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, 186, 273, 3, 3);

    // Top Header Banner
    if (isConfirmed) {
      doc.setFillColor(22, 163, 74);
    } else {
      doc.setFillColor(2, 132, 199);
    }
    doc.roundedRect(14, 14, 182, 22, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SWASTHYA SETU  |  HEALTHCARE EMERGENCY NETWORK', 105, 23, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      isConfirmed
        ? 'OFFICIAL EMERGENCY HOSPITAL ADMISSION & CLINICAL CASE RECORD'
        : 'OFFICIAL 10-MINUTE EMERGENCY BED HOLD RESERVATION PASS',
      105,
      30,
      { align: 'center' }
    );

    // Hospital Facility Details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(hospital.name || 'Emergency Healthcare Center', 105, 43, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const hospitalSub = [hospitalAddress, `Reg No: ${regNumber}`].filter(Boolean).join(' • ');
    doc.text(hospitalSub, 105, 49, { align: 'center' });

    // Document Status Stamp Ribbon
    if (isConfirmed) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(56, 189, 248);
      doc.setTextColor(3, 105, 161);
    }
    doc.roundedRect(14, 54, 182, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      isConfirmed
        ? '★ OFFICIAL HOSPITAL ADMISSION RECORD: CONFIRMED & ALLOCATED ★'
        : '⏳ EMERGENCY BED RESERVATION: 10-MINUTE HOLD ACTIVE ⏳',
      105,
      61.5,
      { align: 'center' }
    );

    // Code Box (Left) & QR Code Box (Right)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 70, 118, 46, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(isConfirmed ? 'PERMANENT ADMISSION REGISTRATION CODE' : 'HOSPITAL COUNTER CONFIRMATION CODE', 20, 78);

    doc.setFontSize(21);
    doc.setFont('helvetica', 'bold');
    if (isConfirmed) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(3, 105, 161);
    }
    doc.text(reservation.reservationCode, 20, 88);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Booking / Admission Time: ${formattedDate}`, 20, 97);
    doc.text(`Status: ${isConfirmed ? 'Officially Admitted (Inpatient Bed Occupied)' : 'Active Hold (Valid 10 Minutes)'}`, 20, 103);
    doc.text(`Allocated Category: ${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED`, 20, 109);

    // QR Container Box (Right)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(136, 70, 60, 46, 2, 2, 'FD');

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 148, 72, 36, 36);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(148, 72, 36, 36, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('QR VERIFICATION', 166, 89, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text(reservation.reservationCode, 166, 95, { align: 'center' });
    }

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('SCAN TO VERIFY ADMISSION', 166, 113, { align: 'center' });

    // Patient Particulars Section Header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 122, 182, 7, 1, 1, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PATIENT PARTICULARS & ADMISSION DETAILS', 18, 127);

    // Details Grid Rows
    const doctorDisplay = reservation.assignedDoctor?.name
      ? `Dr. ${reservation.assignedDoctor.name}${reservation.assignedDoctor.specialty ? ` (${reservation.assignedDoctor.specialty})` : ''}`
      : 'Awaiting Allotment';

    const details = [
      [
        { label: 'PATIENT FULL NAME', val: patientName || reservation.patientName || 'Emergency Patient' },
        { label: 'AGE & GENDER', val: ageGenderStr }
      ],
      [
        { label: 'ALLOCATED BED TYPE', val: `${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED` },
        { label: 'CONTACT MOBILE', val: `+91-${contactPhone || reservation.contactPhone || 'N/A'}` }
      ],
      [
        { label: 'HEALTHCARE FACILITY', val: hospital.name || 'Hospital' },
        { label: 'ATTENDING DOCTOR', val: doctorDisplay }
      ],
      [
        { label: 'FACILITY ADDRESS', val: hospitalAddress || 'Emergency Wing' },
        { label: 'SECURITY REFERENCE ID', val: `REF: SS-${reservation.reservationCode}-${String(hospital._id || hospital.id || 'IN').slice(-4).toUpperCase()}` }
      ]
    ];

    let currentY = 133;
    details.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 11, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + 11, 196, currentY + 11);

      // Col 1
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(row[0].label, 18, currentY + 4);
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(row[0].val).slice(0, 48), 18, currentY + 9);

      // Col 2
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(row[1].label, 110, currentY + 4);
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(row[1].val).slice(0, 48), 110, currentY + 9);

      currentY += 11;
    });

    // Clinical & Case Sheet Section (if diagnosis/injury/vitals exist)
    if (reservation.diagnosis || reservation.chiefComplaint || reservation.injuryDetails || reservation.vitals) {
      currentY += 3;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(14, currentY, 182, 34, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('CLINICAL ASSESSMENT & EMERGENCY CASE SHEET', 18, currentY + 6);

      const diag = reservation.diagnosis || reservation.chiefComplaint;
      if (diag) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Diagnosis / Problem:', 18, currentY + 12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(diag).slice(0, 75), 58, currentY + 12);
      }

      if (reservation.injuryDetails) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text('Injury / Trauma Assessment:', 18, currentY + 18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 83, 9);
        doc.text(String(reservation.injuryDetails).slice(0, 75), 58, currentY + 18);
      }

      if (reservation.vitals) {
        const v = reservation.vitals;
        const vitalsText = `BP: ${v.bp || '—'}  |  Pulse: ${v.pulse ? v.pulse + ' bpm' : '—'}  |  SpO2: ${v.spO2 ? v.spO2 + '%' : '—'}  |  Temp: ${v.temperature ? v.temperature + ' °F' : '—'}`;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Recorded Vitals:', 18, currentY + 24);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(vitalsText, 58, currentY + 24);
      }

      if (reservation.assignedDoctor?.specialty) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Attending Department:', 18, currentY + 30);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(`${reservation.assignedDoctor.specialty} Specialist`, 58, currentY + 30);
      }

      currentY += 36;
    }

    // Verification & Signatures Box
    currentY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 30, 2, 2);

    // Left stamp
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('★ DIGITALLY VERIFIED EMERGENCY RECORD', 20, currentY + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Generated via SwasthyaSetu Central Coordination Cloud.', 20, currentY + 14);
    doc.text('Valid at Emergency, ICU & Inpatient counters without physical token.', 20, currentY + 19);
    doc.text(`Reference ID: SS-AUDIT-${reservation.reservationCode}-${Date.now()}`, 20, currentY + 24);

    // Right Signatures
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(125, currentY + 19, 185, currentY + 19);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Authorized Medical Officer / Desk In-Charge', 155, currentY + 23, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(hospital.name || 'Hospital Administration', 155, currentY + 27, { align: 'center' });

    // Footer Disclaimer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 268, 196, 268);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Legal Notice: This digital document is issued under the Emergency Healthcare Service Integration Framework. For 24x7 emergency coordination, dial 108 / 112.',
      105,
      273,
      { align: 'center' }
    );
    doc.text(
      'SwasthyaSetu National Health Portal • Verified E-Record • https://swasthyasetu.gov.in',
      105,
      277,
      { align: 'center' }
    );

    const fileName = `${isConfirmed ? 'SwasthyaSetu_Admission_Slip_' : 'SwasthyaSetu_Bed_Hold_'}${reservation.reservationCode}.pdf`;
    doc.save(fileName);

    toast.success(`PDF downloaded successfully: ${fileName}`, { id: toastId });
  } catch (err) {
    console.error('Failed to generate ticket PDF:', err);
    toast.error('Failed to download PDF. Falling back to print preview...', { id: toastId });
    printOrDownloadTicket({ reservation, hospital, patientName, contactPhone, bedType, age, gender });
  }
}

/**
 * Triggers native browser print dialog using an invisible iframe
 */
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

  // Hidden iframe technique: directly triggers native browser print / save-as-pdf dialog in 1 click
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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketPdf({
        reservation,
        hospital,
        patientName,
        contactPhone,
        bedType,
        age: displayAge,
        gender: displayGender
      });
    } finally {
      setIsDownloading(false);
    }
  };

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

          {/* Action Buttons: Download PDF + Print Slip + Close */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className={`h-10 text-xs sm:text-sm rounded-xl text-white font-bold gap-1.5 shadow-sm ${
                  isConfirmed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
                disabled={isDownloading}
                onClick={handleDownloadPdf}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>

              <Button
                variant="outline"
                className="h-10 text-xs sm:text-sm rounded-xl font-bold gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                Print Slip
              </Button>
            </div>

            <Button variant="ghost" className="w-full h-8 text-xs rounded-xl text-muted-foreground" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

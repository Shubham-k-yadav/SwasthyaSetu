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
 * Includes Provisional Diagnosis, Treatment Orders, Injury Details, and Vitals.
 */
export async function downloadTicketPdf({ reservation, hospital, patientName, contactPhone, bedType, age, gender }) {
  if (!reservation || !hospital) return;

  const toastId = toast.loading('Generating PDF document with clinical records...');

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
    doc.roundedRect(10, 8, 190, 281, 4, 4);

    // Inner accent border
    if (isConfirmed) {
      doc.setDrawColor(22, 163, 74);
    } else {
      doc.setDrawColor(2, 132, 199);
    }
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 10, 186, 277, 3, 3);

    // Top Header Banner
    if (isConfirmed) {
      doc.setFillColor(22, 163, 74);
    } else {
      doc.setFillColor(2, 132, 199);
    }
    doc.roundedRect(14, 12, 182, 19, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SWASTHYA SETU  |  HEALTHCARE EMERGENCY NETWORK', 105, 20, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      isConfirmed
        ? 'OFFICIAL EMERGENCY INPATIENT ADMISSION SLIP & CLINICAL TREATMENT RECORD'
        : 'OFFICIAL 10-MINUTE EMERGENCY BED HOLD RESERVATION PASS',
      105,
      27,
      { align: 'center' }
    );

    // Hospital Facility Details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(hospital.name || 'Emergency Healthcare Center', 105, 37, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const hospitalSub = [hospitalAddress, `Reg No: ${regNumber}`].filter(Boolean).join(' • ');
    doc.text(hospitalSub, 105, 42, { align: 'center' });

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
    doc.roundedRect(14, 46, 182, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(
      isConfirmed
        ? '★ OFFICIAL HOSPITAL ADMISSION RECORD: CONFIRMED & ALLOCATED ★'
        : '⏳ EMERGENCY BED RESERVATION: 10-MINUTE HOLD ACTIVE ⏳',
      105,
      52,
      { align: 'center' }
    );

    // Code Box (Left) & QR Code Box (Right)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 58, 122, 38, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(isConfirmed ? 'PERMANENT ADMISSION REGISTRATION CODE' : 'HOSPITAL COUNTER CONFIRMATION CODE', 18, 64);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    if (isConfirmed) {
      doc.setTextColor(21, 128, 61);
    } else {
      doc.setTextColor(3, 105, 161);
    }
    doc.text(reservation.reservationCode, 18, 73);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Booking / Admission Time: ${formattedDate}`, 18, 80);
    doc.text(`Status: ${isConfirmed ? 'Officially Admitted (Inpatient Bed Occupied)' : 'Active Hold (Valid 10 Minutes)'}`, 18, 86);
    doc.text(`Allocated Category: ${(bedType || reservation.bedType || 'ICU').toUpperCase()} BED`, 18, 92);

    // QR Container Box (Right)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(140, 58, 56, 38, 2, 2, 'FD');

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 153, 59.5, 30, 30);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(153, 59.5, 30, 30, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('QR VERIFICATION', 168, 73, { align: 'center' });
      doc.setFontSize(6);
      doc.text(reservation.reservationCode, 168, 78, { align: 'center' });
    }

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('SCAN TO VERIFY ADMISSION', 168, 93.5, { align: 'center' });

    // Patient Particulars Section Header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 99, 182, 6, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('PATIENT PARTICULARS & ADMISSION DETAILS', 18, 103.5);

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
      ]
    ];

    let currentY = 106.5;
    details.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, 182, 8.5, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + 8.5, 196, currentY + 8.5);

      // Col 1
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(row[0].label, 18, currentY + 3.2);
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(String(row[0].val).slice(0, 50), 18, currentY + 7.2);

      // Col 2
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(row[1].label, 110, currentY + 3.2);
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(String(row[1].val).slice(0, 50), 110, currentY + 7.2);

      currentY += 8.5;
    });

    // CLINICAL ASSESSMENT, PROVISIONAL DIAGNOSIS & TREATMENT ORDERS SECTION
    const diag = reservation.diagnosis || reservation.chiefComplaint || '';
    const treatmentNotes = reservation.clinicalNotes || reservation.treatmentOrders || '';
    const injury = reservation.injuryDetails || '';
    const vitals = reservation.vitals;

    currentY += 2.5;
    const clinicalSectionStartY = currentY;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);

    const diagText = diag || 'Awaiting Clinical Assessment / Provisional Diagnosis';
    const diagLines = doc.splitTextToSize(diagText, 172);

    const notesText = treatmentNotes || (isConfirmed ? 'Standard Inpatient Admission & Emergency Care Orders Active' : 'Emergency Bed Hold - Observation on Arrival');
    const notesLines = doc.splitTextToSize(notesText, 172);

    const injuryLines = injury ? doc.splitTextToSize(injury, 172) : [];

    // Calculate height dynamically:
    // Header(6) + DiagLabel(4)+diagLines + NotesLabel(4.5)+notesLines + (injury ? 4+injuryLines : 0) + (vitals ? 7 : 0) + padding(5)
    let calculatedHeight = 6 + (4 + diagLines.length * 3.8) + (5 + notesLines.length * 3.8) + (injuryLines.length > 0 ? (4 + injuryLines.length * 3.8) : 0) + (vitals ? 7 : 0) + 5;
    const finalClinicalHeight = Math.min(calculatedHeight, 82);

    doc.roundedRect(14, clinicalSectionStartY, 182, finalClinicalHeight, 2, 2, 'FD');

    let innerY = clinicalSectionStartY + 5;

    // Header Title
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('CLINICAL ASSESSMENT, PROVISIONAL DIAGNOSIS & TREATMENT ORDERS', 18, innerY);
    innerY += 4.5;

    // Provisional / Final Diagnosis
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text('PROVISIONAL / FINAL DIAGNOSIS (डॉक्टर द्वारा निदान):', 18, innerY);
    innerY += 3.5;
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(diagLines, 18, innerY);
    innerY += diagLines.length * 3.8 + 1.5;

    // Treatment Orders & Clinical Notes
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('TREATMENT ORDERS & CLINICAL NOTES (उपचार, दवाइयां व निर्देश):', 18, innerY);
    innerY += 3.5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(notesLines, 18, innerY);
    innerY += notesLines.length * 3.8 + 1.5;

    // Injury Details (if present)
    if (injuryLines.length > 0 && innerY < clinicalSectionStartY + finalClinicalHeight - 9) {
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('INJURY / TRAUMA ASSESSMENT (चोट व घाव का विवरण):', 18, innerY);
      innerY += 3.5;
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 83, 9);
      doc.text(injuryLines, 18, innerY);
      innerY += injuryLines.length * 3.8 + 1.5;
    }

    // Recorded Vitals (if present)
    if (vitals && (vitals.bp || vitals.pulse || vitals.spO2 || vitals.temperature)) {
      const vitalsText = `BP: ${vitals.bp || '—'}   |   Pulse: ${vitals.pulse ? vitals.pulse + ' bpm' : '—'}   |   SpO2: ${vitals.spO2 ? vitals.spO2 + '%' : '—'}   |   Temp: ${vitals.temperature ? vitals.temperature + ' °F' : '—'}`;
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(`RECORDED PATIENT VITALS:  ${vitalsText}`, 18, clinicalSectionStartY + finalClinicalHeight - 2.8);
    }

    currentY = clinicalSectionStartY + finalClinicalHeight + 3;

    // Verification & Signatures Box
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 25, 2, 2);

    // Left stamp
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('★ DIGITALLY VERIFIED EMERGENCY RECORD', 20, currentY + 6);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Generated via SwasthyaSetu Central Coordination Cloud.', 20, currentY + 11);
    doc.text('Valid at Emergency, ICU & Inpatient counters without physical token.', 20, currentY + 15);
    doc.text(`Reference ID: SS-AUDIT-${reservation.reservationCode}-${Date.now()}`, 20, currentY + 19);

    // Right Signatures
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(125, currentY + 15, 185, currentY + 15);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Authorized Medical Officer / Desk In-Charge', 155, currentY + 19, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(hospital.name || 'Hospital Administration', 155, currentY + 22.5, { align: 'center' });

    // Footer Disclaimer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 273, 196, 273);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Legal Notice: This digital document is issued under the Emergency Healthcare Service Integration Framework. For 24x7 emergency coordination, dial 108 / 112.',
      105,
      277,
      { align: 'center' }
    );
    doc.text(
      'SwasthyaSetu National Health Portal • Verified E-Record • https://swasthyasetu.gov.in',
      105,
      281,
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
 * Includes Provisional Diagnosis, Treatment Orders, Injury Details, and Vitals in the printout.
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

  const diag = reservation.diagnosis || reservation.chiefComplaint || '';
  const treatmentNotes = reservation.clinicalNotes || reservation.treatmentOrders || '';
  const injury = reservation.injuryDetails || '';
  const vitals = reservation.vitals;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${isConfirmed ? 'Admission_Receipt_' : 'Bed_Ticket_'}${reservation.reservationCode}</title>
        <style>
          @page { size: auto; margin: 8mm; }
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 14px; color: #0f172a; background: #fff; }
          .ticket { max-width: 540px; margin: 0 auto; border: 2px solid ${isConfirmed ? '#16a34a' : '#0284c7'}; border-radius: 16px; padding: 20px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; }
          .logo { font-size: 19px; font-weight: 900; color: ${isConfirmed ? '#16a34a' : '#0284c7'}; margin: 0; }
          .sub { font-size: 10.5px; color: #475569; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge { background: ${isConfirmed ? '#dcfce7' : '#dbeafe'}; color: ${isConfirmed ? '#15803d' : '#1d4ed8'}; border: 1px solid ${isConfirmed ? '#86efac' : '#93c5fd'}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; display: inline-block; margin-top: 6px; }
          .stamp { border: 2px solid #16a34a; background: #f0fdf4; color: #15803d; border-radius: 10px; padding: 7px 12px; text-align: center; margin: 10px 0; font-weight: 900; font-size: 12px; letter-spacing: 0.8px; }
          .code-box { background: ${isConfirmed ? '#f0fdf4' : '#f0f9ff'}; border: 2px solid ${isConfirmed ? '#86efac' : '#38bdf8'}; border-radius: 12px; padding: 8px 12px; text-align: center; margin: 10px 0; }
          .code-title { font-size: 9.5px; color: ${isConfirmed ? '#166534' : '#0369a1'}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; }
          .code { font-family: monospace; font-size: 22px; font-weight: 900; letter-spacing: 2px; color: ${isConfirmed ? '#15803d' : '#0369a1'}; margin-top: 2px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; font-size: 11.5px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
          .label { color: #64748b; font-size: 9.5px; text-transform: uppercase; font-weight: 700; }
          .value { font-weight: 800; color: #0f172a; margin-top: 2px; }
          .clinical-box { background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 12px; margin: 10px 0; }
          .clinical-title { font-size: 10.5px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
          .treatment-box { background: #ffffff; border: 1px solid #93c5fd; border-radius: 8px; padding: 8px 10px; margin-top: 6px; }
          .qr-container { text-align: center; margin: 10px 0; }
          .qr-img { border: 2px solid #cbd5e1; border-radius: 12px; padding: 5px; background: white; width: 120px; height: 120px; }
          .footer { border-top: 2px dashed #cbd5e1; padding-top: 10px; text-align: center; font-size: 9.5px; color: #64748b; line-height: 1.4; }
          .security-tag { font-family: monospace; font-size: 8.5px; color: #94a3b8; margin-top: 5px; }
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
              <span style="font-size: 9.5px; font-weight: 700; letter-spacing: normal;">Certified by ${hospital.name} • Reg No: ${regNumber}</span>
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
            <div style="grid-column: span 2;">
              <div class="label">Facility Full Address</div>
              <div class="value">${hospital.address || ''}, ${hospital.city || ''}</div>
            </div>
          </div>

          <!-- PROVISIONAL DIAGNOSIS & TREATMENT ORDERS -->
          ${(diag || treatmentNotes || injury || vitals) ? `
            <div class="clinical-box">
              <div class="clinical-title">🩺 Clinical Assessment, Diagnosis & Treatment Orders</div>
              
              ${diag ? `
                <div style="margin-bottom: 6px;">
                  <span class="label" style="color: #0369a1;">Provisional / Final Diagnosis (डॉक्टर द्वारा निदान):</span>
                  <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px;">${diag}</div>
                </div>
              ` : ''}

              ${treatmentNotes ? `
                <div class="treatment-box">
                  <span class="label" style="color: #1d4ed8;">Treatment Orders & Clinical Notes (उपचार, दवाइयां व निर्देश):</span>
                  <div style="font-size: 11.5px; font-weight: 600; color: #1e293b; margin-top: 3px; white-space: pre-wrap; line-height: 1.4;">${treatmentNotes}</div>
                </div>
              ` : ''}

              ${injury ? `
                <div style="margin-top: 6px;">
                  <span class="label" style="color: #b45309;">Injury / Trauma Assessment (चोट व घाव का विवरण):</span>
                  <div style="font-size: 11.5px; font-weight: 700; color: #b45309; margin-top: 2px;">${injury}</div>
                </div>
              ` : ''}

              ${vitals ? `
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px;">
                  <span><strong>BP:</strong> ${vitals.bp || '—'}</span>
                  <span><strong>Pulse:</strong> ${vitals.pulse ? vitals.pulse + ' bpm' : '—'}</span>
                  <span><strong>SpO2:</strong> ${vitals.spO2 ? vitals.spO2 + '%' : '—'}</span>
                  <span><strong>Temp:</strong> ${vitals.temperature ? vitals.temperature + ' °F' : '—'}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="qr-container">
            <div style="font-size: 9.5px; color: #475569; margin-bottom: 5px; font-weight: 700;">
              ${isConfirmed ? 'Scan for Digital Admission Verification & Medical Record' : 'Present QR Code at Hospital Desk for Immediate Admission'}
            </div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reservation.reservationCode)}" class="qr-img" alt="Admission Verification QR" />
            <div style="font-size: 9.5px; font-family: monospace; color: ${isConfirmed ? '#16a34a' : '#0284c7'}; margin-top: 3px; font-weight: bold;">
              AUTH CODE: ${reservation.reservationCode}
            </div>
          </div>

          <div class="footer">
            <p style="margin: 2px 0;"><strong>Legal Notice:</strong> This digital receipt is generated under the SwasthyaSetu Emergency Healthcare Coordination Framework.</p>
            <p style="margin: 2px 0;">It serves as official digital proof of bed reservation and inpatient admission verification at <strong>${hospital.name}</strong>.</p>
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

  const diag = reservation.diagnosis || reservation.chiefComplaint || '';
  const treatmentNotes = reservation.clinicalNotes || reservation.treatmentOrders || '';
  const injury = reservation.injuryDetails || '';
  const vitals = reservation.vitals;

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

            {/* CLINICAL ASSESSMENT, PROVISIONAL DIAGNOSIS & TREATMENT ORDERS */}
            {(diag || treatmentNotes || injury || vitals) && (
              <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] space-y-1.5 my-1">
                <div className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[10px]">
                  🩺 Clinical Assessment & Orders
                </div>

                {diag && (
                  <div>
                    <span className="text-muted-foreground font-bold text-[10px] uppercase block">Provisional / Final Diagnosis:</span>
                    <strong className="text-foreground text-xs">{diag}</strong>
                  </div>
                )}

                {treatmentNotes && (
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-400 font-bold text-[10px] uppercase block">Treatment Orders & Rx:</span>
                    <p className="text-foreground text-xs whitespace-pre-wrap">{treatmentNotes}</p>
                  </div>
                )}

                {injury && (
                  <div>
                    <span className="text-amber-600 font-bold text-[10px] uppercase block">Injury / Trauma:</span>
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">{injury}</span>
                  </div>
                )}

                {vitals && (
                  <div className="pt-1 border-t border-blue-200/60 dark:border-blue-800 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span><strong>BP:</strong> {vitals.bp || '—'}</span>
                    <span>•</span>
                    <span><strong>Pulse:</strong> {vitals.pulse ? `${vitals.pulse} bpm` : '—'}</span>
                    <span>•</span>
                    <span><strong>SpO2:</strong> {vitals.spO2 ? `${vitals.spO2}%` : '—'}</span>
                    <span>•</span>
                    <span><strong>Temp:</strong> {vitals.temperature ? `${vitals.temperature} °F` : '—'}</span>
                  </div>
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

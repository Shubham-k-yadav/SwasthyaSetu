import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  UserCheck,
  Printer,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bandage,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { printOrDownloadTicket, downloadTicketPdf } from '@/components/hospital/bed-ticket-dialog';

const SPECIALTIES = [
  'Emergency Medicine',
  'Cardiology (हृदय रोग)',
  'Orthopedics & Trauma (हड्डी व चोट)',
  'Critical Care / ICU (गंभीर चिकित्सा)',
  'Neurology / Neuro Surgery (न्यूरो)',
  'Pulmonology / Chest (छाती व फेफड़ा)',
  'General Surgery (सामान्य शल्य चिकित्सा)',
  'Internal Medicine (जनरल मेडिसिन)',
  'Pediatrics (बाल रोग)',
  'Nephrology (गुर्दा रोग)',
  'Anesthesiology (एनेस्थीसिया)'
];

export function PatientCaseSheetModal({
  open,
  onOpenChange,
  reservation,
  hospital,
  onSaveCaseSheet
}) {
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [injuryDetails, setInjuryDetails] = useState('');
  const [triagePriority, setTriagePriority] = useState('urgent');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Emergency Medicine');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [spO2, setSpO2] = useState('');
  const [temperature, setTemperature] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reservation) {
      setChiefComplaint(reservation.chiefComplaint || reservation.emergencyNotes || '');
      setDiagnosis(reservation.diagnosis || '');
      setInjuryDetails(reservation.injuryDetails || '');
      setTriagePriority(reservation.triagePriority || 'urgent');
      setDoctorName(reservation.assignedDoctor?.name || '');
      setDoctorSpecialty(reservation.assignedDoctor?.specialty || 'Emergency Medicine');
      setBp(reservation.vitals?.bp || '');
      setPulse(reservation.vitals?.pulse || '');
      setSpO2(reservation.vitals?.spO2 || '');
      setTemperature(reservation.vitals?.temperature || '');
      setClinicalNotes(reservation.clinicalNotes || '');
      setAge(reservation.age || '');
      setGender(reservation.gender || '');
    }
  }, [reservation, open]);

  if (!reservation) return null;

  const isDoctorAssigned = Boolean(doctorName?.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        chiefComplaint: chiefComplaint.trim(),
        diagnosis: diagnosis.trim(),
        injuryDetails: injuryDetails.trim(),
        triagePriority,
        doctorName: doctorName.trim(),
        doctorSpecialty: doctorSpecialty.trim(),
        vitals: {
          bp: bp.trim(),
          pulse: pulse ? String(pulse).trim() : '',
          spO2: spO2 ? String(spO2).trim() : '',
          temperature: temperature.trim()
        },
        clinicalNotes: clinicalNotes.trim(),
        age: age ? Number(age) : undefined,
        gender
      };

      await onSaveCaseSheet(reservation.reservationCode, payload);
      toast.success(`Case sheet & doctor allotment saved for ${reservation.patientName}!`);
      onOpenChange(false);
    } catch (err) {
      console.error('Case sheet save error:', err);
      toast.error(err.message || 'Failed to update case sheet');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSlip = () => {
    printOrDownloadTicket({
      reservation: {
        ...reservation,
        diagnosis: diagnosis.trim(),
        chiefComplaint: chiefComplaint.trim(),
        injuryDetails: injuryDetails.trim(),
        clinicalNotes: clinicalNotes.trim(),
        treatmentOrders: clinicalNotes.trim(),
        assignedDoctor: { name: doctorName.trim(), specialty: doctorSpecialty.trim() },
        vitals: { bp: bp.trim(), pulse: pulse ? String(pulse).trim() : '', spO2: spO2 ? String(spO2).trim() : '', temperature: temperature.trim() },
        age: age || reservation.age,
        gender: gender || reservation.gender
      },
      hospital: hospital || { name: reservation.hospitalName || 'Hospital' },
      patientName: reservation.patientName,
      contactPhone: reservation.contactPhone,
      bedType: reservation.bedType,
      age: age || reservation.age,
      gender: gender || reservation.gender
    });
  };

  const handleDownloadPdf = async () => {
    await downloadTicketPdf({
      reservation: {
        ...reservation,
        diagnosis: diagnosis.trim(),
        chiefComplaint: chiefComplaint.trim(),
        injuryDetails: injuryDetails.trim(),
        clinicalNotes: clinicalNotes.trim(),
        treatmentOrders: clinicalNotes.trim(),
        assignedDoctor: { name: doctorName.trim(), specialty: doctorSpecialty.trim() },
        vitals: { bp: bp.trim(), pulse: pulse ? String(pulse).trim() : '', spO2: spO2 ? String(spO2).trim() : '', temperature: temperature.trim() },
        age: age || reservation.age,
        gender: gender || reservation.gender
      },
      hospital: hospital || { name: reservation.hospitalName || 'Hospital' },
      patientName: reservation.patientName,
      contactPhone: reservation.contactPhone,
      bedType: reservation.bedType,
      age: age || reservation.age,
      gender: gender || reservation.gender
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="border-b pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-900/30">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight">
                  Emergency Medical Case Sheet
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Clinical assessment, injury log & attending doctor allotment
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary text-xs font-bold border-primary/20">
              {(reservation.bedType || 'ICU').toUpperCase()} BED ALLOCATED
            </Badge>
          </div>
        </DialogHeader>

        {/* Patient Summary Banner */}
        <div className="p-3.5 rounded-xl bg-muted/60 border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Patient Name</span>
            <span className="font-extrabold text-foreground text-sm truncate block">{reservation.patientName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Age & Gender</span>
            <span className="font-bold text-foreground">
              {age ? `${age} yrs` : '—'} • {gender || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Contact Mobile</span>
            <span className="font-mono font-bold text-foreground">+91-{reservation.contactPhone}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Reg Code</span>
            <span className="font-mono font-extrabold text-primary text-xs">{reservation.reservationCode}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* STAGE 2: ATTENDING DOCTOR ALLOTMENT SECTION */}
          <div className={cn(
            'p-3.5 rounded-xl border transition-all space-y-3',
            isDoctorAssigned 
              ? 'bg-emerald-500/5 border-emerald-500/30' 
              : 'bg-amber-500/5 border-amber-500/30'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className={cn('h-4 w-4', isDoctorAssigned ? 'text-emerald-600' : 'text-amber-600')} />
                <Label className="text-xs font-black uppercase tracking-wider text-foreground">
                  Attending Doctor Allotment (डॉक्टर आवंटन)
                </Label>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-extrabold',
                  isDoctorAssigned 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50' 
                    : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50'
                )}
              >
                {isDoctorAssigned ? `✓ Assigned: ${doctorName}` : '⚠️ Doctor Awaiting Allotment (लंबित)'}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Emergency arrival par bed turant allot ho jata hai. Bed par pahunchne ke baad ward duty doctor ya specialist ko assign karein.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="docName" className="text-xs font-bold">Doctor Name (उदा. Dr. R.K. Sharma)</Label>
                <Input
                  id="docName"
                  placeholder="Dr. Name..."
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="docSpecialty" className="text-xs font-bold">Department / Specialty</Label>
                <select
                  id="docSpecialty"
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SPECIALTIES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TRIAGE SEVERITY LEVEL */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Triage Priority Level (गंभीरता स्तर)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'critical', label: '🔴 Critical (तत्काल - Red)', desc: 'Life Threatening / Resus' },
                { level: 'urgent', label: '🟡 Urgent (गंभीर - Yellow)', desc: 'Needs Rapid Attention' },
                { level: 'stable', label: '🟢 Stable (स्थिर - Green)', desc: 'Non-Critical / Routine' }
              ].map(t => (
                <button
                  key={t.level}
                  type="button"
                  onClick={() => setTriagePriority(t.level)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all text-xs',
                    triagePriority === t.level
                      ? 'border-2 border-primary bg-primary/10 font-bold shadow-xs'
                      : 'border-muted hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <p className="font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* CHIEF COMPLAINT & INJURY DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-red-500" />
                <Label htmlFor="complaint" className="text-xs font-bold">
                  Chief Complaint / Disease (मुख्य बीमारी / समस्या)
                </Label>
              </div>
              <Input
                id="complaint"
                placeholder="e.g. Acute MI, severe breathing difficulty, stroke"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Bandage className="h-3.5 w-3.5 text-amber-500" />
                <Label htmlFor="injury" className="text-xs font-bold">
                  Injury / Trauma Location (चोट / घाव का विवरण)
                </Label>
              </div>
              <Input
                id="injury"
                placeholder="e.g. Head trauma, left leg fracture, deep cuts"
                value={injuryDetails}
                onChange={(e) => setInjuryDetails(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* DIAGNOSIS FIELD */}
          <div className="space-y-1.5">
            <Label htmlFor="diag" className="text-xs font-bold">
              Provisional / Final Diagnosis (डॉक्टर द्वारा निदान)
            </Label>
            <Input
              id="diag"
              placeholder="e.g. Acute Coronary Syndrome, Left Femur Fracture, Polytrauma"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="h-9 text-xs font-semibold"
            />
          </div>

          {/* EMERGENCY VITALS QUICK GRID */}
          <div className="p-3 rounded-xl bg-muted/40 border space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              Patient Vitals (शारीरिक स्थिति / वाइटल्स)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">Blood Pressure</span>
                <Input
                  placeholder="120/80 mmHg"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">Pulse (HR)</span>
                <Input
                  placeholder="72 bpm"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">SpO2 (Oxygen)</span>
                <Input
                  placeholder="98 %"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground">Temperature</span>
                <Input
                  placeholder="98.6 °F"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* CLINICAL TREATMENT NOTES */}
          <div className="space-y-1.5">
            <Label htmlFor="clinicalNotes" className="text-xs font-bold">
              Treatment Orders & Clinical Notes (उपचार, दवाइयां व निर्देश)
            </Label>
            <textarea
              id="clinicalNotes"
              rows={2}
              placeholder="e.g. IV Fluids started, Injection Pantoprazole, ECG done, X-Ray Pelvis requested..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto h-9 text-xs font-bold gap-1.5 border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Download className="h-3.5 w-3.5 text-blue-600" />
                Download Case PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintSlip}
                className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                Print Slip
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-bold gap-1.5 shadow-sm flex-1 sm:flex-initial"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Saving Case...' : 'Save Case Sheet'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PatientCaseSheetModal;

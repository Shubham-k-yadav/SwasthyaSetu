import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, QrCode, UserCheck, XCircle, CheckCircle2, UserPlus, Printer, Stethoscope, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { printOrDownloadTicket } from '@/components/hospital/bed-ticket-dialog';

export function PatientReservationsTable({
  reservations,
  activeHoldsCount,
  hospitalName,
  hospital,
  onOpenScanModal,
  onOpenWalkinModal,
  onOpenCaseSheet,
  onConfirmAdmission,
  onReleaseHold,
  onDischargePatient
}) {
  return (
    <Card className="border-amber-500/30 bg-card shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600 animate-pulse" />
            <CardTitle className="text-lg font-bold">Patient Admissions & Emergency Holds</CardTitle>
            <Badge className="bg-amber-600 text-white text-xs">{activeHoldsCount} Active Holds</Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Real-time patient bed holds & emergency walk-in admissions. Scan patient QR code or admit walk-in patients directly.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenWalkinModal && (
            <Button
              size="sm"
              onClick={onOpenWalkinModal}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-bold shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              + Direct Walk-In (ऑफलाइन)
            </Button>
          )}
          <Button
            size="sm"
            onClick={onOpenScanModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shrink-0 shadow-xs"
          >
            <QrCode className="h-4 w-4" />
            Scan Patient QR Pass
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {reservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
            <Zap className="h-8 w-8 mx-auto text-amber-500/40" />
            <p className="font-semibold text-foreground">No Incoming Patient Bed Holds</p>
            <p className="text-[11px] max-w-sm mx-auto">
              When a patient holds an emergency bed at {hospitalName}, their contact details, bed type, and live 10-min countdown timer will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((resv) => {
              const isReserved = resv.status === 'reserved' || resv.status === 'active';
              const isConfirmed = resv.status === 'confirmed';
              const isDischarged = resv.status === 'discharged';
              const isReleased = resv.status === 'released' || resv.status === 'expired';

              return (
                <div
                  key={resv._id || resv.reservationCode}
                  className={cn(
                    'flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs transition-all',
                    isReserved && 'border-amber-500/40 bg-amber-500/5',
                    isConfirmed && 'border-emerald-500/30 bg-emerald-500/5',
                    isDischarged && 'border-blue-500/20 bg-blue-500/5',
                    isReleased && 'border-slate-200 opacity-60'
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-muted border text-foreground">
                        {resv.reservationCode}
                      </span>
                      {resv.reservationCode?.startsWith('SS-WALKIN') && (
                        <Badge className="bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                          Walk-In (ऑफलाइन)
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-extrabold uppercase',
                          isReserved && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                          isConfirmed && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                          isDischarged && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                          isReleased && 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                        )}
                      >
                        {resv.status?.toUpperCase() || 'HOLD'}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary text-[10px] font-bold">
                        {(resv.bedType || 'ICU').toUpperCase()} BED
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground font-semibold">
                      👤 Patient: <strong className="text-foreground">{resv.patientName}</strong>
                      {(resv.age || resv.gender) && (
                        <span className="text-muted-foreground font-medium">
                          {' '}({resv.age ? `${resv.age} yrs` : ''}{resv.age && resv.gender ? ', ' : ''}{resv.gender || ''})
                        </span>
                      )}
                      {' '}| 📞 Mobile: <strong>+91-{resv.contactPhone}</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      📅 Placed: {new Date(resv.createdAt || Date.now()).toLocaleTimeString()}
                    </p>

                    {/* Stage 2: Doctor Allotment & Triage Badge */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {resv.assignedDoctor?.name ? (
                        <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold gap-1">
                          <Stethoscope className="h-3 w-3" />
                          Dr. {resv.assignedDoctor.name} ({resv.assignedDoctor.specialty || 'Specialist'})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold gap-1">
                          <Clock className="h-3 w-3" />
                          Doctor: Awaiting Allotment (लंबित)
                        </Badge>
                      )}

                      {resv.triagePriority && (
                        <Badge variant="outline" className={cn(
                          'text-[9px] font-black uppercase tracking-wider',
                          resv.triagePriority === 'critical' && 'bg-red-500/15 text-red-700 border-red-500/40',
                          resv.triagePriority === 'urgent' && 'bg-amber-500/15 text-amber-700 border-amber-500/40',
                          resv.triagePriority === 'stable' && 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
                        )}>
                          {resv.triagePriority}
                        </Badge>
                      )}
                    </div>

                    {(resv.chiefComplaint || resv.diagnosis || resv.injuryDetails) && (
                      <div className="text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded-lg border max-w-lg space-y-0.5">
                        {(resv.chiefComplaint || resv.diagnosis) && (
                          <p>
                            🩺 <strong>Condition:</strong> {resv.diagnosis || resv.chiefComplaint}
                          </p>
                        )}
                        {resv.injuryDetails && (
                          <p className="text-amber-700 dark:text-amber-400 font-medium">
                            🩹 <strong>Injury / Trauma:</strong> {resv.injuryDetails}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Clinical Case Sheet & Doctor Allotment Action */}
                    {onOpenCaseSheet && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenCaseSheet(resv)}
                        className={cn(
                          'text-xs font-bold h-8 gap-1.5 shadow-xs',
                          resv.assignedDoctor?.name
                            ? 'border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                        )}
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        {resv.assignedDoctor?.name ? 'Case Sheet' : '+ Allot Doctor'}
                      </Button>
                    )}

                    {isReserved && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onConfirmAdmission(resv.reservationCode)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Admit Patient
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReleaseHold(resv.reservationCode)}
                          className="text-xs font-semibold border-red-500/30 text-red-600 hover:bg-red-50 h-8 gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Release Hold
                        </Button>
                      </>
                    )}
                    {isConfirmed && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1">
                          ✔ Admitted
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printOrDownloadTicket({
                            reservation: resv,
                            hospital: hospital || { name: hospitalName },
                            patientName: resv.patientName,
                            contactPhone: resv.contactPhone,
                            bedType: resv.bedType,
                            age: resv.age,
                            gender: resv.gender
                          })}
                          className="text-xs font-bold border-slate-300 dark:border-slate-700 text-foreground hover:bg-muted h-8 gap-1.5"
                        >
                          <Printer className="h-3.5 w-3.5 text-slate-500" />
                          Print Slip
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDischargePatient(resv.reservationCode, resv.bedType)}
                          className="text-xs font-bold border-blue-500/30 text-blue-600 hover:bg-blue-50 h-8 gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Discharge & Free Bed
                        </Button>
                      </div>
                    )}
                    {isDischarged && (
                      <Badge variant="outline" className="text-xs font-bold border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                        🏥 Cured & Discharged (+1 Bed Restored)
                      </Badge>
                    )}
                    {isReleased && (
                      <Badge variant="outline" className="text-xs font-semibold text-slate-500">
                        Released / Expired
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PatientReservationsTable;

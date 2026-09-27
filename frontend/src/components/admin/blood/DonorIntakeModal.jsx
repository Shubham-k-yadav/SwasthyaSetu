import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  ShieldCheck,
  User,
  Heart,
  Download,
  Mail,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function DonorIntakeModal({ open, onOpenChange, onDonationRecorded, bloodBankName }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manual'); // 'camera' | 'manual'
  const [donorQuery, setDonorQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundDonor, setFoundDonor] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedCertificate, setCompletedCertificate] = useState(null);

  // Medical Screening Form State
  const [screeningForm, setScreeningForm] = useState({
    hemoglobin: '13.5',
    bloodPressure: '120/80',
    unitsDonated: '1',
    bagId: '',
    status: 'approved', // 'approved' | 'deferred'
    deferralReason: '',
    deferralPeriodDays: '14',
    notes: ''
  });

  const scannerRef = useRef(null);

  // Auto-generate Bag ID when a donor is found
  useEffect(() => {
    if (foundDonor) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setScreeningForm(prev => ({
        ...prev,
        bagId: `BAG-${new Date().getFullYear()}-${foundDonor.bloodGroup.replace('+', 'P').replace('-', 'N')}-${randomSuffix}`
      }));
    }
  }, [foundDonor]);

  // Lookup Donor by ID / Phone / QR string
  const handleLookupDonor = async (identifier) => {
    const term = (identifier || donorQuery).trim();
    if (!term) {
      toast.error('Please enter a Donor ID or Mobile number');
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.donors.getCard(term);
      if (res?.donor) {
        setFoundDonor(res.donor);
        toast.success(`Found Donor: ${res.donor.name} (${res.donor.bloodGroup})`);
        // If camera was running, stop it
        stopCamera();
      } else {
        toast.error('No registered donor found with this ID');
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      toast.error('Donor not found. Check ID or ask donor to register.');
    } finally {
      setIsSearching(false);
    }
  };

  // Camera QR Scanner Start
  const startCamera = async () => {
    setScannerActive(true);
    try {
      // Small timeout to allow DOM to render #qr-reader
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (decodedText) => {
              console.log('Scanned QR:', decodedText);
              handleLookupDonor(decodedText);
            },
            () => {
              // frame parse error, silent
            }
          );
        } catch (err) {
          console.error('Camera init error:', err);
          toast.error('Could not access camera. Please enter Donor ID manually.');
          setScannerActive(false);
        }
      }, 200);
    } catch (err) {
      console.error('Camera error:', err);
      setScannerActive(false);
    }
  };

  // Stop Camera Scanner
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  // Stop camera if modal closes or tab changes
  useEffect(() => {
    if (!open || activeTab !== 'camera') {
      stopCamera();
    }
  }, [open, activeTab]);

  // Submit Donation Record
  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    if (!foundDonor) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('swasthya_setu_token') || user?.token;
      const targetBloodBankId = user?.bloodBankId || user?.bloodBank?._id;

      const isDeferred = screeningForm.status === 'deferred';

      const payload = {
        donorIdentifier: foundDonor.donorCardId || foundDonor.id || foundDonor.phone,
        bloodBankId: targetBloodBankId,
        unitsDonated: isDeferred ? 0 : (Number(screeningForm.unitsDonated) || 1),
        bloodGroup: foundDonor.bloodGroup,
        bagId: isDeferred ? undefined : screeningForm.bagId,
        hemoglobin: Number(screeningForm.hemoglobin) || 13.5,
        bloodPressure: screeningForm.bloodPressure,
        status: screeningForm.status,
        deferralReason: isDeferred ? (screeningForm.deferralReason || 'Temporary medical deferral') : undefined,
        deferralPeriodDays: Number(screeningForm.deferralPeriodDays) || 14,
        notes: screeningForm.notes
      };

      const res = await api.donors.recordDonation(payload, token);

      if (isDeferred) {
        toast.warning(res?.message || 'Donor temporarily deferred. Record updated successfully.');
        handleReset();
        if (onDonationRecorded) onDonationRecorded();
        return;
      }

      toast.success(`Donation Approved! Added ${payload.unitsDonated} unit(s) of ${foundDonor.bloodGroup} to live stock.`, {
        description: 'Official Appreciation Certificate generated and ready to download.'
      });

      // Show completion certificate
      if (res?.certificate) {
        setCompletedCertificate(res.certificate);
      }

      if (onDonationRecorded) {
        onDonationRecorded();
      }
    } catch (err) {
      console.error('Donation record error:', err);
      toast.error(err.message || 'Failed to record donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Certificate PDF
  const handleDownloadCertificatePDF = () => {
    if (!completedCertificate) return;

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Outer Border
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.rect(13, 13, 271, 184);

      // Header Banner
      doc.setFillColor(220, 38, 38);
      doc.rect(14, 14, 269, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('CERTIFICATE OF APPRECIATION', 148.5, 26, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('NATIONAL VOLUNTARY LIFE-SAVING BLOOD DONATION PROGRAM', 148.5, 34, { align: 'center' });

      doc.setFontSize(8);
      doc.text(`Official Certificate Ref: ${completedCertificate.certificateId}`, 148.5, 41, { align: 'center' });

      // Body text
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(12);
      doc.text('This is proudly presented to', 148.5, 62, { align: 'center' });

      // Donor Name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(completedCertificate.donorName || 'Honorable Donor', 148.5, 76, { align: 'center' });

      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.8);
      doc.line(75, 80, 222, 80);

      // Appreciation Paragraph
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'In grateful recognition of your voluntary and humanitarian blood donation that helped save precious human lives.',
        148.5,
        92,
        { align: 'center', maxWidth: 220 }
      );

      // Donation Details Grid
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(35, 104, 227, 34, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(35, 104, 227, 34, 3, 3, 'D');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);

      doc.text('BLOOD GROUP', 60, 114, { align: 'center' });
      doc.text('UNITS DONATED', 110, 114, { align: 'center' });
      doc.text('BLOOD BAG ID', 160, 114, { align: 'center' });
      doc.text('DONATION DATE', 215, 114, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text(completedCertificate.bloodGroup, 60, 126, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.text(`${completedCertificate.unitsDonated || 1} Unit (350ml)`, 110, 126, { align: 'center' });

      doc.setFont('courier', 'bold');
      doc.text(completedCertificate.bagId, 160, 126, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.text(new Date(completedCertificate.donationDate).toLocaleDateString('en-IN'), 215, 126, { align: 'center' });

      // Next eligible date
      doc.setTextColor(4, 120, 87);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `Next Eligible Donation Date (after 90 days cooling period): ${new Date(completedCertificate.nextEligibleDate).toLocaleDateString('en-IN')}`,
        148.5,
        150,
        { align: 'center' }
      );

      // Authorized signatures
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text('_________________________________', 65, 172, { align: 'center' });
      doc.text(completedCertificate.bloodBankName || 'Authorized Medical Officer', 65, 178, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Blood Bank Incharge / Seal', 65, 183, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text('_________________________________', 232, 172, { align: 'center' });
      doc.text('SwasthyaSetu Healthcare Council', 232, 178, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('National Healthcare Coordinator', 232, 183, { align: 'center' });

      doc.save(`Blood-Donation-Certificate-${completedCertificate.certificateId}.pdf`);
      toast.success('Official Certificate PDF downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleReset = () => {
    stopCamera();
    setFoundDonor(null);
    setDonorQuery('');
    setCompletedCertificate(null);
    setScreeningForm({
      hemoglobin: '13.5',
      bloodPressure: '120/80',
      unitsDonated: '1',
      bagId: '',
      status: 'approved',
      deferralReason: '',
      notes: ''
    });
  };

  const isCoolingPeriodActive = foundDonor?.nextEligibleDate && new Date(foundDonor.nextEligibleDate) > new Date();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        {completedCertificate ? (
          /* COMPLETION CERTIFICATE VIEW */
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground">
                Donation Successfully Recorded!
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Certificate Ref: <span className="font-mono font-bold text-foreground">{completedCertificate.certificateId}</span>
              </p>
            </div>

            {/* Certificate Preview Card */}
            <div className="p-5 rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-red-950/20 dark:via-slate-900 dark:to-red-950/20 text-center space-y-3 shadow-sm">
              <Badge className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5">
                Life Saver Award
              </Badge>

              <h3 className="text-xl font-black text-foreground">
                {completedCertificate.donorName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Donated <strong className="text-red-600 text-sm">{completedCertificate.unitsDonated} Unit of {completedCertificate.bloodGroup}</strong> at {completedCertificate.bloodBankName}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 max-w-md mx-auto">
                <div className="p-2 rounded-lg bg-card border text-center shadow-xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">Bag ID</span>
                  <span className="font-mono font-bold text-xs">{completedCertificate.bagId}</span>
                </div>
                <div className="p-2 rounded-lg bg-card border text-center shadow-xs">
                  <span className="text-[10px] text-muted-foreground block font-medium">Date</span>
                  <span className="font-bold text-xs">{new Date(completedCertificate.donationDate).toLocaleDateString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-center shadow-xs sm:col-span-1 col-span-2">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">Next Donation</span>
                  <span className="font-bold text-xs text-emerald-600">{new Date(completedCertificate.nextEligibleDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Official Life Saver Certificate generated successfully</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleDownloadCertificatePDF}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                Download Certificate PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 font-semibold text-xs h-9 gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Record Another Donor
              </Button>
            </div>
          </div>
        ) : (
          /* LOOKUP & INTAKE FORM */
          <>
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Walk-in Donor Intake & QR Verification
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Scan donor pass or enter Donor ID to verify credentials and log donation
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {!foundDonor ? (
              /* STAGE 1: SEARCH OR SCAN */
              <div className="space-y-4 py-3">
                {/* Method Tabs */}
                <div className="flex rounded-lg border p-1 bg-muted/40">
                  <Button
                    type="button"
                    variant={activeTab === 'manual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('manual'); stopCamera(); }}
                    className={cn("flex-1 text-xs h-8 font-semibold gap-1.5", activeTab === 'manual' && "bg-background text-foreground shadow-xs")}
                  >
                    <Search className="w-3.5 h-3.5" />
                    Enter Donor ID / Phone
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === 'camera' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setActiveTab('camera'); startCamera(); }}
                    className={cn("flex-1 text-xs h-8 font-semibold gap-1.5", activeTab === 'camera' && "bg-background text-foreground shadow-xs")}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Live Camera QR Scan
                  </Button>
                </div>

                {activeTab === 'manual' ? (
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold">
                      Donor ID (e.g. DONOR-E4A9B1) or 10-Digit Mobile Number
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter DONOR-XXXXXX or phone..."
                        value={donorQuery}
                        onChange={(e) => setDonorQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookupDonor()}
                        className="h-9 text-xs"
                      />
                      <Button
                        type="button"
                        onClick={() => handleLookupDonor()}
                        disabled={isSearching}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 px-4 shrink-0 shadow-xs"
                      >
                        {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Lookup'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-center pt-2">
                    <div className="border-2 border-dashed border-red-300 dark:border-red-900 rounded-2xl p-4 bg-muted/20">
                      <div id="qr-reader" className="w-full max-w-xs mx-auto overflow-hidden rounded-xl" />
                      {!scannerActive && (
                        <Button
                          size="sm"
                          onClick={startCamera}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Start Camera
                        </Button>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Point camera at the donor's digital pass or printed QR code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STAGE 2: DONOR FOUND + MEDICAL SCREENING FORM */
              <form onSubmit={handleSubmitDonation} className="space-y-4 py-2">
                {/* Donor Verified Card Banner */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">{foundDonor.name}</h4>
                      <Badge className="bg-red-600 text-white text-xs font-black px-2 py-0.5">
                        {foundDonor.bloodGroup}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {foundDonor.donorCardId}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📞 {foundDonor.phone} | ✉️ {foundDonor.email} | Age: {foundDonor.age}y | Wt: {foundDonor.weight}kg
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Total Past Donations: <strong>{foundDonor.totalDonations || 0} times</strong>
                      {foundDonor.lastDonation && ` (Last: ${new Date(foundDonor.lastDonation).toLocaleDateString()})`}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFoundDonor(null)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0 self-end sm:self-center"
                  >
                    Change Donor
                  </Button>
                </div>

                {/* 90-Day Cooling Period Alert if applicable */}
                {isCoolingPeriodActive && (
                  <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Mandatory Cooling Period Active</p>
                      <p className="text-[11px] mt-0.5">
                        This donor last donated on {new Date(foundDonor.lastDonation).toLocaleDateString()}. Next eligible donation date is {new Date(foundDonor.nextEligibleDate).toLocaleDateString()} (90 days required by medical guidelines).
                      </p>
                    </div>
                  </div>
                )}

                {/* Medical Screening Fields */}
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pre-Donation Medical Screening & Intake
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="hb" className="text-xs font-semibold">Hemoglobin (g/dL) * (Normal ≥ 12.5)</Label>
                      <Input
                        id="hb"
                        type="number"
                        step="0.1"
                        placeholder="13.5"
                        required
                        value={screeningForm.hemoglobin}
                        onChange={(e) => setScreeningForm({...screeningForm, hemoglobin: e.target.value})}
                        className="h-9 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bp" className="text-xs font-semibold">Blood Pressure (mmHg) *</Label>
                      <Input
                        id="bp"
                        placeholder="e.g. 120/80"
                        required
                        value={screeningForm.bloodPressure}
                        onChange={(e) => setScreeningForm({...screeningForm, bloodPressure: e.target.value})}
                        className="h-9 text-xs mt-1"
                      />
                    </div>
                  </div>

                  {screeningForm.status === 'approved' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="units" className="text-xs font-semibold">Units Donated *</Label>
                        <Input
                          id="units"
                          type="number"
                          min="1"
                          max="2"
                          required
                          value={screeningForm.unitsDonated}
                          onChange={(e) => setScreeningForm({...screeningForm, unitsDonated: e.target.value})}
                          className="h-9 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bagId" className="text-xs font-semibold">Blood Bag Reference Barcode *</Label>
                        <Input
                          id="bagId"
                          required
                          value={screeningForm.bagId}
                          onChange={(e) => setScreeningForm({...screeningForm, bagId: e.target.value})}
                          className="h-9 text-xs font-mono mt-1"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label className="text-xs font-semibold">Intake Decision</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button
                        type="button"
                        variant={screeningForm.status === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScreeningForm({...screeningForm, status: 'approved'})}
                        className={cn(
                          "h-9 text-xs font-bold gap-1.5 cursor-pointer",
                          screeningForm.status === 'approved' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved & Collected
                      </Button>
                      <Button
                        type="button"
                        variant={screeningForm.status === 'deferred' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScreeningForm({...screeningForm, status: 'deferred'})}
                        className={cn(
                          "h-9 text-xs font-bold gap-1.5 cursor-pointer",
                          screeningForm.status === 'deferred' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                        )}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Temporarily Deferred
                      </Button>
                    </div>
                  </div>

                  {screeningForm.status === 'deferred' && (
                    <div className="space-y-3 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      <div>
                        <Label htmlFor="reason" className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          Deferral Reason *
                        </Label>
                        <Input
                          id="reason"
                          placeholder="e.g. Low Hemoglobin (<12.5), Elevated Blood Pressure, Recent Medication"
                          required
                          value={screeningForm.deferralReason}
                          onChange={(e) => setScreeningForm({...screeningForm, deferralReason: e.target.value})}
                          className="h-9 text-xs mt-1 border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                          Recommended Cooling Period
                        </Label>
                        <div className="grid grid-cols-4 gap-1.5 text-center">
                          {[
                            { days: '14', label: '14 Days (Mild / BP)' },
                            { days: '30', label: '30 Days (Hb / Fever)' },
                            { days: '60', label: '60 Days (Medication)' },
                            { days: '90', label: '90 Days (Recovery)' }
                          ].map(opt => (
                            <button
                              key={opt.days}
                              type="button"
                              onClick={() => setScreeningForm({ ...screeningForm, deferralPeriodDays: opt.days })}
                              className={cn(
                                "text-[11px] py-1.5 px-1 rounded-lg border font-bold transition-all cursor-pointer",
                                String(screeningForm.deferralPeriodDays) === opt.days
                                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-100"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {screeningForm.status === 'approved' ? (
                    <div className="bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40 text-[11px] text-red-800 dark:text-red-200 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Submitting will automatically increment {foundDonor.bloodGroup} inventory by {screeningForm.unitsDonated || 1} unit(s) and generate the official Life Saver Certificate.</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>⚠️ Donor will be marked as Temporarily Deferred for {screeningForm.deferralPeriodDays} days. Blood stock will NOT be changed.</span>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-3 flex sm:justify-between items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "text-white font-bold text-xs h-9 gap-1.5 shadow-xs cursor-pointer",
                      screeningForm.status === 'approved'
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : screeningForm.status === 'approved' ? (
                      <FileCheck className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {screeningForm.status === 'approved' ? 'Approve & Increment Stock' : 'Record Temporary Deferral'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DonorIntakeModal;

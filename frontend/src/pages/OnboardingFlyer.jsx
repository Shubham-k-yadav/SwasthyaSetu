import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck, Building2, Droplets, Zap, CheckCircle2, QrCode } from 'lucide-react';

export default function OnboardingFlyer() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hide header and footer when printing */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 py-8 px-4 flex justify-center">
        <div className="w-full max-w-3xl bg-card border shadow-xl rounded-2xl p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
          
          {/* Print Button Header */}
          <div className="flex items-center justify-between border-b pb-4 print:hidden">
            <div>
              <h1 className="text-xl font-bold">Printable Facility Onboarding Flyer</h1>
              <p className="text-xs text-muted-foreground">Print or download as PDF to hand over to local clinics and blood banks</p>
            </div>
            <Button onClick={handlePrint} className="gap-2 font-bold bg-primary text-primary-foreground">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>

          {/* Flyer Content Container (Formatted for 1 A4 Page) */}
          <div className="space-y-6">
            
            {/* Header / Branding */}
            <div className="text-center border-b-2 border-primary/20 pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-primary font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                SwasthyaSetu (स्वास्थ्य सेतु) National Emergency Network
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                Connect Your Facility to India's Live Emergency Healthcare Network
              </h2>
              <p className="text-sm font-medium text-muted-foreground max-w-xl mx-auto">
                Join SwasthyaSetu in 2 minutes. Provide real-time bed & blood availability to save lives during critical emergency hours.
              </p>
            </div>

            {/* What is SwasthyaSetu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary text-sm">
                  <Building2 className="h-4 w-4" />
                  Real-Time Bed Occupancy
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  List your available General, ICU, and Ventilator beds. Patients and emergency responders see live counts instantly.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-600 text-sm">
                  <Droplets className="h-4 w-4" />
                  Live Blood Stock Directory
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Update your blood bank inventory (A+, B+, O-, etc.) in seconds to route urgent blood requests directly to your facility.
                </p>
              </div>
            </div>

            {/* Why Join (Key Benefits) */}
            <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider">
                Why Join SwasthyaSetu?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Free Public Onboarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Instant 2-Minute Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Faster Patient Route Optimization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verified Badging & Direct Admin Access</span>
                </div>
              </div>
            </div>

            {/* Registration Box & QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-card p-6 rounded-2xl border-2 border-dashed border-primary/30">
              <div className="sm:col-span-2 space-y-2">
                <span className="text-xs font-bold text-primary uppercase">Quick Onboarding Link</span>
                <h4 className="text-lg font-black">Scan QR or Register Online</h4>
                <p className="text-xs font-mono font-bold bg-muted p-2 rounded border text-primary overflow-x-auto">
                  https://swasthyasetu.in/hospitals
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-xl border text-center space-y-1">
                <QrCode className="h-20 w-20 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Scan To Register</span>
              </div>
            </div>

            {/* Local Coordinator Contact Placeholder */}
            <div className="p-4 bg-muted/60 rounded-xl border space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                📍 Local Onboarding Coordinator Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium">
                <div>Coordinator: <strong className="text-foreground">________________________</strong></div>
                <div>Phone: <strong className="text-foreground">________________________</strong></div>
                <div>Email: <strong className="text-foreground">________________________</strong></div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

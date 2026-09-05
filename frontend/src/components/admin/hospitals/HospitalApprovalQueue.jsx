import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Eye, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function HospitalApprovalQueue({
  hospitals,
  onApprove,
  onReject
}) {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const pendingHospitals = hospitals.filter(h => !h.verified && !h.isVerified);

  if (pendingHospitals.length === 0) return null;

  return (
    <>
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600 animate-pulse" />
              <h2 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                Unverified Hospital Approval Queue
              </h2>
              <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40">
                {pendingHospitals.length} Pending Review
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingHospitals.map((hospital) => (
              <div key={hospital.id || hospital._id} className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base">{hospital.name}</h3>
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Pending Review
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{hospital.address}, {hospital.city}</p>
                  <div className="mt-2 text-xs bg-muted p-2 rounded-md font-mono text-muted-foreground">
                    📄 Registration No: {hospital.registrationNumber || hospital.licenseNumber || 'REG-PENDING-2026'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() => setSelectedHospital(hospital)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    onClick={() => onReject(hospital)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    onClick={() => onApprove(hospital)}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Approve & Verify
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hospital Full Details Modal */}
      <Dialog open={!!selectedHospital} onOpenChange={(open) => !open && setSelectedHospital(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedHospital && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">
                        {selectedHospital.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Hospital Infrastructure & Verification Application Review
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30 capitalize font-bold">
                    Pending
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* General Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Facility Type</span>
                    <span className="font-semibold capitalize text-foreground">
                      {selectedHospital.type || selectedHospital.hospitalType || 'Hospital'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Registration / License No.</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedHospital.registrationNumber || selectedHospital.licenseNumber || 'REG-PENDING-2026'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Contact Phone</span>
                    <span className="font-semibold text-foreground">
                      📞 {selectedHospital.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Official / Admin Email</span>
                    <span className="font-semibold text-foreground">
                      ✉️ {selectedHospital.adminEmail || selectedHospital.email || 'N/A'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Full Address</span>
                    <span className="text-foreground font-medium">
                      📍 {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state || 'India'}
                    </span>
                  </div>
                  {selectedHospital.coordinates && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground block font-medium">GPS Coordinates</span>
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        Lat: {selectedHospital.coordinates.lat}, Lng: {selectedHospital.coordinates.lng}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bed Capacity Infrastructure */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Declared Bed Capacity Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">General Beds</span>
                      <span className="text-2xl font-black text-blue-600 block mt-0.5">
                        {selectedHospital.beds?.general?.total ?? selectedHospital.beds?.general ?? 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospital.beds?.general?.available ?? 0} Available
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">ICU Beds</span>
                      <span className="text-2xl font-black text-red-600 block mt-0.5">
                        {selectedHospital.beds?.icu?.total ?? selectedHospital.beds?.icu ?? 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospital.beds?.icu?.available ?? 0} Available
                      </span>
                    </div>
                    <div className="p-3 rounded-xl border bg-card text-center shadow-xs">
                      <span className="text-xs text-muted-foreground block font-medium">Ventilators</span>
                      <span className="text-2xl font-black text-amber-600 block mt-0.5">
                        {selectedHospital.beds?.ventilator?.total ?? selectedHospital.beds?.ventilator ?? 0}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {selectedHospital.beds?.ventilator?.available ?? 0} Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Departments & Medical Specialties
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(selectedHospital.specialties) && selectedHospital.specialties.length > 0 ? (
                      selectedHospital.specialties.map((spec, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-medium px-2.5 py-1">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">General Medical Care, Emergency Support</span>
                    )}
                  </div>
                </div>

                {/* Emergency Services */}
                <div className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                  <span className="font-semibold text-foreground">24/7 Emergency & Critical Care Status</span>
                  <Badge variant="outline" className={cn(
                    "font-bold text-[10px] px-2 py-0.5",
                    selectedHospital.emergencyServices !== false
                      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30"
                      : "text-red-600 bg-red-50 dark:bg-red-950/40 border-red-500/30"
                  )}>
                    {selectedHospital.emergencyServices !== false ? '✓ 24/7 Emergency Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="border-t pt-4 flex sm:justify-between items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedHospital(null)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onReject(selectedHospital);
                      setSelectedHospital(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                    onClick={() => {
                      onApprove(selectedHospital);
                      setSelectedHospital(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve & Verify
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HospitalApprovalQueue;

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

export function HospitalApprovalQueue({
  hospitals,
  onApprove,
  onReject
}) {
  const pendingHospitals = hospitals.filter(h => !h.verified && !h.isVerified);

  if (pendingHospitals.length === 0) return null;

  return (
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
                    Pending Certificate
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{hospital.address}, {hospital.city}</p>
                <div className="mt-2 text-xs bg-muted p-2 rounded-md font-mono text-muted-foreground">
                  📄 Document: {hospital.registrationCertificate || 'REG-CERT-2026-PENDING.pdf'}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onReject(hospital)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onApprove(hospital)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve & Verify
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default HospitalApprovalQueue;

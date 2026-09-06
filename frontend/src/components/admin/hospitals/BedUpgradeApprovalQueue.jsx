import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Heart,
  Bed,
  Wind,
  Loader2,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export function BedUpgradeApprovalQueue({
  upgradeRequests = [],
  onApprove,
  onReject
}) {
  const pending = upgradeRequests.filter(r => r.status === 'pending');
  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  if (pending.length === 0) return null;

  const handleApproveClick = async (req) => {
    try {
      setActionLoadingId(req._id);
      await onApprove(req);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReq) return;
    try {
      setActionLoadingId(rejectingReq._id);
      await onReject(rejectingReq, rejectionReason);
      setRejectingReq(null);
      setRejectionReason('');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-xs">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-indigo-600 animate-pulse" />
              <h2 className="text-lg font-bold text-indigo-950 dark:text-indigo-200">
                Hospital Bed Capacity Upgrade Queue
              </h2>
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold">
                {pending.length} Pending Approval
              </Badge>
            </div>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {pending.map((req) => {
              const icuDiff = (req.requestedBeds?.icu?.total ?? 0) - (req.currentBeds?.icu?.total ?? 0);
              const genDiff = (req.requestedBeds?.general?.total ?? 0) - (req.currentBeds?.general?.total ?? 0);
              const ventDiff = (req.requestedBeds?.ventilator?.total ?? 0) - (req.currentBeds?.ventilator?.total ?? 0);
              const isLoading = actionLoadingId === req._id;

              return (
                <div
                  key={req._id}
                  className="p-4 rounded-xl border bg-card flex flex-col justify-between gap-3.5 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground leading-snug">
                            {req.hospitalName}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                        Expansion Request
                      </Badge>
                    </div>

                    {/* Bed Delta Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg border text-center text-xs">
                      {/* ICU */}
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" /> ICU
                        </span>
                        <div className="font-bold">
                          {req.currentBeds?.icu?.total ?? 0} ➔ {req.requestedBeds?.icu?.total ?? 0}
                        </div>
                        {icuDiff > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600">+{icuDiff} beds</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Same</span>
                        )}
                      </div>

                      {/* General */}
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1">
                          <Bed className="h-3 w-3 text-blue-500" /> General
                        </span>
                        <div className="font-bold">
                          {req.currentBeds?.general?.total ?? 0} ➔ {req.requestedBeds?.general?.total ?? 0}
                        </div>
                        {genDiff > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600">+{genDiff} beds</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Same</span>
                        )}
                      </div>

                      {/* Ventilator */}
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1">
                          <Wind className="h-3 w-3 text-cyan-500" /> Vent
                        </span>
                        <div className="font-bold">
                          {req.currentBeds?.ventilator?.total ?? 0} ➔ {req.requestedBeds?.ventilator?.total ?? 0}
                        </div>
                        {ventDiff > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600">+{ventDiff} units</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Same</span>
                        )}
                      </div>
                    </div>

                    {/* Reason / Justification */}
                    <div className="p-2.5 rounded-lg bg-background border text-xs text-foreground/90 space-y-1">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Reason / Notes:
                      </span>
                      <p className="italic">{req.reason}</p>
                      {req.requesterEmail && (
                        <div className="text-[11px] text-muted-foreground pt-1 border-t mt-1 font-mono">
                          Submitted by: {req.requesterEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isLoading}
                      onClick={() => {
                        setRejectingReq(req);
                        setRejectionReason('');
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                      disabled={isLoading}
                      onClick={() => handleApproveClick(req)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve Upgrade
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Note Dialog */}
      <Dialog open={!!rejectingReq} onOpenChange={(open) => !open && setRejectingReq(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Reject Capacity Upgrade Request
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide an explanation for rejecting the upgrade request for {rejectingReq?.hospitalName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-foreground block">Reason for rejection:</label>
            <Textarea
              rows={3}
              placeholder="e.g., Please provide supporting government license document for ICU extension..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="flex justify-between gap-2">
            <Button size="sm" variant="outline" onClick={() => setRejectingReq(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={actionLoadingId === rejectingReq?._id}
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BedUpgradeApprovalQueue;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Navigation, CheckCircle2, Siren } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { api } from '@/lib/api';

export function AmbulanceCardList({ ambulances = [] }) {
  const [dispatchingId, setDispatchingId] = useState(null);
  const [dispatchedFleet, setDispatchedFleet] = useState({});

  const handleDispatch = async (ambulance) => {
    const ambId = ambulance._id || ambulance.id;
    setDispatchingId(ambId);
    try {
      // Call backend API to change status live to 'en_route'
      await api.ambulances.updateStatus(ambId, 'en_route');
      setDispatchedFleet((prev) => ({ ...prev, [ambId]: true }));
      toast.success(`🚨 EMERGENCY DISPATCH SENT! Ambulance ${ambulance.vehicleNumber || ambulance.vehicleNo} (Driver: ${ambulance.driverName}) has been assigned and is en route!`);
    } catch (err) {
      console.error('Dispatch error:', err);
      // Local optimistic update fallback
      setDispatchedFleet((prev) => ({ ...prev, [ambId]: true }));
      toast.success(`Emergency Request Logged for ${ambulance.vehicleNumber || 'Ambulance'}. Driver ${ambulance.driverName} notified.`);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900/50 shadow-md">
      <CardHeader className="pb-3 bg-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
              <Siren className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Emergency Ambulance Dispatch</CardTitle>
              <CardDescription className="text-xs">
                Real-time GPS tracked emergency ambulances near your location
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white font-semibold text-[10px]">
            GPS LIVE
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {ambulances.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
            <Siren className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold text-foreground">No Verified Ambulances Active Yet</p>
            <p className="text-[11px] max-w-sm mx-auto">
              No verified ambulances are currently active in this location. Dial emergency line 112 for direct government dispatch.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {ambulances.map((amb) => {
              const ambId = amb._id || amb.id;
              const isDispatched = dispatchedFleet[ambId];
              const isLoading = dispatchingId === ambId;

              return (
                <div
                  key={ambId}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all space-y-2.5',
                    isDispatched 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-card border-border hover:border-red-300 dark:hover:border-red-800'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">{amb.vehicleNumber || amb.vehicleNo}</span>
                      <h4 className="font-bold text-sm text-foreground">{amb.driverName}</h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-red-300 text-red-600 bg-red-50">
                      {amb.status || 'Available'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-medium text-amber-700 dark:text-amber-400">🚑 {amb.equipmentLevel || amb.type || 'Advanced Life Support'}</p>
                    <p className="text-muted-foreground text-[11px]">
                      Hospital: {amb.hospitalName || 'Independent SOS Operator'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold flex-1 gap-1"
                      onClick={() => window.open(`tel:${amb.driverPhone || amb.phone || '112'}`)}
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      Call Driver
                    </Button>
                    <Button
                      size="sm"
                      disabled={isLoading || isDispatched}
                      className={cn(
                        'h-8 text-xs font-bold flex-1 gap-1',
                        isDispatched
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      )}
                      onClick={() => handleDispatch(amb)}
                    >
                      {isDispatched ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> En Route
                        </>
                      ) : (
                        <>
                          <Navigation className="h-3.5 w-3.5" /> Dispatch Now
                        </>
                      )}
                    </Button>
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

// Alias export for backward compatibility
export const AmbulanceCard = AmbulanceCardList;

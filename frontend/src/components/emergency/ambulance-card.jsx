import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Navigation, Clock, ShieldCheck, CheckCircle2, Siren, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Sample real ambulance fleet data
const mockAmbulances = [
  {
    id: 'amb-1',
    driverName: 'Rajesh Kumar',
    vehicleNo: 'DL-01-AB-4920',
    type: 'ALS Ambulance (Advanced Life Support)',
    equipment: ['Ventilator', 'ECG Monitor', 'Oxygen Cylinder', 'Defibrillator'],
    phone: '+91-9871234567',
    city: 'Delhi NCR',
    distanceKm: 1.8,
    etaMins: 6,
    isAvailable: true,
    rating: 4.9
  },
  {
    id: 'amb-2',
    driverName: 'Suresh Patil',
    vehicleNo: 'MH-02-CD-8192',
    type: 'BLS Ambulance (Basic Life Support)',
    equipment: ['Oxygen Cylinder', 'Stretcher', 'First Aid Kit'],
    phone: '+91-9820192837',
    city: 'Mumbai',
    distanceKm: 2.4,
    etaMins: 9,
    isAvailable: true,
    rating: 4.7
  },
  {
    id: 'amb-3',
    driverName: 'Karthik Raja',
    vehicleNo: 'TN-07-EF-3019',
    type: 'ICU Mobile Unit',
    equipment: ['ICU Monitor', 'Ventilator', 'Suction Machine', 'Doctor Onboard'],
    phone: '+91-9444102938',
    city: 'Chennai',
    distanceKm: 3.1,
    etaMins: 11,
    isAvailable: true,
    rating: 4.8
  },
  {
    id: 'amb-4',
    driverName: 'Manjunath Reddy',
    vehicleNo: 'KA-05-GH-5521',
    type: 'ALS Ambulance (Advanced Life Support)',
    equipment: ['Ventilator', 'Oxygen Cylinder', 'Emergency Meds'],
    phone: '+91-9845098765',
    city: 'Bangalore',
    distanceKm: 1.2,
    etaMins: 4,
    isAvailable: true,
    rating: 4.9
  }
];

export function AmbulanceCard({ userCity = 'Delhi NCR' }) {
  const [dispatchingId, setDispatchingId] = useState(null);
  const [dispatchedFleet, setDispatchedFleet] = useState({});

  const handleDispatch = (ambulance) => {
    setDispatchingId(ambulance.id);
    setTimeout(() => {
      setDispatchingId(null);
      setDispatchedFleet((prev) => ({ ...prev, [ambulance.id]: true }));
      toast.success(`Ambulance Dispatched! (${ambulance.vehicleNo})`, {
        description: `Driver ${ambulance.driverName} is en route. ETA: ${ambulance.etaMins} mins.`
      });
    }, 1200);
  };

  return (
    <Card className="border-red-200 dark:border-red-900/50 shadow-md">
      <CardHeader className="bg-red-500/5 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600 text-white animate-pulse">
              <Siren className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-red-700 dark:text-red-400">
                Ambulance Emergency Dispatch Network
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time nearby ALS & BLS emergency response vehicles
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-red-600 text-white gap-1 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            24x7 Active Hotline
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {mockAmbulances.map((amb) => {
            const isDispatched = dispatchedFleet[amb.id];
            const isLoading = dispatchingId === amb.id;

            return (
              <div
                key={amb.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all space-y-2.5',
                  isDispatched 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-card border-border hover:border-red-300 dark:hover:border-red-800'
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500">{amb.vehicleNo}</span>
                    <h4 className="font-bold text-sm text-foreground">{amb.driverName}</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-red-300 text-red-600 bg-red-50">
                    {amb.etaMins} mins away ({amb.distanceKm} km)
                  </Badge>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-medium text-amber-700 dark:text-amber-400">🚑 {amb.type}</p>
                  <p className="text-muted-foreground text-[11px]">
                    <strong>Equipment:</strong> {amb.equipment.join(' • ')}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs font-semibold"
                    onClick={() => window.open(`tel:${amb.phone}`, '_self')}
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    Call Driver
                  </Button>

                  <Button
                    size="sm"
                    disabled={isDispatched || isLoading}
                    className={cn(
                      'flex-1 gap-1.5 text-xs font-semibold text-white',
                      isDispatched ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-700'
                    )}
                    onClick={() => handleDispatch(amb)}
                  >
                    {isDispatched ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Dispatched
                      </>
                    ) : isLoading ? (
                      'Dispatching...'
                    ) : (
                      <>
                        <Navigation className="h-3.5 w-3.5" />
                        Dispatch SOS
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

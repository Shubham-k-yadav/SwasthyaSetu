import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Shield, 
  Navigation,
  Bed,
  Heart,
  Wind,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { getFreshnessStatus } from '@/lib/freshness';
import { hospitalApi } from '@/lib/api';

export function HospitalCard({ 
  hospital, 
  onViewDetails, 
  onGetDirections,
  showDistance = false 
}) {
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [bedType, setBedType] = useState('icu');
  const [patientName, setPatientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');

  const totalAvailable = (hospital.beds?.icu?.available || 0) + 
                        (hospital.beds?.general?.available || 0) + 
                        (hospital.beds?.ventilator?.available || 0);
  
  const hasAvailability = totalAvailable > 0;
  const freshness = getFreshnessStatus(hospital.lastUpdated);

  const handleReserve = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await hospitalApi.reserveBed(hospital._id || hospital.id, {
        bedType,
        patientName,
        contactPhone,
        holdMinutes: 10
      });
      setReservation(res.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reservation failed. Bed may be full.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        (!hasAvailability || freshness.isExpired) && 'opacity-75'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-tight">{hospital.name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{hospital.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {hospital.isVerified ? (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  <Shield className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Unverified
                </Badge>
              )}
              <Badge className={cn('text-xs gap-1 border', freshness.colorClass)}>
                <Clock className="h-3 w-3" />
                {freshness.text}
              </Badge>
              {showDistance && hospital.distance && (
                <Badge variant="outline" className="gap-1">
                  <Navigation className="h-3 w-3" />
                  {hospital.distance.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Bed Availability */}
          <div className="grid grid-cols-3 gap-3">
            <BedIndicator 
              label="ICU" 
              icon={Heart}
              available={hospital.beds?.icu?.available || 0} 
              total={hospital.beds?.icu?.total || 0} 
            />
            <BedIndicator 
              label="General" 
              icon={Bed}
              available={hospital.beds?.general?.available || 0} 
              total={hospital.beds?.general?.total || 0} 
            />
            <BedIndicator 
              label="Ventilator" 
              icon={Wind}
              available={hospital.beds?.ventilator?.available || 0} 
              total={hospital.beds?.ventilator?.total || 0} 
            />
          </div>

          {/* Hospital Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span>{hospital.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>24/7</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              className="flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={() => setIsReserveOpen(true)}
              disabled={!hasAvailability}
            >
              <Zap className="h-4 w-4" />
              Hold Bed (10m)
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={onGetDirections}
              disabled={!hasAvailability}
            >
              <Navigation className="h-4 w-4" />
              Directions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bed Hold Modal */}
      <Dialog open={isReserveOpen} onOpenChange={setIsReserveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-amber-500" />
              Atomic Bed Hold (10-Min Limit)
            </DialogTitle>
            <DialogDescription>
              {hospital.name} — Atomic check prevents double booking during simultaneous emergency requests.
            </DialogDescription>
          </DialogHeader>

          {reservation ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  Bed Hold Reserved!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bed count decremented. Present this code at hospital admission counter:
                </p>
                <div className="p-2.5 rounded-lg bg-background font-mono font-black text-xl text-primary tracking-wider border shadow-xs">
                  {reservation.reservationCode}
                </div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  ⏳ Hold Expires in 10 Minutes (Pending Arrival)
                </div>
              </div>
              <Button className="w-full" onClick={() => setIsReserveOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReserve} className="space-y-4 py-2">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bedType">Select Bed Type</Label>
                <Select value={bedType} onValueChange={setBedType}>
                  <SelectTrigger id="bedType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icu">ICU Bed ({hospital.beds?.icu?.available || 0} available)</SelectItem>
                    <SelectItem value="general">General Bed ({hospital.beds?.general?.available || 0} available)</SelectItem>
                    <SelectItem value="ventilator">Ventilator Bed ({hospital.beds?.ventilator?.available || 0} available)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pname">Patient Name</Label>
                <Input
                  id="pname"
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pphone">Emergency Contact Phone</Label>
                <Input
                  id="pphone"
                  type="tel"
                  placeholder="+91-9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2" disabled={isSubmitting}>
                {isSubmitting ? 'Reserving Bed Atomically...' : 'Confirm 10-Minute Hold'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function BedIndicator({ label, icon: Icon, available, total }) {
  const percentage = total > 0 ? (available / total) * 100 : 0;
  
  let statusColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  if (percentage === 0) {
    statusColor = 'bg-red-500';
    textColor = 'text-red-700';
  } else if (percentage < 30) {
    statusColor = 'bg-amber-500';
    textColor = 'text-amber-700';
  }

  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-xl font-bold', textColor)}>{available}</p>
      <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', statusColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">of {total}</p>
    </div>
  );
}

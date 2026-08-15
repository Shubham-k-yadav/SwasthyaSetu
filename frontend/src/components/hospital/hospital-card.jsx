
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Shield, 
  Navigation,
  Bed,
  Heart,
  Wind
} from 'lucide-react';

import { cn } from '@/lib/utils';








export function HospitalCard({ 
  hospital, 
  onViewDetails, 
  onGetDirections,
  showDistance = false 
}) {
  const totalAvailable = hospital.beds.icu.available + 
                        hospital.beds.general.available + 
                        hospital.beds.ventilator.available;
  
  const hasAvailability = totalAvailable > 0;

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg',
      !hasAvailability && 'opacity-75'
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
            {hospital.isVerified && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
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
            available={hospital.beds.icu.available} 
            total={hospital.beds.icu.total} 
          />
          <BedIndicator 
            label="General" 
            icon={Bed}
            available={hospital.beds.general.available} 
            total={hospital.beds.general.total} 
          />
          <BedIndicator 
            label="Ventilator" 
            icon={Wind}
            available={hospital.beds.ventilator.available} 
            total={hospital.beds.ventilator.total} 
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

        {/* Specialties */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hospital.specialties.slice(0, 4).map((specialty) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {hospital.specialties.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{hospital.specialties.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
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

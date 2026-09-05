import { useState, useEffect } from 'react';
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
  Wind,
  Zap
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { getFreshnessStatus } from '@/lib/freshness';
import { useLanguage } from '@/lib/language-context';
import { BedIndicator } from './BedIndicator';
import { BedHoldModal } from './BedHoldModal';
import { openHospitalDirections } from '@/lib/navigation';

export { BedIndicator };

export function HospitalCard({
  hospital,
  initialBedType = 'icu',
  isSelected = false,
  onViewDetails,
  onGetDirections,
  showDistance = false
}) {
  const { t } = useLanguage();
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [bedType, setBedType] = useState(() => {
    const valid = ['icu', 'general', 'ventilator'];
    const clean = String(initialBedType || '').toLowerCase();
    return valid.includes(clean) ? clean : 'icu';
  });

  useEffect(() => {
    const valid = ['icu', 'general', 'ventilator'];
    const clean = String(initialBedType || '').toLowerCase();
    if (valid.includes(clean)) {
      setBedType(clean);
    }
  }, [initialBedType]);

  const totalAvailable = (hospital.beds?.icu?.available || 0) +
    (hospital.beds?.general?.available || 0) +
    (hospital.beds?.ventilator?.available || 0);

  const hasAvailability = totalAvailable > 0;
  const freshness = getFreshnessStatus(hospital.lastUpdated);

  return (
    <>
      <Card className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border-primary/10',
        isSelected && 'ring-2 ring-red-600 shadow-xl border-red-500/50 bg-red-50/10 dark:bg-red-950/20',
        (!hasAvailability || freshness.isExpired) && 'opacity-75'
      )}>
        <CardHeader 
          className="p-4 sm:p-5 pb-2 sm:pb-3 cursor-pointer group"
          onClick={() => onViewDetails?.(hospital)}
          title="Click to zoom pin on map"
        >
          <div className="flex items-start justify-between gap-2 w-full min-w-0">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold leading-snug group-hover:text-red-600 transition-colors">{hospital.name}</CardTitle>
                {hospital.isVerified ? (
                  <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border-emerald-500/20 font-semibold text-[10px] px-1.5 py-0.2 shrink-0">
                    <Shield className="h-2.5 w-2.5" />
                    {t('verified')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-600 dark:bg-amber-950/40 border-amber-500/20 text-[10px] px-1.5 py-0.2 shrink-0">
                    {t('unverified')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                <span className="truncate block min-w-0">{hospital.address}</span>
              </div>
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 group-hover:underline">
                  <Navigation className="h-2.5 w-2.5" />
                  Zoom Pin on Map 📍
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
              <Badge
                variant="outline"
                className={cn('text-[10px] sm:text-[11px] gap-1 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs', freshness.colorClass)}
              >
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {freshness.text}
              </Badge>
              {showDistance && hospital.distance && (
                <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.5 border-gray-200">
                  <Navigation className="h-2.5 w-2.5 text-blue-500" />
                  {hospital.distance.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3.5 sm:p-5 pt-0 sm:pt-0">
          {/* Bed Availability */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <BedIndicator
              label="ICU"
              icon={Heart}
              available={hospital.beds?.icu?.available || 0}
              total={hospital.beds?.icu?.total || 0}
              isSelected={bedType === 'icu'}
              onClick={() => {
                setBedType('icu');
                setIsReserveOpen(true);
              }}
            />
            <BedIndicator
              label="General"
              icon={Bed}
              available={hospital.beds?.general?.available || 0}
              total={hospital.beds?.general?.total || 0}
              isSelected={bedType === 'general'}
              onClick={() => {
                setBedType('general');
                setIsReserveOpen(true);
              }}
            />
            <BedIndicator
              label="Ventilator"
              icon={Wind}
              available={hospital.beds?.ventilator?.available || 0}
              total={hospital.beds?.ventilator?.total || 0}
              isSelected={bedType === 'ventilator'}
              onClick={() => {
                setBedType('ventilator');
                setIsReserveOpen(true);
              }}
            />
          </div>

          {/* Hospital Contact Info */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1.5 border-t border-gray-100 dark:border-gray-800">
            {hospital.phone ? (
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200 hover:text-red-600 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>{hospital.phone}</span>
              </a>
            ) : (
              <span className="text-gray-400">Phone not listed</span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>24/7 Emergency</span>
            </div>
          </div>

          {/* Actions (2 Buttons Side-by-Side on Mobile & Desktop) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl shadow-xs"
              onClick={() => setIsReserveOpen(true)}
              disabled={!hasAvailability}
            >
              <Zap className="h-3.5 w-3.5" />
              {t('holdBed')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 font-semibold text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl border-gray-300 hover:bg-gray-50 cursor-pointer"
              onClick={onGetDirections || (() => openHospitalDirections(hospital))}
            >
              <Navigation className="h-3.5 w-3.5 text-gray-600" />
              {t('directions')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modular Bed Hold Modal */}
      <BedHoldModal
        open={isReserveOpen}
        onOpenChange={setIsReserveOpen}
        hospital={hospital}
        bedType={bedType}
        setBedType={setBedType}
      />
    </>
  );
}

export default HospitalCard;

import { HospitalMap } from '@/components/maps/hospital-map';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Phone, Shield, Star, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmergencyResultsList({
  results,
  selectedHospital,
  onSelectHospital,
  userLocation,
  ambulances,
  bedType,
  onModifySearch
}) {
  const handleNavigate = (hospital) => {
    if (!hospital.coordinates?.lat || !hospital.coordinates?.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates.lat},${hospital.coordinates.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
        <HospitalMap 
          hospitals={results}
          selectedHospital={selectedHospital}
          onHospitalSelect={onSelectHospital}
          userLocation={userLocation}
          ambulances={ambulances}
        />
      </div>

      {/* Results List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Recommended Hospitals ({results.length})
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onModifySearch}
            className="text-xs gap-1 font-bold text-red-600 hover:bg-red-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Modify Search
          </Button>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {results.map((hospital, index) => (
            <Card 
              key={hospital._id || hospital.id}
              className={cn(
                'transition-all cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden',
                selectedHospital?._id === hospital._id 
                  ? 'ring-2 ring-red-600' 
                  : 'hover:shadow-md'
              )}
              onClick={() => onSelectHospital(hospital)}
            >
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Rank Badge */}
                  <div className={cn(
                    'h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 font-black text-xs sm:text-sm',
                    index === 0 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : 'bg-secondary text-muted-foreground'
                  )}>
                    #{index + 1}
                  </div>

                  {/* Hospital Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-1">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {hospital.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0">
                          <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                          <span className="truncate block min-w-0">{hospital.address}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {hospital.isVerified && (
                          <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.2 font-semibold">
                            <Shield className="h-2.5 w-2.5" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0.2 border-gray-200">
                          <Navigation className="h-2.5 w-2.5 text-blue-500" />
                          {hospital.distance || '2.5'} km
                        </Badge>
                      </div>
                    </div>

                    {/* Bed Availability & Metrics */}
                    <div className="flex items-center gap-3 sm:gap-6 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-left">
                        <p className="text-base sm:text-lg font-black text-emerald-600 leading-tight">
                          {hospital.beds?.[bedType]?.available || 0}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                          {bedType.toUpperCase()} Beds
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                          {hospital.score || 95}%
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">AI Match</p>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-xs sm:text-sm">{hospital.rating || '4.8'}</span>
                      </div>
                    </div>

                    {/* Actions - 2 buttons side by side */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl font-bold text-xs gap-1 border-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${hospital.phone || '102'}`, '_self');
                        }}
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        Call Hospital
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-9 rounded-xl font-bold text-xs gap-1 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(hospital);
                        }}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={onModifySearch}
        className="w-full sm:w-auto h-11 rounded-xl font-bold gap-2 text-xs sm:text-sm border-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Search Form
      </Button>
    </div>
  );
}

export default EmergencyResultsList;

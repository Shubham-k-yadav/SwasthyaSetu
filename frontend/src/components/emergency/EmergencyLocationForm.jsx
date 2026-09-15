import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export function EmergencyLocationForm({
  userLocation,
  locationAddress,
  setLocationAddress,
  gettingLocation,
  onGetLocation
}) {
  const { t } = useLanguage();

  return (
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
          <MapPin className="h-5 w-5 text-red-600" />
          {t('yourLocation')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('locationDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5">
        <Button 
          onClick={onGetLocation} 
          variant="outline" 
          className="w-full h-11 rounded-xl font-bold gap-2 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 text-xs sm:text-sm shadow-xs cursor-pointer"
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          ) : (
            <Navigation className="h-4 w-4 text-red-600" />
          )}
          {gettingLocation ? t('detectingLocation') : t('useCurrentLocation')}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-[10px] sm:text-xs uppercase font-semibold">
            <span className="bg-card px-2 text-muted-foreground">{t('orEnterManually')}</span>
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="text-xs font-semibold">{t('addressLandmark')}</Label>
          <Input 
            id="address"
            placeholder={t('addressPlaceholder')}
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
          />
        </div>

        {userLocation && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t('gpsDetectedSuccess')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmergencyLocationForm;

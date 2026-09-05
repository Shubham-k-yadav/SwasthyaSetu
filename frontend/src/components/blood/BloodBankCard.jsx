import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFreshnessStatus } from '@/lib/freshness';

export function BloodBankCard({ bank }) {
  const freshness = getFreshnessStatus(bank.lastUpdated);

  return (
    <Card className={cn(freshness.isExpired && 'opacity-75')}>
      <CardHeader className="p-3.5 sm:p-6 pb-3">
        <div className="flex items-start justify-between gap-2 w-full min-w-0">
          <div className="space-y-1 flex-1 min-w-0 pr-1">
            <CardTitle className="text-base sm:text-lg font-bold leading-snug line-clamp-1">
              {bank.hospitalName}
            </CardTitle>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate block min-w-0">{bank.address}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
            <Badge 
              variant="outline"
              className={cn('text-[10px] sm:text-xs gap-1 border whitespace-nowrap shrink-0', freshness.colorClass)}
            >
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {freshness.text}
            </Badge>
            {bank.distance && (
              <Badge variant="outline" className="text-[10px] sm:text-xs">{bank.distance} km</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-3.5 sm:p-6 pt-0 sm:pt-0">
        {/* Blood Stock Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {bank.bloodStock.map(stock => (
            <div 
              key={stock.bloodGroup}
              className={cn(
                'text-center p-1.5 sm:p-2 rounded-lg border',
                stock.isLow 
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/40' 
                  : stock.unitsAvailable > 15 
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40'
              )}
            >
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{stock.bloodGroup}</p>
              <p className={cn(
                'text-base sm:text-lg font-bold',
                stock.isLow 
                  ? 'text-red-600 dark:text-red-400' 
                  : stock.unitsAvailable > 15 
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
              )}>
                {stock.unitsAvailable}
              </p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">units</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => window.open(`tel:${bank.phone}`, '_self')}
          >
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => {
              const query = encodeURIComponent(bank.hospitalName + ' ' + bank.city);
              window.open(`https://www.google.com/maps/search/${query}`, '_blank');
            }}
          >
            <MapPin className="h-4 w-4" />
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BloodBankCard;

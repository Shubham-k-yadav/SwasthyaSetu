import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmergencyDetailsForm({
  emergencyType,
  setEmergencyType,
  bedType,
  setBedType,
  contactPhone,
  setContactPhone,
  patientName,
  setPatientName,
  loading,
  onSubmit,
  emergencyTypes = [],
  bedTypes = []
}) {
  return (
    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Emergency Details
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Help us find the right hospital and equipment for your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3.5">
        <div>
          <Label className="text-xs font-semibold">Emergency Type</Label>
          <Select value={emergencyType} onValueChange={setEmergencyType}>
            <SelectTrigger className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm">
              <SelectValue placeholder="Select emergency type" />
            </SelectTrigger>
            <SelectContent>
              {emergencyTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold">Required Bed Type</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:gap-3">
            {bedTypes.map(type => {
              const isSelected = bedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setBedType(type.value)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border p-2 sm:p-3 cursor-pointer transition-all text-center select-none',
                    isSelected 
                      ? 'border-red-600 bg-red-50/90 dark:bg-red-950/40 text-red-600 font-bold shadow-xs ring-1 ring-red-600' 
                      : 'hover:bg-muted/50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                  )}
                >
                  <span className="text-xs sm:text-sm font-bold leading-tight">{type.label}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">{type.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="contactPhone" className="text-xs font-semibold">Contact Phone *</Label>
            <Input 
              id="contactPhone"
              type="tel"
              placeholder="+91..."
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="patientName" className="text-xs font-semibold">Patient Name (Optional)</Label>
            <Input 
              id="patientName"
              placeholder="Patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        <Button 
          onClick={onSubmit} 
          className="w-full h-11 sm:h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md gap-2 text-sm sm:text-base mt-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {loading ? 'Searching Hospitals...' : 'Find Emergency Beds'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default EmergencyDetailsForm;

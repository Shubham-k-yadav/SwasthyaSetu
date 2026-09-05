import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Clock, CheckCircle2 } from 'lucide-react';
import { DonorRegistrationModal } from './DonorRegistrationModal';

export function DonateInfoCards({
  registerOpen,
  setRegisterOpen,
  bloodGroups,
  cities
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Why Donate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Why Donate Blood?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Save Lives</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                One donation can save up to 3 lives
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Quick Process</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                The entire process takes only 30-45 minutes
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Health Benefits</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Free health checkup and reduced heart disease risk
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle>Eligibility Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Age between 18-65 years
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Weight at least 50 kg
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Hemoglobin level above 12.5 g/dL
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              No major illness in last 6 months
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              56 days gap from last donation
            </li>
          </ul>
          
          <DonorRegistrationModal
            open={registerOpen}
            onOpenChange={setRegisterOpen}
            bloodGroups={bloodGroups}
            cities={cities}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default DonateInfoCards;

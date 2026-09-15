import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Clock, CheckCircle2 } from 'lucide-react';
import { DonorRegistrationModal } from './DonorRegistrationModal';
import { useLanguage } from '@/lib/language-context';

export function DonateInfoCards({
  registerOpen,
  setRegisterOpen,
  bloodGroups,
  cities
}) {
  const { t } = useLanguage();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Why Donate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {t('whyDonateBlood')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('saveLives')}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('saveLivesDesc')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('quickProcess')}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('quickProcessDesc')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{t('healthBenefits')}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('healthBenefitsDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle>{t('eligibilityCriteria')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('eligibilityAge')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('eligibilityWeight')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('eligibilityHemoglobin')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('eligibilityIllness')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t('eligibilityGap')}
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

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, CheckCircle2, QrCode, Search } from 'lucide-react';
import { DonorRegistrationModal } from './DonorRegistrationModal';
import { useLanguage } from '@/lib/language-context';

export function DonateInfoCards({
  registerOpen,
  setRegisterOpen,
  bloodGroups,
  cities
}) {
  const { t } = useLanguage();
  const [modalMode, setModalMode] = useState('register');
  const [savedDonor, setSavedDonor] = useState(null);

  // Check if a donor pass is saved on this device
  useEffect(() => {
    try {
      const stored = localStorage.getItem('swasthya_setu_donor_card');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.donorCardId || parsed.phone)) {
          setSavedDonor(parsed);
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [registerOpen]);

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

          {/* Quick Access to Saved Pass if exists */}
          {savedDonor && (
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/20 border border-red-200 dark:border-red-900/60 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-foreground truncate">{savedDonor.name}</h5>
                      <Badge className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0 shrink-0">
                        {savedDonor.bloodGroup}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      Pass ID: {savedDonor.donorCardId}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 font-semibold shrink-0">
                  Ready on Device
                </Badge>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setModalMode('pass');
                  setRegisterOpen(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 cursor-pointer shadow-xs gap-1.5"
              >
                <QrCode className="h-3.5 w-3.5" />
                View & Download QR Pass (PDF)
              </Button>
            </div>
          )}
          
          <DonorRegistrationModal
            open={registerOpen}
            onOpenChange={(val) => {
              if (!val) setModalMode('register');
              setRegisterOpen(val);
            }}
            bloodGroups={bloodGroups}
            cities={cities}
            initialMode={modalMode}
          />

          {/* Retrieve Pass Quick Link */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setModalMode('retrieve');
                setRegisterOpen(true);
              }}
              className="text-xs text-muted-foreground hover:text-red-600 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Search className="h-3 w-3" />
              Already registered? Find & Download Your QR Pass
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DonateInfoCards;

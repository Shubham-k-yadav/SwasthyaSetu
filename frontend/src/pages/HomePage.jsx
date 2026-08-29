import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { systemApi } from '@/lib/api';
import {
  Activity,
  Search,
  Droplets,
  Shield,
  Clock,
  MapPin,
  Users,
  Phone,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export default function HomePage() {
  const { t } = useLanguage();
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    systemApi.getSystemStatus()
      .then(res => setSystemStatus(res))
      .catch(() => setSystemStatus({ verifiedHospitalsCount: 0, verifiedBloodBanksCount: 0, verifiedAmbulancesCount: 0 }));
  }, []);

  const hospCount = systemStatus?.verifiedHospitalsCount || 0;
  const bloodCount = systemStatus?.verifiedBloodBanksCount || 0;
  const ambCount = systemStatus?.verifiedAmbulancesCount || 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PlatformStatusBanner />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                {t('liveUpdatesIndia')}
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {t('heroTitleMain')}
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('heroSubtitle')}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/emergency">
                  <Button size="lg" className="gap-2 text-base px-8 font-semibold">
                    <Phone className="h-5 w-5" />
                    {t('findEmergencyBed')}
                  </Button>
                </Link>
                <Link to="/blood">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 font-semibold">
                    <Droplets className="h-5 w-5" />
                    {t('findBlood')}
                  </Button>
                </Link>
              </div>

              {/* Quick Stats (Dynamic Live Counts) */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">{hospCount}</p>
                  <p className="text-sm text-muted-foreground">{t('navHospitals')}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">{bloodCount}</p>
                  <p className="text-sm text-muted-foreground">{t('bloodUnitsStock')}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm col-span-2 md:col-span-1">
                  <p className="text-3xl font-bold text-primary">{ambCount}</p>
                  <p className="text-sm text-muted-foreground">Active Ambulances</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('problemWeSolveTitle')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('problemWeSolveDesc')}
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('goldenHourLost')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('goldenHourDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('noCentralSystem')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('noCentralDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Droplets className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('bloodShortage')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('bloodShortageDesc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('howItHelps')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('howItHelpsDesc')}
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('smartSearch')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('smartSearchDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('realTimeUpdates')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('realTimeUpdatesDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('blockchainVerifiedTitle')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('blockchainVerifiedDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('routeOptimization')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('routeOptimizationDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('donorNetwork')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('donorNetworkDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('panIndiaCoverage')}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('panIndiaCoverageDesc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('howItWorks')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('howItWorksDesc')}
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('shareLocation')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('shareLocationDesc')}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block absolute top-7 left-[70px] w-[calc(100%-70px)] border-t-2 border-dashed border-primary/30"></div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('selectEmergencyType')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('selectEmergencyTypeDesc')}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block absolute top-7 left-[70px] w-[calc(100%-70px)] border-t-2 border-dashed border-primary/30"></div>
              </div>

              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('getRecommendations')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('getRecommendationsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-20">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-4xl">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2">
                    <div className="p-8 md:p-10 bg-primary text-primary-foreground">
                      <Shield className="h-12 w-12 mb-6" />
                      <h3 className="text-2xl font-bold">{t('blockchainVerifiedTitle')}</h3>
                      <p className="mt-4 text-primary-foreground/80">
                        {t('blockchainVerifiedDesc')}
                      </p>
                      <ul className="mt-6 space-y-3">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Polygon Blockchain</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Tamper-proof Audit</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-8 md:p-10">
                      <Activity className="h-12 w-12 mb-6 text-primary" />
                      <h3 className="text-2xl font-bold">{t('smartSearch')}</h3>
                      <p className="mt-4 text-muted-foreground">
                        {t('smartSearchDesc')}
                      </p>
                      <ul className="mt-6 space-y-3 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>{t('routeOptimization')}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>{t('realTimeUpdates')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('everySecondCounts')}
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                {t('everySecondCountsDesc')}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/emergency">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8 font-semibold">
                    <Search className="h-5 w-5" />
                    {t('searchNow')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/blood">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold">
                    <Droplets className="h-5 w-5" />
                    {t('registerAsDonor')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

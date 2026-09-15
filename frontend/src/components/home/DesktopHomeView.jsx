import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/lib/language-context';
import {
  Search,
  Droplets,
  Clock,
  MapPin,
  Users,
  Phone,
  ArrowRight,
  Zap,
  Globe,
  Siren,
  Building2,
  Bed,
  Check,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Headphones
} from 'lucide-react';

export function DesktopHomeView({ hospCount = 0, bloodCount = 0, ambCount = 0 }) {
  const { t } = useLanguage();

  return (
    <div className="hidden lg:block">
      {/* 1. Desktop Hero Section */}
      <section className="bg-[#fdecec] dark:bg-background relative overflow-hidden w-full py-0 my-0 flex flex-col lg:flex-row items-stretch justify-between min-h-[500px]">
        {/* Left Part: Text Content & Action Buttons (50% Width) */}
        <div className="w-full lg:w-1/2 px-6 sm:px-12 lg:pl-50 lg:pr-10 py-10 sm:py-16 space-y-6 text-left flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white dark:bg-card px-4 py-1.5 text-xs font-bold text-red-600 shadow-xs w-fit">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            {t('liveUpdatesIndia')}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
            {t('heroTitlePart1')}<br />
            {t('heroTitlePart2')}<br />
            <span className="text-red-600">{t('heroTitlePart3')}</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl font-medium leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/hospitals">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-6 text-sm sm:text-base rounded-xl shadow-lg shadow-red-600/20 transition-transform hover:scale-[1.02] whitespace-nowrap cursor-pointer">
                <Bed className="h-5 w-5" />
                {t('findEmergencyBed')}
              </Button>
            </Link>

            <Link to="/blood">
              <Button size="lg" variant="outline" className="gap-2 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-6 py-6 text-sm sm:text-base rounded-xl bg-white whitespace-nowrap cursor-pointer">
                <Droplets className="h-5 w-5 text-red-600" />
                {t('findBlood')}
              </Button>
            </Link>

            <Link to="/emergency">
              <Button size="lg" variant="outline" className="gap-2 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-6 py-6 text-sm sm:text-base rounded-xl bg-white whitespace-nowrap cursor-pointer">
                <Siren className="h-5 w-5 text-red-600" />
                {t('requestAmbulance')}
              </Button>
            </Link>
          </div>

          {/* Hero Trust Badges */}
          <div className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 pt-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> {t('verifiedHospitals')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> {t('realTimeUpdatesBadge')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> {t('support24x7Badge')}
            </span>
          </div>
        </div>

        {/* Right Part: Full Image Block (50% Width) */}
        <div className="w-full lg:w-1/2 relative flex items-center justify-end overflow-hidden self-stretch min-h-[420px] lg:min-h-full">
          <img
            src="/000.png"
            alt="SwasthyaSetu Emergency Healthcare Platform"
            className="w-full h-full object-cover object-left block"
          />
        </div>
      </section>

      {/* 2. Desktop Floating Quick Stats Banner */}
      <section className="relative z-10 -mt-10 sm:-mt-12 container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{hospCount}+</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500">{t('hospitalsBeds')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Droplets className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{bloodCount}+</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500">{t('bloodBanksAvailable')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{ambCount}+</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500">{t('activeAmbulances')}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">24/7</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500">{t('emergencySupport')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Problem We Solve */}
      <section className="py-16 sm:py-20 bg-white dark:bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('problemWeSolveTitle')}
            </h2>
            <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3 shadow-sm"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              {t('problemWeSolveDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('goldenHourLost')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('goldenHourDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('noCentralSystem')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('noCentralDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Droplets className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('bloodShortage')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('bloodShortageDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. How SwasthyaSetu Helps */}
      <section className="py-16 sm:py-20 bg-gray-50/50 dark:bg-card/50 border-y border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('howItHelps')}
            </h2>
            <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3 shadow-sm"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
              {t('howItHelpsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Search className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('smartMatching')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('smartMatchingDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('realTimeUpdatesCard')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('realTimeUpdatesCardDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('adminVerified')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('adminVerifiedDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('routeOptimization')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('routeOptimizationDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('donorNetwork')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('donorNetworkDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('panIndiaCoverage')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('panIndiaCoverageDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('supportRoundClock')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('supportRoundClockDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{t('adminVerified')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      {t('adminVerifiedDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="py-16 sm:py-20 bg-white dark:bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('howItWorks')}
            </h2>
            <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3 shadow-sm"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
              {t('howItWorksDesc')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 relative">
            <div className="flex flex-col items-center text-center max-w-xs z-10 space-y-4">
              <div className="flex items-center justify-center relative">
                <div className="h-16 w-16 rounded-full bg-red-600 text-white font-extrabold text-xl flex items-center justify-center z-10 shadow-lg">
                  1
                </div>
                <div className="h-24 w-24 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-6 pl-2">
                  <MapPin className="h-10 w-10 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                {t('shareLocationStep')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                {t('shareLocationStepDesc')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center max-w-xs z-10 space-y-4">
              <div className="flex items-center justify-center relative">
                <div className="h-16 w-16 rounded-full bg-red-600 text-white font-extrabold text-xl flex items-center justify-center z-10 shadow-lg">
                  2
                </div>
                <div className="h-24 w-24 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-6 pl-2">
                  <Bed className="h-10 w-10 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                {t('selectEmergencyStep')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                {t('selectEmergencyStepDesc')}
              </p>
            </div>

            <div className="flex flex-col items-center text-center max-w-xs z-10 space-y-4">
              <div className="flex items-center justify-center relative">
                <div className="h-16 w-16 rounded-full bg-red-600 text-white font-extrabold text-xl flex items-center justify-center z-10 shadow-lg">
                  3
                </div>
                <div className="h-24 w-24 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-6 pl-2">
                  <Check className="h-10 w-10 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                {t('getRecommendationsStep')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                {t('getRecommendationsStepDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Desktop Dual Feature Showcase */}
      <section className="py-16 sm:py-20 bg-gray-50/50 dark:bg-card/50 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="bg-red-600 text-white p-8 sm:p-12 rounded-3xl flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-12 w-12 text-white" />
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('adminVerified')}</h3>
                </div>
                <p className="text-sm sm:text-base text-red-100 font-medium leading-relaxed">
                  {t('adminVerifiedDesc')}
                </p>
                <ul className="space-y-3 text-sm font-semibold pt-4">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 rounded-full bg-white/20 p-1" /> {t('superAdminVerified')}
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 rounded-full bg-white/20 p-1" /> {t('certifiedWardInventory')}
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 p-8 sm:p-12 rounded-3xl flex items-center justify-between shadow-xs">
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('smartMatchingEngine')}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {t('smartMatchingDesc')}
                </p>
                <ul className="space-y-2 text-sm font-semibold text-gray-600 dark:text-gray-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600" /> {t('routeOptimization')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600" /> {t('realTimeUpdatesCard')}
                  </li>
                </ul>
              </div>

              <div>
                <img src="/Gemini_Generated_Image_f3errcf3errcf3er.png" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Desktop CTA Section */}
      <section className="relative w-full overflow-hidden text-white my-6">
        <div className="relative w-full">
          <img
            src="/Gemini_Generated_Image_j1dahej1dahej1da.png"
            alt="SwasthyaSetu Emergency Network"
            className="w-full h-auto block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60"></div>

          <div className="absolute inset-0 container mx-auto px-4 sm:px-8 max-w-[1440px] flex items-center justify-end gap-4 sm:gap-8 z-10">
            <div className="space-y-1 sm:space-y-2 text-right sm:text-left max-w-xs sm:max-w-md lg:max-w-lg">
              <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md">
                {t('everySecondCounts')}
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-100 font-medium leading-tight sm:leading-relaxed drop-shadow-sm hidden sm:block">
                {t('everySecondCountsDesc')}
              </p>
            </div>

            <Link to="/emergency">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black px-4 sm:px-8 py-3 sm:py-6 text-xs sm:text-base rounded-xl shadow-2xl transition-transform hover:scale-[1.03] shrink-0 border border-red-500 cursor-pointer">
                {t('searchNow')}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';
import {
  Search,
  Droplets,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Zap,
  Siren,
  Building2,
  Bed,
  Check,
  ShieldCheck,
  CheckCircle,
  Headphones,
  PhoneMissed
} from 'lucide-react';

export function MobileHomeView({ hospCount = 0, bloodCount = 0, ambCount = 0 }) {
  const { t } = useLanguage();
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const problemItems = [
    {
      title: t('goldenHourLost'),
      desc: t('goldenHourDesc'),
      icon: Clock,
    },
    {
      title: t('noCentralSystem'),
      desc: t('noCentralDesc'),
      icon: PhoneMissed,
    },
    {
      title: t('bloodShortage'),
      desc: t('bloodShortageDesc'),
      icon: Droplets,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveProblemIndex((prev) => (prev + 1) % problemItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [problemItems.length]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      setActiveProblemIndex((prev) => (prev + 1) % problemItems.length);
    } else if (distance < -minSwipeDistance) {
      setActiveProblemIndex((prev) => (prev - 1 + problemItems.length) % problemItems.length);
    }
  };

  return (
    <div className="block md:hidden">
      {/* Mobile Hero Section */}
      <section className="bg-dark:bg-background relative overflow-hidden w-full pb-4">
        <div className="w-full relative z-10 space-y-3">

          {/* Row 1: Side-by-Side Text (Left) & Image (Right) */}
          <div className="flex items-stretch justify-between gap-2 w-full pl-4 pr-0">
            {/* Left Text */}
            <div className="w-[54%] space-y-1.5 text-left shrink-0 pt-3 sm:pt-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 dark:bg-card px-2.5 py-0.5 text-[9px] font-semibold w-fit">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                </span>
                {t('liveUpdatesIndia')}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                {t('heroTitlePart1')}<br />
                {t('heroTitlePart2')}{' '}
                <span className="text-red-600">{t('heroTitlePart3')}</span>
              </h1>

              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium leading-normal">
                {t('heroSubtitle')}
              </p>
            </div>

            {/* Right Image Graphic */}
            <div className="w-[46%] relative flex items-stretch justify-end shrink-0 overflow-hidden pt-0 self-stretch">
              <img
                src="/image.png"
                alt="SwasthyaSetu Emergency Healthcare Network"
                className="w-full h-full min-h-[160px] object-cover object-left block ml-auto"
              />
            </div>
          </div>

          {/* Row 2: Full Width Mobile Action Buttons */}
          <div className="px-4 pt-1">
            <div className="flex items-center gap-2 w-full">
              <Link to="/hospitals" className="flex-1">
                <Button size="sm" className="w-full gap-1 bg-red-600 hover:bg-red-700 text-white font-bold h-10 text-xs rounded-full shadow-md shadow-red-600/25 px-2 whitespace-nowrap cursor-pointer">
                  <Bed className="h-4 w-4 shrink-0" />
                  {t('findBed')}
                </Button>
              </Link>

              <Link to="/blood" className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1 border-gray-200 text-gray-900 dark:text-gray-100 font-bold h-10 text-[11px] rounded-full bg-white shadow-xs px-2 whitespace-nowrap cursor-pointer">
                  <Droplets className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  {t('findBlood')}
                </Button>
              </Link>

              <Link to="/emergency" className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1 border-gray-200 text-gray-900 dark:text-gray-100 font-bold h-10 text-[11px] rounded-full bg-white shadow-xs px-2 whitespace-nowrap cursor-pointer">
                  <Siren className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  {t('ambulance')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Trust Badges */}
          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 dark:text-gray-400 pt-2 px-4 border-t border-red-100/60 dark:border-gray-800">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> {t('verifiedHospitals')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> {t('realTimeUpdatesBadge')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> {t('support24x7Badge')}
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Floating Quick Stats */}
      <section className="py-3 px-4">
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-gray-800 shadow-md rounded-2xl p-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Building2 className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold ">{hospCount}+</p>
                <p className="text-[8px] font-bold text-gray-500 leading-tight">{t('hospitalsBeds')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Droplets className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold ">{bloodCount}+</p>
                <p className="text-[8px] font-bold text-gray-500 leading-tight">{t('bloodBanksAvailable')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Siren className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold ">{ambCount}+</p>
                <p className="text-[8px] font-bold text-gray-500 leading-tight">{t('activeAmbulances')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-bold ">24/7</p>
                <p className="text-[8px] font-bold text-gray-500 leading-tight">{t('emergencySupport')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Problem We Solve */}
      <section className="py-6 px-4 bg-white dark:bg-background">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('problemWeSolveTitle')}</h2>
          <div className="h-1 w-12 bg-red-600 rounded-full mx-auto mt-1"></div>
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed max-w-xs mx-auto">
            {t('problemWeSolveShortDesc')}
          </p>
        </div>

        {/* Auto-sliding Carousel */}
        <div 
          className="relative overflow-hidden w-full select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeProblemIndex * 100}%)` }}
          >
            {problemItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="w-full shrink-0 px-0.5">
                  <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-none rounded-3xl py-0">
                    <CardContent className="px-3 p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">{item.title}</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {problemItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveProblemIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                activeProblemIndex === idx 
                  ? "w-6 bg-red-600" 
                  : "w-1.5 bg-red-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </section>

      {/* Mobile How SwasthyaSetu Helps */}
      <section className="py-6 px-4 bg-slate-50/50 dark:bg-card/30">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('howItHelps')}</h2>
          <div className="h-1 w-12 bg-red-600 rounded-full mx-auto mt-1"></div>
          <p className="mt-1 text-[11px] text-gray-500">
            {t('howItHelpsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {[
            { title: t('smartMatching'), desc: t('smartMatchingDesc'), icon: Search },
            { title: t('realTimeUpdatesCard'), desc: t('realTimeUpdatesCardDesc'), icon: Zap },
            { title: t('adminVerified'), desc: t('adminVerifiedDesc'), icon: ShieldCheck },
            { title: t('routeOptimization'), desc: t('routeOptimizationDesc'), icon: MapPin },
            { title: t('donorNetwork'), desc: t('donorNetworkDesc'), icon: Users },
            { title: t('supportRoundClock'), desc: t('supportRoundClockDesc'), icon: Headphones }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="bg-white dark:bg-card border-gray-100 dark:border-gray-800 shadow-xs rounded-xl py-0 h-20 justify-center">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Mobile How It Works Section */}
      <section className="py-6 px-4 bg-white dark:bg-background">
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('howItWorks')}</h2>
          <div className="h-1 w-12 bg-red-600 rounded-full mx-auto mt-1"></div>
          <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
            {t('howItWorksDesc')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
            <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">{t('shareLocationStep')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {t('shareLocationStepDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
            <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">{t('selectEmergencyStep')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {t('selectEmergencyStepDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
            <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">{t('getRecommendationsStep')}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {t('getRecommendationsStepDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Dual Feature Showcase */}
      <section className="py-4 px-4 bg-white dark:bg-background space-y-3">
        {/* Admin Verified Card */}
        <div className="bg-red-600 text-white p-5 rounded-2xl space-y-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-white shrink-0" />
            <h3 className="text-base font-bold tracking-tight">{t('adminVerified')}</h3>
          </div>
          <p className="text-xs text-red-100 font-medium leading-relaxed">
            {t('adminVerifiedDesc')}
          </p>
          <ul className="space-y-1.5 text-[11px] font-bold pt-1">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 rounded-full bg-white/20 p-0.5 shrink-0" /> {t('superAdminVerified')}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 rounded-full bg-white/20 p-0.5 shrink-0" /> {t('certifiedWardInventory')}
            </li>
          </ul>
        </div>

        {/* Smart Search Card */}
        <div className="bg-slate-50 dark:bg-card border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('smartMatchingEngine')}</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t('smartMatchingDesc')}
          </p>
          <ul className="space-y-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-red-600 shrink-0" /> {t('routeOptimization')}
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-red-600 shrink-0" /> {t('realTimeUpdatesCard')}
            </li>
          </ul>
        </div>
      </section>

      {/* Mobile Emergency CTA Banner */}
      <section className="py-4 px-4">
        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-5 shadow-lg text-center space-y-3 relative overflow-hidden">
          <h2 className="text-lg font-bold tracking-tight leading-tight">
            {t('everySecondCounts')}
          </h2>
          <p className="text-xs text-red-100 font-medium leading-relaxed">
            {t('everySecondCountsDesc')}
          </p>
          <Link to="/emergency" className="block pt-1">
            <Button size="lg" className="w-full bg-white hover:bg-gray-100 text-red-600 font-bold h-11 text-xs rounded-xl shadow-md gap-1.5 cursor-pointer">
              {t('searchNow')}
              <ArrowRight className="h-4 w-4 text-red-600" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

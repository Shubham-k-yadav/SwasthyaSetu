import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { systemApi } from '@/lib/api';
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
  CheckCircle,
  CheckCircle2,
  Headphones,
  PhoneMissed
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

  const hospCount = Math.max(3, systemStatus?.verifiedHospitalsCount || 0);
  const bloodCount = Math.max(1, systemStatus?.verifiedBloodBanksCount || 0);
  const ambCount = Math.max(1, systemStatus?.verifiedAmbulancesCount || 0);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background">
      <Header />
      <PlatformStatusBanner />

      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">

        {/* ------------------------------------------------------------- */}
        {/* MOBILE SCREEN ONLY HERO & MOCKUP UI (< 768px / md:hidden)     */}
        {/* ------------------------------------------------------------- */}
        <div className="block md:hidden">
          {/* Mobile Hero Section (2-Row Layout: Top Side-by-Side Text & Image, Bottom Full-Width Action Buttons & Badges) */}
          <section className="dark:bg-background relative overflow-hidden w-full  pb-4">
            <div className="w-full relative z-10 space-y-3">

              {/* Row 1: Side-by-Side Text (Left) & Image (Right) */}
              <div className="flex items-stretch justify-between gap-2 w-full pl-4 pr-0">
                {/* Left Text */}
                <div className="w-[54%] space-y-1.5 text-left shrink-0 pt-3 sm:pt-4">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 dark:bg-card px-2.5 py-0.5 text-[9px] font-bold text-red-600 shadow-xs w-fit">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                    </span>
                    Live Updates Across India
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                    Find Emergency<br />
                    Beds in <span className="text-red-600">Real-Time</span>
                  </h1>

                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium leading-normal">
                    Real-time emergency healthcare network connecting verified hospitals & live ambulance dispatch.
                  </p>
                </div>

                {/* Right Image Graphic (Large & Glued 100% to Right Edge on small 330px screens) */}
                <div className="w-[46%] relative flex items-stretch justify-end shrink-0 overflow-hidden pt-0 self-stretch">
                  <img
                    src="/image.png"
                    alt="SwasthyaSetu Emergency Healthcare Network"
                    className="w-full h-full min-h-[160px] object-cover object-left block ml-auto"
                  />
                </div>
              </div>

              {/* Row 2: Full Width Mobile Action Buttons (Spanning 100% Screen Width) */}
              <div className="px-4 pt-1">
                <div className="flex items-center gap-2 w-full">
                  <Link to="/emergency" className="flex-1">
                    <Button size="sm" className="w-full gap-1 bg-red-600 hover:bg-red-700 text-white font-bold h-10 text-xs rounded-xl shadow-md shadow-red-600/25 px-2 whitespace-nowrap">
                      <Bed className="h-4 w-4 shrink-0" />
                      Find Bed
                    </Button>
                  </Link>

                  <Link to="/blood" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1 border-gray-200 text-gray-900 dark:text-gray-100 font-bold h-10 text-[11px] rounded-xl bg-white shadow-xs px-2 whitespace-nowrap">
                      <Droplets className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      Find Blood
                    </Button>
                  </Link>

                  <Link to="/hospitals" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-1 border-gray-200 text-gray-900 dark:text-gray-100 font-bold h-10 text-[11px] rounded-xl bg-white shadow-xs px-2 whitespace-nowrap">
                      <Siren className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      Ambulance
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mobile Trust Badges (Full Width Row) */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 dark:text-gray-400 pt-2 px-4 border-t border-red-100/60 dark:border-gray-800">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> Verified Hospitals
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> Real-time Updates
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-600 fill-emerald-100 shrink-0" /> 24x7 Support
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
                    <p className="text-base font-black ">{hospCount}+</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Hospitals & Beds</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Droplets className="h-4.5 w-4.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-base font-black ">{bloodCount}+</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Blood Units Available</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Siren className="h-4.5 w-4.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-base font-black ">{ambCount}+</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Active Ambulances</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-base font-black ">24/7</p>
                    <p className="text-[9px] font-bold text-gray-500 leading-tight">Emergency Support</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Problem We Solve */}
          <section className="py-6 px-4 bg-white dark:bg-background">
            <div className="text-center mb-4">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">The Problem We Solve</h2>
              <div className="h-1 w-12 bg-red-600 rounded-full mx-auto mt-1"></div>
              <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed max-w-xs mx-auto">
                During medical emergencies in India, families waste precious time calling hospitals.
              </p>
            </div>

            <div className="space-y-2.5">
              <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-100 shadow-none rounded-xl">
                <CardContent className="p-3 flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Golden Hour Lost</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Trauma patients have 60 minutes for life-saving intervention.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-100 shadow-none rounded-xl">
                <CardContent className="p-3 flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <PhoneMissed className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">No Central System</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Families call 10-15 hospitals during emergencies.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-100 shadow-none rounded-xl">
                <CardContent className="p-3 flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Droplets className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Blood Shortage</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      India faces a shortage of 1.5 million blood units annually.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Mobile How SwasthyaSetu Helps */}
          <section className="py-6 px-4 bg-slate-50/50 dark:bg-card/30">
            <div className="text-center mb-4">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">How SwasthyaSetu Helps</h2>
              <p className="mt-1 text-[11px] text-gray-500">
                A comprehensive platform connecting patients, hospitals, and donors in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'Smart Search', desc: 'AI-powered search finds the best hospital based on location and bed type.', icon: Search },
                { title: 'Real-Time Updates', desc: 'Live bed and blood availability updates from verified hospitals.', icon: Zap },
                { title: 'Blockchain Verified', desc: 'Hospital data verified on Polygon blockchain. Tamper-proof.', icon: ShieldCheck },
                { title: 'Route Optimization', desc: 'Get the fastest route to your chosen hospital with integrated maps.', icon: MapPin },
                { title: 'Donor Network', desc: 'Connect with registered blood donors in your area during emergencies.', icon: Users },
                { title: '24x7 Support', desc: 'Emergency support team available round the clock to assist you.', icon: Headphones }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card key={idx} className="bg-white dark:bg-card border-gray-100 shadow-xs rounded-xl">
                    <CardContent className="p-3 flex items-start gap-2.5">
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
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">How It Works</h2>
              <div className="h-1 w-12 bg-red-600 rounded-full mx-auto mt-1"></div>
              <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
                Get connected to the right hospital in three simple steps.
              </p>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white">Share Location</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Allow location access or enter your address manually.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white">Select Emergency Type</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Choose emergency type and required bed type (ICU, General, Ventilator).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 bg-red-50/40 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="h-8 w-8 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white">Get Recommendations</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    View top hospitals sorted by distance and availability with routes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Dual Feature Showcase (Blockchain Verified & Smart Search) */}
          <section className="py-4 px-4 bg-white dark:bg-background space-y-3">
            {/* Blockchain Verified Card */}
            <div className="bg-red-600 text-white p-5 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-7 w-7 text-white shrink-0" />
                <h3 className="text-lg font-extrabold tracking-tight">Blockchain Verified</h3>
              </div>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
              </p>
              <ul className="space-y-1.5 text-[11px] font-bold pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 rounded-full bg-white/20 p-0.5 shrink-0" /> Polygon Blockchain
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 rounded-full bg-white/20 p-0.5 shrink-0" /> Tamper-proof Audit
                </li>
              </ul>
            </div>

            {/* Smart Search Card */}
            <div className="bg-slate-50 dark:bg-card border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Smart Search</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                AI-powered search finds the best hospital based on location, bed type, and availability.
              </p>
              <ul className="space-y-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-red-600 shrink-0" /> Route Optimization
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-red-600 shrink-0" /> Real-Time Updates
                </li>
              </ul>
            </div>
          </section>

          {/* Mobile Emergency CTA Banner */}
          <section className="py-4 px-4">
            <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-5 shadow-lg text-center space-y-3 relative overflow-hidden">
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Every Second Counts in an Emergency
              </h2>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                Do not waste time calling hospitals. Find available beds instantly with SwasthyaSetu.
              </p>
              <Link to="/emergency" className="block pt-1">
                <Button size="lg" className="w-full bg-white hover:bg-gray-100 text-red-600 font-black h-11 text-xs rounded-xl shadow-md gap-1.5">
                  Search Now
                  <ArrowRight className="h-4 w-4 text-red-600" />
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DESKTOP SCREEN ONLY HERO & SECTIONS (>= 768px / hidden md:block) */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden md:block">
          {/* 1. Tablet & Desktop Hero Section (768px - 1440px / Pure 2-Part 50/50 Left/Right Split Section) */}
          <section className="bg-[#fdecec] dark:bg-background relative overflow-hidden w-full py-0 my-0 flex flex-col md:flex-row items-stretch justify-between min-h-[420px] md:min-h-[480px]">

            {/* Left Part: Text Content & Action Buttons (50% Width on >= 768px) */}
            <div className="w-full md:w-1/2 px-4 sm:px-8 md:pl-8 md:pr-4 lg:pl-16 lg:pr-10 py-8 md:py-10 lg:py-16 space-y-4 md:space-y-6 text-left flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white dark:bg-card px-3.5 py-1 text-xs font-bold text-red-600 shadow-xs w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                </span>
                Live Updates Across India
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-3xl lg:text-5xl xl:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                Find Emergency<br />
                Hospital Beds in<br />
                <span className="text-red-600">Real-Time</span>
              </h1>

              <p className="text-sm sm:text-base md:text-xs lg:text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-xl font-medium leading-relaxed">
                Real-time emergency healthcare network connecting verified hospitals, blood banks, and live ambulance dispatch across India.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Link to="/emergency">
                  <Button size="lg" className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-4 md:px-5 py-4 md:py-5 text-xs md:text-sm lg:text-base rounded-xl shadow-lg shadow-red-600/20 transition-transform hover:scale-[1.02] whitespace-nowrap">
                    <Bed className="h-4 w-4 md:h-5 md:w-5" />
                    Find Emergency Bed
                  </Button>
                </Link>

                <Link to="/blood">
                  <Button size="lg" variant="outline" className="gap-1.5 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-3.5 md:px-4 py-4 md:py-5 text-xs md:text-sm lg:text-base rounded-xl bg-white whitespace-nowrap">
                    <Droplets className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    Find Blood
                  </Button>
                </Link>

                <Link to="/hospitals">
                  <Button size="lg" variant="outline" className="gap-1.5 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-3.5 md:px-4 py-4 md:py-5 text-xs md:text-sm lg:text-base rounded-xl bg-white whitespace-nowrap">
                    <Siren className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    Request Ambulance
                  </Button>
                </Link>
              </div>

              {/* Hero Trust Badges */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs font-semibold text-gray-600 dark:text-gray-400 pt-2">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Verified Hospitals
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> Real-time Updates
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 fill-emerald-100" /> 24x7 Support
                </span>
              </div>
            </div>

            {/* Right Part: Full Image Block (50% Width on >= 768px) */}
            <div className="w-full md:w-1/2 flex items-stretch justify-end relative overflow-hidden">
              <img
                src="/000.png"
                alt="SwasthyaSetu Emergency Healthcare Network"
                className="w-full h-full object-cover block"
              />
            </div>

          </section>

          {/* 2. Desktop Floating Quick Stats Banner */}
          <section className="relative z-10 -mt-16 container mx-auto px-4 sm:px-6 max-w-[1440px]">
            <div className="bg-white dark:bg-card border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Stat 1 */}
                <div className="flex items-center gap-4">
                  <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{hospCount}+</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-500">Hospitals & Beds Available</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-4">
                  <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Droplets className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{bloodCount}+</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-500">Blood Units Available</p>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-4">
                  <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Siren className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{ambCount}+</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-500">Active Ambulances On Duty</p>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="flex items-center gap-4">
                  <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">24/7</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-500">Emergency Support Always Here</p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 3. Desktop The Problem We Solve */}
          <section className="py-24 bg-white dark:bg-background">
            <div className="container mx-auto px-4 max-w-[1440px]">
              <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  The Problem We Solve
                </h2>
                <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3.5 shadow-sm"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  During medical emergencies in India, families waste precious time calling hospitals to check bed availability. Many lose loved ones due to delayed care.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">

                {/* Problem 1 */}
                <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Clock className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Golden Hour Lost</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Trauma patients have 60 minutes for life-saving intervention. Most spend this time searching for hospitals.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Problem 2 */}
                <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Phone className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">No Central System</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Families call 10-15 hospitals during emergencies. Real-time bed data is not accessible to public.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Problem 3 */}
                <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <Droplets className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Blood Shortage</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          India faces a shortage of 1.5 million blood units annually. Finding donors during emergencies is chaotic.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </section>

          {/* 4. Desktop How SwasthyaSetu Helps */}
          <section className="py-20 bg-gray-50/50 dark:bg-card/50 border-y border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4 max-w-[1440px]">
              <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  How SwasthyaSetu Helps
                </h2>
                <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3.5 shadow-sm"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                  A comprehensive platform connecting patients, hospitals, and donors in real-time.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Feature 1 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Search className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Smart Search</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          AI-powered search finds the best hospital based on location, bed type, and availability.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Zap className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Real-Time Updates</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Live bed and blood availability updates from hospitals via SwasthyaSetu connection.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Blockchain Verified</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature 4 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Route Optimization</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Get the fastest route to your chosen hospital with integrated maps.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature 5 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Users className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Donor Network</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Connect with registered blood donors in your area during emergencies.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature 6 */}
                <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-15 w-15 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Globe className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Pan-India Coverage</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          Available across all major cities with expanding hospital network daily.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </section>

          {/* 5. Desktop How It Works Section */}
          <section className="py-20 bg-white dark:bg-background">
            <div className="container mx-auto px-4 max-w-[1440px]">
              <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  How It Works
                </h2>
                <div className="h-1.5 w-24 bg-red-600 rounded-full mt-3.5 shadow-sm"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                  Get connected to the right hospital in three simple steps.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative">

                {/* Step 1 */}
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="flex items-center shrink-0 relative">
                    <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                      1
                    </div>
                    <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                      <MapPin className="h-7 w-7 text-red-600 stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                      Share Location
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug mt-0.5 max-w-xs">
                      Allow location access or enter your address manually.
                    </p>
                  </div>
                </div>

                <div className="hidden lg:block w-12 border-t-2 border-dashed border-red-300 shrink-0"></div>

                {/* Step 2 */}
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="flex items-center shrink-0 relative">
                    <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                      2
                    </div>
                    <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                      <Bed className="h-7 w-7 text-red-600 stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                      Select Emergency Type
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug mt-0.5 max-w-xs">
                      Choose emergency type and required bed type (ICU, General, Ventilator).
                    </p>
                  </div>
                </div>

                <div className="hidden lg:block w-12 border-t-2 border-dashed border-red-300 shrink-0"></div>

                {/* Step 3 */}
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="flex items-center shrink-0 relative">
                    <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                      3
                    </div>
                    <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                      <CheckCircle2 className="h-7 w-7 text-red-600 stroke-[2.2]" />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                      Get Recommendations
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug mt-0.5 max-w-xs">
                      View top hospitals sorted by distance and availability with routes.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 6. Desktop Dual Feature Showcase Section */}
          <section className="py-12 bg-white dark:bg-background">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden grid lg:grid-cols-12">

                {/* Left Box */}
                <div className="lg:col-span-5 bg-red-600 text-white p-8 sm:p-10 flex flex-col justify-center space-y-6">
                  <ShieldCheck className="h-12 w-12 text-white" />
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Blockchain Verified
                  </h3>
                  <p className="text-sm text-red-100 font-medium leading-relaxed">
                    Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
                  </p>
                  <ul className="space-y-3 text-xs font-bold pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 rounded-full bg-white/20 p-0.5" /> Polygon Blockchain
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 rounded-full bg-white/20 p-0.5" /> Tamper-proof Audit
                    </li>
                  </ul>
                </div>

                {/* Right Box */}
                <div className="lg:col-span-7 dark:bg-card p-4 sm:p-10 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-6" style={{ backgroundColor: '#f5f5f5' }}>
                  <div className="space-y-4 max-w-md">
                    <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                      <Zap className="h-12 w-12" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Smart Search</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      AI-powered search finds the best hospital based on location, bed type, and availability.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" /> Route Optimization
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-red-600" /> Real-Time Updates
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
                    Every Second Counts in an Emergency
                  </h2>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-100 font-medium leading-tight sm:leading-relaxed drop-shadow-sm hidden sm:block">
                    Do not waste time calling hospitals. Find available beds instantly with SwasthyaSetu.
                  </p>
                </div>

                <Link to="/emergency">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black px-4 sm:px-8 py-3 sm:py-6 text-xs sm:text-base rounded-xl shadow-2xl transition-transform hover:scale-[1.03] shrink-0 border border-red-500">
                    Search Now
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>

      </main>

      <Footer />

      {/* Fixed Bottom Navigation Bar ONLY for Mobile Screens */}
      <MobileBottomNav />
    </div>
  );
}

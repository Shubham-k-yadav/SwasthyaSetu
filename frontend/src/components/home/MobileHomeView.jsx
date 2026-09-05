import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  return (
    <div className="block md:hidden">
      {/* Mobile Hero Section (2-Row Layout: Top Side-by-Side Text & Image, Bottom Full-Width Action Buttons & Badges) */}
      <section className="dark:bg-background relative overflow-hidden w-full pb-4">
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

          {/* Mobile Trust Badges */}
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
  );
}

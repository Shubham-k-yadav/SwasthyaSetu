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

export function TabletHomeView({ hospCount = 0, bloodCount = 0, ambCount = 0 }) {
  return (
    <div className="hidden md:block lg:hidden">
      {/* 1. Tablet Hero Section */}
      <section className="bg-[#fdecec] dark:bg-background relative overflow-hidden w-full pb-16 my-0 flex flex-row items-center justify-between min-h-[440px]">
        {/* Left Part: Text Content & Action Buttons */}
        <div className="w-[50%] pl-6 pr-2 py-6 space-y-4 text-left flex flex-col justify-center shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white dark:bg-card px-3 py-1 text-xs font-bold text-red-600 shadow-xs w-fit">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
            </span>
            Live Updates Across India
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
            Find Emergency<br />
            Hospital Beds in<br />
            <span className="text-red-600">Real-Time</span>
          </h1>

          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm font-medium leading-relaxed">
            Real-time emergency healthcare network connecting verified hospitals, blood banks, and live ambulance dispatch across India.
          </p>

          {/* Tablet Hero Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Link to="/emergency">
              <Button size="sm" className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-4 text-xs rounded-xl shadow-md whitespace-nowrap">
                <Bed className="h-4 w-4" />
                Find Bed
              </Button>
            </Link>

            <Link to="/blood">
              <Button size="sm" variant="outline" className="gap-1.5 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 font-semibold px-3 py-4 text-xs rounded-xl bg-white whitespace-nowrap">
                <Droplets className="h-4 w-4 text-red-600" />
                Find Blood
              </Button>
            </Link>

            <Link to="/hospitals">
              <Button size="sm" variant="outline" className="gap-1.5 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 font-semibold px-3 py-4 text-xs rounded-xl bg-white whitespace-nowrap">
                <Siren className="h-4 w-4 text-red-600" />
                Request Ambulance
              </Button>
            </Link>
          </div>

          {/* Tablet Hero Trust Badges */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-600 dark:text-gray-400 pt-1">
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

        {/* Right Part: Tablet Ambulance */}
        <div className="flex items-center justify-end relative self-stretch overflow-hidden">
          <img
            src="/image copy 2.png"
            alt="SwasthyaSetu Emergency Network"
            className="h-auto border-10 border-red-600 rounded-full"
          />
        </div>
      </section>

      {/* 2. Tablet Floating Quick Stats Banner */}
      <section className="relative z-10 -mt-12 container mx-auto px-4 max-w-5xl">
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-gray-800 shadow-xl rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-4 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{hospCount}+</p>
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">Hospitals & Beds Available</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{bloodCount}+</p>
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">Blood Units Available</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{ambCount}+</p>
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">Active Ambulances On Duty</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">24/7</p>
                <p className="text-[11px] font-semibold text-gray-500 leading-tight">Emergency Support Always Here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tablet The Problem We Solve */}
      <section className="py-12 bg-white dark:bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              The Problem We Solve
            </h2>
            <div className="h-1.5 w-20 bg-red-600 rounded-full mt-2.5 shadow-sm"></div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              During medical emergencies in India, families waste precious time calling hospitals to check bed availability. Many lose loved ones due to delayed care.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Golden Hour Lost</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Trauma patients have 60 minutes for life-saving intervention. Most spend this time searching for hospitals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">No Central System</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Families call 10-15 hospitals during emergencies. Real-time bed data is not accessible to public.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Blood Shortage</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      India faces a shortage of 1.5 million blood units annually. Finding donors during emergencies is chaotic.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Tablet How SwasthyaSetu Helps */}
      <section className="py-12 bg-gray-50/50 dark:bg-card/50 border-y border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              How SwasthyaSetu Helps
            </h2>
            <div className="h-1.5 w-20 bg-red-600 rounded-full mt-2.5 shadow-sm"></div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
              A comprehensive platform connecting patients, hospitals, and donors in real-time.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Search className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Smart Search</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      AI-powered search finds the best hospital based on location, bed type, and availability.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Real-Time Updates</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Live bed and blood availability updates from hospitals via SwasthyaSetu connection.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Blockchain Verified</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Route Optimization</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Get the fastest route to your chosen hospital with integrated maps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Donor Network</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Connect with registered blood donors in your area during emergencies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Globe className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Pan-India Coverage</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Available across all major cities with expanding hospital network daily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Phone className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">24x7 Support</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Emergency support team available round the clock to assist you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card border-gray-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-3.5">
                <div className="flex flex-col items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">Secure & Private</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      Your data is encrypted and kept private. We respect your privacy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Tablet How It Works */}
      <section className="py-12 bg-white dark:bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-10 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              How It Works
            </h2>
            <div className="h-1.5 w-20 bg-red-600 rounded-full mt-2.5 shadow-sm"></div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
              Get connected to the right hospital in three simple steps.
            </p>
          </div>

          <div className="flex flex-row items-center justify-between gap-2 relative">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center shrink-0 relative">
                <div className="h-9 w-9 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center z-10 shadow-md">
                  1
                </div>
                <div className="h-13 w-13 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-3 pl-1">
                  <MapPin className="h-5 w-5 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  Share Location
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
                  Allow location access or enter your address manually.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center shrink-0 relative">
                <div className="h-9 w-9 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center z-10 shadow-md">
                  2
                </div>
                <div className="h-13 w-13 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-3 pl-1">
                  <Bed className="h-5 w-5 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  Select Emergency Type
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
                  Choose emergency type and required bed type (ICU, General, Ventilator).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center shrink-0 relative">
                <div className="h-9 w-9 rounded-full bg-red-600 text-white font-extrabold text-sm flex items-center justify-center z-10 shadow-md">
                  3
                </div>
                <div className="h-13 w-13 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-3 pl-1">
                  <Check className="h-5 w-5 text-red-600 stroke-[2.2]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  Get Recommendations
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
                  View top hospitals sorted by distance and availability with routes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Tablet Dual Feature Showcase */}
      <section className="py-12 bg-gray-50/50 dark:bg-card/50 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-600 text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-extrabold tracking-tight">Blockchain Verified</h3>
                </div>
                <p className="text-xs text-red-100 font-medium leading-relaxed">
                  Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
                </p>
                <ul className="space-y-2 text-xs font-semibold pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 rounded-full bg-white/20 p-0.5" /> Polygon Blockchain
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 rounded-full bg-white/20 p-0.5" /> Tamper-proof Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 rounded-full bg-white/20 p-0.5" /> Real-Time Sync
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-3 max-w-[240px]">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Smart Search</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  AI-powered search finds the best hospital based on location, bed type, and availability.
                </p>
                <ul className="space-y-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600" /> Route Optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600" /> Real-Time Updates
                  </li>
                </ul>
              </div>

              <div className="shrink-0 max-w-[180px]">
                <img src="/Gemini_Generated_Image_f3errcf3errcf3er.png" alt="Smart Search Map" className="w-full h-auto object-contain rounded-2xl shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Tablet CTA Banner */}
      <section className="relative w-full overflow-hidden text-white my-4">
        <div className="relative w-full">
          <img
            src="/Gemini_Generated_Image_j1dahej1dahej1da.png"
            alt="SwasthyaSetu Emergency Network"
            className="w-full h-auto block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60"></div>
          <div className="absolute inset-0 container mx-auto px-6 max-w-5xl flex items-center justify-end gap-4 z-10">
            <div className="space-y-1 text-right max-w-sm">
              <h2 className="text-xl font-extrabold tracking-tight drop-shadow-md">
                Every Second Counts in an Emergency
              </h2>
              <p className="text-xs text-gray-100 font-medium leading-tight drop-shadow-sm">
                Do not waste time calling hospitals. Find available beds instantly with SwasthyaSetu.
              </p>
            </div>
            <Link to="/emergency">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-black px-4 py-4 text-xs rounded-xl shadow-xl transition-transform hover:scale-[1.03] shrink-0 border border-red-500">
                Search Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

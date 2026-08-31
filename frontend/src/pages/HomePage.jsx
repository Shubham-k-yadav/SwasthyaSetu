import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlatformStatusBanner } from '@/components/PlatformStatusBanner';
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
  Shield,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  Navigation,
  Activity
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

      <main className="flex-1">

        {/* 1. Hero Section (Full Width 2-Column Grid with /009.png) */}
        <section className="bg-red-50 dark:bg-background relative overflow-hidden w-full pt-8 pb-20 md:pt-14 md:pb-24 flex items-center">
          <div className="w-full px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto relative z-10">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Hero Left Content */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white dark:bg-card px-4 py-1.5 text-xs font-bold text-red-600 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span>
                  </span>
                  Live Updates Across India
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
                  Find Emergency<br />
                  Hospital Beds in<br />
                  <span className="text-red-600">Real-Time</span>
                </h1>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl font-medium leading-relaxed">
                  Real-time emergency healthcare network connecting verified hospitals, blood banks, and live ambulance dispatch across India.
                </p>

                {/* Hero Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link to="/emergency">
                    <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-6 text-sm sm:text-base rounded-xl shadow-lg shadow-red-600/20 transition-transform hover:scale-[1.02] whitespace-nowrap">
                      <Bed className="h-5 w-5" />
                      Find Emergency Bed
                    </Button>
                  </Link>

                  <Link to="/blood">
                    <Button size="lg" variant="outline" className="gap-2 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-6 py-6 text-sm sm:text-base rounded-xl bg-white whitespace-nowrap">
                      <Droplets className="h-5 w-5 text-red-600" />
                      Find Blood
                    </Button>
                  </Link>

                  <Link to="/hospitals">
                    <Button size="lg" variant="outline" className="gap-2 border-gray-300 text-gray-800 dark:text-gray-200 hover:bg-gray-100 hover:border-red-400 font-semibold px-6 py-6 text-sm sm:text-base rounded-xl bg-white whitespace-nowrap">
                      <Siren className="h-5 w-5 text-red-600" />
                      Request Ambulance
                    </Button>
                  </Link>
                </div>

                {/* Hero Trust Badges */}
                <div className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 pt-3">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> Verified Hospitals
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> Real-time Updates
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600 fill-emerald-100" /> 24x7 Support
                  </span>
                </div>
              </div>

              {/* Hero Right Image Column (/009.png Full Width) */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                <div className="w-full">
                  <img 
                    src="/009.png" 
                    alt="SwasthyaSetu Emergency Network" 
                    className="w-full h-auto max-h-[580px] object-contain mx-auto transition-transform duration-500 hover:scale-[1.01]"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. Floating Quick Stats Banner */}
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

        {/* 3. The Problem We Solve */}
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

        {/* 4. How SwasthyaSetu Helps */}
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

        {/* 5. How It Works Section */}
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
                {/* Overlapping Number + Icon Badge */}
                <div className="flex items-center shrink-0 relative">
                  <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                    1
                  </div>
                  <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                    <MapPin className="h-7 w-7 text-red-600 stroke-[2.2]" />
                  </div>
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                    Share Location
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug mt-0.5 max-w-xs">
                    Allow location access or enter your address manually.
                  </p>
                </div>
              </div>

              {/* Connector 1 */}
              <div className="hidden lg:block w-12 border-t-2 border-dashed border-red-300 shrink-0"></div>

              {/* Step 2 */}
              <div className="flex items-center gap-3.5 flex-1">
                {/* Overlapping Number + Icon Badge */}
                <div className="flex items-center shrink-0 relative">
                  <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                    2
                  </div>
                  <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                    <Bed className="h-7 w-7 text-red-600 stroke-[2.2]" />
                  </div>
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                    Select Emergency Type
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-snug mt-0.5 max-w-xs">
                    Choose emergency type and required bed type (ICU, General, Ventilator).
                  </p>
                </div>
              </div>

              {/* Connector 2 */}
              <div className="hidden lg:block w-12 border-t-2 border-dashed border-red-300 shrink-0"></div>

              {/* Step 3 */}
              <div className="flex items-center gap-3.5 flex-1">
                {/* Overlapping Number + Icon Badge */}
                <div className="flex items-center shrink-0 relative">
                  <div className="h-11 w-11 rounded-full bg-red-600 text-white font-extrabold text-lg flex items-center justify-center z-10 shadow-md">
                    3
                  </div>
                  <div className="h-16 w-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center -ml-4 pl-2">
                    <CheckCircle2 className="h-7 w-7 text-red-600 stroke-[2.2]" />
                  </div>
                </div>

                {/* Text Info */}
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

        {/* 6. Dual Feature Showcase Section (Blockchain & Smart Search Phone Card) */}
        <section className="py-12 bg-white dark:bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden grid lg:grid-cols-12">

              {/* Left Box (Solid Red) */}
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

              {/* Right Box (White with Phone Mockup) */}
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

                {/* Mobile Phone Mockup */}
                <div>
                  <img src="/Gemini_Generated_Image_f3errcf3errcf3er.png" alt="" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 7. CTA Section driven by Native Image Height & Width */}
        <section className="relative w-full overflow-hidden text-white my-6">
          <div className="relative w-full">
            {/* Native Image: Drives section height & width 100% naturally without stretching */}
            <img 
              src="/Gemini_Generated_Image_j1dahej1dahej1da.png" 
              alt="SwasthyaSetu Emergency Network" 
              className="w-full h-auto block"
            />
            {/* Soft Gradient Overlay for text readability on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60"></div>

            {/* Content shifted to the right side (bagal me) so ambulance graphic on left is 100% clear */}
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

      </main>

      <Footer />
    </div>
  );
}

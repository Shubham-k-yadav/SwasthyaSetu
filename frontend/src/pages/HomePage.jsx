import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
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
                Live Updates Across India
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
                Find Emergency{' '}
                <span className="text-primary">Hospital Beds</span>{' '}
                in Real-Time
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                SwasthyaSetu (स्वास्थ्य सेतु) connects patients to verified hospital beds, ICU units, and live blood availability 
                across India. When every second counts, get real-time verified healthcare support.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/emergency">
                  <Button size="lg" className="gap-2 text-base px-8">
                    <Phone className="h-5 w-5" />
                    Find Emergency Bed
                  </Button>
                </Link>
                <Link to="/blood">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                    <Droplets className="h-5 w-5" />
                    Find Blood
                  </Button>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Hospitals</p>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">10,000+</p>
                  <p className="text-sm text-muted-foreground">Beds Tracked</p>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">50,000+</p>
                  <p className="text-sm text-muted-foreground">Lives Helped</p>
                </div>
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                  <p className="text-3xl font-bold text-primary">28</p>
                  <p className="text-sm text-muted-foreground">States Covered</p>
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
                The Problem We Solve
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                During medical emergencies in India, families waste precious time calling hospitals
                to check bed availability. Many lose loved ones due to delayed care.
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">Golden Hour Lost</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Trauma patients have 60 minutes for life-saving intervention. Most spend this time searching for hospitals.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">No Central System</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Families call 10-15 hospitals during emergencies. Real-time bed data is not accessible to public.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                    <Droplets className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg">Blood Shortage</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    India faces a shortage of 1.5 million blood units annually. Finding donors during emergencies is chaotic.
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
                How SwasthyaSetu Helps
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A comprehensive platform connecting patients, hospitals, and donors in real-time.
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Smart Search</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI-powered search finds the best hospital based on location, bed type, and availability.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Real-Time Updates</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Live bed and blood availability updates from hospitals via Socket.io connection.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Blockchain Verified</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hospital data verified on Polygon blockchain. Tamper-proof and trustworthy.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Route Optimization</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Get the fastest route to your chosen hospital with integrated maps.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Donor Network</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Connect with registered blood donors in your area during emergencies.
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Pan-India Coverage</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Available across all major cities with expanding hospital network daily.
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
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get connected to the right hospital in three simple steps.
              </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Share Location</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Allow location access or enter your address manually.
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
                    <h3 className="font-semibold text-lg">Select Emergency Type</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose emergency type and required bed type (ICU, General, Ventilator).
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
                    <h3 className="font-semibold text-lg">Get Recommendations</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View top hospitals sorted by distance and availability with routes.
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
                      <h3 className="text-2xl font-bold">Blockchain Trust Layer</h3>
                      <p className="mt-4 text-primary-foreground/80">
                        Every bed and blood update is hashed and stored on the Polygon blockchain. 
                        This ensures data integrity and prevents manipulation.
                      </p>
                      <ul className="mt-6 space-y-3">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Immutable records</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Public verification</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Audit trail</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-8 md:p-10">
                      <Activity className="h-12 w-12 mb-6 text-primary" />
                      <h3 className="text-2xl font-bold">AI-Powered Routing</h3>
                      <p className="mt-4 text-muted-foreground">
                        Our AI considers multiple factors to recommend the best hospital 
                        for your emergency situation.
                      </p>
                      <ul className="mt-6 space-y-3 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Distance optimization</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Bed availability score</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span>Hospital specialization</span>
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
                Every Second Counts in an Emergency
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Do not waste time calling hospitals. Find available beds instantly with SwasthyaSetu.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/emergency">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    <Search className="h-5 w-5" />
                    Search Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/blood">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <Droplets className="h-5 w-5" />
                    Register as Donor
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

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  LifeBuoy,
  Siren,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.system.sendContact(form);
      toast.success(res.message || 'Thank you! Your message has been received.');
      setSubmitted(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (err) {
      console.error('Contact form submission error:', err);
      toast.error(err.message || 'Failed to submit your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col justify-between">
      <Header />

      <main className="flex-1 pb-16">
        <div className="container mx-auto max-w-[1280px] px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 font-medium">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Contact Support</span>
          </div>

          {/* Hero Banner */}
          <div className="mb-10 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>24/7 Platform Assistance & Emergency Coordination</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Connect with SwasthyaSetu
              </h1>
              <p className="text-sm sm:text-base text-red-50 leading-relaxed font-medium">
                Whether you need technical support, assistance onboarding your hospital or blood bank, or have questions about emergency reservations, our dedicated team is here to assist you 24/7.
              </p>
            </div>
            {/* Background Decorative Accents */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 pointer-events-none blur-2xl" />
            <div className="absolute right-32 top-0 w-48 h-48 rounded-full bg-red-500/20 pointer-events-none blur-xl" />
          </div>

          {/* Main Grid: Form (Left) & Contact Channels (Right) */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Left: Contact Form */}
            <div className="lg:col-span-7">
              <Card className="border-slate-200 dark:border-slate-800 shadow-md">
                <CardHeader className="border-b bg-card pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Send an Official Message</CardTitle>
                      <CardDescription className="text-xs">
                        Fill out the form below. We typically respond within 2 to 4 hours.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {submitted ? (
                    <div className="py-10 px-4 text-center space-y-4">
                      <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-xl font-extrabold text-foreground">Message Received Successfully!</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Thank you for reaching out to SwasthyaSetu. A member of our support and operations team has received your ticket and will contact you via email or phone shortly.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubmitted(false)}
                        className="mt-2"
                      >
                        Send Another Inquiry
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Your Full Name *</Label>
                          <Input
                            placeholder="e.g. Dr. Rajesh Sharma"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Email Address *</Label>
                          <Input
                            type="email"
                            placeholder="e.g. contact@domain.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Phone Number (Optional)</Label>
                          <Input
                            type="tel"
                            placeholder="+91-9876543210"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Inquiry Category</Label>
                          <select
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="w-full h-9 rounded-md border bg-background px-3 text-xs font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Hospital / Medical Center Onboarding">Hospital / Medical Center Onboarding</option>
                            <option value="Blood Bank Partnership">Blood Bank Partnership</option>
                            <option value="Ambulance Fleet Integration">Ambulance Fleet Integration</option>
                            <option value="Emergency Bed Hold Issue">Emergency Bed Hold Issue</option>
                            <option value="Technical Feedback / Bug Report">Technical Feedback / Bug Report</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Detailed Message / Inquiry *</Label>
                        <Textarea
                          rows={5}
                          placeholder="Please provide specifics regarding your query, hospital name, registration number, or issue..."
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          required
                          className="text-xs resize-none"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                          className="font-bold text-xs gap-2 px-8 bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending Message...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Direct Helplines & Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              {/* Emergency Helplines Card */}
              <Card className="border-red-500/30 bg-red-500/5 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Siren className="h-5 w-5 animate-pulse text-red-600" />
                    National Emergency Helplines (24/7)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    For life-threatening medical emergencies, dial immediately:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href="tel:108"
                      className="p-3 rounded-xl bg-card border hover:border-red-500/40 transition-colors flex items-center justify-between shadow-xs font-bold text-foreground"
                    >
                      <span>Emergency Medical (108)</span>
                      <span className="text-red-600 text-base">📞 108</span>
                    </a>
                    <a
                      href="tel:102"
                      className="p-3 rounded-xl bg-card border hover:border-red-500/40 transition-colors flex items-center justify-between shadow-xs font-bold text-foreground"
                    >
                      <span>Free Ambulance (102)</span>
                      <span className="text-red-600 text-base">📞 102</span>
                    </a>
                    <a
                      href="tel:112"
                      className="p-3 rounded-xl bg-card border hover:border-red-500/40 transition-colors flex items-center justify-between shadow-xs font-bold text-foreground"
                    >
                      <span>National Emergency</span>
                      <span className="text-red-600 text-base">📞 112</span>
                    </a>
                    <a
                      href="tel:100"
                      className="p-3 rounded-xl bg-card border hover:border-red-500/40 transition-colors flex items-center justify-between shadow-xs font-bold text-foreground"
                    >
                      <span>Police Helpline</span>
                      <span className="text-red-600 text-base">📞 100</span>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Support Info Card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <LifeBuoy className="h-5 w-5 text-primary" />
                    Platform & Technical Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Email Support</span>
                      <span className="text-muted-foreground block">Technical: support@swasthyasetu.in</span>
                      <span className="text-muted-foreground block">Control Room: emergency@swasthyasetu.in</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Platform Helpdesk</span>
                      <span className="text-muted-foreground font-mono block">+91 98765 43210</span>
                      <span className="text-[11px] text-muted-foreground">Toll-free across India: 1800-SW-SETU</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Support Availability</span>
                      <span className="text-muted-foreground block">Emergency SOS Dispatch: 24 Hours / 7 Days</span>
                      <span className="text-muted-foreground block">Facility Verification: Mon – Sat, 9 AM – 8 PM</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Network Operations Hub</span>
                      <span className="text-muted-foreground block">National Healthcare Command Center, New Delhi / Prayagraj, India</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facility Onboarding Quick Banner */}
              <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-xs">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                      Are you a Hospital or Blood Bank?
                    </h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Join India's unified real-time healthcare network today.
                    </p>
                  </div>
                  <Link to="/register">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0">
                      Register Now ↗
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                Common Questions
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Quick answers to common questions about SwasthyaSetu's emergency healthcare coordination
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  How does the Emergency Bed Hold work?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Patients or attending relatives can hold a critical bed (ICU, General, or Ventilator) for up to 10 minutes via instant SMS OTP authentication, giving emergency transit time to arrive safely at the hospital without losing the bed.
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  How long does Hospital Verification take?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once a hospital registers on the onboarding portal, our Super Admin control team verifies state registration and medical license credentials typically within 2 to 24 hours.
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Siren className="h-4 w-4 text-red-600 shrink-0" />
                  Is SwasthyaSetu public access free of cost?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Yes, public emergency access, live bed visibility, blood stock searches, and SOS emergency requests are 100% free of cost for all citizens across India.
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card shadow-xs space-y-1.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                  How can a hospital expand verified bed limits?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hospital admins can submit a "Request Bed Upgrade" application directly from their Hospital Admin Dashboard. Platform Super Admin reviews the expansion request and updates the certified quota with one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

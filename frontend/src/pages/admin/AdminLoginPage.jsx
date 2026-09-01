import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2, ShieldCheck, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('hospital'); // 'hospital' | 'superadmin'
  const [email, setEmail] = useState('admin@apollo.com');
  const [password, setPassword] = useState('Apollo@2024');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'hospital') {
      setEmail('admin@apollo.com');
      setPassword('Apollo@2024');
    } else {
      setEmail('superadmin@swasthyasetu.in');
      setPassword('SuperAdmin@2024');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, activeTab);
      if (success) {
        if (activeTab === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/admin');
        }
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    if (role === 'apollo') {
      setActiveTab('hospital');
      setEmail('admin@apollo.com');
      setPassword('Apollo@2024');
    } else if (role === 'fortis') {
      setActiveTab('hospital');
      setEmail('admin@fortis.com');
      setPassword('Fortis@2024');
    } else if (role === 'superadmin') {
      setActiveTab('superadmin');
      setEmail('superadmin@swasthyasetu.in');
      setPassword('SuperAdmin@2024');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-3 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            SwasthyaSetu
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Healthcare Portal Control Room
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Authorized personnel portal for hospital bed management and emergency network oversight.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl mb-4 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('hospital')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold transition-all',
              activeTab === 'hospital'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <Building2 className="h-4 w-4 text-red-600" />
            Hospital Staff Login
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('superadmin')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold transition-all',
              activeTab === 'superadmin'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Super Admin Control
          </button>
        </div>

        {/* Main Login Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold">
              {activeTab === 'hospital' ? 'Hospital Staff & Nodal Officer Login' : 'Ministry Super Admin Control Room'}
            </CardTitle>
            <CardDescription className="text-xs">
              {activeTab === 'hospital'
                ? 'Manage your assigned hospital bed inventory, ICU capacity & blood stocks'
                : 'Pan-India emergency network oversight, facility verification & real-time analytics'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={activeTab === 'hospital' ? 'admin@apollo.com' : 'superadmin@swasthyasetu.in'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className={cn('w-full font-semibold', activeTab === 'superadmin' ? 'bg-red-600 hover:bg-red-700 text-white' : '')}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : activeTab === 'hospital' ? 'Sign In to Hospital Portal' : 'Sign In as Super Admin'}
              </Button>
            </form>

            {/* Quick Demo Credentials Switcher */}
            <div className="p-3 bg-muted/60 rounded-xl border text-xs space-y-2">
              <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                {activeTab === 'hospital' ? 'Quick Demo Hospital Accounts:' : 'Super Admin Account:'}
              </p>
              
              {activeTab === 'hospital' ? (
                <div className="grid gap-1.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleQuickCredential('admin@apollo.com', 'Apollo@2024')}
                    className="p-2 rounded-lg bg-card border text-left hover:border-primary transition-colors flex flex-col"
                  >
                    <span className="font-semibold text-primary truncate">Apollo Bilaspur</span>
                    <span className="text-[10px] text-muted-foreground">admin@apollo.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickCredential('admin@aiims.edu', 'AIIMS@2024')}
                    className="p-2 rounded-lg bg-card border text-left hover:border-primary transition-colors flex flex-col"
                  >
                    <span className="font-semibold text-primary truncate">AIIMS New Delhi</span>
                    <span className="text-[10px] text-muted-foreground">admin@aiims.edu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickCredential('admin@kemhospital.gov.in', 'KEM@2024')}
                    className="p-2 rounded-lg bg-card border text-left hover:border-primary transition-colors flex flex-col"
                  >
                    <span className="font-semibold text-primary truncate">KEM Mumbai</span>
                    <span className="text-[10px] text-muted-foreground">admin@kem...</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickCredential('superadmin@swasthyasetu.in', 'SwasthyaSetu@2026')}
                  className="w-full p-2 rounded-lg bg-card border text-left hover:border-red-500 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-red-600 block">National Super Admin</span>
                    <span className="text-[11px] text-muted-foreground">superadmin@swasthyasetu.in</span>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Full Access</span>
                </button>
              )}
            </div>

            <div className="text-center pt-1">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                ← Back to Patient Public Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

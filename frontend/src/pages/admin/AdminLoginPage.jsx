import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2, ShieldCheck } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, activeTab);
      if (success) {
        navigate('/admin');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8 pb-28 sm:pb-12">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-2.5 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            SwasthyaSetu
          </span>
        </Link>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Healthcare Portal Control Room
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Authorized personnel portal for hospital bed management and emergency network oversight.
        </p>
      </div>

      <div className="mt-5 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl mb-3.5 sm:mb-4 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('hospital')}
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg font-bold transition-all text-xs',
              activeTab === 'hospital'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
            <span className="truncate">Hospital Staff</span>
            <span className="hidden sm:inline"> Login</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('superadmin')}
            className={cn(
              'flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg font-bold transition-all text-xs',
              activeTab === 'superadmin'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">Super Admin</span>
            <span className="hidden sm:inline"> Control</span>
          </button>
        </div>

        {/* Main Login Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg font-bold">
              {activeTab === 'hospital' ? 'Hospital Staff & Nodal Officer' : 'Ministry Super Admin Control'}
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {activeTab === 'hospital'
                ? 'Manage your assigned hospital bed inventory, ICU capacity & blood stocks'
                : 'Pan-India emergency network oversight, facility verification & real-time analytics'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6 pt-2 sm:pt-3">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={activeTab === 'hospital' ? 'admin@apollo.com' : 'superadmin@swasthyasetu.in'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 text-xs sm:text-sm rounded-xl"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 text-xs sm:text-sm rounded-xl"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  'w-full h-11 rounded-xl font-bold text-xs sm:text-sm shadow-xs', 
                  activeTab === 'superadmin' ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                )}
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : activeTab === 'hospital' ? 'Sign In to Hospital Portal' : 'Sign In as Super Admin'}
              </Button>
            </form>

            {/* Hospital Registration Link */}
            {activeTab === 'hospital' && (
              <div className="p-3 bg-muted/40 rounded-xl border text-center text-xs space-y-1">
                <p className="text-muted-foreground">New Healthcare Provider / Hospital?</p>
                <Link to="/register-hospital" className="text-primary hover:underline font-bold text-xs inline-block">
                  Register Your Hospital on SwasthyaSetu →
                </Link>
              </div>
            )}

            <div className="text-center pt-1">
              <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                ← Back to Patient Public Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

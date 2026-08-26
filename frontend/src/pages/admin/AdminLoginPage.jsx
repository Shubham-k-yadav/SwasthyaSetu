import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2, ShieldCheck, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export default function AdminLoginPage() {
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
      setPassword('SwasthyaSetu@2026');
    }
  };

  const handleQuickCredential = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      // Smart navigation based on role
      if (user?.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/admin/hospitals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="mx-auto max-w-lg w-full relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="SwasthyaSetu Logo" className="h-10 w-10 rounded-lg shadow-sm object-cover" />
            <span className="text-2xl font-bold tracking-tight">SwasthyaSetu</span>
          </Link>
          <p className="text-sm text-muted-foreground">National Emergency & Healthcare Resource Network</p>
        </div>

        {/* Role Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-muted rounded-xl gap-1">
          <button
            type="button"
            onClick={() => handleTabSwitch('hospital')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'hospital'
                ? 'bg-card text-primary shadow-xs border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Building2 className="h-4 w-4" />
            Hospital Admin Portal
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('superadmin')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
              activeTab === 'superadmin'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Super Admin Control
          </button>
        </div>

        {/* Main Login Card */}
        <Card className={cn('transition-all border-2', activeTab === 'superadmin' ? 'border-red-500/20' : 'border-primary/20')}>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              {activeTab === 'hospital' ? (
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <Crown className="h-5 w-5" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl font-bold">
                  {activeTab === 'hospital' ? 'Hospital Staff & Nodal Officer Login' : 'Ministry Super Admin Control Room'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeTab === 'hospital'
                    ? 'Manage your assigned hospital bed inventory, ICU capacity & blood stocks'
                    : 'Pan-India emergency network oversight, 463 hospital verification & analytics'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
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

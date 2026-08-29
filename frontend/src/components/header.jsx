import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { HospitalRegisterModal } from '@/components/HospitalRegisterModal';
import { 
  Building2, 
  Droplets, 
  AlertTriangle, 
  Menu, 
  X,
  ShieldAlert,
  LayoutDashboard,
  Phone,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ isDemoMode: false, mode: 'loading' });

  useEffect(() => {
    systemApi.getStatus()
      .then(res => setSystemStatus(res))
      .catch(() => setSystemStatus({ isDemoMode: true, mode: 'degraded_demo' }));
  }, []);

  const navItems = [
    { href: '/hospitals', label: t('navHospitals'), icon: Building2 },
    { href: '/blood', label: t('navBlood'), icon: Droplets },
    { href: '/emergency', label: t('navEmergency'), icon: AlertTriangle },
  ];

  return (
    <>
      {systemStatus.isDemoMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
          <span>
            {t('systemDegradedBanner')}
          </span>
        </div>
      )}
      <header className="sticky top-0 z-[999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl shrink-0">
            <img src="/logo.png" alt="SwasthyaSetu Logo" className="h-9 w-9 rounded-lg shadow-xs object-cover" />
            <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent font-black tracking-tight text-lg sm:text-xl">
              {t('appName')}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 mx-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs border-primary/30 h-9"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              {t('switchLanguage')}
            </Button>

            <HospitalRegisterModal />

            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="gap-1.5 font-medium h-9 text-xs">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                {t('adminLogin')}
              </Button>
            </Link>

            <Link to="/emergency">
              <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-white font-bold h-9 shadow-xs">
                <Phone className="h-3.5 w-3.5 animate-pulse" />
                {t('emergencyHelp')}
              </Button>
            </Link>
          </div>

          {/* Mobile/Tablet Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 font-semibold text-xs h-8 px-2"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              {language === 'en' ? 'HI' : 'EN'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile & Tablet Drawer Menu Dropdown */}
        {open && (
          <div className="lg:hidden border-b bg-background/98 backdrop-blur px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-xs' 
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              
              <hr className="my-2 border-border" />
              
              <div className="flex flex-col gap-2.5 pt-1">
                <HospitalRegisterModal />

                <Link to="/admin/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 font-semibold">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    {t('adminLogin')}
                  </Button>
                </Link>

                <Link to="/emergency" onClick={() => setOpen(false)}>
                  <Button className="w-full justify-center gap-2 h-11 bg-destructive hover:bg-destructive/90 text-white font-bold shadow-sm">
                    <Phone className="h-4 w-4 animate-pulse" />
                    {t('emergencyHelp')}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

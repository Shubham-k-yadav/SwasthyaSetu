import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Droplets,
  AlertTriangle,
  LayoutDashboard,
  Phone,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { href: '/hospitals', label: t('navHospitals'), icon: Building2 },
    { href: '/blood', label: t('navBlood'), icon: Droplets },
    { href: '/emergency', label: t('navEmergency'), icon: AlertTriangle },
  ];

  return (
    <>
      <header className="sticky top-0 z-[999] w-full border-b bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
        <div className="container mx-auto max-w-[1440px] flex h-12 sm:h-14 md:h-16 items-center justify-between px-3 sm:px-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-xl shrink-0 whitespace-nowrap active:scale-95 transition-transform">
            <img 
              src="/879879879.png" 
              alt="SwasthyaSetu" 
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0" 
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white tracking-tight text-base sm:text-xl leading-tight whitespace-nowrap">
                SwasthyaSetu
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 tracking-wide uppercase whitespace-nowrap hidden sm:block">
                {t('emergencyHealthcareNetwork')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 mx-2 whitespace-nowrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden xl:flex items-center gap-2 shrink-0 whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-semibold text-xs border-gray-200 rounded-xl h-9 px-2.5 bg-gray-50/50 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            >
              <Globe className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span className="whitespace-nowrap">{language === 'en' ? 'हिंदी (HI)' : 'English (EN)'}</span>
            </Button>

            <Link to="/register">
              <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-xs whitespace-nowrap">
                <Building2 className="h-4 w-4" />
                {t('registerHospital')}
              </Button>
            </Link>

            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="gap-1.5 font-semibold h-9 text-xs text-gray-700 hover:text-gray-900 whitespace-nowrap px-2.5">
                <LayoutDashboard className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="whitespace-nowrap">{t('adminLogin')}</span>
              </Button>
            </Link>

            <Link to="/emergency">
              <Button size="sm" className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold h-9 px-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] whitespace-nowrap">
                <Phone className="h-3.5 w-3.5 animate-pulse shrink-0" />
                <span className="whitespace-nowrap">{t('emergencyHelp')}</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Right Controls (Clean Language Switcher, No Hamburger) */}
          <div className="flex items-center gap-2 xl:hidden">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 font-semibold text-xs h-8 px-2.5 rounded-lg border-gray-200 shadow-2xs active:scale-95 transition-transform"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              aria-label="Switch Language"
            >
              <Globe className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span className="font-bold">{language === 'en' ? 'HI' : 'EN'}</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

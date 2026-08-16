import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Droplets, 
  HeartHandshake, 
  AlertTriangle, 
  Menu, 
  X,
  ShieldAlert,
  LayoutDashboard,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/hospitals', label: 'Hospitals', icon: Building2 },
  { href: '/blood', label: 'Blood Availability', icon: Droplets },
  { href: '/donors', label: 'Blood Donors', icon: HeartHandshake },
  { href: '/emergency', label: 'Emergency', icon: AlertTriangle },
];

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ isDemoMode: false, mode: 'loading' });

  useEffect(() => {
    systemApi.getStatus()
      .then(res => setSystemStatus(res))
      .catch(() => setSystemStatus({ isDemoMode: true, mode: 'degraded_demo' }));
  }, []);

  return (
    <>
      {systemStatus.isDemoMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
          <span>
            <strong>Transparent System Mode:</strong> Local MongoDB is currently offline. System running in <strong>Degraded Demo Mode</strong> (in-memory store reset on restart).
          </span>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl">
            <img src="/logo.png" alt="SwasthyaSetu Logo" className="h-9 w-9 rounded-lg shadow-sm object-cover" />
            <span className="bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent font-black tracking-tight">
              SwasthyaSetu
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="gap-2 font-medium">
                <LayoutDashboard className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Link to="/emergency">
              <Button size="sm" className="gap-2 bg-destructive hover:bg-destructive/90 text-white font-semibold">
                <Phone className="h-4 w-4 animate-pulse" />
                Emergency Help
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {open && (
          <div className="md:hidden border-b bg-background px-4 py-4 space-y-3 shadow-lg">
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
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-1" />
              <Link
                to="/admin/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <LayoutDashboard className="h-5 w-5" />
                Admin Login
              </Link>
              <Link to="/emergency" onClick={() => setOpen(false)}>
                <Button className="w-full gap-2 mt-2 bg-destructive text-white">
                  <Phone className="h-4 w-4" />
                  Emergency Help
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

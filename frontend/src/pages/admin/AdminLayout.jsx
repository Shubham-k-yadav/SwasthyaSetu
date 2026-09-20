import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Droplets,
  Bell,
  LogOut,
  Menu,
  X,
  Activity,
  Siren,
  Zap,
  Clock,
  ExternalLink,
  Trash2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { connectSocket, getSocket, joinHospitalRoom } from '@/lib/socket';

const superAdminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Control Room' },
  { href: '/admin/hospitals', icon: Building2, label: 'Hospitals' },
  { href: '/admin/blood', icon: Droplets, label: 'Blood Stock' },
  { href: '/admin/analytics', icon: Activity, label: 'Analytics' },
];

const hospitalStaffNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Beds & Inventory' },
  { href: '/admin?tab=reservations', icon: Siren, label: 'Patient Holds' },
  { href: '/admin?tab=fleet', icon: Building2, label: 'Ambulance Fleet' },
];

const bloodBankNavItems = [
  { href: '/admin', icon: Droplets, label: 'Blood Stock Inventory' },
  { href: '/admin/blood', icon: Activity, label: 'National Stock View' },
  { href: '/blood', icon: Globe, label: 'Public Blood Finder' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  const navItems = user?.role === 'superadmin' 
    ? superAdminNavItems 
    : user?.role === 'blood_bank_admin' 
      ? bloodBankNavItems 
      : hospitalStaffNavItems;

  const rawHosp = user?.hospitalId || user?.hospital;
  const myHospitalId = typeof rawHosp === 'object' && rawHosp !== null
    ? String(rawHosp._id || rawHosp.id || '')
    : (rawHosp ? String(rawHosp) : '');

  // 1. Request browser desktop notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. Real-time Emergency Bed Hold Socket Listener
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('swasthya_setu_token') || user?.token;
    connectSocket(token);

    if (myHospitalId) {
      joinHospitalRoom(myHospitalId);
    }

    const s = getSocket();

    const playAlertChime = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}
    };

    const triggerDesktopNotification = (data) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification(`🚨 Urgent Bed Hold: ${data.patientName || 'Emergency Patient'}`, {
            body: `Held a ${(data.bedType || 'ICU').toUpperCase()} bed at ${data.hospitalName || 'your hospital'}. Code: ${data.reservationCode}`,
            icon: '/879879879.png',
            tag: data.reservationCode
          });
          notif.onclick = () => {
            window.focus();
            navigate('/admin?tab=reservations');
          };
        } catch (e) {}
      }
    };

    const seenReservations = new Set();

    const handleIncomingBedHold = (data) => {
      console.log('🚨 [AdminLayout] Incoming real-time bed hold alert:', data);
      if (!data) return;

      const code = String(data.reservationCode || data.reservationId || '');
      if (code) {
        if (seenReservations.has(code)) {
          console.log(`[AdminLayout] Skipping duplicate alert for ticket ${code}`);
          return;
        }
        seenReservations.add(code);
      }

      const incomingHosp = String(data.hospitalId || '');
      // If hospital admin, verify it matches my hospital; superadmin sees all
      if (!myHospitalId || !incomingHosp || incomingHosp === myHospitalId || user?.role === 'superadmin') {
        playAlertChime();
        triggerDesktopNotification(data);

        // Add to notification center
        const newNotif = {
          id: data.reservationId || data.reservationCode || String(Date.now()),
          code: data.reservationCode,
          patientName: data.patientName || 'Emergency Patient',
          phone: data.contactPhone || 'N/A',
          bedType: (data.bedType || 'ICU').toUpperCase(),
          hospitalName: data.hospitalName || 'Your Hospital',
          timestamp: new Date()
        };

        setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
        setUnreadCount(prev => prev + 1);

        // Toast with instant click action
        toast.warning(
          `🚨 URGENT BED HOLD: Patient ${data.patientName || 'Anonymous'} (+91-${data.contactPhone || 'N/A'}) held an ${(data.bedType || 'ICU').toUpperCase()} bed!`,
          {
            duration: 15000,
            action: {
              label: 'View Ticket',
              onClick: () => navigate('/admin?tab=reservations')
            }
          }
        );

        // Dispatch custom event for child components (e.g. HospitalAdminDashboard table)
        window.dispatchEvent(new CustomEvent('swasthya_admin_bed_hold', { detail: data }));
      }
    };

    s.on('hospital-bed-hold', handleIncomingBedHold);

    return () => {
      s.off('hospital-bed-hold', handleIncomingBedHold);
    };
  }, [isAuthenticated, myHospitalId, user?.token, user?.role, navigate]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 lg:static lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800">
          <img 
            src="/879879879.png" 
            alt="SwasthyaSetu" 
            className="h-8 w-8 object-contain shrink-0" 
          />
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white block leading-tight">
              SwasthyaSetu
            </span>
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
              {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'blood_bank_admin' ? 'Blood Bank Portal' : 'Hospital Staff'}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-100 text-red-600 font-extrabold text-sm flex items-center justify-center shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                {user?.role === 'superadmin' 
                  ? 'Super Admin' 
                  : user?.role === 'blood_bank_admin'
                    ? (user?.bloodBank?.name || 'Blood Bank Admin')
                    : (user?.hospital?.name || 'Hospital Admin')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors",
                  isActive
                    ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-red-600 dark:text-red-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            {/* Emergency Notification Dropdown */}
            <DropdownMenu onOpenChange={(open) => { if (open) setUnreadCount(0); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-extrabold text-white animate-pulse shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : notifications.length > 0 ? (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full" />
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-xl rounded-xl border-border bg-card">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-xs uppercase tracking-wide">Emergency Alerts</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifications([]);
                        setUnreadCount(0);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      <Bell className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                      No incoming emergency bed holds yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          navigate('/admin?tab=reservations');
                        }}
                        className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {n.code}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          👤 {n.patientName} (+91-{n.phone})
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <Badge variant="outline" className="text-[9px] font-bold text-red-600 border-red-500/30">
                            {n.bedType} BED HOLD
                          </Badge>
                          <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                            View Ticket <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 text-sm font-bold flex items-center justify-center">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name || 'Admin'}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.email || 'admin@swasthyasetu.in'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

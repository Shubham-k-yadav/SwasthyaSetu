import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

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

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = user?.role === 'superadmin' ? superAdminNavItems : hospitalStaffNavItems;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

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
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-extrabold shadow-sm shrink-0">
            S
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white block leading-tight">
              SwasthyaSetu
            </span>
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
              {user?.role === 'superadmin' ? 'Super Admin' : 'Hospital Staff'}
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
                {user?.role === 'superadmin' ? 'Super Admin' : (user?.hospital?.name || 'Hospital Admin')}
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full" />
            </Button>

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

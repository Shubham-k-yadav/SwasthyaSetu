import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import {
  Heart,
  LayoutDashboard,
  Building2,
  Droplets,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Save,
  Zap,
  Siren,
  Bed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/hospitals', icon: Building2, label: 'Hospitals' },
  { href: '/admin/blood', icon: Droplets, label: 'Blood Stock' },
  { href: '/admin/donors', icon: Users, label: 'Donors' },
  { href: '/admin/emergencies', icon: Bell, label: 'Emergencies' },
  { href: '/admin/analytics', icon: Activity, label: 'Analytics' },
];

const hospitalNavItems = [
  { href: '/admin?tab=inventory', matchKey: 'inventory', icon: Bed, label: 'Bed Inventory Controls' },
  { href: '/admin?tab=holds', matchKey: 'holds', icon: Zap, label: 'Patient Bed Holds' },
  { href: '/admin?tab=ambulances', matchKey: 'ambulances', icon: Siren, label: 'Ambulance Fleet' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const isLoginPage = pathname === '/admin/login';
  const isSuperAdminOnlyRoute = ['/admin/hospitals', '/admin/blood', '/admin/donors', '/admin/emergencies', '/admin/analytics'].some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      navigate('/admin/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'superadmin' && isSuperAdminOnlyRoute) {
      navigate('/admin');
    }
  }, [isLoading, isAuthenticated, isLoginPage, user, pathname, navigate]);

  if (isLoginPage) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SwasthyaSetu Logo" className="h-7 w-7 rounded-md shadow-xs object-cover" />
              <span className="font-bold text-lg">SwasthyaSetu</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {user?.role !== 'superadmin' && (
              <div className="px-3 pb-2 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Hospital Management
                </span>
              </div>
            )}
            {(user?.role === 'superadmin' ? superAdminNavItems : hospitalNavItems).map((item) => {
              const searchParams = new URLSearchParams(location.search);
              const currentTab = searchParams.get('tab') || 'inventory';
              const isActive = user?.role === 'superadmin' 
                ? pathname === item.href 
                : (pathname === '/admin' && (item.matchKey === currentTab));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card border-b">
          <div className="flex items-center justify-between h-16 px-4">
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
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name || 'Admin'}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

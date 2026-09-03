import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Droplets, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  // Hide inside authenticated admin dashboard (which has its own mobile drawer)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return null;
  }

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/hospitals', label: 'Hospitals', icon: Search },
    // Center Floating SOS Button
    { isSos: true, href: '/emergency' },
    { href: '/blood', label: 'Blood', icon: Droplets },
    { href: '/admin/login', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-card/95 border-t border-gray-200 dark:border-gray-800 backdrop-blur-md block md:hidden pb-safe shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {items.map((item, idx) => {
          if (item.isSos) {
            const isSosActive = pathname === '/emergency';
            return (
              <Link
                key="sos-btn"
                to="/emergency"
                className="relative -top-5 flex flex-col items-center justify-center z-10"
              >
                <div className={cn(
                  "h-14 w-14 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-xl shadow-red-600/40 border-4 border-white dark:border-card transition-transform active:scale-95",
                  isSosActive && "ring-2 ring-red-500 ring-offset-2"
                )}>
                  SOS
                </div>
              </Link>
            );
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={idx}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-14 py-1 text-[11px] font-semibold transition-colors",
                isActive ? "text-red-600 font-bold" : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-red-600" : "text-gray-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

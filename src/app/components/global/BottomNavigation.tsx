import { Home, Grid, ShoppingBag, BookOpen, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function BottomNavigation() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/collections', icon: Grid, label: 'Collections' },
    { to: '/shop', icon: ShoppingBag, label: 'Shop' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black z-40">
      <div className="flex items-center justify-around h-16 max-w-[1440px] mx-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
                isActive ? 'text-black' : 'text-neutral-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] tracking-wide uppercase">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

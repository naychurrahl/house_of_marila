import { Search, ShoppingBag, Menu } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Link } from 'react-router';

interface HeaderProps {
  onSearchClick: () => void;
  onCartClick: () => void;
  onMenuClick: () => void;
}

export function Header({ onSearchClick, onCartClick, onMenuClick }: HeaderProps) {
  const { cartCount, settings } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-black z-40">
      <div className="flex items-center justify-between px-4 h-14 max-w-[1440px] mx-auto">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          {settings?.logo && <img src={settings.logo} alt="" className="h-6 mb-0.5 object-contain" />}
          {settings?.tagline && <div className="tracking-[0.2em] text-sm">{settings.tagline}</div>}
          <div className="tracking-[0.2em] text-sm">{settings?.name ?? 'MARILA'}</div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchClick}
            className="p-2"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={onCartClick}
            className="p-2 -mr-2 relative"
            aria-label="Shopping cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

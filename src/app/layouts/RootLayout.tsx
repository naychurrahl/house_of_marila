import { Outlet } from 'react-router';
import { Header } from '@/app/components/global/Header';
import { BottomNavigation } from '@/app/components/global/BottomNavigation';
import { CartDrawer } from '@/app/components/commerce/CartDrawer';
import { ChatLauncher } from '@/app/components/commerce/ChatLauncher';
import { ChatPanel } from '@/app/components/commerce/ChatPanel';
import { SearchOverlay } from '@/app/components/global/SearchOverlay';
import { MenuDrawer } from '@/app/components/global/MenuDrawer';
import { useState } from 'react';

export function RootLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onCartClick={() => setIsCartOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      <BottomNavigation />

      <ChatLauncher onClick={() => setIsChatOpen(true)} />
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}

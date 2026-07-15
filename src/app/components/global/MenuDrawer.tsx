import { X } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  const { user, settings } = useApp();

  const menuLinks = [
    { label: 'Home', to: '/' },
    { label: 'Collections', to: '/collections' },
    { label: 'Shop', to: '/shop' },
    { label: 'Journal', to: '/journal' },
    { label: 'Account', to: '/account' },
    { label: 'Contact', to: '/contact' },
    { label: 'Store Locator', to: '/stores' },
    ...(user?.role === 'admin' || user?.role === 'staff' ? [{ label: 'Admin', to: '/admin' }] : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200">
              <span className="tracking-[0.2em] text-sm">MENU</span>
              <button onClick={onClose} className="p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-8">
              {menuLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className="block px-6 py-4 text-2xl hover:bg-neutral-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-neutral-200">
              <div className="flex gap-4 mb-4">
                {settings?.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-sm hover:underline">Instagram</a>
                )}
                {settings?.twitter && (
                  <a href={settings.twitter} target="_blank" rel="noreferrer" className="text-sm hover:underline">Twitter</a>
                )}
                {settings?.pinterest && (
                  <a href={settings.pinterest} target="_blank" rel="noreferrer" className="text-sm hover:underline">Pinterest</a>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                © {new Date().getFullYear()} {settings?.name ?? 'Marila'}. All rights reserved.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

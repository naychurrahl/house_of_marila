import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Link } from 'react-router';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { products } = useApp();
  const [query, setQuery] = useState('');

  const results = query.length > 0
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-50 flex flex-col"
        >
          <div className="flex items-center gap-4 px-4 h-14 border-b border-black">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-lg"
              autoFocus
            />
            <button onClick={onClose} className="p-2 -mr-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {query.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <p className="text-sm">Start typing to search</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4">
                {results.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="group"
                  >
                    <div className="aspect-[3/4] bg-neutral-100 mb-2 overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-sm mb-1">{product.name}</h3>
                    <p className="text-sm text-neutral-500">${product.price}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

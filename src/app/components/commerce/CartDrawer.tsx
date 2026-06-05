import { X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/app/context/CartContext';
import { products } from '@/app/data/mockData';
import { Link } from 'react-router';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200">
              <span className="tracking-[0.2em] text-sm">CART ({cartItems.length})</span>
              <button onClick={onClose} className="p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-neutral-500 mb-4">Your cart is empty</p>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="inline-block bg-black text-white px-8 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
                  >
                    CONTINUE SHOPPING
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {cartItems.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      if (!product) return null;

                      return (
                        <div key={`${item.productId}-${item.size}-${item.color}-${index}`} className="flex gap-4">
                          <div className="w-24 h-32 bg-neutral-100 flex-shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm mb-1 truncate">{product.name}</h3>
                            <p className="text-sm text-neutral-500 mb-2">
                              {item.color} / {item.size}
                            </p>
                            <p className="text-sm mb-3">${product.price}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-neutral-300">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                                  }
                                  className="p-2"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 text-sm">{item.quantity}</span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                                  }
                                  className="p-2"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId, item.size, item.color)}
                                className="text-xs text-neutral-500 hover:text-black underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-neutral-200 p-6">
                  <div className="flex justify-between mb-4 text-sm">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-6 text-sm text-neutral-500">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="block w-full bg-black text-white text-center py-4 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
                  >
                    PROCEED TO CHECKOUT
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

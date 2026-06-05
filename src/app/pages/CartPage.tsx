import { useCart } from '@/app/context/CartContext';
import { products } from '@/app/data/mockData';
import { Link } from 'react-router';
import { Plus, Minus } from 'lucide-react';

export function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  if (cartItems.length === 0) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-3xl mb-4 tracking-tight">Your cart is empty</h1>
          <p className="text-neutral-600 mb-8">Add items to your cart to continue</p>
          <Link
            to="/shop"
            className="inline-block bg-black text-white px-8 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl mb-8 tracking-tight">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              if (!product) return null;

              return (
                <div key={`${item.productId}-${item.size}-${item.color}-${index}`} className="flex gap-4 pb-6 border-b border-neutral-200">
                  <Link to={`/product/${product.id}`} className="w-32 h-40 bg-neutral-100 flex-shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg mb-1 hover:underline">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-neutral-500 mb-2">
                      {item.color} / {item.size}
                    </p>
                    <p className="text-lg mb-4">${product.price}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                          }
                          className="p-2"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 text-sm">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                          }
                          className="p-2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        className="text-sm text-neutral-500 hover:text-black underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-neutral-200 p-6 sticky top-20">
              <h2 className="text-xl mb-6 tracking-tight">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-neutral-200 mb-6">
                <span className="text-lg">Total</span>
                <span className="text-lg">${total.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full bg-black text-white text-center py-4 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
              >
                PROCEED TO CHECKOUT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

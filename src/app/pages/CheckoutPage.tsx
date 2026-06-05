import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { products } from '@/app/data/mockData';
import { useNavigate } from 'react-router';

export function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shipping = 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      clearCart();
      navigate(`/order-confirmation/${orderId}`);
    }, 2000);
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="pt-14 min-h-screen bg-neutral-50">
      <div className="py-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl mb-8 tracking-tight">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div className="bg-white p-6">
                <h2 className="text-xl mb-6 tracking-tight">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Phone</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6">
                <h2 className="text-xl mb-6 tracking-tight">Shipping Address</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Address</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">City</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">State</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">ZIP Code</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Country</label>
                      <input
                        type="text"
                        required
                        defaultValue="United States"
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white p-6">
                <h2 className="text-xl mb-6 tracking-tight">Payment</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Card Number</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Expiry Date</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">CVV</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 sticky top-20">
                <h2 className="text-xl mb-6 tracking-tight">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cartItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={`${item.productId}-${item.size}-${item.color}-${index}`} className="flex justify-between text-sm">
                        <span className="text-neutral-600">
                          {product.name} × {item.quantity}
                        </span>
                        <span>${(product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 mb-6 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-neutral-200 mb-6">
                  <span className="text-lg">Total</span>
                  <span className="text-lg">${total.toFixed(2)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-4 text-sm tracking-wide transition-colors ${
                    isProcessing
                      ? 'bg-neutral-400 text-white cursor-not-allowed'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {isProcessing ? 'PROCESSING...' : 'COMPLETE ORDER'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

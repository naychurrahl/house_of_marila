import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useNavigate } from 'react-router';
import { openPaystackPopup } from '@/app/lib/paystack';
import { Order } from '@/app/data/types';

const emptyAddress = { name: '', street: '', city: '', state: '', zip: '', country: 'United States', isDefault: false };

export function CheckoutPage() {
  const { cartItems, products, user, addresses, addAddress, placeOrder, paystackPublicKey } = useApp();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Set once the order is created server-side (cart clears at that point) so
  // the popup can be reopened for the same order if the customer closes it
  // without paying, instead of creating a duplicate order.
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paymentCancelled, setPaymentCancelled] = useState(false);

  const defaultAddressId = addresses.find(a => a.isDefault)?.id ?? addresses[0]?.id ?? '';
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddressId);
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState(emptyAddress);

  const subtotal = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shipping = 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const payFor = (order: Order) => {
    if (!user || !paystackPublicKey) return;

    setPaymentCancelled(false);

    openPaystackPopup({
      publicKey: paystackPublicKey,
      email: user.email,
      amountInNaira: order.total,
      reference: order.id,
      onSuccess: () => navigate(`/order-confirmation/${order.id}`),
      onClose: () => setPaymentCancelled(true),
    }).catch(err => setError(err instanceof Error ? err.message : 'Could not open payment'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      let addressId = selectedAddressId;

      if (addingNew) {
        const saved = await addAddress(newAddress);
        addressId = saved.id;
      }

      const order = await placeOrder(addressId);
      setPendingOrder(order);
      payFor(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    navigate('/account');
    return null;
  }

  if (cartItems.length === 0 && !pendingOrder) {
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
                <p className="text-sm text-neutral-600">{user.email}</p>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6">
                <h2 className="text-xl mb-6 tracking-tight">Shipping Address</h2>

                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map(address => (
                      <label
                        key={address.id}
                        className={`block p-4 border cursor-pointer text-sm ${
                          !addingNew && selectedAddressId === address.id ? 'border-black' : 'border-neutral-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          className="mr-2"
                          checked={!addingNew && selectedAddressId === address.id}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setAddingNew(false);
                          }}
                        />
                        {address.name} &mdash; {address.street}, {address.city}, {address.state} {address.zip}
                      </label>
                    ))}
                    <label
                      className={`block p-4 border cursor-pointer text-sm ${addingNew ? 'border-black' : 'border-neutral-300'}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mr-2"
                        checked={addingNew}
                        onChange={() => setAddingNew(true)}
                      />
                      Use a new address
                    </label>
                  </div>
                )}

                {addingNew && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={newAddress.name}
                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Address</label>
                      <input
                        type="text"
                        required
                        value={newAddress.street}
                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2">City</label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">State</label>
                        <input
                          type="text"
                          required
                          value={newAddress.state}
                          onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
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
                          value={newAddress.zip}
                          onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Country</label>
                        <input
                          type="text"
                          required
                          value={newAddress.country}
                          onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6">
                <p className="text-sm text-neutral-600">
                  You'll enter your payment details in a secure Paystack window that opens right here - no need to leave this page.
                </p>
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

                {error && (
                  <div className="py-3 mb-4 text-center text-sm text-red-700 bg-red-50">{error}</div>
                )}

                {paymentCancelled && (
                  <div className="py-3 mb-4 text-center text-sm text-amber-800 bg-amber-50">
                    Payment window closed before completing. Your order is saved - try again when ready.
                  </div>
                )}

                {pendingOrder ? (
                  <button
                    type="button"
                    onClick={() => payFor(pendingOrder)}
                    disabled={!paystackPublicKey}
                    className="w-full py-4 text-sm tracking-wide transition-colors bg-black text-white hover:bg-neutral-800"
                  >
                    COMPLETE PAYMENT
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isProcessing || !paystackPublicKey}
                    className={`w-full py-4 text-sm tracking-wide transition-colors ${
                      isProcessing || !paystackPublicKey
                        ? 'bg-neutral-400 text-white cursor-not-allowed'
                        : 'bg-black text-white hover:bg-neutral-800'
                    }`}
                  >
                    {isProcessing ? 'PLACING ORDER...' : 'PLACE ORDER'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

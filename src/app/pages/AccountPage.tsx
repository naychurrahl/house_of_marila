import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { products } from '@/app/data/mockData';
import { ProductGrid } from '@/app/components/products/ProductGrid';

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const { wishlist } = useCart();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  // Mock orders
  const orders = [
    {
      id: 'ORD-001',
      date: '2026-05-20',
      status: 'delivered' as const,
      total: 1340,
      itemCount: 2,
    },
    {
      id: 'ORD-002',
      date: '2026-04-15',
      status: 'delivered' as const,
      total: 895,
      itemCount: 1,
    },
  ];

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4">
        <h1 className="text-4xl mb-8 tracking-tight">Account</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-neutral-200">
          {[
            { key: 'orders', label: 'Orders' },
            { key: 'wishlist', label: 'Wishlist' },
            { key: 'profile', label: 'Profile' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm tracking-wide uppercase transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-black text-black'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-neutral-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg mb-1">Order {order.id}</h3>
                        <p className="text-sm text-neutral-500">
                          {new Date(order.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 tracking-wide ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100'
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">{order.itemCount} items</span>
                      <span>${order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">Your wishlist is empty</p>
              </div>
            ) : (
              <ProductGrid products={wishlistProducts} />
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-md">
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">Name</label>
                <input
                  type="text"
                  defaultValue="Jane Doe"
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="jane@example.com"
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-neutral-300 text-sm"
                />
              </div>
              <button className="w-full bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors">
                SAVE CHANGES
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Navigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { Order } from '@/app/data/types';
import { ProductsTab } from '@/app/components/admin/ProductsTab';
import { CollectionsTab } from '@/app/components/admin/CollectionsTab';
import { JournalTab } from '@/app/components/admin/JournalTab';
import { LocationsTab } from '@/app/components/admin/LocationsTab';
import { InfoTab } from '@/app/components/admin/InfoTab';
import { UsersTab } from '@/app/components/admin/UsersTab';

const orderStatuses: Order['status'][] = ['processing', 'shipped', 'delivered'];

function OrderRow({ order }: { order: Order }) {
  const { updateOrderStatus } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (status: Order['status']) => {
    setIsSaving(true);
    try {
      await updateOrderStatus(order.id, status);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="border-b border-neutral-200">
      <td className="py-3 pr-4 font-mono text-xs">{order.id}</td>
      <td className="py-3 pr-4 font-mono text-xs text-neutral-500">{order.userId}</td>
      <td className="py-3 pr-4">{order.date}</td>
      <td className="py-3 pr-4">${order.total.toFixed(2)}</td>
      <td className="py-3 pr-4">
        <span
          className={`text-xs px-2 py-1 tracking-wide ${
            order.paymentStatus === 'success'
              ? 'bg-green-100 text-green-800'
              : order.paymentStatus === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-neutral-100'
          }`}
        >
          {order.paymentStatus.toUpperCase()}
        </span>
      </td>
      <td className="py-3">
        <select
          value={order.status}
          disabled={isSaving}
          onChange={e => handleChange(e.target.value as Order['status'])}
          className="px-2 py-1 border border-neutral-300 text-sm"
        >
          {orderStatuses.map(status => (
            <option key={status} value={status}>
              {status.toUpperCase()}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function OrdersTab() {
  const { orders } = useApp();

  return (
    <div className="overflow-x-auto">
      {orders.length === 0 ? (
        <p className="text-neutral-500 py-12 text-center">No orders yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="pb-2 pr-4 font-normal">Order</th>
              <th className="pb-2 pr-4 font-normal">Customer</th>
              <th className="pb-2 pr-4 font-normal">Date</th>
              <th className="pb-2 pr-4 font-normal">Total</th>
              <th className="pb-2 pr-4 font-normal">Payment</th>
              <th className="pb-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tabs = [
  { key: 'products', label: 'Products' },
  { key: 'collections', label: 'Collections' },
  { key: 'journal', label: 'Journal' },
  { key: 'orders', label: 'Orders' },
  { key: 'locations', label: 'Locations' },
  { key: 'users', label: 'Users' },
  { key: 'info', label: 'Info' },
] as const;

type Tab = (typeof tabs)[number]['key'];

export function AdminPage() {
  const { user, authReady } = useApp();
  const [tab, setTab] = useState<Tab>('products');

  if (!authReady) return null;

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4">
        <h1 className="text-4xl mb-8 tracking-tight">Admin</h1>

        <div className="flex gap-4 mb-8 border-b border-neutral-200 overflow-x-auto scrollbar-hide">
          {tabs
            .filter(t => t.key !== 'users' || user.role === 'admin')
            .filter(t => t.key !== 'info' || user.role === 'admin')
            .map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-3 text-sm tracking-wide uppercase transition-colors whitespace-nowrap ${
                  tab === t.key ? 'border-b-2 border-black text-black' : 'text-neutral-500 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        {tab === 'products' && <ProductsTab />}
        {tab === 'collections' && <CollectionsTab />}
        {tab === 'journal' && <JournalTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'locations' && <LocationsTab />}
        {tab === 'users' && user.role === 'admin' && <UsersTab />}
        {tab === 'info' && user.role === 'admin' && <InfoTab />}
      </div>
    </div>
  );
}

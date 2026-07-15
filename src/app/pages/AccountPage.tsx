import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { ProductGrid } from '@/app/components/products/ProductGrid';
import { Address } from '@/app/data/types';

function ForgotPasswordFlow({ onDone }: { onDone: () => void }) {
  const { forgotPassword, resetPassword } = useApp();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await forgotPassword(email);
      if (result.devCode) setDevCode(result.devCode);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-3xl mb-2 tracking-tight text-center">Reset Password</h1>
      <p className="text-sm text-neutral-500 mb-8 text-center">
        {step === 'request'
          ? "Enter your email and we'll send you a reset code"
          : 'Enter the code and your new password'}
      </p>

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>

          {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 text-sm tracking-wide transition-colors ${
              isSubmitting ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isSubmitting ? 'SENDING...' : 'SEND RESET CODE'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {devCode && (
            <div className="py-3 text-center text-sm text-neutral-700 bg-neutral-100">
              Dev mode: your reset code is <strong>{devCode}</strong> (email delivery isn't configured yet)
            </div>
          )}
          <div>
            <label className="block text-sm mb-2">Reset Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>

          {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 text-sm tracking-wide transition-colors ${
              isSubmitting ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
          </button>
        </form>
      )}

      <button onClick={onDone} className="w-full text-center text-sm mt-6 underline">
        Back to sign in
      </button>
    </div>
  );
}

function AuthForm() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (mode === 'forgot') {
    return <ForgotPasswordFlow onDone={() => setMode('login')} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-3xl mb-2 tracking-tight text-center">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h1>
      <p className="text-sm text-neutral-500 mb-8 text-center">
        {mode === 'login'
          ? 'Sign in to view your orders and wishlist'
          : 'Join to start shopping and track your orders'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm">Password</label>
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-xs underline text-neutral-500">
                Forgot password?
              </button>
            )}
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>

        {error && (
          <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 text-sm tracking-wide transition-colors ${
            isSubmitting
              ? 'bg-neutral-400 text-white cursor-not-allowed'
              : 'bg-black text-white hover:bg-neutral-800'
          }`}
        >
          {isSubmitting ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}
        className="w-full text-center text-sm mt-6 underline"
      >
        {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  processing: 'PROCESSING',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
};

const statusClass: Record<string, string> = {
  processing: 'bg-neutral-100',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
};

const emptyAddress = { name: '', street: '', city: '', state: '', zip: '', country: 'United States', isDefault: false };

function AddressesTab() {
  const { addresses, addAddress, updateAddress, deleteAddress } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await addAddress(form);
      setForm(emptyAddress);
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {addresses.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">No saved addresses yet</p>
        </div>
      )}

      {addresses.length > 0 && (
        <div className="space-y-4 mb-6">
          {addresses.map((address: Address) => (
            <div key={address.id} className="border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm">{address.name}</h3>
                {address.isDefault && (
                  <span className="text-xs px-3 py-1 bg-neutral-100 tracking-wide">DEFAULT</span>
                )}
              </div>
              <p className="text-sm text-neutral-600">
                {address.street}, {address.city}, {address.state} {address.zip}, {address.country}
              </p>
              <div className="flex gap-4 mt-4">
                {!address.isDefault && (
                  <button
                    onClick={() => updateAddress(address.id, { isDefault: true })}
                    className="text-sm underline text-neutral-500 hover:text-black"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => deleteAddress(address.id)}
                  className="text-sm underline text-neutral-500 hover:text-black"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleAdd} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm mb-2">Name</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Street</label>
            <input
              required
              value={form.street}
              onChange={e => setForm({ ...form, street: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-300 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">City</label>
              <input
                required
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">State</label>
              <input
                required
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">ZIP Code</label>
              <input
                required
                value={form.zip}
                onChange={e => setForm({ ...form, zip: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Country</label>
              <input
                required
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm({ ...form, isDefault: e.target.checked })}
            />
            Set as default address
          </label>

          {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 text-sm tracking-wide transition-colors ${
                isSubmitting ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {isSubmitting ? 'SAVING...' : 'SAVE ADDRESS'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setForm(emptyAddress);
                setError('');
              }}
              className="flex-1 py-3 text-sm tracking-wide border border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
        >
          ADD NEW ADDRESS
        </button>
      )}
    </div>
  );
}

function ChangePasswordForm() {
  const { changePassword } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-10 pt-10 border-t border-neutral-200">
      <h2 className="text-lg tracking-tight">Change Password</h2>
      <div>
        <label className="block text-sm mb-2">Current Password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-2">New Password</label>
        <input
          type="password"
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-2">Confirm New Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}
      {saved && <div className="py-3 text-center text-sm text-green-800 bg-green-50">Password updated</div>}

      <button
        type="submit"
        disabled={isSaving}
        className={`w-full py-3 text-sm tracking-wide transition-colors ${
          isSaving ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
        }`}
      >
        {isSaving ? 'SAVING...' : 'UPDATE PASSWORD'}
      </button>
    </form>
  );
}

function AccountDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'profile'>('orders');
  const { user, products, wishlist, orders, logout, updateProfile } = useApp();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const [name, setName] = useState(user?.name ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);

    try {
      await updateProfile({ name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save changes');
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-neutral-200 overflow-x-auto scrollbar-hide">
        {[
          { key: 'orders', label: 'Orders' },
          { key: 'wishlist', label: 'Wishlist' },
          { key: 'addresses', label: 'Addresses' },
          { key: 'profile', label: 'Profile' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-sm tracking-wide uppercase transition-colors whitespace-nowrap ${
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
              {orders.map(order => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                return (
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
                        className={`text-xs px-3 py-1 tracking-wide ${statusClass[order.status] ?? 'bg-neutral-100'}`}
                      >
                        {statusLabel[order.status] ?? order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">{itemCount} items</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
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

      {/* Addresses Tab */}
      {activeTab === 'addresses' && <AddressesTab />}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-md">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                readOnly
                className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 mt-1">Email can't be changed - it's tied to your account.</p>
            </div>

            {profileError && (
              <div className="py-3 text-center text-sm text-red-700 bg-red-50">{profileError}</div>
            )}
            {profileSaved && (
              <div className="py-3 text-center text-sm text-green-800 bg-green-50">Saved</div>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
            >
              SAVE CHANGES
            </button>
          </form>

          <ChangePasswordForm />

          <button
            onClick={() => logout()}
            className="w-full mt-10 border border-neutral-300 py-3 text-sm tracking-wide hover:bg-neutral-50 transition-colors"
          >
            SIGN OUT
          </button>
        </div>
      )}
    </>
  );
}

export function AccountPage() {
  const { authReady, user } = useApp();

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4">
        {!authReady ? null : user ? (
          <>
            <h1 className="text-4xl mb-8 tracking-tight">Account</h1>
            <AccountDashboard />
          </>
        ) : (
          <AuthForm />
        )}
      </div>
    </div>
  );
}

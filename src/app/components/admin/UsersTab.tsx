import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Plus } from 'lucide-react';

const emptyForm = { email: '', name: '', password: '', role: 'staff' as 'staff' | 'admin' };

export function UsersTab() {
  const { staff, addStaff, deleteStaff } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await addStaff(form);
      setForm(emptyForm);
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this account?')) return;
    await deleteStaff(id);
  };

  if (isAdding) {
    return (
      <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 mb-8 space-y-4 max-w-md">
        <h3 className="text-lg tracking-tight mb-2">New Staff Account</h3>

        <div>
          <label className="block text-sm mb-2">Name</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Temporary Password</label>
          <input
            type="text"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Role</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value as 'staff' | 'admin' })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm bg-white"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && <div className="py-3 text-center text-sm text-red-700 bg-red-50">{error}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-3 text-sm tracking-wide ${
              isSaving ? 'bg-neutral-400 text-white cursor-not-allowed' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {isSaving ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-6 py-3 text-sm tracking-wide border border-neutral-300 hover:bg-neutral-50"
          >
            CANCEL
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> NEW STAFF ACCOUNT
      </button>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="pb-2 pr-4 font-normal">Name</th>
              <th className="pb-2 pr-4 font-normal">Email</th>
              <th className="pb-2 pr-4 font-normal">Role</th>
              <th className="pb-2 pr-4 font-normal">Status</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id} className="border-b border-neutral-200">
                <td className="py-3 pr-4">{member.name ?? '—'}</td>
                <td className="py-3 pr-4">{member.email}</td>
                <td className="py-3 pr-4 uppercase text-xs">{member.role}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-1 ${member.active === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100'}`}>
                    {member.active.toUpperCase()}
                  </span>
                </td>
                <td className="py-3">
                  {member.active === 'active' && (
                    <button onClick={() => handleDeactivate(member.id)} className="text-xs underline text-red-700">
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

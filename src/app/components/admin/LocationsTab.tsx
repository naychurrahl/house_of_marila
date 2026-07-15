import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Location } from '@/app/data/types';
import { Plus } from 'lucide-react';

type LocationForm = Omit<Location, 'id'>;

const emptyLocation: LocationForm = { name: '', address: '', city: '', hours: '', phone: '' };

function LocationFormPanel({ location, onDone }: { location: Location | null; onDone: () => void }) {
  const { addLocationAdmin, updateLocationAdmin } = useApp();
  const [form, setForm] = useState<LocationForm>(
    location
      ? { name: location.name, address: location.address, city: location.city, hours: location.hours, phone: location.phone }
      : emptyLocation
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (location) {
        await updateLocationAdmin(location.id, form);
      } else {
        await addLocationAdmin(form);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save location');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 mb-8 space-y-4 max-w-md">
      <h3 className="text-lg tracking-tight mb-2">{location ? 'Edit Location' : 'New Location'}</h3>

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
        <label className="block text-sm mb-2">Address</label>
        <input
          required
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
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
        <label className="block text-sm mb-2">Hours</label>
        <input
          required
          value={form.hours}
          onChange={e => setForm({ ...form, hours: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm mb-2">Phone</label>
        <input
          required
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
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
          {isSaving ? 'SAVING...' : 'SAVE LOCATION'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-3 text-sm tracking-wide border border-neutral-300 hover:bg-neutral-50"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

export function LocationsTab() {
  const { locations, deleteLocationAdmin } = useApp();
  const [editing, setEditing] = useState<Location | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return;
    await deleteLocationAdmin(id);
  };

  if (isAdding) return <LocationFormPanel location={null} onDone={() => setIsAdding(false)} />;
  if (editing) return <LocationFormPanel location={editing} onDone={() => setEditing(null)} />;

  return (
    <div>
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> NEW LOCATION
      </button>

      <div className="space-y-4">
        {locations.map(location => (
          <div key={location.id} className="border border-neutral-200 p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm">{location.name}</h3>
              <div className="flex gap-3">
                <button onClick={() => setEditing(location)} className="text-xs underline hover:text-black">
                  Edit
                </button>
                <button onClick={() => handleDelete(location.id)} className="text-xs underline text-red-700">
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-neutral-600">{location.address}, {location.city}</p>
            <p className="text-sm text-neutral-600">{location.hours} &middot; {location.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

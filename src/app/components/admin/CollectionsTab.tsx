import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Collection } from '@/app/data/types';
import { ImageUploader } from '@/app/components/admin/ImageUploader';
import { Plus } from 'lucide-react';

type CollectionForm = Omit<Collection, 'id' | 'productIds'>;

const emptyCollection: CollectionForm = {
  name: '',
  description: '',
  season: '',
  year: '',
  coverImage: '',
  images: [],
  story: '',
};

function CollectionFormPanel({ collection, onDone }: { collection: Collection | null; onDone: () => void }) {
  const { addCollectionAdmin, updateCollectionAdmin } = useApp();
  const [form, setForm] = useState<CollectionForm>(
    collection
      ? {
          name: collection.name,
          description: collection.description,
          season: collection.season,
          year: collection.year,
          coverImage: collection.coverImage,
          images: collection.images,
          story: collection.story,
        }
      : emptyCollection
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (collection) {
        await updateCollectionAdmin(collection.id, form);
      } else {
        await addCollectionAdmin(form);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save collection');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 mb-8 space-y-6 max-w-2xl">
      <h3 className="text-lg tracking-tight">{collection ? 'Edit Collection' : 'New Collection'}</h3>

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
        <label className="block text-sm mb-2">Description</label>
        <input
          required
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Season</label>
          <input
            required
            value={form.season}
            onChange={e => setForm({ ...form, season: e.target.value })}
            placeholder="e.g. Spring/Summer"
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Year</label>
          <input
            required
            value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2">Story</label>
        <textarea
          required
          rows={4}
          value={form.story}
          onChange={e => setForm({ ...form, story: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Cover Image</label>
        <ImageUploader
          folder="collections"
          value={form.coverImage}
          onChange={coverImage => setForm({ ...form, coverImage })}
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Gallery Images</label>
        <ImageUploader
          folder="collections"
          multiple
          value={form.images}
          onChange={images => setForm({ ...form, images })}
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
          {isSaving ? 'SAVING...' : 'SAVE COLLECTION'}
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

export function CollectionsTab() {
  const { collections, deleteCollectionAdmin } = useApp();
  const [editing, setEditing] = useState<Collection | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Products in it will be unassigned, not deleted.')) return;
    await deleteCollectionAdmin(id);
  };

  if (isAdding) return <CollectionFormPanel collection={null} onDone={() => setIsAdding(false)} />;
  if (editing) return <CollectionFormPanel collection={editing} onDone={() => setEditing(null)} />;

  return (
    <div>
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> NEW COLLECTION
      </button>

      <div className="space-y-4">
        {collections.map(collection => (
          <div key={collection.id} className="border border-neutral-200 p-6 flex items-center gap-4">
            <img src={collection.coverImage} alt="" className="w-16 h-20 object-cover flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm mb-1">{collection.name}</h3>
              <p className="text-xs text-neutral-500">{collection.season} {collection.year} &middot; {collection.productIds.length} products</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(collection)} className="text-xs underline hover:text-black">
                Edit
              </button>
              <button onClick={() => handleDelete(collection.id)} className="text-xs underline text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

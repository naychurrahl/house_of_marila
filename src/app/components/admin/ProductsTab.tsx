import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Product } from '@/app/data/types';
import { ImageUploader } from '@/app/components/admin/ImageUploader';
import { TagInput } from '@/app/components/admin/TagInput';
import { Plus, X } from 'lucide-react';

type ProductForm = Omit<Product, 'id'>;

const emptyProduct: ProductForm = {
  name: '',
  price: 0,
  category: '',
  description: '',
  images: [],
  sizes: [],
  colors: [],
  inStock: true,
  tags: [],
  collectionId: undefined,
};

function CategoryManager() {
  const { categories, addCategory, deleteCategory } = useApp();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setError('');
    try {
      await addCategory(draft.trim());
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    }
  };

  const handleDelete = async (name: string) => {
    setError('');
    try {
      await deleteCategory(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    }
  };

  return (
    <div className="mb-8 border border-neutral-200 p-6">
      <h3 className="text-sm tracking-wide uppercase mb-4">Filter Categories</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(name => (
          <span key={name} className="flex items-center gap-1 bg-neutral-100 text-sm px-3 py-1">
            {name}
            <button type="button" onClick={() => handleDelete(name)} aria-label={`Remove ${name}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 max-w-sm">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="New category"
          className="flex-1 px-4 py-2 border border-neutral-300 text-sm"
        />
        <button type="button" onClick={handleAdd} className="px-4 py-2 bg-black text-white text-sm hover:bg-neutral-800">
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
    </div>
  );
}

function ProductFormPanel({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const { categories, collections, addProductAdmin, updateProductAdmin } = useApp();
  const [form, setForm] = useState<ProductForm>(
    product
      ? {
          name: product.name,
          price: product.price,
          category: product.category,
          description: product.description,
          images: product.images,
          sizes: product.sizes,
          colors: product.colors,
          inStock: product.inStock,
          tags: product.tags,
          collectionId: product.collectionId,
        }
      : emptyProduct
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (product) {
        await updateProductAdmin(product.id, form);
      } else {
        await addProductAdmin(form);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 mb-8 space-y-6 max-w-2xl">
      <h3 className="text-lg tracking-tight">{product ? 'Edit Product' : 'New Product'}</h3>

      <div className="grid grid-cols-2 gap-4">
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
          <label className="block text-sm mb-2">Price</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Category</label>
          <select
            required
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm bg-white"
          >
            <option value="" disabled>Select category</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2">Collection</label>
          <select
            value={form.collectionId ?? ''}
            onChange={e => setForm({ ...form, collectionId: e.target.value || undefined })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm bg-white"
          >
            <option value="">None</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2">Description</label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.inStock}
          onChange={e => setForm({ ...form, inStock: e.target.checked })}
        />
        In stock
      </label>

      <div>
        <label className="block text-sm mb-2">Images</label>
        <ImageUploader
          folder="products"
          multiple
          value={form.images}
          onChange={images => setForm({ ...form, images })}
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Sizes</label>
        <TagInput values={form.sizes} onChange={sizes => setForm({ ...form, sizes })} placeholder="e.g. M" />
      </div>

      <div>
        <label className="block text-sm mb-2">Colors</label>
        <TagInput values={form.colors} onChange={colors => setForm({ ...form, colors })} placeholder="e.g. Black" />
      </div>

      <div>
        <label className="block text-sm mb-2">Tags</label>
        <TagInput values={form.tags} onChange={tags => setForm({ ...form, tags })} placeholder="e.g. New Arrival" />
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
          {isSaving ? 'SAVING...' : 'SAVE PRODUCT'}
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

export function ProductsTab() {
  const { products, deleteProductAdmin } = useApp();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProductAdmin(id);
  };

  if (isAdding) return <ProductFormPanel product={null} onDone={() => setIsAdding(false)} />;
  if (editing) return <ProductFormPanel product={editing} onDone={() => setEditing(null)} />;

  return (
    <div>
      <CategoryManager />

      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> NEW PRODUCT
      </button>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-200">
              <th className="pb-2 pr-4 font-normal">Name</th>
              <th className="pb-2 pr-4 font-normal">Category</th>
              <th className="pb-2 pr-4 font-normal">Price</th>
              <th className="pb-2 pr-4 font-normal">Stock</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-neutral-200">
                <td className="py-3 pr-4">{product.name}</td>
                <td className="py-3 pr-4 text-neutral-500">{product.category}</td>
                <td className="py-3 pr-4">${product.price.toFixed(2)}</td>
                <td className="py-3 pr-4">{product.inStock ? 'In stock' : 'Out of stock'}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(product)} className="text-xs underline hover:text-black">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-xs underline text-red-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

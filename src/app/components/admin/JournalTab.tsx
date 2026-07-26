import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Article } from '@/app/data/types';
import { ImageUploader } from '@/app/components/admin/ImageUploader';
import { Plus } from 'lucide-react';

type ArticleForm = Omit<Article, 'id'>;

const emptyArticle: ArticleForm = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  date: new Date().toISOString().slice(0, 10),
  category: '',
  coverImage: '',
  images: [],
};

function ArticleFormPanel({ article, onDone }: { article: Article | null; onDone: () => void }) {
  const { addArticleAdmin, updateArticleAdmin } = useApp();
  const [form, setForm] = useState<ArticleForm>(
    article
      ? {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          author: article.author,
          date: article.date,
          category: article.category,
          coverImage: article.coverImage,
          images: article.images,
        }
      : emptyArticle
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (article) {
        await updateArticleAdmin(article.id, form);
      } else {
        await addArticleAdmin(form);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save article');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 p-6 mb-8 space-y-6 max-w-2xl">
      <h3 className="text-lg tracking-tight">{article ? 'Edit Article' : 'New Article'}</h3>

      <div>
        <label className="block text-sm mb-2">Title</label>
        <input
          required
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Excerpt</label>
        <input
          required
          value={form.excerpt}
          onChange={e => setForm({ ...form, excerpt: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Content</label>
        <textarea
          required
          rows={6}
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-2">Author</label>
          <input
            required
            value={form.author}
            onChange={e => setForm({ ...form, author: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Category</label>
          <input
            required
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Interview"
            className="w-full px-4 py-3 border border-neutral-300 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-2">Cover Image</label>
        <ImageUploader
          folder="articles"
          value={form.coverImage}
          onChange={coverImage => setForm({ ...form, coverImage })}
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Gallery Images</label>
        <ImageUploader
          folder="articles"
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
          {isSaving ? 'SAVING...' : 'SAVE ARTICLE'}
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

export function JournalTab() {
  const { articles, deleteArticleAdmin } = useApp();
  const [editing, setEditing] = useState<Article | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await deleteArticleAdmin(id);
  };

  if (isAdding) return <ArticleFormPanel article={null} onDone={() => setIsAdding(false)} />;
  if (editing) return <ArticleFormPanel article={editing} onDone={() => setEditing(null)} />;

  return (
    <div>
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 bg-black text-white px-6 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" /> NEW ARTICLE
      </button>

      <div className="space-y-4">
        {articles.map(article => (
          <div key={article.id} className="border border-neutral-200 p-6 flex items-center gap-4">
            <img src={article.coverImage} alt="" className="w-16 h-20 object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm mb-1 truncate">{article.title}</h3>
              <p className="text-xs text-neutral-500 truncate">{article.category} &middot; {article.date} &middot; {article.author}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button onClick={() => setEditing(article)} className="text-xs underline hover:text-black">
                Edit
              </button>
              <button onClick={() => handleDelete(article.id)} className="text-xs underline text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useParams, Link } from 'react-router';
import { articles } from '@/app/data/mockData';

export function ArticleDetailPage() {
  const { id } = useParams();
  const article = articles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Article not found</h1>
          <Link to="/journal" className="underline">
            Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen">
      <article>
        {/* Hero */}
        <div className="aspect-[4/5] bg-neutral-100">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="px-4 py-12 max-w-2xl mx-auto">
          <p className="text-xs tracking-wider uppercase text-neutral-500 mb-3">
            {article.category}
          </p>
          <h1 className="text-4xl mb-4 tracking-tight leading-tight">{article.title}</h1>
          <p className="text-neutral-600 mb-6">{article.excerpt}</p>
          <div className="flex items-center gap-3 pb-8 mb-8 border-b border-neutral-200">
            <p className="text-sm">By {article.author}</p>
            <span className="text-neutral-300">·</span>
            <p className="text-sm text-neutral-500">
              {new Date(article.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-700 leading-relaxed mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-6">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="px-4 pb-12 max-w-2xl mx-auto">
          <Link to="/journal" className="inline-flex items-center text-sm hover:underline">
            ← Back to Journal
          </Link>
        </div>
      </article>
    </div>
  );
}

import { Link } from 'react-router';
import { Article } from '@/app/data/types';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'large';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  if (variant === 'large') {
    return (
      <Link to={`/journal/${article.id}`} className="block group">
        <div className="aspect-[4/5] bg-neutral-100 mb-4 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="px-4">
          <p className="text-xs tracking-wider uppercase text-neutral-500 mb-2">
            {article.category}
          </p>
          <h2 className="text-3xl mb-3 tracking-tight leading-tight">{article.title}</h2>
          <p className="text-sm text-neutral-600 mb-3">{article.excerpt}</p>
          <p className="text-xs text-neutral-500">
            {article.author} · {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/journal/${article.id}`} className="block group">
      <div className="aspect-[3/4] bg-neutral-100 mb-3 overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <p className="text-xs tracking-wider uppercase text-neutral-500 mb-1">
        {article.category}
      </p>
      <h3 className="text-lg mb-2 tracking-tight leading-tight">{article.title}</h3>
      <p className="text-sm text-neutral-600 mb-2">{article.excerpt}</p>
      <p className="text-xs text-neutral-500">
        {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </Link>
  );
}

import { articles } from '@/app/data/mockData';
import { ArticleCard } from '@/app/components/content/ArticleCard';

export function JournalPage() {
  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4">
        <h1 className="text-4xl mb-3 tracking-tight">Journal</h1>
        <p className="text-neutral-600 mb-12">
          Stories, interviews, and insights from the studio
        </p>

        {/* Featured Article */}
        <div className="mb-16">
          <ArticleCard article={featuredArticle} variant="large" />
        </div>

        {/* Other Articles */}
        <div className="grid grid-cols-1 gap-12">
          {otherArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}

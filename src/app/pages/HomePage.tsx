import { HeroCampaign } from '@/app/components/showroom/HeroCampaign';
import { CollectionRail } from '@/app/components/showroom/CollectionRail';
import { ProductGrid } from '@/app/components/products/ProductGrid';
import { ArticleCard } from '@/app/components/content/ArticleCard';
import { useApp } from '@/app/context/AppContext';
import { Link } from 'react-router';

export function HomePage() {
  const { collections, products, articles } = useApp();
  const featuredProducts = products.filter(p => p.tags.includes('New Arrival')).slice(0, 4);
  const featuredArticle = articles[0];
  const heroCollection = collections[0];

  return (
    <div className="pt-14">
      {heroCollection && (
        <HeroCampaign
          title="Spring/Summer 2026"
          subtitle="Available Now"
          image={heroCollection.coverImage}
          link={`/collections/${heroCollection.id}`}
        />
      )}

      <CollectionRail title="Collections" collections={collections} />

      <section className="py-12 bg-neutral-50">
        <div className="px-4 mb-6 flex items-center justify-between">
          <h2 className="text-2xl tracking-tight">New Arrivals</h2>
          <Link to="/shop" className="text-sm underline">
            Shop All
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {featuredArticle && (
        <section className="py-12">
          <div className="px-4 mb-6">
            <h2 className="text-2xl tracking-tight">From The Journal</h2>
          </div>
          <ArticleCard article={featuredArticle} variant="large" />
          <div className="mt-6 text-center">
            <Link
              to="/journal"
              className="inline-block bg-black text-white px-8 py-3 text-sm tracking-wide hover:bg-neutral-800 transition-colors"
            >
              READ MORE
            </Link>
          </div>
        </section>
      )}

      <section className="py-16 bg-black text-white">
        <div className="px-4 text-center max-w-md mx-auto">
          <h2 className="text-2xl mb-4 tracking-tight">Stay Connected</h2>
          <p className="text-sm text-white/80 mb-6">
            Subscribe to receive updates on new arrivals, special offers, and our latest editorials.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm outline-none focus:border-white/40"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-black text-sm tracking-wide hover:bg-white/90 transition-colors"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

import { useParams, Link } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { ProductGrid } from '@/app/components/products/ProductGrid';
import { useState } from 'react';

export function CollectionDetailPage() {
  const { id } = useParams();
  const { collections, products, catalogReady } = useApp();
  const collection = collections.find(c => c.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!catalogReady) {
    return <div className="pt-14 min-h-screen" />;
  }

  if (!collection) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Collection not found</h1>
          <Link to="/collections" className="underline">
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const collectionProducts = products.filter(p => p.collectionId === collection.id);

  return (
    <div className="pt-14 min-h-screen">
      {/* Lookbook Gallery */}
      <div className="relative h-[80vh] bg-black">
        <img
          src={collection.images[currentImageIndex]}
          alt={collection.name}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <h1 className="text-4xl text-white mb-2 tracking-tight">{collection.name}</h1>
          <p className="text-white/80">{collection.description}</p>
        </div>
        {collection.images.length > 1 && (
          <div className="absolute bottom-6 right-6 flex gap-2">
            {collection.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collection Story */}
      <section className="py-16 px-4 max-w-2xl mx-auto">
        <h2 className="text-2xl mb-4 tracking-tight">Collection Story</h2>
        <p className="text-neutral-700 leading-relaxed">{collection.story}</p>
      </section>

      {/* Products */}
      <section className="py-12 bg-neutral-50">
        <div className="px-4 mb-8">
          <h2 className="text-2xl tracking-tight">Shop The Collection</h2>
        </div>
        <ProductGrid products={collectionProducts} />
      </section>
    </div>
  );
}

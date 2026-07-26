import { useApp } from '@/app/context/AppContext';
import { CollectionCard } from '@/app/components/showroom/CollectionCard';

export function CollectionsPage() {
  const { collections } = useApp();

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-12 px-4 max-w-[1440px] mx-auto">
        <h1 className="text-4xl mb-3 tracking-tight">Collections</h1>
        <p className="text-neutral-600 mb-8">
          Explore our seasonal collections and archival pieces
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {collections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </div>
  );
}

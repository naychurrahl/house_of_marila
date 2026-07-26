import { Collection } from '@/app/data/types';
import { CollectionCard } from './CollectionCard';
import { Link } from 'react-router';

interface CollectionRailProps {
  title: string;
  collections: Collection[];
}

export function CollectionRail({ title, collections }: CollectionRailProps) {
  return (
    <section className="py-12">
      <div className="max-w-[1440px] mx-auto">
        <div className="px-4 mb-6 flex items-center justify-between">
          <h2 className="text-2xl tracking-tight">{title}</h2>
          <Link to="/collections" className="text-sm underline">
            View All
          </Link>
        </div>
        {/* Contained within the 1440px box - still scrolls horizontally if the
            row of cards is wider than the box itself. */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
            {collections.map(collection => (
              <div key={collection.id} className="w-64">
                <CollectionCard collection={collection} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

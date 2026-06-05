import { Link } from 'react-router';
import { Collection } from '@/app/data/types';

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link to={`/collections/${collection.id}`} className="block group">
      <div className="aspect-[3/4] bg-neutral-100 mb-3 overflow-hidden">
        <img
          src={collection.coverImage}
          alt={collection.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-luminosity"
        />
      </div>
      <h3 className="text-xl mb-1 tracking-tight">{collection.name}</h3>
      <p className="text-sm text-neutral-500">{collection.description}</p>
    </Link>
  );
}

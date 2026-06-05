import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import { Product } from '@/app/data/types';
import { useCart } from '@/app/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { wishlist, toggleWishlist } = useCart();
  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-[3/4] bg-neutral-100 mb-3 overflow-hidden relative">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.tags.length > 0 && (
            <div className="absolute top-2 left-2">
              <span className="bg-black text-white text-[10px] px-2 py-1 tracking-wide">
                {product.tags[0]}
              </span>
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="text-sm tracking-wide">OUT OF STOCK</span>
            </div>
          )}
        </div>
      </Link>
      
      <button
        onClick={() => toggleWishlist(product.id)}
        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white transition-colors z-10"
        aria-label="Add to wishlist"
      >
        <Heart
          className="w-4 h-4"
          fill={isWishlisted ? 'black' : 'none'}
          stroke={isWishlisted ? 'black' : 'currentColor'}
        />
      </button>

      <div>
        <h3 className="text-sm mb-1">{product.name}</h3>
        <p className="text-sm text-neutral-500 mb-1">{product.category}</p>
        <p className="text-sm">${product.price}</p>
      </div>
    </div>
  );
}

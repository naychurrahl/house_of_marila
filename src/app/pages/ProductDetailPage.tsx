import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useApp } from '@/app/context/AppContext';
import { Heart, Check } from 'lucide-react';
import { ProductGrid } from '@/app/components/products/ProductGrid';
import { ReviewsSection } from '@/app/components/reviews/ReviewsSection';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, catalogReady, user, addToCart, wishlist, toggleWishlist } = useApp();
  const product = products.find(p => p.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!catalogReady) {
    return <div className="pt-14 min-h-screen" />;
  }

  if (!product) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Product not found</h1>
          <Link to="/shop" className="underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      setError('Please select size and color');
      return;
    }

    if (!user) {
      navigate('/account');
      return;
    }

    try {
      setError('');
      await addToCart({
        productId: product.id,
        size: selectedSize,
        color: selectedColor,
        quantity: 1,
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to cart');
    }
  };

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-2xl mx-auto">
      {/* Product Gallery */}
      <div className="relative">
        <div className="aspect-[3/4] bg-neutral-100">
          <img
            src={product.images[currentImageIndex]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-20 bg-neutral-100 border-2 transition-colors ${
                  index === currentImageIndex ? 'border-black' : 'border-transparent'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs tracking-wider uppercase text-neutral-500 mb-2">
              {product.category}
            </p>
            <h1 className="text-3xl mb-2 tracking-tight">{product.name}</h1>
            <p className="text-2xl">${product.price}</p>
          </div>
          <button
            onClick={() => toggleWishlist(product.id)}
            className="p-2 -mr-2"
            aria-label="Add to wishlist"
          >
            <Heart
              className="w-6 h-6"
              fill={isWishlisted ? 'black' : 'none'}
              stroke={isWishlisted ? 'black' : 'currentColor'}
            />
          </button>
        </div>

        <p className="text-neutral-700 mb-8 leading-relaxed">{product.description}</p>

        {/* Size Selector */}
        <div className="mb-6">
          <label className="block text-sm tracking-wide uppercase mb-3">Select Size</label>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 text-sm border transition-colors ${
                  selectedSize === size
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 hover:border-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="mb-8">
          <label className="block text-sm tracking-wide uppercase mb-3">Select Color</label>
          <div className="flex gap-2">
            {product.colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-3 text-sm border transition-colors ${
                  selectedColor === color
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 hover:border-black'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full py-4 text-sm tracking-wide transition-colors mb-4 ${
            product.inStock
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
        </button>

        {error && (
          <div className="py-3 text-center text-sm text-red-700 bg-red-50 mb-4">{error}</div>
        )}

        {showSuccess && (
          <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-800 text-sm mb-4">
            <Check className="w-4 h-4" />
            <span>Added to cart</span>
          </div>
        )}

        {/* Product Tags */}
        {product.tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {product.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-3 py-1 bg-neutral-100 tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ReviewsSection subjectType="product" subjectId={product.id} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 bg-neutral-50">
          <div className="max-w-[1440px] mx-auto">
            <div className="px-4 mb-6">
              <h2 className="text-2xl tracking-tight">You May Also Like</h2>
            </div>
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      )}
    </div>
  );
}

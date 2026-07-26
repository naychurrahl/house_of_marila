import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { ProductGrid } from '@/app/components/products/ProductGrid';
import { SlidersHorizontal } from 'lucide-react';

export function ShopPage() {
  const { products } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  let filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // newest (default order)
  });

  return (
    <div className="pt-14 min-h-screen">
      <div className="py-8 px-4 max-w-[1440px] mx-auto">
        <h1 className="text-4xl mb-8 tracking-tight">Shop</h1>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm tracking-wide uppercase">Filter</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-neutral-500">{filteredProducts.length} products</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-neutral-300 px-3 py-2 bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Products */}
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}

import React from 'react';
import { Store as StoreInfo, Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface FeaturedSectionProps {
  store: StoreInfo;
  featuredProducts: Product[];
  t: any;
  addToBasket: (product: Product) => void;
  onView: (product: Product) => void;
  primaryColor: string;
  isLuxury: boolean;
  sector: string;
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  store,
  featuredProducts,
  t,
  addToBasket,
  onView,
  primaryColor,
  isLuxury,
  sector,
}) => {
  if (!featuredProducts || featuredProducts.length === 0) return null;
  return (
    <section>
      <h2 className="text-3xl font-semibold text-gray-900 mb-10">
        {t.dashboard.featuredProducts}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {featuredProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            store={store}
            t={t}
            addToBasket={addToBasket}
            onView={onView}
            primaryColor={primaryColor}
            isLuxury={isLuxury}
            sector={sector}
          />
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';

interface MobileFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  selectedCategory: string | null;
  categories: Map<string, Set<string>>;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (sub: string | null) => void;
  t: any;
  brandsLabel: string;
  brandLabel: string;
  brandSearch: string;
  setBrandSearch: (s: string) => void;
  brands: string[];
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  setSelectedCategory: (cat: string | null) => void;
}

export const MobileFiltersModal: React.FC<MobileFiltersModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedCategory,
  categories,
  selectedSubCategory,
  setSelectedSubCategory,
  t,
  brandsLabel,
  brandLabel,
  brandSearch,
  setBrandSearch,
  brands,
  selectedBrand,
  setSelectedBrand,
  setSelectedCategory
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-[3rem] z-[101] overflow-hidden flex flex-col shadow-lg"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter">
                  Filtrele
                </h3>
                <p className="text-xss text-gray-400 font-bold tracking-wide">
                  {products.length} Ürün Mevcut
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
              {/* Mobile Subcategories */}
              {selectedCategory &&
                categories.get(selectedCategory) &&
                categories.get(selectedCategory)!.size > 0 && (
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-4">
                      {t.dashboard.subCategories || "ALT KATEGORİLER"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedSubCategory(null)}
                        className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                          !selectedSubCategory
                            ? "bg-primary text-white border-primary shadow-lg"
                            : "bg-white text-gray-500 border-gray-100"
                        }`}
                      >
                        Hepsi
                      </button>
                      {Array.from(categories.get(selectedCategory)!)
                        .sort()
                        .map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubCategory(sub)}
                            className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                              selectedSubCategory === sub
                                ? "bg-primary text-white border-primary shadow-lg"
                                : "bg-white text-gray-500 border-gray-100"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

              {/* Brands */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-4">
                  {brandsLabel}
                </h4>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${brandLabel}...`}
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                      !selectedBrand
                        ? "bg-primary text-white border-primary shadow-lg"
                        : "bg-white text-gray-500 border-gray-100"
                    }`}
                  >
                    All
                  </button>
                  {brands
                    .filter((brand) =>
                      brand
                        .toLowerCase()
                        .includes(brandSearch.toLowerCase()),
                    )
                    .map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                          selectedBrand === brand
                            ? "bg-primary text-white border-primary shadow-lg"
                            : "bg-white text-gray-500 border-gray-100"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-gray-900/20 active:scale-95 transition-all"
              >
                Sonuçları Gör
              </button>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                  setSelectedBrand(null);
                  onClose();
                }}
                className="w-full mt-4 py-1.5 text-gray-400 text-xss font-bold hover:text-gray-600 transition-all"
              >
                Filtreleri Temizle
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import React from "react";
import { Filter, Search, Tag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ShowcaseSidebarProps {
  categories: Map<string, Set<string>>;
  products: any[];
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (sub: string | null) => void;
  expandedCategories: Set<string>;
  toggleCategory: (cat: string) => void;
  categorySearch: string;
  setCategorySearch: (val: string) => void;
  showAllCategories: boolean;
  setShowAllCategories: (val: boolean) => void;
  brands: string[];
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  brandSearch: string;
  setBrandSearch: (val: string) => void;
  lang: string;
  t: any;
  categoriesLabel: string;
  brandsLabel: string;
  brandLabel: string;
}

export const ShowcaseSidebar: React.FC<ShowcaseSidebarProps> = ({
  categories,
  products,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  expandedCategories,
  toggleCategory,
  categorySearch,
  setCategorySearch,
  showAllCategories,
  setShowAllCategories,
  brands,
  selectedBrand,
  setSelectedBrand,
  brandSearch,
  setBrandSearch,
  lang,
  t,
  categoriesLabel,
  brandsLabel,
  brandLabel,
}) => {
  return (
    <aside className="hidden lg:block lg:w-80 flex-shrink-0">
      <div className="sticky top-32 space-y-12">
        {/* Categories */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
            <Filter className="w-4 h-4" />
            {categoriesLabel}
          </h3>

          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                !selectedCategory
                  ? "bg-gray-900 text-white shadow-xl"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <div className={`w-1 h-1 rounded-lg ${!selectedCategory ? "bg-primary" : "bg-gray-300"}`}></div>
                {t.dashboard.all}
              </span>
              <span className="text-[9px] opacity-50">{products.length}</span>
            </button>

            <div className="space-y-1">
              {Array.from(categories.keys())
                .filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                .sort()
                .slice(0, showAllCategories ? undefined : 5)
                .map((cat) => (
                  <div key={cat} className="space-y-1">
                    <button
                      onClick={() => {
                        if (selectedCategory === cat) {
                          toggleCategory(cat);
                        } else {
                          setSelectedCategory(cat);
                          setSelectedSubCategory(null);
                          if (!expandedCategories.has(cat)) toggleCategory(cat);
                          document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                        selectedCategory === cat ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-1 rounded-lg transition-colors ${selectedCategory === cat ? "bg-primary" : "bg-gray-300 group-hover:bg-gray-400"}`}></div>
                        <span className="truncate">{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] opacity-50">{products.filter((p) => p.category === cat).length}</span>
                        {categories.get(cat)!.size > 0 && (
                          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${expandedCategories.has(cat) ? "rotate-90" : ""}`} />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedCategories.has(cat) && categories.get(cat)!.size > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-8 space-y-1"
                        >
                          {Array.from(categories.get(cat)!)
                            .sort()
                            .map((sub) => (
                              <button
                                key={sub}
                                onClick={() => {
                                  setSelectedSubCategory(sub);
                                  document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                className={`w-full text-left px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                                  selectedSubCategory === sub ? "text-primary bg-primary/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <div className={`w-1 h-1 rounded-lg ${selectedSubCategory === sub ? "bg-primary" : "bg-transparent"}`}></div>
                                <span className="truncate">{sub}</span>
                              </button>
                            ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

              {Array.from(categories.keys()).length > 5 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="w-full text-center py-1.5 text-[10px] font-semibold text-primary tracking-wide hover:bg-primary/5 rounded-lg transition-all"
                >
                  {showAllCategories ? (lang === "tr" ? "Daha Az" : "Show Less") : (lang === "tr" ? "Tümünü Gör" : "Show All")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Brands */}
        {brands.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
              <Tag className="w-4 h-4" />
              {brandsLabel}
            </h3>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={lang === "tr" ? `${brandLabel} Ara...` : `Search ${brandLabel}...`}
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {brands
                    .filter((brand) => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                    .map((brand) => (
                      <button
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand === selectedBrand ? null : brand);
                          document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                          selectedBrand === brand
                            ? "bg-gray-900 text-white border-gray-900 shadow-md"
                            : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

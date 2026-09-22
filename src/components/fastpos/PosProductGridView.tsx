import React from "react";
import { Search, Barcode, Package, ShoppingCart, X } from "lucide-react";

export interface PosProductGridViewProps {
  lang: string;
  searchInputRef: React.RefObject<HTMLInputElement>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allProducts: any[];
  filteredProducts: any[];
  addToCart: (product: any, variant?: any) => void;
  handleProductClick: (product: any) => void;
  setShowQuickProductModal?: (show: boolean) => void;
  setQuickProductForm?: (form: any) => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  subCategories: string[];
  selectedSubCategory: string;
  setSelectedSubCategory: (subCat: string) => void;
  isHappyHourActive: boolean;
}

export const PosProductGridView: React.FC<PosProductGridViewProps> = ({
  lang,
  searchInputRef,
  searchTerm,
  setSearchTerm,
  allProducts,
  filteredProducts,
  addToCart,
  handleProductClick,
  setShowQuickProductModal,
  setQuickProductForm,
  categories,
  selectedCategory,
  setSelectedCategory,
  subCategories,
  selectedSubCategory,
  setSelectedSubCategory,
  isHappyHourActive
}) => {
  return (
    <>
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs shrink-0">
        <div className="relative">
          <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={lang === 'tr' ? "Barkod okutun veya ürün adı yazın..." : "Scan barcode or type product name..."}
            className="w-full pl-10 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                let matchedProduct: any = null;
                let matchedVariant: any = null;

                for (const p of allProducts) {
                  if ((p.barcode && p.barcode.toLowerCase() === term) || (p.sku && p.sku.toLowerCase() === term)) {
                    matchedProduct = p;
                    break;
                  }
                  if (p.has_variants && Array.isArray(p.variants)) {
                    const vMatch = p.variants.find((v: any) => 
                      (v.barcode && v.barcode.toLowerCase() === term) || 
                      (v.sku && v.sku.toLowerCase() === term)
                    );
                    if (vMatch) {
                      matchedProduct = p;
                      matchedVariant = vMatch;
                      break;
                    }
                  }
                }

                if (!matchedProduct && filteredProducts.length > 0) {
                  matchedProduct = filteredProducts[0];
                }

                if (matchedProduct) {
                  if (matchedVariant) {
                    addToCart(matchedProduct, matchedVariant);
                  } else {
                    handleProductClick(matchedProduct);
                  }
                  setSearchTerm("");
                } else if (setShowQuickProductModal && setQuickProductForm) {
                  setQuickProductForm({ name: term, price: '', tax_rate: '20', category: '', sub_category: '', type: 'product' });
                  setShowQuickProductModal(true);
                }
              }
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                if (searchInputRef.current) searchInputRef.current.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title={lang === 'tr' ? "Aramayı Temizle" : "Clear Search"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none px-0.5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category ? "all" : category);
                  setSelectedSubCategory("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {subCategories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none px-0.5">
              {subCategories.map((subCategory) => (
                <button
                  key={subCategory}
                  onClick={() => setSelectedSubCategory(selectedSubCategory === subCategory ? "all" : subCategory)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                    selectedSubCategory === subCategory
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {subCategory}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-y-auto p-2.5 sm:p-3">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                title={product.name}
                className="relative flex flex-col h-38 sm:h-42 w-full bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 hover:z-10 transition-all text-center group active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation cursor-pointer shadow-xs"
              >
                {/* Top Half: Image */}
                <div className="w-full h-18 sm:h-20 bg-white flex items-center justify-center p-2 border-b border-slate-100 rounded-t-xl overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt="" 
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <Package className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300 group-hover:scale-105 transition-transform duration-200" />
                  )}
                </div>

                {/* Bottom Half: Name & Price */}
                <div className="w-full flex-1 p-2 flex flex-col justify-between items-center bg-slate-50 group-hover:bg-indigo-50/40 rounded-b-xl relative">
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 line-clamp-2 px-0.5 text-center leading-tight">
                      {product.name}
                    </span>
                  </div>
                  {isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 line-through leading-none">
                        {product.price} {product.currency || 'TRY'}
                      </span>
                      <span className="text-xs font-extrabold text-rose-600 leading-tight">
                        {product.price_2} {product.currency || 'TRY'}
                      </span>
                    </div>
                  ) : (
                    (() => {
                      let vars: any[] = [];
                      if (product.variants) {
                        if (typeof product.variants === "string") {
                          try { vars = JSON.parse(product.variants); } catch (e) { vars = []; }
                        } else if (Array.isArray(product.variants)) {
                          vars = product.variants;
                        }
                      }
                      const varPrices = vars
                        .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
                        .filter((pr: number) => !isNaN(pr) && pr > 0);

                      if (varPrices.length > 0) {
                        const minP = Math.min(...varPrices);
                        const maxP = Math.max(...varPrices);
                        return (
                          <span className="text-[11px] font-bold text-indigo-700 font-mono mt-1 whitespace-nowrap tabular-nums">
                            {minP === maxP ? `${minP}` : `${minP} - ${maxP}`} {product.currency || 'TRY'}
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs font-bold text-indigo-700 font-mono mt-1 whitespace-nowrap tabular-nums">
                          {product.price} {product.currency || 'TRY'}
                        </span>
                      );
                    })()
                  )}
                </div>

                {/* Full-card Elegant Overlay on Hover/Focus */}
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs text-white flex flex-col items-center justify-center p-2.5 rounded-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 pointer-events-none z-10 text-center">
                  <ShoppingCart className="h-4 w-4 text-indigo-400 mb-1 animate-bounce" />
                  <p className="text-xs font-extrabold line-clamp-2 px-1 leading-snug">{product.name}</p>
                  {isHappyHourActive && product.price_2 && parseFloat(product.price_2.toString()) > 0 ? (
                    <div className="text-center mt-1">
                      <span className="text-[10px] text-slate-300 line-through block leading-none">
                        {product.price} {product.currency || 'TRY'}
                      </span>
                      <span className="text-xs text-rose-400 font-extrabold leading-tight">
                        {product.price_2} {product.currency || 'TRY'}
                      </span>
                    </div>
                  ) : (
                    (() => {
                      let vars: any[] = [];
                      if (product.variants) {
                        if (typeof product.variants === "string") {
                          try { vars = JSON.parse(product.variants); } catch (e) { vars = []; }
                        } else if (Array.isArray(product.variants)) {
                          vars = product.variants;
                        }
                      }
                      const varPrices = vars
                        .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
                        .filter((pr: number) => !isNaN(pr) && pr > 0);

                      const displayPrice = varPrices.length > 0
                        ? (Math.min(...varPrices) === Math.max(...varPrices) ? `${Math.min(...varPrices)}` : `${Math.min(...varPrices)} - ${Math.max(...varPrices)}`)
                        : product.price;

                      return (
                        <p className="text-xs text-indigo-300 mt-1 font-black">{displayPrice} {product.currency || 'TRY'}</p>
                      );
                    })()
                  )}
                  <span className="text-[9px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded mt-1 tracking-wider">
                    {lang === 'tr' ? 'SEPETE EKLE' : 'ADD TO CART'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : searchTerm.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
            <Search className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-xs font-medium">{lang === 'tr' ? 'Ürün bulunamadı' : 'No products found'}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
            <Barcode className="h-12 w-12 mb-3 opacity-10" />
            <p className="text-xs font-medium">{lang === 'tr' ? 'Satış yapmak için ürün seçin veya barkod okutun' : 'Select products or scan barcode to start sale'}</p>
          </div>
        )}
      </div>
    </>
  );
};

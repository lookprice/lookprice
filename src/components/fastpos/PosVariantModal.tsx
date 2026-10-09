import React from 'react';
import { motion } from 'motion/react';
import { Package, X } from 'lucide-react';
import { translateText } from '../../utils/translator';

interface PosVariantModalProps {
  variantModalProduct: any | null;
  onClose: () => void;
  lang: string;
  isCafeRestaurant: boolean;
  addToCart: (product: any, variant?: any) => void;
}

export const PosVariantModal: React.FC<PosVariantModalProps> = ({
  variantModalProduct,
  onClose,
  lang,
  isCafeRestaurant,
  addToCart,
}) => {
  if (!variantModalProduct) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{variantModalProduct.name}</h3>
              <p className="text-xs text-indigo-600 font-bold">
                {lang === 'tr' ? 'Lütfen seçenek seçiniz' : 'Please select an option'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            {lang === 'tr' ? 'Seçenekler & Varyantlar' : 'Options & Variants'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(variantModalProduct.variants || []).map((v: any, idx: number) => {
              const varPrice = v.price && parseFloat(v.price) > 0 ? v.price : variantModalProduct.price;
              const vStock = v.stock_quantity !== undefined && v.stock_quantity !== null && v.stock_quantity !== "" ? Number(v.stock_quantity) : undefined;
              const isOutOfStock = !isCafeRestaurant && vStock !== undefined && vStock <= 0;

              return (
                <button
                  key={v.id || idx}
                  disabled={isOutOfStock}
                  onClick={() => {
                    addToCart(variantModalProduct, v);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center group cursor-pointer shadow-xs relative ${
                    isOutOfStock 
                      ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 active:scale-95'
                  }`}
                >
                  {/* Image or Color Badge if present */}
                  {v.image_url ? (
                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
                      <img src={v.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : v.color_code ? (
                    <div 
                      className="w-7 h-7 rounded-full border border-slate-300 shadow-xs mb-2" 
                      style={{ backgroundColor: v.color_code }} 
                      title={v.color_name || v.name}
                    />
                  ) : null}

                  <span className="text-sm font-black text-slate-900 group-hover:text-indigo-700 leading-tight">
                    {translateText(v.name, lang as any)}
                  </span>

                  {v.barcode && (
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      {v.barcode}
                    </span>
                  )}

                  <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-indigo-600">
                      {varPrice} {variantModalProduct.currency || 'TRY'}
                    </span>
                    {vStock !== undefined && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isOutOfStock ? (lang === 'tr' ? 'Tükendi' : 'Out') : `${vStock} ${lang === 'tr' ? 'stok' : 'qty'}`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
          >
            {lang === 'tr' ? 'İptal' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

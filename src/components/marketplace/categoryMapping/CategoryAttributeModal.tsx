import React from 'react';
import { X, SlidersHorizontal, Sparkles, RefreshCw } from 'lucide-react';
import { MarketplaceAttribute } from '@/data/marketplaceCategoriesData';
import { MarketplaceType, PRODUCT_FIELD_OPTIONS } from './types';

interface CategoryAttributeModalProps {
  attributeModalCategory: {
    localCat: string;
    marketCatId: string | number;
    marketCatName: string;
  } | null;
  onClose: () => void;
  activeMarketplace: MarketplaceType;
  loadingAttributes: boolean;
  currentCategoryAttributes: MarketplaceAttribute[];
  attributesConfig: Record<MarketplaceType, Record<string, Record<string, any>>>;
  onUpdateAttributeValue: (attrId: string, mode: 'fixed' | 'field', value: string) => void;
  onAutoFillAttributes: () => void;
  lang?: string;
}

export const CategoryAttributeModal: React.FC<CategoryAttributeModalProps> = ({
  attributeModalCategory,
  onClose,
  activeMarketplace,
  loadingAttributes,
  currentCategoryAttributes,
  attributesConfig,
  onUpdateAttributeValue,
  onAutoFillAttributes,
  lang = 'tr',
}) => {
  if (!attributeModalCategory) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[94dvh] max-h-[94dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden my-auto">
        
        {/* SUB-MODAL HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shrink-0">
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base truncate">
                {attributeModalCategory.marketCatName}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                {lang === 'tr' ? 'Mağaza Kategorisi:' : 'Store Category:'} <strong className="text-slate-700">{attributeModalCategory.localCat}</strong> (#{attributeModalCategory.marketCatId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* INFO & QUICK ACTION */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center justify-between text-xs shrink-0 gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-indigo-900 font-medium min-w-0">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 shrink-0" />
            <span className="text-[11px] sm:text-xs truncate">
              {lang === 'tr' 
                ? 'Zorunlu alanları sabit değer veya ürün alanıyla bağlayın.' 
                : 'Map required attributes to static values or product fields.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onAutoFillAttributes}
            className="px-2 sm:px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold text-[10px] sm:text-[11px] hover:bg-indigo-50 transition-all cursor-pointer shrink-0"
          >
            {lang === 'tr' ? 'Önerilenleri Doldur' : 'Auto Fill'}
          </button>
        </div>

        {/* ATTRIBUTES LIST BODY */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 overflow-y-auto flex-1 min-h-0 space-y-3 sm:space-y-4">
          {loadingAttributes ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-semibold">{lang === 'tr' ? 'Pazaryeri nitelik şeması çekiliyor...' : 'Fetching category attributes...'}</p>
            </div>
          ) : currentCategoryAttributes.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'tr' ? 'Bu kategori için ek zorunlu nitelik bulunmuyor.' : 'No additional mandatory attributes for this category.'}
              </p>
            </div>
          ) : (
            currentCategoryAttributes.map((attr) => {
              const catId = String(attributeModalCategory.marketCatId);
              const existingSetting = (attributesConfig[activeMarketplace]?.[catId] || {})[attr.id] || {};
              const currentMode = existingSetting.mode || 'fixed';

              return (
                <div key={attr.id} className="p-3 sm:p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{attr.name}</span>
                      {attr.mandatory && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold rounded">
                          {lang === 'tr' ? 'Zorunlu' : 'Required'}
                        </span>
                      )}
                    </div>

                    {/* Mode Switcher: Fixed Value vs Product Field */}
                    <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => onUpdateAttributeValue(attr.id, 'fixed', existingSetting.value || '')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          currentMode === 'fixed' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'tr' ? 'Sabit Değer' : 'Fixed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateAttributeValue(attr.id, 'field', existingSetting.value || '$product.brand')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          currentMode === 'field' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'tr' ? 'Ürün Alanından Al' : 'Product Field'}
                      </button>
                    </div>
                  </div>

                  {attr.description && (
                    <p className="text-[11px] text-slate-500">{attr.description}</p>
                  )}

                  {/* Input Based on Mode & Type */}
                  {currentMode === 'field' ? (
                    <select
                      value={existingSetting.value || ''}
                      onChange={(e) => onUpdateAttributeValue(attr.id, 'field', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">{lang === 'tr' ? '-- Ürün Alanı Seçin --' : '-- Select Product Field --'}</option>
                      {PRODUCT_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : attr.values && attr.values.length > 0 ? (
                    <select
                      value={existingSetting.value || ''}
                      onChange={(e) => onUpdateAttributeValue(attr.id, 'fixed', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">{lang === 'tr' ? '-- Değer Seçin --' : '-- Select Value --'}</option>
                      {attr.values.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={attr.type === 'number' ? 'number' : 'text'}
                      placeholder={attr.placeholder || (lang === 'tr' ? 'Varsayılan değer yazın...' : 'Enter default value...')}
                      value={existingSetting.value || ''}
                      onChange={(e) => onUpdateAttributeValue(attr.id, 'fixed', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SUB-MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 shrink-0 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
          >
            {lang === 'tr' ? 'Tamamla & Uygula' : 'Done & Apply'}
          </button>
        </div>

      </div>
    </div>
  );
};

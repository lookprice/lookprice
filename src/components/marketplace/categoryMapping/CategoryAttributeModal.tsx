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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden my-auto">
        
        {/* SUB-MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">
                {attributeModalCategory.marketCatName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'tr' ? 'Mağaza Kategorisi:' : 'Store Category:'} <strong className="text-slate-700">{attributeModalCategory.localCat}</strong> (Kategori ID: #{attributeModalCategory.marketCatId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* INFO & QUICK ACTION */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-indigo-900 font-medium">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              {lang === 'tr' 
                ? 'Pazaryerinin istediği zorunlu alanları sabit değer veya ürün alanıyla bağlayın.' 
                : 'Map required attributes to static values or product fields.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onAutoFillAttributes}
            className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold text-[11px] hover:bg-indigo-50 transition-all cursor-pointer shrink-0"
          >
            {lang === 'tr' ? 'Önerilenleri Doldur' : 'Auto Fill'}
          </button>
        </div>

        {/* ATTRIBUTES LIST */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loadingAttributes ? (
            <div className="text-center py-12">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">{lang === 'tr' ? 'Özellikler yükleniyor...' : 'Loading attributes...'}</p>
            </div>
          ) : currentCategoryAttributes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              {lang === 'tr' ? 'Bu kategori için ek zorunlu özellik bulunamadı.' : 'No required attributes for this category.'}
            </p>
          ) : (
            currentCategoryAttributes.map((attr) => {
              const catId = String(attributeModalCategory.marketCatId);
              const existingSetting = attributesConfig[activeMarketplace]?.[catId]?.[attr.id] || {
                mode: attr.type === 'select' || attr.defaultValue ? 'fixed' : 'field',
                value: attr.defaultValue || ''
              };

              return (
                <div 
                  key={attr.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{attr.name}</span>
                      {attr.mandatory && (
                        <span className="text-[10px] px-2 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                          {lang === 'tr' ? 'Zorunlu' : 'Required'}
                        </span>
                      )}
                    </div>

                    {/* MODE SELECTOR (Fixed vs Field) */}
                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => onUpdateAttributeValue(attr.id, 'fixed', existingSetting.value || attr.defaultValue || '')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          existingSetting.mode === 'fixed'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {lang === 'tr' ? 'Sabit Değer' : 'Static'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateAttributeValue(attr.id, 'field', existingSetting.value || '$product.brand')}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          existingSetting.mode === 'field'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {lang === 'tr' ? 'Ürün Alanından Al' : 'From Product'}
                      </button>
                    </div>
                  </div>

                  {attr.description && (
                    <p className="text-[11px] text-slate-500">{attr.description}</p>
                  )}

                  {/* VALUE INPUT ACCORDING TO MODE */}
                  {existingSetting.mode === 'field' ? (
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
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-sm"
          >
            {lang === 'tr' ? 'Tamamla & Uygula' : 'Done & Apply'}
          </button>
        </div>

      </div>
    </div>
  );
};

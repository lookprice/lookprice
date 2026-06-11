import React from "react";
import { 
  Globe, 
  CreditCard, 
  Languages, 
  Building2, 
  Truck, 
  Plus, 
  Trash2, 
  MapPin, 
  RefreshCw, 
  Save 
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsStoreOpsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  lang: string;
  translations: any;
  isPortfolio: boolean;
  bulkPriceForm: any;
  setBulkPriceForm: (val: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => void;
}

export const SettingsStoreOpsTab = ({
  branding,
  onBrandingChange,
  onSaveBranding,
  lang,
  translations,
  isPortfolio,
  bulkPriceForm,
  setBulkPriceForm,
  handleBulkPriceSubmit
}: SettingsStoreOpsTabProps) => {
  const t = translations || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Currency & Language */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Para Birimi & Dil' : 'Currency & Language'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Yerelleştirme Ayarları' : 'Localization Settings'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.defaultCurrency}</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                value={branding.default_currency || "TRY"}
                onChange={(e) => onBrandingChange('default_currency', e.target.value)}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.defaultLanguage}</label>
            <div className="relative">
              <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                value={branding.default_language || branding.language || "tr"}
                onChange={(e) => onBrandingChange('language', e.target.value)}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-bold text-slate-900 mb-4">{t.crossExchangeRates || 'Çapraz Kurlar'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['USD', 'EUR', 'GBP'].map(curr => (
                <div key={curr} className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{curr} {t.rate || 'Kuru'}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.currency_rates?.[curr] || ""}
                      onChange={(e) => {
                        const rates = { ...(branding.currency_rates || {}) };
                        rates[curr] = parseFloat(e.target.value);
                        onBrandingChange('currency_rates', rates);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rates & Rules */}
      {!isPortfolio && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Vergi Ayarları</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Varsayılan KDV Oranı (%)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                  value={branding.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : '20'}
                  onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori KDV Kuralları</label>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="new-category-name"
                    placeholder="Kategori Adı"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    <input 
                      type="text" 
                      id="new-category-tax"
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                      const taxInput = document.getElementById('new-category-tax') as HTMLInputElement;
                      if (catInput.value.trim() && taxInput.value) {
                        const newRules = [...(branding.category_tax_rules || [])];
                        newRules.push({ category: catInput.value.trim(), taxRate: parseInt(taxInput.value.replace(/[^0-9]/g, '')) || 0 });
                        onBrandingChange('category_tax_rules', newRules);
                        catInput.value = '';
                        taxInput.value = '';
                      }
                    }}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
                
                <div className="space-y-2 mt-4">
                  {(branding.category_tax_rules || []).map((rule: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-700">{rule.category}</span>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">KDV %{rule.taxRate}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newRules = [...branding.category_tax_rules];
                          newRules.splice(idx, 1);
                          onBrandingChange('category_tax_rules', newRules);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-bold cursor-pointer"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Profiles */}
      {!isPortfolio && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Kargo Ayarları</h3>
            </div>
            <button 
              type="button"
              onClick={() => {
                const newProfiles = [...(branding.shipping_profiles || []), { id: Date.now().toString(), name: '', cost: 0, currency: branding.default_currency || 'TRY' }];
                onBrandingChange('shipping_profiles', newProfiles);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Yeni Profil
            </button>
          </div>
          
          <div className="space-y-4">
            {(branding.shipping_profiles || []).map((profile: any, index: number) => (
              <div key={profile.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex-1 w-full">
                  <input 
                    value={profile.name} 
                    onChange={(e) => { 
                      const p = [...branding.shipping_profiles]; 
                      p[index].name = e.target.value; 
                      onBrandingChange('shipping_profiles', p); 
                    }} 
                    placeholder="Profil Adı" 
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold mb-2 font-sans" 
                  />
                  <div className="flex gap-2">
                     <input 
                       type="number" 
                       value={profile.cost} 
                       onChange={(e) => { 
                         const p = [...branding.shipping_profiles]; 
                         p[index].cost = parseFloat(e.target.value); 
                         onBrandingChange('shipping_profiles', p); 
                       }} 
                       placeholder="Ücret" 
                       className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
                     />
                     <input disabled value={profile.currency} className="w-20 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold font-sans" />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { 
                    const p = [...branding.shipping_profiles]; 
                    p.splice(index, 1); 
                    onBrandingChange('shipping_profiles', p); 
                  }} 
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Locator & Reservations */}
      {!isPortfolio && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Mağaza ve Rezervasyon</h3>
            </div>
          </div>
          
          <div className="space-y-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!branding.reservation_enabled}
                onChange={(e) => onBrandingChange('reservation_enabled', e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-900 font-sans">Mağazadan Teslimat (Rezervasyon) Aktif Et</span>
            </label>

            <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">Mağaza Konumları</h4>
               {(branding.locations || []).map((loc: any, idx: number) => (
                 <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl items-center">
                   <input 
                     name={`location_name_${idx}`} 
                     id={`location_name_${idx}`} 
                     value={loc.name} 
                     onChange={(e) => { 
                       const l = [...(branding.locations||[])]; 
                       l[idx] = { ...l[idx], name: e.target.value }; 
                       onBrandingChange('locations', l); 
                     }} 
                     placeholder="Mağaza Adı" 
                     className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
                   />
                   <input 
                     name={`location_address_${idx}`} 
                     id={`location_address_${idx}`} 
                     value={loc.address} 
                     onChange={(e) => { 
                       const l = [...(branding.locations||[])]; 
                       l[idx] = { ...l[idx], address: e.target.value }; 
                       onBrandingChange('locations', l); 
                     }} 
                     placeholder="Adres" 
                     className="col-span-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
                   />
                 </div>
               ))}
               <button 
                 type="button"
                 onClick={() => onBrandingChange('locations', [...(branding.locations || []), { name: '', address: '', active: true }])}
                 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
               >
                 Mağaza Ekle
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Update */}
      {!isPortfolio && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Toplu Fiyat Güncelleme</h3>
          </div>
          
          <form onSubmit={handleBulkPriceSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Hedef</label>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 cursor-pointer"
                  value={bulkPriceForm.target}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, target: e.target.value })}
                >
                  <option value="all">Tüm Ürünler</option>
                  <option value="category">Kategori Bazlı</option>
                </select>
              </div>
              {bulkPriceForm.target === 'category' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 font-sans"
                    value={bulkPriceForm.category || ''}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">İşlem Tipi</label>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 cursor-pointer"
                  value={bulkPriceForm.type}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value })}
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit Tutar</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Yön</label>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 cursor-pointer"
                  value={bulkPriceForm.direction}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, direction: e.target.value })}
                >
                  <option value="increase">Artır</option>
                  <option value="decrease">Azalt</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Değer</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 font-sans"
                  value={bulkPriceForm.value}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] cursor-pointer"
            >
              Fiyatları Güncelle
            </button>
          </form>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button 
          type="button"
          onClick={onSaveBranding} 
          className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          Tüm Mağaza Ayarlarını Kaydet
        </button>
      </div>
    </motion.div>
  );
};

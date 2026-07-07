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
import { toast } from "sonner";

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
  products?: any[];
  savingBranding?: boolean;
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
  handleBulkPriceSubmit,
  products = [],
  savingBranding
}: SettingsStoreOpsTabProps) => {
  const t = translations || {};

  const allStoreCategories = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort((a,b) => a.localeCompare(b, "tr"));
  }, [products]);

  const allStoreSubCategories = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.sub_category) set.add(p.sub_category.trim());
    });
    return Array.from(set).sort((a,b) => a.localeCompare(b, "tr"));
  }, [products]);

  const getOtherAssignedCategories = (currIdx: number) => {
    const map: Record<string, string> = {};
    (branding.shipping_profiles || []).forEach((p: any, idx: number) => {
      if (idx === currIdx) return;
      const cats = p.categories_str ? p.categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      cats.forEach((cat: string) => {
        map[cat] = p.name || `Profil #${idx + 1}`;
      });
    });
    return map;
  };

  const getOtherAssignedSubCategories = (currIdx: number) => {
    const map: Record<string, string> = {};
    (branding.shipping_profiles || []).forEach((p: any, idx: number) => {
      if (idx === currIdx) return;
      const subs = p.sub_categories_str ? p.sub_categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      subs.forEach((sub: string) => {
        map[sub] = p.name || `Profil #${idx + 1}`;
      });
    });
    return map;
  };

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
                  {(() => {
                    const otherAssignedCats = getOtherAssignedCategories(index);
                    const otherAssignedSubs = getOtherAssignedSubCategories(index);
                    const selectedCats = profile.categories_str ? profile.categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                    const selectedSubs = profile.sub_categories_str ? profile.sub_categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

                    return (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Eşleşen Kategoriler (Grup Atama)</label>
                          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px] items-center">
                            {selectedCats.map((cat: string) => (
                              <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm">
                                {cat}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedCats.filter((c: string) => c !== cat);
                                    const p = [...branding.shipping_profiles];
                                    p[index].categories_str = updated.join(', ');
                                    onBrandingChange('shipping_profiles', p);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-600 font-bold focus:outline-none transition-colors ml-1 w-3.5 h-3.5 rounded-full hover:bg-indigo-100 flex items-center justify-center text-[10px]"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                            {selectedCats.length === 0 && (
                              <span className="text-xs text-slate-400 italic py-0.5">{lang === 'tr' ? "Kategori seçilmedi" : "No category selected"}</span>
                            )}
                          </div>
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const p = [...branding.shipping_profiles];
                              const updated = [...selectedCats, val];
                              p[index].categories_str = updated.join(', ');
                              onBrandingChange('shipping_profiles', p);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold font-sans outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="">{lang === 'tr' ? "+ Kategori Seç..." : "+ Choose Category..."}</option>
                            {allStoreCategories.map((cat: string) => {
                              const isAssignedToCurrent = selectedCats.includes(cat);
                              const assignedToProfile = otherAssignedCats[cat];
                              if (isAssignedToCurrent) return null;
                              return (
                                <option
                                  key={cat}
                                  value={cat}
                                  disabled={!!assignedToProfile}
                                  className={assignedToProfile ? "text-slate-400 italic" : "text-slate-800 font-medium"}
                                >
                                  {cat} {assignedToProfile ? `(Zaten Atandı: ${assignedToProfile})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Eşleşen Alt Kategoriler (Grup Atama)</label>
                          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px] items-center">
                            {selectedSubs.map((sub: string) => (
                              <span key={sub} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 shadow-sm">
                                {sub}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = selectedSubs.filter((s: string) => s !== sub);
                                    const p = [...branding.shipping_profiles];
                                    p[index].sub_categories_str = updated.join(', ');
                                    onBrandingChange('shipping_profiles', p);
                                  }}
                                  className="text-amber-400 hover:text-amber-600 font-bold focus:outline-none transition-colors ml-1 w-3.5 h-3.5 rounded-full hover:bg-amber-100 flex items-center justify-center text-[10px]"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                            {selectedSubs.length === 0 && (
                              <span className="text-xs text-slate-400 italic py-0.5">{lang === 'tr' ? "Alt kategori seçilmedi" : "No subcategory selected"}</span>
                            )}
                          </div>
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const p = [...branding.shipping_profiles];
                              const updated = [...selectedSubs, val];
                              p[index].sub_categories_str = updated.join(', ');
                              onBrandingChange('shipping_profiles', p);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold font-sans outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="">{lang === 'tr' ? "+ Alt Kategori Seç..." : "+ Choose Sub-Category..."}</option>
                            {allStoreSubCategories.map((sub: string) => {
                              const isAssignedToCurrent = selectedSubs.includes(sub);
                              const assignedToProfile = otherAssignedSubs[sub];
                              if (isAssignedToCurrent) return null;
                              return (
                                <option
                                  key={sub}
                                  value={sub}
                                  disabled={!!assignedToProfile}
                                  className={assignedToProfile ? "text-slate-400 italic" : "text-slate-800 font-medium"}
                                >
                                  {sub} {assignedToProfile ? `(Zaten Atandı: ${assignedToProfile})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
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

      {/* Store Locator & Locations */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
              {isPortfolio ? (lang === 'tr' ? 'Ofis / Şube Konumları' : 'Office / Branch Locations') : (lang === 'tr' ? 'Mağaza ve Rezervasyon' : 'Store & Reservation')}
            </h3>
          </div>
        </div>
        
        <div className="space-y-6">
          {!isPortfolio && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={!!branding.reservation_enabled}
                onChange={(e) => onBrandingChange('reservation_enabled', e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-900 font-sans">Mağazadan Teslimat (Rezervasyon) Aktif Et</span>
            </label>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans flex items-center justify-between">
              <span>{isPortfolio ? (lang === 'tr' ? 'Ofis Konumları' : 'Office Locations') : (lang === 'tr' ? 'Mağaza Konumları' : 'Store Locations')}</span>
              <span className="text-[9px] lowercase font-bold text-slate-300 normal-case">{lang === 'tr' ? '(enlem, boylam yapıştırabilirsiniz)' : '(you can paste lat, lng)'}</span>
            </h4>
               {(branding.locations || []).map((loc: any, idx: number) => (
                 <div key={idx} className="bg-slate-50 p-4 rounded-xl space-y-3 relative group/loc">
                   <button 
                     type="button"
                     onClick={() => {
                       const l = [...(branding.locations||[])];
                       l.splice(idx, 1);
                       onBrandingChange('locations', l);
                     }}
                     className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-slate-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/loc:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-50"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
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
                       className="md:col-span-3 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
                     />
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">LAT</span>
                       <input 
                         type="text"
                         value={loc.lat || ''} 
                         onChange={(e) => { 
                           const val = e.target.value;
                           const l = [...(branding.locations||[])]; 
                           if (val.includes(',')) {
                             const [latStr, lngStr] = val.split(',').map(s => s.trim());
                             const lat = parseFloat(latStr);
                             const lng = parseFloat(lngStr);
                             l[idx] = { ...l[idx], lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng }; 
                           } else {
                             const lat = parseFloat(val);
                             l[idx] = { ...l[idx], lat: isNaN(lat) ? 0 : lat }; 
                           }
                           onBrandingChange('locations', l); 
                         }} 
                         placeholder="Latitude" 
                         className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans focus:border-amber-400 outline-none transition-colors" 
                       />
                     </div>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">LNG</span>
                       <input 
                         type="text"
                         value={loc.lng || ''} 
                         onChange={(e) => { 
                           const val = e.target.value;
                           const l = [...(branding.locations||[])]; 
                           if (val.includes(',')) {
                             const [latStr, lngStr] = val.split(',').map(s => s.trim());
                             const lat = parseFloat(latStr);
                             const lng = parseFloat(lngStr);
                             l[idx] = { ...l[idx], lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng }; 
                           } else {
                             const lng = parseFloat(val);
                             l[idx] = { ...l[idx], lng: isNaN(lng) ? 0 : lng }; 
                           }
                           onBrandingChange('locations', l); 
                         }} 
                         placeholder="Longitude" 
                         className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans focus:border-amber-400 outline-none transition-colors" 
                       />
                     </div>
                     <button 
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            const l = [...(branding.locations||[])];
                            l[idx] = { ...l[idx], lat: pos.coords.latitude, lng: pos.coords.longitude };
                            onBrandingChange('locations', l);
                            toast.success(lang === 'tr' ? "Konum alındı" : "Location captured");
                          }, (err) => {
                            toast.error(lang === 'tr' ? "Konum alınamadı" : "Could not get location");
                          });
                        }
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-tight flex items-center justify-center gap-2"
                     >
                       <MapPin className="w-3 h-3" />
                       {lang === 'tr' ? 'Şu Anki Konum' : 'Current Location'}
                     </button>
                   </div>
                 </div>
               ))}
               <button 
                 type="button"
                 onClick={() => onBrandingChange('locations', [...(branding.locations || []), { name: '', address: '', active: true, lat: 0, lng: 0 }])}
                 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
               >
                 Mağaza Ekle
               </button>
            </div>
          </div>
        </div>

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

      <div className="pb-20"></div>
    </motion.div>
  );
};

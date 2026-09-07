import React, { useState } from "react";
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
  Save,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Store,
  User,
  Phone,
  Mail,
  Building,
  Upload,
  Image
} from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../services/api";
import { IrpModal } from "../../../components/IrpModal";
import { HotelUpgradeModal } from "../../../components/modals/HotelUpgradeModal";

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
  currentStoreId?: number;
  storeCode?: string;
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
  savingBranding,
  currentStoreId,
  storeCode
}: SettingsStoreOpsTabProps) => {
  const [syncingTcmb, setSyncingTcmb] = useState(false);
  const [isIrpModalOpen, setIsIrpModalOpen] = useState(false);
  const [isHotelUpgradeModalOpen, setIsHotelUpgradeModalOpen] = useState(false);
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const t = translations || {};
  const txt = (tr: string, en: string, el: string) => {
    if (lang === 'tr') return tr;
    if (lang === 'el') return el;
    return en;
  };

  const handleSyncTcmb = async () => {
    try {
      setSyncingTcmb(true);
      const res = await api.syncTcmbRates(currentStoreId);
      if (res && res.rates) {
        onBrandingChange('currency_rates', res.rates);
        alert(txt("TCMB kurları başarıyla güncellendi!", "TCMB rates updated successfully!", "Οι τιμές TCMB ενημερώθηκαν επιτυχώς!"));
      }
    } catch (err: any) {
      console.error("Failed to sync TCMB rates:", err);
      alert(txt("Kur güncellenemedi: ", "Failed to update rates: ", "Αποτυχία ενημέρωσης τιμών: ") + (err.message || ''));
    } finally {
      setSyncingTcmb(false);
    }
  };

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
      {/* Store Security & Store Code */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-tight tracking-tight">{lang === 'tr' ? 'Kurumsal Güvenlik & Mağaza Kodu' : 'Corporate Security & Store Code'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'LookPrice Güvenlik Standartları' : 'LookPrice Security Standards'}</p>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 mb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  {lang === 'tr' 
                    ? 'Hesabınızın çok faktörlü izolasyonu için mağazanıza özel oluşturulmuş güvenlik kodudur. Personel ve yöneticileriniz giriş ekranında bu kodu kullanarak yetkisiz erişimleri önleyebilir.' 
                    : 'This is a unique security code generated for your store for multi-tenant isolation. Your staff and managers can use this on the login screen to prevent unauthorized access.'}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {lang === 'tr' ? 'Aktif Korumalı' : 'Active Protection'}
                </div>
              </div>
              <div className="flex-shrink-0 bg-white/10 p-4 rounded-xl border border-white/5 text-center flex flex-col justify-center items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{lang === 'tr' ? 'MAĞAZA KODUNUZ' : 'YOUR STORE CODE'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-black tracking-widest font-mono text-white">{storeCode || 'LP-XXXXXX'}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(storeCode || 'LP-XXXXXX');
                      alert(lang === 'tr' ? 'Kopyalandı!' : 'Copied!');
                    }}
                    type="button"
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsIrpModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-rose-500/20"
            >
              <ShieldAlert className="w-4 h-4" />
              {lang === 'tr' ? 'Olay Müdahale Planı (IRP)' : 'Incident Response Plan (IRP)'}
            </button>
          </div>
          <IrpModal isOpen={isIrpModalOpen} onClose={() => setIsIrpModalOpen(false)} lang={lang} />
        </div>
      </div>

      {/* Mağaza & İşletme Profil Bilgileri */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{lang === 'tr' ? 'İşletme & Mağaza Temel Profil Bilgileri' : 'Business & Store Profile'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Süperadmin ve Müşteri Panelleri ile Tam Eşzamanlı Profil Bilgileri' : 'Synced Credentials & Store Profile Settings'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSaveBranding}
            disabled={savingBranding}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer self-start md:self-auto"
          >
            <Save className={`w-4 h-4 ${savingBranding ? 'animate-spin' : ''}`} />
            <span>{savingBranding ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Profile')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MAĞAZA LOGOSU & KURUMSAL GÖRSEL KİMLİK */}
          <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider">
              <Image className="h-4 w-4 text-indigo-500" />
              <span>{lang === 'tr' ? 'Mağaza Logosu & Kurumsal Görsel Kimlik' : 'Store Logo & Corporate Identity'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* LOGO */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'tr' ? 'Mağaza Logosu' : 'Store Logo'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">Logo Yok</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      id="store_ops_logo_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 8 * 1024 * 1024) {
                          alert(lang === 'tr' ? "Logo boyutu 8MB'dan küçük olmalıdır" : "File must be under 8MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            onBrandingChange('logo_url', reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => document.getElementById('store_ops_logo_upload')?.click()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{lang === 'tr' ? 'Logo Yükle' : 'Upload'}</span>
                      </button>
                      {branding.logo_url && (
                        <button
                          type="button"
                          onClick={() => onBrandingChange('logo_url', '')}
                          className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={branding.logo_url || ""}
                      onChange={(e) => onBrandingChange('logo_url', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* FAVICON */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'tr' ? 'Favicon (Tarayıcı İkonu)' : 'Favicon Icon'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
                    {branding.favicon_url ? (
                      <img src={branding.favicon_url} alt="Favicon" className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400">Favicon</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      id="store_ops_favicon_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            onBrandingChange('favicon_url', reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('store_ops_favicon_upload')?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{lang === 'tr' ? 'Favicon Yükle' : 'Upload'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Favicon URL..."
                      value={branding.favicon_url || ""}
                      onChange={(e) => onBrandingChange('favicon_url', e.target.value)}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Mağaza / Tabela Adı' : 'Store / Brand Name'}</label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder={lang === 'tr' ? 'Örn: Seçkin Emlak & Otomotiv' : 'e.g. VIP Store'}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.store_name || branding.name || ""}
                onChange={(e) => {
                  onBrandingChange('store_name', e.target.value);
                  onBrandingChange('name', e.target.value);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Yetkili Kişi Adı Soyadı' : 'Contact Person'}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder={lang === 'tr' ? 'Örn: Serdar Erdekli' : 'e.g. John Doe'}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.contact_person || ""}
                onChange={(e) => onBrandingChange('contact_person', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'İşletme İletişim Telefonu' : 'Primary Phone'}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Örn: +90 548 890 23 09"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.phone || ""}
                onChange={(e) => onBrandingChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'İşletme E-Posta Adresi' : 'Primary Email'}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="email" 
                placeholder="Örn: bilgi@seckinmagaza.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.email || ""}
                onChange={(e) => onBrandingChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'İşletme Fiziki Adresi' : 'Store Physical Address'}</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <textarea 
                rows={2}
                placeholder={lang === 'tr' ? 'Örn: Girne Caddesi No:12/A Alsancak, KKTC' : 'e.g. Main Street No:12'}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.address || ""}
                onChange={(e) => onBrandingChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* GOOGLE MAPS KONUM LINKI & EMBED ENTEGRASYONU */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {lang === 'tr' ? 'Google Maps Konum Linki (Harita Pini)' : 'Google Maps Location URL'}
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Örn: https://maps.app.goo.gl/xyz..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.google_maps_url || ""}
                onChange={(e) => onBrandingChange('google_maps_url', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {lang === 'tr' ? 'Google Maps iFrame Embed Kodu / URL' : 'Google Maps Embed iFrame Code'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder='Örn: https://www.google.com/maps/embed?pb=... veya <iframe src="..."></iframe>'
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100"
                value={branding.google_maps_embed || ""}
                onChange={(e) => onBrandingChange('google_maps_embed', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Mağaza Şablon Türü (Sektör)' : 'Store Type'}</label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 dark:text-slate-100 appearance-none cursor-pointer"
                value={branding.store_type || "product"}
                onChange={(e) => onBrandingChange('store_type', e.target.value)}
              >
                <option value="product">shopLP - Perakende / Genel Ürün Mağazası</option>
                <option value="cafe_restaurant">horecaLP - Kafeterya, Restoran & Otel</option>
                <option value="real_estate">Emlak Portföy Mağazası</option>
                <option value="automotive">Oto Galeri / Araç İlan Mağazası</option>
              </select>
            </div>
          </div>

          {(branding.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant') && (
            <div className="space-y-2 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'HorecaLP Konsept / Alt Tür' : 'HorecaLP Concept / Sub-type'}</label>
                <div className="flex items-center gap-1.5">
                  {!branding.hotel_license_enabled && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {lang === 'tr' ? '🔒 Üst Paket Gerekir' : '🔒 Upgrade Required'}
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${branding.hotel_module_enabled ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                    {branding.hotel_module_enabled 
                      ? (lang === 'tr' ? 'Otel & Restoran' : 'Hotel & Restaurant') 
                      : (lang === 'tr' ? 'Sadece Restoran / Kafe' : 'Restaurant & Cafe Only')}
                  </span>
                </div>
              </div>
              <div 
                onClick={() => {
                  if (!branding.hotel_license_enabled && !branding.hotel_module_enabled) {
                    setIsHotelUpgradeModalOpen(true);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${branding.hotel_module_enabled ? 'bg-amber-500/15 border-amber-500/40' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} ${!branding.hotel_license_enabled ? 'cursor-pointer hover:border-amber-400' : ''}`}
              >
                <input 
                  type="checkbox"
                  id="chk_hotel_module_primary"
                  className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer ml-2"
                  checked={!!branding.hotel_module_enabled}
                  onChange={(e) => {
                    if (e.target.checked && !branding.hotel_license_enabled) {
                      setIsHotelUpgradeModalOpen(true);
                      return;
                    }
                    onBrandingChange('hotel_module_enabled', e.target.checked);
                  }}
                />
                <label htmlFor="chk_hotel_module_primary" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer flex-1">
                  {lang === 'tr' ? 'Otel & Konaklama Modülünü Aktif Et (Oda Yönetimi & Adisyon)' : 'Enable Hotel & Room Module'}
                </label>
                {!branding.hotel_license_enabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHotelUpgradeModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg transition-all"
                  >
                    {lang === 'tr' ? 'Bilgi & Yükselt' : 'Upgrade'}
                  </button>
                )}
              </div>

              {/* Otel Rezervasyon & Takvim Tarih Görünüm Formatı */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  {lang === 'tr' ? 'Otel Rezervasyon & Folyo Tarih Formatı' : 'Hotel Reservation & Folio Date Format'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { id: 'DD/MM/YYYY', label: 'GG/AA/YYYY (Örn: 25/08/2026)', badge: 'Varsayılan' },
                    { id: 'DD.MM.YYYY', label: 'GG.AA.YYYY (Örn: 25.08.2026)', badge: 'Noktalı' },
                    { id: 'DD-MM-YYYY', label: 'GG-AA-YYYY (Örn: 25-08-2026)', badge: 'Tireli' },
                    { id: 'DD MMM YYYY', label: 'GG Ay YYYY (Örn: 25 Ağustos 2026)', badge: 'Metin' },
                    { id: 'YYYY-MM-DD', label: 'YYYY-AA-GG (Örn: 2026-08-25)', badge: 'ISO' },
                  ].map(fmt => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        onBrandingChange('hotel_date_format', fmt.id);
                        try {
                          localStorage.setItem(`hotelDateFormat_${currentStoreId}`, fmt.id);
                        } catch (e) {}
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        (branding.hotel_date_format || 'DD/MM/YYYY') === fmt.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{fmt.id}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">{fmt.badge}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{fmt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <HotelUpgradeModal
        isOpen={isHotelUpgradeModalOpen}
        onClose={() => setIsHotelUpgradeModalOpen(false)}
        lang={lang}
        storeName={branding.store_name || branding.name}
      />

      {/* Currency & Language */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{lang === 'tr' ? 'Para Birimi & Dil' : 'Currency & Language'}</h3>
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
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">{txt('Çapraz Kurlar', 'Cross Exchange Rates', 'Συναλλαγματικές Ισοτιμίες')}</h4>
              <button
                type="button"
                onClick={handleSyncTcmb}
                disabled={syncingTcmb}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingTcmb ? 'animate-spin' : ''}`} />
                {txt("TCMB'den Canlı Çek", "Sync from TCMB", "Συγχρονισμός TCMB")}
              </button>
            </div>
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

      {/* Resmi Firma Bilgileri / Legal Store Registration */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Resmi Firma Bilgileri' : 'Official/Legal Store Registration'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Teklif, Fatura, Teknik Servis ve Mutabakatlar İçin Resmi Kayıtlar' : 'Official Credentials for Offers, Invoices, Service Forms & Reconciliations'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Resmi Firma Ünvanı' : 'Official/Legal Company Title'}</label>
            <input 
              type="text" 
              placeholder={lang === 'tr' ? 'Örn: Serdar Erdekli (Şahıs Şirketi) veya GAP Bilişim Ltd. Şti.' : 'e.g. Serdar Erdekli or GAP Bilişim Ltd. Sti.'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_name || ""}
              onChange={(e) => onBrandingChange('legal_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}</label>
            <input 
              type="text" 
              placeholder="Örn: Beşiktaş"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_tax_office || ""}
              onChange={(e) => onBrandingChange('legal_tax_office', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Vergi Numarası / T.C. Kimlik' : 'Tax Number / ID'}</label>
            <input 
              type="text" 
              placeholder="Örn: 1234567890"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_tax_number || ""}
              onChange={(e) => onBrandingChange('legal_tax_number', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Mersis Numarası (Opsiyonel)' : 'Mersis Number (Optional)'}</label>
            <input 
              type="text" 
              placeholder="Örn: 0123456789000014"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_mersis || ""}
              onChange={(e) => onBrandingChange('legal_mersis', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Resmi İletişim Telefonu' : 'Official Phone'}</label>
            <input 
              type="text" 
              placeholder="Örn: +90 532 000 00 00"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_phone || ""}
              onChange={(e) => onBrandingChange('legal_phone', e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Resmi Tebligat Adresi' : 'Official Registered Address'}</label>
            <textarea 
              rows={2}
              placeholder={lang === 'tr' ? 'Örn: Merkez Mahallesi, Ticaret Caddesi No: 45, Beşiktaş / İstanbul' : 'e.g. Registered legal address of company'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
              value={branding.legal_address || ""}
              onChange={(e) => onBrandingChange('legal_address', e.target.value)}
            />
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
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{txt('Vergi Ayarları', 'Tax Settings', 'Ρυθμίσεις Φόρων')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{txt('Varsayılan KDV Oranı (%)', 'Default VAT Rate (%)', 'Προεπιλεγμένος Συντελεστής ΦΠΑ (%)')}</label>
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
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{txt('Kategori KDV Kuralları', 'Category VAT Rules', 'Κανόνες ΦΠΑ ανά Κατηγορία')}</label>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
                  <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{txt('Mevcut Kategori', 'Existing Category', 'Υπάρχουσα Κατηγορία')}</label>
                      <select 
                        id="new-category-select"
                        onChange={(e) => {
                          const val = e.target.value;
                          const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                          if (catInput) {
                            if (val !== '__custom__' && val !== '') {
                              catInput.value = val;
                            } else {
                              catInput.value = '';
                            }
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:outline-none"
                      >
                        <option value="">{txt('Seçin veya Elle Yazın...', 'Select or Type Manually...', 'Επιλέξτε ή Πληκτρολογήστε...')}</option>
                        {allStoreCategories.map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{txt('Kategori Adı', 'Category Name', 'Όνομα Κατηγορίας')}</label>
                      <input 
                        type="text" 
                        id="new-category-name"
                        placeholder={txt('Kategori Adı girin', 'Enter Category Name', 'Εισάγετε Όνομα Κατηγορίας')}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex gap-3 items-end">
                    <div className="w-24 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{txt('KDV Oranı', 'VAT Rate', 'ΦΠΑ')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                        <input 
                          type="text" 
                          id="new-category-tax"
                          placeholder="20"
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                        const taxInput = document.getElementById('new-category-tax') as HTMLInputElement;
                        const selectElement = document.getElementById('new-category-select') as HTMLSelectElement;
                        if (catInput.value.trim() && taxInput.value) {
                          const newRules = [...(branding.category_tax_rules || [])];
                          newRules.push({ category: catInput.value.trim(), taxRate: parseInt(taxInput.value.replace(/[^0-9]/g, '')) || 0 });
                          onBrandingChange('category_tax_rules', newRules);
                          catInput.value = '';
                          taxInput.value = '';
                          if (selectElement) selectElement.value = '';
                        }
                      }}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 cursor-pointer h-[42px] flex items-center justify-center min-w-[80px]"
                    >
                      {txt('Ekle', 'Add', 'Προσθήκη')}
                    </button>
                  </div>
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
      {!isPortfolio && !isCafeRestaurant && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{txt('Kargo Ayarları', 'Shipping Settings', 'Ρυθμίσεις Μεταφορικών')}</h3>
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
              <span className="text-sm font-bold text-slate-900 font-sans">{txt('Mağazadan Teslimat (Rezervasyon) Aktif Et', 'Enable In-Store Pickup (Reservation)', 'Ενεργοποίηση Παραλαβής από το Κατάστημα (Κράτηση)')}</span>
            </label>
          )}

          <div className="space-y-4">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-sans">
               {isPortfolio ? (lang === 'tr' ? 'Ofis Konumları' : 'Office Locations') : (lang === 'tr' ? 'Mağaza Konumları' : 'Store Locations')}
             </h4>
                {(branding.locations || []).map((loc: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl space-y-3">
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
                          className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
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
                          className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold font-sans" 
                        />
                      </div>
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

      {/* Cafe/Restaurant Settings */}
      {(branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant') && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 mb-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{txt('Kafe / Restoran Ayarları', 'Cafe / Restaurant Settings', 'Ρυθμίσεις Καφέ / Εστιατορίου')}</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{txt('Masa Sayısı', 'Number of Tables', 'Αριθμός Τραπεζιών')}</label>
                <div className="relative">
                   <input
                     type="number"
                     min="1"
                     max="200"
                     value={branding?.page_layout_settings?.table_count || 12}
                     onChange={(e) => onBrandingChange('page_layout_settings', { ...branding?.page_layout_settings, table_count: parseInt(e.target.value) || 12 })}
                     className="w-full pl-4 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 font-sans"
                   />
                </div>
                <p className="text-xs text-slate-500 font-medium ml-1">
                  Mekanınızdaki toplam masa sayısını belirtin. Bu sayı Fast POS / Masalar ekranında görünecektir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Update */}
      {!isPortfolio && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-900 dark:text-white">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{txt('Toplu Fiyat Güncelleme', 'Bulk Price Update', 'Μαζική Ενημέρωση Τιμών')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tüm ürün veya belirli kategori fiyatlarını yüzde ya da sabit tutarla otomatik güncelleyin.</p>
            </div>
          </div>
          
          <form onSubmit={handleBulkPriceSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Hedef</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                  value={bulkPriceForm.target}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, target: e.target.value })}
                >
                  <option value="all">{txt('Tüm Ürünler', 'All Products', 'Όλα τα Προϊόντα')}</option>
                  <option value="category">{txt('Kategori Bazlı', 'Category Based', 'Βάσει Κατηγορίας')}</option>
                </select>
              </div>
              {bulkPriceForm.target === 'category' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kategori</label>
                  <input 
                    type="text" 
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 font-sans focus:outline-none"
                    value={bulkPriceForm.category || ''}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{txt('İşlem Tipi', 'Operation Type', 'Τύπος Λειτουργίας')}</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                  value={bulkPriceForm.type}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value })}
                >
                  <option value="percentage">{txt('Yüzde (%)', 'Percentage (%)', 'Ποσοστό (%)')}</option>
                  <option value="fixed">Sabit Tutar</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{txt('Yön', 'Direction', 'Κατεύθυνση')}</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                  value={bulkPriceForm.direction}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, direction: e.target.value })}
                >
                  <option value="increase">{txt('Artır', 'Increase', 'Αύξηση')}</option>
                  <option value="decrease">Azalt</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{txt('Değer', 'Value', 'Αξία')}</label>
                <input 
                  type="number" 
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 font-sans focus:outline-none"
                  value={bulkPriceForm.value}
                  onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold tracking-tight transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Fiyatları Güncelle</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};

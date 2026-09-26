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
  Clock,
  Utensils,
  Percent,
  ChevronRight,
  Send,
  Smartphone,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../../../services/api";
import { IrpModal } from "../../../components/IrpModal";
import { HotelUpgradeModal } from "../../../components/modals/HotelUpgradeModal";
import { StaffWaiter, getStoreWaiters, generateWaiterWhatsappInviteUrl } from "../../../utils/staffHelpers";

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

type OpsSubTab = 'profile' | 'working_hours' | 'security' | 'currency' | 'legal_tax' | 'shipping' | 'locations' | 'horeca' | 'bulk_price';

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
  const [activeOpsTab, setActiveOpsTab] = useState<OpsSubTab>('profile');
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

  const navItems: { id: OpsSubTab; label: string; icon: any; show: boolean }[] = [
    { 
      id: 'profile', 
      label: lang === 'tr' ? 'Profil' : 'Profile', 
      icon: Store, 
      show: true 
    },
    { 
      id: 'working_hours', 
      label: lang === 'tr' ? 'Saatler' : 'Hours', 
      icon: Clock, 
      show: true 
    },
    { 
      id: 'security', 
      label: lang === 'tr' ? 'Güvenlik' : 'Security', 
      icon: ShieldCheck, 
      show: true 
    },
    { 
      id: 'currency', 
      label: lang === 'tr' ? 'Para & Dil' : 'Currency', 
      icon: Globe, 
      show: true 
    },
    { 
      id: 'legal_tax', 
      label: lang === 'tr' ? 'Firma & Vergi' : 'Legal', 
      icon: Building2, 
      show: true 
    },
    { 
      id: 'shipping', 
      label: lang === 'tr' ? 'Kargo' : 'Shipping', 
      icon: Truck, 
      show: !isPortfolio && !isCafeRestaurant 
    },
    { 
      id: 'locations', 
      label: isPortfolio ? (lang === 'tr' ? 'Ofisler' : 'Offices') : (lang === 'tr' ? 'Konumlar' : 'Locations'), 
      icon: MapPin, 
      show: true 
    },
    { 
      id: 'horeca', 
      label: lang === 'tr' ? 'Horeca' : 'Horeca', 
      icon: Utensils, 
      show: isCafeRestaurant 
    },
    { 
      id: 'bulk_price', 
      label: lang === 'tr' ? 'Toplu Fiyat' : 'Bulk Price', 
      icon: Percent, 
      show: !isPortfolio 
    },
  ];

  const activeNavItems = navItems.filter(item => item.show);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-4 text-slate-900 dark:text-slate-100"
    >
      {/* Top Header & Horizontal Minimalist Micro Navigation Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  {branding?.store_name || branding?.name || (lang === 'tr' ? 'Mağaza Ayarları' : 'Store Settings')}
                </h2>
                {storeCode && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {storeCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'tr' ? 'Operasyonel mağaza, firma ve kargo yapılandırması' : 'Store operations & business configuration'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onSaveBranding}
              disabled={savingBranding}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className={`w-3.5 h-3.5 ${savingBranding ? 'animate-spin' : ''}`} />
              <span>{savingBranding ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save')}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Micro Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeOpsTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveOpsTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400 dark:text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 md:p-5 shadow-xs">
        <AnimatePresence mode="wait">
          {/* TAB 1: STORE PROFILE */}
          {activeOpsTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {lang === 'tr' ? 'İşletme & Mağaza Temel Profil Bilgileri' : 'Business & Store Profile'}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {lang === 'tr' ? 'Sistem Profil Eşzamanlaması' : 'System Synced'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Store Name */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Mağaza / Tabela Adı' : 'Store / Brand Name'}</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder={lang === 'tr' ? 'Örn: Seçkin Emlak & Otomotiv' : 'e.g. VIP Store'}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.store_name || branding.name || ""}
                      onChange={(e) => {
                        onBrandingChange('store_name', e.target.value);
                        onBrandingChange('name', e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Contact Person */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Yetkili Kişi Adı Soyadı' : 'Contact Person'}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder={lang === 'tr' ? 'Örn: Serdar Erdekli' : 'e.g. John Doe'}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.contact_person || ""}
                      onChange={(e) => onBrandingChange('contact_person', e.target.value)}
                    />
                  </div>
                </div>

                {/* Primary Phone */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İşletme İletişim Telefonu' : 'Primary Phone'}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Örn: +90 548 890 23 09"
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.phone || ""}
                      onChange={(e) => onBrandingChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                {/* Primary Email */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İşletme E-Posta Adresi' : 'Primary Email'}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="email" 
                      placeholder="Örn: bilgi@seckinmagaza.com"
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.email || ""}
                      onChange={(e) => onBrandingChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Store Type (Sector) */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Mağaza Şablon Türü (Sektör)' : 'Store Type'}</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-9 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
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

                {/* District, City, Country */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İlçe / Bölge' : 'District'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Alsancak / Beşiktaş"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.district || ""}
                    onChange={(e) => onBrandingChange('district', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Şehir' : 'City'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Girne / İstanbul"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.city || ""}
                    onChange={(e) => onBrandingChange('city', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Ülke' : 'Country'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: KKTC / Türkiye"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.country || ""}
                    onChange={(e) => onBrandingChange('country', e.target.value)}
                  />
                </div>

                {/* Street Address */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İşletme Fiziki Adresi' : 'Street Address'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <textarea 
                      rows={1}
                      placeholder={lang === 'tr' ? 'Örn: Girne Caddesi No:12/A Alsancak' : 'e.g. Main Street No:12'}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                      value={branding.address || ""}
                      onChange={(e) => onBrandingChange('address', e.target.value)}
                    />
                  </div>
                </div>

                {/* Google Maps URLs */}
                <div className="space-y-1 md:col-span-1.5">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Google Maps Konum Linki' : 'Google Maps URL'}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.google_maps_url || ""}
                      onChange={(e) => onBrandingChange('google_maps_url', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Google Maps Embed Kodu / URL' : 'Google Maps Embed'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder='https://www.google.com/maps/embed?...'
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      value={branding.google_maps_embed || ""}
                      onChange={(e) => onBrandingChange('google_maps_embed', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: WORKING HOURS */}
          {activeOpsTab === 'working_hours' && (
            <motion.div 
              key="working_hours"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {lang === 'tr' ? 'Çalışma Günleri & Saatleri Yönetimi' : 'Working Hours Schedule'}
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'tr' ? 'Web sitesi alt bilgisinde görünür' : 'Visible on storefront'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Weekdays */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'tr' ? 'Pazartesi - Cuma (Hafta İçi)' : 'Mon - Fri (Weekdays)'}
                  </span>
                  <input 
                    type="text" 
                    placeholder="09:00 - 19:00"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
                    value={branding.working_hours?.weekdays || "09:00 - 19:00"}
                    onChange={(e) => {
                      const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                      onBrandingChange('working_hours', { ...currentWh, weekdays: e.target.value });
                    }}
                  />
                </div>

                {/* Saturday */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'tr' ? 'Cumartesi' : 'Saturday'}
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-slate-500">
                      <input 
                        type="checkbox"
                        checked={!!branding.working_hours?.is_saturday_closed}
                        onChange={(e) => {
                          const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                          onBrandingChange('working_hours', { ...currentWh, is_saturday_closed: e.target.checked });
                        }}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{lang === 'tr' ? 'Kapalı' : 'Closed'}</span>
                    </label>
                  </div>
                  <input 
                    type="text" 
                    disabled={branding.working_hours?.is_saturday_closed}
                    placeholder="09:00 - 19:00"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold ${
                      branding.working_hours?.is_saturday_closed 
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800' 
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                    }`}
                    value={branding.working_hours?.is_saturday_closed ? (lang === 'tr' ? 'Kapalı' : 'Closed') : (branding.working_hours?.saturday || "09:00 - 19:00")}
                    onChange={(e) => {
                      const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                      onBrandingChange('working_hours', { ...currentWh, saturday: e.target.value });
                    }}
                  />
                </div>

                {/* Sunday */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'tr' ? 'Pazar' : 'Sunday'}
                    </span>
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-slate-500">
                      <input 
                        type="checkbox"
                        checked={branding.working_hours?.is_sunday_closed ?? true}
                        onChange={(e) => {
                          const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                          onBrandingChange('working_hours', { ...currentWh, is_sunday_closed: e.target.checked });
                        }}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{lang === 'tr' ? 'Kapalı' : 'Closed'}</span>
                    </label>
                  </div>
                  <input 
                    type="text" 
                    disabled={branding.working_hours?.is_sunday_closed ?? true}
                    placeholder={lang === 'tr' ? 'Kapalı' : 'Closed'}
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-semibold ${
                      (branding.working_hours?.is_sunday_closed ?? true)
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800' 
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                    }`}
                    value={(branding.working_hours?.is_sunday_closed ?? true) ? (lang === 'tr' ? 'Kapalı' : 'Closed') : (branding.working_hours?.sunday || "10:00 - 18:00")}
                    onChange={(e) => {
                      const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                      onBrandingChange('working_hours', { ...currentWh, sunday: e.target.value });
                    }}
                  />
                </div>
              </div>

              {/* Working Hours Note */}
              <div className="space-y-1 pt-1">
                <label className="text-[10.5px] font-semibold text-slate-500">
                  {lang === 'tr' ? 'Özel Çalışma Notu (Resmi tatil, öğle arası vb.)' : 'Custom Hours Note'}
                </label>
                <input 
                  type="text"
                  placeholder={lang === 'tr' ? 'Örn: Pazar günleri ve resmi tatillerde kapalıyız.' : 'e.g. Closed on public holidays'}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium"
                  value={branding.working_hours?.note || ""}
                  onChange={(e) => {
                    const currentWh = typeof branding.working_hours === 'object' ? branding.working_hours : {};
                    onBrandingChange('working_hours', { ...currentWh, note: e.target.value });
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* TAB 3: SECURITY & STORE CODE */}
          {activeOpsTab === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {lang === 'tr' ? 'Kurumsal Güvenlik & Mağaza Kodu' : 'Security & Store Code'}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {lang === 'tr' ? 'Aktif Korumalı' : 'Active Protection'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <div className="md:col-span-2 space-y-1">
                  <h4 className="text-xs font-bold text-emerald-400">
                    {lang === 'tr' ? 'Çok Faktörlü İzolasyon Güvenlik Kodu' : 'Multi-Tenant Isolation Code'}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {lang === 'tr' 
                      ? 'Personel ve yöneticileriniz giriş ekranında bu kodu kullanarak mağaza verilerinize yetkisiz erişimi engeller.' 
                      : 'Staff and managers use this unique code on the login screen for multi-tenant account protection.'}
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-center flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    {lang === 'tr' ? 'MAĞAZA KODU' : 'STORE CODE'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-widest font-mono text-white">
                      {storeCode || 'LP-XXXXXX'}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(storeCode || 'LP-XXXXXX');
                        alert(lang === 'tr' ? 'Kopyalandı!' : 'Copied!');
                      }}
                      type="button"
                      className="p-1 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsIrpModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-500/20"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {lang === 'tr' ? 'Olay Müdahale Planı (IRP)' : 'Incident Response Plan (IRP)'}
                </button>
              </div>

              <IrpModal isOpen={isIrpModalOpen} onClose={() => setIsIrpModalOpen(false)} lang={lang} />
            </motion.div>
          )}

          {/* TAB 4: CURRENCY & LANGUAGE */}
          {activeOpsTab === 'currency' && (
            <motion.div 
              key="currency"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {lang === 'tr' ? 'Para Birimi, Dil & TCMB Kurları' : 'Currency, Language & TCMB Rates'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSyncTcmb}
                  disabled={syncingTcmb}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingTcmb ? 'animate-spin' : ''}`} />
                  {txt("TCMB'den Canlı Çek", "Sync TCMB Rates", "Συγχρονισμός TCMB")}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                {/* Default Currency */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{t.defaultCurrency || 'Varsayılan Para Birimi'}</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-9 pr-6 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
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

                {/* Default Language */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{t.defaultLanguage || 'Varsayılan Dil'}</label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <select 
                      className="w-full pl-9 pr-6 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
                      value={branding.default_language || branding.language || "tr"}
                      onChange={(e) => onBrandingChange('language', e.target.value)}
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {/* Rates inputs */}
                {['USD', 'EUR', 'GBP'].map(curr => (
                  <div key={curr} className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{curr} {t.rate || 'Kuru (₺)'}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
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
            </motion.div>
          )}

          {/* TAB 5: LEGAL & TAX */}
          {activeOpsTab === 'legal_tax' && (
            <motion.div 
              key="legal_tax"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {lang === 'tr' ? 'Resmi Firma Kayıtları & Vergi Ayarları' : 'Official Credentials & Tax Rules'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Official Legal Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Resmi Firma Ünvanı' : 'Official Legal Company Title'}</label>
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Örn: Serdar Erdekli veya GAP Bilişim Ltd. Şti.' : 'e.g. Official Legal Name'}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.legal_name || ""}
                    onChange={(e) => onBrandingChange('legal_name', e.target.value)}
                  />
                </div>

                {/* Official Phone */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Resmi İletişim Telefonu' : 'Official Phone'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: +90 532 000 00 00"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.legal_phone || ""}
                    onChange={(e) => onBrandingChange('legal_phone', e.target.value)}
                  />
                </div>

                {/* Tax Office */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Vergi Dairesi' : 'Tax Office'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Beşiktaş"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.legal_tax_office || ""}
                    onChange={(e) => onBrandingChange('legal_tax_office', e.target.value)}
                  />
                </div>

                {/* Tax Number */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Vergi / T.C. Kimlik No' : 'Tax / ID No'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 1234567890"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.legal_tax_number || ""}
                    onChange={(e) => onBrandingChange('legal_tax_number', e.target.value)}
                  />
                </div>

                {/* Mersis Number */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Mersis Numarası' : 'Mersis No'}</label>
                  <input 
                    type="text" 
                    placeholder="Örn: 0123456789000014"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={branding.legal_mersis || ""}
                    onChange={(e) => onBrandingChange('legal_mersis', e.target.value)}
                  />
                </div>

                {/* Official Address */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Resmi Tebligat Adresi' : 'Official Registered Address'}</label>
                  <textarea 
                    rows={1}
                    placeholder={lang === 'tr' ? 'Örn: Merkez Mah. Ticaret Cad. No:45 Beşiktaş / İstanbul' : 'e.g. Registered company address'}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl font-semibold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                    value={branding.legal_address || ""}
                    onChange={(e) => onBrandingChange('legal_address', e.target.value)}
                  />
                </div>
              </div>

              {/* VAT Rates Section */}
              {!isPortfolio && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                      {txt('KDV Oranları ve Kategori Kuralları', 'VAT Rates & Category Rules', 'ΦΠΑ & Κανόνες')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold text-slate-500">{txt('Varsayılan KDV %:', 'Default VAT %:', 'Προεπιλεγμένο %:')}</span>
                      <input 
                        type="text" 
                        className="w-16 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs"
                        value={branding.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : '20'}
                        onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                      />
                    </div>
                  </div>

                  {/* Category VAT Add Form */}
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 items-center text-xs">
                      <select 
                        id="new-category-select"
                        onChange={(e) => {
                          const val = e.target.value;
                          const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                          if (catInput) {
                            catInput.value = (val !== '__custom__' && val !== '') ? val : '';
                          }
                        }}
                        className="w-full sm:w-1/3 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                      >
                        <option value="">{txt('Kategori Seçin...', 'Select Category...', 'Επιλογή...')}</option>
                        {allStoreCategories.map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <input 
                        type="text" 
                        id="new-category-name"
                        placeholder={txt('veya elle yazın...', 'or type name...', 'ή πληκτρολογήστε...')}
                        className="w-full sm:w-1/3 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                      />

                      <div className="w-full sm:w-auto flex items-center gap-2">
                        <div className="relative w-20">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">%</span>
                          <input 
                            type="text" 
                            id="new-category-tax"
                            placeholder="20"
                            className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
                          />
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
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                        >
                          + {txt('Ekle', 'Add', 'Προσθήκη')}
                        </button>
                      </div>
                    </div>

                    {/* Rule tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(branding.category_tax_rules || []).map((rule: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                          <span>{rule.category}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-black">% {rule.taxRate}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const newRules = [...branding.category_tax_rules];
                              newRules.splice(idx, 1);
                              onBrandingChange('category_tax_rules', newRules);
                            }}
                            className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 6: SHIPPING SETTINGS */}
          {activeOpsTab === 'shipping' && !isPortfolio && !isCafeRestaurant && (
            <motion.div 
              key="shipping"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {txt('Kargo & Teslimat Profilleri', 'Shipping Profiles', 'Ρυθμίσεις Μεταφορικών')}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newProfiles = [...(branding.shipping_profiles || []), { id: Date.now().toString(), name: '', cost: 0, currency: branding.default_currency || 'TRY' }];
                    onBrandingChange('shipping_profiles', newProfiles);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Yeni Profil</span>
                </button>
              </div>

              <div className="space-y-2">
                {(branding.shipping_profiles || []).map((profile: any, index: number) => (
                  <div key={profile.id || index} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <input 
                        value={profile.name} 
                        onChange={(e) => { 
                          const p = [...branding.shipping_profiles]; 
                          p[index].name = e.target.value; 
                          onBrandingChange('shipping_profiles', p); 
                        }} 
                        placeholder="Profil Adı (Örn: Standart Kargo)" 
                        className="flex-1 w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                      />
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <input 
                          type="number" 
                          value={profile.cost} 
                          onChange={(e) => { 
                            const p = [...branding.shipping_profiles]; 
                            p[index].cost = parseFloat(e.target.value); 
                            onBrandingChange('shipping_profiles', p); 
                          }} 
                          placeholder="Ücret" 
                          className="w-24 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                        />
                        <input disabled value={profile.currency || 'TRY'} className="w-16 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-center" />
                        <button 
                          type="button"
                          onClick={() => { 
                            const p = [...branding.shipping_profiles]; 
                            p.splice(index, 1); 
                            onBrandingChange('shipping_profiles', p); 
                          }} 
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Category & Subcategory Group Assignments */}
                    {(() => {
                      const otherAssignedCats = getOtherAssignedCategories(index);
                      const otherAssignedSubs = getOtherAssignedSubCategories(index);
                      const selectedCats = profile.categories_str ? profile.categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                      const selectedSubs = profile.sub_categories_str ? profile.sub_categories_str.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eşleşen Kategoriler</span>
                            <div className="flex flex-wrap gap-1 mb-1 items-center">
                              {selectedCats.map((cat: string) => (
                                <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-100 dark:border-indigo-900/50">
                                  {cat}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = selectedCats.filter((c: string) => c !== cat);
                                      const p = [...branding.shipping_profiles];
                                      p[index].categories_str = updated.join(', ');
                                      onBrandingChange('shipping_profiles', p);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-600 font-bold ml-1 text-[11px]"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
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
                              className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
                            >
                              <option value="">{lang === 'tr' ? "+ Kategori Seç..." : "+ Choose Category..."}</option>
                              {allStoreCategories.map((cat: string) => {
                                const isAssignedToCurrent = selectedCats.includes(cat);
                                const assignedToProfile = otherAssignedCats[cat];
                                if (isAssignedToCurrent) return null;
                                return (
                                  <option key={cat} value={cat} disabled={!!assignedToProfile}>
                                    {cat} {assignedToProfile ? `(${assignedToProfile})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Eşleşen Alt Kategoriler</span>
                            <div className="flex flex-wrap gap-1 mb-1 items-center">
                              {selectedSubs.map((sub: string) => (
                                <span key={sub} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-100 dark:border-amber-900/50">
                                  {sub}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = selectedSubs.filter((s: string) => s !== sub);
                                      const p = [...branding.shipping_profiles];
                                      p[index].sub_categories_str = updated.join(', ');
                                      onBrandingChange('shipping_profiles', p);
                                    }}
                                    className="text-amber-400 hover:text-amber-600 font-bold ml-1 text-[11px]"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
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
                              className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
                            >
                              <option value="">{lang === 'tr' ? "+ Alt Kategori Seç..." : "+ Choose Sub-Category..."}</option>
                              {allStoreSubCategories.map((sub: string) => {
                                const isAssignedToCurrent = selectedSubs.includes(sub);
                                const assignedToProfile = otherAssignedSubs[sub];
                                if (isAssignedToCurrent) return null;
                                return (
                                  <option key={sub} value={sub} disabled={!!assignedToProfile}>
                                    {sub} {assignedToProfile ? `(${assignedToProfile})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 7: LOCATIONS & RESERVATION */}
          {activeOpsTab === 'locations' && (
            <motion.div 
              key="locations"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {isPortfolio ? (lang === 'tr' ? 'Ofis / Şube Konumları' : 'Office Locations') : (lang === 'tr' ? 'Mağaza Konumları & Rezervasyon' : 'Locations & Reservation')}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => onBrandingChange('locations', [...(branding.locations || []), { name: '', address: '', active: true, lat: 0, lng: 0 }])}
                  className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Mağaza Ekle
                </button>
              </div>

              {!isPortfolio && (
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <input 
                    type="checkbox" 
                    checked={!!branding.reservation_enabled}
                    onChange={(e) => onBrandingChange('reservation_enabled', e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {txt('Mağazadan Teslimat (Rezervasyon / Gel-Al) Özelliği Aktif', 'Enable In-Store Pickup (Reservation)', 'Ενεργοποίηση Παραλαβής από το Κατάστημα')}
                  </span>
                </label>
              )}

              <div className="space-y-2">
                {(branding.locations || []).map((loc: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input 
                        value={loc.name} 
                        onChange={(e) => { 
                          const l = [...(branding.locations||[])]; 
                          l[idx] = { ...l[idx], name: e.target.value }; 
                          onBrandingChange('locations', l); 
                        }} 
                        placeholder="Mağaza / Şube Adı" 
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                      />
                      <input 
                        value={loc.address} 
                        onChange={(e) => { 
                          const l = [...(branding.locations||[])]; 
                          l[idx] = { ...l[idx], address: e.target.value }; 
                          onBrandingChange('locations', l); 
                        }} 
                        placeholder="Şube Adresi" 
                        className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">LAT</span>
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
                          className="w-full pl-8 pr-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                        />
                      </div>

                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">LNG</span>
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
                          className="w-full pl-8 pr-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold" 
                        />
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <button 
                          type="button"
                          onClick={() => {
                            const l = [...(branding.locations||[])];
                            l.splice(idx, 1);
                            onBrandingChange('locations', l);
                          }}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 8: HORECA (CAFE / RESTAURANT / HOTEL) */}
          {activeOpsTab === 'horeca' && isCafeRestaurant && (
            <motion.div 
              key="horeca"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {txt('Kafe / Restoran / Horeca Yapılandırması', 'Cafe / Restaurant Settings', 'Ρυθμίσεις Καφέ / Εστιατορίου')}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Table Count */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    {txt('Masa Sayısı', 'Number of Tables', 'Αριθμός Τραπεζιών')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={branding?.page_layout_settings?.table_count || 12}
                    onChange={(e) => onBrandingChange('page_layout_settings', { ...branding?.page_layout_settings, table_count: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Fast POS & Masalar ekranında oluşturulacak aktif masaların dikey/yatay görünüm adedi.
                  </p>
                </div>

                {/* Hotel & Room Module */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Otel & Konaklama Modülü</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${branding.hotel_module_enabled ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {branding.hotel_module_enabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  <div 
                    onClick={() => {
                      if (!branding.hotel_license_enabled && !branding.hotel_module_enabled) {
                        setIsHotelUpgradeModalOpen(true);
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${branding.hotel_module_enabled ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                  >
                    <input 
                      type="checkbox"
                      id="chk_hotel_module_sub"
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      checked={!!branding.hotel_module_enabled}
                      onChange={(e) => {
                        if (e.target.checked && !branding.hotel_license_enabled) {
                          setIsHotelUpgradeModalOpen(true);
                          return;
                        }
                        onBrandingChange('hotel_module_enabled', e.target.checked);
                      }}
                    />
                    <label htmlFor="chk_hotel_module_sub" className="text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer flex-1">
                      {lang === 'tr' ? 'Oda Yönetimi & Restorandan Odaya Adisyon Entegrasyonu' : 'Enable Hotel & Room Billing'}
                    </label>
                  </div>
                </div>

                {/* Dinamik Garson & Saha Personeli Kadrosu */}
                <div className="col-span-1 md:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                        {txt('Garson & Saha Personeli Kadrosu (Dinamik/Sezonluk & WhatsApp Giriş)', 'Waiter Roster & WhatsApp Invites', 'Προσωπικό Σερβιτόρων & WhatsApp')}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        {txt('Havuz başı, şezlong, teras ve salon garsonlarını tanımlayın; tek tıkla WhatsApp üzerinden menü linki ve PIN şifresini gönderin.', 'Configure waiters for pool, beach, terrace; send direct terminal links & PIN via WhatsApp.', 'Ρυθμίστε σερβιτόρους και στείλτε συνδέσμους μέσω WhatsApp.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = getStoreWaiters(branding);
                        const newId = `w_${Date.now()}`;
                        const updated = [
                          ...current,
                          { id: newId, name: `Garson ${current.length + 1}`, pin: `${1000 + current.length + 1}`, section: 'Havuz / Şezlong', phone: '', active: true }
                        ];
                        onBrandingChange('waiter_list', updated);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{txt('+ Yeni Garson Ekle', '+ Add Waiter', '+ Προσθήκη')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {getStoreWaiters(branding).map((w, idx) => (
                      <div key={w.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={w.name}
                            placeholder="Garson Adı"
                            onChange={(e) => {
                              const current = getStoreWaiters(branding);
                              const updated = current.map((item, i) => i === idx ? { ...item, name: e.target.value } : item);
                              onBrandingChange('waiter_list', updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold flex-1"
                          />
                          <input
                            type="text"
                            maxLength={4}
                            value={w.pin}
                            placeholder="PIN"
                            onChange={(e) => {
                              const current = getStoreWaiters(branding);
                              const updated = current.map((item, i) => i === idx ? { ...item, pin: e.target.value.replace(/\D/g, '') } : item);
                              onBrandingChange('waiter_list', updated);
                            }}
                            className="w-14 px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-amber-500 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = getStoreWaiters(branding);
                              const updated = current.filter((_, i) => i !== idx);
                              onBrandingChange('waiter_list', updated);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={w.section || ''}
                            placeholder="Bölüm (Havuz, Salon...)"
                            onChange={(e) => {
                              const current = getStoreWaiters(branding);
                              const updated = current.map((item, i) => i === idx ? { ...item, section: e.target.value } : item);
                              onBrandingChange('waiter_list', updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                          />
                          <input
                            type="tel"
                            value={w.phone || ''}
                            placeholder="WhatsApp (905...)"
                            onChange={(e) => {
                              const current = getStoreWaiters(branding);
                              const updated = current.map((item, i) => i === idx ? { ...item, phone: e.target.value } : item);
                              onBrandingChange('waiter_list', updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <label className="flex items-center gap-1 cursor-pointer font-bold text-slate-500">
                            <input
                              type="checkbox"
                              checked={w.active}
                              onChange={(e) => {
                                const current = getStoreWaiters(branding);
                                const updated = current.map((item, i) => i === idx ? { ...item, active: e.target.checked } : item);
                                onBrandingChange('waiter_list', updated);
                              }}
                              className="w-3.5 h-3.5 rounded text-indigo-600"
                            />
                            <span>{w.active ? 'Aktif' : 'Pasif'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const effectiveSlug = branding.parent_slug || branding.slug;
                              const menuUrl = `${window.location.origin}/s/${effectiveSlug}`;
                              const inviteUrl = generateWaiterWhatsappInviteUrl(
                                w,
                                branding?.store_name || branding?.name || 'LookPrice',
                                menuUrl
                              );
                              window.open(inviteUrl, '_blank');
                            }}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>WhatsApp Davet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 9: BULK PRICE UPDATE */}
          {activeOpsTab === 'bulk_price' && !isPortfolio && (
            <motion.div 
              key="bulk_price"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {txt('Toplu Fiyat Güncelleme', 'Bulk Price Update', 'Μαζική Ενημέρωση Τιμών')}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleBulkPriceSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-slate-500">Hedef</label>
                    <select 
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                      value={bulkPriceForm.target}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, target: e.target.value })}
                    >
                      <option value="all">{txt('Tüm Ürünler', 'All Products', 'Όλα τα Προϊόντα')}</option>
                      <option value="category">{txt('Kategori Bazlı', 'Category Based', 'Βάσει Κατηγορίας')}</option>
                    </select>
                  </div>

                  {bulkPriceForm.target === 'category' && (
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-semibold text-slate-500">Kategori</label>
                      <input 
                        type="text" 
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs"
                        value={bulkPriceForm.category || ''}
                        onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-slate-500">{txt('İşlem Tipi', 'Operation Type', 'Τύπος')}</label>
                    <select 
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                      value={bulkPriceForm.type}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value })}
                    >
                      <option value="percentage">{txt('Yüzde (%)', 'Percentage (%)', 'Ποσοστό (%)')}</option>
                      <option value="fixed">Sabit Tutar</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-slate-500">{txt('Yön', 'Direction', 'Κατεύθυνση')}</label>
                    <select 
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                      value={bulkPriceForm.direction}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, direction: e.target.value })}
                    >
                      <option value="increase">{txt('Artır (+)', 'Increase (+)', 'Αύξηση (+)')}</option>
                      <option value="decrease">Azalt (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-semibold text-slate-500">{txt('Değer', 'Value', 'Αξία')}</label>
                    <input 
                      type="number" 
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-xs"
                      value={bulkPriceForm.value}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Fiyatları Güncelle</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HotelUpgradeModal
        isOpen={isHotelUpgradeModalOpen}
        onClose={() => setIsHotelUpgradeModalOpen(false)}
        lang={lang}
        storeName={branding.store_name || branding.name}
      />
    </motion.div>
  );
};

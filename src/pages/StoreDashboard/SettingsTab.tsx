import React from "react";
import { 
  Save, 
  Upload, 
  Globe, 
  Palette, 
  Settings, 
  User, 
  Lock,
  Mail,
  Smartphone,
  MapPin,
  CreditCard,
  Languages,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
  Info
} from "lucide-react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { DEVELOPED_COUNTRIES } from "../../constants";

interface SettingsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  users: any[];
  currentUser: any;
}

const SettingsTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding, 
  onLogoUpload, 
  onFaviconUpload,
  onAddUser,
  onDeleteUser,
  users,
  currentUser
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || {};

  if (!branding) return null;

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.branding}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{t.brandingDesc}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.storeName}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                  value={branding.name || branding.store_name || ""}
                  onChange={(e) => onBrandingChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.accountPlan}</label>
                <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex justify-between items-center text-sm shadow-sm">
                  <span className="uppercase tracking-wide">{branding.plan || t.freePlan}</span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {branding.plan === 'enterprise' ? t.unlimitedProducts : 
                     `${branding.plan === 'pro' ? 500 : branding.plan === 'basic' ? 100 : 50} ${t.productLimit}`}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.country}</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select 
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                    value={branding.country || "TR"}
                    onChange={(e) => {
                      const country = DEVELOPED_COUNTRIES.find(c => c.code === e.target.value);
                      onBrandingChange('country', e.target.value);
                      if (country && (!branding.phone || branding.phone.trim() === '')) {
                        onBrandingChange('phone', country.dialCode + " ");
                      }
                    }}
                  >
                    {DEVELOPED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.phone}</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    placeholder="+90 5XX XXX XX XX"
                    value={branding.phone || ""}
                    onChange={(e) => onBrandingChange('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.address}</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
                  <textarea 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 min-h-[100px]"
                    value={branding.address || ""}
                    onChange={(e) => onBrandingChange('address', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.primaryColor}</label>
                <div className="flex gap-3">
                  <div className="relative group shrink-0">
                    <input 
                      type="color" 
                      className="h-10 w-10 p-0 bg-transparent border-none rounded-xl cursor-pointer overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-xl shadow-sm"
                      value={branding.primary_color || "#4f46e5"}
                      onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                    />
                    <div className="absolute inset-0 rounded-xl border border-slate-200 pointer-events-none group-hover:border-slate-300 transition-colors"></div>
                  </div>
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-mono text-xs text-slate-700 font-bold"
                    value={branding.primary_color || "#4f46e5"}
                    onChange={(e) => onBrandingChange('primary_color', e.target.value)}
                  />
                </div>
              </div>
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Varsayılan KDV Oranı (%)' : 'Default Tax Rate (%)'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  <input 
                    type="number" 
                    step="1"
                    min="0"
                    max="99"
                    maxLength={2}
                    onKeyDown={(e) => { if (e.key === '.' || e.key === ',') e.preventDefault(); }}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    value={branding.default_tax_rate !== undefined ? branding.default_tax_rate : 20}
                    onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                  />
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
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
              <button 
                onClick={onSaveBranding}
                className="w-full md:w-auto flex items-center justify-center bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                <Save className="h-4 w-4 mr-2" /> {t.saveChanges}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.currencyRates}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{t.currencyRatesDesc}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.usdRate}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                    value={branding.currency_rates?.USD || 1}
                    onChange={(e) => onBrandingChange('currency_rates', { ...branding.currency_rates, USD: Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.eurRate}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">€</span>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                    value={branding.currency_rates?.EUR || 1}
                    onChange={(e) => onBrandingChange('currency_rates', { ...branding.currency_rates, EUR: Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.gbpRate}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">£</span>
                  <input 
                    type="number" 
                    step="0.0001"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                    value={branding.currency_rates?.GBP || 1}
                    onChange={(e) => onBrandingChange('currency_rates', { ...branding.currency_rates, GBP: Number(e.target.value) })}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.fiscalSettings}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{t.fiscalSettingsDesc}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.fiscalBrand}</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 appearance-none cursor-pointer"
                  value={branding.fiscal_brand || ""}
                  onChange={(e) => onBrandingChange('fiscal_brand', e.target.value)}
                >
                  <option value="">{t.selectBrand}</option>
                  <option value="beko">Beko</option>
                  <option value="ingenico">Ingenico</option>
                  <option value="hugin">Hugin</option>
                  <option value="profilo">Profilo</option>
                  <option value="paypad">Paypad</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.terminalId}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                  placeholder={t.terminalIdPlaceholder}
                  value={branding.fiscal_terminal_id || ""}
                  onChange={(e) => onBrandingChange('fiscal_terminal_id', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    id="fiscal_active"
                    className="h-5 w-5 text-slate-900 focus:ring-slate-500 border-slate-300 rounded-lg cursor-pointer"
                    checked={branding.fiscal_active || false}
                    onChange={(e) => onBrandingChange('fiscal_active', e.target.checked)}
                  />
                </div>
                <label htmlFor="fiscal_active" className="text-sm font-bold text-slate-900 cursor-pointer select-none">
                  {t.fiscalIntegrationActive}
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{t.fiscalIntegrationDesc}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.showcaseSettings}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{t.showcaseSettingsDesc}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.heroTitle}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                  value={branding.hero_title || ""}
                  onChange={(e) => onBrandingChange('hero_title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.heroSubtitle}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                  value={branding.hero_subtitle || ""}
                  onChange={(e) => onBrandingChange('hero_subtitle', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.heroImageUrl}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-mono text-xs text-slate-500"
                  placeholder="https://..."
                  value={branding.hero_image_url || ""}
                  onChange={(e) => onBrandingChange('hero_image_url', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.aboutText}</label>
                <div className="relative">
                  <Info className="absolute left-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
                  <textarea 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900 min-h-[120px]"
                    value={branding.about_text || ""}
                    onChange={(e) => onBrandingChange('about_text', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.socialMedia}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{t.socialMediaDesc}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.instagramUrl}</label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    placeholder="https://instagram.com/..."
                    value={branding.instagram_url || ""}
                    onChange={(e) => onBrandingChange('instagram_url', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.facebookUrl}</label>
                <div className="relative">
                  <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    placeholder="https://facebook.com/..."
                    value={branding.facebook_url || ""}
                    onChange={(e) => onBrandingChange('facebook_url', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.twitterUrl}</label>
                <div className="relative">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    placeholder="https://twitter.com/..."
                    value={branding.twitter_url || ""}
                    onChange={(e) => onBrandingChange('twitter_url', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.whatsappNumber}</label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    placeholder="+905XXXXXXXXX"
                    value={branding.whatsapp_number || ""}
                    onChange={(e) => onBrandingChange('whatsapp_number', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.users}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{t.teamManagementDesc}</p>
                </div>
              </div>
              {(currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && (
                <button 
                  onClick={onAddUser}
                  className="px-4 py-2 bg-slate-100 text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200"
                >
                  + {t.addUser}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-bold border border-slate-200 shadow-sm group-hover:scale-110 transition-transform">
                      {(u.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{u.username}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{u.role}</div>
                    </div>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && u.id !== currentUser?.id && (
                    <button 
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 ml-1">{t.logo}</h3>
            <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center group relative overflow-hidden mb-6 hover:border-slate-400 transition-all cursor-pointer">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain drop-shadow-sm" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.uploadLogo}</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={onLogoUpload}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.logoUrl}</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-xs font-mono text-slate-500"
                placeholder="https://..."
                value={branding.logo_url || ""}
                onChange={(e) => onBrandingChange('logo_url', e.target.value)}
              />
            </div>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-400 text-center leading-relaxed font-medium">
                {t.logoUploadDesc}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 ml-1">Favicon</h3>
            <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center group relative overflow-hidden mb-6 hover:border-slate-400 transition-all cursor-pointer">
              {branding.favicon_url ? (
                <img src={branding.favicon_url} alt="Favicon" className="h-12 w-12 object-contain drop-shadow-sm" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                    <Globe className="h-8 w-8 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.uploadFavicon}</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={onFaviconUpload}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.faviconUrl}</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-xs font-mono text-slate-500"
                placeholder="https://..."
                value={branding.favicon_url || ""}
                onChange={(e) => onBrandingChange('favicon_url', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;

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
  Info,
  ArrowRight,
  Building2,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle
} from "lucide-react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { DEVELOPED_COUNTRIES } from "../../constants";
import { api } from "../../services/api";
import { motion } from "motion/react";

interface SettingsTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: () => void;
  onDeleteUser: (id: number) => void;
  users: any[];
  currentUser: any;
  currentStoreId?: number;
}

const SettingsTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding, 
  onLogoUpload, 
  onFaviconUpload,
  onBannerUpload,
  onAddUser,
  onDeleteUser,
  users,
  currentUser,
  currentStoreId
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || {};
  const [syncing, setSyncing] = React.useState(false);
  const [amazonClientId, setAmazonClientId] = React.useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = React.useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = React.useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = React.useState(branding.amazon_settings?.sellerId || "");
  
  const [n11Syncing, setN11Syncing] = React.useState(false);
  const [n11AppKey, setN11AppKey] = React.useState(branding.n11_settings?.appKey || "");
  const [n11AppSecret, setN11AppSecret] = React.useState(branding.n11_settings?.appSecret || "");

  const [hbSyncing, setHbSyncing] = React.useState(false);
  const [hbApiKey, setHbApiKey] = React.useState(branding.hepsiburada_settings?.apiKey || "");
  const [hbApiSecret, setHbApiSecret] = React.useState(branding.hepsiburada_settings?.apiSecret || "");
  const [hbMerchantId, setHbMerchantId] = React.useState(branding.hepsiburada_settings?.merchantId || "");

  const [tySyncing, setTySyncing] = React.useState(false);
  const [tyApiKey, setTyApiKey] = React.useState(branding.trendyol_settings?.apiKey || "");
  const [tyApiSecret, setTyApiSecret] = React.useState(branding.trendyol_settings?.apiSecret || "");
  const [tyMerchantId, setTyMerchantId] = React.useState(branding.trendyol_settings?.merchantId || "");

  const [pzSyncing, setPzSyncing] = React.useState(false);
  const [pzApiKey, setPzApiKey] = React.useState(branding.pazarama_settings?.apiKey || "");
  const [pzApiSecret, setPzApiSecret] = React.useState(branding.pazarama_settings?.apiSecret || "");

  const [activeSubTab, setActiveSubTab] = React.useState<'web' | 'e-stores' | 'currency' | 'tax' | 'pos'>('web');

  if (!branding) return null;

  const amazonSettings = branding.amazon_settings || {};
  const isAmazonConnected = !!amazonSettings.refresh_token;

  const n11Settings = branding.n11_settings || {};
  const isN11Connected = !!n11Settings.connected;

  const hbSettings = branding.hepsiburada_settings || {};
  const isHbConnected = !!hbSettings.connected;

  const tySettings = branding.trendyol_settings || {};
  const isTyConnected = !!tySettings.connected;

  const pzSettings = branding.pazarama_settings || {};
  const isPzConnected = !!pzSettings.connected;

  const handleConnectAmazon = async () => {
    try {
      const { url } = await api.getAmazonAuthUrl();
      window.location.href = url;
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveAmazonSettings = async () => {
    try {
      await api.saveAmazonSettings({ 
        clientId: amazonClientId, 
        clientSecret: amazonClientSecret, 
        refreshToken: amazonRefreshToken, 
        sellerId: amazonSellerId, 
        storeId: currentStoreId 
      });
      alert(t.saveSuccess);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const res = await api.syncAmazonOrders(currentStoreId);
      alert(`${t.amazonSyncSuccess}: ${res.count} ${t.sales}`);
      // Refresh branding to get new last_sync
      window.location.reload();
    } catch (error) {
      alert(t.amazonSyncError);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectAmazon = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectAmazon(currentStoreId);
      alert(t.amazonDisconnected);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveN11Settings = async () => {
    try {
      await api.saveN11Settings({ appKey: n11AppKey, appSecret: n11AppSecret, storeId: currentStoreId });
      alert(t.saveSuccess);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncN11Orders = async () => {
    setN11Syncing(true);
    try {
      const res = await api.syncN11Orders(currentStoreId);
      alert(`${t.n11SyncSuccess}: ${res.count} ${t.sales}`);
      window.location.reload();
    } catch (error) {
      alert(t.n11SyncError);
    } finally {
      setN11Syncing(false);
    }
  };

  const handleDisconnectN11 = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectN11(currentStoreId);
      alert(t.n11Disconnected);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveHbSettings = async () => {
    try {
      await api.saveHepsiburadaSettings({ apiKey: hbApiKey, apiSecret: hbApiSecret, merchantId: hbMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncHbOrders = async () => {
    setHbSyncing(true);
    try {
      const res = await api.syncHepsiburadaOrders(currentStoreId);
      alert(`${t.hepsiburadaSyncSuccess}: ${res.count} ${t.sales}`);
      window.location.reload();
    } catch (error) {
      alert(t.hepsiburadaSyncError);
    } finally {
      setHbSyncing(false);
    }
  };

  const handleDisconnectHb = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectHepsiburada(currentStoreId);
      alert(t.hepsiburadaDisconnected);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveTySettings = async () => {
    try {
      await api.saveTrendyolSettings({ apiKey: tyApiKey, apiSecret: tyApiSecret, merchantId: tyMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncTyOrders = async () => {
    setTySyncing(true);
    try {
      const res = await api.syncTrendyolOrders(currentStoreId);
      alert(`${t.trendyolSyncSuccess}: ${res.count} ${t.sales}`);
      window.location.reload();
    } catch (error) {
      alert(t.trendyolSyncError);
    } finally {
      setTySyncing(false);
    }
  };

  const handleDisconnectTy = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectTrendyol(currentStoreId);
      alert(t.trendyolDisconnected);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSavePzSettings = async () => {
    try {
      await api.savePazaramaSettings({ apiKey: pzApiKey, apiSecret: pzApiSecret, storeId: currentStoreId });
      alert(t.saveSuccess);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncPzOrders = async () => {
    setPzSyncing(true);
    try {
      const res = await api.syncPazaramaOrders(currentStoreId);
      alert(`${t.pazaramaSyncSuccess}: ${res.count} ${t.sales}`);
      window.location.reload();
    } catch (error) {
      alert(t.pazaramaSyncError);
    } finally {
      setPzSyncing(false);
    }
  };

  const handleDisconnectPz = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectPazarama(currentStoreId);
      alert(t.pazaramaDisconnected);
      window.location.reload();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-24">
      {/* Sub-tab Navigation */}
      <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30 flex flex-wrap gap-1">
        <button 
          onClick={() => setActiveSubTab('web')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'web' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Palette className="h-4 w-4" />
          <span>{t.settingsCategories?.webSettings}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('e-stores')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-stores' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>{t.settingsCategories?.eStores}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('currency')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'currency' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Globe className="h-4 w-4" />
          <span>{t.settingsCategories?.currencyExchange}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('tax')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'tax' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Building2 className="h-4 w-4" />
          <span>{t.settingsCategories?.taxUnits}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('pos')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'pos' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{t.settingsCategories?.posSettings}</span>
        </button>
      </div>

      {activeSubTab === 'e-stores' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Amazon Integration */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Amazon</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isAmazonConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {isAmazonConnected ? t.connected : t.notConnected}
              </div>
            </div>
            
            {!isAmazonConnected ? (
              <button onClick={handleConnectAmazon} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                {t.connectAmazon}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">{t.amazonConnectedDesc}</p>
                <div className="flex gap-3">
                  <button onClick={handleSyncOrders} disabled={syncing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2">
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? t.syncing : t.syncOrders}</span>
                  </button>
                  <button onClick={handleDisconnectAmazon} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all">
                    {t.disconnect}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* N11 Integration */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">N11</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${isN11Connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {isN11Connected ? t.connected : t.notConnected}
              </div>
            </div>
            
            <div className="space-y-4">
              <input type="text" placeholder="App Key" value={n11AppKey} onChange={(e) => setN11AppKey(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              <input type="password" placeholder="App Secret" value={n11AppSecret} onChange={(e) => setN11AppSecret(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
              
              <div className="flex gap-3">
                <button onClick={handleSaveN11Settings} className="px-4 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all">
                  {t.saveSettings}
                </button>
                {isN11Connected && (
                  <>
                    <button onClick={handleSyncN11Orders} disabled={n11Syncing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2">
                      <RefreshCw className={`h-4 w-4 ${n11Syncing ? 'animate-spin' : ''}`} />
                      <span>{n11Syncing ? t.syncing : t.syncOrders}</span>
                    </button>
                    <button onClick={handleDisconnectN11} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all">
                      {t.disconnect}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'tax' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.settingsCategories?.taxUnits}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    value={branding.default_tax_rate !== undefined ? Math.round(branding.default_tax_rate) : 20}
                    onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Kategori KDV Kuralları' : 'Category Tax Rules'}</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="new-category-name"
                      placeholder={lang === 'tr' ? 'Kategori Adı (Örn: ALKOLLÜ İÇECEKLER)' : 'Category Name'}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      <input 
                        type="number" 
                        id="new-category-tax"
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const catInput = document.getElementById('new-category-name') as HTMLInputElement;
                        const taxInput = document.getElementById('new-category-tax') as HTMLInputElement;
                        if (catInput.value.trim() && taxInput.value) {
                          const newRules = [...(branding.category_tax_rules || [])];
                          newRules.push({ category: catInput.value.trim(), taxRate: parseInt(taxInput.value) });
                          onBrandingChange('category_tax_rules', newRules);
                          catInput.value = '';
                          taxInput.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      {lang === 'tr' ? 'Ekle' : 'Add'}
                    </button>
                  </div>
                  
                  {(branding.category_tax_rules || []).length > 0 && (
                    <div className="space-y-2 mt-4">
                      {(branding.category_tax_rules || []).map((rule: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-slate-700">{rule.category}</span>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">KDV %{rule.taxRate}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const newRules = [...branding.category_tax_rules];
                              newRules.splice(idx, 1);
                              onBrandingChange('category_tax_rules', newRules);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            {lang === 'tr' ? 'Sil' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'currency' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.settingsCategories?.currencyExchange}</h3>
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

              <div className="md:col-span-2 mt-6">
                <h4 className="text-sm font-bold text-slate-900 mb-4">{lang === 'tr' ? 'Çapraz Kurlar' : 'Cross Exchange Rates'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['USD', 'EUR', 'GBP'].map(curr => (
                    <div key={curr} className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{curr} {lang === 'tr' ? 'Kuru' : 'Rate'}</label>
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
        </motion.div>
      )}

      {activeSubTab === 'pos' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="md:col-span-2">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{t.fiscalSettings}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{lang === 'tr' ? 'Mali onaylı cihaz ayarlarını yönetin' : 'Manage fiscal device settings'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-inner">
                  <div className="flex items-center justify-between md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.fiscalIntegrationActive}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{lang === 'tr' ? 'Satışlarda mali fiş simülasyonu ve yazdırma aktif edilir.' : 'Enables fiscal receipt simulation and printing.'}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onBrandingChange('fiscal_active', !branding.fiscal_active)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${branding.fiscal_active ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${branding.fiscal_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {branding.fiscal_active && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{lang === 'tr' ? 'Cihaz Markası' : 'Device Brand'}</label>
                        <div className="relative group">
                          <select 
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900 appearance-none cursor-pointer group-hover:border-slate-300"
                            value={branding.fiscal_brand || ""}
                            onChange={(e) => onBrandingChange('fiscal_brand', e.target.value)}
                          >
                            <option value="">{t.selectBrand}</option>
                            <option value="beko">Beko</option>
                            <option value="ingenico">Ingenico</option>
                            <option value="verifone">Verifone</option>
                            <option value="hugin">Hugin</option>
                            <option value="profilo">Profilo</option>
                            <option value="paypad">Paypad</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ArrowRight className="h-4 w-4 rotate-90" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{lang === 'tr' ? 'Terminal ID / Seri No' : 'Terminal ID / Serial No'}</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900 group-hover:border-slate-300"
                          placeholder="Örn: BEK00123456"
                          value={branding.fiscal_terminal_id || ""}
                          onChange={(e) => onBrandingChange('fiscal_terminal_id', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{lang === 'tr' ? 'Cihaz IP Adresi' : 'Device IP Address'}</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900 group-hover:border-slate-300"
                            placeholder="Örn: 192.168.1.49"
                            value={branding.fiscal_ip || ""}
                            onChange={(e) => onBrandingChange('fiscal_ip', e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{lang === 'tr' ? 'Cihaz Portu' : 'Device Port'}</label>
                          <input 
                            type="text" 
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900 group-hover:border-slate-300"
                            placeholder="Örn: 1616"
                            value={branding.fiscal_port || ""}
                            onChange={(e) => onBrandingChange('fiscal_port', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            {lang === 'tr' ? 'POS Bağlantı Köprüsü (Bridge)' : 'POS Connection Bridge'}
                          </h4>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-6">
                          {lang === 'tr' 
                            ? 'Web tarayıcınızın yerel ağdaki POS cihazına erişebilmesi için bilgisayarınızda bir köprü yazılımı çalışmalıdır. Aşağıdaki butona tıklayarak Node.js tabanlı köprü dosyasını indirebilirsiniz.'
                            : 'A bridge software must run on your computer for your browser to access the local POS device. Click the button below to download the Node.js based bridge file.'}
                        </p>

                        <button 
                          onClick={() => {
                            const script = `
const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 1616;

app.post('/pos/sale', (req, res) => {
  const { amount, ip, port, brand } = req.body;
  console.log(\`[POS] \${brand} (\${ip}:\${port}) üzerinden \${amount} tutarında işlem başlatılıyor...\`);
  
  // Burada gerçek TCP iletişimi kurulur
  // Örnek Verifone/Ingenico TCP soket bağlantısı:
  /*
  const client = new net.Socket();
  client.connect(port, ip, () => {
    // Protokole uygun mesajı gönder
    client.write('SALE_COMMAND_HERE');
  });
  client.on('data', (data) => {
    res.json({ status: 'approved', message: 'İşlem Başarılı' });
    client.destroy();
  });
  */

  // Simülasyon (Gerçek cihaz bağlıysa yukarıdaki blok aktif edilmelidir)
  setTimeout(() => {
    res.json({ status: 'approved', message: 'İşlem Başarılı' });
  }, 5000);
});

app.listen(PORT, () => {
  console.log(\`LookPrice POS Bridge \${PORT} portunda çalışıyor...\`);
  console.log(\`Lütfen bu pencereyi kapatmayın.\`);
});
                            `;
                            const blob = new Blob([script], { type: 'text/javascript' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'lookprice-pos-bridge.js';
                            a.click();
                          }}
                          className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl text-xs font-black text-slate-900 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center group"
                        >
                          <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                          {lang === 'tr' ? 'Köprü Dosyasını İndir (.js)' : 'Download Bridge File (.js)'}
                        </button>
                        
                        <div className="mt-4 flex items-start space-x-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            {lang === 'tr' 
                              ? 'Çalıştırmak için bilgisayarınızda Node.js kurulu olmalıdır. Terminalde "node lookprice-pos-bridge.js" komutunu çalıştırın.'
                              : 'Node.js must be installed on your computer to run this. Run "node lookprice-pos-bridge.js" in your terminal.'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
        </motion.div>
      )}

      {activeSubTab === 'e-stores' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.settingsCategories?.eStores}</h3>
              </div>
            </div>
            <div className="space-y-8">
              {/* Amazon Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.amazonIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.amazonIntegrationDesc}</p>
                    </div>
                  </div>
                  {isAmazonConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.amazonConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonClientId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonClientId}
                        onChange={(e) => setAmazonClientId(e.target.value)}
                        placeholder="LWA Client ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonClientSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonClientSecret}
                        onChange={(e) => setAmazonClientSecret(e.target.value)}
                        placeholder="LWA Client Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonRefreshToken}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonRefreshToken}
                        onChange={(e) => setAmazonRefreshToken(e.target.value)}
                        placeholder="Refresh Token"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.amazonSellerId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={amazonSellerId}
                        onChange={(e) => setAmazonSellerId(e.target.value)}
                        placeholder="Seller ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isAmazonConnected ? (
                      <>
                        <button 
                          onClick={handleSaveAmazonSettings}
                          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.amazonConnectManual}</span>
                        </button>
                        <button 
                          onClick={handleConnectAmazon}
                          className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{t.amazonConnectOAuth}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncOrders}
                          disabled={syncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                          <span>{syncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveAmazonSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectAmazon}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isAmazonConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {amazonSettings.last_sync 
                          ? new Date(amazonSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') 
                          : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* N11 Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.n11Integration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.n11IntegrationDesc}</p>
                    </div>
                  </div>
                  {isN11Connected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.n11Connected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.n11AppKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={n11AppKey}
                        onChange={(e) => setN11AppKey(e.target.value)}
                        placeholder="App Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.n11AppSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={n11AppSecret}
                        onChange={(e) => setN11AppSecret(e.target.value)}
                        placeholder="App Secret"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isN11Connected ? (
                      <button 
                        onClick={handleSaveN11Settings}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectN11}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncN11Orders}
                          disabled={n11Syncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${n11Syncing ? 'animate-spin' : ''}`} />
                          <span>{n11Syncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveN11Settings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectN11}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isN11Connected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {n11Settings.last_sync 
                          ? new Date(n11Settings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') 
                          : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hepsiburada Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.hepsiburadaIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.hepsiburadaIntegrationDesc}</p>
                    </div>
                  </div>
                  {isHbConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.hepsiburadaConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbApiKey}
                        onChange={(e) => setHbApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbApiSecret}
                        onChange={(e) => setHbApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.hepsiburadaMerchantId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={hbMerchantId}
                        onChange={(e) => setHbMerchantId(e.target.value)}
                        placeholder="Merchant ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isHbConnected ? (
                      <button 
                        onClick={handleSaveHbSettings}
                        className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectHepsiburada}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncHbOrders}
                          disabled={hbSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${hbSyncing ? 'animate-spin' : ''}`} />
                          <span>{hbSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveHbSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectHb}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isHbConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {hbSettings.last_sync 
                          ? new Date(hbSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') 
                          : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trendyol Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-50 rounded-xl text-orange-600 border border-orange-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.trendyolIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.trendyolIntegrationDesc}</p>
                    </div>
                  </div>
                  {isTyConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.trendyolConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyApiKey}
                        onChange={(e) => setTyApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyApiSecret}
                        onChange={(e) => setTyApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.trendyolMerchantId}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={tyMerchantId}
                        onChange={(e) => setTyMerchantId(e.target.value)}
                        placeholder="Merchant ID"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isTyConnected ? (
                      <button 
                        onClick={handleSaveTySettings}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectTrendyol}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncTyOrders}
                          disabled={tySyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${tySyncing ? 'animate-spin' : ''}`} />
                          <span>{tySyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSaveTySettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectTy}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isTyConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {tySettings.last_sync 
                          ? new Date(tySettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') 
                          : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pazarama Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.pazaramaIntegration}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{t.pazaramaIntegrationDesc}</p>
                    </div>
                  </div>
                  {isPzConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.pazaramaConnected}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.pazaramaApiKey}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={pzApiKey}
                        onChange={(e) => setPzApiKey(e.target.value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.pazaramaApiSecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                        value={pzApiSecret}
                        onChange={(e) => setPzApiSecret(e.target.value)}
                        placeholder="API Secret"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {!isPzConnected ? (
                      <button 
                        onClick={handleSavePzSettings}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.connectPazarama}</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleSyncPzOrders}
                          disabled={pzSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${pzSyncing ? 'animate-spin' : ''}`} />
                          <span>{pzSyncing ? t.loading : t.syncOrders}</span>
                        </button>
                        <button 
                          onClick={handleSavePzSettings}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>{t.update}</span>
                        </button>
                        <button 
                          onClick={handleDisconnectPz}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{t.disconnect}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isPzConnected && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {pzSettings.last_sync 
                          ? new Date(pzSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') 
                          : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'web' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.heroImageUrl || (lang === 'tr' ? 'Banner Görseli' : 'Banner Image')}</label>
                <div className="relative group w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300">
                  {branding.hero_image_url ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={branding.hero_image_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Upload className="h-8 w-8 text-white animate-bounce" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-indigo-600 transition-colors">{lang === 'tr' ? 'Banner Yükle' : 'Upload Banner'}</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    accept="image/*"
                    onChange={onBannerUpload}
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VEYA URL GİRİN:</span>
                </div>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-mono text-xs text-slate-500 mt-2"
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
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Methods'}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{lang === 'tr' ? 'Aktif etmek istediğiniz ödeme yöntemlerini seçin' : 'Select payment methods to enable'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-900 cursor-pointer">Iyzico</label>
                <button 
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {branding.payment_settings?.iyzico_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-white rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between md:col-span-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Iyzico Test (Sandbox) Modu' : 'Iyzico Test (Sandbox) Mode'}</span>
                    <button 
                      type="button"
                      onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_sandbox: !branding.payment_settings?.iyzico_sandbox })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.iyzico_sandbox ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_sandbox ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Iyzico API Key</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.iyzico_api_key || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Iyzico Secret Key</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.iyzico_secret_key || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_secret_key: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-900 cursor-pointer">PayPal</label>
                <button 
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {branding.payment_settings?.paypal_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-white rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between md:col-span-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'PayPal Sandbox Modu' : 'PayPal Sandbox Mode'}</span>
                    <button 
                      type="button"
                      onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, paypal_sandbox: !branding.payment_settings?.paypal_sandbox })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.paypal_sandbox ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_sandbox ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">PayPal Client ID</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.paypal_client_id || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, paypal_client_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">PayPal Secret</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.paypal_secret || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, paypal_secret: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-900 cursor-pointer">Payoneer</label>
                <button 
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, payoneer_enabled: !branding.payment_settings?.payoneer_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.payoneer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {branding.payment_settings?.payoneer_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-white rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between md:col-span-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Payoneer Sandbox Modu' : 'Payoneer Sandbox Mode'}</span>
                    <button 
                      type="button"
                      onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, payoneer_sandbox: !branding.payment_settings?.payoneer_sandbox })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${branding.payment_settings?.payoneer_sandbox ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.payment_settings?.payoneer_sandbox ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Payoneer API Username</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.payoneer_username || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, payoneer_username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Payoneer API Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.payoneer_password || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, payoneer_password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Payoneer Store Code (Entity ID)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={branding.payment_settings?.payoneer_store_code || ""}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, payoneer_store_code: e.target.value })}
                    />
                  </div>
                </div>
              )}
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
                      {(u.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{u.email}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{u.role}</div>
                    </div>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && u.id !== currentUser?.id && (
                    <button 
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                {t.logo}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">PNG / SVG / JPG</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative group mb-8">
                <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                <div className="relative w-40 h-40 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center group hover:border-indigo-400 hover:bg-white transition-all duration-500 cursor-pointer shadow-inner">
                  {branding.logo_url ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
                        <Upload className="h-6 w-6 text-white animate-bounce" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-indigo-600 transition-colors">{t.uploadLogo}</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    accept="image/*"
                    onChange={onLogoUpload}
                  />
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.logoUrl}</label>
                  <Globe className="h-3 w-3 text-slate-300" />
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all text-xs font-mono text-slate-500 group-hover:border-slate-300"
                    placeholder="https://your-cdn.com/logo.png"
                    value={branding.logo_url || ""}
                    onChange={(e) => onBrandingChange('logo_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 w-full p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                <p className="text-[10px] text-indigo-600/70 text-center leading-relaxed font-bold uppercase tracking-wider">
                  {t.logoUploadDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                {t.favicon}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">ICO / PNG</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative group mb-8">
                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                <div className="relative w-24 h-24 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center group hover:border-amber-400 hover:bg-white transition-all duration-500 cursor-pointer shadow-inner">
                  {branding.favicon_url ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={branding.favicon_url} alt="Favicon" className="w-12 h-12 object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                        <Upload className="h-4 w-4 text-white animate-bounce" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                        <Upload className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-amber-600 transition-colors">{t.uploadFavicon}</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    accept="image/*"
                    onChange={onFaviconUpload}
                  />
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.faviconUrl}</label>
                  <Globe className="h-3 w-3 text-slate-300" />
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 focus:bg-white transition-all text-xs font-mono text-slate-500 group-hover:border-slate-300"
                    placeholder="https://your-cdn.com/favicon.ico"
                    value={branding.favicon_url || ""}
                    onChange={(e) => onBrandingChange('favicon_url', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      )}

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/40 backdrop-blur-2xl border-t border-slate-200/50 flex justify-center lg:justify-end lg:pr-12 pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={onSaveBranding}
            className="flex items-center space-x-4 px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-indigo-600 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:shadow-indigo-500/40 active:scale-95 group border border-white/10"
          >
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Save className="h-4 w-4 text-white" />
            </div>
            <span className="uppercase tracking-[0.2em]">{translations[lang]?.dashboard?.saveSettings || 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;

import React, { useMemo, useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Save, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle,
  ShieldCheck,
  Tag
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "@/translations";
import { api } from "@/services/api";
import { useIntegrationSync } from "@/hooks/useIntegrationSync";
import { toast } from "sonner";

interface SettingsEStoresTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  currentStoreId?: number;
  products?: any[];
  onRefresh?: () => void;
}

export const SettingsEStoresTab = ({
  branding,
  onBrandingChange,
  lang,
  currentStoreId,
  products = [],
  onRefresh
}: SettingsEStoresTabProps) => {
  const t = translations[lang]?.dashboard || {};

  const amazonSync = useIntegrationSync('Amazon', t);
  const n11Sync = useIntegrationSync('N11', t);
  const hbSync = useIntegrationSync('Hepsiburada', t);
  const tySync = useIntegrationSync('Trendyol', t);
  const pzSync = useIntegrationSync('Pazarama', t);

  const [amazonClientId, setAmazonClientId] = useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = useState(branding.amazon_settings?.sellerId || "");
  
  const [n11AppKey, setN11AppKey] = useState(branding.n11_settings?.appKey || "");
  const [n11AppSecret, setN11AppSecret] = useState(branding.n11_settings?.appSecret || "");

  const [hbApiKey, setHbApiKey] = useState(branding.hepsiburada_settings?.apiKey || "");
  const [hbApiSecret, setHbApiSecret] = useState(branding.hepsiburada_settings?.apiSecret || "");
  const [hbMerchantId, setHbMerchantId] = useState(branding.hepsiburada_settings?.merchantId || "");

  const [tyApiKey, setTyApiKey] = useState(branding.trendyol_settings?.apiKey || "");
  const [tyApiSecret, setTyApiSecret] = useState(branding.trendyol_settings?.apiSecret || "");
  const [tyMerchantId, setTyMerchantId] = useState(branding.trendyol_settings?.merchantId || "");

  const [pzApiKey, setPzApiKey] = useState(branding.pazarama_settings?.apiKey || "");
  const [pzApiSecret, setPzApiSecret] = useState(branding.pazarama_settings?.apiSecret || "");
  const [pzMerchantId, setPzMerchantId] = useState(branding.pazarama_settings?.merchantId || "");
  const [pzCommissionRate, setPzCommissionRate] = useState(branding.pazarama_settings?.commissionRate || 0);

  const [pzCategories, setPzCategories] = useState<any[]>([]);
  const [pzBrands, setPzBrands] = useState<any[]>([]);
  const [loadingPzCats, setLoadingPzCats] = useState(false);
  const [loadingPzBrands, setLoadingPzBrands] = useState(false);
  const [pzCategoryMappings, setPzCategoryMappings] = useState<Record<string, string>>(branding.pazarama_settings?.categoryMappings || {});
  const [pzBrandMappings, setPzBrandMappings] = useState<Record<string, string>>(branding.pazarama_settings?.brandMappings || {});
  const [showPzMapping, setShowPzMapping] = useState(false);
  const [showPzBrandMapping, setShowPzBrandMapping] = useState(false);

  // Sync state when branding changes
  useEffect(() => {
    const amz = branding.amazon_settings || {};
    setAmazonClientId(amz.clientId || "");
    setAmazonClientSecret(amz.clientSecret || "");
    setAmazonRefreshToken(amz.refresh_token || "");
    setAmazonSellerId(amz.sellerId || "");

    const n = branding.n11_settings || {};
    setN11AppKey(n.appKey || "");
    setN11AppSecret(n.appSecret || "");

    const h = branding.hepsiburada_settings || {};
    setHbApiKey(h.apiKey || "");
    setHbApiSecret(h.apiSecret || "");
    setHbMerchantId(h.merchantId || "");

    const ty = branding.trendyol_settings || {};
    setTyApiKey(ty.apiKey || "");
    setTyApiSecret(ty.apiSecret || "");
    setTyMerchantId(ty.merchantId || "");

    const pz = branding.pazarama_settings || {};
    setPzApiKey(pz.apiKey || "");
    setPzApiSecret(pz.apiSecret || "");
    setPzMerchantId(pz.merchantId || "");
    setPzCommissionRate(pz.commissionRate || 0);
    setPzCategoryMappings(pz.categoryMappings || {});
    setPzBrandMappings(pz.brandMappings || {});
  }, [branding]);

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
      alert(t.errorOccurred || "Bir hata oluştu");
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
      alert(t.saveSuccess || "Kaydedildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncOrders = async () => {
    await amazonSync.runSync(
      () => api.syncAmazonOrders(currentStoreId),
      (res) => {
        alert(`${t.amazonSyncSuccess || "Amazon siparişleri senkronize edildi"}: ${res.count} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectAmazon = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectAmazon(currentStoreId);
      alert(t.amazonDisconnected || "Amazon bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSaveN11Settings = async () => {
    try {
      await api.saveN11Settings({ appKey: n11AppKey, appSecret: n11AppSecret, storeId: currentStoreId });
      alert(t.saveSuccess || "Kaydedildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncN11Orders = async () => {
    await n11Sync.runSync(
      () => api.syncN11Orders(currentStoreId),
      (res) => {
        alert(`${t.n11SyncSuccess || "N11 siparişleri senkronize edildi"}: ${res.count} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectN11 = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectN11(currentStoreId);
      alert(t.n11Disconnected || "N11 bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSaveHbSettings = async () => {
    try {
      await api.saveHepsiburadaSettings({ apiKey: hbApiKey, apiSecret: hbApiSecret, merchantId: hbMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess || "Kaydedildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncHbOrders = async () => {
    await hbSync.runSync(
      () => api.syncHepsiburadaOrders(currentStoreId),
      (res) => {
        alert(`${t.hepsiburadaSyncSuccess || "Hepsiburada siparişleri senkronize edildi"}: ${res.count} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectHb = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectHepsiburada(currentStoreId);
      alert(t.hepsiburadaDisconnected || "Hepsiburada bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSaveTySettings = async () => {
    try {
      await api.saveTrendyolSettings({ apiKey: tyApiKey, apiSecret: tyApiSecret, merchantId: tyMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess || "Kaydedildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncTyOrders = async () => {
    await tySync.runSync(
      () => api.syncTrendyolOrders(currentStoreId),
      (res) => {
        alert(`${t.trendyolSyncSuccess || "Trendyol siparişleri senkronize edildi"}: ${res.count} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectTy = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectTrendyol(currentStoreId);
      alert(t.trendyolDisconnected || "Trendyol bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleTestN11 = async () => {
    try {
      const res = await api.testN11Connection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'N11 Bağlantısı Başarılı!' : 'N11 Connection Successful!') : `${lang === 'tr' ? 'N11 Bağlantı Hatası' : 'N11 Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const handleTestHb = async () => {
    try {
      const res = await api.testHepsiburadaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Hepsiburada Bağlantısı Başarılı!' : 'Hepsiburada Connection Successful!') : `${lang === 'tr' ? 'Hepsiburada Bağlantı Hatası' : 'Hepsiburada Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const handleTestTy = async () => {
    try {
      const res = await api.testTrendyolConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Trendyol Bağlantısı Başarılı!' : 'Trendyol Connection Successful!') : `${lang === 'tr' ? 'Trendyol Bağlantı Hatası' : 'Trendyol Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const handleTestPz = async () => {
    try {
      const res = await api.testPazaramaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Pazarama Bağlantısı Başarılı!' : 'Pazarama Connection Successful!') : `${lang === 'tr' ? 'Pazarama Bağlantı Hatası' : 'Pazarama Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const handleSavePzSettings = async () => {
    try {
      const pzData = { 
        apiKey: pzApiKey, 
        apiSecret: pzApiSecret, 
        merchantId: pzMerchantId,
        commissionRate: Number(pzCommissionRate),
        categoryMappings: pzCategoryMappings,
        brandMappings: pzBrandMappings,
        connected: !!(pzApiKey && pzApiSecret)
      };
      await api.savePazaramaSettings({ 
        ...pzData,
        storeId: currentStoreId 
      } as any);
      onBrandingChange('pazarama_settings', pzData);
      alert(t.saveSuccess || 'Kaydedildi');
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const fetchPzCategories = async () => {
    if (!pzApiKey || !pzApiSecret) {
      alert(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzCats(true);
    try {
      const res = await api.getPazaramaCategories(currentStoreId);
      if (res.error) {
        throw new Error(res.error);
      }
      const cats = Array.isArray(res) ? res : (res?.data || []);
      if (cats.length === 0) {
        alert(lang === 'tr' ? 'Pazarama\'dan hiç kategori gelmedi. Lütfen API bilgilerinizin doğruluğunu ve yetkilerini kontrol edin.' : 'No categories received from Pazarama. Please check your API credentials and permissions.');
      }
      setPzCategories(cats);
      setShowPzMapping(true);
    } catch (e: any) {
      console.error("Pazarama Category Fetch Error:", e);
      alert(`${lang === 'tr' ? "Kategoriler çekilemedi" : "Could not fetch categories"}: ${e.message}`);
    } finally {
      setLoadingPzCats(false);
    }
  };

  const fetchPzBrands = async () => {
    if (!pzApiKey || !pzApiSecret) {
      alert(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzBrands(true);
    try {
      const res = await api.getPazaramaBrands(currentStoreId);
      if (res.error) {
        throw new Error(res.error);
      }
      const brands = Array.isArray(res) ? res : (res?.data || []);
      if (brands.length === 0) {
        alert(lang === 'tr' ? 'Pazarama\'dan hiç marka gelmedi. Lütfen API bilgilerinizin doğruluğunu ve yetkilerini kontrol edin.' : 'No brands received from Pazarama. Please check your API credentials and permissions.');
      }
      setPzBrands(brands);
      setShowPzBrandMapping(true);
    } catch (e: any) {
      console.error("Pazarama Brand Fetch Error:", e);
      alert(`${lang === 'tr' ? "Markalar çekilemedi" : "Could not fetch brands"}: ${e.message}`);
    } finally {
      setLoadingPzBrands(false);
    }
  };

  const localCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const localBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p: any) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  const handleSyncPzOrders = async () => {
    await pzSync.runSync(
      () => api.syncPazaramaOrders(currentStoreId),
      (res) => {
        alert(`${t.pazaramaSyncSuccess || "Pazarama siparişleri senkronize edildi"}: ${res.count} ${t.sales || 'Satış'}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectPz = async () => {
    if (!confirm(t.confirmDelete || 'Silmek istediğinize emin misiniz?')) return;
    try {
      await api.disconnectPazarama(currentStoreId);
      onBrandingChange('pazarama_settings', {});
      alert(t.pazaramaDisconnected || 'Pazarama bağlantısı kesildi');
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 animate-fade-in"
      id="settings-e-stores-container"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="e-stores-wrapper-card">
        <div className="flex items-center space-x-3 mb-8" id="e-stores-heading-group">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200" id="e-stores-icon-box">
            <ShoppingBag className="h-5 w-5" id="e-stores-shopping-icon" />
          </div>
          <div id="e-stores-title-box">
            <h3 className="text-lg font-bold text-slate-900 leading-tight" id="e-stores-title">{t.settingsCategories?.eStores}</h3>
          </div>
        </div>
        <div className="space-y-8" id="e-stores-integrations-stack">
          
          {/* Amazon Integration Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="amazon-integration-card">
            <div className="flex items-center justify-between mb-8" id="amazon-header-row">
              <div className="flex items-center space-x-3" id="amazon-logo-box">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.amazonIntegration}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{t.amazonIntegrationDesc}</p>
                </div>
              </div>
              {isAmazonConnected && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100" id="amazon-badge">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.amazonConnected}</span>
                </div>
              )}
            </div>

            <div className="space-y-6" id="amazon-fields-container">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="amazon-actions-grid">
                {!isAmazonConnected ? (
                  <>
                    <button 
                      onClick={handleSaveAmazonSettings}
                      id="amazon-save-manual-btn"
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.amazonConnectManual}</span>
                    </button>
                    <button 
                      onClick={handleConnectAmazon}
                      id="amazon-connect-oauth-btn"
                      className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{t.amazonConnectOAuth}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleSyncOrders}
                      id="amazon-sync-btn"
                      disabled={amazonSync.isSyncing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${amazonSync.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{amazonSync.isSyncing ? t.loading : t.syncOrders}</span>
                    </button>
                    <button 
                      onClick={handleSaveAmazonSettings}
                      id="amazon-update-settings-btn"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.update}</span>
                    </button>
                    <button 
                      onClick={handleDisconnectAmazon}
                      id="amazon-disconnect-btn"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t.disconnect}</span>
                    </button>
                  </>
                )}
              </div>

              {isAmazonConnected && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200" id="amazon-sync-info-panel">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {amazonSync.lastSync ? amazonSync.lastSync.toLocaleString() : (amazonSettings.last_sync ? new Date(amazonSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                  </p>
                  {amazonSync.lastError && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4 shrink-0" />
                         <span className="font-medium">{amazonSync.lastError}</span>
                      </div>
                      <button onClick={handleSyncOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* N11 Integration Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="n11-integration-card">
            <div className="flex items-center justify-between mb-8" id="n11-header-box">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {!isN11Connected ? (
                  <button 
                    onClick={handleSaveN11Settings}
                    id="n11-connect-btn"
                    className="col-span-1 sm:col-span-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{t.connectN11}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSyncN11Orders}
                      id="n11-sync-orders"
                      disabled={n11Sync.isSyncing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{n11Sync.isSyncing ? t.loading : t.syncOrders}</span>
                    </button>
                    <button 
                      onClick={handleSaveN11Settings}
                      id="n11-update-settings"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.update}</span>
                    </button>
                    <button 
                      onClick={handleDisconnectN11}
                      id="n11-disconnect"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t.disconnect}</span>
                    </button>
                    <button 
                      onClick={handleTestN11}
                      id="n11-test"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                    </button>
                  </>
                )}
              </div>

              {isN11Connected && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {n11Sync.lastSync ? n11Sync.lastSync.toLocaleString() : (n11Settings.last_sync ? new Date(n11Settings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                  </p>
                  {n11Sync.lastError && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4 shrink-0" />
                         <span className="font-medium">{n11Sync.lastError}</span>
                      </div>
                      <button onClick={handleSyncN11Orders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hepsiburada Integration Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="hb-integration-card">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {!isHbConnected ? (
                  <button 
                    onClick={handleSaveHbSettings}
                    id="hb-connect-btn"
                    className="col-span-1 sm:col-span-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{t.connectHepsiburada}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSyncHbOrders}
                      id="hb-sync-orders"
                      disabled={hbSync.isSyncing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${hbSync.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{hbSync.isSyncing ? t.loading : t.syncOrders}</span>
                    </button>
                    <button 
                      onClick={handleSaveHbSettings}
                      id="hb-update-settings"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.update}</span>
                    </button>
                    <button 
                      onClick={handleDisconnectHb}
                      id="hb-disconnect"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t.disconnect}</span>
                    </button>
                    <button 
                      onClick={handleTestHb}
                      id="hb-test"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                    </button>
                  </>
                )}
              </div>

              {isHbConnected && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {hbSync.lastSync ? hbSync.lastSync.toLocaleString() : (hbSettings.last_sync ? new Date(hbSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                  </p>
                  {hbSync.lastError && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4 shrink-0" />
                         <span className="font-medium">{hbSync.lastError}</span>
                      </div>
                      <button onClick={handleSyncHbOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trendyol Integration Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="ty-integration-card">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {!isTyConnected ? (
                  <button 
                    onClick={handleSaveTySettings}
                    id="ty-connect-btn"
                    className="col-span-1 sm:col-span-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{t.connectTrendyol}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSyncTyOrders}
                      id="ty-sync-orders"
                      disabled={tySync.isSyncing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${tySync.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{tySync.isSyncing ? t.loading : t.syncOrders}</span>
                    </button>
                    <button 
                      onClick={handleSaveTySettings}
                      id="ty-update-settings"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.update}</span>
                    </button>
                    <button 
                      onClick={handleDisconnectTy}
                      id="ty-disconnect"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t.disconnect}</span>
                    </button>
                    <button 
                      onClick={handleTestTy}
                      id="ty-test"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                    </button>
                  </>
                )}
              </div>

              {isTyConnected && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {tySync.lastSync ? tySync.lastSync.toLocaleString() : (tySettings.last_sync ? new Date(tySettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                  </p>
                  {tySync.lastError && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         <AlertTriangle className="h-4 w-4 shrink-0" />
                         <span className="font-medium">{tySync.lastError}</span>
                      </div>
                      <button onClick={handleSyncTyOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pazarama Integration Section */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm" id="pz-integration-card">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {lang === 'tr' ? 'Satıcı ID' : 'Merchant ID'}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    value={pzMerchantId}
                    onChange={(e) => setPzMerchantId(e.target.value)}
                    placeholder="ae486bf3-..."
                  />
                </div>
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
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {lang === 'tr' ? 'Komisyon Oranı (%)' : 'Commission Rate (%)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    <input 
                      type="number" 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                      value={pzCommissionRate}
                      onChange={(e) => setPzCommissionRate(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {!isPzConnected ? (
                  <button 
                    onClick={handleSavePzSettings}
                    id="pz-connect-btn"
                    className="col-span-1 sm:col-span-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{t.connectPazarama}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSyncPzOrders}
                      id="pz-sync-orders"
                      disabled={pzSync.isSyncing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${pzSync.isSyncing ? 'animate-spin' : ''}`} />
                      <span>{pzSync.isSyncing ? t.loading : t.syncOrders}</span>
                    </button>
                    <button 
                      onClick={handleSavePzSettings}
                      id="pz-update-settings"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-slate-300 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t.update}</span>
                    </button>
                    <button 
                      onClick={handleDisconnectPz}
                      id="pz-disconnect"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{t.disconnect}</span>
                    </button>
                    <button 
                      onClick={handleTestPz}
                      id="pz-test"
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
                    </button>
                  </>
                )}
              </div>

              {isPzConnected && (
                <div className="space-y-4" id="pz-mapping-panel">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Tag className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kategori Eşleştirme' : 'Category Mapping'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{lang === 'tr' ? 'Pazarama kategorilerini kendi kategorilerinle eşle' : 'Map Pazarama categories with your own categories'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={fetchPzCategories}
                        disabled={loadingPzCats}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingPzCats ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        <span>{lang === 'tr' ? 'Verileri Çek' : 'Fetch Data'}</span>
                      </button>
                    </div>

                    {showPzMapping && (
                      <div className="mt-6 space-y-4 pt-4 border-t border-blue-100">
                        {localCategories.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">{lang === 'tr' ? 'Henüz kategori içeren ürününüz yok.' : 'No products with categories found.'}</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {localCategories.map(cat => (
                              <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-blue-50">
                                <span className="text-xs font-bold text-slate-700">{cat}</span>
                                <select 
                                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 min-w-[200px]"
                                  value={pzCategoryMappings[cat] || ""}
                                  onChange={(e) => setPzCategoryMappings({...pzCategoryMappings, [cat]: e.target.value})}
                                >
                                  <option value="">{lang === 'tr' ? 'Pazarama Kategorisi Seç' : 'Select Pazarama Category'}</option>
                                  {pzCategories.map((pzCat: any) => (
                                    <option key={pzCat.id || pzCat.categoryId || pzCat.CategoryId} value={pzCat.id || pzCat.categoryId || pzCat.CategoryId}>
                                      {pzCat.name || pzCat.categoryName || pzCat.CategoryName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={handleSavePzSettings}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {lang === 'tr' ? 'Eşleştirmeleri Kaydet' : 'Save Mappings'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Tag className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Marka Eşleştirme' : 'Brand Mapping'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{lang === 'tr' ? 'Pazarama markalarını kendi markalarınla eşle' : 'Map Pazarama brands with your own brands'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={fetchPzBrands}
                        disabled={loadingPzBrands}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingPzBrands ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        <span>{lang === 'tr' ? 'Markaları Çek' : 'Fetch Brands'}</span>
                      </button>
                    </div>

                    {showPzBrandMapping && (
                      <div className="mt-6 space-y-4 pt-4 border-t border-purple-100">
                        {localBrands.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">{lang === 'tr' ? 'Henüz marka içeren ürününüz yok.' : 'No products with brands found.'}</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {localBrands.map(brand => (
                              <div key={brand} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-purple-50">
                                <span className="text-xs font-bold text-slate-700">{brand}</span>
                                <select 
                                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/10 min-w-[200px]"
                                  value={pzBrandMappings[brand] || ""}
                                  onChange={(e) => setPzBrandMappings({...pzBrandMappings, [brand]: e.target.value})}
                                >
                                  <option value="">{lang === 'tr' ? 'Pazarama Markası Seç' : 'Select Pazarama Brand'}</option>
                                  {pzBrands.map((pzBrand: any) => (
                                    <option key={pzBrand.id || pzBrand.brandId || pzBrand.BrandId} value={pzBrand.id || pzBrand.brandId || pzBrand.BrandId}>
                                      {pzBrand.name || pzBrand.brandName || pzBrand.BrandName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <button 
                            onClick={handleSavePzSettings}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            {lang === 'tr' ? 'Eşleştirmeleri Kaydet' : 'Save Mappings'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.lastSync}</p>
                    <p className="text-sm font-bold text-slate-900">
                      {pzSync.lastSync ? pzSync.lastSync.toLocaleString() : (pzSettings.last_sync ? new Date(pzSettings.last_sync).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') : (lang === 'tr' ? 'Henüz yapılmadı' : 'Never'))}
                    </p>
                    {pzSync.lastError && (
                      <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4 shrink-0" />
                           <span className="font-medium">{pzSync.lastError}</span>
                        </div>
                        <button onClick={handleSyncPzOrders} className="w-full text-xs font-bold bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors text-rose-700">{lang === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

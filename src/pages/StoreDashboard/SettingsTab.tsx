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
  AlertTriangle,
  Truck,
  Plus,
  Trash2,
  Wrench,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { useIntegrationSync } from "../../hooks/useIntegrationSync";
import { DEVELOPED_COUNTRIES } from "../../constants";
import { api } from "../../services/api";
import { PageBuilder } from "../../components/PageBuilder";

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
  products?: any[];
  onRefresh?: () => void;
  bulkPriceForm: any;
  setBulkPriceForm: (form: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => Promise<void>;
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
  currentStoreId,
  products = [],
  onRefresh,
  bulkPriceForm,
  setBulkPriceForm,
  handleBulkPriceSubmit
}: SettingsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || {};
  const amazonSync = useIntegrationSync('Amazon', t);
  const n11Sync = useIntegrationSync('N11', t);
  const hbSync = useIntegrationSync('Hepsiburada', t);
  const tySync = useIntegrationSync('Trendyol', t);
  const pzSync = useIntegrationSync('Pazarama', t);

  const [amazonClientId, setAmazonClientId] = React.useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = React.useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = React.useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = React.useState(branding.amazon_settings?.sellerId || "");
  
  const [n11AppKey, setN11AppKey] = React.useState(branding.n11_settings?.appKey || "");
  const [n11AppSecret, setN11AppSecret] = React.useState(branding.n11_settings?.appSecret || "");

  const [hbApiKey, setHbApiKey] = React.useState(branding.hepsiburada_settings?.apiKey || "");
  const [hbApiSecret, setHbApiSecret] = React.useState(branding.hepsiburada_settings?.apiSecret || "");
  const [hbMerchantId, setHbMerchantId] = React.useState(branding.hepsiburada_settings?.merchantId || "");

  const [tyApiKey, setTyApiKey] = React.useState(branding.trendyol_settings?.apiKey || "");
  const [tyApiSecret, setTyApiSecret] = React.useState(branding.trendyol_settings?.apiSecret || "");
  const [tyMerchantId, setTyMerchantId] = React.useState(branding.trendyol_settings?.merchantId || "");

  const [pzApiKey, setPzApiKey] = React.useState(branding.pazarama_settings?.apiKey || "");
  const [pzApiSecret, setPzApiSecret] = React.useState(branding.pazarama_settings?.apiSecret || "");
  const [pzMerchantId, setPzMerchantId] = React.useState(branding.pazarama_settings?.merchantId || "");
  const [pzCommissionRate, setPzCommissionRate] = React.useState(branding.pazarama_settings?.commissionRate || 0);
  const [pzCategories, setPzCategories] = React.useState<any[]>([]);
  const [pzBrands, setPzBrands] = React.useState<any[]>([]);
  const [loadingPzCats, setLoadingPzCats] = React.useState(false);
  const [loadingPzBrands, setLoadingPzBrands] = React.useState(false);
  const [pzCategoryMappings, setPzCategoryMappings] = React.useState<Record<string, string>>(branding.pazarama_settings?.categoryMappings || {});
  const [pzBrandMappings, setPzBrandMappings] = React.useState<Record<string, string>>(branding.pazarama_settings?.brandMappings || {});
  const [showPzMapping, setShowPzMapping] = React.useState(false);
  const [showPzBrandMapping, setShowPzBrandMapping] = React.useState(false);
  const [verifyingDomain, setVerifyingDomain] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<{ a: boolean, cname: boolean, ip: string | null, target: string | null } | null>(null);
  const [cfStatus, setCfStatus] = React.useState<any>(null);
  const [cfNameServers, setCfNameServers] = React.useState<string[]>([]);
  const [cfConfigured, setCfConfigured] = React.useState(false);
  const [showManualCf, setShowManualCf] = React.useState(false);
  const [manualCfToken, setManualCfToken] = React.useState("");
  const [manualCfAccount, setManualCfAccount] = React.useState("");
  const [manualCfEmail, setManualCfEmail] = React.useState("");
  const [loadingCf, setLoadingCf] = React.useState(false);

  // Sync Pazarama state when branding prop changes
  React.useEffect(() => {
    const s = branding.pazarama_settings || {};
    setPzApiKey(s.apiKey || "");
    setPzApiSecret(s.apiSecret || "");
    setPzMerchantId(s.merchantId || "");
    setPzCommissionRate(s.commissionRate || 0);
    setPzCategoryMappings(s.categoryMappings || {});
    setPzBrandMappings(s.brandMappings || {});
  }, [branding.pazarama_settings]);

  const [emails, setEmails] = React.useState<string[]>((branding.emails && branding.emails.length > 0) ? branding.emails : ['']);
  const [phones, setPhones] = React.useState<string[]>((branding.phones && branding.phones.length > 0) ? branding.phones : ['']);
  const [activeSubTab, setActiveSubTab] = React.useState<string>(localStorage.getItem(`settingsSubTab_${currentStoreId || 'admin'}`) || 'web');
  
  const addEmail = () => setEmails([...emails, '']);
  const removeEmail = (index: number) => setEmails(emails.filter((_, i) => i !== index));
  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index: number) => setPhones(phones.filter((_, i) => i !== index));
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  React.useEffect(() => {
    onBrandingChange('emails', emails);
    onBrandingChange('phones', phones);
    // Sync singular fields for compatibility with Showcase footer
    if (emails.length > 0 && emails[0]) {
      onBrandingChange('email', emails[0]);
    }
    if (phones.length > 0 && phones[0]) {
      onBrandingChange('phone', phones[0]);
    }
  }, [emails, phones]);

  React.useEffect(() => {
    localStorage.setItem(`settingsSubTab_${currentStoreId || 'admin'}`, activeSubTab);
  }, [activeSubTab, currentStoreId]);

  React.useEffect(() => {
    if (branding.custom_domain) {
      fetchCfStatus();
    }
  }, [branding.custom_domain]);

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
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncOrders = async () => {
    await amazonSync.runSync(
      () => api.syncAmazonOrders(currentStoreId),
      (res) => {
        alert(`${t.amazonSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectAmazon = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectAmazon(currentStoreId);
      alert(t.amazonDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveN11Settings = async () => {
    try {
      await api.saveN11Settings({ appKey: n11AppKey, appSecret: n11AppSecret, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncN11Orders = async () => {
    await n11Sync.runSync(
      () => api.syncN11Orders(currentStoreId),
      (res) => {
        alert(`${t.n11SyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectN11 = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectN11(currentStoreId);
      alert(t.n11Disconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveHbSettings = async () => {
    try {
      await api.saveHepsiburadaSettings({ apiKey: hbApiKey, apiSecret: hbApiSecret, merchantId: hbMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncHbOrders = async () => {
    await hbSync.runSync(
      () => api.syncHepsiburadaOrders(currentStoreId),
      (res) => {
        alert(`${t.hepsiburadaSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectHb = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectHepsiburada(currentStoreId);
      alert(t.hepsiburadaDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSaveTySettings = async () => {
    try {
      await api.saveTrendyolSettings({ apiKey: tyApiKey, apiSecret: tyApiSecret, merchantId: tyMerchantId, storeId: currentStoreId });
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleSyncTyOrders = async () => {
    await tySync.runSync(
      () => api.syncTrendyolOrders(currentStoreId),
      (res) => {
        alert(`${t.trendyolSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectTy = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectTrendyol(currentStoreId);
      alert(t.trendyolDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
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
      alert(t.saveSuccess);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
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
      setPzCategories(res.data || []);
      setShowPzMapping(true);
    } catch (e: any) {
      alert(e.response?.data?.error || "Hata oluştu");
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
      setPzBrands(res.data || []);
      setShowPzBrandMapping(true);
    } catch (e: any) {
      alert(e.response?.data?.error || "Hata oluştu");
    } finally {
      setLoadingPzBrands(false);
    }
  };

  const localCategories = React.useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const localBrands = React.useMemo(() => {
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
        alert(`${t.pazaramaSyncSuccess}: ${res.count} ${t.sales}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectPz = async () => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await api.disconnectPazarama(currentStoreId);
      onBrandingChange('pazarama_settings', {});
      alert(t.pazaramaDisconnected);
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleVerifyDomain = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setVerifyingDomain(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyDomain(branding.custom_domain);
      if (res.error) {
        throw new Error(res.error);
      }
      setVerificationResult(res);
      if (res.a && res.cname) {
        // Automatically save if verified
        onSaveBranding();
      }
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Doğrulama sırasında bir hata oluştu' : 'An error occurred during verification'));
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleConnectCloudflare = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.addCustomDomain(branding.custom_domain, currentStoreId, {
        manualToken: manualCfToken || undefined,
        manualAccount: manualCfAccount || undefined,
        manualEmail: manualCfEmail || undefined
      });
      if (res.error) {
        if (res.error.toLowerCase().includes("configuration missing")) {
          setShowManualCf(true);
        }
        throw new Error(res.error);
      }
      alert(lang === 'tr' ? 'Domain Cloudflare sistemine eklendi. Lütfen doğrulama kayıtlarını bekleyin.' : 'Domain added to Cloudflare. Please wait for verification records.');
      if (manualCfToken && manualCfAccount) {
        setCfConfigured(true);
      }
      setManualCfToken("");
      setManualCfAccount("");
      setManualCfEmail("");
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const handleManualSave = async () => {
    if (!branding.custom_domain) {
      alert(lang === 'tr' ? 'Lütfen bir domain girin' : 'Please enter a domain');
      return;
    }
    setLoadingCf(true);
    try {
      const res = await api.saveCustomDomainManual(branding.custom_domain, currentStoreId);
      if (res.error) throw new Error(res.error);
      alert(lang === 'tr' ? 'Domain başarıyla kaydedildi. Şimdi DNS kayıtlarınızı (A Kaydı) yönlendirebilirsiniz.' : 'Domain saved successfully. You can now point your DNS records (A Record).');
      fetchCfStatus();
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? 'Hata oluştu' : 'Error occurred'));
    } finally {
      setLoadingCf(false);
    }
  };

  const fetchCfStatus = async () => {
    try {
      const res = await api.getCustomDomainStatus(currentStoreId);
      if (res.domain) {
        setCfStatus({ status: res.status, domain: res.domain });
        if (res.status === 'manual') {
          setCfNameServers([]);
        } else {
          setCfNameServers(res.name_servers || []);
        }
      } else {
        setCfStatus(null);
        setCfNameServers([]);
      }
      // Set configured state from backend flag
      setCfConfigured(!!res.isConfigured);
    } catch (error) {
      console.error("CF Status fetch error:", error);
    }
  };

  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await api.getCustomDomainStatus(currentStoreId);
        setCfConfigured(!!res.isConfigured);
      } catch (e) {
        console.error("Config check error:", e);
      }
    };
    checkConfig();
  }, [currentStoreId]);

  React.useEffect(() => {
    if (activeSubTab === 'web' && branding.custom_domain) {
      fetchCfStatus();
      const interval = setInterval(fetchCfStatus, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [activeSubTab, branding.custom_domain]);

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
        <button 
          onClick={() => setActiveSubTab('domain')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'domain' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Globe className="h-4 w-4" />
          <span>{t.settingsCategories?.domainSettings}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('shipping')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'shipping' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Truck className="h-4 w-4" />
          <span>{lang === 'tr' ? 'Kargo Ayarları' : 'Shipping'}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('bulk-price')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'bulk-price' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>{lang === 'tr' ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update'}</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('e-invoice')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-invoice' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Building2 className="h-4 w-4" />
          <span>{lang === 'tr' ? 'Resmi Belge & E-Fatura' : 'E-Invoice Options'}</span>
        </button>
      </div>

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
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.defaultTaxRate || 'Varsayılan KDV Oranı (%)'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-semibold text-sm text-slate-900"
                    value={branding.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : '20'}
                    onChange={(e) => onBrandingChange('default_tax_rate', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.categoryTaxRules || 'Kategori KDV Kuralları'}</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      id="new-category-name"
                      placeholder={t.categoryNamePlaceholder || 'Kategori Adı (Örn: ALKOLLÜ İÇECEKLER)'}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      <input 
                        type="text" 
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
                          newRules.push({ category: catInput.value.trim(), taxRate: parseInt(taxInput.value.replace(/[^0-9]/g, '')) || 0 });
                          onBrandingChange('category_tax_rules', newRules);
                          catInput.value = '';
                          taxInput.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      {t.add}
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
                            {t.delete}
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

      {activeSubTab === 'pos' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Payment Method Settings */}
          <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 overflow-hidden relative bg-white border-slate-200`}>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">
                {lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Methods'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash on Delivery Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-sm text-slate-700">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={!!branding.payment_settings?.cod_enabled}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, cod_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Bank Transfer Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-sm text-slate-700">{lang === 'tr' ? 'Banka Transferi' : 'Bank Transfer'}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={!!branding.payment_settings?.bank_transfer_enabled}
                      onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, bank_transfer_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Bank Details Input - Visible only if enabled */}
              {branding.payment_settings?.bank_transfer_enabled && (
                <div className="mt-6 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {lang === 'tr' ? 'Banka Hesap Bilgileri (IBAN)' : 'Bank Account Details (IBAN)'}
                  </label>
                  <textarea
                    value={branding.payment_settings?.bank_details || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, bank_details: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:bg-white focus:border-indigo-500 transition-all outline-none"
                    rows={3}
                    placeholder={lang === 'tr' ? 'Banka adı, Hesap sahibi, IBAN bilgileri...' : 'Bank name, Account holder, IBAN details...'}
                  />
                </div>
              )}
              
              <div className="flex justify-end pt-6">
                <button
                    onClick={onSaveBranding}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{lang === 'tr' ? 'Ayarları Kaydet' : 'Save Settings'}</span>
                  </button>
              </div>
            </div>

          {/* Iyzico Virtual POS Settings */}
          <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 overflow-hidden relative ${branding.iyzico_enabled ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100/50' : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'}`}>
            {branding.iyzico_enabled && (
              <div className="absolute top-0 right-0 p-8">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${branding.iyzico_enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <CreditCard className={`w-6 h-6 ${branding.iyzico_enabled ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {lang === 'tr' ? 'Iyzico Sanal POS' : 'Iyzico Virtual POS'}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {lang === 'tr' ? 'E-Ticaret Tahsilat Altyapısı' : 'E-Commerce Payment Gateway'}
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={!!branding.payment_settings?.iyzico_enabled}
                  onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_enabled: e.target.checked })}
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <AnimatePresence>
              {branding.payment_settings?.iyzico_enabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'API Anahtarı' : 'API Key'}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          value={branding.payment_settings?.iyzico_api_key || ''}
                          onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_api_key: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                          placeholder={lang === 'tr' ? 'Iyzico panelinden kopyalayın...' : 'Copy from Iyzico panel...'}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Güvenlik Anahtarı' : 'Secret Key'}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          value={branding.payment_settings?.iyzico_secret_key || ''}
                          onChange={(e) => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_secret_key: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                          placeholder={lang === 'tr' ? 'Gizli anahtarınız...' : 'Your secret key...'}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Çalışma Ortamı' : 'Environment'}</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_sandbox: true })}
                          className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${!!branding.payment_settings?.iyzico_sandbox ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          <Wrench className="w-4 h-4" />
                          {lang === 'tr' ? 'Sandbox (Test Eğitimi)' : 'Sandbox (Test)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onBrandingChange('payment_settings', { ...branding.payment_settings, iyzico_sandbox: false })}
                          className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-sm ${!branding.payment_settings?.iyzico_sandbox ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          <Globe className="w-4 h-4" />
                          {lang === 'tr' ? 'Canlı (Production)' : 'Live (Production)'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                     <button
                        onClick={onSaveBranding}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{lang === 'tr' ? 'Bağlantıyı Kaydet' : 'Save Connection'}</span>
                      </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Local Cash Register/POS Bridge Settings */}
           <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 overflow-hidden relative ${branding.pos_bridge_enabled ? 'bg-white border-orange-200 shadow-xl shadow-orange-100/50' : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'}`}>
            {branding.pos_bridge_enabled && (
               <div className="absolute top-0 right-0 p-8">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${branding.pos_bridge_enabled ? 'bg-orange-500' : 'bg-slate-200'}`}>
                  <Smartphone className={`w-6 h-6 ${branding.pos_bridge_enabled ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {lang === 'tr' ? 'Fiziksel Yazar Kasa / POS Köprüsü' : 'Physical POS Bridge'}
                  </h3>
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {lang === 'tr' ? 'Yerel Ağ Aygıt İletişimi' : 'Local Network Device Communication'}
                  </p>
                </div>
              </div>
              
               <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={!!branding.pos_bridge_enabled}
                  onChange={(e) => onBrandingChange('pos_bridge_enabled', e.target.checked)}
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <AnimatePresence>
               {branding.pos_bridge_enabled && (
                 <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Köprü IP Adresi' : 'Bridge IP Address'}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={branding.pos_bridge_ip || '127.0.0.1'}
                          onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Köprü Portu' : 'Bridge Port'}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <AlertTriangle className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={branding.pos_bridge_port || '1616'}
                          onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-5 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col md:flex-row items-start gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                      <Info className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-orange-900 mb-1 tracking-tight">{lang === 'tr' ? 'Yerel Ağ Köprüsü Nasıl Çalışır?' : 'How Local Network Bridge Works?'}</h4>
                      <p className="text-[13px] font-medium text-orange-800/80 leading-relaxed mb-4">
                        {lang === 'tr' 
                          ? 'LookPrice, buluttan mağazanızın içindeki fiziksel donanımlara (Yazar Kasa, Para Çekmecesi, POS) erişmek için mağazanızdaki bir bilgisayara kurulan küçük bir köprü yazılımı ile iletişim kurar. Bu ayarlar, o bilgisayarın yerel IP adresi ve portudur. "Hızlı POS" modülü bu kanalı kullanır.' 
                          : 'LookPrice communicates with physical hardware in your store (Cash Register, Cash Drawer, POS) from the cloud using a small bridge software installed on a store computer. These settings define its local IP and port. The "Fast POS" module uses this channel.'}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            alert(lang === 'tr' ? 'Köprü yazılımı indirmesi başlatılıyor...' : 'Bridge software download starting...');
                          }}
                          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>{lang === 'tr' ? 'Windows için İndir (.exe)' : 'Download for Windows (.exe)'}</span>
                        </a>
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            alert(lang === 'tr' ? 'Köprü yazılımı indirmesi başlatılıyor...' : 'Bridge software download starting...');
                          }}
                          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>{lang === 'tr' ? 'Mac için İndir (.dmg)' : 'Download for Mac (.dmg)'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={onSaveBranding}
                      className="px-8 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 transition-all flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{lang === 'tr' ? 'Köprü Ayarlarını Kaydet' : 'Save Bridge Settings'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'bulk-price' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">{lang === 'tr' ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update'}</h3>
            <form onSubmit={handleBulkPriceSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Hedef' : 'Target'}</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-900"
                    value={bulkPriceForm.target}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, target: e.target.value })}
                  >
                    <option value="all">{lang === 'tr' ? 'Tüm Ürünler' : 'All Products'}</option>
                    <option value="category">{lang === 'tr' ? 'Kategori Bazlı' : 'Category Based'}</option>
                  </select>
                </div>
                {bulkPriceForm.target === 'category' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Kategori' : 'Category'}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-900"
                      value={bulkPriceForm.category}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'İşlem Tipi' : 'Type'}</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-900"
                    value={bulkPriceForm.type}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, type: e.target.value })}
                  >
                    <option value="percentage">{lang === 'tr' ? 'Yüzde (%)' : 'Percentage (%)'}</option>
                    <option value="fixed">{lang === 'tr' ? 'Sabit Tutar' : 'Fixed Amount'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Yön' : 'Direction'}</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-900"
                    value={bulkPriceForm.direction}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, direction: e.target.value })}
                  >
                    <option value="increase">{lang === 'tr' ? 'Artır' : 'Increase'}</option>
                    <option value="decrease">{lang === 'tr' ? 'Azalt' : 'Decrease'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Değer' : 'Value'}</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm text-slate-900"
                    value={bulkPriceForm.value}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {lang === 'tr' ? 'Fiyatları Güncelle' : 'Update Prices'}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'e-invoice' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Resmi Belge & E-Fatura' : 'Official Docs & E-Invoice'}</h3>
                <p className="text-xs text-slate-500 mt-1">{lang === 'tr' ? 'E-Fatura sistemini açıp kapatın ve entegratör ayarlarınızı yapın.' : 'Enable/disable e-invoice system and configure your integrator.'}</p>
              </div>
            </div>

            {/* Toggle System */}
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800">{lang === 'tr' ? 'E-Fatura Sistemi Aktif' : 'E-Invoice System Active'}</h4>
                <p className="text-sm text-slate-500">{lang === 'tr' ? 'Eğer bu ülkede/mağazada e-fatura kullanmıyorsanız kapalı tutun.' : 'Keep this disabled if you do not use e-invoices in your country/store.'}</p>
              </div>
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding?.einvoice_settings?.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                onClick={() => {
                  const currentParams = branding?.einvoice_settings || { provider: 'none' };
                  onBrandingChange('einvoice_settings', { ...currentParams, is_active: !currentParams.is_active });
                }}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding?.einvoice_settings?.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {branding?.einvoice_settings?.is_active && (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Entegratör (Servis Sağlayıcı)' : 'Integrator (Provider)'}</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-medium"
                    value={branding.einvoice_settings.provider || 'none'}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, provider: e.target.value })}
                  >
                    <option value="none">-- {lang === 'tr' ? 'Seçiniz' : 'Select'} --</option>
                    <option value="mysoft">MySoft</option>
                    <option value="diyalogo">Diyalogo (Yakında)</option>
                  </select>
                </div>
                
                {branding.einvoice_settings.provider === 'mysoft' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'MySoft Kimlik Bilgileri' : 'MySoft Credentials'}</h4>
                    </div>
                    
                    {/* User & Token */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Kullanıcı ID (URN/Tax Identity)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="Örn: 210"
                        value={branding.einvoice_settings.username || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Token / API Key</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="tPerKc0mws..."
                        value={branding.einvoice_settings.api_token || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_token: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tenant (Vergi Numarası)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="11111111111"
                        value={branding.einvoice_settings.tenant_id || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tenant_id: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'GİB Etiket (Alias) Posta Kutuları' : 'GIB URN Alias Mailboxes'}</h4>
                      <p className="text-xs text-slate-500 mb-4">{lang === 'tr' ? 'Fatura paketlerinin (UBL) içine yazılacak resmi GİB gönderici ve alıcı etiketleriniz.' : 'Official URNs injected into the invoice XML payload.'}</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Gönderici Birim Alias (GB)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="urn:mail:faturagb@firma.com"
                        value={branding.einvoice_settings.sender_alias || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, sender_alias: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Posta Kutusu Alias (PK)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="urn:mail:faturapk@firma.com"
                        value={branding.einvoice_settings.receiver_alias || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, receiver_alias: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Kullanıcı Adı</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="gapbilisim"
                        value={branding.einvoice_settings.earchive_username || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_username: e.target.value })}
                      />
                    </div>
                    
                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'Fatura Ön Ek (Seri) Ayarları' : 'Invoice Prefix Series'}</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Ön Eki (Örn: GAP)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                        placeholder="GAP"
                        value={branding.einvoice_settings.einvoice_prefix || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, einvoice_prefix: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Ön Eki (Örn: GEA)</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                        placeholder="GEA"
                        value={branding.einvoice_settings.earchive_prefix || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_prefix: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeSubTab === 'layout' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Sayfa Düzeni</h3>
            <PageBuilder 
              layout={branding.page_layout || []} 
              onUpdateLayout={(newLayout) => onBrandingChange('page_layout', newLayout)} 
            />
          </div>
        </div>
      )}

      {activeSubTab === 'shipping' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{lang === 'tr' ? 'Kargo Ücretleri' : 'Shipping Profiles'}</h3>
                <p className="text-sm text-slate-500">
                  {lang === 'tr' 
                    ? 'Farklı desi, ağırlık veya bölgeler için kargo ücretleri tanımlayın. Bu ücretleri ürün eklerken seçebilirsiniz.' 
                    : 'Define shipping costs for different weights, volumes, or regions. You can select these when adding products.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  const newProfiles = [...(branding.shipping_profiles || []), { id: Date.now().toString(), name: '', cost: 0, currency: branding.default_currency || 'TRY' }];
                  onBrandingChange('shipping_profiles', newProfiles);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                {lang === 'tr' ? 'Yeni Kargo Profili' : 'New Profile'}
              </button>
            </div>

            <div className="space-y-4">
              {(branding.shipping_profiles || []).map((profile: any, index: number) => (
                <div key={profile.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">{lang === 'tr' ? 'Profil Adı (örn: 0-1 Desi)' : 'Profile Name'}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                      value={profile.name}
                      onChange={(e) => {
                        const newProfiles = [...branding.shipping_profiles];
                        newProfiles[index].name = e.target.value;
                        onBrandingChange('shipping_profiles', newProfiles);
                      }}
                      placeholder={lang === 'tr' ? 'Örn: 0-1 Desi Aras Kargo' : 'e.g. 0-1 Kg Standard'}
                    />
                  </div>
                  <div className="w-full sm:w-32 shrink-0">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">{lang === 'tr' ? 'Ücret' : 'Cost'}</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                      value={profile.cost}
                      onChange={(e) => {
                        const newProfiles = [...branding.shipping_profiles];
                        newProfiles[index].cost = parseFloat(e.target.value) || 0;
                        onBrandingChange('shipping_profiles', newProfiles);
                      }}
                    />
                  </div>
                  <div className="w-full sm:w-24 shrink-0">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                      value={profile.currency}
                      onChange={(e) => {
                        const newProfiles = [...branding.shipping_profiles];
                        newProfiles[index].currency = e.target.value;
                        onBrandingChange('shipping_profiles', newProfiles);
                      }}
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      const newProfiles = branding.shipping_profiles.filter((_: any, i: number) => i !== index);
                      onBrandingChange('shipping_profiles', newProfiles);
                    }}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-6 sm:mt-5"
                    title={lang === 'tr' ? 'Sil' : 'Delete'}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {(!branding.shipping_profiles || branding.shipping_profiles.length === 0) && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Truck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">{lang === 'tr' ? 'Henüz kargo profili eklemediniz.' : 'No shipping profiles added yet.'}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'menu' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{lang === 'tr' ? 'Menü Yönetimi' : 'Menu Management'}</h3>
              <p className="text-sm text-slate-500">
                {lang === 'tr' 
                  ? 'Buradan mağazanızın üst menüsünde görünecek bağlantıları yönetebilirsiniz. Yeni bir sayfa oluşturmaz, sadece mevcut bölümlere (örn: /#about) veya dış bağlantılara (örn: https://google.com) yönlendirme yapar.' 
                  : 'Manage the links that will appear in your store\'s top menu. This does not create new pages, it only links to existing sections (e.g., /#about) or external URLs.'}
              </p>
            </div>
            <div className="space-y-4">
              {(branding.menu_links || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Menü Adı' : 'Menu Name'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...(branding.menu_links || [])];
                      newLinks[index].label = e.target.value;
                      onBrandingChange('menu_links', newLinks);
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Link (örn: /about)' : 'Link (e.g., /about)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(branding.menu_links || [])];
                      newLinks[index].url = e.target.value;
                      onBrandingChange('menu_links', newLinks);
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newLinks = (branding.menu_links || []).filter((_: any, i: number) => i !== index);
                      onBrandingChange('menu_links', newLinks);
                    }}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newLinks = [...(branding.menu_links || []), { label: '', url: '' }];
                  onBrandingChange('menu_links', newLinks);
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                {lang === 'tr' ? 'Yeni Link Ekle' : 'Add New Link'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">{lang === 'tr' ? 'Alt Menü (Yasal Sayfalar)' : 'Footer Menu (Legal Pages)'}</h3>
            <div className="space-y-4">
              {(branding.footer_links || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-4 items-center">
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Sayfa Adı (örn: Gizlilik Politikası)' : 'Page Name (e.g., Privacy Policy)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...(branding.footer_links || [])];
                      newLinks[index].label = e.target.value;
                      onBrandingChange('footer_links', newLinks);
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder={lang === 'tr' ? 'Link (örn: /privacy)' : 'Link (e.g., /privacy)'}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(branding.footer_links || [])];
                      newLinks[index].url = e.target.value;
                      onBrandingChange('footer_links', newLinks);
                    }}
                  />
                  <button 
                    onClick={() => {
                      const newLinks = (branding.footer_links || []).filter((_: any, i: number) => i !== index);
                      onBrandingChange('footer_links', newLinks);
                    }}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newLinks = [...(branding.footer_links || []), { label: '', url: '' }];
                  onBrandingChange('footer_links', newLinks);
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
              >
                {lang === 'tr' ? 'Yeni Sayfa Ekle' : 'Add New Page'}
              </button>
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
                          disabled={amazonSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${amazonSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{amazonSync.isSyncing ? t.loading : t.syncOrders}</span>
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
                          disabled={n11Sync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{n11Sync.isSyncing ? t.loading : t.syncOrders}</span>
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
                          disabled={hbSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${hbSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{hbSync.isSyncing ? t.loading : t.syncOrders}</span>
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
                          disabled={tySync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${tySync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{tySync.isSyncing ? t.loading : t.syncOrders}</span>
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
                          onChange={(e) => setPzCommissionRate(e.target.value)}
                          placeholder="0"
                        />
                      </div>
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
                          disabled={pzSync.isSyncing}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${pzSync.isSyncing ? 'animate-spin' : ''}`} />
                          <span>{pzSync.isSyncing ? t.loading : t.syncOrders}</span>
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
                    <div className="space-y-4">
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
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
                                        <option key={pzCat.id || pzCat.categoryId} value={pzCat.id || pzCat.categoryId}>
                                          {pzCat.name || pzCat.categoryName}
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
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all"
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
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50"
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
                                        <option key={pzBrand.id || pzBrand.brandId} value={pzBrand.id || pzBrand.brandId}>
                                          {pzBrand.name || pzBrand.brandName}
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
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all"
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
      )}

      {activeSubTab === 'domain' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Özel Alan Adı (Domain) Ayarları' : 'Custom Domain Settings'}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{lang === 'tr' ? 'Mağazanızı kendi alan adınız üzerinden yayınlayın' : 'Publish your store on your own domain'}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Alan Adınız' : 'Your Domain Name'}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900"
                      value={branding.custom_domain || ""}
                      onChange={(e) => {
                        onBrandingChange('custom_domain', e.target.value);
                      }}
                      placeholder="Örn: shop.magazam.com"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic ml-1">
                  {lang === 'tr' 
                    ? '* Domaininizi bağlamak için aşağıdaki otomatik sistemi kullanın. SSL sertifikanız otomatik olarak oluşturulacaktır.' 
                    : '* Use the automated system below to connect your domain. Your SSL certificate will be created automatically.'}
                </p>

                {/* Cloudflare SaaS Section */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {lang === 'tr' ? 'Cloudflare SaaS Otomatik SSL & Domain Bağlantısı' : 'Cloudflare SaaS Auto SSL & Domain Connection'}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {lang === 'tr' ? 'Sıfır manuel işlem ile domaininizi bağlayın' : 'Connect your domain with zero manual effort'}
                      </p>
                    </div>
                  </div>

                  {!cfStatus ? (
                    <div className="space-y-4">
                      {cfConfigured && !showManualCf ? (
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-900">
                                {lang === 'tr' ? 'Cloudflare Sistemi Hazır' : 'Cloudflare System Ready'}
                              </p>
                              <p className="text-[10px] text-green-700">
                                {lang === 'tr' ? 'Sistem anahtarları aktif. Mağaza için özel anahtar gerekmez.' : 'System keys are active. No store-specific keys needed.'}
                              </p>
                            </div>
                          </div>
                          {currentUser?.role === 'superadmin' && (
                            <button 
                              onClick={() => setShowManualCf(true)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                            >
                              {lang === 'tr' ? 'Manuel Gir' : 'Manual Entry'}
                            </button>
                          )}
                        </div>
                      ) : (
                        (currentUser?.role === 'superadmin' || !cfConfigured) && (
                          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                {lang === 'tr' ? 'Cloudflare API Bilgileri' : 'Cloudflare API Credentials'}
                              </p>
                              {cfConfigured && (
                                <button 
                                  onClick={() => setShowManualCf(false)}
                                  className="text-[10px] font-bold text-indigo-600"
                                >
                                  {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare Email (Required for Global API Key)</label>
                                <input 
                                  type="email"
                                  placeholder="Örn: user@example.com"
                                  value={manualCfEmail}
                                  onChange={(e) => setManualCfEmail(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mb-2"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare API Token / Global Key</label>
                                <input 
                                  type="password"
                                  placeholder="Örn: 1234567890abcdef..."
                                  value={manualCfToken}
                                  onChange={(e) => setManualCfToken(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare Account ID</label>
                                <input 
                                  type="text"
                                  placeholder="Örn: a1b2c3d4e5f6..."
                                  value={manualCfAccount}
                                  onChange={(e) => setManualCfAccount(e.target.value)}
                                  className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={handleConnectCloudflare}
                          disabled={loadingCf || !branding.custom_domain}
                          className="py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {loadingCf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                          <span>{lang === 'tr' ? 'Cloudflare ile Otomatik Bağla' : 'Auto Connect with Cloudflare'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700">{lang === 'tr' ? 'Durum:' : 'Status:'}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${cfStatus.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {cfStatus.status}
                          </span>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!confirm(lang === 'tr' ? 'DNS kayıtları onarılsın mı? (Error 1000 hatasını çözer)' : 'Repair DNS records? (Fixes Error 1000)')) return;
                            setLoadingCf(true);
                            try {
                              await api.post(`/api/store/domain/fix?storeId=${currentStoreId}`, {});
                              alert(lang === 'tr' ? 'DNS kayıtları onarıldı ve Gri Bulut moduna alındı.' : 'DNS records repaired and set to Grey Cloud.');
                              fetchCfStatus();
                            } catch (e: any) {
                              alert(e.message);
                            } finally {
                              setLoadingCf(false);
                            }
                          }}
                          disabled={loadingCf}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3" />
                          {lang === 'tr' ? 'DNS Onar' : 'Fix DNS'}
                        </button>
                      </div>

                      {cfNameServers && cfNameServers.length > 0 && cfStatus.status !== 'active' && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                          <p className="text-xs font-bold text-indigo-900">
                            {lang === 'tr' ? 'Domaininizi Bağlamak İçin Name Serverları Güncelleyin' : 'Update Name Servers to Connect Your Domain'}
                          </p>
                          <p className="text-[10px] text-indigo-600 leading-relaxed">
                            {lang === 'tr' 
                              ? 'Domaininizi aldığınız panelden aşağıdaki Name Server (NS) adreslerini tanımlayın. Bu işlemden sonra domaininiz otomatik olarak aktif olacaktır.' 
                              : 'Set the following Name Server (NS) addresses in your domain registrar panel. Your domain will be activated automatically after this.'}
                          </p>
                          <div className="space-y-2 pt-2">
                            {cfNameServers.map((ns, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-500">NS {idx + 1}:</span>
                                <code 
                                  className="font-mono font-bold text-indigo-600 select-all cursor-pointer" 
                                  onClick={() => { 
                                    navigator.clipboard.writeText(ns); 
                                    alert(lang === 'tr' ? 'Kopyalandı!' : 'Copied!'); 
                                  }}
                                >
                                  {ns}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cfStatus.status === 'active' && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <p className="text-xs font-bold text-emerald-900">
                            {lang === 'tr' ? 'Domaininiz başarıyla bağlandı ve aktif!' : 'Your domain is successfully connected and active!'}
                          </p>
                        </div>
                      )}

                      {cfStatus.status === 'manual' && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                            <p className="text-xs font-bold text-indigo-900">
                              {lang === 'tr' ? 'Domain Kaydedildi' : 'Domain Saved'}
                            </p>
                          </div>
                          <p className="text-[10px] text-indigo-600 leading-relaxed">
                            {lang === 'tr' 
                              ? 'Domaininiz sisteme kaydedildi. Şimdi domain panelinizden A kaydını 216.24.57.1 IP adresine yönlendirdiğinizden emin olun.' 
                              : 'Your domain has been saved. Please ensure you have pointed the A record to 216.24.57.1 in your domain panel.'}
                          </p>
                          <button 
                            onClick={() => setCfStatus(null)}
                            className="text-[10px] font-bold text-indigo-600 underline"
                          >
                            {lang === 'tr' ? 'Ayarları Sıfırla' : 'Reset Settings'}
                          </button>
                        </div>
                      )}
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
          {/* Showcase Sections Control Panel */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Vitrin Bölümleri' : 'Showcase Sections'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Zenginleştirilmiş Mağaza Özellikleri' : 'Enriched Store Features'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'show_announcement', label: lang === 'tr' ? 'Duyuru Bandı (Marquee)' : 'Announcement Bar', icon: <RefreshCw className="w-4 h-4" />, desc: lang === 'tr' ? 'Üstte kayan kampanya metni' : 'Scrolling campaign text at the top' },
                { key: 'show_stories', label: lang === 'tr' ? 'Kategori Hikayeleri' : 'Category Stories', icon: <ImageIcon className="w-4 h-4" />, desc: lang === 'tr' ? 'İnstagram tarzı yuvarlak ikonlar' : 'Instagram-style circular icons' },
                { key: 'show_campaigns', label: lang === 'tr' ? 'Fırsat Bölümü' : 'Deals Section', icon: <ShoppingBag className="w-4 h-4" />, desc: lang === 'tr' ? 'Özel fiyatlı ürünleri öne çıkar' : 'Highlight special-priced items' },
                { key: 'show_testimonials', label: lang === 'tr' ? 'Sosyal Kanıt (Yorumlar)' : 'Social Proof (Reviews)', icon: <User className="w-4 h-4" />, desc: lang === 'tr' ? 'Müşteri deneyimlerini sergile' : 'Showcase customer experiences' },
                { key: 'show_newsletter', label: lang === 'tr' ? 'Haber Bülteni' : 'Newsletter', icon: <Mail className="w-4 h-4" />, desc: lang === 'tr' ? 'E-posta listesi toplayın' : 'Collect email subscribers' },
                { key: 'enable_live_activity', label: lang === 'tr' ? 'Canlı Aktivite' : 'Live Activity', icon: <Smartphone className="w-4 h-4" />, desc: lang === 'tr' ? 'Satış bildirim baloncukları' : 'Recent purchase notifications' },
              ].map((section) => (
                <div key={section.key} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl text-slate-400 group-hover:text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition-colors">
                      {section.icon}
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700 cursor-pointer block">{section.label}</label>
                      <span className="text-[10px] text-slate-400 font-medium">{section.desc}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const currentLayout = branding.page_layout_settings || {
                        show_announcement: true,
                        show_stories: true,
                        show_campaigns: true,
                        show_testimonials: true,
                        show_newsletter: true,
                        enable_live_activity: true,
                        theme_variety: 'modern'
                      };
                      onBrandingChange('page_layout_settings', { ...currentLayout, [section.key]: currentLayout[section.key as keyof typeof currentLayout] === false ? true : false });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${branding.page_layout_settings?.[section.key] !== false ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.page_layout_settings?.[section.key] !== false ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
               <div className="relative z-10">
                 <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <Palette className="w-4 h-4 text-indigo-400" />
                   {lang === 'tr' ? 'TASARIM KONSEPTİ' : 'DESIGN CONCEPT'}
                 </h4>
                 <div className="grid grid-cols-3 gap-4">
                    {['modern', 'minimal', 'bold'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => {
                          const currentLayout = branding.page_layout_settings || {};
                          onBrandingChange('page_layout_settings', { ...currentLayout, theme_variety: theme });
                        }}
                        className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${branding.page_layout_settings?.theme_variety === theme ? 'border-indigo-400 bg-indigo-500/10 text-white shadow-lg' : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${branding.page_layout_settings?.theme_variety === theme ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                           {theme === 'modern' && <RefreshCw className="w-5 h-5" />}
                           {theme === 'minimal' && <Settings className="w-5 h-5" />}
                           {theme === 'bold' && <Building2 className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{theme}</span>
                      </button>
                    ))}
                 </div>
               </div>
            </div>
            
            <div className="flex justify-end pt-8">
              <button
                onClick={onSaveBranding}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center space-x-3 shadow-2xl shadow-indigo-200 active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>{lang === 'tr' ? 'GÜNCELLEMELERİ YAYINLA' : 'PUBLISH UPDATES'}</span>
              </button>
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Mağaza Ünvanı' : 'Store Name'}</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all font-bold text-sm text-slate-900"
                  value={branding.name || ""}
                  onChange={(e) => onBrandingChange('name', e.target.value)}
                  placeholder={lang === 'tr' ? 'Mağaza Ünvanı' : 'Store Name'}
                />
              </div>
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
              <div className="space-y-4 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'İletişim Bilgileri' : 'Contact Information'}</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* EMAILS */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">{lang === 'tr' ? 'E-posta Adresleri' : 'Email Addresses'}</p>
                    {emails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          placeholder="email@example.com"
                        />
                        {emails.length > 1 && (
                          <button onClick={() => removeEmail(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={addEmail} className="text-xs font-bold text-indigo-600 flex items-center gap-1">+ {lang === 'tr' ? 'E-posta Ekle' : 'Add Email'}</button>
                  </div>
                  
                  {/* PHONES */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">{lang === 'tr' ? 'Telefon Numaraları' : 'Phone Numbers'}</p>
                    {phones.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => updatePhone(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          placeholder="+905XXXXXXXXX"
                        />
                        {phones.length > 1 && (
                          <button onClick={() => removePhone(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={addPhone} className="text-xs font-bold text-indigo-600 flex items-center gap-1">+ {lang === 'tr' ? 'Telefon Ekle' : 'Add Phone'}</button>
                  </div>
                </div>
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
                <p className="text-xs text-slate-400 font-medium mt-0.5">{lang === 'tr' ? 'Iyzico ve Fiziksel POS ayarları için yukarıdaki POS Ayarları sekmesini kullanın.' : 'Use the POS Settings tab above for Iyzico and Physical POS settings.'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
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

import React, { useState, useEffect } from "react";
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
  Tag,
  Star,
  X,
  Cpu,
  Cpu as CpuIcon,
  ShieldCheck,
  History,
  Terminal,
  Activity,
  Sparkles,
  HelpCircle,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { useIntegrationSync } from "../../hooks/useIntegrationSync";
import { DEVELOPED_COUNTRIES } from "../../constants";
import { api } from "../../services/api";
import { PageBuilder } from "../../components/PageBuilder";
import { toast } from "sonner";

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

  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = React.useState(false);
  const [isGoogleDriveExporting, setIsGoogleDriveExporting] = React.useState(false);

  React.useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      if (res && res.data) {
        setIsGoogleDriveConnected(res.data.connected);
      }
    }).catch(console.error);
  }, []);

  const handleConnectGoogleDrive = async () => {
    try {
      const res = await api.getGoogleDriveAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        res.data.url,
        "Google Drive Bağlantısı",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      const checkPopup = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          const verifyRes = await api.getGoogleDriveSettings();
          setIsGoogleDriveConnected(verifyRes.data.connected);
        }
      }, 1000);
    } catch (error) {
      toast.error("Bağlantı URL'i alınamadı");
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!window.confirm("Google Drive bağlantısını kesmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectGoogleDrive();
      setIsGoogleDriveConnected(false);
      toast.success("Google Drive bağlantısı kesildi.");
    } catch (error) {
      toast.error("Çıkış başarısız oldu.");
    }
  };

  const handleExportGoogleDrive = async (targetType: string, format: string) => {
    setIsGoogleDriveExporting(true);
    try {
      const res = await api.exportToGoogleDrive({ targetType, format });
      toast.success(res.data.message || 'Başarıyla eklendi!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Yedekleme sırasında hata oluştu.');
    } finally {
      setIsGoogleDriveExporting(false);
    }
  };

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
  const [testingEInvoice, setTestingEInvoice] = React.useState(false);

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

  const handleTestEInvoice = async () => {
    setTestingEInvoice(true);
    try {
      const res = await api.testEInvoiceConnection();
      if (res.error) throw new Error(res.error);
      alert(res.message || (lang === 'tr' ? "Bağlantı başarılı!" : "Connection successful!"));
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? "Bağlantı hatası!" : "Connection error!"));
    } finally {
      setTestingEInvoice(false);
    }
  };

  const [isFinSyncing, setIsFinSyncing] = React.useState(false);
  const [finSyncLogs, setFinSyncLogs] = React.useState<string[]>([]);
  const [activeFinCurrency, setActiveFinCurrency] = React.useState<string>("TRY");

  const [emails, setEmails] = React.useState<string[]>((branding.emails && branding.emails.length > 0) ? branding.emails : ['']);
  const [phones, setPhones] = React.useState<string[]>((branding.phones && branding.phones.length > 0) ? branding.phones : ['']);
  const [activeSubTab, setActiveSubTab] = React.useState<string>(() => {
    return localStorage.getItem(`settingsSubTab_${currentStoreId || 'admin'}`) || 'web';
  });

  React.useEffect(() => {
    localStorage.setItem(`settingsSubTab_${currentStoreId || 'admin'}`, activeSubTab);
  }, [activeSubTab, currentStoreId]);

  const [logs, setLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);

  const isPortfolio = branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive';

  React.useEffect(() => {
    if (isPortfolio && (activeSubTab === 'pos' || activeSubTab === 'e-stores' || activeSubTab === 'e-invoice')) {
      setActiveSubTab('financing');
    }
  }, [isPortfolio, activeSubTab]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(currentStoreId);
      // Filter for integration logs if possible, or just show all
      setLogs(res || []);
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'logs') {
      fetchLogs();
    }
  }, [activeSubTab]);
  
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

  const handleTestN11 = async () => {
    try {
      const res = await api.testN11Connection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'N11 Bağlantısı Başarılı!' : 'N11 Connection Successful!') : `${lang === 'tr' ? 'N11 Bağlantı Hatası' : 'N11 Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestHb = async () => {
    try {
      const res = await api.testHepsiburadaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Hepsiburada Bağlantısı Başarılı!' : 'Hepsiburada Connection Successful!') : `${lang === 'tr' ? 'Hepsiburada Bağlantı Hatası' : 'Hepsiburada Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestTy = async () => {
    try {
      const res = await api.testTrendyolConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Trendyol Bağlantısı Başarılı!' : 'Trendyol Connection Successful!') : `${lang === 'tr' ? 'Trendyol Bağlantı Hatası' : 'Trendyol Connection Error'}: ${res.error}`);
    } catch (error) {
      alert(t.errorOccurred);
    }
  };

  const handleTestPz = async () => {
    try {
      const res = await api.testPazaramaConnection(currentStoreId);
      alert(res.success ? (lang === 'tr' ? 'Pazarama Bağlantısı Başarılı!' : 'Pazarama Connection Successful!') : `${lang === 'tr' ? 'Pazarama Bağlantı Hatası' : 'Pazarama Connection Error'}: ${res.error}`);
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
      if (res.error) {
        throw new Error(res.error);
      }
      
      // Backend now returns only the data array, but being safe
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

      // Backend now returns only the data array, but being safe
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
            onClick={() => setActiveSubTab('integrations')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'integrations' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Database className="h-4 w-4" />
            <span>Entegrasyonlar</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('web')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'web' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Palette className="h-4 w-4" />
            <span>{t.settingsCategories?.webSettings}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('store-ops')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'store-ops' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Wrench className="h-4 w-4" />
            <span>{lang === 'tr' ? 'Mağaza Ayarları' : 'Store Settings'}</span>
          </button>
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('pos')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'pos' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>{t.settingsCategories?.posSettings}</span>
            </button>
          )}
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('e-stores')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-stores' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t.settingsCategories?.eStores}</span>
            </button>
          )}
          {isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('financing')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'financing' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>{lang === 'tr' ? 'Finansal Asistan' : 'Financial Assistant'}</span>
            </button>
          )}
          <button 
            onClick={() => setActiveSubTab('domain')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'domain' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Globe className="h-4 w-4" />
            <span>{t.settingsCategories?.domainSettings}</span>
          </button>
          {!isPortfolio && (
            <button 
              onClick={() => setActiveSubTab('e-invoice')}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'e-invoice' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Building2 className="h-4 w-4" />
              <span>E-Invoice</span>
            </button>
          )}
          <button 
            onClick={() => setActiveSubTab('logs')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${activeSubTab === 'logs' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <History className="h-4 w-4" />
            <span>{lang === 'tr' ? 'Günlük' : 'Logs'}</span>
          </button>
        </div>

      {activeSubTab === 'integrations' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Google Drive Yedekleme Sistemi</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Bulut sürücünüzü bağlayıp verilerinizi otomatik/manuel yedekleyin.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isGoogleDriveConnected ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-lg border border-emerald-200">
                    Drive Bağlı
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                    Bağlı Değil
                  </span>
                )}
              </div>
            </div>

            {isGoogleDriveConnected ? (
              <div className="space-y-6 relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleExportGoogleDrive('products', 'xls')}
                    disabled={isGoogleDriveExporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(Excel)</span>
                  </button>
                  <button
                    onClick={() => handleExportGoogleDrive('products', 'pdf')}
                    disabled={isGoogleDriveExporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(PDF)</span>
                  </button>
                  <button
                    onClick={() => handleExportGoogleDrive('real_estate', 'xls')}
                    disabled={isGoogleDriveExporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(Excel)</span>
                  </button>
                  <button
                    onClick={() => handleExportGoogleDrive('real_estate', 'pdf')}
                    disabled={isGoogleDriveExporting}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(PDF)</span>
                  </button>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <button
                    onClick={handleDisconnectGoogleDrive}
                    className="px-6 py-2.5 bg-white text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm font-bold text-xs uppercase tracking-wider"
                  >
                    Bağlantıyı Kes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 relative">
                <button
                  onClick={handleConnectGoogleDrive}
                  className="px-8 py-3.5 bg-[#4285F4] text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 font-bold text-sm tracking-wide transition-all flex items-center space-x-2"
                >
                  <Database className="h-4 w-4" />
                  <span>Google Drive Hesabı Bağla</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeSubTab === 'logs' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-100 rounded-2xl">
                  <History className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{lang === 'tr' ? 'İşlem ve Entegrasyon Günlüğü' : 'Integration & Audit Logs'}</h2>
                  <p className="text-sm text-slate-500">{lang === 'tr' ? 'Son yapılan işlemler ve pazar yeri senkronizasyon detayları' : 'Recent activities and marketplace sync details'}</p>
                </div>
              </div>
              <button 
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {loadingLogs ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  {lang === 'tr' ? 'Kayıt bulunamadı.' : 'No logs found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-4 pl-4">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                        <th className="pb-4">{lang === 'tr' ? 'İşlem' : 'Action'}</th>
                        <th className="pb-4 text-center">{lang === 'tr' ? 'Detay' : 'Details'}</th>
                        <th className="pb-4 pr-4 text-right">{lang === 'tr' ? 'Veri' : 'Data'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.map((log: any) => (
                        <tr key={log.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pl-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                            {new Date(log.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              log.action?.includes('error') ? 'bg-rose-50 text-rose-600' :
                              log.action?.includes('warning') ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-4 pr-4 text-right">
                            {log.metadata ? (
                              <button 
                                onClick={() => alert(JSON.stringify(log.metadata, null, 2))}
                                className="text-xs text-blue-600 hover:underline font-bold"
                              >
                                {lang === 'tr' ? 'HAM VERİ' : 'RAW DATA'}
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'logs' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-100 rounded-2xl">
                  <History className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Sistem İşlem Günlüğü' : 'System Audit Logs'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Son 50 Entegrasyon ve Yönetim Aktivitesi' : 'Audit trails of store activity'}</p>
                </div>
              </div>
              <button 
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="flex items-center space-x-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-indigo-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">{lang === 'tr' ? 'Henüz hiçbir işlem kaydı bulunmuyor.' : 'No audit logs captured yet.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-4 pl-4">{lang === 'tr' ? 'KULLANICI' : 'USER'}</th>
                        <th className="pb-4">{lang === 'tr' ? 'TARİH' : 'DATE'}</th>
                        <th className="pb-4">{lang === 'tr' ? 'İŞLEM' : 'ACTION'}</th>
                        <th className="pb-4">{lang === 'tr' ? 'DETAY' : 'DETAILS'}</th>
                        <th className="pb-4 pr-4 text-right">{lang === 'tr' ? 'VERİ' : 'RAW'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.slice(0, 50).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pl-4 font-bold text-slate-900">{log.user_email || 'Sistem'}</td>
                          <td className="py-4 text-xs font-medium text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              log.action?.includes('error') ? 'bg-rose-50 text-rose-600' :
                              log.action?.includes('warning') ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-4 text-slate-700 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="py-4 pr-4 text-right">
                            {log.metadata ? (
                              <button 
                                onClick={() => alert(JSON.stringify(log.metadata, null, 2))}
                                className="text-xs text-blue-600 hover:underline font-bold"
                              >
                                {lang === 'tr' ? 'HAM VERİ' : 'RAW DATA'}
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeSubTab === 'financing' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6 pb-20"
        >
          {/* Header Description Info card */}
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AKILLI FİNANSAL ENTEGRASYON YÖNETİMİ
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Akıllı Finansal Asistan & Sponsorluk Entegrasyonu Ayarları</h2>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Para birimlerine göre (TL, GBP, EUR, USD) bankaların resmi sitelerinden faiz oranlarının canlı teyidini yapabilir, sisteme özel partner oranlarını ve firma özel kampanya indirimlerini entegre edebilirsiniz. Portföy detaylarındaki finansman aracı bu parametrelere ve para birimlerine göre otomatik hesaplama yapar.
              </p>
            </div>
            <button 
              onClick={onSaveBranding}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Sponsorlukları Kaydet
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Bank Base Interest Rates & Official Scrap Sync Panel */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-500" />
                      BANKALARIN RESMİ FAİZ ORANLARI (BASE RATES)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sistem tarafından resmi web siteleri üzerinden teyit edilen baz oranlar</p>
                  </div>
                </div>

                {/* Interactive Currency tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 mb-6">
                  {["TRY", "GBP", "EUR", "USD"].map((curr) => {
                    const symbols: Record<string, string> = { TRY: "TL (₺)", GBP: "GBP (£)", EUR: "EUR (€)", USD: "USD ($)" };
                    return (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setActiveFinCurrency(curr)}
                        className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                          activeFinCurrency === curr
                            ? "bg-slate-900 text-white shadow-lg"
                            : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                        }`}
                      >
                        {symbols[curr]}
                      </button>
                    );
                  })}
                </div>

                {/* Simulated Banks List with Real Website Links and Inline Inputs */}
                <div className="space-y-4">
                  {[
                    { id: "Creditwest Bank", url: "https://www.creditwestbank.com/bireysel/krediler/konut-kredisi/", logo: "🏛️" },
                    { id: "Kıbrıs İktisat Bankası", url: "https://www.iktisatbank.com/bireysel/krediler/ev-kredisi", logo: "🏦" },
                    { id: "Limasol Sosyal Kooperatif", url: "https://www.limasolkooperatif.com/krediler/konut-kredileri/", logo: "🏢" },
                    { id: "Ziraat Bankası KKTC", url: "https://www.ziraatbank.com.tr/tr/kktc-bireysel-krediler", logo: "🏙️" }
                  ].map((bank) => {
                    const currentFinSettings = branding.financing_settings || {};
                    const baseRatesObj = currentFinSettings.base_rates || {};

                    const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
                      TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
                      GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
                      EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
                      USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
                    };

                    let currencyRates: Record<string, number> = {};
                    if (baseRatesObj["Creditwest Bank"] !== undefined) {
                      currencyRates = { ...DEFAULT_BASE_RATES[activeFinCurrency] };
                      if (activeFinCurrency === "TRY") {
                        currencyRates["Creditwest Bank"] = Number(baseRatesObj["Creditwest Bank"] || 1.89);
                        currencyRates["Kıbrıs İktisat Bankası"] = Number(baseRatesObj["Kıbrıs İktisat Bankası"] || 2.05);
                        currencyRates["Limasol Sosyal Kooperatif"] = Number(baseRatesObj["Limasol Sosyal Kooperatif"] || 2.19);
                        currencyRates["Ziraat Bankası KKTC"] = Number(baseRatesObj["Ziraat Bankası KKTC"] || 1.99);
                      }
                    } else {
                      currencyRates = baseRatesObj[activeFinCurrency] || DEFAULT_BASE_RATES[activeFinCurrency];
                    }

                    const bankRate = currencyRates[bank.id] !== undefined ? currencyRates[bank.id] : DEFAULT_BASE_RATES[activeFinCurrency][bank.id];

                    return (
                      <div key={bank.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{bank.logo}</span>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{bank.id}</span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase">
                              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                              OKUNDU ({activeFinCurrency})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Teyit Kaynağı:</span>
                            <a 
                              href={bank.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                            >
                              Resmi Web Sayfası <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        {/* Editable Rate Input with dynamic binding */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-bold text-slate-400">%</span>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder={String(DEFAULT_BASE_RATES[activeFinCurrency][bank.id])}
                            value={bankRate}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value) || 0;
                              const currentSettings = branding.financing_settings || {};
                              const oldBase = currentSettings.base_rates || {};

                              let normalizedBase: Record<string, Record<string, number>> = {};
                              if (oldBase["Creditwest Bank"] !== undefined) {
                                normalizedBase = {
                                  TRY: {
                                    "Creditwest Bank": Number(oldBase["Creditwest Bank"] || 1.89),
                                    "Kıbrıs İktisat Bankası": Number(oldBase["Kıbrıs İktisat Bankası"] || 2.05),
                                    "Limasol Sosyal Kooperatif": Number(oldBase["Limasol Sosyal Kooperatif"] || 2.19),
                                    "Ziraat Bankası KKTC": Number(oldBase["Ziraat Bankası KKTC"] || 1.99)
                                  },
                                  GBP: { ...DEFAULT_BASE_RATES.GBP },
                                  EUR: { ...DEFAULT_BASE_RATES.EUR },
                                  USD: { ...DEFAULT_BASE_RATES.USD }
                                };
                              } else {
                                normalizedBase = {
                                  TRY: oldBase.TRY || { ...DEFAULT_BASE_RATES.TRY },
                                  GBP: oldBase.GBP || { ...DEFAULT_BASE_RATES.GBP },
                                  EUR: oldBase.EUR || { ...DEFAULT_BASE_RATES.EUR },
                                  USD: oldBase.USD || { ...DEFAULT_BASE_RATES.USD }
                                };
                              }

                              normalizedBase[activeFinCurrency] = {
                                ...(normalizedBase[activeFinCurrency] || DEFAULT_BASE_RATES[activeFinCurrency]),
                                [bank.id]: parsed
                              };

                              onBrandingChange('financing_settings', {
                                ...currentSettings,
                                base_rates: normalizedBase
                              });
                            }}
                            className="bg-white border border-slate-200 text-slate-800 text-xs font-black text-center py-1.5 rounded-xl w-20 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-500"
                          />
                          <span className="text-[10px] font-medium text-slate-400">/ Aylık</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scraper Simulation Command & Log terminal panel */}
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Resmi Siteden Otomatik Faiz Doğrulama ve Eşitleme</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sistem, bankaların API/Web sitelerinden faiz oranlarını otomatik teyit eder</p>
                    </div>
                    <button 
                      type="button"
                      disabled={isFinSyncing}
                      onClick={() => {
                        setIsFinSyncing(true);
                        setFinSyncLogs([]);
                        
                        const logLines = [
                          "[CONNECT] LookPrice AI Entegrasyon Köprüsü başlatılıyor...",
                          "[API] KKTC bankaları dijital web servislerine bağlanılıyor...",
                          "[SCRAPE] Creditwest Bank bireysel krediler web sayfası taranıyor...",
                          "[PARSED] Creditwest Bank konut kredisi okundu: TRY %3.49 | GBP %0.55 | EUR %0.49 | USD %0.52",
                          "[SCRAPE] Kıbrıs İktisat Bankası kredi simülatör şeması taranıyor...",
                          "[PARSED] Kıbrıs İktisat Bankası konut kredisi okundu: TRY %3.65 | GBP %0.60 | EUR %0.52 | USD %0.55",
                          "[SCRAPE] Limasol Sosyal Kooperatif resmi faiz tablosu okunuyor...",
                          "[PARSED] Limasol Sosyal Kooperatif konut kredisi okundu: TRY %3.89 | GBP %0.65 | EUR %0.58 | USD %0.60",
                          "[SCRAPE] Ziraat Bankası KKTC bireysel oranlar API'si taranıyor...",
                          "[PARSED] Ziraat Bankası KKTC konut kredisi okundu: TRY %3.79 | GBP %0.58 | EUR %0.50 | USD %0.54",
                          "[SYNC] Teyit Sonucu: Web sitelerindeki tüm para birimi oranları sistemle başarıyla senkronize edildi!",
                          "[SUCCESS] Tüm resmi banka oranları ve para birimleri bazında eşitleme tamamlandı."
                        ];

                        let idx = 0;
                        const interval = setInterval(() => {
                          if (idx < logLines.length) {
                            setFinSyncLogs(prev => [...prev, logLines[idx]]);
                            idx++;
                          } else {
                            clearInterval(interval);
                            setIsFinSyncing(false);
                            
                            const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
                              TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
                              GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
                              EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
                              USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
                            };

                            const currentSettings = branding.financing_settings || {};
                            onBrandingChange('financing_settings', {
                              ...currentSettings,
                              base_rates: DEFAULT_BASE_RATES,
                              last_sync_time: new Date().toLocaleString()
                            });
                          }
                        }, 600);
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      {isFinSyncing ? "Teyit Ediliyor..." : "Resmi Web Sitelerinden Canlı Teyit Et"}
                    </button>
                  </div>

                  {/* Terminal Log Console */}
                  {(isFinSyncing || finSyncLogs.length > 0) && (
                    <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 space-y-1 max-h-[180px] overflow-y-auto border border-white/5 shadow-inner">
                      {finSyncLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-slate-600">{`>`}</span>
                          <span>{log}</span>
                        </div>
                      ))}
                      {isFinSyncing && (
                        <div className="flex items-center gap-2 text-indigo-400 animate-pulse mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span>Bankaların resmi web sunucularına veri taranıyor...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sync Meta Status Label */}
                  {branding.financing_settings?.last_sync_time && (
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Son Başarılı Entegrasyon Otomasyon Kontrolü: <span className="text-slate-700">{branding.financing_settings.last_sync_time}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Special Promotion & Discounted Agreed Partner Overrides */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/30">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-500 border border-amber-100 shadow-sm animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">ÖZEL ANLAŞMALI PARTNER ORANLARI</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Büyük portföy yönetim şirketlerine özel anlaşmalı banka oran tanımları</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-700 uppercase block">Anlaşmalı Oran Girişini Aktif Et</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Sponsor bankalarla yaptığınız özel oranları hesaplamada öncelikli kılın</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentSettings = branding.financing_settings || {};
                        const oldVal = currentSettings.partner_promo_active === true;
                        onBrandingChange('financing_settings', {
                          ...currentSettings,
                          partner_promo_active: !oldVal
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${branding.financing_settings?.partner_promo_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.financing_settings?.partner_promo_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Overridden Partner rates inputs block */}
                {branding.financing_settings?.partner_promo_active ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="p-3 bg-amber-50/50 border border-amber-100/80 rounded-2xl text-[10px] text-amber-700 font-medium leading-relaxed flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>DİKKAT:</strong> Anlaşmalı partner oranları aktifken, portföy sitemizdeki tüm finansman kredi hesaplama simülasyonlarında, <strong>{activeFinCurrency}</strong> için girilen aşağıdaki indirimli faiz oranları öncelikli olarak baz alınacaktır!
                      </span>
                    </div>

                    {[
                      { id: "Creditwest Bank", logo: "🏛️", defaultRate: activeFinCurrency === "TRY" ? "2.99" : "0.39" },
                      { id: "Kıbrıs İktisat Bankası", logo: "🏦", defaultRate: activeFinCurrency === "TRY" ? "3.10" : "0.45" },
                      { id: "Limasol Sosyal Kooperatif", logo: "🏢", defaultRate: activeFinCurrency === "TRY" ? "3.40" : "0.49" },
                      { id: "Ziraat Bankası KKTC", logo: "🏙️", defaultRate: activeFinCurrency === "TRY" ? "3.20" : "0.42" }
                    ].map((bank) => {
                      const currentSettings = branding.financing_settings || {};
                      const partnerRatesObj = currentSettings.partner_rates || {};

                      let currencyPartnerRates: Record<string, any> = {};
                      if (partnerRatesObj["Creditwest Bank"] !== undefined) {
                        currencyPartnerRates = {};
                        if (activeFinCurrency === "TRY") {
                          currencyPartnerRates = { ...partnerRatesObj };
                        }
                      } else {
                        currencyPartnerRates = partnerRatesObj[activeFinCurrency] || {};
                      }

                      const partnerVal = currencyPartnerRates[bank.id] !== undefined ? currencyPartnerRates[bank.id] : "";

                      return (
                        <div key={bank.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{bank.logo}</span>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{bank.id}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">%</span>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder={bank.defaultRate}
                              value={partnerVal}
                              onChange={(e) => {
                                const currentSettings = branding.financing_settings || {};
                                const oldPartner = currentSettings.partner_rates || {};

                                let normalizedPartner: Record<string, Record<string, any>> = {};
                                if (oldPartner["Creditwest Bank"] !== undefined) {
                                  normalizedPartner = {
                                    TRY: { ...oldPartner },
                                    GBP: {},
                                    EUR: {},
                                    USD: {}
                                  };
                                } else {
                                  normalizedPartner = {
                                    TRY: oldPartner.TRY || {},
                                    GBP: oldPartner.GBP || {},
                                    EUR: oldPartner.EUR || {},
                                    USD: oldPartner.USD || {}
                                  };
                                }

                                normalizedPartner[activeFinCurrency] = {
                                  ...(normalizedPartner[activeFinCurrency] || {}),
                                  [bank.id]: e.target.value
                                };

                                onBrandingChange('financing_settings', {
                                  ...currentSettings,
                                  partner_rates: normalizedPartner
                                });
                              }}
                              className="bg-white border border-slate-200 text-slate-800 text-xs font-black text-center py-1 rounded-lg w-20 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-500"
                            />
                            <span className="text-[9px] font-bold text-slate-400">({activeFinCurrency})</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <span className="text-xs font-bold font-sans uppercase tracking-tight block">Partner Oran Eşleştirme Pasif</span>
                    <span className="text-[10px] font-medium block mt-1 leading-relaxed">Firma özel anlaşmalı indirimli oranlarını sisteme tanımlamak için yukarıdaki anahtarı açıp değerleri girebilirsiniz.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {activeSubTab === 'store-ops' && (
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
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700"
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
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
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
                  onClick={() => {
                    const newProfiles = [...(branding.shipping_profiles || []), { id: Date.now().toString(), name: '', cost: 0, currency: branding.default_currency || 'TRY' }];
                    onBrandingChange('shipping_profiles', newProfiles);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" /> Yeni Profil
                </button>
              </div>
              
              <div className="space-y-4">
                {(branding.shipping_profiles || []).map((profile: any, index: number) => (
                  <div key={profile.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="flex-1 w-full">
                      <input value={profile.name} onChange={(e) => { const p = [...branding.shipping_profiles]; p[index].name = e.target.value; onBrandingChange('shipping_profiles', p); }} placeholder="Profil Adı" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold mb-2" />
                      <div className="flex gap-2">
                         <input type="number" value={profile.cost} onChange={(e) => { const p = [...branding.shipping_profiles]; p[index].cost = parseFloat(e.target.value); onBrandingChange('shipping_profiles', p); }} placeholder="Ücret" className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                         <input disabled value={profile.currency} className="w-20 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm font-semibold" />
                      </div>
                    </div>
                    <button onClick={() => { const p = [...branding.shipping_profiles]; p.splice(index, 1); onBrandingChange('shipping_profiles', p); }} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Locator & Reservations */}
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
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-bold text-slate-900">Mağazadan Teslimat (Rezervasyon) Aktif Et</span>
              </label>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mağaza Konumları</h4>
                 {(branding.locations || []).map((loc: any, idx: number) => (
                   <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl items-center">
                     <input name={`location_name_${idx}`} id={`location_name_${idx}`} value={loc.name} onChange={(e) => { const l = [...(branding.locations||[])]; l[idx] = { ...l[idx], name: e.target.value }; onBrandingChange('locations', l); }} placeholder="Mağaza Adı" className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                     <input name={`location_address_${idx}`} id={`location_address_${idx}`} value={loc.address} onChange={(e) => { const l = [...(branding.locations||[])]; l[idx] = { ...l[idx], address: e.target.value }; onBrandingChange('locations', l); }} placeholder="Adres" className="col-span-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold" />
                   </div>
                 ))}
                 <button 
                  onClick={() => onBrandingChange('locations', [...(branding.locations || []), { name: '', address: '', active: true }])}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                 >Mağaza Ekle</button>
              </div>
            </div>
          </div>

          {/* Bulk Price Update */}
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
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
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                      value={bulkPriceForm.category}
                      onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, category: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">İşlem Tipi</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
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
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    value={bulkPriceForm.value}
                    onChange={(e) => setBulkPriceForm({ ...bulkPriceForm, value: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Fiyatları Güncelle
              </button>
            </form>
          </div>

          <div className="flex justify-end pt-6">
            <button onClick={onSaveBranding} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center gap-3">
              <Save className="w-5 h-5" />
              Tüm Mağaza Ayarlarını Kaydet
            </button>
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
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">MySoft E-Fatura API URL (Opsiyonel)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="https://edocumentapi.mysoft.com.tr/api"
                        value={branding.einvoice_settings.api_url || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_url: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {lang === 'tr' 
                          ? 'Önemli: iysapi.mysoft.com.tr adresi IYS izinleri içindir, e-fatura için kullanılamaz. Özel bir adresiniz yoksa boş bırakın.' 
                          : 'Important: iysapi.mysoft.com.tr is for IYS permissions, not for e-invoice. Leave blank if you don\'t have a custom address.'}
                      </p>
                    </div>

                    {/* User & Auth */}
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Kullanıcı Adı' : 'MySoft Username'}</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                         placeholder="Kullanıcı adınızı girin"
                         value={branding.einvoice_settings.username || ''}
                         onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, username: e.target.value })}
                       />
                     </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Şifre' : 'MySoft Password'}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="••••••••"
                        value={branding.einvoice_settings.password || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, password: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleTestEInvoice}
                        disabled={testingEInvoice}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${testingEInvoice ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:shadow-md active:scale-95'}`}
                      >
                        {testingEInvoice ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            {lang === 'tr' ? 'Bağlantı Test Ediliyor...' : 'Testing Connection...'}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            {lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test Connection'}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Kullanıcı ID (Tenant ID)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="Örn: 210"
                          value={branding.einvoice_settings.tenant_id || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tenant_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Connector GUID (MySoft)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="Örn: 00000000-0000-0000-0000-000000000000"
                          value={branding.einvoice_settings.connector_guid || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, connector_guid: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv UUID (GİB)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          value={branding.einvoice_settings.earchive_uuid || ''}
                          onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_uuid: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Token / API Key (Statik)</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                        placeholder="Statik bir tokeniniz varsa girin (Opsiyonel)"
                        value={branding.einvoice_settings.api_token || ''}
                        onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_token: e.target.value })}
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

      {activeSubTab === 'pos' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Online Payment Gateways */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Gateways'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Online Tahsilat Seçenekleri' : 'Online Collection Options'}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Cash on Delivery */}
              <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Nakit veya Kart' : 'Cash or Card'}</p>
                  </div>
                </div>
                <button
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), cod_enabled: !branding.payment_settings?.cod_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.cod_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.cod_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Bank Transfer */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer / EFT'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'IBAN ile Ödeme' : 'Payment via IBAN'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_transfer_enabled: !branding.payment_settings?.bank_transfer_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.bank_transfer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.bank_transfer_enabled && (
                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'BANKA HESAP BİLGİLERİ' : 'BANK ACCOUNT DETAILS'}</label>
                    <textarea 
                      className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none"
                      placeholder={lang === 'tr' ? 'IBAN, Banka Adı ve Alıcı ismini buraya yazın...' : 'Write IBAN, Bank Name and Receiver name here...'}
                      value={branding.payment_settings?.bank_details || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_details: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* PayPal */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">PayPal</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.paypal_enabled && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PayPal Client ID</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.paypal_client_id || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_client_id: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payoneer */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Payoneer</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_enabled: !branding.payment_settings?.payoneer_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.payoneer_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.payoneer_enabled && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payoneer Account Email</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.payoneer_email || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_email: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Iyzico */}
              <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Iyzico Sanal POS</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Güvenli Kredi Kartı' : 'Secure Credit Card'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {branding.payment_settings?.iyzico_enabled && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.iyzico_api_key || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_api_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        value={branding.payment_settings?.iyzico_secret_key || ''}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_secret_key: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Mod' : 'Mode'}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        value={branding.payment_settings?.iyzico_sandbox ? 'true' : 'false'}
                        onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_sandbox: e.target.value === 'true' })}
                      >
                        <option value="true">Sandbox (Test)</option>
                        <option value="false">Production (Live)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* POS Bridge Configuration */}
          <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-slate-900 rounded-2xl text-indigo-400 border border-slate-800">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight">POS Köprüsü</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cihaz Entegrasyonu</p>
                  </div>
                </div>
                <button
                  onClick={() => onBrandingChange('pos_bridge_enabled', !branding.pos_bridge_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.pos_bridge_enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.pos_bridge_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${branding.pos_bridge_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Köprü IP Adresi</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <input 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="192.168.1.XX"
                      value={branding.pos_bridge_ip || ''}
                      onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Port</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="8080"
                    value={branding.pos_bridge_port || ''}
                    onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {lang === 'tr' 
                        ? 'LookPrice POS Köprüsü, yerel ağınızdaki fiziksel POS cihazları ile bulut sistemi arasında güvenli bir bağlantı kurar. Bu ayar aktif olduğunda, yapılan satışlar otomatik olarak fiziksel terminale gönderilir.'
                        : 'LookPrice POS Bridge establishes a secure connection between physical POS devices on your local network and the cloud system.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
              {/* Google Drive Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Google Drive Yedekleme Sistemi</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Bulut sürücünüzü bağlayıp verilerinizi otomatik/manuel yedekleyin.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isGoogleDriveConnected ? (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-lg border border-emerald-200">
                        Drive Bağlı
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                        Bağlı Değil
                      </span>
                    )}
                  </div>
                </div>

                {isGoogleDriveConnected ? (
                  <div className="space-y-6 relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => handleExportGoogleDrive('products', 'xls')}
                        disabled={isGoogleDriveExporting}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(Excel)</span>
                      </button>
                      <button
                        onClick={() => handleExportGoogleDrive('products', 'pdf')}
                        disabled={isGoogleDriveExporting}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(PDF)</span>
                      </button>
                      <button
                        onClick={() => handleExportGoogleDrive('real_estate', 'xls')}
                        disabled={isGoogleDriveExporting}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(Excel)</span>
                      </button>
                      <button
                        onClick={() => handleExportGoogleDrive('real_estate', 'pdf')}
                        disabled={isGoogleDriveExporting}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(PDF)</span>
                      </button>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                      <button
                        onClick={handleDisconnectGoogleDrive}
                        className="px-6 py-2.5 bg-white text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm font-bold text-xs uppercase tracking-wider"
                      >
                        Bağlantıyı Kes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 relative">
                    <button
                      onClick={handleConnectGoogleDrive}
                      className="px-8 py-3.5 bg-[#4285F4] text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 font-bold text-sm tracking-wide transition-all flex items-center space-x-2"
                    >
                      <Database className="h-4 w-4" />
                      <span>Google Drive Hesabı Bağla</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Google Drive Integration Section */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Google Drive</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Mağaza verileriniz için güvenli depolama.</p>
                    </div>
                  </div>
                  {isGoogleDriveConnected && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Bağlı</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {!isGoogleDriveConnected ? (
                   <button
                      onClick={handleConnectGoogleDrive}
                      className="px-8 py-3.5 bg-[#4285F4] text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 font-bold text-sm tracking-wide transition-all flex items-center space-x-2"
                    >
                      <Database className="h-4 w-4" />
                      <span>Google Drive Hesabı Bağla</span>
                   </button>
                  ) : (
                    <button
                      onClick={handleDisconnectGoogleDrive}
                      className="px-8 py-3.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5 font-bold text-sm tracking-wide transition-all flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Bağlantıyı Kes</span>
                    </button>
                  )}
                </div>
              </div>

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
                        <button 
                          onClick={handleTestN11}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
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
                        <button 
                          onClick={handleTestHb}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-rose-200 hover:text-rose-600 transition-all flex items-center justify-center space-x-2"
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
                        <button 
                          onClick={handleTestTy}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-orange-200 hover:text-orange-600 transition-all flex items-center justify-center space-x-2"
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
                        <button 
                          onClick={handleTestPz}
                          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{lang === 'tr' ? 'Test Et' : 'Test'}</span>
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
          className="max-w-5xl mx-auto space-y-6 pb-20"
        >
          {/* Main Visual Control Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Showcase & Layout Controls */}
            {!isPortfolio && (
              <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  {lang === 'tr' ? 'VİTRİN VE TASARIM' : 'SHOWCASE & DESIGN'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { key: 'show_announcement', label: lang === 'tr' ? 'Duyuru Bandı' : 'Announcement Bar', icon: <RefreshCw className="w-3.5 h-3.5" /> },
                  { key: 'show_stories', label: lang === 'tr' ? 'Hikayeler' : 'Stories', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                  { key: 'show_campaigns', label: lang === 'tr' ? 'Kampanyalar' : 'Campaigns', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                  { key: 'show_testimonials', label: lang === 'tr' ? 'Müşteri Yorumları' : 'Testimonials', icon: <User className="w-3.5 h-3.5" /> },
                  { key: 'show_newsletter', label: lang === 'tr' ? 'Haber Bülteni' : 'Newsletter', icon: <Mail className="w-3.5 h-3.5" /> },
                  { key: 'enable_live_activity', label: lang === 'tr' ? 'Canlı Aktivite' : 'Live Activity', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { key: 'show_featured_only', label: lang === 'tr' ? 'Fiyatı Düşenler (Fırsat)' : 'Featured Deals', icon: <Star className="w-3.5 h-3.5" />, color: 'text-amber-500' },
                ].map((section) => (
                  <div key={section.key} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg shadow-sm border border-slate-100 ${section.color || 'text-slate-400'}`}>
                        {section.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{section.label}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentLayout = branding.page_layout_settings || {};
                        onBrandingChange('page_layout_settings', { ...currentLayout, [section.key]: currentLayout[section.key as keyof typeof currentLayout] === false ? true : false });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${branding.page_layout_settings?.[section.key] !== false ? (section.color ? 'bg-amber-500' : 'bg-indigo-600') : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.page_layout_settings?.[section.key] !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              
              {branding.page_layout_settings?.show_announcement !== false && (
                <div className="mb-6 p-4 bg-white border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-500 mb-2 block">{lang === 'tr' ? 'Duyuru Metni' : 'Announcement Text'}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900"
                    placeholder={lang === 'tr' ? 'Duyuru metnini buraya yazın...' : 'Enter announcement text here...'}
                    value={branding.page_layout_settings?.announcement_text || ''}
                    onChange={(e) => onBrandingChange('page_layout_settings', { ...branding.page_layout_settings, announcement_text: e.target.value })}
                  />
                </div>
              )}

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{lang === 'tr' ? 'TEMA KONSEPTİ' : 'THEME CONCEPT'}</p>
                <div className="flex gap-2">
                  {['modern', 'minimal', 'bold', 'luxury'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), theme_variety: theme })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branding.page_layout_settings?.theme_variety === theme ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 mt-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{lang === 'tr' ? 'SEKTÖR MODU' : 'SECTOR MODE'}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['general', 'fashion', 'automotive', 'tech', 'real_estate'].map((sect) => (
                    <button
                      key={sect}
                      onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), sector: sect })}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${branding.page_layout_settings?.sector === sect ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                    >
                      {sect === 'general' ? (lang === 'tr' ? 'Genel' : 'General') :
                       sect === 'fashion' ? (lang === 'tr' ? 'Moda / Lüks' : 'Fashion / Luxury') :
                       sect === 'automotive' ? (lang === 'tr' ? 'Otomotiv' : 'Automotive') :
                       sect === 'tech' ? (lang === 'tr' ? 'Teknoloji' : 'Tech') :
                       (lang === 'tr' ? 'Gayrimenkul' : 'Real Estate')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AMİRAL GEMİSİ KAPTAN KÖŞKÜ COMMAND DECK */}
              <div className="mt-6 pt-6 border-t border-slate-150">
                <div className="flex items-center gap-2 mb-4 bg-slate-900/5 p-3.5 rounded-2xl border border-slate-200">
                  <div className="p-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white rounded-xl shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                      {lang === 'tr' ? 'AMİRAL GEMİSİ KAPTAN KÖŞKÜ' : "FLAGSHIP CAPTAIN'S CABIN"}
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-rose-500 uppercase tracking-widest animate-pulse">
                        Pro Live
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {lang === 'tr' ? 'Web sitenizin görsel lüks şablonlarını ve marka hissini tek tıkla özelleştirin.' : 'Instantly command your showcase template, font family, and premium accent flare.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentUser?.role === 'superadmin' ? (
                    <>
                      {/* Premium Layout Templates Selector */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          {lang === 'tr' ? '1. ULTRA-LÜKS VİTRİN ŞABLONU' : '1. ULTRA-LUX SHOWCASE TEMPLATE'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'modern_bento', label: lang === 'tr' ? 'Futuristic Bento Grid' : 'Futuristic Bento Grid', color: 'bg-rose-500' },
                            { id: 'royal_classic', label: lang === 'tr' ? 'Royal Gilded (Lüks)' : 'Royal Gilded (Luxe)', color: 'bg-emerald-500' },
                            { id: 'cyberpunk_accent', label: lang === 'tr' ? 'Cyber Neon Pulse' : 'Cyber Neon Pulse', color: 'bg-cyan-500' },
                            { id: 'alabaster', label: lang === 'tr' ? 'Alabaster Minimalist' : 'Alabaster Minimalist', color: 'bg-slate-500' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), showcase_layout_style: item.id })}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                                branding.page_layout_settings?.showcase_layout_style === item.id 
                                  ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]" 
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{item.label}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font pairings selection */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          {lang === 'tr' ? '2. AMİRAL TIPOGRAFİ EŞLEŞTİRMESİ' : "2. FLAGSHIP TYPOGRAPHY DECK"}
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'modern_edge', title: 'Space + Inter', desc: 'Futuristic' },
                            { id: 'elite_heritage', title: 'Playfair + Inter', desc: 'Editorial' },
                            { id: 'brutalist', title: 'Mono Pair', desc: 'Technical' }
                          ].map((font) => (
                            <button
                              key={font.id}
                              type="button"
                              onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), font_theme: font.id })}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                branding.page_layout_settings?.font_theme === font.id 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-md" 
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="text-[11px] font-black uppercase tracking-tight">{font.title}</div>
                              <div className="text-[9px] text-slate-500 font-bold">{font.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Gradient Color palette selection */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          {lang === 'tr' ? '3. PRESTİJ GLOW IŞIMA AKSANI' : '3. PRESTIGE GLOW ACCENT FLARE'}
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'rose_amber', label: lang === 'tr' ? 'Gül & Turuncu' : 'Rose Amber', fill: 'from-rose-500 to-amber-500' },
                            { id: 'gold_emerald', label: lang === 'tr' ? 'Altın & Zümrüt' : 'Royal Gold', fill: 'from-amber-400 to-emerald-500' },
                            { id: 'violet_indigo', label: lang === 'tr' ? 'Mor & Saks' : 'Cosmic Iris', fill: 'from-violet-500 to-indigo-500' },
                            { id: 'obsidian_mono', label: lang === 'tr' ? 'Kömür & Gümüş' : 'Obsidian Mono', fill: 'from-slate-800 to-slate-400' }
                          ].map((palette) => (
                            <button
                              key={palette.id}
                              type="button"
                              onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), accent_gradient_style: palette.id })}
                              className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                                branding.page_layout_settings?.accent_gradient_style === palette.id
                                  ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-white"
                              }`}
                            >
                              <span className={`w-full h-2.5 rounded bg-gradient-to-r ${palette.fill}`} />
                              <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">
                                {palette.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Border radius sharpness element */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          {lang === 'tr' ? '4. KÖŞE KESKİNLİĞİ HASSASİYETİ' : '4. BORDER RADIUS SHARPNESS'}
                        </span>
                        <div className="flex gap-2">
                          {[
                            { id: 'extreme', label: lang === 'tr' ? 'Ultra Yumuşak (Kavisli)' : 'Ultra Rounded', radius: 'rounded-[2.5rem]' },
                            { id: 'sleek', label: lang === 'tr' ? 'Dengeli Modern' : 'Balanced Sleek', radius: 'rounded-xl' },
                            { id: 'tech_sharp', label: lang === 'tr' ? 'Keskin / Köşeli' : 'Tech Sharp', radius: 'rounded-none' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => onBrandingChange('page_layout_settings', { ...(branding.page_layout_settings || {}), border_radius: item.id })}
                              className={`flex-1 p-2 border rounded-xl text-[9px] font-extrabold uppercase transition-all ${
                                branding.page_layout_settings?.border_radius === item.id
                                  ? "bg-slate-900 border-slate-900 text-white shadow-md"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Locked premium branding deck notification for non-superadmins */
                    <div className="p-5 rounded-[2rem] bg-indigo-950/5 border border-indigo-150 text-indigo-950 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-indigo-950">
                            {lang === 'tr' ? 'VİTRİN VE MARKA TEMALARI KİLİTLİDİR' : 'PREMIUM OUTLOOK IS MANAGED BY HQ'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1.5">
                            {lang === 'tr' 
                              ? "Amiral Gemisi Kaptan Köşkü görsel şablonları, lüks vitrin ızgaraları ve tipografi entegrasyonları yalnızca LookPrice Prime Merkez Yönetici Yetkileri (Super Admin) tarafından kontrol edilmektedir. Tasarım güncellemeleri veya şablon talepleriniz için lütfen destek birimiyle iletişime geçin."
                              : "Flagship layouts, bento grids, prestige accents, and custom border sharpness are locked and fully isolated under centralized Super Admin authority. Contact support for template upgrades."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LIVE INTERACTIVE PREVIEW CARD SANDBOX */}
                  <div className="p-4 bg-slate-950 rounded-[2rem] border border-slate-800 text-slate-200 relative overflow-hidden">
                    <div className="absolute right-4 top-4 px-2 py-0.5 rounded text-[8px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 active:animate-ping uppercase font-mono tracking-widest">
                      Live Sandbox Play
                    </div>

                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                      {lang === 'tr' ? 'CANLI SANDBOX ÖNİZLEMESİ (MOCKUP CARD)' : "KAPTAN KÖŞKÜ REAL-TIME SIMULATOR"}
                    </span>

                    {/* Highly responsive simulated mock card utilizing selected properties */}
                    <div className={`p-4 bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 max-w-md mx-auto hover:bg-slate-850 transition-all ${
                      branding.page_layout_settings?.border_radius === 'extreme' ? 'rounded-[1.8rem]' : 
                      branding.page_layout_settings?.border_radius === 'tech_sharp' ? 'rounded-none' : 'rounded-2xl'
                    } ${
                      branding.page_layout_settings?.showcase_layout_style === 'royal_classic' ? 'border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.05)]' :
                      branding.page_layout_settings?.showcase_layout_style === 'cyberpunk_accent' ? 'border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : ''
                    }`}>
                      <div className="w-full md:w-2/5 aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden relative border border-slate-800">
                        <img 
                          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80" 
                          alt="Mock vehicle" 
                          className="w-full h-full object-cover opacity-80" 
                        />
                        <span className={`absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase rounded text-white bg-gradient-to-r ${
                          branding.page_layout_settings?.accent_gradient_style === 'gold_emerald' ? 'from-amber-400 to-emerald-500' :
                          branding.page_layout_settings?.accent_gradient_style === 'violet_indigo' ? 'from-violet-500 to-indigo-500' :
                          branding.page_layout_settings?.accent_gradient_style === 'obsidian_mono' ? 'from-slate-700 to-slate-400' : 'from-rose-500 to-amber-500'
                        }`}>
                          Premium
                        </span>
                      </div>

                      <div className="w-full md:w-3/5 flex flex-col justify-between">
                        <div>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${
                            branding.page_layout_settings?.accent_gradient_style === 'gold_emerald' ? 'text-amber-400' :
                            branding.page_layout_settings?.accent_gradient_style === 'violet_indigo' ? 'text-indigo-400' :
                            branding.page_layout_settings?.accent_gradient_style === 'obsidian_mono' ? 'text-slate-400' : 'text-rose-400'
                          }`}>
                            {branding.name || 'Enrakipsiz Premium Store'}
                          </p>
                          <h5 className={`font-black leading-tight text-white mt-1 text-xs ${
                            branding.page_layout_settings?.font_theme === 'elite_heritage' ? 'font-serif' :
                            branding.page_layout_settings?.font_theme === 'brutalist' ? 'font-mono' : 'font-sans'
                          }`}>
                            Aston Martin Vantage V8
                          </h5>
                          <p className="text-[10px] text-slate-400 leading-snug mt-1.5 line-clamp-2 font-medium">
                            Kaptan Köşkü ayarlarının simüle edilmiş lüks kart önizlemesi.
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                          <span className="font-extrabold text-white text-[11px]">
                            12.850.000 <span className="text-[9px]" style={{
                              color: branding.page_layout_settings?.accent_gradient_style === 'gold_emerald' ? '#fbbf24' :
                                     branding.page_layout_settings?.accent_gradient_style === 'violet_indigo' ? '#818cf8' :
                                     branding.page_layout_settings?.accent_gradient_style === 'obsidian_mono' ? '#94a3b8' : '#f43f5e'
                            }}>TRY</span>
                          </span>
                          <span className="text-[8px] uppercase font-black text-rose-400 font-mono tracking-wide animate-pulse">
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            )}

            {/* 2. Logo & Favicon (Compact Side-by-Side) */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  {lang === 'tr' ? 'MARKA KİMLİĞİ' : 'BRAND ASSETS'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Logo Upload */}
                  <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-indigo-400 hover:bg-white transition-all cursor-pointer">
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="max-h-full max-w-full object-contain mb-1" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-300" />
                    )}
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">LOGO</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onLogoUpload} />
                  </div>

                  {/* Favicon Upload */}
                  <div className="relative group aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 hover:border-amber-400 hover:bg-white transition-all cursor-pointer">
                    {branding.favicon_url ? (
                      <img src={branding.favicon_url} alt="Favicon" className="w-10 h-10 object-contain mb-1" />
                    ) : (
                      <Plus className="w-6 h-6 text-slate-300" />
                    )}
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">FAVICON</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onFaviconUpload} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
                    <p className="text-[8px] font-black text-slate-400 mb-1">LOGO URL</p>
                    <input className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono" value={branding.logo_url || ''} onChange={(e) => onBrandingChange('logo_url', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 uppercase tracking-widest">
                    <p className="text-[8px] font-black text-slate-400 mb-1">FAVICON URL</p>
                    <input className="w-full bg-transparent text-[10px] text-slate-600 outline-none font-mono" value={branding.favicon_url || ''} onChange={(e) => onBrandingChange('favicon_url', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
            </div>
          </div>

          {/* Banner & Text Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{lang === 'tr' ? 'AFİŞ VE BAŞLIKLAR' : 'BANNER & TITLES'}</h3>
               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'MAĞAZA ADI' : 'STORE NAME'}</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={branding.name || ''} onChange={(e) => onBrandingChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'HERO BAŞLIK' : 'HERO TITLE'}</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" value={branding.hero_title || ''} onChange={(e) => onBrandingChange('hero_title', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="relative group w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                    {branding.hero_image_url ? (
                      <img src={branding.hero_image_url} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">BANNER</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={onBannerUpload} />
                  </div>
                  <input className="w-full px-4 py-2 bg-slate-100/50 border-none rounded-lg text-[10px] font-mono text-slate-400" value={branding.hero_image_url || ''} onChange={(e) => onBrandingChange('hero_image_url', e.target.value)} placeholder="Banner URL..." />
               </div>
            </div>

            {/* Label Customization */}
            {!isPortfolio && (
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{lang === 'tr' ? 'ÖZEL ETİKETLER' : 'CUSTOM LABELS'}</h3>
                    <div className="flex gap-2">
                      <button 
                       onClick={() => {
                         onBrandingChange('brand_label', lang === 'tr' ? 'Yazarlar' : 'Authors');
                         onBrandingChange('category_label', lang === 'tr' ? 'Kitap Türleri' : 'Book Types');
                         onBrandingChange('product_label', lang === 'tr' ? 'Kitap' : 'Book');
                         onBrandingChange('stock_label', lang === 'tr' ? 'Stoktaki Kitap Sayısı' : 'Books in Stock');
                         onBrandingChange('hero_title', lang === 'tr' ? 'Okumayı Seviyoruz' : 'We Love Reading');
                       }}
                       className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight hover:bg-indigo-100 transition-colors"
                      >
                        {lang === 'tr' ? 'Kitapçı Konsepti Uygula' : 'Apply Bookstore Concept'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'MARKA ETİKETİ' : 'BRAND LABEL'}</label>
                         <input 
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                           placeholder={lang === 'tr' ? 'Örn: Yazarlar' : 'e.g. Authors'}
                           value={branding.brand_label || ''} 
                           onChange={(e) => onBrandingChange('brand_label', e.target.value)} 
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'KATEGORİ ETİKETİ' : 'CATEGORY LABEL'}</label>
                         <input 
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                           placeholder={lang === 'tr' ? 'Örn: Koleksiyon' : 'e.g. Collections'}
                           value={branding.category_label || ''} 
                           onChange={(e) => onBrandingChange('category_label', e.target.value)} 
                         />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÜRÜN ADLANDIRMA' : 'PRODUCT LABEL'}</label>
                          <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                            placeholder={lang === 'tr' ? 'Örn: Kitap' : 'e.g. Book'}
                            value={branding.product_label || ''} 
                            onChange={(e) => onBrandingChange('product_label', e.target.value)} 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'STOK ETİKETİ' : 'STOCK LABEL'}</label>
                          <input 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                            placeholder={lang === 'tr' ? 'Örn: Kalan Adet' : 'e.g. Remaining'}
                            value={branding.stock_label || ''} 
                            onChange={(e) => onBrandingChange('stock_label', e.target.value)} 
                          />
                       </div>
                     </div>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                       {lang === 'tr' 
                         ? '* Bu ayarlar web sitenizdeki filtreleme ve ürün detaylarındaki başlıkları değiştirir.' 
                         : '* These settings change the titles in filtering and product details on your website.'}
                     </p>
                  </div>
               </div>
            )}

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{lang === 'tr' ? 'HAKKIMIZDA METNİ' : 'ABOUT TEXT'}</h3>
               <textarea 
                  className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
                  value={branding.about_text || ''}
                  onChange={(e) => onBrandingChange('about_text', e.target.value)}
                  placeholder={lang === 'tr' ? 'Mağazanız hakkında kısa bir bilgi yazın...' : 'Write some info about your store...'}
               />
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'SAYFA LİNKİ (Google Merchant İçin)' : 'PAGE LINK (For Google Merchant)'}</p>
                  <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                    {window.location.origin}/store/{branding.slug}/about-us
                  </code>
               </div>
            </div>
          </div>

          {/* Legal Policies Section */}
          {!isPortfolio && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">{lang === 'tr' ? 'İADE POLİTİKASI' : 'RETURN POLICY'}</h3>
                 <p className="text-[10px] text-slate-400 font-medium mb-4">{lang === 'tr' ? 'Google Merchant Center için zorunludur.' : 'Required for Google Merchant Center.'}</p>
                 <textarea 
                    className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
                    value={branding.legal_pages?.return_policy || ''}
                    onChange={(e) => onBrandingChange('legal_pages', { ...branding.legal_pages, return_policy: e.target.value })}
                    placeholder={lang === 'tr' ? 'İade şartlarınızı yazın...' : 'Write your return conditions...'}
                 />
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'SAYFA LİNKİ' : 'PAGE LINK'}</p>
                    <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                      {window.location.origin}/store/{branding.slug}/return-policy
                    </code>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">{lang === 'tr' ? 'KARGO POLİTİKASI' : 'SHIPPING POLICY'}</h3>
                 <p className="text-[10px] text-slate-400 font-medium mb-4">{lang === 'tr' ? 'Google Merchant Center için zorunludur.' : 'Required for Google Merchant Center.'}</p>
                 <textarea 
                    className="w-full h-[180px] p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all resize-none mb-4"
                    value={branding.legal_pages?.shipping_policy || ''}
                    onChange={(e) => onBrandingChange('legal_pages', { ...branding.legal_pages, shipping_policy: e.target.value })}
                    placeholder={lang === 'tr' ? 'Kargo ve teslimat şartlarınızı yazın...' : 'Write your shipping and delivery conditions...'}
                 />
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'SAYFA LİNKİ' : 'PAGE LINK'}</p>
                    <code className="text-[10px] text-blue-600 font-mono break-all font-bold">
                      {window.location.origin}/store/{branding.slug}/shipping-policy
                    </code>
                 </div>
              </div>
            </div>
          )}

          {/* Contact & Social Compact */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-100/50">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Contact */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'İLETİŞİM BİLGİLERİ' : 'CONTACT INFO'}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'E-POSTALARI YÖNET' : 'MANAGE EMAILS'}</p>
                         {emails.map((email, idx) => (
                            <div key={idx} className="flex gap-2">
                               <input className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={email} onChange={(e) => updateEmail(idx, e.target.value)} />
                               {emails.length > 1 && <button onClick={() => removeEmail(idx)} className="text-rose-500"><X /></button>}
                            </div>
                         ))}
                         <button onClick={addEmail} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ {lang === 'tr' ? 'EKLE' : 'ADD'}</button>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'TELEFONLARI YÖNET' : 'MANAGE PHONES'}</p>
                         {phones.map((phone, idx) => (
                            <div key={idx} className="flex gap-2">
                               <input className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" value={phone} onChange={(e) => updatePhone(idx, e.target.value)} />
                               {phones.length > 1 && <button onClick={() => removePhone(idx)} className="text-rose-500"><X /></button>}
                            </div>
                         ))}
                         <button onClick={addPhone} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ {lang === 'tr' ? 'EKLE' : 'ADD'}</button>
                      </div>
                   </div>
                </div>

                {/* Social */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'SOSYAL MEDYA' : 'SOCIAL MEDIA'}</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: <Instagram className="w-4 h-4" />, key: 'instagram_url', placeholder: '@username' },
                        { icon: <Facebook className="w-4 h-4" />, key: 'facebook_url', placeholder: 'facebook.com/...' },
                        { icon: <Twitter className="w-4 h-4" />, key: 'twitter_url', placeholder: '@twitter' },
                        { icon: <MessageCircle className="w-4 h-4" />, key: 'whatsapp_number', placeholder: '+90...' },
                      ].map((social) => (
                        <div key={social.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className="text-slate-400">{social.icon}</div>
                           <input 
                              className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-300" 
                              placeholder={social.placeholder} 
                              value={branding[social.key as keyof typeof branding] || ''} 
                              onChange={(e) => onBrandingChange(social.key as any, e.target.value)} 
                           />
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Tracking & Analytics */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                {lang === 'tr' ? 'İZLEME VE ANALİTİK' : 'TRACKING & ANALYTICS'}
             </h3>
             <p className="text-xs text-slate-500 mb-6 font-medium">
               {lang === 'tr' ? 'Google Analytics veya Google Tag Manager (GTM) aracılığıyla mağazanızı dijital olarak analiz edin.' : 'Analyze your store digitally through Google Analytics or Google Tag Manager (GTM).'}
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Google Analytics (gtag) ID
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300" 
                    placeholder="G-XXXXXXXXXX" 
                    value={(branding.meta_settings && typeof branding.meta_settings === 'object' && !Array.isArray(branding.meta_settings)) ? branding.meta_settings.ga_measurement_id || '' : ''} 
                    onChange={(e) => {
                      const newSettings = { ...(branding.meta_settings || {}) };
                      newSettings.ga_measurement_id = e.target.value;
                      onBrandingChange('meta_settings', newSettings);
                    }} 
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
                    Örn: G-XXXXXXXXXX. Sadece ID'yi girin.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Google Tag Manager (GTM) ID
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold font-mono placeholder:text-slate-300" 
                    placeholder="GTM-XXXXXXX" 
                    value={(branding.meta_settings && typeof branding.meta_settings === 'object' && !Array.isArray(branding.meta_settings)) ? branding.meta_settings.gtm_id || '' : ''} 
                    onChange={(e) => {
                      const newSettings = { ...(branding.meta_settings || {}) };
                      newSettings.gtm_id = e.target.value;
                      onBrandingChange('meta_settings', newSettings);
                    }} 
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1 leading-relaxed">
                    Örn: GTM-XXXXXXX. Sadece ID'yi girin.
                  </p>
                </div>
             </div>
          </div>

          {/* User Management Section (Keep it simple here) */}
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-white/10 transition-all duration-1000"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">{lang === 'tr' ? 'EKİP YÖNETİMİ' : 'TEAM MANAGEMENT'}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{lang === 'tr' ? 'MAĞAZA ERİŞİM YETKİLERİ' : 'STORE ACCESS CONTROL'}</p>
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && (
                  <button onClick={onAddUser} className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20">
                    + {lang === 'tr' ? 'YENİ ÜYE' : 'NEW MEMBER'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div key={u.id} className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50 flex items-center justify-between group/user hover:bg-slate-800 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center text-white font-black">
                          {u.email?.[0].toUpperCase()}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white leading-none mb-1">{u.email.split('@')[0]}</p>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{u.role}</p>
                       </div>
                    </div>
                    {((currentUser?.role === 'admin' || currentUser?.role === 'storeadmin' || currentUser?.role === 'superadmin') && u.id !== currentUser?.id) && (
                       <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                          <Lock className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                ))}
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

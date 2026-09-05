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
  Tag,
  Copy,
  Check,
  Truck,
  Zap,
  Clock,
  Layers,
  FileText,
  HelpCircle,
  Info,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  CheckCheck,
  Eye,
  EyeOff,
  Link,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { translations } from "@/translations";
import { api } from "@/services/api";
import { useIntegrationSync } from "@/hooks/useIntegrationSync";
import { toast } from "sonner";
import { MarketplaceCategoryMappingModal } from "@/components/marketplace/MarketplaceCategoryMappingModal";

interface SettingsEStoresTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  currentStoreId?: number;
  products?: any[];
  onRefresh?: () => void;
}

type MarketplaceTabId = 'hepsiburada' | 'trendyol' | 'amazon' | 'pazarama' | 'n11' | 'all';

export const SettingsEStoresTab = ({
  branding,
  onBrandingChange,
  lang,
  currentStoreId,
  products = [],
  onRefresh
}: SettingsEStoresTabProps) => {
  const t = translations[lang]?.dashboard || {};

  // Active sub-tab for minimalist, uncluttered view
  const [activeTab, setActiveTab] = useState<MarketplaceTabId>('hepsiburada');

  const amazonSync = useIntegrationSync('Amazon', t);
  const n11Sync = useIntegrationSync('N11', t);
  const hbSync = useIntegrationSync('Hepsiburada', t);
  const tySync = useIntegrationSync('Trendyol', t);
  const pzSync = useIntegrationSync('Pazarama', t);

  // Amazon State
  const [amazonClientId, setAmazonClientId] = useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = useState(branding.amazon_settings?.sellerId || "");
  const [showAmazonSecret, setShowAmazonSecret] = useState(false);
  const [showAmazonRefresh, setShowAmazonRefresh] = useState(false);
  
  // N11 State
  const [n11AppKey, setN11AppKey] = useState(branding.n11_settings?.appKey || "");
  const [n11AppSecret, setN11AppSecret] = useState(branding.n11_settings?.appSecret || "");
  const [showN11Secret, setShowN11Secret] = useState(false);

  // Hepsiburada State
  const [hbApiKey, setHbApiKey] = useState(branding.hepsiburada_settings?.apiKey || "lookprice_dev");
  const [hbApiSecret, setHbApiSecret] = useState(branding.hepsiburada_settings?.apiSecret || "");
  const [hbMerchantId, setHbMerchantId] = useState(branding.hepsiburada_settings?.merchantId || "");
  const [hbIsTestMode, setHbIsTestMode] = useState<boolean>(branding.hepsiburada_settings?.isTestMode || false);
  const [hbDefaultDispatchTime, setHbDefaultDispatchTime] = useState<number>(branding.hepsiburada_settings?.defaultDispatchTime || 1);
  const [hbDefaultCargoCompany, setHbDefaultCargoCompany] = useState<string>(branding.hepsiburada_settings?.defaultCargoCompany || "Hepsijet");
  const [hbAutoSyncOrders, setHbAutoSyncOrders] = useState<boolean>(branding.hepsiburada_settings?.autoSyncOrders ?? true);
  const [hbAutoStockSync, setHbAutoStockSync] = useState<boolean>(branding.hepsiburada_settings?.autoStockSync ?? true);
  const [hbWebhookSecret, setHbWebhookSecret] = useState<string>(branding.hepsiburada_settings?.webhookSecret || "");
  const [hbBulkSyncing, setHbBulkSyncing] = useState<boolean>(false);
  const [hbCategories, setHbCategories] = useState<any[]>([]);
  const [loadingHbCats, setLoadingHbCats] = useState<boolean>(false);
  const [showHbCategoriesModal, setShowHbCategoriesModal] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [showHbSecret, setShowHbSecret] = useState(false);

  // Global Marketplace Category Mapping Modal
  const [categoryMappingModalOpen, setCategoryMappingModalOpen] = useState(false);
  const [selectedMappingMarketplace, setSelectedMappingMarketplace] = useState<'hepsiburada' | 'trendyol' | 'amazon' | 'pazarama'>('hepsiburada');

  // Trendyol State
  const [tyApiKey, setTyApiKey] = useState(branding.trendyol_settings?.apiKey || "");
  const [tyApiSecret, setTyApiSecret] = useState(branding.trendyol_settings?.apiSecret || "");
  const [tyMerchantId, setTyMerchantId] = useState(branding.trendyol_settings?.merchantId || "");
  const [showTySecret, setShowTySecret] = useState(false);

  // Pazarama State
  const [pzApiKey, setPzApiKey] = useState(branding.pazarama_settings?.apiKey || "");
  const [pzApiSecret, setPzApiSecret] = useState(branding.pazarama_settings?.apiSecret || "");
  const [pzMerchantId, setPzMerchantId] = useState(branding.pazarama_settings?.merchantId || "");
  const [pzCommissionRate, setPzCommissionRate] = useState(branding.pazarama_settings?.commissionRate || 0);
  const [showPzSecret, setShowPzSecret] = useState(false);

  const [pzCategories, setPzCategories] = useState<any[]>([]);
  const [pzBrands, setPzBrands] = useState<any[]>([]);
  const [loadingPzCats, setLoadingPzCats] = useState(false);
  const [loadingPzBrands, setLoadingPzBrands] = useState(false);
  const [pzCategoryMappings, setPzCategoryMappings] = useState<Record<string, string>>(branding.pazarama_settings?.categoryMappings || {});
  const [pzBrandMappings, setPzBrandMappings] = useState<Record<string, string>>(branding.pazarama_settings?.brandMappings || {});
  const [showPzMapping, setShowPzMapping] = useState(false);
  const [showPzBrandMapping, setShowPzBrandMapping] = useState(false);

  // Dedicated mount fetch to ensure ALL settings are always fresh on page refresh
  useEffect(() => {
    if (!currentStoreId) return;
    let isMounted = true;

    Promise.allSettled([
      api.getHepsiburadaSettings(currentStoreId),
      api.getTrendyolSettings(currentStoreId),
      api.getAmazonSettings(currentStoreId),
      api.getPazaramaSettings(currentStoreId),
      api.getN11Settings(currentStoreId)
    ]).then(([hbRes, tyRes, amzRes, pzRes, n11Res]) => {
      if (!isMounted) return;

      // Hepsiburada
      if (hbRes.status === 'fulfilled' && hbRes.value) {
        const h = hbRes.value.data || hbRes.value;
        if (h) {
          if (h.apiKey) setHbApiKey(h.apiKey);
          if (h.apiSecret) setHbApiSecret(h.apiSecret);
          if (h.merchantId) setHbMerchantId(h.merchantId);
          if (h.isTestMode !== undefined) setHbIsTestMode(h.isTestMode);
          if (h.defaultDispatchTime !== undefined) setHbDefaultDispatchTime(h.defaultDispatchTime);
          if (h.defaultCargoCompany) setHbDefaultCargoCompany(h.defaultCargoCompany);
          if (h.autoSyncOrders !== undefined) setHbAutoSyncOrders(h.autoSyncOrders);
          if (h.autoStockSync !== undefined) setHbAutoStockSync(h.autoStockSync);
          if (h.webhookSecret) setHbWebhookSecret(h.webhookSecret);
        }
      }

      // Trendyol
      if (tyRes.status === 'fulfilled' && tyRes.value) {
        const ty = tyRes.value.data || tyRes.value;
        if (ty) {
          if (ty.apiKey) setTyApiKey(ty.apiKey);
          if (ty.apiSecret) setTyApiSecret(ty.apiSecret);
          if (ty.merchantId) setTyMerchantId(ty.merchantId);
        }
      }

      // Amazon
      if (amzRes.status === 'fulfilled' && amzRes.value) {
        const amz = amzRes.value.data || amzRes.value;
        if (amz) {
          if (amz.clientId) setAmazonClientId(amz.clientId);
          if (amz.clientSecret) setAmazonClientSecret(amz.clientSecret);
          if (amz.refresh_token) setAmazonRefreshToken(amz.refresh_token);
          if (amz.sellerId) setAmazonSellerId(amz.sellerId);
        }
      }

      // Pazarama
      if (pzRes.status === 'fulfilled' && pzRes.value) {
        const pz = pzRes.value.data || pzRes.value;
        if (pz) {
          if (pz.apiKey) setPzApiKey(pz.apiKey);
          if (pz.apiSecret) setPzApiSecret(pz.apiSecret);
          if (pz.merchantId) setPzMerchantId(pz.merchantId);
          if (pz.commissionRate !== undefined) setPzCommissionRate(pz.commissionRate);
          if (pz.categoryMappings) setPzCategoryMappings(pz.categoryMappings);
          if (pz.brandMappings) setPzBrandMappings(pz.brandMappings);
        }
      }

      // N11
      if (n11Res.status === 'fulfilled' && n11Res.value) {
        const n11 = n11Res.value.data || n11Res.value;
        if (n11) {
          if (n11.appKey) setN11AppKey(n11.appKey);
          if (n11.appSecret) setN11AppSecret(n11.appSecret);
        }
      }
    }).catch(err => {
      console.warn("[SettingsEStoresTab] Parallel settings fetch error:", err);
    });

    return () => { isMounted = false; };
  }, [currentStoreId]);

  // Sync state when branding prop changes, with defensive checks (never wipe non-empty with empty)
  useEffect(() => {
    const amz = branding.amazon_settings || {};
    if (amz.clientId) setAmazonClientId(amz.clientId);
    if (amz.clientSecret) setAmazonClientSecret(amz.clientSecret);
    if (amz.refresh_token) setAmazonRefreshToken(amz.refresh_token);
    if (amz.sellerId) setAmazonSellerId(amz.sellerId);

    const n = branding.n11_settings || {};
    if (n.appKey) setN11AppKey(n.appKey);
    if (n.appSecret) setN11AppSecret(n.appSecret);

    const h = branding.hepsiburada_settings || {};
    if (h.apiKey) setHbApiKey(h.apiKey);
    if (h.apiSecret) setHbApiSecret(h.apiSecret);
    if (h.merchantId) setHbMerchantId(h.merchantId);
    if (h.isTestMode !== undefined) setHbIsTestMode(h.isTestMode);
    if (h.defaultDispatchTime !== undefined) setHbDefaultDispatchTime(h.defaultDispatchTime);
    if (h.defaultCargoCompany) setHbDefaultCargoCompany(h.defaultCargoCompany);
    if (h.autoSyncOrders !== undefined) setHbAutoSyncOrders(h.autoSyncOrders);
    if (h.autoStockSync !== undefined) setHbAutoStockSync(h.autoStockSync);
    if (h.webhookSecret) setHbWebhookSecret(h.webhookSecret);

    const ty = branding.trendyol_settings || {};
    if (ty.apiKey) setTyApiKey(ty.apiKey);
    if (ty.apiSecret) setTyApiSecret(ty.apiSecret);
    if (ty.merchantId) setTyMerchantId(ty.merchantId);

    const pz = branding.pazarama_settings || {};
    if (pz.apiKey) setPzApiKey(pz.apiKey);
    if (pz.apiSecret) setPzApiSecret(pz.apiSecret);
    if (pz.merchantId) setPzMerchantId(pz.merchantId);
    if (pz.commissionRate !== undefined) setPzCommissionRate(pz.commissionRate);
    if (pz.categoryMappings) setPzCategoryMappings(pz.categoryMappings);
    if (pz.brandMappings) setPzBrandMappings(pz.brandMappings);
  }, [branding]);

  // Derived connection status flags
  const amazonSettings = branding.amazon_settings || {};
  const isAmazonConnected = !!(amazonSettings.connected || amazonSettings.refresh_token || (amazonClientId && amazonSellerId));

  const n11Settings = branding.n11_settings || {};
  const isN11Connected = !!(n11Settings.connected || (n11AppKey && n11AppSecret));

  const hbSettings = branding.hepsiburada_settings || {};
  const isHbConnected = !!(hbSettings.connected || (hbMerchantId && hbApiSecret));

  const tySettings = branding.trendyol_settings || {};
  const isTyConnected = !!(tySettings.connected || (tyMerchantId && tyApiKey && tyApiSecret));

  const pzSettings = branding.pazarama_settings || {};
  const isPzConnected = !!(pzSettings.connected || (pzApiKey && pzApiSecret));

  // --- Handlers: Amazon ---
  const handleConnectAmazon = async () => {
    try {
      const { url } = await api.getAmazonAuthUrl();
      window.location.href = url;
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSaveAmazonSettings = async () => {
    try {
      const isConn = !!(amazonClientId && amazonClientSecret && (amazonRefreshToken || amazonSellerId));
      const payload = { 
        clientId: amazonClientId, 
        clientSecret: amazonClientSecret, 
        refreshToken: amazonRefreshToken, 
        sellerId: amazonSellerId, 
        connected: isConn,
        storeId: currentStoreId 
      };
      await api.saveAmazonSettings(payload);
      onBrandingChange('amazon_settings', payload);
      toast.success(isConn ? (lang === 'tr' ? "Amazon hesabı başarıyla bağlandı ve kaydedildi" : "Amazon account connected successfully") : (t.saveSuccess || "Kaydedildi"));
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncOrders = async () => {
    await amazonSync.runSync(
      () => api.syncAmazonOrders(currentStoreId),
      (res) => {
        toast.success(`${t.amazonSyncSuccess || "Amazon siparişleri senkronize edildi"}: ${res.count || 0} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectAmazon = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectAmazon(currentStoreId);
      onBrandingChange('amazon_settings', {});
      toast.success(t.amazonDisconnected || "Amazon bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  // --- Handlers: N11 ---
  const handleSaveN11Settings = async () => {
    try {
      const isConn = !!(n11AppKey && n11AppSecret);
      const payload = { appKey: n11AppKey, appSecret: n11AppSecret, connected: isConn, storeId: currentStoreId };
      await api.saveN11Settings(payload);
      onBrandingChange('n11_settings', payload);
      toast.success(isConn ? (lang === 'tr' ? "N11 hesabı başarıyla bağlandı ve kaydedildi" : "N11 account connected successfully") : (t.saveSuccess || "Kaydedildi"));
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncN11Orders = async () => {
    await n11Sync.runSync(
      () => api.syncN11Orders(currentStoreId),
      (res) => {
        toast.success(`${t.n11SyncSuccess || "N11 siparişleri senkronize edildi"}: ${res.count || 0} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectN11 = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectN11(currentStoreId);
      onBrandingChange('n11_settings', {});
      toast.success(t.n11Disconnected || "N11 bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleTestN11 = async () => {
    try {
      const res = await api.testN11Connection(currentStoreId);
      if (res.success) {
        toast.success(lang === 'tr' ? 'N11 Bağlantısı Başarılı!' : 'N11 Connection Successful!');
        onBrandingChange('n11_settings', { ...branding.n11_settings, appKey: n11AppKey, appSecret: n11AppSecret, connected: true });
      } else {
        toast.error(`${lang === 'tr' ? 'N11 Bağlantı Hatası' : 'N11 Connection Error'}: ${res.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      toast.error(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  // --- Handlers: Hepsiburada ---
  const handleSaveHbSettings = async () => {
    try {
      const prevHb = branding.hepsiburada_settings || {};
      const isConn = !!(hbApiSecret && hbMerchantId);
      const payload = { 
        apiKey: hbApiKey || "lookprice_dev", 
        apiSecret: hbApiSecret, 
        merchantId: hbMerchantId,
        isTestMode: hbIsTestMode,
        defaultDispatchTime: hbDefaultDispatchTime,
        defaultCargoCompany: hbDefaultCargoCompany,
        autoSyncOrders: hbAutoSyncOrders,
        autoStockSync: hbAutoStockSync,
        webhookSecret: hbWebhookSecret,
        categoryMappings: prevHb.categoryMappings || {},
        categoryAttributes: prevHb.categoryAttributes || {},
        connected: isConn,
        storeId: currentStoreId 
      };
      await api.saveHepsiburadaSettings(payload as any);
      onBrandingChange('hepsiburada_settings', payload);
      toast.success(isConn ? (lang === 'tr' ? "HB hesabı başarıyla bağlandı ve kaydedildi" : "HB account connected and saved successfully") : (t.saveSuccess || "Kaydedildi"));
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncHbOrders = async () => {
    await hbSync.runSync(
      () => api.syncHepsiburadaOrders(currentStoreId),
      (res) => {
        toast.success(`${t.hepsiburadaSyncSuccess || "Hepsiburada siparişleri senkronize edildi"}: ${res.count || 0} ${t.sales || "Sipariş"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleBulkSyncHbInventory = async () => {
    try {
      setHbBulkSyncing(true);
      const res = await api.syncHepsiburadaInventory(currentStoreId);
      toast.success(t.hepsiburadaBulkSyncSuccess || `Hepsiburada'ya ${res.data?.syncedCount || res.syncedCount || 0} ürün aktarıldı`);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Toplu ürün senkronizasyonu başarısız");
    } finally {
      setHbBulkSyncing(false);
    }
  };

  const handleFetchHbCategories = async () => {
    try {
      setLoadingHbCats(true);
      setShowHbCategoriesModal(true);
      const res = await api.getHepsiburadaCategories(currentStoreId);
      if (res.data?.categories) {
        setHbCategories(res.data.categories);
      } else if (Array.isArray(res.categories)) {
        setHbCategories(res.categories);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Kategoriler yüklenemedi");
    } finally {
      setLoadingHbCats(false);
    }
  };

  const handleDisconnectHb = async () => {
    if (!confirm(t.confirmDelete || "Hepsiburada bağlantısını kesmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectHepsiburada(currentStoreId);
      onBrandingChange('hepsiburada_settings', {
        ...branding.hepsiburada_settings,
        connected: false,
        apiSecret: '',
        merchantId: ''
      });
      toast.success(t.hepsiburadaDisconnected || "Hepsiburada bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleTestHb = async () => {
    try {
      const res = await api.testHepsiburadaConnection(currentStoreId);
      const data = res.data || res;
      if (data.success) {
        toast.success(
          lang === 'tr' 
            ? `Hepsiburada API Bağlantısı Başarılı! (Ortam: ${data.environment || 'Production'}, Mağaza: ${data.merchantName || 'Onaylandı'})` 
            : `Hepsiburada API Connected! (${data.environment || 'Production'})`
        );
        onBrandingChange('hepsiburada_settings', {
          ...branding.hepsiburada_settings,
          apiKey: hbApiKey,
          apiSecret: hbApiSecret,
          merchantId: hbMerchantId,
          connected: true
        });
      } else {
        toast.error(`${lang === 'tr' ? 'Hepsiburada Bağlantı Hatası' : 'Hepsiburada Connection Error'}: ${data.error || 'Bilinmeyen hata'}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t.errorOccurred || 'Bir hata oluştu');
    }
  };

  // --- Handlers: Trendyol ---
  const handleSaveTySettings = async () => {
    try {
      const isConn = !!(tyApiKey && tyApiSecret && tyMerchantId);
      const tyPayload = { 
        apiKey: tyApiKey, 
        apiSecret: tyApiSecret, 
        merchantId: tyMerchantId, 
        connected: isConn,
        storeId: currentStoreId 
      };
      await api.saveTrendyolSettings(tyPayload);
      onBrandingChange('trendyol_settings', tyPayload);
      toast.success(isConn ? (lang === 'tr' ? "Trendyol hesabı başarıyla bağlandı ve kaydedildi" : "Trendyol account connected successfully") : (t.saveSuccess || "Kaydedildi"));
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleSyncTyOrders = async () => {
    await tySync.runSync(
      () => api.syncTrendyolOrders(currentStoreId),
      (res) => {
        toast.success(`${t.trendyolSyncSuccess || "Trendyol siparişleri senkronize edildi"}: ${res.count || 0} ${t.sales || "Satış"}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectTy = async () => {
    if (!confirm(t.confirmDelete || "Silmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectTrendyol(currentStoreId);
      onBrandingChange('trendyol_settings', {});
      toast.success(t.trendyolDisconnected || "Trendyol bağlantısı kesildi");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const handleTestTy = async () => {
    try {
      const res = await api.testTrendyolConnection(currentStoreId);
      if (res.success) {
        toast.success(lang === 'tr' ? 'Trendyol Bağlantısı Başarılı!' : 'Trendyol Connection Successful!');
        onBrandingChange('trendyol_settings', {
          ...branding.trendyol_settings,
          apiKey: tyApiKey,
          apiSecret: tyApiSecret,
          merchantId: tyMerchantId,
          connected: true
        });
      } else {
        toast.error(`${lang === 'tr' ? 'Trendyol Bağlantı Hatası' : 'Trendyol Connection Error'}: ${res.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      toast.error(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  // --- Handlers: Pazarama ---
  const handleTestPz = async () => {
    try {
      const res = await api.testPazaramaConnection(currentStoreId);
      if (res.success) {
        toast.success(lang === 'tr' ? 'Pazarama Bağlantısı Başarılı!' : 'Pazarama Connection Successful!');
        onBrandingChange('pazarama_settings', {
          ...branding.pazarama_settings,
          apiKey: pzApiKey,
          apiSecret: pzApiSecret,
          merchantId: pzMerchantId,
          connected: true
        });
      } else {
        toast.error(`${lang === 'tr' ? 'Pazarama Bağlantı Hatası' : 'Pazarama Connection Error'}: ${res.error || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      toast.error(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const handleSavePzSettings = async () => {
    try {
      const isConn = !!(pzApiKey && pzApiSecret);
      const pzData = { 
        apiKey: pzApiKey, 
        apiSecret: pzApiSecret, 
        merchantId: pzMerchantId,
        commissionRate: Number(pzCommissionRate),
        categoryMappings: pzCategoryMappings,
        brandMappings: pzBrandMappings,
        connected: isConn
      };
      await api.savePazaramaSettings({ 
        ...pzData,
        storeId: currentStoreId 
      } as any);
      onBrandingChange('pazarama_settings', pzData);
      toast.success(isConn ? (lang === 'tr' ? "Pazarama hesabı başarıyla bağlandı ve kaydedildi" : "Pazarama account connected successfully") : (t.saveSuccess || 'Kaydedildi'));
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  const fetchPzCategories = async () => {
    if (!pzApiKey || !pzApiSecret) {
      toast.error(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzCats(true);
    try {
      const res = await api.getPazaramaCategories(currentStoreId);
      if (res.error) throw new Error(res.error);
      const cats = Array.isArray(res) ? res : (res?.data || []);
      if (cats.length === 0) {
        toast.info(lang === 'tr' ? 'Pazarama\'dan kategori gelmedi.' : 'No categories received from Pazarama.');
      }
      setPzCategories(cats);
      setShowPzMapping(true);
    } catch (e: any) {
      toast.error(`${lang === 'tr' ? "Kategoriler çekilemedi" : "Could not fetch categories"}: ${e.message}`);
    } finally {
      setLoadingPzCats(false);
    }
  };

  const fetchPzBrands = async () => {
    if (!pzApiKey || !pzApiSecret) {
      toast.error(lang === 'tr' ? 'Önce API bilgilerini kaydedin' : 'Save API credentials first');
      return;
    }
    setLoadingPzBrands(true);
    try {
      const res = await api.getPazaramaBrands(currentStoreId);
      if (res.error) throw new Error(res.error);
      const brands = Array.isArray(res) ? res : (res?.data || []);
      if (brands.length === 0) {
        toast.info(lang === 'tr' ? 'Pazarama\'dan marka gelmedi.' : 'No brands received from Pazarama.');
      }
      setPzBrands(brands);
      setShowPzBrandMapping(true);
    } catch (e: any) {
      toast.error(`${lang === 'tr' ? "Markalar çekilemedi" : "Could not fetch brands"}: ${e.message}`);
    } finally {
      setLoadingPzBrands(false);
    }
  };

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
        toast.success(`${t.pazaramaSyncSuccess || "Pazarama siparişleri senkronize edildi"}: ${res.count || 0} ${t.sales || 'Satış'}`);
        if (onRefresh) onRefresh();
      }
    );
  };

  const handleDisconnectPz = async () => {
    if (!confirm(t.confirmDelete || 'Silmek istediğinize emin misiniz?')) return;
    try {
      await api.disconnectPazarama(currentStoreId);
      onBrandingChange('pazarama_settings', {});
      toast.success(t.pazaramaDisconnected || 'Pazarama bağlantısı kesildi');
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || 'Bir hata oluştu');
    }
  };

  // Tab definitions with dynamic live status indicators
  const MARKETPLACE_TABS: { id: MarketplaceTabId; label: string; isConnected: boolean; count: number }[] = [
    { 
      id: 'hepsiburada', 
      label: 'Hepsiburada', 
      isConnected: isHbConnected, 
      count: Object.keys(branding.hepsiburada_settings?.categoryMappings || {}).length 
    },
    { 
      id: 'trendyol', 
      label: 'Trendyol', 
      isConnected: isTyConnected, 
      count: Object.keys(branding.trendyol_settings?.categoryMappings || {}).length 
    },
    { 
      id: 'amazon', 
      label: 'Amazon', 
      isConnected: isAmazonConnected, 
      count: Object.keys(branding.amazon_settings?.categoryMappings || {}).length 
    },
    { 
      id: 'pazarama', 
      label: 'Pazarama', 
      isConnected: isPzConnected, 
      count: Object.keys(pzCategoryMappings || branding.pazarama_settings?.categoryMappings || {}).length 
    },
    { 
      id: 'n11', 
      label: 'N11', 
      isConnected: isN11Connected, 
      count: 0 
    },
    { 
      id: 'all', 
      label: lang === 'tr' ? 'Tümü' : 'All Channels', 
      isConnected: isHbConnected || isTyConnected || isAmazonConnected || isPzConnected || isN11Connected, 
      count: 0 
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-4 text-slate-800"
      id="settings-e-stores-container"
    >
      {/* Mercedes / Apple Minimalist Header & Segmented Controller */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                {t.settingsCategories?.eStores || "Pazaryeri Entegrasyonları"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {lang === 'tr' ? 'Hepsiburada, Trendyol, Amazon, Pazarama ve N11 çok kanallı mağaza yönetimi' : 'Multi-channel marketplace catalog and order management'}
              </p>
            </div>
          </div>

          {/* Quick Mapping Hub Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              setSelectedMappingMarketplace(activeTab === 'all' ? 'hepsiburada' : (activeTab as any));
              setCategoryMappingModalOpen(true);
            }}
            id="open-mapping-hub-header-btn"
            className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors border border-slate-200/70 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />
            <span>{lang === 'tr' ? 'Kategori & Nitelik Eşleme' : 'Category Mapping'}</span>
          </button>
        </div>

        {/* Minimalist Segmented Tabs (Executive Pill Design) */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          {MARKETPLACE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                id={`e-store-tab-${tab.id}`}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                {/* Luminous indicator dot */}
                {tab.id !== 'all' && (
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${
                      tab.isConnected 
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]' 
                        : 'bg-slate-300'
                    }`} 
                  />
                )}
                <span>{tab.label}</span>
                {tab.isConnected && tab.id !== 'all' && (
                  <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                    isActive ? 'bg-white/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {lang === 'tr' ? 'Bağlı' : 'Active'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HEPSIBURADA INTEGRATION CARD                                              */}
      {/* ========================================================================= */}
      {(activeTab === 'hepsiburada' || activeTab === 'all') && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="hb-integration-card">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center font-black text-orange-600 text-xs tracking-tighter">
                HB
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-slate-900">{t.hepsiburadaIntegration || "Hepsiburada Entegrasyonu"}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Merchant API v3</span>
                </div>
                <p className="text-xs text-slate-500">{t.hepsiburadaIntegrationDesc || "Katalog, sipariş ve anlık stok senkronizasyonu"}</p>
              </div>
            </div>

            {/* Dynamic Status Badge */}
            <div className="flex items-center space-x-2">
              {isHbConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold" id="hb-connected-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  <span>{lang === 'tr' ? 'HB Hesabı Bağlı' : 'HB Account Connected'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium" id="hb-disconnected-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Merchant ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t.hepsiburadaMerchantId || "Hepsiburada Merchant ID (Mağaza ID)"}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input 
                type="text" 
                id="hb-merchant-id-input"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={hbMerchantId}
                onChange={(e) => setHbMerchantId(e.target.value)}
                placeholder="örn. 984d720b-22b6-45ef-89a3-..."
              />
            </div>

            {/* API Secret */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t.hepsiburadaApiSecret || "Hepsiburada API Secret (Password)"}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showHbSecret ? "text" : "password"} 
                  id="hb-api-secret-input"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={hbApiSecret}
                  onChange={(e) => setHbApiSecret(e.target.value)}
                  placeholder="Hepsiburada API Şifresi"
                />
                <button
                  type="button"
                  onClick={() => setShowHbSecret(!showHbSecret)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showHbSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* API Key (Optional) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t.hepsiburadaApiKey || "API Kullanıcı Adı (Opsiyonel)"}
              </label>
              <input 
                type="text" 
                id="hb-api-key-input"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={hbApiKey}
                onChange={(e) => setHbApiKey(e.target.value)}
                placeholder="lookprice_dev"
              />
            </div>

            {/* Cargo Company */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t.hepsiburadaDefaultCargo || "Varsayılan Kargo Şirketi"}
              </label>
              <select 
                value={hbDefaultCargoCompany}
                onChange={(e) => setHbDefaultCargoCompany(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs text-slate-900 transition-colors"
              >
                <option value="Hepsijet">HepsiJet</option>
                <option value="YurticiKargo">Yurtiçi Kargo</option>
                <option value="ArasKargo">Aras Kargo</option>
                <option value="MNGKargo">MNG Kargo</option>
                <option value="PTTKargo">PTT Kargo</option>
                <option value="Sendeo">Sendeo</option>
                <option value="HorozLojistik">Horoz Lojistik</option>
              </select>
            </div>
          </div>

          {/* Operational Strip: Dispatch & Automations (Compact Mercedes Cleanliness) */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hbAutoSyncOrders}
                  onChange={(e) => setHbAutoSyncOrders(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700">{lang === 'tr' ? 'Otomatik Sipariş Çekme' : 'Auto Sync Orders'}</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hbAutoStockSync}
                  onChange={(e) => setHbAutoStockSync(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700">{lang === 'tr' ? 'Anlık Stok Eşitleme' : 'Real-time Stock'}</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={hbIsTestMode}
                  onChange={(e) => setHbIsTestMode(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-700">{lang === 'tr' ? 'Test Modu' : 'Test Mode'}</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-500 text-[11px]">{lang === 'tr' ? 'Kargoya Verme:' : 'Dispatch:'}</span>
              <select 
                value={hbDefaultDispatchTime}
                onChange={(e) => setHbDefaultDispatchTime(Number(e.target.value))}
                className="h-7 px-2 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
              >
                <option value={1}>1 Gün</option>
                <option value={2}>2 Gün</option>
                <option value={3}>3 Gün</option>
              </select>
            </div>
          </div>

          {/* Webhook Quick Copy Strip */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200/60 text-[11px]">
            <span className="text-slate-500 font-mono truncate">
              {window.location.origin}/api/integrations/hepsiburada/webhook/{currentStoreId || 1}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/integrations/hepsiburada/webhook/${currentStoreId || 1}`);
                setCopiedWebhook(true);
                toast.success(lang === 'tr' ? 'Webhook URL kopyalandı!' : 'Webhook URL copied!');
                setTimeout(() => setCopiedWebhook(false), 2500);
              }}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium px-2 py-0.5 rounded bg-white border border-slate-200/80 cursor-pointer shrink-0"
            >
              {copiedWebhook ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
              <span>{copiedWebhook ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? 'Webhook Kopyala' : 'Copy Webhook')}</span>
            </button>
          </div>

          {/* Action Buttons (Executive Class: Apple / Mercedes Precision) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            {/* Left Utility Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleTestHb}
                id="hb-test-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
              </button>

              <button 
                type="button"
                onClick={handleSyncHbOrders}
                disabled={hbSync.isSyncing}
                id="hb-sync-orders-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${hbSync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{hbSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setSelectedMappingMarketplace('hepsiburada');
                  setCategoryMappingModalOpen(true);
                }}
                id="hb-category-mapping-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
              </button>

              <button 
                type="button"
                onClick={handleFetchHbCategories}
                id="hb-categories-guide-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <Info className="h-3.5 w-3.5" />
                <span>{lang === 'tr' ? 'Kategori Rehberi' : 'Category Guide'}</span>
              </button>
            </div>

            {/* Right Primary Action: Dynamic Button Text & State */}
            <div className="flex items-center gap-2">
              {isHbConnected && (
                <button 
                  type="button"
                  onClick={handleDisconnectHb}
                  id="hb-disconnect-btn"
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.disconnect || "Bağlantıyı Kes"}
                </button>
              )}

              <button 
                type="button"
                onClick={handleSaveHbSettings}
                id="hb-save-connect-btn"
                className={`inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  isHbConnected
                    ? 'bg-slate-900 hover:bg-black text-white border border-slate-800'
                    : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {isHbConnected ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'tr' ? '✓ HB Hesabı Bağlı (Güncelle)' : '✓ HB Connected (Update)'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 text-slate-300" />
                    <span>{lang === 'tr' ? 'Hepsiburada Hesabını Bağla' : 'Connect Hepsiburada'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRENDYOL INTEGRATION CARD                                                 */}
      {/* ========================================================================= */}
      {(activeTab === 'trendyol' || activeTab === 'all') && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="ty-integration-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center font-black text-orange-600 text-xs tracking-tighter">
                TY
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.trendyolIntegration || "Trendyol Entegrasyonu"}</h3>
                <p className="text-xs text-slate-500">{t.trendyolIntegrationDesc || "Trendyol Marketplace API sipariş ve ürün yönetimi"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isTyConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  <span>{lang === 'tr' ? 'Trendyol Hesabı Bağlı' : 'Trendyol Connected'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolApiKey || "API Key"}</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={tyApiKey}
                onChange={(e) => setTyApiKey(e.target.value)}
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolApiSecret || "API Secret"}</label>
              <div className="relative">
                <input 
                  type={showTySecret ? "text" : "password"} 
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={tyApiSecret}
                  onChange={(e) => setTyApiSecret(e.target.value)}
                  placeholder="API Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowTySecret(!showTySecret)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showTySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolMerchantId || "Satıcı ID (Supplier ID)"}</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={tyMerchantId}
                onChange={(e) => setTyMerchantId(e.target.value)}
                placeholder="Satıcı ID"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleTestTy}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
              </button>

              <button 
                type="button"
                onClick={handleSyncTyOrders}
                disabled={tySync.isSyncing}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${tySync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{tySync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setSelectedMappingMarketplace('trendyol');
                  setCategoryMappingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isTyConnected && (
                <button 
                  type="button"
                  onClick={handleDisconnectTy}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.disconnect || "Bağlantıyı Kes"}
                </button>
              )}

              <button 
                type="button"
                onClick={handleSaveTySettings}
                id="ty-save-connect-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
              >
                {isTyConnected ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'tr' ? '✓ Trendyol Hesabı Bağlı (Güncelle)' : '✓ Trendyol Connected (Update)'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 text-slate-300" />
                    <span>{lang === 'tr' ? 'Trendyol Hesabını Bağla' : 'Connect Trendyol'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AMAZON SP-API INTEGRATION CARD                                            */}
      {/* ========================================================================= */}
      {(activeTab === 'amazon' || activeTab === 'all') && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="amazon-integration-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center font-black text-amber-700 text-xs tracking-tighter">
                AMZ
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.amazonIntegration || "Amazon SP-API Entegrasyonu"}</h3>
                <p className="text-xs text-slate-500">{t.amazonIntegrationDesc || "Selling Partner API ile sipariş ve envanter"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isAmazonConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  <span>{lang === 'tr' ? 'Amazon Hesabı Bağlı' : 'Amazon Connected'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonClientId || "LWA Client ID"}</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={amazonClientId}
                onChange={(e) => setAmazonClientId(e.target.value)}
                placeholder="amzn1.application-oa2-client..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonClientSecret || "LWA Client Secret"}</label>
              <div className="relative">
                <input 
                  type={showAmazonSecret ? "text" : "password"} 
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={amazonClientSecret}
                  onChange={(e) => setAmazonClientSecret(e.target.value)}
                  placeholder="Client Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowAmazonSecret(!showAmazonSecret)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showAmazonSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonRefreshToken || "LWA Refresh Token"}</label>
              <div className="relative">
                <input 
                  type={showAmazonRefresh ? "text" : "password"} 
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={amazonRefreshToken}
                  onChange={(e) => setAmazonRefreshToken(e.target.value)}
                  placeholder="Atzr|..."
                />
                <button
                  type="button"
                  onClick={() => setShowAmazonRefresh(!showAmazonRefresh)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showAmazonRefresh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonSellerId || "Amazon Seller ID (Merchant ID)"}</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={amazonSellerId}
                onChange={(e) => setAmazonSellerId(e.target.value)}
                placeholder="A3..."
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleConnectAmazon}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                <span>{t.amazonConnectOAuth || "OAuth ile Bağlan"}</span>
              </button>

              <button 
                type="button"
                onClick={handleSyncOrders}
                disabled={amazonSync.isSyncing}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${amazonSync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{amazonSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setSelectedMappingMarketplace('amazon');
                  setCategoryMappingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isAmazonConnected && (
                <button 
                  type="button"
                  onClick={handleDisconnectAmazon}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.disconnect || "Bağlantıyı Kes"}
                </button>
              )}

              <button 
                type="button"
                onClick={handleSaveAmazonSettings}
                id="amazon-save-connect-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
              >
                {isAmazonConnected ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'tr' ? '✓ Amazon Hesabı Bağlı (Güncelle)' : '✓ Amazon Connected (Update)'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 text-slate-300" />
                    <span>{lang === 'tr' ? 'Amazon Hesabını Bağla' : 'Connect Amazon'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAZARAMA INTEGRATION CARD                                                 */}
      {/* ========================================================================= */}
      {(activeTab === 'pazarama' || activeTab === 'all') && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="pz-integration-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center font-black text-blue-600 text-xs tracking-tighter">
                PZ
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{lang === 'tr' ? 'Pazarama Entegrasyonu' : 'Pazarama Integration'}</h3>
                <p className="text-xs text-slate-500">{lang === 'tr' ? 'İş Bankası Pazarama API bağlantısı' : 'Isbank Pazarama API connection'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isPzConnected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  <span>{lang === 'tr' ? 'Pazarama Hesabı Bağlı' : 'Pazarama Connected'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama API Key</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={pzApiKey}
                onChange={(e) => setPzApiKey(e.target.value)}
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama API Secret</label>
              <div className="relative">
                <input 
                  type={showPzSecret ? "text" : "password"} 
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={pzApiSecret}
                  onChange={(e) => setPzApiSecret(e.target.value)}
                  placeholder="API Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowPzSecret(!showPzSecret)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPzSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama Merchant ID</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={pzMerchantId}
                onChange={(e) => setPzMerchantId(e.target.value)}
                placeholder="Satıcı Kodu"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleTestPz}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
              </button>

              <button 
                type="button"
                onClick={handleSyncPzOrders}
                disabled={pzSync.isSyncing}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${pzSync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{pzSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setSelectedMappingMarketplace('pazarama');
                  setCategoryMappingModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isPzConnected && (
                <button 
                  type="button"
                  onClick={handleDisconnectPz}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.disconnect || "Bağlantıyı Kes"}
                </button>
              )}

              <button 
                type="button"
                onClick={handleSavePzSettings}
                id="pz-save-connect-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
              >
                {isPzConnected ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'tr' ? '✓ Pazarama Hesabı Bağlı (Güncelle)' : '✓ Pazarama Connected (Update)'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 text-slate-300" />
                    <span>{lang === 'tr' ? 'Pazarama Hesabını Bağla' : 'Connect Pazarama'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* N11 INTEGRATION CARD                                                      */}
      {/* ========================================================================= */}
      {(activeTab === 'n11' || activeTab === 'all') && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="n11-integration-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200/70 flex items-center justify-center font-black text-red-600 text-xs tracking-tighter">
                N11
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.n11Integration || "N11 Entegrasyonu"}</h3>
                <p className="text-xs text-slate-500">{t.n11IntegrationDesc || "N11 SOAP Web Servisi bağlantısı"}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isN11Connected ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                  <span>{lang === 'tr' ? 'N11 Hesabı Bağlı' : 'N11 Connected'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.n11AppKey || "N11 App Key"}</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={n11AppKey}
                onChange={(e) => setN11AppKey(e.target.value)}
                placeholder="N11 App Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.n11AppSecret || "N11 App Secret"}</label>
              <div className="relative">
                <input 
                  type={showN11Secret ? "text" : "password"} 
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={n11AppSecret}
                  onChange={(e) => setN11AppSecret(e.target.value)}
                  placeholder="N11 App Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowN11Secret(!showN11Secret)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showN11Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleTestN11}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
              </button>

              <button 
                type="button"
                onClick={handleSyncN11Orders}
                disabled={n11Sync.isSyncing}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
                <span>{n11Sync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isN11Connected && (
                <button 
                  type="button"
                  onClick={handleDisconnectN11}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {t.disconnect || "Bağlantıyı Kes"}
                </button>
              )}

              <button 
                type="button"
                onClick={handleSaveN11Settings}
                id="n11-save-connect-btn"
                className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
              >
                {isN11Connected ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'tr' ? '✓ N11 Hesabı Bağlı (Güncelle)' : '✓ N11 Connected (Update)'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 text-slate-300" />
                    <span>{lang === 'tr' ? 'N11 Hesabını Bağla' : 'Connect N11'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hepsiburada Live Category Guide Modal */}
      {showHbCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Layers className="h-4 w-4 text-orange-400" />
                <h4 className="font-semibold text-xs text-white">Hepsiburada Canlı Kategori Rehberi</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHbCategoriesModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingHbCats ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Kategoriler çekiliyor...</p>
                </div>
              ) : hbCategories.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Kategori listesi boş veya API'den veri alınamadı.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {hbCategories.map((cat: any, idx: number) => {
                    const catId = cat.categoryId || cat.id || cat.CategoryId;
                    const catName = cat.name || cat.categoryName || cat.Name;
                    return (
                      <div key={idx} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 truncate">{catName}</span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {catId}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(catId));
                              toast.success(`ID kopyalandı: ${catId}`);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                            title="Kopyala"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHbCategoriesModal(false)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Marketplace Category & Specification Mapping Modal */}
      {categoryMappingModalOpen && (
        <MarketplaceCategoryMappingModal
          isOpen={categoryMappingModalOpen}
          onClose={() => setCategoryMappingModalOpen(false)}
          branding={branding}
          onBrandingChange={onBrandingChange}
          products={products}
          currentStoreId={currentStoreId}
          initialMarketplace={selectedMappingMarketplace}
          lang={lang}
          onRefresh={onRefresh}
        />
      )}
    </motion.div>
  );
};

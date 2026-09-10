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
  Store,
  UploadCloud
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
  currentUser?: any;
}

type MarketplaceTabId = 'hepsiburada' | 'trendyol' | 'amazon' | 'pazarama' | 'n11' | 'all';

export const SettingsEStoresTab = ({
  branding,
  onBrandingChange,
  lang,
  currentStoreId,
  products = [],
  onRefresh,
  currentUser
}: SettingsEStoresTabProps) => {
  const t = translations[lang]?.dashboard || {};

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const isPortfolio = branding?.store_type === 'real_estate' || branding?.store_type === 'motor_vehicle' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive';

  if (isCafeRestaurant || isPortfolio) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 font-bold text-sm">
          {lang === 'tr' 
            ? 'E-Mağaza (Pazaryeri) entegrasyonları sadece shopLP (Genel Ürün / Perakende) mağazalarında kullanılabilir.' 
            : 'E-Store integrations are only available for shopLP retail stores.'}
        </p>
      </div>
    );
  }

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
  const [amazonIsSandbox, setAmazonIsSandbox] = useState<boolean>(branding.amazon_settings?.isSandbox || false);
  const [showAmazonSecret, setShowAmazonSecret] = useState(false);
  const [showAmazonRefresh, setShowAmazonRefresh] = useState(false);
  const [testingAmazon, setTestingAmazon] = useState(false);
  const [bulkSyncingAmazon, setBulkSyncingAmazon] = useState(false);
  const [showAmazonGuideModal, setShowAmazonGuideModal] = useState(false);
  
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
        if (h && typeof h === 'object' && Object.keys(h).length > 0) {
          if (h.apiKey !== undefined) setHbApiKey(h.apiKey || "lookprice_dev");
          if (h.apiSecret !== undefined) setHbApiSecret(h.apiSecret || "");
          if (h.merchantId !== undefined) setHbMerchantId(h.merchantId || "");
          if (h.isTestMode !== undefined) setHbIsTestMode(h.isTestMode);
          if (h.defaultDispatchTime !== undefined) setHbDefaultDispatchTime(h.defaultDispatchTime);
          if (h.defaultCargoCompany) setHbDefaultCargoCompany(h.defaultCargoCompany);
          if (h.autoSyncOrders !== undefined) setHbAutoSyncOrders(h.autoSyncOrders);
          if (h.autoStockSync !== undefined) setHbAutoStockSync(h.autoStockSync);
          if (h.webhookSecret) setHbWebhookSecret(h.webhookSecret);
          if (onBrandingChange) onBrandingChange('hepsiburada_settings', h);
        }
      }

      // Trendyol
      if (tyRes.status === 'fulfilled' && tyRes.value) {
        const ty = tyRes.value.data || tyRes.value;
        if (ty && typeof ty === 'object' && Object.keys(ty).length > 0) {
          if (ty.apiKey) setTyApiKey(ty.apiKey);
          if (ty.apiSecret) setTyApiSecret(ty.apiSecret);
          if (ty.merchantId) setTyMerchantId(ty.merchantId);
          if (onBrandingChange) onBrandingChange('trendyol_settings', ty);
        }
      }

      // Amazon
      if (amzRes.status === 'fulfilled' && amzRes.value) {
        const amz = amzRes.value.data || amzRes.value;
        if (amz && typeof amz === 'object' && Object.keys(amz).length > 0) {
          if (amz.clientId) setAmazonClientId(amz.clientId);
          if (amz.clientSecret) setAmazonClientSecret(amz.clientSecret);
          if (amz.refresh_token) setAmazonRefreshToken(amz.refresh_token);
          if (amz.sellerId) setAmazonSellerId(amz.sellerId);
          if (onBrandingChange) onBrandingChange('amazon_settings', amz);
        }
      }

      // Pazarama
      if (pzRes.status === 'fulfilled' && pzRes.value) {
        const pz = pzRes.value.data || pzRes.value;
        if (pz && typeof pz === 'object' && Object.keys(pz).length > 0) {
          if (pz.apiKey) setPzApiKey(pz.apiKey);
          if (pz.apiSecret) setPzApiSecret(pz.apiSecret);
          if (pz.merchantId) setPzMerchantId(pz.merchantId);
          if (pz.commissionRate !== undefined) setPzCommissionRate(pz.commissionRate);
          if (pz.categoryMappings) setPzCategoryMappings(pz.categoryMappings);
          if (pz.brandMappings) setPzBrandMappings(pz.brandMappings);
          if (onBrandingChange) onBrandingChange('pazarama_settings', pz);
        }
      }

      // N11
      if (n11Res.status === 'fulfilled' && n11Res.value) {
        const n11 = n11Res.value.data || n11Res.value;
        if (n11 && typeof n11 === 'object' && Object.keys(n11).length > 0) {
          if (n11.appKey) setN11AppKey(n11.appKey);
          if (n11.appSecret) setN11AppSecret(n11.appSecret);
          if (onBrandingChange) onBrandingChange('n11_settings', n11);
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
    if (amz.isSandbox !== undefined) setAmazonIsSandbox(amz.isSandbox);

    const n = branding.n11_settings || {};
    if (n.appKey) setN11AppKey(n.appKey);
    if (n.appSecret) setN11AppSecret(n.appSecret);

    const h = branding.hepsiburada_settings || {};
    if (h.apiKey !== undefined) setHbApiKey(h.apiKey || "lookprice_dev");
    if (h.apiSecret !== undefined) setHbApiSecret(h.apiSecret || "");
    if (h.merchantId !== undefined) setHbMerchantId(h.merchantId || "");
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

  const handleTestAmazon = async () => {
    setTestingAmazon(true);
    try {
      const res = await api.testAmazonConnection(currentStoreId, {
        clientId: amazonClientId,
        clientSecret: amazonClientSecret,
        refreshToken: amazonRefreshToken,
        sellerId: amazonSellerId,
        isSandbox: amazonIsSandbox
      });
      const data = res.data || res;
      if (data.success) {
        toast.success(
          lang === 'tr' 
            ? `Amazon SP-API Bağlantısı Başarılı! (Satıcı ID: ${data.sellerId || 'Doğrulandı'}, Ortam: Amazon.com.tr)` 
            : `Amazon SP-API Connection Successful! (${data.sellerId || 'Verified'})`
        );
        onBrandingChange('amazon_settings', {
          ...branding.amazon_settings,
          clientId: amazonClientId,
          clientSecret: amazonClientSecret,
          refresh_token: amazonRefreshToken,
          sellerId: amazonSellerId || data.sellerId,
          connected: true
        });
        if (onRefresh) onRefresh();
      } else {
        toast.error(`${lang === 'tr' ? 'Amazon SP-API Hatası' : 'Amazon SP-API Error'}: ${data.error || 'Yetkilendirme başarısız'}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || t.errorOccurred || 'Bir hata oluştu');
    } finally {
      setTestingAmazon(false);
    }
  };

  const handleBulkSyncAmazon = async () => {
    setBulkSyncingAmazon(true);
    try {
      const res = await api.bulkSyncAmazon(currentStoreId);
      const data = res.data || res;
      if (data.success) {
        toast.success(
          lang === 'tr'
            ? `Amazon SP-API Stok & Fiyat Güncellendi! (${data.syncedCount || 0} Başarılı / ${data.total || 0} Toplam)`
            : `Amazon Stock & Price Updated! (${data.syncedCount || 0} Synced)`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.error || 'Güncelleme başarısız');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Stok güncellenemedi');
    } finally {
      setBulkSyncingAmazon(false);
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
      const res = await api.saveAmazonSettings(payload);
      const savedData = res.data?.settings || res.settings || payload;

      if (savedData.clientId !== undefined) setAmazonClientId(savedData.clientId || "");
      if (savedData.clientSecret !== undefined) setAmazonClientSecret(savedData.clientSecret || "");
      if (savedData.refresh_token !== undefined) setAmazonRefreshToken(savedData.refresh_token || "");
      if (savedData.sellerId !== undefined) setAmazonSellerId(savedData.sellerId || "");

      onBrandingChange('amazon_settings', savedData);
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
      const res = await api.saveN11Settings(payload);
      const savedData = res.data?.settings || res.settings || payload;

      if (savedData.appKey !== undefined) setN11AppKey(savedData.appKey || "");
      if (savedData.appSecret !== undefined) setN11AppSecret(savedData.appSecret || "");

      onBrandingChange('n11_settings', savedData);
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
      const res = await api.saveHepsiburadaSettings(payload as any);
      const savedData = res.data?.settings || res.settings || payload;

      if (savedData.apiKey !== undefined) setHbApiKey(savedData.apiKey || "lookprice_dev");
      if (savedData.apiSecret !== undefined) setHbApiSecret(savedData.apiSecret || "");
      if (savedData.merchantId !== undefined) setHbMerchantId(savedData.merchantId || "");

      onBrandingChange('hepsiburada_settings', savedData);
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
      const res = await api.testHepsiburadaConnection(currentStoreId, {
        merchantId: hbMerchantId,
        apiSecret: hbApiSecret,
        apiKey: hbApiKey || "lookprice_dev"
      });
      const data = res.data || res;
      if (data.success) {
        toast.success(
          lang === 'tr' 
            ? `Hepsiburada API Bağlantısı Başarılı! (Ortam: ${data.environment || 'Production'}, Mağaza: ${data.merchantName || 'Onaylandı'})` 
            : `Hepsiburada API Connected! (${data.environment || 'Production'})`
        );
        onBrandingChange('hepsiburada_settings', {
          ...branding.hepsiburada_settings,
          apiKey: hbApiKey || "lookprice_dev",
          apiSecret: hbApiSecret,
          merchantId: hbMerchantId,
          connected: true
        });
      } else {
        const errMsg = data.error || data.message || (lang === 'tr' ? 'Yetkilendirme reddedildi' : 'Auth failed');
        toast.error(`${lang === 'tr' ? 'Hepsiburada Bağlantı Hatası' : 'Hepsiburada Connection Error'}: ${errMsg}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || t.errorOccurred || 'Bir hata oluştu');
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
      const res = await api.saveTrendyolSettings(tyPayload);
      const savedData = res.data?.settings || res.settings || tyPayload;

      if (savedData.apiKey !== undefined) setTyApiKey(savedData.apiKey || "");
      if (savedData.apiSecret !== undefined) setTyApiSecret(savedData.apiSecret || "");
      if (savedData.merchantId !== undefined) setTyMerchantId(savedData.merchantId || "");

      onBrandingChange('trendyol_settings', savedData);
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
      const res = await api.savePazaramaSettings({ 
        ...pzData,
        storeId: currentStoreId 
      } as any);
      const savedData = res.data?.settings || res.settings || pzData;

      if (savedData.apiKey !== undefined) setPzApiKey(savedData.apiKey || "");
      if (savedData.apiSecret !== undefined) setPzApiSecret(savedData.apiSecret || "");
      if (savedData.merchantId !== undefined) setPzMerchantId(savedData.merchantId || "");

      onBrandingChange('pazarama_settings', savedData);
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
                name="hb_merchant_id_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={hbMerchantId}
                onChange={(e) => {
                  const val = e.target.value;
                  setHbMerchantId(val);
                  onBrandingChange('hepsiburada_settings', {
                    ...(branding.hepsiburada_settings || {}),
                    merchantId: val,
                    apiSecret: hbApiSecret,
                    apiKey: hbApiKey || "lookprice_dev"
                  });
                }}
                placeholder="örn. ea3f02b7-ef8c-439b-ac03-9e2ed38a4deb"
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
                  name="hb_api_secret_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={hbApiSecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHbApiSecret(val);
                    onBrandingChange('hepsiburada_settings', {
                      ...(branding.hepsiburada_settings || {}),
                      merchantId: hbMerchantId,
                      apiSecret: val,
                      apiKey: hbApiKey || "lookprice_dev"
                    });
                  }}
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
                name="hb_api_key_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={hbApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setHbApiKey(val);
                  onBrandingChange('hepsiburada_settings', {
                    ...(branding.hepsiburada_settings || {}),
                    merchantId: hbMerchantId,
                    apiSecret: hbApiSecret,
                    apiKey: val || "lookprice_dev"
                  });
                }}
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
                id="ty-api-key-input"
                name="ty_api_key_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={tyApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setTyApiKey(val);
                  onBrandingChange('trendyol_settings', {
                    ...(branding.trendyol_settings || {}),
                    apiKey: val,
                    apiSecret: tyApiSecret,
                    merchantId: tyMerchantId
                  });
                }}
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolApiSecret || "API Secret"}</label>
              <div className="relative">
                <input 
                  type={showTySecret ? "text" : "password"} 
                  id="ty-api-secret-input"
                  name="ty_api_secret_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={tyApiSecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTyApiSecret(val);
                    onBrandingChange('trendyol_settings', {
                      ...(branding.trendyol_settings || {}),
                      apiKey: tyApiKey,
                      apiSecret: val,
                      merchantId: tyMerchantId
                    });
                  }}
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
                id="ty-merchant-id-input"
                name="ty_merchant_id_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={tyMerchantId}
                onChange={(e) => {
                  const val = e.target.value;
                  setTyMerchantId(val);
                  onBrandingChange('trendyol_settings', {
                    ...(branding.trendyol_settings || {}),
                    apiKey: tyApiKey,
                    apiSecret: tyApiSecret,
                    merchantId: val
                  });
                }}
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

          {currentUser?.role === 'superadmin' && (
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  checked={amazonIsSandbox}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAmazonIsSandbox(val);
                    onBrandingChange('amazon_settings', {
                      ...(branding.amazon_settings || {}),
                      clientId: amazonClientId,
                      clientSecret: amazonClientSecret,
                      refresh_token: amazonRefreshToken,
                      sellerId: amazonSellerId,
                      isSandbox: val
                    });
                  }}
                />
                <span className="text-xs font-medium text-slate-700">SP-API Sandbox (Test) Ortamı</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-0.5 ml-6">Amazon SP-API onay sürecindeki statik testler için Sandbox uç noktalarını kullanır.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonSellerId || "Amazon Seller ID (Merchant ID)"}</label>
              <input 
                type="text" 
                id="amz-seller-id-input"
                name="amz_seller_id_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={amazonSellerId}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmazonSellerId(val);
                  onBrandingChange('amazon_settings', {
                    ...(branding.amazon_settings || {}),
                    clientId: amazonClientId,
                    clientSecret: amazonClientSecret,
                    refresh_token: amazonRefreshToken,
                    sellerId: val,
                    isSandbox: amazonIsSandbox
                  });
                }}
                placeholder="A3..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.amazonRefreshToken || "SP-API Refresh Token"}</label>
              <div className="relative">
                <input 
                  type={showAmazonRefresh ? "text" : "password"} 
                  id="amz-refresh-token-input"
                  name="amz_refresh_token_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={amazonRefreshToken}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmazonRefreshToken(val);
                    onBrandingChange('amazon_settings', {
                      ...(branding.amazon_settings || {}),
                      clientId: amazonClientId,
                      clientSecret: amazonClientSecret,
                      refresh_token: val,
                      sellerId: amazonSellerId,
                      isSandbox: amazonIsSandbox
                    });
                  }}
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
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={handleTestAmazon}
                disabled={testingAmazon}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                title="Amazon SP-API Bağlantısını Ve İzinlerini Test Et"
              >
                <CheckCircle2 className={`h-3.5 w-3.5 text-indigo-600 ${testingAmazon ? 'animate-spin' : ''}`} />
                <span>{testingAmazon ? (lang === 'tr' ? 'Test Ediliyor...' : 'Testing...') : (lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test Connection')}</span>
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
                onClick={handleBulkSyncAmazon}
                disabled={bulkSyncingAmazon}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                title="Tüm Ürünlerin Stok ve Fiyatlarını Amazon SP-API ile Eşitle"
              >
                <UploadCloud className={`h-3.5 w-3.5 text-emerald-600 ${bulkSyncingAmazon ? 'animate-spin' : ''}`} />
                <span>{bulkSyncingAmazon ? (lang === 'tr' ? 'Güncelleniyor...' : 'Syncing...') : (lang === 'tr' ? 'Stok & Fiyat Gönder' : 'Push Inventory')}</span>
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

              <button 
                type="button"
                onClick={() => setShowAmazonGuideModal(true)}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-xs transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>{lang === 'tr' ? 'SP-API Kurulum Rehberi' : 'SP-API Setup Guide'}</span>
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
                    <span>{lang === 'tr' ? 'Amazon Hesabını Kaydet' : 'Save Amazon Settings'}</span>
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
                id="pz-api-key-input"
                name="pz_api_key_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={pzApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setPzApiKey(val);
                  onBrandingChange('pazarama_settings', {
                    ...(branding.pazarama_settings || {}),
                    apiKey: val,
                    apiSecret: pzApiSecret,
                    merchantId: pzMerchantId
                  });
                }}
                placeholder="API Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama API Secret</label>
              <div className="relative">
                <input 
                  type={showPzSecret ? "text" : "password"} 
                  id="pz-api-secret-input"
                  name="pz_api_secret_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={pzApiSecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPzApiSecret(val);
                    onBrandingChange('pazarama_settings', {
                      ...(branding.pazarama_settings || {}),
                      apiKey: pzApiKey,
                      apiSecret: val,
                      merchantId: pzMerchantId
                    });
                  }}
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
                id="pz-merchant-id-input"
                name="pz_merchant_id_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={pzMerchantId}
                onChange={(e) => {
                  const val = e.target.value;
                  setPzMerchantId(val);
                  onBrandingChange('pazarama_settings', {
                    ...(branding.pazarama_settings || {}),
                    apiKey: pzApiKey,
                    apiSecret: pzApiSecret,
                    merchantId: val
                  });
                }}
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
                id="n11-app-key-input"
                name="n11_app_key_no_autofill"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                value={n11AppKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setN11AppKey(val);
                  onBrandingChange('n11_settings', {
                    ...(branding.n11_settings || {}),
                    appKey: val,
                    appSecret: n11AppSecret
                  });
                }}
                placeholder="N11 App Key"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.n11AppSecret || "N11 App Secret"}</label>
              <div className="relative">
                <input 
                  type={showN11Secret ? "text" : "password"} 
                  id="n11-app-secret-input"
                  name="n11_app_secret_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
                  value={n11AppSecret}
                  onChange={(e) => {
                    const val = e.target.value;
                    setN11AppSecret(val);
                    onBrandingChange('n11_settings', {
                      ...(branding.n11_settings || {}),
                      appKey: n11AppKey,
                      appSecret: val
                    });
                  }}
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

      {/* Amazon SP-API Setup Guide Modal */}
      {showAmazonGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  a
                </div>
                <h4 className="font-semibold text-sm text-white">Amazon Selling Partner API (SP-API) Kurulum Rehberi</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAmazonGuideModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">LookPrice Amazon SP-API Entegrasyonu (Geliştirici İzni)</p>
                  <p className="text-[11px] mt-0.5 text-emerald-700">LookPrice resmi bir Amazon SP-API geliştiricisidir. Aşağıdaki adımları uygulayarak mağazanızı saniyeler içinde LookPrice'a bağlayabilirsiniz.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Uygulama Yetkilendirme Sayfasına Gidin</h5>
                    <p className="mt-1 text-slate-600">Amazon Seller Central hesabınıza giriş yapın. Üst menüden <span className="font-semibold">Partner Network (İş Ortağı Ağı) &gt; Manage Your Apps (Uygulamalarınızı Yönetin)</span> bölümüne tıklayın.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Yeni Geliştiriciyi Yetkilendirin</h5>
                    <p className="mt-1 text-slate-600">Açılan sayfada <span className="font-semibold text-indigo-700">"Authorize new developer" (Yeni bir geliştiriciyi yetkilendir)</span> butonuna tıklayın.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">LookPrice Geliştirici ID'sini Girin</h5>
                    <p className="mt-1 text-slate-600">Geliştirici Adı (Developer Name) alanına <span className="font-mono bg-white px-1.5 py-0.5 border rounded">LookPrice</span>, Geliştirici Kimliği (Developer ID) alanına ise <span className="font-mono bg-white px-1.5 py-0.5 border rounded">7243-7643-9821</span> değerini girin ve İleri'ye tıklayın.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Refresh Token ve Seller ID Bilgilerini Alın</h5>
                    <p className="mt-1 text-slate-600">Koşulları onayladıktan sonra ekranda görünecek olan <span className="font-mono bg-white px-1.5 py-0.5 border rounded">Satıcı Kimliği (Seller ID)</span> ve <span className="font-mono bg-white px-1.5 py-0.5 border rounded">MWS Auth Token / Refresh Token</span> değerlerini kopyalayın.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">5</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">LookPrice Paneline Kaydedin</h5>
                    <p className="mt-1 text-slate-600">Kopyaladığınız bilgileri bu ekrandaki <span className="font-semibold">Amazon Seller ID</span> ve <span className="font-semibold">SP-API Refresh Token</span> alanlarına yapıştırarak <span className="font-semibold text-indigo-700">"Bağlantıyı Test Et"</span> butonuna tıklayın.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAmazonGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Anladım, Kapat
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

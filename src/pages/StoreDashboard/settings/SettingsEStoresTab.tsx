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
import { MarketplaceListingsModal } from "@/components/marketplace/MarketplaceListingsModal";
import { HepsiburadaIntegrationForm } from "@/components/marketplace/HepsiburadaIntegrationForm";
import { TrendyolIntegrationForm } from "@/components/marketplace/TrendyolIntegrationForm";
import { AmazonIntegrationForm } from "@/components/marketplace/AmazonIntegrationForm";
import { PazaramaIntegrationForm } from "@/components/marketplace/PazaramaIntegrationForm";
import { N11IntegrationForm } from "@/components/marketplace/N11IntegrationForm";


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
  const [amazonAppId, setAmazonAppId] = useState(branding.amazon_settings?.appId || "");
  const [amazonClientId, setAmazonClientId] = useState(branding.amazon_settings?.clientId || "");
  const [amazonClientSecret, setAmazonClientSecret] = useState(branding.amazon_settings?.clientSecret || "");
  const [amazonRefreshToken, setAmazonRefreshToken] = useState(branding.amazon_settings?.refresh_token || "");
  const [amazonSellerId, setAmazonSellerId] = useState(branding.amazon_settings?.sellerId || "");
  const [amazonIsSandbox, setAmazonIsSandbox] = useState<boolean>(branding.amazon_settings?.isSandbox ?? true);
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

  // Unified Marketplace Listings & Error Modal
  const [showListingsModal, setShowListingsModal] = useState(false);
  const [listingsModalTab, setListingsModalTab] = useState<'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama'>('hepsiburada');

  // Product counts per marketplace
  const hbLiveCount = products.filter(p => p.is_hepsiburada_active).length;
  const hbErrCount = products.filter(p => p.hepsiburada_last_error).length;
  const tyLiveCount = products.filter(p => p.is_trendyol_active).length;
  const tyErrCount = products.filter(p => p.trendyol_last_error).length;
  const n11LiveCount = products.filter(p => p.is_n11_active).length;
  const n11ErrCount = products.filter(p => p.n11_last_error).length;
  const amzLiveCount = products.filter(p => p.is_amazon_active).length;
  const amzErrCount = products.filter(p => p.amazon_last_error).length;
  const pzLiveCount = products.filter(p => p.is_pazarama_active).length;
  const pzErrCount = products.filter(p => p.pazarama_last_error).length;
  const totalMarketplaceErrors = hbErrCount + tyErrCount + n11ErrCount + amzErrCount + pzErrCount;

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
          if (amz.appId) setAmazonAppId(amz.appId);
          if (amz.clientId) setAmazonClientId(amz.clientId);
          if (amz.clientSecret) setAmazonClientSecret(amz.clientSecret);
          if (amz.refresh_token) setAmazonRefreshToken(amz.refresh_token);
          if (amz.sellerId) setAmazonSellerId(amz.sellerId);
          if (amz.isSandbox !== undefined) setAmazonIsSandbox(amz.isSandbox);
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
        appId: amazonAppId,
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
            ? `Amazon SP-API Bağlantısı Başarılı! (Satıcı ID: ${data.sellerId || 'Doğrulandı'}, Ortam: ${amazonIsSandbox ? 'Sandbox (Test)' : 'Amazon.com.tr'})` 
            : `Amazon SP-API Connection Successful! (${data.sellerId || 'Verified'})`
        );
        onBrandingChange('amazon_settings', {
          ...branding.amazon_settings,
          appId: amazonAppId,
          clientId: amazonClientId,
          clientSecret: amazonClientSecret,
          refresh_token: amazonRefreshToken,
          sellerId: amazonSellerId || data.sellerId,
          isSandbox: amazonIsSandbox,
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
      const prevAmz = branding.amazon_settings || {};
      const isConn = !!(amazonClientId && amazonClientSecret && (amazonRefreshToken || amazonSellerId));
      const payload = { 
        appId: amazonAppId,
        clientId: amazonClientId, 
        clientSecret: amazonClientSecret, 
        refreshToken: amazonRefreshToken, 
        sellerId: amazonSellerId, 
        isSandbox: amazonIsSandbox,
        defaultCommissionRate: prevAmz.defaultCommissionRate ?? 15,
        defaultFixedFee: prevAmz.defaultFixedFee ?? 20,
        categoryMappings: prevAmz.categoryMappings || {},
        categoryAttributes: prevAmz.categoryAttributes || {},
        categoryMarkups: prevAmz.categoryMarkups || {},
        connected: isConn,
        storeId: currentStoreId 
      };
      const res = await api.saveAmazonSettings(payload);
      const savedData = res.data?.settings || res.settings || payload;

      if (savedData.appId !== undefined) setAmazonAppId(savedData.appId || "");
      if (savedData.clientId !== undefined) setAmazonClientId(savedData.clientId || "");
      if (savedData.clientSecret !== undefined) setAmazonClientSecret(savedData.clientSecret || "");
      if (savedData.refresh_token !== undefined) setAmazonRefreshToken(savedData.refresh_token || "");
      if (savedData.sellerId !== undefined) setAmazonSellerId(savedData.sellerId || "");
      if (savedData.isSandbox !== undefined) setAmazonIsSandbox(savedData.isSandbox ?? true);

      onBrandingChange('amazon_settings', savedData);
      toast.success(isConn ? (lang === 'tr' ? "Amazon hesabı başarıyla bağlandı ve kaydedildi" : "Amazon account connected successfully") : (t.saveSuccess || "Kaydedildi"));
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(t.errorOccurred || "Bir hata oluştu");
    }
  };

  const [amazonMatching, setAmazonMatching] = useState(false);

  const handleMatchAmazonListings = async () => {
    try {
      setAmazonMatching(true);
      const res = await api.matchAmazonListings(true, currentStoreId);
      const data = (res as any)?.data ?? res;
      if (data && data.success) {
        toast.success(
          lang === 'tr'
            ? `Amazon Eşleştirme Başarılı! ${data.matchedCount} ürün eşleşti, ${data.importedCount} yeni ürün aktarıldı.`
            : `Amazon sync completed! ${data.matchedCount} matched, ${data.importedCount} imported.`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data?.message || (lang === 'tr' ? "Eşleştirme başarısız" : "Matching failed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (lang === 'tr' ? "Eşleştirme hatası" : "Matching error"));
    } finally {
      setAmazonMatching(false);
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
      const prevN11 = branding.n11_settings || {};
      const isConn = !!(n11AppKey && n11AppSecret);
      const payload = { 
        appKey: n11AppKey, 
        appSecret: n11AppSecret, 
        categoryMappings: prevN11.categoryMappings || {},
        categoryMarkups: prevN11.categoryMarkups || {},
        connected: isConn, 
        storeId: currentStoreId 
      };
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
        defaultCommissionRate: prevHb.defaultCommissionRate ?? 18,
        defaultFixedFee: prevHb.defaultFixedFee ?? 20,
        autoSyncOrders: hbAutoSyncOrders,
        autoStockSync: hbAutoStockSync,
        webhookSecret: hbWebhookSecret,
        categoryMappings: prevHb.categoryMappings || {},
        categoryAttributes: prevHb.categoryAttributes || {},
        categoryMarkups: prevHb.categoryMarkups || {},
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

  const [hbMatching, setHbMatching] = useState(false);

  const handleMatchHbListings = async () => {
    try {
      setHbMatching(true);
      const res = await api.matchHepsiburadaListings(true, currentStoreId);
      const data = (res as any)?.data ?? res;
      if (data && (data.success || data.matchedCount !== undefined)) {
        toast.success(
          lang === 'tr'
            ? `Hepsiburada Eşleştirme Başarılı! ${data.matchedCount || 0} ürün eşleşti, ${data.importedCount || 0} yeni ürün aktarıldı.`
            : `Sync completed! ${data.matchedCount || 0} matched, ${data.importedCount || 0} imported.`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data?.message || data?.error || (lang === 'tr' ? "Eşleştirme başarısız" : "Matching failed"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (lang === 'tr' ? "Eşleştirme hatası" : "Matching error"));
    } finally {
      setHbMatching(false);
    }
  };

  const handleSyncHbOrders = async () => {
    await hbSync.runSync(
      () => api.syncHepsiburadaOrders(currentStoreId, { beginDate: '2026-09-01', timespan: 30 }),
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
      const prevTy = branding.trendyol_settings || {};
      const isConn = !!(tyApiKey && tyApiSecret && tyMerchantId);
      const tyPayload = { 
        apiKey: tyApiKey, 
        apiSecret: tyApiSecret, 
        merchantId: tyMerchantId, 
        defaultCommissionRate: prevTy.defaultCommissionRate ?? 18,
        defaultFixedFee: prevTy.defaultFixedFee ?? 20,
        categoryMappings: prevTy.categoryMappings || {},
        categoryAttributes: prevTy.categoryAttributes || {},
        categoryMarkups: prevTy.categoryMarkups || {},
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
      const prevPz = branding.pazarama_settings || {};
      const isConn = !!(pzApiKey && pzApiSecret);
      const pzData = { 
        apiKey: pzApiKey, 
        apiSecret: pzApiSecret, 
        merchantId: pzMerchantId,
        commissionRate: pzCommissionRate !== undefined && pzCommissionRate !== '' ? Number(pzCommissionRate) : (prevPz.commissionRate ?? 15),
        defaultFixedFee: prevPz.defaultFixedFee ?? 20,
        categoryMappings: pzCategoryMappings || prevPz.categoryMappings || {},
        categoryMarkups: prevPz.categoryMarkups || {},
        brandMappings: pzBrandMappings || prevPz.brandMappings || {},
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

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Unified Marketplace Listings & Error Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setListingsModalTab(activeTab === 'all' ? 'hepsiburada' : (activeTab as any));
                setShowListingsModal(true);
              }}
              id="open-listings-monitoring-btn"
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 transition-colors border border-orange-200 cursor-pointer shadow-xs"
              title={lang === 'tr' ? "Pazaryerlerinde Satışta Olan & Hatalı Ürünleri İzle" : "Monitor Marketplace Listings & Errors"}
            >
              <Store className="h-3.5 w-3.5 text-orange-600" />
              <span>{lang === 'tr' ? 'İlan Takibi & Hatalar' : 'Listings & Errors'}</span>
              {hbLiveCount > 0 && (
                <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full" title={`${hbLiveCount} ürün HB'de yayında`}>
                  {hbLiveCount}
                </span>
              )}
              {totalMarketplaceErrors > 0 && (
                <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse" title={`${totalMarketplaceErrors} ürün hata aldı`}>
                  {totalMarketplaceErrors}
                </span>
              )}
            </button>

            {/* Quick Mapping Hub Modal Trigger (Icon only) */}
            <button
              type="button"
              onClick={() => {
                setSelectedMappingMarketplace(activeTab === 'all' ? 'hepsiburada' : (activeTab as any));
                setCategoryMappingModalOpen(true);
              }}
              id="open-mapping-hub-header-btn"
              className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200 cursor-pointer shadow-xs"
              title={lang === 'tr' ? 'Pazaryeri Kategorileri, Nitelikleri ve Komisyon Ayarları' : 'Marketplace Categories, Attributes & Commission Settings'}
              aria-label={lang === 'tr' ? 'Pazaryeri Kategorileri, Nitelikleri ve Komisyon Ayarları' : 'Marketplace Categories, Attributes & Commission Settings'}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
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
        <HepsiburadaIntegrationForm
          lang={lang}
          currentStoreId={currentStoreId}
          branding={branding}
          onBrandingChange={onBrandingChange}
          t={t}
          hbMerchantId={hbMerchantId}
          setHbMerchantId={setHbMerchantId}
          hbApiSecret={hbApiSecret}
          setHbApiSecret={setHbApiSecret}
          hbApiKey={hbApiKey}
          setHbApiKey={setHbApiKey}
          hbDefaultCargoCompany={hbDefaultCargoCompany}
          setHbDefaultCargoCompany={setHbDefaultCargoCompany}
          hbAutoSyncOrders={hbAutoSyncOrders}
          setHbAutoSyncOrders={setHbAutoSyncOrders}
          hbAutoStockSync={hbAutoStockSync}
          setHbAutoStockSync={setHbAutoStockSync}
          hbIsTestMode={hbIsTestMode}
          setHbIsTestMode={setHbIsTestMode}
          hbDefaultDispatchTime={hbDefaultDispatchTime}
          setHbDefaultDispatchTime={setHbDefaultDispatchTime}
          isHbConnected={isHbConnected}
          hbLiveCount={hbLiveCount}
          hbErrCount={hbErrCount}
          hbMatching={hbMatching}
          handleTestHb={handleTestHb}
          handleSyncHbOrders={handleSyncHbOrders}
          handleMatchHbListings={handleMatchHbListings}
          handleFetchHbCategories={handleFetchHbCategories}
          handleDisconnectHb={handleDisconnectHb}
          handleSaveHbSettings={handleSaveHbSettings}
          setListingsModalTab={setListingsModalTab}
          setShowListingsModal={setShowListingsModal}
          setSelectedMappingMarketplace={setSelectedMappingMarketplace}
          setCategoryMappingModalOpen={setCategoryMappingModalOpen}
          hbSync={hbSync}
        />
      )}

      {/* ========================================================================= */}
      {/* TRENDYOL INTEGRATION CARD                                                 */}
      {/* ========================================================================= */}
      {(activeTab === 'trendyol' || activeTab === 'all') && (
        <TrendyolIntegrationForm
          lang={lang}
          branding={branding}
          onBrandingChange={onBrandingChange}
          t={t}
          tyApiKey={tyApiKey}
          setTyApiKey={setTyApiKey}
          tyApiSecret={tyApiSecret}
          setTyApiSecret={setTyApiSecret}
          tyMerchantId={tyMerchantId}
          setTyMerchantId={setTyMerchantId}
          isTyConnected={isTyConnected}
          tyLiveCount={tyLiveCount}
          tyErrCount={tyErrCount}
          handleTestTy={handleTestTy}
          handleSyncTyOrders={handleSyncTyOrders}
          handleDisconnectTy={handleDisconnectTy}
          handleSaveTySettings={handleSaveTySettings}
          setListingsModalTab={setListingsModalTab}
          setShowListingsModal={setShowListingsModal}
          setSelectedMappingMarketplace={setSelectedMappingMarketplace}
          setCategoryMappingModalOpen={setCategoryMappingModalOpen}
          tySync={tySync}
        />
      )}

      {/* ========================================================================= */}
      {/* AMAZON SP-API INTEGRATION CARD                                            */}
      {/* ========================================================================= */}
      {(activeTab === 'amazon' || activeTab === 'all') && (
        <AmazonIntegrationForm
          lang={lang}
          branding={branding}
          onBrandingChange={onBrandingChange}
          t={t}
          amazonAppId={amazonAppId}
          setAmazonAppId={setAmazonAppId}
          amazonClientId={amazonClientId}
          setAmazonClientId={setAmazonClientId}
          amazonClientSecret={amazonClientSecret}
          setAmazonClientSecret={setAmazonClientSecret}
          amazonRefreshToken={amazonRefreshToken}
          setAmazonRefreshToken={setAmazonRefreshToken}
          amazonSellerId={amazonSellerId}
          setAmazonSellerId={setAmazonSellerId}
          amazonIsSandbox={amazonIsSandbox}
          setAmazonIsSandbox={setAmazonIsSandbox}
          isAmazonConnected={isAmazonConnected}
          testingAmazon={testingAmazon}
          amazonSync={amazonSync}
          amazonMatching={amazonMatching}
          bulkSyncingAmazon={bulkSyncingAmazon}
          handleTestAmazon={handleTestAmazon}
          handleSyncOrders={handleSyncOrders}
          handleMatchAmazonListings={handleMatchAmazonListings}
          handleBulkSyncAmazon={handleBulkSyncAmazon}
          handleDisconnectAmazon={handleDisconnectAmazon}
          handleSaveAmazonSettings={handleSaveAmazonSettings}
          setShowAmazonGuideModal={setShowAmazonGuideModal}
          setSelectedMappingMarketplace={setSelectedMappingMarketplace}
          setCategoryMappingModalOpen={setCategoryMappingModalOpen}
        />
      )}

      {/* ========================================================================= */}
      {/* PAZARAMA INTEGRATION CARD                                                 */}
      {/* ========================================================================= */}
      {(activeTab === 'pazarama' || activeTab === 'all') && (
        <PazaramaIntegrationForm
          lang={lang}
          branding={branding}
          onBrandingChange={onBrandingChange}
          t={t}
          pzApiKey={pzApiKey}
          setPzApiKey={setPzApiKey}
          pzApiSecret={pzApiSecret}
          setPzApiSecret={setPzApiSecret}
          pzMerchantId={pzMerchantId}
          setPzMerchantId={setPzMerchantId}
          isPzConnected={isPzConnected}
          handleTestPz={handleTestPz}
          handleSyncPzOrders={handleSyncPzOrders}
          handleDisconnectPz={handleDisconnectPz}
          handleSavePzSettings={handleSavePzSettings}
          setSelectedMappingMarketplace={setSelectedMappingMarketplace}
          setCategoryMappingModalOpen={setCategoryMappingModalOpen}
          pzSync={pzSync}
        />
      )}

      {/* ========================================================================= */}
      {/* N11 INTEGRATION CARD                                                      */}
      {/* ========================================================================= */}
      {(activeTab === 'n11' || activeTab === 'all') && (
        <N11IntegrationForm
          lang={lang}
          branding={branding}
          onBrandingChange={onBrandingChange}
          t={t}
          n11AppKey={n11AppKey}
          setN11AppKey={setN11AppKey}
          n11AppSecret={n11AppSecret}
          setN11AppSecret={setN11AppSecret}
          isN11Connected={isN11Connected}
          handleTestN11={handleTestN11}
          handleSyncN11Orders={handleSyncN11Orders}
          handleDisconnectN11={handleDisconnectN11}
          handleSaveN11Settings={handleSaveN11Settings}
          n11Sync={n11Sync}
        />
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
                  <p className="font-semibold text-xs">Amazon Selling Partner API (SP-API) Kurulum Rehberi</p>
                  <p className="text-[11px] mt-0.5 text-emerald-700">Amazon Solution Provider Portal veya Seller Central hesabınızdan aldığınız kimlik bilgileriyle mağazanızı LookPrice'a doğrudan bağlayabilirsiniz.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">LWA (Login with Amazon) Kimlik Bilgilerini Girin</h5>
                    <p className="mt-1 text-slate-600">
                      Solution Provider Portal'da uygulamanızın altındaki <span className="font-semibold">LWA Credentials</span> bölümünde yer alan:
                    </p>
                    <ul className="mt-1.5 list-disc list-inside space-y-1 text-[11px] text-slate-700">
                      <li><span className="font-semibold">Client identifier:</span> <code className="font-mono bg-white px-1 py-0.5 border rounded">amzn1.application-oa2-client...</code> değerini <span className="font-semibold">Client ID</span> alanına yapıştırın.</li>
                      <li><span className="font-semibold">Client secret:</span> <code className="font-mono bg-white px-1 py-0.5 border rounded">amzn1.oa2-cs.v1...</code> değerini <span className="font-semibold">Client Secret</span> alanına yapıştırın.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">"Create Token" veya "Authorize" ile Refresh Token Alın</h5>
                    <p className="mt-1 text-slate-600">
                      Portalda uygulamanızın yanındaki açılır menüden veya butonlardan <span className="font-semibold text-indigo-700">"Create Token" / "Authorize App" (Uygulamayı Yetkilendir)</span> işlemine tıklayın:
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600 leading-normal">
                      Kendi satıcı hesabınızı seçip onayladığınızda Amazon size <span className="font-mono bg-white px-1 py-0.5 border rounded font-semibold text-indigo-900">Atzr|...</span> ile başlayan bir <span className="font-semibold">Refresh Token</span> verecektir. Bu token'ı kopyalayıp paneldeki <span className="font-semibold">SP-API Refresh Token</span> alanına yapıştırın.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Amazon Satıcı Kimliğinizi (Seller ID / Merchant Token) Alın</h5>
                    <p className="mt-1 text-slate-600">
                      Amazon Seller Central (<span className="font-mono">sellercentral.amazon.com.tr</span>) hesabınıza girin.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600 leading-normal">
                      Sağ üstteki <span className="font-semibold">Ayarlar (Dişli simgesi) &gt; Hesap Bilgileri (Account Info)</span> sayfasına gidin. <span className="font-semibold">İşletme Bilgileri</span> kutusu altındaki <span className="font-semibold text-indigo-700">"Satıcı Kimliğiniz" (Merchant Token / Seller ID)</span> kodunu kopyalayın (Örn: <code className="font-mono bg-white px-1 py-0.5 border rounded">A3J...</code>).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold text-amber-950">Ortam Tercihi (Sandbox veya Canlı)</h5>
                    <p className="mt-1 text-amber-900 leading-normal">
                      Uygulama durumunuz <span className="font-semibold">"Status: Sandbox"</span> ise, paneldeki <span className="font-semibold">SP-API Sandbox (Test) Modu</span>'nu aktif tutun. Amazon uygulamanızı canlıya aldığında <span className="font-semibold">"Canlı (Prod) Aktif"</span> butonuna basarak canlı pazaryerine geçebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">5</div>
                  <div>
                    <h5 className="font-semibold text-slate-900">Kaydedin ve Bağlantıyı Test Edin</h5>
                    <p className="mt-1 text-slate-600">
                      Bilgileri girdikten sonra <span className="font-semibold text-indigo-700">"Bağlantıyı Test Et"</span> butonuna tıklayın. Doğrulama başarılı olduğunda <span className="font-semibold text-slate-900">"Amazon Hesabını Bağla"</span> butonu ile ayarlarınızı kalıcı olarak kaydedin.
                    </p>
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

      {/* Unified Marketplace Listings & Error Modal */}
      {showListingsModal && (
        <MarketplaceListingsModal
          isOpen={showListingsModal}
          onClose={() => setShowListingsModal(false)}
          products={products}
          storeBranding={branding}
          currentStoreId={currentStoreId}
          onRefresh={onRefresh}
          lang={lang}
          initialMarketplace={listingsModalTab}
          initialStatus="all"
        />
      )}
    </motion.div>
  );
};

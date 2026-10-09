import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  Download, 
  Activity, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Store, 
  Globe, 
  ShoppingBag, 
  Barcode, 
  DollarSign, 
  Package,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getMarketplaceListingUrl } from "@/utils/marketplaceUrls";
import { formatFileDateTR } from "@/utils/formatUtils";

interface ProductXRayReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  lang: string;
  storeName?: string;
  branding?: any;
}

export const ProductXRayReportModal: React.FC<ProductXRayReportModalProps> = ({
  isOpen,
  onClose,
  products = [],
  lang,
  storeName = "Mağaza",
  branding = {}
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const isTr = lang === 'tr';

  // Currency rates from store branding or fallback TCMB rates
  const rates = useMemo(() => {
    return branding?.currency_rates || {
      USD: 48.9008,
      EUR: 55.6307,
      GBP: 64.7268
    };
  }, [branding]);

  const usdRate = Number(rates.USD) || 48.9008;
  const eurRate = Number(rates.EUR) || 55.6307;
  const gbpRate = Number(rates.GBP) || 64.7268;

  const convertToTry = (amount: number, curr?: string): number => {
    const num = Number(amount) || 0;
    const c = String(curr || 'TRY').toUpperCase().trim();
    if (c === 'USD' || c === '$') return num * usdRate;
    if (c === 'EUR' || c === '€') return num * eurRate;
    if (c === 'GBP' || c === '£') return num * gbpRate;
    return num;
  };

  const formatWithCurrency = (amount: number, curr?: string): string => {
    const num = Number(amount) || 0;
    const c = String(curr || 'TRY').toUpperCase().trim();
    const formatted = num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (c === 'USD' || c === '$') return `$${formatted}`;
    if (c === 'EUR' || c === '€') return `${formatted} €`;
    if (c === 'GBP' || c === '£') return `${formatted} £`;
    return `${formatted} ₺`;
  };

  // Helper to compute exact multi-channel scenario prices, live prices & audit discrepancy
  const getProductChannelScenario = (p: any) => {
    let mpData: any = p.marketplace_data;
    if (typeof mpData === 'string') {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};

    const rawWebPrice = Number(p.price) || 0;
    const webCurr = String(p.currency || 'TRY').toUpperCase().trim();
    const webPriceTry = convertToTry(rawWebPrice, webCurr);

    const costPrice = Number(p.cost_price) || 0;
    const costCurr = String(p.cost_currency || (p.currency || 'TRY')).toUpperCase().trim();
    const costPriceTry = convertToTry(costPrice, costCurr);

    // 1. Hepsiburada Strategy & Live Price
    const hbSettings = branding?.hepsiburada_settings || {};
    const hbCommRate = Number(hbSettings.defaultCommissionRate ?? 18);
    const hbFixedFee = Number(hbSettings.defaultFixedFee ?? 0);
    const hbMethod = hbSettings.priceCalculationMethod || hbSettings.priceCalculation || 'markup';
    const hbDivisor = 1 - (hbCommRate / 100);
    const hbTargetPrice = hbMethod === 'margin'
      ? (hbDivisor > 0 ? Math.round(((webPriceTry + hbFixedFee) / hbDivisor) * 100) / 100 : Math.round(webPriceTry * 100) / 100)
      : Math.round(((webPriceTry * (1 + (hbCommRate / 100))) + hbFixedFee) * 100) / 100;

    let hbLivePrice = 0;
    let isHbExplicit = false;
    if (mpData?.hepsiburada?.price && Number(mpData.hepsiburada.price) > 0) {
      hbLivePrice = Number(mpData.hepsiburada.price);
      isHbExplicit = true;
    } else if (mpData?.hepsiburada?.attributes?.price && Number(mpData.hepsiburada.attributes.price) > 0) {
      hbLivePrice = Number(mpData.hepsiburada.attributes.price);
      isHbExplicit = true;
    } else if (p.is_hepsiburada_active) {
      hbLivePrice = hbTargetPrice;
    }

    const hbIsUnderpriced = Boolean(p.is_hepsiburada_active && hbLivePrice > 0 && hbLivePrice < hbTargetPrice - 1.0);
    const hbPriceDiff = Math.max(0, Math.round((hbTargetPrice - hbLivePrice) * 100) / 100);
    const hbUrl = getMarketplaceListingUrl(p, 'hepsiburada');

    // 2. Amazon TR Strategy & Live Price
    const amzSettings = branding?.amazon_settings || {};
    const amzCommRate = Number(amzSettings.defaultCommissionRate ?? 15);
    const amzFixedFee = Number(amzSettings.defaultFixedFee ?? 0);
    const amzMethod = amzSettings.priceCalculationMethod || amzSettings.priceCalculation || 'markup';
    const amzDivisor = 1 - (amzCommRate / 100);
    const amzTargetPrice = amzMethod === 'margin'
      ? (amzDivisor > 0 ? Math.round(((webPriceTry + amzFixedFee) / amzDivisor) * 100) / 100 : Math.round(webPriceTry * 100) / 100)
      : Math.round(((webPriceTry * (1 + (amzCommRate / 100))) + amzFixedFee) * 100) / 100;

    const cleanAmzAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') ? String(p.amazon_asin).trim() : null;
    const isAmzLive = Boolean(p.is_amazon_active && cleanAmzAsin);

    let amzLivePrice = 0;
    let isAmzExplicit = false;
    if (mpData?.amazon?.price && Number(mpData.amazon.price) > 0) {
      amzLivePrice = Number(mpData.amazon.price);
      isAmzExplicit = true;
    } else if (isAmzLive) {
      amzLivePrice = amzTargetPrice;
    }

    const amzIsUnderpriced = Boolean(isAmzLive && amzLivePrice > 0 && amzLivePrice < amzTargetPrice - 1.0);
    const amzPriceDiff = Math.max(0, Math.round((amzTargetPrice - amzLivePrice) * 100) / 100);
    const amzUrl = getMarketplaceListingUrl(p, 'amazon');

    // 3. Trendyol Strategy & Live Price
    const tySettings = branding?.trendyol_settings || {};
    const tyCommRate = Number(tySettings.defaultCommissionRate ?? 15);
    const tyFixedFee = Number(tySettings.defaultFixedFee ?? 0);
    const tyDivisor = 1 - (tyCommRate / 100);
    const tyTargetPrice = tyDivisor > 0
      ? Math.round(((webPriceTry + tyFixedFee) / tyDivisor) * 100) / 100
      : Math.round(webPriceTry * 100) / 100;

    let tyLivePrice = 0;
    if (mpData?.trendyol?.price && Number(mpData.trendyol.price) > 0) {
      tyLivePrice = Number(mpData.trendyol.price);
    } else if (p.is_trendyol_active) {
      tyLivePrice = tyTargetPrice;
    }
    const tyIsUnderpriced = Boolean(p.is_trendyol_active && tyLivePrice > 0 && tyLivePrice < tyTargetPrice - 1.0);

    // 4. N11 Strategy & Live Price
    const n11TargetPrice = Math.round(webPriceTry * 100) / 100;
    let n11LivePrice = 0;
    if (mpData?.n11?.price && Number(mpData.n11.price) > 0) {
      n11LivePrice = Number(mpData.n11.price);
    } else if (p.is_n11_active) {
      n11LivePrice = n11TargetPrice;
    }
    const n11IsUnderpriced = Boolean(p.is_n11_active && n11LivePrice > 0 && n11LivePrice < n11TargetPrice - 1.0);

    // 5. Pazarama Strategy & Live Price
    const pzrTargetPrice = Math.round(webPriceTry * 100) / 100;
    let pzrLivePrice = 0;
    if (mpData?.pazarama?.price && Number(mpData.pazarama.price) > 0) {
      pzrLivePrice = Number(mpData.pazarama.price);
    } else if (p.is_pazarama_active) {
      pzrLivePrice = pzrTargetPrice;
    }
    const pzrIsUnderpriced = Boolean(p.is_pazarama_active && pzrLivePrice > 0 && pzrLivePrice < pzrTargetPrice - 1.0);

    const hasAnyUnderpriced = hbIsUnderpriced || amzIsUnderpriced || tyIsUnderpriced || n11IsUnderpriced || pzrIsUnderpriced;

    return {
      rawWebPrice,
      webCurr,
      webPriceTry,
      costPrice,
      costCurr,
      costPriceTry,
      
      // HB
      hbTargetPrice,
      hbLivePrice,
      hbIsUnderpriced,
      hbPriceDiff,
      hbUrl,
      hbCommRate,
      hbFixedFee,

      // AMZ
      amzTargetPrice,
      amzLivePrice,
      amzIsUnderpriced,
      amzPriceDiff,
      amzUrl,
      amzCommRate,
      amzFixedFee,

      // TY
      tyTargetPrice,
      tyLivePrice,
      tyIsUnderpriced,
      tyCommRate,
      tyFixedFee,

      // N11
      n11TargetPrice,
      n11LivePrice,
      n11IsUnderpriced,

      // PZR
      pzrTargetPrice,
      pzrLivePrice,
      pzrIsUnderpriced,

      hasAnyUnderpriced,
      cleanAmzAsin,
      isAmzLive
    };
  };

  const isServiceProduct = (p: any): boolean => {
    if (!p) return false;
    const pType = String(p.product_type || '').trim().toLowerCase();
    if (pType === 'service' || pType === 'hizmet' || pType === 'servis') return true;
    const cat = String(p.category || '').trim().toLocaleLowerCase('tr-TR');
    const subCat = String(p.sub_category || '').trim().toLocaleLowerCase('tr-TR');
    if (cat === 'servis' || cat === 'hizmet' || cat === 'hizmet/servis' || cat === 'servis/hizmet') return true;
    if (subCat.includes('servis') || subCat.includes('hizmet')) return true;
    return false;
  };

  const physicalProducts = useMemo(() => {
    return products.filter(p => !isServiceProduct(p));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return physicalProducts.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesBarcode = (p.barcode || '').toString().toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBarcode && !matchesSku) return false;
      }

      const sc = getProductChannelScenario(p);

      if (channelFilter === 'underpriced') {
        if (!sc.hasAnyUnderpriced) return false;
      } else if (channelFilter === 'hepsiburada') {
        if (!p.is_hepsiburada_active) return false;
      } else if (channelFilter === 'amazon') {
        if (!sc.isAmzLive) return false;
      } else if (channelFilter === 'trendyol') {
        if (!p.is_trendyol_active) return false;
      } else if (channelFilter === 'n11') {
        if (!p.is_n11_active) return false;
      } else if (channelFilter === 'pazarama') {
        if (!p.is_pazarama_active) return false;
      } else if (channelFilter === 'web') {
        if (!p.is_web_sale) return false;
      }

      return true;
    });
  }, [physicalProducts, searchTerm, channelFilter, usdRate, eurRate]);

  const metrics = useMemo(() => {
    let totalProducts = physicalProducts.length;
    let webActive = 0;
    let hbActive = 0;
    let amzActive = 0;
    let tyActive = 0;
    let n11Active = 0;
    let underpricedCount = 0;
    let totalStockQty = 0;

    physicalProducts.forEach(p => {
      const sc = getProductChannelScenario(p);
      if (p.is_web_sale) webActive++;
      if (p.is_hepsiburada_active) hbActive++;
      if (sc.isAmzLive) amzActive++;
      if (p.is_trendyol_active) tyActive++;
      if (p.is_n11_active) n11Active++;
      if (sc.hasAnyUnderpriced) underpricedCount++;

      const qty = parseFloat(p.stock_quantity || 0);
      totalStockQty += qty;
    });

    return { totalProducts, webActive, hbActive, amzActive, tyActive, n11Active, underpricedCount, totalStockQty };
  }, [products, usdRate, eurRate]);

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredProducts.map((p, idx) => {
        const sc = getProductChannelScenario(p);

        const costRateApplied = sc.costCurr === 'USD' ? usdRate : (sc.costCurr === 'EUR' ? eurRate : (sc.costCurr === 'GBP' ? gbpRate : 1.0));
        const webRateApplied = sc.webCurr === 'USD' ? usdRate : (sc.webCurr === 'EUR' ? eurRate : (sc.webCurr === 'GBP' ? gbpRate : 1.0));

        const webPriceTryFormatted = sc.webPriceTry.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const hbTargetFormatted = sc.hbTargetPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const amzTargetFormatted = sc.amzTargetPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const tyTargetFormatted = sc.tyTargetPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const hbFormulaExplanation = `(${webPriceTryFormatted} ₺ + ${sc.hbFixedFee} ₺) / (1 - %${sc.hbCommRate}) = ${hbTargetFormatted} ₺`;
        const amzFormulaExplanation = `(${webPriceTryFormatted} ₺ + ${sc.amzFixedFee} ₺) / (1 - %${sc.amzCommRate}) = ${amzTargetFormatted} ₺`;
        const tyFormulaExplanation = `(${webPriceTryFormatted} ₺ + ${sc.tyFixedFee} ₺) / (1 - %${sc.tyCommRate}) = ${tyTargetFormatted} ₺`;

        return {
          "Sıra No": idx + 1,
          "Ürün Adı": p.name || "",
          "Barkod (EAN)": p.barcode || "",
          "SKU / Ürün Kodu": p.sku || p.product_code || "",
          "Kategori": p.category || "Genel",
          "Reel Depo Stoğu": parseFloat(p.stock_quantity || 0),
          "Birim": p.unit || "Adet",
          
          // Alış / Maliyet Bölümü
          "Alış Maliyeti (Orijinal Tutar)": sc.costPrice,
          "Alış Para Birimi": sc.costCurr,
          "Alış TCMB Kuru (₺)": costRateApplied,
          "Alış Maliyeti (₺ Karşılığı)": Math.round(sc.costPriceTry * 100) / 100,

          // Web Satış Bölümü
          "Web Satış Bedeli (Orijinal Tutar)": sc.rawWebPrice,
          "Web Para Birimi": sc.webCurr,
          "Web TCMB Kuru (₺)": webRateApplied,
          "Web Satış Bedeli (₺ Karşılığı)": Math.round(sc.webPriceTry * 100) / 100,

          // Hepsiburada Bölümü
          "Hepsiburada Durumu": p.is_hepsiburada_active ? "Satışta (Aktif)" : "Pasif",
          "Hepsiburada SKU": p.hepsiburada_sku || "",
          "Hepsiburada Komisyon Oranı (%)": `%${sc.hbCommRate}`,
          "Hepsiburada Sabit Hizmet Bedeli (₺)": `${sc.hbFixedFee} ₺`,
          "Hepsiburada Fiyat Formülü Hesabı": hbFormulaExplanation,
          "Hepsiburada Hedef Satış Fiyatı (₺)": sc.hbTargetPrice,
          "Hepsiburada Canlı / Pazaryeri Fiyatı (₺)": sc.hbLivePrice,
          "Hepsiburada Fiyat Durumu": sc.hbIsUnderpriced ? `⚠️ Düşük Fiyat (-${sc.hbPriceDiff} ₺)` : (p.is_hepsiburada_active ? "Uyumlu" : "Pasif"),
          "Hepsiburada Stok": p.is_hepsiburada_active ? parseFloat(p.stock_quantity || 0) : 0,

          // Amazon TR Bölümü
          "Amazon TR Durumu": sc.isAmzLive ? "Satışta (Aktif)" : "Pasif",
          "Amazon ASIN Kodu": sc.cleanAmzAsin || p.amazon_asin || "",
          "Amazon Komisyon Oranı (%)": `%${sc.amzCommRate}`,
          "Amazon Sabit Hizmet Bedeli (₺)": `${sc.amzFixedFee} ₺`,
          "Amazon TR Fiyat Formülü Hesabı": amzFormulaExplanation,
          "Amazon TR Hedef Satış Fiyatı (₺)": sc.amzTargetPrice,
          "Amazon TR Canlı / Pazaryeri Fiyatı (₺)": sc.amzLivePrice,
          "Amazon TR Fiyat Durumu": sc.amzIsUnderpriced ? `⚠️ Düşük Fiyat (-${sc.amzPriceDiff} ₺)` : (sc.isAmzLive ? "Uyumlu" : "Pasif"),
          "Amazon Stok": sc.isAmzLive ? parseFloat(p.stock_quantity || 0) : 0,

          // Trendyol Bölümü
          "Trendyol Durumu": p.is_trendyol_active ? "Satışta (Aktif)" : "Pasif",
          "Trendyol Komisyon Oranı (%)": `%${sc.tyCommRate}`,
          "Trendyol Fiyat Formülü Hesabı": tyFormulaExplanation,
          "Trendyol Hedef Satış Fiyatı (₺)": sc.tyTargetPrice,
          "Trendyol Canlı / Pazaryeri Fiyatı (₺)": sc.tyLivePrice,
          "Trendyol Fiyat Durumu": sc.tyIsUnderpriced ? "⚠️ Düşük Fiyat" : (p.is_trendyol_active ? "Uyumlu" : "Pasif"),
          "Trendyol Stok": p.is_trendyol_active ? parseFloat(p.stock_quantity || 0) : 0,

          // N11 & Pazarama
          "N11 Durumu": p.is_n11_active ? "Satışta (Aktif)" : "Pasif",
          "N11 Canlı Satış Fiyatı (₺)": sc.n11LivePrice,
          "Pazarama Durumu": p.is_pazarama_active ? "Satışta (Aktif)" : "Pasif",
          "Pazarama Canlı Satış Fiyatı (₺)": sc.pzrLivePrice,
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Auto-fit column widths
      const colWidths = [
        { wch: 8 },  // Sıra No
        { wch: 36 }, // Ürün Adı
        { wch: 18 }, // Barkod
        { wch: 16 }, // SKU
        { wch: 18 }, // Kategori
        { wch: 14 }, // Reel Depo Stoğu
        { wch: 10 }, // Birim
        { wch: 20 }, // Alış Maliyeti
        { wch: 14 }, // Alış Para Birimi
        { wch: 16 }, // Alış Kuru
        { wch: 20 }, // Alış TL
        { wch: 22 }, // Web Satış Bedeli
        { wch: 14 }, // Web Para Birimi
        { wch: 16 }, // Web Kuru
        { wch: 22 }, // Web TL
        { wch: 18 }, // HB Durumu
        { wch: 16 }, // HB SKU
        { wch: 18 }, // HB Komisyon
        { wch: 20 }, // HB Sabit Bedel
        { wch: 42 }, // HB Formül Hesabı
        { wch: 22 }, // HB Hedef Fiyat
        { wch: 22 }, // HB Canlı Fiyat
        { wch: 22 }, // HB Fiyat Durumu
        { wch: 14 }, // HB Stok
        { wch: 18 }, // AMZ Durumu
        { wch: 16 }, // AMZ ASIN
        { wch: 18 }, // AMZ Komisyon
        { wch: 20 }, // AMZ Sabit Bedel
        { wch: 42 }, // AMZ Formül Hesabı
        { wch: 22 }, // AMZ Hedef Fiyat
        { wch: 22 }, // AMZ Canlı Fiyat
        { wch: 22 }, // AMZ Fiyat Durumu
        { wch: 14 }, // AMZ Stok
        { wch: 18 }, // TY Durumu
        { wch: 18 }, // TY Komisyon
        { wch: 42 }, // TY Formül Hesabı
        { wch: 22 }, // TY Hedef Fiyat
        { wch: 22 }, // TY Canlı Fiyat
        { wch: 22 }, // TY Fiyat Durumu
        { wch: 14 }, // TY Stok
        { wch: 14 }, // N11 Durumu
        { wch: 20 }, // N11 Canlı Fiyat
        { wch: 14 }, // PZR Durumu
        { wch: 20 }, // PZR Canlı Fiyat
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ürün Röntgeni ve Strateji");
      XLSX.writeFile(wb, `Urun_Rontgeni_Strateji_Raporu_${storeName.replace(/\s+/g, '_')}_${formatFileDateTR()}.xlsx`);
      toast.success(isTr ? "Ürün Röntgeni & Dövizli Formül Strateji Raporu Excel olarak indirildi!" : "Product X-Ray & Multi-Currency Strategy report downloaded successfully!");
    } catch (e: any) {
      toast.error(isTr ? "Excel dışa aktarma hatası: " + e.message : "Export error: " + e.message);
    }
  };

  const [visibleCount, setVisibleCount] = useState<number>(40);

  if (!isOpen) return null;

  const filterChips = [
    { id: "all", label: isTr ? "Tümü" : "All", count: metrics.totalProducts, color: "indigo" },
    { id: "underpriced", label: isTr ? "⚠️ Düşük Fiyat" : "⚠️ Underpriced", count: metrics.underpricedCount, color: "rose" },
    { id: "web", label: "Web", count: metrics.webActive, color: "indigo" },
    { id: "hepsiburada", label: "Hepsiburada", count: metrics.hbActive, color: "orange" },
    { id: "amazon", label: "Amazon TR", count: metrics.amzActive, color: "amber" },
    { id: "trendyol", label: "Trendyol", count: metrics.tyActive, color: "orange" },
    { id: "n11", label: "N11", count: metrics.n11Active, color: "red" },
    { id: "pazarama", label: "Pazarama", count: physicalProducts.filter(p => p.is_pazarama_active).length, color: "blue" },
  ];

  return (
    <div
      className="hidden md:flex fixed inset-0 z-[120] items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-[100vw] sm:max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
      >
        {/* COMPACT STICKY HEADER - ALWAYS VISIBLE CLOSE & EXCEL ACTIONS */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {isTr ? "Çok Kanallı Ürün Röntgeni & Fiyat Denetimi" : "Multi-Channel Product X-Ray & Pricing Audit"}
                </h3>
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                  <TrendingUp className="h-3 w-3" />
                  {isTr ? "Canlı vs Hedef Strateji" : "Live vs Target"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  1$ = {usdRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺ · 1€ = {eurRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="hidden sm:inline truncate">
                  {isTr ? `${storeName} pazaryeri fiyat ve komisyon uyumluluk denetimi` : `${storeName} channel price audit`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title={isTr ? "Excel İndir (.xlsx)" : "Export Excel"}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden xs:inline">{isTr ? "Excel" : "Excel"}</span>
              <span className="hidden md:inline">{isTr ? "İndir (.xlsx)" : "Export"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={isTr ? "Kapat" : "Close"}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-600 dark:text-slate-200 dark:hover:text-rose-400 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 border border-slate-200/80 dark:border-slate-700"
            >
              <X className="h-4 w-4 shrink-0" />
              <span>{isTr ? "Kapat" : "Close"}</span>
            </button>
          </div>
        </div>

        {/* MINIMALIST UNIFIED SEARCH + INTERACTIVE METRIC/CHANNEL PILL BAR */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(40);
                }}
                placeholder={isTr ? "Ürün adı, barkod veya SKU ara..." : "Search product name, barcode or SKU..."}
                className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 focus:border-indigo-500 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
              <span>{isTr ? "Listelenen:" : "Showing:"}</span>
              <span className="text-slate-900 dark:text-white font-black">{filteredProducts.length}</span>
              <span>/ {metrics.totalProducts}</span>
            </div>
          </div>

          {/* SINGLE-LINE HORIZONTAL SCROLLABLE METRIC & FILTER CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {filterChips.map((chip) => {
              const isActive = channelFilter === chip.id;
              const isUnderpricedChip = chip.id === "underpriced";
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setChannelFilter(isActive && chip.id !== "all" ? "all" : chip.id);
                    setVisibleCount(40);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                    isActive
                      ? isUnderpricedChip
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : isUnderpricedChip && chip.count > 0
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isUnderpricedChip && chip.count > 0
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE BODY: MOBILE MINIMALIST CARDS + DESKTOP FULL TABLE */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
              <p className="text-xs sm:text-sm font-bold">
                {isTr ? "Kriterlere uygun ürün bulunamadı." : "No products found matching criteria."}
              </p>
              {channelFilter !== "all" || searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setChannelFilter("all");
                    setSearchTerm("");
                  }}
                  className="mt-3 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isTr ? "Filtreyi Sıfırla" : "Reset Filter"}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. MOBILE MINIMALIST CARD LIST (< md) - ZERO HORIZONTAL OVERFLOW */}
              <div className="md:hidden space-y-2.5">
                {filteredProducts.slice(0, visibleCount).map((p, idx) => {
                  const sc = getProductChannelScenario(p);
                  const isHbLive = Boolean(p.is_hepsiburada_active);
                  const isTyLive = Boolean(p.is_trendyol_active);
                  const isN11Live = Boolean(p.is_n11_active);
                  const isPzrLive = Boolean(p.is_pazarama_active);
                  const isWebLive = Boolean(p.is_web_sale);
                  const stockQty = parseFloat(p.stock_quantity || 0);

                  return (
                    <div
                      key={p.id || idx}
                      className={`rounded-2xl border p-3 space-y-2.5 transition-all ${
                        sc.hasAnyUnderpriced
                          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80"
                          : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                      }`}
                    >
                      {/* Card Header: Name, Barcode & Stock */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">#{idx + 1}</span>
                            {sc.hasAnyUnderpriced && (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            )}
                            <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </h4>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{p.barcode || p.sku || "Barkodsuz"}</span>
                            {isWebLive && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-sans font-bold">· Web Aktif</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-lg font-black text-[10px] shrink-0 tabular-nums ${
                            stockQty <= 0
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {stockQty} {p.unit || "Adet"}
                        </span>
                      </div>

                      {/* Base Cost & Web Price Compact Strip */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            {isTr ? "Alış Maliyeti" : "Cost"}
                          </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                            {formatWithCurrency(sc.costPrice, sc.costCurr)}
                          </span>
                          {sc.costCurr !== "TRY" && sc.costPrice > 0 && (
                            <span className="text-[9px] font-mono text-slate-400 block tabular-nums">
                              ≈ {sc.costPriceTry.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">
                            {isTr ? "Web Satış" : "Web Price"}
                          </span>
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {formatWithCurrency(sc.rawWebPrice, sc.webCurr)}
                          </span>
                          {sc.webCurr !== "TRY" && sc.rawWebPrice > 0 && (
                            <span className="text-[9px] font-mono text-indigo-400 block tabular-nums">
                              ≈ {sc.webPriceTry.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Marketplace Channels Grid (2-Column Compact Cards) */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {/* Hepsiburada */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col justify-between ${
                            !isHbLive
                              ? "bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/50 opacity-60"
                              : sc.hbIsUnderpriced
                              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                              : "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-orange-600 dark:text-orange-400">Hepsiburada</span>
                            {isHbLive && sc.hbUrl && (
                              <a href={sc.hbUrl} target="_blank" rel="noreferrer" className="text-orange-600 p-0.5">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {isHbLive ? (
                            <div className="mt-1">
                              <div className="font-mono font-black text-xs text-slate-900 dark:text-white tabular-nums">
                                {sc.hbLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                              </div>
                              <div className={`text-[9px] font-semibold tabular-nums ${sc.hbIsUnderpriced ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                Hedef: {sc.hbTargetPrice.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                                {sc.hbIsUnderpriced && ` (-${sc.hbPriceDiff.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}₺)`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400 mt-1">Pasif</span>
                          )}
                        </div>

                        {/* Amazon TR */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col justify-between ${
                            !sc.isAmzLive
                              ? "bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/50 opacity-60"
                              : sc.amzIsUnderpriced
                              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-amber-600 dark:text-amber-400">Amazon TR</span>
                            {sc.isAmzLive && sc.amzUrl && (
                              <a href={sc.amzUrl} target="_blank" rel="noreferrer" className="text-amber-600 p-0.5">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {sc.isAmzLive ? (
                            <div className="mt-1">
                              <div className="font-mono font-black text-xs text-slate-900 dark:text-white tabular-nums">
                                {sc.amzLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                              </div>
                              <div className={`text-[9px] font-semibold tabular-nums ${sc.amzIsUnderpriced ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                                Hedef: {sc.amzTargetPrice.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                                {sc.amzIsUnderpriced && ` (-${sc.amzPriceDiff.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}₺)`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400 mt-1">Pasif</span>
                          )}
                        </div>

                        {/* N11 */}
                        <div
                          className={`p-2 rounded-xl border flex items-center justify-between ${
                            isN11Live
                              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200/70 dark:border-red-900/50"
                              : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/50 opacity-60"
                          }`}
                        >
                          <span className="font-black text-red-600 dark:text-red-400">N11</span>
                          {isN11Live ? (
                            <span className="font-mono font-black text-[11px] text-slate-900 dark:text-white tabular-nums">
                              {sc.n11LivePrice.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400">Pasif</span>
                          )}
                        </div>

                        {/* Trendyol / Pazarama */}
                        <div
                          className={`p-2 rounded-xl border flex items-center justify-between ${
                            isTyLive || isPzrLive
                              ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/50"
                              : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/50 opacity-60"
                          }`}
                        >
                          <span className="font-black text-orange-500">Trendyol</span>
                          {isTyLive ? (
                            <span className="font-mono font-black text-[11px] text-slate-900 dark:text-white tabular-nums">
                              {sc.tyLivePrice.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400">Pasif</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP HIGH-DENSITY TABLE (md and up) */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                      <th className="p-3">#</th>
                      <th className="p-3">{isTr ? "Ürün Adı & Barkod" : "Product Name & Barcode"}</th>
                      <th className="p-3 text-center">{isTr ? "Reel Stok" : "Stock Qty"}</th>
                      <th className="p-3 text-right">{isTr ? "Alış Maliyeti" : "Cost"}</th>
                      <th className="p-3 text-right">{isTr ? "Web Satış Bedeli" : "Web Price"}</th>
                      <th className="p-3 text-center">Hepsiburada (Canlı / Strateji)</th>
                      <th className="p-3 text-center">Amazon TR (Canlı / Strateji)</th>
                      <th className="p-3 text-center">Trendyol (Canlı / Strateji)</th>
                      <th className="p-3 text-center">N11 (Canlı / Strateji)</th>
                      <th className="p-3 text-center">Pazarama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredProducts.slice(0, visibleCount).map((p, idx) => {
                      const sc = getProductChannelScenario(p);
                      const isHbLive = Boolean(p.is_hepsiburada_active);
                      const isTyLive = Boolean(p.is_trendyol_active);
                      const isN11Live = Boolean(p.is_n11_active);
                      const isPzrLive = Boolean(p.is_pazarama_active);
                      const isWebLive = Boolean(p.is_web_sale);
                      const stockQty = parseFloat(p.stock_quantity || 0);

                      return (
                        <tr
                          key={p.id || idx}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                            sc.hasAnyUnderpriced ? "bg-rose-50/30 dark:bg-rose-950/20" : ""
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-black text-slate-900 dark:text-white max-w-xs truncate flex items-center gap-1.5">
                              {sc.hasAnyUnderpriced && (
                                <span title={isTr ? "Pazaryerinde fiyatı formüle göre düşük kalmış!" : "Underpriced in marketplace!"}>
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 inline" />
                                </span>
                              )}
                              <span className="truncate">{p.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <Barcode className="h-3 w-3" />
                              <span>{p.barcode || p.sku || "N/A"}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md font-black text-xs tabular-nums ${
                                stockQty <= 0
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              }`}
                            >
                              {stockQty} {p.unit || "Adet"}
                            </span>
                          </td>

                          {/* Cost Price */}
                          <td className="p-3 text-right font-mono tabular-nums">
                            <div className="font-bold text-slate-700 dark:text-slate-200">
                              {formatWithCurrency(sc.costPrice, sc.costCurr)}
                            </div>
                            {sc.costCurr !== "TRY" && sc.costPrice > 0 && (
                              <div className="text-[10px] text-slate-400 font-semibold">
                                ≈ {sc.costPriceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                              </div>
                            )}
                          </td>

                          {/* Web Price */}
                          <td className="p-3 text-right font-mono tabular-nums">
                            <div className="font-black text-indigo-600 dark:text-indigo-400">
                              {formatWithCurrency(sc.rawWebPrice, sc.webCurr)}
                            </div>
                            {sc.webCurr !== "TRY" && sc.rawWebPrice > 0 && (
                              <div className="text-[10px] text-indigo-400 dark:text-indigo-300 font-semibold">
                                ≈ {sc.webPriceTry.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                              </div>
                            )}
                            <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                              {isWebLive ? (isTr ? "Web'de Aktif" : "Web Live") : (isTr ? "Web Pasif" : "Web Off")}
                            </div>
                          </td>

                          {/* Hepsiburada */}
                          <td className="p-3 text-center">
                            {isHbLive ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums ${
                                      sc.hbIsUnderpriced
                                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                                        : "bg-orange-100 text-orange-900 border border-orange-300"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-orange-600 shrink-0" />
                                    <span>{sc.hbLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                  </span>
                                  {sc.hbUrl && (
                                    <a
                                      href={sc.hbUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-orange-600 hover:text-orange-800 p-0.5"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                {sc.hbIsUnderpriced ? (
                                  <div className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded inline-block tabular-nums">
                                    ⚠️ Hedef: {sc.hbTargetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ (-{sc.hbPriceDiff.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺)
                                  </div>
                                ) : (
                                  <div className="text-[8px] font-medium text-slate-400 tabular-nums">
                                    Hedef: {sc.hbTargetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                            )}
                          </td>

                          {/* Amazon TR */}
                          <td className="p-3 text-center">
                            {sc.isAmzLive ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums ${
                                      sc.amzIsUnderpriced
                                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                                        : "bg-amber-100 text-amber-900 border border-amber-300"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
                                    <span>{sc.amzLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                                  </span>
                                  {sc.amzUrl && (
                                    <a
                                      href={sc.amzUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-amber-600 hover:text-amber-800 p-0.5"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                {sc.amzIsUnderpriced ? (
                                  <div className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded inline-block tabular-nums">
                                    ⚠️ Hedef: {sc.amzTargetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ (-{sc.amzPriceDiff.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺)
                                  </div>
                                ) : (
                                  <div className="text-[8px] font-medium text-slate-400 tabular-nums">
                                    Hedef: {sc.amzTargetPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                            )}
                          </td>

                          {/* Trendyol */}
                          <td className="p-3 text-center">
                            {isTyLive ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                                  sc.tyIsUnderpriced
                                    ? "bg-rose-100 text-rose-900 border border-rose-300"
                                    : "bg-orange-50 text-orange-800 border border-orange-200"
                                }`}
                              >
                                <CheckCircle2 className="h-3 w-3 text-orange-500 shrink-0" />
                                <span>{sc.tyLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                            )}
                          </td>

                          {/* N11 */}
                          <td className="p-3 text-center">
                            {isN11Live ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded-md text-[10px] font-black tabular-nums">
                                <CheckCircle2 className="h-3 w-3 text-red-500 shrink-0" />
                                <span>{sc.n11LivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                            )}
                          </td>

                          {/* Pazarama */}
                          <td className="p-3 text-center">
                            {isPzrLive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[10px] font-black tabular-nums">
                                <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                                <span>{sc.pzrLivePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center pt-2 pb-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 40)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    {isTr
                      ? `Daha Fazla Göster (${filteredProducts.length - visibleCount} ürün kaldı)`
                      : `Load More (${filteredProducts.length - visibleCount} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* COMPACT STICKY FOOTER */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 truncate tabular-nums">
              {isTr ? `${filteredProducts.length} ürün` : `${filteredProducts.length} items`}
            </span>
            {metrics.underpricedCount > 0 && (
              <button
                type="button"
                onClick={() => setChannelFilter(channelFilter === "underpriced" ? "all" : "underpriced")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold truncate cursor-pointer"
              >
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="truncate">{metrics.underpricedCount} düşük fiyatlı</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
          >
            {isTr ? "Kapat" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductXRayReportModal;

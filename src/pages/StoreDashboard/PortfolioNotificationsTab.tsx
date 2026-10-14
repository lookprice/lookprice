import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  CloudOff, 
  ShoppingBag, 
  Hotel, 
  FileDown, 
  ArrowLeftRight, 
  Wrench, 
  Car, 
  Users, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  PackageX, 
  ChevronRight,
  Sparkles,
  Radio,
  FileText,
  Scale,
  FileSignature
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";
import { motion, AnimatePresence } from "motion/react";

interface NotificationItem {
  id: string;
  category: "gib" | "order" | "stock" | "hotel" | "fleet" | "transfer" | "service" | "crm" | "invoice" | "reconciliation" | "quotation";
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  description: string;
  count: number;
  timestamp: string;
  targetTab: string;
  targetFilter?: string;
  actionText: string;
  items?: Array<{ id: string | number; label: string; detail?: string }>;
}

interface PortfolioNotificationsTabProps {
  analytics?: any;
  notifications?: any;
  onRefreshNotifications?: () => void;
  onNavigateTab?: (tabId: string, filter?: string) => void;
  storeId?: number;
  isTr?: boolean;
  branding?: any;
}

export const PortfolioNotificationsTab: React.FC<PortfolioNotificationsTabProps> = ({
  analytics,
  notifications: propNotifications,
  onRefreshNotifications,
  onNavigateTab,
  storeId,
  isTr: propIsTr,
  branding
}) => {
  const { lang } = useLanguage();
  const isTr = propIsTr !== undefined ? propIsTr : lang === "tr";

  const [feed, setFeed] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "critical" | "reconciliation_quote" | "gib" | "order_stock" | "crm_hotel">("all");

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getNotificationFeed(storeId);
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setFeed(data);
      } else {
        setFeed([]);
      }
      setLastSyncTime(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (e: any) {
      console.warn("Failed to fetch notification feed:", e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(() => {
      fetchFeed(true);
      if (onRefreshNotifications) onRefreshNotifications();
    }, 30000); // Live poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchFeed, onRefreshNotifications]);

  const handleAction = (item: NotificationItem) => {
    if (onNavigateTab) {
      onNavigateTab(item.targetTab, item.targetFilter);
    }
  };

  // Grouped Counts
  const criticalCount = feed.filter(f => f.severity === "critical").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const reconQuoteCount = feed.filter(f => f.category === "reconciliation" || f.category === "quotation").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const unsentCount = feed.filter(f => f.id === "gib-unsent").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const stockCount = feed.filter(f => f.category === "stock" || f.category === "invoice").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const flowCount = feed.filter(f => ["hotel", "transfer", "service", "fleet", "crm"].includes(f.category)).reduce((acc, curr) => acc + (curr.count || 1), 0);

  // Filtered List
  const filteredFeed = feed.filter(item => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "critical") return item.severity === "critical";
    if (categoryFilter === "reconciliation_quote") return item.category === "reconciliation" || item.category === "quotation";
    if (categoryFilter === "gib") return item.category === "gib" || item.category === "invoice";
    if (categoryFilter === "order_stock") return item.category === "order" || item.category === "stock";
    if (categoryFilter === "crm_hotel") return ["hotel", "crm", "fleet", "service", "transfer"].includes(item.category);
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reconciliation":
        return <Scale className="w-5 h-5" />;
      case "quotation":
        return <FileSignature className="w-5 h-5" />;
      case "gib":
        return <CloudOff className="w-5 h-5" />;
      case "order":
        return <ShoppingBag className="w-5 h-5" />;
      case "stock":
        return <PackageX className="w-5 h-5" />;
      case "hotel":
        return <Hotel className="w-5 h-5" />;
      case "invoice":
        return <FileDown className="w-5 h-5" />;
      case "transfer":
        return <ArrowLeftRight className="w-5 h-5" />;
      case "service":
        return <Wrench className="w-5 h-5" />;
      case "fleet":
        return <Car className="w-5 h-5" />;
      case "crm":
        return <Users className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. LIVE RADAR PULSE HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                {isTr ? "Operasyonel Bildirim & Nabız Radarı" : "Operational Alert & Pulse Radar"}
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isTr ? "Canlı İzleme Aktif" : "Live Pulse"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTr 
                ? "E-Fatura, pazaryeri siparişleri, kritik stok ve operasyon alarmları anlık taranıyor." 
                : "Real-time monitoring of e-Invoices, marketplace orders, stock levels, and operations."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {lastSyncTime && (
            <span className="text-[11px] font-medium text-slate-400">
              {isTr ? `Son kontrol: ${lastSyncTime}` : `Updated: ${lastSyncTime}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              fetchFeed();
              if (onRefreshNotifications) onRefreshNotifications();
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title={isTr ? "Bildirimleri Yenile" : "Refresh Alerts"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. FIVE PULSE KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Acil Aksiyon */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "critical" ? "all" : "critical")}
          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            criticalCount > 0 
              ? "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-sm hover:border-rose-500" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300"
          } ${categoryFilter === "critical" ? "ring-2 ring-rose-500 shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {isTr ? "Kritik & Acil" : "Critical"}
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${criticalCount > 0 ? "bg-rose-500 text-white animate-pulse shadow-xs" : "bg-slate-100 text-slate-400"}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{criticalCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">{isTr ? "Kayıt" : "Items"}</span>
          </div>
        </div>

        {/* Mutabakat & Teklifler */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "reconciliation_quote" ? "all" : "reconciliation_quote")}
          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            reconQuoteCount > 0 
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-sm hover:border-emerald-500" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300"
          } ${categoryFilter === "reconciliation_quote" ? "ring-2 ring-emerald-500 shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isTr ? "Mutabakat & Teklif" : "Recon & Quotes"}
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${reconQuoteCount > 0 ? "bg-emerald-600 text-white shadow-xs animate-pulse" : "bg-slate-100 text-slate-400"}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{reconQuoteCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">{isTr ? "Yanıt" : "Responses"}</span>
          </div>
        </div>

        {/* İletim & GİB Bekleyen */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "gib" ? "all" : "gib")}
          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            unsentCount > 0 
              ? "bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-100 shadow-sm hover:border-blue-500" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300"
          } ${categoryFilter === "gib" ? "ring-2 ring-blue-500 shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {isTr ? "GİB Bekleyen" : "Unsent to GİB"}
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${unsentCount > 0 ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}>
              <CloudOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{unsentCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">{isTr ? "Fatura" : "Invoices"}</span>
          </div>
        </div>

        {/* Stok & Tedarik Alarmları */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "order_stock" ? "all" : "order_stock")}
          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            stockCount > 0 
              ? "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-sm hover:border-amber-500" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300"
          } ${categoryFilter === "order_stock" ? "ring-2 ring-amber-500 shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {isTr ? "Stok & Tedarik" : "Stock & Supply"}
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${stockCount > 0 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "bg-slate-100 text-slate-400"}`}>
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stockCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">{isTr ? "Alarm" : "Alerts"}</span>
          </div>
        </div>

        {/* Operasyonel Akış */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "crm_hotel" ? "all" : "crm_hotel")}
          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            flowCount > 0 
              ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-950 dark:text-indigo-100 shadow-sm hover:border-indigo-500" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300"
          } ${categoryFilter === "crm_hotel" ? "ring-2 ring-indigo-500 shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {isTr ? "Operasyonel Akış" : "Operations Flow"}
            </span>
            <div className={`p-1.5 rounded-lg shrink-0 ${flowCount > 0 ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{flowCount}</span>
            <span className="text-[11px] text-slate-500 font-semibold">{isTr ? "İşlem" : "Tasks"}</span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY FILTER TABS */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            categoryFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          {isTr ? `Tümü (${feed.length})` : `All (${feed.length})`}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("critical")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "critical"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>{isTr ? "Kritik / Acil" : "Critical"}</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full font-black bg-rose-500 text-white">
              {criticalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("reconciliation_quote")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "reconciliation_quote"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isTr ? "Mutabakat & Teklifler" : "Reconciliation & Quotes"}</span>
          {reconQuoteCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full font-black bg-emerald-500 text-white">
              {reconQuoteCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("gib")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "gib"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50"
          }`}
        >
          <CloudOff className="w-3.5 h-3.5" />
          <span>{isTr ? "GİB & Faturalar" : "GİB & Invoices"}</span>
          {unsentCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full font-black bg-blue-100 text-blue-800">
              {unsentCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("order_stock")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "order_stock"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-50"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isTr ? "Sipariş & Stok" : "Orders & Stock"}</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("crm_hotel")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "crm_hotel"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50"
          }`}
        >
          <Hotel className="w-3.5 h-3.5" />
          <span>{isTr ? "Rezervasyon & CRM" : "CRM & Hotel"}</span>
        </button>
      </div>

      {/* 4. NOTIFICATIONS FEED LIST */}
      <div className="space-y-3">
        {loading && feed.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              {isTr ? "Sistem operasyonel bildirimleri taranıyor..." : "Scanning operational alerts..."}
            </p>
          </div>
        ) : filteredFeed.length > 0 ? (
          filteredFeed.map((item) => {
            const isCritical = item.severity === "critical";
            const isWarning = item.severity === "warning";
            const isReconOrQuote = item.category === "reconciliation" || item.category === "quotation";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCritical 
                    ? "border-rose-300 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/40 to-transparent" 
                    : isWarning 
                    ? "border-amber-300 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/30 to-transparent" 
                    : isReconOrQuote
                    ? "border-emerald-300 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/30 to-transparent"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isCritical 
                      ? "bg-rose-500 text-white animate-pulse" 
                      : isWarning 
                      ? "bg-amber-500 text-slate-950 font-black" 
                      : isReconOrQuote
                      ? "bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  }`}>
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {item.title}
                      </h3>

                      {isCritical ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          {isTr ? "Kritik Aksiyon" : "Action Required"}
                        </span>
                      ) : isWarning ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                          {isTr ? "İşlem Bekliyor" : "Pending"}
                        </span>
                      ) : isReconOrQuote ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {isTr ? "Müşteri Onayladı" : "Confirmed"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                          {isTr ? "Bilgi & Akış" : "Info"}
                        </span>
                      )}

                      {item.count > 0 && (
                        <span className="px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black">
                          {item.count} {isTr ? "Adet" : "Records"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {item.description}
                    </p>

                    {/* Sub-item previews */}
                    {item.items && item.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {item.items.map((sub, idx) => (
                          <div 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 max-w-[240px] truncate"
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.detail && (
                              <span className="text-slate-400 font-mono text-[9px] shrink-0">({sub.detail})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleAction(item)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                      isCritical
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50"
                        : isWarning
                        ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30"
                        : isReconOrQuote
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50"
                    }`}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          /* 5. ALL SYSTEMS NORMAL & HEALTHY (EMPTY STATE) */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {isTr ? "Tüm Sistemler Normal & Kusursuz" : "All Systems Operational & Synced"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                {isTr 
                  ? "Bekleyen acil web siparişi, GİB e-fatura hatası veya kritik stok alarmı bulunmuyor. Mağazanız ve entegrasyonlarınız kusursuz çalışıyor." 
                  : "No urgent orders, e-invoice errors, or low stock warnings. Your store and marketplace integrations are operating smoothly."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
import { resolveDomainId } from "../../utils/sectorCapability";
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
  const domainId = resolveDomainId(branding);
  const isAutomotive = domainId === "AUTOMOTIVE";
  const isRealEstate = domainId === "REAL_ESTATE";
  const isPortfolio = isAutomotive || isRealEstate;

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

  // Audio/Visual alert for new orders
  useEffect(() => {
    const newOrderItems = feed.filter(f => f.category === "order" && f.count > 0);
    if (newOrderItems.length > 0) {
      // Trigger audio alert
      const audio = new Audio('/sounds/cash-register.mp3'); // Assuming standard path
      audio.play().catch(e => console.warn("Audio play blocked", e));
      
      // Trigger browser visual notification (simple implementation)
      if (Notification.permission === 'granted') {
        new Notification("Yeni Sipariş!", {
          body: "Yeni bir e-market siparişiniz var!",
          icon: '/favicon.ico'
        });
      }
    }
  }, [feed]);

  // Grouped Counts
  const criticalCount = feed.filter(f => f.severity === "critical").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const reconQuoteCount = feed.filter(f => f.category === "reconciliation" || f.category === "quotation").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const gibCount = feed.filter(f => f.category === "gib").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const stockCount = feed.filter(f => f.category === "stock" || f.category === "invoice" || f.category === "order").reduce((acc, curr) => acc + (curr.count || 1), 0);
  const flowCount = feed.filter(f => ["hotel", "transfer", "service", "fleet", "crm"].includes(f.category)).reduce((acc, curr) => acc + (curr.count || 1), 0);

  // Filtered List
  const filteredFeed = feed.filter(item => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "critical") return item.severity === "critical";
    if (categoryFilter === "reconciliation_quote") return item.category === "reconciliation" || item.category === "quotation";
    if (categoryFilter === "gib") return item.category === "gib";
    if (categoryFilter === "order_stock") return item.category === "order" || item.category === "stock" || item.category === "invoice";
    if (categoryFilter === "crm_hotel") return ["hotel", "crm", "fleet", "service", "transfer"].includes(item.category);
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reconciliation":
        return <Scale className="w-5 h-5" />;
      case "quotation":
        return <FileSignature className="w-3.5 h-3.5" />;
      case "gib":
        return <CloudOff className="w-3.5 h-3.5" />;
      case "order":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "stock":
        return <PackageX className="w-3.5 h-3.5" />;
      case "hotel":
        return <Hotel className="w-3.5 h-3.5" />;
      case "invoice":
        return <FileDown className="w-3.5 h-3.5" />;
      case "transfer":
        return <ArrowLeftRight className="w-3.5 h-3.5" />;
      case "service":
        return <Wrench className="w-3.5 h-3.5" />;
      case "fleet":
        return <Car className="w-3.5 h-3.5" />;
      case "crm":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Bell className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. LIVE RADAR PULSE HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-white">
                {isTr ? "Operasyonel Bildirim & Nabız Radarı" : "Operational Alert & Pulse Radar"}
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isTr ? "Canlı İzleme" : "Live Pulse"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              {isAutomotive
                ? (isTr
                    ? "Araç portföyü, seyrüsefer/sigorta/muayene tarihleri, periyodik bakımlar ve CRM alarmları anlık taranıyor."
                    : "Real-time monitoring of vehicle portfolio, registration/insurance expiry, maintenance, and CRM alerts.")
                : isRealEstate
                ? (isTr
                    ? "Gayrimenkul portföyü, mülk sahibi başvuruları, yer gösterme randevuları ve cari mutabakatlar anlık taranıyor."
                    : "Real-time monitoring of property portfolio, owner leads, tour appointments, and reconciliations.")
                : (isTr 
                    ? "E-Fatura, pazaryeri siparişleri, kritik stok ve operasyon alarmları anlık taranıyor." 
                    : "Real-time monitoring of e-Invoices, marketplace orders, and inventory.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {lastSyncTime && (
            <span className="text-[11px] font-mono text-slate-400">
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
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 shadow-2xs cursor-pointer disabled:opacity-50"
            title={isTr ? "Bildirimleri Yenile" : "Refresh Alerts"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. PULSE KPI STAT CARDS */}
      <div className={`grid grid-cols-2 ${isPortfolio ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-5"} gap-2`}>
        {/* Acil Aksiyon */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "critical" ? "all" : "critical")}
          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === "critical" 
              ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              categoryFilter === "critical" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
            }`}>
              {isTr ? "Kritik & Acil" : "Critical"}
            </span>
            <AlertOctagon className={`w-3.5 h-3.5 ${categoryFilter === "critical" ? "text-white" : criticalCount > 0 ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-base sm:text-lg font-mono font-medium ${
              categoryFilter === "critical" ? "text-white" : "text-slate-900 dark:text-slate-100"
            }`}>{criticalCount}</span>
            <span className={`text-[10px] ${categoryFilter === "critical" ? "text-slate-400" : "text-slate-500"}`}>{isTr ? "kayıt" : "items"}</span>
          </div>
        </div>

        {/* Mutabakat & Teklifler */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "reconciliation_quote" ? "all" : "reconciliation_quote")}
          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === "reconciliation_quote" 
              ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              categoryFilter === "reconciliation_quote" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
            }`}>
              {isTr ? (isPortfolio ? "Cari Mutabakat" : "Mutabakat & Teklif") : "Recon & Quotes"}
            </span>
            <Scale className={`w-3.5 h-3.5 ${categoryFilter === "reconciliation_quote" ? "text-white" : "text-slate-600"}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-base sm:text-lg font-mono font-medium ${
              categoryFilter === "reconciliation_quote" ? "text-white" : "text-slate-900 dark:text-slate-100"
            }`}>{reconQuoteCount}</span>
            <span className={`text-[10px] ${categoryFilter === "reconciliation_quote" ? "text-slate-400" : "text-slate-500"}`}>{isTr ? "yanıt" : "responses"}</span>
          </div>
        </div>

        {/* GİB & Faturalar - Strictly hidden for Portfolio stores */}
        {!isPortfolio && (
          <div 
            onClick={() => setCategoryFilter(categoryFilter === "gib" ? "all" : "gib")}
            className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === "gib" 
                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-wider ${
                categoryFilter === "gib" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
              }`}>
                {isTr ? "GİB & Faturalar" : "GİB & Invoices"}
              </span>
              <CloudOff className={`w-3.5 h-3.5 ${categoryFilter === "gib" ? "text-white" : "text-slate-600"}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-base sm:text-lg font-mono font-medium ${
                categoryFilter === "gib" ? "text-white" : "text-slate-900 dark:text-slate-100"
              }`}>{gibCount}</span>
              <span className={`text-[10px] ${categoryFilter === "gib" ? "text-slate-400" : "text-slate-500"}`}>{isTr ? "fatura" : "invoices"}</span>
            </div>
          </div>
        )}

        {/* Stok & Tedarik - Strictly hidden for Portfolio stores */}
        {!isPortfolio && (
          <div 
            onClick={() => setCategoryFilter(categoryFilter === "order_stock" ? "all" : "order_stock")}
            className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === "order_stock" 
                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-wider ${
                categoryFilter === "order_stock" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
              }`}>
                {isTr ? "Stok & Tedarik" : "Stock & Supply"}
              </span>
              <PackageX className={`w-3.5 h-3.5 ${categoryFilter === "order_stock" ? "text-white" : "text-slate-600"}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-base sm:text-lg font-mono font-medium ${
                categoryFilter === "order_stock" ? "text-white" : "text-slate-900 dark:text-slate-100"
              }`}>{stockCount}</span>
              <span className={`text-[10px] ${categoryFilter === "order_stock" ? "text-slate-400" : "text-slate-500"}`}>{isTr ? "alarm" : "alerts"}</span>
            </div>
          </div>
        )}

        {/* Operasyonel Akış */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === "crm_hotel" ? "all" : "crm_hotel")}
          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            categoryFilter === "crm_hotel" 
              ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              categoryFilter === "crm_hotel" ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
            }`}>
              {isTr ? (isAutomotive ? "Filo, Evrak & CRM" : isRealEstate ? "Portföy & CRM Akışı" : "Operasyonel Akış") : "Operations Flow"}
            </span>
            <Activity className={`w-3.5 h-3.5 ${categoryFilter === "crm_hotel" ? "text-white" : "text-slate-600"}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-base sm:text-lg font-mono font-medium ${
              categoryFilter === "crm_hotel" ? "text-white" : "text-slate-900 dark:text-slate-100"
            }`}>{flowCount}</span>
            <span className={`text-[10px] ${categoryFilter === "crm_hotel" ? "text-slate-400" : "text-slate-500"}`}>{isTr ? "işlem" : "tasks"}</span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY FILTER TABS */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            categoryFilter === "all"
              ? "bg-slate-900 text-white shadow-2xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          {isTr ? `Tümü (${feed.length})` : `All (${feed.length})`}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("critical")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "critical"
              ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
              : "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50"
          }`}
        >
          <AlertOctagon className="w-3 h-3" />
          <span>{isTr ? "Kritik / Acil" : "Critical"}</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded font-mono font-medium bg-rose-500 text-white">
              {criticalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter("reconciliation_quote")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "reconciliation_quote"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
              : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50"
          }`}
        >
          <Scale className="w-3 h-3" />
          <span>{isTr ? "Mutabakat & Teklifler" : "Reconciliation & Quotes"}</span>
          {reconQuoteCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded font-mono font-medium bg-emerald-500 text-white">
              {reconQuoteCount}
            </span>
          )}
        </button>

        {!isPortfolio && (
          <button
            type="button"
            onClick={() => setCategoryFilter("gib")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
              categoryFilter === "gib"
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                : "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40 hover:bg-blue-50"
            }`}
          >
            <CloudOff className="w-3 h-3" />
            <span>{isTr ? "GİB & Faturalar" : "GİB & Invoices"}</span>
            {gibCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded font-mono font-medium bg-blue-100 text-blue-800">
                {gibCount}
              </span>
            )}
          </button>
        )}

        {!isPortfolio && (
          <button
            type="button"
            onClick={() => setCategoryFilter("order_stock")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
              categoryFilter === "order_stock"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50"
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>{isTr ? "Sipariş & Stok" : "Orders & Stock"}</span>
            {stockCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded font-mono font-medium bg-amber-500 text-slate-950">
                {stockCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setCategoryFilter("crm_hotel")}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
            categoryFilter === "crm_hotel"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
              : "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-50"
          }`}
        >
          {isAutomotive ? <Car className="w-3 h-3" /> : <Hotel className="w-3 h-3" />}
          <span>{isTr ? (isAutomotive ? "Filo, Evrak & CRM" : isRealEstate ? "Portföy & CRM" : "Rezervasyon & CRM") : "CRM & Operations"}</span>
          {flowCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded font-mono font-medium bg-indigo-100 text-indigo-800">
              {flowCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. NOTIFICATIONS FEED LIST */}
      <div className="space-y-1.5">
        {loading && feed.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">
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
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleAction(item)}
                className={`group bg-white dark:bg-slate-900 border rounded-xl py-2 px-3 sm:px-3.5 shadow-2xs transition-all flex items-center justify-between gap-2.5 text-xs cursor-pointer ${
                  isCritical 
                    ? "border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/25 hover:border-rose-300" 
                    : isWarning 
                    ? "border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/25 hover:border-amber-300" 
                    : isReconOrQuote
                    ? "border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50/25 hover:border-emerald-300"
                    : "border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Category Mini Icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    isCritical 
                      ? "bg-rose-50 text-rose-600 border-rose-200/80" 
                      : isWarning 
                      ? "bg-amber-50 text-amber-700 border-amber-200/80" 
                      : isReconOrQuote
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}>
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 break-words group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h3>

                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          {isTr ? "Kritik" : "Critical"}
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          {isTr ? "Bekliyor" : "Pending"}
                        </span>
                      ) : isReconOrQuote ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {isTr ? "Onaylandı" : "Confirmed"}
                        </span>
                      ) : null}

                      {item.count > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-medium shrink-0">
                          {item.count}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-none max-w-xl font-normal">
                      {item.description}
                    </p>

                    {/* Sub-item previews (compact inline tags) */}
                    {item.items && item.items.length > 0 && (
                      <div className="hidden xl:flex items-center gap-1 shrink-0">
                        {item.items.slice(0, 2).map((sub, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-[9px] font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate"
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.detail && (
                              <span className="text-slate-400 font-mono">({sub.detail})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Icon Button */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(item);
                    }}
                    title={item.actionText}
                    aria-label={item.actionText}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer shadow-2xs group-hover:scale-105 active:scale-95 ${
                      isCritical
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : isWarning
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : isReconOrQuote
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          /* 5. ALL SYSTEMS NORMAL & HEALTHY (EMPTY STATE) */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isTr ? "Tüm Sistemler Normal & Kusursuz" : "All Systems Operational & Synced"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-0.5 leading-relaxed">
                {isPortfolio
                  ? (isTr
                      ? "Bekleyen acil evrak/sigorta uyarısı, mutabakat uyuşmazlığı veya aksiyon bekleyen CRM talebi bulunmuyor."
                      : "No urgent fleet/portfolio alerts, reconciliation disputes, or pending CRM requests.")
                  : (isTr 
                      ? "Bekleyen acil web siparişi, GİB e-fatura hatası veya kritik stok alarmı bulunmuyor." 
                      : "No urgent orders, e-invoice errors, or low stock warnings.")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

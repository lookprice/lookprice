import React, { useState } from "react";
import { 
  Building2,
  TrendingUp,
  History,
  ArrowLeftRight,
  BarChart3,
  Download,
  Radio,
  Sparkles,
  Car,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageCircle,
  PhoneCall,
  Activity,
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { PortfolioAlerts } from "../../components/PortfolioAlerts";
import { PortfolioStrategicInsights } from "../../components/PortfolioStrategicInsights";

interface PortfolioAnalyticsTabProps {
  analytics: any;
  branding: any;
  loading?: boolean;
  onDateChange?: (start: string, end: string) => void;
  onNavigateTab?: (tab: string, status?: string) => void;
}

const PortfolioAnalyticsTab = ({ analytics, branding, loading, onDateChange, onNavigateTab }: PortfolioAnalyticsTabProps) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const [dateRange, setDateRange] = useState('this_month');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'activity' | 'audit'>('activity');

  const handleDateChange = (range: string) => {
    setDateRange(range);
    if (!onDateChange) return;
    
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    if (range === 'last_month') start.setMonth(start.getMonth() - 1);
    else if (range === 'last_3_months') start.setMonth(start.getMonth() - 3);
    else start.setDate(1);
    
    onDateChange(start.toISOString().split('T')[0], end);
  };

  const exportData = () => {
    console.log("Exporting portfolio data...", analytics);
    const content = JSON.stringify(analytics || {}, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredProperties = () => {
    if (!selectedStatus || !analytics?.properties) return [];
    if (selectedStatus === 'all') return analytics.properties;
    return analytics.properties.filter((p: any) => p.status === selectedStatus);
  };

  const isAutomotive = Boolean(
    branding?.store_type === 'motor_vehicle' || 
    branding?.store_type === 'automotive' || 
    branding?.store_type === 'gallery' || 
    branding?.store_type === 'car_dealer' ||
    branding?.page_layout_settings?.sector === 'automotive' ||
    branding?.page_layout_settings?.template === 'automotive'
  );

  const targetTab = isAutomotive ? 'fleet' : 'real_estate';
  const sectorTitle = isAutomotive 
    ? (isTr ? 'Oto Galeri & Filo Analitik Kokpiti' : 'Automotive Fleet Analytics')
    : (isTr ? 'Gayrimenkul & Portföy Analitik Kokpiti' : 'Real Estate Portfolio Analytics');

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin h-6 w-6 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  const activeCount = Number(analytics?.active_listings || analytics?.status_counts?.active || 0);
  const completedCount = Number(analytics?.completed_deals || analytics?.status_counts?.sold_or_rented || 0);
  const pendingCount = Number(analytics?.pending_tasks || 0);
  const totalCount = Number(analytics?.total_properties || (activeCount + completedCount));

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. FUTURISTIC COCKPIT HEADER */}
      <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            {isAutomotive ? <Car className="w-4 h-4 text-indigo-400" /> : <BarChart3 className="w-4 h-4 text-indigo-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                {sectorTitle}
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                {isTr ? 'Canlı Telemetri' : 'Live'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isAutomotive 
                ? (isTr ? 'Araç devir hızı, galeri ilan performansları ve ziyaretçi etkileşimi' : 'Fleet velocity, listing performance and visitor engagement')
                : (isTr ? 'Portföy devir hızı, mülk tıklamaları ve müşteri etkileşim radarı' : 'Turnover velocity, property clicks and buyer telemetry')}
            </p>
          </div>
        </div>

        {/* Date Filters & Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {onDateChange && (
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[10px]">
              <button
                type="button"
                onClick={() => handleDateChange('this_month')}
                className={`px-2 py-1 font-bold rounded-md transition-all cursor-pointer ${
                  dateRange === 'this_month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isTr ? 'Bu Ay' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => handleDateChange('last_month')}
                className={`px-2 py-1 font-bold rounded-md transition-all cursor-pointer ${
                  dateRange === 'last_month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isTr ? 'Son 1 Ay' : '1 Month'}
              </button>
              <button
                type="button"
                onClick={() => handleDateChange('last_3_months')}
                className={`px-2 py-1 font-bold rounded-md transition-all cursor-pointer ${
                  dateRange === 'last_3_months' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                {isTr ? '3 Ay' : '3 Months'}
              </button>
            </div>
          )}

          <button 
            type="button"
            onClick={exportData}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/70 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
            title={isTr ? 'Dışa Aktar (JSON)' : 'Export'}
          >
            <Download className="w-3 h-3 text-slate-300" />
            <span className="hidden sm:inline">{isTr ? 'Dışa Aktar' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE COMPACT HUD STAT CARDS (4 TILES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Tile 1: Active Listings */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab(targetTab, 'active')}
          className="p-3 sm:p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 shadow-2xs cursor-pointer hover:border-indigo-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              {isAutomotive ? (isTr ? 'Aktif Araçlar' : 'Active Fleet') : (isTr ? 'Aktif İlanlar' : 'Active Listings')}
            </span>
            <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {activeCount}
            </span>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{isTr ? 'Vitrin' : 'Live'}</span>
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-slate-500 truncate">
            {isTr ? 'Piyasadaki aktif portföyünüz' : 'Current active in market'}
          </div>
        </div>

        {/* Tile 2: Completed Deals */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('portfolio_finances')}
          className="p-3 sm:p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shadow-2xs cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
              {isTr ? 'Kapanan İşlemler' : 'Closed Deals'}
            </span>
            <div className="p-1 rounded-md bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {completedCount}
            </span>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{isTr ? 'Kasaya Giren' : 'Success'}</span>
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-slate-500 truncate">
            {isTr ? 'Satış & devir sonuçları' : 'Closed deals this period'}
          </div>
        </div>

        {/* Tile 3: Pending Tasks */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab(targetTab)}
          className="p-3 sm:p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-2xs cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider truncate">
              {isTr ? 'Bekleyen Görevler' : 'Pending Tasks'}
            </span>
            <div className="p-1 rounded-md bg-amber-500 text-slate-950 font-black shadow-2xs group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {pendingCount}
            </span>
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">{isTr ? 'Takipte' : 'Queue'}</span>
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-slate-500 truncate">
            {isTr ? 'İlgi bekleyen müşteri ve işler' : 'Items requiring action'}
          </div>
        </div>

        {/* Tile 4: Total Portfolio Volume */}
        <div 
          onClick={() => setSelectedStatus('all')}
          className="p-3 sm:p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-white shadow-2xs cursor-pointer hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {isTr ? 'Toplam Portföy' : 'Total Inventory'}
            </span>
            <div className="p-1 rounded-md bg-white/10 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg font-black font-mono tracking-tight text-white">
              {totalCount}
            </span>
            <span className="text-[9px] font-bold text-indigo-400 uppercase">{isTr ? 'Envanter' : 'Units'}</span>
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-slate-400 truncate">
            {isTr ? 'Tüm dönem kayıtları' : 'Overall inventory count'}
          </div>
        </div>
      </div>

      {/* 3. STATUS DISTRIBUTION STRIP (COMPACT PILLS) */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isTr ? 'Durum Dağılımı:' : 'Status Distribution:'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button 
            type="button"
            onClick={() => { setSelectedStatus('active'); }} 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>{isTr ? 'Aktif' : 'Active'}</span>
            <span className="font-mono font-black ml-0.5">{analytics?.status_counts?.active || activeCount}</span>
          </button>
          <button 
            type="button"
            onClick={() => { setSelectedStatus('optioned'); }} 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{isTr ? 'Opsiyonlu' : 'Optioned'}</span>
            <span className="font-mono font-black ml-0.5">{analytics?.status_counts?.optioned || 0}</span>
          </button>
          <button 
            type="button"
            onClick={() => { setSelectedStatus('sold_or_rented'); }} 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{isTr ? 'Satıldı / Kiralandı' : 'Sold/Rented'}</span>
            <span className="font-mono font-black ml-0.5">{analytics?.status_counts?.sold_or_rented || completedCount}</span>
          </button>
          <button 
            type="button"
            onClick={() => { setSelectedStatus('all'); }} 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>{isTr ? 'Tümü' : 'All'}</span>
            <span className="font-mono font-black ml-0.5">{totalCount}</span>
          </button>
        </div>
      </div>

      {/* 4. STRATEGIC INSIGHTS & RADAR ALERTS (SIDE BY SIDE 2-COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5">
        <PortfolioStrategicInsights insights={analytics?.strategic_insights} />
        <PortfolioAlerts alerts={analytics?.alerts || []} />
      </div>

      {/* 5. VISITOR TELEMETRY & CLICKS (LOOKPRICE TELEMETRY) */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                {isTr ? 'Ziyaretçi Etkileşimi & Tıklama Takibi (LookPrice Telemetry)' : 'Visitor Telemetry & Clicks'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isTr ? 'Canlı gösterim, detay inceleme ve müşteri iletişim sinyalleri' : 'Live impressions, detail views, and contact signals'}
              </p>
            </div>
          </div>
          <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/50 dark:border-indigo-800/50 px-2 py-0.5 rounded uppercase tracking-wider">
            {isTr ? 'Gerçek Zamanlı' : 'Real-Time'}
          </span>
        </div>

        {/* 4 Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase truncate">
              <Eye className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate">{isTr ? 'Gösterim' : 'Impressions'}</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {Number(analytics?.total_impressions || 0).toLocaleString('tr-TR')}
            </p>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase truncate">
              <BarChart3 className="w-3 h-3 text-purple-500 shrink-0" />
              <span className="truncate">{isTr ? 'Detay İnceleme' : 'Detail Views'}</span>
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {Number(analytics?.total_detail_views || 0).toLocaleString('tr-TR')}
            </p>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase truncate">
              <MessageCircle className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </div>
            <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {Number(analytics?.whatsapp_clicks || 0).toLocaleString('tr-TR')}
            </p>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase truncate">
              <PhoneCall className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate">{isTr ? 'Telefon Aramaları' : 'Calls'}</span>
            </div>
            <p className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
              {Number(analytics?.phone_clicks || 0).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        {/* Telemetry Chart */}
        {analytics?.daily_events && analytics.daily_events.length > 0 && (
          <div className="h-36 sm:h-40 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_events} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    padding: '8px'
                  }} 
                />
                <Area type="monotone" name={isTr ? 'Gösterim' : 'Impressions'} dataKey="impressions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorImp)" />
                <Area type="monotone" name={isTr ? 'Tıklama' : 'Clicks'} dataKey="clicks" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 6. BENTO GRID: PERFORMANCE TREND & (ACTIVITIES / AUDIT FEED) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5">
        {/* Left: Performance Trend Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{isTr ? 'Portföy Talep & Performans Trendi' : 'Demand & Performance Trend'}</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {isTr ? 'Mülk/araç taleplerinin zaman serisi ve hacim eğrisi' : 'Time-series volume and interest curves'}
              </p>
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              {isTr ? 'Trend Eğrisi' : 'Trend'}
            </span>
          </div>

          <div className="h-40 sm:h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.performance_chart_data || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '10px', 
                    fontWeight: 700 
                  }} 
                />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Tabbed Activities & Audit Log */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setRightPanelTab('activity')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  rightPanelTab === 'activity' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                {isTr ? 'Son Hareketler' : 'Activities'}
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('audit')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  rightPanelTab === 'audit' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                {isTr ? 'Denetim İzi' : 'Audit'}
              </button>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider font-mono">
              Live Feed
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 sm:max-h-44 overflow-y-auto pr-1 flex-1">
            {rightPanelTab === 'activity' ? (
              analytics?.recent_activities?.length > 0 ? (
                analytics.recent_activities.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{act.description}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{act.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4 text-[10px] text-slate-400 italic">
                  {isTr ? 'Henüz hareket kaydı yok.' : 'No recent activities.'}
                </div>
              )
            ) : (
              analytics?.audit_logs?.length > 0 ? (
                analytics.audit_logs.map((log: any, idx: number) => (
                  <div key={idx} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-0.5">
                      <span>{log.user || 'Operatör'}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{log.action}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4 text-[10px] text-slate-400 italic">
                  {isTr ? 'Kayıt bulunamadı.' : 'No audit records.'}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 7. VIEWPORT-FIT PROPERTY MODAL */}
      {selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-xl p-3 sm:p-4 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white capitalize">
                  {selectedStatus === 'all' ? (isTr ? 'Tüm Envanter' : 'All Listings') : selectedStatus} {targetTab === 'fleet' ? (isTr ? 'Araçlar' : 'Vehicles') : (isTr ? 'İlanlar' : 'Properties')}
                </h3>
                <span className="text-[9px] font-black font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                  {getFilteredProperties().length}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedStatus(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
              {getFilteredProperties().length > 0 ? getFilteredProperties().map((p: any, idx: number) => (
                <div key={idx} className="p-2 border border-slate-200/70 dark:border-slate-800 rounded-lg flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400">{p.location || p.model || (isTr ? 'Aktif Portföy' : 'Portfolio')}</p>
                  </div>
                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 shrink-0">{p.price}</span>
                </div>
              )) : (
                <p className="text-center py-6 text-slate-400 text-xs font-semibold">{isTr ? 'Sonuç bulunamadı.' : 'No results found.'}</p>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStatus(null)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
              >
                {isTr ? 'Kapat' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioAnalyticsTab;

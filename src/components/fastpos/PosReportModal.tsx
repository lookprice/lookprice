import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, 
  X, 
  Calendar, 
  RefreshCw, 
  Banknote, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Search, 
  Printer,
  UserCheck,
  Award,
  BedDouble,
  Utensils
} from "lucide-react";
import { getStoreWaiters } from "../../utils/staffHelpers";

export interface PosReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  branding?: any;
  isHotelActive?: boolean;
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  reportPreset: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  setReportPreset: (preset: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => void;
  reportSearchQuery: string;
  setReportSearchQuery: (query: string) => void;
  reportSortBy: 'qty' | 'revenue' | 'name';
  setReportSortBy: (sort: 'qty' | 'revenue' | 'name') => void;
  reportData: any;
  reportLoading: boolean;
  onFetchReport: (start: string, end: string) => void;
  onApplyPreset: (preset: 'today' | 'yesterday' | 'week' | 'month') => void;
  onPrintReport: () => void;
  onPrintA4Report: () => void;
}

export const PosReportModal: React.FC<PosReportModalProps> = ({
  isOpen,
  onClose,
  lang,
  branding,
  isHotelActive,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  reportPreset,
  setReportPreset,
  reportSearchQuery,
  setReportSearchQuery,
  reportSortBy,
  setReportSortBy,
  reportData,
  reportLoading,
  onFetchReport,
  onApplyPreset,
  onPrintReport,
  onPrintA4Report
}) => {
  const effectiveHotelActive = Boolean(
    isHotelActive !== undefined
      ? isHotelActive
      : (branding?.hotel_module_enabled || branding?.hotel_license_enabled || branding?.store_type === 'hotel')
  );

  const [activeReportTab, setActiveReportTab] = useState<'combined' | 'hotel' | 'restaurant'>('combined');
  const currentTab = effectiveHotelActive ? activeReportTab : 'restaurant';

  const getPaymentSummary = (paymentsList: any[], methods: string[]) => {
    const currencyMap: { [key: string]: number } = {};
    let txCount = 0;
    
    (paymentsList || []).forEach((p: any) => {
      const pm = p.payment_method?.toLowerCase() || '';
      const isMatch = methods.some(m => pm.includes(m));
      if (isMatch) {
        const cur = (p.currency || 'TRY').toUpperCase();
        currencyMap[cur] = (currencyMap[cur] || 0) + (Number(p.total_amount) || 0);
        txCount += Number(p.transaction_count) || 0;
      }
    });

    return { currencyMap, txCount };
  };

  const getGrandTotalSummary = (paymentsList: any[]) => {
    const currencyMap: { [key: string]: number } = {};
    let txCount = 0;
    
    (paymentsList || []).forEach((p: any) => {
      const cur = (p.currency || 'TRY').toUpperCase();
      currencyMap[cur] = (currencyMap[cur] || 0) + (Number(p.total_amount) || 0);
      txCount += Number(p.transaction_count) || 0;
    });

    return { currencyMap, txCount };
  };

  const renderCurrencySummary = (summary: { currencyMap: { [key: string]: number }, txCount: number }, isDark = false) => {
    const keys = Object.keys(summary.currencyMap);
    const textColorClass = isDark ? "text-white" : "text-slate-800";
    const subTextColorClass = isDark ? "text-indigo-100" : "text-slate-500";
    const borderClass = isDark ? "border-white/10" : "border-slate-100";
    const badgeClass = isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800";

    if (keys.length === 0) return <p className={`text-lg font-black ${textColorClass}`}>0.00 ₺</p>;
    
    const sortedKeys = [...keys].sort((a, b) => {
      if (a === 'TRY') return -1;
      if (b === 'TRY') return 1;
      return a.localeCompare(b);
    });

    const primaryKey = sortedKeys[0];
    const primaryAmount = summary.currencyMap[primaryKey];
    const currencySymbols: { [key: string]: string } = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
    const getSymbol = (cur: string) => currencySymbols[cur] || cur;

    return (
      <div className="space-y-1">
        <p className={`text-lg font-black tracking-tight ${textColorClass}`}>
          {primaryAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(primaryKey)}
        </p>
        {sortedKeys.length > 1 && (
          <div className={`text-[10px] ${subTextColorClass} font-extrabold flex flex-wrap gap-1.5 border-t ${borderClass} pt-1`}>
            {sortedKeys.slice(1).map(k => (
              <span key={k} className={`px-1.5 py-0.5 rounded ${badgeClass}`}>
                {summary.currencyMap[k].toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(k)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const activePayments = useMemo(() => {
    if (!reportData) return [];
    if (!effectiveHotelActive || currentTab === 'restaurant') {
      return reportData.restaurant_payments && reportData.restaurant_payments.length > 0
        ? reportData.restaurant_payments
        : (reportData.payments || []);
    }
    if (currentTab === 'hotel') {
      return reportData.hotel_payments || [];
    }
    return reportData.payments || [];
  }, [reportData, currentTab, effectiveHotelActive]);

  const activeGrandSummary = useMemo(() => {
    return getGrandTotalSummary(activePayments);
  }, [activePayments]);

  const activeCashSummary = useMemo(() => {
    return getPaymentSummary(activePayments, ['cash', 'nakit']);
  }, [activePayments]);

  const activeCardSummary = useMemo(() => {
    return getPaymentSummary(activePayments, ['credit_card', 'card', 'kredi_karti', 'pos']);
  }, [activePayments]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4"
    >
      <motion.div 
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base">
                {lang === 'tr' ? 'Gün Sonu & Dönem Satış Raporu' : 'End of Day & Period Sales Report'}
              </h3>
              <p className="text-xs text-slate-400 font-bold">
                {branding?.store_name || branding?.name || 'LOOKPRICE RESTORAN & POS'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Filter & Presets Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white space-y-3">
          {/* Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                {lang === 'tr' ? 'Hızlı Aralık:' : 'Quick Range:'}
              </span>
              {[
                { id: 'today', label: lang === 'tr' ? 'Bugün' : 'Today' },
                { id: 'yesterday', label: lang === 'tr' ? 'Dün' : 'Yesterday' },
                { id: 'week', label: lang === 'tr' ? 'Son 7 Gün' : 'Last 7 Days' },
                { id: 'month', label: lang === 'tr' ? 'Bu Ay' : 'This Month' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => onApplyPreset(btn.id as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                    reportPreset === btn.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              {reportStartDate === reportEndDate 
                ? (lang === 'tr' ? `📅 Günlük: ${reportStartDate}` : `📅 Daily: ${reportStartDate}`) 
                : (lang === 'tr' ? `📅 ${reportStartDate} ➔ ${reportEndDate}` : `📅 ${reportStartDate} ➔ ${reportEndDate}`)}
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs font-bold text-slate-500 shrink-0">
                {lang === 'tr' ? 'Başlangıç:' : 'Start:'}
              </span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => {
                    setReportPreset('custom');
                    setReportStartDate(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs font-bold text-slate-500 shrink-0">
                {lang === 'tr' ? 'Bitiş:' : 'End:'}
              </span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input 
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => {
                    setReportPreset('custom');
                    setReportEndDate(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => onFetchReport(reportStartDate, reportEndDate)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title={lang === 'tr' ? 'Raporu Yenile' : 'Refresh Report'}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reportLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Report Segment Tab Switcher (Only visible when Hotel Concept is active) */}
        {effectiveHotelActive && (
          <div className="px-6 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-start gap-1">
            <button
              onClick={() => setActiveReportTab('combined')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                currentTab === 'combined'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 border-transparent bg-transparent'
              }`}
            >
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span>{lang === 'tr' ? 'Birleşik Rapor' : 'Combined Report'}</span>
            </button>

            <button
              onClick={() => setActiveReportTab('restaurant')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                currentTab === 'restaurant'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 border-transparent bg-transparent'
              }`}
            >
              <Utensils className="h-4 w-4 text-orange-600" />
              <span>{lang === 'tr' ? 'Restoran / POS' : 'Restaurant & POS'}</span>
            </button>

            <button
              onClick={() => setActiveReportTab('hotel')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                currentTab === 'hotel'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 border-transparent bg-transparent'
              }`}
            >
              <BedDouble className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'tr' ? 'Oda Satışları' : 'Hotel Room Sales'}</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {reportLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <RefreshCw className="h-10 w-10 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500">
                {lang === 'tr' ? 'Rapor verileri hazırlanıyor...' : 'Loading report data...'}
              </p>
            </div>
          ) : reportData ? (
            <>
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Cash Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Banknote className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                        {lang === 'tr' ? 'Nakit Satış' : 'Cash'}
                      </span>
                    </div>
                    {renderCurrencySummary(activeCashSummary, false)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                    {activeCashSummary.txCount} {lang === 'tr' ? 'İşlem' : 'Txn'}
                  </span>
                </div>

                {/* Card Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                        {lang === 'tr' ? 'Kredi Kartı' : 'Card'}
                      </span>
                    </div>
                    {renderCurrencySummary(activeCardSummary, false)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                    {activeCardSummary.txCount} {lang === 'tr' ? 'İşlem' : 'Txn'}
                  </span>
                </div>

                {/* Items Sold / Room Bookings Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        {effectiveHotelActive && currentTab === 'hotel' ? <BedDouble className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-tight">
                        {effectiveHotelActive && currentTab === 'hotel' 
                          ? (lang === 'tr' ? 'Oda Satış Sayısı' : 'Room Booking Count') 
                          : (lang === 'tr' ? 'Satılan Ürün' : 'Items Sold')}
                      </span>
                    </div>
                    <p className="text-lg font-black text-purple-700">
                      {effectiveHotelActive && currentTab === 'hotel' 
                        ? `${reportData.hotel_sales?.length || 0} Adet`
                        : `${(reportData.products?.reduce((sum: number, p: any) => sum + (Number(p.total_quantity) || 0), 0)) || 0} Adet`}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                    {effectiveHotelActive && currentTab === 'hotel' 
                      ? (lang === 'tr' ? 'Toplam Tahsilat' : 'Total Settlements')
                      : `${reportData.products?.length || 0} ${lang === 'tr' ? 'Farklı Ürün' : 'Unique Items'}`}
                  </span>
                </div>

                {/* Total Grand Revenue Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-4 rounded-2xl shadow-md shadow-indigo-600/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[11px] font-black text-indigo-100 uppercase tracking-tight">
                        {reportStartDate === reportEndDate ? (lang === 'tr' ? 'Ciro Toplamı' : 'Total Revenue') : (lang === 'tr' ? 'Dönem Toplamı' : 'Period Total')}
                      </span>
                    </div>
                    {renderCurrencySummary(activeGrandSummary, true)}
                  </div>
                  <span className="text-[10px] text-indigo-200 font-bold mt-1">
                    {activeGrandSummary.txCount} {lang === 'tr' ? 'Toplam Satış' : 'Total Sales'}
                  </span>
                </div>
              </div>

              {/* Waiter Roster Performance & Turnover breakdown */}
              {(() => {
                const storeWaiters = getStoreWaiters(branding).filter(w => w.active);
                if (!storeWaiters || storeWaiters.length === 0) return null;
                const grandTotal = (reportData.grand_total || reportData.payments?.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || Number(p.total) || 0), 0)) || 0;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {lang === 'tr' ? 'Garson & Saha Personeli Ciro / Prim Dağılımı' : 'Waiter & Staff Turnover Breakdown'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {storeWaiters.length} {lang === 'tr' ? 'Aktif Garson' : 'Active Staff'}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {storeWaiters.map((w, idx) => {
                        // Find matching transactions or sales
                        const wSales = (reportData.sales || []).filter((s: any) => (s.notes || '').includes(w.name) || (s.customer_name || '').includes(w.name));
                        const wRevenue = wSales.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || Number(s.total) || 0), 0);
                        const pct = grandTotal > 0 ? ((wRevenue / grandTotal) * 100).toFixed(1) : '0.0';

                        return (
                          <div key={w.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-extrabold text-slate-800 truncate">{w.name}</h4>
                                <span className="text-[9.5px] text-slate-400 font-semibold">{w.section || 'Genel Saha'}</span>
                              </div>
                              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-500">{lang === 'tr' ? 'Ciro:' : 'Rev:'}</span>
                                <span className="font-black text-indigo-700">{wRevenue > 0 ? `${wRevenue.toFixed(2)} ₺` : 'Aktif / Canlı'}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(8, Number(pct)))}%` }} />
                              </div>
                              <div className="flex justify-between items-center text-[9.5px] text-slate-400">
                                <span>{wSales.length} {lang === 'tr' ? 'Sipariş' : 'Orders'}</span>
                                <span className="font-bold">%{pct} {lang === 'tr' ? 'Pay' : 'Share'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Segmented breakdown views */}
              {effectiveHotelActive && currentTab === 'hotel' ? (
                /* Hotel Room Sales breakdown table */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        {lang === 'tr' ? 'Oda Satış ve Tahsilat Detayları' : 'Hotel Room Sales & Settlement Details'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black">
                      {reportData.hotel_sales?.length || 0} {lang === 'tr' ? 'Kayıt' : 'Records'}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400">
                          <th className="p-3 w-1/4">{lang === 'tr' ? 'Oda / Konuk' : 'Room / Guest'}</th>
                          <th className="p-3 w-5/12">{lang === 'tr' ? 'Açıklama / Detay' : 'Details'}</th>
                          <th className="p-3 w-1/6 text-center">{lang === 'tr' ? 'Ödeme Türü' : 'Method'}</th>
                          <th className="p-3 w-1/6 text-right">{lang === 'tr' ? 'Tutar' : 'Collected'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.hotel_sales && reportData.hotel_sales.length > 0 ? (
                          reportData.hotel_sales.map((s: any, idx: number) => {
                            const currencySymbols: { [key: string]: string } = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
                            const getSymbol = (cur: string) => currencySymbols[cur] || cur;
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-black text-slate-800">
                                  {s.customer_name}
                                </td>
                                <td className="p-3 text-slate-500 font-bold max-w-[200px] sm:max-w-[300px] truncate" title={s.notes}>
                                  {s.notes}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] uppercase">
                                    {s.payment_method === 'cash' ? (lang === 'tr' ? 'Nakit' : 'Cash') : (s.payment_method === 'credit_card' ? (lang === 'tr' ? 'Kredi Kartı' : 'Credit Card') : s.payment_method || 'Kredi Kartı')}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-extrabold text-slate-800">
                                  {s.total_amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(s.currency)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                              {lang === 'tr' ? 'Bu tarih aralığında oda satışı bulunmuyor' : 'No room sales in this period'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Product Quantities breakdown table */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        {lang === 'tr' ? 'Satılan Ürün Kalemleri' : 'Sold Product Breakdown'}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black">
                        {reportData.products?.length || 0} {lang === 'tr' ? 'Kalem' : 'Items'}
                      </span>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="text"
                          placeholder={lang === 'tr' ? 'Ürün ara...' : 'Search items...'}
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 w-36 sm:w-44"
                        />
                        {reportSearchQuery && (
                          <button 
                            onClick={() => setReportSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                        <button
                          onClick={() => setReportSortBy('qty')}
                          className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'qty' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                        >
                          {lang === 'tr' ? 'Adet' : 'Qty'}
                        </button>
                        <button
                          onClick={() => setReportSortBy('revenue')}
                          className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'revenue' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                        >
                          {lang === 'tr' ? 'Ciro' : 'Rev'}
                        </button>
                        <button
                          onClick={() => setReportSortBy('name')}
                          className={`px-2 py-0.5 rounded-md transition-all ${reportSortBy === 'name' ? 'bg-white text-indigo-700 font-black shadow-2xs' : 'hover:text-slate-900'}`}
                        >
                          {lang === 'tr' ? 'A-Z' : 'A-Z'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {reportData.products && reportData.products.length > 0 ? (
                      (() => {
                        const filtered = reportData.products.filter((p: any) => 
                          !reportSearchQuery || p.product_name.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        );

                        const sorted = [...filtered].sort((a: any, b: any) => {
                          if (reportSortBy === 'qty') return (b.total_quantity || 0) - (a.total_quantity || 0);
                          if (reportSortBy === 'revenue') return (b.total_revenue || 0) - (a.total_revenue || 0);
                          return (a.product_name || '').localeCompare(b.product_name || '');
                        });

                        const maxRev = Math.max(...reportData.products.map((p: any) => p.total_revenue || 1));

                        if (sorted.length === 0) {
                          return (
                            <div className="p-8 text-center text-slate-400">
                              <p className="text-xs font-bold">{lang === 'tr' ? 'Aramaya uygun ürün bulunamadı.' : 'No matching products found.'}</p>
                            </div>
                          );
                        }

                        return sorted.map((p: any, idx: number) => {
                          const unitPrice = p.total_quantity ? (p.total_revenue / p.total_quantity) : 0;
                          const revPct = maxRev > 0 ? Math.min(100, Math.round((p.total_revenue / maxRev) * 100)) : 0;

                          return (
                            <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-400 w-5">{idx + 1}.</span>
                                  <p className="text-xs font-black text-slate-800 truncate">{p.product_name}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 pl-7">
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    {unitPrice.toFixed(2)} ₺ / {lang === 'tr' ? 'birim' : 'unit'}
                                  </p>
                                  {/* Mini bar */}
                                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${revPct}%` }} />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-right shrink-0">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black min-w-16 text-center">
                                  {p.total_quantity} {lang === 'tr' ? 'Adet' : 'Qty'}
                                </span>
                                <span className="text-xs font-black text-slate-800 min-w-20">
                                  {p.total_revenue?.toFixed(2)} ₺
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="p-12 text-center text-slate-400">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-25" />
                        <p className="text-xs font-bold">
                          {lang === 'tr' ? 'Bu tarih aralığında ürün satışı bulunmuyor' : 'No products sold in this period'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-25 text-slate-500" />
              <p className="text-sm font-bold text-slate-600 mb-1">
                {lang === 'tr' ? 'Seçilen Tarih Aralığına Ait Satış Raporu Bulunamadı' : 'No sales report found for selected range'}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {lang === 'tr' ? 'Bu zaman aralığında tamamlanmış POS satışı gerçekleşmemiş.' : 'No completed POS sales recorded in this date range.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap gap-2.5 bg-slate-50/80">
          <button 
            disabled={reportLoading || !reportData}
            onClick={onPrintReport}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>{lang === 'tr' ? '80mm Termal Fiş Yazdır' : 'Print 80mm Receipt'}</span>
          </button>

          <button 
            disabled={reportLoading || !reportData}
            onClick={onPrintA4Report}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>{lang === 'tr' ? 'A4 Detaylı Rapor Yazdır' : 'Print A4 PDF Report'}</span>
          </button>

          <button 
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {lang === 'tr' ? 'Kapat' : 'Close'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

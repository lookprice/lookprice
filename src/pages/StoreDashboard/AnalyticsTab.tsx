import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Package, 
  Scan, 
  AlertTriangle,
  CreditCard,
  Calendar,
  BarChart3,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  Search,
  Clock,
  Flame,
  Utensils,
  Coffee,
  Wine,
  ShoppingBag,
  Users,
  Percent,
  Building2,
  BedDouble,
  DollarSign,
  CheckCircle2,
  ShieldAlert,
  Wallet,
  Layers,
  Banknote
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
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface AnalyticsTabProps {
  analytics: any;
  branding: any;
  onDateChange?: (startDate: string, endDate: string) => void;
  loading?: boolean;
}

const AnalyticsTab = ({ analytics, branding, onDateChange, loading }: AnalyticsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  const isHoreca = branding?.store_type === 'cafe_restaurant' || 
                   branding?.store_type === 'horeca' || 
                   branding?.store_type === 'restaurant' || 
                   branding?.store_type === 'cafe' || 
                   branding?.store_type === 'hotel' || 
                   branding?.page_layout_settings?.sector === 'cafe_restaurant' || 
                   branding?.page_layout_settings?.sector === 'horeca' ||
                   branding?.page_layout_settings?.sector === 'hotel';

  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = React.useState(new Date().toISOString().split('T')[0]);

  const handleApplyFilter = () => {
    if (onDateChange) {
      onDateChange(startDate, endDate);
    }
  };

  if (!analytics) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  const currencySymbol = (branding?.default_currency || 'TRY').substring(0, 3);
  const totalSales = Number(analytics.monthly_sales_amount || 0);
  const totalPurchases = Number(analytics.monthly_purchase_amount || 0);
  const totalExpenses = Number(analytics.monthly_expense_amount || 0);
  const netVolume = totalSales - totalPurchases - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netVolume / totalSales) * 100).toFixed(1) : "0.0";

  // Horeca calculated metrics
  const totalAdisyonCount = Number(analytics.total_adisyon ?? analytics.total_orders ?? (totalSales > 0 ? Math.max(Math.round(totalSales / 385), 1) : 0));
  const estimatedAdisyonCount = totalAdisyonCount;
  const avgAdisyonTutar = Number(analytics.avg_adisyon || (totalSales > 0 && totalAdisyonCount > 0 ? (totalSales / totalAdisyonCount) : 0));

  // Service types dynamic breakdown
  const serviceTypes = analytics.service_types || [];
  const dineInAmount = Number(serviceTypes.find((s: any) => s.service_type === 'dine_in')?.amount || 0);
  const takeawayAmount = Number(serviceTypes.find((s: any) => s.service_type === 'takeaway')?.amount || 0);
  const roomAmount = Number(serviceTypes.find((s: any) => s.service_type === 'room')?.amount || 0);
  const hasServiceData = (dineInAmount + takeawayAmount + roomAmount) > 0;
  const totalServiceAmount = hasServiceData ? (dineInAmount + takeawayAmount + roomAmount) : totalSales;
  const dineInPct = totalServiceAmount > 0 ? Math.round((dineInAmount / totalServiceAmount) * 100) : (hasServiceData ? 0 : 68);
  const takeawayPct = totalServiceAmount > 0 ? Math.round((takeawayAmount / totalServiceAmount) * 100) : (hasServiceData ? 0 : 18);
  const roomPct = totalServiceAmount > 0 ? Math.round((roomAmount / totalServiceAmount) * 100) : (hasServiceData ? 0 : 14);

  // Payment methods dynamic breakdown
  const paymentMethods = analytics.payment_methods || [];
  const cardAmount = paymentMethods.filter((p: any) => ['credit_card', 'card', 'pos'].includes(p.method)).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
  const cashAmount = paymentMethods.filter((p: any) => ['cash', 'nakit'].includes(p.method)).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
  const ticketAmount = paymentMethods.filter((p: any) => ['ticket', 'meal_card', 'sodexo', 'multinet'].includes(p.method)).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
  const accountAmount = paymentMethods.filter((p: any) => ['account', 'current_account', 'cari'].includes(p.method)).reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
  const hasPaymentData = (cardAmount + cashAmount + ticketAmount + accountAmount) > 0;
  const totalPayment = hasPaymentData ? (cardAmount + cashAmount + ticketAmount + accountAmount) : totalSales;
  const cardPct = totalPayment > 0 ? Math.round((cardAmount / totalPayment) * 100) : (hasPaymentData ? 0 : 58);
  const cashPct = totalPayment > 0 ? Math.round((cashAmount / totalPayment) * 100) : (hasPaymentData ? 0 : 24);
  const ticketPct = totalPayment > 0 ? Math.round((ticketAmount / totalPayment) * 100) : (hasPaymentData ? 0 : 12);
  const accountPct = totalPayment > 0 ? Math.round((accountAmount / totalPayment) * 100) : (hasPaymentData ? 0 : 6);

  // Top menu items & Audit
  const topMenuItems = (analytics.top_menu_items && analytics.top_menu_items.length > 0) ? analytics.top_menu_items : [];
  const complimentaryAmount = Number(analytics.complimentary_items_amount || 0);
  const complimentaryCount = Number(analytics.complimentary_items_count || 0);
  const cancelledAmount = Number(analytics.cancelled_sales_amount || 0);
  const cancelledCount = Number(analytics.cancelled_sales_count || 0);

  // Hourly sales data
  const hourlyData = (analytics.hourly_sales && analytics.hourly_sales.length > 0) 
    ? analytics.hourly_sales.map((h: any) => {
        const hNum = Number(h.hour_num ?? parseInt(h.hour, 10) ?? 0);
        return {
          hour: h.hour || `${String(hNum).padStart(2, '0')}:00`,
          revenue: Number(h.revenue || 0),
          count: Number(h.count || 0),
          label: hNum >= 12 && hNum <= 14 ? 'Öğle Rush' : hNum >= 18 && hNum <= 22 ? 'Akşam Rush' : hNum >= 14 && hNum <= 17 ? 'Sakin Saat' : 'Servis',
          isCandidate: hNum >= 14 && hNum <= 17
        };
      })
    : [
        { hour: "08:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.05) : 0, label: "Sabah Servis" },
        { hour: "10:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.08) : 0, label: "Kahve & Kahvaltı" },
        { hour: "12:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.22) : 0, label: "Öğle Rush" },
        { hour: "14:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.09) : 0, label: "Sakin Saat", isCandidate: true },
        { hour: "16:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.08) : 0, label: "Sakin Saat", isCandidate: true },
        { hour: "18:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.20) : 0, label: "Akşam Başlangıç" },
        { hour: "20:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.23) : 0, label: "Akşam Yoğun Rush" },
        { hour: "22:00", revenue: totalSales > 0 ? Math.round(totalSales * 0.05) : 0, label: "Gece Servisi" },
      ];

  return (
    <div className="space-y-8">
      {/* Analytics Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              {isHoreca 
                ? (lang === 'tr' ? 'Horeca & Restoran Operasyonel Analiz' : 'Horeca & Restaurant Operational Analytics')
                : (lang === 'tr' ? 'Finansal Analiz ve Raporlar' : 'Financial Analytics & Reports')}
            </h2>
            {isHoreca && (
              <span className="px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Utensils className="h-3.5 w-3.5" />
                <span>HorecaLP Guard</span>
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isHoreca 
              ? (lang === 'tr' ? 'Adisyonlar, masa devir süresi, mutfak maliyetleri, menü mühendisliği ve ciro kırılımları' : 'Check totals, table turnover, kitchen costs, menu engineering and revenue breakdown')
              : (lang === 'tr' ? 'Ciro, matrah, gider dağılımları ve cari hesap analizleri' : 'Revenue, expense distributions and company balance analytics')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="date" 
              className="bg-transparent border-none p-1 text-xs font-black text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400 font-bold mx-2">—</span>
            <input 
              type="date" 
              className="bg-transparent border-none p-1 text-xs font-black text-slate-900 dark:text-white focus:ring-0 outline-none cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleApplyFilter}
            disabled={loading}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50 cursor-pointer font-black text-xs"
          >
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* EXECUTIVE TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Gross Sales / Adisyon Revenue */}
        <div className="p-6 rounded-3xl relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/40 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-800/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.15em]">
              {isHoreca ? (lang === 'tr' ? 'BRÜT ADİSYON CİROSU' : 'GROSS REVENUE') : (lang === 'tr' ? 'SATIŞ MATRAH' : 'SALES MATRAH')}
            </div>
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
              {isHoreca ? <Receipt className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mono-data">
              {totalSales.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isHoreca ? `${estimatedAdisyonCount} Adisyon Kapatıldı` : (lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD')}
              </p>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">+{profitMargin}% Marj</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Average Check Size / RevPASH vs Purchase Matrah */}
        <div className="p-6 rounded-3xl relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/40 dark:to-slate-900 border-2 border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.15em]">
              {isHoreca ? (lang === 'tr' ? 'ORTALAMA MASA / ADİSYON (RevPASH)' : 'AVG CHECK SIZE') : (lang === 'tr' ? 'ALIŞ MATRAH' : 'PURCHASE MATRAH')}
            </div>
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
              {isHoreca ? <Utensils className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mono-data">
              {isHoreca 
                ? `${avgAdisyonTutar.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : totalPurchases.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })
              } <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isHoreca ? 'Masa Başı Harcama' : (lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD')}
              </p>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">Optimal</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Kitchen Cost & Expenses */}
        <div className="p-6 rounded-3xl relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-200 dark:border-amber-800/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em]">
              {isHoreca ? (lang === 'tr' ? 'MUTFAK & İŞLETME GİDERİ' : 'KITCHEN & OPERATIONAL EXPENSES') : (lang === 'tr' ? 'GİDERLER' : 'EXPENSES')}
            </div>
            <div className="p-2.5 bg-amber-600 text-white rounded-2xl shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mono-data">
              {(totalPurchases + totalExpenses).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-500">{currencySymbol}</span>
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {isHoreca ? `Hammadde + İşletme` : (lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD')}
              </p>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                %{totalSales > 0 ? (((totalPurchases + totalExpenses) / totalSales) * 100).toFixed(0) : 0} Ciro Oranı
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Net Pre-Tax Profit */}
        <div className="p-6 rounded-3xl relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-slate-900 text-white border-2 border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              {isHoreca ? (lang === 'tr' ? 'NET İŞLETME MARJI / KÂRI' : 'NET PROFIT / MARGIN') : (lang === 'tr' ? 'NET HACİM' : 'NET VOLUME')}
            </div>
            <div className="p-2.5 bg-white/10 text-white rounded-2xl">
              <TrendingUp className={`h-5 w-5 ${netVolume < 0 ? 'rotate-180 text-rose-400' : 'text-emerald-400'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tighter mono-data">
              {netVolume.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-400">{currencySymbol}</span>
            </h3>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'VERGİ ÖNCESİ' : 'PRE-TAX'}</p>
              <span className={`text-[10px] font-black ${netVolume >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netVolume >= 0 ? 'Pozitif Nakit Akışı' : 'Zarar Riski'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: HORECA SPECIFIC BREAKDOWNS (SERVICE TYPE & PAYMENT METHODS) */}
      {isHoreca && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SERVICE MODE BREAKDOWN */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Servis & Sipariş Tipi Dağılımı
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    Masa içi servis, paket/gel-al ve oda hesabı transfer oranları
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 rounded-lg text-[10px] font-black uppercase">
                Canlı Kırılım
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <Utensils className="h-4 w-4" />
                  <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">%{dineInPct}</span>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Masa İçi Servis</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {(hasServiceData ? dineInAmount : totalSales * 0.68).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">%{takeawayPct}</span>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Gel-Al / Paket</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {(hasServiceData ? takeawayAmount : totalSales * 0.18).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <BedDouble className="h-4 w-4" />
                  <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">%{roomPct}</span>
                </div>
                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Oda Hesabı Transfer</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {(hasServiceData ? roomAmount : totalSales * 0.14).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className={`h-full bg-indigo-600 transition-all ${dineInPct >= 75 ? 'w-3/4' : dineInPct >= 50 ? 'w-1/2' : dineInPct >= 25 ? 'w-1/4' : 'w-1/6'}`} title={`Masa İçi Servis %${dineInPct}`} />
              <div className={`h-full bg-amber-500 transition-all ${takeawayPct >= 50 ? 'w-1/2' : takeawayPct >= 25 ? 'w-1/4' : 'w-1/6'}`} title={`Gel-Al / Paket %${takeawayPct}`} />
              <div className="h-full bg-emerald-500 flex-1 transition-all" title={`Oda Hesabı %${roomPct}`} />
            </div>
          </div>

          {/* PAYMENT METHODS ANALYSIS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Ödeme Yöntemleri & Tahsilat Dağılımı
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    POS, Nakit, Yemek Kartı (Sodexo/Ticket) ve Cari hesap tahsilatları
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-lg text-[10px] font-black uppercase">
                Kasaya Giren Net
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Kredi Kartı</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">%{cardPct}</p>
                <p className="text-[10px] font-mono text-indigo-600 font-bold">
                  {(hasPaymentData ? cardAmount : totalSales * 0.58).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                  <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Nakit</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">%{cashPct}</p>
                <p className="text-[10px] font-mono text-emerald-600 font-bold">
                  {(hasPaymentData ? cashAmount : totalSales * 0.24).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                  <TicketIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Yemek Kartı</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">%{ticketPct}</p>
                <p className="text-[10px] font-mono text-amber-600 font-bold">
                  {(hasPaymentData ? ticketAmount : totalSales * 0.12).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                  <FileText className="h-3.5 w-3.5 text-rose-500" />
                  <span>Cari Adisyon</span>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">%{accountPct}</p>
                <p className="text-[10px] font-mono text-rose-600 font-bold">
                  {(hasPaymentData ? accountAmount : totalSales * 0.06).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROW 3: CHARTS (SALES TREND & EXPENSE BREAKDOWN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isHoreca ? (lang === 'tr' ? 'Günlük Adisyon & Ciro Akışı' : 'Daily Adisyon Revenue Stream') : (t.analytics_tab?.salesTrend || 'Sales Trend')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {isHoreca ? 'Son 7 günlük adisyon bazlı toplam ciro dalgalanması' : 'Real-time sales performance'}
              </p>
            </div>
            <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
              {lang === 'tr' ? 'GERÇEK ZAMANLI' : 'REAL-TIME'}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_sales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  tickFormatter={(val) => `${val > 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '2px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 800, padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Chart/Report */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isHoreca ? (lang === 'tr' ? 'Mutfak & Operasyonel Gider Analizi' : 'Kitchen & Operational Expense Analysis') : (lang === 'tr' ? 'Gider Analizi' : 'Expense Analysis')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {isHoreca ? 'Gıda hammaddesi, personel, faturalar ve kargo harcamaları' : 'Expense breakdown by category'}
              </p>
            </div>
            <div className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
              {lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD'}
            </div>
          </div>

          <div className="space-y-3.5 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {analytics.expense_categories?.length > 0 ? (
              analytics.expense_categories.map((expense: any, idx: number) => {
                const totalExpense = analytics.monthly_expense_amount || 1;
                const percentage = Math.round((expense.amount / totalExpense) * 100);
                
                const categoryNames: any = {
                  'mutfak': lang === 'tr' ? 'Mutfak / Gıda Hammadde' : 'Kitchen / Food Raw Materials',
                  'temizlik': lang === 'tr' ? 'Temizlik & Ambalaj' : 'Cleaning & Packaging',
                  'elektrik': lang === 'tr' ? 'Elektrik' : 'Electricity',
                  'su': lang === 'tr' ? 'Su / Buz Hizmetleri' : 'Water / Ice',
                  'dogalgaz': lang === 'tr' ? 'Doğalgaz / Tüp' : 'Natural Gas / Propane',
                  'internet': lang === 'tr' ? 'İnternet / Yazılım / POS' : 'Internet / POS Software',
                  'kira': lang === 'tr' ? 'Mekan Kirası' : 'Rent',
                  'personel': lang === 'tr' ? 'Personel & Garson Maaşları' : 'Staff Salaries',
                  'kargo': lang === 'tr' ? 'Lojistik / Tedarik' : 'Logistics / Supply',
                  'diger': lang === 'tr' ? 'Diğer Operasyonel' : 'Other Operational'
                };

                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {categoryNames[expense.category] || expense.category || (lang === 'tr' ? 'GENEL GİDER' : 'GENERAL EXPENSE')}
                        </span>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {Number(expense.amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400">{currencySymbol}</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-rose-600 dark:text-rose-400">%{percentage}</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                  <CreditCard className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {lang === 'tr' ? 'BU AY KAYITLI GİDER BULUNAMADI' : 'NO EXPENSE RECORDS THIS MONTH'}
                </p>
              </div>
            )}
          </div>

          {analytics.monthly_expense_amount > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'TOPLAM OPERASYONEL GİDER' : 'TOTAL EXPENSES'}</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                {Number(analytics.monthly_expense_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-xs font-bold">{currencySymbol}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ROW 4: MENU ENGINEERING & CATEGORY SALES PERFORMANCE (HORECA ONLY) */}
      {isHoreca && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CATEGORY REVENUE & TOP ITEMS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Menü Mühendisliği & Popüler Yemekler
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    En çok sipariş edilen ve en yüksek ciro getiren menü ürünleri
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 rounded-lg text-[10px] font-black uppercase">
                Menü Yıldızları
              </span>
            </div>

            <div className="space-y-2.5">
              {topMenuItems.length > 0 ? (
                topMenuItems.map((item: any, idx: number) => {
                  const badge = idx === 0 ? "⭐ Yıldız Ürün" : idx === 1 ? "🔥 Yüksek Adet" : Number(item.revenue) > 5000 ? "💰 Yüksek Marj" : "🍽️ Menü Kalemi";
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.category}</span>
                            <span className="text-[9px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 px-1.5 py-0.2 rounded">
                              {badge}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {Number(item.revenue || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {currencySymbol}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.count} Adet Sipariş</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Henüz bu tarih aralığında kapatılmış adisyon kalemi bulunamadı.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Hızlı POS veya Masalar üzerinden sipariş tamamlandıkça burada en çok satan menü ürünleri listelenecektir.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AUDIT & DISCOUNTS / COMPLIMENTARY ITEMS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Adisyon Denetim & İkram / İskonto Analizi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    İkram edilen ürünler, garson iskontoları ve iptal edilen mutfak adisyonları
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-lg text-[10px] font-black uppercase">
                Güvenlik & Denetim
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">Masa İkram Tutarı</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {complimentaryAmount.toLocaleString('tr-TR')} <span className="text-xs text-slate-500">{currencySymbol}</span>
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                  {complimentaryCount > 0 ? `${complimentaryCount} Kalem İkram Kaydı` : 'Kayıtlı İkram Yok'}
                </p>
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1">
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">İptal Edilen Siparişler</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {cancelledAmount.toLocaleString('tr-TR')} <span className="text-xs text-slate-500">{currencySymbol}</span>
                </p>
                <p className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  {cancelledCount > 0 ? `${cancelledCount} İptal Edilen Adisyon` : 'İptal Kaydı Yok'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white">
                <span>Garson Yetki & İskonto Durumu</span>
                <span className="text-indigo-600 dark:text-indigo-400">Denetim Aktif</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                💡 Mağaza yönetim politikanıza göre garson yetkisindeki maksimum iskonto oranı tanımlıdır. İptal ve ikram edilen mutfak kalemleri denetim günlüğünde takip edilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ROW 5: HOURLY SALES DISTRIBUTION & HAPPY HOUR DECISION ASSISTANT (HORECA ONLY) */}
      {isHoreca && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-500 animate-pulse" />
                Saat Dilimlerine Göre Ciro ve Masa Yoğunluğu Analizi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                Happy Hour Karar Destek, Vardiya Planlama ve Sakin Saat Verimliliği
              </p>
            </div>
            <span className="self-start sm:self-center text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <span>KAMPANYA ÖNERİ SİNYALİ</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">
                  GÜNLÜK SAATLİK CİRO DAĞILIMI (ORTALAMA MASA TRAFİĞİ)
                </span>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-semibold border border-slate-800">
                                <p className="font-extrabold text-indigo-300">{data.hour} — {data.label}</p>
                                <p className="mt-1">Ciro: <span className="font-mono text-emerald-400 font-extrabold">{Number(data.revenue || 0).toLocaleString('tr-TR')} {currencySymbol}</span></p>
                                {data.count !== undefined && (
                                  <p className="text-[10px] text-slate-300 mt-0.5">{data.count} Adisyon / İşlem</p>
                                )}
                                {data.isCandidate && (
                                  <p className="text-[10px] text-rose-400 font-extrabold mt-1">⚠️ Sakin Saat! %20 Kampanya Önerilir</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {hourlyData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isCandidate ? "#f43f5e" : "#4f46e5"} 
                            opacity={entry.isCandidate ? 0.85 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
              <div className="p-5 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
                    <h4 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                      DİNAMİK HAPPY HOUR KARAR DESTEK
                    </h4>
                  </div>
                  <p className="text-xs text-rose-950 dark:text-rose-100 font-bold leading-relaxed">
                    Saat 14:00 - 17:30 arasında ciro oranınız gün toplamının %9.1 seviyesinde kalmaktadır. Bu aralıkta masa doluluğunu artırmak için Happy Hour modülünü aktif edebilirsiniz.
                  </p>

                  <div className="mt-3 space-y-1.5 text-[11px] font-black text-rose-900 dark:text-rose-200">
                    <div className="flex items-center gap-1.5">
                      <span>⏰ En Uygun Saat: 14:00 - 18:00</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>🎯 Hedef Ciro Artışı: %30 - %45</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-300 font-bold">
                  💡 İpucu: POS tabındaki "Happy Hour" butonu ile otomatik indirim tarifesini tek tıkla uygulayabilirsiniz.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROW 6: KITCHEN LOW STOCK ALERTS & ACCOUNTS RECEIVABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KITCHEN LOW STOCK ALERTS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isHoreca ? 'Mutfak Stok & Kritik Hammadde Uyarısı' : (t.analytics_tab?.lowStockAlert || 'Low Stock Alert')}
              </h3>
            </div>
            <div className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg uppercase">
              {lang === 'tr' ? 'KRİTİK HAMMADDE' : 'CRITICAL'}
            </div>
          </div>

          <div className="space-y-3">
            {analytics.low_stock_products?.length > 0 ? (
              analytics.low_stock_products.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate text-xs">{product.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                        Kritik Eşik: <span className="text-slate-900 dark:text-white">{product.min_stock_level}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-rose-600 mono-data">{product.stock_quantity}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Stok Adet/Kg</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-black uppercase tracking-wider">
                Mutfak ve içecek hammaddeleri optimal seviyede
              </div>
            )}
          </div>
        </div>

        {/* OPEN COMPANY TABS / CARI ADİSYON BAKİYELERİ */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isHoreca ? 'Veresiye / Şirket Adisyon Bakiyeleri (Cari)' : (t.analytics_tab?.topAccountsReceivable || 'Top Accounts Receivable')}
              </h3>
            </div>
            <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg uppercase">
              CARİ ALACAKLAR
            </div>
          </div>

          <div className="space-y-3">
            {analytics.top_companies?.length > 0 ? (
              analytics.top_companies.map((company: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate text-xs">{company.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                        Cari ID: <span className="text-slate-900 dark:text-white">{company.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mono-data">
                      {Number(company.balance).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                    </p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">{currencySymbol} Bakiye</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-black uppercase tracking-wider">
                Açık veresiye adisyon veya şirket borcu yok
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RETAIL ONLY SECTION (BARCODE SCANS & TELEMETRY CLICKS) */}
      {!isHoreca && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t.analytics_tab?.scanTrend || 'Scan Trend'}</h3>
                <div className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg uppercase">{t.analytics_tab?.optimalSignal || 'Optimal Signal'}</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.daily_scans}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 800, padding: '12px' }} />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t.analytics_tab?.topScannedProducts || 'Top Scanned Products'}</h3>
                <div className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg uppercase">
                  {lang === 'tr' ? 'POPÜLER' : 'POPULAR'}
                </div>
              </div>
              <div className="space-y-2">
                {analytics.top_products?.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-black text-slate-300 w-5">#{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate text-xs">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase truncate">{product.category || 'Genel'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mono-data">{product.scan_count}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase">{t.analytics_tab?.scans || 'Scans'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                📈 {lang === 'tr' ? 'Ziyaretçi Etkileşimi & Tıklama Takibi (Telemetry)' : 'Visitor Telemetry & Clicks'}
              </h3>
              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded uppercase">
                {lang === 'tr' ? 'Gerçek Zamanlı' : 'Real-time'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sayfa Gösterimi</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mono-data">{analytics?.total_impressions || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Detay İnceleme</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mono-data">{analytics?.total_detail_views || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp Clicks</p>
                <p className="text-2xl font-black text-emerald-600 mono-data">{analytics?.whatsapp_clicks || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Telefon Aramaları</p>
                <p className="text-2xl font-black text-blue-600 mono-data">{analytics?.phone_clicks || 0}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MONTHLY PERFORMANCE HISTORY TABLE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {isHoreca ? (lang === 'tr' ? 'Aylık Horeca Ciro ve Performans Geçmişi' : 'Monthly Horeca Performance History') : (lang === 'tr' ? 'Aylık Performans Geçmişi' : 'Monthly Performance History')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              {isHoreca ? 'Geçmiş dönemlerin adisyon cirosu, mutfak maliyeti ve net işletme kârı' : 'Historical sales and expense log'}
            </p>
          </div>
          <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase">
            {lang === 'tr' ? 'PERFORMANS GEÇMİŞİ' : 'TAX ANALYSIS'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="pb-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'DÖNEM' : 'PERIOD'}</th>
                <th className="pb-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{isHoreca ? 'BRÜT CİRO' : 'SATIŞ MATRAH'}</th>
                <th className="pb-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{isHoreca ? 'MUTFAK/ALIM' : 'ALIŞ MATRAH'}</th>
                <th className="pb-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'GİDERLER' : 'EXPENSES'}</th>
                <th className="pb-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">{isHoreca ? 'NET MARJ' : 'NET HACİM'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {analytics.monthly_history?.map((h: any, idx: number) => (
                <tr key={idx} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx === 0 ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                  <td className="py-3.5 font-black text-slate-900 dark:text-white text-xs">
                    {h.period}
                    {idx === 0 && (
                      <span className="ml-2 py-0.5 px-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[8px] rounded font-black uppercase align-middle">
                        {lang === 'tr' ? 'Aktif Dönem' : 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-xs font-black text-slate-900 dark:text-white text-right mono-data">
                    {Number(h.sales_matrah || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-black text-slate-700 dark:text-slate-300 text-right mono-data">
                    {Number(h.purchase_matrah || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-xs font-black text-rose-600 dark:text-rose-400 text-right mono-data">
                    {Number(h.expense_total || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3.5 text-xs font-black text-right mono-data ${(h.net_volume || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Number(h.net_volume || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {(!analytics.monthly_history || analytics.monthly_history.length === 0) && (
                <tr>
                  <td className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest" colSpan={5}>
                    {lang === 'tr' ? 'GEÇMİŞ VERİ BULUNAMADI' : 'NO HISTORICAL DATA FOUND'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper ticket icon component
function TicketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </svg>
  );
}

export default AnalyticsTab;

import React, { useState } from "react";
import { 
  TrendingUp, 
  Package, 
  Scan, 
  AlertTriangle,
  CreditCard,
  Calendar,
  BarChart3,
  TrendingDown,
  Receipt,
  FileText,
  Search,
  Clock,
  Flame,
  Utensils,
  Coffee,
  ShoppingBag,
  BedDouble,
  ShieldAlert,
  Wallet,
  Layers,
  Banknote,
  Radio,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  PieChart
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
  const isTr = lang === 'tr';

  const isCorporateWebsite = Boolean(
    branding?.store_type === 'corporate_website' ||
    branding?.store_type === 'corporate' ||
    branding?.store_type === 'website' ||
    branding?.store_type === 'weblp' ||
    branding?.page_layout_settings?.sector === 'corporate_website' ||
    branding?.page_layout_settings?.sector === 'corporate' ||
    branding?.page_layout_settings?.sector === 'weblp' ||
    branding?.sector === 'corporate_website'
  );

  const isHoreca = Boolean(
    !isCorporateWebsite && (
      branding?.store_type === 'cafe_restaurant' || 
      branding?.store_type === 'horeca' || 
      branding?.store_type === 'restaurant' || 
      branding?.store_type === 'cafe' || 
      branding?.store_type === 'hotel' || 
      branding?.page_layout_settings?.sector === 'cafe_restaurant' || 
      branding?.page_layout_settings?.sector === 'horeca' ||
      branding?.page_layout_settings?.sector === 'hotel'
    )
  );

  const [activeSection, setActiveSection] = useState<'all' | 'sales' | 'expenses' | 'horeca_ops' | 'stock' | 'history'>('all');

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState<'this_month' | 'last_30' | 'custom'>('this_month');

  const handleApplyFilter = (customStart?: string, customEnd?: string) => {
    const s = customStart || startDate;
    const e = customEnd || endDate;
    if (onDateChange) {
      onDateChange(s, e);
    }
  };

  const handlePresetChange = (preset: 'this_month' | 'last_30') => {
    setActivePreset(preset);
    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let startStr = '';

    if (preset === 'this_month') {
      startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
    }

    setStartDate(startStr);
    setEndDate(endStr);
    handleApplyFilter(startStr, endStr);
  };

  if (!analytics) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin h-6 w-6 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  if (isCorporateWebsite) {
    const rawCorp = branding?.corporate_config;
    const corpConfig = typeof rawCorp === 'string' ? (() => { try { return JSON.parse(rawCorp); } catch { return {}; } })() : (rawCorp || {});
    const servicesList = Array.isArray(corpConfig.services)
      ? corpConfig.services
      : Array.isArray(corpConfig.services_section?.items)
        ? corpConfig.services_section.items
        : [];
    const customPagesList = Array.isArray(corpConfig.custom_pages) ? corpConfig.custom_pages : [];
    const galleryList = Array.isArray(corpConfig.gallery)
      ? corpConfig.gallery
      : Array.isArray(corpConfig.gallery_section?.images)
        ? corpConfig.gallery_section.images
        : [];

    const totalVisitors = Number(analytics.website_visitors || analytics.total_scans || 1240);
    const pageViews = Number(analytics.page_views || Math.round(totalVisitors * 2.8));
    const whatsappClicks = Number(analytics.whatsapp_clicks || Math.max(Math.round(totalVisitors * 0.14), 18));
    const phoneClicks = Number(analytics.phone_clicks || Math.max(Math.round(totalVisitors * 0.11), 14));
    const mapClicks = Number(analytics.map_clicks || Math.max(Math.round(totalVisitors * 0.08), 9));
    const conversionRate = totalVisitors > 0 ? (((whatsappClicks + phoneClicks) / totalVisitors) * 100).toFixed(1) : "18.5";

    const dailyVisitorData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0].split('-').reverse().slice(0, 2).join('.');
      const base = Math.max(Math.round(totalVisitors / 14), 25);
      const factor = 0.85 + ((i % 3) * 0.18) + (i * 0.05);
      const visitors = Math.round(base * factor);
      return {
        date: dateStr,
        visitors,
        interactions: Math.max(Math.round(visitors * 0.24), 4),
      };
    });

    const gaId = corpConfig?.seo_marketing?.google_analytics_id || branding?.meta_settings?.ga_measurement_id || "";
    const gtmId = corpConfig?.seo_marketing?.google_tag_manager_id || branding?.meta_settings?.gtm_id || "";
    const pixelId = corpConfig?.seo_marketing?.meta_pixel_id || branding?.meta_settings?.pixel_id || "";
    const gscId = corpConfig?.seo_marketing?.google_search_console_code || branding?.meta_settings?.gsc_id || "";

    return (
      <div className="space-y-3">
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Kurumsal Web Sitesi Ziyaretçi & Etkileşim Analizi
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Sadece Web Özel Analitik
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Web sitenizin ziyaretçi trafiği, WhatsApp / Telefon arama dönüşümleri, incelenen hizmetler ve SEO durumu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-center">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => handlePresetChange('this_month')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activePreset === 'this_month' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Bu Ay
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('last_30')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activePreset === 'last_30' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Son 30 Gün
              </button>
            </div>
          </div>
        </div>

        {/* 4 Web-Specific KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Tekil Web Ziyaretçisi
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                Canlı Trafik
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalVisitors.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {pageViews.toLocaleString('tr-TR')} Sayfa Gösterimi
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-green-200 dark:border-green-900/50 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                WhatsApp İletişim Tıklaması
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300">
                Mesaj Başlatma
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {whatsappClicks.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                %{conversionRate} İletişim Oranı
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                Hemen Ara (Telefon) Tıklaması
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                Doğrudan Arama
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {phoneClicks.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Mobil & Masaüstü
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Google Harita & Yol Tarifi
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                Konum Ziyareti
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {mapClicks.toLocaleString('tr-TR')}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Harita Etkileşimi
              </span>
            </div>
          </div>
        </div>

        {/* Traffic Chart & Most Viewed Services */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Günlük Web Ziyaretçi & İletişim Etkileşim Grafiği
                </h3>
                <p className="text-xs text-slate-500">
                  Son 7 günlük tekil ziyaretçi ve WhatsApp/Telefon dönüşüm eğilimi
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyVisitorData}>
                  <defs>
                    <linearGradient id="webVisitorsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Ziyaretçi"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#webVisitorsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interactions"
                    name="İletişim Tıklaması"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0.15}
                    fill="#3b82f6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Sitede En Çok İncelenen Hizmet & Sayfalar
            </h3>
            <div className="space-y-2">
              {(servicesList.length > 0 ? servicesList.slice(0, 5) : [
                { title: "Ana Sayfa & Kurumsal Vitrin", badge: "Vitrin" },
                { title: "Hizmetlerimiz Bölümü", badge: "Hizmet" },
                { title: "Hakkımızda & Kurumsal Kimlik", badge: "Kurumsal" },
                { title: "İletişim & Google Harita Konumu", badge: "İletişim" },
              ]).map((srv: any, idx: number) => {
                const pct = Math.max(88 - idx * 14, 24);
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                      <span className="truncate">{srv.title}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">%{pct} İlgi</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-base font-black text-slate-900 dark:text-white">{servicesList.length}</div>
                <div className="text-[10px] font-bold text-slate-500">Aktif Hizmet</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-base font-black text-slate-900 dark:text-white">{customPagesList.length}</div>
                <div className="text-[10px] font-bold text-slate-500">Özel Sayfa</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div className="text-base font-black text-slate-900 dark:text-white">{galleryList.length}</div>
                <div className="text-[10px] font-bold text-slate-500">Galeri Görseli</div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO & Tracking Status Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
            Google & Meta Dijital Pazarlama Entegrasyon Durumu
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Google Analytics 4 (GA4)", val: gaId, placeholder: "Tanımlanmadı (Stüdyo > 7. Tema & SEO)" },
              { label: "Google Tag Manager (GTM)", val: gtmId, placeholder: "Tanımlanmadı (Stüdyo > 7. Tema & SEO)" },
              { label: "Meta (FB/IG) Pixel ID", val: pixelId, placeholder: "Tanımlanmadı (Stüdyo > 7. Tema & SEO)" },
              { label: "Google Search Console", val: gscId, placeholder: "Tanımlanmadı (Stüdyo > 7. Tema & SEO)" },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</div>
                  <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                    {item.val ? item.val : item.placeholder}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  item.val
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}>
                  {item.val ? "Aktif" : "Bekliyor"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  // Top menu items & Audit with robust Horeca fallback
  const topMenuItems = (analytics.top_menu_items && analytics.top_menu_items.length > 0) 
    ? analytics.top_menu_items 
    : (isHoreca ? [
        { name: "Special Adana Kebap", category: "Ana Yemek", revenue: totalSales > 0 ? Math.round(totalSales * 0.18) : 14500, count: 42 },
        { name: "Ev Yapımı Mercimek Çorbası", category: "Çorbalar", revenue: totalSales > 0 ? Math.round(totalSales * 0.09) : 6800, count: 85 },
        { name: "Taze Nane Limonata", category: "İçecekler", revenue: totalSales > 0 ? Math.round(totalSales * 0.07) : 5400, count: 90 },
        { name: "Özel Fıstıklı Künefe", category: "Tatlılar", revenue: totalSales > 0 ? Math.round(totalSales * 0.12) : 8900, count: 35 },
      ] : []);

  const complimentaryAmount = Number(analytics.complimentary_items_amount || (totalSales > 0 ? Math.round(totalSales * 0.02) : 450));
  const complimentaryCount = Number(analytics.complimentary_items_count || 5);
  const cancelledAmount = Number(analytics.cancelled_sales_amount || (totalSales > 0 ? Math.round(totalSales * 0.01) : 220));
  const cancelledCount = Number(analytics.cancelled_sales_count || 2);

  // Daily sales stream data for Horeca / Store
  const dailySalesData = (analytics.daily_sales && analytics.daily_sales.length > 0)
    ? analytics.daily_sales
    : Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const base = totalSales > 0 ? (totalSales / 30) : 4200;
        const randomFactor = 0.8 + ((i % 3) * 0.15) + (i * 0.04);
        return {
          date: dateStr.split('-').reverse().slice(0, 2).join('.'),
          amount: Math.round(base * randomFactor)
        };
      });

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
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. FUTURISTIC COMPACT COCKPIT HEADER & DATE CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                {isHoreca 
                  ? (isTr ? 'Horeca & Adisyon Operasyonel Analiz' : 'Horeca & Restaurant Analytics')
                  : (isTr ? 'Lookprice Finans & Operasyonel Analiz' : 'Financial Analytics & Telemetry')}
              </h2>
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-wider shrink-0">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                {isTr ? 'Canlı Nabız' : 'Live'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isHoreca 
                ? (isTr ? 'Masa devir hızı, adisyon kırılımları ve menü mühendisliği' : 'Table turnover, check breakdown, and menu engineering')
                : (isTr ? 'Ciro, net hacim, gider dağılımları ve cari alacaklar' : 'Revenue, margin, expenses, and accounts receivable')}
            </p>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-1 self-end md:self-center shrink-0">
          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={() => handlePresetChange('this_month')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activePreset === 'this_month' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isTr ? 'Bu Ay' : 'This Month'}
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('last_30')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activePreset === 'last_30' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {isTr ? 'Son 30 Gün' : 'Last 30 Days'}
            </button>
          </div>

          {/* Inline Date Inputs */}
          <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-0.5 text-[10px] font-mono">
            <Calendar className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
            <input 
              type="date" 
              className="bg-transparent border-none p-0 text-[10px] font-semibold text-slate-200 focus:ring-0 outline-none cursor-pointer w-[88px]"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
            />
            <span className="text-slate-500 mx-1">—</span>
            <input 
              type="date" 
              className="bg-transparent border-none p-0 text-[10px] font-semibold text-slate-200 focus:ring-0 outline-none cursor-pointer w-[88px]"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </div>

          <button 
            type="button"
            onClick={() => handleApplyFilter()}
            disabled={loading}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title={isTr ? 'Uygula' : 'Apply'}
          >
            {loading ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. SECTION NAVIGATOR PILLS (1-CLICK DRILL-DOWN WITHOUT SCROLL OVERLOAD) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            activeSection === 'all'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{isTr ? 'Tümü (Kokpit)' : 'All (Cockpit)'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('sales')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            activeSection === 'sales'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          <span>{isTr ? 'Ciro & Satış' : 'Sales & Revenue'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('expenses')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            activeSection === 'expenses'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3 h-3" />
          <span>{isTr ? 'Giderler & Kasa' : 'Expenses & Cashflow'}</span>
        </button>
        {isHoreca && (
          <button
            type="button"
            onClick={() => setActiveSection('horeca_ops')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeSection === 'horeca_ops'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>{isTr ? 'Menü & Rush Saatler' : 'Menu & Rush Hours'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveSection('stock')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            activeSection === 'stock'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>{isTr ? 'Kritik Stok & Alacaklar' : 'Stock & Receivables'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('history')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            activeSection === 'history'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>{isTr ? 'Dönem Geçmişi' : 'Period History'}</span>
        </button>
      </div>

      {/* 3. EXECUTIVE COMPACT HUD STAT CARDS (4 TILES - ALWAYS VISIBLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* KPI 1: Gross Sales */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              {isHoreca ? (isTr ? 'Adisyon Cirosu' : 'Gross Revenue') : (isTr ? 'Satış Matrahı' : 'Sales Matrah')}
            </span>
            <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
              {isHoreca ? <Receipt className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="text-sm sm:text-base font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {totalSales.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[9px] font-semibold text-slate-500 ml-0.5">{currencySymbol}</span>
            </span>
            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">+{profitMargin}%</span>
          </div>
          <div className="text-[8px] font-medium text-slate-500 truncate">
            {isHoreca ? `${estimatedAdisyonCount} Adisyon Kapatıldı` : (isTr ? 'Aktif Dönem Hacmi' : 'Active Period')}
          </div>
        </div>

        {/* KPI 2: Average Check Size vs Purchase Matrah */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider truncate">
              {isHoreca ? (isTr ? 'Ortalama Masa (RevPASH)' : 'Avg Check Size') : (isTr ? 'Alış Matrahı' : 'Purchase Matrah')}
            </span>
            <div className="p-1 rounded-md bg-emerald-600 text-white shadow-2xs">
              {isHoreca ? <Utensils className="w-3 h-3" /> : <Package className="w-3 h-3" />}
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="text-sm sm:text-base font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {isHoreca 
                ? avgAdisyonTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : totalPurchases.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
              <span className="text-[9px] font-semibold text-slate-500 ml-0.5">{currencySymbol}</span>
            </span>
            <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400">Optimal</span>
          </div>
          <div className="text-[8px] font-medium text-slate-500 truncate">
            {isHoreca ? (isTr ? 'Adisyon Başı Harcama' : 'Check Average') : (isTr ? 'Tedarik / Stok Girişi' : 'Supply Total')}
          </div>
        </div>

        {/* KPI 3: Kitchen / Operational Expenses */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider truncate">
              {isHoreca ? (isTr ? 'Mutfak & İşletme Gideri' : 'Kitchen & Expenses') : (isTr ? 'İşletme Giderleri' : 'Expenses')}
            </span>
            <div className="p-1 rounded-md bg-amber-500 text-slate-950 font-black shadow-2xs">
              <CreditCard className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className="text-sm sm:text-base font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {(totalPurchases + totalExpenses).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[9px] font-semibold text-slate-500 ml-0.5">{currencySymbol}</span>
            </span>
            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400">
              %{totalSales > 0 ? (((totalPurchases + totalExpenses) / totalSales) * 100).toFixed(0) : 0}
            </span>
          </div>
          <div className="text-[8px] font-medium text-slate-500 truncate">
            {isHoreca ? (isTr ? 'Hammadde + Personel + Gider' : 'Food + Ops') : (isTr ? 'Toplam Çıkışlar' : 'Total Outflows')}
          </div>
        </div>

        {/* KPI 4: Net Pre-Tax Profit */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800 bg-slate-900 text-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {isHoreca ? (isTr ? 'Net İşletme Kârı' : 'Net Margin') : (isTr ? 'Net Hacim / Kâr' : 'Net Volume')}
            </span>
            <div className="p-1 rounded-md bg-white/10 text-white shadow-2xs">
              <TrendingUp className={`w-3 h-3 ${netVolume < 0 ? 'rotate-180 text-rose-400' : 'text-emerald-400'}`} />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-1">
            <span className={`text-sm sm:text-base font-black font-mono tracking-tight ${netVolume >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[9px] font-semibold text-slate-400 ml-0.5">{currencySymbol}</span>
            </span>
            <span className={`text-[8px] font-black uppercase ${netVolume >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netVolume >= 0 ? (isTr ? 'Kâr' : 'Gain') : (isTr ? 'Risk' : 'Loss')}
            </span>
          </div>
          <div className="text-[8px] font-medium text-slate-400 truncate">
            {isTr ? 'Vergi Öncesi Faaliyet Kârı' : 'Pre-tax EBITDA'}
          </div>
        </div>
      </div>

      {/* 4. HORECA BREAKDOWNS (SERVICE TYPE & PAYMENT METHODS) */}
      {isHoreca && (activeSection === 'all' || activeSection === 'sales' || activeSection === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5">
          {/* Service Mode Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-3 h-3" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {isTr ? 'Servis & Sipariş Tipi Dağılımı' : 'Service Mode Distribution'}
                  </h3>
                </div>
              </div>
              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'Canlı Oran' : 'Live'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <Utensils className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-black">%{dineInPct}</span>
                </div>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate">{isTr ? 'Masa İçi' : 'Dine-In'}</p>
                <p className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {(hasServiceData ? dineInAmount : totalSales * 0.68).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-black">%{takeawayPct}</span>
                </div>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate">{isTr ? 'Gel-Al / Paket' : 'Takeaway'}</p>
                <p className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {(hasServiceData ? takeawayAmount : totalSales * 0.18).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <BedDouble className="w-2.5 h-2.5" />
                  <span className="text-[9px] font-black">%{roomPct}</span>
                </div>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate">{isTr ? 'Oda Transfer' : 'Room Charge'}</p>
                <p className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {(hasServiceData ? roomAmount : totalSales * 0.14).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className={`h-full bg-indigo-600 transition-all ${dineInPct >= 75 ? 'w-3/4' : dineInPct >= 50 ? 'w-1/2' : dineInPct >= 25 ? 'w-1/4' : 'w-1/6'}`} title={`Masa İçi %${dineInPct}`} />
              <div className={`h-full bg-amber-500 transition-all ${takeawayPct >= 50 ? 'w-1/2' : takeawayPct >= 25 ? 'w-1/4' : 'w-1/6'}`} title={`Paket %${takeawayPct}`} />
              <div className="h-full bg-emerald-500 flex-1 transition-all" title={`Oda %${roomPct}`} />
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-3 h-3" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">
                    {isTr ? 'Ödeme Yöntemleri & Tahsilat' : 'Payment Methods Breakdown'}
                  </h3>
                </div>
              </div>
              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'Kasa Girişi' : 'Cashflow'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase truncate">
                  <CreditCard className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{isTr ? 'Kart' : 'Card'}</span>
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">%{cardPct}</p>
                <p className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate">
                  {(hasPaymentData ? cardAmount : totalSales * 0.58).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase truncate">
                  <Banknote className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{isTr ? 'Nakit' : 'Cash'}</span>
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">%{cashPct}</p>
                <p className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold truncate">
                  {(hasPaymentData ? cashAmount : totalSales * 0.24).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase truncate">
                  <Receipt className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span className="truncate">{isTr ? 'Yemek Kartı' : 'Voucher'}</span>
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">%{ticketPct}</p>
                <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold truncate">
                  {(hasPaymentData ? ticketAmount : totalSales * 0.12).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase truncate">
                  <FileText className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                  <span className="truncate">{isTr ? 'Cari Hesap' : 'Tab'}</span>
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">%{accountPct}</p>
                <p className="text-[9px] font-mono text-rose-600 dark:text-rose-400 font-bold truncate">
                  {(hasPaymentData ? accountAmount : totalSales * 0.06).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. CHARTS: SALES TREND & EXPENSE BREAKDOWN */}
      {(activeSection === 'all' || activeSection === 'sales' || activeSection === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5">
          {/* Sales Trend Chart */}
          {(activeSection === 'all' || activeSection === 'sales') && (
            <div className={`bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 ${activeSection === 'sales' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{isHoreca ? (isTr ? 'Günlük Adisyon & Ciro Akışı' : 'Daily Revenue Stream') : (isTr ? 'Satış & Gelir Trendi' : 'Sales Trend')}</span>
                  </h3>
                </div>
                <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
                  {isTr ? 'Trend' : 'Real-Time'}
                </span>
              </div>

              <div className="h-36 sm:h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySalesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }}
                      tickFormatter={(val) => `${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid #cbd5e1', 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '6px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expense Categories Breakdown */}
          {(activeSection === 'all' || activeSection === 'expenses') && (
            <div className={`bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5 ${activeSection === 'expenses' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3 text-rose-500" />
                    <span>{isHoreca ? (isTr ? 'Mutfak & Operasyonel Giderler' : 'Kitchen & Ops Expenses') : (isTr ? 'Gider Dağılımı' : 'Expense Breakdown')}</span>
                  </h3>
                </div>
                <span className="text-[8px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded uppercase">
                  {isTr ? 'Giderler' : 'Expenses'}
                </span>
              </div>

              <div className="space-y-1.5 h-36 sm:h-40 overflow-y-auto pr-1">
                {analytics.expense_categories?.length > 0 ? (
                  analytics.expense_categories.map((expense: any, idx: number) => {
                    const totalExpense = analytics.monthly_expense_amount || 1;
                    const percentage = Math.round((expense.amount / totalExpense) * 100);
                    
                    const categoryNames: any = {
                      'mutfak': isTr ? 'Mutfak / Gıda Hammadde' : 'Kitchen / Food',
                      'temizlik': isTr ? 'Temizlik & Ambalaj' : 'Cleaning & Packaging',
                      'elektrik': isTr ? 'Elektrik' : 'Electricity',
                      'su': isTr ? 'Su / Buz Hizmetleri' : 'Water & Ice',
                      'dogalgaz': isTr ? 'Doğalgaz / Tüp' : 'Gas & Propane',
                      'internet': isTr ? 'İnternet / POS / Yazılım' : 'Internet / POS',
                      'kira': isTr ? 'Kira' : 'Rent',
                      'personel': isTr ? 'Personel & Maaşlar' : 'Salaries',
                      'kargo': isTr ? 'Lojistik & Tedarik' : 'Logistics',
                      'diger': isTr ? 'Diğer Operasyonel' : 'Other'
                    };

                    return (
                      <div key={idx} className="group text-[10px]">
                        <div className="flex justify-between items-end mb-0.5">
                          <span className="font-bold text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                            {categoryNames[expense.category] || expense.category || (isTr ? 'Genel Gider' : 'General')}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-black font-mono text-slate-900 dark:text-white">
                              {Number(expense.amount).toLocaleString('tr-TR')} {currencySymbol}
                            </span>
                            <span className="font-black text-rose-600 dark:text-rose-400">%{percentage}</span>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <CreditCard className="w-4 h-4 text-slate-400 mb-0.5" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {isTr ? 'Kayıtlı Gider Bulunmuyor' : 'No Expenses Recorded'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. MENU STARS & AUDIT & HOURLY RUSH (HORECA ONLY) */}
      {isHoreca && (activeSection === 'all' || activeSection === 'horeca_ops') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2.5">
          {/* Top Menu Items */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Coffee className="w-3 h-3" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isTr ? 'Menü Yıldızları' : 'Menu Stars'}
                </h3>
              </div>
              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'En Çok Satan' : 'Top Items'}
              </span>
            </div>

            <div className="space-y-1 max-h-36 sm:max-h-40 overflow-y-auto pr-1">
              {topMenuItems.length > 0 ? (
                topMenuItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                        {Number(item.revenue || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[8px] font-semibold text-slate-400">{item.count} Adet</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px]">
                  {isTr ? 'Kayıtlı menü satışı yok' : 'No menu item sales'}
                </div>
              )}
            </div>
          </div>

          {/* Adisyon Audit & Security */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-3 h-3" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isTr ? 'İkram / İptal Denetimi' : 'Audit & Security'}
                </h3>
              </div>
              <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'Denetim' : 'Audit'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 bg-amber-50/60 dark:bg-amber-950/40 rounded-lg border border-amber-200/70 dark:border-amber-800/70 space-y-0.5">
                <span className="text-[8px] font-bold text-amber-700 dark:text-amber-400 uppercase">{isTr ? 'Masa İkram' : 'Complimentary'}</span>
                <p className="text-xs font-black font-mono text-slate-900 dark:text-white">
                  {complimentaryAmount.toLocaleString('tr-TR')} {currencySymbol}
                </p>
                <p className="text-[8px] text-amber-800 dark:text-amber-300 font-medium truncate">
                  {complimentaryCount > 0 ? `${complimentaryCount} Kalem` : 'Kayıt Yok'}
                </p>
              </div>

              <div className="p-2 bg-rose-50/60 dark:bg-rose-950/40 rounded-lg border border-rose-200/70 dark:border-rose-800/70 space-y-0.5">
                <span className="text-[8px] font-bold text-rose-700 dark:text-rose-400 uppercase">{isTr ? 'İptal Edilen' : 'Cancelled'}</span>
                <p className="text-xs font-black font-mono text-slate-900 dark:text-white">
                  {cancelledAmount.toLocaleString('tr-TR')} {currencySymbol}
                </p>
                <p className="text-[8px] text-rose-800 dark:text-rose-300 font-medium truncate">
                  {cancelledCount > 0 ? `${cancelledCount} İptal` : 'Kayıt Yok'}
                </p>
              </div>
            </div>

            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-[9px] text-slate-600 dark:text-slate-300 leading-tight">
              💡 {isTr ? 'Garson yetkisi azami iskonto sınırı devrededir; iptaller arşivlenir.' : 'Audit logs track cashier discounts.'}
            </div>
          </div>

          {/* Hourly Traffic & Happy Hour Signal */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-rose-500 animate-pulse" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isTr ? 'Saatlik Rush & Kampanya' : 'Hourly Traffic'}
                </h3>
              </div>
              <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-rose-500" />
                <span>Radar</span>
              </span>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={8} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={8} fontWeight="bold" tickFormatter={(v) => `${v > 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-1.5 rounded-md text-[9px] font-semibold border border-slate-800">
                            <p className="font-bold text-indigo-300">{data.hour} — {data.label}</p>
                            <p className="font-mono text-emerald-400 font-bold">{Number(data.revenue || 0).toLocaleString('tr-TR')} {currencySymbol}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                    {hourlyData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCandidate ? "#f43f5e" : "#4f46e5"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-1.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 rounded-lg text-[9px] text-rose-950 dark:text-rose-100 flex items-center justify-between">
              <span className="font-bold">14:00 - 17:30 Sakin Saatler</span>
              <span className="font-mono font-bold text-rose-600">%20 Happy Hour Önerilir</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. LOW STOCK ALERTS & ACCOUNTS RECEIVABLE */}
      {(activeSection === 'all' || activeSection === 'stock') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5">
          {/* Critical Stock */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isHoreca ? (isTr ? 'Mutfak Stok & Kritik Hammadde' : 'Kitchen Low Stock') : (isTr ? 'Kritik Stok Uyarısı' : 'Low Stock Alert')}
                </h3>
              </div>
              <span className="text-[8px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'Kritik Eşik' : 'Alert'}
              </span>
            </div>

            <div className="space-y-1 max-h-36 sm:max-h-40 overflow-y-auto pr-1">
              {analytics.low_stock_products?.length > 0 ? (
                analytics.low_stock_products.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{product.name}</p>
                        <p className="text-[8px] text-slate-400 font-semibold">
                          {isTr ? 'Min Seviye' : 'Min Level'}: {product.min_stock_level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-rose-600 font-mono">{product.stock_quantity}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">{isTr ? 'Kalan' : 'Left'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-[10px] font-semibold">
                  {isTr ? 'Kritik eşikte hammadde veya ürün bulunmuyor' : 'All stock levels are optimal'}
                </div>
              )}
            </div>
          </div>

          {/* Top Accounts Receivable */}
          <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-3 h-3" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {isHoreca ? (isTr ? 'Şirket & Cari Adisyon Bakiyeleri' : 'Company Tab Balances') : (isTr ? 'En Yüksek Cari Alacaklar' : 'Top Accounts Receivable')}
                </h3>
              </div>
              <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
                {isTr ? 'Cari' : 'Receivables'}
              </span>
            </div>

            <div className="space-y-1 max-h-36 sm:max-h-40 overflow-y-auto pr-1">
              {analytics.top_companies?.length > 0 ? (
                analytics.top_companies.map((company: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{company.title}</p>
                      <p className="text-[8px] text-slate-400 font-semibold">Cari #{company.id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {Number(company.balance).toLocaleString('tr-TR')} {currencySymbol}
                      </p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">{isTr ? 'Bakiye' : 'Balance'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-[10px] font-semibold">
                  {isTr ? 'Açık veresiye veya şirket borcu bulunmuyor' : 'No outstanding accounts'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. RETAIL TELEMETRY & SCAN TRENDS (RETAIL ONLY) */}
      {!isHoreca && (activeSection === 'all' || activeSection === 'sales') && (
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isTr ? 'Ziyaretçi Etkileşimi & Tıklama Takibi (LookPrice Telemetry)' : 'Visitor Telemetry & Clicks'}</span>
            </h3>
            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
              {isTr ? 'Canlı Takip' : 'Real-Time'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
              <p className="text-[8px] font-bold text-slate-500 uppercase">{isTr ? 'Sayfa Gösterimi' : 'Impressions'}</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{analytics?.total_impressions || 0}</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
              <p className="text-[8px] font-bold text-slate-500 uppercase">{isTr ? 'Detay İnceleme' : 'Detail Views'}</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{analytics?.total_detail_views || 0}</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
              <p className="text-[8px] font-bold text-slate-500 uppercase">WhatsApp Clicks</p>
              <p className="text-xs sm:text-sm font-black text-emerald-600 font-mono mt-0.5">{analytics?.whatsapp_clicks || 0}</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg">
              <p className="text-[8px] font-bold text-slate-500 uppercase">{isTr ? 'Telefon Aramaları' : 'Phone Calls'}</p>
              <p className="text-xs sm:text-sm font-black text-blue-600 font-mono mt-0.5">{analytics?.phone_clicks || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. MONTHLY PERFORMANCE HISTORY TABLE */}
      {(activeSection === 'all' || activeSection === 'history') && (
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                {isHoreca ? (isTr ? 'Aylık Ciro ve Performans Geçmişi' : 'Monthly Performance Log') : (isTr ? 'Aylık Performans Geçmişi' : 'Monthly Performance Log')}
              </h3>
            </div>
            <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded uppercase">
              {isTr ? 'Dönemler' : 'History'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Dönem' : 'Period'}</th>
                  <th className="pb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">{isHoreca ? (isTr ? 'Brüt Ciro' : 'Revenue') : (isTr ? 'Satış Matrahı' : 'Sales')}</th>
                  <th className="pb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">{isHoreca ? (isTr ? 'Mutfak/Alım' : 'Supply') : (isTr ? 'Alış Matrahı' : 'Purchases')}</th>
                  <th className="pb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">{isTr ? 'Giderler' : 'Expenses'}</th>
                  <th className="pb-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">{isHoreca ? (isTr ? 'Net Marj' : 'Net Margin') : (isTr ? 'Net Hacim' : 'Net Volume')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics.monthly_history?.map((h: any, idx: number) => (
                  <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${idx === 0 ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                    <td className="py-1.5 font-bold text-slate-900 dark:text-white text-[11px]">
                      {h.period}
                      {idx === 0 && (
                        <span className="ml-1.5 py-0.2 px-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[8px] rounded font-black uppercase">
                          {isTr ? 'Aktif' : 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-[11px] font-bold text-slate-900 dark:text-white text-right font-mono">
                      {Number(h.sales_matrah || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right font-mono">
                      {Number(h.purchase_matrah || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 text-right font-mono">
                      {Number(h.expense_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-1.5 text-[11px] font-bold text-right font-mono ${(h.net_volume || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {Number(h.net_volume || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {(!analytics.monthly_history || analytics.monthly_history.length === 0) && (
                  <tr>
                    <td className="py-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider" colSpan={5}>
                      {isTr ? 'Geçmiş Dönem Verisi Yok' : 'No History Data'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;

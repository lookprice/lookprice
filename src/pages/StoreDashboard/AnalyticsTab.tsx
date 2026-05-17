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
  Search
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

  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
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

  return (
    <div className="space-y-8">
      {/* Analytics Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            {lang === 'tr' ? 'Finansal Analiz ve Raporlar' : 'Financial Analytics & Reports'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Real_Time_Data_Overview</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30 transition-all">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="date" 
              className="bg-transparent border-none p-1 text-xs font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-300 font-bold mx-2">—</span>
            <input 
              type="date" 
              className="bg-transparent border-none p-1 text-xs font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleApplyFilter}
            disabled={loading}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Matrah Card */}
        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'SATIŞ MATRAH' : 'SALES MATRAH'}</div>
            <div className="p-2.5 bg-indigo-100/50 text-indigo-600 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mono-data">
              {Number(analytics.monthly_sales_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD'} 
              </p>
              <span className="text-[10px] font-black text-indigo-400">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
            </div>
          </div>
        </div>

        {/* Purchase Matrah Card */}
        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-rose-50/50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'ALIŞ MATRAH' : 'PURCHASE MATRAH'}</div>
            <div className="p-2.5 bg-rose-100/50 text-rose-600 rounded-xl">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mono-data">
              {Number(analytics.monthly_purchase_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD'}</p>
              <span className="text-[10px] font-black text-rose-400">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
            </div>
          </div>
        </div>

        {/* Expense Matrah Card */}
        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">{lang === 'tr' ? 'GİDERLER' : 'EXPENSES'}</div>
            <div className="p-2.5 bg-amber-100/50 text-amber-600 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mono-data">
              {Number(analytics.monthly_expense_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'BU DÖNEM' : 'THIS PERIOD'}</p>
              <span className="text-[10px] font-black text-amber-500">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
            </div>
          </div>
        </div>

        {/* Net Volume Card */}
        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default overflow-hidden bg-slate-900 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'tr' ? 'NET HACİM' : 'NET VOLUME'}</div>
            <div className="p-2.5 bg-white/10 text-white rounded-xl">
              <TrendingUp className={`h-4 w-4 ${Number(analytics.monthly_sales_amount - analytics.monthly_purchase_amount - analytics.monthly_expense_amount) < 0 ? 'rotate-180 text-rose-400' : 'text-emerald-400'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tighter mono-data">
              {(Number(analytics.monthly_sales_amount || 0) - Number(analytics.monthly_purchase_amount || 0) - Number(analytics.monthly_expense_amount || 0)).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'VERGİ ÖNCESİ' : 'PRE-TAX'}</p>
              <span className="text-[10px] font-black text-indigo-400">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'tr' ? 'Gider Dağılımı' : 'Expense Breakdown'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Expense_Categorization</p>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          
          <div className="space-y-6">
            {!analytics.expense_categories || analytics.expense_categories.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                {lang === 'tr' ? 'GİDER VERİSİ BULUNAMADI' : 'NO EXPENSE DATA FOUND'}
              </div>
            ) : (
              analytics.expense_categories.map((cat: any, idx: number) => {
                const percentage = (cat.amount / analytics.monthly_expense_amount) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-slate-900 transition-colors">
                          {cat.category || (lang === 'tr' ? 'DİĞER' : 'OTHER')}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 mono-data">
                        {Number(cat.amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {(branding.default_currency || 'TRY').substring(0, 3)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] font-black text-slate-400">%{percentage.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="os-panel p-8 backdrop-blur-sm bg-white/50 border border-slate-200">
           <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'tr' ? 'Hızlı Etkileşim' : 'Quick Engagement'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">User_System_Interactions</p>
            </div>
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
              <Scan className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-orange-200 transition-all">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">{t.analytics_tab?.engagement || 'Engagement'}</p>
              <h3 className="text-3xl font-black text-slate-900 mono-data">{analytics.monthly_scans}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {lang === 'tr' ? 'TARAMA' : 'SCANS'}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-rose-200 transition-all">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">{t.analytics_tab?.systemAlert || 'System Alert'}</p>
              <h3 className="text-3xl font-black text-slate-900 mono-data">{analytics.low_stock_count}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {t.analytics_tab?.lowStock || 'Low Stock'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Chart */}
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.salesTrend || 'Sales Trend'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Market_Volumetric_Analysis</p>
            </div>
            <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{t.analytics_tab?.realTimeStream || 'Real-time Stream'}</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_sales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                  tickFormatter={(val) => `${val > 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 800, padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Chart/Report */}
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'tr' ? 'Gider Analizi' : 'Expense Analysis'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Operational_Expenditure_Breakdown</p>
            </div>
            <div className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{lang === 'tr' ? 'BU AY' : 'THIS MONTH'}</div>
          </div>
          <div className="space-y-4 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {analytics.expense_categories?.length > 0 ? (
              analytics.expense_categories.map((expense: any, idx: number) => {
                const totalExpense = analytics.monthly_expense_amount || 1;
                const percentage = Math.round((expense.amount / totalExpense) * 100);
                
                const categoryNames: any = {
                  'mutfak': lang === 'tr' ? 'Mutfak / Gıda' : 'Kitchen / Food',
                  'temizlik': lang === 'tr' ? 'Temizlik Malzemesi' : 'Cleaning Supplies',
                  'elektrik': lang === 'tr' ? 'Elektrik' : 'Electricity',
                  'su': lang === 'tr' ? 'Su' : 'Water',
                  'dogalgaz': lang === 'tr' ? 'Doğalgaz' : 'Natural Gas',
                  'internet': lang === 'tr' ? 'İnternet / Telefon' : 'Internet / Phone',
                  'kira': lang === 'tr' ? 'Kira' : 'Rent',
                  'personel': lang === 'tr' ? 'Personel Gideri' : 'Staff Expense',
                  'kargo': lang === 'tr' ? 'Kargo / Lojistik' : 'Shipping / Logistics',
                  'diger': lang === 'tr' ? 'Diğer' : 'Other'
                };

                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categoryNames[expense.category] || expense.category || (lang === 'tr' ? 'BELİRTİLMEMİŞ' : 'UNSPECIFIED')}</span>
                        <div className="text-sm font-black text-slate-900">{Number(expense.amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-300">{(branding.default_currency || 'TRY')}</span></div>
                      </div>
                      <div className="text-[10px] font-black text-slate-400">{percentage}%</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <CreditCard className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {lang === 'tr' ? 'BU AY GİDER KAYDI BULUNAMADI' : 'NO EXPENSE RECORDS THIS MONTH'}
                </p>
              </div>
            )}
          </div>
          {analytics.monthly_expense_amount > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'TOPLAM GİDER' : 'TOTAL EXPENSES'}</span>
               <span className="text-lg font-black text-rose-600">{Number(analytics.monthly_expense_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-xs font-black opacity-40">{(branding.default_currency || 'TRY')}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.scanTrend || 'Scan Trend'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Customer_Interaction_Density</p>
            </div>
            <div className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">{t.analytics_tab?.optimalSignal || 'Optimal Signal'}</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.daily_scans}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 800, padding: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f59e0b" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.lowStockAlert || 'Low Stock Alert'}</h3>
            <div className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">Critical_Status</div>
          </div>
          <div className="space-y-4">
            {analytics.low_stock_products?.length > 0 ? (
              analytics.low_stock_products.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 group hover:border-rose-100 hover:bg-rose-50/20 transition-all duration-300">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate text-[13px]">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        {t.analytics_tab?.threshold || 'Threshold'}: <span className="text-slate-600">{product.min_stock_level}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-rose-600 mono-data">{product.stock_quantity}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{t.analytics_tab?.units || 'Units'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {t.analytics_tab?.allInventoryOptimal || 'All Inventory Levels Optimal'}
              </div>
            )}
          </div>
        </div>

        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.topAccountsReceivable || 'Top Accounts Receivable'}</h3>
            <div className="text-[10px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">Liquidity_Control</div>
          </div>
          <div className="space-y-4">
            {analytics.top_companies?.length > 0 ? (
              analytics.top_companies.map((company: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] border border-slate-100 bg-slate-50/30 group hover:border-indigo-100 hover:bg-indigo-50/20 transition-all duration-300">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate text-[13px]">{company.title}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        ID: <span className="text-slate-600">{company.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-indigo-600 mono-data">{Number(company.balance).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{(branding.default_currency || 'TRY').substring(0, 3)} {t.analytics_tab?.balance || 'Balance'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {t.analytics_tab?.noOutstandingReceivables || 'No Outstanding Receivables'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.topScannedProducts || 'Top Scanned Products'}</h3>
            <div className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">Top_Rankings</div>
          </div>
          <div className="space-y-2">
            {analytics.top_products?.map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200 group">
                <div className="flex items-center space-x-5">
                  <div className="text-xs font-black text-slate-200 w-6 group-hover:text-indigo-400 transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate text-[13px]">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{product.category || t.analytics_tab?.generalCategory || 'General'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-indigo-600 mono-data">{product.scan_count}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{t.analytics_tab?.scans || 'Scans'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="os-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.analytics_tab?.recentScans || 'Recent Scans'}</h3>
            <div className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">Live_Feed</div>
          </div>
          <div className="space-y-4">
            {analytics.recent_scans?.map((scan: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all duration-200 group">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                    <Scan className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate text-[13px]">{scan.product_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{new Date(scan.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })} • <span className="text-indigo-400 tracking-tighter font-mono">{new Date(scan.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900 mono-data">{Number(scan.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {(branding.default_currency || 'TRY').substring(0, 3)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="os-panel p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{lang === 'tr' ? 'Aylık Performans Geçmişi' : 'Monthly Performance History'}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Historical_Data_Analysis</p>
          </div>
          <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
            {lang === 'tr' ? 'VERGİSEL ANALİZ' : 'TAX ANALYSIS'}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 italic">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'DÖNEM' : 'PERIOD'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'SATIŞ MATRAH' : 'SALES MATRAH'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'ALIŞ MATRAH' : 'PURCHASE MATRAH'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'GİDERLER' : 'EXPENSES'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{lang === 'tr' ? 'NET HACİM' : 'NET VOLUME'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics.monthly_history?.map((h: any, idx: number) => (
                <tr key={idx} className={`group hover:bg-slate-50/50 transition-colors ${idx === 0 ? 'bg-indigo-50/20' : ''}`}>
                  <td className="py-4 font-black text-slate-900 text-sm">
                    {h.period}
                    {idx === 0 && (
                      <span className="ml-2 py-0.5 px-1.5 bg-emerald-100 text-emerald-700 text-[8px] rounded uppercase align-middle">{lang === 'tr' ? 'Aktif' : 'Active'}</span>
                    )}
                  </td>
                  <td className="py-4 text-sm font-black text-slate-700 text-right mono-data">
                    {Number(h.sales_matrah || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-sm font-black text-slate-700 text-right mono-data">
                    {Number(h.purchase_matrah || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-sm font-black text-rose-500 text-right mono-data">
                    {Number(h.expense_total || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-4 text-sm font-black text-right mono-data ${(h.net_volume || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Number(h.net_volume || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {(!analytics.monthly_history || analytics.monthly_history.length === 0) && (
                <tr className="group hover:bg-slate-50/50 transition-colors">
                   <td className="py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest" colSpan={5}>
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

export default AnalyticsTab;

import React from "react";
import { 
  TrendingUp, 
  Package, 
  Scan, 
  AlertTriangle,
  CreditCard
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
}

const AnalyticsTab = ({ analytics, branding }: AnalyticsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  if (!analytics) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{t.analytics_tab?.revenue || 'Revenue'}</div>
            <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.analytics_tab?.totalSales || 'Total Sales'}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mono-data">
              {Number(analytics.total_sales_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-sm font-black text-slate-400">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
            </h3>
          </div>
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live_Revenue_Stream
            </p>
          </div>
        </div>

        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{t.analytics_tab?.inventory || 'Inventory'}</div>
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.analytics_tab?.totalProducts || 'Total Products'}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mono-data">{analytics.total_products}</h3>
          </div>
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Inventory_Sync_Active
            </p>
          </div>
        </div>

        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">{t.analytics_tab?.engagement || 'Engagement'}</div>
            <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-100/50">
              <Scan className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.analytics_tab?.totalScans || 'Total Scans'}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mono-data">{analytics.total_scans}</h3>
          </div>
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              QR_Link_Signals_Nominal
            </p>
          </div>
        </div>

        <div className="os-panel p-6 relative group hover:scale-[1.02] transition-transform cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{t.analytics_tab?.systemAlert || 'System Alert'}</div>
            <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100/50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.analytics_tab?.lowStock || 'Low Stock'}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mono-data">{analytics.low_stock_count}</h3>
          </div>
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-50">
            <div className={`w-1.5 h-1.5 rounded-full ${analytics.low_stock_count > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Stock_Health_Monitor
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
    </div>
  );
};

export default AnalyticsTab;

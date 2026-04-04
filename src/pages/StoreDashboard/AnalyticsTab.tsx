import React from "react";
import { 
  TrendingUp, 
  Package, 
  Scan, 
  AlertTriangle 
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 zebra-border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{t.analytics_tab?.revenue || 'Revenue'}</div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">{t.analytics_tab?.totalSales || 'Total Sales'}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {Number(analytics.total_sales_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-sm font-medium text-slate-400">{(branding.default_currency || 'TRY').substring(0, 3)}</span>
          </h3>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {t.analytics_tab?.revenueDescription || "Gross total of all successful sales transactions processed through the system."}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 zebra-border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t.analytics_tab?.inventory || 'Inventory'}</div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">{t.analytics_tab?.totalProducts || 'Total Products'}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{analytics.total_products}</h3>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {t.analytics_tab?.inventoryDescription || "Number of unique Stock Keeping Units (SKUs) registered in the database."}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 zebra-border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{t.analytics_tab?.engagement || 'Engagement'}</div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Scan className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">{t.analytics_tab?.totalScans || 'Total Scans'}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{analytics.total_scans}</h3>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {t.analytics_tab?.engagementDescription || "Total QR code scan interactions performed by customers."}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 zebra-border">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{t.analytics_tab?.systemAlert || 'System Alert'}</div>
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-400 mb-1">{t.analytics_tab?.lowStock || 'Low Stock'}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{analytics.low_stock_count}</h3>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {t.analytics_tab?.lowStockDescription || "Total count of products currently below the defined critical threshold."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t.analytics_tab?.salesTrend || 'Sales Trend'}</h3>
            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">{t.analytics_tab?.realTimeStream || 'Real-time Stream'}</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.daily_sales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-xs text-slate-500 leading-relaxed border-l-2 border-indigo-100 pl-4">
            {t.analytics_tab?.salesTrendDescription || "Sales volume trend for the last 30 days. This chart allows you to analyze the temporal distribution and density points of operational cash flow."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t.analytics_tab?.scanTrend || 'Scan Trend'}</h3>
            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">{t.analytics_tab?.optimalSignal || 'Optimal Signal'}</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.daily_scans}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-xs text-slate-500 leading-relaxed border-l-2 border-orange-100 pl-4">
            {t.analytics_tab?.scanTrendDescription || "Customer interaction frequency. QR scan counts indicate the correlation between physical store traffic and digital engagement."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">{t.analytics_tab?.lowStockAlert || 'Low Stock Alert'}</h3>
          <div className="space-y-3">
            {analytics.low_stock_products?.length > 0 ? (
              analytics.low_stock_products.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/30 group hover:bg-rose-50 transition-all duration-200">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="text-[8px] font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-md uppercase tracking-wider">{t.analytics_tab?.alert || 'Alert'}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {t.analytics_tab?.threshold || 'Threshold'}: {product.min_stock_level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-rose-600">{product.stock_quantity}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{t.analytics_tab?.units || 'Units'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-medium uppercase tracking-widest">
                {t.analytics_tab?.allInventoryOptimal || 'All Inventory Levels Optimal'}
              </div>
            )}
          </div>
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {t.analytics_tab?.lowStockActionDescription || "Accelerate procurement processes for these products to minimize operational risks."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">{t.analytics_tab?.topAccountsReceivable || 'Top Accounts Receivable'}</h3>
          <div className="space-y-3">
            {analytics.top_companies?.length > 0 ? (
              analytics.top_companies.map((company: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 group hover:bg-indigo-50 transition-all duration-200">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="text-[8px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-wider">{t.analytics_tab?.debtor || 'Debtor'}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{company.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        ID: {company.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-indigo-600">{Number(company.balance).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {(branding.default_currency || 'TRY').substring(0, 3)}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{t.analytics_tab?.balance || 'Balance'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-medium uppercase tracking-widest">
                {t.analytics_tab?.noOutstandingReceivables || 'No Outstanding Receivables'}
              </div>
            )}
          </div>
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {t.analytics_tab?.receivablesActionDescription || "Monitor collection processes for high-balance current accounts to maintain financial liquidity."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">{t.analytics_tab?.topScannedProducts || 'Top Scanned Products'}</h3>
          <div className="space-y-1">
            {analytics.top_products?.map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="text-xs font-bold text-slate-300 w-6">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-sm">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{product.category || t.analytics_tab?.generalCategory || 'General'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-indigo-600">{product.scan_count}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{t.analytics_tab?.scans || 'Scans'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-8">{t.analytics_tab?.recentScans || 'Recent Scans'}</h3>
          <div className="space-y-1">
            {analytics.recent_scans?.map((scan: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all duration-200">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="p-2 bg-slate-100 text-slate-400 rounded-lg shrink-0">
                    <Scan className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-sm">{scan.product_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">{new Date(scan.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900">{Number(scan.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {(branding.default_currency || 'TRY').substring(0, 3)}</p>
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

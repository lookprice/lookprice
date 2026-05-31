import React from "react";
import { 
  Building2,
  TrendingUp,
  History,
  ArrowLeftRight,
  BarChart3,
  Download
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { PortfolioAlerts } from "../../components/PortfolioAlerts";
import { PortfolioStrategicInsights } from "../../components/PortfolioStrategicInsights";

interface PortfolioAnalyticsTabProps {
  analytics: any; // Will contain portfolio analytics
  branding: any;
  loading?: boolean;
  onDateChange?: (start: string, end: string) => void;
  onNavigateTab?: (tab: string, status?: string) => void;
}

const PortfolioAnalyticsTab = ({ analytics, branding, loading, onDateChange, onNavigateTab }: PortfolioAnalyticsTabProps) => {
  const { lang } = useLanguage();
  const [dateRange, setDateRange] = React.useState('this_month');

  const handleDateChange = (range: string) => {
    setDateRange(range);
    if (!onDateChange) return;
    
    // Simple date calculation based on range
    const end = new Date().toISOString().split('T')[0];
    let start = new Date();
    if (range === 'last_month') start.setMonth(start.getMonth() - 1);
    else if (range === 'last_3_months') start.setMonth(start.getMonth() - 3);
    else start.setDate(1); // this month
    
    onDateChange(start.toISOString().split('T')[0], end);
  };

  const exportData = () => {
    // In a real scenario, this would trigger a download/export service
    console.log("Exporting portfolio data...", analytics);
    alert(lang === 'tr' ? 'Veriler dışa aktarılıyor...' : 'Exporting data...');
  };

  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);

  const getFilteredProperties = () => {
      if (!selectedStatus || !analytics?.properties) return [];
      return analytics.properties.filter((p: any) => p.status === selectedStatus);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Property Details Modal */}
      {selectedStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
             <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 capitalize">{selectedStatus} {lang === 'tr' ? 'Mülkler' : 'Properties'}</h3>
                    <button onClick={() => setSelectedStatus(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {getFilteredProperties().length > 0 ? getFilteredProperties().map((p: any, idx: number) => (
                        <div key={idx} className="p-3 border border-slate-100 rounded-lg flex justify-between">
                            <span className="font-medium text-slate-900">{p.title}</span>
                            <span className="text-indigo-600 font-bold">{p.price}</span>
                        </div>
                    )) : <p className="text-slate-500">{lang === 'tr' ? 'Bu statüde mülk bulunamadı.' : 'No properties found in this status.'}</p>}
                </div>
             </div>
          </div>
      )}
      {/* Portfolio Analytics Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            {lang === 'tr' ? 'Portföy Performans Analizi' : 'Portfolio Performance Analytics'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Portfolio_Insights_Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {onDateChange && (
              <select 
                  value={dateRange} 
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 rounded-lg px-3 py-2 outline-none"
              >
                  <option value="this_month">{lang === 'tr' ? 'Bu Ay' : 'This Month'}</option>
                  <option value="last_month">{lang === 'tr' ? 'Son 1 Ay' : 'Last Month'}</option>
                  <option value="last_3_months">{lang === 'tr' ? 'Son 3 Ay' : 'Last 3 Months'}</option>
              </select>
          )}
          <button 
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {lang === 'tr' ? 'Dışa Aktar' : 'Export'}
          </button>
        </div>
      </div>

      {/* Portfolio Stats (Example) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigateTab && onNavigateTab('real_estate', 'active')}
          className="os-panel p-6 bg-indigo-50 border border-indigo-100/50 shadow-sm cursor-pointer hover:bg-indigo-100/60 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.99] hover:shadow"
        >
           <p className="text-xs font-bold text-indigo-600 uppercase mb-1">{lang === 'tr' ? 'Aktif İlanlar' : 'Active Listings'}</p>
           <p className="text-[10px] text-indigo-400 mb-3 font-medium">{lang === 'tr' ? 'Piyasadaki aktif portföyünüz. (Yönetmek için Tıklayın)' : 'Current active properties in market. (Click to Manage)'}</p>
           <p className="text-3xl font-black text-slate-900 mono-data">{analytics?.active_listings || 0}</p>
        </div>
        <div 
          onClick={() => onNavigateTab && onNavigateTab('portfolio_finances')} 
          className="os-panel p-6 bg-emerald-50 border border-emerald-100/50 shadow-sm cursor-pointer hover:bg-emerald-100/60 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.99] hover:shadow"
        >
           <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{lang === 'tr' ? 'Tamamlanan İşlemler' : 'Completed Deals'}</p>
           <p className="text-[10px] text-emerald-400 mb-3 font-medium">{lang === 'tr' ? 'Bu dönem başarıyla sonuçlanan kasaya giren mülkler. (Finans Kasa için Tıklayın)' : 'Successfully closed deals this period. (Click for Finances Ledger)'}</p>
           <p className="text-3xl font-black text-slate-900 mono-data">{analytics?.completed_deals || 0}</p>
        </div>
        <div 
          onClick={() => onNavigateTab && onNavigateTab('real_estate')} 
          className="os-panel p-6 bg-amber-50 border border-amber-100/50 shadow-sm cursor-pointer hover:bg-amber-100/60 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.99] hover:shadow"
        >
           <p className="text-xs font-bold text-amber-600 uppercase mb-1">{lang === 'tr' ? 'Bekleyen Görevler' : 'Pending Tasks'}</p>
           <p className="text-[10px] text-amber-400 mb-3 font-medium">{lang === 'tr' ? 'İlginizi bekleyen aktif işler ve danışmanlık içgörüleri. (Görevleri Gör)' : 'Active tasks requiring attention. (Click to View Tasks)'}</p>
           <p className="text-3xl font-black text-slate-900 mono-data">{analytics?.pending_tasks || 0}</p>
        </div>
      </div>

      <PortfolioStrategicInsights insights={analytics?.strategic_insights} />
      <PortfolioAlerts alerts={analytics?.alerts || []} />
      
      {/* Property Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigateTab && onNavigateTab('real_estate', 'active')} 
            className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-left hover:bg-blue-100 transition-all hover:-translate-y-0.5"
          >
              <p className="text-[10px] font-bold text-blue-600 uppercase">{lang === 'tr' ? 'Aktif' : 'Active'}</p>
              <p className="text-xl font-black text-slate-900">{analytics?.status_counts?.active || 0}</p>
          </button>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('real_estate', 'optioned')} 
            className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-left hover:bg-orange-100 transition-all hover:-translate-y-0.5"
          >
              <p className="text-[10px] font-bold text-orange-600 uppercase">{lang === 'tr' ? 'Opsiyonlu' : 'Optioned'}</p>
              <p className="text-xl font-black text-slate-900">{analytics?.status_counts?.optioned || 0}</p>
          </button>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('real_estate', 'sold_or_rented')} 
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-left hover:bg-emerald-100 transition-all hover:-translate-y-0.5"
          >
              <p className="text-[10px] font-bold text-emerald-600 uppercase">{lang === 'tr' ? 'Satıldı/Kiralandı' : 'Sold/Rented'}</p>
              <p className="text-xl font-black text-slate-900">{analytics?.status_counts?.sold_or_rented || 0}</p>
          </button>
          <button 
            onClick={() => onNavigateTab && onNavigateTab('real_estate', 'all')} 
            className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-left hover:bg-slate-100 transition-all hover:-translate-y-0.5"
          >
              <p className="text-[10px] font-bold text-slate-600 uppercase">{lang === 'tr' ? 'Toplam' : 'Total'}</p>
              <p className="text-xl font-black text-slate-900">{analytics?.total_properties || 0}</p>
          </button>
      </div>
      
      {/* Performance Chart AND Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">
            {lang === 'tr' ? 'Performans Trendi' : 'Performance Trend'}
            </h3>
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.performance_chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">
                {lang === 'tr' ? 'Son Hareketler' : 'Recent Activities'}
            </h3>
            <div className="space-y-4">
                {analytics?.recent_activities?.length > 0 ? analytics.recent_activities.map((act: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500"></div>
                        <div>
                            <p className="text-xs text-slate-700 font-medium">{act.description}</p>
                            <p className="text-[10px] text-slate-400">{act.date}</p>
                        </div>
                    </div>
                )) : <p className="text-xs text-slate-400 italic">{lang === 'tr' ? 'Henüz hareket yok.' : 'No activities yet.'}</p>}
            </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider flex items-center gap-2">
           <History className="h-4 w-4 text-slate-500" />
           {lang === 'tr' ? 'Denetim İzi' : 'Audit Log'}
        </h3>
        <div className="space-y-4">
            {analytics?.audit_logs?.length > 0 ? analytics.audit_logs.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-4 border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                    <div className="text-[10px] text-slate-400 font-mono w-24 pt-0.5">{log.timestamp}</div>
                    <div className="flex-1">
                        <p className="text-xs text-slate-700 font-medium">{log.action}</p>
                        <p className="text-[10px] text-slate-400">{log.user}</p>
                    </div>
                </div>
            )) : <p className="text-xs text-slate-400 italic">{lang === 'tr' ? 'Kayıt bulunamadı.' : 'No logs found.'}</p>}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalyticsTab;

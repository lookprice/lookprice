import React from 'react';
import { Lightbulb, TrendingUp, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Insight {
  id: string;
  title: string;
  description: string;
  action: string;
  type: 'growth' | 'action' | 'opportunity';
}

interface PortfolioStrategicInsightsProps {
  insights?: Insight[];
}

export const PortfolioStrategicInsights: React.FC<PortfolioStrategicInsightsProps> = ({ insights }) => {
  const { lang } = useLanguage();

  // Default mock insights if none provided
  const displayInsights = insights || [
    {
      id: '1',
      type: 'opportunity',
      title: lang === 'tr' ? 'Düşük Görünürlük' : 'Low Visibility',
      description: lang === 'tr' ? '3 mülkünüz son 2 haftada az görüntülenme aldı.' : '3 properties received low views in the last 2 weeks.',
      action: lang === 'tr' ? 'Fiyatı Düzenle' : 'Adjust Price'
    },
    {
      id: '2',
      type: 'growth',
      title: lang === 'tr' ? 'Yükselen Trend' : 'Rising Trend',
      description: lang === 'tr' ? 'Villa kategorisinde talepler %15 arttı.' : 'Demand in Villa category grew by 15%.',
      action: lang === 'tr' ? 'Daha Fazla Edin' : 'Acquire More'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm border-l-4 border-l-indigo-500">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-indigo-500" />
        {lang === 'tr' ? 'Stratejik Fırsatlar' : 'Strategic Opportunities'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayInsights.map((insight) => (
          <div key={insight.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="space-y-1 mb-3">
               <div className="flex items-center gap-2">
                 {insight.type === 'growth' ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <Target className="h-4 w-4 text-amber-500" />}
                 <p className="text-xs font-bold text-slate-900">{insight.title}</p>
               </div>
               <p className="text-[11px] text-slate-500">{insight.description}</p>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg hover:border-indigo-200 transition-colors self-start">
               {insight.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

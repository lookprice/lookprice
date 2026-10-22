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
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/60 shadow-2xs border-l-4 border-l-indigo-500 space-y-2">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          {lang === 'tr' ? 'Stratejik Karar & Büyüme Fırsatları' : 'Strategic Growth Opportunities'}
        </h3>
        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
          AI Radar
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {displayInsights.map((insight) => (
          <div key={insight.id} className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between gap-1.5">
            <div className="space-y-0.5">
               <div className="flex items-center gap-1.5">
                 {insight.type === 'growth' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Target className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                 <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{insight.title}</p>
               </div>
               <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{insight.description}</p>
            </div>
            <button className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors self-start cursor-pointer shadow-2xs">
               {insight.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


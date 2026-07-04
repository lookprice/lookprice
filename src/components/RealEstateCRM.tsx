import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Plus, 
  MoreVertical, 
  Search,
  Filter,
  TrendingUp,
  Target,
  Handshake,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface RealEstateCRMProps {
  storeId: number;
  properties: any[];
  tasks: any[];
  onOpenCalendar: () => void;
  onOpenTourModal: (property: any) => void;
}

const STAGES = [
  { id: 'prospecting', title: 'Portföy Girişi', icon: Target, color: 'bg-slate-500' },
  { id: 'appointment', title: 'Randevu / Gezi', icon: Calendar, color: 'bg-indigo-500' },
  { id: 'negotiation', title: 'Teklif / Pazarlık', icon: TrendingUp, color: 'bg-amber-500' },
  { id: 'closed', title: 'Kapanış / Sonuç', icon: Handshake, color: 'bg-emerald-500' },
];

export const RealEstateCRM = ({ storeId, properties, tasks, onOpenCalendar, onOpenTourModal }: RealEstateCRMProps) => {
  const [dealCards, setDealCards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Generate Deal Cards based on properties and tasks
    const deals = properties.map(p => {
      const propertyTasks = tasks.filter(t => t.property_id === p.id && t.task_type === 'tour');
      
      let stage = 'prospecting';
      if (p.status === 'sold' || p.status === 'rented') {
        stage = 'closed';
      } else if (propertyTasks.some(t => !t.is_completed)) {
        stage = 'appointment';
      } else if (propertyTasks.length > 0) {
        stage = 'negotiation'; // If tours happened, assume it's in negotiation
      }

      return {
        id: `deal-${p.id}`,
        property: p,
        tasks: propertyTasks,
        stage: stage
      };
    });

    setDealCards(deals);
  }, [properties, tasks]);

  const filteredDeals = dealCards.filter(deal => {
    const searchLower = searchQuery.toLowerCase();
    return (
      deal.property.title?.toLowerCase().includes(searchLower) ||
      deal.property.reference_no?.toLowerCase().includes(searchLower) ||
      deal.property.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-[85vh] gap-6">
      {/* CRM Stats & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Satış & Kiralama Hunisi (Pipeline)</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gayrimenkul CRM Yönetimi</p>
          </div>
        </div>

        {/* Pipeline Insights */}
        <div className="hidden lg:flex items-center gap-6 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
          <div className="px-4 border-r border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktif Randevular</p>
            <p className="text-lg font-black text-indigo-600">{tasks.filter(t => t.task_type === 'tour' && !t.is_completed).length}</p>
          </div>
          <div className="px-4 border-r border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pazarlıkta</p>
            <p className="text-lg font-black text-amber-500">{properties.filter(p => p.status === 'active' && tasks.some(t => t.property_id === p.id && t.is_completed)).length}</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kapanan İşler</p>
            <p className="text-lg font-black text-emerald-500">{properties.filter(p => p.status === 'sold' || p.status === 'rented').length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Fırsat ara..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            Takvime Git
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-[1200px]">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex-1 flex flex-col gap-4 min-w-[300px]">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${stage.color} flex items-center justify-center text-white shadow-sm`}>
                      <StageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{stage.title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold">{stageDeals.length} Fırsat</p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-slate-50/50 border border-slate-200/60 rounded-[2rem] p-3 space-y-3 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {stageDeals.map(deal => (
                      <motion.div
                        key={deal.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-sm">
                            {deal.property.images?.[0] ? (
                              <img src={deal.property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <MapPin className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                {deal.property.reference_no}
                              </span>
                              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 truncate mt-1 leading-tight">
                              {deal.property.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{deal.property.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Task Info */}
                        {deal.tasks.length > 0 && (
                          <div className="bg-indigo-50/50 rounded-xl p-2 mb-3 border border-indigo-100/50">
                            <div className="flex items-center gap-2 text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">
                              <Clock className="w-3 h-3" />
                              Son Etkinlik
                            </div>
                            <p className="text-[10px] text-indigo-900 font-bold truncate">
                              {deal.tasks[0].description}
                            </p>
                            <p className="text-[8px] text-indigo-500 font-black mt-0.5">
                              {format(parseISO(deal.tasks[0].due_date), 'd MMM HH:mm', { locale: tr })}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="text-xs font-black text-slate-900">
                            {deal.property.price} {deal.property.currency}
                          </div>
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                              {deal.property.responsible_consultant_id ? 'D' : 'LP'}
                            </div>
                          </div>
                        </div>

                        {stage.id === 'prospecting' && (
                          <button 
                            onClick={() => onOpenTourModal(deal.property)}
                            className="w-full mt-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-3 h-3" />
                            Gezi Planla
                          </button>
                        )}
                      </motion.div>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Hüzünlü Boşluk...</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

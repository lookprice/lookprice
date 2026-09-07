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
  Calendar,
  MessageSquare,
  DollarSign,
  ArrowRight,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format, parseISO, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

interface RealEstateCRMProps {
  storeId: number;
  properties: any[];
  tasks: any[];
  onOpenCalendar: () => void;
  onOpenTourModal: (property: any) => void;
  onRefresh?: () => void;
}

const STAGES = [
  { id: 'planned', title: 'Planlanan Geziler', icon: Calendar, color: 'bg-indigo-500', description: 'Gelecek randevular ve yer göstermeler.' },
  { id: 'analysis', title: 'Gezi Sonrası Analiz', icon: Search, color: 'bg-slate-500', description: 'Görüşme tamamlandı, geri dönüş bekleniyor.' },
  { id: 'negotiation', title: 'Teklif & Pazarlık', icon: TrendingUp, color: 'bg-amber-500', description: 'Ciddi teklif alındı, pazarlık süreci aktif.' },
  { id: 'negative', title: 'Olumsuz Görüşme', icon: X, color: 'bg-rose-500', description: 'Sonuçsuz kalan veya olumsuz geziler.' },
  { id: 'closed', title: 'Başarı ile Kapandı', icon: Handshake, color: 'bg-emerald-500', description: 'Satış veya kiralama sonuçlandırıldı.' },
];

export const RealEstateCRM = ({ storeId, properties, tasks, onOpenCalendar, onOpenTourModal, onRefresh }: RealEstateCRMProps) => {
  const [dealCards, setDealCards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const deals = properties.map(p => {
      const propertyTasks = tasks.filter(t => t.property_id === p.id && t.task_type === 'tour');
      
      let stage = 'planned';
      
      if (p.status === 'sold' || p.status === 'rented') {
        stage = 'closed';
      } else if (p.status === 'optioned') {
        stage = 'negotiation';
      } else if (propertyTasks.length > 0) {
        const hasPending = propertyTasks.some(t => t.is_completed === false || t.is_completed === 0 || !t.is_completed);
        const hasCompleted = propertyTasks.some(t => t.is_completed === true || t.is_completed === 1);
        const hasNegative = propertyTasks.some(t => t.completion_note?.includes('Olumsuz'));
        
        // Eğer tamamlanmış bir gezi varsa ve statü normal ise analize taşıyoruz
        if (hasPending) {
          stage = 'planned';
        } else if (hasNegative) {
          stage = 'negative';
        } else if (hasCompleted) {
          stage = 'analysis';
        }
      } else {
        return null;
      }

      return {
        id: `deal-${p.id}`,
        property: p,
        tasks: propertyTasks,
        stage: stage
      };
    }).filter(Boolean);

    setDealCards(deals);
  }, [properties, tasks]);

  const handleCompleteTour = async (task: any, property: any) => {
    setSelectedTask(task);
    setActiveProperty(property);
    setShowAnalysisModal(true);
  };

  const submitAnalysis = async () => {
    if (!analysisNote) {
      toast.error("Lütfen görüşme notlarını giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.completeTask(selectedTask.id, storeId, { 
        completion_note: analysisNote,
        completed_at: new Date().toISOString()
      });

      toast.success("Gezi analizi kaydedildi.");
      setShowAnalysisModal(false);
      setAnalysisNote("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("İşlem başarısız oldu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = (task: any) => {
    setSelectedTask(task);
    const date = task.due_date ? parseISO(task.due_date) : new Date();
    setNewDate(format(date, 'yyyy-MM-dd'));
    setNewTime(format(date, 'HH:mm'));
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    setIsSubmitting(true);
    try {
      const updatedDate = `${newDate}T${newTime}:00`;
      await api.updateTask(selectedTask.id, { due_date: updatedDate }, storeId);
      toast.success("Randevu saati güncellendi.");
      setShowRescheduleModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Güncelleme başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveToNegotiation = async (property: any) => {
    try {
      await api.updateProduct(property.id, { status: 'optioned' }, storeId);
      toast.success("Pazarlık aşamasına taşındı (Kapora Alındı)");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const closeDeal = async (property: any) => {
    try {
      const newStatus = property.sector_data?.listing_intent === 'rent' ? 'rented' : 'sold';
      await api.updateProduct(property.id, { status: newStatus }, storeId);
      toast.success(newStatus === 'sold' ? "Portföy Başarıyla Satıldı!" : "Portföy Başarıyla Kiralandı!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const filteredDeals = dealCards.filter(deal => {
    const searchLower = searchQuery.toLowerCase();
    return (
      deal.property.title?.toLowerCase().includes(searchLower) ||
      deal.property.reference_no?.toLowerCase().includes(searchLower) ||
      deal.property.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-[88vh] gap-4">
      {/* CRM Stats & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Portfolio Pipeline</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Gayrimenkul CRM & Süreç Yönetimi</p>
          </div>
        </div>

        {/* Pipeline Insights */}
        <div className="hidden lg:flex items-center gap-6 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
          <div className="px-4 border-r border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Randevular</p>
            <p className="text-lg font-black text-indigo-600">{tasks.filter(t => t.task_type === 'tour' && !t.is_completed).length}</p>
          </div>
          <div className="px-4 border-r border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pazarlıkta</p>
            <p className="text-lg font-black text-amber-500">{properties.filter(p => p.status === 'optioned').length}</p>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            Takvime Git
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-[1200px] pr-10 overflow-x-auto">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex-1 flex flex-col gap-4 min-w-[260px] max-w-[300px]">
                {/* Column Header */}
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stage.color} flex items-center justify-center text-white shadow-lg`}>
                      <StageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1 whitespace-nowrap">{stage.title}</h3>
                      <p className="text-[10px] text-slate-500 font-bold">{stageDeals.length} Fırsat</p>
                    </div>
                  </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-slate-50/50 border border-slate-200/60 rounded-[2.5rem] p-4 space-y-4 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {stageDeals.map(deal => {
                      const latestTask = deal.tasks.sort((a:any, b:any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0];
                      
                      return (
                        <motion.div
                          key={deal.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-inner">
                              {deal.property.images?.[0] ? (
                                <img src={deal.property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <MapPin className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                                  REF: {deal.property.reference_no}
                                </span>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                              </div>
                              <h4 className="text-[13px] font-black text-slate-900 truncate mt-1 leading-tight">
                                {deal.property.title}
                              </h4>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold mt-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{deal.property.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Activity / Task Info */}
                          {latestTask && (
                            <div className={`rounded-2xl p-3 mb-4 border ${latestTask.is_completed ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100/50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${latestTask.is_completed ? 'text-slate-400' : 'text-indigo-700'}`}>
                                  {latestTask.is_completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                  {latestTask.is_completed ? 'Tamamlanan Görüşme' : 'Gelecek Randevu'}
                                </div>
                                {!latestTask.is_completed && (
                                  <button 
                                    onClick={() => handleReschedule(latestTask)}
                                    className="p-1.5 hover:bg-white rounded-lg text-indigo-600 transition-all active:scale-95"
                                    title="Randevuyu Revize Et"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className={`text-[11px] font-bold leading-tight ${latestTask.is_completed ? 'text-slate-500' : 'text-indigo-900'}`}>
                                {latestTask.description}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className={`text-[9px] font-black uppercase tracking-wider ${latestTask.is_completed ? 'text-slate-400' : 'text-indigo-500'}`}>
                                  {format(parseISO(latestTask.due_date), 'd MMMM yyyy HH:mm', { locale: tr })}
                                </span>
                              </div>
                              {latestTask.completion_note && (
                                <div className="mt-3 pt-3 border-t border-slate-200/60">
                                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    <MessageSquare className="w-3 h-3" />
                                    Analiz Notu
                                  </div>
                                  <p className="text-[10px] text-slate-600 font-bold leading-relaxed italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                    {latestTask.completion_note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-3">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Değer</span>
                               <span className="text-sm font-black text-slate-900">
                                 {deal.property.price} {deal.property.currency}
                               </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {stage.id === 'planned' && (
                                <button 
                                  onClick={() => handleCompleteTour(latestTask, deal.property)}
                                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100 active:scale-95"
                                >
                                  Gezisi Tamamla
                                </button>
                              )}

                              {stage.id === 'analysis' && (
                                <button 
                                  onClick={() => moveToNegotiation(deal.property)}
                                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-50 active:scale-95 flex items-center gap-1.5"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Pazarlığa Taşı
                                </button>
                              )}

                              {stage.id === 'negotiation' && (
                                <button 
                                  onClick={() => closeDeal(deal.property)}
                                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 active:scale-95 flex items-center gap-1.5"
                                >
                                  <Handshake className="w-3.5 h-3.5" />
                                  İşi Kapat
                                </button>
                              )}
                            </div>
                          </div>

                          {stage.id === 'planned' && (
                            <button 
                              onClick={() => onOpenTourModal(deal.property)}
                              className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Ek Gezi Planla
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {stageDeals.length === 0 && (
                      <div className="py-12 text-center bg-white/20 border border-dashed border-slate-200 rounded-[2.5rem]">
                        <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                          Bu aşamada aktif <br /> aktivite bulunmuyor.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Gezi Analizi</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Müşteri Geri Bildirimi</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                   <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                     <Target className="w-3.5 h-3.5" />
                     Görüşülen Portföy
                   </div>
                   <p className="text-xs font-black text-slate-900 leading-tight">{activeProperty?.title}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 ml-1">Görüşme Sonucu & Operatör Notu</label>
                  <textarea 
                    className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold min-h-[140px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                    placeholder="Müşteri salonu küçük buldu... Kredi onayına göre dönecek... Kapora ödemesi yarın planlandı..."
                    value={analysisNote}
                    onChange={(e) => setAnalysisNote(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  {['Haber Bekliyor', 'Kapora Verecek', 'Olumsuz', 'Kredi Başvurusu'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setAnalysisNote(prev => prev ? `${prev} - ${tag}` : tag)}
                      className="flex-1 min-w-[45%] py-2.5 bg-white text-[9px] font-black uppercase text-slate-600 rounded-xl border border-slate-100 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitAnalysis}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Kaydediliyor...' : 'Analizi Tamamla & İlerlet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-[1.5rem]">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Randevu Revize Et</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tarih & Saat Güncelleme</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 ml-1">Yeni Tarih</label>
                    <input 
                      type="date"
                      className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 ml-1">Yeni Saat</label>
                    <input 
                      type="time"
                      className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-800">
                  <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold leading-relaxed italic">
                    Gezinin yeni tarih ve saati kaydedildiğinde, ilgili danışman ve müşteriye otomatik bildirim iletilecektir.
                  </p>
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitReschedule}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-2xl shadow-amber-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Güncelleniyor...' : 'Revize Et ve Onayla'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

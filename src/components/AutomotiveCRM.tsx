import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ChevronRight, 
  Clock, 
  Car, 
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

interface AutomotiveCRMProps {
  storeId: number;
  vehicles: any[];
  tasks: any[];
  onOpenCalendar: () => void;
  onRefresh?: () => void;
}

const STAGES = [
  { id: 'planned', title: 'Planlanan Randevular', icon: Calendar, color: 'bg-indigo-500', description: 'Gelecek müşteri randevuları.' },
  { id: 'analysis', title: 'Ekspertiz / İnceleme', icon: Search, color: 'bg-slate-500', description: 'Araç ekspertizi veya inceleme süreci.' },
  { id: 'negotiation', title: 'Teklif & Pazarlık', icon: TrendingUp, color: 'bg-amber-500', description: 'Ciddi teklif alındı, pazarlık süreci aktif.' },
  { id: 'closed', title: 'Satış / Kapandı', icon: Handshake, color: 'bg-emerald-500', description: 'Satış sonuçlandırıldı.' },
];

export const AutomotiveCRM = ({ storeId, vehicles, tasks, onOpenCalendar, onRefresh }: AutomotiveCRMProps) => {
  const [dealCards, setDealCards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const deals = vehicles.map(v => {
      const vehicleTasks = tasks.filter(t => t.vehicle_id === v.id && t.task_type === 'appointment');
      
      let stage = 'planned';
      
      if (v.status === 'sold') {
        stage = 'closed';
      } else if (v.status === 'negotiation') {
        stage = 'negotiation';
      } else if (v.status === 'inspection') {
        stage = 'analysis';
      } else if (vehicleTasks.length > 0) {
        const hasPending = vehicleTasks.some(t => t.is_completed === false || t.is_completed === 0 || !t.is_completed);
        const hasCompleted = vehicleTasks.some(t => t.is_completed === true || t.is_completed === 1);
        
        if (hasCompleted && !hasPending) {
          stage = 'analysis';
        } else if (hasPending) {
          stage = 'planned';
        } else if (hasCompleted) {
          stage = 'analysis';
        }
      } else {
        return null;
      }

      return {
        id: `deal-${v.id}`,
        vehicle: v,
        tasks: vehicleTasks,
        stage: stage
      };
    }).filter(Boolean);

    setDealCards(deals);
  }, [vehicles, tasks]);

  const handleCompleteAppointment = async (task: any, vehicle: any) => {
    setSelectedTask(task);
    setActiveVehicle(vehicle);
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

      toast.success("Ekspertiz analizi kaydedildi.");
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

  const moveToNegotiation = async (vehicle: any) => {
    try {
      await api.updateVehicle(vehicle.id, { status: 'negotiation' });
      toast.success("Pazarlık aşamasına taşındı");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const closeDeal = async (vehicle: any) => {
    try {
      await api.updateVehicle(vehicle.id, { status: 'sold' });
      toast.success("Araç Başarıyla Satıldı!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const filteredDeals = dealCards.filter(deal => {
    const searchLower = searchQuery.toLowerCase();
    return (
      deal.vehicle.brand?.toLowerCase().includes(searchLower) ||
      deal.vehicle.model?.toLowerCase().includes(searchLower) ||
      deal.vehicle.plate?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col h-[85vh] gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Araç Satış Pipeline</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Otomotiv CRM & Süreç Yönetimi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Araç veya müşteri ara..."
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
            Randevu Takvimi
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-[1450px] pr-20">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="flex-1 flex flex-col gap-4 min-w-[340px]">
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
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-inner">
                              {deal.vehicle.image_url ? (
                                <img src={deal.vehicle.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Car className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-tighter">
                                  {deal.vehicle.plate}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 truncate mt-2 leading-tight">
                                {deal.vehicle.brand} {deal.vehicle.model}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">
                                {deal.vehicle.year} • {deal.vehicle.mileage} KM
                              </p>
                            </div>
                          </div>

                          {latestTask && (
                            <div className={`rounded-2xl p-3 mb-4 border ${latestTask.is_completed ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100/50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${latestTask.is_completed ? 'text-slate-400' : 'text-indigo-700'}`}>
                                  {latestTask.is_completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                  {latestTask.is_completed ? 'Tamamlanan Randevu' : 'Gelecek Randevu'}
                                </div>
                                {!latestTask.is_completed && (
                                  <button 
                                    onClick={() => handleReschedule(latestTask)}
                                    className="p-1.5 hover:bg-white rounded-lg text-indigo-600 transition-all active:scale-95"
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
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-3">
                            <div className="flex flex-col">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fiyat</span>
                               <span className="text-sm font-black text-slate-900">
                                 {deal.vehicle.price} {deal.vehicle.currency}
                               </span>
                            </div>
                            
                            <div className="flex gap-2">
                              {stage.id === 'planned' && (
                                <button 
                                  onClick={() => handleCompleteAppointment(latestTask, deal.vehicle)}
                                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100 active:scale-95"
                                >
                                  Randevuyu Tamamla
                                </button>
                              )}

                              {stage.id === 'analysis' && (
                                <button 
                                  onClick={() => moveToNegotiation(deal.vehicle)}
                                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-lg shadow-amber-50 active:scale-95 flex items-center gap-1.5"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Pazarlığa Taşı
                                </button>
                              )}

                              {stage.id === 'negotiation' && (
                                <button 
                                  onClick={() => closeDeal(deal.vehicle)}
                                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50 active:scale-95 flex items-center gap-1.5"
                                >
                                  <Handshake className="w-3.5 h-3.5" />
                                  Satışı Kapat
                                </button>
                              )}
                            </div>
                          </div>
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
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Ekspertiz Analizi</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Müşteri Geri Bildirimi</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                   <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                     <Car className="w-3.5 h-3.5" />
                     Görüşülen Araç
                   </div>
                   <p className="text-xs font-black text-slate-900 leading-tight">{activeVehicle?.brand} {activeVehicle?.model}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 ml-1">Ekspertiz Notu</label>
                  <textarea 
                    className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-sm font-bold min-h-[140px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                    placeholder="Ekspertiz notları..."
                    value={analysisNote}
                    onChange={(e) => setAnalysisNote(e.target.value)}
                  />
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

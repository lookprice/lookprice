import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Car, 
  Search, 
  TrendingUp, 
  Handshake, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  ArrowRight, 
  X, 
  Edit2, 
  Trash2, 
  Info,
  Phone,
  MessageCircle,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { VehicleAppointmentModal } from './VehicleAppointmentModal';

interface AutomotiveCRMProps {
  storeId: number;
  vehicles: any[];
  tasks: any[];
  onOpenCalendar?: () => void;
  onRefresh?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  hideHeader?: boolean;
}

const STAGES = [
  { id: 'planned', title: 'Planlanan Randevular', icon: Calendar, color: 'bg-indigo-600', textBadge: 'text-indigo-700 bg-indigo-50 border-indigo-200/80', description: 'Gelecek müşteri randevuları.' },
  { id: 'analysis', title: 'Ekspertiz / İnceleme', icon: Search, color: 'bg-slate-700', textBadge: 'text-slate-700 bg-slate-100 border-slate-200', description: 'Araç ekspertizi veya inceleme süreci.' },
  { id: 'negotiation', title: 'Teklif & Pazarlık', icon: TrendingUp, color: 'bg-amber-600', textBadge: 'text-amber-700 bg-amber-50 border-amber-200/80', description: 'Ciddi teklif alındı, pazarlık süreci aktif.' },
  { id: 'closed', title: 'Satış / Kapandı', icon: Handshake, color: 'bg-emerald-600', textBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200/80', description: 'Satış sonuçlandırıldı.' },
];

export const AutomotiveCRM = ({ 
  storeId, 
  vehicles, 
  tasks, 
  onOpenCalendar, 
  onRefresh,
  searchQuery: externalSearchQuery,
  onSearchChange,
  hideHeader = true
}: AutomotiveCRMProps) => {
  const [dealCards, setDealCards] = useState<any[]>([]);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<'all' | 'active_pipeline'>('active_pipeline');
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [analysisNote, setAnalysisNote] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState("10:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Appointment Modal State
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentVehicleId, setAppointmentVehicleId] = useState<number | string | undefined>(undefined);

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  useEffect(() => {
    const deals = vehicles.map(v => {
      const vehicleTasks = tasks.filter(t => 
        (t.vehicle_id === v.id || t.property_id === v.id) && t.task_type === 'appointment'
      );
      
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
        // Vehicle without active tasks/status
        if (filterMode === 'active_pipeline') {
          return null;
        }
        stage = 'planned';
      }

      return {
        id: `deal-${v.id}`,
        vehicle: v,
        tasks: vehicleTasks,
        stage: stage
      };
    }).filter(Boolean);

    setDealCards(deals);
  }, [vehicles, tasks, filterMode]);

  const handleOpenAppointmentModal = (vehicleId?: number | string) => {
    setAppointmentVehicleId(vehicleId || (vehicles[0]?.id || undefined));
    setIsAppointmentModalOpen(true);
  };

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
      if (selectedTask) {
        await api.completeTask(selectedTask.id, storeId, { 
          completion_note: analysisNote,
          completed_at: new Date().toISOString()
        });
      }
      if (activeVehicle) {
        await api.updateVehicle(activeVehicle.id, { status: 'inspection' });
      }

      toast.success("Ekspertiz analizi kaydedildi ve aşama güncellendi.");
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

  const changeVehicleStage = async (vehicle: any, targetStage: string) => {
    try {
      let newStatus = 'active';
      if (targetStage === 'closed') newStatus = 'sold';
      else if (targetStage === 'negotiation') newStatus = 'negotiation';
      else if (targetStage === 'analysis') newStatus = 'inspection';
      else if (targetStage === 'planned') newStatus = 'active';

      await api.updateVehicle(vehicle.id, { status: newStatus });
      toast.success(`Araç durumu güncellendi: ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Aşama güncellenirken hata oluştu.");
    }
  };

  const filteredDeals = dealCards.filter(deal => {
    const searchLower = (activeSearch || "").toLowerCase();
    return (
      deal.vehicle.brand?.toLowerCase().includes(searchLower) ||
      deal.vehicle.model?.toLowerCase().includes(searchLower) ||
      deal.vehicle.plate?.toLowerCase().includes(searchLower)
    );
  });

  const parseCustomerInfo = (description: string) => {
    if (!description) return { name: 'Müşteri', phone: '' };
    // Format: "Randevu: Ahmet Yılmaz (05320000000) - Notlar"
    const match = description.match(/Randevu:\s*([^(]+)(?:\(([^)]+)\))?/i);
    if (match) {
      return {
        name: match[1]?.trim() || 'Müşteri',
        phone: match[2]?.trim() || ''
      };
    }
    return { name: description.split('-')[0]?.trim() || 'Müşteri', phone: '' };
  };

  return (
    <div className="flex flex-col gap-2.5 w-full min-w-0">
      {/* TOOLBAR & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200/80 p-2.5 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterMode('active_pipeline')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'active_pipeline'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Süreçteki Araçlar ({dealCards.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tüm Portföy ({vehicles.length})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-2">
            {STAGES.map(stage => {
              const count = filteredDeals.filter(d => d.stage === stage.id).length;
              return (
                <span key={stage.id} className={`px-2 py-0.5 border rounded-md text-[10px] font-bold flex items-center gap-1 ${stage.textBadge}`}>
                  <span>{stage.title}:</span>
                  <span className="font-mono font-black">{count}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAppointmentModal()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Yeni Randevu / Fırsat</span>
          </button>

          {onOpenCalendar && (
            <button 
              onClick={onOpenCalendar}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Randevu Takvimi</span>
            </button>
          )}

          {externalSearchQuery === undefined && (
            <div className="relative w-36 sm:w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Araç veya plaka..."
                className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                value={internalSearchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4-COLUMN RESPONSIVE PIPELINE GRID */}
      <div className="w-full min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full min-w-0 items-start">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
            const StageIcon = stage.icon;

            return (
              <div 
                key={stage.id} 
                className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 flex flex-col gap-2 min-w-0 shadow-2xs"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between px-1 py-0.5 border-b border-slate-200/70 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-5 h-5 rounded-md ${stage.color} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                      <StageIcon className="w-3 h-3" />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                      {stage.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-black bg-slate-200/90 text-slate-700 px-1.5 py-0.2 rounded shrink-0">
                      {stageDeals.length}
                    </span>
                    <button
                      onClick={() => handleOpenAppointmentModal()}
                      className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                      title="Bu aşamaya yeni randevu ekle"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Column Card List */}
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-230px)] min-h-[160px] custom-scrollbar pr-0.5">
                  <AnimatePresence mode="popLayout">
                    {stageDeals.map(deal => {
                      const latestTask = deal.tasks?.sort((a:any, b:any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0];
                      const cust = latestTask ? parseCustomerInfo(latestTask.description) : { name: '', phone: '' };

                      return (
                        <motion.div
                          key={deal.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all group flex flex-col gap-2"
                        >
                          {/* Vehicle Header & Thumbnail */}
                          <div className="flex items-start gap-2.5">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70 relative">
                              {deal.vehicle.images || deal.vehicle.image_url ? (
                                <img 
                                  src={
                                    Array.isArray(deal.vehicle.images) ? deal.vehicle.images[0] :
                                    typeof deal.vehicle.images === 'string' && deal.vehicle.images.startsWith('[') ? JSON.parse(deal.vehicle.images)[0] :
                                    deal.vehicle.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=400'
                                  } 
                                  alt="" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Car className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[9px] font-mono font-black bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded uppercase tracking-tight border border-slate-200/60">
                                  {deal.vehicle.plate || `#${deal.vehicle.id}`}
                                </span>
                                <span className="text-[11px] font-black text-indigo-700 font-mono">
                                  {deal.vehicle.selling_price ? `${Number(deal.vehicle.selling_price).toLocaleString()} ${deal.vehicle.currency || 'TRY'}` : deal.vehicle.price ? `${deal.vehicle.price} ${deal.vehicle.currency || 'TRY'}` : 'Fiyat Belirtilmedi'}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                                {deal.vehicle.brand} {deal.vehicle.model}
                              </h4>
                              <p className="text-[9px] text-slate-500 font-bold">
                                {deal.vehicle.year || '-'} • {deal.vehicle.current_mileage ? `${deal.vehicle.current_mileage.toLocaleString()} KM` : deal.vehicle.mileage ? `${deal.vehicle.mileage} KM` : '-'}
                              </p>
                            </div>
                          </div>

                          {/* Latest Task / Appointment Snippet */}
                          {latestTask ? (
                            <div className={`rounded-lg p-2 border text-[10px] font-bold ${
                              latestTask.is_completed 
                                ? 'bg-slate-50/80 border-slate-200 text-slate-600' 
                                : 'bg-indigo-50/60 border-indigo-200/70 text-indigo-900'
                            }`}>
                              <div className="flex items-center justify-between mb-1 text-[9px] font-black uppercase">
                                <span className="flex items-center gap-1">
                                  {latestTask.is_completed ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-indigo-600" />
                                  )}
                                  <span>{latestTask.is_completed ? 'Randevu Tamamlandı' : 'Planlanan Randevu'}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  {!latestTask.is_completed && (
                                    <button 
                                      onClick={() => handleReschedule(latestTask)}
                                      className="p-0.5 hover:bg-white text-indigo-600 rounded transition-colors cursor-pointer"
                                      title="Tarihi güncelle"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {cust.name && (
                                <p className="text-[10px] text-slate-800 font-extrabold truncate">
                                  {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                                </p>
                              )}

                              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {format(parseISO(latestTask.due_date), 'd MMM HH:mm', { locale: tr })}
                                </span>

                                {cust.phone && (
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={`tel:${cust.phone}`}
                                      className="p-1 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded transition-colors"
                                      title="Müşteriyi Ara"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                    </a>
                                    <a
                                      href={`https://wa.me/${cust.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Merhaba, ${deal.vehicle.brand} ${deal.vehicle.model} aracımız için planlanan randevunuz hakkında görüşmek istedik.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded transition-colors"
                                      title="WhatsApp'tan Yaz"
                                    >
                                      <MessageCircle className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAppointmentModal(deal.vehicle.id)}
                              className="w-full py-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-dashed border-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Randevu / Test Sürüşü Planla</span>
                            </button>
                          )}

                          {/* Quick Stage Action Buttons */}
                          <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
                            {stage.id === 'planned' && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleCompleteAppointment(latestTask, deal.vehicle)}
                                  className="flex-1 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 text-center flex items-center justify-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Ekspertiz / İnceleme</span>
                                </button>
                                <button
                                  onClick={() => changeVehicleStage(deal.vehicle, 'negotiation')}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-bold"
                                  title="Doğrudan Pazarlığa Taşı"
                                >
                                  Pazarlık
                                </button>
                              </div>
                            )}

                            {stage.id === 'analysis' && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => changeVehicleStage(deal.vehicle, 'negotiation')}
                                  className="flex-1 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>Teklif & Pazarlığa Taşı</span>
                                </button>
                                <button
                                  onClick={() => handleOpenAppointmentModal(deal.vehicle.id)}
                                  className="p-1 text-slate-500 hover:bg-slate-100 rounded border border-slate-200"
                                  title="Yeni Randevu Ekle"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {stage.id === 'negotiation' && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => changeVehicleStage(deal.vehicle, 'closed')}
                                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center gap-1"
                                >
                                  <Handshake className="w-3 h-3" />
                                  <span>Satışı Kapat</span>
                                </button>
                                <button 
                                  onClick={() => changeVehicleStage(deal.vehicle, 'analysis')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold"
                                  title="Ekspertize geri al"
                                >
                                  Geri
                                </button>
                              </div>
                            )}

                            {stage.id === 'closed' && (
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                  ✓ Satıldı
                                </div>
                                <button
                                  onClick={() => changeVehicleStage(deal.vehicle, 'planned')}
                                  className="text-[9px] font-bold text-slate-400 hover:text-slate-600 hover:underline"
                                >
                                  Portföye Geri Al
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Minimalist Empty Indicator */}
                    {stageDeals.length === 0 && (
                      <div className="py-6 px-2 text-center bg-white/50 border border-dashed border-slate-200 rounded-xl space-y-1.5">
                        <Info className="w-4 h-4 text-slate-300 mx-auto" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Aktif Araç Yok
                        </p>
                        <button
                          onClick={() => handleOpenAppointmentModal()}
                          className="text-[9px] font-black text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" /> Randevu Oluştur
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ekspertiz Analizi Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white">Ekspertiz / Görüşme Analizi</h3>
                    <p className="text-[9px] text-slate-400 font-bold">Müşteri Geri Bildirimi & Durum</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs font-bold bg-slate-50/30">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Görüşülen Araç</span>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {activeVehicle?.brand} {activeVehicle?.model} ({activeVehicle?.plate || 'Plakasız'})
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Ekspertiz Notu & Müşteri Talepleri
                  </label>
                  <textarea 
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold min-h-[90px] focus:border-indigo-500 outline-none resize-none shadow-2xs"
                    placeholder="Müşteri aracı inceledi, test sürüşü yapıldı, fiyat teklifi istendi..."
                    value={analysisNote}
                    onChange={(e) => setAnalysisNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={submitAnalysis}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Kaydediliyor...' : 'Analizi Tamamla & İlerlet'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Randevu Yenileme Modal */}
      <AnimatePresence>
        {showRescheduleModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white">Randevu Tarihini Güncelle</h3>
                    <p className="text-[9px] text-slate-400 font-bold">Yeni Tarih ve Saat Seçimi</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRescheduleModal(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs font-bold bg-slate-50/30">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Yeni Tarih *
                    </label>
                    <input 
                      type="date" 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:border-indigo-500 outline-none"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Yeni Saat *
                    </label>
                    <input 
                      type="time" 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:border-indigo-500 outline-none"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={submitReschedule}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Güncelleniyor...' : 'Revize Et & Onayla'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Appointment Creation Modal */}
      {isAppointmentModalOpen && (
        <VehicleAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          storeId={storeId}
          vehicles={vehicles}
          initialVehicleId={appointmentVehicleId}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

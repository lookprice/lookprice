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
  Info,
  RotateCcw,
  FileCheck,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
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
  { id: 'planned', title: '1. Geziler', icon: Calendar, color: 'bg-indigo-500', description: 'Gelecek randevular ve yer göstermeler.' },
  { id: 'analysis', title: '2. Analiz', icon: Search, color: 'bg-slate-500', description: 'Görüşme tamamlandı, geri dönüş bekleniyor.' },
  { id: 'negotiation', title: '3. Pazarlık', icon: TrendingUp, color: 'bg-amber-500', description: 'Ciddi teklif alındı, pazarlık & opsiyon aktif.' },
  { id: 'negative', title: '4. Olumsuz', icon: X, color: 'bg-rose-500', description: 'Sonuçsuz kalan veya olumsuz geziler.' },
  { id: 'closed', title: '5. Kapanan', icon: Handshake, color: 'bg-emerald-500', description: 'Satış veya kiralama sonuçlandırıldı.' },
];

export const RealEstateCRM = ({ storeId, properties, tasks, onOpenCalendar, onOpenTourModal, onRefresh }: RealEstateCRMProps) => {
  const [dealCards, setDealCards] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Modals state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);

  // Form Inputs
  const [analysisNote, setAnalysisNote] = useState("");
  const [analysisOutcome, setAnalysisOutcome] = useState<'analysis' | 'negotiation' | 'negative'>('analysis');
  
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState("10:00");

  const [offerAmount, setOfferAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [negotiationNotes, setNegotiationNotes] = useState("");

  const [finalPrice, setFinalPrice] = useState("");
  const [clientInfo, setClientInfo] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [negativeReason, setNegativeReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build Pipeline deals matching Requirements 1, 2, and 3
  useEffect(() => {
    const deals = properties.map(p => {
      const propertyTasks = tasks.filter(t => t.property_id === p.id && t.task_type === 'tour');
      
      let stage = 'planned';

      // Custom override stage saved in sector_data or status
      const overrideStage = p.sector_data?.pipeline_stage;

      if (p.status === 'sold' || p.status === 'rented') {
        stage = 'closed';
      } else if (p.status === 'optioned' || overrideStage === 'negotiation') {
        stage = 'negotiation';
      } else if (p.status === 'negative' || overrideStage === 'negative') {
        stage = 'negative';
      } else if (overrideStage === 'analysis') {
        stage = 'analysis';
      } else if (propertyTasks.length > 0) {
        const hasPending = propertyTasks.some(t => !t.is_completed);
        const hasCompleted = propertyTasks.some(t => t.is_completed);
        const hasNegativeTask = propertyTasks.some(t => t.completion_note?.toLowerCase().includes('olumsuz'));

        if (hasPending) {
          stage = 'planned';
        } else if (hasNegativeTask) {
          stage = 'negative';
        } else if (hasCompleted) {
          stage = 'analysis';
        }
      } else {
        // REQUIREMENT 3: If no tours and status is active, DO NOT display on pipeline
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

  // Action: Open Analysis Modal
  const handleCompleteTour = (task: any, property: any) => {
    setSelectedTask(task);
    setActiveProperty(property);
    setAnalysisNote("");
    setAnalysisOutcome("analysis");
    setShowAnalysisModal(true);
  };

  // Submit Analysis
  const submitAnalysis = async () => {
    if (!analysisNote) {
      toast.error("Lütfen görüşme notlarını giriniz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalNote = `[ANALİZ]: ${analysisNote}`;
      
      if (selectedTask) {
        await api.completeTask(selectedTask.id, storeId, { 
          completion_note: finalNote,
          completed_at: new Date().toISOString()
        });
      }

      let newStatus = activeProperty.status;
      let newSectorData = { ...(activeProperty.sector_data || {}) };

      if (analysisOutcome === 'negotiation') {
        newStatus = 'optioned';
        newSectorData.pipeline_stage = 'negotiation';
        toast.success("Gezi tamamlandı ve Pazarlık (3. Aşama) sürecine aktarıldı!");
      } else if (analysisOutcome === 'negative') {
        newStatus = 'negative';
        newSectorData.pipeline_stage = 'negative';
        toast.success("Gezi tamamlandı ve Olumsuz (4. Aşama) kaydoldu.");
      } else {
        newSectorData.pipeline_stage = 'analysis';
        toast.success("Gezi tamamlandı ve Analiz (2. Aşama) sürecine aktarıldı.");
      }

      await api.updateProduct(activeProperty.id, { 
        status: newStatus,
        sector_data: newSectorData
      }, storeId);

      setShowAnalysisModal(false);
      setAnalysisNote("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("İşlem yapılırken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Reschedule
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
      toast.success("Randevu tarihi ve saati başarıyla güncellendi.");
      setShowRescheduleModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Güncelleme başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Move to Negotiation (3. Aşama)
  const handleOpenNegotiation = (property: any) => {
    setActiveProperty(property);
    setOfferAmount(property.price ? String(property.price) : "");
    setDepositAmount("");
    setNegotiationNotes("");
    setShowNegotiationModal(true);
  };

  const submitNegotiation = async () => {
    if (!offerAmount) {
      toast.error("Lütfen teklif tutarını giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedSectorData = {
        ...(activeProperty.sector_data || {}),
        pipeline_stage: 'negotiation',
        offer_amount: offerAmount,
        deposit_amount: depositAmount,
        negotiation_notes: negotiationNotes
      };

      await api.updateProduct(activeProperty.id, { 
        status: 'optioned',
        sector_data: updatedSectorData
      }, storeId);

      toast.success("Portföy Pazarlık / Opsiyonlu aşamasına aktarıldı!");
      setShowNegotiationModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Pazarlık kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Move to Closing (5. Aşama)
  const handleOpenClosing = (property: any) => {
    setActiveProperty(property);
    setFinalPrice(property.sector_data?.offer_amount || String(property.price || ''));
    setClientInfo("");
    setClosingNotes("");
    setShowClosingModal(true);
  };

  const submitClosing = async () => {
    if (!finalPrice || !clientInfo) {
      toast.error("Lütfen nihai fiyatı ve müşteri/alıcı adını giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const isRent = activeProperty.sector_data?.listing_intent === 'rent';
      const newStatus = isRent ? 'rented' : 'sold';

      const updatedSectorData = {
        ...(activeProperty.sector_data || {}),
        pipeline_stage: 'closed',
        final_price: finalPrice,
        closed_client: clientInfo,
        closing_notes: closingNotes,
        closed_at: new Date().toISOString()
      };

      await api.updateProduct(activeProperty.id, { 
        status: newStatus,
        sector_data: updatedSectorData
      }, storeId);

      toast.success(isRent ? "İşlem Başarıyla Tamamlandı: Kiralandı!" : "İşlem Başarıyla Tamamlandı: Satıldı!");
      setShowClosingModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Kapanış işlemi başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Move to Negative (4. Aşama)
  const handleOpenNegative = (property: any, task?: any) => {
    setActiveProperty(property);
    setSelectedTask(task || null);
    setNegativeReason("");
    setShowNegativeModal(true);
  };

  const submitNegative = async () => {
    if (!negativeReason) {
      toast.error("Lütfen olumsuzluk nedenini giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedTask) {
        await api.completeTask(selectedTask.id, storeId, {
          completion_note: `[OLUMSUZ]: ${negativeReason}`,
          completed_at: new Date().toISOString()
        });
      }

      const updatedSectorData = {
        ...(activeProperty.sector_data || {}),
        pipeline_stage: 'negative',
        negative_reason: negativeReason,
        negative_at: new Date().toISOString()
      };

      await api.updateProduct(activeProperty.id, { 
        status: 'negative',
        sector_data: updatedSectorData
      }, storeId);

      toast.info("Portföy süreci Olumsuz / Sonuçsuz olarak işaretlendi.");
      setShowNegativeModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("İşlem kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Reactivate Deal
  const handleReactivate = async (property: any) => {
    try {
      const updatedSectorData = {
        ...(property.sector_data || {}),
        pipeline_stage: 'planned'
      };

      await api.updateProduct(property.id, { 
        status: 'active',
        sector_data: updatedSectorData
      }, storeId);

      toast.success("Portföy süreci yeniden canlandırıldı ve Geziler aşamasına alındı!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Yeniden canlandırılamadı.");
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
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px] gap-2.5">
      {/* High-Tech Trigger & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/90 border border-slate-200/80 p-2 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
          <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black mr-1">Satış Hunisi:</span>
          
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-600" />
            <span>1. Geziler: {dealCards.filter(d => d.stage === 'planned').length}</span>
          </span>

          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-500" />
            <span>2. Analiz: {dealCards.filter(d => d.stage === 'analysis').length}</span>
          </span>

          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-600" />
            <span>3. Pazarlık: {dealCards.filter(d => d.stage === 'negotiation').length}</span>
          </span>

          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-md flex items-center gap-1">
            <X className="w-3 h-3 text-rose-600" />
            <span>4. Olumsuz: {dealCards.filter(d => d.stage === 'negative').length}</span>
          </span>

          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md flex items-center gap-1">
            <Handshake className="w-3 h-3 text-emerald-600" />
            <span>5. Kapanan: {dealCards.filter(d => d.stage === 'closed').length}</span>
          </span>
        </div>

        {/* Trigger Controls & Search */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            onClick={() => onOpenTourModal(null)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title="Sisteme yeni bir gezi / gösterim kaydı ekler"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Yeni Gezi Planla</span>
          </button>

          <button
            onClick={onOpenCalendar}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Takvim</span>
          </button>

          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Portföy veya ref no ara..."
              className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Kanban Board - 5 Stages */}
      <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 h-full w-full min-w-0">
          {STAGES.map(stage => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage.id);

            return (
              <div key={stage.id} className="flex flex-col gap-2 min-w-0 bg-slate-50/70 border border-slate-200/80 rounded-xl p-2">
                {/* Stage Column Header */}
                <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-200/70 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">{stage.title}</h3>
                  </div>
                  <span className="text-[10px] font-black bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded-md shrink-0">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
                  <AnimatePresence mode="popLayout">
                    {stageDeals.map(deal => {
                      const latestTask = deal.tasks.sort((a:any, b:any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0];
                      const sector = deal.property.sector_data || {};

                      return (
                        <motion.div
                          key={deal.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group relative overflow-hidden space-y-2"
                        >
                          {/* Property Header */}
                          <div className="flex items-start gap-2">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                              {deal.property.images?.[0] ? (
                                <img src={deal.property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <MapPin className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                  REF: {deal.property.reference_no || 'N/A'}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 truncate mt-0.5 leading-tight">
                                {deal.property.title}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{deal.property.location || 'KKTC'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tour / Activity Log Info */}
                          {latestTask && (
                            <div className={`rounded-lg p-2 border text-[10px] ${latestTask.is_completed ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50/60 border-indigo-100'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className={`flex items-center gap-1 font-black ${latestTask.is_completed ? 'text-slate-600' : 'text-indigo-700'}`}>
                                  {latestTask.is_completed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-indigo-600" />}
                                  <span>{latestTask.is_completed ? 'Tamamlanan Gezi' : 'Planlanan Randevu'}</span>
                                </div>
                                {!latestTask.is_completed && (
                                  <button 
                                    onClick={() => handleReschedule(latestTask)}
                                    className="p-0.5 hover:bg-white rounded text-indigo-600 transition-all cursor-pointer"
                                    title="Tarih/Saat Revize Et"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className={`font-semibold leading-tight line-clamp-2 ${latestTask.is_completed ? 'text-slate-600' : 'text-indigo-950'}`}>
                                {latestTask.description}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>
                                  {latestTask.due_date ? format(parseISO(latestTask.due_date), 'd MMM HH:mm', { locale: tr }) : 'Tarih Belirtilmedi'}
                                </span>
                              </div>
                              {latestTask.completion_note && (
                                <div className="mt-1.5 pt-1 border-t border-slate-200/60">
                                  <p className="text-[9px] text-slate-600 italic bg-white/80 p-1 rounded border border-slate-100 line-clamp-2">
                                    {latestTask.completion_note}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Special Details for Negotiation & Closed Stages */}
                          {stage.id === 'negotiation' && sector.offer_amount && (
                            <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200/80 text-[10px] space-y-0.5">
                              <p className="font-extrabold text-amber-900 flex justify-between">
                                <span>Teklif Tutarı:</span>
                                <span>{sector.offer_amount} {deal.property.currency}</span>
                              </p>
                              {sector.deposit_amount && (
                                <p className="font-bold text-amber-800 flex justify-between">
                                  <span>Kapora:</span>
                                  <span>{sector.deposit_amount}</span>
                                </p>
                              )}
                            </div>
                          )}

                          {stage.id === 'closed' && (
                            <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200/80 text-[10px] space-y-0.5">
                              <p className="font-black text-emerald-900 flex justify-between">
                                <span>Sonuç:</span>
                                <span>{deal.property.status === 'sold' ? 'SATILDI' : 'KİRALANDI'}</span>
                              </p>
                              {sector.final_price && (
                                <p className="font-bold text-emerald-800 flex justify-between">
                                  <span>Nihai Tutar:</span>
                                  <span>{sector.final_price} {deal.property.currency}</span>
                                </p>
                              )}
                              {sector.closed_client && (
                                <p className="text-[9px] text-emerald-700 font-semibold truncate">
                                  Müşteri: {sector.closed_client}
                                </p>
                              )}
                            </div>
                          )}

                          {stage.id === 'negative' && sector.negative_reason && (
                            <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-200/80 text-[10px]">
                              <p className="font-bold text-rose-800 line-clamp-2">
                                Neden: {sector.negative_reason}
                              </p>
                            </div>
                          )}

                          {/* Footer & Action Buttons */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 gap-1.5">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Liste Fiyatı</span>
                              <span className="text-xs font-black text-slate-900">
                                {deal.property.price} {deal.property.currency}
                              </span>
                            </div>
                            
                            {/* STAGE SPECIFIC INTERACTIVE ACTION BUTTONS */}
                            <div className="flex items-center gap-1 shrink-0">
                              {stage.id === 'planned' && (
                                <>
                                  <button 
                                    onClick={() => handleCompleteTour(latestTask, deal.property)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                  >
                                    Geziyi Tamamla
                                  </button>
                                  <button 
                                    onClick={() => handleOpenNegative(deal.property, latestTask)}
                                    className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                                    title="Olumsuza Taşı"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {stage.id === 'analysis' && (
                                <>
                                  <button 
                                    onClick={() => handleOpenNegotiation(deal.property)}
                                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    Pazarlık
                                  </button>
                                  <button 
                                    onClick={() => handleOpenNegative(deal.property)}
                                    className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                                    title="Olumsuza Taşı"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {stage.id === 'negotiation' && (
                                <>
                                  <button 
                                    onClick={() => handleOpenClosing(deal.property)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <Handshake className="w-3 h-3" />
                                    Kapat
                                  </button>
                                  <button 
                                    onClick={() => handleOpenNegative(deal.property)}
                                    className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                                    title="Olumsuza Taşı"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {stage.id === 'negative' && (
                                <button 
                                  onClick={() => handleReactivate(deal.property)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Canlandır
                                </button>
                              )}

                              {stage.id === 'closed' && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Tamamlandı
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Additional showing button if needed */}
                          {(stage.id === 'planned' || stage.id === 'analysis') && (
                            <button 
                              onClick={() => onOpenTourModal(deal.property)}
                              className="w-full py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Ek Gezi / Randevu Planla
                            </button>
                          )}
                        </motion.div>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="py-6 px-2 text-center bg-white/50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1">
                        <Info className="w-4 h-4 text-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400">
                          Bu aşamada fırsat yok
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

      {/* 1. ANALYSIS MODAL */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 relative overflow-hidden space-y-4"
            >
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Gezi Analizi & Geri Bildirim</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Müşteri Değerlendirmesi</p>
                </div>
              </div>

              <div className="space-y-3 font-bold text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Gezilen Portföy:</span>
                   <p className="text-xs font-black text-slate-900 leading-tight mt-0.5">{activeProperty?.title}</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Müşteri Notları & Kararı *</label>
                  <textarea 
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 min-h-[80px] focus:bg-white focus:border-indigo-500 transition-all outline-none"
                    placeholder="Müşteri lokasyonu çok beğendi, kredi onayına göre pazarlık yapacak..."
                    value={analysisNote}
                    onChange={(e) => setAnalysisNote(e.target.value)}
                  />
                </div>

                {/* Outcome Target */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Sonraki Süreç Aşaması</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    <button 
                      type="button"
                      onClick={() => setAnalysisOutcome('analysis')}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        analysisOutcome === 'analysis' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      2. Analiz
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAnalysisOutcome('negotiation')}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        analysisOutcome === 'negotiation' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      3. Pazarlık
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAnalysisOutcome('negative')}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        analysisOutcome === 'negative' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      4. Olumsuz
                    </button>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitAnalysis}
                  className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Kaydediliyor...' : 'Analizi Tamamla & Süreci İlerlet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. RESCHEDULE MODAL */}
      <AnimatePresence>
        {showRescheduleModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 relative overflow-hidden space-y-4"
            >
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Randevu Tarih/Saat Revize Et</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Gezi Saat Güncellemesi</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Yeni Tarih</label>
                    <input 
                      type="date"
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Yeni Saat</label>
                    <input 
                      type="time"
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitReschedule}
                  className="w-full py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Güncelleniyor...' : 'Revize Et ve Onayla'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. NEGOTIATION MODAL */}
      <AnimatePresence>
        {showNegotiationModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 relative overflow-hidden space-y-4"
            >
              <button 
                onClick={() => setShowNegotiationModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pazarlık & Kapora Süreci</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">3. Aşamaya Taşı</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-xs font-extrabold text-slate-900">{activeProperty?.title}</p>
                  <p className="text-[10px] text-slate-500 font-bold">Liste Fiyatı: {activeProperty?.price} {activeProperty?.currency}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Gelen Teklif Tutarı *</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 240.000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-amber-500 font-bold"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Alınan Kapora (Opsiyon)</label>
                    <input 
                      type="text" 
                      placeholder="Örn: £5,000 / $5,000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-amber-500 font-bold"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Pazarlık Notları & Şartlar</label>
                  <textarea 
                    placeholder="Müşteri %10 peşinat ve 1 ay içinde tapu devri istiyor..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-amber-500 font-bold min-h-[60px]"
                    value={negotiationNotes}
                    onChange={(e) => setNegotiationNotes(e.target.value)}
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitNegotiation}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Pazarlık Aşamasına Al (Opsiyonla)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CLOSING MODAL */}
      <AnimatePresence>
        {showClosingModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 relative overflow-hidden space-y-4"
            >
              <button 
                onClick={() => setShowClosingModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">İşlem Kapanış (Satıldı / Kiralandı)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">5. Aşamada Tamamla</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nihai Satış/Kira Fiyatı *</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 245.000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-emerald-500 font-bold"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase">Alıcı / Kiracı Bilgisi *</label>
                    <input 
                      type="text" 
                      placeholder="Ahmet Y. (Müşteri)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-emerald-500 font-bold"
                      value={clientInfo}
                      onChange={(e) => setClientInfo(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Sözleşme & Tapu Notları</label>
                  <textarea 
                    placeholder="Sözleşme imzalandı, komisyon tahsil edildi..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 mt-0.5 outline-none focus:border-emerald-500 font-bold min-h-[60px]"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitClosing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'İşlemi Tamamla & Kapat'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. NEGATIVE MODAL */}
      <AnimatePresence>
        {showNegativeModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 relative overflow-hidden space-y-4"
            >
              <button 
                onClick={() => setShowNegativeModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Olumsuz / Sonuçsuz İşaretle</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">4. Aşamaya Taşı</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Olumsuzluk Nedeni *</label>
                  <textarea 
                    placeholder="Müşteri bütçeyi aştığı için vazgeçti..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-0.5 outline-none focus:border-rose-500 font-bold min-h-[70px]"
                    value={negativeReason}
                    onChange={(e) => setNegativeReason(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {['Bütçe Uymadı', 'Lokasyon Beğenilmedi', 'Fiyat Yüksek', 'Kredi Çıkmadı', 'Vazgeçti'].map(reason => (
                    <button 
                      key={reason}
                      type="button"
                      onClick={() => setNegativeReason(reason)}
                      className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <button 
                  disabled={isSubmitting}
                  onClick={submitNegative}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Olumsuzlarak Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

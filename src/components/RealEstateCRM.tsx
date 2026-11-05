import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown,
  Clock, 
  MapPin, 
  Plus, 
  Search,
  TrendingUp,
  Handshake,
  CheckCircle2,
  Calendar,
  MessageSquare,
  DollarSign,
  X,
  Edit2,
  Info,
  RotateCcw,
  Archive,
  Layers,
  LayoutList,
  Columns3
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
  searchQuery?: string;
  hideHeader?: boolean;
}

const STAGES = [
  { id: 'planned', title: '1. Geziler', shortTitle: '1. Geziler', icon: Calendar, color: 'bg-indigo-500', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', isArchive: false, description: 'Gelecek randevular ve yer göstermeler.' },
  { id: 'analysis', title: '2. Analiz', shortTitle: '2. Analiz', icon: Search, color: 'bg-slate-600', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', isArchive: false, description: 'Görüşme tamamlandı, geri dönüş bekleniyor.' },
  { id: 'negotiation', title: '3. Pazarlık', shortTitle: '3. Pazarlık', icon: TrendingUp, color: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', isArchive: false, description: 'Ciddi teklif alındı, pazarlık & opsiyon aktif.' },
  { id: 'negative', title: '4. Olumsuz', shortTitle: '4. Olumsuz', icon: X, color: 'bg-rose-500', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', isArchive: true, description: 'Sonuçsuz kalan veya olumsuz tamamlanan iş takipleri (Arşiv).' },
  { id: 'closed', title: '5. Başarılı', shortTitle: '5. Başarılı', icon: Handshake, color: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', isArchive: true, description: 'Satış veya kiralama başarıyla sonuçlandırıldı (Arşiv).' },
];

export const RealEstateCRM = ({ 
  storeId, 
  properties, 
  tasks, 
  onOpenCalendar, 
  onOpenTourModal, 
  onRefresh,
  searchQuery: externalSearchQuery,
  hideHeader = false
}: RealEstateCRMProps) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  // Default filter: 'active' shows only 1. Geziler, 2. Analiz, 3. Pazarlık (hides archived 4. Olumsuz & 5. Başarılı)
  const [stageFilter, setStageFilter] = useState<string>('active');
  // Default layout: 'horizontal' (full-page collapsible stage rows) or 'columns' (compact 3-column active kanban)
  const [layoutMode, setLayoutMode] = useState<'horizontal' | 'columns'>('horizontal');
  // Track which individual deal cards are expanded ("kısa künye" accordion)
  const [expandedDeals, setExpandedDeals] = useState<Record<string, boolean>>({});
  // Track which stage sections are collapsed in horizontal mode
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  // Optimistic local overrides so stage changes reflect immediately without waiting for parent refetch
  const [localPropertyOverrides, setLocalPropertyOverrides] = useState<Record<number, { status?: string; sector_data?: any }>>({});

  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

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

  const toggleDealExpand = (dealId: string) => {
    setExpandedDeals(prev => ({ ...prev, [dealId]: !prev[dealId] }));
  };

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  // Helper to persist property stage & status to real_estate_properties (with optimistic state update)
  const persistPropertyStageUpdate = async (property: any, newStatus: string, updatedSectorData: any) => {
    // 1. Optimistic local state update so UI moves the item immediately
    setLocalPropertyOverrides(prev => ({
      ...prev,
      [property.id]: {
        status: newStatus,
        sector_data: updatedSectorData
      }
    }));

    // 2. Persist to backend real_estate_properties table
    const payload = {
      ...property,
      status: newStatus,
      sector_data: updatedSectorData,
      store_id: storeId,
      _skip_instagram_post: true
    };

    try {
      await api.updateProperty(property.id, payload);
    } catch (primaryErr) {
      // Fallback for legacy product-based records if any
      await api.updateProduct(property.id, {
        status: newStatus,
        sector_data: updatedSectorData
      }, storeId);
    }
  };

  // Build Pipeline deals with local optimistic overrides merged
  const dealCards = useMemo(() => {
    return properties.map(rawProp => {
      const localOverride = localPropertyOverrides[rawProp.id];
      const mergedSectorData = {
        ...(typeof rawProp.sector_data === 'object' && rawProp.sector_data ? rawProp.sector_data : {}),
        ...(localOverride?.sector_data || {})
      };
      const p = {
        ...rawProp,
        status: localOverride?.status ?? rawProp.status,
        sector_data: mergedSectorData
      };

      const propertyTasks = tasks.filter(t => Number(t.property_id) === Number(p.id) && t.task_type === 'tour');
      
      // Priority 1: Explicit pipeline_stage or status set by operator
      const overrideStage = p.sector_data?.pipeline_stage || p.pipeline_stage;

      let stage: string | null = null;

      if (overrideStage === 'closed' || p.status === 'sold' || p.status === 'rented') {
        stage = 'closed';
      } else if (overrideStage === 'negative' || p.status === 'negative') {
        stage = 'negative';
      } else if (overrideStage === 'negotiation' || p.status === 'optioned') {
        stage = 'negotiation';
      } else if (overrideStage === 'analysis') {
        stage = 'analysis';
      } else if (overrideStage === 'planned') {
        stage = 'planned';
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
      }

      if (!stage) return null;

      return {
        id: `deal-${p.id}`,
        property: p,
        tasks: propertyTasks,
        stage
      };
    }).filter(Boolean) as any[];
  }, [properties, tasks, localPropertyOverrides]);

  const formatFormattedPrice = (price: any, currency: string) => {
    if (!price && price !== 0) return '';
    const num = Number(String(price).replace(/[^0-9.-]+/g, ''));
    const currSymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : (currency || '₺');
    if (isNaN(num)) return `${price} ${currSymbol}`;
    return `${new Intl.NumberFormat('tr-TR').format(num)} ${currSymbol}`;
  };

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

      let newStatus = activeProperty.status || 'active';
      const newSectorData = {
        ...(activeProperty.sector_data || {}),
        last_analysis_note: analysisNote,
        analyzed_at: new Date().toISOString()
      };

      if (analysisOutcome === 'negotiation') {
        newStatus = 'optioned';
        newSectorData.pipeline_stage = 'negotiation';
        toast.success("Gezi tamamlandı ve 3. Pazarlık aşamasına aktarıldı!");
      } else if (analysisOutcome === 'negative') {
        newStatus = 'negative';
        newSectorData.pipeline_stage = 'negative';
        newSectorData.negative_reason = analysisNote;
        toast.success("Gezi tamamlandı ve 4. Olumsuz (Arşiv) listesine aktarıldı.");
      } else {
        if (newStatus === 'optioned' || newStatus === 'negative') newStatus = 'active';
        newSectorData.pipeline_stage = 'analysis';
        toast.success("Gezi tamamlandı ve 2. Analiz aşamasına aktarıldı.");
      }

      await persistPropertyStageUpdate(activeProperty, newStatus, newSectorData);

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
    setOfferAmount(property.sector_data?.offer_amount || (property.price ? String(property.price) : ""));
    setDepositAmount(property.sector_data?.deposit_amount || "");
    setNegotiationNotes(property.sector_data?.negotiation_notes || "");
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
        negotiation_notes: negotiationNotes,
        negotiation_at: new Date().toISOString()
      };

      await persistPropertyStageUpdate(activeProperty, 'optioned', updatedSectorData);

      toast.success("Portföy 3. Pazarlık / Opsiyonlu aşamasına aktarıldı!");
      setShowNegotiationModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Pazarlık kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Move to Closing / Başarılı (5. Aşama)
  const handleOpenClosing = (property: any) => {
    setActiveProperty(property);
    setFinalPrice(property.sector_data?.offer_amount || String(property.price || ''));
    setClientInfo(property.sector_data?.closed_client || "");
    setClosingNotes(property.sector_data?.closing_notes || "");
    setShowClosingModal(true);
  };

  const submitClosing = async () => {
    if (!finalPrice || !clientInfo) {
      toast.error("Lütfen nihai fiyatı ve müşteri/alıcı adını giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const isRent = activeProperty.listing_intent === 'rent' || activeProperty.sector_data?.listing_intent === 'rent';
      const newStatus = isRent ? 'rented' : 'sold';

      const updatedSectorData = {
        ...(activeProperty.sector_data || {}),
        pipeline_stage: 'closed',
        final_price: finalPrice,
        closed_client: clientInfo,
        closing_notes: closingNotes,
        closed_at: new Date().toISOString()
      };

      await persistPropertyStageUpdate(activeProperty, newStatus, updatedSectorData);

      toast.success(isRent ? "İşlem Başarılı (5. Aşama): Kiralandı!" : "İşlem Başarılı (5. Aşama): Satıldı!");
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
    setNegativeReason(property.sector_data?.negative_reason || "");
    setShowNegativeModal(true);
  };

  const submitNegative = async () => {
    if (!negativeReason) {
      toast.error("Lütfen olumsuzluk nedenini giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedTask && !selectedTask.is_completed) {
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

      await persistPropertyStageUpdate(activeProperty, 'negative', updatedSectorData);

      toast.info("Portföy 4. Olumsuz (Arşiv) listesine aktarıldı.");
      setShowNegativeModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("İşlem kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Stage Change (Quick dropdown or button transition)
  const handleDirectStageChange = async (property: any, targetStage: string) => {
    if (targetStage === 'negotiation') {
      handleOpenNegotiation(property);
      return;
    }
    if (targetStage === 'closed') {
      handleOpenClosing(property);
      return;
    }
    if (targetStage === 'negative') {
      handleOpenNegative(property);
      return;
    }

    try {
      const updatedSectorData = {
        ...(property.sector_data || {}),
        pipeline_stage: targetStage
      };
      const newStatus = 'active';
      await persistPropertyStageUpdate(property, newStatus, updatedSectorData);
      const stageObj = STAGES.find(s => s.id === targetStage);
      toast.success(`Portföy "${stageObj?.title || targetStage}" aşamasına taşındı.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Statü değiştirilemedi.");
    }
  };

  // Action: Reactivate Deal
  const handleReactivate = async (property: any, targetStage: 'planned' | 'analysis' = 'planned') => {
    try {
      const updatedSectorData = {
        ...(property.sector_data || {}),
        pipeline_stage: targetStage
      };

      await persistPropertyStageUpdate(property, 'active', updatedSectorData);

      toast.success(`Portföy yeniden aktif sürece (${targetStage === 'analysis' ? '2. Analiz' : '1. Geziler'}) alındı!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Yeniden canlandırılamadı.");
    }
  };

  const filteredDeals = useMemo(() => {
    const searchLower = (activeSearch || "").toLowerCase().trim();
    if (!searchLower) return dealCards;
    return dealCards.filter(deal => (
      deal.property.title?.toLowerCase().includes(searchLower) ||
      deal.property.reference_no?.toLowerCase().includes(searchLower) ||
      deal.property.location?.toLowerCase().includes(searchLower) ||
      deal.property.kktc_region?.toLowerCase().includes(searchLower)
    ));
  }, [dealCards, activeSearch]);

  // Determine which stages are displayed based on stageFilter
  // 'active' -> only 1. Geziler, 2. Analiz, 3. Pazarlık (hides 4. Olumsuz & 5. Başarılı)
  // 'all' -> all 5 stages
  // or specific stage id ('planned', 'analysis', 'negotiation', 'negative', 'closed')
  const visibleStages = useMemo(() => {
    if (stageFilter === 'active') {
      return STAGES.filter(s => !s.isArchive);
    }
    if (stageFilter === 'all') {
      return STAGES;
    }
    return STAGES.filter(s => s.id === stageFilter);
  }, [stageFilter]);

  const activeTotalCount = filteredDeals.filter(d => d.stage === 'planned' || d.stage === 'analysis' || d.stage === 'negotiation').length;
  const allExpanded = filteredDeals.length > 0 && filteredDeals.every(d => expandedDeals[d.id]);

  const handleToggleAllDeals = () => {
    if (allExpanded) {
      setExpandedDeals({});
    } else {
      const next: Record<string, boolean> = {};
      filteredDeals.forEach(d => { next[d.id] = true; });
      setExpandedDeals(next);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Compact Top Control & Stage Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-white border border-slate-200/90 px-2.5 py-2 rounded-xl shadow-2xs">
        {/* Stage Filter Selector (Active Workflow vs Archived Completed Stages) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStageFilter('active')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              stageFilter === 'active'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Sadece aktif devam eden iş takiplerini (1. Geziler, 2. Analiz, 3. Pazarlık) gösterir"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Aktif Süreçler</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${stageFilter === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {activeTotalCount}
            </span>
          </button>

          {/* Active Stage Pills (1, 2, 3) */}
          {STAGES.filter(s => !s.isArchive).map(stage => {
            const count = filteredDeals.filter(d => d.stage === stage.id).length;
            const isSelected = stageFilter === stage.id;
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setStageFilter(isSelected ? 'active' : stage.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{stage.title}</span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* Archived / Completed Stage Pills (4. Olumsuz & 5. Başarılı - Hidden by default unless clicked) */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/70">
            <span className="text-[9px] font-black uppercase text-slate-400 px-1.5 hidden xl:inline-flex items-center gap-1">
              <Archive className="w-2.5 h-2.5" />
              Tamamlanan:
            </span>
            {STAGES.filter(s => s.isArchive).map(stage => {
              const count = filteredDeals.filter(d => d.stage === stage.id).length;
              const isSelected = stageFilter === stage.id;
              const Icon = stage.icon;
              const activeClass = stage.id === 'closed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-rose-600 text-white border-rose-600 shadow-2xs';
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setStageFilter(isSelected ? 'active' : stage.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? activeClass
                      : 'bg-white/90 hover:bg-white text-slate-600 border-slate-200/80'
                  }`}
                  title={`${stage.title} listesini görüntülemek için tıklayın (Varsayılan olarak gizlidir)`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{stage.title}</span>
                  <span className={`px-1 rounded text-[9px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Layout Mode, Expand/Collapse All, New Tour */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Layout Switcher: Horizontal Full-Page Rows vs Columns */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLayoutMode('horizontal')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'horizontal' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tam Sayfa Yatay Satır Görünümü"
            >
              <LayoutList className="w-3 h-3" />
              <span className="hidden sm:inline">Satır</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('columns')}
              className={`px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'columns' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sütun (Kanban) Görünümü"
            >
              <Columns3 className="w-3 h-3" />
              <span className="hidden sm:inline">Sütun</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleAllDeals}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            title="Tüm portföy künyelerini aç veya kapat"
          >
            {allExpanded ? 'Künyeleri Daralt' : 'Künyeleri Aç'}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenTourModal(null);
            }}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="Sisteme yeni bir gezi / gösterim kaydı ekler"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Yeni Gezi</span>
          </button>

          {!hideHeader && onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Takvim</span>
            </button>
          )}

          {!hideHeader && externalSearchQuery === undefined && (
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Portföy / Ref ara..."
                className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                value={internalSearchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Pipeline Container */}
      <div className={
        layoutMode === 'horizontal' || visibleStages.length === 1
          ? "space-y-2.5"
          : `grid grid-cols-1 md:grid-cols-${Math.min(visibleStages.length, 3)} lg:grid-cols-${visibleStages.length} gap-2.5 items-start`
      }>
        {visibleStages.map(stage => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const isStageCollapsed = !!collapsedStages[stage.id] && visibleStages.length > 1;
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col"
            >
              {/* Stage Header Bar (Clickable to collapse/expand section) */}
              <div
                onClick={() => visibleStages.length > 1 && toggleStageCollapse(stage.id)}
                className={`flex items-center justify-between px-3 py-2 bg-slate-50/90 border-b border-slate-200/70 ${
                  visibleStages.length > 1 ? 'cursor-pointer hover:bg-slate-100/80' : ''
                } transition-colors`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {visibleStages.length > 1 && (
                    isStageCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                  <StageIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                    {stage.title}
                  </h3>
                  {stage.isArchive && (
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[9px] font-black uppercase">
                      Arşiv Listesi
                    </span>
                  )}
                  <span className="hidden md:inline text-[10px] text-slate-400 font-semibold truncate">
                    — {stage.description}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {stageFilter === stage.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStageFilter('active');
                      }}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Aktif Süreçlere Dön
                    </button>
                  )}
                  <span className="text-[11px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md font-mono">
                    {stageDeals.length}
                  </span>
                </div>
              </div>

              {/* Stage Deals List (Compact 1-Line Collapsible "Kısa Künye" Items) */}
              {!isStageCollapsed && (
                <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto custom-scrollbar">
                  {stageDeals.length === 0 ? (
                    <div className="py-5 px-3 text-center flex items-center justify-center gap-2 text-slate-400">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold">Bu aşamada kayıtlı portföy takibi bulunmuyor.</span>
                    </div>
                  ) : (
                    stageDeals.map(deal => {
                      const isExpanded = !!expandedDeals[deal.id];
                      const sortedTasks = [...deal.tasks].sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
                      const latestTask = sortedTasks[0];
                      const sector = deal.property.sector_data || {};
                      const formattedPrice = formatFormattedPrice(deal.property.price, deal.property.currency);

                      return (
                        <div
                          key={deal.id}
                          className={`transition-colors ${isExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}
                        >
                          {/* COMPACT 1-LINE SUMMARY ROW ("KISA KÜNYE") */}
                          <div
                            onClick={() => toggleDealExpand(deal.id)}
                            className="px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer select-none"
                          >
                            {/* Left: Chevron + Thumbnail + Ref + Title + Location */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                className="p-0.5 text-slate-400 hover:text-slate-700 shrink-0"
                                title={isExpanded ? "Detayı Gizle" : "Detayı Göster"}
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>

                              <div className="w-7 h-7 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                                {deal.property.images?.[0] ? (
                                  <img src={deal.property.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <MapPin className="w-3 h-3" />
                                  </div>
                                )}
                              </div>

                              <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-700 border border-slate-200/80 px-1.5 py-0.5 rounded shrink-0">
                                {deal.property.reference_no || `#${deal.property.id}`}
                              </span>

                              <span className="text-xs font-black text-slate-900 truncate">
                                {deal.property.title}
                              </span>

                              <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 shrink-0 bg-slate-100/70 px-1.5 py-0.5 rounded">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                <span className="truncate max-w-[120px]">{deal.property.location || deal.property.kktc_region || 'KKTC'}</span>
                              </span>
                            </div>

                            {/* Middle/Right: Brief Status Pill + Price + Quick Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Brief contextual badge */}
                              {stage.id === 'negotiation' && sector.offer_amount && (
                                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-black">
                                  Teklif: {sector.offer_amount} {deal.property.currency}
                                </span>
                              )}

                              {stage.id === 'closed' && (
                                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black">
                                  {deal.property.status === 'rented' ? 'KİRALANDI' : 'SATILDI'}
                                  {sector.final_price ? ` • ${sector.final_price} ${deal.property.currency}` : ''}
                                </span>
                              )}

                              {stage.id === 'negative' && sector.negative_reason && (
                                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold max-w-[180px] truncate">
                                  {sector.negative_reason}
                                </span>
                              )}

                              {latestTask && stage.id !== 'closed' && stage.id !== 'negative' && (
                                <span className={`hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  latestTask.is_completed
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  <Clock className="w-2.5 h-2.5" />
                                  {latestTask.due_date ? format(parseISO(latestTask.due_date), 'd MMM HH:mm', { locale: tr }) : 'Gezi'}
                                </span>
                              )}

                              {/* Price */}
                              <span className="text-xs font-black text-slate-900 font-mono min-w-[75px] text-right">
                                {formattedPrice}
                              </span>

                              {/* Stage Quick Action Buttons */}
                              <div className="flex items-center gap-1">
                                {stage.id === 'planned' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteTour(latestTask, deal.property)}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-black transition-all cursor-pointer shadow-2xs"
                                      title="Geziyi tamamla ve Analiz/Pazarlık aşamasına aktar"
                                    >
                                      Analize Al
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNegative(deal.property, latestTask)}
                                      className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-md transition-all cursor-pointer"
                                      title="4. Olumsuz (Arşiv) Listesine Taşı"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {stage.id === 'analysis' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNegotiation(deal.property)}
                                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="3. Pazarlık aşamasına geçir"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      <span>Pazarlık</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenClosing(deal.property)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black transition-all cursor-pointer hidden sm:flex items-center gap-1 shadow-2xs"
                                      title="5. Başarılı (Satıldı/Kiralandı) olarak tamamla"
                                    >
                                      <Handshake className="w-3 h-3" />
                                      <span>Başarılı</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNegative(deal.property)}
                                      className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-md transition-all cursor-pointer"
                                      title="4. Olumsuz (Arşiv) Listesine Taşı"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {stage.id === 'negotiation' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenClosing(deal.property)}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="5. Başarılı (Satıldı/Kiralandı) olarak tamamla"
                                    >
                                      <Handshake className="w-3 h-3" />
                                      <span>Başarılı</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNegative(deal.property)}
                                      className="p-1 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-md transition-all cursor-pointer"
                                      title="4. Olumsuz (Arşiv) Listesine Taşı"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                {(stage.id === 'negative' || stage.id === 'closed') && (
                                  <button
                                    type="button"
                                    onClick={() => handleReactivate(deal.property, 'analysis')}
                                    className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-white rounded-md text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                    title="Arşivden çıkar ve aktif sürece geri al"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Canlandır</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* EXPANDED ACCORDION DETAILS */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-200/60 bg-slate-50/70"
                              >
                                <div className="p-2.5 space-y-2 text-xs">
                                  {/* Direct Stage Switcher & Quick Tour Button */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Aşama Değiştir:</span>
                                      {STAGES.map(s => {
                                        const isCurrent = stage.id === s.id;
                                        return (
                                          <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => !isCurrent && handleDirectStageChange(deal.property, s.id)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer ${
                                              isCurrent
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200'
                                            }`}
                                          >
                                            {s.title}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => onOpenTourModal(deal.property)}
                                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Ek Gezi / Randevu Planla</span>
                                    </button>
                                  </div>

                                  {/* Stage-Specific Details (Analysis / Negotiation / Negative / Closed) */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* Left: Latest Task / Showing Details */}
                                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-slate-400">
                                          Son Gezi / Randevu Kaydı ({deal.tasks.length} Gezi)
                                        </span>
                                        {latestTask && !latestTask.is_completed && (
                                          <button
                                            type="button"
                                            onClick={() => handleReschedule(latestTask)}
                                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                            Tarih Revize Et
                                          </button>
                                        )}
                                      </div>
                                      {latestTask ? (
                                        <>
                                          <p className="text-[11px] font-bold text-slate-800">{latestTask.description}</p>
                                          <p className="text-[10px] font-semibold text-slate-500">
                                            Tarih: {latestTask.due_date ? format(parseISO(latestTask.due_date), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Belirtilmedi'}
                                          </p>
                                          {latestTask.completion_note && (
                                            <p className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200/70 italic">
                                              {latestTask.completion_note}
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        <p className="text-[11px] text-slate-400 font-semibold">Kayıtlı gezi detayı bulunmuyor.</p>
                                      )}
                                    </div>

                                    {/* Right: Financial / Stage Notes */}
                                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 space-y-1">
                                      <span className="text-[10px] font-black uppercase text-slate-400">Süreç & Teklif Özeti</span>
                                      {sector.last_analysis_note && (
                                        <p className="text-[11px] text-slate-700">
                                          <strong className="text-slate-900">Analiz Notu:</strong> {sector.last_analysis_note}
                                        </p>
                                      )}
                                      {sector.offer_amount && (
                                        <p className="text-[11px] text-amber-800 font-bold">
                                          <strong>Teklif:</strong> {sector.offer_amount} {deal.property.currency}
                                          {sector.deposit_amount ? ` | Kapora: ${sector.deposit_amount}` : ''}
                                        </p>
                                      )}
                                      {sector.negotiation_notes && (
                                        <p className="text-[10px] text-slate-600">{sector.negotiation_notes}</p>
                                      )}
                                      {sector.final_price && (
                                        <p className="text-[11px] text-emerald-800 font-bold">
                                          <strong>Kapanış Fiyatı:</strong> {sector.final_price} {deal.property.currency}
                                          {sector.closed_client ? ` | Müşteri: ${sector.closed_client}` : ''}
                                        </p>
                                      )}
                                      {sector.negative_reason && (
                                        <p className="text-[11px] text-rose-700 font-bold">
                                          <strong>Olumsuzluk Nedeni:</strong> {sector.negative_reason}
                                        </p>
                                      )}
                                      {!sector.last_analysis_note && !sector.offer_amount && !sector.final_price && !sector.negative_reason && (
                                        <p className="text-[11px] text-slate-400 font-semibold">
                                          Lokasyon: {deal.property.location || deal.property.kktc_region || 'KKTC'} • Liste Fiyatı: {formattedPrice}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase">3. Pazarlık Aşamasına Taşı</p>
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
                  {isSubmitting ? 'Kaydediliyor...' : '3. Pazarlık Aşamasına Al (Opsiyonla)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CLOSING / BAŞARILI MODAL */}
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
                  <h3 className="text-base font-black text-slate-900">Başarılı Kapanış (Satıldı / Kiralandı)</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">5. Başarılı (Arşiv) Listesine Kaydet</p>
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
                  {isSubmitting ? 'Kaydediliyor...' : 'Başarılı Olarak Tamamla'}
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase">4. Olumsuz (Arşiv) Listesine Taşı</p>
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
                  {isSubmitting ? 'Kaydediliyor...' : 'Olumsuz Olarak Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

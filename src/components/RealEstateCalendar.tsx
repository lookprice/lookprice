import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Search,
  CheckCircle2,
  X,
  Menu,
  Archive,
  Sparkles,
  Eye,
  Building2,
  TrendingUp,
  Handshake,
  Layers,
  ExternalLink,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  parseISO, 
  isToday,
  subDays,
  startOfDay
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { PropertyQuickInspectorModal } from './realestate/PropertyQuickInspectorModal';
import { LegalContractModal } from './LegalContractModal';

interface RealEstateCalendarProps {
  storeId: number;
  properties: any[];
  storeSlug?: string;
  onClose?: () => void;
  hideHeader?: boolean;
  onEditProperty?: (property: any) => void;
  onScheduleTour?: (property: any) => void;
  onRefreshProperties?: () => void;
}

type TourPipelineOutcome = 'analysis' | 'negotiation' | 'negative' | 'closed' | 'planned';

const QUICK_OUTCOME_CHIPS: Record<TourPipelineOutcome, string[]> = {
  analysis: [
    'Mülkü beğendi, ailesiyle değerlendirip dönüş yapacak',
    'Alternatif portföylerle karşılaştırıyor, 2 gün içinde aranacak',
    'Koçan ve ödeme planı detayları paylaşıldı, geri dönüş bekleniyor'
  ],
  negotiation: [
    'Mülkü beğendi, mal sahibine iletilmek üzere fiyat teklifi verdi',
    'Ödeme planı ve kapora şartları üzerinde pazarlık başladı',
    'Peşin ödeme indirimi talep edildi, mal sahibiyle görüşülüyor'
  ],
  negative: [
    'Bölge veya konum beklentisine uymadı',
    'Fiyat bütçenin üzerinde kaldı, anlaşma sağlanamadı',
    'Oda sayısı / m² kullanım alanı yetersiz bulundu'
  ],
  closed: [
    'Satış / Kiralama mutabakatı sağlandı, sözleşme imzalandı',
    'Kapora alındı ve işlem başarıyla kapatıldı'
  ],
  planned: [
    'İlk gösterim yapıldı, karar vericilerle 2. kez tekrar gezilecek',
    'Teknik kontrol / mimar incelemesi için ek ziyaret yapılacak'
  ]
};

export const RealEstateCalendar = ({
  storeId,
  properties,
  storeSlug,
  onClose,
  hideHeader = false,
  onEditProperty,
  onScheduleTour,
  onRefreshProperties
}: RealEstateCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("week");
  const [listFilter, setListFilter] = useState<"recent" | "pending" | "archived" | "all">("recent");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<number, boolean>>({});

  // Quick Portfolio Inspector Modal State (without leaving Calendar screen)
  const [inspectedProperty, setInspectedProperty] = useState<any | null>(null);
  const [offerLetterTarget, setOfferLetterTarget] = useState<{
    property: any;
    initialOfferPrice?: string;
    initialClientName?: string;
    initialViewingDate?: string;
  } | null>(null);

  // Post-Tour Outcome & Pipeline Stage Transition Modal State
  const [completingTask, setCompletingTask] = useState<any | null>(null);
  const [completingProperty, setCompletingProperty] = useState<any | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<TourPipelineOutcome>('analysis');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [closedClient, setClosedClient] = useState('');
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false);

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTaskIds(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(storeId);
      if (Array.isArray(res)) {
        setTasks(res.filter((t: any) => t.task_type === 'tour' || t.task_type === 'general' || t.due_date));
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Randevular yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const handleTourEvent = () => {
      fetchTasks();
    };
    window.addEventListener('real-estate-tour-scheduled', handleTourEvent);
    window.addEventListener('real-estate-tour-completed', handleTourEvent);
    return () => {
      window.removeEventListener('real-estate-tour-scheduled', handleTourEvent);
      window.removeEventListener('real-estate-tour-completed', handleTourEvent);
    };
  }, [storeId]);

  // Helper to resolve property either from properties array or fallback task joined fields
  const resolvePropertyForTask = (task: any) => {
    const found = properties.find(p => Number(p.id) === Number(task.property_id));
    if (found) return found;
    if (task.property_id || task.property_reference_no || task.property_title) {
      return {
        id: task.property_id,
        reference_no: task.property_reference_no || `#${task.property_id}`,
        title: task.property_title || task.description || 'Portföy Kaydı',
        kktc_region: task.property_region || '',
        location: task.property_location || task.property_region || 'KKTC',
        price: task.property_price || '',
        currency: task.property_currency || 'GBP',
        images: []
      };
    }
    return null;
  };

  const handleInspectProperty = (task: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prop = resolvePropertyForTask(task);
    if (!prop) {
      toast.info("Bu randevuya bağlı portföy detayı bulunamadı.");
      return;
    }
    setInspectedProperty(prop);
  };

  const handleOpenCompleteModal = (task: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prop = resolvePropertyForTask(task);
    setCompletingTask(task);
    setCompletingProperty(prop);
    setSelectedOutcome('analysis');
    setOutcomeNote('');
    setOfferAmount(prop?.sector_data?.offer_amount || (prop?.price ? String(prop.price) : ''));
    setDepositAmount(prop?.sector_data?.deposit_amount || '');
    setFinalPrice(prop?.sector_data?.offer_amount || (prop?.price ? String(prop.price) : ''));
    setClosedClient('');
  };

  const handleSubmitTourOutcome = async () => {
    if (!completingTask) return;
    if (!outcomeNote.trim()) {
      toast.error("Lütfen gezi sonucu / müşteri görüşme notunu giriniz veya hazır şablonlardan seçiniz.");
      return;
    }
    if (selectedOutcome === 'negotiation' && !offerAmount.trim()) {
      toast.error("Pazarlık aşaması için lütfen teklif edilen tutarı giriniz.");
      return;
    }
    if (selectedOutcome === 'closed' && (!finalPrice.trim() || !closedClient.trim())) {
      toast.error("Başarılı kapanış için nihai fiyatı ve müşteri adını giriniz.");
      return;
    }

    setIsSubmittingOutcome(true);
    try {
      const stagePrefixMap: Record<TourPipelineOutcome, string> = {
        analysis: '[2. ANALİZ]',
        negotiation: '[3. PAZARLIK]',
        negative: '[4. OLUMSUZ]',
        closed: '[5. BAŞARILI]',
        planned: '[1. GEZİ TAMAMLANDI - EK GÖSTERİM]'
      };

      const formattedCompletionNote = `${stagePrefixMap[selectedOutcome]}: ${outcomeNote.trim()}${
        selectedOutcome === 'negotiation' && offerAmount ? ` (Teklif: ${offerAmount})` : ''
      }`;

      // 1. Mark task as completed in property_tasks (and syncs with operator_tasks in backend)
      await api.completeTask(completingTask.id, storeId, {
        completion_note: formattedCompletionNote,
        completed_at: new Date().toISOString()
      });

      // 2. Update property pipeline_stage and status so Pipeline reflects the new stage immediately
      const realProp = properties.find(p => Number(p.id) === Number(completingTask.property_id));
      if (realProp) {
        const currentSector = typeof realProp.sector_data === 'object' && realProp.sector_data ? realProp.sector_data : {};
        const prevStage = currentSector.pipeline_stage || 'planned';
        const isRent = realProp.listing_intent === 'rent' || currentSector.listing_intent === 'rent';

        let nextStatus = realProp.status || 'active';
        if (selectedOutcome === 'negotiation') {
          nextStatus = 'optioned';
        } else if (selectedOutcome === 'negative') {
          nextStatus = 'negative';
        } else if (selectedOutcome === 'closed') {
          nextStatus = isRent ? 'rented' : 'sold';
        } else {
          if (nextStatus === 'optioned' || nextStatus === 'negative') nextStatus = 'active';
        }

        const currentHist = Array.isArray(currentSector.pipeline_history) ? currentSector.pipeline_history : [];
        const newHistEntry = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          from_stage: prevStage,
          to_stage: selectedOutcome,
          status: nextStatus,
          note: formattedCompletionNote
        };

        const updatedSectorData: Record<string, any> = {
          ...currentSector,
          pipeline_stage: selectedOutcome,
          last_analysis_note: outcomeNote.trim(),
          analyzed_at: new Date().toISOString(),
          pipeline_history: [newHistEntry, ...currentHist].slice(0, 40)
        };

        if (selectedOutcome === 'negotiation') {
          updatedSectorData.offer_amount = offerAmount.trim();
          updatedSectorData.deposit_amount = depositAmount.trim();
          updatedSectorData.negotiation_notes = outcomeNote.trim();
          updatedSectorData.negotiation_at = new Date().toISOString();
        } else if (selectedOutcome === 'negative') {
          updatedSectorData.negative_reason = outcomeNote.trim();
          updatedSectorData.negative_at = new Date().toISOString();
        } else if (selectedOutcome === 'closed') {
          updatedSectorData.final_price = finalPrice.trim();
          updatedSectorData.closed_client = closedClient.trim();
          updatedSectorData.closing_notes = outcomeNote.trim();
          updatedSectorData.closed_at = new Date().toISOString();
        }

        try {
          await api.updateProperty(realProp.id, {
            ...realProp,
            status: nextStatus,
            sector_data: updatedSectorData,
            store_id: storeId,
            _skip_instagram_post: true
          });
        } catch (updateErr) {
          console.warn("Property stage update fallback:", updateErr);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('real-estate-tour-completed', {
          detail: {
            taskId: completingTask.id,
            propertyId: completingTask.property_id,
            stage: selectedOutcome
          }
        }));
      }

      const stageLabels: Record<TourPipelineOutcome, string> = {
        analysis: '2. Analiz (Değerlendirme)',
        negotiation: '3. Pazarlık (Opsiyonlu)',
        negative: '4. Olumsuz (Arşiv)',
        closed: '5. Başarılı (Kapandı)',
        planned: '1. Geziler (Devam)'
      };

      toast.success(`Gezi tamamlandı ve portföy Pipeline'da "${stageLabels[selectedOutcome]}" statüsüne aktarıldı!`);
      setCompletingTask(null);
      setCompletingProperty(null);
      fetchTasks();
      if (onRefreshProperties) onRefreshProperties();
    } catch (err) {
      console.error("Error completing tour with outcome:", err);
      toast.error("Gezi sonucu kaydedilirken hata oluştu.");
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  // Date intervals based on view mode
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const startDate = viewMode === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = viewMode === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextPeriod = () => {
    if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const filteredTasks = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return tasks
      .filter(task => {
        if (!searchLower) return true;
        const property = resolvePropertyForTask(task);
        return (
          task.description?.toLowerCase().includes(searchLower) ||
          property?.title?.toLowerCase().includes(searchLower) ||
          property?.reference_no?.toLowerCase().includes(searchLower) ||
          property?.location?.toLowerCase().includes(searchLower) ||
          property?.kktc_region?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [tasks, properties, searchQuery]);

  // Smart 2-day aging cutoff
  const twoDaysAgoCutoff = useMemo(() => subDays(startOfDay(new Date()), 2), []);

  const isTaskAgedArchive = (task: any) => {
    if (!task.due_date) return false;
    const taskDate = parseISO(task.due_date);
    return taskDate < twoDaysAgoCutoff;
  };

  const listDisplayedTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      const aged = isTaskAgedArchive(task);
      if (listFilter === "recent") {
        return !aged || !task.is_completed;
      }
      if (listFilter === "pending") {
        return !task.is_completed;
      }
      if (listFilter === "archived") {
        return aged && task.is_completed;
      }
      return true;
    });
  }, [filteredTasks, listFilter, twoDaysAgoCutoff]);

  const recentCount = useMemo(() => filteredTasks.filter(t => !isTaskAgedArchive(t) || !t.is_completed).length, [filteredTasks, twoDaysAgoCutoff]);
  const pendingCount = useMemo(() => filteredTasks.filter(t => !t.is_completed).length, [filteredTasks]);
  const archivedCount = useMemo(() => filteredTasks.filter(t => isTaskAgedArchive(t) && t.is_completed).length, [filteredTasks, twoDaysAgoCutoff]);

  const getDayTasks = (day: Date) => {
    return filteredTasks
      .filter(task => task.due_date && isSameDay(parseISO(task.due_date), day))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const selectedDayTasks = selectedDay ? getDayTasks(selectedDay) : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Controls Toolbar */}
      {!hideHeader ? (
        <div className="px-3.5 py-2.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Gezi & Randevu Takvimi</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider capitalize">
                {viewMode === 'week'
                  ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
                  : format(currentDate, 'MMMM yyyy', { locale: tr })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setViewMode("week")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "week" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "month" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Aylık
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "list" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Liste
              </button>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Randevu, REF veya bölge ara..."
                className="w-full sm:w-44 pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {viewMode !== "list" && (
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={prevPeriod} className="p-1.5 hover:bg-slate-50 border-r border-slate-200 transition-colors cursor-pointer" title="Önceki"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
                <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer">BUGÜN</button>
                <button onClick={nextPeriod} className="p-1.5 hover:bg-slate-50 border-l border-slate-200 transition-colors cursor-pointer" title="Sonraki"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
              </div>
            )}

            {onClose && (
              <button onClick={onClose} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Compact toolbar when parent has navigation header */
        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-900 capitalize font-mono">
              {viewMode === 'week'
                ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
                : format(currentDate, 'MMMM yyyy', { locale: tr })}
            </span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
              <button onClick={() => setViewMode("week")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "week" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Haftalık</button>
              <button onClick={() => setViewMode("month")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "month" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Aylık</button>
              <button onClick={() => setViewMode("list")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "list" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Liste</button>
            </div>
            {viewMode !== "list" && (
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <button onClick={prevPeriod} className="p-1 hover:bg-slate-100 border-r border-slate-200 cursor-pointer"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
                <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} className="px-2 py-0.5 text-[10px] font-black uppercase hover:bg-slate-100 text-slate-700 cursor-pointer">Bugün</button>
                <button onClick={nextPeriod} className="p-1 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Randevu, REF veya bölge ara..."
              className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "list" ? (
        /* SINGLE-LINE COMPACT LIST VIEW WITH AUTOMATIC 2-DAY AGING / ARCHIVE */
        <div className="flex-1 p-2.5 sm:p-3 space-y-2 bg-slate-50/40">
          {/* Smart Aging Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setListFilter("recent")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "recent"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Güncel & Son 2 Gün</span>
                <span className={`px-1 rounded text-[9px] font-mono ${listFilter === "recent" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {recentCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("pending")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "pending"
                    ? "bg-amber-500 text-white border-amber-500 shadow-2xs font-black"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Bekleyenler ({pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("archived")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "archived"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black"
                    : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 border-slate-200"
                }`}
              >
                <Archive className="w-3 h-3" />
                <span>Geçmiş Arşiv ({archivedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                  listFilter === "all"
                    ? "bg-slate-800 text-white border-slate-800 font-black"
                    : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                Tümü ({filteredTasks.length})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
              Portföy detayını ekrandan çıkmadan görmek için "Portföy Künyesi" butonuna tıklayın
            </span>
          </div>

          {listDisplayedTasks.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-500">Bu filtrede randevu kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs max-h-[540px] overflow-y-auto custom-scrollbar">
              {listDisplayedTasks.map((task) => {
                const property = resolvePropertyForTask(task);
                const taskDate = task.due_date ? parseISO(task.due_date) : new Date();
                const isExpanded = !!expandedTaskIds[task.id];
                const regionText = property?.kktc_region && property?.location && property.kktc_region !== property.location
                  ? `${property.kktc_region} / ${property.location}`
                  : (property?.kktc_region || property?.location || 'KKTC');

                return (
                  <div key={task.id} className={`transition-colors ${isExpanded ? 'bg-indigo-50/25' : 'hover:bg-slate-50/90'}`}>
                    {/* Single-Line Horizontal Row */}
                    <div
                      onClick={() => toggleTaskExpand(task.id)}
                      className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          className="p-0.5 text-slate-400 hover:text-indigo-600 shrink-0"
                          title="Detayları Aç / Kapat"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <Menu className="w-3.5 h-3.5" />}
                        </button>

                        <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          {format(taskDate, 'd MMM yyyy HH:mm', { locale: tr })}
                        </span>

                        {property?.reference_no && (
                          <button
                            type="button"
                            onClick={(e) => handleInspectProperty(task, e)}
                            className="text-[9px] font-mono font-black bg-amber-100 hover:bg-amber-200 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300 shrink-0 cursor-pointer transition-colors"
                            title="Ekrandan çıkmadan portföy künyesini aç"
                          >
                            {property.reference_no}
                          </button>
                        )}

                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                          <span className="truncate max-w-[110px]">{regionText}</span>
                        </span>

                        <span className="text-xs font-bold text-slate-900 truncate">
                          {property?.title || task.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {property && (
                          <button
                            type="button"
                            onClick={(e) => handleInspectProperty(task, e)}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-black flex items-center gap-1 transition cursor-pointer"
                            title="Aynı ekrandan çıkmadan portföy bilgilerini ve fotoğraflarını gör"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">Portföy Künyesi</span>
                          </button>
                        )}

                        {task.is_completed ? (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Sonuçlandı</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenCompleteModal(task, e)}
                            className="px-2.5 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Geziyi sonuçlandır ve Pipeline'da hangi statüde devam edeceğini seç"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Sonuçlandır & Pipeline</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-200/60 bg-slate-50/80"
                        >
                          <div className="px-3.5 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-slate-400 block">Portföy Künyesi</span>
                              <p className="font-bold text-slate-900">{property?.title || 'Genel Randevu'}</p>
                              <p className="text-[10px] text-slate-600 font-semibold">
                                REF: <strong className="font-mono text-slate-900">{property?.reference_no || '-'}</strong> • Bölge: <strong>{regionText}</strong>
                              </p>
                              {property && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => handleInspectProperty(task, e)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Portföy Bilgileri</span>
                                  </button>
                                  {property.listing_intent !== 'rent' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOfferLetterTarget({
                                          property,
                                          initialOfferPrice: String(property.price || ''),
                                          initialViewingDate: task.due_date ? String(task.due_date).split('T')[0] : undefined
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Mülk gezisi esnasında potansiyel alıcının mülk sahibine sunacağı resmi Fiyat Teklif Mektubu'nu hazırla"
                                    >
                                      <FileText className="w-3 h-3 text-slate-950" />
                                      <span>Teklif Mektubu</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[9px] font-black uppercase text-slate-400 block">Müşteri & Gezi Detayı</span>
                              <p className="font-semibold text-slate-800">{task.description}</p>
                              {task.completion_note && (
                                <p className="mt-1 text-[10px] text-slate-700 font-medium bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                  <strong>Gezi Sonucu:</strong> {task.completion_note}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* COMPACT CALENDAR GRID (DEFAULT WEEKLY) & COMPACT COLLAPSIBLE SIDEBAR */
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Calendar Grid */}
          <div className="flex-1 p-2.5 sm:p-3 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="grid grid-cols-7 gap-1 bg-slate-200/70 border border-slate-200 rounded-xl overflow-hidden">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="bg-slate-50 py-1.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayTasks = getDayTasks(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, monthStart);
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className={`${
                      viewMode === 'week' ? 'min-h-[120px] sm:min-h-[145px]' : 'min-h-[64px] sm:min-h-[78px]'
                    } bg-white p-1.5 transition-all cursor-pointer group relative flex flex-col justify-between ${
                      !isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/60 opacity-55' : 'hover:bg-indigo-50/30'
                    } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors ${
                        isToday(day) ? 'bg-indigo-600 text-white shadow-2xs' : 
                        isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayTasks.slice(0, viewMode === 'week' ? 4 : 2).map((task, tidx) => {
                        const property = resolvePropertyForTask(task);
                        return (
                          <div
                            key={tidx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDay(day);
                              setExpandedTaskIds(prev => ({ ...prev, [task.id]: true }));
                            }}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border ${
                              task.is_completed
                                ? 'bg-slate-50 text-slate-600 border-slate-200'
                                : 'bg-indigo-50/90 text-indigo-900 border-indigo-100 hover:bg-indigo-100'
                            }`}
                            title={`${property?.reference_no ? `[${property.reference_no}] ` : ''}${property?.title || task.description}`}
                          >
                            <span className="font-mono font-bold text-indigo-600 mr-1">{format(parseISO(task.due_date), 'HH:mm')}</span>
                            <span>{property?.reference_no ? `${property.reference_no} ` : ''}{property?.title || task.description}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > (viewMode === 'week' ? 4 : 2) && (
                        <div className="text-[8px] font-bold text-slate-400 text-center">
                          + {dayTasks.length - (viewMode === 'week' ? 4 : 2)} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Day Detail Sidebar: Compact Collapsible Hamburger-Style List */}
          <div className="w-full lg:w-88 bg-slate-50/60 p-2.5 sm:p-3 shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: tr }) : 'Gün Seçiniz'}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {selectedDayTasks.length} Planlanmış Gezi — Künye & Sonuç için tıklayın
                </p>
              </div>
              {selectedDay && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg font-black text-[10px]">
                  {format(selectedDay, 'EEEE', { locale: tr })}
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-0.5">
              {selectedDayTasks.length === 0 ? (
                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-slate-400">Bu tarihte randevu yok.</p>
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const property = resolvePropertyForTask(task);
                  const isExpanded = !!expandedTaskIds[task.id];
                  const regionLabel = property?.kktc_region && property?.location && property.kktc_region !== property.location
                    ? `${property.kktc_region} / ${property.location}`
                    : (property?.kktc_region || property?.location || 'KKTC');

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Compact Single-Line Hamburger Row */}
                      <div
                        onClick={() => toggleTaskExpand(task.id)}
                        className="px-2.5 py-2 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Menu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                            {format(parseISO(task.due_date), 'HH:mm')}
                          </span>
                          {property?.reference_no && (
                            <button
                              type="button"
                              onClick={(e) => handleInspectProperty(task, e)}
                              className="text-[9px] font-mono font-black bg-amber-100 hover:bg-amber-200 text-slate-950 px-1.5 py-0.5 rounded border border-amber-300 shrink-0 cursor-pointer"
                              title="Portföy Künyesini Gör"
                            >
                              {property.reference_no}
                            </button>
                          )}
                          <span className="text-[11px] font-semibold text-slate-800 truncate">
                            {property?.title || task.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {property && (
                            <button
                              type="button"
                              onClick={(e) => handleInspectProperty(task, e)}
                              className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200 cursor-pointer"
                              title="Ekrandan çıkmadan Portföy Künyesini aç"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          {task.is_completed ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Bitti</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Aktif
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Hamburger Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/70"
                          >
                            <div className="p-2.5 space-y-2 text-[11px]">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-900 leading-snug">
                                  {property?.title || 'Randevu & Gezi'}
                                </p>
                              </div>

                              <div className="space-y-1 text-[10px] text-slate-600 font-medium">
                                {property?.reference_no && (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span>REF: <strong className="font-mono text-slate-900">{property.reference_no}</strong> • Bölge: <strong>{regionLabel}</strong></span>
                                  </div>
                                )}
                                <div className="flex items-start gap-1.5">
                                  <User className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="break-words">{task.description}</span>
                                </div>
                                {task.completion_note && (
                                  <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-700 italic">
                                    {task.completion_note}
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons: 1. Inspect Property in-place, 2. Offer Letter, 3. Complete & Choose Pipeline Stage */}
                              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                {property && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleInspectProperty(task, e)}
                                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                                    title="Ekrandan çıkmadan Portföy Bilgilerini gör"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="truncate">Portföy Bilgileri</span>
                                  </button>
                                )}

                                {property && property.listing_intent !== 'rent' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOfferLetterTarget({
                                        property,
                                        initialOfferPrice: String(property.price || ''),
                                        initialViewingDate: task.due_date ? String(task.due_date).split('T')[0] : undefined
                                      });
                                    }}
                                    className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 text-[10px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                    title="Mülk gezisi esnasında potansiyel alıcının mülk sahibine sunacağı resmi Fiyat Teklif Mektubu'nu hazırla"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                                    <span className="truncate">Teklif Mektubu</span>
                                  </button>
                                )}

                                {!task.is_completed && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenCompleteModal(task, e)}
                                    className="flex-1 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                                    title="Geziyi sonuçlandır ve Pipeline statüsünü seç"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="truncate">Sonuçlandır</span>
                                  </button>
                                )}
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
          </div>
        </div>
      )}

      {/* 1. IN-SCREEN PORTFOLIO QUICK INSPECTOR MODAL */}
      {inspectedProperty && (
        <PropertyQuickInspectorModal
          property={inspectedProperty}
          storeSlug={storeSlug}
          onClose={() => setInspectedProperty(null)}
          onEditProperty={onEditProperty}
          onScheduleTour={onScheduleTour}
        />
      )}

      {/* 2. POST-TOUR OUTCOME & PIPELINE STAGE TRANSITION MODAL */}
      {completingTask && (
        <div
          className="fixed inset-0 z-[100040] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => !isSubmittingOutcome && setCompletingTask(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dark Header (Rule 11 High Contrast) */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 block">
                    GEZİ SONUCU & PIPELINE ENTEGRASYONU
                  </span>
                  <h3 className="text-sm font-black text-white truncate">
                    Bu Ziyaret Pipeline'da Hangi Statüde Devam Edecek?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
              {/* Property Summary Strip */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {completingProperty?.reference_no && (
                      <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-mono text-[10px] font-black rounded">
                        REF: {completingProperty.reference_no}
                      </span>
                    )}
                    <span className="text-xs font-black text-slate-900 truncate">
                      {completingProperty?.title || 'Portföy Gezisi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate">
                    {completingTask.description}
                  </p>
                </div>
                {completingProperty && (
                  <button
                    type="button"
                    onClick={() => setInspectedProperty(completingProperty)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Künye</span>
                  </button>
                )}
              </div>

              {/* Pipeline Stage Selector Cards */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  1. Yeni Statü Seçin
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('analysis')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedOutcome === 'analysis'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                    }`}
                  >
                    <Search className={`w-4 h-4 shrink-0 ${selectedOutcome === 'analysis' ? 'text-amber-300' : 'text-indigo-600'}`} />
                    <span className="text-xs font-black truncate">2. Analiz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('negotiation')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedOutcome === 'negotiation'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                    }`}
                  >
                    <TrendingUp className={`w-4 h-4 shrink-0 ${selectedOutcome === 'negotiation' ? 'text-slate-950' : 'text-amber-600'}`} />
                    <span className="text-xs font-black truncate">3. Pazarlık</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('negative')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedOutcome === 'negative'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                    }`}
                  >
                    <X className={`w-4 h-4 shrink-0 ${selectedOutcome === 'negative' ? 'text-white' : 'text-rose-600'}`} />
                    <span className="text-xs font-black truncate">4. Olumsuz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('closed')}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      selectedOutcome === 'closed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                    }`}
                  >
                    <Handshake className={`w-4 h-4 shrink-0 ${selectedOutcome === 'closed' ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="text-xs font-black truncate">5. Başarılı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOutcome('planned')}
                    className={`col-span-2 p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                      selectedOutcome === 'planned'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-black">1. Geziler</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Financial Inputs for Negotiation or Closed */}
              {selectedOutcome === 'negotiation' && (
                <div className="space-y-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                        Teklif Tutarı *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={offerAmount}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          setOfferAmount(digits ? Number(digits).toLocaleString("tr-TR") : "");
                        }}
                        placeholder="Örn: 98.000"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                        Kapora Tutarı
                      </label>
                      <input
                        type="text"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Örn: 5.000 GBP"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {completingProperty && completingProperty.listing_intent !== 'rent' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOfferLetterTarget({
                          property: completingProperty,
                          initialOfferPrice: offerAmount || String(completingProperty.price || ''),
                          initialViewingDate: completingTask?.due_date ? String(completingTask.due_date).split('T')[0] : undefined
                        });
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Teklif Mektubu</span>
                    </button>
                  )}
                </div>
              )}

              {selectedOutcome === 'closed' && (
                <div className="grid grid-cols-2 gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-emerald-900 mb-1">
                      Nihai Fiyat *
                    </label>
                    <input
                      type="text"
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      placeholder="Örn: 130.000"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-emerald-900 mb-1">
                      Alıcı / Kiracı *
                    </label>
                    <input
                      type="text"
                      value={closedClient}
                      onChange={(e) => setClosedClient(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Quick Feedback Chips + Note Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  2. Gezi Notu *
                </label>
                <div className="flex flex-wrap gap-1">
                  {QUICK_OUTCOME_CHIPS[selectedOutcome].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOutcomeNote(chip)}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition cursor-pointer text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={outcomeNote}
                  onChange={(e) => setOutcomeNote(e.target.value)}
                  placeholder="Müşteri geri bildirimi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingOutcome}
                onClick={() => setCompletingTask(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-black cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isSubmittingOutcome}
                onClick={handleSubmitTourOutcome}
                className="px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmittingOutcome ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OFFICIAL PROPERTY PURCHASE OFFER LETTER MODAL */}
      {offerLetterTarget && (
        <LegalContractModal
          isOpen={!!offerLetterTarget}
          onClose={() => setOfferLetterTarget(null)}
          property={offerLetterTarget.property}
          initialTemplateId="offer_letter"
          initialOfferPrice={offerLetterTarget.initialOfferPrice}
          initialClientName={offerLetterTarget.initialClientName}
          initialViewingDate={offerLetterTarget.initialViewingDate}
          onSaveContract={async (newDoc) => {
            const prop = offerLetterTarget.property;
            const currentDocs = Array.isArray(prop.documents) ? prop.documents : [];
            const updatedDocs = [...currentDocs, newDoc];
            await api.updateRealEstateProperty(prop.id, {
              ...prop,
              documents: updatedDocs,
              sector_data: {
                ...(prop.sector_data || {}),
                documents: updatedDocs
              }
            });
            if (onRefreshProperties) onRefreshProperties();
          }}
        />
      )}
    </div>
  );
};

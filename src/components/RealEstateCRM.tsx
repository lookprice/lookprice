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
  Columns3,
  Sparkles,
  Share2,
  BellRing,
  AlertTriangle,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Users,
  Receipt,
  History,
  Send,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  findMatchingLeadsForProperty, 
  findReEngagementOpportunities, 
  calculateSLAStatus, 
  MatchResult, 
  ReEngagementOpportunity 
} from '../utils/realEstateMatchEngine';
import { 
  CommissionPool, 
  CommissionStakeholder, 
  validateCheckpointForClosing, 
  getPartnerWhatsAppContractInvite, 
  getShadowNotificationWhatsAppMessage,
  recalculateCommissionPool
} from '../utils/realEstateCommissionEngine';
import { DealCommissionModal } from './DealCommissionModal';
import { ExternalPartnerPortalModal } from './ExternalPartnerPortalModal';
import { LeadFunnelWizardModal } from './realestate/LeadFunnelWizardModal';
import { PropertyQuickInspectorModal } from './realestate/PropertyQuickInspectorModal';

const RE_LEAD_STAGES = [
  'Yeni Talep / Aday',
  'Görüşme / Analiz',
  'Yer Gösterme / Sunum',
  'Teklif / Sözleşme',
  'Kazanıldı'
];

interface RealEstateCRMProps {
  storeId: number;
  properties: any[];
  tasks: any[];
  deals?: any[];
  storeSlug?: string;
  onOpenCalendar: () => void;
  onOpenTourModal: (property: any, initialLead?: any) => void;
  onEditProperty?: (property: any) => void;
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
  deals = [],
  storeSlug,
  onOpenCalendar, 
  onOpenTourModal, 
  onEditProperty,
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
  const [internalTasks, setInternalTasks] = useState<any[]>(Array.isArray(tasks) ? tasks : []);
  const [inspectedProperty, setInspectedProperty] = useState<any | null>(null);

  const [activeProperty, setActiveProperty] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      setInternalTasks(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    const syncTasks = async () => {
      try {
        const res = await api.getTasks(storeId || undefined);
        if (Array.isArray(res)) setInternalTasks(res);
      } catch {}
    };
    syncTasks();

    const handleTourScheduled = (e: any) => {
      const propId = e?.detail?.propertyId;
      const newTask = e?.detail?.task;
      if (propId) {
        setLocalPropertyOverrides(prev => ({
          ...prev,
          [propId]: {
            status: 'active',
            sector_data: {
              ...(prev[propId]?.sector_data || {}),
              pipeline_stage: 'planned'
            }
          }
        }));
      }
      if (newTask) {
        setInternalTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);
      }
      syncTasks();
    };

    const handleTourCompleted = (e: any) => {
      const propId = e?.detail?.propertyId;
      const targetStage = e?.detail?.stage;
      if (propId && targetStage) {
        setLocalPropertyOverrides(prev => ({
          ...prev,
          [propId]: {
            status: targetStage === 'negotiation' ? 'optioned' : targetStage === 'negative' ? 'negative' : 'active',
            sector_data: {
              ...(prev[propId]?.sector_data || {}),
              pipeline_stage: targetStage
            }
          }
        }));
      }
      syncTasks();
    };

    window.addEventListener('real-estate-tour-scheduled', handleTourScheduled);
    window.addEventListener('real-estate-tour-completed', handleTourCompleted);
    return () => {
      window.removeEventListener('real-estate-tour-scheduled', handleTourScheduled);
      window.removeEventListener('real-estate-tour-completed', handleTourCompleted);
    };
  }, [storeId]);

  const activeSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Modals state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);

  // Commission & Stakeholder & Checkpoint states
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionProperty, setCommissionProperty] = useState<any>(null);

  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [blockedValidation, setBlockedValidation] = useState<any>(null);
  const [blockedProperty, setBlockedProperty] = useState<any>(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProperty, setHistoryProperty] = useState<any>(null);
  const [showPartnerPortalModal, setShowPartnerPortalModal] = useState(false);

  // Lead Funnel Wizard Modal state inside Pipeline
  const [showLeadWizardModal, setShowLeadWizardModal] = useState(false);
  const [editingLeadDeal, setEditingLeadDeal] = useState<any>(null);
  const [localDeals, setLocalDeals] = useState<any[]>(() => {
    if (Array.isArray(deals) && deals.length > 0) return deals;
    try {
      const raw = localStorage.getItem(`restatelp_crm_deals_${storeId || 'default'}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (Array.isArray(deals) && deals.length > 0) {
      setLocalDeals(deals);
    } else {
      try {
        const raw = localStorage.getItem(`restatelp_crm_deals_${storeId || 'default'}`);
        if (raw) setLocalDeals(JSON.parse(raw));
      } catch {}
    }
  }, [deals, storeId]);

  const handleSaveLeadFromPipeline = (dealPayload: any) => {
    setLocalDeals(prev => {
      const exists = prev.some(d => d.id === dealPayload.id);
      const next = exists
        ? prev.map(d => d.id === dealPayload.id ? dealPayload : d)
        : [dealPayload, ...prev];
      try {
        localStorage.setItem(`restatelp_crm_deals_${storeId || 'default'}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(editingLeadDeal ? 'Talep revizyonu kaydedildi ✓' : 'Yeni müşteri talebi eklendi ✓');
    setShowLeadWizardModal(false);
    setEditingLeadDeal(null);
  };

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

  // WhatsApp Appointment Reminders & Shadow Notifications
  const handleSendAgentReminder = (task: any, prop: any) => {
    const brokerName = prop.responsible_agent || 'Danışman';
    const ref = prop.reference_no || 'REF';
    const loc = prop.location || prop.kktc_region || 'KKTC';
    const dateStr = task.due_date ? format(parseISO(task.due_date), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Bugün';
    const msg = `🔔 *Hatırlatma: Randevu Saati Yaklaştı*\n\nSayın *${brokerName}*,\n*${prop.title}* [REF: ${ref}] portföyünüz için *${dateStr}* tarihinde yer gösterme randevunuz bulunmaktadır.\n📍 *Konum:* ${loc}\n📝 *Not:* ${task.description || 'Keşif Turu'}\n\nLütfen randevu saatinden 15 dakika önce adreste hazır olunuz.\n_LookPrice Operasyon & Randevu Merkezi_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success('Danışman randevu hatırlatması WhatsApp için hazırlandı!');
  };

  const handleSendClientReminder = (task: any, prop: any) => {
    const ref = prop.reference_no || 'REF';
    const loc = prop.location || prop.kktc_region || 'KKTC';
    const dateStr = task.due_date ? format(parseISO(task.due_date), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Bugün';
    const brokerName = prop.responsible_agent || 'Danışmanımız';
    const msg = `Merhaba,\n\nBugün *${dateStr}* tarihinde planlanan *${prop.title}* [REF: ${ref}] taşınmaz keşif turu randevunuzu hatırlatırız.\n\n📍 *Buluşma Noktası:* ${loc}\n👤 *Sorumlu Danışman:* ${brokerName}\n\nHerhangi bir gecikme durumunda lütfen bize bu hattan bilgi veriniz. Görüşmek üzere!\n_LookPrice Emlak_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success('Müşteri keşif turu hatırlatması WhatsApp için hazırlandı!');
  };

  const handleSendShadowNotification = (prop: any, task: any) => {
    const pool: CommissionPool | undefined = prop.sector_data?.commission_pool;
    const extPartner = pool?.stakeholders?.find((s: any) => s.is_external);
    const partnerName = extPartner?.name || 'Değerli İş Ortağımız';
    const ref = prop.reference_no || 'REF';
    const dateStr = task?.due_date ? format(parseISO(task.due_date), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Bugün';
    const msg = `Sn. *${partnerName}*,\n\nOfisimize kazandırdığınız *${prop.title}* [REF: ${ref}] portföyünüz için *${dateStr}* tarihinde yer gösterme (keşif turu) randevusu planlanmıştır.\n\nSüreç ofisimizce yakından takip edilmekte olup gelişmeler tarafınıza aktarılacaktır.\n_LookPrice Portföy & Hakediş Güvence Merkezi_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success('Dış paydaşa gölge randevu bildirimi WhatsApp için hazırlandı!');
  };

  // Helper to persist property stage & status to real_estate_properties (with optimistic state update & audit logging)
  const persistPropertyStageUpdate = async (property: any, newStatus: string, updatedSectorData: any) => {
    // Audit History Trail
    const currentHist = Array.isArray(property.sector_data?.pipeline_history) ? property.sector_data.pipeline_history : [];
    const prevStage = property.sector_data?.pipeline_stage || property.status || 'planned';
    const nextStage = updatedSectorData.pipeline_stage || newStatus;
    const actionNote = updatedSectorData.last_analysis_note || updatedSectorData.negative_reason || updatedSectorData.negotiation_notes || updatedSectorData.closing_notes || 'Aşama Değişikliği';
    
    const newLogEntry = {
      timestamp: new Date().toISOString(),
      from_stage: prevStage,
      to_stage: nextStage,
      status: newStatus,
      actor: property.responsible_agent || 'Danışman / Sistem',
      note: actionNote,
      offer_amount: updatedSectorData.offer_amount,
      final_price: updatedSectorData.final_price
    };
    updatedSectorData.pipeline_history = [newLogEntry, ...currentHist];

    // 1. Optimistic local state update so UI moves the item immediately
    setLocalPropertyOverrides(prev => ({
      ...prev,
      [property.id]: {
        status: newStatus,
        sector_data: updatedSectorData
      }
    }));

    // Async sync to property_tasks for office transparency (biri izne çıktığında süreci devralabilmesi için)
    try {
      api.createTask({
        property_id: property.id,
        task_type: 'stage_change',
        description: `[SÜREÇ TARİHÇESİ]: ${prevStage} ➔ ${nextStage} (${actionNote?.slice(0, 70)})`,
        due_date: new Date().toISOString(),
        store_id: storeId
      }, storeId).catch(() => {});
    } catch(e) {}

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
  const effectiveTasks = useMemo(() => {
    const mergedMap = new Map<number, any>();
    (Array.isArray(tasks) ? tasks : []).forEach(t => { if (t?.id) mergedMap.set(Number(t.id), t); });
    (Array.isArray(internalTasks) ? internalTasks : []).forEach(t => { if (t?.id) mergedMap.set(Number(t.id), t); });
    return Array.from(mergedMap.values());
  }, [tasks, internalTasks]);

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

      const propertyTasks = effectiveTasks.filter(t => Number(t.property_id) === Number(p.id) && (t.task_type === 'tour' || !t.task_type));
      const hasPendingTour = propertyTasks.some(t => !t.is_completed);
      
      // Priority 1: Explicit pipeline_stage or active tour status
      const overrideStage = p.sector_data?.pipeline_stage || p.pipeline_stage;

      let stage: string | null = null;

      if (overrideStage === 'closed' || p.status === 'sold' || p.status === 'rented') {
        stage = 'closed';
      } else if (overrideStage === 'negotiation' || p.status === 'optioned') {
        stage = 'negotiation';
      } else if (hasPendingTour || overrideStage === 'planned') {
        // Any property with an uncompleted scheduled tour or explicit 'planned' stage appears in 1. Geziler
        stage = 'planned';
      } else if (overrideStage === 'analysis') {
        stage = 'analysis';
      } else if (overrideStage === 'negative' || p.status === 'negative') {
        stage = 'negative';
      } else if (propertyTasks.length > 0) {
        const hasCompleted = propertyTasks.some(t => t.is_completed);
        const hasNegativeTask = propertyTasks.some(t => t.completion_note?.toLowerCase().includes('olumsuz'));

        if (hasNegativeTask) {
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
  }, [properties, effectiveTasks, localPropertyOverrides]);

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

  // Action: Move to Closing / Başarılı (5. Aşama) - with Critical Checkpoint Intercept
  const handleOpenClosing = (property: any) => {
    // CRITICAL CHECKPOINT VALIDATION:
    // If an external stakeholder has not signed the revenue share agreement, BLOCK CLOSING!
    const pool: CommissionPool | undefined = property.sector_data?.commission_pool;
    const checkpoint = validateCheckpointForClosing(pool);
    if (!checkpoint.canProceed) {
      setBlockedProperty(property);
      setBlockedValidation(checkpoint);
      setShowCheckpointModal(true);
      return;
    }

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

  // Vendor (Mülk Sahibi) Report via WhatsApp
  const handleSendVendorReport = (property: any, matchedLeads: MatchResult[], propTasks: any[]) => {
    const ref = property.reference_no || 'REF';
    const completedTours = propTasks.filter((t: any) => t.task_type === 'tour').length;
    const msg = `🏡 *PORTFÖY HAFTALIK PERFORMANS RAPORU*

📌 *Mülk:* ${property.title} [REF: ${ref}]
💰 *Fiyat:* ${property.price} ${property.currency}
📍 *Bölge:* ${property.location || 'KKTC'}

📊 *GÜNCEL CRM DURUMU:*
🎯 *Eşleşen Talep:* Sistemimizde bu mülkle kriterleri uyuşan *${matchedLeads.length} aktif alıcı/kiracı adayı* tespit edildi.
👀 *Gerçekleşen Yer Gösterme:* Bugüne kadar *${completedTours} randevu/gezi* organize edildi.
⚖️ *Piyasa Takibi:* Danışman ekibimiz portföyünüzün satış/kiralama sürecini anlık koordine etmektedir.

Detaylı bilgi için danışmanınızla dilediğiniz an iletişime geçebilirsiniz.
_LookPrice Portföy & CRM Yönetim Merkezi_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    toast.success('Mülk Sahibi Raporu WhatsApp için hazırlandı!');
  };

  // Client Presentation via WhatsApp
  const handleSendClientPresentation = (property: any, match: MatchResult) => {
    const ref = property.reference_no || 'REF';
    const msg = `Sayın *${match.customerName || 'Müşterimiz'}*,

Aradığınız kriterlere *%${match.score} oranında uyumlu* yeni bir portföyümüz sisteme eklendi:

🏠 *${property.title}* [REF: ${ref}]
📍 *Konum:* ${property.location || 'KKTC'}
💰 *Bedel:* ${property.price} ${property.currency}
🛏️ *Oda / Donanım:* ${property.room_count || ''} ${property.furnished ? '• Eşyalı' : ''}

👉 Portföyü yerinde görmek veya detaylı keşif turu planlamak için lütfen yanıtlayınız.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    toast.success('Müşteri Portföy Sunumu WhatsApp için hazırlandı!');
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
              setShowPartnerPortalModal(true);
            }}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="Dış Paydaş Cüzdanı, İzole Portföy Havuzu ve Anonimleştirilmiş Süreç Logları"
          >
            <Handshake className="w-3.5 h-3.5 text-amber-400" />
            <span>Dış Paydaş Cüzdanı</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingLeadDeal(null);
              setShowLeadWizardModal(true);
            }}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
            title="6 Adımlı KKTC Akıllı Huni Sihirbazı ile Yeni Müşteri Talebi Ekle"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Yeni Talep</span>
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
                      const matchedLeads = findMatchingLeadsForProperty(deal.property, localDeals);
                      const topMatch = matchedLeads[0];

                      return (
                        <div
                          key={deal.id}
                          className={`transition-colors ${isExpanded ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}
                        >
                          {/* SUMMARY CARD / ROW (Branching cleanly between Sütun and Satır to prevent any overlapping) */}
                          {layoutMode === 'columns' ? (
                            /* SÜTUN (COLUMN) VIEW - 2-Tier mini bento so data never overlaps in narrow columns */
                            <div
                              onClick={() => toggleDealExpand(deal.id)}
                              className="p-2 flex flex-col gap-1 cursor-pointer select-none hover:bg-slate-50 transition-colors"
                            >
                              {/* Line 1: Chevron + Thumbnail + Title + Price */}
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    className="p-0.5 text-slate-400 hover:text-slate-700 shrink-0"
                                    title={isExpanded ? "Detayı Gizle" : "Detayı Göster"}
                                  >
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                    {deal.property.images?.[0] ? (
                                      <img src={deal.property.images[0]} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <MapPin className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-xs font-black text-slate-900 truncate">
                                    {deal.property.title}
                                  </span>
                                </div>

                                <span className="text-xs font-black text-slate-900 font-mono shrink-0">
                                  {formattedPrice}
                                </span>
                              </div>

                              {/* Line 2: Ref No + Location + Latest Task / Status Badge */}
                              <div className="flex items-center justify-between gap-1.5 text-[10px] pl-5 min-w-0">
                                <div className="flex items-center gap-1 min-w-0 truncate">
                                  <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded shrink-0">
                                    {deal.property.reference_no || `#${deal.property.id}`}
                                  </span>
                                  {deal.property.location && (
                                    <span className="text-slate-500 font-medium truncate">
                                      • {deal.property.location}
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0 flex items-center gap-1">
                                  {latestTask && stage.id !== 'closed' && stage.id !== 'negative' ? (
                                    <span className={`px-1.5 py-0.2 rounded font-bold border flex items-center gap-0.5 ${
                                      latestTask.is_completed ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    }`}>
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{latestTask.due_date ? format(parseISO(latestTask.due_date), 'd MMM HH:mm', { locale: tr }) : 'Gezi'}</span>
                                    </span>
                                  ) : stage.id === 'negotiation' && sector.offer_amount ? (
                                    <span className="px-1.5 py-0.2 rounded font-black bg-amber-50 text-amber-800 border border-amber-200">
                                      Teklif: {sector.offer_amount}
                                    </span>
                                  ) : stage.id === 'closed' ? (
                                    <span className="px-1.5 py-0.2 rounded font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {deal.property.status === 'rented' ? 'KİRALANDI' : 'SATILDI'}
                                    </span>
                                  ) : stage.id === 'negative' && sector.negative_reason ? (
                                    <span className="px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-800 border border-rose-200 truncate max-w-[100px]">
                                      {sector.negative_reason}
                                    </span>
                                  ) : null}

                                  {matchedLeads.length > 0 && topMatch && (
                                    <span className="px-1.5 py-0.2 rounded font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5" title={`Kriterleri uyan ${matchedLeads.length} müşteri talebi bulundu (En yüksek %${topMatch.score})`}>
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                      <span>{matchedLeads.length} Talep (%{topMatch.score})</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* YATAY (HORIZONTAL) ROW VIEW - Single Clean Horizontal Row */
                            <div
                              onClick={() => toggleDealExpand(deal.id)}
                              className="px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-50 transition-colors"
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
                                  <span className="truncate max-w-[140px]">{deal.property.location || deal.property.kktc_region || 'KKTC'}</span>
                                </span>
                              </div>

                              {/* Right: Status Pill + Latest Task Date + Price */}
                              <div className="flex items-center gap-2 shrink-0">
                                {stage.id === 'negotiation' && sector.offer_amount && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-black shrink-0">
                                    Teklif: {sector.offer_amount} {deal.property.currency}
                                  </span>
                                )}

                                {stage.id === 'closed' && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black shrink-0">
                                    {deal.property.status === 'rented' ? 'KİRALANDI' : 'SATILDI'}
                                    {sector.final_price ? ` • ${sector.final_price} ${deal.property.currency}` : ''}
                                  </span>
                                )}

                                {stage.id === 'negative' && sector.negative_reason && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold max-w-[160px] truncate shrink-0">
                                    {sector.negative_reason}
                                  </span>
                                )}

                                {latestTask && stage.id !== 'closed' && stage.id !== 'negative' && (
                                  <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                                    latestTask.is_completed
                                      ? 'bg-slate-50 text-slate-600 border-slate-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}>
                                    <Clock className="w-2.5 h-2.5" />
                                    {latestTask.due_date ? format(parseISO(latestTask.due_date), 'd MMM HH:mm', { locale: tr }) : 'Gezi'}
                                  </span>
                                )}

                                {matchedLeads.length > 0 && topMatch && (
                                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0" title={`Kriterleri uyan ${matchedLeads.length} müşteri talebi bulundu (En yüksek %${topMatch.score})`}>
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>{matchedLeads.length} Talep Uyumlu (%{topMatch.score})</span>
                                  </span>
                                )}

                                {/* Price */}
                                <span className="text-xs font-black text-slate-900 font-mono shrink-0 ml-1 min-w-[70px] text-right">
                                  {formattedPrice}
                                </span>
                              </div>
                            </div>
                          )}

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
                                  {/* Forward-Only Stage Progression Toolbar (Single Line, No 'Aşama Değiştir' Label, No Backwards Progression) */}
                                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/80 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* 1. Geziler Stage -> Forward to Analiz, Pazarlık, or Olumsuz */}
                                      {stage.id === 'planned' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleCompleteTour(latestTask, deal.property)}
                                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="Geziyi tamamla ve 2. Analiz aşamasına aktar"
                                          >
                                            <Search className="w-3 h-3" />
                                            <span>2. Analiz</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNegotiation(deal.property)}
                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="Doğrudan 3. Pazarlık aşamasına aktar"
                                          >
                                            <TrendingUp className="w-3 h-3" />
                                            <span>3. Pazarlık</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNegative(deal.property, latestTask)}
                                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="4. Olumsuz (Arşiv) listesine taşı"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>4. Olumsuz</span>
                                          </button>
                                        </>
                                      )}

                                      {/* 2. Analiz Stage -> User: Sadece Pazarlık, Olumsuz ve Başarılı seçenekleri (Geziler ve Analiz geri gösterilmez) */}
                                      {stage.id === 'analysis' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNegotiation(deal.property)}
                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="3. Pazarlık aşamasına geçir"
                                          >
                                            <TrendingUp className="w-3 h-3" />
                                            <span>Pazarlık</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNegative(deal.property)}
                                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="4. Olumsuz (Arşiv) listesine taşı"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>Olumsuz</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenClosing(deal.property)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="5. Başarılı olarak tamamla"
                                          >
                                            <Handshake className="w-3 h-3" />
                                            <span>Başarılı</span>
                                          </button>
                                        </>
                                      )}

                                      {/* 3. Pazarlık Stage -> User: Sadece Başarılı veya Olumsuz statüleri ile konu sonuca bağlanır */}
                                      {stage.id === 'negotiation' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenClosing(deal.property)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="5. Başarılı olarak tamamla"
                                          >
                                            <Handshake className="w-3 h-3" />
                                            <span>Başarılı</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenNegative(deal.property)}
                                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                            title="4. Olumsuz (Arşiv) listesine taşı"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>Olumsuz</span>
                                          </button>
                                        </>
                                      )}

                                      {/* 4. Olumsuz veya 5. Başarılı -> Arşivden Canlandır (2. Analiz) */}
                                      {(stage.id === 'negative' || stage.id === 'closed') && (
                                        <button
                                          type="button"
                                          onClick={() => handleReactivate(deal.property, 'analysis')}
                                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-white rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                                          title="Arşivden çıkar ve 2. Analiz aşamasına geri al"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Canlandır (2. Analiz)</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Right Action Buttons: Portföy Künyesi + Ek Gezi Planla */}
                                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => setInspectedProperty(deal.property)}
                                        className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                                        title="Ekrandan çıkmadan Portföy Künyesini ve fotoğraflarını gör"
                                      >
                                        <Eye className="w-3 h-3 text-amber-300" />
                                        <span>Portföy Künyesi</span>
                                      </button>

                                      {(stage.id === 'planned' || stage.id === 'analysis') && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenTourModal(deal.property)}
                                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Ek Gezi Planla</span>
                                        </button>
                                      )}
                                    </div>
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
                                          <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                                            <button
                                              type="button"
                                              onClick={() => handleSendAgentReminder(latestTask, deal.property)}
                                              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                              title="Danışmana randevu saatini WhatsApp ile hatırlat"
                                            >
                                              <Send className="w-2.5 h-2.5 text-indigo-300" />
                                              <span>Danışmana Hatırlat</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSendClientReminder(latestTask, deal.property)}
                                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                              title="Müşteriye randevu detayını WhatsApp ile hatırlat"
                                            >
                                              <Send className="w-2.5 h-2.5 text-white" />
                                              <span>Müşteriye Hatırlat</span>
                                            </button>
                                            {deal.property.sector_data?.commission_pool?.stakeholders?.some((s: any) => s.is_external) && (
                                              <span
                                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black flex items-center gap-1 select-none"
                                                title="Arka plan tetikleyicisi (background job) tarafından dış paydaşa otomatik gölge bildirim iletildi"
                                              >
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                <span>Dış paydaşa bilgi iletildi ✓</span>
                                              </span>
                                            )}
                                          </div>
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

                                  {/* SMART CRM TALEP EŞLEŞMELERİ & MÜLK SAHİBİ RAPORLAMA BÖLÜMÜ */}
                                  <div className="bg-white p-2.5 rounded-xl border border-indigo-100/90 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 flex-wrap">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black shadow-2xs">
                                          <Sparkles className="w-3 h-3" />
                                        </div>
                                        <div>
                                          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                                            <span>Akıllı CRM Talep Eşleşmeleri</span>
                                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                                              {matchedLeads.length} Eşleşen Talep
                                            </span>
                                          </h4>
                                          <span className="text-[9px] text-slate-500 font-bold">
                                            Ağırlıklı Puanlama Motoru (Lokasyon %30, Bütçe Fuzzy %25, İşlem %20, Tip/Oda %15, Yaş/Kat %10)
                                          </span>
                                        </div>
                                      </div>

                                      {/* Vendor (Mülk Sahibi) Feedback Report Trigger */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendVendorReport(deal.property, matchedLeads, deal.tasks);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                                        title="Mülk sahibine bu portföyün güncel CRM durum raporunu WhatsApp üzerinden iletir"
                                      >
                                        <Share2 className="w-3 h-3 text-emerald-600" />
                                        <span>Mülk Sahibine Haftalık Rapor Gönder (WhatsApp)</span>
                                      </button>
                                    </div>

                                    {/* Matched Leads List */}
                                    {matchedLeads.length === 0 ? (
                                      <p className="text-[10px] text-slate-400 font-medium py-1">
                                        Bu mülk kriterlerine (%55 üzeri) henüz uyan açık müşteri talebi bulunmuyor. Yeni bir talep eklendiğinde sistem otomatik eşleştirecektir.
                                      </p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {matchedLeads.slice(0, 4).map((match, mIdx) => (
                                          <div key={mIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                                            <div className="flex items-start justify-between gap-1.5">
                                              <div className="min-w-0 flex-1">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase font-mono ${
                                                  match.tier === 'high' 
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                  %{match.score} EŞLEŞME • {match.tier === 'high' ? '🔥 Yüksek Eşleşme' : '⚡ Olası Fırsat'}
                                                </span>
                                                <p className="text-[11px] font-extrabold text-slate-900 truncate mt-0.5">{match.dealTitle}</p>
                                              </div>
                                            </div>

                                            {/* Criteria tags */}
                                            <div className="flex flex-wrap gap-1">
                                              {match.reasons.slice(0, 2).map((r, rIdx) => (
                                                <span key={rIdx} className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600 font-semibold truncate max-w-full">
                                                  {r}
                                                </span>
                                              ))}
                                              {match.tolerancesApplied.map((t, tIdx) => (
                                                <span key={tIdx} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100 font-bold">
                                                  ⚡ {t}
                                                </span>
                                              ))}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 flex-wrap">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenTourModal(deal.property, { customerName: match.customerName, name: match.customerName });
                                                }}
                                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                              >
                                                <Calendar className="w-2.5 h-2.5" />
                                                <span>Yer Gösterme Planla</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSendClientPresentation(deal.property, match);
                                                }}
                                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                              >
                                                <MessageSquare className="w-2.5 h-2.5" />
                                                <span>WhatsApp ile Sun</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const foundLead = localDeals.find(d => d.id === match.dealId);
                                                  if (foundLead) {
                                                    setEditingLeadDeal(foundLead);
                                                    setShowLeadWizardModal(true);
                                                  }
                                                }}
                                                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                title="Talebi ve kriterlerini 6 adımlı huni sihirbazında revize et"
                                              >
                                                <Edit2 className="w-2.5 h-2.5 text-indigo-600" />
                                                <span>Talebi Revize Et</span>
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* #1. RE-ENGAGEMENT ENGINE (Fiyat İndirimi & Soğuk Talep Uyandırma) */}
                                  {(() => {
                                    const reOpportunities = findReEngagementOpportunities(deal.property, localDeals);
                                    if (reOpportunities.length === 0) return null;
                                    return (
                                      <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/90 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
                                        <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-1 flex-wrap">
                                          <div className="flex items-center gap-1.5 text-amber-950 font-black text-[11px]">
                                            <BellRing className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                                            <span>Fiyat İndirimi Fırsat Alarmı ({reOpportunities.length} Soğuk Talep Uyandırılabilir)</span>
                                          </div>
                                          <span className="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded font-mono">
                                            Re-Engagement Motoru
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-amber-800 font-medium">
                                          Fiyat güncellemesi sonrasında daha önce bütçesi yetmeyen veya olumsuz sonuçlanan bu talepler artık portföy ile tam uyumlu hale geldi:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          {reOpportunities.map((opp, oIdx) => (
                                            <div key={oIdx} className="p-2 bg-white rounded-lg border border-amber-200 shadow-2xs space-y-1 text-[10px]">
                                              <div className="flex items-center justify-between gap-1">
                                                <span className="font-extrabold text-slate-900 truncate">{opp.customerName}</span>
                                                <span className="px-1 py-0.2 bg-emerald-50 text-emerald-800 font-black rounded border border-emerald-200 font-mono">
                                                  %{opp.newMatchScore} Uyum (+%{opp.discountPercent} İndirim)
                                                </span>
                                              </div>
                                              <p className="text-slate-500 truncate">{opp.deal.title}</p>
                                              <div className="pt-1 border-t border-slate-100 flex items-center justify-end gap-1">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://wa.me/?text=${encodeURIComponent(opp.whatsappMessage)}`, '_blank');
                                                    toast.success('İndirim fırsat mesajı WhatsApp için hazırlandı!');
                                                  }}
                                                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                                >
                                                  <MessageSquare className="w-2.5 h-2.5" />
                                                  <span>İndirim Bildir (WhatsApp)</span>
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* COMMISSION & EXTERNAL STAKEHOLDER POOL (Smart Contract Checkpoint) */}
                                  {(() => {
                                    const pool: CommissionPool | undefined = deal.property.sector_data?.commission_pool;
                                    const extCount = pool?.stakeholders?.filter((s: any) => s.is_external).length || 0;
                                    const unsignedExt = pool?.stakeholders?.filter((s: any) => s.is_external && s.payout_status === 'pending_agreement').length || 0;

                                    return (
                                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black shadow-2xs">
                                              <DollarSign className="w-3 h-3" />
                                            </div>
                                            <div>
                                              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                                                <span>Komisyon & Dış Paydaş Havuzu</span>
                                                {extCount > 0 && (
                                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                                                    unsignedExt > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                  }`}>
                                                    {unsignedExt > 0 ? `⚠️ ${unsignedExt} Paydaş Onayı Bekleniyor` : '✔ Tüm Paydaşlar Onaylı'}
                                                  </span>
                                                )}
                                                {pool?.accounting_posted && (
                                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                    🏦 Cari Hesaba Alacak Yazıldı ✓
                                                  </span>
                                                )}
                                              </h4>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowPartnerPortalModal(true);
                                              }}
                                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all"
                                              title="Dış Paydaş Cüzdanı ve İzole Portföy Paneli"
                                            >
                                              <Handshake className="w-3 h-3 text-amber-700" />
                                              <span>Paydaş Cüzdanı</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCommissionProperty(deal.property);
                                                setShowCommissionModal(true);
                                              }}
                                              className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                                            >
                                              <Users className="w-3 h-3 text-emerald-300" />
                                              <span>Hakediş & Masraf Yönet</span>
                                            </button>
                                          </div>
                                        </div>

                                        {pool ? (
                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex items-center justify-between text-slate-600 font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-200/70 flex-wrap gap-1">
                                              <span>Toplam Hizmet Bedeli: <strong className="text-slate-900 font-mono">{pool.gross_commission?.toLocaleString('tr-TR')} {pool.currency}</strong></span>
                                              <span>Ortak Masraflar: <strong className="text-rose-600 font-mono">-{pool.total_expenses?.toLocaleString('tr-TR')} {pool.currency}</strong></span>
                                              <span>Net Dağıtılabilir: <strong className="text-emerald-700 font-mono">{pool.net_distributable_commission?.toLocaleString('tr-TR')} {pool.currency}</strong> ({pool.calculation_mode === 'net' ? 'Net' : 'Brüt'})</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                              {pool.stakeholders?.map((stk: any) => (
                                                <div key={stk.id} className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-1 text-[10px]">
                                                  <div className="min-w-0">
                                                    <div className="flex items-center gap-1">
                                                      <span className="font-extrabold text-slate-900 truncate">{stk.name}</span>
                                                      {stk.is_external && <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-black">Dış Paydaş</span>}
                                                      {stk.is_locked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                                    </div>
                                                    <p className="text-slate-500 font-mono">%{stk.percentage} • {stk.calculated_amount?.toLocaleString('tr-TR')} {stk.currency}</p>
                                                  </div>
                                                  <div>
                                                    {stk.payout_status === 'agreement_signed' ? (
                                                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                        ✔ Onaylı
                                                      </span>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setCommissionProperty(deal.property);
                                                          setShowCommissionModal(true);
                                                        }}
                                                        className="text-[9px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer"
                                                      >
                                                        ⏳ Onay Bekliyor
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-slate-400 font-medium">
                                            Bu işlem için henüz özel hakediş havuzu tanımlanmadı. Standart ofis modeli uygulanır.
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* PIPELINE AUDIT HISTORY TRAIL */}
                                  {deal.property.sector_data?.pipeline_history && deal.property.sector_data.pipeline_history.length > 0 && (
                                    <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                                        <div className="flex items-center gap-1.5 text-slate-800 font-black text-[11px]">
                                          <History className="w-3.5 h-3.5 text-slate-500" />
                                          <span>Süreç Tarihçesi & İşlem Denetim Kütüğü (Audit Trail)</span>
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono font-bold">
                                          {deal.property.sector_data.pipeline_history.length} Hareket Kayıtlı
                                        </span>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {deal.property.sector_data.pipeline_history.slice(0, 5).map((log: any, lIdx: number) => (
                                          <div key={lIdx} className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-1.5 text-[10px]">
                                            <div className="min-w-0 flex-1">
                                              <p className="font-extrabold text-slate-900 truncate">
                                                {log.from_stage} ➔ {log.to_stage}
                                              </p>
                                              {log.note && <p className="text-slate-600 truncate italic">"{log.note}"</p>}
                                              {log.offer_amount && <p className="text-amber-800 font-bold font-mono">Teklif: {log.offer_amount} GBP</p>}
                                              {log.final_price && <p className="text-emerald-800 font-bold font-mono">Kapanış: {log.final_price} GBP</p>}
                                            </div>
                                            <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                              {log.timestamp ? format(parseISO(log.timestamp), 'd MMM HH:mm', { locale: tr }) : 'Tarih'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
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

      {/* 6. CRITICAL CHECKPOINT WARNING MODAL (Dış Paydaş Dijital Onay Bekleniyor) */}
      <AnimatePresence>
        {showCheckpointModal && blockedValidation && blockedProperty && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden"
            >
              <div className="bg-rose-600 text-white p-4 flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-xl shrink-0">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black uppercase tracking-tight">İşlem Bloke Edildi (Checkpoint)</h3>
                  <p className="text-xs text-rose-100 mt-0.5 font-bold">Paydaş Sözleşme Onayı Bekleniyor</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckpointModal(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 font-medium">
                  Bu işlemde tanımlı dış paydaş(lar) henüz dijital <strong>"Gelir Paylaşım Protokolü"</strong>nü imzalamamıştır.
                  <p className="text-[11px] text-rose-700 mt-1 font-bold">
                    Sistem ve hukuk kuralları gereği, paydaş hakedişi dijital olarak güvenceye alınmadan işlem "5. Başarılı / Kapanış" statüsüne taşınamaz.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-500">Onay Bekleyen Dış Paydaşlar:</span>
                  {blockedValidation.unsignedPartners.map((u: any) => (
                    <div key={u.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] gap-2">
                      <div className="min-w-0 flex-1">
                        <strong className="text-slate-900 block truncate">{u.name}</strong>
                        <span className="text-slate-500 font-mono text-[10px]">{u.roleLabel} • %{u.percentage} Hakediş</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const pool = blockedProperty.sector_data?.commission_pool;
                            const msg = getPartnerWhatsAppContractInvite(blockedProperty, u, pool, 'LookPrice Emlak');
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                            toast.success('WhatsApp onay bağlantısı hazırlandı!');
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const pool = blockedProperty.sector_data?.commission_pool;
                            if (pool) {
                              const updated = pool.stakeholders.map((s: any) => s.id === u.id ? {
                                ...s,
                                payout_status: 'agreement_signed',
                                is_locked: true,
                                signed_at: new Date().toISOString()
                              } : s);
                              const updatedPool = recalculateCommissionPool({ ...pool, stakeholders: updated });
                              await persistPropertyStageUpdate(blockedProperty, blockedProperty.status, {
                                ...blockedProperty.sector_data,
                                commission_pool: updatedPool
                              });
                              toast.success(`${u.name} için ofis dijital onayı tamamlandı!`);
                              setShowCheckpointModal(false);
                            }
                          }}
                          className="px-2 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Ofiste Onayla</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckpointModal(false);
                      setCommissionProperty(blockedProperty);
                      setShowCommissionModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Havuzu Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCheckpointModal(false)}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Anladım, Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DEAL COMMISSION & EXPENSES MODAL */}
      {showCommissionModal && commissionProperty && (
        <DealCommissionModal
          isOpen={showCommissionModal}
          onClose={() => {
            setShowCommissionModal(false);
            setCommissionProperty(null);
          }}
          property={commissionProperty}
          storeName="LookPrice Emlak"
          onSavePool={async (updatedPool) => {
            const updatedSectorData = {
              ...(commissionProperty.sector_data || {}),
              commission_pool: updatedPool
            };
            await persistPropertyStageUpdate(commissionProperty, commissionProperty.status, updatedSectorData);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* 8. EXTERNAL PARTNER WALLET & ISOLATED PORTAL MODAL */}
      {showPartnerPortalModal && (
        <ExternalPartnerPortalModal
          isOpen={showPartnerPortalModal}
          onClose={() => setShowPartnerPortalModal(false)}
          properties={properties}
          tasks={tasks}
          storeName="LookPrice Emlak"
          onUpdatePropertyPool={async (prop, updatedPool) => {
            const updatedSectorData = {
              ...(prop.sector_data || {}),
              commission_pool: updatedPool
            };
            await persistPropertyStageUpdate(prop, prop.status, updatedSectorData);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* 9. 6-STEP KKTC LEAD FUNNEL & REVISION WIZARD MODAL */}
      {showLeadWizardModal && (
        <LeadFunnelWizardModal
          isOpen={showLeadWizardModal}
          onClose={() => {
            setShowLeadWizardModal(false);
            setEditingLeadDeal(null);
          }}
          editingDeal={editingLeadDeal}
          agents={[]}
          portfolioItems={properties}
          stages={RE_LEAD_STAGES}
          storeId={storeId}
          onSaveDeal={handleSaveLeadFromPipeline}
          onSelectMatchedProperty={(prop, customerName) => {
            setShowLeadWizardModal(false);
            setEditingLeadDeal(null);
            onOpenTourModal(prop, { customerName, name: customerName });
          }}
        />
      )}

      {/* 10. IN-SCREEN PORTFOLIO QUICK INSPECTOR MODAL */}
      {inspectedProperty && (
        <PropertyQuickInspectorModal
          property={inspectedProperty}
          storeSlug={storeSlug}
          onClose={() => setInspectedProperty(null)}
          onEditProperty={onEditProperty}
          onScheduleTour={(p) => onOpenTourModal(p)}
        />
      )}
    </div>
  );
};

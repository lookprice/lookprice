import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  MapPin,
  DollarSign,
  Sliders,
  ShieldCheck,
  UserCheck,
  Home,
  Building2,
  Compass,
  History,
  Handshake,
  Save
} from 'lucide-react';
import { REAL_ESTATE_REGIONS } from '../../data/realEstateConfig';
import {
  LeadFunnelCriteria,
  LeadRevisionEntry,
  findMatchingPropertiesForLead,
  parseLeadCriteria
} from '../../utils/realEstateMatchEngine';

import { api } from '../../services/api';

interface LeadFunnelWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDeal?: any | null;
  initialContact?: { id?: string | number; name?: string; phone?: string; notes?: string } | null;
  agents: any[];
  portfolioItems: any[];
  stages: string[];
  storeId?: number;
  onSaveDeal: (dealPayload: any) => void;
  onSelectMatchedProperty?: (property: any, customerName: string) => void;
}

const WIZARD_STEPS = [
  { id: 1, short: '1. Niyet & Tip', title: 'İşlem Niyeti ve Kategori', icon: Home },
  { id: 2, short: '2. Lokasyon', title: 'Lokasyon ve Kapsama Alanı (KKTC)', icon: MapPin },
  { id: 3, short: '3. Bütçe & Ödeme', title: 'Finansal Çerçeve ve Ödeme', icon: DollarSign },
  { id: 4, short: '4. Metrikler', title: 'Fiziksel Metrikler', icon: Sliders },
  { id: 5, short: '5. Koçan & Donanım', title: 'KKTC Hukuki Durumu ve Donanım', icon: ShieldCheck },
  { id: 6, short: '6. Müşteri & Paydaş', title: 'Müşteri Profili ve Aciliyet', icon: UserCheck }
];

const SUBTYPES_BY_MAIN: Record<'residence' | 'commercial' | 'land', string[]> = {
  residence: ['Daire', 'Villa', 'Müstakil Ev', 'Penthouse', 'Studio (1+0)', 'Residence', 'İkiz Villa', 'Bahçe Dubleks'],
  commercial: ['Dükkan / Mağaza', 'Ofis / Büro', 'Depo / Antrepo', 'Kompleks Bina / Plaza', 'Turistik Tesis / Otel', 'Restoran / Cafe'],
  land: ['İmarlı Arsa', 'Konut İmarlı Arsa', 'Ticari İmarlı Arsa', 'Turizm İmarlı Arsa', 'Tarla', 'Projelik Arazi', 'Zeytinlik']
};

const POPULAR_SUBREGIONS: Record<string, string[]> = {
  Girne: ['Girne Merkez', 'Alsancak', 'Lapta', 'Çatalköy', 'Esentepe', 'Karaoğlanoğlu', 'Bellapais', 'Ozanköy', 'Zeytinlik', 'Doğanköy', 'Edremit', 'Karakum', 'Karşıyaka', 'Bahçeli'],
  Lefkoşa: ['Gönyeli', 'Yenikent', 'Küçük Kaymaklı', 'Ortaköy', 'Hamitköy', 'Köşklüçiftlik', 'Yenişehir', 'Metehan', 'Kızılbaş', 'Alayköy', 'Haspolat', 'Değirmenlik'],
  İskele: ['Long Beach', 'Boğaz', 'İskele Merkez', 'Ötüken', 'Bafra', 'Yeni Erenköy', 'Tatlısu', 'Mehmetçik', 'Dipkarpaz'],
  Gazimağusa: ['Mağusa Merkez', 'Yeni Boğaziçi', 'Tuzla', 'Sakarya', 'Salamis', 'Çanakkale', 'Gülseren', 'Karakol', 'Mutluyaka'],
  Güzelyurt: ['Güzelyurt Merkez', 'Kalkanlı', 'Aşağı Bostancı', 'Yukarı Bostancı', 'Akçay', 'Aydınköy', 'Yayla'],
  Lefke: ['Gaziveren', 'Gemikonağı', 'Lefke', 'Yeşilırmak', 'Yedidalga', 'Doğancı', 'Yeşilyurt']
};

const MUST_HAVES_BY_MAIN: Record<'residence' | 'commercial' | 'land', { id: string; label: string }[]> = {
  residence: [
    { id: 'sea_view', label: 'Deniz Manzarası' },
    { id: 'pool', label: 'Özel / Ortak Havuz' },
    { id: 'parking', label: 'Otopark (Kapalı/Açık)' },
    { id: 'elevator', label: 'Asansör' },
    { id: 'pet_friendly', label: 'Evcil Hayvan İzni (Pet-friendly)' },
    { id: 'gated_community', label: 'Site İçi Güvenlik' },
    { id: 'roof_terrace', label: 'Çatı Terası / BBQ' },
    { id: 'garden', label: 'Müstakil Bahçe' }
  ],
  commercial: [
    { id: 'main_road', label: 'Ana Cadde Cephesi' },
    { id: 'chimney', label: 'Sanayi Bacası (Restoran Uygun)' },
    { id: 'industrial_elec', label: 'Sanayi Elektriği (Trifaze)' },
    { id: 'generator_water', label: 'Jeneratör & Su Deposu' },
    { id: 'parking', label: 'Müşteri Otoparkı' },
    { id: 'loading_bay', label: 'Sevkiyat / Tır Yanaşma' },
    { id: 'mezzanine_basement', label: 'Asma Kat / Bodrum' }
  ],
  land: [
    { id: 'cadastre_road', label: 'Resmi Kadastro Yolu' },
    { id: 'electricity_water', label: 'Elektrik & Su Altyapısı Hazır' },
    { id: 'main_road', label: 'Ana Yola Cepheli' },
    { id: 'sea_view', label: 'Deniz Manzaralı' },
    { id: 'flat_topography', label: 'Düz Zemin / İnşaata Hazır' },
    { id: 'jv_suitable', label: 'Kat Karşılığına Uygun' }
  ]
};

const DEFAULT_CRITERIA: LeadFunnelCriteria = {
  intent: 'sale',
  mainType: 'residence',
  subTypes: [],
  cities: ['Girne'],
  subRegions: [],
  locationTolerance: 'nearby_10km',
  currency: 'GBP',
  minBudget: 0,
  maxBudget: 180000,
  paymentMethod: 'any',
  budgetTolerance: 10,
  trafoKdvPreference: 'any',
  roomCounts: [],
  minSqm: 50,
  maxSqm: 250,
  buildingAge: 'any',
  floorPreference: 'any',
  maxTotalFloors: 'any',
  commercialUsage: 'any',
  commercialLocationType: 'any',
  landZoning: [],
  landKaks: 'any',
  landGabari: 'any',
  kocanTypes: [],
  furnishedPreference: 'any',
  mustHaves: [],
  customerName: '',
  customerPhone: '',
  urgency: '1_3_months',
  clientLocationStatus: 'cyprus_resident',
  sourceType: 'internal_agent',
  internalAgentName: '',
  externalPartnerName: '',
  externalPartnerPhone: '',
  externalPartnerShare: 25
};

const formatNum = (val: number | undefined | null): string => {
  if (!val || isNaN(val)) return '0';
  return new Intl.NumberFormat('tr-TR').format(Math.round(val));
};

export const LeadFunnelWizardModal: React.FC<LeadFunnelWizardModalProps> = ({
  isOpen,
  onClose,
  editingDeal,
  initialContact,
  agents,
  portfolioItems,
  stages,
  storeId,
  onSaveDeal,
  onSelectMatchedProperty
}) => {
  const [step, setStep] = useState<number>(1);
  const [criteria, setCriteria] = useState<LeadFunnelCriteria>(DEFAULT_CRITERIA);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [stage, setStage] = useState<string>(stages[0] || 'Yeni Talep / Aday');
  const [subRegionSearch, setSubRegionSearch] = useState<string>('');
  const [showAllSubRegions, setShowAllSubRegions] = useState<boolean>(false);
  const [showRevisions, setShowRevisions] = useState<boolean>(false);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFn = typeof api.getRealEstateContacts === 'function'
      ? () => api.getRealEstateContacts(undefined, storeId)
      : typeof (api as any).getContacts === 'function'
      ? () => (api as any).getContacts(storeId)
      : () => Promise.resolve([]);
    fetchFn()
      .then((res: any) => {
        if (Array.isArray(res)) setCrmContacts(res);
      })
      .catch(() => {});
  }, [isOpen, storeId]);

  // Initialize from editingDeal or initialContact or reset for new lead
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setShowRevisions(false);

    if (editingDeal) {
      const existingCriteria: Partial<LeadFunnelCriteria> | undefined = editingDeal.criteria;
      if (existingCriteria && Object.keys(existingCriteria).length > 0) {
        setCriteria({
          ...DEFAULT_CRITERIA,
          ...existingCriteria,
          internalAgentName: existingCriteria.internalAgentName || editingDeal.agent_name || ''
        });
      } else {
        // Hydrate legacy deal into structured 6-step criteria using NLP parser
        const parsed = parseLeadCriteria(editingDeal);
        const extractedNameMatch = (editingDeal.title || '').match(/\(([^)]+)\)/);
        const extractedName = extractedNameMatch ? extractedNameMatch[1] : '';
        const detectedCities = Object.keys(REAL_ESTATE_REGIONS).filter(city =>
          parsed.locations.some(l => l.toLowerCase() === city.toLowerCase())
        );

        setCriteria({
          ...DEFAULT_CRITERIA,
          intent: (parsed.intent as any) || 'sale',
          mainType: (parsed.mainType as any) || 'residence',
          cities: detectedCities.length > 0 ? detectedCities : ['Girne'],
          subRegions: parsed.locations
            .filter(l => !detectedCities.some(c => c.toLowerCase() === l.toLowerCase()))
            .map(l => l.charAt(0).toUpperCase() + l.slice(1)),
          currency: (parsed.currency as any) || 'GBP',
          minBudget: 0,
          maxBudget: parsed.maxBudget || (parsed.intent === 'rent' ? 1000 : 180000),
          roomCounts: parsed.roomCounts || [],
          furnishedPreference: (parsed.furnished as any) || 'any',
          customerName: extractedName,
          internalAgentName: editingDeal.agent_name || (agents[0]?.name || '')
        });
      }
      setCustomTitle(editingDeal.title || '');
      setIsTitleManuallyEdited(true);
      setNotes(editingDeal.description || '');
      setStage(editingDeal.stage || stages[0] || 'Yeni Talep / Aday');
    } else {
      setCriteria({
        ...DEFAULT_CRITERIA,
        customerName: initialContact?.name || '',
        customerPhone: initialContact?.phone || '',
        internalAgentName: agents[0]?.name || ''
      });
      setCustomTitle('');
      setIsTitleManuallyEdited(false);
      setNotes(initialContact?.notes || '');
      setStage(stages[0] || 'Yeni Talep / Aday');
    }
  }, [isOpen, editingDeal, initialContact]);

  // Budget Slider Range Bounds based on Intent & Currency
  const budgetBounds = useMemo(() => {
    const isRent = criteria.intent === 'rent';
    const curr = criteria.currency;
    if (isRent) {
      if (curr === 'TRY') return { min: 0, max: 150000, step: 2500 };
      return { min: 0, max: 5000, step: 50 };
    } else {
      if (curr === 'TRY') return { min: 0, max: 50000000, step: 250000 };
      return { min: 0, max: 1500000, step: 5000 };
    }
  }, [criteria.intent, criteria.currency]);

  // Sqm Slider Range Bounds based on Main Type
  const sqmBounds = useMemo(() => {
    if (criteria.mainType === 'land') {
      return { min: 0, max: 10000, step: 100 };
    }
    if (criteria.mainType === 'commercial') {
      return { min: 0, max: 2000, step: 20 };
    }
    return { min: 30, max: 600, step: 10 };
  }, [criteria.mainType]);

  // Available sub-regions for selected cities
  const availableSubRegions = useMemo(() => {
    const activeCities = criteria.cities.length > 0 ? criteria.cities : Object.keys(REAL_ESTATE_REGIONS);
    const popular: string[] = [];
    const all: string[] = [];

    activeCities.forEach(c => {
      (POPULAR_SUBREGIONS[c] || []).forEach(sr => {
        if (!popular.includes(sr)) popular.push(sr);
      });
      ((REAL_ESTATE_REGIONS as any)[c] || []).forEach((sr: string) => {
        if (!all.includes(sr)) all.push(sr);
      });
    });

    if (subRegionSearch.trim()) {
      const q = subRegionSearch.toLowerCase().trim();
      return all.filter(sr => sr.toLowerCase().includes(q));
    }
    return showAllSubRegions ? all : popular;
  }, [criteria.cities, subRegionSearch, showAllSubRegions]);

  // Auto-generate clean descriptive title & summary from funnel selections
  const generatedSummary = useMemo(() => {
    const intentLabel =
      criteria.intent === 'rent'
        ? 'Kiralık'
        : criteria.intent === 'investment'
        ? 'Yatırımlık'
        : criteria.intent === 'sale'
        ? 'Satılık'
        : 'Satılık/Kiralık';

    const typeLabel =
      criteria.subTypes.length > 0
        ? criteria.subTypes.slice(0, 2).join('/')
        : criteria.mainType === 'land'
        ? 'Arsa'
        : criteria.mainType === 'commercial'
        ? 'Ticari Mülk'
        : 'Konut';

    const locLabel =
      criteria.subRegions.length > 0
        ? criteria.subRegions.slice(0, 2).join(', ')
        : criteria.cities.length > 0
        ? criteria.cities.join(', ')
        : 'KKTC Geneli';

    const roomPart =
      criteria.mainType === 'residence' && criteria.roomCounts.length > 0
        ? `${criteria.roomCounts.join('/')} `
        : '';

    const clientPart = criteria.customerName.trim() ? ` (${criteria.customerName.trim()})` : '';
    const autoTitle = `${locLabel} ${roomPart}${intentLabel} ${typeLabel} Talebi${clientPart}`.replace(/\s+/g, ' ').trim();

    const currSymbol =
      criteria.currency === 'GBP'
        ? '£'
        : criteria.currency === 'EUR'
        ? '€'
        : criteria.currency === 'USD'
        ? '$'
        : '₺';

    const budgetLabel =
      criteria.maxBudget > 0
        ? criteria.minBudget > 0
          ? `${currSymbol}${formatNum(criteria.minBudget)} - ${currSymbol}${formatNum(criteria.maxBudget)}`
          : `Maks ${currSymbol}${formatNum(criteria.maxBudget)}`
        : 'Esnek Bütçe';

    const detailParts: string[] = [];
    if (criteria.cities.length > 0) detailParts.push(`İlçe: ${criteria.cities.join(', ')}`);
    if (criteria.subRegions.length > 0) detailParts.push(`Semt: ${criteria.subRegions.join(', ')}`);
    if (criteria.mainType === 'residence' && criteria.roomCounts.length > 0) detailParts.push(`Oda: ${criteria.roomCounts.join(', ')}`);
    if (criteria.minSqm > 0 || criteria.maxSqm > 0) detailParts.push(`Alan: ${criteria.minSqm || 0}-${criteria.maxSqm || '∞'} m²`);
    if (criteria.kocanTypes.length > 0) detailParts.push(`Koçan: ${criteria.kocanTypes.join(', ')}`);
    if (criteria.mainType !== 'land' && criteria.furnishedPreference !== 'any') {
      const fMap: Record<string, string> = { full: 'Tam Eşyalı', partial: 'Kısmi Eşyalı', unfurnished: 'Eşyasız' };
      detailParts.push(`Eşya: ${fMap[criteria.furnishedPreference] || ''}`);
    }
    if (criteria.paymentMethod !== 'any') {
      const pMap: Record<string, string> = {
        cash: 'Peşin',
        bank_credit: 'Krediye Uygun',
        developer_installment: 'Şirket İçi Taksit',
        exchange: 'Takaslı'
      };
      detailParts.push(`Ödeme: ${pMap[criteria.paymentMethod]}`);
    }
    if (criteria.budgetTolerance > 0) detailParts.push(`Esneme: +%${criteria.budgetTolerance}`);
    if (notes.trim()) detailParts.push(`Not: ${notes.trim()}`);

    return {
      autoTitle,
      budgetLabel,
      autoDescription: detailParts.join(' • ')
    };
  }, [criteria, notes]);

  // Live Smart Portfolio Matches
  const liveMatches = useMemo(() => {
    const tempDeal = {
      id: editingDeal?.id || 'preview',
      title: isTitleManuallyEdited && customTitle.trim() ? customTitle : generatedSummary.autoTitle,
      description: generatedSummary.autoDescription,
      budget: generatedSummary.budgetLabel,
      criteria
    };
    return findMatchingPropertiesForLead(tempDeal, portfolioItems, 50);
  }, [criteria, generatedSummary, customTitle, isTitleManuallyEdited, portfolioItems, editingDeal]);

  if (!isOpen) return null;

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
  };

  const handleFinalSave = () => {
    const finalTitle = (isTitleManuallyEdited && customTitle.trim()) ? customTitle.trim() : generatedSummary.autoTitle;
    const finalDescription = generatedSummary.autoDescription || notes.trim() || 'KKTC Emlak Talebi';
    const finalAgent = criteria.internalAgentName || editingDeal?.agent_name || agents[0]?.name || 'Merkez';

    const prevRevisions: LeadRevisionEntry[] = Array.isArray(editingDeal?.revision_history)
      ? editingDeal.revision_history
      : [];

    const newRevisionEntry: LeadRevisionEntry = {
      id: 'rev_' + Date.now(),
      timestamp: new Date().toISOString(),
      actor: finalAgent,
      summary: editingDeal
        ? `Revizyon: ${generatedSummary.budgetLabel} • ${stage}`
        : `İlk Kayıt: ${generatedSummary.budgetLabel} • ${stage}`,
      stage,
      budgetSummary: generatedSummary.budgetLabel
    };

    const payload = {
      ...(editingDeal || {}),
      id: editingDeal?.id || 'd_' + Date.now(),
      title: finalTitle,
      description: finalDescription,
      agent_name: finalAgent,
      budget: generatedSummary.budgetLabel,
      stage,
      sector: 'real_estate',
      store_id: storeId,
      criteria,
      updated_at: new Date().toISOString(),
      created_at: editingDeal?.created_at || new Date().toISOString(),
      revision_history: [newRevisionEntry, ...prevRevisions]
    };

    onSaveDeal(payload);
  };

  const currSymbol =
    criteria.currency === 'GBP'
      ? '£'
      : criteria.currency === 'EUR'
      ? '€'
      : criteria.currency === 'USD'
      ? '$'
      : '₺';

  const activeMainTypeForSpecs: 'residence' | 'commercial' | 'land' =
    criteria.mainType === 'commercial'
      ? 'commercial'
      : criteria.mainType === 'land'
      ? 'land'
      : 'residence';

  const revisionList: LeadRevisionEntry[] = Array.isArray(editingDeal?.revision_history)
    ? editingDeal.revision_history
    : [];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* TOP DARK HEADER (Rule 11 High Contrast) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-black shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">
                  {editingDeal ? 'Talep Revizyon & Kriter Güncelleme' : 'Yeni Müşteri Talebi (Akıllı Huni Sihirbazı)'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-indigo-600 text-white">
                  Adım {step}/6
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {generatedSummary.autoTitle} • {generatedSummary.budgetLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {editingDeal && revisionList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRevisions(prev => !prev)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                title="Talep revizyon tarihçesini göster/gizle"
              >
                <History className="w-3 h-3" />
                <span>Revizyonlar ({revisionList.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* REVISION HISTORY DRAWER (If toggled on existing deal) */}
        {showRevisions && revisionList.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 max-h-28 overflow-y-auto space-y-1 shrink-0">
            <div className="text-[10px] font-black uppercase text-amber-900 flex items-center justify-between">
              <span>Kayıtlı Talep Revizyon Tarihçesi</span>
              <button type="button" onClick={() => setShowRevisions(false)} className="text-amber-700 hover:underline cursor-pointer">Kapat</button>
            </div>
            {revisionList.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between text-[10px] bg-white px-2 py-1 rounded border border-amber-200/80 text-slate-700 font-bold">
                <span className="truncate">{rev.summary} ({rev.actor})</span>
                <span className="font-mono text-[9px] text-slate-500 shrink-0 ml-2">
                  {new Date(rev.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 6-STEP CLICKABLE WIZARD PROGRESS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-2 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          {WIZARD_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{s.short}</span>
              </button>
            );
          })}
        </div>

        {/* WIZARD STEP BODY */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4 text-xs font-bold text-slate-800 custom-scrollbar">
          {/* ==========================================
              ADIM 1: İŞLEM NİYETİ VE KATEGORİ
             ========================================== */}
          {step === 1 && (
            <div className="space-y-4">
              {/* 1. İşlem Türü */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  1. İşlem Türü (Main Intent)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sale', label: 'Satılık', desc: 'Tapu / Mülkiyet Alımı' },
                    { id: 'rent', label: 'Kiralık', desc: 'Aylık / Yıllık Kiralama' },
                    { id: 'investment', label: 'Yatırımlık (Al-Sat)', desc: 'Fırsat / Kira Getirili' },
                    { id: 'any', label: 'Fark Etmez / Tümü', desc: 'Her İkisine Açık' }
                  ].map((item) => {
                    const active = criteria.intent === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          const nextMaxBudget = item.id === 'rent' ? 1200 : 180000;
                          setCriteria(prev => ({
                            ...prev,
                            intent: item.id as any,
                            minBudget: 0,
                            maxBudget: prev.intent !== item.id ? nextMaxBudget : prev.maxBudget
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="font-black text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ana Emlak Tipi */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  2. Ana Emlak Tipi (Sonraki Adımlardaki Metrikleri Otomatik Şekillendirir)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'residence', label: 'Konut / Yaşam', icon: Home, desc: 'Daire, Villa, Penthouse...' },
                    { id: 'commercial', label: 'İş Yeri / Ticari', icon: Building2, desc: 'Dükkan, Ofis, Depo, Otel...' },
                    { id: 'land', label: 'Arsa / Arazi', icon: Compass, desc: 'İmarlı Arsa, Tarla, Proje...' },
                    { id: 'any', label: 'Fark Etmez / Tümü', icon: Sparkles, desc: 'Tüm Kategoriler' }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const active = criteria.mainType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setCriteria(prev => ({
                            ...prev,
                            mainType: cat.id as any,
                            subTypes: [],
                            mustHaves: [],
                            minSqm: cat.id === 'land' ? 300 : 50,
                            maxSqm: cat.id === 'land' ? 2500 : 250
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-indigo-600'}`} />
                          {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="font-black text-xs mt-1">{cat.label}</div>
                        <div className={`text-[10px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Alt Emlak Tipi (Ana Tipe Göre Dinamik Açılır - Çoklu Seçim) */}
              {criteria.mainType !== 'any' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-700 uppercase">
                      3. Alt Emlak Tipi ({criteria.mainType === 'residence' ? 'Konut' : criteria.mainType === 'commercial' ? 'İş Yeri / Ticari' : 'Arsa / Arazi'} Alt Kırılımları - Çoklu Seçim)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({ ...prev, subTypes: [] }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                        criteria.subTypes.length === 0
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ✓ Fark Etmez / Tümü
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {SUBTYPES_BY_MAIN[criteria.mainType].map((sub) => {
                      const selected = criteria.subTypes.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() =>
                            setCriteria(prev => ({
                              ...prev,
                              subTypes: toggleArrayItem(prev.subTypes, sub)
                            }))
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                              : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          <span>{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              ADIM 2: LOKASYON VE KAPSAMA ALANI (KKTC)
             ========================================== */}
          {step === 2 && (
            <div className="space-y-4">
              {/* 1. KKTC İlçe Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    1. KKTC İlçe (City) Seçimi
                  </label>
                  <button
                    type="button"
                    onClick={() => setCriteria(prev => ({ ...prev, cities: [], subRegions: [] }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                      criteria.cities.length === 0
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Fark Etmez / Tüm KKTC
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {Object.keys(REAL_ESTATE_REGIONS).map((city) => {
                    const selected = criteria.cities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() =>
                          setCriteria(prev => ({
                            ...prev,
                            cities: toggleArrayItem(prev.cities, city)
                          }))
                        }
                        className={`py-2 px-2.5 rounded-xl border text-center font-black text-xs transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Alt Bölge / Semt Çoklu Seçim */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase">
                    2. Alt Bölge / Semt (Çoklu Seçim - Multi-Select)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Semt ara (Alsancak, Gönyeli...)"
                      value={subRegionSearch}
                      onChange={(e) => setSubRegionSearch(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 w-44"
                    />
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({ ...prev, subRegions: [] }))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                        criteria.subRegions.length === 0
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Fark Etmez (Tüm Semtler)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                  {availableSubRegions.map((sr) => {
                    const selected = criteria.subRegions.includes(sr);
                    return (
                      <button
                        key={sr}
                        type="button"
                        onClick={() =>
                          setCriteria(prev => ({
                            ...prev,
                            subRegions: toggleArrayItem(prev.subRegions, sr)
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                            : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        <span>{sr}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[10px]">
                  <span className="text-slate-500">
                    {criteria.subRegions.length > 0
                      ? `Seçili Semtler: ${criteria.subRegions.join(', ')}`
                      : 'Belirli semt seçilmedi (Seçili ilçedeki tüm semtler taranır)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllSubRegions(prev => !prev)}
                    className="text-indigo-600 hover:underline font-black cursor-pointer"
                  >
                    {showAllSubRegions ? 'Popüler Semtleri Göster' : 'Tüm Köy & Mahalleleri Göster'}
                  </button>
                </div>
              </div>

              {/* 3. Çevre Toleransı (Fuzzy Match İçin) */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  3. Çevre Toleransı (Fuzzy Match & Mesafe Yarıçapı)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'strict', label: 'Sadece Seçili Bölgeler', desc: 'Tam semt uyumu aranır' },
                    { id: 'nearby_10km', label: 'Yakın Çevre Olabilir (± 10 km)', desc: 'Komşu semtler puan alır (Önerilen)' },
                    { id: 'district_wide', label: 'İlçe Geneli Olabilir', desc: 'Tüm ilçe alternatifleri dahil edilir' }
                  ].map((tol) => {
                    const active = criteria.locationTolerance === tol.id;
                    return (
                      <button
                        key={tol.id}
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, locationTolerance: tol.id as any }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="font-black text-xs flex items-center justify-between">
                          <span>{tol.label}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {tol.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ADIM 3: FİNANSAL ÇERÇEVE VE ÖDEME
             ========================================== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* 1. Para Birimi Seçimi */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    1. Para Birimi (KKTC Döviz Bazlı)
                  </label>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                    {[
                      { id: 'GBP', label: 'GBP (£)' },
                      { id: 'EUR', label: 'EUR (€)' },
                      { id: 'USD', label: 'USD ($)' },
                      { id: 'TRY', label: 'TRY (₺)' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, currency: c.id as any }))}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          criteria.currency === c.id
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hızlı Bütçe Sıfırlama / Fark Etmez */}
                <button
                  type="button"
                  onClick={() => setCriteria(prev => ({ ...prev, minBudget: 0, maxBudget: 0 }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                    criteria.maxBudget === 0
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Bütçe Fark Etmez / Açık Uçlu
                </button>
              </div>

              {/* 2. Çift Başlıklı Range Slider (Dual-Thumb Range Slider) + Binlik Ayraçlı Kutular */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    2. Bütçe Aralığı (Dokunmatik Kaydırıcı & Binlik Ayraçlı Giriş)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-black">
                    {criteria.maxBudget > 0
                      ? `${currSymbol}${formatNum(criteria.minBudget)} — ${currSymbol}${formatNum(criteria.maxBudget)}`
                      : 'Esnek / Sınırsız Bütçe'}
                  </span>
                </div>

                {/* Dual Sliders for Mobile / Field Ergonomics */}
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Minimum Bütçe Kaydırıcı: <strong>{currSymbol}{formatNum(criteria.minBudget)}</strong></span>
                      <span>Maks: {currSymbol}{formatNum(budgetBounds.max)}</span>
                    </div>
                    <input
                      type="range"
                      min={budgetBounds.min}
                      max={budgetBounds.max}
                      step={budgetBounds.step}
                      value={Math.min(criteria.minBudget, budgetBounds.max)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriteria(prev => ({
                          ...prev,
                          minBudget: val,
                          maxBudget: prev.maxBudget > 0 && val > prev.maxBudget ? val : prev.maxBudget
                        }));
                      }}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Maksimum Bütçe Kaydırıcı: <strong className="text-indigo-700">{currSymbol}{formatNum(criteria.maxBudget)}</strong></span>
                      <span>Adım: {currSymbol}{formatNum(budgetBounds.step)}</span>
                    </div>
                    <input
                      type="range"
                      min={budgetBounds.min}
                      max={budgetBounds.max}
                      step={budgetBounds.step}
                      value={Math.min(criteria.maxBudget, budgetBounds.max)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriteria(prev => ({
                          ...prev,
                          maxBudget: val,
                          minBudget: val > 0 && prev.minBudget > val ? val : prev.minBudget
                        }));
                      }}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Formatted Direct Input Boxes */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Minimum Bütçe ({currSymbol})</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={criteria.minBudget ? formatNum(criteria.minBudget) : ''}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        setCriteria(prev => ({ ...prev, minBudget: raw }));
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Maksimum Bütçe ({currSymbol})</label>
                    <input
                      type="text"
                      placeholder="Örn: 150.000"
                      value={criteria.maxBudget ? formatNum(criteria.maxBudget) : ''}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        setCriteria(prev => ({ ...prev, maxBudget: raw }));
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black text-indigo-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Ödeme / Kredi Durumu & 4. Bütçe Esneme Payı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    3. Ödeme / Kredi Durumu
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'any', label: 'Fark Etmez / Tümü' },
                      { id: 'cash', label: 'Peşin (Nakit Hazır)' },
                      { id: 'bank_credit', label: 'Banka Kredisine Uygun' },
                      { id: 'developer_installment', label: 'Şirket İçi Taksit (Geliştirici Projesi)' },
                      { id: 'exchange', label: 'Takas Teklifli (Araç / Emlak Takası)' }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, paymentMethod: pm.id as any }))}
                        className={`w-full px-3 py-1.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                          criteria.paymentMethod === pm.id
                            ? 'bg-slate-900 text-white border-slate-900 font-black'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{pm.label}</span>
                        {criteria.paymentMethod === pm.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                      4. Bütçe Esneme Payı (Tolerans)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: 0, label: 'Kesin Bütçe (%0)' },
                        { val: 5, label: '%5 Esneyebilir' },
                        { val: 10, label: '%10 Esneyebilir' },
                        { val: 15, label: '%15 Fırsat Payı' }
                      ].map((tol) => (
                        <button
                          key={tol.val}
                          type="button"
                          onClick={() => setCriteria(prev => ({ ...prev, budgetTolerance: tol.val as any }))}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-black cursor-pointer ${
                            criteria.budgetTolerance === tol.val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {tol.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      5. Trafo & KDV Tercihi (KKTC Özel)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'any', label: 'Fark Etmez' },
                        { id: 'paid_only', label: 'Trafo/KDV Ödenmiş' }
                      ].map((tk) => (
                        <button
                          key={tk.id}
                          type="button"
                          onClick={() => setCriteria(prev => ({ ...prev, trafoKdvPreference: tk.id as any }))}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            criteria.trafoKdvPreference === tk.id
                              ? 'bg-slate-900 text-white border-slate-900 font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {tk.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ADIM 4: FİZİKSEL METRİKLER (ANA TİPE GÖRE DİNAMİK)
             ========================================== */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Ortak m² Range Slider */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-600">
                    1. Metrekare (m²) Aralığı {activeMainTypeForSpecs === 'land' ? '(1 KKTC Dönümü = 1.338 m²)' : ''}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-black">
                    {criteria.minSqm} m² — {criteria.maxSqm} m²
                    {activeMainTypeForSpecs === 'land' && criteria.maxSqm > 0
                      ? ` (~${(criteria.maxSqm / 1338).toFixed(1)} Dönüm)`
                      : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Min m²: <strong>{criteria.minSqm} m²</strong></span>
                    </div>
                    <input
                      type="range"
                      min={sqmBounds.min}
                      max={sqmBounds.max}
                      step={sqmBounds.step}
                      value={Math.min(criteria.minSqm, sqmBounds.max)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriteria(prev => ({
                          ...prev,
                          minSqm: val,
                          maxSqm: val > prev.maxSqm ? val : prev.maxSqm
                        }));
                      }}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>Max m²: <strong className="text-indigo-700">{criteria.maxSqm} m²</strong></span>
                    </div>
                    <input
                      type="range"
                      min={sqmBounds.min}
                      max={sqmBounds.max}
                      step={sqmBounds.step}
                      value={Math.min(criteria.maxSqm, sqmBounds.max)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCriteria(prev => ({
                          ...prev,
                          maxSqm: val,
                          minSqm: prev.minSqm > val ? val : prev.minSqm
                        }));
                      }}
                      className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* KONUT İSE: ODA SAYISI, BİNA YAŞI, KAT TERCİHİ, MAKS BİNA KATI */}
              {activeMainTypeForSpecs === 'residence' && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        2. Oda Sayısı (Çoklu Seçim)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, roomCounts: [] }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                          criteria.roomCounts.length === 0
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Fark Etmez / Tümü
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {['Studio (1+0)', '1+1', '2+1', '3+1', '4+1 ve üzeri'].map((rm) => {
                        const selected = criteria.roomCounts.includes(rm);
                        return (
                          <button
                            key={rm}
                            type="button"
                            onClick={() =>
                              setCriteria(prev => ({
                                ...prev,
                                roomCounts: toggleArrayItem(prev.roomCounts, rm)
                              }))
                            }
                            className={`py-2 px-2 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                              selected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {rm}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Bina Yaşı */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        3. Bina Yaşı Tercihi
                      </label>
                      <select
                        value={criteria.buildingAge}
                        onChange={(e) => setCriteria(prev => ({ ...prev, buildingAge: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="any">Fark Etmez</option>
                        <option value="0">Sıfır / Projeden</option>
                        <option value="1-5">1 - 5 Yaş</option>
                        <option value="5-10">5 - 10 Yaş</option>
                        <option value="10+">10+ Yaş</option>
                      </select>
                    </div>

                    {/* Kat Tercihi */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        4. Kat Tercihi
                      </label>
                      <select
                        value={criteria.floorPreference}
                        onChange={(e) => setCriteria(prev => ({ ...prev, floorPreference: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="any">Fark Etmez</option>
                        <option value="ground_garden">Zemin / Bahçe Katı</option>
                        <option value="middle">Ara Kat</option>
                        <option value="top_penthouse">En Üst Kat / Penthouse</option>
                        <option value="detached">Müstakil / Dubleks</option>
                      </select>
                    </div>

                    {/* Maksimum Bina Katı */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        5. Bina Kat Sayısı (Mimari)
                      </label>
                      <select
                        value={criteria.maxTotalFloors}
                        onChange={(e) => setCriteria(prev => ({ ...prev, maxTotalFloors: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="any">Fark Etmez</option>
                        <option value="2-3">Yatay Mimari (Maks 3 Kat)</option>
                        <option value="4-6">Orta Katlı (4-6 Kat)</option>
                        <option value="7+">Yüksek Katlı / Rezidans (7+)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* İŞ YERİ / TİCARİ İSE: DEVİR/KİRACI VE KONUM KRİTERİ */}
              {activeMainTypeForSpecs === 'commercial' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">
                      2. Kullanım / Devir & Kiracı Durumu
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'any', label: 'Fark Etmez / Tümü' },
                        { id: 'empty', label: 'Boş / Hemen Kullanıma Hazır' },
                        { id: 'tenant', label: 'Hazır Kurumsal Kiracılı (Kira Getirili)' },
                        { id: 'devren', label: 'Devren Kiralık / Satılık İşletme' }
                      ].map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setCriteria(prev => ({ ...prev, commercialUsage: u.id as any }))}
                          className={`w-full px-3 py-2 rounded-xl border text-left text-xs font-black flex items-center justify-between cursor-pointer ${
                            criteria.commercialUsage === u.id
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{u.label}</span>
                          {criteria.commercialUsage === u.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">
                      3. Ticari Konum & Vitrin Kriteri
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'any', label: 'Fark Etmez / Tümü' },
                        { id: 'main_road', label: 'Ana Cadde / Bulvar Üzeri' },
                        { id: 'corner', label: 'Köşe Başı / Yüksek Vitrin' },
                        { id: 'industrial', label: 'Sanayi / Depo & Lojistik Bölgesi' },
                        { id: 'plaza', label: 'Plaza / İş Merkezi İçi' }
                      ].map((cl) => (
                        <button
                          key={cl.id}
                          type="button"
                          onClick={() => setCriteria(prev => ({ ...prev, commercialLocationType: cl.id as any }))}
                          className={`w-full px-3 py-2 rounded-xl border text-left text-xs font-black flex items-center justify-between cursor-pointer ${
                            criteria.commercialLocationType === cl.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{cl.label}</span>
                          {criteria.commercialLocationType === cl.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ARSA / ARAZİ İSE: İMAR DURUMU, KAKS/EMSAL, GABARİ */}
              {activeMainTypeForSpecs === 'land' && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase">
                        2. Arsa İmar Durumu (Zoning - Çoklu Seçim)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, landZoning: [] }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                          (criteria.landZoning || []).length === 0
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        Fark Etmez / Tümü
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Konut İmarlı', 'Ticari İmarlı', 'Turizm İmarlı', 'Sanayi İmarlı', 'Tarla / Tarım', 'Zeytinlik'].map((z) => {
                        const selected = (criteria.landZoning || []).includes(z);
                        return (
                          <button
                            key={z}
                            type="button"
                            onClick={() =>
                              setCriteria(prev => ({
                                ...prev,
                                landZoning: toggleArrayItem(prev.landZoning || [], z)
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl border text-xs font-black cursor-pointer ${
                              selected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {z}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        3. İmar Oranı (KAKS / Emsal)
                      </label>
                      <select
                        value={criteria.landKaks || 'any'}
                        onChange={(e) => setCriteria(prev => ({ ...prev, landKaks: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="any">Fark Etmez</option>
                        <option value="20-35">%20 - %35 (Villa İmarlı)</option>
                        <option value="50-90">%50 - %90 (Apartman İmarlı)</option>
                        <option value="100+">%100 ve Üzeri (Yüksek Yoğunluk)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        4. Gabari / Kat İzni
                      </label>
                      <select
                        value={criteria.landGabari || 'any'}
                        onChange={(e) => setCriteria(prev => ({ ...prev, landGabari: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="any">Fark Etmez</option>
                        <option value="2_floors">Maks 2 Kat (Villa Bölgesi)</option>
                        <option value="3_4_floors">3 - 4 Kat İmarlı</option>
                        <option value="5_plus_floors">5+ Kat Çok Katlı İmarlı</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              ADIM 5: KKTC HUKUKİ DURUMU VE DONANIM
             ========================================== */}
          {step === 5 && (
            <div className="space-y-4">
              {/* 1. Koçan (Tapu) Tipi Tercihi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    1. KKTC Koçan (Tapu) Tipi Tercihi (Çoklu Seçim)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCriteria(prev => ({ ...prev, kocanTypes: [] }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                      criteria.kocanTypes.length === 0
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    Fark Etmez / Tümü
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Türk Koçanı', 'Eşdeğer Koçan', 'Tahsis Koçan'].map((kt) => {
                    const selected = criteria.kocanTypes.includes(kt);
                    return (
                      <button
                        key={kt}
                        type="button"
                        onClick={() =>
                          setCriteria(prev => ({
                            ...prev,
                            kocanTypes: toggleArrayItem(prev.kocanTypes, kt)
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-left font-black text-xs cursor-pointer flex items-center justify-between ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{kt}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCriteria(prev => ({ ...prev, kocanTypes: [] }))}
                    className={`p-2.5 rounded-xl border text-left font-black text-xs cursor-pointer flex items-center justify-between ${
                      criteria.kocanTypes.length === 0
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span>Fark Etmez</span>
                    {criteria.kocanTypes.length === 0 && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 2. Eşya Durumu (Sadece Konut ve İş Yeri için DOM'da görünür; Arsa ise gizlenir!) */}
              {activeMainTypeForSpecs !== 'land' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    2. Eşya Durumu Tercihi
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'any', label: 'Fark Etmez' },
                      { id: 'full', label: 'Tam Eşyalı' },
                      { id: 'partial', label: 'Kısmi / Beyaz Eşyalı' },
                      { id: 'unfurnished', label: 'Eşyasız (Boş)' }
                    ].map((f) => {
                      const active = criteria.furnishedPreference === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setCriteria(prev => ({ ...prev, furnishedPreference: f.id as any }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-black cursor-pointer flex items-center justify-between ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{f.label}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Olmazsa Olmaz Özellikler (Must-Haves - Checkbox) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-700 uppercase">
                    3. Olmazsa Olmaz Özellikler (Must-Haves)
                  </label>
                  {criteria.mustHaves.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({ ...prev, mustHaves: [] }))}
                      className="text-[10px] text-rose-600 font-black hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MUST_HAVES_BY_MAIN[activeMainTypeForSpecs].map((mh) => {
                    const checked = criteria.mustHaves.includes(mh.id);
                    return (
                      <label
                        key={mh.id}
                        onClick={() =>
                          setCriteria(prev => ({
                            ...prev,
                            mustHaves: toggleArrayItem(prev.mustHaves, mh.id)
                          }))
                        }
                        className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer select-none transition-all ${
                          checked
                            ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                            : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            checked ? 'bg-white text-indigo-600 border-white' : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{mh.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ADIM 6: MÜŞTERİ PROFİLİ, ACİLİYET & PAYDAŞ
             ========================================== */}
          {step === 6 && (
            <div className="space-y-3.5">
              {/* Quick Select from Registered Investor Contacts (Mülk Sahibi & Yatırımcı CRM Bridge) */}
              {crmContacts.length > 0 && (
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-emerald-950 uppercase block">
                      Yatırımcı Rehberinden Hızlı Seç (Mülk Sahibi & Yatırımcı CRM Bağlantısı)
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Kayıtlı yatırımcıyı seçtiğinizde ad soyad ve telefon otomatik doldurulur.
                    </span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      const found = crmContacts.find(c => String(c.id) === e.target.value);
                      if (found) {
                        setCriteria(prev => ({
                          ...prev,
                          customerName: found.name || prev.customerName,
                          customerPhone: found.phone || prev.customerPhone
                        }));
                        if (found.notes && !notes) {
                          setNotes(found.notes);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900 outline-none cursor-pointer sm:w-64"
                  >
                    <option value="">-- Rehberden Yatırımcı / Kişi Seçin --</option>
                    {crmContacts.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.type === 'owner' ? 'Mülk Sahibi' : 'Yatırımcı'}) {c.phone ? `· ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Müşteri Adı, Telefonu ve Otomatik/Özel Talep Başlığı */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Müşteri Adı Soyadı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ahmet Demir"
                    value={criteria.customerName}
                    onChange={(e) => setCriteria(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Müşteri Telefonu (WhatsApp)
                  </label>
                  <input
                    type="text"
                    placeholder="+90 533 ..."
                    value={criteria.customerPhone}
                    onChange={(e) => setCriteria(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Süreç Aşaması (Pipeline Statüsü)
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aciliyet & Müşteri İkamet Durumu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Taşınma / Satın Alma Aciliyeti
                  </label>
                  <div className="space-y-1">
                    {[
                      { id: 'immediate', label: 'Hemen (1 - 2 Hafta İçinde)' },
                      { id: '1_3_months', label: '1 - 3 Ay İçinde' },
                      { id: 'investment_no_rush', label: 'Sadece Yatırım (Acelesi Yok, Fırsat Arıyor)' },
                      { id: 'any', label: 'Fark Etmez / Belirsiz' }
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, urgency: u.id as any }))}
                        className={`w-full px-3 py-1.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                          criteria.urgency === u.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{u.label}</span>
                        {criteria.urgency === u.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                    Müşteri Konum / Sunum Durumu
                  </label>
                  <div className="space-y-1">
                    {[
                      { id: 'cyprus_resident', label: 'Kıbrıs’ta İkamet Ediyor (Yerinde Gezi)' },
                      { id: 'abroad_online_tour', label: 'Yurt Dışında (Online Sunum / Video Gezi İstiyor)' },
                      { id: 'corporate', label: 'Kurumsal Firma / Yatırım Fonu' }
                    ].map((cs) => (
                      <button
                        key={cs.id}
                        type="button"
                        onClick={() => setCriteria(prev => ({ ...prev, clientLocationStatus: cs.id as any }))}
                        className={`w-full px-3 py-1.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between cursor-pointer ${
                          criteria.clientLocationStatus === cs.id
                            ? 'bg-slate-900 text-white border-slate-900 font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{cs.label}</span>
                        {criteria.clientLocationStatus === cs.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Talebi Getiren Paydaş (İç Danışman & Opsiyonel Dış Paydaş) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                    <Handshake className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Talebi Getiren / Sorumlu Paydaş (Komisyon & Atama)</span>
                  </label>
                  <div className="inline-flex p-0.5 bg-white rounded-lg border border-slate-200 text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({ ...prev, sourceType: 'internal_agent' }))}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        criteria.sourceType === 'internal_agent' ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      İç Danışman
                    </button>
                    <button
                      type="button"
                      onClick={() => setCriteria(prev => ({ ...prev, sourceType: 'external_partner' }))}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        criteria.sourceType === 'external_partner' ? 'bg-amber-500 text-slate-950' : 'text-slate-600'
                      }`}
                    >
                      + Dış Paydaş / Referans
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sorumlu Ofis Danışmanı</label>
                    <select
                      value={criteria.internalAgentName}
                      onChange={(e) => setCriteria(prev => ({ ...prev, internalAgentName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Merkez Ofis</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  {criteria.sourceType === 'external_partner' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Dış Paydaş Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Av. Mehmet Kaya"
                          value={criteria.externalPartnerName || ''}
                          onChange={(e) => setCriteria(prev => ({ ...prev, externalPartnerName: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Paydaş Tel</label>
                          <input
                            type="text"
                            placeholder="+90 533..."
                            value={criteria.externalPartnerPhone || ''}
                            onChange={(e) => setCriteria(prev => ({ ...prev, externalPartnerPhone: e.target.value }))}
                            className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Payı (%)</label>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={criteria.externalPartnerShare || 25}
                            onChange={(e) => setCriteria(prev => ({ ...prev, externalPartnerShare: Number(e.target.value) }))}
                            className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-black text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Talep Başlığı (Otomatik veya Manuel) & Özel Not */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-0.5">
                    Talep Kayıt Başlığı (Otomatik Üretilir)
                  </label>
                  <input
                    type="text"
                    value={isTitleManuallyEdited ? customTitle : generatedSummary.autoTitle}
                    onChange={(e) => {
                      setIsTitleManuallyEdited(true);
                      setCustomTitle(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-0.5">
                    Ek Özel Not / Revizyon Açıklaması
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Müşteri özellikle sessiz sokak ve güney cephe istiyor..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              CANLI AKILLI PORTFÖY EŞLEŞME ÖNİZLEMESİ (HER ADIMDA ANLIK GÜNCELLENİR)
             ========================================== */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-950 font-black text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Canlı Akıllı Portföy Eşleşmesi: {liveMatches.length} Uygun Portföy</span>
              </div>
              {liveMatches.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-black">
                  En Yüksek Uyum: %{liveMatches[0].score}
                </span>
              )}
            </div>

            {liveMatches.length === 0 ? (
              <p className="text-[10px] text-slate-500 font-semibold">
                Seçilen daraltılmış kriterlere (%50+ uyum) şu an portföyde tam uyan ilan yok. Yeni mülk eklendiğinde sistem otomatik eşleştirecektir.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                {liveMatches.slice(0, 4).map((m, idx) => {
                  const prop = portfolioItems.find(p => p.id === m.propertyId);
                  return (
                    <div
                      key={idx}
                      className="p-1.5 bg-white rounded-lg border border-indigo-100 flex items-center justify-between gap-2 text-[10px]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 truncate">{m.propertyTitle}</p>
                        <p className="text-slate-500 font-mono truncate">
                          {m.propertyRef || 'REF'} • {m.propertyPrice?.toLocaleString('tr-TR')} {m.propertyCurrency}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black">
                          %{m.score}
                        </span>
                        {onSelectMatchedProperty && prop && (
                          <button
                            type="button"
                            onClick={() => onSelectMatchedProperty(prop, criteria.customerName || generatedSummary.autoTitle)}
                            className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer"
                            title="Bu portföye hemen yer gösterme planla"
                          >
                            Gezi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER NAVIGATION & INSTANT SAVE / REVISION BAR */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold cursor-pointer"
            >
              İptal
            </button>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Önceki Adım</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Hızlı Kaydet / Revizyon Kaydet (Her adımda aktif!) */}
            {(editingDeal || step === 6) && (
              <button
                type="button"
                onClick={handleFinalSave}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingDeal ? 'Talep Revizyonunu Kaydet' : 'Talebi Kaydet'}</span>
              </button>
            )}

            {step < 6 && (
              <button
                type="button"
                onClick={() => setStep(prev => Math.min(6, prev + 1))}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>Sonraki Adım ({step + 1}/6)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

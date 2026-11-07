import React, { useState, useDeferredValue, useMemo } from "react";
import { Search, UserPlus, Users, Trash2, Edit2, Phone, Mail, X, Plus, Info, CheckCircle2, PhoneCall, Building, LayoutList, LayoutGrid, Home, Car, Key, Globe, Check, Briefcase, Clock, XCircle, Sparkles, Filter, MapPin, Tag } from "lucide-react";
import { RealEstateContact } from "../../types";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatDateTimeTR } from "../../utils/formatUtils";
import { LeadFunnelWizardModal } from "../../components/realestate/LeadFunnelWizardModal";
import { toast } from "sonner";

const normalizeTr = (str: string): string =>
  (str || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ş/g, "ş")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase();

export type ContactIntentType = 'satilik' | 'kiralik' | 'kat_karsiligi';
export type ContactPropertyType = 'daire' | 'villa' | 'arsa' | 'ticari' | 'proje';

export interface ContactSubMeta {
  intents: ContactIntentType[];
  propertyTypes: ContactPropertyType[];
  regions: string[];
  linkedPropertiesCount: number;
}

export const INTENT_LABELS: Record<ContactIntentType, string> = {
  satilik: 'Satılık',
  kiralik: 'Kiralık',
  kat_karsiligi: 'Kat Karşılığı',
};

export const PROPERTY_TYPE_LABELS: Record<ContactPropertyType, string> = {
  daire: 'Daire / Konut',
  villa: 'Villa / Müstakil',
  arsa: 'Arsa / Arazi',
  ticari: 'Ticari / İşyeri',
  proje: 'Bina / Proje',
};

export const KKTC_REGIONS = ['Girne', 'Lefkoşa', 'İskele', 'Gazimağusa', 'Güzelyurt', 'Lefke'];

export const extractContactSubMeta = (contact: RealEstateContact, properties: any[] = []): ContactSubMeta => {
  const intents = new Set<ContactIntentType>();
  const propertyTypes = new Set<ContactPropertyType>();
  const regions = new Set<string>();

  const normPhone = (contact.phone || "").replace(/\D/g, "").slice(-10);
  const normName = normalizeTr(contact.name || "").trim();

  // 1. Cross-reference with store properties (owner_contact_id, owner_phone, owner_name)
  const linkedProps = (properties || []).filter((p) => {
    if (!p) return false;
    if (contact.id && String(p.owner_contact_id) === String(contact.id)) return true;
    const pPhone = String(p.owner_phone || p.contact_phone || "").replace(/\D/g, "").slice(-10);
    if (normPhone.length >= 7 && pPhone && pPhone === normPhone) return true;
    const pOwnerName = normalizeTr(p.owner_name || "").trim();
    if (normName.length >= 4 && pOwnerName && pOwnerName === normName) return true;
    return false;
  });

  const analyzeText = (raw: string) => {
    const t = normalizeTr(raw);
    if (!t) return;

    // Intents
    if (/\b(satılık|satilik|satis|satış|for sale|yatırımlık|yatirimlik)\b/i.test(t)) intents.add('satilik');
    if (/\b(kiralık|kiralik|kira|for rent|rent)\b/i.test(t)) intents.add('kiralik');
    if (/\b(kat karşılığı|kat karsiligi|ortak proje)\b/i.test(t)) intents.add('kat_karsiligi');

    // Property Types
    if (/\b(villa|müstakil|mustakil|ikiz villa|bungalow|köşk|yalı)\b/i.test(t)) propertyTypes.add('villa');
    if (/\b(daire|rezidans|residence|penthouse|stüdyo|studyo|loft|apartman|1\+0|1\+1|2\+1|3\+1|4\+1)\b/i.test(t)) propertyTypes.add('daire');
    if (/\b(arsa|tarla|arazi|parsel|zeytinlik|imarlı|imarli)\b/i.test(t)) propertyTypes.add('arsa');
    if (/\b(ticari|dükkan|dukkan|mağaza|magaza|ofis|büro|depo|fabrika|atölye|otel|restoran)\b/i.test(t)) propertyTypes.add('ticari');
    if (/\b(bina|komple|proje|site|apart)\b/i.test(t)) propertyTypes.add('proje');

    // Regions
    if (/\b(girne|kyrenia|alsancak|lapta|çatalköy|catalkoy|ozanköy|ozankoy|bellapais|esentepe|karşıyaka|karsiyaka|karaoğlanoğlu|zeytinlik|doğanköy)\b/i.test(t)) regions.add('Girne');
    if (/\b(lefkoşa|lefkosa|nicosia|gönyeli|gonyeli|küçük kaymaklı|kucuk kaymakli|орtaköy|ortakoy|yenikent|hamitköy|dereboyu|kermiya|taşkınköy)\b/i.test(t)) regions.add('Lefkoşa');
    if (/\b(iskele|trikomo|long beach|boğaz|bogaz|bafra|yeni boğaziçi|ötüken)\b/i.test(t)) regions.add('İskele');
    if (/\b(gazimağusa|gazimagusa|mağusa|magusa|famagusta|tuzla|salamis|sakarya|maraş|maras|mutluyaka)\b/i.test(t)) regions.add('Gazimağusa');
    if (/\b(güzelyurt|guzelyurt|morphou|kalkanlı|kalkanli|zümrütköy)\b/i.test(t)) regions.add('Güzelyurt');
    if (/\b(lefke|gemikonağı|gemikonagi|yedidalga|gaziveren)\b/i.test(t)) regions.add('Lefke');
  };

  analyzeText(`${contact.notes || ""} ${contact.address || ""}`);

  for (const p of linkedProps) {
    const pText = `${p.title || ""} ${p.listing_type || ""} ${p.property_type || ""} ${p.category || ""} ${p.sub_category || ""} ${p.kktc_region || ""} ${p.location || ""}`;
    analyzeText(pText);
  }

  return {
    intents: Array.from(intents),
    propertyTypes: Array.from(propertyTypes),
    regions: Array.from(regions),
    linkedPropertiesCount: linkedProps.length,
  };
};

export type LeadStage = 'new' | 'contacted' | 'converted' | 'reviewed' | 'cancelled' | 'none';

export const getLeadStage = (notes?: string): LeadStage => {
  if (!notes) return 'none';
  if (notes.includes('[MÜLK SAHİBİ BAŞVURUSU]') || notes.includes('[ARAÇ SAHİBİ BAŞVURUSU]')) return 'new';
  if (notes.includes('[MÜLK SAHİBİ - İLETİŞİME GEÇİLDİ]') || notes.includes('[ARAÇ SAHİBİ - İLETİŞİME GEÇİLDİ]')) return 'contacted';
  if (notes.includes('[MÜLK SAHİBİ - PORTFÖYE ALINDI]') || notes.includes('[ARAÇ SAHİBİ - PORTFÖYE ALINDI]')) return 'converted';
  if (notes.includes('[MÜLK SAHİBİ - İNCELENDİ]') || notes.includes('[ARAÇ SAHİBİ - İNCELENDİ]')) return 'reviewed';
  if (notes.includes('[MÜLK SAHİBİ - İPTAL]') || notes.includes('[ARAÇ SAHİBİ - İPTAL]')) return 'cancelled';
  if (notes.includes('[MÜLK SAHİBİ') || notes.includes('[ARAÇ SAHİBİ')) return 'reviewed';
  return 'none';
};

export const updateLeadStageInNotes = (existingNotes: string = "", newStage: LeadStage, isAutomotive: boolean = false): string => {
  let cleanNotes = existingNotes
    .replace('[MÜLK SAHİBİ BAŞVURUSU]', '')
    .replace('[MÜLK SAHİBİ - İLETİŞİME GEÇİLDİ]', '')
    .replace('[MÜLK SAHİBİ - PORTFÖYE ALINDI]', '')
    .replace('[MÜLK SAHİBİ - İNCELENDİ]', '')
    .replace('[MÜLK SAHİBİ - İPTAL]', '')
    .replace('[ARAÇ SAHİBİ BAŞVURUSU]', '')
    .replace('[ARAÇ SAHİBİ - İLETİŞİME GEÇİLDİ]', '')
    .replace('[ARAÇ SAHİBİ - PORTFÖYE ALINDI]', '')
    .replace('[ARAÇ SAHİBİ - İNCELENDİ]', '')
    .replace('[ARAÇ SAHİBİ - İPTAL]', '')
    .trim();

  const prefix = isAutomotive ? 'ARAÇ SAHİBİ' : 'MÜLK SAHİBİ';

  switch (newStage) {
    case 'new':
      return `[${prefix} BAŞVURUSU] ${cleanNotes}`.trim();
    case 'contacted':
      return `[${prefix} - İLETİŞİME GEÇİLDİ] ${cleanNotes}`.trim();
    case 'converted':
      return `[${prefix} - PORTFÖYE ALINDI] ${cleanNotes}`.trim();
    case 'reviewed':
      return `[${prefix} - İNCELENDİ] ${cleanNotes}`.trim();
    case 'cancelled':
      return `[${prefix} - İPTAL] ${cleanNotes}`.trim();
    default:
      return cleanNotes;
  }
};

interface RealEstateCrmTabProps {
  contacts: RealEstateContact[];
  onSaveContact: (contact: Partial<RealEstateContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  isAutomotive?: boolean;
  initialFilter?: 'all' | 'new' | 'owner' | 'investor';
  storeId?: number;
  properties?: any[];
  onNavigateToPipeline?: () => void;
}

const RE_PIPELINE_STAGES = [
  'Yeni Talep / Aday',
  'Görüşme / Analiz',
  'Yer Gösterme / Sunum',
  'Teklif / Sözleşme',
  'Kazanıldı'
];

const RealEstateCrmTab = ({
  contacts,
  onSaveContact,
  onDeleteContact,
  isAutomotive = false,
  initialFilter = 'all',
  storeId,
  properties = [],
  onNavigateToPipeline
}: RealEstateCrmTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const isTr = lang === 'tr';

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [quickFilter, setQuickFilter] = useState<'all' | 'new' | 'owner' | 'investor'>(initialFilter);
  const [intentFilter, setIntentFilter] = useState<'all' | ContactIntentType>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<'all' | ContactPropertyType>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  React.useEffect(() => {
    if (initialFilter) setQuickFilter(initialFilter);
  }, [initialFilter]);

  const contactMetaMap = useMemo(() => {
    const map = new Map<string, ContactSubMeta>();
    for (const c of contacts) {
      const key = String(c.id || `${c.name}_${c.phone}`);
      map.set(key, extractContactSubMeta(c, properties));
    }
    return map;
  }, [contacts, properties]);

  const getContactMeta = (c: RealEstateContact): ContactSubMeta => {
    const key = String(c.id || `${c.name}_${c.phone}`);
    return contactMetaMap.get(key) || { intents: [], propertyTypes: [], regions: [], linkedPropertiesCount: 0 };
  };

  const toggleTagInNotes = (tagLabel: string) => {
    const current = formData.notes || "";
    const tagToken = `[${tagLabel}]`;
    if (current.includes(tagToken)) {
      setFormData({ ...formData, notes: current.replace(tagToken, "").replace(/\s{2,}/g, " ").trim() });
    } else {
      setFormData({ ...formData, notes: `${tagToken} ${current}`.trim() });
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<RealEstateContact> | null>(null);
  const [funnelTargetContact, setFunnelTargetContact] = useState<RealEstateContact | null>(null);
  const [formData, setFormData] = useState<Partial<RealEstateContact>>({
    name: "",
    phone: "",
    email: "",
    type: "owner",
    notes: ""
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveFunnelLeadFromContact = (dealPayload: any) => {
    const storageKey = `restatelp_crm_deals_${storeId || 'default'}`;
    try {
      const existingRaw = localStorage.getItem(storageKey);
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      const nextList = Array.isArray(existingList) ? [dealPayload, ...existingList] : [dealPayload];
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (e) {
      console.error(e);
    }
    setFunnelTargetContact(null);
    toast.success(`${dealPayload.criteria?.customerName || 'Yatırımcı'} için 6 Adımlı Akıllı Talep Hunisi oluşturuldu!`);
    if (onNavigateToPipeline) {
      onNavigateToPipeline();
    }
  };

  const standardizeOwnerPhone = (phone: string) => {
    if (!phone) return phone;
    let cleaned = phone.trim();
    if (cleaned.startsWith('05') && cleaned.replace(/\s/g, '').length === 11) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
    } else if (cleaned.startsWith('5') && cleaned.replace(/\s/g, '').length === 10) {
      const rawDigits = cleaned.replace(/\s/g, '');
      cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith('00')) {
      const rawDigits = cleaned.replace(/\D/g, '');
      if (rawDigits.length === 10) {
        cleaned = `+90 ${rawDigits.substring(0, 3)} ${rawDigits.substring(3, 6)} ${rawDigits.substring(6)}`;
      } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
        cleaned = `+90 ${rawDigits.substring(1, 4)} ${rawDigits.substring(4, 7)} ${rawDigits.substring(7)}`;
      }
    }
    return cleaned;
  };

  const newLeadsCount = contacts.filter(c => getLeadStage(c.notes) === 'new').length;
  const ownersCount = contacts.filter(c => c.type === 'owner').length;
  const investorsCount = contacts.filter(c => c.type !== 'owner').length;

  const filteredContacts = contacts.filter(c => {
    const s = normalizeTr(deferredSearch);
    const meta = getContactMeta(c);
    const matchesSearch = !s || (
      normalizeTr(c.name || "").includes(s) || 
      (c.phone || "").includes(s) || 
      normalizeTr(c.email || "").includes(s) ||
      normalizeTr(c.notes || "").includes(s) ||
      meta.regions.some(r => normalizeTr(r).includes(s))
    );
    if (!matchesSearch) return false;
    if (quickFilter === 'new' && getLeadStage(c.notes) !== 'new') return false;
    if (quickFilter === 'owner' && c.type !== 'owner') return false;
    if (quickFilter === 'investor' && c.type === 'owner') return false;

    if (!isAutomotive) {
      if (intentFilter !== 'all' && !meta.intents.includes(intentFilter)) return false;
      if (propertyTypeFilter !== 'all' && !meta.propertyTypes.includes(propertyTypeFilter)) return false;
      if (regionFilter !== 'all' && !meta.regions.includes(regionFilter)) return false;
    }
    return true;
  });

  const handleQuickStatusChange = async (contact: RealEstateContact, newStage: LeadStage) => {
    const updatedNotes = updateLeadStageInNotes(contact.notes, newStage, isAutomotive);
    try {
      await onSaveContact({
        ...contact,
        notes: updatedNotes
      });
    } catch (err: any) {
      console.error("Failed to update status", err);
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      type: "owner",
      notes: ""
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: RealEstateContact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg(isTr ? "İsim Soyisim alanı zorunludur!" : "Name field is required!");
      return;
    }
    if (!formData.phone?.trim()) {
      setErrorMsg(isTr ? "Telefon alanı zorunludur!" : "Phone field is required!");
      return;
    }

    setSaveLoading(true);
    setErrorMsg(null);
    try {
      let finalNotes = formData.notes || "";
      // If editing an unreviewed new lead, saving the edit form automatically marks it as reviewed if stage wasn't changed
      if (editingContact && getLeadStage(editingContact.notes) === 'new' && getLeadStage(finalNotes) === 'new') {
        finalNotes = updateLeadStageInNotes(finalNotes, 'reviewed', isAutomotive);
      }

      const finalizedData = {
        ...formData,
        notes: finalNotes,
        phone: standardizeOwnerPhone(formData.phone || "")
      };
      await onSaveContact(finalizedData);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || (isTr ? "Bir hata oluştu" : "An error occurred"));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* HEADER CONTROL BANNER */}
      <div className="flex flex-col gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2 flex-1 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isTr ? (isAutomotive ? "Araç sahibi, konsinye satıcı, alıcı veya telefon ara..." : "Mülk sahibi, yatırımcı veya telefon ara...") : t.search}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 shrink-0">
              <button 
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Satır / Tablo Görünümü"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Satır Tipi</span>
              </button>
              <button 
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kartlar</span>
              </button>
            </div>
          </div>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all w-full sm:w-auto justify-center cursor-pointer shadow-2xs active:scale-95 shrink-0"
          >
            <UserPlus size={15} className="stroke-[2.5]" />
            <span>{isTr ? "Yeni Kişi Ekle" : t.add}</span>
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setQuickFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all cursor-pointer ${
              quickFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tümü ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('new')}
            title="Web sitenizdeki 'Mülkümü Sat/Kirala' veya 'İletişim' formundan gelen yeni başvurular"
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all flex items-center gap-1 cursor-pointer ${
              quickFilter === 'new'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                : newLeadsCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe size={11} />
            <span>Web Başvuruları ({newLeadsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('owner')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all flex items-center gap-1 cursor-pointer ${
              quickFilter === 'owner'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isAutomotive ? <Car size={11} /> : <Home size={11} />}
            <span>{isAutomotive ? `Araç Sahibi / Konsinye (${ownersCount})` : `Mülk Sahipleri (${ownersCount})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter('investor')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all flex items-center gap-1 cursor-pointer ${
              quickFilter === 'investor'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Briefcase size={11} />
            <span>{isAutomotive ? `Alıcı / Filo (${investorsCount})` : `Yatırımcılar (${investorsCount})`}</span>
          </button>
        </div>

        {/* Sub-Category Filters (Satılık/Kiralık, Mülk Tipi, Bölge) */}
        {!isAutomotive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1">
              <Filter size={11} className="text-indigo-600" />
              <span>Alt Kırılım:</span>
            </span>

            {/* Intent Pills: Tümü / Satılık / Kiralık / Kat Karşılığı */}
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {([
                { id: 'all', label: 'Tüm İşlemler' },
                { id: 'satilik', label: 'Satılık' },
                { id: 'kiralik', label: 'Kiralık' },
                { id: 'kat_karsiligi', label: 'Kat Karşılığı' }
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIntentFilter(item.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                    intentFilter === item.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Property Type Sub-Filter */}
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border outline-none cursor-pointer transition-all ${
                propertyTypeFilter !== 'all'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="all" className="bg-white text-slate-900">Tüm Mülk Tipleri</option>
              <option value="daire" className="bg-white text-slate-900">Daire / Konut</option>
              <option value="villa" className="bg-white text-slate-900">Villa / Müstakil</option>
              <option value="arsa" className="bg-white text-slate-900">Arsa / Arazi</option>
              <option value="ticari" className="bg-white text-slate-900">Ticari / İşyeri</option>
              <option value="proje" className="bg-white text-slate-900">Bina / Proje</option>
            </select>

            {/* Region Sub-Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black border outline-none cursor-pointer transition-all ${
                regionFilter !== 'all'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="all" className="bg-white text-slate-900">Tüm Bölgeler</option>
              {KKTC_REGIONS.map((reg) => (
                <option key={reg} value={reg} className="bg-white text-slate-900">
                  {reg}
                </option>
              ))}
            </select>

            {(intentFilter !== 'all' || propertyTypeFilter !== 'all' || regionFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setIntentFilter('all');
                  setPropertyTypeFilter('all');
                  setRegionFilter('all');
                }}
                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <X size={10} />
                <span>Sıfırla ({filteredContacts.length})</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Users size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-xs font-bold">
            {isTr ? (isAutomotive ? "Kayıtlı araç sahibi, konsinye satıcı veya alıcı bulunamadı." : "Kayıtlı mülk sahibi veya yatırımcı bulunamadı.") : "No contacts found."}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* HIGH-DENSITY ROW / TABLE VIEW (MOBILE CARDS + DESKTOP TABLE) */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Mobile Compact Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredContacts.map(contact => {
              const stage = getLeadStage(contact.notes);
              return (
                <div key={contact.id} className="p-3 space-y-2 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 font-extrabold ${
                        stage === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        stage === 'contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        stage === 'converted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {stage === 'new' ? (isAutomotive ? <Car size={14} /> : <Home size={14} />) : stage === 'contacted' ? <Phone size={14} /> : stage === 'converted' ? <Key size={14} /> : <Users size={14} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate leading-tight">{contact.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                            contact.type === 'owner'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}>
                            {contact.type === 'owner'
                              ? (isAutomotive ? 'Araç Sahibi' : 'Mülk Sahibi')
                              : (isAutomotive ? 'Alıcı / Filo' : 'Yatırımcı')}
                          </span>
                          {stage === 'new' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 border border-amber-600 animate-pulse">
                              <Globe size={9} />
                              <span>Yeni Başvuru</span>
                            </span>
                          )}
                          {stage === 'contacted' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white">
                              <span>İletişime Geçildi</span>
                            </span>
                          )}
                          {stage === 'converted' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                              <span>Portföye Alındı</span>
                            </span>
                          )}
                          {!isAutomotive && (() => {
                            const meta = getContactMeta(contact);
                            return (
                              <>
                                {meta.intents.map((it) => (
                                  <span
                                    key={it}
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                      it === 'satilik'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : it === 'kiralik'
                                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                                        : 'bg-purple-50 text-purple-800 border-purple-300'
                                    }`}
                                  >
                                    {INTENT_LABELS[it]}
                                  </span>
                                ))}
                                {meta.propertyTypes.map((pt) => (
                                  <span
                                    key={pt}
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300"
                                  >
                                    {PROPERTY_TYPE_LABELS[pt]}
                                  </span>
                                ))}
                                {meta.regions.map((rg) => (
                                  <span
                                    key={rg}
                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200"
                                  >
                                    <MapPin size={8} />
                                    <span>{rg}</span>
                                  </span>
                                ))}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isAutomotive && (contact.type !== 'owner' || stage === 'new') && (
                        <button
                          type="button"
                          onClick={() => setFunnelTargetContact(contact)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Bu yatırımcı için 6 Adımlı Akıllı Talep Hunisi ve Portföy Eşleştirmesi başlat"
                        >
                          <Sparkles size={11} />
                          <span>Talep Hunisi Aç</span>
                        </button>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                          title="Hemen Ara"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(contact)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      >
                        İncele
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                            onDeleteContact(contact.id!);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {contact.notes && (
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {contact.notes}
                    </p>
                  )}

                  {stage !== 'none' && (
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">{contact.phone}</span>
                      <div className="flex items-center gap-1">
                        {stage !== 'contacted' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(contact, 'contacted')}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-black cursor-pointer"
                          >
                            +İletişim
                          </button>
                        )}
                        {stage !== 'converted' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(contact, 'converted')}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black cursor-pointer"
                          >
                            +Portföy
                          </button>
                        )}
                        {stage !== 'reviewed' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(contact, 'reviewed')}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold cursor-pointer"
                          >
                            +İncelendi
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Ad Soyad / Kişi</th>
                  <th className="py-2.5 px-3">Kişi Rolü</th>
                  <th className="py-2.5 px-3">Aşama Statüsü</th>
                  <th className="py-2.5 px-3">İletişim</th>
                  <th className="py-2.5 px-3">Notlar & Başvuru İçeriği</th>
                  <th className="py-2.5 px-3">Kayıt Tarihi</th>
                  <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredContacts.map(contact => {
                  const stage = getLeadStage(contact.notes);
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 font-extrabold ${
                            stage === 'new' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            stage === 'contacted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            stage === 'converted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {stage === 'new' ? (isAutomotive ? <Car size={14} /> : <Home size={14} />) : stage === 'contacted' ? <Phone size={14} /> : stage === 'converted' ? <Key size={14} /> : <Users size={14} />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{contact.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">#{contact.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            contact.type === 'owner' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}>
                            {contact.type === 'owner' 
                              ? (isTr ? (isAutomotive ? 'Araç Sahibi / Konsinye' : 'Mülk Sahibi') : 'Owner') 
                              : (isTr ? (isAutomotive ? 'Alıcı / Filo Müşterisi' : 'Yatırımcı') : 'Buyer / Investor')}
                          </span>
                          {!isAutomotive && (() => {
                            const meta = getContactMeta(contact);
                            if (meta.intents.length === 0 && meta.propertyTypes.length === 0 && meta.regions.length === 0) return null;
                            return (
                              <div className="flex flex-wrap items-center gap-1">
                                {meta.intents.map((it) => (
                                  <span
                                    key={it}
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                                      it === 'satilik'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : it === 'kiralik'
                                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                                        : 'bg-purple-50 text-purple-800 border-purple-300'
                                    }`}
                                  >
                                    {INTENT_LABELS[it]}
                                  </span>
                                ))}
                                {meta.propertyTypes.map((pt) => (
                                  <span
                                    key={pt}
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-300"
                                  >
                                    {PROPERTY_TYPE_LABELS[pt]}
                                  </span>
                                ))}
                                {meta.regions.map((rg) => (
                                  <span
                                    key={rg}
                                    className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200"
                                  >
                                    <MapPin size={8} />
                                    <span>{rg}</span>
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {stage === 'new' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 border border-amber-600 shadow-2xs animate-pulse">
                              <Globe size={11} />
                              <span>Yeni Başvuru</span>
                            </span>
                          )}
                          {stage === 'contacted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white border border-blue-700 shadow-2xs">
                              <Phone size={11} />
                              <span>İletişime Geçildi</span>
                            </span>
                          )}
                          {stage === 'converted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white border border-emerald-700 shadow-2xs">
                              {isAutomotive ? <Car size={11} /> : <Home size={11} />}
                              <span>Portföye Alındı</span>
                            </span>
                          )}
                          {stage === 'reviewed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
                              <Check size={11} />
                              <span>İncelendi / Arşiv</span>
                            </span>
                          )}
                          {stage === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                              <XCircle size={11} />
                              <span>İptal Edildi</span>
                            </span>
                          )}
                          {stage === 'none' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              Standart Kayıt
                            </span>
                          )}

                          {/* Quick Stage Change Shortcuts */}
                          {stage !== 'none' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {stage !== 'contacted' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'contacted')}
                                  className="text-[9px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  title="İletişime geçildi yap"
                                >
                                  +İletişim
                                </button>
                              )}
                              {stage !== 'converted' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'converted')}
                                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                                  title="Portföye alındı yap"
                                >
                                  +Portföy
                                </button>
                              )}
                              {stage !== 'reviewed' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(contact, 'reviewed')}
                                  className="text-[9px] font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                                  title="İncelendi olarak arşivle"
                                >
                                  +İncelendi
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 font-bold text-slate-900">
                            <Phone size={12} className="text-emerald-600 shrink-0" />
                            <span>{contact.phone}</span>
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-snug">
                          {contact.notes || '---'}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 text-[10px] text-slate-500 whitespace-nowrap font-medium">
                        {contact.created_at ? formatDateTimeTR(contact.created_at) : '---'}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isAutomotive && (contact.type !== 'owner' || stage === 'new') && (
                            <button
                              type="button"
                              onClick={() => setFunnelTargetContact(contact)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                              title="Bu yatırımcı için 6 Adımlı Akıllı Talep Hunisi ve Portföy Eşleştirmesi başlat"
                            >
                              <Sparkles size={12} />
                              <span>Talep Hunisi Aç</span>
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(contact)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-[11px] font-black rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            title={isTr ? "Düzenle ve Durum Değiştir" : "Edit and Change Status"}
                          >
                            <Edit2 size={12} />
                            <span>{isTr ? "Düzenle / İncele" : "Edit / Review"}</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                                onDeleteContact(contact.id!);
                              }
                            }} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isTr ? "Sil" : "Delete"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => {
            const stage = getLeadStage(contact.notes);
            return (
              <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full border ${
                        stage === 'new' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' :
                        stage === 'contacted' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' :
                        stage === 'converted' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' :
                        'bg-slate-50 border-slate-100 text-slate-600'
                      }`}>
                        {stage === 'new' ? (isAutomotive ? <Car size={18} /> : <Home size={18} />) : stage === 'contacted' ? <Phone size={18} /> : stage === 'converted' ? <Key size={18} /> : <Users size={18} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{contact.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`inline-block text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${contact.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {contact.type === 'owner' 
                              ? (isTr ? (isAutomotive ? 'Araç Sahibi / Konsinye' : 'Mülk Sahibi') : 'Owner') 
                              : (isTr ? (isAutomotive ? 'Alıcı / Filo Müşterisi' : 'Yatırımcı') : 'Buyer / Investor')}
                          </span>
                          {stage === 'new' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border border-amber-600 shadow-xs animate-pulse">
                              <Globe size={10} />
                              <span>Yeni Başvuru (Bekliyor)</span>
                            </span>
                          )}
                          {stage === 'contacted' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white border border-blue-600 shadow-xs">
                              <Phone size={10} />
                              <span>İletişime Geçildi</span>
                            </span>
                          )}
                          {stage === 'converted' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-xs">
                              {isAutomotive ? <Car size={10} /> : <Home size={10} />}
                              <span>Portföye Alındı</span>
                            </span>
                          )}
                          {stage === 'reviewed' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                              <Check size={10} />
                              <span>İncelendi / Arşiv</span>
                            </span>
                          )}
                          {stage === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              <XCircle size={10} />
                              <span>İptal Edildi</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {contact.created_at && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatDateTimeTR(contact.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-bold text-slate-800">{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <span className="text-slate-600">{contact.email}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <div className={`mt-2.5 text-[11px] p-2.5 rounded-xl border leading-relaxed ${
                        stage === 'new' ? 'bg-amber-50/80 border-amber-200/80 text-slate-800 font-medium' :
                        stage === 'contacted' ? 'bg-blue-50/80 border-blue-200/80 text-slate-800 font-medium' :
                        stage === 'converted' ? 'bg-emerald-50/80 border-emerald-200/80 text-slate-800 font-medium' :
                        'bg-slate-50 border-slate-100 text-slate-600 italic'
                      }`}>
                        {contact.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Lead Stage Bar */}
                {stage !== 'none' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 bg-slate-50/80 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500">
                      {isTr ? "Aşama Güncelle:" : "Change Stage:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {stage !== 'contacted' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'contacted')}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "İletişime geçildi olarak işaretle (Uyarıyı kaldırır)" : "Mark as contacted"}
                        >
                          <Phone size={11} />
                          <span>İletişime Geçildi</span>
                        </button>
                      )}
                      {stage !== 'converted' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'converted')}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "Portföye dahil edildi olarak işaretle" : "Mark as converted to portfolio"}
                        >
                          <Home size={11} />
                          <span>Portföye Alındı</span>
                        </button>
                      )}
                      {stage !== 'reviewed' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(contact, 'reviewed')}
                          className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all active:scale-95 flex items-center gap-1"
                          title={isTr ? "İncelendi olarak arşivle" : "Mark as reviewed"}
                        >
                          <Check size={11} />
                          <span>İncelendi</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    ID: #{contact.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(contact)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title={isTr ? "Düzenle ve Durum Değiştir" : "Edit and Change Status"}
                    >
                      <Edit2 size={12} />
                      <span>{isTr ? "Düzenle / İncele" : "Edit / Review"}</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(isTr ? "Bu kişiyi silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this contact?")) {
                          onDeleteContact(contact.id!);
                        }
                      }} 
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={isTr ? "Sil" : "Delete"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT CONTACT MODAL - VIEWPORT-FIT COMPACT DESIGN (NO OVERFLOW) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] p-2 sm:p-4 overflow-hidden flex items-start sm:items-center justify-center py-4 sm:py-6">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100vh-2rem)] sm:max-h-[88vh]">
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2 uppercase tracking-tight">
                <Users size={16} className="text-indigo-600" />
                {editingContact ? (isTr ? "Kişiyi Düzenle & İncele" : "Edit & Review Contact") : (isTr ? "Yeni Kişi Ekle" : "Add New Contact")}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2 rounded-xl text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Lead Stage Selector if contact is a web lead or has lead stage */}
                {(editingContact || getLeadStage(formData.notes) !== 'none') && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-800 flex items-center justify-between">
                      <span>{isTr ? "Başvuru Aşama Statüsü *" : "Lead Stage Status *"}</span>
                      <span className="text-[10px] text-amber-600 font-bold">{isTr ? "(Ekrandaki uyarıyı günceller)" : "(Updates alert)"}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'new') })}
                        className={`p-1.5 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${getLeadStage(formData.notes) === 'new' ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Clock size={12} />
                        <span>Yeni (Bekliyor)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'contacted') })}
                        className={`p-1.5 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${getLeadStage(formData.notes) === 'contacted' ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Phone size={12} />
                        <span>İletişime Geçildi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'converted') })}
                        className={`p-1.5 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${getLeadStage(formData.notes) === 'converted' ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Home size={12} />
                        <span>Portföye Alındı</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, notes: updateLeadStageInNotes(formData.notes, 'reviewed') })}
                        className={`p-1.5 text-left text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${getLeadStage(formData.notes) === 'reviewed' ? 'bg-slate-800 text-white border-slate-900 font-black shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        <Check size={12} />
                        <span>İncelendi & Arşiv</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                      {isTr ? "İsim Soyisim *" : "Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                      {isTr ? "Telefon Numarası *" : "Phone Number *"}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+90 533 123 4567"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onBlur={(e) => {
                        const norm = standardizeOwnerPhone(e.target.value);
                        setFormData({ ...formData, phone: norm });
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                      {isTr ? "E-Posta Adresi" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                      {isTr ? "Kişi Rolü / Tipi" : "Role / Type"}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "owner" })}
                        className={`py-1.5 px-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formData.type === 'owner' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {isAutomotive ? <Car size={12} /> : <Home size={12} />}
                        <span>{isTr ? (isAutomotive ? "Araç Sahibi" : "Mülk Sahibi") : "Owner"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "investor" })}
                        className={`py-1.5 px-2 text-[11px] font-black rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${formData.type === 'investor' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <Briefcase size={12} />
                        <span>{isTr ? (isAutomotive ? "Alıcı / Filo" : "Yatırımcı") : "Buyer / Investor"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {!isAutomotive && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1">
                      <Tag size={11} className="text-indigo-600" />
                      <span>Hızlı Alt Kırılım Etiketleri (Satılık/Kiralık, Mülk Tipi & Bölge)</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Satılık', 'Kiralık', 'Kat Karşılığı', 'Daire', 'Villa', 'Arsa', 'Ticari', 'Bina/Proje', 'Girne', 'Lefkoşa', 'İskele', 'Gazimağusa'].map((tag) => {
                        const isTagged = normalizeTr(formData.notes || "").includes(normalizeTr(tag));
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTagInNotes(tag)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all cursor-pointer ${
                              isTagged
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTagged ? `✓ ${tag}` : `+ ${tag}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                    {isTr ? "Özel Notlar & Başvuru İçeriği" : "Notes & Submission Content"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={isTr ? "Müşteri veya portföy hakkında ek notlar..." : "Additional notes..."}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 min-h-[55px]"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex justify-end gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editingContact ? (isTr ? "Kaydet & Tamamla" : "Save & Complete Review") : (isTr ? "Kaydet" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6-Step Lead Funnel Wizard Modal launched directly from Investor CRM */}
      {!isAutomotive && (
        <LeadFunnelWizardModal
          isOpen={!!funnelTargetContact}
          onClose={() => setFunnelTargetContact(null)}
          initialContact={funnelTargetContact}
          agents={[]}
          portfolioItems={properties}
          stages={RE_PIPELINE_STAGES}
          storeId={storeId}
          onSaveDeal={handleSaveFunnelLeadFromContact}
        />
      )}
    </div>
  );
};

export default RealEstateCrmTab;

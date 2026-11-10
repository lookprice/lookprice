import React, { useState, useDeferredValue, useMemo } from "react";
import { Search, UserPlus, Users, Trash2, Edit2, Phone, Mail, X, Plus, Info, CheckCircle2, PhoneCall, Building, LayoutList, LayoutGrid, Home, Car, Key, Globe, Check, Briefcase, Clock, XCircle, Sparkles, Filter, MapPin, Tag, Eye, FileSignature, FileCheck } from "lucide-react";
import { RealEstateContact } from "../../types";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatDateTimeTR } from "../../utils/formatUtils";
import { LeadFunnelWizardModal } from "../../components/realestate/LeadFunnelWizardModal";
import { toast } from "sonner";

const LegalContractModal = React.lazy(() => import("../../components/LegalContractModal").then(m => ({ default: m.LegalContractModal })));
const RealEstateModal = React.lazy(() => import("../../components/RealEstateModal").then(m => ({ default: m.RealEstateModal })));

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
  linkedProperties: any[];
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

const parseJsonObj = (val: any): Record<string, any> => {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

export const getPropertyOwnerDetails = (p: any) => {
  if (!p) return { name: "", phone: "", email: "", idNumber: "" };
  const directOwner = parseJsonObj(p.owner_info);
  const sectorData = parseJsonObj(p.sector_data);
  const nestedOwner = parseJsonObj(sectorData.owner_info);
  const name = String(directOwner.fullName || nestedOwner.fullName || p.owner_name || "").trim();
  const phone = String(directOwner.phone || nestedOwner.phone || p.owner_phone || p.contact_phone || "").trim();
  const email = String(directOwner.email || nestedOwner.email || p.owner_email || "").trim();
  const idNumber = String(directOwner.idNumber || nestedOwner.idNumber || directOwner.tcNo || nestedOwner.tcNo || p.owner_id_number || "").trim();
  return { name, phone, email, idNumber };
};

export const cleanContactNotes = (rawNotes?: string, linkedProps: any[] = []): string => {
  if (!rawNotes) return "";
  const lines = rawNotes
    .split(/\r?\n/)
    .map((line) => line.replace(/İlan Üzerinden Otomatik Eklendi:\s*[^|\n]+(\s*\|\s*)?/gi, "").trim())
    .filter(Boolean)
    .filter((line) => {
      const normLine = normalizeTr(line);
      for (const p of linkedProps) {
        const desc = normalizeTr(p?.description || "").trim();
        if (desc && desc.length > 20 && (desc.includes(normLine) || normLine.includes(desc.slice(0, 40)))) {
          return false;
        }
      }
      return true;
    });
  return Array.from(new Set(lines)).join(" | ");
};

export const isPropertyRental = (prop: any): boolean => {
  if (!prop) return false;
  const lType = String(prop.listing_type || "").trim();
  const titleStr = String(prop.title || "").trim();
  if (/\b(kiralık|kiralik|kira|for rent)\b/i.test(lType)) return true;
  if (/\b(satılık|satilik|satış|satis|for sale)\b/i.test(lType)) return false;
  if (prop.listing_intent === "rent" || prop.intent === "kiralik" || prop.sector_data?.listing_intent === "rent") {
    return true;
  }
  if (
    /\b(kiralık|kiralik|kira|for rent)\b/i.test(titleStr) &&
    !/\b(satılık|satilik|for sale)\b/i.test(titleStr)
  ) {
    return true;
  }
  if (prop.listing_intent === "sale" || prop.intent === "satilik" || prop.sector_data?.listing_intent === "sale") {
    return false;
  }
  return false;
};

export const extractContactSubMeta = (contact: RealEstateContact, properties: any[] = []): ContactSubMeta => {
  const intents = new Set<ContactIntentType>();
  const propertyTypes = new Set<ContactPropertyType>();
  const regions = new Set<string>();

  const normPhone = (contact.phone || "").replace(/\D/g, "").slice(-10);
  const normName = normalizeTr(contact.name || "").replace(/\s+/g, " ").trim();

  // 1. Cross-reference with store properties (owner_contact_id, owner_info, owner_phone, owner_name)
  const linkedProps = (properties || []).filter((p) => {
    if (!p) return false;
    if (contact.id && String(p.owner_contact_id) === String(contact.id)) return true;
    const pOwner = getPropertyOwnerDetails(p);
    const pPhone = (pOwner.phone || "").replace(/\D/g, "").slice(-10);
    if (normPhone.length >= 7 && pPhone && pPhone === normPhone) return true;
    const pOwnerName = normalizeTr(pOwner.name || "").replace(/\s+/g, " ").trim();
    if (normName.length >= 3 && pOwnerName && pOwnerName === normName) return true;
    return false;
  });

  const analyzeText = (raw: string, includeIntents = true) => {
    const t = normalizeTr(raw);
    if (!t) return;

    if (includeIntents) {
      // Intents
      if (/\b(satılık|satilik|satis|satış|for sale|yatırımlık|yatirimlik)\b/i.test(t)) intents.add('satilik');
      if (/\b(kiralık|kiralik|kira|for rent|rent)\b/i.test(t)) intents.add('kiralik');
      if (/\b(kat karşılığı|kat karsiligi|ortak proje)\b/i.test(t)) intents.add('kat_karsiligi');
    }

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

  analyzeText(`${contact.notes || ""} ${contact.address || ""}`, linkedProps.length === 0);

  for (const p of linkedProps) {
    intents.add(isPropertyRental(p) ? 'kiralik' : 'satilik');
    const pText = `${p.title || ""} ${p.listing_type || ""} ${p.property_type || ""} ${p.category || ""} ${p.sub_category || ""} ${p.kktc_region || ""} ${p.location || ""}`;
    analyzeText(pText, false);
  }

  return {
    intents: Array.from(intents),
    propertyTypes: Array.from(propertyTypes),
    regions: Array.from(regions),
    linkedPropertiesCount: linkedProps.length,
    linkedProperties: linkedProps,
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
  branding?: any;
  user?: any;
  onSaveProperty?: (prop: any) => Promise<void>;
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
  branding,
  user,
  onSaveProperty,
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

  // Direct Property Inspection & Authorization Contract Modal States
  const [inspectingProperty, setInspectingProperty] = useState<any | null>(null);
  const [authContractState, setAuthContractState] = useState<{
    isOpen: boolean;
    property: any;
    templateId: 'exclusivity_agreement' | 'rental_authorization' | 'sales_authorization';
    ownerName: string;
    ownerPhone: string;
    ownerIdNumber: string;
  } | null>(null);

  React.useEffect(() => {
    if (initialFilter) setQuickFilter(initialFilter);
  }, [initialFilter]);

  // Deduplicate owners & synthesize missing owners from portfolio properties
  const consolidatedContacts = useMemo(() => {
    const result: RealEstateContact[] = [];
    const ownerByKey = new Map<string, RealEstateContact>();

    const findExistingOwner = (normName: string, normPhone: string): RealEstateContact | undefined => {
      if (normName && ownerByKey.has(`name:${normName}`)) {
        return ownerByKey.get(`name:${normName}`);
      }
      if (normPhone.length >= 7 && ownerByKey.has(`phone:${normPhone}`)) {
        return ownerByKey.get(`phone:${normPhone}`);
      }
      return undefined;
    };

    const registerOwnerKeys = (ownerObj: RealEstateContact) => {
      const nName = normalizeTr(ownerObj.name || "").replace(/\s+/g, " ").trim();
      const nPhone = String(ownerObj.phone || "").replace(/\D/g, "").slice(-10);
      if (nName) ownerByKey.set(`name:${nName}`, ownerObj);
      if (nPhone.length >= 7) ownerByKey.set(`phone:${nPhone}`, ownerObj);
    };

    for (const rawContact of contacts || []) {
      if (!rawContact) continue;
      if (rawContact.type !== "owner") {
        result.push(rawContact);
        continue;
      }

      const normName = normalizeTr(rawContact.name || "").replace(/\s+/g, " ").trim();
      const normPhone = String(rawContact.phone || "").replace(/\D/g, "").slice(-10);
      const existing = findExistingOwner(normName, normPhone);

      if (!existing) {
        const clone: RealEstateContact = {
          ...rawContact,
          notes: cleanContactNotes(rawContact.notes, properties),
        };
        result.push(clone);
        registerOwnerKeys(clone);
      } else {
        if (!existing.phone && rawContact.phone) existing.phone = rawContact.phone;
        if (!existing.email && rawContact.email) existing.email = rawContact.email;
        if (!(existing as any).id_number && (rawContact as any).id_number) {
          (existing as any).id_number = (rawContact as any).id_number;
        }
        const cleanedIncoming = cleanContactNotes(rawContact.notes, properties);
        if (cleanedIncoming && !(existing.notes || "").includes(cleanedIncoming)) {
          existing.notes = existing.notes ? `${existing.notes} | ${cleanedIncoming}` : cleanedIncoming;
        }
        registerOwnerKeys(existing);
      }
    }

    // Also synthesize owners defined on portfolio properties that aren't in contacts yet
    for (const prop of properties || []) {
      if (!prop) continue;
      const pOwner = getPropertyOwnerDetails(prop);
      if (!pOwner.name) continue;
      const normName = normalizeTr(pOwner.name).replace(/\s+/g, " ").trim();
      const normPhone = (pOwner.phone || "").replace(/\D/g, "").slice(-10);
      const existing = findExistingOwner(normName, normPhone);

      if (!existing) {
        const syntheticOwner: RealEstateContact = {
          id: `prop_owner_${prop.id}`,
          name: pOwner.name,
          phone: pOwner.phone || "",
          email: pOwner.email || "",
          type: "owner",
          notes: "",
          created_at: prop.created_at || new Date().toISOString(),
        };
        (syntheticOwner as any).id_number = pOwner.idNumber || "";
        result.push(syntheticOwner);
        registerOwnerKeys(syntheticOwner);
      } else {
        if (!existing.phone && pOwner.phone) existing.phone = pOwner.phone;
        if (!existing.email && pOwner.email) existing.email = pOwner.email;
        if (!(existing as any).id_number && pOwner.idNumber) {
          (existing as any).id_number = pOwner.idNumber;
        }
        registerOwnerKeys(existing);
      }
    }

    return result;
  }, [contacts, properties]);

  const contactMetaMap = useMemo(() => {
    const map = new Map<string, ContactSubMeta>();
    for (const c of consolidatedContacts) {
      const key = String(c.id || `${c.name}_${c.phone}`);
      map.set(key, extractContactSubMeta(c, properties));
    }
    return map;
  }, [consolidatedContacts, properties]);

  const getContactMeta = (c: RealEstateContact): ContactSubMeta => {
    const key = String(c.id || `${c.name}_${c.phone}`);
    return contactMetaMap.get(key) || { intents: [], propertyTypes: [], regions: [], linkedPropertiesCount: 0, linkedProperties: [] };
  };

  const openOwnerAuthContract = (
    contact: RealEstateContact,
    property: any,
    templateId: 'exclusivity_agreement' | 'rental_authorization' | 'sales_authorization',
    forcedIntent?: 'rent' | 'sale'
  ) => {
    const pOwner = getPropertyOwnerDetails(property);
    const ownerName = contact.name || pOwner.name || "";
    const ownerPhone = contact.phone || pOwner.phone || "";
    const ownerIdNumber = String((contact as any).id_number || pOwner.idNumber || "").trim();

    const resolvedIntent: 'rent' | 'sale' =
      forcedIntent ||
      (templateId === "rental_authorization"
        ? "rent"
        : templateId === "sales_authorization"
        ? "sale"
        : property
        ? isPropertyRental(property)
          ? "rent"
          : "sale"
        : "sale");

    const targetProperty = property
      ? {
          ...property,
          listing_intent: resolvedIntent,
          listing_type: resolvedIntent === "rent" ? "Kiralık" : "Satılık",
        }
      : {
          id: `pre_portfolio_${Date.now()}`,
          title: `Ön Portföy (Yetki Belgesi)`,
          address: contact.address || "",
          location: "KKTC",
          price: 0,
          currency: "GBP",
          listing_intent: resolvedIntent,
          listing_type: resolvedIntent === "rent" ? "Kiralık" : "Satılık",
          owner_name: ownerName,
          owner_phone: ownerPhone,
          owner_info: {
            fullName: ownerName,
            phone: ownerPhone,
            identityNo: ownerIdNumber,
            idNumber: ownerIdNumber,
          },
          documents: []
        };

    setAuthContractState({
      isOpen: true,
      property: targetProperty,
      templateId,
      ownerName,
      ownerPhone,
      ownerIdNumber,
    });
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

  const newLeadsCount = consolidatedContacts.filter(c => getLeadStage(c.notes) === 'new').length;
  const ownersCount = consolidatedContacts.filter(c => c.type === 'owner').length;
  const investorsCount = consolidatedContacts.filter(c => c.type !== 'owner').length;

  const filteredContacts = consolidatedContacts.filter(c => {
    const s = normalizeTr(deferredSearch);
    const meta = getContactMeta(c);
    const matchesPropertySearch = meta.linkedProperties.some(
      (p) =>
        normalizeTr(p.title || "").includes(s) ||
        normalizeTr(String(p.reference_code || p.id || "")).includes(s) ||
        normalizeTr(p.location || p.kktc_region || "").includes(s)
    );
    const matchesSearch = !s || (
      normalizeTr(c.name || "").includes(s) || 
      (c.phone || "").includes(s) || 
      normalizeTr(c.email || "").includes(s) ||
      normalizeTr(c.notes || "").includes(s) ||
      meta.regions.some(r => normalizeTr(r).includes(s)) ||
      matchesPropertySearch
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
      if (editingContact && getLeadStage(editingContact.notes) === 'new' && getLeadStage(finalNotes) === 'new') {
        finalNotes = updateLeadStageInNotes(finalNotes, 'reviewed', isAutomotive);
      }

      const finalizedData: any = {
        ...formData,
        notes: finalNotes,
        phone: standardizeOwnerPhone(formData.phone || "")
      };
      if (String(finalizedData.id || "").startsWith("prop_owner_")) {
        delete finalizedData.id;
      }
      await onSaveContact(finalizedData);
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || (isTr ? "Bir hata oluştu" : "An error occurred"));
    } finally {
      setSaveLoading(false);
    }
  };

  const renderOwnerPropertiesList = (contact: RealEstateContact, linkedProps: any[], compact = false) => {
    if (isAutomotive) return null;
    if (linkedProps.length === 0) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500">
            Henüz bağlı portföy ilanı yok
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => openOwnerAuthContract(contact, null, 'sales_authorization', 'sale')}
              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Satılık Gayrimenkul Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek) Hazırla (1. İmza: Mülk Sahibi)"
            >
              <FileSignature size={10} />
              <span>Yetkili Satış Sözleşmesi</span>
            </button>
            <button
              type="button"
              onClick={() => openOwnerAuthContract(contact, null, 'exclusivity_agreement', 'rent')}
              className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-black rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Kiralık Gayrimenkul Tek Yetkili Kiralama Sözleşmesi Hazırla (1. İmza: Mülk Sahibi)"
            >
              <FileSignature size={10} />
              <span>Kiralık Tek Yetki</span>
            </button>
            <button
              type="button"
              onClick={() => openOwnerAuthContract(contact, null, 'rental_authorization', 'rent')}
              className="px-2 py-0.5 bg-teal-600 hover:bg-teal-700 text-white text-[9px] font-black rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Kiralıklarda Yetki Belgesi Sözleşmesi Hazırla (1. İmza: Mülk Sahibi)"
            >
              <FileCheck size={10} />
              <span>Kiralama Yetki</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
            <Building size={11} />
            <span>Sahip Olduğu Mülkler ({linkedProps.length})</span>
          </span>
        </div>
        <div className={`space-y-1 ${compact ? 'max-h-44 overflow-y-auto pr-0.5 custom-scrollbar' : ''}`}>
          {linkedProps.map((prop) => {
            const isRent = isPropertyRental(prop);
            const priceFormatted = Number(prop.price || 0).toLocaleString("tr-TR");
            const curr = prop.currency || "GBP";
            const refCode = prop.reference_code || prop.id;
            return (
              <div
                key={prop.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-50 hover:bg-indigo-50/40 px-2.5 py-1.5 rounded-xl border border-slate-200/90 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-900 text-white shrink-0">
                      #{refCode}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded border shrink-0 ${
                        isRent
                          ? "bg-sky-50 text-sky-800 border-sky-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {isRent ? "Kiralık" : "Satılık"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectingProperty(prop)}
                      className="text-[11px] font-extrabold text-slate-900 hover:text-indigo-700 truncate text-left cursor-pointer"
                      title={prop.title}
                    >
                      {prop.title || "İsimsiz Gayrimenkul"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-500">
                    {(prop.kktc_region || prop.location) && (
                      <span className="inline-flex items-center gap-0.5 text-slate-600 truncate">
                        <MapPin size={9} className="text-rose-500 shrink-0" />
                        <span>{prop.kktc_region || prop.location}</span>
                      </span>
                    )}
                    <span className="font-black text-indigo-700">
                      {priceFormatted} {curr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectingProperty(prop)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Mülk Detaylarını İncele / Düzenle"
                  >
                    <Eye size={10} className="text-indigo-600" />
                    <span>İncele</span>
                  </button>
                  {isRent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openOwnerAuthContract(contact, prop, 'exclusivity_agreement', 'rent')}
                        className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Bu kiralık mülk için Kiralık Gayrimenkul Tek Yetkili Kiralama Sözleşmesi (1. İmza: Mülk Sahibi)"
                      >
                        <FileSignature size={10} />
                        <span>Kiralık Tek Yetki</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openOwnerAuthContract(contact, prop, 'rental_authorization', 'rent')}
                        className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Bu kiralık mülk için Kiralama Yetki Belgesi (1. İmza: Mülk Sahibi)"
                      >
                        <FileCheck size={10} />
                        <span>Kiralama Yetki</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openOwnerAuthContract(contact, prop, 'sales_authorization', 'sale')}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Bu satılık mülk için Satılık Gayrimenkul Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek) (1. İmza: Mülk Sahibi)"
                    >
                      <FileSignature size={10} />
                      <span>Yetkili Satış Sözleşmesi</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
                placeholder={isTr ? (isAutomotive ? "Araç sahibi, konsinye satıcı, alıcı veya telefon ara..." : "Mülk sahibi, mülk adı, #Ref, yatırımcı veya telefon ara...") : t.search}
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

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end shrink-0">
            {!isAutomotive && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openOwnerAuthContract(
                      { name: "", phone: "", type: "owner" },
                      null,
                      "sales_authorization",
                      "sale"
                    )
                  }
                  className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                  title="Henüz Portföye Alınmamış Satılık Mülk İçin Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek) Al (Ön Portföy Oluşturur)"
                >
                  <FileSignature size={13} className="text-indigo-700" />
                  <span>Satış Yetki Al</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openOwnerAuthContract(
                      { name: "", phone: "", type: "owner" },
                      null,
                      "exclusivity_agreement",
                      "rent"
                    )
                  }
                  className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                  title="Henüz Portföye Alınmamış Kiralık Mülk İçin Tek Yetkili Kiralama Sözleşmesi Al (Ön Portföy Oluşturur)"
                >
                  <FileSignature size={13} className="text-sky-700" />
                  <span>Kira Tek Yetki Al</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openOwnerAuthContract(
                      { name: "", phone: "", type: "owner" },
                      null,
                      "rental_authorization",
                      "rent"
                    )
                  }
                  className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                  title="Henüz Portföye Alınmamış Mülk İçin Kiralama Yetki Belgesi Al (Ön Portföy Oluşturur)"
                >
                  <FileCheck size={13} className="text-teal-700" />
                  <span>Kira Yetki Al</span>
                </button>
              </>
            )}
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            >
              <UserPlus size={15} className="stroke-[2.5]" />
              <span>{isTr ? "Yeni Kişi Ekle" : t.add}</span>
            </button>
          </div>
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
            Tümü ({consolidatedContacts.length})
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
              const meta = getContactMeta(contact);
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
                              ? (isAutomotive ? 'Araç Sahibi' : `Mülk Sahibi (${meta.linkedPropertiesCount})`)
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isAutomotive && (contact.type !== 'owner' || stage === 'new') && (
                        <button
                          type="button"
                          onClick={() => setFunnelTargetContact(contact)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Sparkles size={11} />
                          <span>Talep Hunisi</span>
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
                        Kişi Kartı
                      </button>
                      {!String(contact.id || "").startsWith("prop_owner_") && (
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
                      )}
                    </div>
                  </div>

                  {contact.type === 'owner' && !isAutomotive ? (
                    renderOwnerPropertiesList(contact, meta.linkedProperties, true)
                  ) : (
                    contact.notes && (
                      <p className="text-[11px] text-slate-600 font-medium line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {contact.notes}
                      </p>
                    )
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
                  <th className="py-2.5 px-3">Rol & Portföy Özeti</th>
                  <th className="py-2.5 px-3">İletişim</th>
                  <th className="py-2.5 px-3">Sahip Olduğu Mülkler / Yetki Belgeleri & Notlar</th>
                  <th className="py-2.5 px-3 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {filteredContacts.map(contact => {
                  const stage = getLeadStage(contact.notes);
                  const meta = getContactMeta(contact);
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors align-top">
                      <td className="py-2.5 px-3 whitespace-nowrap">
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
                            <span className="text-[10px] text-slate-400 font-mono">
                              {contact.created_at ? formatDateTimeTR(contact.created_at) : `#${contact.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1">
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              contact.type === 'owner' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            }`}>
                              {contact.type === 'owner' 
                                ? (isTr ? (isAutomotive ? 'Araç Sahibi' : `Mülk Sahibi (${meta.linkedPropertiesCount} Mülk)`) : 'Owner') 
                                : (isTr ? (isAutomotive ? 'Alıcı / Filo' : 'Yatırımcı') : 'Investor')}
                            </span>
                            {stage === 'new' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 border border-amber-600 animate-pulse">
                                <Globe size={10} />
                                <span>Yeni Başvuru</span>
                              </span>
                            )}
                          </div>
                          {!isAutomotive && (meta.intents.length > 0 || meta.regions.length > 0) && (
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
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px]">
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1 font-bold text-slate-900 hover:text-indigo-700"
                            >
                              <Phone size={12} className="text-emerald-600 shrink-0" />
                              <span>{contact.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Telefon kayıtlı değil</span>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 min-w-[360px] max-w-xl">
                        {contact.type === 'owner' && !isAutomotive ? (
                          <div className="space-y-1.5">
                            {renderOwnerPropertiesList(contact, meta.linkedProperties, true)}
                            {contact.notes && (
                              <p className="text-[10px] text-slate-500 font-medium italic line-clamp-1">
                                Not: {contact.notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-snug">
                            {contact.notes || '---'}
                          </p>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isAutomotive && (contact.type !== 'owner' || stage === 'new') && (
                            <button
                              type="button"
                              onClick={() => setFunnelTargetContact(contact)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <Sparkles size={11} />
                              <span>Talep Hunisi</span>
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(contact)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-[10px] font-black rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <Edit2 size={11} />
                            <span>Kişi Kartı</span>
                          </button>
                          {!String(contact.id || "").startsWith("prop_owner_") && (
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
                          )}
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
            const meta = getContactMeta(contact);
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
                              ? (isTr ? (isAutomotive ? 'Araç Sahibi' : `Mülk Sahibi (${meta.linkedPropertiesCount} Mülk)`) : 'Owner') 
                              : (isTr ? (isAutomotive ? 'Alıcı / Filo' : 'Yatırımcı') : 'Buyer / Investor')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span className="font-bold text-slate-800">{contact.phone || '---'}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" />
                        <span className="text-slate-600">{contact.email}</span>
                      </div>
                    )}
                    {contact.type === 'owner' && !isAutomotive ? (
                      <div className="pt-1">
                        {renderOwnerPropertiesList(contact, meta.linkedProperties, true)}
                      </div>
                    ) : (
                      contact.notes && (
                        <div className="mt-2 text-[11px] p-2.5 rounded-xl border bg-slate-50 border-slate-100 text-slate-600">
                          {contact.notes}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {contact.created_at ? formatDateTimeTR(contact.created_at) : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(contact)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Kişi Kartı</span>
                    </button>
                    {!String(contact.id || "").startsWith("prop_owner_") && (
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
                    )}
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
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[calc(100vh-2rem)] sm:max-h-[88vh]">
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-900 text-white shrink-0">
              <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2 uppercase tracking-tight">
                <Users size={16} className="text-indigo-400" />
                {editingContact ? (isTr ? "Kişi Kartı & Portföy Mülkleri" : "Edit & Review Contact") : (isTr ? "Yeni Kişi Ekle" : "Add New Contact")}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-3 sm:p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2 rounded-xl text-xs font-semibold">
                    {errorMsg}
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

                {/* Owner Linked Properties & Quick Authorization Contracts inside Contact Modal */}
                {editingContact && formData.type === 'owner' && !isAutomotive && (
                  <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-200/80 space-y-2">
                    {renderOwnerPropertiesList(
                      editingContact as RealEstateContact,
                      getContactMeta(editingContact as RealEstateContact).linkedProperties,
                      false
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-0.5">
                    {isTr ? "Özel İletişim Notları" : "Notes"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isTr ? "Mülk sahibi veya yatırımcı ile ilgili özel iletişim notları..." : "Additional notes..."}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 min-h-[50px]"
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
                  {editingContact ? (isTr ? "Kaydet" : "Save") : (isTr ? "Kaydet" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Inspect / Edit Modal launched directly from Owner's Property List */}
      {inspectingProperty && (
        <React.Suspense fallback={null}>
          <RealEstateModal
            isOpen={!!inspectingProperty}
            onClose={() => setInspectingProperty(null)}
            property={inspectingProperty}
            storeId={storeId || user?.store_id}
            userRole={user?.role || "store_admin"}
            safeProperties={properties}
            defaultStoreName={branding?.store_name || branding?.name || "Seçkin Emlak"}
            onSave={async (updatedProp) => {
              if (onSaveProperty) {
                await onSaveProperty(updatedProp);
                setInspectingProperty(null);
              }
            }}
          />
        </React.Suspense>
      )}

      {/* Tek Yetki Sözleşmesi & Kiralama Yetki Belgesi Modal (1. İmza: Mülk Sahibi, 2. İmza: İşletme Yetkilisi) */}
      {authContractState?.isOpen && authContractState.property && (
        <React.Suspense fallback={null}>
          <LegalContractModal
            isOpen={authContractState.isOpen}
            onClose={() => setAuthContractState(null)}
            property={authContractState.property}
            branding={branding}
            initialTemplateId={authContractState.templateId}
            initialClientName={authContractState.ownerName}
            initialClientPhone={authContractState.ownerPhone}
            initialClientIdentity={authContractState.ownerIdNumber}
            onSaveContract={async (contractDoc, prePortfolioMeta) => {
              if (!onSaveProperty) {
                toast.success("Yetki sözleşmesi hazırlandı!");
                return;
              }
              const isPrePortfolio =
                !authContractState.property?.id ||
                String(authContractState.property.id).startsWith("temp_") ||
                String(authContractState.property.id).startsWith("pre_portfolio_");

              const existingDocs = authContractState.property?.documents || [];
              const existingIdx = existingDocs.findIndex((d: any) => d && d.id === contractDoc.id);
              const updatedDocs =
                existingIdx >= 0
                  ? existingDocs.map((d: any, idx: number) => (idx === existingIdx ? contractDoc : d))
                  : [...existingDocs, contractDoc];

              if (isPrePortfolio) {
                const isRentAuth =
                  prePortfolioMeta?.listingIntent === "rent" ||
                  contractDoc?.details?.templateId === "rental_authorization";
                const addrLabel = (
                  prePortfolioMeta?.address ||
                  contractDoc?.details?.rentalAddress ||
                  "KKTC"
                ).trim();
                const typeLabel = (
                  prePortfolioMeta?.propertyTypeFeatures ||
                  contractDoc?.details?.authPropertyTypeFeatures ||
                  "Gayrimenkul"
                ).trim();
                const ownerFullName = (
                  prePortfolioMeta?.ownerName ||
                  contractDoc?.details?.clientName ||
                  authContractState.ownerName ||
                  ""
                ).trim();
                const ownerTel = (
                  prePortfolioMeta?.ownerPhone ||
                  contractDoc?.details?.clientPhone ||
                  authContractState.ownerPhone ||
                  ""
                ).trim();
                const ownerIdNo = (
                  prePortfolioMeta?.ownerIdentity ||
                  contractDoc?.details?.clientIdentity ||
                  authContractState.ownerIdNumber ||
                  ""
                ).trim();

                const newPrePortfolioProp = {
                  ...authContractState.property,
                  title: `[YETKİ ALINDI] ${typeLabel} - ${addrLabel}`,
                  description: `Yetki Sözleşmesi ile Ön Portföye Alındı. Taşınmazın Adresi: ${addrLabel} | Cinsi ve Özellikleri: ${typeLabel}. (Fotoğraf çekimi ve detaylı ilan bilgileri bekleniyor)`,
                  address: addrLabel,
                  location: prePortfolioMeta?.district || addrLabel,
                  kktc_region: prePortfolioMeta?.district || authContractState.property?.kktc_region || "Lefkoşa",
                  mahalle: prePortfolioMeta?.townVillage || "",
                  price: Number(prePortfolioMeta?.price || 0),
                  currency: prePortfolioMeta?.currency || "GBP",
                  listing_intent: isRentAuth ? "rent" : "sale",
                  listing_type: isRentAuth ? "Kiralık" : "Satılık",
                  kocan_no: prePortfolioMeta?.kocanNo || "",
                  pafta: prePortfolioMeta?.paftaNo || "",
                  ada: prePortfolioMeta?.adaNo || "",
                  parsel: prePortfolioMeta?.parselNo || "",
                  owner_name: ownerFullName,
                  owner_phone: ownerTel,
                  owner_info: {
                    fullName: ownerFullName,
                    phone: ownerTel,
                    identityNo: ownerIdNo,
                    idNumber: ownerIdNo,
                    address: prePortfolioMeta?.ownerAddress || ""
                  },
                  documents: updatedDocs
                };

                const createdRes = await onSaveProperty(newPrePortfolioProp);
                const resolvedProp =
                  createdRes && typeof createdRes === "object"
                    ? createdRes
                    : { ...newPrePortfolioProp };
                setAuthContractState((prev) =>
                  prev ? { ...prev, property: resolvedProp } : null
                );
                toast.success("Yetki sözleşmesi kaydedildi ve mülk 'Ön Portföy' olarak portföye eklendi!");
                return resolvedProp;
              }

              const savedRes = await onSaveProperty({
                ...authContractState.property,
                documents: updatedDocs
              });
              setAuthContractState((prev) =>
                prev ? { ...prev, property: { ...prev.property, documents: updatedDocs } } : null
              );
              return savedRes;
            }}
          />
        </React.Suspense>
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

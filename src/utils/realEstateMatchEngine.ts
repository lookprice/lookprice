/**
 * Real Estate Smart Matchmaking Engine (Akıllı Eşleşme Motoru)
 * Weighted Scoring Algorithm & Fuzzy Logic for Portfolios vs CRM Leads/Demands
 * Supports 6-Step KKTC Funnel Criteria (Progressive Disclosure Schema) + Text NLP Fallback
 */

import { RealEstateProperty } from '../types';

export interface LeadFunnelCriteria {
  // ADIM 1: İşlem Niyeti ve Kategori (Main Intent)
  intent: 'sale' | 'rent' | 'investment' | 'any';
  mainType: 'residence' | 'commercial' | 'land' | 'any';
  subTypes: string[]; // boş ise "Fark Etmez / Tümü"

  // ADIM 2: Lokasyon ve Kapsama Alanı (KKTC Özel)
  cities: string[]; // ['Girne', 'Lefkoşa', ...] veya boş ise "Fark Etmez"
  subRegions: string[]; // ['Alsancak', 'Karaoğlanoğlu', 'Long Beach', ...] veya boş ise "Fark Etmez"
  locationTolerance: 'strict' | 'nearby_10km' | 'district_wide';

  // ADIM 3: Finansal Çerçeve ve Ödeme
  currency: 'GBP' | 'EUR' | 'USD' | 'TRY';
  minBudget: number;
  maxBudget: number;
  paymentMethod: 'any' | 'cash' | 'bank_credit' | 'developer_installment' | 'exchange';
  budgetTolerance: 0 | 5 | 10 | 15; // Kesin Bütçe (0), %5, %10, %15
  trafoKdvPreference?: 'any' | 'paid_only';

  // ADIM 4: Fiziksel Metrikler (Ana Emlak Tipine Göre Dinamik)
  roomCounts: string[]; // Konut için: ['1+0', '1+1', '2+1', '3+1', '4+1+'] veya boş = Fark Etmez
  minSqm: number;
  maxSqm: number;
  buildingAge: 'any' | '0' | '1-5' | '5-10' | '10+';
  floorPreference: 'any' | 'ground_garden' | 'middle' | 'top_penthouse' | 'detached';
  maxTotalFloors: 'any' | '2-3' | '4-6' | '7+';
  // İş Yeri / Ticari Özel Metrikler:
  commercialUsage?: 'any' | 'empty' | 'tenant' | 'devren';
  commercialLocationType?: 'any' | 'main_road' | 'corner' | 'industrial' | 'plaza';
  // Arsa / Arazi Özel Metrikler:
  landZoning?: string[]; // ['Konut İmarlı', 'Ticari İmarlı', 'Turizm İmarlı', 'Tarla / Tarım', ...]
  landKaks?: 'any' | '20-35' | '50-90' | '100+';
  landGabari?: 'any' | '2_floors' | '3_4_floors' | '5_plus_floors';

  // ADIM 5: KKTC Hukuki Durumu ve Donanım
  kocanTypes: string[]; // ['Türk Koçanı', 'Eşdeğer Koçan', 'Tahsis Koçan'] veya boş = Fark Etmez
  furnishedPreference: 'any' | 'full' | 'partial' | 'unfurnished';
  mustHaves: string[]; // ['sea_view', 'pool', 'parking', 'elevator', 'pet_friendly', ...]

  // ADIM 6: Müşteri Profili ve Aciliyet (Lead Pipeline Verisi)
  customerName: string;
  customerPhone: string;
  urgency: 'any' | 'immediate' | '1_3_months' | 'investment_no_rush';
  clientLocationStatus: 'cyprus_resident' | 'abroad_online_tour' | 'corporate';
  sourceType: 'internal_agent' | 'external_partner';
  internalAgentName: string;
  externalPartnerName?: string;
  externalPartnerPhone?: string;
  externalPartnerShare?: number;
}

export interface LeadRevisionEntry {
  id: string;
  timestamp: string;
  actor: string;
  summary: string;
  stage: string;
  budgetSummary: string;
}

export interface ParsedLeadCriteria {
  intent?: 'rent' | 'sale' | 'investment' | 'any';
  mainType?: 'residence' | 'commercial' | 'land' | 'any';
  locations: string[];
  propertyTypes: string[];
  maxBudget?: number;
  minBudget?: number;
  budgetTolerancePercent?: number;
  currency?: string;
  roomCounts: string[];
  minSqm?: number;
  maxSqm?: number;
  furnished?: 'any' | 'full' | 'partial' | 'unfurnished';
  maxBuildingAge?: number;
  preferredFloor?: 'any' | 'ground_garden' | 'middle' | 'top_penthouse' | 'detached';
  maxTotalFloors?: number;
  kocanTypes?: string[];
  mustHaves?: string[];
  locationTolerance?: 'strict' | 'nearby_10km' | 'district_wide';
  landZoning?: string[];
  landKaks?: string;
  commercialUsage?: string;
  trafoKdvPreference?: string;
  keywords: string[];
}

export interface MatchScoreBreakdown {
  locationScore: number;     // max 30
  intentScore: number;       // max 20
  budgetScore: number;       // max 25 (with fuzzy tolerance)
  typeAndRoomScore: number;  // max 15
  featuresScore: number;     // max 10
}

export interface MatchResult {
  score: number; // 0 - 100
  tier: 'high' | 'medium' | 'low'; // >=75% high, >=60% medium, <60% low
  breakdown: MatchScoreBreakdown;
  reasons: string[];
  tolerancesApplied: string[];
  dealId?: string | number;
  dealTitle?: string;
  customerName?: string;
  propertyId?: number;
  propertyTitle?: string;
  propertyRef?: string;
  propertyPrice?: number;
  propertyCurrency?: string;
}

const COMMON_LOCATIONS = [
  'karaoğlanoğlu', 'karaoglanoglu', 'girne', 'alsancak', 'lapta', 'çatalköy', 'catalkoy',
  'bellapais', 'ozanköy', 'ozankoy', 'edremit', 'karmi', 'zeytinlik', 'doğanköy', 'dogankoy',
  'karakum', 'karşıyaka', 'karsiyaka', 'esentepe', 'bahçeli', 'bahceli', 'dikmen', 'taşkent',
  'lefkoşa', 'lefkosa', 'gönyeli', 'gonyeli', 'küçük kaymaklı', 'kucuk kaymakli', 'hamitköy',
  'dereboyu', 'ortaköy', 'yenikent', 'yenişehir', 'metehan', 'kızılbaş', 'alayköy', 'haspolat',
  'mağusa', 'magusa', 'gazimağusa', 'iskele', 'long beach', 'boğaz', 'ötüken', 'otuken',
  'bafra', 'yeniboğaziçi', 'yeni boğaziçi', 'tuzla', 'tatlısu', 'güzelyurt', 'lefke', 'gaziveren', 'gemikonağı'
];

// Approximate FX rates to GBP for cross-currency comparison in KKTC
const FX_TO_GBP: Record<string, number> = {
  GBP: 1,
  EUR: 0.85,
  USD: 0.79,
  TRY: 0.023
};

export function convertCurrency(amount: number, fromCurr: string = 'GBP', toCurr: string = 'GBP'): number {
  const from = (fromCurr || 'GBP').toUpperCase();
  const to = (toCurr || 'GBP').toUpperCase();
  if (from === to) return amount;
  const inGbp = amount * (FX_TO_GBP[from] || 1);
  const targetRate = FX_TO_GBP[to] || 1;
  return Math.round(inGbp / targetRate);
}

/**
 * Intelligent parser that merges structured 6-Step Funnel Criteria (`deal.criteria`)
 * with fallback NLP extraction from unstructured text (`title`, `description`, `budget`).
 */
export function parseLeadCriteria(deal: {
  title?: string;
  description?: string;
  budget?: string;
  criteria?: Partial<LeadFunnelCriteria>;
}): ParsedLeadCriteria {
  const c = deal.criteria;
  const fullText = `${deal.title || ''} ${deal.description || ''} ${deal.budget || ''}`.toLowerCase();

  // If structured 6-Step Wizard criteria exist, prioritize them directly
  if (c && (c.intent || c.mainType || (c.cities && c.cities.length > 0) || c.maxBudget)) {
    const locations = [
      ...(c.cities || []).map(x => x.toLowerCase()),
      ...(c.subRegions || []).map(x => x.toLowerCase())
    ];
    const propertyTypes: string[] = [];
    if (c.mainType && c.mainType !== 'any') propertyTypes.push(c.mainType.toLowerCase());
    if (Array.isArray(c.subTypes)) {
      c.subTypes.forEach(st => propertyTypes.push(st.toLowerCase()));
    }

    let maxBuildingAge: number | undefined;
    if (c.buildingAge === '0') maxBuildingAge = 1;
    else if (c.buildingAge === '1-5') maxBuildingAge = 5;
    else if (c.buildingAge === '5-10') maxBuildingAge = 10;

    let maxTotalFloors: number | undefined;
    if (c.maxTotalFloors === '2-3') maxTotalFloors = 3;
    else if (c.maxTotalFloors === '4-6') maxTotalFloors = 6;

    return {
      intent: c.intent || 'any',
      mainType: c.mainType || 'any',
      locations,
      propertyTypes,
      minBudget: c.minBudget && c.minBudget > 0 ? c.minBudget : undefined,
      maxBudget: c.maxBudget && c.maxBudget > 0 ? c.maxBudget : undefined,
      budgetTolerancePercent: c.budgetTolerance ?? 10,
      currency: c.currency || 'GBP',
      roomCounts: Array.isArray(c.roomCounts) ? c.roomCounts : [],
      minSqm: c.minSqm && c.minSqm > 0 ? c.minSqm : undefined,
      maxSqm: c.maxSqm && c.maxSqm > 0 ? c.maxSqm : undefined,
      furnished: c.furnishedPreference || 'any',
      maxBuildingAge,
      preferredFloor: c.floorPreference || 'any',
      maxTotalFloors,
      kocanTypes: Array.isArray(c.kocanTypes) ? c.kocanTypes : [],
      mustHaves: Array.isArray(c.mustHaves) ? c.mustHaves : [],
      locationTolerance: c.locationTolerance || 'nearby_10km',
      landZoning: Array.isArray(c.landZoning) ? c.landZoning : [],
      landKaks: c.landKaks || 'any',
      commercialUsage: c.commercialUsage || 'any',
      trafoKdvPreference: c.trafoKdvPreference || 'any',
      keywords: fullText.split(/\s+/).filter(w => w.length > 3)
    };
  }

  // Fallback NLP Parser for legacy or quick text leads
  let intent: ParsedLeadCriteria['intent'] = 'any';
  const isRent = /kiralık|kiralik|kira|rent|aylık|aylik/i.test(fullText);
  const isSale = /satılık|satilik|satın|satin|sale|yatırım|yatirim|almak|alım|alim/i.test(fullText);
  if (isRent && !isSale) intent = 'rent';
  else if (isSale && !isRent) intent = 'sale';

  const locations: string[] = [];
  for (const loc of COMMON_LOCATIONS) {
    if (fullText.includes(loc)) {
      locations.push(loc);
    }
  }

  let mainType: ParsedLeadCriteria['mainType'] = 'any';
  const propertyTypes: string[] = [];
  if (/dükkan|dukkan|mağaza|magaza|işyeri|isyeri|ticari|ofis|depo/i.test(fullText)) {
    mainType = 'commercial';
    propertyTypes.push('commercial', 'dükkan', 'ofis');
  }
  if (/arsa|tarla|parsel|arazi|imarlı/i.test(fullText)) {
    mainType = 'land';
    propertyTypes.push('land', 'arsa');
  }
  if (/villa|müstakil|mustakil|malikane|daire|apartman|rezidans|flat|konut|penthouse|stüdyo|studyo/i.test(fullText)) {
    mainType = 'residence';
    if (/villa|müstakil|mustakil/i.test(fullText)) propertyTypes.push('villa', 'residence');
    if (/daire|apartman|rezidans|flat|konut/i.test(fullText)) propertyTypes.push('daire', 'residence');
    if (/penthouse/i.test(fullText)) propertyTypes.push('penthouse');
  }

  const roomCounts: string[] = [];
  const roomRegex = /(\d\s*\+\s*\d|stüdyo|studyo|1\s*oda)/gi;
  let match;
  while ((match = roomRegex.exec(fullText)) !== null) {
    const normalized = match[0].replace(/\s+/g, '').replace('studyo', 'stüdyo');
    if (!roomCounts.includes(normalized)) roomCounts.push(normalized);
  }

  let maxBudget: number | undefined;
  let currency: string | undefined;

  if (/gbp|£|sterlin/i.test(fullText)) currency = 'GBP';
  else if (/eur|€|euro/i.test(fullText)) currency = 'EUR';
  else if (/usd|\$|dolar/i.test(fullText)) currency = 'USD';
  else if (/tl|₺|try/i.test(fullText)) currency = 'TRY';

  const budgetMatch = (deal.budget || '').replace(/[,.]/g, '').match(/\d+/g);
  if (budgetMatch && budgetMatch.length > 0) {
    // Take the largest number as maxBudget if range is given in text like "£100,000 - £150,000"
    const nums = budgetMatch.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    if (nums.length > 0) maxBudget = Math.max(...nums);
  } else {
    const binMatch = fullText.match(/(\d+)\s*bin/);
    if (binMatch) {
      maxBudget = parseInt(binMatch[1], 10) * 1000;
    } else {
      const kadarMatch = fullText.match(/(\d+)\s*(?:birim|gbp|£|tl|€|\$)?\s*(?:kadar|bütçe|butce)/);
      if (kadarMatch) {
        maxBudget = parseInt(kadarMatch[1], 10);
      }
    }
  }

  let furnished: ParsedLeadCriteria['furnished'] = 'any';
  if (/eşyalı|esyali|mobilyalı|mobilyali/i.test(fullText) && !/eşyasız|esyasiz/i.test(fullText)) {
    furnished = 'full';
  } else if (/eşyasız|esyasiz|boş/i.test(fullText)) {
    furnished = 'unfurnished';
  }

  let maxBuildingAge: number | undefined;
  const ageMatch = fullText.match(/(?:0\s*ile|0\s*-)?\s*(\d+)\s*(?:yıl|yil|yaş|yas)/i);
  if (ageMatch) {
    maxBuildingAge = parseInt(ageMatch[1], 10);
  } else if (/sıfır bina|sifir bina|yeni bina|projeden/i.test(fullText)) {
    maxBuildingAge = 1;
  }

  let preferredFloor: ParsedLeadCriteria['preferredFloor'] = 'any';
  if (/ara kat|arakat/i.test(fullText)) preferredFloor = 'middle';
  else if (/bahçe katı|bahce kati|bahçeli|zemin/i.test(fullText)) preferredFloor = 'ground_garden';
  else if (/en üst|en ust|çatı|cati|penthouse/i.test(fullText)) preferredFloor = 'top_penthouse';

  let maxTotalFloors: number | undefined;
  const totalFloorMatch = fullText.match(/maksimum\s*(\d+)\s*kat|en çok\s*(\d+)\s*kat|max\s*(\d+)\s*kat/i);
  if (totalFloorMatch) {
    maxTotalFloors = parseInt(totalFloorMatch[1] || totalFloorMatch[2] || totalFloorMatch[3], 10);
  }

  return {
    intent,
    mainType,
    locations,
    propertyTypes,
    maxBudget,
    budgetTolerancePercent: 10,
    currency,
    roomCounts,
    furnished,
    maxBuildingAge,
    preferredFloor,
    maxTotalFloors,
    locationTolerance: 'nearby_10km',
    keywords: fullText.split(/\s+/).filter(w => w.length > 3)
  };
}

/**
 * Calculates weighted match score between a CRM Lead / Demand and a Real Estate Property
 */
export function calculateMatchScore(
  property: RealEstateProperty | any,
  deal: { id?: string | number; title?: string; description?: string; budget?: string; agent_name?: string; criteria?: Partial<LeadFunnelCriteria> }
): MatchResult {
  const criteria = parseLeadCriteria(deal);
  const reasons: string[] = [];
  const tolerancesApplied: string[] = [];

  const sec = typeof property.sector_data === 'object' && property.sector_data ? property.sector_data : {};
  const propText = `${property.title || ''} ${property.description || ''} ${property.location || ''} ${property.kktc_region || ''} ${property.kktc_sub_region || ''} ${property.address || ''} ${property.subtype || ''} ${property.type || ''}`.toLowerCase();
  const propIntent = (property.listing_intent || sec.listing_intent || (property.status === 'rent' || /kiralık|kiralik/i.test(propText) ? 'rent' : 'sale'));
  const propMainType: 'residence' | 'commercial' | 'land' =
    property.type === 'land' || /arsa|tarla|parsel|arazi/i.test(`${property.type || ''} ${property.subtype || ''}`)
      ? 'land'
      : property.type === 'commercial' || /ticari|dükkan|ofis|mağaza|depo/i.test(`${property.type || ''} ${property.subtype || ''}`)
      ? 'commercial'
      : 'residence';

  const propPriceRaw = Number(property.price) || 0;
  const propCurrency = (property.currency || 'GBP').toUpperCase();
  const leadCurrency = (criteria.currency || propCurrency).toUpperCase();
  const propPriceInLeadCurr = convertCurrency(propPriceRaw, propCurrency, leadCurrency);

  // ----------------------------------------------------
  // 1. LOCATION SCORING (Weight: 30 points)
  // ----------------------------------------------------
  let locationScore = 0;
  if (criteria.locations.length === 0) {
    locationScore = 24;
    reasons.push('Lokasyon: Tüm KKTC / Fark Etmez (+24)');
  } else {
    let matchedLoc = '';
    for (const loc of criteria.locations) {
      if (propText.includes(loc.toLowerCase())) {
        matchedLoc = loc;
        break;
      }
    }

    if (matchedLoc) {
      locationScore = 30;
      reasons.push(`Lokasyon tam eşleşti: "${matchedLoc.toUpperCase()}" (+30)`);
    } else if (criteria.locationTolerance !== 'strict') {
      // Check Haversine Geo Distance (±10km) or same District match
      let minGeoKm = 999;
      const propCoordsKey = Object.keys(DISTRICT_COORDINATES).find(k => propText.includes(k));
      if (propCoordsKey) {
        const pCoord = DISTRICT_COORDINATES[propCoordsKey];
        for (const loc of criteria.locations) {
          const lKey = Object.keys(DISTRICT_COORDINATES).find(k => loc.toLowerCase().includes(k));
          if (lKey) {
            const dKm = calculateGeoDistanceKm(pCoord.lat, pCoord.lng, DISTRICT_COORDINATES[lKey].lat, DISTRICT_COORDINATES[lKey].lng);
            if (dKm < minGeoKm) minGeoKm = dKm;
          }
        }
      }

      if (minGeoKm <= 12) {
        locationScore = 24;
        tolerancesApplied.push(`Yakın Çevre (±${minGeoKm} km)`);
        reasons.push(`Yakın çevre lokasyon toleransı (±${minGeoKm} km mesafede) (+24)`);
      } else {
        const isGirneArea = /girne|karaoğlanoğlu|alsancak|çatalköy|bellapais|ozanköy|lapta|edremit|doğanköy|karakum|esentepe|bahçeli|zeytinlik/i.test(propText);
        const wantedGirne = criteria.locations.some(l => /girne|karaoğlanoğlu|alsancak|çatalköy|bellapais|ozanköy|lapta|edremit|doğanköy|karakum|esentepe/i.test(l));
        const isLefkosaArea = /lefkoşa|lefkosa|gönyeli|küçük kaymaklı|ortaköy|hamitköy|yenikent|dereboyu|metehan/i.test(propText);
        const wantedLefkosa = criteria.locations.some(l => /lefkoşa|lefkosa|gönyeli|küçük kaymaklı|ortaköy|hamitköy|yenikent|dereboyu/i.test(l));
        const isIskeleMagusa = /iskele|long beach|boğaz|ötüken|bafra|mağusa|gazimağusa|yeniboğaziçi|tuzla/i.test(propText);
        const wantedIskeleMagusa = criteria.locations.some(l => /iskele|long beach|boğaz|ötüken|bafra|mağusa|gazimağusa|yeniboğaziçi/i.test(l));

        if ((isGirneArea && wantedGirne) || (isLefkosaArea && wantedLefkosa) || (isIskeleMagusa && wantedIskeleMagusa)) {
          locationScore = 22;
          tolerancesApplied.push('Aynı İlçe / Çevre Semt');
          reasons.push('İlçe / çevre semt lokasyon uyumu (+22)');
        } else {
          locationScore = 0;
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. INTENT / TRANSACTION TYPE SCORING (Weight: 20 points)
  // ----------------------------------------------------
  let intentScore = 0;
  if (!criteria.intent || criteria.intent === 'any') {
    intentScore = 20;
    reasons.push('İşlem türü esnek (Satılık/Kiralık) (+20)');
  } else if (criteria.intent === 'investment') {
    if (propIntent === 'sale') {
      intentScore = 20;
      reasons.push('Yatırımlık (Al-Sat / Kira Getirili) satılık portföy uyumu (+20)');
    } else {
      intentScore = 5;
    }
  } else if (criteria.intent === propIntent) {
    intentScore = 20;
    reasons.push(propIntent === 'rent' ? 'Kiralık işlem türü tam eşleşti (+20)' : 'Satılık işlem türü tam eşleşti (+20)');
  } else {
    intentScore = 0;
  }

  // ----------------------------------------------------
  // 3. BUDGET & FUZZY LOGIC TOLERANCE SCORING (Weight: 25 points)
  // ----------------------------------------------------
  let budgetScore = 0;
  if (!criteria.maxBudget || criteria.maxBudget <= 0) {
    budgetScore = 22;
    reasons.push('Bütçe: Esnek / Fark Etmez (+22)');
  } else {
    const maxB = criteria.maxBudget;
    const minB = criteria.minBudget || 0;
    const allowedTol = criteria.budgetTolerancePercent ?? 10;

    if (propPriceInLeadCurr >= minB * 0.85 && propPriceInLeadCurr <= maxB) {
      budgetScore = 25;
      reasons.push(`Fiyat bütçe aralığında: ${propPriceRaw.toLocaleString('tr-TR')} ${propCurrency} (+25)`);
    } else if (propPriceInLeadCurr < minB * 0.85) {
      budgetScore = 18;
      reasons.push(`Fiyat minimum bütçenin altında (Fırsat adayı) (+18)`);
    } else if (propPriceInLeadCurr <= maxB * 1.05 && allowedTol >= 5) {
      budgetScore = 23;
      tolerancesApplied.push('%5 bütçe esnemesi');
      reasons.push(`Fiyat bütçenin %5 tolerans sınırında (+23)`);
    } else if (propPriceInLeadCurr <= maxB * 1.10 && allowedTol >= 10) {
      budgetScore = 19;
      tolerancesApplied.push('%10 bütçe esnemesi');
      reasons.push(`Fiyat bütçenin %10 pazarlık sınırında (+19)`);
    } else if (propPriceInLeadCurr <= maxB * 1.15 && allowedTol >= 15) {
      budgetScore = 15;
      tolerancesApplied.push('%15 bütçe toleransı');
      reasons.push(`Fiyat bütçenin %15 tolerans sınırında (+15)`);
    } else if (propPriceInLeadCurr <= maxB * 1.12) {
      budgetScore = 12;
      tolerancesApplied.push('Pazarlık payı sınırı');
    } else {
      budgetScore = 0;
    }
  }

  // ----------------------------------------------------
  // 4. PROPERTY TYPE, SUBTYPE, ROOMS & SQM SCORING (Weight: 15 points)
  // ----------------------------------------------------
  let typeAndRoomScore = 0;
  let mainTypeFatalMismatch = false;

  if (criteria.mainType && criteria.mainType !== 'any') {
    if (criteria.mainType === propMainType) {
      typeAndRoomScore += 6;
      reasons.push(
        propMainType === 'land'
          ? 'Kategori: Arsa / Arazi uyumlu (+6)'
          : propMainType === 'commercial'
          ? 'Kategori: İş Yeri / Ticari uyumlu (+6)'
          : 'Kategori: Konut uyumlu (+6)'
      );
    } else {
      mainTypeFatalMismatch = true;
    }
  } else {
    typeAndRoomScore += 5;
  }

  // Subtype match (max 3 points)
  if (criteria.propertyTypes.length > 0) {
    const matchedSub = criteria.propertyTypes.some(t =>
      propText.includes(t) ||
      (property.subtype || '').toLowerCase().includes(t) ||
      (property.type || '').toLowerCase().includes(t)
    );
    if (matchedSub) {
      typeAndRoomScore += 3;
    } else {
      typeAndRoomScore += 1;
    }
  } else {
    typeAndRoomScore += 3;
  }

  // Type-specific metric check (Rooms for Residence, Usage for Commercial, Zoning for Land) (max 6 points)
  if (propMainType === 'residence') {
    const propRooms = (property.room_count || '').replace(/\s+/g, '').toLowerCase();
    if (!criteria.roomCounts || criteria.roomCounts.length === 0) {
      typeAndRoomScore += 4;
    } else {
      const exactRoom = criteria.roomCounts.some(r => {
        const cleanR = r.replace(/\s+/g, '').toLowerCase();
        if (cleanR.includes('studio') || cleanR.includes('1+0')) {
          return propRooms.includes('1+0') || propRooms.includes('stüdyo') || propRooms.includes('studyo') || propText.includes('stüdyo');
        }
        return propRooms.includes(cleanR) || propText.includes(cleanR);
      });
      if (exactRoom) {
        typeAndRoomScore += 4;
        reasons.push(`Oda sayısı uyumlu: ${property.room_count || criteria.roomCounts.join(', ')} (+4)`);
      } else {
        typeAndRoomScore += 1;
        tolerancesApplied.push('Alternatif oda sayısı');
      }
    }
  } else if (propMainType === 'commercial') {
    const devir = property.commercial_devir_status || sec.commercial_devir_status || 'empty';
    if (!criteria.commercialUsage || criteria.commercialUsage === 'any' || criteria.commercialUsage === devir) {
      typeAndRoomScore += 4;
      reasons.push('Ticari kullanım/devir durumu uygun (+4)');
    } else {
      typeAndRoomScore += 2;
    }
  } else if (propMainType === 'land') {
    const imar = (property.imar_durumu || sec.imar_durumu || '').toLowerCase();
    if (!criteria.landZoning || criteria.landZoning.length === 0) {
      typeAndRoomScore += 4;
    } else if (criteria.landZoning.some(z => imar.includes(z.toLowerCase()) || propText.includes(z.toLowerCase()))) {
      typeAndRoomScore += 4;
      reasons.push('Arsa imar durumu uyumlu (+4)');
    } else {
      typeAndRoomScore += 2;
    }
  }

  // Sqm Range Check (2 points)
  const propSqm = Number(property.square_meters || property.sqm_gross || sec.square_meters || 0);
  if (propSqm > 0 && (criteria.minSqm || criteria.maxSqm)) {
    const minS = (criteria.minSqm || 0) * 0.85;
    const maxS = (criteria.maxSqm || 999999) * 1.15;
    if (propSqm >= minS && propSqm <= maxS) {
      typeAndRoomScore += 2;
      reasons.push(`Alan uygun: ${propSqm} m² (+2)`);
    }
  } else {
    typeAndRoomScore += 2;
  }

  typeAndRoomScore = Math.min(15, typeAndRoomScore);

  // ----------------------------------------------------
  // 5. KKTC LEGAL (KOÇAN) & HARDWARE FEATURES SCORING (Weight: 10 points)
  // ----------------------------------------------------
  let featuresScore = 0;

  // Koçan / Title Deed check (4 points)
  const propKocan = (property.kktc_title_type || sec.kktc_title_type || '').toLowerCase();
  if (!criteria.kocanTypes || criteria.kocanTypes.length === 0) {
    featuresScore += 4;
  } else if (criteria.kocanTypes.some(k => propKocan.includes(k.toLowerCase()) || propText.includes(k.toLowerCase()))) {
    featuresScore += 4;
    reasons.push(`Koçan tipi uygun: ${property.kktc_title_type || criteria.kocanTypes[0]} (+4)`);
  } else {
    featuresScore += 1;
  }

  // Furnished check for residence/commercial (3 points)
  if (propMainType !== 'land') {
    if (!criteria.furnished || criteria.furnished === 'any') {
      featuresScore += 3;
    } else {
      const isPropFurnished = Boolean(
        property.furnished === true ||
        property.furnished === 'true' ||
        property.furnished === 'esyali' ||
        /eşyalı|esyali/i.test(propText)
      );
      if ((criteria.furnished === 'full' || criteria.furnished === 'partial') && isPropFurnished) {
        featuresScore += 3;
        reasons.push('Eşyalı donanım tercihi karşılandı (+3)');
      } else if (criteria.furnished === 'unfurnished' && !isPropFurnished) {
        featuresScore += 3;
        reasons.push('Eşyasız donanım tercihi karşılandı (+3)');
      } else {
        featuresScore += 1;
      }
    }
  } else {
    featuresScore += 3;
  }

  // Must-Haves & Floor/Age check (3 points)
  if (criteria.mustHaves && criteria.mustHaves.length > 0) {
    let matchedMustHaves = 0;
    for (const mh of criteria.mustHaves) {
      if (mh === 'sea_view' && /deniz|sea|sahil|beach/i.test(propText)) matchedMustHaves++;
      else if (mh === 'pool' && (property.in_gated_community || /havuz|pool/i.test(propText))) matchedMustHaves++;
      else if (mh === 'parking' && (property.has_parking || sec.has_parking || /otopark|garaj/i.test(propText))) matchedMustHaves++;
      else if (mh === 'elevator' && (property.has_elevator || sec.has_elevator || /asansör|asansor/i.test(propText))) matchedMustHaves++;
      else if (mh === 'gated_community' && (property.in_gated_community || /site içi|site ici|güvenlik/i.test(propText))) matchedMustHaves++;
      else if (mh === 'roof_terrace' && (property.cati_terasi || /teras|penthouse/i.test(propText))) matchedMustHaves++;
      else if (mh === 'main_road' && (property.is_main_road_frontage || sec.is_main_road_frontage || /cadde|anayol|bulvar/i.test(propText))) matchedMustHaves++;
      else if (mh === 'chimney' && (property.has_chimney || sec.has_chimney || /baca/i.test(propText))) matchedMustHaves++;
      else if (mh === 'cadastre_road' && (sec.yol_var || /yol/i.test(propText))) matchedMustHaves++;
      else if (mh === 'electricity_water' && (sec.elektrik_var || sec.su_var || /altyapı|elektrik/i.test(propText))) matchedMustHaves++;
      else matchedMustHaves += 0.5;
    }
    const ratio = Math.min(1, matchedMustHaves / criteria.mustHaves.length);
    featuresScore += Math.round(ratio * 3);
  } else {
    featuresScore += 3;
  }

  featuresScore = Math.min(10, featuresScore);

  // ----------------------------------------------------
  // TOTAL WEIGHTED SCORE CALCULATION
  // ----------------------------------------------------
  let totalScore = locationScore + intentScore + budgetScore + typeAndRoomScore + featuresScore;

  // Fatal mismatch guards (Intent mismatch or Main Category mismatch e.g. Land vs Residence)
  if (criteria.intent && criteria.intent !== 'any' && criteria.intent !== 'investment' && criteria.intent !== propIntent) {
    totalScore = Math.min(30, Math.round(totalScore * 0.35));
  }
  if (mainTypeFatalMismatch) {
    totalScore = Math.min(35, Math.round(totalScore * 0.4));
  }

  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  const tier: MatchResult['tier'] = totalScore >= 75 ? 'high' : totalScore >= 60 ? 'medium' : 'low';

  return {
    score: totalScore,
    tier,
    breakdown: {
      locationScore,
      intentScore,
      budgetScore,
      typeAndRoomScore,
      featuresScore
    },
    reasons,
    tolerancesApplied,
    dealId: deal.id,
    dealTitle: deal.title,
    customerName: deal.criteria?.customerName || extractCustomerName(deal.title || ''),
    propertyId: property.id,
    propertyTitle: property.title,
    propertyRef: property.reference_no,
    propertyPrice: propPriceRaw,
    propertyCurrency: propCurrency
  };
}

/**
 * Extracts human name from deal title (e.g. "Talebi (Ahmet Yılmaz)")
 */
function extractCustomerName(title: string): string {
  const match = title.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1].trim();
  return title;
}

/**
 * Finds and sorts all matching leads for a given property
 */
export function findMatchingLeadsForProperty(
  property: RealEstateProperty | any,
  deals: any[],
  minScore = 55
): MatchResult[] {
  if (!property || !Array.isArray(deals)) return [];

  return deals
    .map(deal => calculateMatchScore(property, deal))
    .filter(res => res.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Finds and sorts all matching properties for a given CRM lead
 */
export function findMatchingPropertiesForLead(
  deal: any,
  properties: RealEstateProperty[] | any[],
  minScore = 55
): MatchResult[] {
  if (!deal || !Array.isArray(properties)) return [];

  return properties
    .map(prop => calculateMatchScore(prop, deal))
    .filter(res => res.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * #1. RE-ENGAGEMENT ENGINE (Fiyat İndirimi & Soğuk Talep Uyandırma Motoru)
 */
export interface ReEngagementOpportunity {
  deal: any;
  property: RealEstateProperty | any;
  previousPrice: number;
  newPrice: number;
  discountAmount: number;
  discountPercent: number;
  previousMatchScore: number;
  newMatchScore: number;
  customerName: string;
  whatsappMessage: string;
}

export function findReEngagementOpportunities(
  property: RealEstateProperty | any,
  deals: any[],
  previousPrice?: number
): ReEngagementOpportunity[] {
  const currentPrice = Number(property.price) || 0;
  const prevP = Number(previousPrice || property.sector_data?.previous_price || property.cost_price || currentPrice);
  if (prevP <= currentPrice) return [];

  const discountAmount = prevP - currentPrice;
  const discountPercent = Math.round((discountAmount / prevP) * 100);
  const currency = property.currency || 'GBP';

  const opportunities: ReEngagementOpportunity[] = [];

  for (const deal of deals) {
    const isLostOrCold = deal.stage === '4. Olumsuz' || deal.stage === 'Kapandı/İptal' || deal.stage === 'Olumsuz' || deal.stage === 'Görüşme / Analiz' || deal.stage === 'analysis';
    const criteria = parseLeadCriteria(deal);
    
    const hadBudgetIssue = criteria.maxBudget && prevP > criteria.maxBudget;
    const fitsNow = !criteria.maxBudget || currentPrice <= criteria.maxBudget * 1.10;

    const fakePrevProp = { ...property, price: prevP };
    const prevScore = calculateMatchScore(fakePrevProp, deal);
    const newScore = calculateMatchScore(property, deal);

    if ((isLostOrCold || hadBudgetIssue || fitsNow || newScore.score >= 70) && newScore.score > prevScore.score) {
      const custName = deal.criteria?.customerName || extractCustomerName(deal.title || '');
      const ref = property.reference_no || 'REF';
      const msg = `Merhaba Sn. *${custName}*,

Daha önce ilgilendiğiniz *${property.title}* [REF: ${ref}] portföyümüzde mülk sahibi tarafından *%${discountPercent} (${discountAmount.toLocaleString('tr-TR')} ${currency}) fiyat indirimi* gerçekleşti.

💰 *Eski Fiyat:* ~${prevP.toLocaleString('tr-TR')} ${currency}~
🔥 *Yeni Güncel Fiyat:* *${currentPrice.toLocaleString('tr-TR')} ${currency}*
📍 *Konum:* ${property.location || 'KKTC'}

Aradığınız bütçe kriterlerine artık tam uyum sağlayan bu mülkü yeniden değerlendirmek ve yerinde inceleme randevusu planlamak için lütfen yanıtlayınız.
_LookPrice Portföy & Fırsat Takip Merkezi_`;

      opportunities.push({
        deal,
        property,
        previousPrice: prevP,
        newPrice: currentPrice,
        discountAmount,
        discountPercent,
        previousMatchScore: prevScore.score,
        newMatchScore: newScore.score,
        customerName: custName,
        whatsappMessage: msg
      });
    }
  }

  return opportunities.sort((a, b) => b.newMatchScore - a.newMatchScore);
}

/**
 * #3. GEOSPATIAL & COORDINATE RADIUS MAPPING
 */
export const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  girne: { lat: 35.3382, lng: 33.3186 },
  alsancak: { lat: 35.3486, lng: 33.2086 },
  karaoglanoglu: { lat: 35.3512, lng: 33.2750 },
  karaoğlanoğlu: { lat: 35.3512, lng: 33.2750 },
  catalkoy: { lat: 35.3195, lng: 33.4012 },
  çatalköy: { lat: 35.3195, lng: 33.4012 },
  bellapais: { lat: 35.3056, lng: 33.3556 },
  ozankoy: { lat: 35.3256, lng: 33.3592 },
  ozanköy: { lat: 35.3256, lng: 33.3592 },
  lapta: { lat: 35.3400, lng: 33.1600 },
  esentepe: { lat: 35.3422, lng: 33.5786 },
  lefkosa: { lat: 35.1856, lng: 33.3823 },
  lefkoşa: { lat: 35.1856, lng: 33.3823 },
  gonyeli: { lat: 35.2167, lng: 33.3167 },
  gönyeli: { lat: 35.2167, lng: 33.3167 },
  'küçük kaymaklı': { lat: 35.1980, lng: 33.3650 },
  ortaköy: { lat: 35.1972, lng: 33.3465 },
  yenikent: { lat: 35.2050, lng: 33.3300 },
  magusa: { lat: 35.1250, lng: 33.9417 },
  gazimagusa: { lat: 35.1250, lng: 33.9417 },
  gazimağusa: { lat: 35.1250, lng: 33.9417 },
  yeniboğaziçi: { lat: 35.1979, lng: 33.8966 },
  iskele: { lat: 35.2892, lng: 33.8906 },
  'long beach': { lat: 35.2650, lng: 33.9100 },
  boğaz: { lat: 35.2950, lng: 33.9450 },
  ötüken: { lat: 35.2104, lng: 33.8943 },
  bafra: { lat: 35.3564, lng: 34.0044 },
  guzelyurt: { lat: 35.1989, lng: 32.9936 },
  güzelyurt: { lat: 35.1989, lng: 32.9936 },
  lefke: { lat: 35.1119, lng: 32.8494 },
  gaziveren: { lat: 35.1450, lng: 32.8550 }
};

export function calculateGeoDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}

/**
 * #4. SLA & STAGNATION (Süreç Tıkanıklık Analizi)
 */
export interface SLAStatus {
  isStagnant: boolean;
  daysInStage: number;
  lastActivityDate: Date;
  slaWarning: string;
}

export function calculateSLAStatus(dealOrProp: any, maxDaysThreshold = 7): SLAStatus {
  const now = new Date().getTime();
  const dateStr = dealOrProp.updated_at || dealOrProp.created_at || dealOrProp.due_date;
  const actDate = dateStr ? new Date(dateStr) : new Date(now - 8 * 86400000);
  const diffDays = Math.max(0, Math.floor((now - actDate.getTime()) / (1000 * 60 * 60 * 24)));

  const isStagnant = diffDays >= maxDaysThreshold;
  return {
    isStagnant,
    daysInStage: diffDays,
    lastActivityDate: actDate,
    slaWarning: isStagnant ? `⚠️ ${diffDays} gündür hareketsiz (SLA Tıkanıklık Alarmı)` : `${diffDays} gündür bu aşamada`
  };
}

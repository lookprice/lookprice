/**
 * Real Estate Smart Matchmaking Engine (Akıllı Eşleşme Motoru)
 * Weighted Scoring Algorithm & Fuzzy Logic for Portfolios vs CRM Leads/Demands
 */

import { RealEstateProperty } from '../types';

export interface ParsedLeadCriteria {
  intent?: 'rent' | 'sale' | 'any';
  locations: string[];
  propertyTypes: string[];
  maxBudget?: number;
  minBudget?: number;
  currency?: string;
  roomCounts: string[];
  furnished?: boolean;
  maxBuildingAge?: number;
  minBuildingAge?: number;
  preferredFloor?: 'ara_kat' | 'bahce' | 'zemin' | 'en_ust' | 'penthouse';
  maxTotalFloors?: number;
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
  'lefkoşa', 'lefkosa', 'gönyeli', 'gonyeli', 'küçük kaymaklı', 'kucuk kaymakli', 'hamitköy',
  'dereboyu', 'ortaköy', 'mağusa', 'magusa', 'gazimağusa', 'iskele', 'long beach', 'boğaz',
  'bafra', 'yeniboğaziçi', 'güzelyurt', 'lefke'
];

/**
 * Intelligent parser that extracts structured criteria from unstructured lead/demand text
 */
export function parseLeadCriteria(deal: {
  title?: string;
  description?: string;
  budget?: string;
}): ParsedLeadCriteria {
  const fullText = `${deal.title || ''} ${deal.description || ''} ${deal.budget || ''}`.toLowerCase();

  // 1. Intent Detection
  let intent: 'rent' | 'sale' | 'any' = 'any';
  const isRent = /kiralık|kiralik|kira|rent|aylık|aylik/i.test(fullText);
  const isSale = /satılık|satilik|satın|satin|sale|yatırım|yatirim|almak|alım|alim/i.test(fullText);
  if (isRent && !isSale) intent = 'rent';
  else if (isSale && !isRent) intent = 'sale';
  else if (isRent && isSale) intent = 'any';

  // 2. Location Detection
  const locations: string[] = [];
  for (const loc of COMMON_LOCATIONS) {
    if (fullText.includes(loc)) {
      locations.push(loc);
    }
  }

  // 3. Property Type Detection
  const propertyTypes: string[] = [];
  if (/dükkan|dukkan|mağaza|magaza|işyeri|isyeri|ticari/i.test(fullText)) propertyTypes.push('commercial', 'dükkan');
  if (/villa|müstakil|mustakil|malikane/i.test(fullText)) propertyTypes.push('villa', 'residence');
  if (/daire|apartman|rezidans|flat|konut/i.test(fullText)) propertyTypes.push('daire', 'residence');
  if (/arsa|tarla|parsel|arazi/i.test(fullText)) propertyTypes.push('land', 'arsa');
  if (/penthouse/i.test(fullText)) propertyTypes.push('penthouse');

  // 4. Room Counts Detection (e.g. 1+1, 2+1, 3+1, 4+1, stüdyo)
  const roomCounts: string[] = [];
  const roomRegex = /(\d\s*\+\s*\d|stüdyo|studyo|1\s*oda)/gi;
  let match;
  while ((match = roomRegex.exec(fullText)) !== null) {
    const normalized = match[0].replace(/\s+/g, '').replace('studyo', 'stüdyo');
    if (!roomCounts.includes(normalized)) roomCounts.push(normalized);
  }

  // 5. Budget Parsing with Currency Extraction
  let maxBudget: number | undefined;
  let currency: string | undefined;

  if (/gbp|£|sterlin/i.test(fullText)) currency = 'GBP';
  else if (/eur|€|euro/i.test(fullText)) currency = 'EUR';
  else if (/usd|\$|dolar/i.test(fullText)) currency = 'USD';
  else if (/tl|₺|try/i.test(fullText)) currency = 'TRY';

  // Parse numbers from budget or description (e.g. "600 birim'e kadar", "£150,000", "150 bin")
  const budgetMatch = (deal.budget || '').replace(/[,.]/g, '').match(/\d+/);
  if (budgetMatch) {
    maxBudget = parseInt(budgetMatch[0], 10);
  } else {
    // Check "150 bin" or "600 kadar"
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

  // 6. Furnished
  let furnished: boolean | undefined;
  if (/eşyalı|esyali|mobilyalı|mobilyali/i.test(fullText) && !/eşyasız|esyasiz/i.test(fullText)) {
    furnished = true;
  } else if (/eşyasız|esyasiz|boş/i.test(fullText)) {
    furnished = false;
  }

  // 7. Building Age (e.g. "0 ile 10 yıl arası", "0-5 yaş", "sıfır bina")
  let maxBuildingAge: number | undefined;
  const ageMatch = fullText.match(/(?:0\s*ile|0\s*-)?\s*(\d+)\s*(?:yıl|yil|yaş|yas)/i);
  if (ageMatch) {
    maxBuildingAge = parseInt(ageMatch[1], 10);
  } else if (/sıfır bina|sifir bina|yeni bina|projeden/i.test(fullText)) {
    maxBuildingAge = 1;
  }

  // 8. Floor Preference & Max Total Floors
  let preferredFloor: ParsedLeadCriteria['preferredFloor'];
  if (/ara kat|arakat/i.test(fullText)) preferredFloor = 'ara_kat';
  else if (/bahçe katı|bahce kati|bahçeli/i.test(fullText)) preferredFloor = 'bahce';
  else if (/zemin/i.test(fullText)) preferredFloor = 'zemin';
  else if (/en üst|en ust|çatı|cati/i.test(fullText)) preferredFloor = 'en_ust';
  else if (/penthouse/i.test(fullText)) preferredFloor = 'penthouse';

  let maxTotalFloors: number | undefined;
  const totalFloorMatch = fullText.match(/maksimum\s*(\d+)\s*kat|en çok\s*(\d+)\s*kat|max\s*(\d+)\s*kat/i);
  if (totalFloorMatch) {
    maxTotalFloors = parseInt(totalFloorMatch[1] || totalFloorMatch[2] || totalFloorMatch[3], 10);
  }

  return {
    intent,
    locations,
    propertyTypes,
    maxBudget,
    currency,
    roomCounts,
    furnished,
    maxBuildingAge,
    preferredFloor,
    maxTotalFloors,
    keywords: fullText.split(/\s+/).filter(w => w.length > 3)
  };
}

/**
 * Calculates weighted match score between a CRM Lead / Demand and a Real Estate Property
 */
export function calculateMatchScore(
  property: RealEstateProperty | any,
  deal: { id?: string | number; title?: string; description?: string; budget?: string; agent_name?: string }
): MatchResult {
  const criteria = parseLeadCriteria(deal);
  const reasons: string[] = [];
  const tolerancesApplied: string[] = [];

  const propText = `${property.title || ''} ${property.description || ''} ${property.location || ''} ${property.address || ''} ${property.subtype || ''} ${property.type || ''}`.toLowerCase();
  const propIntent = (property.listing_intent || (property.status === 'rent' || /kiralık|kiralik/i.test(propText) ? 'rent' : 'sale'));
  const propPrice = Number(property.price) || 0;
  const propCurrency = (property.currency || 'GBP').toUpperCase();

  // ----------------------------------------------------
  // 1. LOCATION SCORING (Weight: 30 points)
  // ----------------------------------------------------
  let locationScore = 0;
  if (criteria.locations.length === 0) {
    // Lead didn't specify a strict location - neutral score
    locationScore = 20;
    reasons.push('Genel bölge talebi (belirli bir lokasyon kısıtlaması yok)');
  } else {
    let matchedLoc = '';
    for (const loc of criteria.locations) {
      if (propText.includes(loc)) {
        matchedLoc = loc;
        break;
      }
    }

    if (matchedLoc) {
      locationScore = 30;
      reasons.push(`Lokasyon tam eşleşti: "${matchedLoc.toUpperCase()}" (+30)`);
    } else {
      // Check district level (e.g. Girne vs Karaoğlanoğlu)
      const isGirneArea = /karaoğlanoğlu|alsancak|çatalköy|bellapais|ozanköy|lapta|edremit|doğanköy/i.test(propText);
      const wantedGirne = criteria.locations.some(l => /girne/i.test(l));
      if (isGirneArea && wantedGirne) {
        locationScore = 22;
        reasons.push('Girne çevre bölgesi lokasyon uyumu (+22)');
      } else {
        locationScore = 0;
        reasons.push('Lokasyon kriteri eşleşmedi (farklı bölge)');
      }
    }
  }

  // ----------------------------------------------------
  // 2. INTENT / TRANSACTION TYPE SCORING (Weight: 20 points)
  // ----------------------------------------------------
  let intentScore = 0;
  if (criteria.intent === 'any') {
    intentScore = 20;
    reasons.push('İşlem türü esnek (Kiralık/Satılık) (+20)');
  } else if (criteria.intent === propIntent) {
    intentScore = 20;
    reasons.push(propIntent === 'rent' ? 'Kiralık işlem türü tam eşleşti (+20)' : 'Satılık işlem türü tam eşleşti (+20)');
  } else {
    // Fatal intent mismatch (e.g. customer wants rent, property is for sale)
    intentScore = 0;
    reasons.push(`İşlem türü uyumsuz (Talep: ${criteria.intent}, Portföy: ${propIntent})`);
  }

  // ----------------------------------------------------
  // 3. BUDGET & FUZZY LOGIC TOLERANCE SCORING (Weight: 25 points)
  // ----------------------------------------------------
  let budgetScore = 0;
  if (!criteria.maxBudget || criteria.maxBudget <= 0) {
    budgetScore = 20; // No strict budget set
    reasons.push('Belirli bütçe sınırı girilmemiş (+20)');
  } else {
    const maxB = criteria.maxBudget;
    if (propPrice <= maxB) {
      budgetScore = 25;
      reasons.push(`Fiyat bütçe dahilinde: ${propPrice.toLocaleString('tr-TR')} ${propCurrency} (Maks: ${maxB.toLocaleString('tr-TR')}) (+25)`);
    } else if (propPrice <= maxB * 1.05) {
      // Within +5% tolerance
      budgetScore = 23;
      tolerancesApplied.push('%5 bütçe esnemesi / pazarlık payı');
      reasons.push(`Fiyat bütçenin yalnızca %5 üzerinde (Kolay pazarlık payı) (+23)`);
    } else if (propPrice <= maxB * 1.10) {
      // Within +10% tolerance (Requested by user: 600 -> 650)
      budgetScore = 19;
      tolerancesApplied.push('%10 bütçe esnemesi / potansiyel opsiyon');
      reasons.push(`Fiyat bütçenin %10 tolerans sınırında (Pazarlık edilebilir alternatif) (+19)`);
    } else if (propPrice <= maxB * 1.15) {
      // Within +15% tolerance
      budgetScore = 14;
      tolerancesApplied.push('%15 genişletilmiş bütçe toleransı');
      reasons.push(`Fiyat bütçenin %15 üzerinde (+14)`);
    } else if (propPrice <= maxB * 1.25) {
      budgetScore = 7;
      tolerancesApplied.push('%25 üst sınır toleransı');
      reasons.push(`Fiyat bütçenin %25 üzerinde (+7)`);
    } else {
      budgetScore = 0;
      reasons.push(`Fiyat bütçenin çok üzerinde: ${propPrice} vs ${maxB}`);
    }
  }

  // ----------------------------------------------------
  // 4. PROPERTY TYPE & ROOM COUNT SCORING (Weight: 15 points)
  // ----------------------------------------------------
  let typeAndRoomScore = 0;
  // Type match (max 8 points)
  let typePoints = 0;
  if (criteria.propertyTypes.length === 0) {
    typePoints = 6;
  } else {
    const matchedType = criteria.propertyTypes.some(t => propText.includes(t) || (property.type || '').includes(t) || (property.subtype || '').toLowerCase().includes(t));
    if (matchedType) {
      typePoints = 8;
      reasons.push('Emlak türü tam uyumlu (+8)');
    } else {
      typePoints = 2;
    }
  }

  // Room count match (max 7 points)
  let roomPoints = 0;
  const propRooms = (property.room_count || '').replace(/\s+/g, '');
  if (criteria.roomCounts.length === 0) {
    roomPoints = 5;
  } else {
    const exactRoom = criteria.roomCounts.some(r => propRooms.includes(r) || propText.includes(r));
    if (exactRoom) {
      roomPoints = 7;
      reasons.push(`Oda sayısı tam uyumlu: "${propRooms || criteria.roomCounts.join(', ')}" (+7)`);
    } else {
      // Adjacent room check (e.g. asked for 2+1, property is 3+1)
      roomPoints = 3;
      tolerancesApplied.push('Farklı oda varyasyonu');
    }
  }
  typeAndRoomScore = typePoints + roomPoints;

  // ----------------------------------------------------
  // 5. FEATURES SCORING (Age, Floor, Furnished) (Weight: 10 points)
  // ----------------------------------------------------
  let featuresScore = 0;
  let featuresCount = 0;

  // Furnished check (4 points)
  if (criteria.furnished !== undefined) {
    const isPropFurnished = Boolean(property.furnished || /eşyalı|esyali/i.test(propText));
    if (criteria.furnished === isPropFurnished) {
      featuresScore += 4;
      reasons.push(isPropFurnished ? 'Eşyalı donanım kriteri karşılandı (+4)' : 'Eşyasız donanım kriteri karşılandı (+4)');
      featuresCount++;
    }
  } else {
    featuresScore += 2;
  }

  // Building age check (3 points)
  if (criteria.maxBuildingAge !== undefined) {
    const propAgeStr = property.building_age || property.sector_data?.bina_yasi || '';
    const propAgeNum = parseInt(propAgeStr.replace(/\D/g, '') || '0', 10);
    if (propAgeNum <= criteria.maxBuildingAge) {
      featuresScore += 3;
      reasons.push(`Bina yaşı uygun: ${propAgeNum} yaş (Maks: ${criteria.maxBuildingAge}) (+3)`);
      featuresCount++;
    }
  } else {
    featuresScore += 2;
  }

  // Floor preference check (3 points)
  if (criteria.preferredFloor) {
    const propFloor = (property.floor || property.sector_data?.bulundugu_kat || '').toLowerCase();
    if (criteria.preferredFloor === 'ara_kat' && (/ara|1|2|3/i.test(propFloor) || !/zemin|giriş|çatı|bodrum/i.test(propFloor))) {
      featuresScore += 3;
      reasons.push('Ara kat tercihi karşılandı (+3)');
      featuresCount++;
    } else if (criteria.preferredFloor === 'bahce' && /bahçe|bahce|zemin/i.test(propFloor)) {
      featuresScore += 3;
      reasons.push('Bahçe katı tercihi karşılandı (+3)');
      featuresCount++;
    } else if (criteria.preferredFloor === 'penthouse' && /penthouse|çatı|en üst/i.test(propFloor)) {
      featuresScore += 3;
      reasons.push('Penthouse tercihi karşılandı (+3)');
      featuresCount++;
    }
  } else {
    featuresScore += 2;
  }

  // Cap features at 10
  featuresScore = Math.min(10, featuresScore);

  // ----------------------------------------------------
  // TOTAL WEIGHTED SCORE CALCULATION
  // ----------------------------------------------------
  // If intent is completely mismatched (fatal mismatch), cap total score at 25% max
  let totalScore = locationScore + intentScore + budgetScore + typeAndRoomScore + featuresScore;
  if (criteria.intent !== 'any' && criteria.intent !== propIntent) {
    totalScore = Math.min(30, Math.round(totalScore * 0.35));
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
    customerName: extractCustomerName(deal.title || ''),
    propertyId: property.id,
    propertyTitle: property.title,
    propertyRef: property.reference_no,
    propertyPrice: propPrice,
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
 * Finds past / cold / lost deals that can be re-engaged when a property price drops
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
    
    // Check if the previous price was exceeding client's budget, but the new price fits!
    const hadBudgetIssue = criteria.maxBudget && prevP > criteria.maxBudget;
    const fitsNow = !criteria.maxBudget || currentPrice <= criteria.maxBudget * 1.10;

    // Calculate score with previous vs current price
    const fakePrevProp = { ...property, price: prevP };
    const prevScore = calculateMatchScore(fakePrevProp, deal);
    const newScore = calculateMatchScore(property, deal);

    if ((isLostOrCold || hadBudgetIssue || newScore.score >= 70) && newScore.score > prevScore.score) {
      const custName = extractCustomerName(deal.title || '');
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
  lapta: { lat: 35.3400, lng: 33.1600 },
  lefkosa: { lat: 35.1856, lng: 33.3823 },
  lefkoşa: { lat: 35.1856, lng: 33.3823 },
  gonyeli: { lat: 35.2167, lng: 33.3167 },
  gönyeli: { lat: 35.2167, lng: 33.3167 },
  magusa: { lat: 35.1250, lng: 33.9417 },
  gazimagusa: { lat: 35.1250, lng: 33.9417 },
  gazimağusa: { lat: 35.1250, lng: 33.9417 },
  iskele: { lat: 35.2892, lng: 33.8906 },
  'long beach': { lat: 35.2650, lng: 33.9100 },
  guzelyurt: { lat: 35.1989, lng: 32.9936 },
  güzelyurt: { lat: 35.1989, lng: 32.9936 }
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

import React from "react";
import { 
  Flame, 
  Sparkles, 
  Star, 
  Award, 
  Crown, 
  Clock, 
  Tag
} from "lucide-react";
import { Product } from "../types";

export interface BookstoreBadgeDefinition {
  id: string;
  labelTr: string;
  labelEn: string;
  badgeTr: string;
  badgeEn: string;
  gridTitleTr: string;
  gridTitleEn: string;
  gridSubtitleTr: string;
  gridSubtitleEn: string;
  iconName: "Flame" | "Sparkles" | "Star" | "Award" | "Crown" | "Clock" | "Tag";
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBgClass: string;
  glowColor: string;
  aliases: string[];
}

export const BOOKSTORE_BADGES: BookstoreBadgeDefinition[] = [
  {
    id: "bestseller",
    labelTr: "Çok Satanlar",
    labelEn: "Bestsellers",
    badgeTr: "ÇOK SATAN",
    badgeEn: "BESTSELLER",
    gridTitleTr: "Çok Satan Eserler",
    gridTitleEn: "Top Bestsellers",
    gridSubtitleTr: "Okurlarımız tarafından en çok tercih edilen ve okunan başyapıtlar",
    gridSubtitleEn: "Most popular titles chosen by readers",
    iconName: "Flame",
    bgClass: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
    textClass: "text-red-500",
    borderClass: "border-red-500/30",
    badgeBgClass: "bg-red-600 text-white shadow-red-600/40",
    glowColor: "rgba(239, 68, 68, 0.4)",
    aliases: [
      "bestseller", "bestsellers", "cok_satan", "cok_satanlar", "cok satanlar", 
      "çok satanlar", "çok satan", "en cok satanlar", "en çok satanlar", "populer", "popular", "top10", "top_10"
    ]
  },
  {
    id: "featured_week",
    labelTr: "Haftanın Eseri",
    labelEn: "Book of the Week",
    badgeTr: "HAFTANIN ESERİ",
    badgeEn: "WEEKLY PICK",
    gridTitleTr: "Haftanın Öne Çıkan Eserleri",
    gridTitleEn: "Books of the Week",
    gridSubtitleTr: "Bu haftanın vitrin manşetinde yer alan özel edebi seçki",
    gridSubtitleEn: "Handpicked weekly spotlight on our hero showcase",
    iconName: "Crown",
    bgClass: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400",
    textClass: "text-purple-500",
    borderClass: "border-purple-500/30",
    badgeBgClass: "bg-purple-600 text-white shadow-purple-600/40",
    glowColor: "rgba(168, 85, 247, 0.4)",
    aliases: [
      "featured_week", "weekly_pick", "weekly_picks", "haftanin_eseri", "haftanın eseri", 
      "haftanin_kitabi", "haftanın kitabı", "haftanin eseri", "haftanin kitabi", "haftanin_secimi", 
      "haftanın seçimi", "haftanin secimi", "haftanin_onerisi", "haftanın önerisi"
    ]
  },
  {
    id: "deal",
    labelTr: "Haftanın & Günün Fırsatı",
    labelEn: "Deals & Discounts",
    badgeTr: "HAFTANIN FIRSATI",
    badgeEn: "SPECIAL DEAL",
    gridTitleTr: "Haftanın Fırsat & İndirimli Eserleri",
    gridTitleEn: "Special Literary Deals",
    gridSubtitleTr: "Sınırlı süreye özel avantajlı fiyatlar ve haftanın indirimli seçkin eserleri",
    gridSubtitleEn: "Limited-time deals and advantageous prices on selected books",
    iconName: "Tag",
    bgClass: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400",
    textClass: "text-orange-500",
    borderClass: "border-orange-500/30",
    badgeBgClass: "bg-orange-600 text-white shadow-orange-600/40",
    glowColor: "rgba(234, 88, 12, 0.4)",
    aliases: [
      "deal", "daily_deal", "weekly_deal", "haftanin_firsat", "haftanin_firsati", 
      "haftanın fırsatı", "haftanın fırsat", "haftanin firsati", "haftanin firsat", 
      "gunun_firsati", "gunun firsati", "günün fırsatı", "günün fırsat", "firsat", "fırsat", 
      "firsat_kitabi", "fırsat kitabı", "discounted", "indirim", "indirimli", "avantaj", "kampanya"
    ]
  },
  {
    id: "award_winning",
    labelTr: "Ödüllü Eserler",
    labelEn: "Award Winners",
    badgeTr: "ÖDÜLLÜ ESER",
    badgeEn: "AWARD WINNER",
    gridTitleTr: "Ödüllü Eserler & Başyapıtlar",
    gridTitleEn: "Award-Winning Masterpieces",
    gridSubtitleTr: "Ulusal ve uluslararası saygın edebiyat ödüllerine layık görülen eserler",
    gridSubtitleEn: "Masterpieces recognized with prestigious national and global literary prizes",
    iconName: "Award",
    bgClass: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    textClass: "text-amber-500",
    borderClass: "border-amber-500/30",
    badgeBgClass: "bg-amber-500 text-slate-950 shadow-amber-500/40",
    glowColor: "rgba(245, 158, 11, 0.4)",
    aliases: [
      "award_winning", "award_winner", "award_winners", "award", "awards", 
      "odullu", "odullu_eser", "odullu_eserler", "odullu eserler", "odullu eser", 
      "ödüllü", "ödüllü eser", "ödüllü eserler", "ödüllü eserler & başyapıtlar", 
      "odullu kitaplar", "ödüllü kitaplar", "nobel", "pulitzer", "man booker", "sedat simavi", "yunus nadi"
    ]
  },
  {
    id: "editors_pick",
    labelTr: "Editörün Seçimi",
    labelEn: "Editor's Pick",
    badgeTr: "EDİTÖRÜN SEÇİMİ",
    badgeEn: "EDITOR'S PICK",
    gridTitleTr: "Editörün Seçimi Eserler",
    gridTitleEn: "Editor's Choice",
    gridSubtitleTr: "Edebiyat danışmanlarımızın ve editörlerimizin özel tavsiyeleri",
    gridSubtitleEn: "Special curated recommendations from our literary editors",
    iconName: "Star",
    bgClass: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    textClass: "text-indigo-500",
    borderClass: "border-indigo-500/30",
    badgeBgClass: "bg-indigo-600 text-white shadow-indigo-600/40",
    glowColor: "rgba(99, 102, 241, 0.4)",
    aliases: [
      "editors_pick", "editor_pick", "editor_choice", "editorun_secimi", "editorun secimi", 
      "editörün seçimi", "editörün secimi", "editörün seçtiği", "editor", "secilmis", "curated"
    ]
  },
  {
    id: "new_release",
    labelTr: "Yeni Çıkanlar & Raflarda",
    labelEn: "New Releases",
    badgeTr: "YENİ ÇIKAN",
    badgeEn: "NEW RELEASE",
    gridTitleTr: "Yeni Çıkanlar & Raflarda",
    gridTitleEn: "New Releases & Just In",
    gridSubtitleTr: "Bu hafta raflarımızda yerini alan en taze edebi yayınlar",
    gridSubtitleEn: "Fresh literary publications that arrived this week",
    iconName: "Sparkles",
    bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
    badgeBgClass: "bg-emerald-600 text-white shadow-emerald-600/40",
    glowColor: "rgba(16, 185, 129, 0.4)",
    aliases: [
      "new_release", "new_releases", "new_arrival", "new_arrivals", "yeni", 
      "yeni_cikan", "yeni_cikanlar", "yeni cikanlar", "yeni çıkanlar", "yeni çıkan", 
      "yeni_gelenler", "yeni gelenler", "taze", "just_in"
    ]
  },
  {
    id: "coming_soon",
    labelTr: "Yakında Gelecekler & Ön Sipariş",
    labelEn: "Coming Soon & Pre-Order",
    badgeTr: "YAKINDA",
    badgeEn: "COMING SOON",
    gridTitleTr: "Yakında Raflarda & Ön Sipariş",
    gridTitleEn: "Coming Soon & Pre-Order",
    gridSubtitleTr: "Baskı aşamasında olan ve yakında okuyucuyla buluşacak beklenen eserler",
    gridSubtitleEn: "Highly anticipated titles arriving at our bookstore soon",
    iconName: "Clock",
    bgClass: "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    textClass: "text-cyan-500",
    borderClass: "border-cyan-500/30",
    badgeBgClass: "bg-cyan-600 text-white shadow-cyan-600/40",
    glowColor: "rgba(6, 182, 212, 0.4)",
    aliases: [
      "coming_soon", "yakinda", "yakında", "yakinda_gelecekler", "yakında gelecekler", 
      "on_siparis", "ön sipariş", "pre_order", "preorder", "baskida", "baskıda"
    ]
  }
];

// Helper to normalize labels array from product
export function extractProductLabels(product: any): string[] {
  if (!product) return [];
  let rawLabels: string[] = [];

  // 1. Array labels
  if (Array.isArray(product.labels)) {
    rawLabels.push(...product.labels.map((l: any) => String(l).trim()));
  } else if (typeof product.labels === "string" && product.labels.trim()) {
    try {
      const parsed = JSON.parse(product.labels);
      if (Array.isArray(parsed)) rawLabels.push(...parsed.map((l: any) => String(l).trim()));
    } catch {
      rawLabels.push(...product.labels.split(",").map((l: string) => l.trim()).filter(Boolean));
    }
  }

  // 2. Array tags
  if (Array.isArray(product.tags)) {
    rawLabels.push(...product.tags.map((l: any) => String(l).trim()));
  } else if (typeof product.tags === "string" && product.tags.trim()) {
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) rawLabels.push(...parsed.map((l: any) => String(l).trim()));
    } catch {
      rawLabels.push(...product.tags.split(",").map((l: string) => l.trim()).filter(Boolean));
    }
  }

  // 3. Array badges
  if (Array.isArray(product.badges)) {
    rawLabels.push(...product.badges.map((l: any) => String(l).trim()));
  }

  // 4. Also check sector_data
  const sec = typeof product.sector_data === "string" 
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : (product.sector_data || {});

  if (Array.isArray(sec.curated_badges)) {
    rawLabels.push(...sec.curated_badges.map((l: any) => String(l).trim()));
  }
  if (Array.isArray(sec.labels)) {
    rawLabels.push(...sec.labels.map((l: any) => String(l).trim()));
  }

  // 5. Check explicit flags and map to canonical badge IDs
  if ((product.is_bestseller || product.is_popular || sec.is_bestseller) && !rawLabels.includes("bestseller")) {
    rawLabels.push("bestseller");
  }
  if ((sec.is_weekly_pick || product.is_weekly_pick || sec.is_featured_weekly) && !rawLabels.includes("featured_week")) {
    rawLabels.push("featured_week");
  }
  if ((sec.awards || product.awards) && !rawLabels.includes("award_winning")) {
    rawLabels.push("award_winning");
  }
  if ((sec.is_deal || sec.is_discounted || product.discounted_price) && !rawLabels.includes("deal")) {
    rawLabels.push("deal");
  }
  if (sec.is_editors_pick && !rawLabels.includes("editors_pick")) {
    rawLabels.push("editors_pick");
  }
  if ((sec.is_new_release || product.is_new) && !rawLabels.includes("new_release")) {
    rawLabels.push("new_release");
  }
  if (sec.is_coming_soon && !rawLabels.includes("coming_soon")) {
    rawLabels.push("coming_soon");
  }

  // Resolve rawLabels to canonical badge ids if matching any badge alias
  const normalizedLabels: string[] = [];
  rawLabels.forEach((raw) => {
    const clean = raw.toLowerCase().trim();
    if (!clean || clean === "curated_badges" || clean === "curated_badge" || clean === "labels" || clean === "sector_data") return;
    
    // Check if clean matches any badge id or alias
    const matchedBadge = BOOKSTORE_BADGES.find(b => 
      b.id.toLowerCase() === clean || 
      b.aliases.some(a => a.toLowerCase() === clean) ||
      b.labelTr.toLowerCase() === clean ||
      b.badgeTr.toLowerCase() === clean ||
      b.labelEn.toLowerCase() === clean ||
      b.badgeEn.toLowerCase() === clean
    );

    if (matchedBadge) {
      if (!normalizedLabels.includes(matchedBadge.id)) {
        normalizedLabels.push(matchedBadge.id);
      }
    } else {
      if (!normalizedLabels.includes(clean)) {
        normalizedLabels.push(clean);
      }
    }
  });

  return normalizedLabels;
}

// Check if product has specific badge
export function hasBookstoreBadge(product: any, badgeId: string): boolean {
  if (!product || !badgeId) return false;
  const labels = extractProductLabels(product);
  const normalizedBadgeId = badgeId.toLowerCase().trim();

  // 1. Direct canonical id match in extracted labels
  if (labels.some(l => l.toLowerCase() === normalizedBadgeId)) return true;

  // 2. Find badge definition
  const def = BOOKSTORE_BADGES.find(b => 
    b.id.toLowerCase() === normalizedBadgeId ||
    b.aliases.some(a => a.toLowerCase() === normalizedBadgeId)
  );

  if (def) {
    // Check if product has canonical def.id or any alias in labels
    if (labels.some(l => l.toLowerCase() === def.id.toLowerCase())) return true;
    if (labels.some(l => def.aliases.some(a => a.toLowerCase() === l.toLowerCase()))) return true;
  }

  // 3. Fallback explicit checks
  const sec = typeof product.sector_data === "string" 
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : (product.sector_data || {});

  if (normalizedBadgeId === "bestseller" && (product.is_bestseller || product.is_popular || sec.is_bestseller)) return true;
  if ((normalizedBadgeId === "featured_week" || normalizedBadgeId === "weekly_pick") && (sec.is_weekly_pick || product.is_weekly_pick || sec.is_featured_weekly)) return true;
  if ((normalizedBadgeId === "award_winning" || normalizedBadgeId === "odullu_eserler" || normalizedBadgeId === "odullu") && (Boolean(sec.awards) || Boolean(product.awards))) return true;
  if ((normalizedBadgeId === "deal" || normalizedBadgeId === "haftanin_firsati" || normalizedBadgeId === "haftanin_firsat" || normalizedBadgeId === "discounted") && (Boolean(sec.is_deal) || Boolean(sec.is_discounted) || Boolean(product.discounted_price))) return true;
  if (normalizedBadgeId === "editors_pick" && Boolean(sec.is_editors_pick)) return true;
  if ((normalizedBadgeId === "new_release" || normalizedBadgeId === "new_arrival") && (Boolean(sec.is_new_release) || Boolean(product.is_new))) return true;
  if (normalizedBadgeId === "coming_soon" && Boolean(sec.is_coming_soon)) return true;

  return false;
}

// Get all matched badge definitions for a product
export function getProductBookstoreBadges(product: any): BookstoreBadgeDefinition[] {
  if (!product) return [];
  return BOOKSTORE_BADGES.filter(badge => hasBookstoreBadge(product, badge.id));
}

// Helper to toggle badge on product and return updated fields for API
export function toggleBookstoreBadgeData(product: any, badgeId: string) {
  const currentLabels = extractProductLabels(product);
  const hasIt = hasBookstoreBadge(product, badgeId);

  // Find canonical badge
  const def = BOOKSTORE_BADGES.find(b => 
    b.id.toLowerCase() === badgeId.toLowerCase() ||
    b.aliases.some(a => a.toLowerCase() === badgeId.toLowerCase())
  );
  const canonicalId = def ? def.id : badgeId.toLowerCase();

  let newLabels: string[];
  if (hasIt) {
    const removeList = def ? [def.id.toLowerCase(), ...def.aliases.map(a => a.toLowerCase())] : [canonicalId];
    newLabels = currentLabels.filter(l => !removeList.includes(l.toLowerCase()));
  } else {
    newLabels = Array.from(new Set([...currentLabels, canonicalId]));
  }

  // Parse existing sector_data
  let sec = typeof product.sector_data === "string"
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : { ...(product.sector_data || {}) };

  sec.curated_badges = newLabels;

  const willHaveBadge = !hasIt;

  if (canonicalId === "bestseller") {
    sec.is_bestseller = willHaveBadge;
    return {
      labels: newLabels,
      is_bestseller: willHaveBadge,
      sector_data: sec
    };
  }

  if (canonicalId === "featured_week") {
    sec.is_weekly_pick = willHaveBadge;
    sec.is_featured_weekly = willHaveBadge;
    return {
      labels: newLabels,
      is_weekly_pick: willHaveBadge,
      sector_data: sec
    };
  }

  if (canonicalId === "deal") {
    sec.is_deal = willHaveBadge;
    sec.is_discounted = willHaveBadge;
    return {
      labels: newLabels,
      sector_data: sec
    };
  }

  if (canonicalId === "award_winning") {
    sec.awards = willHaveBadge ? (sec.awards || "Ödüllü Eser & Başyapıt") : "";
    return {
      labels: newLabels,
      sector_data: sec
    };
  }

  if (canonicalId === "editors_pick") {
    sec.is_editors_pick = willHaveBadge;
    return {
      labels: newLabels,
      sector_data: sec
    };
  }

  if (canonicalId === "new_release") {
    sec.is_new_release = willHaveBadge;
    return {
      labels: newLabels,
      sector_data: sec
    };
  }

  if (canonicalId === "coming_soon") {
    sec.is_coming_soon = willHaveBadge;
    return {
      labels: newLabels,
      sector_data: sec
    };
  }

  return {
    labels: newLabels,
    sector_data: sec
  };
}

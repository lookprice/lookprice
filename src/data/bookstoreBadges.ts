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
    glowColor: "rgba(239, 68, 68, 0.4)"
  },
  {
    id: "new_release",
    labelTr: "Yeni Çıkanlar",
    labelEn: "New Releases",
    badgeTr: "YENİ",
    badgeEn: "NEW",
    gridTitleTr: "Yeni Çıkanlar & Raflarda",
    gridTitleEn: "New Releases & Just In",
    gridSubtitleTr: "Bu hafta raflarımızda yerini alan en taze edebi yayınlar",
    gridSubtitleEn: "Fresh literary publications that arrived this week",
    iconName: "Sparkles",
    bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
    badgeBgClass: "bg-emerald-600 text-white shadow-emerald-600/40",
    glowColor: "rgba(16, 185, 129, 0.4)"
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
    glowColor: "rgba(99, 102, 241, 0.4)"
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
    glowColor: "rgba(245, 158, 11, 0.4)"
  },
  {
    id: "featured_week",
    labelTr: "Haftanın Eseri",
    labelEn: "Book of the Week",
    badgeTr: "HAFTANIN ESERİ",
    badgeEn: "WEEKLY PICK",
    gridTitleTr: "Haftanın Öne Çıkan Eserleri",
    gridTitleEn: "Books of the Week",
    gridSubtitleTr: "Bu haftanın vitrin manşetinde yer alan özel seçki",
    gridSubtitleEn: "Handpicked weekly spotlight on our hero showcase",
    iconName: "Crown",
    bgClass: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400",
    textClass: "text-purple-500",
    borderClass: "border-purple-500/30",
    badgeBgClass: "bg-purple-600 text-white shadow-purple-600/40",
    glowColor: "rgba(168, 85, 247, 0.4)"
  },
  {
    id: "deal",
    labelTr: "Günün Fırsatı",
    labelEn: "Daily Deal",
    badgeTr: "FIRSAT",
    badgeEn: "DEAL",
    gridTitleTr: "Günün Edebi Fırsatları",
    gridTitleEn: "Special Literary Deals",
    gridSubtitleTr: "Sınırlı süreye özel avantajlı fiyatlar ve indirimli eserler",
    gridSubtitleEn: "Limited-time deals and advantageous prices on selected books",
    iconName: "Tag",
    bgClass: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400",
    textClass: "text-orange-500",
    borderClass: "border-orange-500/30",
    badgeBgClass: "bg-orange-600 text-white shadow-orange-600/40",
    glowColor: "rgba(234, 88, 12, 0.4)"
  },
  {
    id: "coming_soon",
    labelTr: "Yakında Gelecekler",
    labelEn: "Coming Soon",
    badgeTr: "YAKINDA",
    badgeEn: "SOON",
    gridTitleTr: "Yakında Raflarda & Ön Sipariş",
    gridTitleEn: "Coming Soon & Pre-Order",
    gridSubtitleTr: "Baskı aşamasında olan ve yakında okuyucuyla buluşacak beklenen eserler",
    gridSubtitleEn: "Highly anticipated titles arriving at our bookstore soon",
    iconName: "Clock",
    bgClass: "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
    textClass: "text-cyan-500",
    borderClass: "border-cyan-500/30",
    badgeBgClass: "bg-cyan-600 text-white shadow-cyan-600/40",
    glowColor: "rgba(6, 182, 212, 0.4)"
  }
];

// Helper to normalize labels array from product
export function extractProductLabels(product: any): string[] {
  if (!product) return [];
  let labels: string[] = [];
  if (Array.isArray(product.labels)) {
    labels = product.labels.map((l: any) => String(l).trim());
  } else if (typeof product.labels === "string" && product.labels.trim()) {
    try {
      const parsed = JSON.parse(product.labels);
      if (Array.isArray(parsed)) labels = parsed.map((l: any) => String(l).trim());
    } catch {
      labels = product.labels.split(",").map((l: string) => l.trim()).filter(Boolean);
    }
  }

  // Also check sector_data
  const sec = typeof product.sector_data === "string" 
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : (product.sector_data || {});

  if (Array.isArray(sec.curated_badges)) {
    labels = Array.from(new Set([...labels, ...sec.curated_badges]));
  }

  // Check legacy boolean flags and map to badge ids
  if (product.is_bestseller && !labels.includes("bestseller")) {
    labels.push("bestseller");
  }
  if ((sec.is_weekly_pick || product.is_weekly_pick || sec.is_featured_weekly) && !labels.includes("featured_week")) {
    labels.push("featured_week");
  }
  if (sec.awards && !labels.includes("award_winning")) {
    labels.push("award_winning");
  }

  return labels;
}

// Check if product has specific badge
export function hasBookstoreBadge(product: any, badgeId: string): boolean {
  if (!product) return false;
  const labels = extractProductLabels(product);
  const normalizedBadgeId = badgeId.toLowerCase().trim();

  // Direct id match
  if (labels.some(l => l.toLowerCase() === normalizedBadgeId)) return true;

  // Keyword match in Turkish/English
  const def = BOOKSTORE_BADGES.find(b => b.id === normalizedBadgeId);
  if (def) {
    const aliases = [
      def.id.toLowerCase(),
      def.labelTr.toLowerCase(),
      def.labelEn.toLowerCase(),
      def.badgeTr.toLowerCase(),
      def.badgeEn.toLowerCase()
    ];
    if (labels.some(l => aliases.includes(l.toLowerCase()))) return true;
  }

  // Check explicit properties
  if (badgeId === "bestseller" && product.is_bestseller) return true;
  const sec = typeof product.sector_data === "string" 
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : (product.sector_data || {});
  if (badgeId === "featured_week" && (sec.is_weekly_pick || product.is_weekly_pick || sec.is_featured_weekly)) return true;
  if (badgeId === "award_winning" && Boolean(sec.awards)) return true;

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

  let newLabels: string[];
  if (hasIt) {
    const def = BOOKSTORE_BADGES.find(b => b.id === badgeId);
    const aliases = def ? [
      def.id.toLowerCase(),
      def.labelTr.toLowerCase(),
      def.labelEn.toLowerCase(),
      def.badgeTr.toLowerCase(),
      def.badgeEn.toLowerCase()
    ] : [badgeId.toLowerCase()];

    newLabels = currentLabels.filter(l => !aliases.includes(l.toLowerCase()));
  } else {
    newLabels = Array.from(new Set([...currentLabels, badgeId]));
  }

  // Parse existing sector_data
  let sec = typeof product.sector_data === "string"
    ? (() => { try { return JSON.parse(product.sector_data); } catch { return {}; } })()
    : { ...(product.sector_data || {}) };

  sec.curated_badges = newLabels;

  const willHaveBadge = !hasIt;

  if (badgeId === "bestseller") {
    return {
      labels: newLabels,
      is_bestseller: willHaveBadge,
      sector_data: sec
    };
  }

  if (badgeId === "featured_week") {
    sec.is_weekly_pick = willHaveBadge;
    return {
      labels: newLabels,
      is_weekly_pick: willHaveBadge,
      sector_data: sec
    };
  }

  return {
    labels: newLabels,
    sector_data: sec
  };
}

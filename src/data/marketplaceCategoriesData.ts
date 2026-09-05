export interface MarketplaceCategory {
  id: string | number;
  name: string;
  displayName?: string;
  paths?: string[];
  parentName?: string;
  leaf?: boolean;
  available?: boolean;
  status?: string;
}

export interface MarketplaceAttribute {
  id: string;
  name: string;
  description?: string;
  mandatory: boolean;
  type: 'text' | 'number' | 'select' | 'boolean';
  values?: string[];
  placeholder?: string;
  defaultValue?: string;
}

// 1. Standard Hepsiburada Leaf Categories & Attributes
export const HEPSIBURADA_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 60003858,
    name: "Kadın Günlük Ayakkabı",
    displayName: "Kadın Günlük Ayakkabı",
    paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Günlük Ayakkabı"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 60003859,
    name: "Erkek Günlük Ayakkabı",
    displayName: "Erkek Günlük Ayakkabı",
    paths: ["Giyim / Ayakkabı", "Erkek", "Ayakkabı", "Günlük Ayakkabı"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 60003857,
    name: "Kadın Spor Ayakkabı",
    displayName: "Kadın Spor Ayakkabı & Sneaker",
    paths: ["Giyim / Ayakkabı", "Kadın", "Spor Ayakkabı", "Sneaker"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 60003860,
    name: "Erkek Spor Ayakkabı",
    displayName: "Erkek Spor Ayakkabı & Sneaker",
    paths: ["Giyim / Ayakkabı", "Erkek", "Spor Ayakkabı", "Sneaker"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101943,
    name: "Kadın Mont & Kaban",
    displayName: "Kadın Mont & Kaban",
    paths: ["Giyim / Ayakkabı", "Kadın", "Dış Giyim", "Mont & Kaban"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101944,
    name: "Erkek Mont & Kaban",
    displayName: "Erkek Mont & Kaban",
    paths: ["Giyim / Ayakkabı", "Erkek", "Dış Giyim", "Mont & Kaban"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101945,
    name: "Kadın Elbise",
    displayName: "Kadın Elbise",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Elbise"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101946,
    name: "Kadın Tişört & Bluz",
    displayName: "Kadın Tişört & Bluz",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Tişört"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101947,
    name: "Erkek Tişört",
    displayName: "Erkek Tişört & Polo",
    paths: ["Giyim / Ayakkabı", "Erkek", "Giyim", "Tişört"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101948,
    name: "Kadın Pantolon",
    displayName: "Kadın Pantolon & Jean",
    paths: ["Giyim / Ayakkabı", "Kadın", "Giyim", "Pantolon"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 12101949,
    name: "Erkek Pantolon",
    displayName: "Erkek Pantolon & Jean",
    paths: ["Giyim / Ayakkabı", "Erkek", "Giyim", "Pantolon"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 26012174,
    name: "Tansiyon Aletleri",
    displayName: "Tansiyon Aletleri & Medikal",
    paths: ["Kozmetik & Kişisel Bakım", "Sağlık & Medikal", "Tansiyon Aletleri"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 26012175,
    name: "Yüz & Cilt Bakım Kremleri",
    displayName: "Yüz & Cilt Bakım Kremleri",
    paths: ["Kozmetik & Kişisel Bakım", "Cilt Bakımı", "Yüz Kremleri"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 26012176,
    name: "Parfüm & Deodorant",
    displayName: "Parfüm & Deodorant",
    paths: ["Kozmetik & Kişisel Bakım", "Parfüm", "Kadın & Erkek"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 371965,
    name: "Cep Telefonu Kılıfları",
    displayName: "Cep Telefonu Kılıfları & Koruyucular",
    paths: ["Elektronik", "Telefon Aksesuarları", "Kılıflar"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 371966,
    name: "Şarj Cihazı & Kablolar",
    displayName: "Şarj Cihazı & Kablolar",
    paths: ["Elektronik", "Telefon Aksesuarları", "Şarj Aletleri"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 371967,
    name: "Kulaklık & Ses Sistemleri",
    displayName: "Kulaklık & Bluetooth Kulaklık",
    paths: ["Elektronik", "Ses Sistemleri", "Bluetooth Kulaklık"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 371968,
    name: "Akıllı Saat & Bileklik",
    displayName: "Akıllı Saat & Bileklik",
    paths: ["Elektronik", "Giyilebilir Teknoloji", "Akıllı Saat"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 18021948,
    name: "Batarya & Musluklar",
    displayName: "Batarya & Musluk Sistemleri",
    paths: ["Ev & Yaşam", "Banyo & Mutfak", "Batarya & Musluk"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 18021949,
    name: "Yatak Örtüsü & Nevresim",
    displayName: "Yatak Örtüsü & Nevresim Takımları",
    paths: ["Ev & Yaşam", "Ev Tekstili", "Nevresim"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 18021950,
    name: "Kahve & Çay Makineleri",
    displayName: "Kahve & Çay Makineleri",
    paths: ["Elektrikli Ev Aletleri", "Mutfak Aletleri", "Kahve Makineleri"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 2147483647,
    name: "Oto Koltuk Kılıfı & Paspas",
    displayName: "Oto Koltuk Kılıfı & Paspas",
    paths: ["Oto & Motosiklet", "Oto Aksesuar", "Koltuk Kılıfları"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  },
  {
    id: 60002524,
    name: "Konsept Hediyelikler",
    displayName: "Konsept Hediyelikler & Aksesuar",
    paths: ["Hobi & Eğlence", "Hediyelik Eşya", "Konsept"],
    leaf: true,
    available: true,
    status: "ACTIVE"
  }
];

// 2. Standard Trendyol Categories
export const TRENDYOL_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 412, name: "Kadın Ayakkabı", displayName: "Ayakkabı > Kadın Ayakkabı", paths: ["Kadın", "Ayakkabı"] },
  { id: 413, name: "Erkek Ayakkabı", displayName: "Ayakkabı > Erkek Ayakkabı", paths: ["Erkek", "Ayakkabı"] },
  { id: 414, name: "Spor Ayakkabı & Sneaker", displayName: "Ayakkabı > Spor Ayakkabı", paths: ["Ayakkabı", "Spor Ayakkabı"] },
  { id: 520, name: "Kadın Tişört & Bluz", displayName: "Giyim > Kadın > Tişört", paths: ["Kadın", "Giyim", "Tişört"] },
  { id: 521, name: "Erkek Tişört & Polo", displayName: "Giyim > Erkek > Tişört", paths: ["Erkek", "Giyim", "Tişört"] },
  { id: 522, name: "Kadın Elbise", displayName: "Giyim > Kadın > Elbise", paths: ["Kadın", "Giyim", "Elbise"] },
  { id: 523, name: "Erkek Pantolon & Jean", displayName: "Giyim > Erkek > Pantolon", paths: ["Erkek", "Giyim", "Pantolon"] },
  { id: 601, name: "Cep Telefonu Aksesuarları", displayName: "Elektronik > Telefon > Aksesuarlar", paths: ["Elektronik", "Telefon Aksesuar"] },
  { id: 602, name: "Bluetooth Kulaklık", displayName: "Elektronik > Ses Sistemleri > Kulaklık", paths: ["Elektronik", "Kulaklık"] },
  { id: 701, name: "Cilt Bakım Ürünleri", displayName: "Kozmetik > Cilt Bakımı", paths: ["Kozmetik", "Cilt Bakım"] },
  { id: 702, name: "Parfüm", displayName: "Kozmetik > Parfüm", paths: ["Kozmetik", "Parfüm"] },
  { id: 801, name: "Ev Tekstili", displayName: "Ev & Yaşam > Ev Tekstili", paths: ["Ev & Yaşam", "Tekstil"] },
  { id: 802, name: "Mutfak Gereçleri", displayName: "Ev & Yaşam > Mutfak Gereçleri", paths: ["Ev & Yaşam", "Mutfak"] },
  { id: 901, name: "Oto Aksesuar & Bakım", displayName: "Otomotiv > Oto Aksesuar", paths: ["Otomotiv", "Aksesuar"] }
];

// 3. Standard Amazon Categories
export const AMAZON_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: "shoes", name: "Ayakkabı & Çanta (Shoes)", displayName: "Moda > Ayakkabı & Çanta", paths: ["Moda", "Ayakkabı"] },
  { id: "apparel", name: "Giyim & Aksesuar (Apparel)", displayName: "Moda > Giyim & Tekstil", paths: ["Moda", "Giyim"] },
  { id: "electronics", name: "Elektronik & Aksesuarlar (Electronics)", displayName: "Elektronik > Çevre Birimleri & Aksesuarlar", paths: ["Elektronik"] },
  { id: "home", name: "Ev & Mutfak (Home & Kitchen)", displayName: "Ev & Mutfak > Yaşam & Dekorasyon", paths: ["Ev & Mutfak"] },
  { id: "beauty", name: "Güzellik & Kişisel Bakım (Beauty)", displayName: "Güzellik & Bakım > Kozmetik", paths: ["Güzellik"] },
  { id: "automotive", name: "Otomotiv Parça & Aksesuarları (Automotive)", displayName: "Otomotiv > Araç Aksesuarları", paths: ["Otomotiv"] },
  { id: "sports", name: "Spor & Outdoor (Sports & Outdoors)", displayName: "Spor > Outdoor & Fitness", paths: ["Spor"] },
  { id: "toys", name: "Oyuncak & Oyunlar (Toys & Games)", displayName: "Bebek & Çocuk > Oyuncak", paths: ["Oyuncak"] },
  { id: "food", name: "Gıda & İçecek (Grocery & Gourmet)", displayName: "Süpermarket > Gıda", paths: ["Gıda"] }
];

// 4. Standard Pazarama Categories
export const PAZARAMA_DEFAULT_CATEGORIES: MarketplaceCategory[] = [
  { id: 101, name: "Giyim & Ayakkabı", displayName: "Moda > Giyim & Ayakkabı", paths: ["Moda"] },
  { id: 102, name: "Elektronik & Telefon", displayName: "Elektronik > Telefon & Aksesuar", paths: ["Elektronik"] },
  { id: 103, name: "Ev & Yaşam", displayName: "Ev & Yaşam > Mobilya & Dekorasyon", paths: ["Ev & Yaşam"] },
  { id: 104, name: "Kozmetik & Kişisel Bakım", displayName: "Kozmetik > Bakım Ürünleri", paths: ["Kozmetik"] },
  { id: 105, name: "Oto Aksesuar", displayName: "Oto & Bahçe > Araç Bakım & Aksesuar", paths: ["Oto & Bahçe"] },
  { id: 106, name: "Anne & Bebek", displayName: "Anne & Bebek > Bebek Giyim & Bakım", paths: ["Anne Bebek"] },
  { id: 107, name: "Spor & Outdoor", displayName: "Spor & Outdoor > Fitness & Kamp", paths: ["Spor Outdoor"] }
];

// Common Category Attribute Definitions (by sector keywords)
export const COMMON_MARKETPLACE_ATTRIBUTES: Record<string, MarketplaceAttribute[]> = {
  apparel: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürünün tescilli markası veya üretici", mandatory: true, type: "text", defaultValue: "Mağaza Markası" },
    { id: "Beden", name: "Beden / Numara (Size)", description: "Kıyafet veya ayakkabı bedeni", mandatory: true, type: "select", values: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Standart", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
    { id: "Renk", name: "Renk (Color)", description: "Ana ürün rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gri", "Lacivert", "Mavi", "Kırmızı", "Yeşil", "Sarı", "Bej", "Kahverengi", "Çok Renkli"] },
    { id: "Cinsiyet", name: "Cinsiyet (Gender)", description: "Hedef kitle cinsiyeti", mandatory: true, type: "select", values: ["Erkek", "Kadın", "Unisex", "Kız Çocuk", "Erkek Çocuk", "Bebek"], defaultValue: "Unisex" },
    { id: "Materyal", name: "Materyal / Kumaş (Material)", description: "Kumaş veya malzeme türü", mandatory: false, type: "text", defaultValue: "Pamuk" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Tüketici garanti süresi", mandatory: true, type: "select", values: ["6", "12", "24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" },
    { id: "Mensei", name: "Menşei (Origin Country)", description: "Üretim ülkesi", mandatory: false, type: "text", defaultValue: "Türkiye" }
  ],
  electronics: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürünün üretici markası", mandatory: true, type: "text" },
    { id: "Model", name: "Model Kodu", description: "Cihaz veya parça model adı", mandatory: false, type: "text" },
    { id: "Renk", name: "Renk (Color)", description: "Cihaz veya kılıf rengi", mandatory: true, type: "select", values: ["Siyah", "Beyaz", "Gümüş", "Uzay Grisi", "Mavi", "Kırmızı", "Şeffaf"] },
    { id: "UyumluMarka", name: "Uyumlu Cihaz / Marka", description: "Aksesuarın uyumlu olduğu telefon/cihaz", mandatory: false, type: "text", defaultValue: "Evrensel" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Yasal garanti süresi", mandatory: true, type: "select", values: ["12", "24", "36", "60"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" }
  ],
  cosmetics: [
    { id: "Marka", name: "Marka (Brand)", description: "Kozmetik markası", mandatory: true, type: "text" },
    { id: "Hacim", name: "Hacim / Gramaj", description: "Ürün net ağırlığı veya hacmi (ml, gr)", mandatory: true, type: "text", defaultValue: "100 ml" },
    { id: "CiltTipi", name: "Cilt Tipi", description: "Uyumlu cilt türü", mandatory: false, type: "select", values: ["Tüm Cilt Tipleri", "Kuru", "Yağlı", "Karma", "Hassas"], defaultValue: "Tüm Cilt Tipleri" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti veya raf ömrü", mandatory: true, type: "select", values: ["12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "Vergi oranı", mandatory: true, type: "select", values: ["10", "20"], defaultValue: "20" }
  ],
  general: [
    { id: "Marka", name: "Marka (Brand)", description: "Ürün markası", mandatory: true, type: "text", defaultValue: "Genel" },
    { id: "GarantiSuresi", name: "Garanti Süresi (Ay)", description: "Garanti süresi (Ay cinsinden)", mandatory: true, type: "select", values: ["6", "12", "24", "36"], defaultValue: "24" },
    { id: "tax_vat_rate", name: "KDV Oranı (%)", description: "KDV Vergi Oranı", mandatory: true, type: "select", values: ["1", "10", "20"], defaultValue: "20" },
    { id: "Mensei", name: "Menşei Ülke", description: "Üretim yeri", mandatory: false, type: "text", defaultValue: "Türkiye" }
  ]
};

// Returns relevant attributes based on category name or category path
export function getAttributesForCategory(catName: string, paths: string[] = []): MarketplaceAttribute[] {
  const text = `${catName} ${paths.join(" ")}`.toLowerCase();
  if (
    text.includes("ayakkabı") ||
    text.includes("giyim") ||
    text.includes("tişört") ||
    text.includes("pantolon") ||
    text.includes("elbise") ||
    text.includes("kaban") ||
    text.includes("mont") ||
    text.includes("tekstil") ||
    text.includes("apparel") ||
    text.includes("shoes")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.apparel;
  }
  if (
    text.includes("elektronik") ||
    text.includes("telefon") ||
    text.includes("kulaklık") ||
    text.includes("şarj") ||
    text.includes("kılıf") ||
    text.includes("saat") ||
    text.includes("electronics")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.electronics;
  }
  if (
    text.includes("kozmetik") ||
    text.includes("parfüm") ||
    text.includes("krem") ||
    text.includes("cilt") ||
    text.includes("sağlık") ||
    text.includes("beauty")
  ) {
    return COMMON_MARKETPLACE_ATTRIBUTES.cosmetics;
  }
  return COMMON_MARKETPLACE_ATTRIBUTES.general;
}

// Normalizes Turkish characters and punctuation for clean matching
export function normalizeCategoryText(str: string): string {
  if (!str) return "";
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Smart Auto-Match Algorithm
export function suggestMarketplaceCategory(
  localCategoryName: string,
  marketplaceCategories: MarketplaceCategory[]
): { bestMatch: MarketplaceCategory | null; score: number } {
  if (!localCategoryName || !marketplaceCategories || marketplaceCategories.length === 0) {
    return { bestMatch: null, score: 0 };
  }

  const localNorm = normalizeCategoryText(localCategoryName);
  const localTokens = localNorm.split(" ").filter((t) => t.length > 1 && !["ve", "ile", "de", "da"].includes(t));

  let bestMatch: MarketplaceCategory | null = null;
  let bestScore = 0;

  for (const cat of marketplaceCategories) {
    const catNameNorm = normalizeCategoryText(cat.name || "");
    const fullPathNorm = normalizeCategoryText(`${cat.name} ${(cat.paths || []).join(" ")} ${cat.displayName || ""}`);

    // Exact name match
    if (catNameNorm === localNorm) {
      return { bestMatch: cat, score: 100 };
    }

    let score = 0;

    // Substring containment
    if (catNameNorm.includes(localNorm) || localNorm.includes(catNameNorm)) {
      score += 60;
    }

    // Token matching
    let matchedTokens = 0;
    for (const token of localTokens) {
      if (catNameNorm.includes(token)) {
        matchedTokens += 2;
      } else if (fullPathNorm.includes(token)) {
        matchedTokens += 1;
      }
    }

    if (localTokens.length > 0) {
      const tokenRatio = (matchedTokens / (localTokens.length * 2)) * 40;
      score += tokenRatio;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return {
    bestMatch: bestScore >= 35 ? bestMatch : null,
    score: Math.min(100, Math.round(bestScore))
  };
}

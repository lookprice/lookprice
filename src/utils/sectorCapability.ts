import { Store as StoreInfo } from "../types";

/**
 * LOOKPRICE 6-SECTOR DETERMINISTIC CAPABILITY & DOMAIN MATRIX (SSOT)
 * 
 * 4 Ana Sektör (Core Verticals):
 *  1. RETAIL       -> shopLP (Genel Perakende / E-Ticaret / Barkodlu Satış)
 *  2. HORECA       -> horecaLP (Kafe / Restoran / Yeme-İçme / Masa & Adisyon)
 *  3. REAL_ESTATE  -> Emlak (Gayrimenkul / Portföy / Tapu / Harita IDX)
 *  4. AUTOMOTIVE   -> Otomotiv (Galeri / Vasıta / Şasi / Ekspertiz)
 * 
 * 2 Alt Sektör (Specialized Sub-Sectors / Extended Domains):
 *  5. BOOKSTORE    -> BookLP (Kitapçı / Yayınevi / ISBN / Yazar - shopLP alt dalı)
 *  6. HOTEL        -> HotelLP (Otel / Rezervasyon / Oda Yönetimi - horecaLP alt dalı)
 */

export type DomainId = 
  | "RETAIL" 
  | "BOOKSTORE" 
  | "HORECA" 
  | "HOTEL" 
  | "REAL_ESTATE" 
  | "AUTOMOTIVE";

export type SectorCapabilityKey =
  | "marketplaces"               // Pazaryerleri (Trendyol, Hepsiburada, N11, Amazon, Pazarama) -> SADECE Perakende & Kitap
  | "einvoice_purchases_sales"   // Alış/Satış Faturaları, GİB UBL & e-İrsaliye -> SADECE Perakende & Kitap
  | "fast_pos"                   // Barkodlu Hızlı Satış Kasa Terminali -> SADECE Perakende & Kitap
  | "variants_inventory"         // Renk/Beden/Ölçü Çoklu Varyant & Stok -> SADECE Perakende & Kitap
  | "google_merchant_xml"        // Google Merchant & Ürün XML Feed -> SADECE Perakende & Kitap
  | "book_metadata"              // ISBN, Yazar, Yayınevi, Sayfa Sayısı, E-Kitap -> SADECE BookLP
  | "tables_kds_orders"          // Masa Planı, KDS Mutfak/Bar Ekranı, Adisyon -> SADECE horecaLP & HotelLP
  | "digital_qr_menu"            // QR Dijital Menü & Masa Siparişi -> SADECE horecaLP & HotelLP
  | "recipes_costing"            // Reçete & Hammadde Maliyetlendirme -> SADECE horecaLP & HotelLP
  | "hotel_reservations"         // Oda Tipleri, Giriş/Çıkış Takvimi, Rezervasyon Motoru -> SADECE HotelLP
  | "real_estate_specs"          // Tapu türü, İmar, KAKS, Bölge Filtreleri -> SADECE Emlak
  | "real_estate_map_idx"        // Harita IDX, Bölünmüş Harita Portföy Arama -> SADECE Emlak
  | "real_estate_poster"         // A4 Standart Portre Vitrin Posteri -> SADECE Emlak
  | "automotive_specs"           // Şasi, Plaka, KM, Yakıt, Vites, Tramer, Ekspertiz -> SADECE Otomotiv
  | "contracts_legal"            // Emlak/Otomotiv Resmi Sözleşme Şablonları -> SADECE Emlak & Otomotiv
  | "portfolio_showcase"         // İlan & Portföy Vitrini -> SADECE Emlak & Otomotiv
  | "tcmb_currency"              // TCMB Canlı Döviz Kuru & Çapraz Kur -> TÜM SEKTÖRLER
  | "multi_branch"               // Şube / Lokasyon Yönetimi -> TÜM SEKTÖRLER
  | "sms_whatsapp";              // SMS & WhatsApp Bildirimleri -> TÜM SEKTÖRLER

/**
 * 6-Sector Positive Capability Matrix (Zero-Trust Whitelist)
 * Bir özellik burada açıkça TRUE değilse, o sektör o özelliğe KESİNLİKLE erişemez.
 */
export const SECTOR_CAPABILITY_MATRIX: Record<DomainId, Record<SectorCapabilityKey, boolean>> = {
  // 1. shopLP (Genel Perakende)
  RETAIL: {
    marketplaces: true,
    einvoice_purchases_sales: true,
    fast_pos: true,
    variants_inventory: true,
    google_merchant_xml: true,
    book_metadata: false,
    tables_kds_orders: false,
    digital_qr_menu: false,
    recipes_costing: false,
    hotel_reservations: false,
    real_estate_specs: false,
    real_estate_map_idx: false,
    real_estate_poster: false,
    automotive_specs: false,
    contracts_legal: false,
    portfolio_showcase: false,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  },

  // 2. BookLP (Kitap / Kırtasiye / Yayınevi - shopLP Alt Sektörü)
  BOOKSTORE: {
    marketplaces: true,
    einvoice_purchases_sales: true,
    fast_pos: true,
    variants_inventory: true,
    google_merchant_xml: true,
    book_metadata: true,
    tables_kds_orders: false,
    digital_qr_menu: false,
    recipes_costing: false,
    hotel_reservations: false,
    real_estate_specs: false,
    real_estate_map_idx: false,
    real_estate_poster: false,
    automotive_specs: false,
    contracts_legal: false,
    portfolio_showcase: false,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  },

  // 3. horecaLP (Kafe / Restoran / Yeme-İçme)
  HORECA: {
    marketplaces: false, // KATI YASAK: Restoranlarda pazaryeri olamaz
    einvoice_purchases_sales: false,
    fast_pos: false,
    variants_inventory: false,
    google_merchant_xml: false,
    book_metadata: false,
    tables_kds_orders: true,
    digital_qr_menu: true,
    recipes_costing: true,
    hotel_reservations: false,
    real_estate_specs: false,
    real_estate_map_idx: false,
    real_estate_poster: false,
    automotive_specs: false,
    contracts_legal: false,
    portfolio_showcase: false,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  },

  // 4. HotelLP (Otel / Butik Pansiyon / Konaklama - horecaLP Alt Sektörü)
  HOTEL: {
    marketplaces: false, // KATI YASAK: Otellerde pazaryeri olamaz
    einvoice_purchases_sales: false,
    fast_pos: false,
    variants_inventory: false,
    google_merchant_xml: false,
    book_metadata: false,
    tables_kds_orders: true,
    digital_qr_menu: true,
    recipes_costing: true,
    hotel_reservations: true,
    real_estate_specs: false,
    real_estate_map_idx: false,
    real_estate_poster: false,
    automotive_specs: false,
    contracts_legal: false,
    portfolio_showcase: false,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  },

  // 5. Emlak (Gayrimenkul Portföyü)
  REAL_ESTATE: {
    marketplaces: false, // KATI YASAK: İlan mağazalarında pazaryeri olamaz
    einvoice_purchases_sales: false, // KATI YASAK: İlan mağazalarında e-fatura/e-irsaliye gizlidir
    fast_pos: false,
    variants_inventory: false,
    google_merchant_xml: false,
    book_metadata: false,
    tables_kds_orders: false,
    digital_qr_menu: false,
    recipes_costing: false,
    hotel_reservations: false,
    real_estate_specs: true,
    real_estate_map_idx: true,
    real_estate_poster: true,
    automotive_specs: false,
    contracts_legal: true,
    portfolio_showcase: true,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  },

  // 6. Otomotiv (Motorlu Araçlar / Galeri)
  AUTOMOTIVE: {
    marketplaces: false, // KATI YASAK: Galeri mağazalarında pazaryeri olamaz
    einvoice_purchases_sales: false, // KATI YASAK: Galeri mağazalarında e-fatura/e-irsaliye gizlidir
    fast_pos: false,
    variants_inventory: false,
    google_merchant_xml: false,
    book_metadata: false,
    tables_kds_orders: false,
    digital_qr_menu: false,
    recipes_costing: false,
    hotel_reservations: false,
    real_estate_specs: false,
    real_estate_map_idx: false,
    real_estate_poster: false,
    automotive_specs: true,
    contracts_legal: true,
    portfolio_showcase: true,
    tcmb_currency: true,
    multi_branch: true,
    sms_whatsapp: true,
  }
};

/**
 * Deterministik Domain ID Çözücü (SSOT Domain Resolver)
 * Bir mağazanın veya branding objesinin hangi 6 sektörden birine ait olduğunu
 * yanılmasız, deterministik ve geriye dönük tam uyumlu şekilde tespit eder.
 */
export const resolveDomainId = (store: StoreInfo | any | null): DomainId => {
  if (!store) return "RETAIL";

  const s = store;
  const rawStoreType = (s.store_type || s.branding?.store_type || "").toString().toLowerCase().trim();
  const rawSector = (s.sector || s.page_layout_settings?.sector || s.branding?.page_layout_settings?.sector || s.branding?.sector || "").toString().toLowerCase().trim();
  const rawSubSector = (s.sub_sector || s.branding?.sub_sector || "").toString().toLowerCase().trim();
  const slug = (s.slug || s.branding?.slug || "").toString().toLowerCase().trim();
  const name = (s.name || s.branding?.name || s.branding?.store_name || "").toString().toUpperCase();

  // 1. GAP Bilişim / Genel Teknoloji Perakende Koruma Kuralı (Never misclassify as bookstore or portfolio)
  const isGapStore = slug === "gap" || name.includes("GAP BİLİŞİM") || name.includes("GAP BILISIM");
  if (isGapStore) {
    return "RETAIL";
  }

  // 2. Real Estate (Emlak) Tespiti
  if (
    rawStoreType === "real_estate" ||
    rawStoreType === "portfolio" ||
    rawStoreType === "emlak" ||
    rawSector === "real_estate" ||
    rawSector === "portfolio" ||
    rawSector === "emlak" ||
    rawSubSector === "real_estate"
  ) {
    return "REAL_ESTATE";
  }

  // 3. Automotive (Otomotiv / Galeri) Tespiti
  if (
    rawStoreType === "motor_vehicle" ||
    rawStoreType === "automotive" ||
    rawStoreType === "oto" ||
    rawStoreType === "galeri" ||
    rawSector === "motor_vehicle" ||
    rawSector === "automotive" ||
    rawSubSector === "automotive" ||
    rawSubSector === "motor_vehicle"
  ) {
    return "AUTOMOTIVE";
  }

  // 4. HotelLP (Otel / Rezervasyon) Tespiti
  const isHotelActive = Boolean(
    s.hotel_module_enabled === true ||
    s.branding?.hotel_module_enabled === true ||
    s.hotel_license_enabled === true ||
    s.branding?.hotel_license_enabled === true ||
    rawStoreType === "hotel" ||
    rawStoreType === "otel" ||
    rawSector === "hotel" ||
    rawSubSector === "hotel"
  );

  if (isHotelActive) {
    return "HOTEL";
  }

  // 5. horecaLP (Kafe / Restoran / Yeme-İçme) Tespiti
  if (
    rawStoreType === "cafe_restaurant" ||
    rawStoreType === "horeca" ||
    rawStoreType === "horecalp" ||
    rawStoreType === "restaurant" ||
    rawStoreType === "cafe" ||
    rawSector === "cafe_restaurant" ||
    rawSector === "horeca" ||
    rawSector === "horecalp" ||
    rawSector === "restaurant" ||
    rawSector === "cafe" ||
    rawSubSector === "cafe_restaurant" ||
    rawSubSector === "horeca" ||
    rawSubSector === "horecalp" ||
    rawSubSector === "restaurant" ||
    s.branding?.digital_menu_settings?.theme !== undefined
  ) {
    return "HORECA";
  }

  // 6. BookLP (Kitapçı / Yayınevi) Tespiti (Sadece perakende alt dalı olarak)
  const isBookActive = Boolean(
    s.bookstore_module_enabled === true ||
    s.branding?.bookstore_module_enabled === true ||
    s.bookstore_license_enabled === true ||
    s.branding?.bookstore_license_enabled === true ||
    s.store_concept === "bookstore" ||
    s.branding?.store_concept === "bookstore" ||
    s.page_layout_settings?.bookstore_mode === true ||
    s.branding?.page_layout_settings?.bookstore_mode === true ||
    s.theme_config?.bookstore_mode === true ||
    s.branding?.theme_config?.bookstore_mode === true ||
    rawStoreType === "bookstore" ||
    rawStoreType === "kitap" ||
    rawStoreType === "sahaf" ||
    rawSector === "bookstore" ||
    rawSector === "kitap" ||
    rawSector === "sahaf" ||
    rawSubSector === "bookstore" ||
    rawSubSector === "kitap" ||
    name.includes("BOOK") ||
    name.includes("KITAP") ||
    name.includes("KİTAP") ||
    name.includes("SAHAF") ||
    name.includes("YAYIN") ||
    slug.includes("book") ||
    slug.includes("kitap") ||
    slug.includes("dgbook") ||
    slug.includes("dgkitap")
  );

  if (isBookActive) {
    return "BOOKSTORE";
  }

  // Varsayılan: shopLP (Genel Perakende)
  return "RETAIL";
};

/**
 * Pozitif Yetki Doğrulama Fonksiyonu (Zero-Trust Capability Check)
 * Örnek: hasSectorCapability(store, "marketplaces") => true/false
 */
export const hasSectorCapability = (
  store: StoreInfo | any | null,
  capability: SectorCapabilityKey
): boolean => {
  const domainId = resolveDomainId(store);
  const matrix = SECTOR_CAPABILITY_MATRIX[domainId];
  return matrix ? Boolean(matrix[capability]) : false;
};

/**
 * Sektörel İsim ve İkon Rozeti Bilgisi Getirici
 */
export const getDomainMeta = (domainId: DomainId) => {
  switch (domainId) {
    case "RETAIL":
      return { id: "RETAIL", name: "shopLP Perakende", category: "Genel Ürün / E-Ticaret", badgeColor: "blue" };
    case "BOOKSTORE":
      return { id: "BOOKSTORE", name: "BookLP Kitap & Kırtasiye", category: "Kitap / Yayınevi", badgeColor: "rose" };
    case "HORECA":
      return { id: "HORECA", name: "horecaLP Restoran & Kafe", category: "Yeme-İçme & Menü", badgeColor: "orange" };
    case "HOTEL":
      return { id: "HOTEL", name: "HotelLP Konaklama & Otel", category: "Otel & Rezervasyon", badgeColor: "amber" };
    case "REAL_ESTATE":
      return { id: "REAL_ESTATE", name: "Emlak Portföy Mağazası", category: "Gayrimenkul & İlan", badgeColor: "sky" };
    case "AUTOMOTIVE":
      return { id: "AUTOMOTIVE", name: "Otomotiv Galeri Mağazası", category: "Vasıta & İlan", badgeColor: "emerald" };
  }
};

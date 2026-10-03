import { pool, logAction } from "../../models/db";

export interface SectorTaxonomyPackage {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: {
    category: string;
    sub_categories: string[];
    hb_category_id?: number;
    attributes?: Record<string, string[]>;
  }[];
}

export const SECTOR_TAXONOMY_PACKAGES: SectorTaxonomyPackage[] = [
  {
    id: "tech_computer",
    name: "Teknoloji & Bilgisayar",
    description: "Depolama, Dahili SSD, RAM, İşlemci, Anakart, Monitör, Çevre Birimleri ve Ağ Ürünleri",
    icon: "Cpu",
    categories: [
      {
        category: "Depolama & Harddiskler",
        sub_categories: ["Dahili SSD", "Harici SSD", "Masaüstü Harddisk (HDD)", "Taşınabilir Harddisk", "USB Flash Bellek", "MicroSD / SD Hafıza Kartı", "NAS & Sunucu Depolama"],
        hb_category_id: 2147483647
      },
      {
        category: "Bilgisayar Bileşenleri",
        sub_categories: ["Ekran Kartı (GPU)", "İşlemci (CPU)", "Anakart", "RAM (Bellek)", "Güç Kaynağı (PSU)", "Bilgisayar Kasası", "İşlemci Soğutucu & Sıvı Soğutma", "Kasa Fanı"],
        hb_category_id: 2147483647
      },
      {
        category: "Çevre Birimleri & Aksesuarlar",
        sub_categories: ["Monitör", "Oyuncu Klavyesi", "Kablosuz Klavye", "Oyuncu Faresi (Mouse)", "Kablosuz Mouse", "Kulaklık & Headset", "Webcam & Canlı Yayın Kamerası", "Mousepad", "USB Çoklayıcı / Hub", "Kablo & Dönüştürücüler"],
        hb_category_id: 2147483647
      },
      {
        category: "Ağ & Modem",
        sub_categories: ["Wi-Fi Router", "Menzil Genişletici (Range Extender)", "Modem Router", "Ağ Anahtarı (Switch)", "Access Point", "Wi-Fi Adaptör", "Powerline Adaptör"],
        hb_category_id: 2147483647
      },
      {
        category: "Bilgisayar Sistemleri",
        sub_categories: ["Dizüstü Bilgisayar (Laptop)", "Oyuncu Bilgisayarı (Gaming)", "Masaüstü All-in-One PC", "Mini PC", "Tablet Bilgisayar"],
        hb_category_id: 2147483647
      }
    ]
  },
  {
    id: "photography_camera",
    name: "Fotoğraf & Kamera",
    description: "Aynasız/DSLR Gövdeler, Lensler, Gimbal, Tripod, Stüdyo Işık ve Drone Sistemleri",
    icon: "Camera",
    categories: [
      {
        category: "Fotoğraf Makineleri",
        sub_categories: ["Aynasız Fotoğraf Makinesi", "DSLR Fotoğraf Makinesi", "Kompakt Dijital Kamera", "Şipşak (Instant) Fotoğraf Makinesi", "Analog & Film Fotoğraf Makineleri"],
        hb_category_id: 2147483647
      },
      {
        category: "Lensler & Filtreler",
        sub_categories: ["Aynasız Lensler", "DSLR Lensler", "Zoom Lens", "Sabit / Prime Lens", "UV & Koruyucu Filtre", "Polarize Filtre (CPL)", "ND Filtre", "Lens Kapağı & Parasoley"],
        hb_category_id: 2147483647
      },
      {
        category: "Video & Aksiyon Kameraları",
        sub_categories: ["Aksiyon Kamerası", "Gimbal & Sabitleyici", "Drone & Kameralı Multikopter", "Profesyonel Video Kamera", "Güvenlik & Bebek Kamerası"],
        hb_category_id: 2147483647
      },
      {
        category: "Stüdyo & Çekim Ekipmanları",
        sub_categories: ["Tripod & Monopod", "Ring Light / Halka Işık", "Sürekli Işık & Softbox", "Kamera Üstü Mikrofon", "Kablosuz Yaka Mikrofonu", "Çekim Masası & Fon Perdesi", "Kamera Çantası & Kılıf"],
        hb_category_id: 2147483647
      }
    ]
  },
  {
    id: "small_appliances",
    name: "Küçük Ev Aletleri",
    description: "Kahve Makineleri, Airfryer, Robot Süpürgeler, Blender ve Kişisel Bakım Aletleri",
    icon: "Coffee",
    categories: [
      {
        category: "İçecek Hazırlama",
        sub_categories: ["Filtre Kahve Makinesi", "Espresso & Kapsül Kahve Makinesi", "Türk Kahvesi Makinesi", "Çay Makinesi & Semaver", "Su Isıtıcı (Kettle)", "Blender & Smoothie Blender", "Katı Meyve Sıkacağı"],
        hb_category_id: 2147483647
      },
      {
        category: "Pişirme & Mutfak Aletleri",
        sub_categories: ["Sıcak Hava Fritözü (Airfryer)", "Tost Makinesi & Grill", "Mikrodalga Fırın", "Mutfak Robotu & Doğrayıcı", "El Mikseri & Blender Seti", "Ekmek Kızartma Makinesi", "Vakumlu Saklama Makinesi"],
        hb_category_id: 2147483647
      },
      {
        category: "Ev Temizliği & Ütü",
        sub_categories: ["Robot Süpürge", "Dikey Şarjlı Süpürge", "Toz Torbasız Süpürge", "Buharlı Temizleyici", "Buhar Kazanlı Ütü", "Buharlı Düzleştirici Ütü"],
        hb_category_id: 2147483647
      },
      {
        category: "Kişisel Bakım & Sağlık",
        sub_categories: ["Saç Kurutma Makinesi", "Saç Şekillendirici & Düzleştirici", "Erkek Tıraş Makinesi & Bakım Seti", "Epilatör & IPL Lazer", "Şarjlı Diş Fırçası", "Akıllı Baskül & Tartı"],
        hb_category_id: 2147483647
      }
    ]
  },
  {
    id: "consumer_electronics",
    name: "Elektronik & Ses Sistemleri",
    description: "Smart TV, Soundbar, Bluetooth Hoparlör, Akıllı Telefon Aksesuarları ve Akıllı Ev",
    icon: "Tv",
    categories: [
      {
        category: "Ses & Müzik Sistemleri",
        sub_categories: ["Bluetooth Hoparlör", "Soundbar & Ev Sinema Sistemi", "TWS Kablosuz Kulakiçi Kulaklık", "Gürültü Önleyici Kulaküstü Kulaklık", "Pikap & Plak Çalar", "Masaüstü Hoparlör"],
        hb_category_id: 2147483647
      },
      {
        category: "Görüntü Sistemleri",
        sub_categories: ["Smart LED TV", "OLED / QLED TV", "Projeksiyon Cihazı", "TV Box & Medya Oynatıcı", "Projeksiyon Perdesi", "TV Askı Aparatı"],
        hb_category_id: 2147483647
      },
      {
        category: "Telefon Aksesuarları & Giyilebilir",
        sub_categories: ["Akıllı Saat", "Akıllı Bileklik", "Hızlı Şarj Adaptörü", "Taşınabilir Şarj Cihazı (Powerbank)", "Manyetik / MagSafe Şarj Cihazı", "Araç İçi Telefon Tutucu", "Şarj & Data Kablosu"],
        hb_category_id: 2147483647
      },
      {
        category: "Akıllı Ev & Güvenlik",
        sub_categories: ["Akıllı Wi-Fi Priz", "Akıllı LED Ampul / Şerit", "Akıllı Kapı Kilidi", "Akıllı Oda Termostatı", "Wi-Fi Güvenlik Kamerası", "Hava Temizleme Cihazı"],
        hb_category_id: 2147483647
      }
    ]
  }
];

/**
 * Returns all predefined sector packages
 */
export function getPredefinedSectorPackages(): SectorTaxonomyPackage[] {
  return SECTOR_TAXONOMY_PACKAGES;
}

/**
 * Pre-seeds chosen sector taxonomy packages into a store
 */
export async function seedStoreSectorTaxonomy(
  storeId: number,
  packageIds: string[],
  userId?: number
): Promise<{ success: boolean; addedCategoriesCount: number; packagesApplied: string[] }> {
  const selectedPackages = SECTOR_TAXONOMY_PACKAGES.filter(p => packageIds.includes(p.id) || packageIds.includes("all"));
  if (selectedPackages.length === 0) {
    throw new Error("Geçerli bir sektör kategori paketi seçilmedi.");
  }

  // Get current store branding/settings
  const storeRes = await pool.query("SELECT id, name, branding FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) {
    throw new Error("Mağaza bulunamadı.");
  }

  const store = storeRes.rows[0];
  let branding = store.branding || {};
  if (typeof branding === "string") {
    try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
  }

  // 1. Merge into branding.shipping_profiles / sector_categories
  const currentCategorySpecs = branding.category_specs || {};
  const currentCategoriesList = Array.isArray(branding.custom_categories) ? [...branding.custom_categories] : [];

  let totalCategoriesAdded = 0;

  for (const pkg of selectedPackages) {
    for (const item of pkg.categories) {
      if (!currentCategoriesList.includes(item.category)) {
        currentCategoriesList.push(item.category);
        totalCategoriesAdded++;
      }
      if (!currentCategorySpecs[item.category]) {
        currentCategorySpecs[item.category] = {
          sub_categories: item.sub_categories,
          hb_category_id: item.hb_category_id,
          source: "hepsiburada_standard_taxonomy",
          package_id: pkg.id
        };
      } else {
        // Merge subcategories without duplicates
        const existingSubs = currentCategorySpecs[item.category].sub_categories || [];
        const mergedSubs = Array.from(new Set([...existingSubs, ...item.sub_categories]));
        currentCategorySpecs[item.category].sub_categories = mergedSubs;
        currentCategorySpecs[item.category].package_id = pkg.id;
      }
    }
  }

  branding.custom_categories = currentCategoriesList;
  branding.category_specs = currentCategorySpecs;
  branding.sector_taxonomy_packages = Array.from(new Set([
    ...(branding.sector_taxonomy_packages || []),
    ...selectedPackages.map(p => p.id)
  ]));

  await pool.query(
    "UPDATE stores SET branding = $1 WHERE id = $2",
    [JSON.stringify(branding), storeId]
  );

  await logAction(
    storeId,
    userId || null,
    "seed_sector_taxonomy",
    "store",
    storeId,
    `Hepsiburada Standart Sektör Kategori Paketi Tanımlandı (${selectedPackages.map(p => p.name).join(", ")})`,
    { packageIds, addedCategoriesCount: totalCategoriesAdded }
  );

  return {
    success: true,
    addedCategoriesCount: totalCategoriesAdded,
    packagesApplied: selectedPackages.map(p => p.name)
  };
}

/**
 * Populates marketplace_master_taxonomies database table with canonical Hepsiburada & standard categories
 */
export async function populateMarketplaceMasterTaxonomies(): Promise<{ totalInserted: number }> {
  let inserted = 0;

  for (const pkg of SECTOR_TAXONOMY_PACKAGES) {
    for (const cat of pkg.categories) {
      // 1. Insert parent category
      await pool.query(`
        INSERT INTO marketplace_master_taxonomies (marketplace, category_id, parent_id, name, path, leaf, sector, attributes, created_at)
        VALUES ('hepsiburada', $1, NULL, $2, $3, FALSE, $4, '{}'::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING
      `, [
        `HB-CAT-${cat.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        cat.category,
        cat.category,
        pkg.id
      ]);

      // 2. Insert leaf subcategories
      for (const sub of cat.sub_categories) {
        const subId = `HB-SUB-${sub.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const fullPath = `${cat.category} > ${sub}`;
        const res = await pool.query(`
          INSERT INTO marketplace_master_taxonomies (marketplace, category_id, parent_id, name, path, leaf, sector, attributes, created_at)
          VALUES ('hepsiburada', $1, $2, $3, $4, TRUE, $5, '{}'::jsonb, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING
        `, [
          subId,
          `HB-CAT-${cat.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          sub,
          fullPath,
          pkg.id
        ]);
        if ((res.rowCount || 0) > 0) inserted++;
      }
    }
  }

  return { totalInserted: inserted };
}

/**
 * Intelligent Invisible Category Bridge (Görünmez Kategori Köprüsü)
 * Maps legacy/custom store categories (e.g. DEPOLAMA&HARDDISKLER) to canonical Hepsiburada/Amazon taxonomy
 * without modifying any original product categories in the store.
 */
export async function autoBridgeStoreCategories(storeId: number): Promise<{
  success: boolean;
  mappedCount: number;
  bridge: Record<string, { canonicalCategory: string; hbCategoryId?: string; amazonCategoryId?: string }>;
}> {
  const storeRes = await pool.query("SELECT id, name, branding FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) throw new Error("Mağaza bulunamadı.");

  const store = storeRes.rows[0];
  let branding = store.branding || {};
  if (typeof branding === "string") {
    try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
  }

  // Get distinct store categories
  const catRes = await pool.query(`
    SELECT DISTINCT TRIM(category) as category
    FROM products
    WHERE store_id = $1 AND category IS NOT NULL AND TRIM(category) != ''
  `, [storeId]);

  const existingStoreCategories = catRes.rows.map(r => r.category);
  const bridge: Record<string, { canonicalCategory: string; hbCategoryId?: string; amazonCategoryId?: string }> = branding.category_bridge || {};

  // Standard taxonomy dictionary for fuzzy bridge matching
  const canonicalDict: { pattern: RegExp; canonical: string; hbId: string; amzId: string }[] = [
    { pattern: /depolama|harddisk|ssd|hdd/i, canonical: "Depolama & Harddiskler", hbId: "1000107", amzId: "7000103" },
    { pattern: /bellek|hafıza|kartı|flash|usb/i, canonical: "Depolama & Harddiskler > MicroSD / SD Hafıza Kartı", hbId: "1000101", amzId: "7000101" },
    { pattern: /klavye|mouse|fare/i, canonical: "Çevre Birimleri & Aksesuarlar > Klavye & Mouse", hbId: "1000118", amzId: "7000108" },
    { pattern: /kablo|dönüştürücü|adaptör/i, canonical: "Çevre Birimleri & Aksesuarlar > Kablo & Dönüştürücüler", hbId: "1000182", amzId: "371969" },
    { pattern: /kulaklık|headset|tws/i, canonical: "Çevre Birimleri & Aksesuarlar > Kulaklık & Headset", hbId: "371967", amzId: "7000112" },
    { pattern: /monitör/i, canonical: "Çevre Birimleri & Aksesuarlar > Monitör", hbId: "1000117", amzId: "7000110" },
    { pattern: /modem|network|router|switch|wifi/i, canonical: "Ağ & Modem", hbId: "1000125", amzId: "7000117" },
    { pattern: /notebook|laptop|dizüstü/i, canonical: "Bilgisayar Sistemleri > Dizüstü Bilgisayar (Laptop)", hbId: "1000114", amzId: "7000106" },
    { pattern: /bilgisayar|pc|masaüstü/i, canonical: "Bilgisayar Sistemleri", hbId: "1000116", amzId: "7000106" },
    { pattern: /ram/i, canonical: "Bilgisayar Bileşenleri > RAM (Bellek)", hbId: "1000108", amzId: "7000106" },
    { pattern: /yazıcı|tarayıcı|printer|barkod/i, canonical: "Yazıcılar & Tarayıcılar", hbId: "1000129", amzId: "7000116" },
    { pattern: /video|fotoğraf|kamera/i, canonical: "Fotoğraf & Kamera", hbId: "2000203", amzId: "7000111" },
    { pattern: /ses|hoparlör|speaker|soundbar/i, canonical: "Ses & Müzik Sistemleri", hbId: "1000188", amzId: "7000303" },
    { pattern: /güvenlik/i, canonical: "Akıllı Ev & Güvenlik", hbId: "2000103", amzId: "7000304" },
    { pattern: /küçük ev aletleri/i, canonical: "Küçük Ev Aletleri", hbId: "1000130", amzId: "7000204" }
  ];

  let mappedCount = 0;
  const hbSettings = branding.hepsiburada_settings || {};
  const hbMappings = hbSettings.categoryMappings || {};

  for (const rawCat of existingStoreCategories) {
    if (!bridge[rawCat]) {
      const matched = canonicalDict.find(d => d.pattern.test(rawCat));
      if (matched) {
        bridge[rawCat] = {
          canonicalCategory: matched.canonical,
          hbCategoryId: matched.hbId,
          amazonCategoryId: matched.amzId
        };
        if (!hbMappings[rawCat]) {
          hbMappings[rawCat] = matched.hbId;
        }
        mappedCount++;
      }
    }
  }

  hbSettings.categoryMappings = hbMappings;
  branding.hepsiburada_settings = hbSettings;
  branding.category_bridge = bridge;

  await pool.query(
    "UPDATE stores SET branding = $1 WHERE id = $2",
    [JSON.stringify(branding), storeId]
  );

  return {
    success: true,
    mappedCount,
    bridge
  };
}

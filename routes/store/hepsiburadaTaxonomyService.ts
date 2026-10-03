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
): Promise<{ success: boolean; addedCategoriesCount: number; mappedProductsCount: number; packagesApplied: string[] }> {
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
  const hbSettings = branding.hepsiburada_settings || {};
  const hbMappings: Record<string, string> = hbSettings.categoryMappings || {};

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

      if (item.hb_category_id) {
        const hbIdStr = String(item.hb_category_id);
        hbMappings[item.category] = hbIdStr;
        for (const sub of item.sub_categories) {
          hbMappings[`${item.category} > ${sub}`] = hbIdStr;
          hbMappings[sub] = hbIdStr;
        }
      }
    }
  }

  hbSettings.categoryMappings = hbMappings;
  branding.hepsiburada_settings = hbSettings;
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

  // Automatically bridge and categorize existing uncategorized/legacy products into the canonical tree
  const bridgeRes = await autoBridgeStoreCategories(storeId);

  await logAction(
    storeId,
    userId || null,
    "seed_sector_taxonomy",
    "store",
    storeId,
    `Hepsiburada Standart Sektör Kategori Paketi Tanımlandı (${selectedPackages.map(p => p.name).join(", ")})`,
    { packageIds, addedCategoriesCount: totalCategoriesAdded, mappedProductsCount: bridgeRes.categorizedProductsCount }
  );

  return {
    success: true,
    addedCategoriesCount: totalCategoriesAdded || currentCategoriesList.length,
    mappedProductsCount: bridgeRes.categorizedProductsCount,
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
  categorizedProductsCount: number;
  bridge: Record<string, { canonicalCategory: string; canonicalSubCategory?: string; hbCategoryId?: string; amazonCategoryId?: string }>;
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
  const bridge: Record<string, { canonicalCategory: string; canonicalSubCategory?: string; hbCategoryId?: string; amazonCategoryId?: string }> = branding.category_bridge || {};

  // Comprehensive Canonical Taxonomy Dictionary for categories & products
  const canonicalRules: {
    pattern: RegExp;
    category: string;
    subCategory: string;
    hbId: string;
    amzId: string;
  }[] = [
    { pattern: /\b(nvme|m\.2|ssd|katı hal)\b/i, category: "Depolama & Harddiskler", subCategory: "SSD (Katı Hal Sürücü)", hbId: "1000107", amzId: "7000103" },
    { pattern: /\b(taşınabilir disk|harici disk|elements|my passport|expansion|external hdd|harici ssd)\b/i, category: "Depolama & Harddiskler", subCategory: "Taşınabilir Disk (Harici HDD/SSD)", hbId: "1000107", amzId: "7000103" },
    { pattern: /\b(harddisk|hdd|sabit disk|barracuda|ironwolf|skyhawk|wd blue|wd purple|wd red|surveillance)\b/i, category: "Depolama & Harddiskler", subCategory: "Dahili Sabit Disk (HDD)", hbId: "1000107", amzId: "7000103" },
    { pattern: /\b(microsd|micro sd|sdxc|sdhc|hafıza kartı|canvas select|canvas go)\b/i, category: "Depolama & Harddiskler", subCategory: "MicroSD / SD Hafıza Kartı", hbId: "1000107", amzId: "7000103" },
    { pattern: /\b(usb bellek|flash bellek|flash sürücü|datatraveler|cruzer|dual drive|rainbow line)\b/i, category: "Depolama & Harddiskler", subCategory: "USB Flash Bellek", hbId: "1000107", amzId: "7000103" },
    { pattern: /depolama|harddisk/i, category: "Depolama & Harddiskler", subCategory: "SSD (Katı Hal Sürücü)", hbId: "1000107", amzId: "7000103" },
    { pattern: /bellek&hafıza/i, category: "Depolama & Harddiskler", subCategory: "USB Flash Bellek", hbId: "1000107", amzId: "7000103" },

    { pattern: /\b(ddr4|ddr5|ddr3|sodimm|so-dimm|udimm|dimm|ram bellek|notebook ram|pc ram|twinmos.*gb.*mhz)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "RAM (Bellek)", hbId: "1000108", amzId: "7000106" },
    { pattern: /\b(anakart|motherboard|b550|b650|b760|h610|a520|x670|z790)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "Anakart (Motherboard)", hbId: "1000108", amzId: "7000106" },
    { pattern: /\b(ekran kartı|geforce|rtx|radeon|rx\s?\d{4}|gtx)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "Ekran Kartı (GPU)", hbId: "1000108", amzId: "7000106" },
    { pattern: /\b(işlemci|ryzen|core i3|core i5|core i7|core i9)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "İşlemci (CPU)", hbId: "1000108", amzId: "7000106" },
    { pattern: /\b(güç kaynağı|power supply|psu)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "Güç Kaynağı (PSU)", hbId: "1000108", amzId: "7000106" },
    { pattern: /\b(sıvı soğutma|işlemci soğutucu|kasa fanı|termal macun)\b/i, category: "Bilgisayar Bileşenleri", subCategory: "Soğutma Sistemleri & Fan", hbId: "1000108", amzId: "7000106" },

    { pattern: /\b(monitör|monitor|curved|ips panel|va panel|\d{2}\s?inç.*hz)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Monitör", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(klavye|mouse|fare|mk\d{3}|m171|m185|m190|m220|m330|g102|g213|g305|deathadder|sunum kumandası|r400|r500)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Klavye & Mouse", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(kulaklık|headset|earbuds|airpods|buds|jbl tune|jbl wave|kafa üstü|kulak içi|mikrofon)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Kulaklık & Mikrofon", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(webcam|web kamera|c270|c310|c920|brio)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Webcam (Web Kamera)", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(usb hub|çoklayıcı|docking|kart okuyucu|card reader)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "USB Hub & Çoklayıcı", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(notebook çantası|laptop çantası|sırt çantası|laptop stand|soğutucu stand)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Notebook Çantası & Stand", hbId: "1000118", amzId: "7000108" },
    { pattern: /\b(kablo|hdmi|displayport|vga|dvi|type-c|usb-c|lightning|cat6|cat5|patch cord|dönüştürücü|çevirici|adaptör|şarj aleti|şarj cihazı|powerbank|taşınabilir şarj|akım korumalı priz|uzatma kablo)\b/i, category: "Çevre Birimleri & Aksesuarlar", subCategory: "Kablo & Dönüştürücüler", hbId: "1000118", amzId: "7000108" },

    { pattern: /\b(modem|router|access point|menzil genişletici|repeater|deco|mesh|keenetic|archer|aruba|switch|poe|wi-fi adaptör|wifi adaptör|ağ kartı)\b/i, category: "Ağ & Modem (Network)", subCategory: "Modem & Router", hbId: "1000125", amzId: "7000117" },

    { pattern: /\b(yazıcı|printer|tanklı|lazer yazıcı|mürekkep püskürtmeli|tarayıcı|scanner|barkod okuyucu|termal yazıcı|etiket yazıcı|toner|kartuş|şerit)\b/i, category: "Yazıcı, Tarayıcı & Ofis", subCategory: "Lazer & Tanklı Yazıcılar", hbId: "1000129", amzId: "7000116" },

    { pattern: /\b(laptop|notebook|dizüstü|macbook|thinkpad|ideapad|vivobook|zenbook|latitude|inspiron|probook|elitebook|vostro)\b/i, category: "Bilgisayar Sistemleri", subCategory: "Dizüstü Bilgisayar (Laptop)", hbId: "1000114", amzId: "7000106" },
    { pattern: /\b(all in one|masaüstü bilgisayar|hazır sistem|mini pc|nuc|workstation)\b/i, category: "Bilgisayar Sistemleri", subCategory: "Masaüstü Bilgisayar (PC)", hbId: "1000114", amzId: "7000106" },
    { pattern: /\b(tablet|ipad|galaxy tab|matepad)\b/i, category: "Bilgisayar Sistemleri", subCategory: "Tablet", hbId: "1000114", amzId: "7000106" },
    { pattern: /\b(windows 11|windows 10|office 2021|office 365|antivirüs|lisans|oem|kutulu yazılım)\b/i, category: "Bilgisayar Sistemleri", subCategory: "Masaüstü Bilgisayar (PC)", hbId: "1000114", amzId: "7000106" },

    { pattern: /\b(fotoğraf makinesi|kamera|tripod|hafıza|aksiyon kamera|gopro|insta360|gimbal|lens|objektif|softbox|ring light)\b/i, category: "Fotoğraf & Kamera", subCategory: "Aksiyon Kamera & Drone", hbId: "2000203", amzId: "7000111" },
    { pattern: /\b(güvenlik kamerası|ip kamera|nvr|dvr|alarm|akıllı priz|akıllı ampul|bebek kamerası|tapo)\b/i, category: "Akıllı Ev & Güvenlik", subCategory: "Güvenlik Kamerası (IP/CCTV)", hbId: "2000103", amzId: "7000304" },
    { pattern: /\b(hoparlör|speaker|soundbar|bluetooth hoparlör|ses sistemi|projeksiyon|tv askı|tv kutusu|android box|kumanda)\b/i, category: "TV, Ses & Görüntü Sistemleri", subCategory: "Bluetooth Hoparlör & Ses Sistemi", hbId: "1000188", amzId: "7000303" },
    { pattern: /\b(kahve makinesi|çay makinesi|blender|mikser|airfryer|tost makinesi|su ısıtıcı|kettle|süpürge|ütü|tıraş makinesi|saç kurutma|tartı|baskül|vantilatör|ısıtıcı)\b/i, category: "Küçük Ev Aletleri", subCategory: "Mutfak Aletleri", hbId: "1000130", amzId: "7000204" }
  ];

  let mappedCount = 0;
  const hbSettings = branding.hepsiburada_settings || {};
  const hbMappings = hbSettings.categoryMappings || {};

  for (const rawCat of existingStoreCategories) {
    const matched = canonicalRules.find(d => d.pattern.test(rawCat));
    if (matched) {
      bridge[rawCat] = {
        canonicalCategory: matched.category,
        canonicalSubCategory: matched.subCategory,
        hbCategoryId: matched.hbId,
        amazonCategoryId: matched.amzId
      };
      if (!hbMappings[rawCat]) {
        hbMappings[rawCat] = matched.hbId;
      }
      mappedCount++;
    }
  }

  // Also classify products whose category is empty, 'Genel', 'Hızlı Ekleme', or legacy ALL-CAPS without sub_category
  const prodRes = await pool.query(`
    SELECT id, name, category, sub_category, brand, product_code
    FROM products
    WHERE store_id = $1
  `, [storeId]);

  let categorizedProductsCount = 0;
  for (const p of prodRes.rows) {
    const rawCat = String(p.category || "").trim();
    const rawSub = String(p.sub_category || "").trim();
    const isGenericOrEmpty = !rawCat || /^(genel|hızlı ekleme|diger|diğer|kategorisiz)$/i.test(rawCat);
    const isLegacyAllCaps = rawCat.length > 0 && rawCat === rawCat.toUpperCase() && !rawSub;

    if (isGenericOrEmpty || isLegacyAllCaps) {
      const searchStr = `${p.name || ""} ${rawCat} ${p.brand || ""}`;
      const matched = canonicalRules.find(d => d.pattern.test(searchStr));
      if (matched) {
        await pool.query(
          `UPDATE products SET category = $1, sub_category = $2 WHERE id = $3 AND store_id = $4`,
          [matched.category, matched.subCategory, p.id, storeId]
        );
        categorizedProductsCount++;
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
    categorizedProductsCount,
    bridge
  };
}

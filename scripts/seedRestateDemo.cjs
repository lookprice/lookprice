const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lookprice"
});

async function seed() {
  console.log("Starting restateLP Demo (Synthetic / Safe) seeding...");

  // 1. Create or update store
  const storeCheck = await pool.query("SELECT id FROM stores WHERE slug = $1", ["restatelp-demo"]);
  let storeId;

  // Fully synthetic, non-routable demo phone numbers and fictional identity
  const DUMMY_STORE_PHONE = "+90 (555) 000 00 00";
  const DUMMY_STORE_WA = "+90 (555) 000 00 00";
  const DUMMY_ADDRESS = "Örnek Mah. Demo Plaza No:100 / Sanal İnovasyon Bölgesi";

  const brandingData = {
    name: "restateLP Demo Gayrimenkul & Portföy",
    store_name: "restateLP Demo Gayrimenkul & Portföy",
    legal_name: "RESTATELP DEMO GAYRİMENKUL SİMÜLASYON A.Ş.",
    email: "demo@restatelp.com",
    phone: DUMMY_STORE_PHONE,
    whatsapp_number: DUMMY_STORE_WA,
    address: DUMMY_ADDRESS,
    country: "CY",
    language: "tr",
    default_currency: "GBP",
    currency_rates: {
      GBP: 63.50,
      EUR: 54.20,
      USD: 49.30
    },
    store_type: "portfolio",
    store_concept: "portfolio",
    primary_color: "#0284c7",
    hero_title: "restateLP Sanal Portföy & Gayrimenkul Simülasyonu",
    hero_subtitle: "Emlak ve portföy yönetiminin tüm özelliklerini test edebileceğiniz güvenli simülasyon ortamı.",
    page_layout_settings: {
      sector: "real_estate",
      store_type: "portfolio",
      theme_variant: "modern_luxury",
      web_content: {
        hero: {
          title: "restateLP Sanal Portföy & Gayrimenkul Simülasyonu",
          subtitle: "Villa, rezidans, ticari yatırım ve arsa portföy yönetiminin tüm adımlarını keşfedin.",
          bgImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80"
        },
        stats: [
          { label: "Örnek İlan", value: "8" },
          { label: "Sanal Portföy Değeri", value: "£45M" },
          { label: "Simülasyon Satışı", value: "120+" },
          { label: "Sistem Memnuniyeti", value: "%100" }
        ],
        trustSlogan: "Demo Ortamı - Güvenli & İzole Simülasyon"
      }
    },
    hotel_module_enabled: false,
    hotel_license_enabled: false,
    bookstore_module_enabled: false,
    bookstore_license_enabled: false,
    is_demo: true
  };

  if (storeCheck.rows.length > 0) {
    storeId = storeCheck.rows[0].id;
    console.log(`Found existing store with id: ${storeId}`);
    await pool.query(
      `UPDATE stores 
       SET name = $1, address = $2, phone = $3, branding = $4, is_approved = TRUE, status = 'active'
       WHERE id = $5`,
      [
        "restateLP Demo Gayrimenkul & Portföy",
        DUMMY_ADDRESS,
        DUMMY_STORE_PHONE,
        brandingData,
        storeId
      ]
    );
  } else {
    const insertStore = await pool.query(
      `INSERT INTO stores (name, slug, store_code, address, phone, branding, is_approved, status)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'active')
       RETURNING id`,
      [
        "restateLP Demo Gayrimenkul & Portföy",
        "restatelp-demo",
        "LP-RESTATE",
        DUMMY_ADDRESS,
        DUMMY_STORE_PHONE,
        brandingData
      ]
    );
    storeId = insertStore.rows[0].id;
    console.log(`Created new store with id: ${storeId}`);
  }

  // 2. Create or update user: demo@restatelp.com / restatelp1234
  const hashedPassword = bcrypt.hashSync("restatelp1234", 10);
  const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", ["demo@restatelp.com"]);

  if (userCheck.rows.length > 0) {
    await pool.query(
      `UPDATE users 
       SET password = $1, role = 'storeadmin', store_id = $2, name = 'restateLP Demo Temsilcisi' 
       WHERE email = $3`,
      [hashedPassword, storeId, "demo@restatelp.com"]
    );
    console.log("Updated demo@restatelp.com user");
  } else {
    await pool.query(
      `INSERT INTO users (name, email, password, role, store_id, phone, address)
       VALUES ($1, $2, $3, 'storeadmin', $4, $5, $6)`,
      [
        "restateLP Demo Temsilcisi",
        "demo@restatelp.com",
        hashedPassword,
        storeId,
        DUMMY_STORE_PHONE,
        DUMMY_ADDRESS
      ]
    );
    console.log("Created demo@restatelp.com user");
  }

  // 3. Create Branches (Fictional Demo Branches)
  const branches = [
    {
      name: "restateLP Demo Şube 1 (Kuzey Bölgesi)",
      slug: "restatelp-girne-demo",
      address: "Örnek Mah. Kıyı Bulvarı No:12 / Demo Bölge",
      phone: "+90 (555) 000 00 11"
    },
    {
      name: "restateLP Demo Şube 2 (Sahil Bölgesi)",
      slug: "restatelp-iskele-demo",
      address: "Örnek Mah. Sahil Caddesi No:8 / Demo Bölge",
      phone: "+90 (555) 000 00 12"
    }
  ];

  for (const b of branches) {
    const bCheck = await pool.query("SELECT id FROM stores WHERE slug = $1", [b.slug]);
    if (bCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO stores (name, slug, address, phone, parent_id, branding, is_approved, status)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'active')`,
        [b.name, b.slug, b.address, b.phone, storeId, brandingData]
      );
    } else {
      await pool.query(
        `UPDATE stores SET name = $1, address = $2, phone = $3, branding = $4 WHERE id = $5`,
        [b.name, b.address, b.phone, brandingData, bCheck.rows[0].id]
      );
    }
    console.log(`Configured synthetic branch: ${b.name}`);
  }

  // 4. Create Consultants (Fictional synthetic profiles with non-routable numbers)
  await pool.query("DELETE FROM consultants WHERE store_id = $1", [storeId]);
  const consultantsData = [
    {
      name: "Can Örnek (Demo Broker)",
      email: "demo.broker@restatelp.com",
      phone: "+90 (555) 000 00 01",
      role: "Kurucu Broker / Gayrimenkul Yatırım Danışmanı",
      image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      performance: { closedDeals: 42, rating: 4.9, volume: "£8.5M" }
    },
    {
      name: "Deniz Simülasyon (Portföy Danışmanı)",
      email: "demo.danisman1@restatelp.com",
      phone: "+90 (555) 000 00 02",
      role: "Kıdemli Portföy Yöneticisi (Sahil Rezidans Uzmanı)",
      image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      performance: { closedDeals: 28, rating: 5.0, volume: "£5.2M" }
    },
    {
      name: "Barış Test (Yatırım Temsilcisi)",
      email: "demo.danisman2@restatelp.com",
      phone: "+90 (555) 000 00 03",
      role: "Ticari Mülk & Arsa Projeleri Temsilcisi",
      image_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
      performance: { closedDeals: 19, rating: 4.8, volume: "£6.4M" }
    }
  ];

  for (const c of consultantsData) {
    await pool.query(
      `INSERT INTO consultants (store_id, name, email, phone, role, image_url, performance, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
      [storeId, c.name, c.email, c.phone, c.role, c.image_url, c.performance]
    );
  }
  console.log(`Seeded ${consultantsData.length} synthetic consultants`);

  // 5. Create Real Estate Properties (is_on_enrakipsiz strictly FALSE)
  await pool.query("DELETE FROM real_estate_properties WHERE store_id = $1", [storeId]);

  const properties = [
    {
      title: "Girne Bellapais'te Özel Havuzlu & Deniz Manzaralı Müstakil Lüks Villa (Örnek İlan)",
      description: "Bellapais manastırına komşu, kesintisiz Akdeniz ve Beşparmak dağları manzarasına hakim. 4 yatak odası, tüm odalar ebeveyn banyolu, 10x5m taşmalı özel havuz, peyzajlı bahçe ve 2 araçlık kapalı otopark.",
      price: 485000,
      currency: "GBP",
      location: "Girne, Bellapais",
      type: "villa",
      subtype: "Müstakil Villa",
      kktc_region: "Girne",
      kktc_sub_region: "Bellapais",
      kktc_title_type: "Türk Koçanı",
      room_count: "4+1",
      square_meters: 340,
      sqm_gross: 420,
      building_age: "0 (Sıfır)",
      floor: 1,
      total_floors: 2,
      heating: "VRF Klima / Yerden Isıtma",
      furnished: true,
      in_gated_community: true,
      dues: 120,
      dues_currency: "GBP",
      listing_intent: "sale",
      branch_name: "Merkez Ofis",
      reference_no: "LP-VIL-101",
      responsible_agent: "Can Örnek (Demo Broker)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "Alsancak Escape Plajı Bölgesinde Ortak Havuzlu Lüks Daire (2+1) (Örnek İlan)",
      description: "Escape Beach Club ve Merit oteller bölgesine 3 dk yürüme mesafesinde. Yarı olimpik ortak havuz, çocuk oyun parkı, jeneratör altyapısı ve yüksek kira amortisman süresi.",
      price: 135000,
      currency: "GBP",
      location: "Girne, Alsancak",
      type: "apartment",
      subtype: "Daire",
      kktc_region: "Girne",
      kktc_sub_region: "Alsancak",
      kktc_title_type: "Eşdeğer Koçan",
      room_count: "2+1",
      square_meters: 95,
      sqm_gross: 110,
      building_age: "1",
      floor: 2,
      total_floors: 3,
      heating: "Inverter Klima",
      furnished: true,
      in_gated_community: true,
      dues: 45,
      dues_currency: "GBP",
      listing_intent: "sale",
      branch_name: "restateLP Demo Şube 1",
      reference_no: "LP-APT-202",
      responsible_agent: "Deniz Simülasyon (Portföy Danışmanı)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "Lefkoşa Dereboyu Caddesinde Kurumsal Kiracılı Cadde Mağazası (Örnek İlan)",
      description: "Lefkoşa'nın en yoğun ticari aksında, 5 yıllık kurumsal kira sözleşmeli (Aylık £1,800 net kira getirisi). Yatırımcılar için yüksek yıllık getiri ve değer artış garantisi.",
      price: 290000,
      currency: "GBP",
      location: "Lefkoşa, Dereboyu",
      type: "commercial",
      subtype: "Dükkan / Mağaza",
      kktc_region: "Lefkoşa",
      kktc_sub_region: "Dereboyu",
      kktc_title_type: "Türk Koçanı",
      room_count: "2 Bölüm",
      square_meters: 180,
      sqm_gross: 210,
      building_age: "5",
      floor: 1,
      total_floors: 4,
      heating: "VRF Merkezi Sistem",
      furnished: false,
      in_gated_community: false,
      dues: 0,
      dues_currency: "GBP",
      listing_intent: "sale",
      branch_name: "Merkez Ofis",
      reference_no: "LP-COM-303",
      responsible_agent: "Barış Test (Yatırım Temsilcisi)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "İskele Long Beach Sahilinde Denize Sıfır Çatı Teraslı Penthouse (3+1) (Örnek İlan)",
      description: "Akdeniz'in en popüler sahilinde özel çatı terası, jakuzi altyapısı ve kesintisiz gün batımı manzarası. Otel konseptli sitede spa, fitness, restoran ve özel plaj erişimi.",
      price: 245000,
      currency: "GBP",
      location: "İskele, Long Beach",
      type: "residence",
      subtype: "Penthouse Rezidans",
      kktc_region: "İskele",
      kktc_sub_region: "Long Beach",
      kktc_title_type: "Eşdeğer Koçan",
      room_count: "3+1",
      square_meters: 160,
      sqm_gross: 230,
      building_age: "0 (Sıfır)",
      floor: 12,
      total_floors: 12,
      heating: "Klima & Şömine",
      furnished: true,
      in_gated_community: true,
      cati_terasi: true,
      trafo_bedeli: true,
      kdv_status: "Ödendi",
      dues: 80,
      dues_currency: "GBP",
      listing_intent: "sale",
      branch_name: "restateLP Demo Şube 2",
      reference_no: "LP-PEN-404",
      responsible_agent: "Deniz Simülasyon (Portföy Danışmanı)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "Çatalköy'de Doğa ve Deniz Manzaralı Villa İmarlı Müstakil Arsa (Örnek İlan)",
      description: "%35 taban oturumu, 2 kat villa yapımına uygun, yolu açılmış, elektrik ve su altyapısı sınırında hazır müstakil parsel.",
      price: 165000,
      currency: "GBP",
      location: "Girne, Çatalköy",
      type: "land",
      subtype: "İmarlı Arsa",
      kktc_region: "Girne",
      kktc_sub_region: "Çatalköy",
      kktc_title_type: "Eşdeğer Koçan",
      block_plot: "Ada 100 / Parsel 1",
      square_meters: 850,
      sqm_gross: 850,
      listing_intent: "sale",
      branch_name: "Merkez Ofis",
      reference_no: "LP-LND-505",
      responsible_agent: "Barış Test (Yatırım Temsilcisi)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "Girne Merkez'de Prestijli Rezidans Eşyalı Kiralık Daire (1+1) (Örnek İlan)",
      description: "Girne limanına ve üniversitelere yakın, kapalı otoparklı, 24 saat güvenlikli rezidansta hemen taşınmaya hazır temiz 1+1.",
      price: 650,
      currency: "GBP",
      deposit: 1300,
      billing_period: "monthly",
      location: "Girne, Merkez",
      type: "apartment",
      subtype: "Kiralık Daire",
      kktc_region: "Girne",
      kktc_sub_region: "Merkez",
      kktc_title_type: "Eşdeğer Koçan",
      room_count: "1+1",
      square_meters: 65,
      sqm_gross: 75,
      building_age: "2",
      floor: 4,
      total_floors: 6,
      heating: "Klima",
      furnished: true,
      in_gated_community: true,
      dues: 35,
      dues_currency: "GBP",
      listing_intent: "rent",
      branch_name: "restateLP Demo Şube 1",
      reference_no: "LP-RNT-606",
      responsible_agent: "Deniz Simülasyon (Portföy Danışmanı)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "Bodrum Yalıkavak Marina Yakınında Özel Plajlı & Sonsuzluk Havuzlu Taş Villa (Örnek İlan)",
      description: "Yalıkavak Tilkicik koyuna hakim, 1.200 m² arsa içerisinde müstakil bahçe, müştemilat, şarap kavı ve sonsuzluk havuzu.",
      price: 1850000,
      currency: "EUR",
      location: "Muğla, Bodrum / Yalıkavak",
      country: "TR",
      type: "villa",
      subtype: "Taş Villa",
      room_count: "5+2",
      square_meters: 550,
      sqm_gross: 750,
      building_age: "1",
      floor: 1,
      total_floors: 2,
      heating: "Yerden Isıtma & VRF",
      furnished: true,
      in_gated_community: false,
      listing_intent: "sale",
      branch_name: "Merkez Ofis",
      reference_no: "LP-BOD-707",
      responsible_agent: "Can Örnek (Demo Broker)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
      ]
    },
    {
      title: "İstanbul Beşiktaş Levent'te Prestijli Plaza Katı Ofis (320 m²) (Örnek İlan)",
      description: "Büyükdere Caddesi metro çıkışında, kurumsal şirket merkezlerine uygun, 6 kapalı araç otoparklı, jeneratör ve resepsiyon hizmetli A+ plaza katı.",
      price: 45000000,
      currency: "TRY",
      location: "İstanbul, Beşiktaş / Levent",
      country: "TR",
      type: "commercial",
      subtype: "Plaza Katı Ofis",
      room_count: "8 Bölüm & Toplantı Odası",
      square_meters: 320,
      sqm_gross: 380,
      building_age: "6",
      floor: 16,
      total_floors: 28,
      heating: "Merkezi İklimlendirme",
      furnished: false,
      in_gated_community: true,
      listing_intent: "sale",
      branch_name: "Merkez Ofis",
      reference_no: "LP-IST-808",
      responsible_agent: "Barış Test (Yatırım Temsilcisi)",
      owner_name: "Örnek Mülk Sahibi (Demo)",
      owner_phone: "+90 (555) 000 00 99",
      images: [
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
      ]
    }
  ];

  for (const p of properties) {
    await pool.query(
      `INSERT INTO real_estate_properties (
        store_id, title, description, price, currency, location, type, subtype,
        kktc_region, kktc_sub_region, kktc_title_type, room_count, square_meters, sqm_gross,
        building_age, floor, total_floors, heating, furnished, in_gated_community,
        dues, dues_currency, listing_intent, branch_name, reference_no, responsible_agent,
        images, is_on_enrakipsiz, status, deposit, billing_period, block_plot, country,
        cati_terasi, trafo_bedeli, kdv_status, owner_name, owner_phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26,
        $27, FALSE, 'active', $28, $29, $30, $31,
        $32, $33, $34, $35, $36
      )`,
      [
        storeId, p.title, p.description, p.price, p.currency, p.location, p.type, p.subtype || "",
        p.kktc_region || "", p.kktc_sub_region || "", p.kktc_title_type || "", p.room_count || "", p.square_meters || 0, p.sqm_gross || 0,
        p.building_age || "", p.floor || 1, p.total_floors || 1, p.heating || "", Boolean(p.furnished), Boolean(p.in_gated_community),
        p.dues || 0, p.dues_currency || "GBP", p.listing_intent || "sale", p.branch_name || "Merkez Ofis", p.reference_no, p.responsible_agent || "",
        p.images || [], p.deposit || 0, p.billing_period || "monthly", p.block_plot || "", p.country || "CY",
        Boolean(p.cati_terasi), Boolean(p.trafo_bedeli), p.kdv_status || "", p.owner_name, p.owner_phone
      ]
    );
  }
  console.log(`Seeded ${properties.length} synthetic real estate properties (all is_on_enrakipsiz = FALSE)`);

  // 6. Create Real Estate Contacts / CRM Leads (Synthetic Test Contacts)
  await pool.query("DELETE FROM real_estate_contacts WHERE store_id = $1", [storeId]);
  const contacts = [
    {
      name: "Örnek Yatırımcı Adayı (Yurtdışı Fon)",
      phone: "+90 (555) 000 00 21",
      email: "ornek.yatirimci@demo-restate.local",
      type: "buyer",
      address: "Sanal Şehir / Demo Yatırım Bölgesi",
      notes: "Bellapais 4+1 villa ile ilgileniyor. £460,000 nakit teklif sundu. Sözleşme inceleme aşamasında."
    },
    {
      name: "Örnek Konut Alıcısı (Simülasyon)",
      phone: "+90 (555) 000 00 22",
      email: "ornek.alici@demo-restate.local",
      type: "buyer",
      address: "Sanal Mahalle No:12 / Demo",
      notes: "Alsancak 2+1 daire için kredi görüşmesi yapıldı. Ekspertiz raporu bekleniyor."
    },
    {
      name: "Örnek Ticari Yatırımcı (Demo)",
      phone: "+90 (555) 000 00 23",
      email: "ornek.ticari@demo-restate.local",
      type: "investor",
      address: "Demo Ticaret Caddesi No:45",
      notes: "Dereboyu ticari mağaza için £280,000 teklif sundu. Mülk sahibi ile kapora pazarlığı yapılıyor."
    },
    {
      name: "Örnek Rezidans Adayı (Demo Kayıt)",
      phone: "+90 (555) 000 00 24",
      email: "ornek.rezidans@demo-restate.local",
      type: "buyer",
      address: "Sahil Kordonu No:100 / Demo",
      notes: "Long Beach Penthouse için £10,000 kapora yatırdı. Koçan devir evrakları hazırlanıyor."
    },
    {
      name: "Örnek Mülk Sahibi (Simülasyon)",
      phone: "+90 (555) 000 00 25",
      email: "ornek.mulksahibi@demo-restate.local",
      type: "seller",
      address: "Çatalköy Sanal Bölge No:2",
      notes: "Çatalköy'deki 850 m² arsanın tek yetkili satış sözleşmesi imzalandı. Yetki süresi: 6 ay."
    }
  ];

  for (const ct of contacts) {
    await pool.query(
      `INSERT INTO real_estate_contacts (store_id, name, phone, email, type, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [storeId, ct.name, ct.phone, ct.email, ct.type, ct.address, ct.notes]
    );
  }
  console.log(`Seeded ${contacts.length} synthetic real estate contacts`);

  // 7. Portfolio Finances / Kasa Hareketleri
  await pool.query("DELETE FROM portfolio_transactions WHERE store_id = $1", [storeId]);
  const transactions = [
    {
      title: "Bellapais Lüks Villa Satış Komisyonu (Sanal)",
      type: "income",
      category: "commission",
      amount: 14550,
      currency: "GBP",
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "Alıcı (%3) ve Satıcı (%3) komisyon tahsilatı tamamlandı."
    },
    {
      title: "Long Beach Penthouse Kapora & Hizmet Bedeli (Sanal)",
      type: "income",
      category: "commission",
      amount: 7350,
      currency: "GBP",
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "Sözleşme imza aşaması kapora ve ilk taksit komisyon payı."
    },
    {
      title: "Girne Rezidans 1+1 Kiralama Hizmet Bedeli (Sanal)",
      type: "income",
      category: "rental_placement",
      amount: 650,
      currency: "GBP",
      date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "1 kira bedeli kiralama aracılık hizmet komisyonu."
    },
    {
      title: "Google Ads & Meta Gayrimenkul Sponsorlu Reklamlar",
      type: "expense",
      category: "advertising",
      amount: 1200,
      currency: "GBP",
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "İngiltere ve Avrupa hedefli Long Beach & Girne dijital reklam bütçesi."
    },
    {
      title: "Girne Şubesi Aylık Ofis Kirası",
      type: "expense",
      category: "office_rent",
      amount: 1500,
      currency: "GBP",
      date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "Kordonboyu ofisi aylık kira ödemesi."
    },
    {
      title: "Portföy Profesyonel 4K Drone & Fotoğraf Çekimi",
      type: "expense",
      category: "photo_video",
      amount: 450,
      currency: "GBP",
      date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "Bellapais villa ve Long Beach penthouse hava ve iç mekan çekimleri."
    },
    {
      title: "Danışman Başarı Primi (Deniz Simülasyon)",
      type: "expense",
      category: "agent_commission",
      amount: 3500,
      currency: "GBP",
      date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split("T")[0],
      description: "İskele penthouse satışı danışman prim hakedişi."
    }
  ];

  for (const t of transactions) {
    await pool.query(
      `INSERT INTO portfolio_transactions (store_id, title, type, category, amount, currency, date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [storeId, t.title, t.type, t.category, t.amount, t.currency, t.date, t.description]
    );
  }
  console.log(`Seeded ${transactions.length} portfolio finance transactions`);

  // 8. Companies / Cariler (Fictional Demo Companies)
  await pool.query("DELETE FROM companies WHERE store_id = $1", [storeId]);
  const companies = [
    {
      title: "Ada Örnek Proje & İnşaat A.Ş. (Demo)",
      tax_number: "0000000001",
      tax_office: "Demo Vergi Dairesi",
      email: "info@ada-ornek-demo.local",
      phone: "+90 (555) 000 00 31",
      city: "Gazimağusa",
      address: "Örnek Sanayi Bulvarı No:10, Demo Bölge"
    },
    {
      title: "Kuzey Ada Yapı & Mimarlık Grubu (Demo)",
      tax_number: "0000000002",
      tax_office: "Demo Vergi Dairesi",
      email: "proje@kuzeyada-demo.local",
      phone: "+90 (555) 000 00 32",
      city: "Girne",
      address: "Örnek Mimarlık Cad. No:20, Demo Bölge"
    },
    {
      title: "Akdeniz Simülasyon Yatırım Grubu (Demo)",
      tax_number: "0000000003",
      tax_office: "Demo Vergi Dairesi",
      email: "satis@akdeniz-simulasyon.local",
      phone: "+90 (555) 000 00 33",
      city: "İskele",
      address: "Örnek Kıyı Yolu No:30, Demo Bölge"
    }
  ];

  for (const comp of companies) {
    await pool.query(
      `INSERT INTO companies (store_id, title, tax_number, tax_office, email, phone, city, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [storeId, comp.title, comp.tax_number, comp.tax_office, comp.email, comp.phone, comp.city, comp.address]
    );
  }
  console.log(`Seeded ${companies.length} synthetic partner companies`);

  console.log("restateLP Demo account successfully sanitized and seeded!");
  console.log("Credentials:");
  console.log("  Email: demo@restatelp.com");
  console.log("  Password: restatelp1234");
  console.log(`  Store ID: ${storeId}`);
  console.log("  Store Slug: restatelp-demo");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });

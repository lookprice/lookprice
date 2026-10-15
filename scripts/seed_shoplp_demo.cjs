const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lookprice"
});

async function seedShopLpDemo() {
  const client = await pool.connect();
  try {
    console.log("=== Starting shopLP Demo Store Provisioning ===");
    await client.query("BEGIN");

    // 1. Clean up any previous shopLP demo store or demo user if exists
    const existingUsers = await client.query("SELECT id, store_id FROM users WHERE email = $1", ["demo@shoplp.com"]);
    for (const u of existingUsers.rows) {
      if (u.store_id) {
        const storeId = u.store_id;
        console.log(`Cleaning existing store ${storeId}...`);
        await client.query("DELETE FROM company_reconciliations WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM current_account_transactions WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id IN (SELECT id FROM sales_invoices WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM sales_invoices WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM purchase_invoices WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM quotations WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM service_items WHERE service_id IN (SELECT id FROM service_records WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM service_records WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM vehicle_documents WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM vehicle_maintenance WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM vehicle_assignments WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM vehicle_mileage_logs WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM vehicle_incidents WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM vehicles WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM drivers WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM stock_movements WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM products WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM companies WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM customers WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM stores WHERE id = $1", [storeId]);
      }
      await client.query("DELETE FROM users WHERE id = $1", [u.id]);
    }

    // Also check if any store has slug 'shoplp-demo'
    const existingStores = await client.query("SELECT id FROM stores WHERE slug = $1", ["shoplp-demo"]);
    for (const s of existingStores.rows) {
      const storeId = s.id;
      console.log(`Cleaning existing store by slug ${storeId}...`);
      await client.query("DELETE FROM company_reconciliations WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM current_account_transactions WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id IN (SELECT id FROM sales_invoices WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM sales_invoices WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM purchase_invoices WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM quotations WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM service_items WHERE service_id IN (SELECT id FROM service_records WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM service_records WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM vehicle_documents WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM vehicle_maintenance WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM vehicle_assignments WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM vehicle_mileage_logs WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM vehicle_incidents WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)", [storeId]);
      await client.query("DELETE FROM vehicles WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM drivers WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM stock_movements WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM products WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM companies WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM customers WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM users WHERE store_id = $1", [storeId]);
      await client.query("DELETE FROM stores WHERE id = $1", [storeId]);
    }

    // 2. Marketplace Fake Active Configurations
    const trendyolSettings = {
      connected: true,
      apiKey: "ty_demo_key_9841203",
      apiSecret: "ty_sec_live_9941a8e2",
      merchantId: "389104",
      autoSyncOrders: true,
      autoStockSync: true,
      lastSync: new Date().toISOString()
    };

    const hepsiburadaSettings = {
      connected: true,
      apiKey: "hb_demo_key_7712390",
      apiSecret: "hb_sec_live_4492b1f8",
      merchantId: "b89319-hepsi-demo",
      defaultCargoCompany: "Hepsijet",
      defaultDispatchTime: 1,
      autoSyncOrders: true,
      autoStockSync: true,
      isTestMode: false,
      lastSync: new Date().toISOString()
    };

    const n11Settings = {
      connected: true,
      appKey: "n11_demo_app_554109",
      appSecret: "n11_sec_991823ab4",
      shipmentTemplate: "Standart Kargo (Alıcı Öder)",
      preparingDay: 1,
      lastSync: new Date().toISOString()
    };

    const amazonSettings = {
      connected: true,
      sellerId: "A3DEMO_SHOPLP_TR",
      clientId: "amzn1.application-oa2-client.shoplpdemo",
      clientSecret: "amzn_sec_demo12938102",
      refresh_token: "Atzr|IwEBI_demo_refresh_token_shoplp_live",
      isSandbox: false,
      lastSync: new Date().toISOString()
    };

    const pazaramaSettings = {
      connected: true,
      apiKey: "pz_demo_app_448102",
      apiSecret: "pz_sec_live_883109a",
      merchantId: "pz_seller_9918",
      commissionRate: 12,
      lastSync: new Date().toISOString()
    };

    const branding = {
      store_name: "shopLP Teknoloji & Perakende",
      name: "shopLP Teknoloji & Perakende",
      store_type: "shopLP",
      sub_sector: "electronics",
      store_concept: "product",
      default_currency: "TRY",
      language: "tr",
      country: "TR",
      contact_person: "Mert Karadağ",
      phone: "+90 (212) 890 20 26",
      whatsapp_number: "+90 (532) 890 20 26",
      email: "demo@shoplp.com",
      address: "Maslak Mah. Büyükdere Cad. No:142 Sarıyer / İstanbul",
      hotel_module_enabled: false,
      hotel_license_enabled: false,
      bookstore_module_enabled: false,
      bookstore_license_enabled: false,
      page_layout_settings: {
        sector: "product",
        store_type: "shopLP",
        theme_variant: "modern_retail"
      },
      trendyol_settings: trendyolSettings,
      hepsiburada_settings: hepsiburadaSettings,
      n11_settings: n11Settings,
      amazon_settings: amazonSettings,
      pazarama_settings: pazaramaSettings,
      announcement_bar: true,
      announcement_text: "⚡ shopLP ile Pazaryeri, Hızlı POS ve E-Ticaret Tek Merkezde!",
      primary_color: "#4f46e5"
    };

    // 3. Create Store
    // Limit requirement: 10 products, 10 cari
    const storeRes = await client.query(
      `INSERT INTO stores (
        name, slug, store_code, address, contact_person, phone, email, store_type, sub_sector,
        default_currency, language, country, status, is_approved,
        max_products, max_customers, max_vehicles, max_users,
        hotel_module_enabled, bookstore_module_enabled,
        branding,
        trendyol_settings, hepsiburada_settings, n11_settings, amazon_settings, pazarama_settings,
        subscription_end, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20,
        $21,
        $22, $23, $24, $25, $26,
        CURRENT_DATE + INTERVAL '365 days', NOW()
      ) RETURNING id`,
      [
        "shopLP Teknoloji & Perakende",
        "shoplp-demo",
        "LP-SHOPLP",
        "Maslak Mah. Büyükdere Cad. No:142 Sarıyer / İstanbul",
        "Mert Karadağ",
        "+90 (212) 890 20 26",
        "demo@shoplp.com",
        "shopLP",
        "electronics",
        "TRY",
        "tr",
        "TR",
        "active",
        true,
        10, // Max 10 Products
        10, // Max 10 Cari (Companies)
        5,  // Max vehicles
        10, // Max users
        false,
        false,
        JSON.stringify(branding),
        JSON.stringify(trendyolSettings),
        JSON.stringify(hepsiburadaSettings),
        JSON.stringify(n11Settings),
        JSON.stringify(amazonSettings),
        JSON.stringify(pazaramaSettings)
      ]
    );

    const storeId = storeRes.rows[0].id;
    console.log(`Created store ID: ${storeId}`);

    // 4. Create Demo User
    const hashedPassword = bcrypt.hashSync("shoplp1234", 10);
    const userRes = await client.query(
      `INSERT INTO users (
        email, password, role, store_id, name, full_name, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
      ["demo@shoplp.com", hashedPassword, "storeadmin", storeId, "shopLP Demo", "shopLP Demo Yöneticisi", true]
    );
    console.log(`Created user ID: ${userRes.rows[0].id} for demo@shoplp.com`);

    // 5. Create 5 Cari Accounts (Suppliers & Corporate Clients)
    // Limits: Max 10 cari, 5 created now
    const caris = [
      {
        title: "Atlas Bilişim & Dağıtım A.Ş.",
        tax_office: "Zincirlikuyu",
        tax_number: "1280948123",
        address: "Barbaros Bulvarı No:84 Beşiktaş / İstanbul",
        phone: "0212 340 88 00",
        email: "muhasebe@atlasbilisim.com.tr",
        contact_person: "Levent Erdem",
        city: "İstanbul",
        is_expense: true,
        notes: "Resmi Teknoloji ve Donanım Distribütörümüz"
      },
      {
        title: "Kuantum Donanım İthalat San. Tic. Ltd. Şti.",
        tax_office: "Beyoğlu",
        tax_number: "5840192834",
        address: "Karaköy Rıhtım Cad. No:32 Beyoğlu / İstanbul",
        phone: "0212 250 11 22",
        email: "finans@kuantumdonanim.com",
        contact_person: "Ayşe Taşkın",
        city: "İstanbul",
        is_expense: true,
        notes: "Aksesuar, Ses ve Şarj Ekipmanları İthalatçısı"
      },
      {
        title: "Zirve Mimarlık & Tasarım Ltd. Şti.",
        tax_office: "Kadıköy",
        tax_number: "9920148571",
        address: "Bağdat Caddesi No:210 Kadıköy / İstanbul",
        phone: "0216 410 90 80",
        email: "satin_alma@zirvemimarlik.com",
        contact_person: "Selin Çetin",
        city: "İstanbul",
        is_expense: false,
        notes: "Kurumsal Çözüm ve Ekipman Müşterisi"
      },
      {
        title: "Penta Akademi & Bilişim Çözümleri A.Ş.",
        tax_office: "Çankaya",
        tax_number: "7410982345",
        address: "Eskişehir Yolu 9. Km Çankaya / Ankara",
        phone: "0312 440 33 22",
        email: "muhasebe@pentaakademi.com.tr",
        contact_person: "Burak Yılmaz",
        city: "Ankara",
        is_expense: false,
        notes: "Eğitim ve Yazılım Laboratuvarı Kurumsal Alıcısı"
      },
      {
        title: "Ege Lojistik & Uluslararası Taşımacılık A.Ş.",
        tax_office: "Kordon",
        tax_number: "3650198421",
        address: "Alsancak Liman Cad. No:15 Konak / İzmir",
        phone: "0232 460 70 90",
        email: "operasyon@egelojistik.com.tr",
        contact_person: "Cemil Karaca",
        city: "İzmir",
        is_expense: false,
        notes: "Saha Filosu ve Mobil Terminal Müşterisi"
      }
    ];

    const cariMap = {};
    for (const c of caris) {
      const res = await client.query(
        `INSERT INTO companies (
          store_id, title, tax_office, tax_number, address, phone, email, contact_person, city, is_expense, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
        [storeId, c.title, c.tax_office, c.tax_number, c.address, c.phone, c.email, c.contact_person, c.city, c.is_expense, c.notes]
      );
      cariMap[c.title] = res.rows[0].id;
    }
    console.log("Created 5 Cari accounts:", cariMap);

    // 6. Create 5 Standard Products
    const standardProducts = [
      {
        name: "LookSonic Pro Kablosuz ANC Kulaklık",
        barcode: "8680001001015",
        category: "Ses & Görüntü",
        sub_category: "Kulaklık",
        brand: "LookSonic",
        cost_price: 1850,
        price: 3499,
        stock_quantity: 24,
        min_stock_level: 5,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description: "Hibrit Aktif Gürültü Engelleme (ANC), 40 saat pil ömrü, Hi-Res ses sertifikası ve Bluetooth 5.3 desteği.",
        is_trendyol_active: true,
        trendyol_id: "TY-LS-ANC40",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-LS-PRO-01",
        is_amazon_active: true,
        amazon_asin: "B09DEMO015",
        is_n11_active: true,
        n11_id: "N11-9941015",
        is_pazarama_active: true,
        pazarama_id: "PZR-884101"
      },
      {
        name: "NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)",
        barcode: "8680001001022",
        category: "Aksesuar",
        sub_category: "Şarj Aletleri",
        brand: "NovaCharge",
        cost_price: 420,
        price: 890,
        stock_quantity: 65,
        min_stock_level: 10,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        description: "Yeni nesil GaN teknolojisi, 2x Type-C Power Delivery 65W + 1x USB-A QC 4.0 hızlı şarj portu.",
        is_trendyol_active: true,
        trendyol_id: "TY-NC-65WGAN",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-NC-65W-02",
        is_amazon_active: true,
        amazon_asin: "B09DEMO022",
        is_n11_active: false,
        is_pazarama_active: false
      },
      {
        name: "AeroVision 4K Akıllı Ev Güvenlik Kamerası (360° AI)",
        barcode: "8680001001039",
        category: "Akıllı Ev",
        sub_category: "Güvenlik Sistemleri",
        brand: "AeroVision",
        cost_price: 1200,
        price: 2199,
        stock_quantity: 18,
        min_stock_level: 4,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
        description: "360 derece pan-tilt dönüş, 4K Ultra HD çözünürlük, yapay zeka insan/evcil hayvan algılama ve gece görüşü.",
        is_trendyol_active: true,
        trendyol_id: "TY-AV-4KCAM",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-AV-4K-03",
        is_amazon_active: false,
        is_n11_active: true,
        n11_id: "N11-8841039",
        is_pazarama_active: false
      },
      {
        name: "VeloPulse GPS Akıllı Spor Saati (AMOLED Titanyum)",
        barcode: "8680001001046",
        category: "Giyilebilir Teknoloji",
        sub_category: "Akıllı Saat",
        brand: "VeloPulse",
        cost_price: 2400,
        price: 4799,
        stock_quantity: 14,
        min_stock_level: 3,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        description: "1.43 inç AMOLED ekran, titanyum gövde, çift frekanslı GPS, EKG & kandaki oksijen takibi, 14 gün pil ömrü.",
        is_trendyol_active: true,
        trendyol_id: "TY-VP-WATCH",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-VP-WATCH-04",
        is_amazon_active: true,
        amazon_asin: "B09DEMO046",
        is_n11_active: false,
        is_pazarama_active: true,
        pazarama_id: "PZR-994104"
      },
      {
        name: "MagnaSound Pulse RGB Taşınabilir Bluetooth Hoparlör (30W)",
        barcode: "8680001001053",
        category: "Ses & Görüntü",
        sub_category: "Hoparlör",
        brand: "MagnaSound",
        cost_price: 950,
        price: 1850,
        stock_quantity: 32,
        min_stock_level: 6,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        description: "30W güçlü stereo ses, IPX7 su geçirmezlik, dinamik RGB ışık efektleri ve 18 saat kesintisiz müzik çalma.",
        is_trendyol_active: true,
        trendyol_id: "TY-MS-PULSE",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-MS-PULSE-05",
        is_amazon_active: false,
        is_n11_active: false,
        is_pazarama_active: false
      }
    ];

    const productMap = {};
    for (const p of standardProducts) {
      const res = await client.query(
        `INSERT INTO products (
          store_id, name, barcode, category, sub_category, brand, cost_price, price,
          stock_quantity, min_stock_level, tax_rate, unit, image_url, description,
          is_sellable, is_web_sale, is_trendyol_active, trendyol_id,
          is_hepsiburada_active, hepsiburada_sku, is_amazon_active, amazon_asin,
          is_n11_active, n11_id, is_pazarama_active, pazarama_id,
          has_variants, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          true, true, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          false, NOW(), NOW()
        ) RETURNING id`,
        [
          storeId, p.name, p.barcode, p.category, p.sub_category, p.brand, p.cost_price, p.price,
          p.stock_quantity, p.min_stock_level, p.tax_rate, p.unit, p.image_url, p.description,
          p.is_trendyol_active, p.trendyol_id,
          p.is_hepsiburada_active, p.hepsiburada_sku, p.is_amazon_active, p.amazon_asin,
          p.is_n11_active, p.n11_id, p.is_pazarama_active, p.pazarama_id
        ]
      );
      productMap[p.name] = { id: res.rows[0].id, ...p };
    }
    console.log("Created 5 Standard Products");

    // 7. Create 3 Variant Products
    const variantProducts = [
      {
        name: "AeroDesk Ergonomik Mekanik Klavye (Hot-Swap RGB)",
        barcode: "8680001001060",
        category: "Bilgisayar & Çevre Birimleri",
        sub_category: "Klavye",
        brand: "AeroDesk",
        cost_price: 1350,
        price: 2650,
        stock_quantity: 28,
        min_stock_level: 5,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        description: "Hot-swap mekanik anahtar desteği, CNC alüminyum kasa, kablosuz 2.4G & Bluetooth bağlantı, RGB aydınlatma.",
        has_variants: true,
        variants: [
          {
            id: "var_ad_red",
            sku: "AD-K8-BLK-RED",
            name: "Red Switch (Lineer) / Karbon Siyah",
            price: 2650,
            cost_price: 1350,
            barcode: "8680001001061",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 12
          },
          {
            id: "var_ad_brn",
            sku: "AD-K8-WHT-BRN",
            name: "Brown Switch (Dokunsal) / Kutup Beyazı",
            price: 2750,
            cost_price: 1400,
            barcode: "8680001001062",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 10
          },
          {
            id: "var_ad_blu",
            sku: "AD-K8-GRY-BLU",
            name: "Blue Switch (Klikli) / Grafit Gri",
            price: 2650,
            cost_price: 1350,
            barcode: "8680001001063",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 6
          }
        ],
        is_trendyol_active: true,
        trendyol_id: "TY-AD-KEYB8",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-AD-KEYB-06"
      },
      {
        name: "HyperTab Ultra İnce 2.5K Android Tablet (11 Inç)",
        barcode: "8680001001077",
        category: "Bilgisayar & Tablet",
        sub_category: "Tablet",
        brand: "HyperTab",
        cost_price: 5200,
        price: 8900,
        stock_quantity: 19,
        min_stock_level: 4,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
        description: "11 inç 120Hz 2.5K ekran, Snapdragon 8 çekirdekli işlemci, 4x Harman hoparlör ve kalem destekli ekran.",
        has_variants: true,
        variants: [
          {
            id: "var_ht_128",
            sku: "HT-11-128-GRY",
            name: "128 GB Depolama / Uzay Grisi",
            price: 8900,
            cost_price: 5200,
            barcode: "8680001001071",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 11
          },
          {
            id: "var_ht_256",
            sku: "HT-11-256-BLU",
            name: "256 GB Depolama / Gece Mavisi",
            price: 10400,
            cost_price: 6100,
            barcode: "8680001001072",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 8
          }
        ],
        is_trendyol_active: true,
        trendyol_id: "TY-HT-TAB11",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-HT-TAB-07",
        is_amazon_active: true,
        amazon_asin: "B09DEMO077"
      },
      {
        name: "TitaniumShield Manyetik MagSafe Powerbank",
        barcode: "8680001001084",
        category: "Aksesuar",
        sub_category: "Powerbank",
        brand: "TitaniumShield",
        cost_price: 560,
        price: 1150,
        stock_quantity: 45,
        min_stock_level: 8,
        tax_rate: 20,
        unit: "Adet",
        image_url: "https://images.unsplash.com/photo-1609592426507-28d8a7090b41?auto=format&fit=crop&w=800&q=80",
        description: "Manyetik kablosuz hızlı şarj, katlanabilir destek ayağı, LED dijital pil göstergesi ve hafif titanyum alaşım.",
        has_variants: true,
        variants: [
          {
            id: "var_ts_5k",
            sku: "TS-PB5-TIT",
            name: "5000 mAh / Mat Titanyum",
            price: 1150,
            cost_price: 560,
            barcode: "8680001001081",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 25
          },
          {
            id: "var_ts_10k",
            sku: "TS-PB10-SLV",
            name: "10000 mAh / Buzul Gümüşü",
            price: 1590,
            cost_price: 780,
            barcode: "8680001001082",
            is_active: true,
            variant_type: "standard",
            stock_quantity: 20
          }
        ],
        is_trendyol_active: true,
        trendyol_id: "TY-TS-MAG5K",
        is_hepsiburada_active: true,
        hepsiburada_sku: "HB-TS-MAG-08",
        is_pazarama_active: true,
        pazarama_id: "PZR-774108"
      }
    ];

    for (const p of variantProducts) {
      const res = await client.query(
        `INSERT INTO products (
          store_id, name, barcode, category, sub_category, brand, cost_price, price,
          stock_quantity, min_stock_level, tax_rate, unit, image_url, description,
          is_sellable, is_web_sale, is_trendyol_active, trendyol_id,
          is_hepsiburada_active, hepsiburada_sku, is_amazon_active, amazon_asin,
          is_n11_active, is_pazarama_active, pazarama_id,
          has_variants, variants, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          true, true, $15, $16,
          $17, $18, $19, $20,
          false, $21, $22,
          true, $23, NOW(), NOW()
        ) RETURNING id`,
        [
          storeId, p.name, p.barcode, p.category, p.sub_category, p.brand, p.cost_price, p.price,
          p.stock_quantity, p.min_stock_level, p.tax_rate, p.unit, p.image_url, p.description,
          p.is_trendyol_active, p.trendyol_id,
          p.is_hepsiburada_active, p.hepsiburada_sku, p.is_amazon_active, p.amazon_asin,
          p.is_pazarama_active, p.pazarama_id,
          JSON.stringify(p.variants)
        ]
      );
      productMap[p.name] = { id: res.rows[0].id, ...p };
    }
    console.log("Created 3 Variant Products. Total Products: 8 (Max: 10)");

    // 8. Create Purchase Invoices (Alış Faturaları)
    // Alış Faturası 1: Atlas Bilişim
    const atlasId = cariMap["Atlas Bilişim & Dağıtım A.Ş."];
    const pInv1Res = await client.query(
      `INSERT INTO purchase_invoices (
        store_id, company_id, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency,
        payment_method, supplier_name, status, is_tax_inclusive,
        payment_status, notes, created_at
      ) VALUES (
        $1, $2, $3, '2026-10-02',
        215500.00, 43100.00, 258600.00, 'TRY',
        'Banka Havalesi', 'Atlas Bilişim & Dağıtım A.Ş.', 'approved', false,
        'partial', 'Ekim 2026 Dönemi Konsinye ve Doğrudan Tedarik Alımı', NOW()
      ) RETURNING id`,
      [storeId, atlasId, "ATB2026000008412"]
    );
    const pInv1Id = pInv1Res.rows[0].id;

    // Items for Purchase Invoice 1
    const pInv1Items = [
      { prod: productMap["LookSonic Pro Kablosuz ANC Kulaklık"], qty: 30, unitPrice: 1850, taxRate: 20 },
      { prod: productMap["AeroVision 4K Akıllı Ev Güvenlik Kamerası (360° AI)"], qty: 25, unitPrice: 1200, taxRate: 20 },
      { prod: productMap["HyperTab Ultra İnce 2.5K Android Tablet (11 Inç)"], qty: 25, unitPrice: 5200, taxRate: 20 }
    ];

    for (const it of pInv1Items) {
      const lineTotal = it.qty * it.unitPrice;
      const taxAmt = lineTotal * (it.taxRate / 100);
      await client.query(
        `INSERT INTO purchase_invoice_items (
          purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'C62')`,
        [pInv1Id, it.prod.id, it.prod.name, it.prod.barcode, it.qty, it.unitPrice, it.taxRate, taxAmt, lineTotal]
      );
      // Stock movement entry
      await client.query(
        `INSERT INTO stock_movements (
          store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_id, invoice_type, invoice_number, created_at
        ) VALUES ($1, $2, 'in', $3, 'Alış Faturası Girişi (ATB2026000008412)', 'purchase_invoice', $4, 'TRY', $5, 'purchase', 'ATB2026000008412', NOW())`,
        [storeId, it.prod.id, it.qty, it.unitPrice, pInv1Id]
      );
    }

    // Current Account Transactions for Atlas Bilişim:
    // 1. Alış faturası alacak kaydı (Credit)
    await client.query(
      `INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, payment_method, currency, purchase_invoice_id
      ) VALUES ($1, $2, 'credit', 258600.00, 'Alış Faturası: ATB2026000008412 (Atlas Bilişim)', '2026-10-02 10:30:00', 'Fatura', 'TRY', $3)`,
      [storeId, atlasId, pInv1Id]
    );
    // 2. Kısmi Banka havalesi ödemesi (Debt)
    await client.query(
      `INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, payment_method, currency, purchase_invoice_id
      ) VALUES ($1, $2, 'debt', 180000.00, 'Tedarikçi Ödemesi - Garanti BBVA Ticari Havale', '2026-10-06 14:15:00', 'Banka Havalesi', 'TRY', $3)`,
      [storeId, atlasId, pInv1Id]
    );

    // Alış Faturası 2: Kuantum Donanım
    const kuantumId = cariMap["Kuantum Donanım İthalat San. Tic. Ltd. Şti."];
    const pInv2Res = await client.query(
      `INSERT INTO purchase_invoices (
        store_id, company_id, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency,
        payment_method, supplier_name, status, is_tax_inclusive,
        payment_status, notes, created_at
      ) VALUES (
        $1, $2, $3, '2026-10-05',
        99600.00, 19920.00, 119520.00, 'TRY',
        'Banka Havalesi', 'Kuantum Donanım İthalat San. Tic. Ltd. Şti.', 'approved', false,
        'paid', 'Hızlı Şarj ve MagSafe Aksesuar Sevkiyatı', NOW()
      ) RETURNING id`,
      [storeId, kuantumId, "KNT2026000003190"]
    );
    const pInv2Id = pInv2Res.rows[0].id;

    const pInv2Items = [
      { prod: productMap["NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)"], qty: 80, unitPrice: 420, taxRate: 20 },
      { prod: productMap["MagnaSound Pulse RGB Taşınabilir Bluetooth Hoparlör (30W)"], qty: 40, unitPrice: 950, taxRate: 20 },
      { prod: productMap["TitaniumShield Manyetik MagSafe Powerbank"], qty: 50, unitPrice: 560, taxRate: 20 }
    ];

    for (const it of pInv2Items) {
      const lineTotal = it.qty * it.unitPrice;
      const taxAmt = lineTotal * (it.taxRate / 100);
      await client.query(
        `INSERT INTO purchase_invoice_items (
          purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'C62')`,
        [pInv2Id, it.prod.id, it.prod.name, it.prod.barcode, it.qty, it.unitPrice, it.taxRate, taxAmt, lineTotal]
      );
      // Stock movement entry
      await client.query(
        `INSERT INTO stock_movements (
          store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_id, invoice_type, invoice_number, created_at
        ) VALUES ($1, $2, 'in', $3, 'Alış Faturası Girişi (KNT2026000003190)', 'purchase_invoice', $4, 'TRY', $5, 'purchase', 'KNT2026000003190', NOW())`,
        [storeId, it.prod.id, it.qty, it.unitPrice, pInv2Id]
      );
    }

    // Current Account Transactions for Kuantum Donanım:
    await client.query(
      `INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, payment_method, currency, purchase_invoice_id
      ) VALUES ($1, $2, 'credit', 119520.00, 'Alış Faturası: KNT2026000003190 (Kuantum Donanım)', '2026-10-05 11:20:00', 'Fatura', 'TRY', $3)`,
      [storeId, kuantumId, pInv2Id]
    );
    await client.query(
      `INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, payment_method, currency, purchase_invoice_id
      ) VALUES ($1, $2, 'debt', 119520.00, 'Tam Tedarikçi Ödemesi - Yapı Kredi Kurumsal FAST', '2026-10-05 16:40:00', 'Banka Havalesi', 'TRY', $3)`,
      [storeId, kuantumId, pInv2Id]
    );

    console.log("Created 2 Purchase Invoices and linked Cari movements");

    // 9. Create Mutual Reconciliations (Cari Mutabakat)
    // Mutabakat 1: Atlas Bilişim
    const recon1Payload = {
      storeName: "shopLP Teknoloji & Perakende",
      companyTitle: "Atlas Bilişim & Dağıtım A.Ş.",
      period: "Ekim 2026",
      balance: 78600.00,
      currency: "TRY"
    };
    const reconId1 = Date.now();
    await client.query(
      `INSERT INTO company_reconciliations (
        id, store_id, company_id, company_title, company_address, tax_office, tax_number,
        store_name, store_address, store_tax_office, store_tax_number,
        currency, balance, carry_over_balance, start_date, period_month_name,
        babs_invoice_count, babs_total_sum, date_str, status, responder_name,
        notes, payload, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, 'Maslak V.D.', '8920148102',
        'TRY', 78600.00, 0, '2026-10-01', 'Ekim 2026',
        1, 258600.00, '15.10.2026', 'confirmed', 'Levent Erdem (Atlas Muhasebe)',
        '2026 Ekim dönemi BA/BS ve cari bakiye mutabakatı karşılıklı olarak onaylanmıştır.', $10, NOW(), NOW()
      )`,
      [
        reconId1, storeId, atlasId, "Atlas Bilişim & Dağıtım A.Ş.",
        "Barbaros Bulvarı No:84 Beşiktaş / İstanbul", "Zincirlikuyu", "1280948123",
        "shopLP Teknoloji & Perakende", "Maslak Mah. Büyükdere Cad. No:142 Sarıyer / İstanbul",
        JSON.stringify(recon1Payload)
      ]
    );

    // Mutabakat 2: Kuantum Donanım (Bakiye 0 Mutabakatı)
    const recon2Payload = {
      storeName: "shopLP Teknoloji & Perakende",
      companyTitle: "Kuantum Donanım İthalat San. Tic. Ltd. Şti.",
      period: "Ekim 2026",
      balance: 0.00,
      currency: "TRY"
    };
    const reconId2 = Date.now() + 10;
    await client.query(
      `INSERT INTO company_reconciliations (
        id, store_id, company_id, company_title, company_address, tax_office, tax_number,
        store_name, store_address, store_tax_office, store_tax_number,
        currency, balance, carry_over_balance, start_date, period_month_name,
        babs_invoice_count, babs_total_sum, date_str, status, responder_name,
        notes, payload, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, 'Maslak V.D.', '8920148102',
        'TRY', 0.00, 0, '2026-10-01', 'Ekim 2026',
        1, 119520.00, '15.10.2026', 'confirmed', 'Ayşe Taşkın (Kuantum Finans)',
        'Sıfır bakiye ve 1 adet fatura tam mutabık kalınmıştır.', $10, NOW(), NOW()
      )`,
      [
        reconId2, storeId, kuantumId, "Kuantum Donanım İthalat San. Tic. Ltd. Şti.",
        "Karaköy Rıhtım Cad. No:32 Beyoğlu / İstanbul", "Beyoğlu", "5840192834",
        "shopLP Teknoloji & Perakende", "Maslak Mah. Büyükdere Cad. No:142 Sarıyer / İstanbul",
        JSON.stringify(recon2Payload)
      ]
    );
    console.log("Created 2 Mutual Reconciliations in Mutabakat list");

    // 10. Create Sales Invoices (3 distinct channels: E-Market, Web, Physical Store POS)
    // 10a. E-Market Sale (Trendyol Pazaryeri)
    const sInv1Res = await client.query(
      `INSERT INTO sales_invoices (
        store_id, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency,
        notes, invoice_type, status, payment_method,
        customer_name, e_document_type, integration_status, created_at
      ) VALUES (
        $1, 'TY-2026-0004918', NOW() - INTERVAL '2 days',
        2915.83, 583.17, 3499.00, 'TRY',
        'Trendyol Siparişi: TY-8492041285 (Hızlı Kargo: Trendyol Express)', 'marketplace', 'approved', 'Trendyol Satış',
        'Ceyda Alkan', 'E-ARSIV', 'SUCCESS', NOW() - INTERVAL '2 days'
      ) RETURNING id`,
      [storeId]
    );
    const sInv1Id = sInv1Res.rows[0].id;
    await client.query(
      `INSERT INTO sales_invoice_items (
        sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
      ) VALUES ($1, $2, $3, $4, 1, 2915.83, 20, 583.17, 2915.83, 'C62')`,
      [sInv1Id, productMap["LookSonic Pro Kablosuz ANC Kulaklık"].id, "LookSonic Pro Kablosuz ANC Kulaklık", "8680001001015"]
    );
    await client.query(
      `INSERT INTO stock_movements (
        store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_id, invoice_type, invoice_number, created_at
      ) VALUES ($1, $2, 'out', 1, 'Trendyol Sipariş Çıkışı (TY-2026-0004918)', 'sales_invoice', 3499.00, 'TRY', $3, 'sales', 'TY-2026-0004918', NOW() - INTERVAL '2 days')`,
      [storeId, productMap["LookSonic Pro Kablosuz ANC Kulaklık"].id, sInv1Id]
    );

    // 10b. Web Store Sale (Online Web Sitesi)
    const zirveId = cariMap["Zirve Mimarlık & Tasarım Ltd. Şti."];
    const sInv2Res = await client.query(
      `INSERT INTO sales_invoices (
        store_id, company_id, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency,
        notes, invoice_type, status, payment_method,
        customer_name, company_title, tax_office, tax_number,
        e_document_type, integration_status, created_at
      ) VALUES (
        $1, $2, 'GIB2026000000101', NOW() - INTERVAL '1 day',
        5900.00, 1180.00, 7080.00, 'TRY',
        'shopLP Web Mağazası Online Sipariş #WEB-2026-1049', 'sales', 'approved', 'Kredi Kartı / 3D Secure',
        'Zirve Mimarlık & Tasarım Ltd. Şti.', 'Zirve Mimarlık & Tasarım Ltd. Şti.', 'Kadıköy', '9920148571',
        'E-FATURA', 'SUCCESS', NOW() - INTERVAL '1 day'
      ) RETURNING id`,
      [storeId, zirveId]
    );
    const sInv2Id = sInv2Res.rows[0].id;
    // 2 items: 2 AeroDesk klavye, 2 NovaCharge adaptör
    await client.query(
      `INSERT INTO sales_invoice_items (
        sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
      ) VALUES 
        ($1, $2, 'AeroDesk Ergonomik Mekanik Klavye (Hot-Swap RGB)', '8680001001060', 2, 2208.33, 20, 883.34, 4416.66, 'C62'),
        ($1, $3, 'NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)', '8680001001022', 2, 741.67, 20, 296.66, 1483.34, 'C62')`,
      [sInv2Id, productMap["AeroDesk Ergonomik Mekanik Klavye (Hot-Swap RGB)"].id, productMap["NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)"].id]
    );
    // Link to Zirve Mimarlık cari: debt & credit (paid online)
    await client.query(
      `INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, payment_method, currency, sales_invoice_id
      ) VALUES 
        ($1, $2, 'debt', 7080.00, 'Satış Faturası: GIB2026000000101 (Web Sipariş)', NOW() - INTERVAL '1 day', 'Kredi Kartı', 'TRY', $3),
        ($1, $2, 'credit', 7080.00, 'Web Sanal POS 3D Secure Online Tahsilat', NOW() - INTERVAL '1 day', 'Kredi Kartı', 'TRY', $3)`,
      [storeId, zirveId, sInv2Id]
    );

    // 10c. Physical Store POS Sale (Mağaza Satışı)
    const sInv3Res = await client.query(
      `INSERT INTO sales_invoices (
        store_id, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency,
        notes, invoice_type, status, payment_method,
        customer_name, e_document_type, integration_status, created_at
      ) VALUES (
        $1, 'GIB2026000000102', NOW() - INTERVAL '4 hours',
        1541.67, 308.33, 1850.00, 'TRY',
        'Hızlı POS - Mağaza İçi Satış #POS-8842 - Kasa 1', 'sales', 'approved', 'Nakit / POS Satış',
        'Kemal Sönmez (Perakende Müşteri)', 'E-ARSIV', 'SUCCESS', NOW() - INTERVAL '4 hours'
      ) RETURNING id`,
      [storeId]
    );
    const sInv3Id = sInv3Res.rows[0].id;
    await client.query(
      `INSERT INTO sales_invoice_items (
        sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
      ) VALUES ($1, $2, $3, $4, 1, 1541.67, 20, 308.33, 1541.67, 'C62')`,
      [sInv3Id, productMap["MagnaSound Pulse RGB Taşınabilir Bluetooth Hoparlör (30W)"].id, "MagnaSound Pulse RGB Taşınabilir Bluetooth Hoparlör (30W)", "8680001001053"]
    );
    await client.query(
      `INSERT INTO stock_movements (
        store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_id, invoice_type, invoice_number, created_at
      ) VALUES ($1, $2, 'out', 1, 'Hızlı POS Mağaza Satışı (GIB2026000000102)', 'pos', 1850.00, 'TRY', $3, 'sales', 'GIB2026000000102', NOW() - INTERVAL '4 hours')`,
      [storeId, productMap["MagnaSound Pulse RGB Taşınabilir Bluetooth Hoparlör (30W)"].id, sInv3Id]
    );

    console.log("Created 3 Sales Invoices: E-Market (Trendyol), Web Store, Physical Store POS");

    // 11. Create Technical Service Records (En az 3 kayıt, statüleri farklı)
    // Servis 1: MacBook Pro (repairing)
    const srv1 = await client.query(
      `INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Ahmet Doğan', '0532 984 21 00', 'Apple MacBook Pro 14" (M2 Pro - 2023)', 'C02G901AMD6Q',
        'Cihaza sıvı teması olmuş, klavye tuşları basmıyor ve aşırı ısınıyor.', 'repairing',
        'Orijinal yedek parça montajı yapılıyor, donanım testlerine geçilecek.', 6450.00, 'TRY',
        NOW() - INTERVAL '3 days', NOW()
      ) RETURNING id`,
      [storeId]
    );
    await client.query(
      `INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
       VALUES 
        ($1, 'MacBook Pro Orijinal Klavye & Topcase Modülü', 1, 4950.00, 20, 4950.00, 'part'),
        ($1, 'Ultrasonik Anakart Temizliği ve Montaj İşçiliği', 1, 1500.00, 20, 1500.00, 'labor')`,
      [srv1.rows[0].id]
    );

    // Servis 2: Dyson Süpürge (waiting_approval)
    const srv2 = await client.query(
      `INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Zirve Mimarlık (İrtibat: Selin Hanım)', '0216 410 90 80', 'Dyson V15 Detect Absolute', 'DY-V15-891048',
        'Tetik basıldığında motor darbe yapıyor ve filtrenin temizlenmesi uyarısı veriyor.', 'waiting_approval',
        'Fiyat teklifi müşteriye WhatsApp ve e-posta ile iletildi, onay bekleniyor.', 2850.00, 'TRY',
        NOW() - INTERVAL '1 day', NOW()
      ) RETURNING id`,
      [storeId]
    );
    await client.query(
      `INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
       VALUES 
        ($1, 'Dyson V15 Siklon Motor Gövde Contası ve Filtre', 1, 1850.00, 20, 1850.00, 'part'),
        ($1, 'Detaylı Motor Bakımı ve Kalibrasyon İşçiliği', 1, 1000.00, 20, 1000.00, 'labor')`,
      [srv2.rows[0].id]
    );

    // Servis 3: iPhone 15 Pro (ready - teslime hazır)
    const srv3 = await client.query(
      `INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Murat Yıldırım', '0542 331 45 67', 'Apple iPhone 15 Pro 256GB Naturel Titanyum', 'F2LJQ998PN0X',
        'Pil sağlığı %76 seviyesine düştü, şarj soketinde temassızlık var.', 'ready',
        'Onarım tamamlandı, %100 pil kalibrasyonu ve teşhis testleri başarıyla geçti. Teslime hazır.', 3200.00, 'TRY',
        NOW() - INTERVAL '5 days', NOW()
      ) RETURNING id`,
      [storeId]
    );
    await client.query(
      `INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
       VALUES 
        ($1, 'iPhone 15 Pro Orijinal Batarya Hücresi', 1, 2400.00, 20, 2400.00, 'part'),
        ($1, 'Type-C Soket Onarımı ve Montaj İşçiliği', 1, 800.00, 20, 800.00, 'labor')`,
      [srv3.rows[0].id]
    );

    console.log("Created 3 Technical Service Records with distinct statuses (repairing, waiting_approval, ready)");

    // 12. Create Quotations (En az 3 adet farklı senaryo ve statüde teklif)
    // Teklif 1: Penta Akademi (Onaylandı - approved)
    const pentaId = cariMap["Penta Akademi & Bilişim Çözümleri A.Ş."];
    const q1Res = await client.query(
      `INSERT INTO quotations (
        store_id, company_id, customer_name, customer_title,
        total_amount, currency, status, payment_method, due_date, expiry_date,
        is_sale, notes, created_at
      ) VALUES (
        $1, $2, 'Penta Akademi & Bilişim Çözümleri A.Ş.', 'Kurumsal Satın Alma Departmanı',
        38250.00, 'TRY', 'approved', 'Banka Havalesi / 30 Gün Vade', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '15 days',
        false, 'Kurumsal eğitim salonu donanım tedariki teklifimizdir. 2 yıl distribütör garantisi dahildir.', NOW() - INTERVAL '4 days'
      ) RETURNING id`,
      [storeId, pentaId]
    );
    const q1Id = q1Res.rows[0].id;
    await client.query(
      `INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
       VALUES 
        ($1, $2, 'AeroDesk Ergonomik Mekanik Klavye (Hot-Swap RGB)', '8680001001060', 5, 2650.00, 13250.00, 20, 'C62'),
        ($1, $3, 'NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)', '8680001001022', 10, 850.00, 8500.00, 20, 'C62'),
        ($1, $4, 'LookSonic Pro Kablosuz ANC Kulaklık', '8680001001015', 5, 3300.00, 16500.00, 20, 'C62')`,
      [q1Id, productMap["AeroDesk Ergonomik Mekanik Klavye (Hot-Swap RGB)"].id, productMap["NovaCharge 65W GaN Hızlı Şarj Adaptörü (3 Portlu)"].id, productMap["LookSonic Pro Kablosuz ANC Kulaklık"].id]
    );

    // Teklif 2: Ege Lojistik (Beklemede - pending)
    const egeId = cariMap["Ege Lojistik & Uluslararası Taşımacılık A.Ş."];
    const q2Res = await client.query(
      `INSERT INTO quotations (
        store_id, company_id, customer_name, customer_title,
        total_amount, currency, status, payment_method, due_date, expiry_date,
        is_sale, notes, created_at
      ) VALUES (
        $1, $2, 'Ege Lojistik & Uluslararası Taşımacılık A.Ş.', 'Lojistik Operasyon Müdürlüğü',
        44800.00, 'TRY', 'pending', 'Banka Havalesi', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days',
        false, 'Saha filo yöneticileri için akıllı takip ve iletişim cihazları toplu alım teklifi.', NOW() - INTERVAL '2 days'
      ) RETURNING id`,
      [storeId, egeId]
    );
    const q2Id = q2Res.rows[0].id;
    await client.query(
      `INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
       VALUES 
        ($1, $2, 'VeloPulse GPS Akıllı Spor Saati (AMOLED Titanyum)', '8680001001046', 8, 4500.00, 3600.00, 20, 'C62'),
        ($1, $3, 'TitaniumShield Manyetik MagSafe Powerbank', '8680001001084', 8, 1100.00, 8800.00, 20, 'C62')`,
      [q2Id, productMap["VeloPulse GPS Akıllı Spor Saati (AMOLED Titanyum)"].id, productMap["TitaniumShield Manyetik MagSafe Powerbank"].id]
    );

    // Teklif 3: Zirve Mimarlık (Reddedildi - rejected / revizyon)
    const q3Res = await client.query(
      `INSERT INTO quotations (
        store_id, company_id, customer_name, customer_title,
        total_amount, currency, status, payment_method, due_date, expiry_date,
        is_sale, notes, customer_response_status, customer_response_note, created_at
      ) VALUES (
        $1, $2, 'Zirve Mimarlık & Tasarım Ltd. Şti.', 'Saha Proje Grubu',
        53400.00, 'TRY', 'cancelled', 'Banka Havalesi', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '5 days',
        false, 'Mimari sunum ve şantiye denetimleri için tablet teklifi.', 'rejected',
        'Müşteri alternatif 12.9 inç ekran ve klavyeli kılıf paketi talep ettiği için revizyon istedi.', NOW() - INTERVAL '6 days'
      ) RETURNING id`,
      [storeId, zirveId]
    );
    const q3Id = q3Res.rows[0].id;
    await client.query(
      `INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
       VALUES 
        ($1, $2, 'HyperTab Ultra İnce 2.5K Android Tablet (11 Inç)', '8680001001077', 6, 8900.00, 53400.00, 20, 'C62')`,
      [q3Id, productMap["HyperTab Ultra İnce 2.5K Android Tablet (11 Inç)"].id]
    );

    console.log("Created 3 Quotations with distinct scenarios (approved, pending, rejected)");

    // 13. Create Fleet Management Demo (1 araç, şöför, bakım, zimmet, km, kaza/olay, belge/poliçe)
    // 13a. Vehicle
    const vRes = await client.query(
      `INSERT INTO vehicles (
        store_id, plate, brand, model, year, type, chassis_number, engine_number,
        current_mileage, status, color, fuel_type, transmission, category,
        description, created_at, updated_at
      ) VALUES (
        $1, '34 LP 9026', 'Ford', 'Transit Custom 2.0 EcoBlue L1H1', 2024,
        'company', 'NM0XXXTTFX1829401', 'ECOBLUE20-89104',
        34850, 'active', 'Beyaz', 'Dizel', 'Manuel', 'ticari',
        'shopLP Merkez Mağaza ve E-Ticaret Hızlı Dağıtım Aracı', NOW(), NOW()
      ) RETURNING id`,
      [storeId]
    );
    const vehicleId = vRes.rows[0].id;

    // 13b. Driver (Şöför)
    const dRes = await client.query(
      `INSERT INTO drivers (
        store_id, name, license_number, license_class, blood_type, phone, email, status, national_id, created_at
      ) VALUES (
        $1, 'Murat Güler', 'TR-8941028', 'B / C1', 'A Rh+', '0533 812 44 99', 'murat.guler@shoplp.com', 'active', '38910294812', NOW()
      ) RETURNING id`,
      [storeId]
    );
    const driverId = dRes.rows[0].id;

    // 13c. Vehicle Assignment (Zimmet)
    await client.query(
      `INSERT INTO vehicle_assignments (
        vehicle_id, driver_id, start_date, start_mileage, status, notes, created_at
      ) VALUES (
        $1, $2, '2026-01-15', 12000, 'active',
        'İstanbul içi pazaryeri sevkiyatı ve kurumsal müşteri teslimatları için daimi zimmetlenmiştir.', NOW()
      )`,
      [vehicleId, driverId]
    );

    // 13d. Maintenance (Bakım)
    await client.query(
      `INSERT INTO vehicle_maintenance (
        vehicle_id, type, date, mileage, cost, currency, provider_name, description, status,
        next_maintenance_date, next_maintenance_mileage, created_at
      ) VALUES (
        $1, 'Periyodik 30.000 Km Ağır Bakım', '2026-08-20', 30200, 12500.00, 'TRY',
        'Ford Otosan Yetkili Servisi (Maslak)',
        'Motor yağı, yağ filtresi, hava ve polen filtreleri değişti. Ön fren balataları yenilendi.',
        'completed', '2027-02-20', 45000, NOW()
      )`,
      [vehicleId]
    );

    // 13e. Mileage Log (KM Kaydı)
    await client.query(
      `INSERT INTO vehicle_mileage_logs (
        vehicle_id, driver_id, date, mileage, expense_amount, expense_type, purpose, duration_minutes, notes, created_at
      ) VALUES (
        $1, $2, '2026-10-14', 34850, 1850.00, 'Yakıt',
        'Trendyol ve Hepsiburada Transfer Merkezlerine Günlük Sipariş Teslimatı', 180,
        'Shell Maslak istasyonundan motorin alımı yapıldı, fatura muhasebeye iletildi.', NOW()
      )`,
      [vehicleId, driverId]
    );

    // 13f. Accident / Incident (Kaza / Olay Kaydı)
    await client.query(
      `INSERT INTO vehicle_incidents (
        vehicle_id, type, date, description, cost, status, created_at
      ) VALUES (
        $1, 'accident', '2026-05-12',
        'AVM yük indirme peronunda geri manevra esnasında sağ arka çamurluk bariyer ile sürtündü.',
        4500.00, 'repaired', NOW()
      )`,
      [vehicleId]
    );

    // 13g. Vehicle Documents (Belge / Poliçe)
    await client.query(
      `INSERT INTO vehicle_documents (vehicle_id, type, notes, expiry_date, created_at)
       VALUES 
        ($1, 'Kasko Sigortası', 'Anadolu Sigorta - Genişletilmiş Ticari Kasko Poliçe No: 44029104', '2027-04-10', NOW()),
        ($1, 'Zorunlu Trafik Sigortası', 'Aksigorta - Ticari Araç Trafik Poliçe No: 88102948', '2027-04-10', NOW()),
        ($1, 'TÜVTÜRK Araç Muayenesi', 'Periyodik ticari araç muayenesi geçerlilik süresi', '2027-06-25', NOW())`,
      [vehicleId]
    );

    console.log("Created Fleet Management Demo: Vehicle, Driver, Assignment, Maintenance, Mileage Log, Incident, Documents");

    await client.query("COMMIT");
    console.log("=== shopLP Demo Store Created Successfully! ===");
    console.log("Store ID:", storeId);
    console.log("Email: demo@shoplp.com");
    console.log("Password: shoplp1234");
    console.log("Products: 8 items (5 standard + 3 variant)");
    console.log("Cari: 5 accounts");
    console.log("Limits: Max 10 products, Max 10 caris");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding shopLP demo store:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedShopLpDemo();

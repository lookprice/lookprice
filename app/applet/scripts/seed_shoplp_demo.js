const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lookprice"
});

async function seedShopLpDemo() {
  const client = await pool.connect();
  console.log("Starting shopLP Demo Store seeding...");

  try {
    await client.query("BEGIN");

    // 1. Check or Create/Update Store
    const storeSlug = "demo-shoplp";
    const storeName = "shopLP Perakende & Teknoloji Demo";
    const demoEmail = "demo@shoplp.com";
    const demoPasswordHash = bcrypt.hashSync("shoplp1234", 10);

    const brandingData = {
      store_name: storeName,
      name: storeName,
      slug: storeSlug,
      store_type: "shoplp",
      sub_sector: "retail",
      default_currency: "TRY",
      phone: "+90 (212) 555 01 99",
      whatsapp_number: "+90 532 555 01 99",
      address: "Büyükdere Cad. No: 198, Kanyon Ofis Kuleleri Kat: 8, Levent, Beşiktaş / İstanbul",
      product_limit: 10,
      max_products: 10,
      company_limit: 10,
      max_customers: 10,
      hotel_module_enabled: false,
      bookstore_module_enabled: false,
      marketplaces: {
        trendyol: { connected: true, is_connected: true, sync_stock: true, sync_orders: true },
        hepsiburada: { connected: true, is_connected: true, sync_stock: true, sync_orders: true },
        n11: { connected: true, is_connected: true, sync_stock: true, sync_orders: true },
        amazon: { connected: true, is_connected: true, sync_stock: true, sync_orders: true },
        pazarama: { connected: true, is_connected: true, sync_stock: true, sync_orders: true }
      },
      page_layout_settings: {
        sector: "product",
        theme_mode: "light",
        primary_color: "#4f46e5",
        card_style: "minimal"
      }
    };

    const trendyolSettings = {
      apiKey: "TY-DEMO-982314-KEY",
      apiSecret: "TY-DEMO-SEC-872615",
      supplierId: "482019",
      connected: true,
      is_connected: true,
      last_sync: new Date().toISOString(),
      categoryMarkups: {},
      defaultCommissionRate: 15
    };

    const hepsiburadaSettings = {
      merchantId: "HB-DEMO-MERCHANT-5510",
      apiKey: "HB-DEMO-KEY-77192",
      connected: true,
      is_connected: true,
      last_sync: new Date().toISOString(),
      defaultCommissionRate: 14
    };

    const n11Settings = {
      appKey: "N11-DEMO-APP-KEY-4491",
      appSecret: "N11-DEMO-SECRET-1182",
      connected: true,
      is_connected: true,
      last_sync: new Date().toISOString(),
      defaultCommissionRate: 15
    };

    const amazonSettings = {
      sellerId: "AMZ-TR-DEMO-SELLER-9901",
      authToken: "amzn.mws.demo.token.4412",
      connected: true,
      is_connected: true,
      last_sync: new Date().toISOString(),
      defaultCommissionRate: 12
    };

    const pazaramaSettings = {
      apiKey: "PZR-DEMO-KEY-3310",
      apiSecret: "PZR-DEMO-SEC-8821",
      connected: true,
      is_connected: true,
      last_sync: new Date().toISOString(),
      defaultCommissionRate: 10
    };

    let storeRes = await client.query("SELECT id FROM stores WHERE slug = $1 LIMIT 1", [storeSlug]);
    let storeId;

    if (storeRes.rows.length > 0) {
      storeId = storeRes.rows[0].id;
      console.log(`Updating existing store with ID: ${storeId}`);
      await client.query(`
        UPDATE stores 
        SET name = $1, email = $2, phone = $3, address = $4, status = 'approved', is_approved = true,
            plan = 'pro', store_type = 'shoplp', max_products = 10, max_customers = 10,
            default_currency = 'TRY', default_tax_rate = 20, branding = $5,
            trendyol_settings = $6, hepsiburada_settings = $7, n11_settings = $8,
            amazon_settings = $9, pazarama_settings = $10, hotel_module_enabled = false
        WHERE id = $11
      `, [
        storeName, demoEmail, "+90 (212) 555 01 99",
        "Büyükdere Cad. No: 198, Kanyon Ofis Kuleleri Kat: 8, Levent, İstanbul",
        JSON.stringify(brandingData), JSON.stringify(trendyolSettings),
        JSON.stringify(hepsiburadaSettings), JSON.stringify(n11Settings),
        JSON.stringify(amazonSettings), JSON.stringify(pazaramaSettings),
        storeId
      ]);
    } else {
      console.log("Creating new shopLP demo store...");
      const insertStoreRes = await client.query(`
        INSERT INTO stores (
          name, slug, email, phone, address, status, is_approved, plan, store_type,
          max_products, max_customers, default_currency, default_tax_rate, branding,
          trendyol_settings, hepsiburada_settings, n11_settings, amazon_settings, pazarama_settings,
          hotel_module_enabled, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'approved', true, 'pro', 'shoplp',
          10, 10, 'TRY', 20, $6,
          $7, $8, $9, $10, $11,
          false, NOW()
        ) RETURNING id
      `, [
        storeName, storeSlug, demoEmail, "+90 (212) 555 01 99",
        "Büyükdere Cad. No: 198, Kanyon Ofis Kuleleri Kat: 8, Levent, İstanbul",
        JSON.stringify(brandingData), JSON.stringify(trendyolSettings),
        JSON.stringify(hepsiburadaSettings), JSON.stringify(n11Settings),
        JSON.stringify(amazonSettings), JSON.stringify(pazaramaSettings)
      ]);
      storeId = insertStoreRes.rows[0].id;
      console.log(`Created new store with ID: ${storeId}`);
    }

    // 2. Clear Existing Data for Clean Idempotent Seeding
    console.log("Clearing prior demo records for store ID:", storeId);
    const tablesToClean = [
      "service_items", "service_records", "quotation_items", "quotations",
      "sales_invoice_items", "sales_invoices", "sale_items", "sales",
      "purchase_invoice_items", "purchase_invoices", "current_account_transactions",
      "company_reconciliations", "companies", "stock_movements", "products",
      "vehicle_assignments", "vehicle_maintenance", "vehicle_mileage_logs",
      "vehicle_incidents", "vehicle_documents", "vehicles", "drivers", "customers"
    ];

    for (const t of tablesToClean) {
      try {
        if (["service_items"].includes(t)) {
          await client.query(`DELETE FROM service_items WHERE service_id IN (SELECT id FROM service_records WHERE store_id = $1)`, [storeId]);
        } else if (["quotation_items"].includes(t)) {
          await client.query(`DELETE FROM quotation_items WHERE quotation_id IN (SELECT id FROM quotations WHERE store_id = $1)`, [storeId]);
        } else if (["sales_invoice_items"].includes(t)) {
          await client.query(`DELETE FROM sales_invoice_items WHERE sales_invoice_id IN (SELECT id FROM sales_invoices WHERE store_id = $1)`, [storeId]);
        } else if (["sale_items"].includes(t)) {
          await client.query(`DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE store_id = $1)`, [storeId]);
        } else if (["purchase_invoice_items"].includes(t)) {
          await client.query(`DELETE FROM purchase_invoice_items WHERE purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE store_id = $1)`, [storeId]);
        } else if (["vehicle_assignments", "vehicle_maintenance", "vehicle_mileage_logs", "vehicle_incidents", "vehicle_documents"].includes(t)) {
          await client.query(`DELETE FROM ${t} WHERE vehicle_id IN (SELECT id FROM vehicles WHERE store_id = $1)`, [storeId]);
        } else {
          await client.query(`DELETE FROM ${t} WHERE store_id = $1`, [storeId]);
        }
      } catch (err) {
        console.warn(`Clean error on table ${t}:`, err.message);
      }
    }

    // 3. Create or Update Demo User (demo@shoplp.com / shoplp1234)
    console.log("Setting up demo user:", demoEmail);
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [demoEmail]);
    if (existingUser.rows.length > 0) {
      await client.query(`
        UPDATE users 
        SET password = $1, store_id = $2, role = 'admin', full_name = 'shopLP Demo Yöneticisi', is_active = true
        WHERE id = $3
      `, [demoPasswordHash, storeId, existingUser.rows[0].id]);
    } else {
      await client.query(`
        INSERT INTO users (
          email, password, store_id, role, full_name, is_active, created_at
        ) VALUES (
          $1, $2, $3, 'admin', 'shopLP Demo Yöneticisi', true, NOW()
        )
      `, [demoEmail, demoPasswordHash, storeId]);
    }

    // 4. Insert 5 Standalone Products + 3 Variant Products (Total 8 Products, safely under the 10-product limit)
    console.log("Creating products and variants...");
    const productsData = [
      {
        name: "Apple MacBook Air M3 13.6 İnç 16GB / 512GB SSD - Uzay Grisi",
        category: "Bilgisayar & Ofis",
        sub_category: "Dizüstü Bilgisayar (Laptop)",
        brand: "Apple",
        barcode: "8680001001015",
        sku: "MAC-AIR-M3-16-512",
        price: 44999.00,
        cost_price: 37500.00,
        stock_quantity: 18,
        min_stock_level: 5,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description: "Apple M3 çip, 8 çekirdekli CPU, 10 çekirdekli GPU, 16 GB birleşik bellek, 512 GB SSD depolama, 13.6 inç Liquid Retina ekran, MagSafe 3 şarj.",
        has_variants: false,
        variants: []
      },
      {
        name: "Sony WH-1000XM5 Kablosuz Aktif Gürültü Engelleyici Kulaklık",
        category: "Ses & Görüntü",
        sub_category: "Kablosuz Kulaklık",
        brand: "Sony",
        barcode: "8680001001022",
        sku: "SONY-WH1000XM5-BLK",
        price: 14499.00,
        cost_price: 11200.00,
        stock_quantity: 35,
        min_stock_level: 10,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description: "Sektör lideri gürültü engelleme teknolojisi, iki işlemci ve sekiz mikrofonla benzersiz ses kalitesi. 30 saat pil ömrü ve hızlı şarj desteği.",
        has_variants: false,
        variants: []
      },
      {
        name: "Logitech MX Master 3S Kablosuz Ergonomik Lazer Mouse",
        category: "Bilgisayar & Ofis",
        sub_category: "Mouse & Klavye",
        brand: "Logitech",
        barcode: "8680001001039",
        sku: "LOGI-MXM3S-GR",
        price: 4250.00,
        cost_price: 3100.00,
        stock_quantity: 42,
        min_stock_level: 12,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
        description: "8000 DPI Darkfield lazer sensör, Quiet Clicks sessiz tıklama teknolojisi, MagSpeed ultra hızlı manyetik kaydırma tekerleği.",
        has_variants: false,
        variants: []
      },
      {
        name: "Samsung Odyssey G7 28 İnç 4K UHD 144Hz 1ms IPS Gaming Monitör",
        category: "Bilgisayar & Ofis",
        sub_category: "Monitör",
        brand: "Samsung",
        barcode: "8680001001046",
        sku: "SAM-ODY-G7-28-4K",
        price: 19890.00,
        cost_price: 15400.00,
        stock_quantity: 12,
        min_stock_level: 3,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
        description: "UHD 4K (3840x2160) çözünürlük, 144Hz yenileme hızı, 1ms tepki süresi, IPS panel ve HDR400 desteği ile profesyonel renk doğruluğu.",
        has_variants: false,
        variants: []
      },
      {
        name: "Anker 737 PowerBank 24.000mAh 140W Hızlı Taşınabilir Şarj Cihazı",
        category: "Aksesuar & Mobil",
        sub_category: "Powerbank & Şarj",
        brand: "Anker",
        barcode: "8680001001053",
        sku: "ANK-737-PB-24K",
        price: 3650.00,
        cost_price: 2600.00,
        stock_quantity: 50,
        min_stock_level: 15,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
        description: "Power Delivery 3.1 ve çift yönlü 140W hızlı şarj, akıllı dijital ekran, laptop ve telefonları aynı anda tam hızda şarj etme gücü.",
        has_variants: false,
        variants: []
      },
      // Variant 1
      {
        name: "Lookprice Smart Watch Pro Titanyum Kasa GPS+Hücresel",
        category: "Giyilebilir Teknoloji",
        sub_category: "Akıllı Saat",
        brand: "Lookprice Tech",
        barcode: "8680001001060",
        sku: "LP-SWP-TITAN",
        price: 11990.00,
        cost_price: 8500.00,
        stock_quantity: 60,
        min_stock_level: 10,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        description: "Safir kristal cam, havacılık sınıfı titanyum kasa, 100m suya dayanıklılık, EKG ve kandaki oksijen takibi, çift frekanslı hassas GPS.",
        has_variants: true,
        variants: [
          {
            id: `var_demo_${Date.now()}_1`,
            name: "Gece Siyahı Spor Kordon",
            price: 11990,
            cost_price: 8500,
            barcode: "8680001001061",
            stock_quantity: 25,
            sku: "LP-SWP-BLK",
            is_active: true,
            variant_type: "standard"
          },
          {
            id: `var_demo_${Date.now()}_2`,
            name: "Kutup Beyazı Deri Kordon",
            price: 12490,
            cost_price: 8800,
            barcode: "8680001001062",
            stock_quantity: 20,
            sku: "LP-SWP-WHT",
            is_active: true,
            variant_type: "standard"
          },
          {
            id: `var_demo_${Date.now()}_3`,
            name: "Okyanus Mavisi Titanyum Bakla",
            price: 13990,
            cost_price: 9700,
            barcode: "8680001001063",
            stock_quantity: 15,
            sku: "LP-SWP-BLU",
            is_active: true,
            variant_type: "standard"
          }
        ]
      },
      // Variant 2
      {
        name: "AeroTech Pro Kablosuz Bluetooth Hoparlör 60W IPX7",
        category: "Ses & Görüntü",
        sub_category: "Bluetooth Hoparlör",
        brand: "AeroTech",
        barcode: "8680001001077",
        sku: "AERO-SPK-60W",
        price: 5490.00,
        cost_price: 3900.00,
        stock_quantity: 45,
        min_stock_level: 10,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        description: "360 derece surround ses, çift pasif radyatör, 24 saat kesintisiz çalma süresi, IPX7 tam su geçirmezlik ve PowerBank çıkış özelliği.",
        has_variants: true,
        variants: [
          {
            id: `var_demo_${Date.now()}_4`,
            name: "Karbon Siyah",
            price: 5490,
            cost_price: 3900,
            barcode: "8680001001071",
            stock_quantity: 20,
            sku: "AERO-SPK-BLK",
            is_active: true,
            variant_type: "standard"
          },
          {
            id: `var_demo_${Date.now()}_5`,
            name: "Askeri Haki Yeşil",
            price: 5490,
            cost_price: 3900,
            barcode: "8680001001072",
            stock_quantity: 15,
            sku: "AERO-SPK-GRN",
            is_active: true,
            variant_type: "standard"
          },
          {
            id: `var_demo_${Date.now()}_6`,
            name: "Lava Kırmızı",
            price: 5490,
            cost_price: 3900,
            barcode: "8680001001073",
            stock_quantity: 10,
            sku: "AERO-SPK-RED",
            is_active: true,
            variant_type: "standard"
          }
        ]
      },
      // Variant 3
      {
        name: "HyperCharge 100W GaN 4 Portlu Masaüstü Hızlı Şarj İstasyonu",
        category: "Aksesuar & Mobil",
        sub_category: "Masaüstü Şarj İstasyonu",
        brand: "HyperCharge",
        barcode: "8680001001084",
        sku: "HC-GAN-100W",
        price: 2750.00,
        cost_price: 1850.00,
        stock_quantity: 40,
        min_stock_level: 10,
        unit: "Adet",
        tax_rate: 20,
        image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        description: "Galyum Nitrür (GaN III) teknolojisi, 3x USB-C (100W PD) + 1x USB-A (Quick Charge 4.0), akıllı güç dağılımı ve aşırı ısınma koruması.",
        has_variants: true,
        variants: [
          {
            id: `var_demo_${Date.now()}_7`,
            name: "Avrupa / TR Tipi Priz (EU)",
            price: 2750,
            cost_price: 1850,
            barcode: "8680001001081",
            stock_quantity: 25,
            sku: "HC-GAN-EU",
            is_active: true,
            variant_type: "standard"
          },
          {
            id: `var_demo_${Date.now()}_8`,
            name: "İngiliz / KKTC Tipi Priz (UK)",
            price: 2950,
            cost_price: 1950,
            barcode: "8680001001082",
            stock_quantity: 15,
            sku: "HC-GAN-UK",
            is_active: true,
            variant_type: "standard"
          }
        ]
      }
    ];

    const insertedProducts = [];
    for (const p of productsData) {
      const pRes = await client.query(`
        INSERT INTO products (
          store_id, name, barcode, sku, category, sub_category, brand, price, currency,
          cost_price, cost_currency, stock_quantity, min_stock_level, unit, tax_rate,
          image_url, description, is_web_sale, is_sellable, is_bestseller,
          is_trendyol_active, is_hepsiburada_active, is_n11_active, is_amazon_active, is_pazarama_active,
          has_variants, variants, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 'TRY',
          $9, 'TRY', $10, $11, $12, $13,
          $14, $15, true, true, true,
          true, true, true, true, true,
          $16, $17, NOW(), NOW()
        ) RETURNING id, name, barcode, price, cost_price
      `, [
        storeId, p.name, p.barcode, p.sku, p.category, p.sub_category, p.brand,
        p.price, p.cost_price, p.stock_quantity, p.min_stock_level, p.unit, p.tax_rate,
        p.image_url, p.description, p.has_variants, JSON.stringify(p.variants)
      ]);
      insertedProducts.push(pRes.rows[0]);
    }
    console.log(`Created ${insertedProducts.length} demo products.`);

    // 5. Create 5 Cari Accounts (Companies: Suppliers & B2B Customers)
    console.log("Creating Cari accounts...");
    const companiesData = [
      {
        title: "TeknoToptan Bilişim ve Elektronik Dağıtım A.Ş.",
        tax_office: "Kadıköy",
        tax_number: "8390491023",
        phone: "0216 444 88 11",
        email: "muhasebe@teknotoptan.com.tr",
        city: "İstanbul",
        address: "Kozyatağı Mah. Bayar Cad. No: 42/B Kadıköy / İstanbul",
        representative: "Kemal Güven (Tedarik Direktörü)",
        notes: "Ana distribütör cari hesabı, e-Fatura mükellefi."
      },
      {
        title: "Nova Dağıtım ve Dış Ticaret Ltd. Şti.",
        tax_office: "Maslak",
        tax_number: "6310928374",
        phone: "0212 333 44 55",
        email: "finans@novadagitim.com",
        city: "İstanbul",
        address: "Maslak Mah. Dereboyu 2. Cad. No: 14 Sarıyer / İstanbul",
        representative: "Meltem Kaya (Satış Müdürü)",
        notes: "Donanım & aksesuar ithalatçı tedarikçi cari."
      },
      {
        title: "Zirve Mimarlık ve Tasarım Ofisi Ltd.",
        tax_office: "Beşiktaş",
        tax_number: "9940182741",
        phone: "0212 288 12 34",
        email: "info@zirvemimarlik.com",
        city: "İstanbul",
        address: "Nispetiye Cad. Birlik Sok. No: 18/3 Levent / İstanbul",
        representative: "Serhat Erdinç (Genel Müdür)",
        notes: "Kurumsal B2B müşteri ve teknik servis cari."
      },
      {
        title: "Atlas Lojistik ve Depolama Hizmetleri A.Ş.",
        tax_office: "Ümraniye",
        tax_number: "1029482715",
        phone: "0216 520 90 00",
        email: "satinalma@atlaslojistik.com",
        city: "İstanbul",
        address: "Dudullu OSB 4. Cad. No: 12 Ümraniye / İstanbul",
        representative: "Bülent Özcan (Operasyon Müdürü)",
        notes: "Filo ve lojistik kurumsal müşteri cari."
      },
      {
        title: "Marmara Perakende & Kafe İşletmeleri A.Ş.",
        tax_office: "Bakırköy",
        tax_number: "5520194821",
        phone: "0212 571 80 80",
        email: "muhasebe@marmaraperakende.com",
        city: "İstanbul",
        address: "İncirli Cad. No: 77 Bakırköy / İstanbul",
        representative: "Gülşah Arslan (Finans Sorumlusu)",
        notes: "Zincir mağaza müşteri cari."
      }
    ];

    const insertedCompanies = [];
    for (const c of companiesData) {
      const cRes = await client.query(`
        INSERT INTO companies (
          store_id, title, tax_office, tax_number, phone, email, city, address,
          representative, notes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        ) RETURNING id, title, tax_number, tax_office
      `, [
        storeId, c.title, c.tax_office, c.tax_number, c.phone, c.email,
        c.city, c.address, c.representative, c.notes
      ]);
      insertedCompanies.push(cRes.rows[0]);
    }
    console.log(`Created ${insertedCompanies.length} Cari accounts.`);

    const teknoToptan = insertedCompanies[0];
    const novaDagitim = insertedCompanies[1];
    const zirveMimarlik = insertedCompanies[2];
    const atlasLojistik = insertedCompanies[3];
    const marmaraPerakende = insertedCompanies[4];

    // 6. Purchase Invoices (Alış Faturaları), Items & Cari Ekstre Kayıtları
    console.log("Creating Purchase Invoices & Cari Ekstre...");
    // Invoice 1: TeknoToptan
    const pInv1Res = await client.query(`
      INSERT INTO purchase_invoices (
        store_id, company_id, supplier_name, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency, status, payment_status,
        e_document_type, ettn, notes, payment_method, created_at
      ) VALUES (
        $1, $2, $3, 'TTO2026000001842', '2026-09-15',
        676500.00, 135300.00, 811800.00, 'TRY', 'approved', 'partial',
        'E-FATURA', 'b7d41f02-9a3b-4821-bc30-891029482181',
        'Apple, Sony ve Logitech sevkiyatı ana distribütör e-Faturası', 'Havale/EFT', '2026-09-15 10:30:00'
      ) RETURNING id
    `, [storeId, teknoToptan.id, teknoToptan.title]);
    const pInv1Id = pInv1Res.rows[0].id;

    // Items for Invoice 1
    await client.query(`
      INSERT INTO purchase_invoice_items (
        purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
      ) VALUES
      ($1, $2, 'Apple MacBook Air M3 13.6 İnç 16GB / 512GB SSD - Uzay Grisi', '8680001001015', 10, 37500.00, 20, 75000.00, 375000.00, 'C62'),
      ($1, $3, 'Sony WH-1000XM5 Kablosuz Aktif Gürültü Engelleyici Kulaklık', '8680001001022', 20, 11200.00, 20, 44800.00, 224000.00, 'C62'),
      ($1, $4, 'Logitech MX Master 3S Kablosuz Ergonomik Lazer Mouse', '8680001001039', 25, 3100.00, 20, 15500.00, 77500.00, 'C62')
    `, [pInv1Id, insertedProducts[0].id, insertedProducts[1].id, insertedProducts[2].id]);

    // Cari Ekstre Hareketleri for TeknoToptan:
    // 1: Alış Faturası Girişi (Alacak: 811.800 TL)
    await client.query(`
      INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, purchase_invoice_id, currency, payment_method
      ) VALUES (
        $1, $2, 'credit', 811800.00, 'TTO2026000001842 Nolu e-Fatura Mal Alış Girişi', '2026-09-15 10:30:00', $3, 'TRY', 'e-Fatura'
      )
    `, [storeId, teknoToptan.id, pInv1Id]);

    // 2: Banka Kısmi Ödeme (Borç: 500.000 TL)
    await client.query(`
      INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, currency, payment_method
      ) VALUES (
        $1, $2, 'debit', 500000.00, 'Garanti Bankası Ticari EFT ile Kısmi Tedarikçi Ödemesi', '2026-09-25 14:15:00', 'TRY', 'Banka EFT'
      )
    `, [storeId, teknoToptan.id]);

    // Invoice 2: Nova Dağıtım
    const pInv2Res = await client.query(`
      INSERT INTO purchase_invoices (
        store_id, company_id, supplier_name, invoice_number, invoice_date,
        total_amount, tax_amount, grand_total, currency, status, payment_status,
        e_document_type, ettn, notes, payment_method, created_at
      ) VALUES (
        $1, $2, $3, 'NOV2026000000951', '2026-10-02',
        232000.00, 46400.00, 278400.00, 'TRY', 'approved', 'paid',
        'E-FATURA', 'f8e12a44-019b-4320-aa10-771928371900',
        'Samsung Monitör ve Anker Powerbank toplu parti alımı', 'Havale/EFT', '2026-10-02 11:00:00'
      ) RETURNING id
    `, [storeId, novaDagitim.id, novaDagitim.title]);
    const pInv2Id = pInv2Res.rows[0].id;

    // Items for Invoice 2
    await client.query(`
      INSERT INTO purchase_invoice_items (
        purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code
      ) VALUES
      ($1, $2, 'Samsung Odyssey G7 28 İnç 4K UHD 144Hz 1ms IPS Gaming Monitör', '8680001001046', 10, 15400.00, 20, 30800.00, 154000.00, 'C62'),
      ($1, $3, 'Anker 737 PowerBank 24.000mAh 140W Hızlı Taşınabilir Şarj Cihazı', '8680001001053', 30, 2600.00, 20, 15600.00, 78000.00, 'C62')
    `, [pInv2Id, insertedProducts[3].id, insertedProducts[4].id]);

    // Cari Ekstre Hareketleri for Nova Dağıtım:
    // 1: Alış Faturası Girişi (Alacak: 278.400 TL)
    await client.query(`
      INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, purchase_invoice_id, currency, payment_method
      ) VALUES (
        $1, $2, 'credit', 278400.00, 'NOV2026000000951 Nolu e-Fatura Mal Alış Girişi', '2026-10-02 11:00:00', $3, 'TRY', 'e-Fatura'
      )
    `, [storeId, novaDagitim.id, pInv2Id]);

    // 2: Tam Kapama Ödemesi (Borç: 278.400 TL)
    await client.query(`
      INSERT INTO current_account_transactions (
        store_id, company_id, type, amount, description, transaction_date, currency, payment_method
      ) VALUES (
        $1, $2, 'debit', 278400.00, 'İş Bankası Kurumsal Havale ile Fatura Tam Kapatma', '2026-10-03 16:30:00', 'TRY', 'Banka Havalesi'
      )
    `, [storeId, novaDagitim.id]);

    // 7. Demo Mutabakat (Company Reconciliation Record)
    console.log("Creating Company Reconciliation...");
    await client.query(`
      INSERT INTO company_reconciliations (
        store_id, company_id, company_title, company_address, tax_office, tax_number,
        store_name, store_address, currency, balance, carry_over_balance, start_date,
        period_month_name, babs_invoice_count, babs_total_sum, date_str, status,
        notes, responder_name, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'Kozyatağı Mah. Bayar Cad. No: 42/B Kadıköy / İstanbul', 'Kadıköy', '8390491023',
        $4, 'Büyükdere Cad. No: 198, Kanyon Ofis Kuleleri Kat: 8, Levent, İstanbul', 'TRY', 311800.00, 0.00, '2026-09-01',
        'Eylül 2026 / 3. Çeyrek Cari Hesap & Form BA Mutabakatı', 1, 676500.00, '30.09.2026', 'approved',
        '30.09.2026 tarihi itibariyle 311.800,00 TL cari alacak bakiyesi ve Form BA fatura matrahı mutabık kalınarak dijital olarak onaylanmıştır.',
        'Kemal Güven (TeknoToptan Finans Direktörü)', NOW(), NOW()
      )
    `, [storeId, teknoToptan.id, teknoToptan.title, storeName]);

    // 8. Technical Service Records (Teknik Servis Modülü - 3 Farklı Statüde Kayıt)
    console.log("Creating Technical Service Records...");
    // Record 1: Diagnosing (Teşhis / Arıza Tespiti)
    const srv1Res = await client.query(`
      INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Caner Öztürk', '0532 891 44 22', 'Apple MacBook Pro 14 M2 Pro', 'C02G9988MD6R',
        'Çalışma masasında üzerine filtre kahve dökülmüş, cihaz açılmıyor ve şarj almıyor. Klavye ve anakart sıvı teması arıza tespiti istendi.',
        'diagnosing', 'Anakart söküldü, ultrasonik banyoda oksit temizliği yapılıyor. Devre hatları ölçülecek.',
        3500.00, 'TRY', NOW() - INTERVAL '3 days', NOW()
      ) RETURNING id
    `, [storeId]);
    await client.query(`
      INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
      VALUES 
      ($1, 'Detaylı Sıvı Teması Arıza Tespiti & Ultrasonik Temizlik', 1, 2500.00, 20, 2500.00, 'labor'),
      ($1, 'Güç Entegresi ve SMD Direnç Onarım Seti', 1, 1000.00, 20, 1000.00, 'part')
    `, [srv1Res.rows[0].id]);

    // Record 2: Repairing (Onarım Sürecinde)
    const srv2Res = await client.query(`
      INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Serhat Erdinç (Zirve Mimarlık)', '0212 288 12 34', 'Samsung Galaxy Tab S9 Ultra 512GB', 'R52N40998AA',
        'Şantiye incelemesinde yüksekten zemine düşmüş. Ön cam çatlak ve sol panelde dokunmatik basmıyor.',
        'repairing', 'Orijinal Dynamic AMOLED 2X servis paketi tedarik edildi, montaj ve ekran yapıştırma presinde.',
        8750.00, 'TRY', NOW() - INTERVAL '5 days', NOW()
      ) RETURNING id
    `, [storeId]);
    await client.query(`
      INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
      VALUES 
      ($1, 'Orijinal Dynamic AMOLED 2X Ekran Modülü', 1, 7250.00, 20, 7250.00, 'part'),
      ($1, 'Hassas Ekran Montajı & Kalibrasyon İşçiliği', 1, 1500.00, 20, 1500.00, 'labor')
    `, [srv2Res.rows[0].id]);

    // Record 3: Ready (Hazır / Teslim Edilecek)
    const srv3Res = await client.query(`
      INSERT INTO service_records (
        store_id, customer_name, customer_phone, device_model, device_serial,
        issue_description, status, notes, total_amount, currency, created_at, updated_at
      ) VALUES (
        $1, 'Ece Demir', '0544 321 00 11', 'Dyson V15 Detect Absolute Süpürge', 'DY-89104-V15',
        'Lazer aydınlatmalı motor başlığı takılıyor ve hava kanalı tıkalı ikazı veriyor.',
        'ready', 'Motor rulmanı yenilendi, orijinal HEPA filtre takımı değiştirildi ve 30 dk tam yük testi yapıldı. Müşteriye teslimat SMS bildirimi yapıldı.',
        2850.00, 'TRY', NOW() - INTERVAL '7 days', NOW()
      ) RETURNING id
    `, [storeId]);
    await client.query(`
      INSERT INTO service_items (service_id, item_name, quantity, unit_price, tax_rate, total_price, type)
      VALUES 
      ($1, 'Orijinal HEPA Filtre Kiti & Rulman Grubu', 1, 1850.00, 20, 1850.00, 'part'),
      ($1, 'Genel Bakım, Motor Revizyonu ve Yük Testi', 1, 1000.00, 20, 1000.00, 'labor')
    `, [srv3Res.rows[0].id]);

    // 9. Fleet Management (Filo Yönetimi: Araç, Şoför, Zimmet, Bakım, KM, Kaza, Belge)
    console.log("Creating Fleet Management Records...");
    // Vehicle
    const vehRes = await client.query(`
      INSERT INTO vehicles (
        store_id, plate, brand, model, year, type, chassis_number, engine_number,
        current_mileage, status, fuel_type, transmission, color, created_at, updated_at
      ) VALUES (
        $1, '34 LP 9020', 'Ford', 'Transit Custom 2.0 EcoBlue 170PS', 2024,
        'Panelvan / Dağıtım Aracı', 'WF0YXXTTGYPL90201', 'BC20-9948210',
        28450.0, 'active', 'Dizel', 'Manuel', 'Opak Beyaz', NOW(), NOW()
      ) RETURNING id
    `, [storeId]);
    const vehicleId = vehRes.rows[0].id;

    // Driver
    const driverRes = await client.query(`
      INSERT INTO drivers (
        store_id, name, license_number, license_class, blood_type, phone, email,
        address, status, created_at
      ) VALUES (
        $1, 'Murat Karahan', 'TR-89201489', 'B / C1', 'A Rh+', '0533 410 88 99', 'murat.karahan@shoplp.com',
        'Cevizlibağ Mah. E-5 Yanyol No: 12 Zeytinburnu / İstanbul', 'active', NOW()
      ) RETURNING id
    `, [storeId]);
    const driverId = driverRes.rows[0].id;

    // Assignment (Zimmet)
    await client.query(`
      INSERT INTO vehicle_assignments (
        vehicle_id, driver_id, start_date, start_mileage, notes, status, created_at
      ) VALUES (
        $1, $2, '2026-01-15', 12000.0,
        'Avrupa ve Anadolu yakası şubeler arası ürün transferi ve e-ticaret kargo dağıtım zimmeti',
        'active', NOW()
      )
    `, [vehicleId, driverId]);

    // Maintenance (Bakım)
    await client.query(`
      INSERT INTO vehicle_maintenance (
        vehicle_id, type, date, mileage, cost, currency, provider_name,
        description, status, next_maintenance_date, next_maintenance_mileage, created_at
      ) VALUES (
        $1, 'Periyodik Bakım', '2026-09-20', 25000.0, 8500.00, 'TRY', 'Ford Otokoç Yetkili Servisi',
        '25.000 km periyodik bakım: Motor yağı (Castrol 0W-30), yağ, mazot, polen filtreleri ve ön fren balataları yenilendi.',
        'completed', '2027-03-20', 40000.0, NOW()
      )
    `, [vehicleId]);

    // Mileage Log (KM Kaydı)
    await client.query(`
      INSERT INTO vehicle_mileage_logs (
        vehicle_id, driver_id, date, mileage, purpose, duration_minutes,
        expense_amount, expense_type, notes, created_at
      ) VALUES (
        $1, $2, '2026-10-14', 28450.0,
        'Levent merkez mağaza - Kadıköy şube arası sipariş sevkiyatı ve Trendyol/Hepsiburada kargo teslimat turu',
        180, 650.0, 'Yakıt (Dizel)', 'Opet Kozyatağı istasyonundan EuroDiesel yakıt ikmali yapıldı.', NOW()
      )
    `, [vehicleId, driverId]);

    // Incident / Event (Kaza / Olay Kaydı)
    await client.query(`
      INSERT INTO vehicle_incidents (
        vehicle_id, type, date, description, cost, status, created_at
      ) VALUES (
        $1, 'Ufak Maddi Hasarlı Sürtme', '2026-08-10',
        'Depo yükleme alanında geri manevra esnasında koruma dubasına sürtüldü. Sağ arka çamurluk koruma plastiği lokal onarıldı.',
        4500.00, 'repaired', NOW()
      )
    `, [vehicleId]);

    // Document (Poliçe / Belge)
    await client.query(`
      INSERT INTO vehicle_documents (
        vehicle_id, type, expiry_date, notes, is_recurring, recurrence_period, created_at
      ) VALUES (
        $1, 'Kasko ve Zorunlu Trafik Sigortası', '2027-02-15',
        'Anadolu Sigorta Tam Kapsamlı Genişletilmiş Ticari Filo Kaskosu (Poliçe No: FL-2026-902048)',
        true, 'yearly', NOW()
      )
    `, [vehicleId]);

    // 10. Quotations (Teklifler - 3 Farklı Senaryo ve Statü)
    console.log("Creating Quotations...");
    // Quotation 1: Approved (Zirve Mimarlık)
    const q1Res = await client.query(`
      INSERT INTO quotations (
        store_id, customer_name, customer_title, company_id, total_amount, currency,
        notes, status, payment_method, expiry_date, created_at
      ) VALUES (
        $1, 'Zirve Mimarlık ve Tasarım Ofisi Ltd.', 'Serhat Erdinç (Genel Müdür)', $2, 134997.00, 'TRY',
        '3D Mimari modelleme ve görselleştirme ekibi için toplu Apple MacBook Air M3 donanım teklifidir. 2 yıl Apple Türkiye garantisi ve yerinde kurulum dahildir.',
        'approved', 'bank', '2026-11-15', NOW() - INTERVAL '2 days'
      ) RETURNING id
    `, [storeId, zirveMimarlik.id]);
    await client.query(`
      INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
      VALUES ($1, $2, 'Apple MacBook Air M3 13.6 İnç 16GB / 512GB SSD - Uzay Grisi', '8680001001015', 3, 44999.00, 134997.00, 20, 'Adet')
    `, [q1Res.rows[0].id, insertedProducts[0].id]);

    // Quotation 2: Sent (Atlas Lojistik)
    const q2Res = await client.query(`
      INSERT INTO quotations (
        store_id, customer_name, customer_title, company_id, total_amount, currency,
        notes, status, payment_method, expiry_date, created_at
      ) VALUES (
        $1, 'Atlas Lojistik ve Depolama Hizmetleri A.Ş.', 'Bülent Özcan (Operasyon Müdürü)', $2, 83277.00, 'TRY',
        'Lojistik filo kontrol merkezi ve operasyon koordinatörleri için profesyonel gürültü engelleyici kulaklık ve 4K monitör donanım paketidir. Vade: 45 gün.',
        'sent', 'term', '2026-11-20', NOW() - INTERVAL '1 day'
      ) RETURNING id
    `, [storeId, atlasLojistik.id]);
    await client.query(`
      INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
      VALUES 
      ($1, $2, 'Sony WH-1000XM5 Kablosuz Aktif Gürültü Engelleyici Kulaklık', '8680001001022', 3, 14499.00, 43497.00, 20, 'Adet'),
      ($1, $3, 'Samsung Odyssey G7 28 İnç 4K UHD 144Hz 1ms IPS Gaming Monitör', '8680001001046', 2, 19890.00, 39780.00, 20, 'Adet')
    `, [q2Res.rows[0].id, insertedProducts[1].id, insertedProducts[3].id]);

    // Quotation 3: Draft (Marmara Perakende)
    const q3Res = await client.query(`
      INSERT INTO quotations (
        store_id, customer_name, customer_title, company_id, total_amount, currency,
        notes, status, payment_method, expiry_date, created_at
      ) VALUES (
        $1, 'Marmara Perakende & Kafe İşletmeleri A.Ş.', 'Gülşah Arslan (Finans Sorumlusu)', $2, 22500.00, 'TRY',
        'Merkez ofis ve şube yöneticileri için ergonomik kablosuz mouse ve 100W GaN masaüstü hızlı şarj istasyonu teklif taslağıdır.',
        'draft', 'credit_card', '2026-11-30', NOW()
      ) RETURNING id
    `, [storeId, marmaraPerakende.id]);
    await client.query(`
      INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, tax_rate, unit_code)
      VALUES 
      ($1, $2, 'Logitech MX Master 3S Kablosuz Ergonomik Lazer Mouse', '8680001001039', 4, 4250.00, 17000.00, 20, 'Adet'),
      ($1, $3, 'HyperCharge 100W GaN 4 Portlu Masaüstü Hızlı Şarj İstasyonu', '8680001001084', 2, 2750.00, 5500.00, 20, 'Adet')
    `, [q3Res.rows[0].id, insertedProducts[2].id, insertedProducts[7].id]);

    // 11. Sales & Sales Invoices (Satış Faturaları: Pazaryeri, Web ve Mağaza Satışı)
    console.log("Creating Sales & Sales Invoices...");
    // Sale 1: Trendyol Pazaryeri Satışı
    const sale1Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name, payment_method,
        source, shipping_carrier, tracking_number, notes, created_at
      ) VALUES (
        $1, 14499.00, 'TRY', 'completed', 'Ayşe Kaya (Trendyol Sipariş #948210381)', 'Trendyol Pazaryeri Tahsilatı',
        'trendyol', 'Trendyol Express', 'TY-TRK-99482104', 'Trendyol üzerinden otomatik aktarılan pazaryeri siparişi', NOW() - INTERVAL '3 days'
      ) RETURNING id
    `, [storeId]);
    const sale1Id = sale1Res.rows[0].id;
    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate, tax_amount)
      VALUES ($1, $2, 'Sony WH-1000XM5 Kablosuz Aktif Gürültü Engelleyici Kulaklık', '8680001001022', 1, 14499.00, 14499.00, 'TRY', 20, 2416.50)
    `, [sale1Id, insertedProducts[1].id]);

    const sInv1Res = await client.query(`
      INSERT INTO sales_invoices (
        store_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total,
        currency, notes, invoice_type, status, payment_method, customer_name,
        e_document_type, ettn, created_at
      ) VALUES (
        $1, $2, 'TY2026000000412', NOW() - INTERVAL '3 days',
        12082.50, 2416.50, 14499.00, 'TRY', 'Trendyol Pazaryeri Entegrasyonlu e-Arşiv Faturası',
        'marketplace', 'completed', 'Trendyol Tahsilatı', 'Ayşe Kaya',
        'E-ARSIV', 'e7a10294-819a-4712-ba20-119284729104', NOW() - INTERVAL '3 days'
      ) RETURNING id
    `, [storeId, sale1Id]);
    await client.query(`
      INSERT INTO sales_invoice_items (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price)
      VALUES ($1, $2, 'Sony WH-1000XM5 Kablosuz Aktif Gürültü Engelleyici Kulaklık', '8680001001022', 1, 12082.50, 20, 2416.50, 14499.00)
    `, [sInv1Res.rows[0].id, insertedProducts[1].id]);

    // Sale 2: Web Satışı (lookprice.com Online E-Ticaret)
    const sale2Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name, payment_method,
        source, shipping_carrier, tracking_number, notes, created_at
      ) VALUES (
        $1, 7900.00, 'TRY', 'completed', 'Mehmet Erdem', 'Kredi Kartı (3D Secure / Online)',
        'web', 'Yurtiçi Kargo', 'YK-992148100', 'Online mağaza web vitrininden alınan doğrudan sipariş', NOW() - INTERVAL '1 day'
      ) RETURNING id
    `, [storeId]);
    const sale2Id = sale2Res.rows[0].id;
    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate, tax_amount)
      VALUES 
      ($1, $2, 'Logitech MX Master 3S Kablosuz Ergonomik Lazer Mouse', '8680001001039', 1, 4250.00, 4250.00, 'TRY', 20, 708.33),
      ($1, $3, 'Anker 737 PowerBank 24.000mAh 140W Hızlı Taşınabilir Şarj Cihazı', '8680001001053', 1, 3650.00, 3650.00, 'TRY', 20, 608.33)
    `, [sale2Id, insertedProducts[2].id, insertedProducts[4].id]);

    const sInv2Res = await client.query(`
      INSERT INTO sales_invoices (
        store_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total,
        currency, notes, invoice_type, status, payment_method, customer_name,
        e_document_type, ettn, created_at
      ) VALUES (
        $1, $2, 'WEB2026000001089', NOW() - INTERVAL '1 day',
        6583.34, 1316.66, 7900.00, 'TRY', 'Online Web Siparişi e-Arşiv Satış Faturası',
        'sales', 'completed', 'Kredi Kartı', 'Mehmet Erdem',
        'E-ARSIV', 'd6c90184-2918-4911-aa90-281948291055', NOW() - INTERVAL '1 day'
      ) RETURNING id
    `, [storeId, sale2Id]);
    await client.query(`
      INSERT INTO sales_invoice_items (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price)
      VALUES 
      ($1, $2, 'Logitech MX Master 3S Kablosuz Ergonomik Lazer Mouse', '8680001001039', 1, 3541.67, 20, 708.33, 4250.00),
      ($1, $3, 'Anker 737 PowerBank 24.000mAh 140W Hızlı Taşınabilir Şarj Cihazı', '8680001001053', 1, 3041.67, 20, 608.33, 3650.00)
    `, [sInv2Res.rows[0].id, insertedProducts[2].id, insertedProducts[4].id]);

    // Sale 3: Fiziksel Mağaza / Hızlı POS Satışı
    const sale3Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name, payment_method,
        source, notes, created_at
      ) VALUES (
        $1, 2750.00, 'TRY', 'completed', 'Perakende Mağaza Müşterisi (Nakit / Kasa)', 'Nakit / Kasa POS',
        'pos', 'Hızlı POS terminali doğrudan kasa satışı', NOW()
      ) RETURNING id
    `, [storeId]);
    const sale3Id = sale3Res.rows[0].id;
    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate, tax_amount)
      VALUES ($1, $2, 'HyperCharge 100W GaN 4 Portlu Masaüstü Hızlı Şarj İstasyonu', '8680001001084', 1, 2750.00, 2750.00, 'TRY', 20, 458.33)
    `, [sale3Id, insertedProducts[7].id]);

    const sInv3Res = await client.query(`
      INSERT INTO sales_invoices (
        store_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total,
        currency, notes, invoice_type, status, payment_method, customer_name,
        e_document_type, ettn, created_at
      ) VALUES (
        $1, $2, 'POS2026000002871', NOW(),
        2291.67, 458.33, 2750.00, 'TRY', 'Hızlı POS Kasa Satış Fişi / e-Arşiv Belgesi',
        'pos', 'completed', 'Nakit Kasa', 'Nakit Satış Müşterisi',
        'E-ARSIV', 'a4b89102-1928-4019-cc19-991827364501', NOW()
      ) RETURNING id
    `, [storeId, sale3Id]);
    await client.query(`
      INSERT INTO sales_invoice_items (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price)
      VALUES ($1, $2, 'HyperCharge 100W GaN 4 Portlu Masaüstü Hızlı Şarj İstasyonu', '8680001001084', 1, 2291.67, 20, 458.33, 2750.00)
    `, [sInv3Res.rows[0].id, insertedProducts[7].id]);

    // 12. Stock Movements (Stok Hareketleri Kayıtları)
    console.log("Generating Stock Movements...");
    // Movements for Inward Purchase Invoices
    await client.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_number, invoice_type, created_at)
      VALUES 
      ($1, $2, 'purchase', 10, 'TTO2026000001842 Nolu Alış Faturası Girişi', 'purchase_invoice', 37500.00, 'TRY', 'TTO2026000001842', 'purchase', '2026-09-15 10:30:00'),
      ($1, $3, 'purchase', 20, 'TTO2026000001842 Nolu Alış Faturası Girişi', 'purchase_invoice', 11200.00, 'TRY', 'TTO2026000001842', 'purchase', '2026-09-15 10:30:00'),
      ($1, $4, 'purchase', 25, 'TTO2026000001842 Nolu Alış Faturası Girişi', 'purchase_invoice', 3100.00, 'TRY', 'TTO2026000001842', 'purchase', '2026-09-15 10:30:00'),
      ($1, $5, 'purchase', 10, 'NOV2026000000951 Nolu Alış Faturası Girişi', 'purchase_invoice', 15400.00, 'TRY', 'NOV2026000000951', 'purchase', '2026-10-02 11:00:00'),
      ($1, $6, 'purchase', 30, 'NOV2026000000951 Nolu Alış Faturası Girişi', 'purchase_invoice', 2600.00, 'TRY', 'NOV2026000000951', 'purchase', '2026-10-02 11:00:00')
    `, [
      storeId,
      insertedProducts[0].id,
      insertedProducts[1].id,
      insertedProducts[2].id,
      insertedProducts[3].id,
      insertedProducts[4].id
    ]);

    // Movements for Outward Sales Invoices
    await client.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, description, source, unit_price, currency, invoice_number, invoice_type, created_at)
      VALUES 
      ($1, $2, 'sale', -1, 'Trendyol Pazaryeri Satışı (TY2026000000412)', 'marketplace', 14499.00, 'TRY', 'TY2026000000412', 'marketplace', NOW() - INTERVAL '3 days'),
      ($1, $3, 'sale', -1, 'Web Vitrin Satışı (WEB2026000001089)', 'web', 4250.00, 'TRY', 'WEB2026000001089', 'sales', NOW() - INTERVAL '1 day'),
      ($1, $4, 'sale', -1, 'Web Vitrin Satışı (WEB2026000001089)', 'web', 3650.00, 'TRY', 'WEB2026000001089', 'sales', NOW() - INTERVAL '1 day'),
      ($1, $5, 'sale', -1, 'Fiziksel Mağaza Kasa Satışı (POS2026000002871)', 'pos', 2750.00, 'TRY', 'POS2026000002871', 'pos', NOW())
    `, [
      storeId,
      insertedProducts[1].id,
      insertedProducts[2].id,
      insertedProducts[4].id,
      insertedProducts[7].id
    ]);

    // 13. Customers (B2C & B2B Müşteri Veritabanı)
    console.log("Populating Customers...");
    await client.query(`
      INSERT INTO customers (
        store_id, full_name, name, surname, email, phone, city, address, is_corporate, created_at
      ) VALUES
      ($1, 'Ayşe Kaya', 'Ayşe', 'Kaya', 'ayse.kaya@gmail.com', '0535 881 22 33', 'İstanbul', 'Ataşehir Mah. Sedef Cad. No: 12 D: 4 Ataşehir / İstanbul', false, NOW() - INTERVAL '10 days'),
      ($1, 'Mehmet Erdem', 'Mehmet', 'Erdem', 'mehmet.erdem@outlook.com', '0542 990 11 22', 'İzmir', 'Alsancak Mah. Atatürk Cad. No: 88 Konak / İzmir', false, NOW() - INTERVAL '5 days'),
      ($1, 'Caner Öztürk', 'Caner', 'Öztürk', 'caner.ozturk@gmail.com', '0532 891 44 22', 'İstanbul', 'Etiler Mah. Tepecik Yolu No: 20 Beşiktaş / İstanbul', false, NOW() - INTERVAL '4 days'),
      ($1, 'Ece Demir', 'Ece', 'Demir', 'ece.demir@hotmail.com', '0544 321 00 11', 'Ankara', 'Çayyolu Mah. Park Cad. No: 45 Çankaya / Ankara', false, NOW() - INTERVAL '8 days')
    `, [storeId]);

    await client.query("COMMIT");
    console.log("Successfully seeded shopLP Demo Store (ID: " + storeId + ", Slug: " + storeSlug + ")!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error during shopLP demo store seeding:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedShopLpDemo().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});

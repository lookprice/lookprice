const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lookprice"
});

async function seedHorecaLpDemo() {
  const client = await pool.connect();
  try {
    console.log("=== Starting horecaLP Demo Store Provisioning ===");
    await client.query("BEGIN");

    // 1. Clean up existing demo@horecalp.com and store
    const existingUsers = await client.query("SELECT id, store_id FROM users WHERE email = $1", ["demo@horecalp.com"]);
    for (const u of existingUsers.rows) {
      if (u.store_id) {
        const storeId = u.store_id;
        console.log(`Cleaning existing horeca store ${storeId}...`);
        await client.query("DELETE FROM company_reconciliations WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM current_account_transactions WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM sales WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM sales WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM purchase_invoices WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM restaurant_tables WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM hotel_reservations WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM product_recipes WHERE product_id IN (SELECT id FROM products WHERE store_id = $1)", [storeId]);
        await client.query("DELETE FROM products WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM companies WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM customers WHERE store_id = $1", [storeId]);
        await client.query("DELETE FROM stores WHERE id = $1", [storeId]);
      }
      await client.query("DELETE FROM users WHERE id = $1", [u.id]);
    }

    // 2. Branding & Settings
    const branding = {
      store_name: "Seçkin Lezzetler & Grand Otel Kafe-Restoran",
      slug: "seckin-lezzetler-horeca",
      store_type: "horecaLP",
      sector: "horeca",
      phone: "+90 (212) 555 0199",
      whatsapp_number: "+905325550199",
      address: "Nişantaşı Abdi İpekçi Cad. No:42 Şişli / İstanbul",
      email: "demo@horecalp.com",
      currency: "TRY",
      primary_color: "#f97316", // Orange accent for horeca
      hotel_module_enabled: true,
      hotel_license_enabled: true,
      waiter_list: [
        { id: "w1", name: "Ahmet Yılmaz", pin: "1234", section: "Ana Salon", phone: "05321112233", active: true },
        { id: "w2", name: "Mehmet Demir", pin: "5678", section: "Teras & Bahçe", phone: "05332223344", active: true },
        { id: "w3", name: "Zeynep Çelik", pin: "4321", section: "Oda Servisi & Bar", phone: "05353334455", active: true }
      ],
      happy_hour_settings: {
        enabled: true,
        start_time: "16:00",
        end_time: "19:00",
        discount_percentage: 20,
        days: ["1", "2", "3", "4", "5", "6", "0"]
      },
      hotel_rooms: [
        { id: "r101", room_number: "101", type: "Deluxe Deniz Manzaralı", capacity: 2, price: 3500, status: "occupied", floor: "1. Kat" },
        { id: "r102", room_number: "102", type: "Standard Çift Kişilik", capacity: 2, price: 2500, status: "available", floor: "1. Kat" },
        { id: "r201", room_number: "201", type: "King Suit", capacity: 4, price: 6000, status: "reserved", floor: "2. Kat" },
        { id: "r202", room_number: "202", type: "Family Aile Odası", capacity: 3, price: 4500, status: "available", floor: "2. Kat" }
      ]
    };

    // 3. Create Store
    const storeRes = await client.query(
      `INSERT INTO stores (
        name, slug, store_code, address, contact_person, phone, email, store_type, sub_sector,
        default_currency, language, country, status, is_approved,
        max_products, max_customers, max_vehicles, max_users,
        hotel_module_enabled, bookstore_module_enabled,
        branding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id`,
      [
        "Seçkin Lezzetler & Grand Otel Kafe-Restoran",
        "seckin-lezzetler-horeca",
        "HORECA-DEMO-01",
        "Nişantaşı Abdi İpekçi Cad. No:42 Şişli / İstanbul",
        "Cemil Şef",
        "+90 (212) 555 0199",
        "demo@horecalp.com",
        "horecaLP",
        "horeca",
        "TRY",
        "tr",
        "TR",
        "active",
        true,
        50,
        50,
        10,
        15,
        true,
        false,
        JSON.stringify(branding)
      ]
    );

    const storeId = storeRes.rows[0].id;
    console.log(`Created Horeca Store ID: ${storeId}`);

    // 4. Create Demo User
    const hashedPassword = bcrypt.hashSync("horecalp1234", 10);
    const userRes = await client.query(
      `INSERT INTO users (email, password, role, store_id, name, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ["demo@horecalp.com", hashedPassword, "storeadmin", storeId, "Horeca Demo", "HorecaLP & Otel İşletme Yöneticisi", true]
    );
    console.log(`Created user ID: ${userRes.rows[0].id} for demo@horecalp.com`);

    // 5. Create Current Accounts (Suppliers & Corporate Accounts)
    const cariRes1 = await client.query(
      `INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, is_supplier, is_customer, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [storeId, "Anadolu Et & Gıda Toptan Tic. Ltd.", "Şişli", "4820193821", "Okmeydanı Gıdaçılar Sitesi No:12", "0212 222 3344", "siparis@anadoluet.com", true, false, 12500.00]
    );
    const supplierId1 = cariRes1.rows[0].id;

    const cariRes2 = await client.query(
      `INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, is_supplier, is_customer, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [storeId, "Boğaziçi İçecek & Kahve Dağıtım A.Ş.", "Beşiktaş", "1928394850", "Levent Sanayi Cad. No:8", "0212 333 4455", "info@bogaziciicecek.com", true, false, 4800.50]
    );
    const supplierId2 = cariRes2.rows[0].id;

    const cariRes3 = await client.query(
      `INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, is_supplier, is_customer, balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [storeId, "Grand Kurumsal Turizm A.Ş. (Otel Konuğu)", "Beyoğlu", "9384729102", "Taksim Meydanı No:5", "0212 444 5566", "rezervasyon@grandkurumsal.com", false, true, -3200.00]
    );
    const customerId1 = cariRes3.rows[0].id;

    // 6. Create Raw Materials (Ham Maddeler)
    const rm1 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "Dana Antrikot (Hammadde)", "RM-001", 450.00, 450.00, 25.00, "Kg", "Hammadde", "raw_material", "Et ürünü", 250, "0", 10]
    );
    const rm1Id = rm1.rows[0].id;

    const rm2 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "Özel Burger Ekmek (Hammadde)", "RM-002", 12.00, 12.00, 150.00, "Adet", "Hammadde", "raw_material", "Gluten, Susam", 180, "0", 10]
    );
    const rm2Id = rm2.rows[0].id;

    const rm3 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "Espresso Çekirdek Kahve (Hammadde)", "RM-003", 650.00, 650.00, 10.00, "Kg", "Hammadde", "raw_material", "Kafein", 5, "0", 20]
    );
    const rm3Id = rm3.rows[0].id;

    // 7. Create Finished Menu Items with Recipe (Reçeteli Ürünler), Allergens, Calories & Happy Hour prices
    const prod1 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "Chef's Special Burger & Patates", "PRD-101", 420.00, 336.00, 100.00, "Porsiyon", "Ana Yemekler", "recipe", "Gluten, Susam, Laktoz", 850, "18 dk", 10]
    );
    const prod1Id = prod1.rows[0].id;

    // Insert recipe for Burger
    await client.query(
      `INSERT INTO product_recipes (product_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4)`,
      [prod1Id, rm1Id, 0.220, "Kg"] // 220g antrikot
    );
    await client.query(
      `INSERT INTO product_recipes (product_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4)`,
      [prod1Id, rm2Id, 1.000, "Adet"] // 1 burger ekmek
    );

    const prod2 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "İtalyan Double Espresso", "PRD-102", 90.00, 72.00, 200.00, "Fincan", "İçecekler", "standard", "Kafein", 10, "4 dk", 10]
    );
    const prod2Id = prod2.rows[0].id;

    const prod3 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "Ev Yapımı Limonata & Nane", "PRD-103", 110.00, 88.00, 120.00, "Bardak", "İçecekler", "standard", "C Vitamini, Sakkaroz", 120, "3 dk", 10]
    );
    const prod3Id = prod3.rows[0].id;

    const prod4 = await client.query(
      `INSERT INTO products (store_id, name, barcode, price, price_2, stock, unit, category, product_type, allergen_info, calories, prep_time, vat_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, "San Sebastian Cheesecake", "PRD-104", 220.00, 176.00, 45.00, "Dilim", "Tatlılar", "standard", "Gluten, Laktoz, Yumurta", 450, "2 dk", 10]
    );
    const prod4Id = prod4.rows[0].id;

    // 8. Create Restaurant Tables (Masa Planı & Adisyonlar)
    const t1 = await client.query(
      `INSERT INTO restaurant_tables (store_id, table_no, section, capacity, status, current_waiter, current_order_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [storeId, "Masa 1", "Ana Salon", 4, "occupied", "Ahmet Yılmaz", 840.00]
    );
    const t1Id = t1.rows[0].id;

    const t2 = await client.query(
      `INSERT INTO restaurant_tables (store_id, table_no, section, capacity, status, current_waiter, current_order_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [storeId, "Teras 4", "Teras & Bahçe", 2, "occupied", "Mehmet Demir", 310.00]
    );
    const t2Id = t2.rows[0].id;

    const t3 = await client.query(
      `INSERT INTO restaurant_tables (store_id, table_no, section, capacity, status, current_waiter, current_order_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [storeId, "VIP Lounge 1", "VIP Bölüm", 6, "reserved", "Zeynep Çelik", 0.00]
    );

    // 9. Create Sales & Split Payments (Hızlı POS Parçalı Ödeme Senaryosu)
    const sale1 = await client.query(
      `INSERT INTO sales (store_id, total_amount, payment_method, status, customer_name, restaurant_table_id, waiter_name, receipt_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [storeId, 840.00, "split", "completed", "Masa 1 Müşterisi", t1Id, "Ahmet Yılmaz", "AD-2026-0001"]
    );
    const sale1Id = sale1.rows[0].id;

    await client.query(
      `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)`,
      [sale1Id, prod1Id, "Chef's Special Burger & Patates", 2, 420.00, 840.00]
    );

    // Split Payments: 400 TL Nakit, 440 TL Kredi Kartı
    await client.query(
      `INSERT INTO sale_payments (sale_id, payment_type, amount) VALUES ($1, $2, $3)`,
      [sale1Id, "cash", 400.00]
    );
    await client.query(
      `INSERT INTO sale_payments (sale_id, payment_type, amount) VALUES ($1, $2, $3)`,
      [sale1Id, "credit_card", 440.00]
    );

    // 10. Create Purchase Invoices (Alış Faturaları & Hammadde Tedariği)
    const pi1 = await client.query(
      `INSERT INTO purchase_invoices (store_id, company_id, invoice_number, issue_date, total_amount, status, description)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING id`,
      [storeId, supplierId1, "ANADOLU-2026-8891", 12500.00, "completed", "Dana Antrikot ve Et Ürünleri Toptan Alım Faturası"]
    );
    const pi1Id = pi1.rows[0].id;

    await client.query(
      `INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, product_name, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pi1Id, rm1Id, "Dana Antrikot (Hammadde)", 25.00, 500.00, 12500.00]
    );

    // Current Account Transactions (Cari Hareketler)
    await client.query(
      `INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, document_no)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storeId, supplierId1, "debt", 12500.00, "Alış Faturası - ANADOLU-2026-8891", "ANADOLU-2026-8891"]
    );

    // 11. Create Hotel Reservation & Room Folio Adisyon
    await client.query(
      `INSERT INTO hotel_reservations (store_id, room_number, guest_name, guest_phone, check_in_date, check_out_date, total_price, status, adults, children, notes, folio)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '3 days', $5, $6, $7, $8, $9, $10)`,
      [
        storeId,
        "101",
        "Ahmet & Elif Yılmaz",
        "05329998877",
        10500.00,
        "checked_in",
        2,
        0,
        "Balayı çifti, deniz manzaralı oda talebi.",
        JSON.stringify({
          id: "folio-101",
          room_number: "101",
          guest_name: "Ahmet & Elif Yılmaz",
          total_amount: 1450.00,
          items: [
            { id: "fi-1", description: "Oda Servisi - Akşam Yemeği", amount: 950.00, date: new Date().toISOString() },
            { id: "fi-2", description: "Minibar & İçecekler", amount: 500.00, date: new Date().toISOString() }
          ]
        })
      ]
    );

    await client.query("COMMIT");
    console.log("=== HorecaLP Demo Store Successfully Provisioned! ===");
    console.log("Email: demo@horecalp.com");
    console.log("Password: horecalp1234");
    console.log("Features: Food/Drink, Allergen Warnings, Recipes (BOM), Fast POS Split Payments, Happy Hours, Purchase Invoices, Current Accounts, Hotel Rooms, Reservations, Waiters, Room Folios.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to seed horecaLP demo:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedHorecaLpDemo();

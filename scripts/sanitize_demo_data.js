import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/lookprice" });

async function sanitizeDemoData() {
  console.log("Starting demo data sanitization...");

  // 1. Update store 40 (restateLP Gayrimenkul & Yatırım)
  const store40Res = await pool.query("SELECT * FROM stores WHERE id = 40");
  if (store40Res.rows.length > 0) {
    const b = store40Res.rows[0].branding || {};
    b.name = "restateLP Gayrimenkul & Yatırım (Demo)";
    b.store_name = "restateLP Gayrimenkul & Yatırım (Demo)";
    b.legal_name = "RESTATELP DEMO & SIMULASYON YAZILIM A.S.";
    b.phone = "+90 (500) 000 00 00";
    b.whatsapp_number = "+90 (500) 000 00 00";
    b.address = "Demo Teknoloji Bulvarı No:0/A (Simülasyon Bölgesi), Lefkoşa / KKTC";
    b.is_demo = true;
    b.team = [
      {
        id: "1",
        name: "Demo Broker Atlas",
        role: "Kurucu & Broker (Demo)",
        phone: "+90 (500) 000 00 01",
        whatsapp: "+90 (500) 000 00 01",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
        image_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400"
      },
      {
        id: "2",
        name: "Demo Danışman Maya",
        role: "Lüks Portföy Danışmanı (Demo)",
        phone: "+90 (500) 000 00 02",
        whatsapp: "+90 (500) 000 00 02",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
        image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400"
      }
    ];
    b.branches = [
      {
        id: 41,
        name: "restateLP Girne Liman & Marina Şubesi (Demo)",
        slug: "restatelp-girne-demo",
        phone: "+90 (500) 000 00 11",
        whatsapp: "+90 (500) 000 00 11",
        address: "Örnek Marina Kıyı Yolu No:99 (Test Bölgesi), Girne / KKTC"
      },
      {
        id: 42,
        name: "restateLP İskele Long Beach Şubesi (Demo)",
        slug: "restatelp-iskele-demo",
        phone: "+90 (500) 000 00 12",
        whatsapp: "+90 (500) 000 00 12",
        address: "Kurgusal Sahil Bulvarı No:88 (Demo Bölgesi), İskele / KKTC"
      }
    ];

    await pool.query(
      "UPDATE stores SET name = $1, phone = $2, address = $3, branding = $4 WHERE id = 40",
      ["restateLP Gayrimenkul & Yatırım (Demo)", "+90 (500) 000 00 00", "Demo Teknoloji Bulvarı No:0/A (Simülasyon Bölgesi), Lefkoşa / KKTC", JSON.stringify(b)]
    );
  }

  // 2. Update store 41 (Girne)
  const store41Res = await pool.query("SELECT * FROM stores WHERE id = 41");
  if (store41Res.rows.length > 0) {
    const b = store41Res.rows[0].branding || {};
    b.name = "restateLP Girne Liman & Marina Şubesi (Demo)";
    b.store_name = "restateLP Girne Liman & Marina Şubesi (Demo)";
    b.legal_name = "RESTATELP DEMO & SIMULASYON YAZILIM A.S.";
    b.phone = "+90 (500) 000 00 11";
    b.whatsapp_number = "+90 (500) 000 00 11";
    b.address = "Örnek Marina Kıyı Yolu No:99 (Test Bölgesi), Girne / KKTC";
    b.is_demo = true;
    await pool.query(
      "UPDATE stores SET name = $1, phone = $2, address = $3, branding = $4 WHERE id = 41",
      ["restateLP Girne Liman & Marina Şubesi (Demo)", "+90 (500) 000 00 11", "Örnek Marina Kıyı Yolu No:99 (Test Bölgesi), Girne / KKTC", JSON.stringify(b)]
    );
  }

  // 3. Update store 42 (İskele)
  const store42Res = await pool.query("SELECT * FROM stores WHERE id = 42");
  if (store42Res.rows.length > 0) {
    const b = store42Res.rows[0].branding || {};
    b.name = "restateLP İskele Long Beach Şubesi (Demo)";
    b.store_name = "restateLP İskele Long Beach Şubesi (Demo)";
    b.legal_name = "RESTATELP DEMO & SIMULASYON YAZILIM A.S.";
    b.phone = "+90 (500) 000 00 12";
    b.whatsapp_number = "+90 (500) 000 00 12";
    b.address = "Kurgusal Sahil Bulvarı No:88 (Demo Bölgesi), İskele / KKTC";
    b.is_demo = true;
    await pool.query(
      "UPDATE stores SET name = $1, phone = $2, address = $3, branding = $4 WHERE id = 42",
      ["restateLP İskele Long Beach Şubesi (Demo)", "+90 (500) 000 00 12", "Kurgusal Sahil Bulvarı No:88 (Demo Bölgesi), İskele / KKTC", JSON.stringify(b)]
    );
  }

  // 4. Update store 38 (shoplp-demo)
  const store38Res = await pool.query("SELECT * FROM stores WHERE id = 38");
  if (store38Res.rows.length > 0) {
    const b = store38Res.rows[0].branding || {};
    b.phone = "+90 (500) 000 00 00";
    b.whatsapp_number = "+90 (500) 000 00 00";
    b.address = "Demo Maslak Cad. No:0 (Test Bölgesi), Sarıyer / İstanbul";
    b.legal_name = "SHOPLP DEMO & SIMULASYON YAZILIM A.S.";
    b.is_demo = true;
    await pool.query(
      "UPDATE stores SET phone = $1, address = $2, branding = $3 WHERE id = 38",
      ["+90 (500) 000 00 00", "Demo Maslak Cad. No:0 (Test Bölgesi), Sarıyer / İstanbul", JSON.stringify(b)]
    );
  }

  // 5. Update properties of store 40, 41, 42:
  await pool.query(`
    UPDATE real_estate_properties 
    SET is_on_enrakipsiz = false,
        owner_name = 'Demo Mülk Sahibi (Kurgusal)',
        owner_phone = '+90 (500) 000 00 99',
        owner_id_number = 'DEMO-TRNC-0000',
        responsible_agent = CASE 
          WHEN responsible_agent = 'Selin Karahan' THEN 'Demo Danışman Maya'
          WHEN responsible_agent = 'Emre Can Polat' THEN 'Demo Danışman Atlas'
          WHEN responsible_agent = 'Barış Yılmaz' THEN 'Demo Danışman Orion'
          ELSE 'Demo Portföy Danışmanı'
        END
    WHERE store_id IN (40, 41, 42)
  `);

  // 6. Update real_estate_contacts for store 40:
  await pool.query("DELETE FROM real_estate_contacts WHERE store_id IN (40, 41, 42)");
  await pool.query(`
    INSERT INTO real_estate_contacts (store_id, name, phone, email, address, type, notes, created_at, updated_at) VALUES
    (40, 'Demo Alıcı Alpha', '+90 (500) 000 01 01', 'alici.alpha@demomail.invalid', 'Simülasyon Mah. No:1 (Demo Bölgesi)', 'buyer', 'Bellapais 4+1 villa ile ilgileniyor. £460,000 nakit demo teklif verdi. Sözleşme aşamasında demo avukatı inceliyor.', NOW(), NOW()),
    (40, 'Demo Yatırımcı Beta', '+90 (500) 000 01 02', 'yatirimci.beta@demomail.invalid', 'Kurgusal Cad. No:2 (Demo Bölgesi)', 'buyer', 'Alsancak 2+1 daire için kredi görüşmesi yapıldı. Ekspertiz raporu bekleniyor.', NOW(), NOW()),
    (40, 'Demo Fon Yöneticisi Gamma', '+90 (500) 000 01 03', 'fon.gamma@demomail.invalid', 'Test Plaza No:3 (Demo Bölgesi)', 'investor', 'Dereboyu ticari mağaza için £280,000 demo teklif sundu. Mülk sahibi ile kapora pazarlığı yapılıyor.', NOW(), NOW()),
    (40, 'Demo Kurumsal Alıcı Delta', '+90 (500) 000 01 04', 'alici.delta@demomail.invalid', 'Örnek Sahil Apt. No:4 (Demo Bölgesi)', 'buyer', 'Long Beach Penthouse için £10,000 kapora simülasyonu yapıldı. Koçan devir evrakları hazırlanıyor.', NOW(), NOW()),
    (40, 'Demo Mülk Sahibi Epsilon', '+90 (500) 000 01 05', 'sahip.epsilon@demomail.invalid', 'Kurgusal Tepe No:5 (Demo Bölgesi)', 'seller', 'Çatalköydeki 850 m² arsanın tek yetkili demo aracılık yetki sözleşmesi imzalandı. Süre: 6 ay.', NOW(), NOW())
  `);

  // 7. Update portfolio_transactions for store 40:
  await pool.query(`
    UPDATE portfolio_transactions 
    SET title = 'Danışman Başarı Primi (Demo Danışman Maya)' 
    WHERE store_id = 40 AND title LIKE '%Selin Karahan%'
  `);

  // 8. Insert or replace pipeline leads for store 40:
  await pool.query("DELETE FROM real_estate_leads WHERE store_id IN (40, 41, 42)");
  await pool.query(`
    INSERT INTO real_estate_leads (store_id, customer_name, customer_phone, source, status, property_title, notes, created_at, updated_at) VALUES
    (40, 'Demo Alıcı Alpha', '+90 (500) 000 01 01', 'Web Vitrini (Demo)', 'offer_received', 'Girne Bellapais Özel Havuzlu Lüks Villa', '£460,000 teklif sunuldu. Avukat inceleme sürecinde.', NOW(), NOW()),
    (40, 'Demo Yatırımcı Beta', '+90 (500) 000 01 02', 'WhatsApp Simülasyonu', 'showing_scheduled', 'İskele Long Beach Penthouse', 'Cumartesi günü saat 14:00te demo yerinde inceleme randevusu planlandı.', NOW(), NOW()),
    (40, 'Demo Fon Yöneticisi Gamma', '+90 (500) 000 01 03', 'Tavsiye / Referans', 'new_lead', 'Lefkoşa Dereboyu Kurumsal Mağaza', 'Yıllık kira getiri simülasyonu talep edildi, fizibilite tablosu hazırlandı.', NOW(), NOW())
  `);

  console.log("Demo data successfully sanitized with artificial placeholder values!");
  process.exit(0);
}

sanitizeDemoData().catch(e => {
  console.error("Sanitization error:", e);
  process.exit(1);
});

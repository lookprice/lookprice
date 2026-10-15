import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Helper for password policy (LookPrice Corporate Security Standards)
const isValidPassword = (password: string) => {
  if (!password || password.length < 12) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// Auth: Login
router.post("/login", async (req, res) => {
  const { email, password, storeCode } = req.body;
  
  let query = `
    SELECT u.*, s.slug as store_slug, s.status as store_status, s.is_approved as store_is_approved, s.store_code
    FROM users u 
    LEFT JOIN stores s ON u.store_id = s.id 
    WHERE u.email = $1
  `;
  const params: any[] = [email];
  
  if (storeCode) {
    query += ` AND (s.store_code = $2 OR u.role = 'superadmin')`;
    params.push(storeCode);
  }

  const userRes = await pool.query(query, params);
  
  const user = userRes.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check store approval/suspension status for store users
  if (user.role !== "superadmin" && user.store_id) {
    if (user.store_is_approved === false || user.store_status === "suspended") {
      return res.status(403).json({ 
        error: "store_suspended", 
        message: "Mağazanız askıya alınmıştır veya onaylanmamıştır. Lütfen sistem yöneticisi ile iletişime geçiniz." 
      });
    }
    if (user.store_status === "pending") {
      return res.status(403).json({ 
        error: "store_pending", 
        message: "Mağazanız şu anda onay beklemektedir. Lütfen onaylanmasını bekleyiniz." 
      });
    }
  }
  
  const token = jwt.sign({ 
    id: user.id, 
    role: user.role, 
    store_id: user.store_id,
    store_slug: user.store_slug 
  }, JWT_SECRET);
  
  res.json({ 
    token, 
    user: { 
      email: user.email, 
      role: user.role, 
      store_id: user.store_id,
      store_slug: user.store_slug,
      password_needs_update: !isValidPassword(password)
    } 
  });
});

// Auth: Register
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address, store_id } = req.body;
  
  try {
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "LookPrice Kurumsal Güvenlik Standartları: Şifreniz en az 12 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir." });
    }

    // Check if user exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = await pool.query(`
      INSERT INTO users (name, email, password, phone, address, role, store_id) 
      VALUES ($1, $2, $3, $4, $5, 'customer', $6) 
      RETURNING id, name, email, role, store_id
    `, [name, email, hashedPassword, phone, address, store_id || null]);

    const user = newUser.rows[0];
    
    const token = jwt.sign({ 
      id: user.id, 
      role: user.role, 
      store_id: user.store_id 
    }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { 
        email: user.email, 
        role: user.role, 
        store_id: user.store_id,
        password_needs_update: false
      } 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Kayıt olurken bir hata oluştu." });
  }
});

router.post("/change-password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: "LookPrice Kurumsal Güvenlik Standartları: Şifreniz en az 12 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir." });
  }

  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const user = userRes.rows[0];

  if (user && bcrypt.compareSync(currentPassword, user.password)) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
    res.json({ success: true, password_needs_update: false });
  } else {
    res.status(400).json({ error: "Mevcut şifre hatalı" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = userRes.rows[0];

  if (!user) {
    return res.status(404).json({ error: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı" });
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [token, expiry, user.id]);

  console.log(`Password reset link: /reset-password/${token}`);
  
  res.json({ 
    success: true, 
    message: "Şifre sıfırlama bağlantısı simüle edildi.",
    debug_token: token
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()", [token]);
  const user = userRes.rows[0];

  if (!user) {
    return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await pool.query("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashedPassword, user.id]);
  res.json({ success: true });
});

// Demo Login & Auto-Seeding Endpoint for 6 Sectors
router.post("/demo-login", async (req, res) => {
  try {
    const { sector } = req.body; // 'shoplp' | 'horecalp' | 'autolp' | 'restatelp' | 'booklp' | 'hotellp'
    const validSectors = ['shoplp', 'horecalp', 'autolp', 'restatelp', 'booklp', 'hotellp'];
    const targetSector = validSectors.includes(sector) ? sector : 'shoplp';

    const slug = `demo-${targetSector}`;
    const email = `demo_${targetSector}@lookprice.me`;

    // 1. Check if demo store exists
    let storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
    let store = storeRes.rows[0];

    const sectorMeta: Record<string, { name: string; type: string; hotel: boolean }> = {
      shoplp: { name: "Seçkin Perakende & Mağaza Demo", type: "product", hotel: false },
      horecalp: { name: "Seçkin Lezzetler Kafe & Restoran", type: "cafe_restaurant", hotel: false },
      autolp: { name: "Seçkin Motorlu Araçlar & Galeri", type: "motor_vehicle", hotel: false },
      restatelp: { name: "Seçkin VIP Gayrimenkul Portföyü", type: "real_estate", hotel: false },
      booklp: { name: "Seçkin Kitabevi & Kırtasiye Dünyası", type: "product", hotel: false },
      hotellp: { name: "Seçkin Grand Otel & Konaklama", type: "hotel", hotel: true },
    };

    const meta = sectorMeta[targetSector];

    if (!store) {
      const newStoreRes = await pool.query(`
        INSERT INTO stores (name, slug, email, phone, plan, hotel_module_enabled, branding)
        VALUES ($1, $2, $3, $4, 'enterprise', $5, $6)
        RETURNING *
      `, [
        meta.name,
        slug,
        email,
        "+90 (392) 444 0000",
        meta.hotel,
        JSON.stringify({ store_type: meta.type, primary_color: "#4f46e5", demo_mode: true })
      ]);
      store = newStoreRes.rows[0];
      const storeId = store.id;

      // Seed mock data based on sector with rich descriptions and Unsplash images
      if (targetSector === 'shoplp') {
        await pool.query(`
          INSERT INTO products (store_id, barcode, name, price, cost_price, stock_quantity, tax_rate, description, image_url)
          VALUES 
          ($1, '8690001001', 'Akıllı Telefon Pro Max 256GB', 34999, 28000, 45, 20, 'Son teknoloji OLED ekran, 8GB RAM, 256GB depolama, 108MP kamera sistemi.', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80'),
          ($1, '8690001002', 'Kablosuz Gürültü Engelleyici Kulaklık', 4500, 3200, 80, 20, 'Aktif gürültü önleme, Hi-Fi ses kalitesi, 40 saat kesintisiz pil ömrü.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'),
          ($1, '8690001003', 'Ultra Akıllı Spor Saati', 7999, 5500, 30, 20, 'AMOLED ekran, dahili GPS, nabız, SpO2 ve kapsamlı uyku takibi.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'),
          ($1, '8690001004', '15.6 inç Oyuncu Dizüstü Bilgisayarı', 28999, 22000, 15, 20, 'Intel i7 13. Nesil, 16GB RAM, RTX 4060, 512GB NVMe SSD.', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80'),
          ($1, '8690001005', 'Profesyonel Espresso Makinesi', 12500, 9000, 20, 20, '20 bar basınç, entegre çelik konik öğütücü ve buhar çubuğu.', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80')
        `, [storeId]);

        await pool.query(`
          INSERT INTO technical_services (store_id, device_name, serial_number, customer_name, customer_phone, issue_description, status, price)
          VALUES ($1, 'Akıllı Telefon Pro Max', 'IMEI998877', 'Ahmet Yılmaz', '+90 533 800 1122', 'Ekran değişimi ve batarya kontrolü', 'in_progress', 2500)
        `, [storeId]);
      } else if (targetSector === 'horecalp') {
        await pool.query(`
          INSERT INTO products (store_id, barcode, name, price, cost_price, stock_quantity, tax_rate, description, image_url)
          VALUES 
          ($1, 'HORECA-01', 'Adana Kebap (Porsiyon)', 450, 120, 100, 10, 'Zırh kıymasından özel baharatlı kebap, közlenmiş domates ve biber ile.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'),
          ($1, 'HORECA-02', 'Kaşarlı Fırın Pide', 280, 70, 150, 10, 'Taş fırında taze kaşarlı ve tereyağlı çıtır Karadeniz pidesi.', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'),
          ($1, 'HORECA-03', 'Fıstıklı Baklava (4 Dilim)', 220, 60, 80, 10, 'Gaziantep yöresinden bol Antep fıstıklı çıtır baklava.', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80'),
          ($1, 'HORECA-04', 'Yayık Ayranı (Büyük Boy)', 50, 10, 300, 10, 'Geleneksel yayık ayranı.', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'),
          ($1, 'HORECA-05', 'Közde Türk Kahvesi', 70, 15, 500, 10, 'Közde yavaş pişmiş bol köpüklü Türk kahvesi.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80')
        `, [storeId]);

        await pool.query(`
          INSERT INTO restaurant_tables (store_id, table_no, section, capacity, status)
          VALUES 
          ($1, 'Masa 1', 'Salon', 4, 'occupied'),
          ($1, 'Masa 2', 'Salon', 2, 'available'),
          ($1, 'VIP 1', 'VIP', 8, 'reserved'),
          ($1, 'Teras 1', 'Teras', 4, 'available')
        `, [storeId]);
      } else if (targetSector === 'autolp') {
        await pool.query(`
          INSERT INTO vehicles (store_id, plate, brand, model, year, km, price, color, status, fuel_type, transmission, image_url)
          VALUES 
          ($1, '34 DEMO 01', 'BMW', '3.20i M Sport', 2023, 18500, 2450000, 'Metalik Siyah', 'available', 'Benzin', 'Otomatik', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'),
          ($1, '35 DEMO 02', 'Mercedes-Benz', 'C200 AMG', 2022, 32000, 2750000, 'İnci Beyazı', 'available', 'Hibrit', 'Otomatik', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'),
          ($1, '06 DEMO 03', 'Audi', 'A4 Advanced', 2021, 45000, 1950000, 'Gri', 'available', 'Dizel', 'Otomatik', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80'),
          ($1, '07 DEMO 04', 'Porsche', 'Macan S', 2023, 12000, 5850000, 'Yarış Kırmızısı', 'available', 'Benzin', 'Otomatik', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80')
        `, [storeId]);
      } else if (targetSector === 'restatelp') {
        await pool.query(`
          INSERT INTO real_estate (store_id, title, description, property_type, listing_type, price, currency, rooms, gross_area, net_area, city, district, address, status, images)
          VALUES 
          ($1, 'Girne Bellapais Manzaralı Lüks 4+1 Villa', 'Doğa ve deniz manzaralı, özel havuzlu, birinci sınıf lüks villa.', 'Villa', 'sale', 1250000, 'GBP', '4+1', 320, 280, 'Girne', 'Bellapais', 'Bellapais Manastırı Yakını', 'active', '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"]'::jsonb),
          ($1, 'Lefkoşa Merkezde Sıfır 3+1 Daire', 'Şehir merkezinde, kapalı otoparklı, ankastre mutfaklı lüks daire.', 'Daire', 'sale', 145000, 'GBP', '3+1', 145, 130, 'Lefkoşa', 'Köşklüçiftlik', 'Ana Cadde Üzeri', 'active', '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"]'::jsonb),
          ($1, 'İskele Long Beach Sıfır Stüdyo Deniz Manzaralı', 'Denize sıfır projede, havuz ve sosyal tesis olanaklı yatırım fırsatı stüdyo.', 'Daire', 'rent', 850, 'GBP', '1+0', 55, 48, 'İskele', 'Long Beach', 'Sahile 100 Metre', 'active', '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"]'::jsonb),
          ($1, 'Alsancak Dağ ve Deniz Manzaralı 3+1 Dubleks', 'Ferah teraslı, eşyalı taşınmaya hazır lüks dubleks.', 'Villa', 'sale', 320000, 'GBP', '3+1', 210, 190, 'Girne', 'Alsancak', 'Yavuz Çıkarma Plajı Arkası', 'active', '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"]'::jsonb)
        `, [storeId]);
      } else if (targetSector === 'booklp') {
        await pool.query(`
          INSERT INTO products (store_id, barcode, name, price, cost_price, stock_quantity, tax_rate, description, image_url)
          VALUES 
          ($1, 'BOOK-9781', 'Suç ve Ceza (Özel Ciltli Baskı)', 350, 180, 60, 10, 'Fyodor Dostoyevski, Tam Metin Özel Ciltli Çeviri.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'),
          ($1, 'BOOK-9782', 'Yazılım Mimarı El Kitabı', 650, 400, 40, 10, 'Modern microservices, system design ve enterprise patterns.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80'),
          ($1, 'BOOK-9783', 'Çocuklar İçin Dünya Klasikleri Seti (10 Kitap)', 1200, 700, 25, 10, 'Renkli resimli özel kutulu çocuk klasikleri seti.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'),
          ($1, 'STATIONERY-01', 'Profesyonel Eskiz Defteri & Kalem Seti', 380, 150, 110, 20, '160gr asitsiz kaliteli eskiz kağıdı ve 12li kurşun kalem seti.', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80')
        `, [storeId]);
      } else if (targetSector === 'hotellp') {
        // Seed hotel rooms in store branding
        const demoHotelRooms = [
          { id: 1, room_number: "101", room_type: "Deluxe Deniz Manzaralı", capacity: 2, price: 4500, status: "available", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", description: "Muhteşem Akdeniz manzarası, geniş balkon, jakuzi ve king size yatak." },
          { id: 2, room_number: "204", room_type: "Grand Suit Oda", capacity: 3, price: 7500, status: "available", image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80", description: "Özel oturma alanı, panoramik deniz manzarası ve lüks donanım." },
          { id: 3, room_number: "305", room_type: "Superior Aile Odası", capacity: 4, price: 9200, status: "occupied", image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", description: "İki yatak odalı, çocuklu aileler için konforlu ve ferah konaklama." }
        ];

        await pool.query(`
          UPDATE stores SET branding = jsonb_set(COALESCE(branding, '{}'::jsonb), '{hotel_rooms}', $1::jsonb)
          WHERE id = $2
        `, [JSON.stringify(demoHotelRooms), storeId]);

        await pool.query(`
          INSERT INTO hotel_reservations (store_id, guest_name, guest_phone, room_number, check_in_date, check_out_date, total_price, status)
          VALUES 
          ($1, 'Mehmet Demir', '+90 542 700 8899', '101 - Deluxe Deniz Manzaralı', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 13500, 'confirmed'),
          ($1, 'Ayşe Kaya', '+90 532 900 1122', '204 - Grand Suit Oda', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '5 days', 28000, 'confirmed'),
          ($1, 'Caner Yıldız', '+90 533 111 2233', '305 - Superior Aile Odası', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 18400, 'confirmed')
        `, [storeId]);
      }
    }

    // 2. Check if demo user exists for this store
    let userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user = userRes.rows[0];

    if (!user) {
      const hashedPassword = bcrypt.hashSync("Demo2026!+", 10);
      const newUserRes = await pool.query(`
        INSERT INTO users (name, email, password, phone, role, store_id)
        VALUES ($1, $2, $3, $4, 'admin', $5)
        RETURNING id, name, email, role, store_id
      `, [`Demo Yönetici (${targetSector.toUpperCase()})`, email, hashedPassword, "+90 392 444 0000", store.id]);
      user = newUserRes.rows[0];
    } else {
      await pool.query("UPDATE users SET store_id = $1, role = 'admin' WHERE id = $2", [store.id, user.id]);
    }

    const token = jwt.sign({
      id: user.id,
      role: 'admin',
      store_id: store.id,
      store_slug: store.slug
    }, JWT_SECRET);

    res.json({
      token,
      user: {
        email: user.email,
        role: 'admin',
        store_id: store.id,
        store_slug: store.slug,
        password_needs_update: false
      },
      message: `${meta.name} demo hesabına başarıyla giriş yapıldı.`
    });
  } catch (error) {
    console.error("Demo login error:", error);
    res.status(500).json({ error: "Demo hesaba giriş yapılırken bir hata oluştu." });
  }
});

export default router;

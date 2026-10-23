import { pool } from '../models/db.js';
import bcrypt from 'bcryptjs';

async function seedBookLpDemo() {
  console.log('--- Starting bookLP Demo Seeding ---');
  const mainStoreId = 45;
  const branchStoreId = 46;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const bookstoreTheme = {
    preset_id: 'literary_navy',
    hero_title: 'HAFTANIN ESERLERİ',
    primary_color: '#0284c7',
    background_mode: 'navy_dark',
    hero_badge_text: 'HAFTANIN SEÇKİSİ',
    secondary_color: '#38bdf8',
    show_hero_quote: true,
    enable_card_flip: true,
    show_card_badges: true,
    show_card_rating: true,
    title_discounted: 'Özel Fırsat & İndirimli Eserler',
    announcement_text: '📚 Kültür & Edebiyat Günleri: 750 TL Üzeri Siparişlerde Ücretsiz Kargo ve Özel Ayraç Hediyeli!',
    max_category_rows: 5,
    show_hero_collage: true,
    title_bestsellers: 'Çok Satan Eserler',
    title_coming_soon: 'Yakında Raflarda & Ön Sipariş',
    show_card_synopsis: true,
    show_hero_3d_cover: true,
    title_editors_pick: 'Editörün Seçimi',
    title_new_arrivals: 'Yeni Çıkanlar & Raflarda',
    show_card_quick_add: true,
    show_hero_billboard: true,
    show_row_categories: true,
    show_row_discounted: true,
    subtitle_discounted: 'Okurlarımız için sınırlı süreyle indirimli sunulan seçkin klasikler ve güncel eserler',
    title_award_winning: 'Ödüllü Eserler & Başyapıtlar',
    hero_collage_opacity: 0.25,
    show_row_bestsellers: true,
    show_row_coming_soon: true,
    subtitle_bestsellers: 'Okurların en çok tercih ettiği, haftanın zirvedeki popüler kitapları',
    subtitle_coming_soon: 'Baskı aşamasında olan ve merakla beklenen yeni yayınlar',
    announcement_bg_style: 'accent',
    show_announcement_bar: true,
    show_hero_meta_badges: true,
    show_row_editors_pick: true,
    show_row_new_arrivals: true,
    subtitle_editors_pick: 'Edebiyat danışmanlarımız ve yayın kurulumuz tarafından özenle seçilen eserler',
    subtitle_new_arrivals: 'Edebiyat dünyasından en son çıkan taze baskılar ve yeni çeviriler',
    show_row_award_winning: true,
    subtitle_award_winning: 'Nobel, Pulitzer ve ulusal edebiyat ödülleriyle taçlandırılmış başyapıtlar',
    hero_auto_rotate_seconds: 4
  };

  const mainBranding = {
    store_name: 'bookLP Kültür, Sanat & Kitabevi (Demo)',
    name: 'bookLP Kültür, Sanat & Kitabevi (Demo)',
    slug: 'booklp-demo',
    store_type: 'product',
    store_concept: 'bookstore',
    sub_sector: 'bookstore',
    is_demo: true,
    bookstore_module_enabled: true,
    bookstore_license_enabled: true,
    active_preset: 'bookstore_netflix',
    phone: '+90 (392) 228 4500',
    whatsapp_number: '+90 (548) 228 4500',
    email: 'demo@booklp.com',
    address: 'Dereboyu Mehmet Akif Caddesi No: 88, Lefkoşa / KKTC',
    currency: 'TRY',
    currency_rates: { TRY: 1, USD: 38.5, EUR: 41.2, GBP: 48.6 },
    bookstore_theme: bookstoreTheme,
    page_layout_settings: {
      sector: 'bookstore',
      store_concept: 'bookstore',
      bookstore_mode: true,
      active_preset: 'bookstore_netflix',
      bookstore_theme: bookstoreTheme
    }
  };

  const branchBranding = {
    ...mainBranding,
    store_name: 'bookLP Girne Liman & Sahaf Şubesi (Demo)',
    name: 'bookLP Girne Liman & Sahaf Şubesi (Demo)',
    slug: 'booklp-girne-demo',
    address: 'Kordonboyu Caddesi Antik Liman Karşısı No: 19, Girne / KKTC',
    phone: '+90 (392) 815 4500'
  };

  console.log('1. Creating/Updating Main Bookstore (ID 45) & Branch (ID 46)...');
  await pool.query(`
    INSERT INTO stores (
      id, name, slug, store_code, store_type, sub_sector, is_approved, status, plan,
      bookstore_module_enabled, branding, parent_id, branch_name, address, phone, email, default_currency
    ) VALUES (
      $1, 'bookLP Kültür, Sanat & Kitabevi (Demo)', 'booklp-demo', 'LP-BOOK00', 'product', 'bookstore',
      true, 'active', 'pro', true, $2, null, 'Merkez Kitabevi & Kültür Salonu (Lefkoşa)',
      'Dereboyu Mehmet Akif Caddesi No: 88, Lefkoşa / KKTC', '+90 (392) 228 4500', 'demo@booklp.com', 'TRY'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      store_code = EXCLUDED.store_code,
      store_type = EXCLUDED.store_type,
      sub_sector = EXCLUDED.sub_sector,
      bookstore_module_enabled = true,
      is_approved = true,
      status = 'active',
      branding = EXCLUDED.branding,
      branch_name = EXCLUDED.branch_name,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email
  `, [mainStoreId, JSON.stringify(mainBranding)]);

  await pool.query(`
    INSERT INTO stores (
      id, name, slug, store_code, store_type, sub_sector, is_approved, status, plan,
      bookstore_module_enabled, branding, parent_id, branch_name, address, phone, email, default_currency
    ) VALUES (
      $1, 'bookLP Girne Liman & Sahaf Şubesi (Demo)', 'booklp-girne-demo', 'LP-BOOK01', 'product', 'bookstore',
      true, 'active', 'pro', true, $2, $3, 'Girne Liman & Sahaf Şubesi',
      'Kordonboyu Caddesi Antik Liman Karşısı No: 19, Girne / KKTC', '+90 (392) 815 4500', 'girne@booklp.com', 'TRY'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      store_code = EXCLUDED.store_code,
      store_type = EXCLUDED.store_type,
      sub_sector = EXCLUDED.sub_sector,
      bookstore_module_enabled = true,
      is_approved = true,
      status = 'active',
      branding = EXCLUDED.branding,
      parent_id = EXCLUDED.parent_id,
      branch_name = EXCLUDED.branch_name,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email
  `, [branchStoreId, JSON.stringify(branchBranding), mainStoreId]);

  console.log('2. Creating/Updating demo@booklp.com user...');
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('booklp1234', salt);
  const existingUser = await pool.query("SELECT id FROM users WHERE email = 'demo@booklp.com'");
  if (existingUser.rows.length > 0) {
    await pool.query("UPDATE users SET password = $1, store_id = $2, role = 'admin', is_active = true WHERE email = 'demo@booklp.com'", [hash, mainStoreId]);
  } else {
    await pool.query("INSERT INTO users (email, password, role, store_id, is_active) VALUES ('demo@booklp.com', $1, 'admin', $2, true)", [hash, mainStoreId]);
  }

  console.log('3. Seeding Literary Catalog (Books & Collector Editions)...');
  await pool.query('DELETE FROM products WHERE store_id IN ($1, $2)', [mainStoreId, branchStoreId]);

  const books = [
    {
      barcode: '9789753638029',
      name: 'Kürk Mantolu Madonna',
      author: 'Sabahattin Ali',
      brand: 'Yapı Kredi Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Dünya & Türk klasikleri',
      price: 145,
      price_2: 110,
      cost_price: 65,
      stock_quantity: 140,
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      description: 'Raif Efendi ile Maria Puder arasındaki unutulmaz ve derin ruhsal bağın hikayesi. Türk edebiyatının en çok okunan başyapıtlarından biri.',
      labels: ['bestseller', 'featured_week', 'editors_pick', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: true,
        is_featured_weekly: true,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: '118. Baskı',
        page_count: '160',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.9',
        featured_quote: '«Dünyanın en basit, en zavallı, hatta en ahmak adamı bile, insanı hayretten hayrete düşürecek ne müthiş ve karışık bir ruha maliktir!»',
        awards: 'Türk Edebiyatı Modern Klasikler Zirvesi'
      }
    },
    {
      barcode: '9789750826153',
      name: 'Masumiyet Müzesi (Özel Ciltli Baskı)',
      author: 'Orhan Pamuk',
      brand: 'Yapı Kredi Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Aşk / Romantik',
      price: 420,
      price_2: 350,
      cost_price: 210,
      stock_quantity: 55,
      image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
      description: '1975 yılında İstanbul’da başlayan, Kemal ile Füsun arasındaki tutkulu aşkın ve İstanbul’un geçmiş zaman eşyalarının romanı.',
      labels: ['award_winning', 'featured_week', 'editors_pick'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: true,
        is_featured_weekly: true,
        translator: '',
        language: 'Türkçe',
        publication_year: '2023',
        edition: '24. Baskı',
        page_count: '592',
        cover_type: 'Sert Kapak',
        dimensions: '14 x 22 cm',
        rating: '4.8',
        featured_quote: '«Hayatımın en mutlu anıymış, bilmiyordum.»',
        awards: 'Nobel Edebiyat Ödüllü Yazar / New York Times Yılın Kitabı'
      }
    },
    {
      barcode: '9789750718533',
      name: '1984',
      author: 'George Orwell',
      brand: 'Can Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Bilimkurgu & Fantastik',
      price: 230,
      price_2: 185,
      cost_price: 105,
      stock_quantity: 95,
      image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80',
      description: 'Büyük Birader’in her an herkesi gözetlediği distopik bir dünyada özgürlük, gerçeklik ve birey olma mücadelesi.',
      labels: ['bestseller', 'award_winning', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: true,
        is_featured_weekly: true,
        translator: 'Celâl Üster',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '95. Baskı',
        page_count: '352',
        cover_type: 'Karton Kapak',
        dimensions: '12.5 x 19.5 cm',
        rating: '4.9',
        featured_quote: '«Geçmişi kontrol eden geleceği kontrol eder; şimdiyi kontrol eden geçmişi kontrol eder.»',
        awards: 'Time Tüm Zamanların En İyi 100 Romanı'
      }
    },
    {
      barcode: '9789750719387',
      name: 'Yüzyıllık Yalnızlık',
      author: 'Gabriel García Márquez',
      brand: 'Can Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Dünya & Türk klasikleri',
      price: 340,
      price_2: 0,
      cost_price: 160,
      stock_quantity: 62,
      image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
      description: 'Buendía ailesinin yedi kuşak boyunca Macondo kasabasında yaşadığı büyülü gerçekçi destan.',
      labels: ['award_winning', 'editors_pick', 'bestseller'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Seçkin Selvi',
        language: 'İspanyolca (Çeviri)',
        publication_year: '2024',
        edition: '82. Baskı',
        page_count: '464',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.9',
        featured_quote: '«Nesiller boyu yalnızlığa mahkum edilen ailelerin yeryüzünde ikinci bir şansı olmazdı.»',
        awards: '1982 Nobel Edebiyat Ödülü'
      }
    },
    {
      barcode: '9786053609117',
      name: 'Suç ve Ceza (Hasan Ali Yücel Klasikleri - Ciltli)',
      author: 'Fyodor Mihayloviç Dostoyevski',
      brand: 'Türkiye İş Bankası Kültür Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Dünya & Türk klasikleri',
      price: 390,
      price_2: 310,
      cost_price: 185,
      stock_quantity: 88,
      image_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
      description: 'Raskolnikov’un işlediği çifte cinayet sonrasında yaşadığı vicdan muhasebesi, insan ruhunun en karanlık ve en aydınlık dehlizleri.',
      labels: ['bestseller', 'award_winning', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Mazlum Beyhan',
        language: 'Rusça (Çeviri)',
        publication_year: '2024',
        edition: '56. Baskı',
        page_count: '704',
        cover_type: 'Sert Kapak',
        dimensions: '14 x 20.5 cm',
        rating: '5.0',
        featured_quote: '«Önce biraz ağladılar, ama şimdi alıştılar. Aşağılık insanoğlu her şeye alışır!»',
        awards: 'Dünya Edebiyatı Başyapıtları Seçkisi'
      }
    },
    {
      barcode: '9789753638036',
      name: 'İnce Memed 1 - 4 (Özel Kutulu Tam Set)',
      author: 'Yaşar Kemal',
      brand: 'Yapı Kredi Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Tarihi Roman',
      price: 1450,
      price_2: 1180,
      cost_price: 720,
      stock_quantity: 24,
      image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
      description: 'Çukurova’nın bereketli topraklarında Abdi Ağa’nın zulmüne başkaldıran İnce Memed’in ölümsüz Anadolu destanı.',
      labels: ['featured_week', 'award_winning', 'editors_pick', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: true,
        is_featured_weekly: true,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: 'Özel Koleksiyon',
        page_count: '2160',
        cover_type: 'Kutulu Set',
        dimensions: '14 x 21 cm',
        rating: '5.0',
        featured_quote: '«Dağlar, insanlar ve hatta ölüm bile yorulduysa, şimdi en güzel şiir, barıştır.»',
        awards: 'Varlık Roman Armağanı / Prix Mondial Cino Del Duca'
      }
    },
    {
      barcode: '9786050914443',
      name: 'Sapiens: İnsan Türünün Kısa Bir Tarihi',
      author: 'Yuval Noah Harari',
      brand: 'Kolektif Kitap',
      category: 'Araştırma, İnceleme, Bilim',
      sub_category: 'Tarih',
      price: 360,
      price_2: 295,
      cost_price: 170,
      stock_quantity: 110,
      image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
      description: 'Bilişsel devrimden tarım ve bilim devrimine kadar Homo Sapiens’in dünyayı nasıl ele geçirdiğinin sarsıcı anlatısı.',
      labels: ['bestseller', 'editors_pick', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Ertuğrul Genç',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '74. Baskı',
        page_count: '412',
        cover_type: 'Karton Kapak',
        dimensions: '15 x 23 cm',
        rating: '4.8',
        featured_quote: '«Tarihin en büyük dolandırıcılığı Buğday Devrimi’dir.»',
        awards: 'New York Times #1 Bestseller / Çin Ulusal Kitap Ödülü'
      }
    },
    {
      barcode: '9789759955755',
      name: 'Bir Ömür Nasıl Yaşanır?',
      author: 'İlber Ortaylı',
      brand: 'Kronik Kitap',
      category: 'Araştırma, İnceleme, Bilim',
      sub_category: 'Felsefe & Düşünce',
      price: 260,
      price_2: 0,
      cost_price: 120,
      stock_quantity: 78,
      image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
      description: 'Prof. Dr. İlber Ortaylı’nın yaşam tecrübeleriyle her yaş grubundan okura yol gösteren bilgelik ve kültür rehberi.',
      labels: ['bestseller', 'editors_pick'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: '112. Baskı',
        page_count: '288',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.9',
        featured_quote: '«Kendi kendinizi yetiştirin; dünyayı gezin, dil öğrenin ve asla merakınızı kaybetmeyin.»',
        awards: 'Yılın En Çok Okunan Kültür & Düşünce Eseri'
      }
    },
    {
      barcode: '9789752126046',
      name: 'Kozmos: Evrenin ve Yaşamın Sırları',
      author: 'Carl Sagan',
      brand: 'Altın Kitaplar',
      category: 'Araştırma, İnceleme, Bilim',
      sub_category: 'Bilim & Teknoloji',
      price: 380,
      price_2: 0,
      cost_price: 180,
      stock_quantity: 45,
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      description: 'Bilim tarihinin en etkileyici eseri: Yıldızların doğumundan galaksilerin evrimine ve insan bilincinin doğuşuna uzanan şiirsel yolculuk.',
      labels: ['award_winning', 'new_release'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Reşit Aşçıoğlu',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '38. Baskı',
        page_count: '396',
        cover_type: 'Sert Kapak',
        dimensions: '14 x 21 cm',
        rating: '5.0',
        featured_quote: '«Hepimiz yıldız tozuyuz; Kozmos’un kendi kendini tanımasının bir yoluyuz.»',
        awards: 'Hugo En İyi Kurgu Dışı Kitap Ödülü'
      }
    },
    {
      barcode: '9789751419200',
      name: 'Var Mısın? Güçlü Bir Yaşam İçin Öneriler',
      author: 'Doğan Cüceloğlu',
      brand: 'Kronik Kitap',
      category: 'Kişisel Gelişim & Psikoloji',
      sub_category: 'Popüler Psikoloji',
      price: 250,
      price_2: 195,
      cost_price: 115,
      stock_quantity: 130,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      description: 'Doğan Cüceloğlu’nun hayatın anlamını, içsel direnci ve umudu keşfetmek isteyenler için bıraktığı başucu eseri.',
      labels: ['bestseller', 'deal', 'editors_pick'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: '90. Baskı',
        page_count: '320',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.9',
        featured_quote: '«Kendi hayatının kahramanı olmaya var mısın?»',
        awards: ''
      }
    },
    {
      barcode: '9789755391502',
      name: 'Nietzsche Ağladığında',
      author: 'Irvin D. Yalom',
      brand: 'Ayrıntı Yayınları',
      category: 'Kişisel Gelişim & Psikoloji',
      sub_category: 'Klinik Psikoloji & Teori',
      price: 330,
      price_2: 0,
      cost_price: 155,
      stock_quantity: 64,
      image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
      description: '19. yüzyıl Viyana’sında psikanalizin doğuşu, Friedrich Nietzsche ile Doktor Josef Breuer’in varoluşsal yüzleşmesi.',
      labels: ['bestseller', 'award_winning'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Sibel İnceoğlu',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '104. Baskı',
        page_count: '416',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21.5 cm',
        rating: '4.9',
        featured_quote: '«Ümitsizlik, öz-farkındalık için ödenen bedeldir.»',
        awards: 'Commonwealth Club Altın Madalya Ödülü'
      }
    },
    {
      barcode: '9786053754794',
      name: 'Dune (Çöl Gezegeni - Özel Ciltli Edisyon)',
      author: 'Frank Herbert',
      brand: 'İthaki Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Bilimkurgu & Fantastik',
      price: 540,
      price_2: 450,
      cost_price: 260,
      stock_quantity: 50,
      image_url: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&w=800&q=80',
      description: 'Modern bilimkurgu edebiyatının zirvesi: Arrakis gezegeninde baharat, iktidar, ekoloji ve kehanetin destansı mücadelesi.',
      labels: ['featured_week', 'award_winning', 'bestseller', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: true,
        is_featured_weekly: true,
        translator: 'Dost Körpe',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '32. Baskı',
        page_count: '712',
        cover_type: 'Sert Kapak',
        dimensions: '14 x 21 cm',
        rating: '4.9',
        featured_quote: '«Korkmamalıyım. Korku akıl katilidir.»',
        awards: 'Hugo & Nebula En İyi Roman Ödülü'
      }
    },
    {
      barcode: '9789750807145',
      name: 'Beyoğlu Rapsodisi',
      author: 'Ahmet Ümit',
      brand: 'Yapı Kredi Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Polisiye, Gerilim & Gizem',
      price: 290,
      price_2: 0,
      cost_price: 135,
      stock_quantity: 70,
      image_url: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80',
      description: 'Beyoğlu’nun arka sokaklarında üç eski dost, ölümsüzlük tutkusu ve gizemli bir cinayet zinciri.',
      labels: ['new_release', 'editors_pick'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: '45. Baskı',
        page_count: '408',
        cover_type: 'Karton Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.7',
        featured_quote: '«Dostluk bazen en tehlikeli sırların saklandığı limandır.»',
        awards: ''
      }
    },
    {
      barcode: '9789750726439',
      name: 'Küçük Prens (Özel Suluboya İllüstrasyonlu)',
      author: 'Antoine de Saint-Exupéry',
      brand: 'Can Çocuk Yayınları',
      category: 'Çocuk & Gençlik',
      sub_category: '7-12 Yaş / Çocuk Edebiyatı',
      price: 140,
      price_2: 105,
      cost_price: 55,
      stock_quantity: 180,
      image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
      description: 'Yalnızca çocukların değil, içindeki çocuğu unutmayan tüm yetişkinlerin başucu masalı. Yazarın orijinal suluboya çizimleriyle.',
      labels: ['bestseller', 'deal'],
      is_bestseller: true,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Cemal Süreya & Tomris Uyar',
        language: 'Fransızca (Çeviri)',
        publication_year: '2024',
        edition: '110. Baskı',
        page_count: '112',
        cover_type: 'Sert Kapak',
        dimensions: '13.5 x 19.5 cm',
        rating: '5.0',
        featured_quote: '«İnsan ancak yüreğiyle baktığı zaman doğruyu görebilir. Gerçeğin mayası gözle görülmez.»',
        awards: 'Yüzyılın En Çok Çevrilen Edebi Eseri'
      }
    },
    {
      barcode: '9786254059018',
      name: 'Görme Biçimleri',
      author: 'John Berger',
      brand: 'Metis Yayınları',
      category: 'Sanat, Tasarım & Mimari',
      sub_category: 'Resim & Heykel',
      price: 220,
      price_2: 0,
      cost_price: 100,
      stock_quantity: 65,
      image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      description: 'Sanat eleştirisi ve görsel kültür alanında çığır açan, tablolara ve imgelere bakışımızı sonsuza dek değiştiren başyapıt.',
      labels: ['editors_pick', 'new_release'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Yurdanur Salman',
        language: 'İngilizce (Çeviri)',
        publication_year: '2024',
        edition: '36. Baskı',
        page_count: '168',
        cover_type: 'Karton Kapak',
        dimensions: '13 x 19.5 cm',
        rating: '4.9',
        featured_quote: '«Görme konuşmadan önce gelmiştir. Çocuk konuşmaya başlamadan önce bakıp tanımayı öğrenir.»',
        awards: 'BBC Kültür Serisi Başyapıtı'
      }
    },
    {
      barcode: '9786258094992',
      name: 'Babil’de Ölüm İstanbul’da Aşk (Koleksiyon Özel Baskı)',
      author: 'İskender Pala',
      brand: 'Kapı Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Tarihi Roman',
      price: 310,
      price_2: 0,
      cost_price: 145,
      stock_quantity: 40,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
      description: 'Divan şiirinin gizemli beyitleri arasında İstanbul’dan Babil’e uzanan tarihsel bir aşk ve sır romanı.',
      labels: ['new_release', 'editors_pick'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: '',
        language: 'Türkçe',
        publication_year: '2024',
        edition: '70. Baskı',
        page_count: '376',
        cover_type: 'Sert Kapak',
        dimensions: '13.5 x 21 cm',
        rating: '4.8',
        featured_quote: '«Aşk, bir şairin divanında saklı kalan en kadim sırdır.»',
        awards: 'Türkiye Yazarlar Birliği Roman Ödülü'
      }
    },
    {
      barcode: '9789750860010',
      name: 'Kayıp Zamanın İzinde: Swann’ların Tarafı (Yeni Edisyon)',
      author: 'Marcel Proust',
      brand: 'Yapı Kredi Yayınları',
      category: 'Edebiyat / Roman-Öykü',
      sub_category: 'Dünya & Türk klasikleri',
      price: 410,
      price_2: 0,
      cost_price: 195,
      stock_quantity: 25,
      image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
      description: '20. yüzyıl dünya edebiyatının en büyük anıtlarından biri; bellek, zaman ve sanat üzerine eşsiz bir yolculuk.',
      labels: ['coming_soon', 'award_winning', 'editors_pick'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Roza Hakmen',
        language: 'Fransızca (Çeviri)',
        publication_year: '2025',
        edition: 'Özel Numaralı Baskı',
        page_count: '540',
        cover_type: 'Deri Cilt',
        dimensions: '15 x 22 cm',
        rating: '4.9',
        featured_quote: '«Hakiki keşif yolculuğu yeni manzaralar aramak değil, yeni gözlerle bakabilmektir.»',
        awards: 'Prix Goncourt Edebiyat Ödülü'
      }
    },
    {
      barcode: '9789753429993',
      name: 'Yapay Zeka Çağı ve İnsanlığın Geleceği (Ön Sipariş)',
      author: 'Mustafa Suleyman',
      brand: 'Optimist Yayın Grubu',
      category: 'Araştırma, İnceleme, Bilim',
      sub_category: 'Bilim & Teknoloji',
      price: 385,
      price_2: 0,
      cost_price: 180,
      stock_quantity: 30,
      image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      description: 'DeepMind kurucu ortağından, önümüzdeki on yılda yapay zeka ve biyoteknolojinin insan uygarlığını nasıl dönüştüreceğinin analizi.',
      labels: ['coming_soon', 'new_release'],
      is_bestseller: false,
      sector_data: {
        is_weekly_pick: false,
        is_featured_weekly: false,
        translator: 'Kıvanç Güney',
        language: 'İngilizce (Çeviri)',
        publication_year: '2025',
        edition: '1. Baskı (Ön Sipariş)',
        page_count: '384',
        cover_type: 'Karton Kapak',
        dimensions: '15 x 23 cm',
        rating: '4.8',
        featured_quote: '«Yaklaşan dalga sadece bir teknoloji değil, insanlık tarihinin yeni bir evresidir.»',
        awards: 'Financial Times Yılın Kitabı Finalisti'
      }
    }
  ];

  const mainProductIds: Record<string, number> = {};
  for (const b of books) {
    const res = await pool.query(`
      INSERT INTO products (
        store_id, barcode, name, author, brand, category, sub_category,
        price, price_2, cost_price, tax_rate, unit, stock_quantity, min_stock_level,
        image_url, description, labels, sector_data, is_bestseller,
        currency, is_sellable, is_web_sale
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 'Adet', $11, 10,
        $12, $13, $14, $15, $16, 'TRY', true, true
      ) RETURNING id
    `, [
      mainStoreId, b.barcode, b.name, b.author, b.brand, b.category, b.sub_category,
      b.price, b.price_2 || 0, b.cost_price, b.stock_quantity,
      b.image_url, b.description, JSON.stringify(b.labels), JSON.stringify(b.sector_data), b.is_bestseller
    ]);
    mainProductIds[b.barcode] = res.rows[0].id;
  }

  // Also seed top 6 books into Branch Store 46 (Girne Şubesi)
  for (const b of books.slice(0, 6)) {
    await pool.query(`
      INSERT INTO products (
        store_id, barcode, name, author, brand, category, sub_category,
        price, price_2, cost_price, tax_rate, unit, stock_quantity, min_stock_level,
        image_url, description, labels, sector_data, is_bestseller,
        currency, is_sellable, is_web_sale
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 'Adet', 35, 5,
        $11, $12, $13, $14, $15, 'TRY', true, true
      )
    `, [
      branchStoreId, b.barcode, b.name, b.author, b.brand, b.category, b.sub_category,
      b.price, b.price_2 || 0, b.cost_price,
      b.image_url, b.description, JSON.stringify(b.labels), JSON.stringify(b.sector_data), b.is_bestseller
    ]);
  }

  console.log('4. Seeding Publishing Houses & Distributors (Companies)...');
  await pool.query('DELETE FROM companies WHERE store_id = $1', [mainStoreId]);
  await pool.query(`
    INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, contact_person)
    VALUES 
      ($1, 'Yapı Kredi Kültür Sanat Yayıncılık A.Ş.', 'Beyoğlu VD', '9370028491', 'İstiklal Cad. No: 161 Beyoğlu / İstanbul', '+90 212 252 4700', 'dagitim@ykykultur.com.tr', 'Cemil Bey'),
      ($1, 'Can Sanat Yayınları Yapım ve Dağıtım A.Ş.', 'Galatasaray VD', '2010049281', 'Hayriye Cad. No: 2 Galatasaray / İstanbul', '+90 212 252 5675', 'siparis@canyayinlari.com', 'Zeynep Hanım'),
      ($1, 'Türkiye İş Bankası Kültür Yayınları Ltd.', 'Boğaziçi Kurumlar VD', '4810294810', 'İstiklal Cad. Meşelik Sok. No: 2 Beyoğlu / İstanbul', '+90 212 243 4407', 'kurumsal@iskultur.com.tr', 'Hakan Bey'),
      ($1, 'Kıbrıs Penguen Kitap & Kültür Dağıtım Ltd.', 'Lefkoşa VD', '6619204912', 'Organize Sanayi Bölgesi 2. Cad. Lefkoşa / KKTC', '+90 392 227 8810', 'sevkiyat@kibriskitap.com', 'Serhat Bey')
  `, [mainStoreId]);

  console.log('5. Seeding Institutional Book Quotations (Teklifler)...');
  await pool.query('DELETE FROM quotations WHERE store_id = $1', [mainStoreId]);
  const q1 = await pool.query(`
    INSERT INTO quotations (
      store_id, customer_name, customer_title, tax_number, tax_office,
      total_amount, currency, status, notes
    ) VALUES (
      $1, 'Girne Amerikan Koleji Kütüphanesi', 'GAÜ Eğitim Kurumları A.Ş.', '4491029481', 'Girne VD',
      14250, 'TRY', 'approved', '2026 Bahar Dönemi Edebiyat ve Bilim Kulübü Kütüphane Kitap Seçkisi (%15 Kurumsal Eğitim İskontosu Uygulanmıştır).'
    ) RETURNING id
  `, [mainStoreId]);
  await pool.query(`
    INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price, unit_code, tax_rate)
    VALUES 
      ($1, $2, 'Kürk Mantolu Madonna', '9789753638029', 30, 110, 3300, 'Adet', 0),
      ($1, $3, '1984 - George Orwell', '9789750718533', 25, 185, 4625, 'Adet', 0),
      ($1, $4, 'Sapiens: İnsan Türünün Kısa Bir Tarihi', '9786050914443', 20, 316.25, 6325, 'Adet', 0)
  `, [q1.rows[0].id, mainProductIds['9789753638029'], mainProductIds['9789750718533'], mainProductIds['9786050914443']]);

  console.log('6. Seeding Bookstore POS & Web Sales...');
  await pool.query('DELETE FROM sales WHERE store_id = $1', [mainStoreId]);
  const s1 = await pool.query(`
    INSERT INTO sales (
      store_id, total_amount, currency, status, customer_name,
      payment_method, notes, source, created_at
    ) VALUES ($1, 1695, 'TRY', 'completed', 'Elif Soydan (Web Siparişi)', 'credit_card', 'Hediye paketi ve imzalı ayraç eklendi.', 'web', $2::timestamp + INTERVAL '13 hour')
    RETURNING id
  `, [mainStoreId, todayStr]);
  await pool.query(`
    INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
    VALUES ($1, 'credit_card', 1695, $2::timestamp + INTERVAL '13 hour')
  `, [s1.rows[0].id, todayStr]);
  await pool.query(`
    INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
    VALUES 
      ($1, $2, 'İnce Memed 1 - 4 (Özel Kutulu Tam Set)', '9789753638036', 1, 1180, 1180, 'TRY', 0),
      ($1, $3, 'Masumiyet Müzesi (Özel Ciltli Baskı)', '9789750826153', 1, 350, 350, 'TRY', 0),
      ($1, $4, 'Kürk Mantolu Madonna', '9789753638029', 1, 165, 165, 'TRY', 0)
  `, [s1.rows[0].id, mainProductIds['9789753638036'], mainProductIds['9789750826153'], mainProductIds['9789753638029']]);

  const s2 = await pool.query(`
    INSERT INTO sales (
      store_id, total_amount, currency, status, customer_name,
      payment_method, notes, source, created_at
    ) VALUES ($1, 895, 'TRY', 'completed', 'Mağaza Okur Satışı (Hızlı POS)', 'cash', 'Merkez kasa satışı', 'pos', $2::timestamp + INTERVAL '16 hour')
    RETURNING id
  `, [mainStoreId, yesterdayStr]);
  await pool.query(`
    INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
    VALUES ($1, 'cash', 895, $2::timestamp + INTERVAL '16 hour')
  `, [s2.rows[0].id, yesterdayStr]);
  await pool.query(`
    INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
    VALUES 
      ($1, $2, 'Dune (Çöl Gezegeni - Özel Ciltli Edisyon)', '9786053754794', 1, 450, 450, 'TRY', 0),
      ($1, $3, 'Suç ve Ceza (Ciltli)', '9786053609117', 1, 310, 310, 'TRY', 0),
      ($1, $4, 'Küçük Prens', '9789750726439', 1, 135, 135, 'TRY', 0)
  `, [s2.rows[0].id, mainProductIds['9786053754794'], mainProductIds['9786053609117'], mainProductIds['9789750726439']]);

  console.log('7. Seeding Procurements (Yayınevi Sipariş Talepleri)...');
  await pool.query('DELETE FROM procurements WHERE store_id = $1', [mainStoreId]);
  await pool.query(`
    INSERT INTO procurements (store_id, product_name, barcode, quantity, status)
    VALUES 
      ($1, 'Saatleri Ayarlama Enstitüsü - Ahmet Hamdi Tanpınar (Dergah Yay.)', '9789759955908', 50, 'pending'),
      ($1, 'Tutunamayanlar - Oğuz Atay (İletişim Yay.)', '9789754700114', 40, 'ordered')
  `, [mainStoreId]);

  console.log('✅ BookLP Demo Data Successfully Seeded!');
}

seedBookLpDemo()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('BookLP Seed Error:', e);
    process.exit(1);
  });

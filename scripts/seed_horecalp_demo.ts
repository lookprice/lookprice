import { pool } from '../models/db.js';
import bcrypt from 'bcryptjs';

async function seedHorecaDemo() {
  console.log('--- Starting horecaLP Demo Seeding ---');
  const client = await pool.connect();

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const in4Days = new Date(today);
    in4Days.setDate(in4Days.getDate() + 4);
    const in4DaysStr = in4Days.toISOString().split('T')[0];

    const in5Days = new Date(today);
    in5Days.setDate(in5Days.getDate() + 5);
    const in5DaysStr = in5Days.toISOString().split('T')[0];

    const storeId = 4;

    // 1. Hotel Rooms definition (12 rich rooms)
    const hotelRooms = [
      {
        id: "room-101",
        room_number: "101",
        room_type: "Standart Deniz Manzaralı",
        capacity: 2,
        max_adults: 2,
        max_children: 1,
        bed_info: "1 Çift Kişilik Yatak",
        status: "vacant",
        price_per_night: 3200,
        board_prices: {
          room_only: 2800,
          bed_breakfast: 3200,
          half_board: 4100,
          full_board: 4900,
          all_inclusive: 5800
        },
        non_refundable_discount: 15,
        amenities: ["WiFi", "Deniz Manzarası", "Balkon", "Klima", "Smart TV", "Minibar", "Fön Makinesi", "Emanet Kasası"],
        cover_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
        description: "Akdeniz manzaralı ferah balkon, lüks banyo ve modern iç dizayna sahip konforlu standart oda.",
        folio: { id: "folio-101", total_amount: 0, items: [] }
      },
      {
        id: "room-102",
        room_number: "102",
        room_type: "Deluxe Deniz Manzaralı Balkonlu",
        capacity: 2,
        max_adults: 2,
        max_children: 1,
        bed_info: "1 King Çift Kişilik Yatak",
        status: "occupied",
        price_per_night: 4200,
        board_prices: {
          room_only: 3700,
          bed_breakfast: 4200,
          half_board: 5200,
          full_board: 6100,
          all_inclusive: 7400
        },
        non_refundable_discount: 10,
        amenities: ["WiFi", "Deniz Manzarası", "Geniş Balkon", "Klima", "Nespresso Kahve Makinesi", "Smart TV", "Minibar", "Bornoz & Terlik"],
        cover_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
        description: "Kesintisiz Akdeniz panoraması, özel güneşlenme şezlonglu balkon ve premium konfor.",
        current_guest: {
          id: "guest-102",
          identity_no: "28492014892",
          first_name: "Dr. Selin",
          last_name: "Yılmaz",
          birth_date: "1988-06-14",
          age: 38,
          age_category: "adult",
          discount_rate: 0,
          phone: "+90 542 333 4455",
          email: "selin.yilmaz@medlife.com",
          check_in_date: yesterdayStr,
          check_out_date: in2Days(today),
          board_type: "BB",
          advance_payment: 4200,
          payment_method: "credit_card",
          notes: "Late check-out talep edildi (14:00), sessiz oda tercihi."
        },
        folio: {
          id: "folio-102",
          total_amount: 1850,
          items: [
            { id: "f-102-1", title: "A La Carte Akşam Yemeği Adisyonu (Masa 3 - Levrek & Şarap)", amount: 1450, date: yesterdayStr, category: "Masa 3" },
            { id: "f-102-2", title: "Oda Servisi & Minibar Tüketimi (2x Bira, Çerez, Su)", amount: 400, date: todayStr, category: "Oda Servisi" }
          ]
        }
      },
      {
        id: "room-103",
        room_number: "103",
        room_type: "Standart Bahçe Manzaralı",
        capacity: 2,
        max_adults: 2,
        max_children: 0,
        bed_info: "2 Tek Kişilik Yatak (Twin)",
        status: "occupied",
        price_per_night: 2800,
        board_prices: {
          room_only: 2400,
          bed_breakfast: 2800,
          half_board: 3600
        },
        amenities: ["WiFi", "Bahçe Manzarası", "Klima", "LCD TV", "Minibar"],
        cover_image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80",
        description: "Limon ve zeytin ağaçlarına bakan sakin, huzurlu ikiz yataklı bahçe odası.",
        current_guest: {
          id: "guest-103",
          identity_no: "19582049182",
          first_name: "Hakan",
          last_name: "Demir",
          birth_date: "1992-04-18",
          age: 34,
          age_category: "adult",
          discount_rate: 0,
          phone: "+90 533 444 8899",
          email: "hakan.demir@techcorp.com",
          check_in_date: todayStr,
          check_out_date: tomorrowStr,
          board_type: "HB",
          advance_payment: 2800,
          payment_method: "cash",
          notes: "Girişte yarım pansiyon akşam yemeği saati bildirildi."
        },
        folio: {
          id: "folio-103",
          total_amount: 920,
          items: [
            { id: "f-103-1", title: "Havuz Bar Adisyonu (2x Aperol Spritz + Çıtır Kalamar)", amount: 920, date: todayStr, category: "Havuz Bar" }
          ]
        }
      },
      {
        id: "room-104",
        room_number: "104",
        room_type: "Ekonomik Çift Kişilik",
        capacity: 2,
        max_adults: 2,
        max_children: 0,
        bed_info: "1 Çift Kişilik Yatak",
        status: "maintenance",
        price_per_night: 2200,
        amenities: ["WiFi", "Klima", "LCD TV"],
        cover_image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80",
        notes: "Klima kompresörü değişimi ve boya rötuşu yapılmaktadır. Yarın saat 12:00'de servise açılacak."
      },
      {
        id: "room-105",
        room_number: "STAFF-1",
        room_type: "Personel & Nöbetçi Oda",
        capacity: 2,
        bed_info: "Ranza Yatak",
        status: "staff",
        notes: "Gece müdürü ve nöbetçi baş aşçı konaklama tahsisi."
      },
      {
        id: "room-201",
        room_number: "201",
        room_type: "Family Duplex Süit (Çift Katlı)",
        capacity: 4,
        max_adults: 3,
        max_children: 2,
        bed_info: "2 Çift Kişilik Yatak + 1 Açılır Kanepe",
        status: "occupied",
        price_per_night: 6500,
        board_prices: {
          room_only: 5800,
          bed_breakfast: 6500,
          half_board: 8200,
          full_board: 9800,
          all_inclusive: 11800
        },
        non_refundable_discount: 15,
        amenities: ["WiFi", "Çift Kat Dublex", "2 Banyo", "Balkon", "Deniz Manzarası", "Klima", "2x Smart TV", "Minibar", "Bebek Yatağı"],
        cover_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
        description: "Geniş aileler için iki katlı, çift banyolu, bağımsız ebeveyn yatak odalı lüks süit.",
        current_guest: {
          id: "guest-201",
          identity_no: "48201958291",
          first_name: "Mustafa",
          last_name: "Çelik",
          birth_date: "1982-08-22",
          age: 44,
          age_category: "adult",
          discount_rate: 0,
          phone: "+90 532 555 7788",
          email: "m.celik@celikholding.com.tr",
          check_in_date: todayStr,
          check_out_date: in4DaysStr,
          board_type: "FB",
          advance_payment: 13000,
          payment_method: "credit_card",
          notes: "2 çocuk konaklıyor (Emir 8 yaş, Defne 4 yaş - bebek yatağı temin edildi)."
        },
        additional_guests: [
          {
            identity_no: "48201958292",
            first_name: "Emine",
            last_name: "Çelik",
            birth_date: "1985-03-12",
            age: 41,
            age_category: "adult",
            discount_rate: 0
          },
          {
            identity_no: "48201958293",
            first_name: "Emir",
            last_name: "Çelik",
            birth_date: "2018-09-10",
            age: 8,
            age_category: "child",
            discount_rate: 50
          },
          {
            identity_no: "48201958294",
            first_name: "Defne",
            last_name: "Çelik",
            birth_date: "2022-05-15",
            age: 4,
            age_category: "infant",
            discount_rate: 100
          }
        ],
        folio: {
          id: "folio-201",
          total_amount: 3450,
          items: [
            { id: "f-201-1", title: "A La Carte Restoran (Masa 1 - Antrikot & Çocuk Pizzası)", amount: 2850, date: todayStr, category: "Masa 1" },
            { id: "f-201-2", title: "Dondurma & Milkshake İkramı (Havuz Bar)", amount: 600, date: todayStr, category: "Havuz Bar" }
          ]
        }
      },
      {
        id: "room-202",
        room_number: "202",
        room_type: "Executive King Süit (Jakuzili)",
        capacity: 3,
        max_adults: 2,
        max_children: 1,
        bed_info: "1 King Yatak + 1 Tek Kişilik",
        status: "reserved",
        price_per_night: 5800,
        board_prices: {
          room_only: 5100,
          bed_breakfast: 5800,
          half_board: 7100,
          full_board: 8400,
          all_inclusive: 10200
        },
        non_refundable_discount: 10,
        amenities: ["WiFi", "Özel Jakuzi", "Panoramik Deniz", "Balkon", "Klima", "Smart TV", "Minibar", "Emanet Kasası"],
        cover_image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80",
        description: "Balkonda özel jakuzi, kesintisiz gün batımı manzarası ve VIP buklet ürünleri.",
        reservations: [
          {
            id: "res-202-1",
            identity_no: "GB74892018",
            first_name: "Alexander",
            last_name: "Smith",
            phone: "+44 7911 123456",
            check_in_date: tomorrowStr,
            check_out_date: in4DaysStr,
            board_type: "BB",
            total_price: 17400,
            notes: "Havaalanı transferi ayarlandı (Ercan Havalimanı 15:30 karşılama)."
          }
        ]
      },
      {
        id: "room-203",
        room_number: "203",
        room_type: "Deluxe Panoramik Süit",
        capacity: 2,
        max_adults: 2,
        bed_info: "1 King Çift Kişilik",
        status: "vacant",
        price_per_night: 4900,
        board_prices: {
          room_only: 4300,
          bed_breakfast: 4900,
          half_board: 6100,
          all_inclusive: 8200
        },
        amenities: ["WiFi", "Panoramik Cam Cephe", "Deniz Manzarası", "Balkon", "Klima", "Smart TV", "Minibar"],
        cover_image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80",
        description: "Uçsuz bucaksız deniz manzarası ve boydan boya cam cephe ile aydınlık süit.",
        folio: { id: "folio-203", total_amount: 0, items: [] }
      },
      {
        id: "room-204",
        room_number: "204",
        room_type: "Family Bahçe Süit",
        capacity: 4,
        max_adults: 3,
        max_children: 2,
        bed_info: "1 Çift Kişilik + 2 Tek Kişilik",
        status: "vacant",
        price_per_night: 5400,
        board_prices: {
          room_only: 4800,
          bed_breakfast: 5400,
          half_board: 6800,
          full_board: 8200
        },
        amenities: ["WiFi", "Bahçe Terası", "Çift Yatak Odası", "Klima", "Smart TV", "Minibar"],
        cover_image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80",
        description: "Doğrudan bahçeye açılan özel veranda, çocuklu aileler için ferah ve güvenli.",
        folio: { id: "folio-204", total_amount: 0, items: [] }
      },
      {
        id: "room-301",
        room_number: "301",
        room_type: "Penthouse VIP Presidential Süit",
        capacity: 5,
        max_adults: 4,
        max_children: 2,
        bed_info: "2 King Yatak + Teras Jakuzi + Şömine",
        status: "occupied",
        price_per_night: 12500,
        board_prices: {
          room_only: 11000,
          bed_breakfast: 12500,
          half_board: 14500,
          full_board: 16500,
          ultra_all_inclusive: 19500
        },
        non_refundable_discount: 10,
        amenities: ["WiFi", "Teras Jakuzi", "Şömine", "Özel Butler Hizmeti", "Panoramik Deniz", "Sauna", "Smart TV 85 inch", "Özel Bar"],
        cover_image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80",
        description: "En üst katta 180 m² yaşam alanı, teras jakuzi, özel sauna ve butler hizmeti.",
        current_guest: {
          id: "guest-301",
          identity_no: "GB99018471",
          first_name: "Lord Jonathan",
          last_name: "Vance",
          birth_date: "1975-10-04",
          age: 51,
          age_category: "adult",
          discount_rate: 0,
          phone: "+44 7700 900123",
          email: "jonathan.vance@vanceholdings.co.uk",
          check_in_date: yesterdayStr,
          check_out_date: in3DaysStr,
          board_type: "UAI",
          advance_payment: 37500,
          payment_method: "bank_transfer",
          notes: "VIP Konuk - Özel şampanya ve meyve sepeti karşılaması yapıldı. Helikopter transferi sağlandı."
        },
        folio: {
          id: "folio-301",
          total_amount: 7600,
          items: [
            { id: "f-301-1", title: "Özel Şarap Mahzeni Seçkisi (Kavaklıdere Prestige)", amount: 3200, date: yesterdayStr, category: "Şarap Mahzeni" },
            { id: "f-301-2", title: "VIP Spa & Çift Masaj Terapisi", amount: 4400, date: todayStr, category: "Spa & Wellness" }
          ]
        }
      },
      {
        id: "room-302",
        room_number: "302",
        room_type: "Honeymoon Balayı Süiti (Özel Teraslı)",
        capacity: 2,
        max_adults: 2,
        bed_info: "1 Özel Tasarım King Yatak + Teras Şezlong",
        status: "vacant",
        price_per_night: 7200,
        board_prices: {
          bed_breakfast: 7200,
          half_board: 8600,
          all_inclusive: 10500
        },
        amenities: ["WiFi", "Balayı Konsepti", "Teras Jakuzi", "Gül Yaprağı Karşılama", "Şampanya", "Deniz Manzarası", "Oda Kahvaltısı"],
        cover_image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1000&q=80",
        description: "Yeni evli çiftler için tasarlanmış özel balayı konsepti, jakuzili teras ve odaya servis şampanyalı kahvaltı.",
        folio: { id: "folio-302", total_amount: 0, items: [] }
      },
      {
        id: "room-401",
        room_number: "VILLA-1",
        room_type: "Bahçe Müstakil Bungalow Villa",
        capacity: 4,
        max_adults: 4,
        max_children: 2,
        bed_info: "1 King Yatak + 2 Tek Kişilik Yatak",
        status: "vacant",
        price_per_night: 8500,
        board_prices: {
          bed_breakfast: 8500,
          half_board: 10200,
          all_inclusive: 12800
        },
        amenities: ["WiFi", "Özel Bahçe", "Havuz Erişimi", "Müstakil Giriş", "Klima", "Barbekü Alanı", "2x Banyo", "Smart TV"],
        cover_image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80",
        description: "Palmiye ağaçları arasında müstakil bahçeli ve ortak havuza doğrudan erişimli lüks villa konsepti.",
        folio: { id: "folio-401", total_amount: 0, items: [] }
      }
    ];

    // 2. Update Store 4 branding and columns
    console.log('Updating Store 4 settings and branding...');
    const brandingData = {
      store_name: "Grand LookPrice Hotel & Resort (Demo)",
      name: "Grand LookPrice Hotel & Resort (Demo)",
      slug: "horecalp-demo",
      store_type: "cafe_restaurant",
      sub_sector: "horeca",
      is_demo: true,
      hotel_module_enabled: true,
      hotel_license_enabled: true,
      phone: "+90 (392) 815 1000",
      whatsapp_number: "+90 (548) 815 1000",
      email: "demo@horecalp.com",
      address: "Alsancak Sahil Kordonu No: 42, Girne / KKTC",
      currency: "TRY",
      currency_rates: { TRY: 1, USD: 38.5, EUR: 41.2, GBP: 48.6 },
      page_layout_settings: {
        sector: "cafe_restaurant",
        table_count: 16,
        allow_reservation: true,
        show_hero_slider: true
      },
      digital_menu_settings: {
        theme: "emerald",
        enabled: true,
        show_prices: true,
        allow_ordering: true,
        table_ordering_enabled: true
      },
      hotel_rooms: hotelRooms
    };

    await client.query(`
      UPDATE stores
      SET name = 'Grand LookPrice Hotel & Resort (Demo)',
          slug = 'horecalp-demo',
          store_code = 'LP-HORECA00',
          store_type = 'cafe_restaurant',
          sub_sector = 'horeca',
          hotel_module_enabled = true,
          status = 'active',
          is_approved = true,
          branding = $1
      WHERE id = $2
    `, [JSON.stringify(brandingData), storeId]);

    // Ensure demo user password and association
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('horecalp1234', salt);
    await client.query(`
      UPDATE users
      SET password = $1, store_id = $2, role = 'admin', is_active = true
      WHERE email = 'demo@horecalp.com'
    `, [hash, storeId]);

    // 3. Seed Hotel Reservations in hotel_reservations table
    console.log('Seeding hotel_reservations...');
    await client.query('DELETE FROM hotel_reservations WHERE store_id = $1', [storeId]);

    const reservations = [
      {
        code: "HLP-9021",
        room_id: "room-101",
        room_number: "101",
        room_type: "Standart Deniz Manzaralı",
        guest_name: "Kerem Aksoy",
        first_name: "Kerem",
        last_name: "Aksoy",
        identity_no: "39201948271",
        phone: "+90 533 821 4455",
        email: "kerem.aksoy@outlook.com",
        check_in: todayStr,
        check_out: in3DaysStr,
        nights: 3,
        board_type: "HB",
        board_name: "Yarım Pansiyon (HB)",
        adults: 2,
        children: 0,
        total: 12300,
        status: "pending_action",
        special_requests: "Deniz gören yüksek kat tercihi ve evlilik yıldönümü çiçeği ricası."
      },
      {
        code: "HLP-9022",
        room_id: "room-202",
        room_number: "202",
        room_type: "Executive King Süit (Jakuzili)",
        guest_name: "Alexander Smith",
        first_name: "Alexander",
        last_name: "Smith",
        identity_no: "GB74892018",
        phone: "+44 7911 123456",
        email: "alex.smith@londonconsulting.co.uk",
        check_in: tomorrowStr,
        check_out: in4DaysStr,
        nights: 3,
        board_type: "BB",
        board_name: "Oda & Kahvaltı (BB)",
        adults: 2,
        children: 0,
        total: 17400,
        status: "confirmed",
        special_requests: "Ercan Havalimanı VIP karşılama transferi onaylandı."
      },
      {
        code: "HLP-8991",
        room_id: "room-102",
        room_number: "102",
        room_type: "Deluxe Deniz Manzaralı Balkonlu",
        guest_name: "Dr. Selin Yılmaz",
        first_name: "Selin",
        last_name: "Yılmaz",
        identity_no: "28492014892",
        phone: "+90 542 333 4455",
        email: "selin.yilmaz@medlife.com",
        check_in: yesterdayStr,
        check_out: dayAfterTomorrowStr,
        nights: 3,
        board_type: "BB",
        board_name: "Oda & Kahvaltı (BB)",
        adults: 1,
        children: 0,
        total: 12600,
        status: "checked_in",
        special_requests: "Late check-out 14:00 onaylandı."
      },
      {
        code: "HLP-8995",
        room_id: "room-201",
        room_number: "201",
        room_type: "Family Duplex Süit (Çift Katlı)",
        guest_name: "Mustafa Çelik",
        first_name: "Mustafa",
        last_name: "Çelik",
        identity_no: "48201958291",
        phone: "+90 532 555 7788",
        email: "m.celik@celikholding.com.tr",
        check_in: todayStr,
        check_out: in4DaysStr,
        nights: 4,
        board_type: "FB",
        board_name: "Tam Pansiyon (FB)",
        adults: 2,
        children: 2,
        total: 39200,
        status: "checked_in",
        special_requests: "Bebek yatağı ve mama sandalyesi odaya bırakıldı."
      },
      {
        code: "HLP-8980",
        room_id: "room-301",
        room_number: "301",
        room_type: "Penthouse VIP Presidential Süit",
        guest_name: "Lord Jonathan Vance",
        first_name: "Jonathan",
        last_name: "Vance",
        identity_no: "GB99018471",
        phone: "+44 7700 900123",
        email: "jonathan.vance@vanceholdings.co.uk",
        check_in: yesterdayStr,
        check_out: in3DaysStr,
        nights: 4,
        board_type: "UAI",
        board_name: "Ultra Her Şey Dahil (UAI)",
        adults: 2,
        children: 0,
        total: 78000,
        status: "checked_in",
        special_requests: "Özel helikopter pisti transferi ve 24 saat butler tahsis edildi."
      },
      {
        code: "HLP-8910",
        room_id: "room-101",
        room_number: "101",
        room_type: "Standart Deniz Manzaralı",
        guest_name: "Burak Güner",
        first_name: "Burak",
        last_name: "Güner",
        identity_no: "10294820192",
        phone: "+90 530 111 2233",
        email: "burak.guner@gmail.com",
        check_in: new Date(Date.now() - 5*86400000).toISOString().split('T')[0],
        check_out: yesterdayStr,
        nights: 4,
        board_type: "BB",
        board_name: "Oda & Kahvaltı (BB)",
        adults: 2,
        children: 0,
        total: 12800,
        status: "checked_out",
        special_requests: "Çıkışta memnuniyet anketi doldurdu (5 yıldız)."
      }
    ];

    for (const res of reservations) {
      await client.query(`
        INSERT INTO hotel_reservations (
          store_id, reservation_code, room_id, room_number, room_type,
          guest_name, guest_first_name, guest_last_name, guest_identity_no,
          guest_phone, guest_email, check_in_date, check_out_date, nights,
          board_type, board_name, adults_count, children_count, total_amount,
          status, special_requests
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        storeId, res.code, res.room_id, res.room_number, res.room_type,
        res.guest_name, res.first_name, res.last_name, res.identity_no,
        res.phone, res.email, res.check_in, res.check_out, res.nights,
        res.board_type, res.board_name, res.adults, res.children, res.total,
        res.status, res.special_requests
      ]);
    }

    // 4. Seed Restaurant Tables (16 tables)
    console.log('Seeding restaurant_tables...');
    await client.query('DELETE FROM restaurant_tables WHERE store_id = $1', [storeId]);

    const tableStatuses: Record<string, string> = {
      "1": "occupied",
      "2": "empty",
      "3": "occupied",
      "4": "empty",
      "5": "occupied",
      "6": "empty",
      "7": "reserved",
      "8": "empty"
    };

    const tableIds: Record<string, number> = {};
    for (let i = 1; i <= 16; i++) {
      const numStr = String(i);
      const st = tableStatuses[numStr] || "empty";
      const insertRes = await client.query(`
        INSERT INTO restaurant_tables (store_id, table_number, status)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [storeId, numStr, st]);
      tableIds[numStr] = insertRes.rows[0].id;
    }

    // 5. Seed Gourmet Restaurant Products & Menu Items
    console.log('Seeding restaurant products...');
    await client.query('DELETE FROM products WHERE store_id = $1', [storeId]);

    const menuItems = [
      // Kahvaltılar
      {
        barcode: "HRC-KAH-01",
        name: "Serpme Ege Köy Kahvaltısı (2 Kişilik)",
        category: "Kahvaltı",
        sub_category: "Serpme",
        price: 950,
        cost_price: 380,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 120,
        image_url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
        description: "Ezine peyniri, Bergama tulumu, Datça zeytinleri, ev reçelleri, sahanda sucuklu köy yumurtası, pişi ve sınırsız çay.",
        allergens: "Süt Ürünü, Yumurta, Gluten",
        calories: 850,
        prep_time_min: 15,
        portion_size: "2 Kişilik"
      },
      {
        barcode: "HRC-KAH-02",
        name: "Avokadolu Poşe Yumurta & Ekşi Mayalı Ekmek",
        category: "Kahvaltı",
        sub_category: "Tabak",
        price: 360,
        cost_price: 130,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 80,
        image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
        description: "Ekşi maya ekmek üzeri ezilmiş taze avokado, organik poşe yumurtalar, çörek otu ve frenk soğanı.",
        allergens: "Yumurta, Gluten",
        calories: 420,
        prep_time_min: 10,
        portion_size: "1 Porsiyon"
      },
      {
        barcode: "HRC-KAH-03",
        name: "Fransız Kruvasan & Taze Reçel Tabağı",
        category: "Kahvaltı",
        sub_category: "Pastane",
        price: 240,
        cost_price: 80,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 100,
        image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        description: "Hakiki tereyağlı çıtır kruvasan, çilek reçeli, Nutella ve süzme bal ile.",
        allergens: "Gluten, Süt Ürünü",
        calories: 380,
        prep_time_min: 5,
        portion_size: "2 Adet"
      },

      // Başlangıçlar & Mezeler
      {
        barcode: "HRC-BAS-01",
        name: "Çıtır Kalamar Tava (Ev Yapımı Tarator Sos)",
        category: "Başlangıçlar",
        sub_category: "Deniz Mahsulü",
        price: 490,
        cost_price: 190,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 90,
        image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
        description: "Ege usulü taze çıtır kalamar halkaları, cevizli sarımsaklı tarator sos ve taze limon dilimleri.",
        allergens: "Kabuklu/Yumuşakça, Gluten, Ceviz",
        calories: 360,
        prep_time_min: 12,
        portion_size: "220g"
      },
      {
        barcode: "HRC-BAS-02",
        name: "Karides Güveç (Sarımsak & Tereyağlı)",
        category: "Başlangıçlar",
        sub_category: "Sıcak Başlangıç",
        price: 540,
        cost_price: 210,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 75,
        image_url: "https://images.unsplash.com/photo-1559742811-822863646698?auto=format&fit=crop&w=800&q=80",
        description: "Toprak güveçte cızırdayan taze karidesler, köy tereyağı, sarımsak, pul biber ve kızarmış ekmek.",
        allergens: "Kabuklu Deniz Mahsulü, Süt Ürünü",
        calories: 410,
        prep_time_min: 15,
        portion_size: "200g"
      },
      {
        barcode: "HRC-BAS-03",
        name: "Humus & Sıcak Kayseri Pastırması",
        category: "Başlangıçlar",
        sub_category: "Meze",
        price: 340,
        cost_price: 120,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 110,
        image_url: "https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=800&q=80",
        description: "İpek kıvamında ılık Antakya humusu, tereyağında kavrulmuş çemenli pastırma ve çam fıstığı.",
        allergens: "Susam (Tahin), Süt Ürünü",
        calories: 390,
        prep_time_min: 8,
        portion_size: "250g"
      },
      {
        barcode: "HRC-BAS-04",
        name: "İtalyan Burrata Peyniri & Fesleğen Pesto",
        category: "Başlangıçlar",
        sub_category: "Salata",
        price: 450,
        cost_price: 180,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 60,
        image_url: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80",
        description: "150g taze manda burrata, renkli cherry domatesler, taze fesleğen pesto sos ve balzamik glaze.",
        allergens: "Süt Ürünü, Çam Fıstığı",
        calories: 340,
        prep_time_min: 6,
        portion_size: "150g Burrata"
      },

      // Ana Yemekler & Izgaralar
      {
        barcode: "HRC-ANA-01",
        name: "Dry Aged Dana Antrikot (300g)",
        category: "Ana Yemekler",
        sub_category: "Kırmızı Et",
        price: 980,
        cost_price: 420,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 45,
        image_url: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80",
        description: "28 gün kuru dinlendirilmiş dana antrikot, trüflü patates püresi, ızgara kuşkonmaz ve demi-glace sos.",
        allergens: "Süt Ürünü",
        calories: 780,
        prep_time_min: 20,
        portion_size: "300g"
      },
      {
        barcode: "HRC-ANA-02",
        name: "Kuzu Pirzola Izgara (Kekikli & Biberiyeli)",
        category: "Ana Yemekler",
        sub_category: "Kırmızı Et",
        price: 890,
        cost_price: 390,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 50,
        image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        description: "Kıbrıs dağ kekiği ile marine edilmiş 4 kalem kuzu pirzola, fırın patates ve közlenmiş sebzeler.",
        allergens: "",
        calories: 690,
        prep_time_min: 18,
        portion_size: "4 Kalem (320g)"
      },
      {
        barcode: "HRC-ANA-03",
        name: "Izgara Ege Levreği Fileto",
        category: "Ana Yemekler",
        sub_category: "Balık & Deniz",
        price: 760,
        cost_price: 310,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 40,
        image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
        description: "Izgara taze deniz levreği filetosu, zeytinyağlı limon sos, baby patates ve cibez otu sote.",
        allergens: "Balık",
        calories: 450,
        prep_time_min: 16,
        portion_size: "280g"
      },
      {
        barcode: "HRC-ANA-04",
        name: "Fırında Somon Izgara (Kapari & Dereotlu)",
        category: "Ana Yemekler",
        sub_category: "Balık & Deniz",
        price: 820,
        cost_price: 350,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 35,
        image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
        description: "Norveç somon filetosu, kremsi kapari sos, fırınlanmış brokoli ve yabani pirinç pilavı.",
        allergens: "Balık, Süt Ürünü",
        calories: 580,
        prep_time_min: 18,
        portion_size: "250g"
      },

      // Pizza & Makarnalar
      {
        barcode: "HRC-PIZ-01",
        name: "Pizza Margherita Napolitana",
        category: "Pizza & Makarna",
        sub_category: "Taş Fırın Pizza",
        price: 440,
        cost_price: 140,
        tax_rate: 10,
        unit: "Adet",
        stock_quantity: 150,
        image_url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80",
        description: "San Marzano domates sosu, manda mozzarella, taze fesleğen ve sızma zeytinyağı ile taş fırında.",
        allergens: "Gluten, Süt Ürünü",
        calories: 680,
        prep_time_min: 12,
        portion_size: "32cm"
      },
      {
        barcode: "HRC-PIZ-02",
        name: "Pizza Quattro Formaggi (4 Peynirli)",
        category: "Pizza & Makarna",
        sub_category: "Taş Fırın Pizza",
        price: 520,
        cost_price: 190,
        tax_rate: 10,
        unit: "Adet",
        stock_quantity: 100,
        image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        description: "Mozzarella, gorgonzola, parmesan ve fontina peynirleri, ceviz parçacıkları ve bal dokunuşu.",
        allergens: "Gluten, Süt Ürünü, Ceviz",
        calories: 820,
        prep_time_min: 14,
        portion_size: "32cm"
      },
      {
        barcode: "HRC-MAK-01",
        name: "Trüflü Yabani Mantarlı Fettuccine",
        category: "Pizza & Makarna",
        sub_category: "Ev Yapımı Makarna",
        price: 560,
        cost_price: 200,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 80,
        image_url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281781?auto=format&fit=crop&w=800&q=80",
        description: "Taze el açması fettuccine, porcini mantarları, trüf kreması, taze kekik ve Grana Padano.",
        allergens: "Gluten, Yumurta, Süt Ürünü",
        calories: 620,
        prep_time_min: 14,
        portion_size: "300g"
      },

      // Tatlılar
      {
        barcode: "HRC-TAT-01",
        name: "San Sebastian Cheesecake (Akışkan Çikolatalı)",
        category: "Tatlılar",
        sub_category: "Cheesecake",
        price: 290,
        cost_price: 90,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 120,
        image_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        description: "Fırın yanığı üst kabuk, kremsi akışkan iç doku ve sıcak Belçika sütlü çikolatası.",
        allergens: "Süt Ürünü, Yumurta",
        calories: 520,
        prep_time_min: 5,
        portion_size: "1 Dilim (180g)"
      },
      {
        barcode: "HRC-TAT-02",
        name: "Antep Fıstıklı Çıtır Katmer & Maraş Dondurması",
        category: "Tatlılar",
        sub_category: "Geleneksel Tatlı",
        price: 340,
        cost_price: 130,
        tax_rate: 10,
        unit: "Porsiyon",
        stock_quantity: 90,
        image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
        description: "İncecik yufkada bol Antep boz fıstığı ve manda kaymağı, kesme Maraş dondurması ile sıcak servis.",
        allergens: "Fıstık, Gluten, Süt Ürünü",
        calories: 580,
        prep_time_min: 12,
        portion_size: "1 Porsiyon"
      },

      // Kokteyller & İçecekler
      {
        barcode: "HRC-KOK-01",
        name: "Signature Mojito (Küba Usulü)",
        category: "Kokteyller & İçecekler",
        sub_category: "Kokteyl",
        price: 380,
        cost_price: 110,
        tax_rate: 20,
        unit: "Kadeh",
        stock_quantity: 200,
        image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
        description: "Havana Club rom, taze nane yaprakları, misket limonu, esmer şeker ve soda.",
        allergens: "Alkol İçerir",
        calories: 180,
        prep_time_min: 5,
        portion_size: "350ml"
      },
      {
        barcode: "HRC-KOK-02",
        name: "Aperol Spritz (Venedik Klasiği)",
        category: "Kokteyller & İçecekler",
        sub_category: "Kokteyl",
        price: 420,
        cost_price: 130,
        tax_rate: 20,
        unit: "Kadeh",
        stock_quantity: 180,
        image_url: "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80",
        description: "Aperol, Prosecco, soda ve taze portakal dilimi ile şık kadehte bol buzlu.",
        allergens: "Alkol İçerir, Sülfit",
        calories: 160,
        prep_time_min: 4,
        portion_size: "300ml"
      },
      {
        barcode: "HRC-ICE-01",
        name: "Ev Yapımı Çilekli Naneli Limonata",
        category: "Kokteyller & İçecekler",
        sub_category: "Alkolsüz",
        price: 160,
        cost_price: 40,
        tax_rate: 10,
        unit: "Bardak",
        stock_quantity: 250,
        image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        description: "Kıbrıs taze limonları, çilek püresi ve bahçe nanesiyle her sabah taze sıkılır.",
        allergens: "",
        calories: 110,
        prep_time_min: 3,
        portion_size: "400ml"
      },
      {
        barcode: "HRC-ICE-02",
        name: "Double Espresso (İtalyan Kavrum)",
        category: "Kokteyller & İçecekler",
        sub_category: "Kahve",
        price: 110,
        cost_price: 25,
        tax_rate: 10,
        unit: "Fincan",
        stock_quantity: 300,
        image_url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80",
        description: "%100 Arabica çekirdeklerinden yoğun kremalı çift shot İtalyan espresso.",
        allergens: "Kafein",
        calories: 5,
        prep_time_min: 2,
        portion_size: "60ml"
      },

      // Şaraplar
      {
        barcode: "HRC-SAR-01",
        name: "Kavaklıdere Prestige Öküzgözü (75cl)",
        category: "Şaraplar & Mahzen",
        sub_category: "Kırmızı Şarap",
        price: 1850,
        cost_price: 750,
        tax_rate: 20,
        unit: "Şişe",
        stock_quantity: 40,
        image_url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80",
        description: "Elazığ bağlarından, 10 ay Fransız meşe fıçılarda dinlendirilmiş gövdeli kırmızı şarap.",
        allergens: "Alkol İçerir, Sülfit",
        calories: 620,
        prep_time_min: 3,
        portion_size: "750ml"
      },
      {
        barcode: "HRC-SAR-02",
        name: "Sevilen Sauvignon Blanc (75cl)",
        category: "Şaraplar & Mahzen",
        sub_category: "Beyaz Şarap",
        price: 1450,
        cost_price: 580,
        tax_rate: 20,
        unit: "Şişe",
        stock_quantity: 50,
        image_url: "https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=800&q=80",
        description: "Ferahlatıcı narenciye ve tropikal meyve aromalarına sahip dengeli beyaz şarap.",
        allergens: "Alkol İçerir, Sülfit",
        calories: 580,
        prep_time_min: 3,
        portion_size: "750ml"
      }
    ];

    const insertedProductIds: Record<string, number> = {};
    for (const item of menuItems) {
      const allergenArray = item.allergens ? item.allergens.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const res = await client.query(`
        INSERT INTO products (
          store_id, barcode, name, category, sub_category, price, cost_price,
          tax_rate, unit, stock_quantity, min_stock_level, image_url,
          description, allergens, calories, prep_time_min, portion_size,
          currency, is_sellable, is_web_sale
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 10, $11, $12, $13, $14, $15, $16, 'TRY', true, true
        ) RETURNING id
      `, [
        storeId, item.barcode, item.name, item.category, item.sub_category,
        item.price, item.cost_price, item.tax_rate, item.unit, item.stock_quantity,
        item.image_url, item.description, JSON.stringify(allergenArray), item.calories,
        item.prep_time_min, item.portion_size
      ]);
      insertedProductIds[item.barcode] = res.rows[0].id;
    }

    // 6. Seed Open Adisyons & Completed Sales
    console.log('Seeding sales, sale_items and sale_payments...');
    await client.query('DELETE FROM sales WHERE store_id = $1', [storeId]);

    // A. Open Table 1 Adisyon (2 Kişilik Akşam Yemeği)
    const sale1Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name,
        restaurant_table_id, payment_method, notes, source
      ) VALUES ($1, 2850, 'TRY', 'pending', 'Masa 1', $2, 'cash', 'Oda 201 hesabına aktarılacak, bebek sandalyesi istendi.', 'pos')
      RETURNING id
    `, [storeId, tableIds["1"]]);
    const sale1Id = sale1Res.rows[0].id;

    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
      VALUES 
        ($1, $2, 'Dry Aged Dana Antrikot (300g)', 'HRC-ANA-01', 2, 980, 1960, 'TRY', 10),
        ($1, $3, 'Akdeniz Burrata Peyniri', 'HRC-BAS-04', 1, 450, 450, 'TRY', 10),
        ($1, $4, 'Ev Yapımı Çilekli Naneli Limonata', 'HRC-ICE-01', 2, 160, 320, 'TRY', 10),
        ($1, $5, 'Double Espresso', 'HRC-ICE-02', 1, 120, 120, 'TRY', 10)
    `, [sale1Id, insertedProductIds["HRC-ANA-01"], insertedProductIds["HRC-BAS-04"], insertedProductIds["HRC-ICE-01"], insertedProductIds["HRC-ICE-02"]]);

    // B. Open Table 3 Adisyon (Pizza & Kokteyl Keyfi)
    const sale3Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name,
        restaurant_table_id, payment_method, notes, source
      ) VALUES ($1, 1420, 'TRY', 'pending', 'Masa 3', $2, 'credit_card', 'Pizzalar acısız istendi.', 'pos')
      RETURNING id
    `, [storeId, tableIds["3"]]);
    const sale3Id = sale3Res.rows[0].id;

    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
      VALUES 
        ($1, $2, 'Pizza Margherita Napolitana', 'HRC-PIZ-01', 1, 440, 440, 'TRY', 10),
        ($1, $3, 'Pizza Quattro Formaggi (4 Peynirli)', 'HRC-PIZ-02', 1, 520, 520, 'TRY', 10),
        ($1, $4, 'Signature Mojito (Küba Usulü)', 'HRC-KOK-01', 1, 380, 380, 'TRY', 20),
        ($1, $5, 'Ev Yapımı Çilekli Naneli Limonata', 'HRC-ICE-01', 1, 160, 160, 'TRY', 10)
    `, [sale3Id, insertedProductIds["HRC-PIZ-01"], insertedProductIds["HRC-PIZ-02"], insertedProductIds["HRC-KOK-01"], insertedProductIds["HRC-ICE-01"]]);

    // C. Open Table 5 Adisyon (Tatlı & Kahve)
    const sale5Res = await client.query(`
      INSERT INTO sales (
        store_id, total_amount, currency, status, customer_name,
        restaurant_table_id, payment_method, notes, source
      ) VALUES ($1, 850, 'TRY', 'pending', 'Masa 5', $2, 'credit_card', 'Sıcak çikolatası bol olsun.', 'pos')
      RETURNING id
    `, [storeId, tableIds["5"]]);
    const sale5Id = sale5Res.rows[0].id;

    await client.query(`
      INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
      VALUES 
        ($1, $2, 'San Sebastian Cheesecake', 'HRC-TAT-01', 1, 290, 290, 'TRY', 10),
        ($1, $3, 'Antep Fıstıklı Çıtır Katmer', 'HRC-TAT-02', 1, 340, 340, 'TRY', 10),
        ($1, $4, 'Double Espresso', 'HRC-ICE-02', 2, 110, 220, 'TRY', 10)
    `, [sale5Id, insertedProductIds["HRC-TAT-01"], insertedProductIds["HRC-TAT-02"], insertedProductIds["HRC-ICE-02"]]);

    // D. Completed Restaurant Sales (For Today's & Yesterday's End-of-Day Report)
    const completedPosSales = [
      {
        total: 2450,
        method: "credit_card",
        customer: "Masa 4 (Kapatıldı)",
        notes: "Öğle servisi kurumsal grup hesabı",
        date: todayStr
      },
      {
        total: 1850,
        method: "cash",
        customer: "Masa 2 (Kapatıldı)",
        notes: "Balık & Beyaz Şarap",
        date: todayStr
      },
      {
        total: 3600,
        method: "credit_card",
        customer: "Masa 6 (Kapatıldı)",
        notes: "Akşam yemeği 4 kişilik aile",
        date: yesterdayStr
      }
    ];

    for (const cs of completedPosSales) {
      const cRes = await client.query(`
        INSERT INTO sales (
          store_id, total_amount, currency, status, customer_name,
          payment_method, notes, source, created_at
        ) VALUES ($1, $2, 'TRY', 'completed', $3, $4, $5, 'pos', $6::timestamp + INTERVAL '14 hour')
        RETURNING id
      `, [storeId, cs.total, cs.customer, cs.method, cs.notes, cs.date]);
      const csId = cRes.rows[0].id;

      await client.query(`
        INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
        VALUES ($1, $2, $3, $4::timestamp + INTERVAL '14 hour')
      `, [csId, cs.method, cs.total, cs.date]);

      await client.query(`
        INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate)
        VALUES 
          ($1, $2, 'Izgara Ege Levreği Fileto', 'HRC-ANA-03', 2, 760, 1520, 'TRY', 10),
          ($1, $3, 'Aperol Spritz', 'HRC-KOK-02', 2, 420, 840, 'TRY', 20)
      `, [csId, insertedProductIds["HRC-ANA-03"], insertedProductIds["HRC-KOK-02"]]);
    }

    // E. Completed Hotel Room Sales (source = 'hotel' so they show in Hotel Sales Tab in Gün Sonu Raporu)
    const completedHotelSales = [
      {
        total: 4200,
        method: "credit_card",
        customer: "Oda 102 - Dr. Selin Yılmaz",
        notes: "Oda #102 Check-in Ön Ödemesi (Oda & Kahvaltı)",
        date: yesterdayStr
      },
      {
        total: 2800,
        method: "cash",
        customer: "Oda 103 - Hakan Demir",
        notes: "Oda #103 Giriş Tahsilatı (Yarım Pansiyon)",
        date: todayStr
      },
      {
        total: 13000,
        method: "credit_card",
        customer: "Oda 201 - Mustafa Çelik",
        notes: "Oda #201 Family Süit Giriş Avansı",
        date: todayStr
      },
      {
        total: 37500,
        method: "bank_transfer",
        customer: "Oda 301 - Lord Jonathan Vance",
        notes: "Oda #301 Penthouse VIP Rezervasyon Banka Havalesi",
        date: yesterdayStr
      },
      {
        total: 12800,
        method: "credit_card",
        customer: "Oda 101 - Burak Güner",
        notes: "Oda #101 Check-out Hesap Kapatma & Folyo Tahsilatı",
        date: yesterdayStr
      }
    ];

    for (const hs of completedHotelSales) {
      const hRes = await client.query(`
        INSERT INTO sales (
          store_id, total_amount, currency, status, customer_name,
          payment_method, notes, source, created_at
        ) VALUES ($1, $2, 'TRY', 'completed', $3, $4, $5, 'hotel', $6::timestamp + INTERVAL '11 hour')
        RETURNING id
      `, [storeId, hs.total, hs.customer, hs.method, hs.notes, hs.date]);
      const hsId = hRes.rows[0].id;

      await client.query(`
        INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
        VALUES ($1, $2, $3, $4::timestamp + INTERVAL '11 hour')
      `, [hsId, hs.method, hs.total, hs.date]);
    }

    console.log('✅ HorecaLP Demo Data Successfully Seeded!');
  } finally {
    client.release();
  }
}

function in2Days(d: Date): string {
  const next = new Date(d);
  next.setDate(next.getDate() + 2);
  return next.toISOString().split('T')[0];
}

seedHorecaDemo()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  });

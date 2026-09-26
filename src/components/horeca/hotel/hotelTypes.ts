export interface RoomReservation {
  id: string;
  identity_no: string;
  first_name: string;
  last_name: string;
  phone?: string;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  board_type?: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | 'UAI';
  main_guest_age?: number;
  guests?: Array<{
    first_name: string;
    last_name: string;
    birth_date?: string;
    age: number;
    age_category?: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'senior';
  }>;
  total_price?: number;
  notes?: string;
}

export interface RoomSpecialPrice {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  note?: string;
}

export interface RoomClosedDate {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface HotelRoom {
  id: string;
  room_number: string; // e.g., "101", "202", "SUITE-A", "BUNGLOW-1"
  room_type: string; // e.g., "Standard", "Suite", "Sea View", "Bungalow"
  capacity: number; // Max guest count
  max_adults?: number; // e.g., 2 adults
  max_children?: number; // e.g., 1 or 2 children
  bed_info?: string; // e.g., "1 Double + 1 Single"
  status: 'vacant' | 'occupied' | 'maintenance' | 'staff' | 'disabled';
  pricing_type?: 'per_room' | 'per_person';
  special_prices?: RoomSpecialPrice[];
  closed_dates?: RoomClosedDate[];
  price_per_night?: number;
  price_room_only?: number;
  price_half_board?: number;
  price_full_board?: number;
  price_all_inclusive?: number;
  price_ultra_all_inclusive?: number;
  board_prices?: {
    room_only?: number; // Sadece Oda (RO)
    bed_breakfast?: number; // Oda + Kahvaltı (BB)
    half_board?: number; // Yarım Pansiyon (HB)
    full_board?: number; // Tam Pansiyon (FB)
    all_inclusive?: number; // Her Şey Dahil (AI)
    ultra_all_inclusive?: number; // Ultra Her Şey Dahil (UAI)
  };
  non_refundable_discount?: number; // e.g. 10 or 15 percent
  amenities?: string[]; // e.g., ["WiFi", "Deniz Manzarası", "Balkon", "Jakuzi", "Klima", "TV", "Minibar", "Emanet Kasası"]
  cover_image?: string;
  images?: string[];
  description?: string;
  notes?: string;
  reservations?: RoomReservation[];
  current_guest?: {
    id: string;
    identity_no: string; // TC or Passport
    first_name: string;
    last_name: string;
    birth_date: string; // YYYY-MM-DD
    age: number;
    age_category: 'infant' | 'child' | 'adult' | 'senior';
    discount_rate: number; // e.g., 100 for 0-6 age, 50 for 7-12 age
    gender?: string;
    nationality?: string;
    phone?: string;
    email?: string;
    check_in_date: string;
    check_out_date: string; // YYYY-MM-DD
    board_type?: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | 'UAI' | string;
    advance_payment?: number;
    payment_method?: string;
    notes?: string;
  };
  additional_guests?: Array<{
    identity_no: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    age: number;
    age_category: 'infant' | 'child' | 'adult' | 'senior';
    discount_rate: number;
    gender?: string;
    nationality?: string;
    phone?: string;
  }>;
  folio?: {
    id: string;
    total_amount: number;
    items: Array<{
      id: string;
      title: string;
      amount: number;
      date: string;
      category: string;
      discount_applied?: number;
    }>;
  };
}

export interface ParsedBedAndCapacity {
  doubleBeds: number;
  singleBeds: number;
  hasBunk: boolean;
  bunkCount: number;
  extraBeds: number;     // Ekstra / Katlanır Yatak
  floorMattress: number; // Döşek / Yer Yatağı
  babyCribs: number;     // Bebek Yatağı / Beşik
  sofaBeds: number;      // Çekyat / Açılır Koltuk
  adults: number;
  children: number;
  totalCapacity: number;
  rawBedInfo: string;
}

export const parseBedAndCapacity = (room: {
  capacity?: number;
  max_adults?: number;
  max_children?: number;
  bed_info?: string;
}): ParsedBedAndCapacity => {
  const text = (room.bed_info || "").toLowerCase();

  let doubleBeds = 0;
  let singleBeds = 0;
  let bunkCount = 0;
  let extraBeds = 0;
  let floorMattress = 0;
  let babyCribs = 0;
  let sofaBeds = 0;

  // Extra bed (ekstra yatak, ek yatak, ilave yatak, katlanır yatak, rollaway, extra bed)
  const extraMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:ekstra|ek\s*yatak|ilave|katlanır|rollaway|extra\s*bed)/i);
  if (extraMatches && extraMatches[1]) {
    extraBeds = parseInt(extraMatches[1], 10);
  } else if (text.includes("ekstra") || text.includes("ek yatak") || text.includes("ilave yatak") || text.includes("katlanır yatak") || text.includes("extra bed")) {
    extraBeds = 1;
  }

  // Floor mattress (döşek, yer yatağı, yer döşeği, şilte, yer minderi, floor mattress)
  const mattressMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:döşek|yer\s*yatağı|yer\s*döşeği|şilte|yer\s*minderi|floor\s*mattress)/i);
  if (mattressMatches && mattressMatches[1]) {
    floorMattress = parseInt(mattressMatches[1], 10);
  } else if (text.includes("döşek") || text.includes("yer yatağı") || text.includes("yer döşeği") || text.includes("şilte") || text.includes("floor mattress")) {
    floorMattress = 1;
  }

  // Baby cribs (bebek yatağı, beşik, crib, cot, bebek karyolası)
  const babyMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:bebek|beşik|crib|cot)/i);
  if (babyMatches && babyMatches[1]) {
    babyCribs = parseInt(babyMatches[1], 10);
  } else if (text.includes("bebek yatağı") || text.includes("beşik") || text.includes("crib") || text.includes("bebek karyolası")) {
    babyCribs = 1;
  }

  // Sofa bed (çekyat, açılır koltuk, açılır kanepe, sofa bed, kanepe yatak)
  const sofaMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:çekyat|açılır|sofa\s*bed|kanepe)/i);
  if (sofaMatches && sofaMatches[1]) {
    sofaBeds = parseInt(sofaMatches[1], 10);
  } else if (text.includes("çekyat") || text.includes("açılır koltuk") || text.includes("açılır kanepe") || text.includes("sofa bed")) {
    sofaBeds = 1;
  }

  // Bunk bed (ranza, bunk)
  const hasBunk = text.includes("ranza") || text.includes("bunk");
  const bunkMatches = text.match(/(\d+)\s*(?:adet\s*)?ranza/i);
  if (bunkMatches && bunkMatches[1]) {
    bunkCount = parseInt(bunkMatches[1], 10);
  } else if (hasBunk) {
    bunkCount = 1;
  }

  // Double bed detection (çift, double, king, queen, french)
  const doubleMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:çift|double|king|queen|french)/i);
  if (doubleMatches && doubleMatches[1]) {
    doubleBeds = parseInt(doubleMatches[1], 10);
  } else if (text.includes("çift") || text.includes("double") || text.includes("king") || text.includes("queen") || text.includes("french")) {
    doubleBeds = 1;
  }

  // Single bed detection (tek, single, twin)
  const singleMatches = text.match(/(\d+)\s*(?:adet\s*)?(?:tek|single|twin)/i);
  if (singleMatches && singleMatches[1]) {
    singleBeds = parseInt(singleMatches[1], 10);
  } else if (bunkCount > 0 && !text.includes("tek")) {
    singleBeds = bunkCount * 2;
  } else if (text.includes("tek") || text.includes("single") || text.includes("twin")) {
    singleBeds = 1;
  }

  // Fallback if no bed_info or text matched none
  if (doubleBeds === 0 && singleBeds === 0 && extraBeds === 0 && floorMattress === 0 && sofaBeds === 0 && bunkCount === 0) {
    const cap = room.capacity || 2;
    if (cap === 1) {
      singleBeds = 1;
    } else if (cap === 2) {
      doubleBeds = 1;
    } else if (cap === 3) {
      doubleBeds = 1;
      singleBeds = 1;
    } else if (cap === 4) {
      doubleBeds = 2;
    } else {
      doubleBeds = Math.max(1, Math.floor(cap / 2));
      singleBeds = cap % 2;
    }
  }

  // Adults and Children Capacity calculation
  const totalStandardBedCapacity = (doubleBeds * 2) + singleBeds + extraBeds + floorMattress + sofaBeds;
  const totalCapacity = room.capacity || totalStandardBedCapacity || 2;
  let adults = room.max_adults ?? 0;
  let children = room.max_children ?? 0;

  if (!adults) {
    if (totalCapacity === 1) {
      adults = 1;
      children = room.max_children ?? 0;
    } else if (totalCapacity === 2) {
      adults = 2;
      children = room.max_children ?? 1;
    } else if (totalCapacity === 3) {
      adults = 2;
      children = room.max_children ?? 1;
    } else if (totalCapacity === 4) {
      adults = 3;
      children = room.max_children ?? 2;
    } else {
      adults = Math.max(2, totalCapacity - 2);
      children = room.max_children ?? 2;
    }
  } else if (room.max_children === undefined) {
    children = Math.max(0, totalCapacity - adults) + babyCribs;
  }

  return {
    doubleBeds,
    singleBeds,
    hasBunk,
    bunkCount,
    extraBeds,
    floorMattress,
    babyCribs,
    sofaBeds,
    adults,
    children,
    totalCapacity,
    rawBedInfo: room.bed_info || ""
  };
};

export const getDemoRooms = (): HotelRoom[] => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: "room-101",
      room_number: "101",
      room_type: "Standart Deniz Manzaralı",
      capacity: 2,
      bed_info: "1 Çift Kişilik Yatak",
      status: "occupied",
      price_per_night: 2500,
      board_prices: {
        room_only: 2200,
        bed_breakfast: 2500,
        half_board: 3200,
        full_board: 3900,
        all_inclusive: 4800
      },
      non_refundable_discount: 15,
      amenities: ["WiFi", "Deniz Manzarası", "Balkon", "Klima", "LCD TV", "Minibar", "Fön Makinesi"],
      cover_image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
      images: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1000&q=80"
      ],
      description: "Akdeniz manzaralı, geniş özel balkonlu ve modern iç tasarıma sahip deluxe deniz manzaralı oda.",
      current_guest: {
        id: "guest-1",
        identity_no: "12345678901",
        first_name: "Ahmet",
        last_name: "Yılmaz",
        birth_date: "1988-05-14",
        age: 38,
        age_category: "adult",
        discount_rate: 0,
        phone: "+90 532 111 2233",
        check_in_date: todayStr,
        check_out_date: tomorrowStr
      },
      additional_guests: [
        {
          identity_no: "98765432109",
          first_name: "Ece",
          last_name: "Yılmaz",
          birth_date: "2020-03-10",
          age: 6,
          age_category: "infant",
          discount_rate: 100
        }
      ],
      folio: {
        id: "folio-101",
        total_amount: 850,
        items: [
          { id: "f-1", title: "Restoran Adisyon #1042 (Serpme Kahvaltı + Çay)", amount: 600, date: todayStr, category: "Restaurant" },
          { id: "f-2", title: "Havuz Bar Adisyon #1055 (Taze Sıkma Meyve Suyu)", amount: 250, date: todayStr, category: "Bar" }
        ]
      }
    },
    {
      id: "room-102",
      room_number: "102",
      room_type: "Deluxe King Süit (Jakuzili)",
      capacity: 3,
      bed_info: "1 King Bed + 1 Tek Kişilik",
      status: "vacant",
      price_per_night: 4200,
      board_prices: {
        room_only: 3800,
        bed_breakfast: 4200,
        half_board: 5200,
        full_board: 6100,
        all_inclusive: 7500
      },
      non_refundable_discount: 10,
      amenities: ["WiFi", "Jakuzi", "Deniz Manzarası", "Balkon", "Klima", "Smart TV", "Minibar", "Emanet Kasası"],
      cover_image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
      description: "Özel jakuzili, kesintisiz panorama deniz manzaralı, geniş oturma gruplu lüks king süit."
    },
    {
      id: "room-103",
      room_number: "103",
      room_type: "Standart Bahçe Manzaralı",
      capacity: 2,
      bed_info: "2 Tek Kişilik Yatak",
      status: "maintenance",
      price_per_night: 2000,
      board_prices: {
        room_only: 1800,
        bed_breakfast: 2000,
        half_board: 2700
      },
      amenities: ["WiFi", "Bahçe Manzarası", "Klima", "LCD TV"],
      cover_image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80",
      notes: "Klima bakımı ve tesisat onarımı yapılıyor"
    },
    {
      id: "room-104",
      room_number: "STAFF-1",
      room_type: "Personel Tahsisli Oda",
      capacity: 2,
      bed_info: "Ranza Yatak",
      status: "staff",
      notes: "Mutfak şefi ve gece müdürü konaklaması"
    },
    {
      id: "room-201",
      room_number: "201",
      room_type: "Family Duplex Süit",
      capacity: 4,
      bed_info: "2 Çift Kişilik Yatak",
      status: "occupied",
      price_per_night: 5000,
      board_prices: {
        room_only: 4500,
        bed_breakfast: 5000,
        half_board: 6300,
        full_board: 7500,
        all_inclusive: 9000
      },
      non_refundable_discount: 15,
      amenities: ["WiFi", "Dublex Çift Kat", "Balkon", "Çift Banyo", "Klima", "TV", "Minibar"],
      cover_image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
      description: "Geniş aileler için ideal, çift katlı, çift banyolu ve ferah dubleks aile süiti.",
      current_guest: {
        id: "guest-2",
        identity_no: "45678912345",
        first_name: "Mehmet",
        last_name: "Kaya",
        birth_date: "1980-11-20",
        age: 45,
        age_category: "adult",
        discount_rate: 0,
        phone: "+90 542 999 8877",
        check_in_date: todayStr,
        check_out_date: tomorrowStr
      },
      folio: {
        id: "folio-201",
        total_amount: 1400,
        items: [
          { id: "f-3", title: "Akşam Yemeği Adisyon #1088 (Izgara Balık + Salata)", amount: 1400, date: todayStr, category: "Restaurant" }
        ]
      }
    }
  ];
};

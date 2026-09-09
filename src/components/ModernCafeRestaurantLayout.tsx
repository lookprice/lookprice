import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Utensils,
  ChevronRight,
  Sparkles,
  Compass,
  Instagram,
  Facebook,
  Twitter,
  Calendar,
  Award,
  Flame,
  BedDouble,
  Building2,
  CheckCircle2,
  Users,
  ShieldCheck,
  Search,
  X,
  CreditCard,
  Percent,
  Receipt,
  Baby,
  Plus,
  Trash2,
  Printer,
  Check,
  AlertCircle,
  Info,
  CalendarDays,
  Banknote,
  Calculator,
  Shield,
  Camera,
  ChevronLeft,
  Heart
} from "lucide-react";
import { Store, Product } from "../types";
import { HotelRoom } from "./horeca/HotelRoomManagement";

export interface BookingChildGuest {
  id: string;
  birth_date: string;
}

export const calculateGuestAgeInfo = (birthDateStr: string, customPolicy?: any) => {
  const policy = customPolicy || {
    enabled: true,
    apply_to_room: true,
    infant_0_2_rate: 100,
    toddler_3_6_rate: 50,
    child_7_12_rate: 30
  };

  if (!birthDateStr) {
    const defaultInfantRate = policy.infant_0_2_rate ?? 100;
    return {
      age: 2,
      category: 'infant' as const,
      discountRate: defaultInfantRate,
      labelTr: 'Bebek (0-2 Yaş)',
      discountText: defaultInfantRate === 100 ? '%100 Ücretsiz' : defaultInfantRate > 0 ? `%${defaultInfantRate} İndirimli` : 'Standart'
    };
  }

  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (isNaN(age) || age < 0) age = 0;

  if (!policy.enabled || policy.apply_to_room === false) {
    return {
      age,
      category: (age <= 2 ? 'infant' : age <= 6 ? 'toddler' : age <= 12 ? 'child' : 'adult') as any,
      discountRate: 0,
      labelTr: age <= 2 ? `Bebek (${age} Yaş)` : age <= 6 ? `Küçük Çocuk (${age} Yaş)` : age <= 12 ? `Çocuk (${age} Yaş)` : `Yetişkin (${age} Yaş)`,
      discountText: 'Standart (İndirimsiz)'
    };
  }

  if (age <= 2) {
    const rate = policy.infant_0_2_rate ?? 100;
    return {
      age,
      category: 'infant' as const,
      discountRate: rate,
      labelTr: `Bebek (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else if (age <= 6) {
    const rate = policy.toddler_3_6_rate ?? 50;
    return {
      age,
      category: 'toddler' as const,
      discountRate: rate,
      labelTr: `Küçük Çocuk (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else if (age <= 12) {
    const rate = policy.child_7_12_rate ?? 30;
    return {
      age,
      category: 'child' as const,
      discountRate: rate,
      labelTr: `Çocuk (${age} Yaş)`,
      discountText: rate === 100 ? '%100 Ücretsiz' : rate > 0 ? `%${rate} İndirimli` : 'İndirimsiz'
    };
  } else {
    return {
      age,
      category: 'adult' as const,
      discountRate: 0,
      labelTr: `Yetişkin (${age} Yaş)`,
      discountText: 'Tam Ücret'
    };
  }
};

interface ModernCafeRestaurantLayoutProps {
  store: Store;
  products: Product[];
  onViewProduct: (product: Product) => void;
  lang: string;
  t: any;
}

export const ModernCafeRestaurantLayout: React.FC<ModernCafeRestaurantLayoutProps> = ({
  store,
  products,
  onViewProduct,
  lang,
  t,
}) => {
  const isTr = lang === "tr";
  const isHotelModuleActive = Boolean(store.hotel_module_enabled || store.branding?.hotel_module_enabled);

  // Mode state: 'menu' (Restoran & Menü) vs 'hotel' (Otel & Konaklama)
  // Default to 'menu' so Restaurant & Menu (Seçkin Lezzetlerimiz, Günün Öne Çıkan Menüsü, etc.) is the spotlighted view
  const [activeMode, setActiveMode] = useState<'menu' | 'hotel'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Sync mode if URL contains #rooms or #menu
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#rooms" && isHotelModuleActive) {
        setActiveMode("hotel");
      } else if (window.location.hash === "#menu") {
        setActiveMode("menu");
      }
    }
  }, [isHotelModuleActive]);

  // Dynamic Hotel Rooms State synced from store branding or localStorage
  const [rooms, setRooms] = useState<HotelRoom[]>(() => {
    const directRooms = (store as any).hotel_rooms || store.branding?.hotel_rooms;
    if (directRooms && Array.isArray(directRooms) && directRooms.length > 0) {
      return directRooms;
    }
    try {
      const saved = localStorage.getItem(`hotel_rooms_${store.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // Fallback default mock rooms with rich booking options
    return [
      {
        id: "room-101",
        room_number: "101",
        room_type: "Standart Deniz Manzaralı",
        capacity: 2,
        bed_info: "1 Çift Kişilik Yatak",
        status: "vacant",
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
        description: "Akdeniz manzaralı, geniş özel balkonlu ve modern iç tasarıma sahip deluxe deniz manzaralı oda."
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
        id: "room-201",
        room_number: "201",
        room_type: "Family Duplex Süit",
        capacity: 4,
        bed_info: "2 Çift Kişilik Yatak",
        status: "vacant",
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
        description: "Geniş aileler için ideal, çift katlı, çift banyolu ve ferah dubleks aile süiti."
      }
    ];
  });

  // Sync rooms if store branding or local storage updates
  useEffect(() => {
    const directRooms = (store as any).hotel_rooms || store.branding?.hotel_rooms;
    if (directRooms && Array.isArray(directRooms) && directRooms.length > 0) {
      setRooms(directRooms);
    }
  }, [(store as any).hotel_rooms, store.branding?.hotel_rooms]);

  // Listen to window events to automatically sync room additions/edits made by the operator
  useEffect(() => {
    const handleSync = (e?: any) => {
      if (e?.detail?.rooms && Array.isArray(e.detail.rooms) && (e.detail.storeId === store.id || !e.detail.storeId)) {
        setRooms(e.detail.rooms);
        return;
      }
      try {
        const saved = localStorage.getItem(`hotel_rooms_${store.id}`);
        if (saved) setRooms(JSON.parse(saved));
      } catch (err) {}
    };
    window.addEventListener("hotel_rooms_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("hotel_rooms_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [store.id]);

  // Hotel Search & Reservation Filter State
  const todayStr = new Date().toISOString().split("T")[0];

  // Helper to safely compute next day string (YYYY-MM-DD)
  const getNextDayString = (dateStr: string) => {
    if (!dateStr) return todayStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return todayStr;
  };

  const tomorrowStr = getNextDayString(todayStr);

  const [searchCheckIn, setSearchCheckIn] = useState(todayStr);
  const [searchCheckOut, setSearchCheckOut] = useState(tomorrowStr);

  const handleCheckInChange = (newCheckIn: string) => {
    setSearchCheckIn(newCheckIn);
    const minCheckOut = getNextDayString(newCheckIn);
    if (!searchCheckOut || searchCheckOut <= newCheckIn) {
      setSearchCheckOut(minCheckOut);
    }
  };

  // Dynamic Adults & Children List with Birth Dates
  const [searchAdults, setSearchAdults] = useState(2);
  const [searchChildrenList, setSearchChildrenList] = useState<BookingChildGuest[]>([]);
  const [searchBoardType, setSearchBoardType] = useState<string>("all");

  const handleAddChild = () => {
    const newChild: BookingChildGuest = {
      id: `child-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      birth_date: "2021-06-15" // Default toddler birth date
    };
    setSearchChildrenList(prev => [...prev, newChild]);
  };

  const handleUpdateChildBirthDate = (id: string, newBirthDate: string) => {
    setSearchChildrenList(prev => prev.map(c => c.id === id ? { ...c, birth_date: newBirthDate } : c));
  };

  const handleRemoveChild = (id: string) => {
    setSearchChildrenList(prev => prev.filter(c => c.id !== id));
  };

  // Room date availability check against occupied/maintenance dates
  const isRoomAvailableForDates = (room: HotelRoom, checkIn: string, checkOut: string) => {
    if (room.status === 'maintenance') return false;
    if (room.status === 'occupied' && room.current_guest) {
      const existingIn = room.current_guest.check_in_date;
      const existingOut = room.current_guest.check_out_date;
      if (existingIn && existingOut) {
        if (checkIn < existingOut && checkOut > existingIn) {
          return false;
        }
      }
    }
    return true;
  };

  // Room Gallery Detail Modal State
  const [viewDetailRoom, setViewDetailRoom] = useState<HotelRoom | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);

  // Booking Modal State
  const [selectedBookingRoom, setSelectedBookingRoom] = useState<HotelRoom | null>(null);
  const [selectedBoardOption, setSelectedBoardOption] = useState<'RO' | 'BB' | 'HB' | 'FB' | 'AI'>('BB');
  const [isNonRefundableRate, setIsNonRefundableRate] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'pay_at_hotel'>('pay_at_hotel');

  // Active Hotel Reservation Payment Methods configured in Adisyon / POS settings (Unified with store payment_settings)
  const hotelPaymentSettings = store.payment_settings || store.branding?.payment_settings || {};
  const isHotelPayAtHotelActive = hotelPaymentSettings.cod_enabled !== false && hotelPaymentSettings.hotel_pay_at_hotel_enabled !== false;
  const isHotelBankTransferActive = hotelPaymentSettings.bank_transfer_enabled !== false && hotelPaymentSettings.hotel_bank_transfer_enabled !== false;
  const isHotelCreditCardActive = (hotelPaymentSettings.credit_card_enabled !== false && hotelPaymentSettings.hotel_credit_card_enabled !== false) ||
    !!hotelPaymentSettings.iyzico_enabled || !!hotelPaymentSettings.paypal_enabled || !!hotelPaymentSettings.payoneer_enabled;
  const hotelBankDetailsText = hotelPaymentSettings.bank_details || hotelPaymentSettings.hotel_bank_details || "TR12 0006 2000 0000 0001 2345 67 (Ziraat Bankası - Otel İşletmesi)";

  const availableHotelPaymentMethods = React.useMemo(() => {
    const methods: { id: 'pay_at_hotel' | 'bank_transfer' | 'credit_card'; label: string; icon: React.ReactNode }[] = [];
    if (isHotelPayAtHotelActive) {
      methods.push({ id: 'pay_at_hotel', label: 'Otelde Öde', icon: <Banknote className="w-3.5 h-3.5" /> });
    }
    if (isHotelBankTransferActive) {
      methods.push({ id: 'bank_transfer', label: 'Banka / Havale', icon: <Receipt className="w-3.5 h-3.5" /> });
    }
    if (isHotelCreditCardActive) {
      methods.push({ id: 'credit_card', label: 'Kredi Kartı', icon: <CreditCard className="w-3.5 h-3.5" /> });
    }
    return methods;
  }, [isHotelPayAtHotelActive, isHotelBankTransferActive, isHotelCreditCardActive]);

  // Keep selectedPaymentMethod valid if currently chosen method is disabled
  useEffect(() => {
    if (availableHotelPaymentMethods.length > 0) {
      const isCurrentValid = availableHotelPaymentMethods.some(m => m.id === selectedPaymentMethod);
      if (!isCurrentValid) {
        setSelectedPaymentMethod(availableHotelPaymentMethods[0].id);
      }
    }
  }, [availableHotelPaymentMethods, selectedPaymentMethod]);
  
  // Dynamic Hotel Age & Child Discount Policy (Configured in Hotel Management)
  const dynamicAgePolicy = React.useMemo(() => {
    try {
      if (store.branding?.hotel_age_policy) return store.branding.hotel_age_policy;
      const saved = localStorage.getItem(`hotelAgePolicy_${store.id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      apply_to_room: true,
      infant_0_2_rate: 100, // 0-2 Yaş Bebek %
      toddler_3_6_rate: 50,  // 3-6 Yaş Küçük Çocuk %
      child_7_12_rate: 30,   // 7-12 Yaş Çocuk %
      senior_65_plus_rate: 15
    };
  }, [store.id, store.branding?.hotel_age_policy]);

  const childPolicyDescriptionText = React.useMemo(() => {
    if (!dynamicAgePolicy.enabled || dynamicAgePolicy.apply_to_room === false) {
      return "💡 Çocuk misafirler için standart konaklama tarifesi uygulanmaktadır. Çocuk ekleyerek doğum tarihlerini girebilirsiniz.";
    }
    const infRate = dynamicAgePolicy.infant_0_2_rate ?? 100;
    const todRate = dynamicAgePolicy.toddler_3_6_rate ?? 50;
    const chRate = dynamicAgePolicy.child_7_12_rate ?? 30;

    const infantText = infRate === 100 ? "%100 Ücretsiz" : infRate > 0 ? `%${infRate} İndirimli` : "İndirimsiz";
    const toddlerText = todRate === 100 ? "%100 Ücretsiz" : todRate > 0 ? `%${todRate} İndirimli` : "İndirimsiz";
    const childText = chRate === 100 ? "%100 Ücretsiz" : chRate > 0 ? `%${chRate} İndirimli` : "İndirimsiz";

    return `💡 0-2 Yaş Bebekler ${infantText}, 3-6 Yaş ${toddlerText}, 7-12 Yaş ${childText}. Çocuk ekleyerek doğum tarihlerini girebilirsiniz.`;
  }, [dynamicAgePolicy]);

  const [creditCardForm, setCreditCardForm] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvc: ""
  });

  const [bookingGuestForm, setBookingGuestForm] = useState({
    identity_no: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    birth_date: "1992-06-15",
    special_requests: ""
  });

  const [completedReservationVoucher, setCompletedReservationVoucher] = useState<any | null>(null);

  // Group food products by category
  const categories = React.useMemo(() => {
    const list = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set(list));
  }, [products]);

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "bestsellers") {
      const explicit = products.filter((p) => p.is_bestseller);
      return explicit.length > 0 ? explicit : products.slice(0, 6);
    }
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalTables = store.page_layout_settings?.table_count || 12;

  // Social Links
  const socialLinks = [
    { icon: <Instagram className="w-5 h-5" />, url: store.instagram_url, label: "Instagram" },
    { icon: <Facebook className="w-5 h-5" />, url: store.facebook_url, label: "Facebook" },
    { icon: <Twitter className="w-5 h-5" />, url: store.twitter_url, label: "Twitter" },
  ].filter(link => link.url);

  // Instagram Showcase Configuration & Dynamic Grid
  const instagramFeedEnabled = store.branding?.instagram_feed_enabled !== false;
  const rawIgHandle = store.branding?.instagram_username || store.instagram_url?.split("instagram.com/")?.[1]?.replace(/\/$/, "") || store.slug || "lookprice.horeca";
  const instagramHandle = rawIgHandle.startsWith("@") ? rawIgHandle : `@${rawIgHandle}`;
  const cleanInstagramHandle = instagramHandle.replace(/^@/, "");
  const instagramProfileUrl = store.instagram_url || `https://instagram.com/${cleanInstagramHandle}`;
  const instagramTitle = store.branding?.instagram_title || (isTr ? "Bizi Instagram'da Keşfedin" : "Follow Our Moments on Instagram");
  const instagramSubtitle = store.branding?.instagram_subtitle || (isTr ? "Otelimizden, mutfağımızdan ve özel anlarımızdan en taze kareler" : "Curated moments, culinary highlights, and stories from our paradise");

  const instagramPosts = React.useMemo(() => {
    if (store.branding?.instagram_posts && Array.isArray(store.branding.instagram_posts) && store.branding.instagram_posts.length > 0) {
      return store.branding.instagram_posts;
    }
    return [
      {
        id: "ig-1",
        image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Huzurlu bir sabaha uyanmanın en güzel yolu ✨" : "Waking up to serene mornings ✨",
        likes: 384,
        post_url: instagramProfileUrl
      },
      {
        id: "ig-2",
        image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Akşam yemeği için şefimizin özel imza lezzetleri hazır 🍽️" : "Signature dishes crafted with passion 🍽️",
        likes: 512,
        post_url: instagramProfileUrl
      },
      {
        id: "ig-3",
        image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Gün batımında teras barımızda serinletici kokteyller 🍸" : "Sunset sips on our panoramic terrace 🍸",
        likes: 429,
        post_url: instagramProfileUrl
      },
      {
        id: "ig-4",
        image_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Konforlu süitlerimizde kusursuz bir dinlenme deneyimi 🛏️" : "Unwind in pure luxury and comfort 🛏️",
        likes: 673,
        post_url: instagramProfileUrl
      },
      {
        id: "ig-5",
        image_url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Masmavi havuzumuz ve Akdeniz güneşinin tadı ☀️🏊‍♂️" : "Sun-drenched days by the pool ☀️🏊‍♂️",
        likes: 891,
        post_url: instagramProfileUrl
      },
      {
        id: "ig-6",
        image_url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
        caption: isTr ? "Taze kavrulmuş kahve aromasıyla güne harika bir başlangıç ☕" : "Freshly brewed artisan coffee ☕",
        likes: 310,
        post_url: instagramProfileUrl
      }
    ];
  }, [store.branding?.instagram_posts, isTr, instagramProfileUrl]);

  // Digital menu path
  const digitalMenuUrl = `/digital-menu/${store.id}/web`;

  // Calculate night count
  const calculateNights = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const currentNights = calculateNights(searchCheckIn, searchCheckOut);

  // Get base board rate per night
  const getSelectedBoardPrice = (room: HotelRoom, board: 'RO' | 'BB' | 'HB' | 'FB' | 'AI') => {
    const bp = room.board_prices;
    if (!bp) return room.price_per_night || 2500;
    switch (board) {
      case 'RO': return bp.room_only || Math.round((room.price_per_night || 2500) * 0.88);
      case 'BB': return bp.bed_breakfast || room.price_per_night || 2500;
      case 'HB': return bp.half_board || Math.round((room.price_per_night || 2500) * 1.28);
      case 'FB': return bp.full_board || Math.round((room.price_per_night || 2500) * 1.56);
      case 'AI': return bp.all_inclusive || Math.round((room.price_per_night || 2500) * 1.92);
      default: return room.price_per_night || 2500;
    }
  };

  // Detailed transparent price calculation table breakdown
  const computeDetailedBreakdown = (room: HotelRoom) => {
    const nights = calculateNights(searchCheckIn, searchCheckOut);
    const baseNightlyPrice = getSelectedBoardPrice(room, selectedBoardOption);
    const isPerPerson = room.pricing_type !== 'per_room';
    
    let adultsGrossAmount = 0;
    if (isPerPerson) {
      adultsGrossAmount = searchAdults * baseNightlyPrice * nights;
    } else {
      adultsGrossAmount = baseNightlyPrice * nights;
    }

    // Calculate each child's gross, discount, and net
    const childrenDetails = searchChildrenList.map((ch, idx) => {
      const ageInfo = calculateGuestAgeInfo(ch.birth_date, dynamicAgePolicy);
      let gross = 0;
      let discountAmount = 0;
      let net = 0;
      
      if (isPerPerson) {
        gross = baseNightlyPrice * nights;
        discountAmount = Math.round(gross * (ageInfo.discountRate / 100));
        net = gross - discountAmount;
      }

      return {
        id: ch.id,
        index: idx + 1,
        birthDate: ch.birth_date,
        age: ageInfo.age,
        label: ageInfo.labelTr,
        discountRate: ageInfo.discountRate,
        discountText: ageInfo.discountText,
        grossAmount: gross,
        discountAmount,
        netAmount: net
      };
    });

    const totalChildrenGross = childrenDetails.reduce((acc, c) => acc + c.grossAmount, 0);
    const totalChildrenDiscount = childrenDetails.reduce((acc, c) => acc + c.discountAmount, 0);
    const totalChildrenNet = childrenDetails.reduce((acc, c) => acc + c.netAmount, 0);

    const subtotalAfterChildDiscounts = adultsGrossAmount + totalChildrenNet;

    let flexDiscountAmount = 0;
    if (isNonRefundableRate && room.non_refundable_discount) {
      flexDiscountAmount = Math.round(subtotalAfterChildDiscounts * (room.non_refundable_discount / 100));
    }

    const finalPayableTotal = Math.max(0, subtotalAfterChildDiscounts - flexDiscountAmount);

    return {
      isPerPerson,
      nights,
      baseNightlyPrice,
      adultsCount: searchAdults,
      adultsGrossAmount,
      childrenDetails,
      totalChildrenGross,
      totalChildrenDiscount,
      totalChildrenNet,
      subtotalAfterChildDiscounts,
      flexDiscountAmount,
      finalPayableTotal
    };
  };

  const computeTotalBookingPrice = (room: HotelRoom) => {
    return computeDetailedBreakdown(room).finalPayableTotal;
  };

  // Execute Reservation Submit & Trigger Payment Workflow
  const handleExecuteReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRoom || !bookingGuestForm.first_name || !bookingGuestForm.last_name) return;

    const breakdown = computeDetailedBreakdown(selectedBookingRoom);
    const reservationCode = `REZ-${Date.now().toString().slice(-6)}`;

    const boardName = selectedBoardOption === 'RO' ? 'Sadece Oda (RO)' :
                      selectedBoardOption === 'BB' ? 'Oda + Kahvaltı (BB)' :
                      selectedBoardOption === 'HB' ? 'Yarım Pansiyon (HB)' :
                      selectedBoardOption === 'FB' ? 'Tam Pansiyon (FB)' : 'Her Şey Dahil (AI)';

    const paymentLabel = selectedPaymentMethod === 'bank_transfer' ? 'Banka Havalesi / EFT' :
                         selectedPaymentMethod === 'credit_card' ? 'Kredi Kartı (Sanal POS)' : 'Otelde Öde (Resepsiyonda Ödeme)';

    // Formatted WhatsApp text fallback
    const rawWa = store.whatsapp_number || store.phone || "905488902309";
    const cleanWa = rawWa.replace(/[^0-9+]/g, "");

    const childWaSummary = breakdown.isPerPerson ? breakdown.childrenDetails.map(c => 
      `• ${c.index}. Çocuk: T.Tarihi ${c.birthDate} (${c.label}) -> ${c.discountText}`
    ).join('\n') : breakdown.childrenDetails.map(c => 
      `• ${c.index}. Çocuk: T.Tarihi ${c.birthDate} (${c.label})`
    ).join('\n');

    const waText = encodeURIComponent(
      `Merhaba ${store.name},\n\n` +
      `📌 ONLINE REZERVASYON TALEBİ (#${reservationCode})\n` +
      `🏨 Oda: #${selectedBookingRoom.room_number} (${selectedBookingRoom.room_type})\n` +
      `📅 Tarih: ${searchCheckIn} ➔ ${searchCheckOut} (${breakdown.nights} Gece)\n` +
      `🍽️ Pansiyon Tipi: ${boardName}\n` +
      `👥 Misafir: ${searchAdults} Yetişkin${breakdown.childrenDetails.length > 0 ? `, ${breakdown.childrenDetails.length} Çocuk` : ''}\n` +
      (childWaSummary ? `${childWaSummary}\n` : '') +
      `💰 TOPLAM TUTAR: ₺${breakdown.finalPayableTotal.toLocaleString('tr-TR')}\n` +
      `💳 Ödeme Yöntemi: ${paymentLabel}\n` +
      `👤 İletişim: ${bookingGuestForm.first_name} ${bookingGuestForm.last_name} (TC/Pasaport: ${bookingGuestForm.identity_no || '-'})\n` +
      `📞 Tel: ${bookingGuestForm.phone || '-'}\n` +
      (bookingGuestForm.special_requests ? `📝 Özel İstek: ${bookingGuestForm.special_requests}\n` : '') +
      `\nLütfen rezervasyonumu onaylayıp teyit iletiniz.`
    );

    // Prepare full guest list for Folio
    const extraGuests = breakdown.childrenDetails.map(c => ({
      id: c.id,
      identity_no: "-",
      first_name: `${c.index}. Çocuk`,
      last_name: bookingGuestForm.last_name,
      birth_date: c.birthDate,
      age: c.age,
      age_category: c.age <= 2 ? 'infant' : 'child',
      discount_rate: c.discountRate,
      gender: 'Çocuk/Bebek'
    }));

    // Update local state and operator panel room folio
    try {
      const updatedRooms = rooms.map(r => {
        if (r.id === selectedBookingRoom.id) {
          return {
            ...r,
            status: 'occupied' as const,
            current_guest: {
              id: `guest-${Date.now()}`,
              identity_no: bookingGuestForm.identity_no || '11111111111',
              first_name: bookingGuestForm.first_name,
              last_name: bookingGuestForm.last_name,
              birth_date: bookingGuestForm.birth_date,
              age: 30,
              age_category: 'adult' as const,
              discount_rate: 0,
              phone: bookingGuestForm.phone,
              check_in_date: searchCheckIn,
              check_out_date: searchCheckOut,
              additional_guests: extraGuests
            },
            folio: {
              id: `folio-${Date.now()}`,
              total_amount: breakdown.finalPayableTotal,
              items: [
                {
                  id: `item-${Date.now()}`,
                  title: `Konaklama (${breakdown.nights} Gece - ${boardName})`,
                  amount: breakdown.finalPayableTotal,
                  date: searchCheckIn,
                  category: "Room Charge"
                }
              ]
            }
          };
        }
        return r;
      });

      localStorage.setItem(`hotel_rooms_${store.id}`, JSON.stringify(updatedRooms));
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId: store.id, rooms: updatedRooms } }));
      
      // Dispatch custom event for real-time notification in dashboard
      window.dispatchEvent(new CustomEvent('hotel_reservation_created', { 
        detail: { 
          storeId: store.id, 
          reservationCode,
          room: selectedBookingRoom,
          guest: bookingGuestForm,
          totalAmount: breakdown.finalPayableTotal
        } 
      }));

      // Persist to database via backend public API
      api.createPublicHotelReservation(store.id, {
        reservation_code: reservationCode,
        room_id: selectedBookingRoom.id,
        room_number: selectedBookingRoom.room_number,
        room_type: selectedBookingRoom.room_type,
        guest: bookingGuestForm,
        guest_name: `${bookingGuestForm.first_name} ${bookingGuestForm.last_name}`.trim(),
        guest_first_name: bookingGuestForm.first_name,
        guest_last_name: bookingGuestForm.last_name,
        guest_identity_no: bookingGuestForm.identity_no || '11111111111',
        guest_phone: bookingGuestForm.phone,
        guest_email: bookingGuestForm.email || '',
        check_in_date: searchCheckIn,
        check_out_date: searchCheckOut,
        nights: breakdown.nights,
        board_type: selectedBoardOption,
        board_name: boardName,
        adults_count: searchAdults,
        children_count: breakdown.childrenDetails.length,
        total_amount: breakdown.finalPayableTotal,
        payment_method: selectedPaymentMethod,
        payment_label: paymentLabel,
        special_requests: bookingGuestForm.special_requests || '',
        details: {
          breakdown,
          extraGuests,
          adults: searchAdults,
          selectedBoardOption,
          room: selectedBookingRoom
        }
      }).catch(err => {
        console.warn("Could not save hotel reservation to backend:", err);
      });
    } catch (err) {}

    // Show Confirmation Voucher Modal
    setCompletedReservationVoucher({
      code: reservationCode,
      room: selectedBookingRoom,
      guest: bookingGuestForm,
      checkIn: searchCheckIn,
      checkOut: searchCheckOut,
      nights: breakdown.nights,
      boardName,
      adultsCount: searchAdults,
      breakdown,
      paymentMethod: selectedPaymentMethod,
      paymentLabel,
      waUrl: `https://wa.me/${cleanWa}?text=${waText}`
    });

    setSelectedBookingRoom(null);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Warm Premium Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {(store.logo_url || store.branding?.logo_url) ? (
              <img
                src={store.logo_url || store.branding?.logo_url}
                alt={store.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover border border-stone-200/80 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-xs shrink-0">
                {store.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col justify-center min-w-0">
              <span className="block text-sm sm:text-base font-black tracking-tight text-stone-900 leading-tight whitespace-nowrap">
                {store.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-800 uppercase font-sans whitespace-nowrap">
                  {store.branding?.slogan || (isHotelModuleActive ? (isTr ? "Resort Hotel & Fine Dining" : "Resort Hotel & Fine Dining") : (isTr ? "Gurme Lezzetler & Kafe" : "Gourmet Flavors"))}
                </span>
              </div>
            </div>
          </div>

          {/* DUAL-AURA MODE SWITCHER (RESTANRANT <---> OTEL) - ICON-ONLY ON MOBILE TO PREVENT OVERLAP */}
          {isHotelModuleActive && (
            <div className="bg-stone-100 p-1 rounded-2xl border border-stone-200/90 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveMode('hotel')}
                title={isTr ? "Otel & Rezerve Et" : "Hotel & Rooms"}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'hotel'
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden md:inline">{isTr ? "Otel & Rezerve Et" : "Hotel & Rooms"}</span>
              </button>

              <button
                onClick={() => setActiveMode('menu')}
                title={isTr ? "Restoran & Menü" : "Restaurant Menu"}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'menu'
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{isTr ? "Restoran & Menü" : "Restaurant Menu"}</span>
              </button>
            </div>
          )}

          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-bold text-stone-600 shrink-0">
            {isHotelModuleActive && (
              <a href="#rooms" onClick={() => setActiveMode('hotel')} className="hover:text-amber-700 transition-colors">
                {isTr ? "Otel Odaları" : "Rooms & Suites"}
              </a>
            )}
            <a href="#menu" onClick={() => setActiveMode('menu')} className="hover:text-amber-700 transition-colors">
              {isTr ? "Lezzet Menümüz" : "Our Menu"}
            </a>
            <a href="#story" className="hover:text-amber-700 transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a>
            <a href="#hours" className="hover:text-amber-700 transition-colors">{isTr ? "Çalışma Saatleri" : "Hours"}</a>
            <a href="#contact" className="hover:text-amber-700 transition-colors">{isTr ? "İletişim" : "Contact"}</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={digitalMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-amber-600/10 transition-all flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isTr ? "Dijital Menü" : "Digital Menu"}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Atmospheric Cozy Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-white min-h-[65vh] md:min-h-[75vh] flex items-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="absolute inset-0 z-0">
          <img
            src={activeMode === 'hotel' 
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1600"
              : (store.hero_image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1600")
            }
            alt="Hero Background"
            className="w-full h-full object-cover opacity-35 filter brightness-75 scale-105 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 md:space-y-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeMode === 'hotel' 
              ? (isTr ? "LookPrice VIP Konaklama Güvencesi" : "LookPrice VIP Hotel Experience")
              : (isTr ? "Eşsiz Gurme Lezzet Deneyimi" : "An Exquisite Culinary Experience")
            }
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-amber-50 tracking-tight leading-tight max-w-4xl mx-auto"
          >
            {activeMode === 'hotel'
              ? (isTr ? "Konforlu Odalar, Unutulmaz Bir Tatil" : "Luxury Rooms & Fine Dining")
              : (store.hero_title || (isTr ? "Sıcak Bir Atmosfer, Seçkin Tatlar" : "Warm Atmosphere, Fine Tastes"))
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-lg text-stone-200 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            {activeMode === 'hotel'
              ? (isTr ? "Oda kahvaltı, yarım pansiyon ve her şey dahil konaklama seçenekleriyle tatilinizin keyfini çıkarın." : "Enjoy room breakfast, half board and all inclusive options for your unforgettable stay.")
              : (store.hero_subtitle || (isTr ? "Usta şeflerimizin özenle hazırladığı taze lezzetler ve kaliteli kahve çeşitlerimizle günün her anına keyif katıyoruz." : "We elevate every moment of your day with fresh dishes masterfully crafted by our chefs."))
            }
          </motion.p>

          {/* LIVE HOTEL ROOM SEARCH BAR WIDGET WITH DYNAMIC CHILDREN & AGE DISCOUNTS */}
          {activeMode === 'hotel' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/20 text-stone-800 text-left max-w-4xl mx-auto space-y-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" /> Giriş Tarihi
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={searchCheckIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 shadow-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" /> Çıkış Tarihi
                  </label>
                  <input
                    type="date"
                    min={getNextDayString(searchCheckIn)}
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 shadow-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-600" /> Yetişkin Sayısı
                  </label>
                  <div className="flex items-center gap-1.5 mt-1 bg-stone-100 border border-stone-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setSearchAdults(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white shadow-xs font-black text-xs text-stone-700 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-black text-xs text-stone-900">{searchAdults} Yetişkin</span>
                    <button
                      type="button"
                      onClick={() => setSearchAdults(prev => Math.min(8, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-white shadow-xs font-black text-xs text-stone-700 flex items-center justify-center hover:bg-stone-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-600" /> Pansiyon Tipi
                  </label>
                  <select
                    value={searchBoardType}
                    onChange={(e) => setSearchBoardType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 shadow-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">Tüm Pansiyonlar</option>
                    <option value="BB">Oda + Kahvaltı (BB)</option>
                    <option value="HB">Yarım Pansiyon (HB)</option>
                    <option value="AI">Her Şey Dahil (AI)</option>
                    <option value="RO">Sadece Oda (RO)</option>
                  </select>
                </div>
              </div>

              {/* CHILD GUEST SELECTION WITH BIRTH DATES AND AGE GROUP DISCOUNT BADGES */}
              <div className="bg-amber-50/70 dark:bg-stone-800/80 p-3.5 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                      Çocuk Misafir Ekle ({searchChildrenList.length} Çocuk)
                    </span>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                      Yaş Grubu İndirimli
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Çocuk Ekle</span>
                  </button>
                </div>

                {/* LIST OF ADDED CHILDREN WITH BIRTH DATES */}
                {searchChildrenList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {searchChildrenList.map((child, idx) => {
                      const ageInfo = calculateGuestAgeInfo(child.birth_date, dynamicAgePolicy);
                      return (
                        <div key={child.id} className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="block text-[10px] font-black text-stone-500 uppercase">Doğum Tarihi Gir</span>
                              <input
                                type="date"
                                value={child.birth_date}
                                onChange={(e) => handleUpdateChildBirthDate(child.id, e.target.value)}
                                className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-900"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className={`block text-[10px] font-black px-1.5 py-0.5 rounded ${
                                ageInfo.discountRate === 100 ? 'bg-emerald-100 text-emerald-800' :
                                ageInfo.discountRate === 50 ? 'bg-amber-100 text-amber-800' :
                                ageInfo.discountRate === 30 ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                              }`}>
                                {ageInfo.discountText}
                              </span>
                              <span className="text-[10px] text-stone-500 font-semibold">{ageInfo.labelTr}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-stone-400 hover:text-red-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
                              title="Çocuğu Çıkar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold text-stone-600 italic">
                    {childPolicyDescriptionText}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-stone-200/60 pt-3 text-xs font-bold text-stone-600">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {currentNights} Gece Konaklama ({searchAdults} Yetişkin{searchChildrenList.length > 0 ? `, ${searchChildrenList.length} Çocuk` : ''})
                </span>
                <a
                  href="#rooms"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Odaları Göster</span>
                </a>
              </div>
            </motion.div>
          )}

          {activeMode === 'menu' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <a
                href={digitalMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-xl text-sm tracking-wide shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Utensils className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
                {isTr ? "Dijital Menüden Sipariş Ver" : "Order from Digital Menu"}
              </a>
              {store.whatsapp_number && (
                <a
                  href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-stone-800/80 hover:bg-stone-700/80 backdrop-blur-sm border border-stone-700 text-stone-100 font-bold px-8 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4.5 h-4.5 text-green-400" />
                  {isTr ? "Rezervasyon / İletişim" : "Make a Reservation"}
                </a>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* LOOKPRICE HOTEL ROOM SHOWCASE SECTION (When activeMode === 'hotel' or scrolled) */}
      {isHotelModuleActive && activeMode === 'hotel' && (
        <section id="rooms" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <div className="text-xs text-amber-700 font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>OTEL KONAKLAMA & SÜİTLER</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight">
              Müsait Odalar ve Pansiyon Seçenekleri
            </h2>
            <p className="text-xs font-semibold text-stone-500">
              Gecelik fiyatlar, oda olanakları ve LookPrice VIP esnek iptal avantajları
            </p>
            <div className="w-12 h-1 bg-amber-600 mx-auto rounded-full mt-2" />
          </div>

          {/* HOTEL CONCEPT & AMENITIES BAR */}
          <div className="mb-10 p-6 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl text-white shadow-xl space-y-4 border border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {store.name} Tesis Olanakları & Konsept Hizmetler
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Giriş: <strong className="text-amber-400">{store.branding?.check_in_time || "14:00"}</strong> • Çıkış: <strong className="text-amber-400">{store.branding?.check_out_time || "12:00"}</strong>
                  </p>
                </div>
              </div>

              {store.branding?.cancellation_policy && (
                <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate max-w-xs">{store.branding.cancellation_policy}</span>
                </div>
              )}
            </div>

            {/* AMENITIES PILLS */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(store.branding?.hotel_amenities && store.branding.hotel_amenities.length > 0
                ? store.branding.hotel_amenities
                : ["Açık Havuz", "SPA & Wellness", "Özel Plaj", "Ücretsiz Wi-Fi", "Vale & Otopark", "Restoran & Bar", "24/7 Resepsiyon"]
              ).map((amenityItem: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-stone-800/80 border border-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{amenityItem}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => {
              const baseBBPrice = room.price_per_night || 2500;
              const flexDiscountRate = room.non_refundable_discount || 15;
              const nonRefundablePrice = Math.round(baseBBPrice * (1 - flexDiscountRate / 100));
              const roomPhotoList = room.images && room.images.length > 0 ? room.images : [room.cover_image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"];

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-stone-200/80 hover:border-amber-600/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* PHOTO COVER WITH GALLERY BADGE */}
                    <div className="relative h-56 w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={() => { setViewDetailRoom(room); setActiveDetailImageIndex(0); }}>
                      <img
                        src={roomPhotoList[0]}
                        alt={room.room_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-stone-700">
                        Oda #{room.room_number}
                      </div>
                      {room.status === 'vacant' ? (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Müsait
                        </div>
                      ) : room.status === 'occupied' ? (
                        <div className="absolute top-3 right-3 bg-amber-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Dolu
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-slate-700 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(room.status as string) === 'cleaning' ? 'Temizlikte' : 'Bakımda'}
                        </div>
                      )}

                      {/* MULTI PHOTO GALLERY BADGE */}
                      <div className="absolute bottom-3 left-3 bg-stone-900/80 hover:bg-stone-900 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform group-hover:scale-105">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>{roomPhotoList.length} Fotoğraf</span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5 space-y-3.5">
                      <div>
                        <h3 className="font-serif font-black text-stone-900 text-lg group-hover:text-amber-700 transition-colors flex items-center justify-between">
                          <span>{room.room_type}</span>
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-stone-500 font-bold mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-stone-400" />
                            Maks {room.capacity} Kişi
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                            {room.bed_info || 'Çift Kişilik Yatak'}
                          </span>
                        </div>
                      </div>

                      {/* AMENITIES BADGES */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.amenities.slice(0, 5).map((amenity, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200/60">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* BOARD RATES TABLE (BOOKING.COM STYLE) */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1.5 text-xs">
                        <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Pansiyon Seçeneği</span>
                          <span>Gecelik Tutar</span>
                        </div>

                        <div className="flex justify-between items-center font-bold text-stone-700">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" />
                            Oda + Kahvaltı (BB)
                          </span>
                          <span className="text-stone-900 font-black">₺{baseBBPrice.toLocaleString('tr-TR')}</span>
                        </div>

                        {room.board_prices?.half_board && (
                          <div className="flex justify-between items-center font-medium text-stone-600">
                            <span>Yarım Pansiyon (HB)</span>
                            <span className="font-bold">₺{room.board_prices.half_board.toLocaleString('tr-TR')}</span>
                          </div>
                        )}

                        {room.board_prices?.all_inclusive && (
                          <div className="flex justify-between items-center font-medium text-stone-600">
                            <span>Her Şey Dahil (AI)</span>
                            <span className="font-bold">₺{room.board_prices.all_inclusive.toLocaleString('tr-TR')}</span>
                          </div>
                        )}
                      </div>

                      {/* NON REFUNDABLE FLEX DISCOUNT BADGE */}
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs font-bold text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="block text-[10px] text-emerald-700 font-black uppercase">Esnek İptalsiz İndirim</span>
                            <span className="text-xs font-extrabold text-emerald-800">Gece ₺{nonRefundablePrice.toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase">
                          %{flexDiscountRate} İndirimli
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="p-5 pt-0 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                    <div>
                      <span className="block text-[9px] font-black uppercase text-stone-400">Gecelik Başlangıç</span>
                      <span className="text-lg font-black text-amber-700">₺{baseBBPrice.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setViewDetailRoom(room);
                          setActiveDetailImageIndex(0);
                        }}
                        className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Camera className="w-3.5 h-3.5 text-stone-600" />
                        <span>Detaylar</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBookingRoom(room);
                          setSelectedBoardOption('BB');
                          setIsNonRefundableRate(false);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Rezerve Et</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Culinary Highlights / Menu Section */}
      {(!isHotelModuleActive || activeMode === 'menu') && (
        <section id="menu" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="text-xs text-amber-700 font-black uppercase tracking-widest">{isTr ? "SEÇKİN LEZZETLERİMİZ" : "OUR DISHES"}</div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight">
            {isTr ? "Günün Öne Çıkan Menüsü" : "Signature Specialties"}
          </h2>
          <div className="w-12 h-1 bg-amber-600 mx-auto rounded-full mt-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === "all"
                ? "bg-amber-700 text-white shadow-md shadow-amber-700/10"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
            }`}
          >
            {isTr ? "TÜMÜ" : "ALL"}
          </button>
          <button
            onClick={() => setSelectedCategory("bestsellers")}
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              selectedCategory === "bestsellers"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200/60"
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            {isTr ? "EN ÇOK SATANLAR" : "BESTSELLERS"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? "bg-amber-700 text-white shadow-md shadow-amber-700/10"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Gourmet Menu Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const productDesc = product.description || (isTr ? "Özenle hazırlanan taze, eşsiz yerel lezzetler." : "Fresh culinary specialties prepared with premium ingredients.");
              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => onViewProduct(product)}
                  className="group bg-white p-5 rounded-3xl border border-stone-200/40 hover:border-amber-700/20 shadow-sm hover:shadow-xl hover:shadow-stone-200/30 transition-all duration-300 flex gap-4 sm:gap-6 cursor-pointer relative"
                >
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Utensils className="w-8 h-8" />
                      </div>
                    )}
                    {product.is_bestseller && (
                      <div className="absolute top-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm z-10">
                        <Flame className="w-2.5 h-2.5 fill-white" />
                        {isTr ? "POPÜLER" : "POPULAR"}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-700 transition-colors leading-snug line-clamp-1">
                          {product.name}
                        </h3>
                        <span className="text-amber-700 font-black text-sm whitespace-nowrap shrink-0 ml-2">
                          {(() => {
                            let vars: any[] = [];
                            if (product.variants) {
                              if (typeof product.variants === "string") {
                                try { vars = JSON.parse(product.variants); } catch (e) { vars = []; }
                              } else if (Array.isArray(product.variants)) {
                                vars = product.variants;
                              }
                            }
                            const prices = vars.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p) && p > 0);
                            if (prices.length > 0) {
                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);
                              if (minPrice === maxPrice) {
                                return `${minPrice} ₺`;
                              } else {
                                return `${minPrice} - ${maxPrice} ₺`;
                              }
                            }
                            return `${product.price} ₺`;
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                        {productDesc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-50">
                      <span className="text-[10px] bg-stone-50 text-stone-500 px-2.5 py-1 rounded-lg font-bold border border-stone-100">
                        {product.category || (isTr ? "Genel" : "General")}
                      </span>
                      <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {isTr ? "Detayları İncele" : "View Details"} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-stone-400 font-medium">
            {isTr ? "Bu kategoride henüz ürün bulunmuyor." : "No dishes listed under this category yet."}
          </div>
        )}
      </section>
      )}

      {/* Story Section */}
      <section id="story" className="bg-stone-900 text-stone-200 py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 lg:max-w-xl">
            <span className="text-xs text-amber-500 font-black uppercase tracking-[0.2em]">{isTr ? "HİKAYEMİZ & TUTKUMUZ" : "OUR HERITAGE"}</span>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-100 tracking-tight leading-tight">
              {isTr ? "Her Lokmada Bir Lezzet Öyküsü" : "A Taste Built on Pure Culinary Love"}
            </h2>
            <div className="w-12 h-1 bg-amber-500 rounded-full" />
            <p className="text-stone-300 leading-relaxed text-sm sm:text-base font-medium">
              {store.about_text || (isTr 
                ? "Sizlere sadece yemek sunmakla kalmıyoruz; keyifle paylaşılan anlara, sıcacık sohbetlere ve unutulmaz anılara ev sahipliği yapıyoruz. En kaliteli yerel malzemeleri seçiyor, usta ellerin vizyonuyla harmanlayıp masanıza getiriyoruz."
                : "We do not just offer gourmet food; we host warm conversations, shared laughter, and beautiful memories.")}
            </p>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-stone-800">
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">%100</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Taze Ürün" : "Fresh Daily"}</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">{totalTables}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Masa Servisi" : "Tables"}</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-500 font-serif">A+</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Kalite Hizmet" : "Service Rate"}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-stone-800 rounded-[2.5rem] opacity-10 blur-xl" />
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
              alt="Atmospheric Table Setup"
              className="w-full h-80 md:h-[400px] object-cover rounded-[2rem] shadow-2xl relative z-10 border border-stone-800"
            />
          </div>
        </div>
      </section>

      {/* Opening Hours & Atmosphere Section */}
      <section id="hours" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/50 shadow-xl shadow-stone-200/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-extrabold text-stone-900 leading-none">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</h3>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Kapımız Her Gün Açık" : "Open 7 Days a Week"}</span>
                </div>
              </div>
              <p className="text-sm text-stone-500 font-medium mb-8 leading-relaxed">
                {isTr 
                  ? "Sizlere en iyi deneyimi sunmak adına haftanın her günü taze lezzetlerimiz ve güler yüzlü ekibimizle hizmetinizdeyiz." 
                  : "We welcome you 7 days a week with a warm environment, fresh ingredients, and helpful staff."}
              </p>
              
              <div className="space-y-3.5 border-t border-stone-100 pt-6">
                {[
                  { days: isTr ? "Pazartesi - Cuma" : "Monday - Friday", hours: "08:30 - 23:00" },
                  { days: isTr ? "Cumartesi" : "Saturday", hours: "09:00 - 23:30" },
                  { days: isTr ? "Pazar" : "Sunday", hours: "09:00 - 22:30" },
                ].map((schedule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-bold text-stone-700">
                    <span className="text-stone-500">{schedule.days}</span>
                    <span className="text-stone-900 font-mono">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {store.phone && (
              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">{isTr ? "REZERVASYON VE TELEFON" : "TELEPHONE & BOOKING"}</span>
                  <span className="block text-base font-black text-stone-800 mt-1">{store.phone}</span>
                </div>
                <a
                  href={`tel:${store.phone}`}
                  className="bg-stone-900 hover:bg-stone-800 text-white p-3.5 rounded-2xl transition-colors shadow-lg shadow-stone-950/10"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className="bg-amber-700 text-amber-50 p-8 rounded-[2.5rem] shadow-xl shadow-amber-900/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600 rounded-full blur-2xl opacity-40 -translate-y-12 translate-x-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 text-white rounded-2xl border border-white/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-extrabold text-white leading-none">{isTr ? "Temassız Masa Servisi" : "Contactless Ordering"}</h3>
                  <span className="text-[10px] text-amber-200 uppercase tracking-widest font-bold mt-1 block">{isTr ? "Tek Tıkla Sipariş" : "Scan & Order"}</span>
                </div>
              </div>
              
              <h4 className="text-xl md:text-2xl font-serif font-bold text-white mb-4 leading-tight">
                {isTr ? "Sıra beklemeden, yerinizden sipariş verin!" : "No lines. Just sit down, scan and enjoy!"}
              </h4>
              <p className="text-sm text-amber-100/90 leading-relaxed font-medium mb-6">
                {isTr 
                  ? "Masalarımızda yer alan QR kodları taratarak veya web sitemiz üzerinden doğrudan dijital sipariş menümüze ulaşabilirsiniz." 
                  : "Simply scan the QR code at your table or access our beautiful contactless digital menu from your phone."}
              </p>
            </div>

            <a
              href={digitalMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-amber-900 hover:bg-amber-50 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg relative z-10 transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-amber-700" />
              {isTr ? "DİJİTAL MENÜYE GİT" : "VISIT DIGITAL MENU"}
            </a>
          </div>

        </div>
      </section>

      {/* INSTAGRAM SHOWCASE & SOCIAL GRID (INSTA-STYLE) */}
      {instagramFeedEnabled && (
        <section id="instagram-grid" className="py-16 bg-white border-t border-stone-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            
            {/* Instagram Profile Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-100 pb-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                {/* Instagram Gradient Ring Avatar */}
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shrink-0">
                  <div className="p-0.5 bg-white rounded-full">
                    {(store.logo_url || store.branding?.logo_url) ? (
                      <img
                        src={store.logo_url || store.branding?.logo_url}
                        alt="Instagram Avatar"
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center text-white font-black text-lg">
                        <Instagram className="w-7 h-7 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                      {instagramHandle}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Instagram className="w-3 h-3" />
                      <span>{isTr ? "Resmi Akış" : "Official Feed"}</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium mt-1">
                    {instagramSubtitle}
                  </p>
                </div>
              </div>

              {/* Follow Button */}
              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all duration-300 flex items-center gap-2 group cursor-pointer"
              >
                <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{isTr ? "Instagram'da Takip Et" : "Follow on Instagram"}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* 1:1 Aspect-Square Instagram Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {instagramPosts.map((post: any, idx: number) => {
                const targetUrl = post.post_url || instagramProfileUrl;

                return (
                  <a
                    key={post.id || idx}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer block"
                  >
                    {/* Photo */}
                    <img
                      src={post.image_url}
                      alt={post.caption || `Instagram Post ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Instagram Badge Tag Top Right */}
                    <div className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-80 group-hover:opacity-0 transition-opacity">
                      <Instagram className="w-3.5 h-3.5" />
                    </div>

                    {/* Insta Hover Overlay */}
                    <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                      <div className="p-2 rounded-full bg-white/20 text-white backdrop-blur-md">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex items-center gap-3 text-xs font-black">
                        <span className="flex items-center gap-1 text-rose-300">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>{post.likes || (300 + idx * 47)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-stone-300">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{Math.floor((post.likes || 300) / 18)}</span>
                        </span>
                      </div>

                      {post.caption && (
                        <p className="text-[10px] font-medium text-stone-200 line-clamp-2 leading-relaxed px-1">
                          {post.caption}
                        </p>
                      )}

                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1 pt-1">
                        <span>{isTr ? "İncele" : "View"}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Bottom Caption Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 pt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{instagramTitle}</span>
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                {isTr ? "Karelerimizi etiketleyin:" : "Tag your moments:"} <strong className="text-stone-700 font-sans">{instagramHandle}</strong>
              </span>
            </div>

          </div>
        </section>
      )}

      {/* Footer & Contact */}
      <footer id="contact" className="bg-stone-950 text-stone-400 pt-20 pb-10 border-t border-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-black text-white">{store.name}</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                {isTr ? "Her damak tadına hitap eden kaliteli malzemelerle bezenmiş lezzet ve konaklama reçeteleri." : "A sensory showcase of delicious culinary delights made with love."}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex gap-3 pt-2">
                  {socialLinks.map((social, idx) => (
                    <a
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-stone-900 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-amber-500 transition-all border border-stone-800"
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "HIZLI LİNKLER" : "QUICK LINKS"}</h4>
              <ul className="space-y-2 text-xs font-semibold">
                {isHotelModuleActive && (
                  <li><a href="#rooms" onClick={() => setActiveMode('hotel')} className="hover:text-amber-500 transition-colors">{isTr ? "Otel Odaları" : "Rooms & Suites"}</a></li>
                )}
                <li><a href="#menu" onClick={() => setActiveMode('menu')} className="hover:text-amber-500 transition-colors">{isTr ? "Menümüz" : "Our Menu"}</a></li>
                <li><a href="#story" className="hover:text-amber-500 transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a></li>
                <li><a href="#hours" className="hover:text-amber-500 transition-colors">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "İLETİŞİM BİLGİLERİ" : "CONTACT US"}</h4>
              <ul className="space-y-3.5 text-xs font-semibold">
                {store.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-stone-300">{store.phone}</span>
                  </li>
                )}
                {store.address && (
                  <li className="flex items-start gap-2 leading-relaxed">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-stone-300">{store.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">{isTr ? "KONUMUMUZ" : "LOCATION"}</h4>
              {(() => {
                const mapsUrl = (store as any).google_maps_url || store.branding?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`;
                const rawEmbed = (store as any).google_maps_embed || store.branding?.google_maps_embed || "";
                let embedSrc = "";
                if (rawEmbed) {
                  const match = rawEmbed.match(/src=["']([^"']+)["']/);
                  if (match && match[1]) {
                    embedSrc = match[1];
                  } else if (rawEmbed.startsWith("http")) {
                    embedSrc = rawEmbed;
                  }
                }

                if (embedSrc) {
                  return (
                    <div className="space-y-2">
                      <div className="h-36 w-full rounded-2xl overflow-hidden border border-stone-800 bg-stone-900 shadow-inner relative">
                        <iframe
                          src={embedSrc}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Google Maps Location"
                          className="w-full h-full"
                        />
                      </div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-500 font-bold hover:underline flex items-center justify-end gap-1.5 pt-0.5"
                      >
                        <span>{isTr ? "Google Haritalar'da Aç / Yol Tarifi Al" : "Open in Google Maps / Directions"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="h-28 w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800">
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <MapPin className="w-6 h-6 text-amber-500 mb-1.5 animate-bounce" />
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1"
                      >
                        {isTr ? "Haritada Göster & Yol Tarifi" : "Show on Google Maps & Directions"} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          <div className="pt-10 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-stone-600">
            <p>© 2026 {store.name}. {isTr ? "Tüm Hakları Saklıdır." : "All Rights Reserved."}</p>
            <div className="flex items-center gap-2 text-stone-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isTr ? "LookPrice Horeca LP Güvencesiyle Sağlanmaktadır" : "Powered by LookPrice Horeca LP"}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 0: INTERACTIVE ROOM GALLERY & DETAIL MODAL */}
      {viewDetailRoom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full border border-stone-200 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto relative">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setViewDetailRoom(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 pr-10">
              <div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-lg">
                  Oda #{viewDetailRoom.room_number} • {viewDetailRoom.room_type}
                </span>
                <h3 className="text-xl font-serif font-black text-stone-900 mt-1">
                  Oda Özellikleri & Fotoğraf Galerisi
                </h3>
              </div>
            </div>

            {/* MAIN GALLERY SLIDER */}
            {(() => {
              const galleryPhotos = (viewDetailRoom.images && viewDetailRoom.images.length > 0)
                ? viewDetailRoom.images
                : [viewDetailRoom.cover_image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"];
              const currentPhotoIndex = activeDetailImageIndex % galleryPhotos.length;

              return (
                <div className="space-y-3">
                  <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-stone-900 shadow-inner group">
                    <img
                      src={galleryPhotos[currentPhotoIndex]}
                      alt={`Room Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-300"
                    />

                    {galleryPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveDetailImageIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-xs cursor-pointer"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDetailImageIndex((prev) => (prev + 1) % galleryPhotos.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-xs cursor-pointer"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-3 right-3 bg-stone-900/80 text-white text-xs font-black px-3 py-1 rounded-xl backdrop-blur-md">
                      {currentPhotoIndex + 1} / {galleryPhotos.length}
                    </div>
                  </div>

                  {/* THUMBNAILS STRIP */}
                  {galleryPhotos.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {galleryPhotos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveDetailImageIndex(idx)}
                          className={`w-20 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                            idx === currentPhotoIndex ? "border-amber-600 ring-2 ring-amber-500/30 scale-105" : "border-stone-200 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={photoUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ROOM SPECIFICATIONS & DESCRIPTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-amber-600" />
                  <span>Kapasite & Yatak Düzeni</span>
                </h4>
                <div className="space-y-1.5 text-xs text-stone-700 font-bold">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Konaklama Kapasitesi:</span>
                    <span>Maksimum {viewDetailRoom.capacity} Yetişkin / Çocuk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Yatak Tipi:</span>
                    <span>{viewDetailRoom.bed_info || "Çift Kişilik King Yatak"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Durum:</span>
                    <span className="text-emerald-700 font-black">Hazır & Temiz (Müsait)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Başlangıç Fiyat Tarifesi</span>
                </h4>
                <div className="space-y-1.5 text-xs text-stone-700 font-bold">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Oda + Kahvaltı (BB):</span>
                    <span className="text-amber-700 font-black">₺{(viewDetailRoom.price_per_night || 2500).toLocaleString('tr-TR')} / Gece</span>
                  </div>
                  {viewDetailRoom.non_refundable_discount && (
                    <div className="flex justify-between text-emerald-700 font-black">
                      <span>Esnek İptalsiz İndirim (%{viewDetailRoom.non_refundable_discount}):</span>
                      <span>₺{Math.round((viewDetailRoom.price_per_night || 2500) * (1 - viewDetailRoom.non_refundable_discount / 100)).toLocaleString('tr-TR')} / Gece</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            {viewDetailRoom.description && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs text-stone-700 leading-relaxed font-medium">
                <p className="font-bold text-amber-900 mb-1">Oda Tanımı & Detaylar:</p>
                {viewDetailRoom.description}
              </div>
            )}

            {/* AMENITIES TAGS */}
            {viewDetailRoom.amenities && viewDetailRoom.amenities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">Oda İçi Sunulan Olanaklar</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewDetailRoom.amenities.map((amenity, idx) => (
                    <span key={idx} className="px-3 py-1 bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>{amenity}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL FOOTER ACTION */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-3">
              <div>
                <span className="block text-[10px] font-black uppercase text-stone-400">Başlangıç Fiyatı</span>
                <span className="text-xl font-black text-amber-700">₺{(viewDetailRoom.price_per_night || 2500).toLocaleString('tr-TR')}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const roomToBook = viewDetailRoom;
                  setViewDetailRoom(null);
                  setSelectedBookingRoom(roomToBook);
                  setSelectedBoardOption('BB');
                  setIsNonRefundableRate(false);
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Bu Odada Konakla & Rezerve Et</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LOOKPRICE LIVE RESERVATION ENGINE & TRANSPARENT BREAKDOWN TABLE */}
      {selectedBookingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Oda #{selectedBookingRoom.room_number} Online Rezervasyon
                </h3>
                <p className="text-xs text-stone-500 font-bold">
                  {selectedBookingRoom.room_type} • {currentNights} Gece Konaklama
                </p>
              </div>
              <button onClick={() => setSelectedBookingRoom(null)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReservation} className="space-y-4">
              
              {/* DATES & NIGHTS SUMMARY */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                <div>
                  <span className="block text-[10px] text-amber-700 uppercase font-black">Tarih Aralığı</span>
                  <span>{searchCheckIn} ➔ {searchCheckOut}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-amber-700 uppercase font-black">Süre & Misafir</span>
                  <span className="text-amber-800 dark:text-amber-300 font-extrabold">
                    {currentNights} Gece • {searchAdults} Yetişkin{searchChildrenList.length > 0 ? `, ${searchChildrenList.length} Çocuk` : ''}
                  </span>
                </div>
              </div>

              {/* BOARD OPTION SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-stone-500">1. Pansiyon Tipinizi Seçin</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'RO', label: 'Sadece Oda (RO)', price: getSelectedBoardPrice(selectedBookingRoom, 'RO') },
                    { key: 'BB', label: 'Oda + Kahvaltı (BB)', price: getSelectedBoardPrice(selectedBookingRoom, 'BB') },
                    { key: 'HB', label: 'Yarım Pansiyon (HB)', price: getSelectedBoardPrice(selectedBookingRoom, 'HB') },
                    { key: 'AI', label: 'Her Şey Dahil (AI)', price: getSelectedBoardPrice(selectedBookingRoom, 'AI') },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedBoardOption(opt.key as any)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        selectedBoardOption === opt.key
                          ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                          : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{opt.label}</span>
                        <span className="font-mono">₺{opt.price.toLocaleString('tr-TR')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* REFUNDABLE RATE TOGGLE */}
              {selectedBookingRoom.non_refundable_discount && (
                <div
                  onClick={() => setIsNonRefundableRate(!isNonRefundableRate)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                    isNonRefundableRate
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-stone-50 border-stone-200 text-stone-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isNonRefundableRate ? 'text-emerald-600' : 'text-stone-400'}`} />
                    <div>
                      <span className="block font-black">⚡ İptal Edilemez Fiyat (%{selectedBookingRoom.non_refundable_discount} Ek İndirim)</span>
                      <span className="text-[10px] text-stone-500 font-medium">Anında ödeme onayında geçerlidir</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isNonRefundableRate}
                    onChange={() => {}}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                </div>
              )}

              {/* TRANSPARENT CALCULATION BREAKDOWN TABLE (HESAP TABLOSU) */}
              {(() => {
                const breakdown = computeDetailedBreakdown(selectedBookingRoom);
                return (
                  <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                      <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Calculator className="w-3.5 h-3.5 text-amber-600" /> Detaylı Hesap Tablosu
                      </span>
                      <span className="text-[10px] font-bold text-amber-700">Şeffaf Fiyatlandırma</span>
                    </div>

                    <div className="space-y-1 text-stone-700 dark:text-stone-300">
                      {/* Adult line / Room line */}
                      <div className="flex justify-between items-center font-medium">
                        {breakdown.isPerPerson ? (
                          <span>{breakdown.adultsCount} Yetişkin x ₺{breakdown.baseNightlyPrice.toLocaleString('tr-TR')} x {breakdown.nights} Gece</span>
                        ) : (
                          <span>Oda Konaklaması (Sabit Fiyat) x {breakdown.nights} Gece</span>
                        )}
                        <span className="font-black">₺{breakdown.adultsGrossAmount.toLocaleString('tr-TR')}</span>
                      </div>

                      {/* Children lines with explicit age discount rates */}
                      {breakdown.isPerPerson && breakdown.childrenDetails.map((ch) => (
                        <div key={ch.id} className="flex justify-between items-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Baby className="w-3 h-3 text-emerald-600 shrink-0" />
                            {ch.index}. Çocuk ({ch.label}): {ch.discountText}
                          </span>
                          <span>
                            <span className="line-through text-stone-400 mr-1.5 text-[10px]">₺{ch.grossAmount.toLocaleString('tr-TR')}</span>
                            <span className="font-black">₺{ch.netAmount.toLocaleString('tr-TR')}</span>
                          </span>
                        </div>
                      ))}
                      
                      {!breakdown.isPerPerson && breakdown.childrenDetails.length > 0 && (
                        <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Baby className="w-3 h-3 text-emerald-600 shrink-0" />
                            {breakdown.childrenDetails.length} Çocuk Misafir
                          </span>
                          <span className="font-black text-[10px]">(Oda Fiyatına Dahil)</span>
                        </div>
                      )}

                      {/* Flex discount line */}
                      {breakdown.flexDiscountAmount > 0 && (
                        <div className="flex justify-between items-center font-bold text-emerald-700 dark:text-emerald-400">
                          <span>Esnek İptalsiz İndirimi (%{selectedBookingRoom.non_refundable_discount})</span>
                          <span>-₺{breakdown.flexDiscountAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-200 dark:border-stone-700 pt-2 flex justify-between items-center font-black text-stone-900 dark:text-white">
                      <span className="uppercase text-[10px] tracking-wider">Toplam Ödenecek Tutar</span>
                      <span className="text-base text-amber-600 font-mono">₺{breakdown.finalPayableTotal.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* GUEST DETAILS FORM */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <label className="text-[10px] font-black uppercase text-stone-500">2. İletişim & Konaklayan Bilgileri</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Adınız *"
                    value={bookingGuestForm.first_name}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, first_name: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Soyadınız *"
                    value={bookingGuestForm.last_name}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, last_name: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="TC / Pasaport No"
                    value={bookingGuestForm.identity_no}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, identity_no: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Telefon (+90 5XX) *"
                    value={bookingGuestForm.phone}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, phone: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <textarea
                    rows={1}
                    placeholder="Özel İstekler (Balayı süslemesi, deniz manzarası vb.)"
                    value={bookingGuestForm.special_requests}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, special_requests: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <label className="text-[10px] font-black uppercase text-stone-500">3. Ödeme Yöntemi Seçimi</label>
                
                {availableHotelPaymentMethods.length > 0 ? (
                  <div className={`grid ${availableHotelPaymentMethods.length === 1 ? 'grid-cols-1' : availableHotelPaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                    {availableHotelPaymentMethods.map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(pm.id)}
                        className={`p-2.5 rounded-xl border text-center text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          selectedPaymentMethod === pm.id
                            ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {pm.icon}
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                    Rezervasyon ve ödeme yöntemleri için lütfen işletmemizle doğrudan iletişime geçiniz.
                  </div>
                )}

                {/* CONDITIONAL PAYMENT INPUTS */}
                {selectedPaymentMethod === 'credit_card' && isHotelCreditCardActive && (
                  <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-stone-500 block">Sanal POS Kredi Kartı Bilgileri</span>
                    <input
                      type="text"
                      placeholder="Kart Üzerindeki İsim"
                      value={creditCardForm.cardHolder}
                      onChange={(e) => setCreditCardForm({ ...creditCardForm, cardHolder: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="4543 **** **** 1234"
                        value={creditCardForm.cardNumber}
                        onChange={(e) => setCreditCardForm({ ...creditCardForm, cardNumber: e.target.value })}
                        className="col-span-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold font-mono"
                      />
                      <input
                        type="text"
                        placeholder="AA/YY"
                        value={creditCardForm.expiry}
                        onChange={(e) => setCreditCardForm({ ...creditCardForm, expiry: e.target.value })}
                        className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-center"
                      />
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'bank_transfer' && isHotelBankTransferActive && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 space-y-1.5">
                    <span className="block text-[10px] uppercase font-black text-amber-700">Otel Banka Hesap Bilgileri (IBAN)</span>
                    <p className="font-mono text-[11px] whitespace-pre-line select-all bg-white/80 p-2.5 rounded-xl border border-amber-200/80 font-semibold text-slate-800 leading-relaxed">{hotelBankDetailsText}</p>
                    <p className="text-[10px] font-medium text-amber-800">Açıklamaya adınızı ve oda numaranızı (#101) yazınız.</p>
                  </div>
                )}
              </div>

              {/* TOTAL AMOUNT & CONFIRMATION SUBMIT */}
              <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between shadow-lg pt-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Toplam Konaklama Tutarı</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    ₺{computeTotalBookingPrice(selectedBookingRoom).toLocaleString('tr-TR')}
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Rezervasyonu Tamamla</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLETED RESERVATION VOUCHER MODAL */}
      {completedReservationVoucher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* VOUCHER HEADER */}
            <div className="text-center space-y-2 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
                Rezervasyonunuz Başarıyla Alındı!
              </h3>
              <p className="text-xs text-stone-500 font-bold">
                Rezervasyon Kodunuz: <span className="text-stone-900 dark:text-amber-400 font-mono font-black">{completedReservationVoucher.code}</span>
              </p>
            </div>

            {/* VOUCHER SUMMARY DETAILS */}
            <div className="bg-stone-50 dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200/80 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Oda & Tipi</span>
                <span className="font-black text-stone-900 dark:text-stone-100">
                  Oda #{completedReservationVoucher.room.room_number} ({completedReservationVoucher.room.room_type})
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Tarih / Süre</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {completedReservationVoucher.checkIn} ➔ {completedReservationVoucher.checkOut} ({completedReservationVoucher.nights} Gece)
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Pansiyon & Ödeme</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {completedReservationVoucher.boardName} • {completedReservationVoucher.paymentLabel}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Misafir</span>
                <span className="font-black text-stone-900 dark:text-stone-100">
                  {completedReservationVoucher.guest.first_name} {completedReservationVoucher.guest.last_name}
                </span>
              </div>

              {/* BREAKDOWN DISPLAY */}
              <div className="pt-1">
                <span className="text-[10px] font-black uppercase text-stone-400 block mb-1">Hesap Ekstresi</span>
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{completedReservationVoucher.adultsCount} Yetişkin Konaklama</span>
                    <span>₺{completedReservationVoucher.breakdown.adultsGrossAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  {completedReservationVoucher.breakdown.childrenDetails.map((ch: any) => (
                    <div key={ch.id} className="flex justify-between text-emerald-700 font-bold text-[11px]">
                      <span>{ch.index}. Çocuk ({ch.label}): {ch.discountText}</span>
                      <span>₺{ch.netAmount.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                  <div className="border-t border-stone-200 pt-1 flex justify-between font-black text-amber-600 text-sm">
                    <span>Toplam Borç</span>
                    <span>₺{completedReservationVoucher.breakdown.finalPayableTotal.toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <a
                href={completedReservationVoucher.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp İle Teyit İlet</span>
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır / PDF İndir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompletedReservationVoucher(null)}
                  className="px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

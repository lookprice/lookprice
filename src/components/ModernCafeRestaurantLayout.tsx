import React, { useState, useEffect, useMemo } from "react";
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

  // ----------------------------------------------------
  // DYNAMIC PERSONALIZATION & THEME RESOLUTION
  // ----------------------------------------------------
  const activeTheme = store.branding?.digital_menu_settings?.theme || store.branding?.theme || "modern_light";
  const customPrimaryColor = store.branding?.primary_color;
  const customHeroImage = store.branding?.digital_menu_settings?.cover_image || store.branding?.hero_image_url || store.hero_image_url;
  const customHeroTitle = store.branding?.digital_menu_settings?.menu_title || store.branding?.hero_title || store.hero_title;
  const customHeroSubtitle = store.branding?.digital_menu_settings?.menu_subtitle || store.branding?.hero_subtitle || store.hero_subtitle;

  // Working Hours Resolution
  const workingHours = store.branding?.working_hours || (store as any).working_hours || {};
  const weekdayHours = workingHours.weekdays || "08:30 - 23:00";
  const isSatClosed = Boolean(workingHours.is_saturday_closed);
  const satHours = isSatClosed ? (isTr ? "Kapalı" : "Closed") : (workingHours.saturday || "09:00 - 23:30");
  const isSunClosed = Boolean(workingHours.is_sunday_closed);
  const sunHours = isSunClosed ? (isTr ? "Kapalı" : "Closed") : (workingHours.sunday || "09:00 - 22:30");
  const hoursNote = workingHours.note || "";

  // Real-time Live Open / Closed Calculation
  const isStoreCurrentlyOpen = useMemo(() => {
    try {
      const now = new Date();
      const day = now.getDay(); // 0: Sunday, 6: Saturday
      if (day === 0 && isSunClosed) return false;
      if (day === 6 && isSatClosed) return false;
      
      let range = weekdayHours;
      if (day === 6) range = workingHours.saturday || "09:00 - 23:30";
      else if (day === 0) range = workingHours.sunday || "09:00 - 22:30";

      const parts = range.split("-").map(s => s.trim());
      if (parts.length !== 2) return true;
      const [startH, startM] = parts[0].split(":").map(Number);
      const [endH, endM] = parts[1].split(":").map(Number);
      if (isNaN(startH) || isNaN(endH)) return true;

      const currentMins = now.getHours() * 60 + now.getMinutes();
      const startMins = startH * 60 + (startM || 0);
      let endMins = endH * 60 + (endM || 0);
      if (endMins < startMins) endMins += 24 * 60; // spans past midnight

      return currentMins >= startMins && currentMins <= endMins;
    } catch {
      return true;
    }
  }, [weekdayHours, isSatClosed, isSunClosed, workingHours]);

  const isDarkTheme = activeTheme === "dark_bistro";
  const isAmberTheme = activeTheme === "warm_amber";
  const isEmeraldTheme = activeTheme === "fresh_emerald";
  const isLightTheme = !isDarkTheme && !isAmberTheme && !isEmeraldTheme;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDarkTheme ? "bg-slate-950 text-slate-100" :
      isAmberTheme ? "bg-stone-50 text-stone-900" :
      isEmeraldTheme ? "bg-emerald-50/20 text-slate-900" :
      "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Dynamic Navigation Bar */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors shadow-xs ${
        isDarkTheme ? "bg-slate-950/95 border-slate-800/80 text-white" :
        isAmberTheme ? "bg-stone-900/95 border-stone-800 text-amber-50" :
        isEmeraldTheme ? "bg-slate-900/95 border-emerald-950 text-emerald-50" :
        "bg-white/95 border-slate-200/90 text-slate-900"
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {(store.logo_url || store.branding?.logo_url) ? (
              <img
                src={store.logo_url || store.branding?.logo_url}
                alt={store.name}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-xs shrink-0"
              />
            ) : (
              <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm border shrink-0 ${
                isLightTheme ? "bg-slate-100 text-slate-900 border-slate-200" : "bg-slate-900 text-slate-100 border-slate-800"
              }`}>
                {store.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col justify-center min-w-0">
              <span className={`block text-xs sm:text-sm font-black tracking-tight leading-tight whitespace-nowrap ${
                isLightTheme ? "text-slate-900" : "text-white"
              }`}>
                {store.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isStoreCurrentlyOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase font-mono whitespace-nowrap ${
                  isLightTheme ? "text-slate-500" : "text-slate-400"
                }`}>
                  {isStoreCurrentlyOpen ? (isTr ? "Şu An Açık" : "Open Now") : (isTr ? "Şu An Kapalı" : "Closed")}
                  {" • "}
                  {store.branding?.slogan || (isHotelModuleActive ? (isTr ? "Resort & Gastronomi" : "Resort & Gastronomy") : (isTr ? "Gurme Lezzetler & Kafe" : "Gourmet Flavors"))}
                </span>
              </div>
            </div>
          </div>

          {/* DUAL-AURA MODE SWITCHER (RESTAURANT <---> OTEL) */}
          {isHotelModuleActive && (
            <div className={`p-1 rounded-xl border flex items-center gap-1 shrink-0 ${
              isLightTheme ? "bg-slate-100 border-slate-200" : "bg-slate-900/90 border-slate-800"
            }`}>
              <button
                onClick={() => setActiveMode('hotel')}
                title={isTr ? "Otel & Rezerve Et" : "Hotel & Rooms"}
                className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  activeMode === 'hotel'
                    ? (isLightTheme ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-950 shadow-xs")
                    : (isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100")
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{isTr ? "Otel & Rezerve Et" : "Hotel & Rooms"}</span>
              </button>

              <button
                onClick={() => setActiveMode('menu')}
                title={isTr ? "Restoran & Menü" : "Restaurant Menu"}
                className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  activeMode === 'menu'
                    ? (isLightTheme ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-950 shadow-xs")
                    : (isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-slate-100")
                }`}
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{isTr ? "Restoran & Menü" : "Restaurant Menu"}</span>
              </button>
            </div>
          )}

          {/* MICRO WRITTEN MENU LINKS */}
          <nav className={`hidden lg:flex items-center gap-3 xl:gap-5 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
            isLightTheme ? "text-slate-600" : "text-slate-400"
          }`}>
            {isHotelModuleActive && (
              <a href="#rooms" onClick={() => setActiveMode('hotel')} className={isLightTheme ? "hover:text-slate-900 transition-colors" : "hover:text-white transition-colors"}>
                {isTr ? "Otel Odaları" : "Rooms & Suites"}
              </a>
            )}
            <a href="#menu" onClick={() => setActiveMode('menu')} className={isLightTheme ? "hover:text-slate-900 transition-colors" : "hover:text-white transition-colors"}>
              {isTr ? "Lezzet Menümüz" : "Our Menu"}
            </a>
            <a href="#story" className={isLightTheme ? "hover:text-slate-900 transition-colors" : "hover:text-white transition-colors"}>{isTr ? "Hikayemiz" : "Our Story"}</a>
            <a href="#hours" className={isLightTheme ? "hover:text-slate-900 transition-colors" : "hover:text-white transition-colors"}>{isTr ? "Çalışma Saatleri" : "Hours"}</a>
            <a href="#contact" className={isLightTheme ? "hover:text-slate-900 transition-colors" : "hover:text-white transition-colors"}>{isTr ? "İletişim" : "Contact"}</a>
          </nav>
        </div>
      </header>

      {/* Atmospheric High-Vibrancy Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white min-h-[50vh] md:min-h-[60vh] flex items-center px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src={activeMode === 'hotel' 
              ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1600"
              : (customHeroImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600")
            }
            alt="Hero Background"
            className="w-full h-full object-cover opacity-50 md:opacity-60 filter brightness-95 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 md:space-y-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-slate-300 text-[10px] font-extrabold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {activeMode === 'hotel' 
              ? (isTr ? "LookPrice VIP Konaklama Güvencesi" : "LookPrice VIP Hotel Experience")
              : (isTr ? "Eşsiz Gurme Lezzet Deneyimi" : "An Exquisite Culinary Experience")
            }
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto font-sans"
          >
            {activeMode === 'hotel'
              ? (isTr ? "Konforlu Odalar, Unutulmaz Bir Tatil" : "Luxury Rooms & Fine Dining")
              : (store.hero_title || (isTr ? "Sıcak Bir Atmosfer, Seçkin Tatlar" : "Warm Atmosphere, Fine Tastes"))
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed"
          >
            {activeMode === 'hotel'
              ? (isTr ? "Oda kahvaltı, yarım pansiyon ve her şey dahil konaklama seçenekleriyle tatilinizin keyfini çıkarın." : "Enjoy room breakfast, half board and all inclusive options for your unforgettable stay.")
              : (store.hero_subtitle || (isTr ? "Usta şeflerimizin özenle hazırladığı taze lezzetler ve kaliteli kahve çeşitlerimizle günün her anına keyif katıyoruz." : "We elevate every moment of your day with fresh dishes masterfully crafted by our chefs."))
            }
          </motion.p>

          {/* LIVE HOTEL ROOM SEARCH BAR WIDGET */}
          {activeMode === 'hotel' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-800 text-slate-100 text-left max-w-3xl mx-auto space-y-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-300" /> Giriş Tarihi
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={searchCheckIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-300" /> Çıkış Tarihi
                  </label>
                  <input
                    type="date"
                    min={getNextDayString(searchCheckIn)}
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-300" /> Yetişkin
                  </label>
                  <div className="flex items-center gap-1 mt-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setSearchAdults(prev => Math.max(1, prev - 1))}
                      className="w-6 h-6 rounded bg-slate-900 font-black text-xs text-slate-300 flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-black text-xs text-white">{searchAdults} Yetişkin</span>
                    <button
                      type="button"
                      onClick={() => setSearchAdults(prev => Math.min(8, prev + 1))}
                      className="w-6 h-6 rounded bg-slate-900 font-black text-xs text-slate-300 flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-300" /> Pansiyon
                  </label>
                  <select
                    value={searchBoardType}
                    onChange={(e) => setSearchBoardType(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700"
                  >
                    <option value="all">Tüm Pansiyonlar</option>
                    <option value="BB">Oda + Kahvaltı (BB)</option>
                    <option value="HB">Yarım Pansiyon (HB)</option>
                    <option value="AI">Her Şey Dahil (AI)</option>
                    <option value="RO">Sadece Oda (RO)</option>
                  </select>
                </div>
              </div>

              {/* CHILD GUEST SELECTION */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Baby className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-black text-white">
                      Çocuk Misafir ({searchChildrenList.length})
                    </span>
                    <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      Yaş Grubu İndirimli
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChild}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-black px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Çocuk Ekle</span>
                  </button>
                </div>

                {searchChildrenList.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {searchChildrenList.map((child, idx) => {
                      const ageInfo = calculateGuestAgeInfo(child.birth_date, dynamicAgePolicy);
                      return (
                        <div key={child.id} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-black text-[9px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase">Doğum Tarihi</span>
                              <input
                                type="date"
                                value={child.birth_date}
                                onChange={(e) => handleUpdateChildBirthDate(child.id, e.target.value)}
                                className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs font-bold text-white"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                              {ageInfo.discountText}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1 text-slate-300 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {currentNights} Gece Konaklama
                </span>
                <a
                  href="#rooms"
                  className="bg-slate-100 hover:bg-white text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Odaları Göster</span>
                </a>
              </div>
            </motion.div>
          )}

          {activeMode === 'menu' && store.whatsapp_number && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-3 pt-2"
            >
              <a
                href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-100 font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{isTr ? "Rezervasyon / İletişim" : "Make a Reservation"}</span>
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* LOOKPRICE HOTEL ROOM SHOWCASE SECTION */}
      {isHotelModuleActive && activeMode === 'hotel' && (
        <section id="rooms" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-300" />
              <span>OTEL KONAKLAMA & SÜİTLER</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-sans">
              Müsait Odalar ve Pansiyon Seçenekleri
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              Gecelik fiyatlar, oda olanakları ve LookPrice VIP esnek iptal avantajları
            </p>
          </div>

          {/* HOTEL CONCEPT & AMENITIES BAR */}
          <div className="mb-8 p-4 sm:p-5 bg-slate-900 rounded-2xl text-slate-100 shadow-lg space-y-3 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-200 border border-slate-700">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {store.name} Tesis Olanakları & Konsept Hizmetler
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Giriş: <strong className="text-slate-200">{store.branding?.check_in_time || "14:00"}</strong> • Çıkış: <strong className="text-slate-200">{store.branding?.check_out_time || "12:00"}</strong>
                  </p>
                </div>
              </div>

              {store.branding?.cancellation_policy && (
                <div className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-[10px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-xs">{store.branding.cancellation_policy}</span>
                </div>
              )}
            </div>

            {/* AMENITIES PILLS */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(store.branding?.hotel_amenities && store.branding.hotel_amenities.length > 0
                ? store.branding.hotel_amenities
                : ["Açık Havuz", "SPA & Wellness", "Özel Plaj", "Ücretsiz Wi-Fi", "Vale & Otopark", "Restoran & Bar", "24/7 Resepsiyon"]
              ).map((amenityItem: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{amenityItem}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const baseBBPrice = room.price_per_night || 2500;
              const flexDiscountRate = room.non_refundable_discount || 15;
              const nonRefundablePrice = Math.round(baseBBPrice * (1 - flexDiscountRate / 100));
              const roomPhotoList = room.images && room.images.length > 0 ? room.images : [room.cover_image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"];

              return (
                <div
                  key={room.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 shadow-sm transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* PHOTO COVER */}
                    <div className="relative h-48 w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => { setViewDetailRoom(room); setActiveDetailImageIndex(0); }}>
                      <img
                        src={roomPhotoList[0]}
                        alt={room.room_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-950/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-800">
                        Oda #{room.room_number}
                      </div>
                      {room.status === 'vacant' ? (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Müsait
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 bg-slate-800 text-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {room.status === 'occupied' ? 'Dolu' : 'Bakımda'}
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs text-slate-200 text-[9px] font-black px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-300" />
                        <span>{roomPhotoList.length} Fotoğraf</span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-black text-white text-base group-hover:text-slate-200 transition-colors flex items-center justify-between font-sans">
                          <span>{room.room_type}</span>
                        </h3>
                        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            Maks {room.capacity} Kişi
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3 text-slate-500" />
                            {room.bed_info || 'Çift Kişilik Yatak'}
                          </span>
                        </div>
                      </div>

                      {/* BOARD RATES TABLE */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Pansiyon Tipi</span>
                          <span>Gecelik Tutar</span>
                        </div>

                        <div className="flex justify-between items-center font-bold text-slate-200 text-[11px]">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Oda + Kahvaltı (BB)
                          </span>
                          <span className="text-white font-black">₺{baseBBPrice.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="p-4 pt-0 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-3">
                    <div>
                      <span className="block text-[8px] font-black uppercase text-slate-400">Gecelik</span>
                      <span className="text-base font-black text-white">₺{baseBBPrice.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewDetailRoom(room);
                          setActiveDetailImageIndex(0);
                        }}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Detay
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBookingRoom(room);
                          setSelectedBoardOption('BB');
                          setIsNonRefundableRate(false);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-white text-slate-950 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Building2 className="w-3.5 h-3.5" />
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
        <section id="menu" className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors`}>
        <div className="text-center max-w-xl mx-auto space-y-1.5 mb-8">
          <div className={`text-[10px] font-extrabold uppercase tracking-widest ${
            isLightTheme ? "text-slate-500" : isAmberTheme ? "text-amber-600" : isEmeraldTheme ? "text-emerald-600" : "text-slate-400"
          }`}>{isTr ? "SEÇKİN LEZZETLERİMİZ" : "OUR DISHES"}</div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight font-sans ${
            isLightTheme ? "text-slate-900" : "text-white"
          }`}>
            {isTr ? "Günün Öne Çıkan Menüsü" : "Signature Specialties"}
          </h2>
        </div>

        {/* COMPACT MICRO CATEGORY TABS */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === "all"
                ? (isLightTheme ? "bg-slate-900 text-white shadow-xs" : isAmberTheme ? "bg-amber-600 text-white shadow-xs" : isEmeraldTheme ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-950 shadow-xs")
                : (isLightTheme ? "bg-white text-slate-700 hover:text-slate-950 border border-slate-200" : "bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800")
            }`}
          >
            {isTr ? "TÜMÜ" : "ALL"}
          </button>
          <button
            onClick={() => setSelectedCategory("bestsellers")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "bestsellers"
                ? (isLightTheme ? "bg-slate-900 text-white shadow-xs" : isAmberTheme ? "bg-amber-600 text-white shadow-xs" : isEmeraldTheme ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-950 shadow-xs")
                : (isLightTheme ? "bg-white text-slate-700 hover:text-slate-950 border border-slate-200" : "bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800")
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400" />
            {isTr ? "EN ÇOK SATANLAR" : "BESTSELLERS"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? (isLightTheme ? "bg-slate-900 text-white shadow-xs" : isAmberTheme ? "bg-amber-600 text-white shadow-xs" : isEmeraldTheme ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-950 shadow-xs")
                  : (isLightTheme ? "bg-white text-slate-700 hover:text-slate-950 border border-slate-200" : "bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-800")
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Gourmet Menu Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => {
              const productDesc = product.description || (isTr ? "Özenle hazırlanan taze, eşsiz yerel lezzetler." : "Fresh culinary specialties prepared with premium ingredients.");
              return (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onViewProduct(product)}
                  className={`group p-3.5 sm:p-4 rounded-xl border shadow-xs transition-all duration-200 flex gap-3 sm:gap-4 cursor-pointer relative ${
                    isLightTheme ? "bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-xs" :
                    isAmberTheme ? "bg-white border-amber-200/80 hover:border-amber-400 text-stone-900 shadow-xs" :
                    isEmeraldTheme ? "bg-white border-emerald-100 hover:border-emerald-300 text-slate-900 shadow-xs" :
                    "bg-slate-900 border-slate-800/80 hover:border-slate-700 text-white"
                  }`}
                >
                  <div className={`relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 rounded-lg overflow-hidden border ${
                    isLightTheme ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
                  }`}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-100 filter brightness-100"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isLightTheme ? "text-slate-400" : "text-slate-600"}`}>
                        <Utensils className="w-6 h-6" />
                      </div>
                    )}
                    {product.is_bestseller && (
                      <div className="absolute top-1 left-1 bg-slate-950/90 text-amber-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-0.5 z-10">
                        <Flame className="w-2 h-2 text-amber-400 fill-amber-400" />
                        <span>POPÜLER</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`font-bold text-sm transition-colors leading-snug line-clamp-1 ${
                          isLightTheme ? "text-slate-900 group-hover:text-amber-700" : "text-white group-hover:text-slate-200"
                        }`}>
                          {product.name}
                        </h3>
                        <span className={`font-black text-xs whitespace-nowrap shrink-0 ml-1 ${
                          isLightTheme ? "text-slate-900" : "text-slate-100"
                        }`}>
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
                      <p className={`text-[11px] font-normal mt-1 line-clamp-2 leading-relaxed ${
                        isLightTheme ? "text-slate-500" : "text-slate-400"
                      }`}>
                        {productDesc}
                      </p>
                    </div>

                    <div className={`flex items-center justify-between mt-2 pt-1.5 border-t ${
                      isLightTheme ? "border-slate-100" : "border-slate-800/60"
                    }`}>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase ${
                        isLightTheme ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}>
                        {product.category || (isTr ? "Genel" : "General")}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${
                        isLightTheme ? "text-slate-700" : "text-slate-300"
                      }`}>
                        {isTr ? "İncele" : "View"} <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-medium text-xs">
            {isTr ? "Bu kategoride henüz ürün bulunmuyor." : "No dishes listed under this category yet."}
          </div>
        )}
      </section>
      )}

      {/* Story Section */}
      <section id="story" className={`py-16 border-t ${
        isLightTheme ? "bg-slate-100/70 text-slate-900 border-slate-200" :
        isAmberTheme ? "bg-amber-900/10 text-stone-900 border-amber-200/50" :
        isEmeraldTheme ? "bg-emerald-950/10 text-slate-900 border-emerald-100" :
        "bg-slate-950 text-slate-200 border-slate-900"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 lg:max-w-xl">
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isLightTheme ? "text-slate-500" : isAmberTheme ? "text-amber-700" : isEmeraldTheme ? "text-emerald-700" : "text-slate-400"
            }`}>{isTr ? "HİKAYEMİZ & TUTKUMUZ" : "OUR HERITAGE"}</span>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight ${
              isLightTheme ? "text-slate-900" : "text-white"
            }`}>
              {isTr ? "Her Lokmada Bir Lezzet Öyküsü" : "A Taste Built on Pure Culinary Love"}
            </h2>
            <p className={`leading-relaxed text-xs sm:text-sm font-medium ${
              isLightTheme ? "text-slate-600" : "text-slate-400"
            }`}>
              {store.about_text || (isTr 
                ? "Sizlere sadece yemek sunmakla kalmıyoruz; keyifle paylaşılan anlara, sıcacık sohbetlere ve unutulmaz anılara ev sahipliği yapıyoruz. En kaliteli yerel malzemeleri seçiyor, usta ellerin vizyonuyla harmanlayıp masanıza getiriyoruz."
                : "We do not just offer gourmet food; we host warm conversations, shared laughter, and beautiful memories.")}
            </p>
            <div className={`grid grid-cols-3 gap-4 pt-3 border-t ${
              isLightTheme ? "border-slate-200" : "border-slate-900"
            }`}>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>%100</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Taze Ürün" : "Fresh Daily"}</span>
              </div>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{totalTables}</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Masa Servisi" : "Tables"}</span>
              </div>
              <div>
                <span className={`block text-xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>A+</span>
                <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Kalite Hizmet" : "Service Rate"}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000"
              alt="Atmospheric Table Setup"
              className={`w-full h-64 md:h-80 object-cover rounded-2xl shadow-xl border opacity-95 filter brightness-100 ${
                isLightTheme ? "border-slate-200" : "border-slate-800"
              }`}
            />
          </div>
        </div>
      </section>

      {/* Opening Hours & Contact */}
      <section id="hours" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${
            isLightTheme ? "bg-white border-slate-200 text-slate-900" :
            isAmberTheme ? "bg-white border-amber-200 text-stone-900" :
            isEmeraldTheme ? "bg-white border-emerald-100 text-slate-900" :
            "bg-slate-900 border-slate-800 text-white"
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl border ${
                  isLightTheme ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-950 text-slate-300 border-slate-800"
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-black leading-none ${isLightTheme ? "text-slate-900" : "text-white"}`}>{isTr ? "Çalışma Saatleri" : "Opening Hours"}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isStoreCurrentlyOpen 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isStoreCurrentlyOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                      {isStoreCurrentlyOpen ? (isTr ? "Şu An Açık" : "Open") : (isTr ? "Şu An Kapalı" : "Closed")}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {hoursNote || (isTr ? "Haftanın 7 Günü Hizmetinizdeyiz" : "Open 7 Days a Week")}
                  </span>
                </div>
              </div>
              
              <div className={`space-y-2.5 border-t pt-4 ${isLightTheme ? "border-slate-100" : "border-slate-800/80"}`}>
                {[
                  { days: isTr ? "Hafta İçi (Pzt - Cuma)" : "Weekdays (Mon - Fri)", hours: weekdayHours, closed: false },
                  { days: isTr ? "Cumartesi" : "Saturday", hours: satHours, closed: isSatClosed },
                  { days: isTr ? "Pazar" : "Sunday", hours: sunHours, closed: isSunClosed },
                ].map((schedule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold">
                    <span className={isLightTheme ? "text-slate-600" : "text-slate-400"}>{schedule.days}</span>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      schedule.closed 
                        ? (isLightTheme ? "bg-red-50 text-red-700 border border-red-200" : "bg-red-950/50 text-red-300 border border-red-900")
                        : (isLightTheme ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-white border border-slate-800")
                    }`}>
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {store.phone && (
              <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isLightTheme ? "border-slate-100" : "border-slate-800/80"}`}>
                <div>
                  <span className={`block text-[9px] font-bold uppercase tracking-wider ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "REZERVASYON VE TELEFON" : "TELEPHONE & BOOKING"}</span>
                  <span className={`block text-sm font-black mt-0.5 ${isLightTheme ? "text-slate-900" : "text-white"}`}>{store.phone}</span>
                </div>
                <a
                  href={`tel:${store.phone}`}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isLightTheme ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900" : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${
            isLightTheme ? "bg-white border-slate-200 text-slate-900" :
            isAmberTheme ? "bg-white border-amber-200 text-stone-900" :
            isEmeraldTheme ? "bg-white border-emerald-100 text-slate-900" :
            "bg-slate-900 border-slate-800 text-white"
          }`}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl border ${
                  isLightTheme ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-slate-950 text-slate-300 border-slate-800"
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-black leading-none ${isLightTheme ? "text-slate-900" : "text-white"}`}>{isTr ? "Temassız Masa Servisi" : "Contactless Ordering"}</h3>
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-1 block ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{isTr ? "Masa Kodunu Taratın" : "Scan & Order"}</span>
                </div>
              </div>
              
              <h4 className={`text-lg font-bold mb-2 leading-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                {isTr ? "Sıra beklemeden, yerinizden sipariş verin!" : "No lines. Just sit down, scan and enjoy!"}
              </h4>
              <p className={`text-xs leading-relaxed font-medium ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {isTr 
                  ? "Masalarımızda yer alan QR kodları taratarak doğrudan masanıza servis talebi gönderebilirsiniz." 
                  : "Simply scan the QR code at your table to quickly request service."}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* INSTAGRAM SHOWCASE */}
      {instagramFeedEnabled && (
        <section id="instagram-grid" className="py-12 bg-slate-950 border-t border-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-900 pb-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-0.5 rounded-full bg-slate-800 border border-slate-700 shrink-0">
                  {(store.logo_url || store.branding?.logo_url) ? (
                    <img
                      src={store.logo_url || store.branding?.logo_url}
                      alt="Instagram Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-black text-white tracking-tight">
                      {instagramHandle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {instagramSubtitle}
                  </p>
                </div>
              </div>

              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>{isTr ? "Instagram'da Takip Et" : "Follow on Instagram"}</span>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {instagramPosts.map((post: any, idx: number) => {
                const targetUrl = post.post_url || instagramProfileUrl;

                return (
                  <a
                    key={post.id || idx}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition-all cursor-pointer block"
                  >
                    <img
                      src={post.image_url}
                      alt={post.caption || `Instagram Post ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                      loading="lazy"
                    />
                  </a>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* Footer & Contact */}
      <footer id="contact" className="bg-slate-950 text-slate-400 pt-12 pb-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{store.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {isTr ? "Her damak tadına hitap eden kaliteli malzemelerle bezenmiş lezzet ve konaklama reçeteleri." : "A sensory showcase of delicious culinary delights made with love."}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "HIZLI LİNKLER" : "QUICK LINKS"}</h4>
              <ul className="space-y-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {isHotelModuleActive && (
                  <li><a href="#rooms" onClick={() => setActiveMode('hotel')} className="hover:text-white transition-colors">{isTr ? "Otel Odaları" : "Rooms & Suites"}</a></li>
                )}
                <li><a href="#menu" onClick={() => setActiveMode('menu')} className="hover:text-white transition-colors">{isTr ? "Menümüz" : "Our Menu"}</a></li>
                <li><a href="#story" className="hover:text-white transition-colors">{isTr ? "Hikayemiz" : "Our Story"}</a></li>
                <li><a href="#hours" className="hover:text-white transition-colors">{isTr ? "Çalışma Saatleri" : "Opening Hours"}</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "İLETİŞİM BİLGİLERİ" : "CONTACT US"}</h4>
              <ul className="space-y-2 text-xs font-medium">
                {store.phone && (
                  <li className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{store.phone}</span>
                  </li>
                )}
                {store.address && (
                  <li className="flex items-start gap-2 leading-relaxed text-slate-300 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isTr ? "KONUMUMUZ" : "LOCATION"}</h4>
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

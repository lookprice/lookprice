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
import {
  BookingChildGuest,
  calculateGuestAgeInfo,
  BoardOptionKey,
  CompletedReservationVoucher
} from "./horeca/cafe/cafeTypes";
import { CafeRoomDetailModal } from "./horeca/cafe/CafeRoomDetailModal";
import { CafeRoomBookingModal } from "./horeca/cafe/CafeRoomBookingModal";
import { CafeBookingVoucherModal } from "./horeca/cafe/CafeBookingVoucherModal";
import { CafeInstagramFeed } from "./horeca/cafe/CafeInstagramFeed";
import { CafeFooterSection } from "./horeca/cafe/CafeFooterSection";

export { type BookingChildGuest, calculateGuestAgeInfo };

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

  // Room date availability check against maintenance, closed dates, reservations, and occupied stays
  const isRoomAvailableForDates = (room: HotelRoom, checkIn: string, checkOut: string) => {
    if (room.status === 'maintenance') return false;
    
    // 1. Check closed dates
    if (Array.isArray(room.closed_dates) && room.closed_dates.length > 0) {
      const isClosed = room.closed_dates.some(cd => cd.start_date < checkOut && cd.end_date > checkIn);
      if (isClosed) return false;
    }

    // 2. Check future reservations
    if (Array.isArray(room.reservations) && room.reservations.length > 0) {
      const hasConflict = room.reservations.some(r => r.check_in_date < checkOut && r.check_out_date > checkIn);
      if (hasConflict) return false;
    }

    // 3. In-house occupied guests (only conflict if their actual stay overlaps with searched dates)
    if (room.status === 'occupied' && room.current_guest) {
      const cgIn = room.current_guest.check_in_date;
      const cgOut = room.current_guest.check_out_date;
      if (cgIn && cgOut && cgIn < checkOut && cgOut > checkIn) {
        return false;
      }
    }

    return true;
  };

  // Room Gallery Detail Modal State
  const [viewDetailRoom, setViewDetailRoom] = useState<HotelRoom | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);

  // Booking Modal State
  const [selectedBookingRoom, setSelectedBookingRoom] = useState<HotelRoom | null>(null);
  const [selectedBoardOption, setSelectedBoardOption] = useState<BoardOptionKey>('BB');
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

  // Multi-night seasonal & special pricing resolution (Booking.com / Tatilbudur parity)
  const getNightRateForDate = (room: HotelRoom, dateStr: string, board: BoardOptionKey) => {
    // 1. Check if this specific night falls inside any special price rule
    if (Array.isArray(room.special_prices) && room.special_prices.length > 0) {
      const match = room.special_prices.find(sp => sp.start_date <= dateStr && sp.end_date >= dateStr);
      if (match) {
        const spBoard = match.board_prices;
        if (spBoard) {
          switch (board) {
            case 'RO': if (spBoard.room_only) return { price: spBoard.room_only, isSpecial: true, title: match.title }; break;
            case 'BB': if (spBoard.bed_breakfast) return { price: spBoard.bed_breakfast, isSpecial: true, title: match.title }; break;
            case 'HB': if (spBoard.half_board) return { price: spBoard.half_board, isSpecial: true, title: match.title }; break;
            case 'FB': if (spBoard.full_board) return { price: spBoard.full_board, isSpecial: true, title: match.title }; break;
            case 'AI': if (spBoard.all_inclusive) return { price: spBoard.all_inclusive, isSpecial: true, title: match.title }; break;
            case 'UAI': if (spBoard.ultra_all_inclusive) return { price: spBoard.ultra_all_inclusive, isSpecial: true, title: match.title }; break;
          }
        } else if (match.price_per_night && board === 'BB') {
          return { price: match.price_per_night, isSpecial: true, title: match.title };
        }
      }
    }

    // 2. Standard base board rate - only explicitly configured positive prices
    const bp = room.board_prices;
    const base = room.price_per_night || 2500;
    if (!bp) {
      switch (board) {
        case 'RO': return { price: room.price_room_only || 0, isSpecial: false };
        case 'BB': return { price: base, isSpecial: false };
        case 'HB': return { price: room.price_half_board || 0, isSpecial: false };
        case 'FB': return { price: room.price_full_board || 0, isSpecial: false };
        case 'AI': return { price: room.price_all_inclusive || 0, isSpecial: false };
        case 'UAI': return { price: room.price_ultra_all_inclusive || 0, isSpecial: false };
        default: return { price: base, isSpecial: false };
      }
    }
    switch (board) {
      case 'RO': return { price: bp.room_only || room.price_room_only || 0, isSpecial: false };
      case 'BB': return { price: bp.bed_breakfast || base, isSpecial: false };
      case 'HB': return { price: bp.half_board || room.price_half_board || 0, isSpecial: false };
      case 'FB': return { price: bp.full_board || room.price_full_board || 0, isSpecial: false };
      case 'AI': return { price: bp.all_inclusive || room.price_all_inclusive || 0, isSpecial: false };
      case 'UAI': return { price: bp.ultra_all_inclusive || room.price_ultra_all_inclusive || 0, isSpecial: false };
      default: return { price: base, isSpecial: false };
    }
  };

  // Get complete list of all configured board rates for a room on a given date (ignoring 0/empty boards)
  const getRoomBoardList = (room: HotelRoom, dateStr: string) => {
    // Check if any special price rule matches this date
    const specialRule = Array.isArray(room.special_prices)
      ? room.special_prices.find(sp => sp.start_date <= dateStr && sp.end_date >= dateStr)
      : null;

    const list: Array<{ 
      key: BoardOptionKey; 
      label: string; 
      price: number; 
      isSpecial: boolean; 
      specialTitle?: string 
    }> = [];

    const checkBoard = (
      key: BoardOptionKey,
      label: string,
      stdVal?: number
    ) => {
      const spVal = specialRule?.board_prices ? (specialRule.board_prices as any)[
        key === 'RO' ? 'room_only' :
        key === 'BB' ? 'bed_breakfast' :
        key === 'HB' ? 'half_board' :
        key === 'FB' ? 'full_board' :
        key === 'AI' ? 'all_inclusive' : 'ultra_all_inclusive'
      ] : undefined;

      const isConfigured = (spVal !== undefined && Number(spVal) > 0) || (stdVal !== undefined && Number(stdVal) > 0);
      const rateInfo = getNightRateForDate(room, dateStr, key);

      if (isConfigured && rateInfo.price > 0) {
        list.push({
          key,
          label,
          price: rateInfo.price,
          isSpecial: rateInfo.isSpecial,
          specialTitle: rateInfo.title
        });
      }
    };

    const bp = room.board_prices;
    checkBoard('RO', 'Sadece Oda (RO)', bp?.room_only || room.price_room_only);
    checkBoard('BB', 'Oda & Kahvaltı (BB)', bp?.bed_breakfast || room.price_per_night || 2500);
    checkBoard('HB', 'Yarım Pansiyon (HB)', bp?.half_board || room.price_half_board);
    checkBoard('FB', 'Tam Pansiyon (FB)', bp?.full_board || room.price_full_board);
    checkBoard('AI', 'Her Şey Dahil (AI)', bp?.all_inclusive || room.price_all_inclusive);
    checkBoard('UAI', 'Ultra Her Şey Dahil (UAI)', bp?.ultra_all_inclusive || room.price_ultra_all_inclusive);

    // Fallback if no board is > 0
    if (list.length === 0) {
      const baseRate = getNightRateForDate(room, dateStr, 'BB');
      list.push({
        key: 'BB',
        label: 'Oda & Kahvaltı (BB)',
        price: baseRate.price || 2500,
        isSpecial: baseRate.isSpecial,
        specialTitle: baseRate.title
      });
    }

    return list;
  };

  // Get base board rate per night for selected date
  const getSelectedBoardPrice = (room: HotelRoom, board: BoardOptionKey) => {
    const rateInfo = getNightRateForDate(room, searchCheckIn, board);
    return rateInfo.price;
  };

  // Detailed transparent price calculation table breakdown with night-by-night seasonal calculation
  const computeDetailedBreakdown = (room: HotelRoom) => {
    const nights = calculateNights(searchCheckIn, searchCheckOut);
    const isPerPerson = room.pricing_type !== 'per_room';
    
    // Night-by-night calculation for seasonal price overrides
    const nightBreakdowns: Array<{ date: string; rate: number; isSpecial: boolean; title?: string }> = [];
    const checkInDateObj = new Date(searchCheckIn);
    
    for (let i = 0; i < nights; i++) {
      const currentNightDate = new Date(checkInDateObj);
      currentNightDate.setDate(checkInDateObj.getDate() + i);
      const dateStr = currentNightDate.toISOString().split('T')[0];
      const rateInfo = getNightRateForDate(room, dateStr, selectedBoardOption);
      nightBreakdowns.push({
        date: dateStr,
        rate: rateInfo.price,
        isSpecial: rateInfo.isSpecial,
        title: rateInfo.title
      });
    }

    const totalNightlyRateSum = nightBreakdowns.reduce((acc, nb) => acc + nb.rate, 0);
    const averageNightlyPrice = Math.round(totalNightlyRateSum / nights);
    const hasSpecialPriceApplied = nightBreakdowns.some(nb => nb.isSpecial);
    const appliedSpecialTitles = Array.from(new Set(nightBreakdowns.filter(nb => nb.isSpecial && nb.title).map(nb => nb.title!)));
    
    let adultsGrossAmount = 0;
    if (isPerPerson) {
      adultsGrossAmount = searchAdults * totalNightlyRateSum;
    } else {
      adultsGrossAmount = totalNightlyRateSum;
    }

    // Calculate each child's gross, discount, and net
    const childrenDetails = searchChildrenList.map((ch, idx) => {
      const ageInfo = calculateGuestAgeInfo(ch.birth_date, dynamicAgePolicy);
      let gross = 0;
      let discountAmount = 0;
      let net = 0;
      
      if (isPerPerson) {
        gross = totalNightlyRateSum;
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
      baseNightlyPrice: averageNightlyPrice,
      totalNightlyRateSum,
      hasSpecialPriceApplied,
      appliedSpecialTitles,
      nightBreakdowns,
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
    if (!selectedBookingRoom) return;

    const firstName = (bookingGuestForm.first_name || '').trim();
    const lastName = (bookingGuestForm.last_name || '').trim();
    const idNo = (bookingGuestForm.identity_no || '').trim();

    if (!firstName || !lastName || !idNo) {
      alert("⚠️ Rezervasyon için Misafir Adı, Soyadı ve TC / Pasaport No alanları zorunludur. Lütfen bu alanları doldurunuz.");
      return;
    }

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
  const activeTheme = (
    store.branding?.digital_menu_settings?.theme ||
    (store as any).digital_menu_settings?.theme ||
    store.branding?.theme ||
    (store as any).theme ||
    store.branding?.page_layout_settings?.digital_menu_settings?.theme ||
    (store as any).page_layout_settings?.digital_menu_settings?.theme ||
    "modern_light"
  );
  const customPrimaryColor = store.branding?.digital_menu_settings?.primary_color || store.branding?.primary_color || (store as any).primary_color;
  const customHeroImage = store.branding?.digital_menu_settings?.cover_image || (store as any).digital_menu_settings?.cover_image || store.branding?.hero_image_url || store.hero_image_url || (store as any).cover_image;
  const customHeroTitle = store.branding?.digital_menu_settings?.menu_title || (store as any).digital_menu_settings?.menu_title || store.branding?.hero_title || store.hero_title;
  const customHeroSubtitle = store.branding?.digital_menu_settings?.menu_subtitle || (store as any).digital_menu_settings?.menu_subtitle || store.branding?.hero_subtitle || store.hero_subtitle;

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
              : (customHeroTitle || store.hero_title || (isTr ? "Sıcak Bir Atmosfer, Seçkin Tatlar" : "Warm Atmosphere, Fine Tastes"))
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
              : (customHeroSubtitle || store.hero_subtitle || (isTr ? "Usta şeflerimizin özenle hazırladığı taze lezzetler ve kaliteli kahve çeşitlerimizle günün her anına keyif katıyoruz." : "We elevate every moment of your day with fresh dishes masterfully crafted by our chefs."))
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
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700 cursor-pointer [color-scheme:dark]"
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
                    onClick={(e) => (e.currentTarget as any).showPicker?.()}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700 cursor-pointer [color-scheme:dark]"
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
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white shadow-xs focus:ring-1 focus:ring-slate-700 cursor-pointer"
                  >
                    <option value="all">Tüm Pansiyonlar</option>
                    <option value="RO">Sadece Oda (RO)</option>
                    <option value="BB">Oda & Kahvaltı (BB)</option>
                    <option value="HB">Yarım Pansiyon (HB)</option>
                    <option value="FB">Tam Pansiyon (FB)</option>
                    <option value="AI">Her Şey Dahil (AI)</option>
                    <option value="UAI">Ultra Her Şey Dahil (UAI)</option>
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
              const isAvailable = isRoomAvailableForDates(room, searchCheckIn, searchCheckOut);
              const boardList = getRoomBoardList(room, searchCheckIn);
              const cheapestBoard = boardList.reduce((min, b) => b.price < min.price ? b : min, boardList[0]);
              const displayedBoard = searchBoardType === 'all' ? cheapestBoard : (boardList.find(b => b.key === searchBoardType) || cheapestBoard);
              const isSpecialApplied = displayedBoard.isSpecial || boardList.some(b => b.isSpecial);
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

                      {/* DATE-SPECIFIC AVAILABILITY BADGE */}
                      {isAvailable ? (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600/95 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Müsait
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 bg-rose-600/95 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {room.status === 'maintenance' ? 'Bakımda' : 'Seçili Tarihte Dolu'}
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

                      {/* BOARD RATES TABLE FOR SELECTED DATES */}
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Pansiyon Seçenekleri</span>
                          <span>Gecelik Fiyat</span>
                        </div>

                        <div className="space-y-1">
                          {boardList.map((opt) => {
                            const isSelected = searchBoardType === 'all' 
                              ? opt.key === cheapestBoard.key 
                              : opt.key === searchBoardType;

                            return (
                              <div 
                                key={opt.key}
                                className={`flex justify-between items-center px-2 py-1 rounded-lg text-[11px] transition-colors ${
                                  isSelected 
                                    ? 'bg-slate-800/90 text-white font-black border border-slate-700' 
                                    : 'text-slate-300 font-medium hover:bg-slate-900'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                                  <span className="truncate">{opt.label}</span>
                                  {opt.isSpecial && (
                                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Özel</span>
                                  )}
                                </span>
                                <div className="flex items-center shrink-0 ml-2">
                                  <span className="font-bold text-slate-100">
                                    ₺{opt.price.toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="p-4 pt-0 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-3">
                    <div>
                      <span className="block text-[8px] font-black uppercase text-slate-400">
                        {searchBoardType === 'all' ? 'Gecelik En Uygun' : `Gecelik (${displayedBoard.label})`}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-white">
                          ₺{displayedBoard.price.toLocaleString('tr-TR')}
                        </span>
                        {searchBoardType === 'all' && (
                          <span className="text-[9px] text-slate-400 font-bold">'den başlayan</span>
                        )}
                      </div>
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
                          const defaultBoard = searchBoardType !== 'all' ? (searchBoardType as BoardOptionKey) : cheapestBoard.key;
                          setSelectedBoardOption(defaultBoard);
                          setIsNonRefundableRate(false);
                        }}
                        disabled={!isAvailable}
                        className={`px-3.5 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                          isAvailable 
                            ? "bg-slate-100 hover:bg-white text-slate-950 active:scale-95" 
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{isAvailable ? "Rezerve Et" : "Dolu"}</span>
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

      {/* Story, Opening Hours & Footer Section */}
      <CafeFooterSection
        store={store}
        isTr={isTr}
        isLightTheme={isLightTheme}
        isAmberTheme={isAmberTheme}
        isEmeraldTheme={isEmeraldTheme}
        isHotelModuleActive={isHotelModuleActive}
        totalTables={totalTables}
        isStoreCurrentlyOpen={isStoreCurrentlyOpen}
        hoursNote={hoursNote}
        weekdayHours={weekdayHours}
        satHours={satHours}
        sunHours={sunHours}
        isSatClosed={isSatClosed}
        isSunClosed={isSunClosed}
        setActiveMode={setActiveMode}
      />

      {/* INSTAGRAM SHOWCASE */}
      <CafeInstagramFeed
        enabled={instagramFeedEnabled}
        store={store}
        instagramHandle={instagramHandle}
        instagramSubtitle={instagramSubtitle}
        instagramProfileUrl={instagramProfileUrl}
        instagramPosts={instagramPosts}
        isTr={isTr}
      />

      {/* Room Detail Modal */}
      <CafeRoomDetailModal
        room={viewDetailRoom}
        onClose={() => setViewDetailRoom(null)}
        searchCheckIn={searchCheckIn}
        searchCheckOut={searchCheckOut}
        getRoomBoardList={getRoomBoardList}
        isAvailable={viewDetailRoom ? isRoomAvailableForDates(viewDetailRoom, searchCheckIn, searchCheckOut) : true}
        onBookRoom={(room) => {
          setSelectedBookingRoom(room);
          setViewDetailRoom(null);
          const boardList = getRoomBoardList(room, searchCheckIn);
          const cheapest = boardList.reduce((min, b) => b.price < min.price ? b : min, boardList[0]);
          const defaultBoard = searchBoardType !== 'all' ? (searchBoardType as BoardOptionKey) : cheapest.key;
          setSelectedBoardOption(defaultBoard);
          setIsNonRefundableRate(false);
        }}
      />

      {/* Room Booking Modal */}
      <CafeRoomBookingModal
        room={selectedBookingRoom}
        onClose={() => setSelectedBookingRoom(null)}
        onExecuteReservation={handleExecuteReservation}
        currentNights={currentNights}
        searchCheckIn={searchCheckIn}
        searchCheckOut={searchCheckOut}
        searchAdults={searchAdults}
        searchChildrenList={searchChildrenList}
        selectedBoardOption={selectedBoardOption}
        setSelectedBoardOption={setSelectedBoardOption}
        getSelectedBoardPrice={getSelectedBoardPrice}
        isNonRefundableRate={isNonRefundableRate}
        setIsNonRefundableRate={setIsNonRefundableRate}
        computeDetailedBreakdown={computeDetailedBreakdown}
        bookingGuestForm={bookingGuestForm}
        setBookingGuestForm={setBookingGuestForm}
        availableHotelPaymentMethods={availableHotelPaymentMethods}
        selectedPaymentMethod={selectedPaymentMethod}
        setSelectedPaymentMethod={setSelectedPaymentMethod}
        creditCardForm={creditCardForm}
        setCreditCardForm={setCreditCardForm}
        isHotelCreditCardActive={isHotelCreditCardActive}
        isHotelBankTransferActive={isHotelBankTransferActive}
        hotelBankDetailsText={hotelBankDetailsText}
        computeTotalBookingPrice={computeTotalBookingPrice}
      />

      {/* Reservation Voucher Modal */}
      <CafeBookingVoucherModal
        voucher={completedReservationVoucher}
        onClose={() => setCompletedReservationVoucher(null)}
      />

    </div>
  );
};

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Receipt
} from "lucide-react";
import { Store, Product } from "../types";
import { HotelRoom } from "./horeca/HotelRoomManagement";

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

  // Mode state: 'menu' (Restoran) vs 'hotel' (Otel & Konaklama)
  const [activeMode, setActiveMode] = useState<'menu' | 'hotel'>(isHotelModuleActive ? 'hotel' : 'menu');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dynamic Hotel Rooms State synced from store branding or localStorage
  const [rooms, setRooms] = useState<HotelRoom[]>(() => {
    if (store.branding?.hotel_rooms && Array.isArray(store.branding.hotel_rooms) && store.branding.hotel_rooms.length > 0) {
      return store.branding.hotel_rooms;
    }
    try {
      const saved = localStorage.getItem(`hotel_rooms_${store.id}`);
      if (saved) return JSON.parse(saved);
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
    if (store.branding?.hotel_rooms && Array.isArray(store.branding.hotel_rooms) && store.branding.hotel_rooms.length > 0) {
      setRooms(store.branding.hotel_rooms);
    }
  }, [store.branding?.hotel_rooms]);

  // Listen to window events to automatically sync room additions/edits made by the operator
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(`hotel_rooms_${store.id}`);
        if (saved) setRooms(JSON.parse(saved));
      } catch (e) {}
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
  const [searchAdults, setSearchAdults] = useState(2);
  const [searchChildren, setSearchChildren] = useState(0);
  const [searchBoardType, setSearchBoardType] = useState<string>("all");

  // Booking Modal State
  const [selectedBookingRoom, setSelectedBookingRoom] = useState<HotelRoom | null>(null);
  const [selectedBoardOption, setSelectedBoardOption] = useState<'RO' | 'BB' | 'HB' | 'FB' | 'AI'>('BB');
  const [isNonRefundableRate, setIsNonRefundableRate] = useState(false);

  const [bookingGuestForm, setBookingGuestForm] = useState({
    identity_no: "",
    first_name: "",
    last_name: "",
    phone: "",
    birth_date: "1992-06-15",
    special_requests: ""
  });

  // Calculate age & child discount
  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return 30;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  };

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

  // Calculate total price for modal
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

  const computeTotalBookingPrice = (room: HotelRoom) => {
    const basePerNight = getSelectedBoardPrice(room, selectedBoardOption);
    let total = basePerNight * currentNights;
    if (isNonRefundableRate && room.non_refundable_discount) {
      total = total * (1 - room.non_refundable_discount / 100);
    }
    return Math.round(total);
  };

  // Execute Reservation Submit
  const handleExecuteReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingRoom || !bookingGuestForm.first_name || !bookingGuestForm.last_name) return;

    const nights = calculateNights(searchCheckIn, searchCheckOut);
    const totalPrice = computeTotalBookingPrice(selectedBookingRoom);
    const boardName = selectedBoardOption === 'RO' ? 'Sadece Oda (RO)' :
                      selectedBoardOption === 'BB' ? 'Oda + Kahvaltı (BB)' :
                      selectedBoardOption === 'HB' ? 'Yarım Pansiyon (HB)' :
                      selectedBoardOption === 'FB' ? 'Tam Pansiyon (FB)' : 'Her Şey Dahil (AI)';

    const rawWa = store.whatsapp_number || store.phone || "905488902309";
    const cleanWa = rawWa.replace(/[^0-9+]/g, "");

    const waText = encodeURIComponent(
      `Merhaba ${store.name},\n\nWeb siteniz üzerinden otel oda rezervasyonu talebi iletmek istiyorum:\n` +
      `🏨 Oda: #${selectedBookingRoom.room_number} (${selectedBookingRoom.room_type})\n` +
      `📅 Giriş - Çıkış: ${searchCheckIn} ➔ ${searchCheckOut} (${nights} Gece)\n` +
      `🍽️ Pansiyon Tipi: ${boardName}\n` +
      `👥 Kişi Sayısı: ${searchAdults} Yetişkin${searchChildren > 0 ? `, ${searchChildren} Çocuk` : ''}\n` +
      `💰 Toplam Tutar: ₺${totalPrice.toLocaleString('tr-TR')}${isNonRefundableRate ? ' (%15 Esnek İndirimli)' : ''}\n` +
      `👤 Misafir: ${bookingGuestForm.first_name} ${bookingGuestForm.last_name} (TC/Pasaport: ${bookingGuestForm.identity_no || '-'})\n` +
      `📞 Tel: ${bookingGuestForm.phone || '-'}\n` +
      (bookingGuestForm.special_requests ? `📝 Özel İstek: ${bookingGuestForm.special_requests}\n` : '') +
      `\nRezervasyonumu teyit edip müsaitliği onaylar mısınız?`
    );

    // Save Guest Folio Reservation to local storage for operator dashboard sync
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
              age: calculateAge(bookingGuestForm.birth_date),
              age_category: 'adult' as const,
              discount_rate: 0,
              phone: bookingGuestForm.phone,
              check_in_date: searchCheckIn,
              check_out_date: searchCheckOut
            },
            folio: {
              id: `folio-${Date.now()}`,
              total_amount: totalPrice,
              items: [
                {
                  id: `item-${Date.now()}`,
                  title: `Konaklama (${nights} Gece - ${boardName})`,
                  amount: totalPrice,
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
    } catch (err) {}

    // Open WhatsApp direct booking request
    window.open(`https://wa.me/${cleanWa}?text=${waText}`, '_blank');
    setSelectedBookingRoom(null);
  };

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Warm Premium Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover border border-stone-200/80 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-xs shrink-0">
                {store.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-sm sm:text-base font-black tracking-tight text-stone-900 leading-none truncate">
                {store.name}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-amber-800 uppercase font-sans truncate">
                  {isHotelModuleActive ? (isTr ? "Resort Hotel & Fine Dining" : "Resort Hotel & Fine Dining") : (isTr ? "Gurme Lezzetler & Kafe" : "Gourmet Flavors")}
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
                <span className="hidden sm:inline">{isTr ? "Otel & Rezerve Et" : "Hotel & Rooms"}</span>
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
                <span className="hidden sm:inline">{isTr ? "Restoran & Menü" : "Restaurant Menu"}</span>
              </button>
            </div>
          )}

          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-stone-600">
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

          {/* LIVE HOTEL ROOM SEARCH BAR WIDGET */}
          {activeMode === 'hotel' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/20 text-stone-800 text-left max-w-4xl mx-auto space-y-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Giriş Tarihi</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={searchCheckIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Çıkış Tarihi</label>
                  <input
                    type="date"
                    min={getNextDayString(searchCheckIn)}
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Misafir Sayısı</label>
                  <select
                    value={searchAdults}
                    onChange={(e) => setSearchAdults(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                  >
                    <option value={1}>1 Yetişkin</option>
                    <option value={2}>2 Yetişkin</option>
                    <option value={3}>3 Yetişkin</option>
                    <option value={4}>4+ Aile / Grup</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">Pansiyon Tipi</label>
                  <select
                    value={searchBoardType}
                    onChange={(e) => setSearchBoardType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                  >
                    <option value="all">Tüm Pansiyonlar</option>
                    <option value="BB">Oda + Kahvaltı (BB)</option>
                    <option value="HB">Yarım Pansiyon (HB)</option>
                    <option value="AI">Her Şey Dahil (AI)</option>
                    <option value="RO">Sadece Oda (RO)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-200/60 pt-3 text-xs font-bold text-stone-600">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {currentNights} Gece Konaklama Hesaplanıyor
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
      {isHotelModuleActive && (
        <section id="rooms" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.filter(r => r.status === 'vacant' || r.status === 'occupied').map((room) => {
              const baseBBPrice = room.price_per_night || 2500;
              const flexDiscountRate = room.non_refundable_discount || 15;
              const nonRefundablePrice = Math.round(baseBBPrice * (1 - flexDiscountRate / 100));

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-stone-200/80 hover:border-amber-600/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* PHOTO COVER */}
                    <div className="relative h-52 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={room.cover_image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"}
                        alt={room.room_type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-stone-700">
                        Oda #{room.room_number}
                      </div>
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Müsait
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-5 space-y-3.5">
                      <div>
                        <h3 className="font-serif font-black text-stone-900 text-lg group-hover:text-amber-700 transition-colors">
                          {room.room_type}
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
                  <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between gap-3 mt-4">
                    <div>
                      <span className="block text-[9px] font-black uppercase text-stone-400">Gecelik Başlangıç</span>
                      <span className="text-lg font-black text-amber-700">₺{baseBBPrice.toLocaleString('tr-TR')}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBookingRoom(room);
                        setSelectedBoardOption('BB');
                        setIsNonRefundableRate(false);
                      }}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Hemen Rezerve Et</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Culinary Highlights / Menu Section */}
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
                          {product.price} ₺
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
              <div className="h-28 w-full bg-stone-900 rounded-2xl overflow-hidden border border-stone-800">
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <MapPin className="w-6 h-6 text-amber-500 mb-1.5 animate-bounce" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1"
                  >
                    {isTr ? "Haritada Göster" : "Show on Google Maps"} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
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

      {/* MODAL: LOOKPRICE LIVE RESERVATION ENGINE */}
      {selectedBookingRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Oda #{selectedBookingRoom.room_number} Online Rezervasyon
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedBookingRoom.room_type} • {currentNights} Gece Konaklama
                </p>
              </div>
              <button onClick={() => setSelectedBookingRoom(null)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
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
                  <span className="block text-[10px] text-amber-700 uppercase font-black">Süre</span>
                  <span className="text-amber-800 dark:text-amber-300 font-extrabold">{currentNights} Gece</span>
                </div>
              </div>

              {/* BOARD OPTION SELECTOR */}
              <div className="space-y-2">
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

              {/* GUEST DETAILS FORM */}
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <label className="text-[10px] font-black uppercase text-stone-500">2. Misafir Kimlik & İletişim Bilgileri</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Adınız"
                    value={bookingGuestForm.first_name}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, first_name: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Soyadınız"
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
                    placeholder="Telefon (+90 5XX)"
                    value={bookingGuestForm.phone}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, phone: e.target.value })}
                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="Özel İstekler (Genç çift balayı süslemesi, geç check-in vb.)"
                    value={bookingGuestForm.special_requests}
                    onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, special_requests: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* TOTAL AMOUNT & CONFIRMATION */}
              <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Toplam Konaklama Borcu</span>
                  <span className="text-xl font-black text-amber-400">
                    ₺{computeTotalBookingPrice(selectedBookingRoom).toLocaleString('tr-TR')}
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp ile Rezerve Et</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  Building2, 
  BedDouble, 
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Sparkles, 
  Filter, 
  FileText, 
  LogOut, 
  Receipt, 
  Wrench, 
  ShieldAlert,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Printer,
  Info,
  SlidersHorizontal,
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  CalendarDays,
  Baby,
  Smile,
  TrendingUp,
  PieChart,
  Layers,
  Activity,
  CalendarRange
} from "lucide-react";

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

export interface HotelRoom {
  id: string;
  room_number: string; // e.g., "101", "202", "SUITE-A", "BUNGLOW-1"
  room_type: string; // e.g., "Standard", "Suite", "Sea View", "Bungalow"
  capacity: number; // Max guest count
  bed_info?: string; // e.g., "1 Double + 1 Single"
  status: 'vacant' | 'occupied' | 'maintenance' | 'staff' | 'disabled';
  price_per_night?: number;
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
    phone?: string;
    check_in_date: string;
    check_out_date: string; // YYYY-MM-DD
    board_type?: 'RO' | 'BB' | 'HB' | 'FB' | 'AI' | 'UAI';
  };
  additional_guests?: Array<{
    identity_no: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    age: number;
    age_category: 'infant' | 'child' | 'adult' | 'senior';
    discount_rate: number;
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

interface HotelRoomManagementProps {
  storeId?: number;
  isTr: boolean;
  initialRooms?: HotelRoom[];
  onChargeOrderToRoom?: (roomNumber: string, amount: number, orderTitle: string) => void;
}

export const HotelRoomManagement: React.FC<HotelRoomManagementProps> = ({
  storeId,
  isTr,
  initialRooms,
  onChargeOrderToRoom
}) => {
  // Initial Rooms state synced from props, storage or default mock rooms
  const [rooms, setRooms] = useState<HotelRoom[]>(() => {
    if (initialRooms && Array.isArray(initialRooms) && initialRooms.length > 0) {
      return initialRooms;
    }
    const saved = localStorage.getItem(`hotel_rooms_${storeId || 'default'}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
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
          check_out_date: todayStr // Today check-out demo!
        },
        additional_guests: [
          {
            identity_no: "98765432109",
            first_name: "Ece",
            last_name: "Yılmaz",
            birth_date: "2020-03-10",
            age: 6,
            age_category: "infant",
            discount_rate: 100 // 0-6 age 100% free
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
  });

  // Save to localStorage, dispatch custom window sync event & persist to backend database
  useEffect(() => {
    localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(rooms));
    try {
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms } }));
    } catch (e) {}

    if (storeId) {
      api.updateBranding({ hotel_rooms: rooms }, storeId).catch(() => {});
    }
  }, [rooms, storeId]);

  // Date helper for Check-In / Check-Out constraints
  const getNextDayString = (dateStr: string) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleAdminCheckInChange = (newCheckIn: string) => {
    const minCheckOut = getNextDayString(newCheckIn);
    setGuestForm(prev => ({
      ...prev,
      check_in_date: newCheckIn,
      check_out_date: (!prev.check_out_date || prev.check_out_date <= newCheckIn) ? minCheckOut : prev.check_out_date
    }));
  };

  // Handler for uploading or taking room photo via Camera or File Gallery
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(isTr ? "Fotoğraf boyutu 8MB'dan küçük olmalıdır" : "File size must be under 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setRoomForm(prev => ({ ...prev, cover_image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Formatting Helper for Thousands Separators (e.g. 2.500 ₺)
  const formatThousand = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('tr-TR');
  };

  const parseThousand = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calendar View Mode & Age Group Analytics State
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'calendar'>('grid');
  const [calendarStartDate, setCalendarStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [calendarDaysCount, setCalendarDaysCount] = useState<30 | 60>(60);
  const [analysisPeriod, setAnalysisPeriod] = useState<'next_7' | 'next_14' | 'next_30' | 'next_60' | 'custom'>('next_60');
  const [customAnalizStart, setCustomAnalizStart] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [customAnalizEnd, setCustomAnalizEnd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [selectedReservationModal, setSelectedReservationModal] = useState<{
    room: HotelRoom;
    res: RoomReservation;
  } | null>(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'checkout_today' | 'maintenance' | 'staff'>('all');

  // Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  
  const [checkInModalRoom, setCheckInModalRoom] = useState<HotelRoom | null>(null);
  const [checkOutModalRoom, setCheckOutModalRoom] = useState<HotelRoom | null>(null);
  const [addExpenseModalRoom, setAddExpenseModalRoom] = useState<HotelRoom | null>(null);

  // Helper for date range analytics
  const getAnalizDateRange = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (analysisPeriod === 'next_7') {
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      return { start: todayStr, end: end.toISOString().split('T')[0], days: 7, title: "Gelecek 7 Gün" };
    } else if (analysisPeriod === 'next_14') {
      const start = new Date(today);
      start.setDate(start.getDate() + 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days: 7, title: "Gelecek Hafta (7-14 Gün)" };
    } else if (analysisPeriod === 'next_30') {
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return { start: todayStr, end: end.toISOString().split('T')[0], days: 30, title: "Gelecek 30 Gün (1 Ay)" };
    } else if (analysisPeriod === 'custom') {
      const s = new Date(customAnalizStart);
      const e = new Date(customAnalizEnd);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      return { start: customAnalizStart, end: customAnalizEnd, days: diffDays, title: "Özel Seçili Dönem" };
    } else {
      // next_60 default
      const end = new Date(today);
      end.setDate(end.getDate() + 60);
      return { start: todayStr, end: end.toISOString().split('T')[0], days: 60, title: "Gelecek 60 Gün (2 Ay)" };
    }
  };

  // Age group analytics calculator for selected period
  const calculateAgeBreakdownStats = () => {
    const { start, end, days } = getAnalizDateRange();
    
    let totalAdults = 0;
    let totalInfants = 0; // 0-2 yrs
    let totalToddlers = 0; // 3-6 yrs
    let totalChildren = 0; // 7-12 yrs
    let totalTeens = 0; // 13-17 yrs
    let totalNightsBooked = 0;
    let estimatedRevenue = 0;
    const boardCounts: Record<string, number> = { RO: 0, BB: 0, HB: 0, FB: 0, AI: 0, UAI: 0 };

    rooms.forEach(room => {
      const list: Array<{
        check_in: string;
        check_out: string;
        first_name: string;
        last_name: string;
        main_age?: number;
        board_type?: string;
        guests?: Array<{ age: number; birth_date?: string }>;
      }> = [];

      if (room.current_guest && room.current_guest.check_in_date && room.current_guest.check_out_date) {
        list.push({
          check_in: room.current_guest.check_in_date,
          check_out: room.current_guest.check_out_date,
          first_name: room.current_guest.first_name,
          last_name: room.current_guest.last_name,
          main_age: room.current_guest.age,
          board_type: room.current_guest.board_type || 'BB',
          guests: room.additional_guests?.map(ag => ({ age: ag.age, birth_date: ag.birth_date }))
        });
      }

      if (room.reservations && room.reservations.length > 0) {
        room.reservations.forEach(r => {
          list.push({
            check_in: r.check_in_date,
            check_out: r.check_out_date,
            first_name: r.first_name,
            last_name: r.last_name,
            main_age: r.main_guest_age || 30,
            board_type: r.board_type || 'BB',
            guests: r.guests
          });
        });
      }

      list.forEach(res => {
        if (res.check_in <= end && res.check_out >= start) {
          const sDate = new Date(res.check_in > start ? res.check_in : start);
          const eDate = new Date(res.check_out < end ? res.check_out : end);
          const nights = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 3600 * 24)));
          totalNightsBooked += nights;

          const roomPrice = room.price_per_night || 2500;
          estimatedRevenue += nights * roomPrice;

          if (res.board_type && boardCounts[res.board_type] !== undefined) {
            boardCounts[res.board_type] += 1;
          }

          const mAge = res.main_age ?? 30;
          if (mAge >= 18) totalAdults++;
          else if (mAge >= 13) totalTeens++;
          else if (mAge >= 7) totalChildren++;
          else if (mAge >= 3) totalToddlers++;
          else totalInfants++;

          if (res.guests && res.guests.length > 0) {
            res.guests.forEach(g => {
              const age = g.age ?? (g.birth_date ? calculateAgeDetails(g.birth_date).age : 30);
              if (age >= 18) totalAdults++;
              else if (age >= 13) totalTeens++;
              else if (age >= 7) totalChildren++;
              else if (age >= 3) totalToddlers++;
              else totalInfants++;
            });
          }
        }
      });
    });

    const totalChildrenAll = totalInfants + totalToddlers + totalChildren + totalTeens;
    const totalGuests = totalAdults + totalChildrenAll;
    const maxPossibleNights = Math.max(1, rooms.length * days);
    const occupancyPercentage = Math.min(100, Math.round((totalNightsBooked / maxPossibleNights) * 100));

    return {
      totalGuests,
      totalAdults,
      totalInfants,
      totalToddlers,
      totalChildren,
      totalTeens,
      totalChildrenAll,
      occupancyPercentage,
      estimatedRevenue,
      boardCounts
    };
  };

  // New Room Form State (Supports Board Prices, Amenities, Cover Photo & Discounts)
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    room_type: "Standart Deniz Manzaralı",
    capacity: 2,
    bed_info: "",
    price_per_night: 2500,
    price_room_only: 2200,
    price_half_board: 3200,
    price_full_board: 3900,
    price_all_inclusive: 4800,
    price_ultra_all_inclusive: 0,
    non_refundable_discount: 10,
    amenitiesStr: "WiFi, Deniz Manzarası, Balkon, Klima, LCD TV, Minibar",
    cover_image: "",
    description: "",
    status: "vacant" as HotelRoom['status'],
    notes: ""
  });

  // Check-In Guest Form State
  const [guestForm, setGuestForm] = useState({
    identity_no: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    additionalGuests: [] as Array<{
      identity_no: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      age: number;
      age_category: 'infant' | 'child' | 'adult' | 'senior';
      discount_rate: number;
    }>
  });

  // Over Capacity Warning Dialog State
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Add Manual Expense State
  const [manualExpense, setManualExpense] = useState({
    title: "",
    amount: 0,
    category: "Restoran Adisyon"
  });

  // Calculate age & discount category from birthdate YYYY-MM-DD or fallbackAge
  const calculateAgeDetails = (birthDateStr?: string, fallbackAge?: number) => {
    let age = fallbackAge ?? 30;
    if (birthDateStr) {
      const birth = new Date(birthDateStr);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (!isNaN(calculatedAge) && calculatedAge >= 0) {
        age = calculatedAge;
      }
    }

    let category: 'infant' | 'child' | 'adult' | 'senior' = 'adult';
    let bracket: 'infant' | 'toddler' | 'child' | 'adult' | 'senior' = 'adult';
    let discountRate = 0;
    let labelTr = "Yetişkin";
    let discountText = "Tam Ücret";

    if (age <= 2) {
      category = 'infant';
      bracket = 'infant';
      discountRate = 100;
      labelTr = "Bebek (0-2)";
      discountText = "%100 Ücretsiz";
    } else if (age <= 6) {
      category = 'infant';
      bracket = 'toddler';
      discountRate = 100;
      labelTr = "Küçük Çocuk (3-6)";
      discountText = "%100 Ücretsiz";
    } else if (age <= 12) {
      category = 'child';
      bracket = 'child';
      discountRate = 50;
      labelTr = "Çocuk (7-12)";
      discountText = "%50 İndirimli";
    } else if (age >= 65) {
      category = 'senior';
      bracket = 'senior';
      discountRate = 15;
      labelTr = "Kıdemli (65+)";
      discountText = "%15 İndirimli";
    } else {
      category = 'adult';
      bracket = 'adult';
      discountRate = 0;
      labelTr = "Yetişkin";
      discountText = "Standart";
    }

    return { age, category, bracket, discountRate, labelTr, discountText };
  };

  // Check if room has today's check-out
  const isTodayCheckOut = (room: HotelRoom) => {
    if (room.status !== 'occupied' || !room.current_guest?.check_out_date) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return room.current_guest.check_out_date === todayStr;
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.current_guest?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.current_guest?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.current_guest?.identity_no.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'checkout_today') return isTodayCheckOut(room);
    return room.status === statusFilter;
  });

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const todayCheckOuts = rooms.filter(r => isTodayCheckOut(r)).length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance' || r.status === 'disabled').length;
  const staffRooms = rooms.filter(r => r.status === 'staff').length;
  const availableRooms = rooms.filter(r => r.status === 'vacant').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Handle Create / Edit Room
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.room_number.trim()) return;

    const boardPrices = {
      room_only: Number(roomForm.price_room_only) || 0,
      bed_breakfast: Number(roomForm.price_per_night) || 0,
      half_board: Number(roomForm.price_half_board) || 0,
      full_board: Number(roomForm.price_full_board) || 0,
      all_inclusive: Number(roomForm.price_all_inclusive) || 0,
      ultra_all_inclusive: Number(roomForm.price_ultra_all_inclusive) || 0,
    };

    const amenitiesList = roomForm.amenitiesStr
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? {
        ...r,
        room_number: roomForm.room_number.trim(),
        room_type: roomForm.room_type,
        capacity: Number(roomForm.capacity) || 1,
        bed_info: roomForm.bed_info,
        price_per_night: Number(roomForm.price_per_night) || 0,
        board_prices: boardPrices,
        non_refundable_discount: Number(roomForm.non_refundable_discount) || 0,
        amenities: amenitiesList,
        cover_image: roomForm.cover_image,
        description: roomForm.description,
        status: roomForm.status,
        notes: roomForm.notes
      } : r));
      setEditingRoom(null);
    } else {
      const newRoom: HotelRoom = {
        id: `room-${Date.now()}`,
        room_number: roomForm.room_number.trim(),
        room_type: roomForm.room_type,
        capacity: Number(roomForm.capacity) || 1,
        bed_info: roomForm.bed_info,
        price_per_night: Number(roomForm.price_per_night) || 0,
        board_prices: boardPrices,
        non_refundable_discount: Number(roomForm.non_refundable_discount) || 0,
        amenities: amenitiesList,
        cover_image: roomForm.cover_image,
        description: roomForm.description,
        status: roomForm.status,
        notes: roomForm.notes
      };
      setRooms([...rooms, newRoom]);
    }

    setIsAddRoomModalOpen(false);
    setRoomForm({
      room_number: "",
      room_type: "Standart Deniz Manzaralı",
      capacity: 2,
      bed_info: "",
      price_per_night: 2500,
      price_room_only: 2200,
      price_half_board: 3200,
      price_full_board: 3900,
      price_all_inclusive: 4800,
      price_ultra_all_inclusive: 0,
      non_refundable_discount: 10,
      amenitiesStr: "WiFi, Deniz Manzarası, Balkon, Klima, LCD TV, Minibar",
      cover_image: "",
      description: "",
      status: "vacant",
      notes: ""
    });
  };

  // Handle Guest Check-In
  const handleExecuteCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInModalRoom || !guestForm.first_name || !guestForm.last_name) return;

    const totalGuestsCount = 1 + guestForm.additionalGuests.length;
    if (totalGuestsCount > checkInModalRoom.capacity) {
      setCapacityWarning(
        isTr 
          ? `⚠️ Kapasite Aşımı! Oda #${checkInModalRoom.room_number} maksimum ${checkInModalRoom.capacity} kişilik kapasiteye sahiptir. Toplam ${totalGuestsCount} kişi ekliyorsunuz!`
          : `⚠️ Over Capacity! Room #${checkInModalRoom.room_number} max capacity is ${checkInModalRoom.capacity}. You are registering ${totalGuestsCount} guests!`
      );
    }

    const mainGuestAgeDetails = calculateAgeDetails(guestForm.birth_date);

    const newGuest = {
      id: `guest-${Date.now()}`,
      identity_no: guestForm.identity_no.trim(),
      first_name: guestForm.first_name.trim(),
      last_name: guestForm.last_name.trim(),
      birth_date: guestForm.birth_date,
      age: mainGuestAgeDetails.age,
      age_category: mainGuestAgeDetails.category,
      discount_rate: mainGuestAgeDetails.discountRate,
      phone: guestForm.phone,
      check_in_date: guestForm.check_in_date,
      check_out_date: guestForm.check_out_date
    };

    setRooms(rooms.map(r => r.id === checkInModalRoom.id ? {
      ...r,
      status: 'occupied',
      current_guest: newGuest,
      additional_guests: guestForm.additionalGuests,
      folio: r.folio || { id: `folio-${Date.now()}`, total_amount: 0, items: [] }
    } : r));

    setCheckInModalRoom(null);
    setGuestForm({
      identity_no: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      phone: "",
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      additionalGuests: []
    });
  };

  // Handle Add Additional Guest
  const handleAddAdditionalGuestField = () => {
    setGuestForm({
      ...guestForm,
      additionalGuests: [
        ...guestForm.additionalGuests,
        {
          identity_no: "",
          first_name: "",
          last_name: "",
          birth_date: "",
          age: 25,
          age_category: 'adult',
          discount_rate: 0
        }
      ]
    });
  };

  // Handle Guest Check-Out & Settle Folio
  const handleExecuteCheckOut = (room: HotelRoom) => {
    setRooms(rooms.map(r => r.id === room.id ? {
      ...r,
      status: 'vacant',
      current_guest: undefined,
      additional_guests: undefined,
      folio: undefined
    } : r));
    setCheckOutModalRoom(null);
  };

  // Handle Add Manual Expense to Room Folio
  const handleAddExpenseToFolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addExpenseModalRoom || !manualExpense.title || manualExpense.amount <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newItem = {
      id: `exp-${Date.now()}`,
      title: manualExpense.title,
      amount: Number(manualExpense.amount),
      date: todayStr,
      category: manualExpense.category
    };

    setRooms(rooms.map(r => {
      if (r.id === addExpenseModalRoom.id) {
        const currentFolio = r.folio || { id: `folio-${Date.now()}`, total_amount: 0, items: [] };
        const updatedItems = [...currentFolio.items, newItem];
        const newTotal = updatedItems.reduce((acc, curr) => acc + curr.amount, 0);
        return {
          ...r,
          folio: {
            ...currentFolio,
            total_amount: newTotal,
            items: updatedItems
          }
        };
      }
      return r;
    }));

    setAddExpenseModalRoom(null);
    setManualExpense({ title: "", amount: 0, category: "Restoran Adisyon" });
  };

  // Safe Isolated Print Function (Prevents Blank Page / Freeze Defects)
  const handlePrintFolio = (room: HotelRoom) => {
    if (!room.current_guest) return;
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert("Yazdırma penceresi engellendi. Lütfen tarayıcınızda açılır pencere (pop-up) izni verin.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('tr-TR');
    const itemsHtml = (room.folio?.items || []).map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 12px; font-weight: 600; color: #1e293b;">${idx + 1}</td>
        <td style="padding: 10px; font-size: 12px; font-weight: 600; color: #1e293b;">${item.title}</td>
        <td style="padding: 10px; font-size: 11px; color: #64748b;">${item.category}</td>
        <td style="padding: 10px; font-size: 11px; color: #64748b;">${item.date}</td>
        <td style="padding: 10px; font-size: 12px; font-weight: 700; color: #0f172a; text-align: right;">₺${item.amount.toLocaleString('tr-TR')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Oda #${room.room_number} Folio Adisyonu</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .brand-title { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a; }
            .sub-title { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border-radius: 9999px; font-size: 10px; font-weight: 800; color: #334155; text-transform: uppercase; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; }
            .card-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .total-box { background: #0f172a; color: #ffffff; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
            .total-label { font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
            .total-amount { font-size: 22px; font-weight: 900; color: #fbbf24; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            .signature-box { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
            .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 50px; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-title">OTEL & HORECA MİSAFİR FOLİO HESABI</div>
              <div class="sub-title">Oda #${room.room_number} (${room.room_type})</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">Adisyon Ekstresi</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Tarih: ${todayStr}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-title">MİSAFİR VE KONAKLAMA BİLGİLERİ</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #1e293b;">
              <span>Ana Misafir: <strong>${room.current_guest.first_name} ${room.current_guest.last_name}</strong></span>
              <span>T.C. / Pasaport: <strong>${room.current_guest.identity_no}</strong></span>
              <span>Telefon: <strong>${room.current_guest.phone || '-'}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
              <span>Giriş Tarihi: ${room.current_guest.check_in_date}</span>
              <span>Çıkış Tarihi: ${room.current_guest.check_out_date}</span>
              <span>Yaş İndirimi: %${room.current_guest.discount_rate || 0} (${room.current_guest.age} Yaş)</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Adisyon / Hizmet Açıklaması</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th style="text-align: right;">Tutar (₺)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="5" style="text-align:center; padding: 20px; font-size:12px; color:#94a3b8;">Sistemde kayıtlı harcama bulunmuyor.</td></tr>'}
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <div class="total-label">TOPLAM ADİSYON BORCU</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Tüm vergiler ve restoran harcamaları dahildir.</div>
            </div>
            <div class="total-amount">₺${(room.folio?.total_amount || 0).toLocaleString('tr-TR')}</div>
          </div>

          <div class="signature-box">
            <div>
              Misafir İmza
              <div class="sig-line">${room.current_guest.first_name} ${room.current_guest.last_name}</div>
            </div>
            <div>
              Resepsiyon / Otel Yetkilisi İmza
              <div class="sig-line">Teslim Alan</div>
            </div>
          </div>

          <div class="footer">
            <span>LookPrice Horeca LP Otel Otomasyonu</span>
            <span>Güvenli Dijital Ekstre</span>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Safe Excel/CSV Export Function
  const handleExportExcel = () => {
    const headers = ["Oda No", "Oda Tipi", "Kapasite", "Durum", "Misafir Ad Soyad", "TC / Pasaport", "Giriş Tarihi", "Çıkış Tarihi", "Folio Bakiye (TL)"];
    const rows = rooms.map(room => [
      room.room_number,
      room.room_type,
      room.capacity,
      room.status === 'occupied' ? 'Dolu' : room.status === 'vacant' ? 'Boş' : room.status === 'maintenance' ? 'Bakımda' : room.status === 'staff' ? 'Personel' : 'Devre Dışı',
      room.current_guest ? `${room.current_guest.first_name} ${room.current_guest.last_name}` : '-',
      room.current_guest ? room.current_guest.identity_no : '-',
      room.current_guest ? room.current_guest.check_in_date : '-',
      room.current_guest ? room.current_guest.check_out_date : '-',
      room.folio ? room.folio.total_amount : 0
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.map(c => `"${c}"`).join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Otel_Oda_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-clip">
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-md shadow-indigo-600/20 shrink-0">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isTr ? "Otel & Oda Yönetim Merkezi" : "Hotel & Room Management Center"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                Horeca Hybrid
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isTr 
                ? "Konaklama, restoran adisyon aktarımı, oda doluluğu ve yaş/indirim takibi" 
                : "Accommodation, restaurant folio charge, occupancy & guest discount tracking"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Excel / CSV Raporu</span>
          </button>

          <button
            onClick={() => {
              setEditingRoom(null);
              setRoomForm({
                room_number: "",
                room_type: "Standart Deniz Manzaralı",
                capacity: 2,
                bed_info: "",
                price_per_night: 2500,
                price_room_only: 2200,
                price_half_board: 3200,
                price_full_board: 3900,
                price_all_inclusive: 4800,
                price_ultra_all_inclusive: 0,
                non_refundable_discount: 10,
                amenitiesStr: "WiFi, Deniz Manzarası, Balkon, Klima, LCD TV, Minibar",
                cover_image: "",
                description: "",
                status: "vacant",
                notes: ""
              });
              setIsAddRoomModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isTr ? "Yeni Oda Tanımla" : "Define New Room"}</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW MODE SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-xs gap-3 max-w-full">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('grid')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeViewMode === 'grid'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-indigo-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BedDouble className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>{isTr ? "🏨 Odalar & Folyo" : "Room Cards & Folios"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('calendar')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeViewMode === 'calendar'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md ring-2 ring-indigo-400 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4 text-amber-300 animate-bounce shrink-0" />
            <span className="hidden sm:inline">{isTr ? "📅 60 Günlük Müsaitlik & Yaş Analiz Takvimi" : "2-Month Reservation & Age Analytics Board"}</span>
            <span className="sm:hidden">{isTr ? "📅 60 Gün Takvim & Analiz" : "2-Month Board"}</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{isTr ? "Bebek (0-2), Çocuk (3-6 / 7-12) & Yetişkin Yaş Analizli" : "With Infant, Child & Adult Age Breakdown"}</span>
        </div>
      </div>

      {/* OVER CAPACITY WARNING BANNER */}
      {capacityWarning && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-2xl flex items-center justify-between text-amber-900 dark:text-amber-200 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">{capacityWarning}</p>
          </div>
          <button 
            onClick={() => setCapacityWarning(null)}
            className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW MODE 1: 60-DAY CALENDAR & AGE ANALYTICS BOARD */}
      {activeViewMode === 'calendar' && (() => {
        const stats = calculateAgeBreakdownStats();
        const { start, end, title } = getAnalizDateRange();

        // Build array of N dates starting from calendarStartDate
        const daysList: Array<{ dateStr: string; dayNum: number; dayName: string; monthName: string; isWeekend: boolean; isToday: boolean }> = [];
        const baseDate = new Date(calendarStartDate);
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 0; i < calendarDaysCount; i++) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + i);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;
          
          const dayNum = d.getDate();
          const dayIndex = d.getDay();
          const isWeekend = dayIndex === 0 || dayIndex === 6;
          const isToday = dateStr === todayStr;

          const monthNamesTr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Ekim", "Kas", "Ara"];
          const dayNamesTr = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

          daysList.push({
            dateStr,
            dayNum,
            dayName: dayNamesTr[dayIndex],
            monthName: monthNamesTr[d.getMonth()],
            isWeekend,
            isToday
          });
        }

        return (
          <div className="space-y-6">
            {/* ANALYTICS CONTROL & AGE GROUP SUMMARY SECTION */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-5 max-w-full overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600 shrink-0" />
                    <span>{isTr ? "Gelecek Kişi & Yaş Grubu Kırılım Analiz Paneli" : "Upcoming Guests & Age Group Breakdown Analytics"}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isTr 
                      ? `Seçilen dönem (${title}: ${start} ~ ${end}) için konaklayacak misafir yaş kategorileri` 
                      : `Guest age categories for selected period (${title})`}
                  </p>
                </div>

                {/* PERIOD SELECTOR BUTTONS */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                  {[
                    { id: 'next_7', label: isTr ? '⚡ 7 Gün' : '7 Days' },
                    { id: 'next_14', label: isTr ? '⚡ 14 Gün' : '14 Days' },
                    { id: 'next_30', label: isTr ? '⚡ 30 Gün' : '30 Days' },
                    { id: 'next_60', label: isTr ? '⚡ 60 Gün (2 Ay)' : '60 Days (2 Mo)' },
                    { id: 'custom', label: isTr ? '📅 Özel' : 'Custom' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setAnalysisPeriod(p.id as any)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center whitespace-nowrap ${
                        analysisPeriod === p.id
                          ? 'bg-indigo-600 text-white shadow-md font-black'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM DATE INPUTS IF CUSTOM SELECTED */}
              {analysisPeriod === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Analiz Başlangıç:</span>
                    <input
                      type="date"
                      value={customAnalizStart}
                      onChange={(e) => setCustomAnalizStart(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Analiz Bitiş:</span>
                    <input
                      type="date"
                      value={customAnalizEnd}
                      onChange={(e) => setCustomAnalizEnd(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* ANALYTICS STAT CARDS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* TOTAL EXPECTED GUESTS */}
                <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                  <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">Toplam Gelecek Kişi</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-300">{stats.totalGuests} <span className="text-xs text-indigo-200">Kişi</span></span>
                    <Users className="h-6 w-6 text-indigo-300" />
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">({title})</p>
                </div>

                {/* ADULTS */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">👨‍👩‍👧 Yetişkin (18+ Yaş)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalAdults} <span className="text-xs text-slate-400">Yetişkin</span></span>
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                {/* TOTAL CHILDREN & INFANTS */}
                <div className="p-4 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-1">
                  <p className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-200 tracking-wider">🧒 Toplam Çocuk & Bebek</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-950 dark:text-amber-100">{stats.totalChildrenAll} <span className="text-xs text-amber-700 dark:text-amber-300">Çocuk/Bebek</span></span>
                    <Baby className="h-5 w-5 text-amber-600" />
                  </div>
                </div>

                {/* AGE BREAKDOWN DETAIL ITEM 1: INFANTS (0-2 YRS) */}
                <div className="p-3.5 bg-rose-500/10 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1">
                  <p className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300 tracking-wider">🍼 0 - 2 Yaş (Bebek)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-rose-900 dark:text-rose-100">{stats.totalInfants} <span className="text-xs font-bold text-rose-600">Bebek</span></span>
                    <span className="px-1.5 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 rounded text-[9px] font-black">%100 Ücretsiz</span>
                  </div>
                </div>

                {/* AGE BREAKDOWN DETAIL ITEM 2: TODDLERS (3-6 YRS) */}
                <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <p className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">🧸 3 - 6 Yaş (Okul Öncesi)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">{stats.totalToddlers} <span className="text-xs font-bold text-emerald-600">Çocuk</span></span>
                    <span className="px-1.5 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded text-[9px] font-black">Ücretsiz/İndirimli</span>
                  </div>
                </div>

                {/* AGE BREAKDOWN DETAIL ITEM 3: SCHOOL AGE (7-12 YRS & TEENS) */}
                <div className="p-3.5 bg-sky-500/10 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-1">
                  <p className="text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 tracking-wider">🎒 7 - 17 Yaş (Okul/Genç)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-sky-900 dark:text-sky-100">{stats.totalChildren + stats.totalTeens} <span className="text-xs font-bold text-sky-600">Öğrenci</span></span>
                    <span className="px-1.5 py-0.5 bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 rounded text-[9px] font-black">%50 İndirimli</span>
                  </div>
                </div>
              </div>

              {/* ESTIMATED OCCUPANCY & REVENUE SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Beklenen Dönem Doluluk Oranı</p>
                    <p className="text-2xl font-black text-emerald-400">%{stats.occupancyPercentage}</p>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-400/80" />
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Tahmini Dönem Oda Geliri</p>
                    <p className="text-2xl font-black text-amber-300">₺{stats.estimatedRevenue.toLocaleString('tr-TR')}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-amber-400/80" />
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Konaklama Pansiyon Dağılımı</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-200 border border-indigo-700 rounded text-[10px] font-black">BB: {stats.boardCounts.BB}</span>
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-200 border border-indigo-700 rounded text-[10px] font-black">HB: {stats.boardCounts.HB}</span>
                      <span className="px-2 py-0.5 bg-indigo-950 text-indigo-200 border border-indigo-700 rounded text-[10px] font-black">AI: {stats.boardCounts.AI}</span>
                    </div>
                  </div>
                  <PieChart className="h-8 w-8 text-indigo-400/80" />
                </div>
              </div>
            </div>

            {/* 60-DAY INTERACTIVE RESERVATION GANTT BOARD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-w-full overflow-hidden">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
                    <CalendarRange className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      60 Günlük Müsaitlik & Doluluk Takvimi (Rezervasyon Board)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Oda bazlı günlük müsaitlik durumu. Dolu günlerin üzerine tıklayarak misafir ve yaş detaylarını görebilirsiniz.
                    </p>
                  </div>
                </div>

                {/* BOARD DATE CONTROL BUTTONS */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  <div className="flex items-center gap-1.5 flex-1 sm:flex-initial w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(calendarStartDate);
                        d.setDate(d.getDate() - 15);
                        setCalendarStartDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                      title="Önceki 15 Gün"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                      <span className="hidden xs:inline sm:inline">Önceki 15 Gün</span>
                      <span className="xs:hidden sm:hidden">-15 Gün</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalendarStartDate(new Date().toISOString().split('T')[0])}
                      className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black cursor-pointer shadow-xs shrink-0"
                    >
                      Bugün
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(calendarStartDate);
                        d.setDate(d.getDate() + 15);
                        setCalendarStartDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                      title="Sonraki 15 Gün"
                    >
                      <span className="hidden xs:inline sm:inline">Sonraki 15 Gün</span>
                      <span className="xs:hidden sm:hidden">+15 Gün</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </div>

                  <div className="w-full sm:w-auto">
                    <select
                      value={calendarDaysCount}
                      onChange={(e) => setCalendarDaysCount(Number(e.target.value) as any)}
                      className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value={30}>30 Gün Göster (1 Ay)</option>
                      <option value={60}>60 Gün Göster (2 Ay)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LEGEND COLOR BAR */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md"></div>
                  <span>Boş & Müsait (Tıkla -&gt; Giriş Yap)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-rose-600 rounded-md"></div>
                  <span>Konaklayan / Dolu Misafir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-amber-500 rounded-md"></div>
                  <span>Gelecek Rezervasyon</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-slate-400 rounded-md"></div>
                  <span>Tadilatta / Servis Dışı</span>
                </div>
              </div>

              {/* HORIZONTAL SCROLLABLE GANTT GRID */}
              <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner max-h-[600px] overflow-y-auto w-full max-w-full">
                <table className="w-full text-left border-collapse min-w-[1800px]">
                  {/* CALENDAR HEADER ROW */}
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-20 border-b-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      {/* Sticky Left Room Column Header */}
                      <th className="p-3 w-48 bg-slate-200 dark:bg-slate-900 sticky left-0 z-30 font-black text-xs text-slate-900 dark:text-slate-100 border-r-2 border-slate-300 dark:border-slate-700 shadow-md">
                        Oda No / Tipi
                      </th>

                      {/* Days Header Columns */}
                      {daysList.map(d => (
                        <th
                          key={d.dateStr}
                          className={`p-1.5 text-center w-12 border-r border-slate-200 dark:border-slate-700/80 ${
                            d.isToday 
                              ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-500' 
                              : d.isWeekend 
                              ? 'bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold' 
                              : 'text-slate-700 dark:text-slate-300 font-bold'
                          }`}
                        >
                          <div className="text-[9px] uppercase tracking-tighter opacity-80">{d.monthName}</div>
                          <div className="text-xs font-black">{d.dayNum}</div>
                          <div className="text-[9px] uppercase font-bold opacity-75">{d.dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* ROOM ROWS */}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {rooms.map(room => (
                      <tr key={room.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* Sticky Left Room Cell */}
                        <td className="p-3 bg-white dark:bg-slate-900 sticky left-0 z-10 border-r-2 border-slate-300 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-slate-900 dark:text-white">#{room.room_number}</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {room.capacity} Kişi
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{room.room_type}</p>
                          <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-0.5">₺{(room.price_per_night || 2500).toLocaleString('tr-TR')}/gece</p>
                        </td>

                        {/* Calendar Day Cells */}
                        {daysList.map(d => {
                          if (room.status === 'maintenance' || room.status === 'staff' || room.status === 'disabled') {
                            return (
                              <td key={d.dateStr} className="p-1 border-r border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-800/60 text-center">
                                <span className="text-[10px] font-bold text-slate-400">N/A</span>
                              </td>
                            );
                          }

                          const isCurrentGuestStay = room.status === 'occupied' && 
                            room.current_guest && 
                            room.current_guest.check_in_date <= d.dateStr && 
                            room.current_guest.check_out_date >= d.dateStr;

                          const reservationMatch = room.reservations?.find(r => r.check_in_date <= d.dateStr && r.check_out_date >= d.dateStr);

                          if (isCurrentGuestStay && room.current_guest) {
                            const cg = room.current_guest;
                            const addCount = room.additional_guests?.length || 0;
                            
                            return (
                              <td
                                key={d.dateStr}
                                onClick={() => {
                                  setSelectedReservationModal({
                                    room,
                                    res: {
                                      id: cg.id,
                                      identity_no: cg.identity_no,
                                      first_name: cg.first_name,
                                      last_name: cg.last_name,
                                      phone: cg.phone,
                                      check_in_date: cg.check_in_date,
                                      check_out_date: cg.check_out_date,
                                      board_type: cg.board_type || 'BB',
                                      main_guest_age: cg.age,
                                      guests: room.additional_guests?.map(ag => ({
                                        first_name: ag.first_name,
                                        last_name: ag.last_name,
                                        age: ag.age,
                                        birth_date: ag.birth_date
                                      }))
                                    }
                                  });
                                }}
                                className="p-1 border-r border-slate-200 dark:border-slate-800 bg-rose-600 text-white cursor-pointer hover:opacity-90 transition-all text-center"
                                title={`${cg.first_name} ${cg.last_name} (${cg.check_in_date} ~ ${cg.check_out_date})`}
                              >
                                <div className="text-[10px] font-black truncate leading-tight">{cg.first_name[0]}. {cg.last_name}</div>
                                <div className="text-[8px] font-bold opacity-90">{addCount > 0 ? `1Y+${addCount}Ç` : '1 Yetişkin'}</div>
                              </td>
                            );
                          }

                          if (reservationMatch) {
                            const addCount = reservationMatch.guests?.length || 0;
                            return (
                              <td
                                key={d.dateStr}
                                onClick={() => setSelectedReservationModal({ room, res: reservationMatch })}
                                className="p-1 border-r border-slate-200 dark:border-slate-800 bg-amber-500 text-slate-950 cursor-pointer hover:opacity-90 transition-all text-center"
                                title={`Gelecek Rezervasyon: ${reservationMatch.first_name} ${reservationMatch.last_name}`}
                              >
                                <div className="text-[10px] font-black truncate leading-tight">{reservationMatch.first_name[0]}. {reservationMatch.last_name}</div>
                                <div className="text-[8px] font-extrabold opacity-90">{addCount > 0 ? `1Y+${addCount}Ç` : '1 Yetişkin'}</div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={d.dateStr}
                              onClick={() => {
                                setCheckInModalRoom(room);
                                setGuestForm(prev => ({
                                  ...prev,
                                  check_in_date: d.dateStr,
                                  check_out_date: getNextDayString(d.dateStr)
                                }));
                              }}
                              className="p-1 border-r border-slate-200 dark:border-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer text-center group transition-colors"
                              title={`Oda #${room.room_number} (${d.dateStr}) - Tıkla & Giriş Yap`}
                            >
                              <Plus className="h-3.5 w-3.5 mx-auto text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW MODE 2: CLASSIC ROOM CARDS MATRIX GRID */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          {/* DASHBOARD MATRIX STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Toplam Oda" : "Total Rooms"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalRooms}</span>
            <BedDouble className="h-5 w-5 text-indigo-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Dolu Odalar" : "Occupied"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{occupiedRooms}</span>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 bg-amber-500/15 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-400/80 dark:border-amber-700 space-y-1 shadow-xs">
          <p className="text-[10px] font-black uppercase text-amber-950 dark:text-amber-200 tracking-wider flex items-center gap-1">
            <span>{isTr ? "⚠️ Bugün Çıkış Yapacak" : "Check-out Today"}</span>
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-950 dark:text-amber-100">{todayCheckOuts}</span>
            <Clock className="h-5 w-5 text-amber-700 dark:text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Boş & Hazır" : "Vacant"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{availableRooms}</span>
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Tadilat / Personel" : "Maintenance / Staff"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{maintenanceRooms + staffRooms}</span>
            <Wrench className="h-5 w-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-xs space-y-1">
          <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">{isTr ? "Doluluk Oranı" : "Occupancy Rate"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">%{occupancyRate}</span>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Oda no, misafir adı, TC veya oda tipi ile ara..." : "Search room no, guest name, ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: isTr ? 'Tüm Odalar' : 'All Rooms' },
            { id: 'checkout_today', label: isTr ? '⚠️ Bugün Çıkış Yapacaklar' : 'Checkout Today', alert: true },
            { id: 'occupied', label: isTr ? '🟢 Dolu Odalar' : 'Occupied' },
            { id: 'vacant', label: isTr ? '🔵 Boş Odalar' : 'Vacant' },
            { id: 'maintenance', label: isTr ? '🔴 Tadilatta / Servis Dışı' : 'Maintenance' },
            { id: 'staff', label: isTr ? '🟣 Personel Tahsisli' : 'Staff' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === f.id
                  ? f.alert 
                    ? 'bg-amber-600 text-white border border-amber-700 shadow-md font-black ring-2 ring-amber-400' 
                    : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : f.alert
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 font-extrabold hover:bg-amber-200 dark:hover:bg-amber-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ROOM MATRIX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map(room => {
          const isTodayOut = isTodayCheckOut(room);
          const folioAmount = room.folio?.total_amount || 0;

          return (
            <div
              key={room.id}
              className={`relative rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs ${
                isTodayOut
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600/80 shadow-md shadow-amber-500/10'
                  : room.status === 'occupied'
                  ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/80'
                  : room.status === 'vacant'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  : room.status === 'staff'
                  ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
              }`}
            >
              {/* TOP ROOM CARD HEADER */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Oda #{room.room_number}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {room.room_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" />
                    <span>{room.bed_info || `Maks ${room.capacity} Kişi`}</span>
                  </p>
                </div>

                {/* STATUS BADGES */}
                <div>
                  {isTodayOut ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-white border border-amber-600 uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-xs">
                      <Clock className="h-3 w-3" />
                      Bugün Çıkış
                    </span>
                  ) : room.status === 'occupied' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                      Dolu
                    </span>
                  ) : room.status === 'vacant' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                      Boş / Hazır
                    </span>
                  ) : room.status === 'staff' ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                      Personel
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wider">
                      Servis Dışı
                    </span>
                  )}
                </div>
              </div>

              {/* GUEST INFO IF OCCUPIED */}
              {room.status === 'occupied' && room.current_guest && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {room.current_guest.first_name} {room.current_guest.last_name}
                      </span>
                    </div>
                    {room.current_guest.discount_rate > 0 && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        %{room.current_guest.discount_rate} İndirimli
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p className="flex justify-between">
                      <span>{isTr ? "Giriş - Çıkış:" : "Dates:"}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {room.current_guest.check_in_date} ➔ {room.current_guest.check_out_date}
                      </span>
                    </p>
                    {room.additional_guests && room.additional_guests.length > 0 && (
                      <p className="flex justify-between">
                        <span>{isTr ? "Ek Misafirler:" : "Extra Guests:"}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          +{room.additional_guests.length} Kişi
                        </span>
                      </p>
                    )}
                  </div>

                  {/* FOLIO HARCAMA HESABI */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">{isTr ? "Adisyon Borcu" : "Folio Debt"}</p>
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                        ₺{folioAmount.toLocaleString('tr-TR')}
                      </p>
                    </div>

                    <button
                      onClick={() => setAddExpenseModalRoom(room)}
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isTr ? "+ Adisyon Ekle" : "+ Expense"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* NOTES IF MAINTENANCE/STAFF */}
              {(room.status === 'maintenance' || room.status === 'staff') && room.notes && (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-300 italic">
                  "{room.notes}"
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setEditingRoom(room);
                    setRoomForm({
                      room_number: room.room_number,
                      room_type: room.room_type,
                      capacity: room.capacity,
                      bed_info: room.bed_info || "",
                      price_per_night: room.price_per_night || 2500,
                      price_room_only: room.board_prices?.room_only || Math.round((room.price_per_night || 2500) * 0.88),
                      price_half_board: room.board_prices?.half_board || Math.round((room.price_per_night || 2500) * 1.28),
                      price_full_board: room.board_prices?.full_board || Math.round((room.price_per_night || 2500) * 1.56),
                      price_all_inclusive: room.board_prices?.all_inclusive || Math.round((room.price_per_night || 2500) * 1.92),
                      price_ultra_all_inclusive: room.board_prices?.ultra_all_inclusive || 0,
                      non_refundable_discount: room.non_refundable_discount || 10,
                      amenitiesStr: (room.amenities || ["WiFi", "Deniz Manzarası", "Balkon", "Klima", "LCD TV"]).join(", "),
                      cover_image: room.cover_image || "",
                      description: room.description || "",
                      status: room.status,
                      notes: room.notes || ""
                    });
                    setIsAddRoomModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Oda Ayarları"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                {room.status === 'vacant' && (
                  <button
                    onClick={() => setCheckInModalRoom(room)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{isTr ? "Misafir Girişi (Check-In)" : "Check-In Guest"}</span>
                  </button>
                )}

                {room.status === 'occupied' && (
                  <button
                    onClick={() => setCheckOutModalRoom(room)}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{isTr ? "Folio Kapat & Check-Out" : "Check-Out & Pay"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}

      {/* MODAL: CALENDAR RESERVATION DETAIL POPUP */}
      {selectedReservationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Oda #{selectedReservationModal.room.room_number} - Rezervasyon Detayı
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    {selectedReservationModal.room.room_type}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedReservationModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* MAIN GUEST HEADER */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-500">Ana Misafir / Ad Soyad</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name}
                  </p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                    TC/Pasaport: {selectedReservationModal.res.identity_no || 'Belirtilmedi'} | Tel: {selectedReservationModal.res.phone || 'Yok'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black">
                  {selectedReservationModal.res.board_type || 'BB'} Pansiyon
                </span>
              </div>

              {/* DATES & NIGHTS */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Giriş Tarihi:</span>
                  <p className="text-slate-900 dark:text-white text-sm font-black">{selectedReservationModal.res.check_in_date}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Çıkış Tarihi:</span>
                  <p className="text-slate-900 dark:text-white text-sm font-black">{selectedReservationModal.res.check_out_date}</p>
                </div>
              </div>

              {/* AGE & GUESTS BREAKDOWN */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  <Baby className="h-4 w-4 text-amber-500" />
                  <span>Konaklayan Yaş & Kişi Kırılımı</span>
                </h4>

                <div className="space-y-1.5">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    <span>1. {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name} (Ana Misafir)</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 rounded text-[10px] font-black">
                      {selectedReservationModal.res.main_guest_age || 35} Yaş (Yetişkin)
                    </span>
                  </div>

                  {selectedReservationModal.res.guests?.map((g, idx) => {
                    const ageDetails = calculateAgeDetails(g.birth_date, g.age);
                    return (
                      <div key={idx} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        <span>{idx + 2}. {g.first_name} {g.last_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-slate-300">{ageDetails.age} Yaş</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            ageDetails.bracket === 'infant' ? 'bg-rose-100 text-rose-900' :
                            ageDetails.bracket === 'toddler' ? 'bg-emerald-100 text-emerald-900' :
                            ageDetails.bracket === 'child' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200 text-slate-900'
                          }`}>
                            {ageDetails.labelTr} ({ageDetails.discountText})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReservationModal(null)}
                  className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ROOM */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border-2 border-slate-300 dark:border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingRoom ? (isTr ? `Oda #${editingRoom.room_number} Düzenle` : "Edit Room") : (isTr ? "Yeni Oda & Konaklama Tipi Tanımla" : "Define Room & Board Types")}
                </h3>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">LookPrice Horeca uyumlu oda tipi, pansiyon fiyatları ve olanaklar</p>
              </div>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{isTr ? "Oda Numarası / Kodu" : "Room No"}</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 101, SUITE-A"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{isTr ? "Maksimum Kapasite" : "Capacity"}</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{isTr ? "Oda Tipi" : "Room Type"}</label>
                  <input
                    type="text"
                    placeholder="Örn: Standart Deniz Manzaralı"
                    value={roomForm.room_type}
                    onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{isTr ? "Yatak Bilgisi" : "Bed Info"}</label>
                  <input
                    type="text"
                    placeholder="Örn: 1 Çift Kişilik Yatak"
                    value={roomForm.bed_info}
                    onChange={(e) => setRoomForm({ ...roomForm, bed_info: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* BOOKING.COM BOARD PRICING ENGINE */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border-2 border-slate-300 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Pansiyon Tiplerine Göre Gecelik Fiyatlandırma (₺)
                  </span>
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                    Otomatik Binlik Ayraçlı
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Sadece Oda (RO)</label>
                    <input
                      type="text"
                      placeholder="2.200"
                      value={formatThousand(roomForm.price_room_only)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_room_only: parseThousand(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-indigo-800 dark:text-indigo-300">Oda + Kahvaltı (BB - Baz)</label>
                    <input
                      type="text"
                      placeholder="2.500"
                      value={formatThousand(roomForm.price_per_night)}
                      onChange={(e) => {
                        const val = parseThousand(e.target.value);
                        setRoomForm({ ...roomForm, price_per_night: val });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-indigo-500 rounded-xl text-xs font-black text-indigo-700 dark:text-indigo-300 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Yarım Pansiyon (HB)</label>
                    <input
                      type="text"
                      placeholder="3.200"
                      value={formatThousand(roomForm.price_half_board)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_half_board: parseThousand(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Tam Pansiyon (FB)</label>
                    <input
                      type="text"
                      placeholder="3.900"
                      value={formatThousand(roomForm.price_full_board)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_full_board: parseThousand(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300">Her Şey Dahil (AI)</label>
                    <input
                      type="text"
                      placeholder="4.800"
                      value={formatThousand(roomForm.price_all_inclusive)}
                      onChange={(e) => setRoomForm({ ...roomForm, price_all_inclusive: parseThousand(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">İptal Edilemez İndirimi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      placeholder="15"
                      value={roomForm.non_refundable_discount}
                      onChange={(e) => setRoomForm({ ...roomForm, non_refundable_discount: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-950 border-2 border-emerald-400 dark:border-emerald-700 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Oda Özellikleri & Olanaklar (Virgülle Ayırın)</label>
                <input
                  type="text"
                  placeholder="WiFi, Deniz Manzarası, Balkon, Jakuzi, Klima, LCD TV, Minibar"
                  value={roomForm.amenitiesStr}
                  onChange={(e) => setRoomForm({ ...roomForm, amenitiesStr: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center justify-between">
                  <span>{isTr ? "Oda Fotoğrafı & Görseli" : "Room Image"}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{isTr ? "Kamera, Galeri veya URL Linki" : "Camera, File or Link"}</span>
                </label>

                {/* File input elements */}
                <input
                  type="file"
                  id="hotel_room_photo_file_input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />
                <input
                  type="file"
                  id="hotel_room_photo_camera_input"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageFileUpload}
                />

                {/* Action buttons for Camera & File Upload */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('hotel_room_photo_camera_input')?.click()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{isTr ? "📸 Fotoğraf Çek (Kamera)" : "Take Photo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => document.getElementById('hotel_room_photo_file_input')?.click()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isTr ? "📁 Dosya / Galeri Seç" : "Upload File"}</span>
                  </button>
                </div>

                {/* Image URL text input */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={roomForm.cover_image}
                    onChange={(e) => setRoomForm({ ...roomForm, cover_image: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Live Photo Preview */}
                {roomForm.cover_image && (
                  <div className="mt-2.5 relative group w-full h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-xs">
                    <img
                      src={roomForm.cover_image}
                      alt="Room Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setRoomForm({ ...roomForm, cover_image: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all shadow-md cursor-pointer flex items-center justify-center"
                      title={isTr ? "Fotoğrafı Kaldır" : "Remove Photo"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Açıklama (Web Sitesinde Gösterilir)</label>
                <textarea
                  rows={2}
                  placeholder="Akdeniz manzaralı, özel balkonlu ve lüks tasarımlı oda açıklaması..."
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">{isTr ? "Oda Durumu" : "Status"}</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="vacant">{isTr ? "Boş & Hazır" : "Vacant"}</option>
                    <option value="occupied">{isTr ? "Dolu" : "Occupied"}</option>
                    <option value="maintenance">{isTr ? "🔴 Tadilatta / Servis Dışı" : "Maintenance"}</option>
                    <option value="staff">{isTr ? "🟣 Personel Tahsisli" : "Staff"}</option>
                    <option value="disabled">{isTr ? "⚪ Pasif / Kapalı" : "Disabled"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">{isTr ? "İç Notlar" : "Internal Notes"}</label>
                  <input
                    type="text"
                    placeholder="Klima bakımı, personel ismi vb."
                    value={roomForm.notes}
                    onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingRoom ? "Güncelle & Web Sitesine İşle" : "Kaydet & Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-IN GUEST */}
      {checkInModalRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Oda #{checkInModalRoom.room_number} Misafir Girişi (Check-In)
                </h3>
                <p className="text-xs text-slate-500">Maks Kapasite: {checkInModalRoom.capacity} Kişi</p>
              </div>
              <button onClick={() => setCheckInModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCheckIn} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">TC / Pasaport No</label>
                  <input
                    type="text"
                    required
                    placeholder="11 Haneli TC veya Pasaport"
                    value={guestForm.identity_no}
                    onChange={(e) => setGuestForm({ ...guestForm, identity_no: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Telefon</label>
                  <input
                    type="text"
                    placeholder="+90 5XX XXX XX XX"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Misafir Adı</label>
                  <input
                    type="text"
                    required
                    value={guestForm.first_name}
                    onChange={(e) => setGuestForm({ ...guestForm, first_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Soyadı</label>
                  <input
                    type="text"
                    required
                    value={guestForm.last_name}
                    onChange={(e) => setGuestForm({ ...guestForm, last_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* BIRTHDATE & AUTO AGE DISCOUNT DISPLAY */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase">Doğum Tarihi</label>
                    <input
                      type="date"
                      required
                      value={guestForm.birth_date}
                      onChange={(e) => setGuestForm({ ...guestForm, birth_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    {guestForm.birth_date && (() => {
                      const details = calculateAgeDetails(guestForm.birth_date);
                      return (
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white border border-indigo-200">
                          <span>Yaş: {details.age} ({details.category})</span>
                          {details.discountRate > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-black">
                              💡 Restoranda %{details.discountRate} Otomatik İndirimli!
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Giriş Tarihi (Check-In)</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={guestForm.check_in_date}
                    onChange={(e) => handleAdminCheckInChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Çıkış Tarihi (Check-Out)</label>
                  <input
                    type="date"
                    required
                    min={getNextDayString(guestForm.check_in_date)}
                    value={guestForm.check_out_date}
                    onChange={(e) => setGuestForm({ ...guestForm, check_out_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* EXTRA GUESTS */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Ek Misafirler (Çocuk/Eş)</span>
                  <button
                    type="button"
                    onClick={handleAddAdditionalGuestField}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    + Misafir Ekle
                  </button>
                </div>

                {guestForm.additionalGuests.map((ag, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-200">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="TC/Pasaport"
                        value={ag.identity_no}
                        onChange={(e) => {
                          const updated = [...guestForm.additionalGuests];
                          updated[idx].identity_no = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: updated });
                        }}
                        className="px-2 py-1 bg-white border rounded-lg text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Adı"
                        value={ag.first_name}
                        onChange={(e) => {
                          const updated = [...guestForm.additionalGuests];
                          updated[idx].first_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: updated });
                        }}
                        className="px-2 py-1 bg-white border rounded-lg text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Soyadı"
                        value={ag.last_name}
                        onChange={(e) => {
                          const updated = [...guestForm.additionalGuests];
                          updated[idx].last_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: updated });
                        }}
                        className="px-2 py-1 bg-white border rounded-lg text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInModalRoom(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Giriş Yap (Check-In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-OUT & FOLIO RECEIPT */}
      {checkOutModalRoom && checkOutModalRoom.current_guest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Oda #{checkOutModalRoom.room_number} Folio Hesabı & Check-Out
                </h3>
                <p className="text-xs text-slate-500">
                  Misafir: {checkOutModalRoom.current_guest.first_name} {checkOutModalRoom.current_guest.last_name} ({checkOutModalRoom.current_guest.identity_no})
                </p>
              </div>
              <button onClick={() => setCheckOutModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FOLIO ITEM LISTING */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400 border-b pb-2">
                <span>Adisyon / Harcama Açıklaması</span>
                <span>Tutar</span>
              </div>

              {(!checkOutModalRoom.folio?.items || checkOutModalRoom.folio.items.length === 0) ? (
                <p className="text-center text-xs text-slate-400 py-4">Bu odaya ait kayıtlı restoran harcaması bulunmuyor.</p>
              ) : (
                <div className="space-y-2">
                  {checkOutModalRoom.folio.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200">
                      <div>
                        <p className="font-bold">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.date} • {item.category}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₺{item.amount.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-black">
                <span className="text-slate-900 dark:text-white">TOPLAM ADİSYON BORCU:</span>
                <span className="text-xl text-rose-600 dark:text-rose-400">
                  ₺{(checkOutModalRoom.folio?.total_amount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handlePrintFolio(checkOutModalRoom)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Folio Yazdır</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCheckOutModalRoom(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCheckOut(checkOutModalRoom)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Tahsil Et & Check-Out Kapat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL EXPENSE */}
      {addExpenseModalRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Oda #{addExpenseModalRoom.room_number} Adisyon Ekle
              </h3>
              <button onClick={() => setAddExpenseModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseToFolio} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Harcama Kalemi / Adisyon</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Restoran Adisyon #1092, Mini Bar"
                  value={manualExpense.title}
                  onChange={(e) => setManualExpense({ ...manualExpense, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Tutar (₺)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={manualExpense.amount}
                  onChange={(e) => setManualExpense({ ...manualExpense, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddExpenseModalRoom(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Hesaba İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

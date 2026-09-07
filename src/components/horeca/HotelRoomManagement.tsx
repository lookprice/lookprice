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
  CalendarRange,
  LayoutGrid,
  List,
  RotateCcw,
  Check
} from "lucide-react";

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
        check_out_date: todayStr
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
        const newImg = reader.result as string;
        setRoomForm(prev => {
          const currentList = Array.isArray(prev.images) ? prev.images : [];
          const updated = currentList.includes(newImg) ? currentList : [...currentList, newImg];
          return {
            ...prev,
            cover_image: prev.cover_image || newImg,
            images: updated
          };
        });
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

  // View Mode, Display Format & Helper States
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'calendar'>('grid');
  const [roomDisplayMode, setRoomDisplayMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem(`hotelRoomDisplayMode_${storeId}`);
      if (saved === 'grid' || saved === 'list') return saved;
    } catch (e) {}
    return 'list'; // Default: Liste (Tablo) Görünümü
  });

  const handleSetRoomDisplayMode = (mode: 'grid' | 'list') => {
    setRoomDisplayMode(mode);
    try {
      localStorage.setItem(`hotelRoomDisplayMode_${storeId}`, mode);
    } catch (e) {}
  };
  const [showServisDisiInfo, setShowServisDisiInfo] = useState<boolean>(true);
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

  // Quick Room Actions
  const handleQuickStatusChange = (roomId: string, newStatus: HotelRoom['status']) => {
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          status: newStatus,
          notes: newStatus === 'vacant' ? '' : r.notes
        };
      }
      return r;
    }));
  };

  const handleRestoreDemoRooms = () => {
    if (window.confirm(isTr ? "Temsili/demo odalar sıfırlanıp varsayılan verilerle tekrar yüklenecek. Onaylıyor musunuz?" : "Reload sample demo rooms?")) {
      const demos = getDemoRooms();
      setRooms(demos);
      localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(demos));
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    const target = rooms.find(r => r.id === roomId);
    if (!target) return;
    if (window.confirm(isTr ? `Oda #${target.room_number} (${target.room_type}) kalıcı olarak silinecektir. Onaylıyor musunuz?` : `Delete room #${target.room_number}?`)) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'checkout_today' | 'maintenance' | 'staff'>('all');

  // Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  
  const [checkInModalRoom, setCheckInModalRoom] = useState<HotelRoom | null>(null);
  const [checkOutModalRoom, setCheckOutModalRoom] = useState<HotelRoom | null>(null);
  const [addExpenseModalRoom, setAddExpenseModalRoom] = useState<HotelRoom | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<string>("Kredi Kartı");

  // Room Detail & Law Enforcement KBS Guest Manifest State
  const [selectedRoomDetailModal, setSelectedRoomDetailModal] = useState<HotelRoom | null>(null);

  // Official Law Enforcement (Polis / Jandarma / İçişleri KBS) Guest Manifest Print Function
  const handlePrintKbsManifest = (targetRoomsList?: HotelRoom[]) => {
    const roomsToExport = targetRoomsList || rooms.filter(r => r.status === 'occupied' && r.current_guest);
    
    if (roomsToExport.length === 0) {
      alert("Şu anda tesiste konaklayan kayıtlı misafir bulunmuyor.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kapatın.");
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let guestIndex = 1;
    const guestRowsHtml = roomsToExport.flatMap(room => {
      const list: string[] = [];
      if (room.current_guest) {
        const cg = room.current_guest;
        list.push(`
          <tr>
            <td style="text-align:center; font-weight:bold;">${guestIndex++}</td>
            <td><strong>Oda #${room.room_number}</strong><br/><span style="font-size:10px; color:#64748b;">${room.room_type}</span></td>
            <td><strong style="letter-spacing:0.5px;">${cg.identity_no || 'Belirtilmedi'}</strong></td>
            <td><strong>${cg.first_name} ${cg.last_name}</strong></td>
            <td>${cg.gender || 'Belirtilmedi'}</td>
            <td>${formatDisplayDate(cg.birth_date)} (${cg.age || '-'} Yaş)</td>
            <td>${cg.nationality || 'TC - Türkiye'}</td>
            <td>${cg.phone || '-'}</td>
            <td>${formatDisplayDate(cg.check_in_date)}</td>
            <td>${formatDisplayDate(cg.check_out_date)}</td>
            <td><span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px;">Ana Misafir</span></td>
          </tr>
        `);
      }

      if (room.additional_guests && room.additional_guests.length > 0) {
        room.additional_guests.forEach(ag => {
          list.push(`
            <tr>
              <td style="text-align:center;">${guestIndex++}</td>
              <td>Oda #${room.room_number}</td>
              <td><strong style="letter-spacing:0.5px;">${ag.identity_no || 'Belirtilmedi'}</strong></td>
              <td>${ag.first_name} ${ag.last_name}</td>
              <td>${ag.gender || 'Belirtilmedi'}</td>
              <td>${formatDisplayDate(ag.birth_date)} (${ag.age || '-'} Yaş)</td>
              <td>${ag.nationality || 'TC - Türkiye'}</td>
              <td>${ag.phone || room.current_guest?.phone || '-'}</td>
              <td>${formatDisplayDate(room.current_guest?.check_in_date)}</td>
              <td>${formatDisplayDate(room.current_guest?.check_out_date)}</td>
              <td><span style="background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px;">Ek Misafir</span></td>
            </tr>
          `);
        });
      }

      return list;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>KBS Konaklayan Misafir Bildirim Listesi</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #0f172a; padding: 10px; margin: 0; background: #fff; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title-box { text-align: left; }
            .official-badge { font-size: 12px; font-weight: 900; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; }
            .sub-title { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 3px; }
            .meta-info { font-size: 11px; color: #475569; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stat-item { text-align: center; }
            .stat-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .stat-val { font-size: 14px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10.5px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background: #1e293b; color: #ffffff; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #64748b; }
            .sig-box { text-align: center; width: 220px; }
            .sig-line { border-top: 1px dashed #64748b; margin-top: 35px; padding-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-box">
              <div class="official-badge">T.C. İÇİŞLERİ BAKANLIĞI — KOLLUK KUVVETLERİ BİLDİRİM FORMU</div>
              <div class="sub-title">KONAKLAYAN KİMLİK BİLDİRİM LİSTESİ (KBS DÖKÜMÜ)</div>
              <div class="meta-info">1774 Sayılı Kimlik Bildirim Kanunu Uyarınca Tanzim Edilmiştir</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 800; color: #1e293b;">Rapor Tarihi: ${dateStr}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">LookPrice Horeca LP Otel Otomasyonu</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Raporlanan Dolu Oda Sayısı</div>
              <div class="stat-val">${roomsToExport.length} Oda</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Toplam Kayıtlı Konaklayan Misafir</div>
              <div class="stat-val">${guestIndex - 1} Kişi</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Bildirim Akış Türü</div>
              <div class="stat-val" style="color:#2563eb;">Emniyet / Jandarma Bildirim Çıktısı</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align:center;">Sıra</th>
                <th>Oda No & Tipi</th>
                <th>T.C. / Pasaport No</th>
                <th>Adı Soyadı</th>
                <th>Cinsiyet</th>
                <th>Doğum Tarihi & Yaş</th>
                <th>Uyruk</th>
                <th>İletişim Tel</th>
                <th>Giriş Tarihi</th>
                <th>Çıkış Tarihi</th>
                <th>Misafir Rolü</th>
              </tr>
            </thead>
            <tbody>
              ${guestRowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>
              <p style="margin:0; font-weight:bold;">Yasal Uyarı:</p>
              <p style="margin:2px 0 0 0;">Bu döküm tesis otomasyon kayıtlarımızdaki aktif konaklayan kimlik verilerinden resmi kolluk talebi doğrultusunda üretilmiştir.</p>
            </div>
            <div class="sig-box">
              Resepsiyon / Tesis Yetkilisi
              <div class="sig-line">İmza & Mühür</div>
            </div>
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

  // Helper for date range analytics
  const getAnalizDateRange = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (analysisPeriod === 'next_7') {
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      return { start: todayStr, end: end.toISOString().split('T')[0], days: 7, title: "Gelecek 7 Gün" };
    } else if (analysisPeriod === 'next_14') {
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      return { start: todayStr, end: end.toISOString().split('T')[0], days: 14, title: "Gelecek 14 Gün (2 Hafta)" };
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
    images: [] as string[],
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
      gender?: string;
      nationality?: string;
    }>
  });

  // Over Capacity Warning Dialog State
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Age Policy Modal State
  const [isAgePolicyModalOpen, setIsAgePolicyModalOpen] = useState(false);
  const [ageDiscountPolicy, setAgeDiscountPolicy] = useState(() => {
    try {
      const saved = localStorage.getItem(`hotelAgePolicy_${storeId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true, // Tesis geneli yaş indirimi aktif mi?
      apply_to_room: true, // Konaklama ücretine uygula
      apply_to_restaurant: true, // Restoran/Folio harcamalarına uygula
      infant_0_2_rate: 100, // 0-2 Yaş Bebek %
      toddler_3_6_rate: 100, // 3-6 Yaş Küçük Çocuk %
      child_7_12_rate: 50, // 7-12 Yaş Çocuk %
      senior_65_plus_rate: 15 // 65+ Yaş Kıdemli %
    };
  });

  const saveAgePolicy = (newPolicy: typeof ageDiscountPolicy) => {
    setAgeDiscountPolicy(newPolicy);
    try {
      localStorage.setItem(`hotelAgePolicy_${storeId}`, JSON.stringify(newPolicy));
    } catch (e) {}
  };

  // Store Custom Date Format Setting (Default: DD/MM/YYYY - GG/AA/YYYY)
  const [storeDateFormat, setStoreDateFormat] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`hotelDateFormat_${storeId}`);
      if (saved) return saved;
    } catch (e) {}
    return "DD/MM/YYYY"; // DEFAULT: GG/AA/YYYY
  });

  const saveStoreDateFormat = (fmt: string) => {
    setStoreDateFormat(fmt);
    try {
      localStorage.setItem(`hotelDateFormat_${storeId}`, fmt);
    } catch (e) {}
  };

  // Helper to format date according to store preference
  const formatDisplayDate = (dateStr?: string, customFormat?: string) => {
    if (!dateStr) return "-";
    const fmt = customFormat || storeDateFormat || "DD/MM/YYYY";
    try {
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        if (fmt === "DD.MM.YYYY") return `${d}.${m}.${y}`;
        if (fmt === "YYYY-MM-DD") return `${y}-${m}-${d}`;
        if (fmt === "DD MMM YYYY") {
          const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
          const idx = parseInt(m, 10) - 1;
          const monthName = monthNames[idx] || m;
          return `${d} ${monthName} ${y}`;
        }
        // Default: DD/MM/YYYY (gg/aa/yyyy)
        return `${d}/${m}/${y}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

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

    if (!ageDiscountPolicy.enabled) {
      discountRate = 0;
      discountText = "Standart (İndirimsiz)";
      if (age <= 2) { category = 'infant'; bracket = 'infant'; labelTr = "Bebek (0-2)"; }
      else if (age <= 6) { category = 'infant'; bracket = 'toddler'; labelTr = "Küçük Çocuk (3-6)"; }
      else if (age <= 12) { category = 'child'; bracket = 'child'; labelTr = "Çocuk (7-12)"; }
      else if (age >= 65) { category = 'senior'; bracket = 'senior'; labelTr = "Kıdemli (65+)"; }
      else { category = 'adult'; bracket = 'adult'; labelTr = "Yetişkin"; }
    } else if (age <= 2) {
      category = 'infant';
      bracket = 'infant';
      discountRate = ageDiscountPolicy.infant_0_2_rate;
      labelTr = "Bebek (0-2)";
      discountText = discountRate > 0 ? `%${discountRate} İndirimli` : "Tam Ücret";
    } else if (age <= 6) {
      category = 'infant';
      bracket = 'toddler';
      discountRate = ageDiscountPolicy.toddler_3_6_rate;
      labelTr = "Küçük Çocuk (3-6)";
      discountText = discountRate > 0 ? `%${discountRate} İndirimli` : "Tam Ücret";
    } else if (age <= 12) {
      category = 'child';
      bracket = 'child';
      discountRate = ageDiscountPolicy.child_7_12_rate;
      labelTr = "Çocuk (7-12)";
      discountText = discountRate > 0 ? `%${discountRate} İndirimli` : "Tam Ücret";
    } else if (age >= 65) {
      category = 'senior';
      bracket = 'senior';
      discountRate = ageDiscountPolicy.senior_65_plus_rate;
      labelTr = "Kıdemli (65+)";
      discountText = discountRate > 0 ? `%${discountRate} İndirimli` : "Tam Ücret";
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
    const term = searchTerm.trim().toLowerCase();
    
    // Crash-proof safe string extraction
    const roomNum = (room.room_number || '').toLowerCase();
    const roomType = (room.room_type || '').toLowerCase();
    const firstName = (room.current_guest?.first_name || '').toLowerCase();
    const lastName = (room.current_guest?.last_name || '').toLowerCase();
    const identityNo = (room.current_guest?.identity_no || '').toLowerCase();

    const matchesSearch = !term || 
      roomNum.includes(term) ||
      roomType.includes(term) ||
      firstName.includes(term) ||
      lastName.includes(term) ||
      identityNo.includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'checkout_today') return isTodayCheckOut(room);
    if (statusFilter === 'maintenance') return room.status === 'maintenance' || room.status === 'disabled';
    if (statusFilter === 'vacant') {
      return room.status === 'vacant' || room.status === 'available' || room.status === 'clean' || (!room.status) || (room.status !== 'occupied' && room.status !== 'maintenance' && room.status !== 'staff' && room.status !== 'disabled');
    }
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

    const roomImages = (roomForm.images && roomForm.images.length > 0)
      ? roomForm.images
      : (roomForm.cover_image ? [roomForm.cover_image] : []);

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
        cover_image: roomForm.cover_image || (roomImages[0] || ""),
        images: roomImages,
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
        cover_image: roomForm.cover_image || (roomImages[0] || ""),
        images: roomImages,
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
      images: [],
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

    const processedAdditionalGuests = (guestForm.additionalGuests || []).map(ag => {
      const ageDetails = calculateAgeDetails(ag.birth_date, ag.age);
      return {
        ...ag,
        identity_no: ag.identity_no.trim(),
        first_name: ag.first_name.trim(),
        last_name: ag.last_name.trim(),
        birth_date: ag.birth_date,
        age: ageDetails.age,
        age_category: ageDetails.category,
        discount_rate: ageDetails.discountRate,
        gender: ag.gender || "Kadın",
        nationality: ag.nationality || "TC - Türkiye"
      };
    });

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
      additional_guests: processedAdditionalGuests,
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
    const existing = guestForm.additionalGuests || [];
    setGuestForm({
      ...guestForm,
      additionalGuests: [
        ...existing,
        {
          identity_no: "",
          first_name: "",
          last_name: "",
          birth_date: "",
          age: 0,
          age_category: 'child',
          discount_rate: 0,
          gender: "Kadın",
          nationality: "TC - Türkiye"
        }
      ]
    });
  };

  const handleRemoveAdditionalGuestField = (index: number) => {
    const list = [...(guestForm.additionalGuests || [])];
    list.splice(index, 1);
    setGuestForm({ ...guestForm, additionalGuests: list });
  };

  // Comprehensive Room & Restaurant Folio Calculator
  const computeRoomFolioDetails = (room: HotelRoom) => {
    const guest = room.current_guest;
    if (!guest) {
      return {
        nights: 1,
        checkInDate: "-",
        checkOutDate: "-",
        boardTypeLabel: "Sadece Oda (RO)",
        nightlyRate: room.price_per_night || 2500,
        totalRawRoomRate: room.price_per_night || 2500,
        roomDiscountAmount: 0,
        netRoomRate: room.price_per_night || 2500,
        restaurantItems: [],
        restaurantTotal: 0,
        advancePayment: 0,
        grossTotal: room.price_per_night || 2500,
        netPayableBalance: room.price_per_night || 2500,
        mainGuestAgeDetails: calculateAgeDetails("1990-01-01")
      };
    }

    // 1. Calculate Nights
    const cin = guest.check_in_date ? new Date(guest.check_in_date) : new Date();
    const cout = guest.check_out_date ? new Date(guest.check_out_date) : new Date(cin.getTime() + 86400000);
    const timeDiff = cout.getTime() - cin.getTime();
    const nights = Math.max(1, Math.round(timeDiff / (1000 * 3600 * 24)));

    // 2. Board Type Nightly Rate
    let nightlyRate = room.price_per_night || 2500;
    let boardTypeLabel = "Oda Kahvaltı (BB)";

    const bt = (guest.board_type || 'bed_breakfast').toLowerCase();
    if (bt.includes('room_only') || bt === 'ro') {
      nightlyRate = room.price_room_only || Math.round(nightlyRate * 0.88);
      boardTypeLabel = "Sadece Oda (RO)";
    } else if (bt.includes('half_board') || bt === 'hb') {
      nightlyRate = room.price_half_board || Math.round(nightlyRate * 1.28);
      boardTypeLabel = "Yarım Pansiyon (HB)";
    } else if (bt.includes('full_board') || bt === 'fb') {
      nightlyRate = room.price_full_board || Math.round(nightlyRate * 1.56);
      boardTypeLabel = "Tam Pansiyon (FB)";
    } else if (bt.includes('all_inclusive') || bt === 'ai') {
      nightlyRate = room.price_all_inclusive || Math.round(nightlyRate * 1.92);
      boardTypeLabel = "Her Şey Dahil (AI)";
    } else if (bt.includes('ultra') || bt === 'uai') {
      nightlyRate = room.price_ultra_all_inclusive || Math.round(nightlyRate * 2.30);
      boardTypeLabel = "Ultra Her Şey Dahil (UAI)";
    }

    const totalRawRoomRate = nights * nightlyRate;

    // 3. Main Guest & Additional Guest Age Discounts
    const mainGuestAgeDetails = calculateAgeDetails(guest.birth_date, guest.age);
    let roomDiscountAmount = 0;

    if (ageDiscountPolicy.enabled && ageDiscountPolicy.apply_to_room) {
      if (mainGuestAgeDetails.discountRate > 0) {
        roomDiscountAmount += (totalRawRoomRate * (mainGuestAgeDetails.discountRate / 100));
      }
    }

    const netRoomRate = Math.max(0, Math.round(totalRawRoomRate - roomDiscountAmount));

    // 4. Restaurant & Cafe Items
    const rawItems = room.folio?.items || [];
    const restaurantItems = rawItems.map(item => {
      let finalAmount = item.amount;
      let discountAmt = 0;

      if (ageDiscountPolicy.enabled && ageDiscountPolicy.apply_to_restaurant && mainGuestAgeDetails.discountRate > 0) {
        discountAmt = Math.round(item.amount * (mainGuestAgeDetails.discountRate / 100));
        finalAmount = Math.max(0, item.amount - discountAmt);
      }

      return {
        ...item,
        rawAmount: item.amount,
        discountAmount: discountAmt,
        finalAmount
      };
    });

    const restaurantTotal = restaurantItems.reduce((acc, curr) => acc + curr.finalAmount, 0);

    // 5. Advance Payment / Kapora
    const advancePayment = guest.advance_payment || 0;

    // 6. Gross Total & Net Payable Balance
    const grossTotal = netRoomRate + restaurantTotal;
    const netPayableBalance = Math.max(0, grossTotal - advancePayment);

    return {
      nights,
      checkInDate: formatDisplayDate(guest.check_in_date),
      checkOutDate: formatDisplayDate(guest.check_out_date),
      boardTypeLabel,
      nightlyRate,
      totalRawRoomRate,
      roomDiscountAmount,
      netRoomRate,
      restaurantItems,
      restaurantTotal,
      advancePayment,
      grossTotal,
      netPayableBalance,
      mainGuestAgeDetails
    };
  };

  // Handle Guest Check-Out & Settle Folio
  const handleExecuteCheckOut = (room: HotelRoom) => {
    if (!room.current_guest) return;
    const details = computeRoomFolioDetails(room);

    // Save to checkout history archive in localStorage
    try {
      const savedHistoryStr = localStorage.getItem(`hotelCheckoutHistory_${storeId}`);
      const historyList = savedHistoryStr ? JSON.parse(savedHistoryStr) : [];
      const newArchiveRecord = {
        id: `cout-${Date.now()}`,
        room_number: room.room_number,
        room_type: room.room_type,
        guest_name: `${room.current_guest.first_name} ${room.current_guest.last_name}`,
        identity_no: room.current_guest.identity_no,
        phone: room.current_guest.phone || '-',
        check_in_date: details.checkInDate,
        check_out_date: details.checkOutDate,
        nights: details.nights,
        board_type: details.boardTypeLabel,
        net_room_rate: details.netRoomRate,
        restaurant_total: details.restaurantTotal,
        gross_total: details.grossTotal,
        advance_payment: details.advancePayment,
        net_collected: details.netPayableBalance,
        payment_method: checkoutPaymentMethod,
        timestamp: new Date().toISOString()
      };
      historyList.unshift(newArchiveRecord);
      localStorage.setItem(`hotelCheckoutHistory_${storeId}`, JSON.stringify(historyList));
    } catch (e) {}

    // Trigger Print Window for Detailed A4 Receipt
    handlePrintFolio(room, checkoutPaymentMethod);

    // Vacate Room and Clear Guest State
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
  const handlePrintFolio = (room: HotelRoom, pMethod?: string) => {
    if (!room.current_guest) return;
    const details = computeRoomFolioDetails(room);
    const payMethod = pMethod || checkoutPaymentMethod || "Kredi Kartı";

    const printWindow = window.open('', '_blank', 'width=900,height=950');
    if (!printWindow) {
      alert("Yazdırma penceresi engellendi. Lütfen tarayıcınızda açılır pencere (pop-up) izni verin.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('tr-TR');
    
    // Restaurant items HTML
    const restaurantRowsHtml = details.restaurantItems.length > 0
      ? details.restaurantItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 12px; font-weight: 600; color: #1e293b;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: 600; color: #1e293b;">${item.title}</td>
          <td style="padding: 10px; font-size: 11px; color: #64748b;">${item.category}</td>
          <td style="padding: 10px; font-size: 11px; color: #64748b;">${item.date}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: 700; color: #0f172a; text-align: right;">₺${item.finalAmount.toLocaleString('tr-TR')}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="text-align:center; padding: 16px; font-size:12px; color:#94a3b8;">Kayıtlı restoran / kafeterya harcaması bulunmamaktadır.</td></tr>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Oda #${room.room_number} Detaylı Folio Ekstresi</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
            .brand-title { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a; }
            .sub-title { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 12px; background-color: #0f172a; border-radius: 9999px; font-size: 10px; font-weight: 800; color: #ffffff; text-transform: uppercase; }
            .grid-card { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; }
            .info-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
            .info-value { font-size: 12px; font-weight: 700; color: #1e293b; }
            .section-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-left: 4px solid #2563eb; padding-left: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .summary-box { background: #0f172a; color: #ffffff; border-radius: 16px; padding: 18px; margin-top: 20px; }
            .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #334155; font-size: 12px; }
            .summary-row.total { border-bottom: none; padding-top: 10px; font-size: 16px; font-weight: 900; color: #fbbf24; }
            .signature-box { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 11px; font-weight: 700; color: #475569; }
            .sig-line { border-top: 1px dashed #cbd5e1; margin-top: 45px; padding-top: 6px; }
            .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-title">OTEL MİSAFİR HESAP EKSTRESİ (FOLİO)</div>
              <div class="sub-title">Oda #${room.room_number} • Tesis Tipi: ${room.room_type}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">Check-Out Ekstresi</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Tarih: ${todayStr}</div>
            </div>
          </div>

          <div class="grid-card">
            <div>
              <div class="info-label">MİSAFİR KÜNYESİ</div>
              <div class="info-value">${room.current_guest.first_name} ${room.current_guest.last_name}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">TC/Pasaport: ${room.current_guest.identity_no}</div>
              <div style="font-size: 11px; color: #64748b;">Tel: ${room.current_guest.phone || '-'}</div>
            </div>
            <div>
              <div class="info-label">KONAKLAMA DETAYLARI</div>
              <div class="info-value">${details.boardTypeLabel} (${details.nights} Gece)</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Giriş: ${details.checkInDate} — Çıkış: ${details.checkOutDate}</div>
              <div style="font-size: 11px; color: #64748b;">Yaş Grubu: ${details.mainGuestAgeDetails.labelTr} (${details.mainGuestAgeDetails.discountText})</div>
            </div>
          </div>

          <div class="section-title">1. KONAKLAMA HİZMET KALEMLERİ</div>
          <table>
            <thead>
              <tr>
                <th>Hizmet Tanımı</th>
                <th>Pansiyon Tipi</th>
                <th>Süre</th>
                <th>Gecelik Fiyat</th>
                <th>Yaş İndirimi</th>
                <th style="text-align: right;">Net Tutar (₺)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; font-size: 12px; font-weight: 700; color: #1e293b;">Oda Konaklama Bedeli</td>
                <td style="padding: 10px; font-size: 11px; color: #64748b;">${details.boardTypeLabel}</td>
                <td style="padding: 10px; font-size: 11px; color: #64748b;">${details.nights} Gece</td>
                <td style="padding: 10px; font-size: 11px; color: #64748b;">₺${details.nightlyRate.toLocaleString('tr-TR')}</td>
                <td style="padding: 10px; font-size: 11px; color: #16a34a; font-weight: 700;">-₺${details.roomDiscountAmount.toLocaleString('tr-TR')}</td>
                <td style="padding: 10px; font-size: 12px; font-weight: 800; color: #0f172a; text-align: right;">₺${details.netRoomRate.toLocaleString('tr-TR')}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">2. RESTORAN & KAFETERYA HARCAMA ADİSYONLARI</div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Adisyon / Sipariş Adı</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th style="text-align: right;">Tutar (₺)</th>
              </tr>
            </thead>
            <tbody>
              ${restaurantRowsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span style="color: #94a3b8;">Net Konaklama Ücreti:</span>
              <span style="font-weight: 700;">₺${details.netRoomRate.toLocaleString('tr-TR')}</span>
            </div>
            <div class="summary-row">
              <span style="color: #94a3b8;">Restoran / Kafeterya Harcamaları:</span>
              <span style="font-weight: 700;">₺${details.restaurantTotal.toLocaleString('tr-TR')}</span>
            </div>
            <div class="summary-row">
              <span style="color: #94a3b8;">Brüt Toplam Borç:</span>
              <span style="font-weight: 700;">₺${details.grossTotal.toLocaleString('tr-TR')}</span>
            </div>
            ${details.advancePayment > 0 ? `
              <div class="summary-row" style="color: #4ade80;">
                <span>(-) Girişte Alınan Kapora / Ön Ödeme:</span>
                <span style="font-weight: 800;">-₺${details.advancePayment.toLocaleString('tr-TR')}</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <div>
                <div>TAHSİL EDİLEN NET BALANS</div>
                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: none; margin-top: 2px;">Ödeme Yöntemi: ${payMethod}</div>
              </div>
              <div style="font-size: 22px;">₺${details.netPayableBalance.toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div class="signature-box">
            <div>
              Misafir Onayı / İmza
              <div style="font-size: 9px; font-weight: 400; color: #64748b; margin-top: 4px;">Hizmet dökümünü inceledim ve onaylıyorum.</div>
              <div class="sig-line">${room.current_guest.first_name} ${room.current_guest.last_name}</div>
            </div>
            <div>
              Resepsiyon Yetkilisi İmza
              <div style="font-size: 9px; font-weight: 400; color: #64748b; margin-top: 4px;">Ödeme tahsil edildi / Oda kapatıldı.</div>
              <div class="sig-line">Tahsil Eden / Resepsiyon</div>
            </div>
          </div>

          <div class="footer">
            <span>LookPrice Horeca LP Otel Otomasyon Sistemleri</span>
            <span>Resmi Müşteri Ekstre Belgesi</span>
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* MANUAL RECEPTION BOOKING / CHECK-IN BUTTON */}
          <button
            type="button"
            onClick={() => {
              // Find first vacant room or fallback to first room
              const vacantRoom = rooms.find(r => r.status === 'vacant') || rooms[0];
              if (vacantRoom) {
                setCheckInModalRoom(vacantRoom);
                const todayStr = new Date().toISOString().split('T')[0];
                setGuestForm({
                  identity_no: "",
                  first_name: "",
                  last_name: "",
                  birth_date: "1990-01-01",
                  phone: "",
                  email: "",
                  check_in_date: todayStr,
                  check_out_date: getNextDayString(todayStr),
                  board_type: "bed_breakfast",
                  advance_payment: 0,
                  payment_method: "Kredi Kartı",
                  notes: "",
                  additionalGuests: []
                });
              }
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/50"
          >
            <Plus className="h-4 w-4 text-emerald-200" />
            <span>{isTr ? "⚡ + Hızlı Manuel Rezervasyon" : "+ Quick Manual Reservation"}</span>
          </button>

          {/* AGE DISCOUNT POLICY CONFIG BUTTON */}
          <button
            type="button"
            onClick={() => setIsAgePolicyModalOpen(true)}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 dark:text-indigo-200 rounded-2xl font-bold text-xs border border-indigo-200 dark:border-indigo-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Tesis Fiyat & Yaş İndirim Politikası Ayarları"
          >
            <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{isTr ? "⚙️ Fiyat & İndirim Politikası" : "Age & Pricing Policy"}</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDemoRooms}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-200 rounded-2xl font-bold text-xs border border-amber-200 dark:border-amber-800 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Temsili Örnek Odaları Sıfırla ve Yükle"
          >
            <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{isTr ? "🔄 Demo Odaları Yükle" : "Reload Demo Rooms"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Excel Raporu</span>
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
            <Building2 className="h-4 w-4" />
            <span>{isTr ? "Yeni Oda Ekle" : "Add Room"}</span>
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

          <button
            type="button"
            onClick={() => handlePrintKbsManifest()}
            className="px-3.5 sm:px-4 py-2.5 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial active:scale-95"
            title="T.C. İçişleri Bakanlığı Emniyet / Jandarma Konaklayan Kimlik Bildirim Listesi Dökümü"
          >
            <Printer className="h-4 w-4 text-white shrink-0" />
            <span>{isTr ? "🏛️ Kolluk Kuvvetleri (KBS) Listesi" : "Law Enforcement KBS"}</span>
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
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'all'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Toplam Oda" : "Total Rooms"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalRooms}</span>
            <BedDouble className="h-5 w-5 text-indigo-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('occupied')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'occupied'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Dolu Odalar" : "Occupied"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{occupiedRooms}</span>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('checkout_today')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 shadow-xs ${
            statusFilter === 'checkout_today'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400 shadow-md'
              : 'bg-amber-500/15 dark:bg-amber-950/40 border-2 border-amber-400/80 dark:border-amber-700 hover:bg-amber-500/25'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            statusFilter === 'checkout_today' ? 'text-white' : 'text-amber-950 dark:text-amber-200'
          }`}>
            <span>{isTr ? "⚠️ Bugün Çıkış" : "Check-out Today"}</span>
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-black ${
              statusFilter === 'checkout_today' ? 'text-white' : 'text-amber-950 dark:text-amber-100'
            }`}>{todayCheckOuts}</span>
            <Clock className={`h-5 w-5 ${
              statusFilter === 'checkout_today' ? 'text-white' : 'text-amber-700 dark:text-amber-400 animate-bounce'
            }`} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('vacant')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'vacant'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Boş & Hazır" : "Vacant"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{availableRooms}</span>
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('maintenance')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            statusFilter === 'maintenance'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-rose-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{isTr ? "Tadilat / Personel" : "Maintenance / Staff"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{maintenanceRooms + staffRooms}</span>
            <Wrench className="h-5 w-5 text-rose-500" />
          </div>
        </button>

        <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-xs space-y-1">
          <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">{isTr ? "Doluluk Oranı" : "Occupancy Rate"}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">%{occupancyRate}</span>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* SERVİS DIŞI & ODA KULLANIM BİLGİLENDİRME BANT DÜZEYİ */}
      {showServisDisiInfo && (
        <div className="p-4 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-start justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm text-indigo-950 dark:text-indigo-100">
                {isTr ? "💡 Oda Durumu & 'Servis Dışı' Nedir?" : "💡 Room Status & Maintenance Info"}
              </p>
              <p className="mt-1 leading-relaxed font-medium">
                {isTr 
                  ? "Oda üzerindeki 'Servis Dışı' ibaresi; odanın boya, temizlik, arıza veya bakım nedeniyle geçici olarak müşteri satışına kapatıldığını gösterir. Odayı tekrar satışa ve girişe açmak için oda kartındaki durum menüsünden 'Boş / Hazır' seçeneğini tıklamanız yeterlidir."
                  : "The 'Maintenance / Servis Dışı' label means the room is temporarily out of service due to repairs or cleaning. To reactivate it, simply set its status to 'Vacant / Ready'."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowServisDisiInfo(false)}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors shrink-0 text-indigo-500 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* FILTER, SEARCH & LAYOUT TOGGLE BAR */}
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

        <div className="flex items-center gap-3 overflow-x-auto">
          {/* LAYOUT MODE SWITCHER */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => handleSetRoomDisplayMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                roomDisplayMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4 text-indigo-500" />
              <span>{isTr ? "Kart (Grid)" : "Grid"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetRoomDisplayMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                roomDisplayMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4 text-indigo-500" />
              <span>{isTr ? "Liste (Tablo)" : "List"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: isTr ? 'Tüm Odalar' : 'All Rooms' },
              { id: 'checkout_today', label: isTr ? '⚠️ Bugün Çıkış' : 'Checkout Today', alert: true },
              { id: 'occupied', label: isTr ? '🟢 Dolu' : 'Occupied' },
              { id: 'vacant', label: isTr ? '🔵 Boş' : 'Vacant' },
              { id: 'maintenance', label: isTr ? '🛠️ Servis Dışı' : 'Maintenance' },
              { id: 'staff', label: isTr ? '🟣 Personel' : 'Staff' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* ROOM DISPLAY SECTION: LIST (TABLE) OR GRID */}
      {roomDisplayMode === 'list' ? (
        /* MINIMALIST LIST VIEW FOR MULTI-ROOM HOTELS */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 pl-5">Oda No & Tipi</th>
                  <th className="p-3.5">Kapasite & Yatak</th>
                  <th className="p-3.5">Gecelik Fiyat</th>
                  <th className="p-3.5">Oda Durumu (Hızlı Değiştir)</th>
                  <th className="p-3.5">Konaklayan Misafir</th>
                  <th className="p-3.5">Folio / Adisyon</th>
                  <th className="p-3.5 pr-5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Arama kriterlerine uygun oda bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map(room => {
                    const isTodayOut = isTodayCheckOut(room);
                    const folioAmount = room.folio?.total_amount || 0;

                    return (
                      <tr key={room.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 pl-5">
                          <button
                            type="button"
                            onClick={() => setSelectedRoomDetailModal(room)}
                            className="flex items-center gap-2 text-left hover:opacity-80 cursor-pointer group"
                            title="Oda & Misafir Detayı"
                          >
                            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              Oda #{room.room_number}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {room.room_type}
                            </span>
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{room.bed_info ? `${room.bed_info} (Maks ${room.capacity || 2} Kişi)` : `Maks ${room.capacity || 2} Kişi`}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-black text-slate-900 dark:text-white">
                          ₺{(room.price_per_night || 2500).toLocaleString('tr-TR')}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <select
                              value={room.status}
                              onChange={(e) => handleQuickStatusChange(room.id, e.target.value as any)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-black cursor-pointer border outline-none transition-all ${
                                room.status === 'occupied'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                  : room.status === 'vacant'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300'
                                  : room.status === 'maintenance'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                                  : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300'
                              }`}
                            >
                              <option value="vacant">🟢 Boş / Hazır</option>
                              <option value="occupied">🔴 Dolu (Misafirli)</option>
                              <option value="maintenance">🛠️ Servis Dışı / Bakımda</option>
                              <option value="staff">👤 Personel Tahsisli</option>
                              <option value="disabled">⛔ Devre Dışı</option>
                            </select>
                            {isTodayOut && (
                              <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-black animate-pulse whitespace-nowrap">
                                Bugün Çıkış
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {room.status === 'occupied' && room.current_guest ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRoomDetailModal(room)}
                              className="text-left hover:opacity-80 cursor-pointer group"
                              title="Misafir Kimlik Künyesi Aç"
                            >
                              <div className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span>{room.current_guest.first_name} {room.current_guest.last_name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {formatDisplayDate(room.current_guest.check_in_date)} ➔ {formatDisplayDate(room.current_guest.check_out_date)}
                              </div>
                            </button>
                          ) : room.status === 'maintenance' ? (
                            <span className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                              {room.notes || "Bakımda / Kullanıma kapalı"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">- Müsait -</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {room.status === 'occupied' ? (
                            <div className="flex items-center gap-2">
                              <span className="font-black text-rose-600 dark:text-rose-400">
                                ₺{folioAmount.toLocaleString('tr-TR')}
                              </span>
                              <button
                                onClick={() => setAddExpenseModalRoom(room)}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                                title="Adisyon Ekle"
                              >
                                + Adisyon
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRoomDetailModal(room)}
                              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Misafir Künyesi & Oda Detayı"
                            >
                              <Info className="h-3.5 w-3.5" />
                              <span>Detay / Misafirler</span>
                            </button>
                            {room.status === 'vacant' && (
                              <button
                                onClick={() => setCheckInModalRoom(room)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Giriş Yap</span>
                              </button>
                            )}
                            {room.status === 'occupied' && (
                              <button
                                onClick={() => setCheckOutModalRoom(room)}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Folio / Çıkış</span>
                              </button>
                            )}
                            {room.status === 'maintenance' && (
                              <button
                                onClick={() => handleQuickStatusChange(room.id, 'vacant')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="Odayı Boş & Hazır Yap"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Hazır Yap</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingRoom(room);
                                setRoomForm({
                                  room_number: room.room_number,
                                  room_type: room.room_type,
                                  capacity: room.capacity || 2,
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
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Odayı Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ROOM MATRIX GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map(room => {
            const isTodayOut = isTodayCheckOut(room);
            const folioAmount = room.folio?.total_amount || 0;

            return (
              <div
                key={room.id}
                className={`relative rounded-3xl p-4 sm:p-5 border-t-4 transition-all duration-200 flex flex-col justify-between space-y-3.5 shadow-xs bg-white dark:bg-slate-900 ${
                  isTodayOut
                    ? 'border-t-amber-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 shadow-md shadow-amber-500/10'
                    : room.status === 'occupied'
                    ? 'border-t-emerald-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800'
                    : room.status === 'vacant'
                    ? 'border-t-blue-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800 hover:border-slate-300'
                    : room.status === 'staff'
                    ? 'border-t-purple-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800'
                    : 'border-t-rose-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-800 dark:border-b-slate-800'
                }`}
              >
                {/* TOP ROOM CARD HEADER */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Oda #{room.room_number}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 truncate max-w-[130px]" title={room.room_type}>
                        {room.room_type}
                      </span>
                    </div>

                    {/* SPECS BADGES - CLEAN HORIZONTAL BADGES WITH ICONS */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 whitespace-nowrap">
                        <Users className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>Maks {room.capacity || 2} Kişi</span>
                      </span>

                      {room.bed_info && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap truncate max-w-[140px]" title={room.bed_info}>
                          <BedDouble className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{room.bed_info}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 whitespace-nowrap">
                        ₺{(room.price_per_night || 2500).toLocaleString('tr-TR')}/gece
                      </span>
                    </div>
                  </div>

                  {/* QUICK STATUS CHANGE DROPDOWN ON CARD */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isTodayOut && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white border border-amber-600 uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-xs whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        Çıkış
                      </span>
                    )}
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickStatusChange(room.id, e.target.value as any)}
                      className={`px-2 py-1 rounded-xl text-[11px] font-black cursor-pointer border outline-none transition-all max-w-[125px] ${
                        room.status === 'occupied'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                          : room.status === 'vacant'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                          : room.status === 'maintenance'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                      }`}
                    >
                      <option value="vacant" className="text-slate-900 bg-white">🟢 Boş / Hazır</option>
                      <option value="occupied" className="text-slate-900 bg-white">🔴 Dolu</option>
                      <option value="maintenance" className="text-slate-900 bg-white">🛠️ Servis Dışı</option>
                      <option value="staff" className="text-slate-900 bg-white">👤 Personel</option>
                      <option value="disabled" className="text-slate-900 bg-white">⛔ Devre Dışı</option>
                    </select>
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
                          {formatDisplayDate(room.current_guest.check_in_date)} ➔ {formatDisplayDate(room.current_guest.check_out_date)}
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
                {(room.status === 'maintenance' || room.status === 'staff') && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <p className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 shrink-0" />
                      <span>{room.notes || "Oda bakıma ve teknik servise alınmıştır."}</span>
                    </p>
                    {room.status === 'maintenance' && (
                      <button
                        onClick={() => handleQuickStatusChange(room.id, 'vacant')}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>🟢 Boş & Hazır Yap (Aktifleştir)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomDetailModal(room)}
                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Misafir Künyesi & Oda Detayı"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Detay / Misafirler</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setRoomForm({
                        room_number: room.room_number,
                        room_type: room.room_type,
                        capacity: room.capacity || 2,
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

                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                    title="Odayı Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  </div>

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
      )}
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
                  <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_in_date)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Çıkış Tarihi:</span>
                  <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_out_date)}</p>
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

      {/* MODAL: ROOM DETAIL & FULL GUEST MANIFEST (KOLLUK KUVVETLERİ / POLİS / JANDARMA / KBS DETAYI) */}
      {selectedRoomDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-4xl w-full border-2 border-slate-300 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
                  <BedDouble className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Oda #{selectedRoomDetailModal.room_number} — Misafir Künyesi & Rezervasyon Detayları
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase ${
                      selectedRoomDetailModal.status === 'occupied' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' :
                      selectedRoomDetailModal.status === 'vacant' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300' :
                      selectedRoomDetailModal.status === 'maintenance' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                    }`}>
                      {selectedRoomDetailModal.status === 'occupied' ? '🔴 Dolu (Misafirli)' :
                       selectedRoomDetailModal.status === 'vacant' ? '🟢 Boş / Hazır' :
                       selectedRoomDetailModal.status === 'maintenance' ? '🛠️ Servis Dışı / Bakımda' : '👤 Personel'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedRoomDetailModal.room_type} • {selectedRoomDetailModal.bed_info || `Maks ${selectedRoomDetailModal.capacity} Kişi`} • ₺{(selectedRoomDetailModal.price_per_night || 2500).toLocaleString('tr-TR')}/gece
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoomDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* QUICK STATS & FOLIO BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pansiyon Tipi & Ücret</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedRoomDetailModal.current_guest?.board_type || 'BB'} (Oda + Kahvaltı)
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Konaklama Tarihleri</p>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {selectedRoomDetailModal.current_guest ? (
                    `${formatDisplayDate(selectedRoomDetailModal.current_guest.check_in_date)} ➔ ${formatDisplayDate(selectedRoomDetailModal.current_guest.check_out_date)}`
                  ) : "- Satışta Müsait -"}
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adisyon / Folyo Borcu</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                  ₺{(selectedRoomDetailModal.folio?.total_amount || 0).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* GUEST MANIFEST TABLE (KOLLUK KUVVETLERİ / EMNİYET / JANDARMA KBS UYUMLU) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Konaklayan Misafir Künyesi & Kimlik Bilgileri (Polis/Jandarma KBS Dökümü)</span>
                </h4>

                {selectedRoomDetailModal.status === 'occupied' && (
                  <button
                    type="button"
                    onClick={() => handlePrintKbsManifest([selectedRoomDetailModal])}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>🏛️ Bu Oda İçin KBS Dökümü Yazdır</span>
                  </button>
                )}
              </div>

              {selectedRoomDetailModal.current_guest ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5 pl-4">Sıra / Rol</th>
                          <th className="p-2.5">T.C. / Pasaport No</th>
                          <th className="p-2.5">Adı Soyadı</th>
                          <th className="p-2.5">Cinsiyet</th>
                          <th className="p-2.5">Doğum Tarihi & Yaş</th>
                          <th className="p-2.5">Uyruk</th>
                          <th className="p-2.5">İletişim Tel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                        {/* MAIN GUEST */}
                        <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                          <td className="p-2.5 pl-4">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 rounded text-[10px] font-black">
                              1. Ana Misafir
                            </span>
                          </td>
                          <td className="p-2.5 font-black tracking-wider text-slate-900 dark:text-white">
                            {selectedRoomDetailModal.current_guest.identity_no || "12345678901"}
                          </td>
                          <td className="p-2.5 font-black text-slate-900 dark:text-white">
                            {selectedRoomDetailModal.current_guest.first_name} {selectedRoomDetailModal.current_guest.last_name}
                          </td>
                          <td className="p-2.5">Erkek</td>
                          <td className="p-2.5">
                            {formatDisplayDate(selectedRoomDetailModal.current_guest.birth_date)} ({selectedRoomDetailModal.current_guest.age || 38} Yaş)
                          </td>
                          <td className="p-2.5">TC - Türkiye</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {selectedRoomDetailModal.current_guest.phone || "+90 532 111 2233"}
                          </td>
                        </tr>

                        {/* ADDITIONAL GUESTS */}
                        {selectedRoomDetailModal.additional_guests?.map((ag, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 pl-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] font-black">
                                {idx + 2}. Ek Misafir
                              </span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {ag.identity_no || "98765432109"}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                              {ag.first_name} {ag.last_name}
                            </td>
                            <td className="p-2.5">Kadın / Bebek</td>
                            <td className="p-2.5">
                              {formatDisplayDate(ag.birth_date)} ({ag.age} Yaş - {ag.age <= 2 ? 'Bebek' : ag.age <= 6 ? 'Çocuk' : 'Yetişkin'})
                            </td>
                            <td className="p-2.5">TC - Türkiye</td>
                            <td className="p-2.5 text-slate-500">
                              {selectedRoomDetailModal.current_guest?.phone || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-medium text-xs">
                  Bu odada şu anda kayıtlı konaklayan misafir bulunmamaktadır.
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedRoomDetailModal.status === 'vacant' && (
                  <button
                    type="button"
                    onClick={() => {
                      const room = selectedRoomDetailModal;
                      setSelectedRoomDetailModal(null);
                      setCheckInModalRoom(room);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Giriş Yap</span>
                  </button>
                )}

                {selectedRoomDetailModal.status === 'occupied' && (
                  <button
                    type="button"
                    onClick={() => {
                      const room = selectedRoomDetailModal;
                      setSelectedRoomDetailModal(null);
                      setCheckOutModalRoom(room);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Folio & Check-Out Aç</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const room = selectedRoomDetailModal;
                    setSelectedRoomDetailModal(null);
                    setEditingRoom(room);
                    setRoomForm({
                      room_number: room.room_number,
                      room_type: room.room_type,
                      capacity: room.capacity || 2,
                      bed_info: room.bed_info || "",
                      price_per_night: room.price_per_night || 2500,
                      board_prices: room.board_prices || { room_only: 2200, bed_breakfast: 2500, half_board: 3200 },
                      non_refundable_discount: room.non_refundable_discount || 10,
                      amenities: room.amenities || ["WiFi", "Klima", "TV"],
                      cover_image: room.cover_image || "",
                      description: room.description || "",
                      notes: room.notes || ""
                    });
                    setIsAddRoomModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Oda Düzenle</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRoomDetailModal(null)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </button>
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

              {/* MULTI-IMAGE GALLERY MANAGER */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div>
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-indigo-600" />
                      <span>{isTr ? "Oda Fotoğraf Galerisi & Kapak Görselleri" : "Room Photo Gallery"}</span>
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">Birden fazla fotoğraf yükleyebilir, ana kapak görselini belirleyebilirsiniz.</p>
                  </div>
                  <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg">
                    {roomForm.images.length} Fotoğraf
                  </span>
                </div>

                {/* File input elements */}
                <input
                  type="file"
                  id="hotel_room_photo_file_input"
                  accept="image/*"
                  multiple
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('hotel_room_photo_camera_input')?.click()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{isTr ? "📸 Fotoğraf Çek" : "Take Photo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => document.getElementById('hotel_room_photo_file_input')?.click()}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{isTr ? "📁 Dosya / Galeri Seç" : "Upload File"}</span>
                  </button>
                </div>

                {/* Image URL text input for adding custom web image */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    id="hotel_room_custom_url_input"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('hotel_room_custom_url_input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        const url = input.value.trim();
                        setRoomForm(prev => {
                          const currentList = Array.isArray(prev.images) ? prev.images : [];
                          return {
                            ...prev,
                            cover_image: prev.cover_image || url,
                            images: currentList.includes(url) ? currentList : [...currentList, url]
                          };
                        });
                        input.value = "";
                      }
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>

                {/* MULTI-IMAGE GALLERY GRID */}
                {roomForm.images && roomForm.images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {roomForm.images.map((imgUrl, idx) => {
                      const isCover = roomForm.cover_image === imgUrl || (!roomForm.cover_image && idx === 0);
                      return (
                        <div
                          key={idx}
                          className={`relative group h-24 rounded-xl overflow-hidden border-2 transition-all ${
                            isCover ? "border-amber-500 ring-2 ring-amber-500/30 shadow-md" : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Room Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isCover && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                              Ana Kapak
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => setRoomForm(prev => ({ ...prev, cover_image: imgUrl }))}
                                className="px-1.5 py-1 bg-amber-500 text-white text-[9px] font-bold rounded hover:bg-amber-600 transition-colors cursor-pointer w-full text-center"
                              >
                                Kapak Yap
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setRoomForm(prev => {
                                  const updated = prev.images.filter(i => i !== imgUrl);
                                  return {
                                    ...prev,
                                    images: updated,
                                    cover_image: prev.cover_image === imgUrl ? (updated[0] || "") : prev.cover_image
                                  };
                                });
                              }}
                              className="px-1.5 py-1 bg-rose-600 text-white text-[9px] font-bold rounded hover:bg-rose-700 transition-colors cursor-pointer w-full text-center"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold">Henüz fotoğraf yüklenmedi. Yukarıdaki butonlarla görsel ekleyebilirsiniz.</p>
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
              {/* SELECT ROOM DROPDOWN */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <label className="text-[10px] font-black text-emerald-900 dark:text-emerald-200 uppercase flex items-center justify-between">
                  <span>Tahsis Edilecek Oda Seçimi</span>
                  <span className="text-[9px] text-emerald-600 font-bold">Maks Kapasite: {checkInModalRoom.capacity} Kişi</span>
                </label>
                <select
                  value={checkInModalRoom.id}
                  onChange={(e) => {
                    const sel = rooms.find(r => r.id === e.target.value);
                    if (sel) setCheckInModalRoom(sel);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Oda #{r.room_number} - {r.room_type} ({r.status === 'vacant' ? '🟢 Boş & Hazır' : r.status === 'occupied' ? '🔴 Dolu' : '⚠️ Tadilat/Servis Dışı'})
                    </option>
                  ))}
                </select>
              </div>

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
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Ek Misafirler (Çocuk / Bebek / Eş)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdditionalGuestField}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    + Ek Misafir Ekle
                  </button>
                </div>

                {(guestForm.additionalGuests || []).map((ag, idx) => {
                  const agAgeDetails = ag.birth_date ? calculateAgeDetails(ag.birth_date, ag.age) : null;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2.5 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                        <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300">
                          {idx + 2}. Ek Misafir {agAgeDetails ? `(${agAgeDetails.age} Yaş - ${agAgeDetails.labelTr})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalGuestField(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                          title="Misafiri Kaldır"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">TC / Pasaport No</label>
                          <input
                            type="text"
                            placeholder="Kimlik / Pasaport"
                            value={ag.identity_no}
                            onChange={(e) => {
                              const list = [...(guestForm.additionalGuests || [])];
                              list[idx].identity_no = e.target.value;
                              setGuestForm({ ...guestForm, additionalGuests: list });
                            }}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">Adı</label>
                          <input
                            type="text"
                            placeholder="Adı"
                            value={ag.first_name}
                            onChange={(e) => {
                              const list = [...(guestForm.additionalGuests || [])];
                              list[idx].first_name = e.target.value;
                              setGuestForm({ ...guestForm, additionalGuests: list });
                            }}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">Soyadı</label>
                          <input
                            type="text"
                            placeholder="Soyadı"
                            value={ag.last_name}
                            onChange={(e) => {
                              const list = [...(guestForm.additionalGuests || [])];
                              list[idx].last_name = e.target.value;
                              setGuestForm({ ...guestForm, additionalGuests: list });
                            }}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">🎂 Doğum Tarihi (İndirim Yaş Hesabı)</label>
                          <input
                            type="date"
                            value={ag.birth_date}
                            onChange={(e) => {
                              const list = [...(guestForm.additionalGuests || [])];
                              list[idx].birth_date = e.target.value;
                              if (e.target.value) {
                                const details = calculateAgeDetails(e.target.value);
                                list[idx].age = details.age;
                                list[idx].age_category = details.category;
                                list[idx].discount_rate = details.discountRate;
                              }
                              setGuestForm({ ...guestForm, additionalGuests: list });
                            }}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">Cinsiyet</label>
                          <select
                            value={ag.gender || "Kadın"}
                            onChange={(e) => {
                              const list = [...(guestForm.additionalGuests || [])];
                              list[idx].gender = e.target.value;
                              setGuestForm({ ...guestForm, additionalGuests: list });
                            }}
                            className="w-full mt-0.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                          >
                            <option value="Erkek">Erkek</option>
                            <option value="Kadın">Kadın</option>
                            <option value="Çocuk">Çocuk / Bebek</option>
                          </select>
                        </div>
                      </div>

                      {agAgeDetails && (
                        <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between border border-indigo-100 dark:border-indigo-900">
                          <span>Yaş: {agAgeDetails.age} ({agAgeDetails.labelTr})</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                            💡 {agAgeDetails.discountText} (Restoran %{agAgeDetails.discountRate} İndirimli)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
      {checkOutModalRoom && checkOutModalRoom.current_guest && (() => {
        const details = computeRoomFolioDetails(checkOutModalRoom);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-amber-500" />
                    <span>Oda #{checkOutModalRoom.room_number} Folio Hesabı & Check-Out</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Misafir: <strong className="text-slate-800 dark:text-slate-200">{checkOutModalRoom.current_guest.first_name} {checkOutModalRoom.current_guest.last_name}</strong> ({checkOutModalRoom.current_guest.identity_no})
                  </p>
                </div>
                <button onClick={() => setCheckOutModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* STAY DETAILS BADGES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 font-medium block">Pansiyon Tipi</span>
                  <strong className="text-slate-800 dark:text-slate-200">{details.boardTypeLabel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Konaklama Süresi</span>
                  <strong className="text-slate-800 dark:text-slate-200">{details.nights} Gece</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Giriş / Çıkış</span>
                  <strong className="text-slate-800 dark:text-slate-200">{details.checkInDate} / {details.checkOutDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Yaş Grubu</span>
                  <strong className="text-slate-800 dark:text-slate-200">{details.mainGuestAgeDetails.labelTr}</strong>
                </div>
              </div>

              {/* ITEM BREAKDOWN */}
              <div className="space-y-3">
                {/* 1. ROOM ACCOMMODATION CHARGE */}
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                    <span>1. Oda Konaklama Hesabı ({details.nights} Gece x ₺{details.nightlyRate.toLocaleString('tr-TR')})</span>
                    <span>₺{details.totalRawRoomRate.toLocaleString('tr-TR')}</span>
                  </div>
                  {details.roomDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-2">
                      <span>(-) Tesis Yaş İndirimi ({details.mainGuestAgeDetails.discountText})</span>
                      <span>-₺{details.roomDiscountAmount.toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-1 border-t border-blue-200/60 dark:border-blue-900/80">
                    <span>Net Oda Konaklama Tutarı:</span>
                    <span>₺{details.netRoomRate.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                {/* 2. RESTAURANT & CAFE HARCAMALARI */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 border-b pb-1.5">
                    <span>2. Açık Restoran & Kafeterya Harcamaları</span>
                    <span>₺{details.restaurantTotal.toLocaleString('tr-TR')}</span>
                  </div>

                  {details.restaurantItems.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-2">Odaya yazılmış açık restoran/kafeterya harcaması bulunmuyor.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {details.restaurantItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="font-bold">{item.title}</span>
                            <span className="text-[10px] text-slate-400 block">{item.date} • {item.category}</span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">₺{item.finalAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. ADVANCE PAYMENT / KAPORA */}
                {details.advancePayment > 0 && (
                  <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span>(-) Girişte Alınan Kapora / Ön Ödeme:</span>
                    <span>-₺{details.advancePayment.toLocaleString('tr-TR')}</span>
                  </div>
                )}
              </div>

              {/* GRAND TOTAL BOX */}
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-xs font-extrabold text-slate-400 block uppercase">Tahsil Edilecek Net Balans</span>
                  <span className="text-[10px] text-slate-400">Brüt Toplam: ₺{details.grossTotal.toLocaleString('tr-TR')} {details.advancePayment > 0 ? `(-₺${details.advancePayment.toLocaleString('tr-TR')} Kapora)` : ''}</span>
                </div>
                <div className="text-2xl font-black text-amber-400">
                  ₺{details.netPayableBalance.toLocaleString('tr-TR')}
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Tahsilat Ödeme Yöntemi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Kredi Kartı', label: '💳 Kredi Kartı' },
                    { id: 'Nakit', label: '💵 Nakit' },
                    { id: 'Havale / EFT', label: '🏦 Havale' },
                    { id: 'Kombine / Cari', label: '📋 Cari / Diğer' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(m.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        checkoutPaymentMethod === m.id
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handlePrintFolio(checkOutModalRoom, checkoutPaymentMethod)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Detaylı Folio Ekstresi Yazdır</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckOutModalRoom(null)}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteCheckOut(checkOutModalRoom)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Tahsil Et & Check-Out Kapat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* MODAL: AGE DISCOUNT & PRICING POLICY SETTINGS */}
      {isAgePolicyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Tesis Fiyat & Yaş İndirim Politikası
                  </h3>
                  <p className="text-xs text-slate-500">Konaklama ve restoran adisyonlarında otomatik yaş indirimi kuralları</p>
                </div>
              </div>
              <button onClick={() => setIsAgePolicyModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* TOGGLE: GENERAL AGE DISCOUNT POLICY ENABLED */}
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-100 block">Tesis Geneli Yaş İndirimleri</span>
                  <span className="text-[11px] text-slate-500 font-medium">Aktif edilirse yaş grubuna göre otomatik indirim uygulanır.</span>
                </div>
                <button
                  type="button"
                  onClick={() => saveAgePolicy({ ...ageDiscountPolicy, enabled: !ageDiscountPolicy.enabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    ageDiscountPolicy.enabled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {ageDiscountPolicy.enabled ? '🟢 AKTİF' : '🔴 PASİF (İndirimsiz)'}
                </button>
              </div>

              {/* APPLICABILITY TOGGLES */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">Konaklamada İndirim</span>
                  <button
                    type="button"
                    onClick={() => saveAgePolicy({ ...ageDiscountPolicy, apply_to_room: !ageDiscountPolicy.apply_to_room })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold w-full cursor-pointer ${
                      ageDiscountPolicy.apply_to_room ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {ageDiscountPolicy.apply_to_room ? '✅ Konaklamada Uygula' : '❌ Uygulama'}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">Restoranda İndirim</span>
                  <button
                    type="button"
                    onClick={() => saveAgePolicy({ ...ageDiscountPolicy, apply_to_restaurant: !ageDiscountPolicy.apply_to_restaurant })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold w-full cursor-pointer ${
                      ageDiscountPolicy.apply_to_restaurant ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {ageDiscountPolicy.apply_to_restaurant ? '✅ Restoranda Uygula' : '❌ Uygulama'}
                  </button>
                </div>
              </div>

              {/* AGE BRACKET RATES */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Yaş Grubu İndirim Oranları (%)</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase block">0 - 2 Yaş Bebek İndirimi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ageDiscountPolicy.infant_0_2_rate}
                      onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, infant_0_2_rate: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase block">3 - 6 Yaş Çocuk İndirimi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ageDiscountPolicy.toddler_3_6_rate}
                      onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, toddler_3_6_rate: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase block">7 - 12 Yaş Çocuk İndirimi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ageDiscountPolicy.child_7_12_rate}
                      onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, child_7_12_rate: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase block">65+ Yaş Kıdemli İndirimi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ageDiscountPolicy.senior_65_plus_rate}
                      onChange={(e) => saveAgePolicy({ ...ageDiscountPolicy, senior_65_plus_rate: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* STORE DATE FORMAT PREFERENCE */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                    Tarih Görünüm Modeli (Varsayılan: GG/AA/YYYY)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Mağazanıza özel otel rezervasyon ve konaklama tarih gösterim formatını seçin:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'DD/MM/YYYY', label: 'gg/aa/yyyy', example: '24/08/2026 (Varsayılan)' },
                    { id: 'DD.MM.YYYY', label: 'gg.aa.yyyy', example: '24.08.2026 (Noktalı)' },
                    { id: 'YYYY-MM-DD', label: 'yyyy-aa-gg', example: '2026-08-24 (ISO)' },
                    { id: 'DD MMM YYYY', label: 'gg Aaa yyyy', example: '24 Ağustos 2026 (Metin)' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => saveStoreDateFormat(f.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        storeDateFormat === f.id
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-black">{f.label}</div>
                      <div className={`text-[10px] mt-0.5 ${storeDateFormat === f.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {f.example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => saveAgePolicy({
                    enabled: false,
                    apply_to_room: false,
                    apply_to_restaurant: false,
                    infant_0_2_rate: 0,
                    toddler_3_6_rate: 0,
                    child_7_12_rate: 0,
                    senior_65_plus_rate: 0
                  })}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Tüm İndirimleri Sıfırla (İndirimsiz Yap)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgePolicyModalOpen(false)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Ayarları Kaydet ve Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { playHotelReservationChime } from "../../utils/hotelSound";
import { HotelCheckInModal } from "./hotel/HotelCheckInModal";
import { HotelRoomEditModal } from "./hotel/HotelRoomEditModal";
import { HotelFolioModal } from "./hotel/HotelFolioModal";
import { HotelAgePolicyModal } from "./hotel/HotelAgePolicyModal";
import { HotelCheckoutReceiptModal } from "./hotel/HotelCheckoutReceiptModal";
import { HotelOnlineBookingDetailModal } from "./hotel/HotelOnlineBookingDetailModal";
import { HotelAssignRoomModal } from "./hotel/HotelAssignRoomModal";
import { HotelCalendarTab } from "./hotel/HotelCalendarTab";
import { HotelGuestsTab } from "./hotel/HotelGuestsTab";
import { HotelOnlineBookingsTab } from "./hotel/HotelOnlineBookingsTab";
import { HotelAgeCategoryDrilldownModal } from "./hotel/HotelAgeCategoryDrilldownModal";
import { HotelInspectGuestModal } from "./hotel/HotelInspectGuestModal";
import { HotelReservationDetailModal } from "./hotel/HotelReservationDetailModal";
import { HotelRoomDetailModal } from "./hotel/HotelRoomDetailModal";
import {
  HotelRoom,
  RoomReservation,
  ParsedBedAndCapacity,
  parseBedAndCapacity,
  getDemoRooms
} from "./hotel/hotelTypes";

export {
  type HotelRoom,
  type RoomReservation,
  type ParsedBedAndCapacity,
  parseBedAndCapacity,
  getDemoRooms
};
import { 
  Building2, 
  DoorOpen,
  BedDouble, 
  BedSingle,
  Bed,
  User,
  Users, 
  Calendar, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus,
  Armchair,
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
  ChevronDown,
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
  Check,
  Hotel,
  Settings2,
  Coffee,
  Bell,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  CheckCheck,
  RefreshCw,
  Eye
} from "lucide-react";

interface HotelRoomManagementProps {
  storeId?: number;
  isTr: boolean;
  initialRooms?: HotelRoom[];
  onRoomsUpdated?: (rooms: HotelRoom[]) => void;
  onChargeOrderToRoom?: (roomNumber: string, amount: number, orderTitle: string) => void;
}

export const HotelRoomManagement: React.FC<HotelRoomManagementProps> = ({
  storeId,
  isTr,
  initialRooms,
  onRoomsUpdated,
  onChargeOrderToRoom
}) => {
  const isInitialMount = React.useRef(true);
  // Initial Rooms state synced from props, storage or default mock rooms
  const [rooms, setRooms] = useState<HotelRoom[]>(() => {
    if (initialRooms && Array.isArray(initialRooms) && initialRooms.length > 0) {
      return initialRooms;
    }
    const saved = localStorage.getItem(`hotel_rooms_${storeId || 'default'}`);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
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

  // Fetch authoritative rooms directly from backend on mount
  useEffect(() => {
    if (storeId) {
      api.getHotelRooms(storeId).then((res: any) => {
        if (res && res.success && Array.isArray(res.rooms) && res.rooms.length > 0) {
          setRooms(res.rooms);
          localStorage.setItem(`hotel_rooms_${storeId}`, JSON.stringify(res.rooms));
          onRoomsUpdated?.(res.rooms);
        }
      }).catch((e) => {
        console.warn("Could not fetch hotel rooms from API:", e);
      });
    }
  }, [storeId]);

  // Save to localStorage, dispatch custom window sync event & persist to backend database upon user modification
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(rooms));
    try {
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms } }));
    } catch (e) {}

    onRoomsUpdated?.(rooms);

    if (storeId) {
      api.updateHotelRooms(rooms, storeId).catch(() => {
        api.updateBranding({ hotel_rooms: rooms }, storeId).catch(() => {});
      });
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
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'calendar' | 'guests' | 'online_reservations'>('grid');
  
  // Online Web Reservations States
  const [onlineReservations, setOnlineReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [onlineReservationFilter, setOnlineReservationFilter] = useState<'all' | 'pending_action' | 'confirmed' | 'checked_in' | 'cancelled'>('pending_action');
  const [onlineReservationSearch, setOnlineReservationSearch] = useState('');
  const [selectedOnlineResModal, setSelectedOnlineResModal] = useState<any | null>(null);
  const [assignRoomModalRes, setAssignRoomModalRes] = useState<any | null>(null);
  const [selectedTargetRoomId, setSelectedTargetRoomId] = useState<string>('');

  const fetchOnlineReservations = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoadingReservations(true);
      const res = await api.getHotelReservations(storeId);
      setOnlineReservations(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching online hotel reservations:", err);
    } finally {
      setLoadingReservations(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchOnlineReservations();
    const interval = setInterval(fetchOnlineReservations, 15000);

    const handleUpdate = () => {
      fetchOnlineReservations();
    };

    window.addEventListener('hotel_reservation_created', handleUpdate);
    window.addEventListener('hotel_reservations_updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hotel_reservation_created', handleUpdate);
      window.removeEventListener('hotel_reservations_updated', handleUpdate);
    };
  }, [fetchOnlineReservations]);

  const pendingReservationsCount = useMemo(() => {
    return (onlineReservations || []).filter(r => r && r.status === 'pending_action').length;
  }, [onlineReservations]);

  // Online Reservation Actions
  const handleCheckInOnlineReservation = async (res: any, chosenRoomId?: string) => {
    if (!res) return;
    
    // Find matching room
    const targetRoomId = chosenRoomId || res.room_id;
    let targetRoom = rooms.find(r => r.id === targetRoomId || (r.room_number && r.room_number === res.room_number));
    
    if (!targetRoom && !chosenRoomId) {
      // Prompt operator to select a room
      setAssignRoomModalRes(res);
      setSelectedTargetRoomId(rooms[0]?.id || '');
      return;
    }

    if (!targetRoom && chosenRoomId) {
      targetRoom = rooms.find(r => r.id === chosenRoomId);
    }

    if (!targetRoom) {
      alert("Lütfen misafirin yerleştirileceği geçerli bir oda seçiniz.");
      return;
    }

    const checkInDate = res.check_in_date || new Date().toISOString().split('T')[0];
    const checkOutDate = res.check_out_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const totalAmount = Number(res.total_amount) || 0;
    const boardType = res.board_type || 'BB';
    const boardName = res.board_name || 'Oda Kahvaltı (BB)';

    const extraGuests = Array.isArray(res.details?.extraGuests) ? res.details.extraGuests : [];

    const updatedRooms = rooms.map(r => {
      if (r.id === targetRoom.id) {
        return {
          ...r,
          status: 'occupied' as const,
          current_guest: {
            id: `guest-${Date.now()}`,
            identity_no: res.guest_identity_no || '11111111111',
            first_name: res.guest_first_name || res.guest_name || 'Misafir',
            last_name: res.guest_last_name || '',
            birth_date: res.guest?.birth_date || undefined,
            age: 30,
            age_category: 'adult' as const,
            discount_rate: 0,
            phone: res.guest_phone || '',
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            board_type: boardType,
            additional_guests: extraGuests
          },
          folio: {
            id: `folio-${Date.now()}`,
            total_amount: totalAmount,
            items: [
              {
                id: `item-${Date.now()}`,
                title: `Web Konaklama (${res.nights || 1} Gece - ${boardName})`,
                amount: totalAmount,
                date: checkInDate,
                category: "Room Charge"
              }
            ]
          }
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    try {
      localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(updatedRooms));
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms: updatedRooms } }));
    } catch (e) {}

    // Update backend reservation status to checked_in (marks alert as passive)
    try {
      await api.updateHotelReservationStatus(res.id, 'checked_in', {
        room_id: targetRoom.id,
        room_number: targetRoom.room_number
      }, storeId);
      
      setOnlineReservations(prev => prev.map(item => item.id === res.id ? { ...item, status: 'checked_in', room_id: targetRoom.id, room_number: targetRoom.room_number } : item));
      window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));
    } catch (err) {
      console.error("Failed to update reservation status in backend:", err);
    }

    setAssignRoomModalRes(null);
    setSelectedOnlineResModal(null);
    alert(isTr ? `Oda #${targetRoom.room_number} için misafir girişi başarıyla yapıldı. Bildirim pasife alındı.` : `Check-in completed for Room #${targetRoom.room_number}.`);
  };

  const handleConfirmOnlineReservation = async (res: any) => {
    if (!res) return;

    // Add to room's reservations list if room found
    const targetRoom = rooms.find(r => r.id === res.room_id || (r.room_number && r.room_number === res.room_number));
    if (targetRoom) {
      const updatedRooms = rooms.map(r => {
        if (r.id === targetRoom.id) {
          const existing = Array.isArray(r.reservations) ? r.reservations : [];
          return {
            ...r,
            reservations: [
              ...existing,
              {
                id: `res-${res.id || Date.now()}`,
                identity_no: res.guest_identity_no || '11111111111',
                first_name: res.guest_first_name || res.guest_name || 'Misafir',
                last_name: res.guest_last_name || '',
                phone: res.guest_phone || '',
                check_in_date: res.check_in_date,
                check_out_date: res.check_out_date,
                board_type: res.board_type || 'BB',
                source: 'Web Online',
                status: 'confirmed'
              }
            ]
          };
        }
        return r;
      });
      setRooms(updatedRooms);
      try {
        localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(updatedRooms));
        window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms: updatedRooms } }));
      } catch (e) {}
    }

    try {
      await api.updateHotelReservationStatus(res.id, 'confirmed', {}, storeId);
      setOnlineReservations(prev => prev.map(item => item.id === res.id ? { ...item, status: 'confirmed' } : item));
      window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));
    } catch (err) {
      console.error("Failed to confirm reservation:", err);
    }

    setSelectedOnlineResModal(null);
    alert(isTr ? "Rezervasyon onaylandı ve bildirim pasif duruma alındı." : "Reservation confirmed and alert dismissed.");
  };

  const handleAcknowledgeOnlineReservation = async (res: any) => {
    if (!res) return;
    try {
      await api.updateHotelReservationStatus(res.id, 'confirmed', {}, storeId);
      setOnlineReservations(prev => prev.map(item => item.id === res.id ? { ...item, status: 'confirmed' } : item));
      window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));
    } catch (err) {
      console.error("Failed to acknowledge reservation:", err);
    }
    setSelectedOnlineResModal(null);
    alert(isTr ? "İşlem yapıldı olarak kaydedildi, uyarı pasife alındı." : "Marked as processed.");
  };

  const handleCancelOnlineReservation = async (res: any) => {
    if (!res) return;
    if (!window.confirm(isTr ? "Bu rezervasyonu iptal etmek istediğinize emin misiniz? Uyarı pasif duruma alınacaktır." : "Cancel this reservation?")) {
      return;
    }
    try {
      await api.updateHotelReservationStatus(res.id, 'cancelled', {}, storeId);
      setOnlineReservations(prev => prev.map(item => item.id === res.id ? { ...item, status: 'cancelled' } : item));
      window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
    }
    setSelectedOnlineResModal(null);
    alert(isTr ? "Rezervasyon iptal edildi, uyarı pasif duruma alındı." : "Reservation cancelled.");
  };

  // Revise Reservation Details (from Calendar or Room Reservations List)
  const handleSaveReservationRevision = async (roomId: string, updatedRes: RoomReservation) => {
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId || (selectedReservationModal && r.room_number === selectedReservationModal.room.room_number)) {
        const reservations = Array.isArray(r.reservations) ? r.reservations : [];
        const nextReservations = reservations.map(res => {
          if (res.id === updatedRes.id) {
            return { ...res, ...updatedRes };
          }
          return res;
        });

        // Also if room is currently occupied by this guest, update current_guest as well
        let currentGuest = r.current_guest;
        if (r.status === 'occupied' && currentGuest) {
          if (currentGuest.id === updatedRes.id || currentGuest.identity_no === updatedRes.identity_no) {
            currentGuest = {
              ...currentGuest,
              first_name: updatedRes.first_name,
              last_name: updatedRes.last_name,
              identity_no: updatedRes.identity_no,
              phone: updatedRes.phone || currentGuest.phone,
              email: (updatedRes as any).email || currentGuest.email,
              check_in_date: updatedRes.check_in_date || currentGuest.check_in_date,
              check_out_date: updatedRes.check_out_date || currentGuest.check_out_date,
              board_type: updatedRes.board_type || currentGuest.board_type,
              notes: updatedRes.notes || currentGuest.notes
            };
          }
        }

        return {
          ...r,
          reservations: nextReservations,
          current_guest: currentGuest
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    try {
      localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(updatedRooms));
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms: updatedRooms } }));
    } catch (e) {}

    // Check if there is an online reservation corresponding to this
    const matchedOnline = onlineReservations.find(item => 
      item.id === updatedRes.id || 
      `res-${item.id}` === updatedRes.id ||
      item.guest_identity_no === updatedRes.identity_no
    );
    if (matchedOnline) {
      try {
        await api.updateHotelReservationStatus(matchedOnline.id, matchedOnline.status, {
          guest_first_name: updatedRes.first_name,
          guest_last_name: updatedRes.last_name,
          guest_identity_no: updatedRes.identity_no,
          guest_phone: updatedRes.phone,
          guest_email: (updatedRes as any).email,
          check_in_date: updatedRes.check_in_date,
          check_out_date: updatedRes.check_out_date,
          board_type: updatedRes.board_type,
          special_requests: updatedRes.notes
        }, storeId);

        setOnlineReservations(prev => prev.map(item => item.id === matchedOnline.id ? {
          ...item,
          guest_first_name: updatedRes.first_name,
          guest_last_name: updatedRes.last_name,
          guest_identity_no: updatedRes.identity_no,
          guest_phone: updatedRes.phone,
          guest_email: (updatedRes as any).email,
          check_in_date: updatedRes.check_in_date,
          check_out_date: updatedRes.check_out_date,
          board_type: updatedRes.board_type,
          special_requests: updatedRes.notes
        } : item));
        window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));
      } catch (err) {
        console.error("Failed to update matched online reservation:", err);
      }
    }

    if (selectedReservationModal) {
      setSelectedReservationModal({
        ...selectedReservationModal,
        res: updatedRes
      });
    }

    alert(isTr ? "Rezervasyon ve misafir bilgileri başarıyla güncellendi." : "Reservation updated successfully.");
  };

  // Revise Online Reservation Details
  const handleSaveOnlineReservationRevision = async (resId: number | string, updatedData: any) => {
    try {
      const targetRes = onlineReservations.find(r => r.id === resId);
      const currentStatus = targetRes?.status || 'pending_action';
      await api.updateHotelReservationStatus(resId, currentStatus, updatedData, storeId);

      setOnlineReservations(prev => prev.map(item => item.id === resId ? { ...item, ...updatedData } : item));
      window.dispatchEvent(new CustomEvent('hotel_reservations_updated', { detail: { storeId } }));

      // Also check if any room has this reservation and update it
      const updatedRooms = rooms.map(r => {
        const reservations = Array.isArray(r.reservations) ? r.reservations : [];
        let hasMatch = false;
        const nextReservations = reservations.map(res => {
          if (res.id === resId || res.id === `res-${resId}` || (targetRes && res.identity_no === targetRes.guest_identity_no)) {
            hasMatch = true;
            return {
              ...res,
              first_name: updatedData.guest_first_name || res.first_name,
              last_name: updatedData.guest_last_name || res.last_name,
              identity_no: updatedData.guest_identity_no || res.identity_no,
              phone: updatedData.guest_phone || res.phone,
              email: updatedData.guest_email || (res as any).email,
              check_in_date: updatedData.check_in_date || res.check_in_date,
              check_out_date: updatedData.check_out_date || res.check_out_date,
              board_type: updatedData.board_name || res.board_type
            };
          }
          return res;
        });

        if (hasMatch) {
          return { ...r, reservations: nextReservations };
        }
        return r;
      });

      setRooms(updatedRooms);
      try {
        localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(updatedRooms));
        window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms: updatedRooms } }));
      } catch (e) {}

      if (selectedOnlineResModal && selectedOnlineResModal.id === resId) {
        setSelectedOnlineResModal({
          ...selectedOnlineResModal,
          ...updatedData
        });
      }

      alert(isTr ? "Web rezervasyon bilgileri başarıyla güncellendi." : "Online booking updated successfully.");
    } catch (err: any) {
      console.error("Failed to update online reservation:", err);
      alert(err.message || (isTr ? "Rezervasyon güncellenirken hata oluştu." : "Failed to update reservation."));
    }
  };

  // Revise Room Guests (Current Guest and Additional Guests)
  const handleReviseRoomGuests = (roomId: string, updatedCurrentGuest: any, updatedAdditionalGuests: any[]) => {
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          current_guest: updatedCurrentGuest,
          additional_guests: updatedAdditionalGuests
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    try {
      localStorage.setItem(`hotel_rooms_${storeId || 'default'}`, JSON.stringify(updatedRooms));
      window.dispatchEvent(new CustomEvent('hotel_rooms_updated', { detail: { storeId, rooms: updatedRooms } }));
    } catch (e) {}

    if (selectedRoomDetailModal && selectedRoomDetailModal.id === roomId) {
      setSelectedRoomDetailModal({
        ...selectedRoomDetailModal,
        current_guest: updatedCurrentGuest,
        additional_guests: updatedAdditionalGuests
      });
    }

    alert(isTr ? "Oda misafir bilgileri başarıyla güncellendi." : "Room guest details updated successfully.");
  };

  const [selectedAgeCategoryModal, setSelectedAgeCategoryModal] = useState<{
    category: string;
    title: string;
    badge: string;
    guests: any[];
  } | null>(null);
  const [inspectGuestModal, setInspectGuestModal] = useState<any | null>(null);
  const [guestListSearch, setGuestListSearch] = useState<string>('');
  const [guestListCategoryFilter, setGuestListCategoryFilter] = useState<'all' | 'adults' | 'children_all' | 'infants' | 'toddlers' | 'school_teens' | 'occupied_only'>('all');
  const [roomDisplayMode, setRoomDisplayMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem(`hotelRoomDisplayMode_${storeId}`);
      if (saved === 'grid' || saved === 'list') return saved;
    } catch (e) {}
    return 'list'; // Default: Liste (Tablo) Görünümü
  });

  const [completedCheckoutData, setCompletedCheckoutData] = useState<{
    room: HotelRoom;
    guest: any;
    details: any;
    paymentMethod: string;
    timestamp: string;
  } | null>(null);

  const [checkoutQuickExpense, setCheckoutQuickExpense] = useState<{ title: string; amount: number; category: string }>({
    title: "",
    amount: 0,
    category: "Restoran / Mini Bar"
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
  const [isPmsExpanded, setIsPmsExpanded] = useState(false);
  const [isServisDisiDetailsOpen, setIsServisDisiDetailsOpen] = useState(false);

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
    const safeRooms = Array.isArray(rooms) ? rooms : [];
    const roomsToExport = targetRoomsList || safeRooms.filter(r => r && r.status === 'occupied' && r.current_guest);
    
    if ((roomsToExport?.length || 0) === 0) {
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
    const guestRowsHtml = (roomsToExport || []).flatMap(room => {
      if (!room) return [];
      const list: string[] = [];
      if (room.current_guest) {
        const cg = room.current_guest;
        list.push(`
          <tr>
            <td style="text-align:center; font-weight:bold;">${guestIndex++}</td>
            <td><strong>Oda #${room.room_number || ''}</strong><br/><span style="font-size:10px; color:#64748b;">${room.room_type || ''}</span></td>
            <td><strong style="letter-spacing:0.5px;">${cg.identity_no || 'Belirtilmedi'}</strong></td>
            <td><strong>${cg.first_name || ''} ${cg.last_name || ''}</strong></td>
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

      if (Array.isArray(room.additional_guests) && room.additional_guests.length > 0) {
        room.additional_guests.forEach(ag => {
          if (!ag) return;
          list.push(`
            <tr>
              <td style="text-align:center;">${guestIndex++}</td>
              <td>Oda #${room.room_number || ''}</td>
              <td><strong style="letter-spacing:0.5px;">${ag.identity_no || 'Belirtilmedi'}</strong></td>
              <td>${ag.first_name || ''} ${ag.last_name || ''}</td>
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

    const guestRecords: Array<{
      id: string;
      room_id: string;
      room_number: string;
      room_type: string;
      room_status: string;
      guest_type: 'primary' | 'additional' | 'reservation';
      role_label: string;
      first_name: string;
      last_name: string;
      full_name: string;
      age: number;
      age_category: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'senior';
      age_category_label: string;
      birth_date?: string;
      discount_text: string;
      discount_rate: number;
      check_in_date: string;
      check_out_date: string;
      board_type: string;
      identity_no?: string;
      phone?: string;
      folio_amount: number;
      room: HotelRoom;
    }> = [];

    (Array.isArray(rooms) ? rooms : []).forEach(room => {
      if (!room) return;
      const folioAmt = room.folio?.total_amount || 0;

      // In-House Active Staying Guests
      if (room.current_guest && (room.current_guest.first_name || room.status === 'occupied')) {
        const cg = room.current_guest;
        const cgIn = cg.check_in_date || new Date().toISOString().split('T')[0];
        const cgOut = cg.check_out_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const isStayingNow = room.status === 'occupied';
        const inDateWindow = (cgIn <= end && cgOut >= start) || (isStayingNow && cgIn <= end);

        if (inDateWindow) {
          const rawAge = typeof cg.age === 'number' ? cg.age : (Number(cg.age) || 30);
          const ageDet = calculateAgeDetails(cg.birth_date, rawAge);
          guestRecords.push({
            id: cg.id || `guest-${room.id || 'r'}-primary`,
            room_id: room.id || '',
            room_number: room.room_number || '',
            room_type: room.room_type || '',
            room_status: room.status || 'vacant',
            guest_type: 'primary',
            role_label: 'Asıl Misafir',
            first_name: cg.first_name || 'Misafir',
            last_name: cg.last_name || `(Oda ${room.room_number || ''})`,
            full_name: `${cg.first_name || 'Misafir'} ${cg.last_name || `(Oda ${room.room_number || ''})`}`.trim(),
            age: Number(ageDet.age) || 30,
            age_category: ageDet.bracket,
            age_category_label: ageDet.labelTr,
            birth_date: cg.birth_date,
            discount_text: ageDet.discountText,
            discount_rate: ageDet.discountRate,
            check_in_date: cgIn,
            check_out_date: cgOut,
            board_type: cg.board_type || 'BB',
            identity_no: cg.identity_no || '-',
            phone: cg.phone || '-',
            folio_amount: folioAmt,
            room
          });

          if (Array.isArray(room.additional_guests) && room.additional_guests.length > 0) {
            room.additional_guests.forEach((ag, idx) => {
              if (!ag) return;
              const agAgeNum = typeof ag.age === 'number' ? ag.age : (Number(ag.age) || (ag.age_category === 'infant' ? 1 : 25));
              const agAgeDet = calculateAgeDetails(ag.birth_date, agAgeNum);
              guestRecords.push({
                id: `guest-${room.id || 'r'}-ag-${idx}`,
                room_id: room.id || '',
                room_number: room.room_number || '',
                room_type: room.room_type || '',
                room_status: room.status || 'vacant',
                guest_type: 'additional',
                role_label: agAgeDet.age < 3 ? 'Bebek (0-2)' : agAgeDet.age <= 6 ? 'Küçük Çocuk (3-6)' : agAgeDet.age < 18 ? 'Çocuk / Genç' : 'Ek Misafir',
                first_name: ag.first_name || '',
                last_name: ag.last_name || '',
                full_name: `${ag.first_name || ''} ${ag.last_name || ''}`.trim() || `Ek Misafir ${idx + 1}`,
                age: Number(agAgeDet.age) || 0,
                age_category: agAgeDet.bracket,
                age_category_label: agAgeDet.labelTr,
                birth_date: ag.birth_date,
                discount_text: agAgeDet.discountText,
                discount_rate: agAgeDet.discountRate,
                check_in_date: cgIn,
                check_out_date: cgOut,
                board_type: cg.board_type || 'BB',
                identity_no: ag.identity_no || '-',
                phone: ag.phone || '-',
                folio_amount: 0,
                room
              });
            });
          }
        }
      }

      // Upcoming / Future Reservations
      if (Array.isArray(room.reservations) && room.reservations.length > 0) {
        room.reservations.forEach(r => {
          if (!r) return;
          const rIn = r.check_in_date || '';
          const rOut = r.check_out_date || '';

          if (rIn && rOut && rIn <= end && rOut >= start) {
            const rAgeDet = calculateAgeDetails(undefined, Number(r.main_guest_age) || 30);
            guestRecords.push({
              id: r.id || `res-${room.id || 'r'}-${r.check_in_date || 'date'}`,
              room_id: room.id || '',
              room_number: room.room_number || '',
              room_type: room.room_type || '',
              room_status: 'reserved',
              guest_type: 'reservation',
              role_label: 'Gelecek Rezervasyon',
              first_name: r.first_name || '',
              last_name: r.last_name || '',
              full_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Rezervasyon Misafiri',
              age: Number(rAgeDet.age) || 30,
              age_category: rAgeDet.bracket,
              age_category_label: rAgeDet.labelTr,
              birth_date: undefined,
              discount_text: rAgeDet.discountText,
              discount_rate: rAgeDet.discountRate,
              check_in_date: rIn,
              check_out_date: rOut,
              board_type: r.board_type || 'BB',
              identity_no: r.identity_no || '-',
              phone: r.phone || '-',
              folio_amount: 0,
              room
            });

            if (Array.isArray(r.guests) && r.guests.length > 0) {
              r.guests.forEach((g, gIdx) => {
                if (!g) return;
                const gAgeDet = calculateAgeDetails(g.birth_date, Number(g.age) || 6);
                guestRecords.push({
                  id: `res-guest-${room.id || 'r'}-${r.id || 'r'}-${gIdx}`,
                  room_id: room.id || '',
                  room_number: room.room_number || '',
                  room_type: room.room_type || '',
                  room_status: 'reserved',
                  guest_type: 'reservation',
                  role_label: gAgeDet.age < 3 ? 'Bebek (0-2)' : gAgeDet.age <= 6 ? 'Küçük Çocuk (3-6)' : gAgeDet.age < 18 ? 'Çocuk / Genç' : 'Ek Misafir',
                  first_name: `Misafir ${gIdx + 1}`,
                  last_name: `(${r.last_name || ''})`,
                  full_name: `Misafir ${gIdx + 1} (${r.last_name || ''})`,
                  age: Number(gAgeDet.age) || 0,
                  age_category: gAgeDet.bracket,
                  age_category_label: gAgeDet.labelTr,
                  birth_date: g.birth_date,
                  discount_text: gAgeDet.discountText,
                  discount_rate: gAgeDet.discountRate,
                  check_in_date: rIn,
                  check_out_date: rOut,
                  board_type: r.board_type || 'BB',
                  identity_no: '-',
                  phone: r.phone || '-',
                  folio_amount: 0,
                  room
                });
              });
            }
          }
        });
      }

      // Aggregate counts within selected date range
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
          first_name: room.current_guest.first_name || '',
          last_name: room.current_guest.last_name || '',
          main_age: room.current_guest.age,
          board_type: room.current_guest.board_type || 'BB',
          guests: Array.isArray(room.additional_guests) ? room.additional_guests.map(ag => ({ age: ag.age, birth_date: ag.birth_date })) : []
        });
      }

      if (Array.isArray(room.reservations) && room.reservations.length > 0) {
        room.reservations.forEach(r => {
          if (!r) return;
          list.push({
            check_in: r.check_in_date || '',
            check_out: r.check_out_date || '',
            first_name: r.first_name || '',
            last_name: r.last_name || '',
            main_age: r.main_guest_age || 30,
            board_type: r.board_type || 'BB',
            guests: Array.isArray(r.guests) ? r.guests : []
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
          const personsCount = 1 + (res.guests?.length || 0);
          const isPerPerson = room.pricing_type !== 'per_room';
          const applicablePrice = isPerPerson ? (roomPrice * personsCount) : roomPrice;
          
          estimatedRevenue += nights * applicablePrice;

          if (res.board_type && boardCounts[res.board_type] !== undefined) {
            boardCounts[res.board_type] += 1;
          }
        }
      });
    });

    // Also incorporate Online Reservations within the selected window if not already attached to rooms
    if (Array.isArray(onlineReservations) && onlineReservations.length > 0) {
      onlineReservations.forEach((ores: any) => {
        if (!ores || ores.status === 'cancelled') return;
        const alreadyCounted = guestRecords.some(gr => gr.id === ores.id || (gr.phone && ores.phone && gr.phone === ores.phone));
        if (alreadyCounted) return;

        const rIn = ores.check_in_date || '';
        const rOut = ores.check_out_date || '';
        if (rIn && rOut && rIn <= end && rOut >= start) {
          const mainAge = Number(ores.main_guest_age) || 32;
          const rAgeDet = calculateAgeDetails(ores.birth_date, mainAge);
          const matchedRoom = rooms.find(rm => rm.id === ores.room_id || rm.room_number === ores.room_number) || {
            id: ores.room_id || 'online-res',
            room_number: ores.room_number || 'Tahsis Bekliyor',
            room_type: ores.room_type || 'Online Rezervasyon',
            capacity: 2,
            status: 'vacant'
          } as HotelRoom;

          guestRecords.push({
            id: ores.id || `online-res-${Math.random()}`,
            room_id: matchedRoom.id,
            room_number: matchedRoom.room_number,
            room_type: matchedRoom.room_type,
            room_status: ores.status === 'checked_in' ? 'occupied' : 'reserved',
            guest_type: 'reservation',
            role_label: 'Online Rezervasyon',
            first_name: ores.first_name || ores.guest_name?.split(' ')[0] || 'Misafir',
            last_name: ores.last_name || ores.guest_name?.split(' ').slice(1).join(' ') || '',
            full_name: `${ores.first_name || ''} ${ores.last_name || ''}`.trim() || ores.guest_name || 'Online Misafir',
            age: Number(rAgeDet.age) || 30,
            age_category: rAgeDet.bracket,
            age_category_label: rAgeDet.labelTr,
            birth_date: ores.birth_date,
            discount_text: rAgeDet.discountText,
            discount_rate: rAgeDet.discountRate,
            check_in_date: rIn,
            check_out_date: rOut,
            board_type: ores.board_type || 'BB',
            identity_no: ores.identity_no || '-',
            phone: ores.phone || '-',
            folio_amount: 0,
            room: matchedRoom
          });

          if (ores.board_type && boardCounts[ores.board_type] !== undefined) {
            boardCounts[ores.board_type] += 1;
          }
        }
      });
    }

    const adultsList = guestRecords.filter(g => Number(g.age) >= 18);
    const infantsList = guestRecords.filter(g => Number(g.age) <= 2);
    const toddlersList = guestRecords.filter(g => Number(g.age) >= 3 && Number(g.age) <= 6);
    const childrenList = guestRecords.filter(g => Number(g.age) >= 7 && Number(g.age) <= 12);
    const teensList = guestRecords.filter(g => Number(g.age) >= 13 && Number(g.age) <= 17);
    const schoolAgeList = guestRecords.filter(g => Number(g.age) >= 7 && Number(g.age) <= 17);
    const childrenAllList = guestRecords.filter(g => Number(g.age) < 18);

    totalAdults = adultsList.length;
    totalInfants = infantsList.length;
    totalToddlers = toddlersList.length;
    totalChildren = childrenList.length;
    totalTeens = teensList.length;
    const totalChildrenAll = childrenAllList.length;
    const totalGuests = guestRecords.length;

    const maxPossibleNights = Math.max(1, (Array.isArray(rooms) ? rooms.length : 1) * days);
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
      boardCounts,
      guestRecords,
      adultsList,
      infantsList,
      toddlersList,
      childrenList,
      teensList,
      schoolAgeList,
      childrenAllList
    };
  };

  // Flexible Form State Types
  interface RoomFormState {
    room_number: string;
    room_type: string;
    capacity: number;
    max_adults?: number;
    max_children?: number;
    bed_info: string;
    price_per_night: number;
    price_room_only?: number;
    price_half_board?: number;
    price_full_board?: number;
    price_all_inclusive?: number;
    price_ultra_all_inclusive?: number;
    board_prices?: any;
    non_refundable_discount?: number;
    amenitiesStr?: string;
    amenities?: string[];
    cover_image?: string;
    images?: string[];
    description?: string;
    status?: HotelRoom['status'];
    pricing_type?: 'per_room' | 'per_person';
    notes?: string;
  }

  interface GuestFormState {
    identity_no: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    phone: string;
    email?: string;
    gender?: string;
    nationality?: string;
    board_type?: string;
    advance_payment?: number;
    payment_method?: string;
    notes?: string;
    check_in_date: string;
    check_out_date: string;
    additionalGuests?: Array<{
      identity_no?: string;
      first_name: string;
      last_name: string;
      birth_date: string;
      age?: number;
      age_category?: 'infant' | 'child' | 'adult' | 'senior';
      discount_rate?: number;
      gender?: string;
      nationality?: string;
      phone?: string;
    }>;
  }

  // New Room Form State (Supports Board Prices, Amenities, Cover Photo & Discounts)
  const [roomForm, setRoomForm] = useState<RoomFormState>({
    room_number: "",
    room_type: "Standart Deniz Manzaralı",
    capacity: 2,
    bed_info: "",
    pricing_type: 'per_person',
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

  // Bed & Extra Bed / Floor Mattress Configurator State
  const [bedConfig, setBedConfig] = useState({
    doubleBeds: 1,
    singleBeds: 0,
    bunkBeds: 0,
    extraBeds: 0,
    floorMattress: 0,
    babyCribs: 0,
    sofaBeds: 0
  });

  // Helper to update bedConfig and sync with roomForm.bed_info & capacity
  const updateBedConfig = (key: 'doubleBeds' | 'singleBeds' | 'bunkBeds' | 'extraBeds' | 'floorMattress' | 'babyCribs' | 'sofaBeds', delta: number) => {
    setBedConfig(prev => {
      const nextVal = Math.max(0, (prev[key] || 0) + delta);
      const nextConfig = { ...prev, [key]: nextVal };

      const parts: string[] = [];
      if (nextConfig.doubleBeds > 0) parts.push(`${nextConfig.doubleBeds} Çift Kişilik Yatak`);
      if (nextConfig.singleBeds > 0) parts.push(`${nextConfig.singleBeds} Tek Kişilik Yatak`);
      if (nextConfig.bunkBeds > 0) parts.push(`${nextConfig.bunkBeds} Ranza`);
      if (nextConfig.extraBeds > 0) parts.push(`${nextConfig.extraBeds} Ekstra Yatak (Katlanır)`);
      if (nextConfig.floorMattress > 0) parts.push(`${nextConfig.floorMattress} Döşek / Yer Yatağı`);
      if (nextConfig.babyCribs > 0) parts.push(`${nextConfig.babyCribs} Bebek Yatağı / Beşik`);
      if (nextConfig.sofaBeds > 0) parts.push(`${nextConfig.sofaBeds} Açılır Koltuk / Çekyat`);

      const newBedInfo = parts.join(", ");

      const stdCapacity = (nextConfig.doubleBeds * 2) + nextConfig.singleBeds + (nextConfig.bunkBeds * 2) + nextConfig.extraBeds + nextConfig.floorMattress + nextConfig.sofaBeds;
      const suggestedCap = Math.max(1, stdCapacity);
      const suggestedAdults = Math.max(1, stdCapacity);
      const suggestedChildren = nextConfig.babyCribs > 0 ? nextConfig.babyCribs : (suggestedCap > 2 ? 1 : 0);

      setRoomForm(rf => ({
        ...rf,
        bed_info: newBedInfo,
        capacity: suggestedCap,
        max_adults: suggestedAdults,
        max_children: suggestedChildren
      }));

      return nextConfig;
    });
  };

  // Helper to open Add or Edit Room modal with synchronized states
  const openAddOrEditRoomModal = (roomToEdit?: HotelRoom | null) => {
    if (roomToEdit) {
      setEditingRoom(roomToEdit);
      const parsedBed = parseBedAndCapacity(roomToEdit);
      setBedConfig({
        doubleBeds: parsedBed.doubleBeds,
        singleBeds: parsedBed.bunkCount > 0 ? 0 : parsedBed.singleBeds,
        bunkBeds: parsedBed.bunkCount,
        extraBeds: parsedBed.extraBeds,
        floorMattress: parsedBed.floorMattress,
        babyCribs: parsedBed.babyCribs,
        sofaBeds: parsedBed.sofaBeds
      });
      setRoomForm({
        room_number: roomToEdit.room_number,
        room_type: roomToEdit.room_type,
        capacity: roomToEdit.capacity,
        max_adults: roomToEdit.max_adults,
        max_children: roomToEdit.max_children,
        bed_info: roomToEdit.bed_info || "",
        pricing_type: roomToEdit.pricing_type || 'per_person',
        price_per_night: roomToEdit.price_per_night || 2500,
        price_room_only: roomToEdit.board_prices?.room_only || Math.round((roomToEdit.price_per_night || 2500) * 0.88),
        price_half_board: roomToEdit.board_prices?.half_board || Math.round((roomToEdit.price_per_night || 2500) * 1.28),
        price_full_board: roomToEdit.board_prices?.full_board || Math.round((roomToEdit.price_per_night || 2500) * 1.56),
        price_all_inclusive: roomToEdit.board_prices?.all_inclusive || Math.round((roomToEdit.price_per_night || 2500) * 1.92),
        price_ultra_all_inclusive: roomToEdit.board_prices?.ultra_all_inclusive || 0,
        non_refundable_discount: roomToEdit.non_refundable_discount || 10,
        amenitiesStr: (roomToEdit.amenities || ["WiFi", "Deniz Manzarası", "Balkon", "Klima", "LCD TV"]).join(", "),
        cover_image: roomToEdit.cover_image || "",
        images: roomToEdit.images || (roomToEdit.cover_image ? [roomToEdit.cover_image] : []),
        description: roomToEdit.description || "",
        status: roomToEdit.status,
        notes: roomToEdit.notes || ""
      });
    } else {
      setEditingRoom(null);
      setBedConfig({
        doubleBeds: 1,
        singleBeds: 0,
        bunkBeds: 0,
        extraBeds: 0,
        floorMattress: 0,
        babyCribs: 0,
        sofaBeds: 0
      });
      setRoomForm({
        room_number: "",
        room_type: "Standart Deniz Manzaralı",
        capacity: 2,
        max_adults: 2,
        max_children: 0,
        bed_info: "1 Çift Kişilik Yatak",
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
    }
    setIsAddRoomModalOpen(true);
  };

  // Check-In Guest Form State
  const [guestForm, setGuestForm] = useState<GuestFormState>({
    identity_no: "",
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    email: "",
    gender: "Belirtilmedi",
    nationality: "TC - Türkiye",
    board_type: "bed_breakfast",
    advance_payment: 0,
    payment_method: "Kredi Kartı",
    notes: "",
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    additionalGuests: []
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
      const s = String(room.status || '');
      return s === 'vacant' || s === 'available' || s === 'clean' || !room.status || (s !== 'occupied' && s !== 'maintenance' && s !== 'staff' && s !== 'disabled');
    }
    return room.status === statusFilter;
  });

  // Calculate statistics
  const totalRooms = (Array.isArray(rooms) ? rooms : []).length;
  const occupiedRooms = (Array.isArray(rooms) ? rooms : []).filter(r => r && r.status === 'occupied').length;
  const todayCheckOuts = (Array.isArray(rooms) ? rooms : []).filter(r => r && isTodayCheckOut(r)).length;
  const maintenanceRooms = (Array.isArray(rooms) ? rooms : []).filter(r => r && (r.status === 'maintenance' || r.status === 'disabled')).length;
  const staffRooms = (Array.isArray(rooms) ? rooms : []).filter(r => r && r.status === 'staff').length;
  const availableRooms = (Array.isArray(rooms) ? rooms : []).filter(r => r && r.status === 'vacant').length;
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

    const roomImages = (Array.isArray(roomForm.images) && roomForm.images.length > 0)
      ? roomForm.images
      : (roomForm.cover_image ? [roomForm.cover_image] : []);

    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? {
        ...r,
        room_number: roomForm.room_number.trim(),
        room_type: roomForm.room_type,
        capacity: Number(roomForm.capacity) || 1,
        max_adults: roomForm.max_adults,
        max_children: roomForm.max_children,
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
        max_adults: roomForm.max_adults,
        max_children: roomForm.max_children,
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
      pricing_type: 'per_person',
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
    if (!checkInModalRoom) return;

    const idNo = (guestForm.identity_no || "").trim();
    const fName = (guestForm.first_name || "").trim();
    const lName = (guestForm.last_name || "").trim();

    if (!idNo || !fName || !lName) {
      alert(isTr 
        ? "⚠️ Zorunlu Alanlar Eksik!\n\nOda girişi ve rezervasyon kaydı için Misafir TC / Pasaport No, Adı ve Soyadı alanları zorunludur." 
        : "⚠️ Required fields missing!\n\nGuest ID / Passport, First Name, and Last Name are required.");
      return;
    }

    // Check Date Overlap Conflict ("Bu oda o tarihte doludur")
    const targetIn = guestForm.check_in_date;
    const targetOut = guestForm.check_out_date;

    const hasCurrentGuestConflict = checkInModalRoom.status === 'occupied' && 
      checkInModalRoom.current_guest &&
      checkInModalRoom.current_guest.check_in_date < targetOut && 
      checkInModalRoom.current_guest.check_out_date > targetIn;

    const matchedReservation = Array.isArray(checkInModalRoom.reservations) 
      ? checkInModalRoom.reservations.find(r => r.check_in_date < targetOut && r.check_out_date > targetIn)
      : null;

    if (hasCurrentGuestConflict || matchedReservation) {
      const conflictGuest = hasCurrentGuestConflict 
        ? `${checkInModalRoom.current_guest?.first_name} ${checkInModalRoom.current_guest?.last_name}`
        : `${matchedReservation?.first_name} ${matchedReservation?.last_name}`;
      
      alert(isTr
        ? `⚠️ Bu Oda Seçilen Tarihlerde Doludur!\n\nOda #${checkInModalRoom.room_number}, ${targetIn} - ${targetOut} tarihleri arasında çakışan bir konaklama / rezervasyon barındırıyor.\n\nMevcut Kayıt: ${conflictGuest}\nLütfen farklı bir tarih aralığı veya boş bir oda seçiniz.`
        : `⚠️ Room Occupied for Selected Dates!\n\nRoom #${checkInModalRoom.room_number} is already booked between ${targetIn} - ${targetOut}.\n\nExisting Guest: ${conflictGuest}\nPlease select another room or date.`);
      return;
    }

    // Validate additional guests if any
    if (Array.isArray(guestForm.additionalGuests) && guestForm.additionalGuests.length > 0) {
      for (let i = 0; i < guestForm.additionalGuests.length; i++) {
        const ag = guestForm.additionalGuests[i];
        if (!ag.first_name?.trim() || !ag.last_name?.trim() || !ag.identity_no?.trim()) {
          alert(isTr 
            ? `⚠️ ${i + 2}. Ek Misafir için TC / Pasaport No, Adı ve Soyadı alanları zorunludur.` 
            : `⚠️ Additional guest #${i + 2} requires ID / Passport, First Name, and Last Name.`);
          return;
        }
      }
    }

    const totalGuestsCount = 1 + (guestForm.additionalGuests?.length || 0);
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
        identity_no: (ag.identity_no || "").trim(),
        first_name: (ag.first_name || "").trim(),
        last_name: (ag.last_name || "").trim(),
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
      identity_no: (guestForm.identity_no || "").trim(),
      first_name: (guestForm.first_name || "").trim(),
      last_name: (guestForm.last_name || "").trim(),
      birth_date: guestForm.birth_date,
      age: mainGuestAgeDetails.age,
      age_category: mainGuestAgeDetails.category,
      discount_rate: mainGuestAgeDetails.discountRate,
      phone: guestForm.phone || "",
      email: guestForm.email || "",
      gender: guestForm.gender || "Kadın",
      nationality: guestForm.nationality || "TC - Türkiye",
      check_in_date: guestForm.check_in_date,
      check_out_date: guestForm.check_out_date,
      board_type: guestForm.board_type || "BB",
      advance_payment: Number(guestForm.advance_payment) || 0,
      payment_method: guestForm.payment_method || "credit_card",
      notes: (guestForm.notes || "").trim()
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
  // User Formula: oda fiyatı X kişi sayısı x konaklanacak gün sayısı - (yaş grubu indirimi hesapla) = toplam fiyat
  const computeRoomFolioDetails = (room: HotelRoom) => {
    const guest = room.current_guest;
    if (!guest) {
      return {
        nights: 1,
        totalPersons: 1,
        personList: [],
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
      nightlyRate = room.board_prices?.room_only || room.price_room_only || Math.round(nightlyRate * 0.88);
      boardTypeLabel = "Sadece Oda (RO)";
    } else if (bt.includes('half_board') || bt === 'hb') {
      nightlyRate = room.board_prices?.half_board || room.price_half_board || Math.round(nightlyRate * 1.28);
      boardTypeLabel = "Yarım Pansiyon (HB)";
    } else if (bt.includes('full_board') || bt === 'fb') {
      nightlyRate = room.board_prices?.full_board || room.price_full_board || Math.round(nightlyRate * 1.56);
      boardTypeLabel = "Tam Pansiyon (FB)";
    } else if (bt.includes('all_inclusive') || bt === 'ai') {
      nightlyRate = room.board_prices?.all_inclusive || room.price_all_inclusive || Math.round(nightlyRate * 1.92);
      boardTypeLabel = "Her Şey Dahil (AI)";
    } else if (bt.includes('ultra') || bt === 'uai') {
      nightlyRate = room.board_prices?.ultra_all_inclusive || room.price_ultra_all_inclusive || Math.round(nightlyRate * 2.30);
      boardTypeLabel = "Ultra Her Şey Dahil (UAI)";
    }

    // 3. Person count and individual breakdown
    // Core Formula: Oda Başı ise -> Toplam fiyat sabittir. Kişi Başı ise -> (fiyat X kişi sayısı x gece) - (yaş indirimleri).
    const isPerPerson = room.pricing_type !== 'per_room';
    const additionalGuests = Array.isArray(room.additional_guests) ? room.additional_guests : [];
    const totalPersons = 1 + additionalGuests.length;

    // Main guest calculation
    const mainGuestAgeDetails = calculateAgeDetails(guest.birth_date, guest.age);
    const mainGuestRaw = nightlyRate * nights;
    let mainGuestDiscount = 0;
    
    if (isPerPerson && ageDiscountPolicy.enabled && ageDiscountPolicy.apply_to_room && mainGuestAgeDetails.discountRate > 0) {
      mainGuestDiscount = Math.round(mainGuestRaw * (mainGuestAgeDetails.discountRate / 100));
    }
    const mainGuestNet = Math.max(0, mainGuestRaw - mainGuestDiscount);

    // Person list breakdown for itemized statements
    const personList = [
      {
        name: `${guest.first_name} ${guest.last_name}`,
        identityNo: guest.identity_no,
        isMain: true,
        age: mainGuestAgeDetails.age,
        category: mainGuestAgeDetails.labelTr,
        discountRate: isPerPerson ? mainGuestAgeDetails.discountRate : 0,
        rawRate: mainGuestRaw,
        discountAmount: mainGuestDiscount,
        netRate: mainGuestNet
      }
    ];

    let totalAdditionalRaw = 0;
    let totalAdditionalDiscount = 0;

    additionalGuests.forEach(ag => {
      const agAge = calculateAgeDetails(ag.birth_date, ag.age);
      const agRaw = isPerPerson ? (nightlyRate * nights) : 0;
      let agDiscount = 0;
      if (isPerPerson && ageDiscountPolicy.enabled && ageDiscountPolicy.apply_to_room && agAge.discountRate > 0) {
        agDiscount = Math.round(agRaw * (agAge.discountRate / 100));
      }
      const agNet = Math.max(0, agRaw - agDiscount);
      totalAdditionalRaw += agRaw;
      totalAdditionalDiscount += agDiscount;

      personList.push({
        name: `${ag.first_name} ${ag.last_name}`,
        identityNo: ag.identity_no || '-',
        isMain: false,
        age: agAge.age,
        category: agAge.labelTr,
        discountRate: isPerPerson ? agAge.discountRate : 0,
        rawRate: agRaw,
        discountAmount: agDiscount,
        netRate: agNet
      });
    });

    const totalRawRoomRate = mainGuestRaw + totalAdditionalRaw; 
    const roomDiscountAmount = mainGuestDiscount + totalAdditionalDiscount;
    const netRoomRate = Math.max(0, totalRawRoomRate - roomDiscountAmount);

    // 4. Restaurant & Cafe Items (from folio)
    const rawItems = room.folio?.items || [];
    const restaurantItems = rawItems.map(item => {
      return {
        ...item,
        rawAmount: item.amount,
        finalAmount: item.amount
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
      totalPersons,
      personList,
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
    const guestSnapshot = { ...room.current_guest };
    const roomSnapshot = { ...room };
    const pMethod = checkoutPaymentMethod || "Kredi Kartı";
    const timestampStr = new Date().toISOString();

    // 1. Vacate Room and Clear Guest & Folio State in State immediately
    setRooms(prevRooms => prevRooms.map(r => r.id === room.id ? {
      ...r,
      status: 'vacant',
      current_guest: undefined,
      additional_guests: undefined,
      folio: undefined,
      notes: ''
    } : r));

    // 2. Save to checkout history archive in localStorage
    try {
      const savedHistoryStr = localStorage.getItem(`hotelCheckoutHistory_${storeId}`);
      const historyList = savedHistoryStr ? JSON.parse(savedHistoryStr) : [];
      const newArchiveRecord = {
        id: `cout-${Date.now()}`,
        room_number: room.room_number,
        room_type: room.room_type,
        guest_name: `${guestSnapshot.first_name} ${guestSnapshot.last_name}`,
        identity_no: guestSnapshot.identity_no,
        phone: guestSnapshot.phone || '-',
        check_in_date: details.checkInDate,
        check_out_date: details.checkOutDate,
        nights: details.nights,
        total_persons: details.totalPersons,
        board_type: details.boardTypeLabel,
        net_room_rate: details.netRoomRate,
        restaurant_total: details.restaurantTotal,
        gross_total: details.grossTotal,
        advance_payment: details.advancePayment,
        net_collected: details.netPayableBalance,
        payment_method: pMethod,
        timestamp: timestampStr
      };
      historyList.unshift(newArchiveRecord);
      localStorage.setItem(`hotelCheckoutHistory_${storeId}`, JSON.stringify(historyList));
    } catch (e) {}

    // 3. Set Completed Checkout Data to show full detailed on-screen statement receipt
    setCompletedCheckoutData({
      room: roomSnapshot,
      guest: guestSnapshot,
      details,
      paymentMethod: pMethod,
      timestamp: timestampStr
    });

    // 4. Safely attempt popup / system print window
    try {
      handlePrintFolio(roomSnapshot, pMethod);
    } catch (err) {
      console.warn("Print window could not be opened automatically, using in-app statement modal", err);
    }

    // 5. Close Check-out modal
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
    const restaurantRowsHtml = (Array.isArray(details.restaurantItems) && details.restaurantItems.length > 0)
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
      {/* HEADER SECTION - RECONSTRUCTED & COLLAPSIBLE / MINIMALIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-xs shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xs tracking-wide text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              Horeca PMS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPmsExpanded(!isPmsExpanded)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer flex items-center gap-1 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
          >
            <span className="text-[11px]">{isTr ? (isPmsExpanded ? "İşlemleri Gizle" : "İşlemleri Göster") : (isPmsExpanded ? "Hide Actions" : "Show Actions")}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isPmsExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isPmsExpanded && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 transition-all">
            {/* REZERVASYON EKLE */}
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
              className="p-2.5 sm:px-3 sm:py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title={isTr ? "Rezervasyon Ekle" : "Add Booking"}
            >
              <Plus className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{isTr ? "Rezervasyon Ekle" : "Add Booking"}</span>
            </button>

            {/* İNDİRİMLER */}
            <button
              type="button"
              onClick={() => setIsAgePolicyModalOpen(true)}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title={isTr ? "İndirimler (Yaş Politikaları)" : "Discounts"}
            >
              <SlidersHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">{isTr ? "İndirimler" : "Discounts"}</span>
            </button>

            {/* EXCEL RAPORU */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              title={isTr ? "Excel Raporu Al" : "Export Excel"}
            >
              <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{isTr ? "Excel Raporu" : "Excel"}</span>
            </button>

            {/* YENİ ODA EKLE */}
            <button
              type="button"
              onClick={() => openAddOrEditRoomModal(null)}
              className="p-2.5 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title={isTr ? "Yeni Oda Ekle" : "Add Room"}
            >
              <Building2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">{isTr ? "Yeni Oda Ekle" : "Add Room"}</span>
            </button>
          </div>
        )}
      </div>

      {/* MAIN VIEW MODE SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs gap-1.5 max-w-full">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('grid')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeViewMode === 'grid'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
          >
            <BedDouble className="h-4 w-4 shrink-0" />
            <span>{isTr ? "Odalar" : "Rooms"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('calendar')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeViewMode === 'calendar'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{isTr ? "Takvim" : "Calendar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('guests')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial ${
              activeViewMode === 'guests'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>{isTr ? "Misafirler" : "Guests"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('online_reservations')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer flex-1 sm:flex-initial relative ${
              activeViewMode === 'online_reservations'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80'
            }`}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>{isTr ? "Web Rezervasyonları" : "Web Bookings"}</span>
            {pendingReservationsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[10px] rounded-full shadow-xs">
                {pendingReservationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ONLINE WEB RESERVATION WARNING ALERT BANNER */}
      {pendingReservationsCount > 0 && activeViewMode !== 'online_reservations' && (
        <div className="p-3.5 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {isTr ? `Web Rezervasyon Talepleri (${pendingReservationsCount} Bekleyen)` : `Web Hotel Bookings (${pendingReservationsCount})`}
                </h3>
                <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold rounded-md uppercase">
                  {isTr ? 'Onay Bekliyor' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {isTr 
                  ? 'Web sitesinden yeni oda rezervasyonu alındı. Odaya yerleştirmek veya onaylamak için inceleyiniz.' 
                  : 'New room reservations have been submitted. Review to assign rooms.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveViewMode('online_reservations')}
            className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>{isTr ? 'Talepleri İncele' : 'Review'}</span>
            <span>→</span>
          </button>
        </div>
      )}

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
      {activeViewMode === 'calendar' && (
        <HotelCalendarTab
          calculateAgeBreakdownStats={calculateAgeBreakdownStats}
          getAnalizDateRange={getAnalizDateRange}
          isTr={isTr}
          analysisPeriod={analysisPeriod}
          setAnalysisPeriod={setAnalysisPeriod}
          customAnalizStart={customAnalizStart}
          setCustomAnalizStart={setCustomAnalizStart}
          customAnalizEnd={customAnalizEnd}
          setCustomAnalizEnd={setCustomAnalizEnd}
          setSelectedAgeCategoryModal={setSelectedAgeCategoryModal}
          calendarStartDate={calendarStartDate}
          setCalendarStartDate={setCalendarStartDate}
          calendarDaysCount={calendarDaysCount}
          setCalendarDaysCount={setCalendarDaysCount}
          rooms={rooms}
          setSelectedReservationModal={setSelectedReservationModal}
          setCheckInModalRoom={setCheckInModalRoom}
          setGuestForm={setGuestForm}
          getNextDayString={getNextDayString}
        />
      )}

      {/* VIEW MODE 2: CLASSIC ROOM CARDS MATRIX GRID */}
      {activeViewMode === 'grid' && (
        <div className="space-y-6">
          {/* DASHBOARD MATRIX STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-wider">{isTr ? "Toplam Oda" : "Total Rooms"}</p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">{totalRooms}</span>
                <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('occupied')}
              className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                statusFilter === 'occupied'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">{isTr ? "Dolu Odalar" : "Occupied"}</p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">{occupiedRooms}</span>
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('checkout_today')}
              className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                statusFilter === 'checkout_today'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                {isTr ? "Bugün Çıkış" : "Check-out Today"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-amber-800 dark:text-amber-300">{todayCheckOuts}</span>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('vacant')}
              className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                statusFilter === 'vacant'
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-400 ring-2 ring-slate-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-wider">{isTr ? "Boş / Hazır" : "Vacant"}</p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-slate-800 dark:text-slate-200">{availableRooms}</span>
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('maintenance')}
              className={`p-2 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                statusFilter === 'maintenance'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-400 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300'
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider">{isTr ? "Tadilat / Servis" : "Maintenance"}</p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-rose-700 dark:text-rose-400">{maintenanceRooms + staffRooms}</span>
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600" />
              </div>
            </button>

            <div className="p-2 sm:p-3.5 bg-slate-900 text-white rounded-xl shadow-xs space-y-1">
              <p className="text-[9px] sm:text-[10px] font-bold uppercase text-emerald-200 tracking-wider">{isTr ? "Doluluk" : "Occupancy"}</p>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-2xl font-black text-white">%{occupancyRate}</span>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-300" />
              </div>
            </div>
          </div>

      {/* SERVİS DIŞI & ODA KULLANIM BİLGİLENDİRME BANT DÜZEYİ */}
      {showServisDisiInfo && (
        <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsServisDisiDetailsOpen(!isServisDisiDetailsOpen)}
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-black text-xs text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                {isTr ? "💡 Oda Durumu & 'Servis Dışı' Nedir?" : "💡 Room Status & Maintenance Info"}
                <span className="text-[10px] font-bold text-indigo-500 underline decoration-dotted">
                  {isServisDisiDetailsOpen ? (isTr ? "(Gizle)" : "(Hide)") : (isTr ? "(Detayları Göster)" : "(Show Details)")}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowServisDisiInfo(false)}
              className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors shrink-0 text-indigo-500 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isServisDisiDetailsOpen && (
            <div className="pl-6 text-[11px] leading-relaxed font-medium border-l border-indigo-200 dark:border-indigo-700 mt-1">
              <p>
                {isTr 
                  ? "Oda üzerindeki 'Servis Dışı' ibaresi; odanın boya, temizlik, arıza veya bakım nedeniyle geçici olarak müşteri satışına kapatıldığını gösterir. Odayı tekrar satışa ve girişe açmak için oda kartındaki durum menüsünden 'Boş / Hazır' seçeneğini tıklamanız yeterlidir."
                  : "The 'Maintenance / Servis Dışı' label means the room is temporarily out of service due to repairs or cleaning. To reactivate it, simply set its status to 'Vacant / Ready'."}
              </p>
            </div>
          )}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* LAYOUT MODE SWITCHER */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSetRoomDisplayMode('grid')}
              className={`p-2.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 ${
                roomDisplayMode === 'grid'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isTr ? "Kart Görünümü" : "Grid View"}
            >
              <LayoutGrid className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{isTr ? "Kart" : "Grid"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetRoomDisplayMode('list')}
              className={`p-2.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 ${
                roomDisplayMode === 'list'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isTr ? "Liste Görünümü" : "List View"}
            >
              <List className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{isTr ? "Liste" : "List"}</span>
            </button>
          </div>

          {/* HORIZONTAL NON-WRAP SCROLL FILTER ROW */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-1 sm:pb-0 w-full sm:w-auto">
            {[
              { id: 'all', label: isTr ? 'Tüm Odalar' : 'All', icon: <BedDouble className="h-5 w-5 sm:h-3.5 sm:w-3.5 shrink-0" /> },
              { id: 'checkout_today', label: isTr ? '⚠️ Çıkışlar' : 'Checkouts', alert: true, icon: <Clock className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-amber-600 dark:text-amber-400 shrink-0" /> },
              { id: 'occupied', label: isTr ? 'Dolu' : 'Occupied', icon: <Users className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" /> },
              { id: 'vacant', label: isTr ? 'Boş' : 'Vacant', icon: <CheckCircle2 className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-blue-600 shrink-0" /> },
              { id: 'maintenance', label: isTr ? 'Servis' : 'Maint.', icon: <Wrench className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-rose-600 shrink-0" /> },
              { id: 'staff', label: isTr ? 'Personel' : 'Staff', icon: <ShieldAlert className="h-5 w-5 sm:h-3.5 sm:w-3.5 text-purple-600 shrink-0" /> }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`p-2.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center min-w-[40px] h-10 sm:h-auto sm:min-w-0 ${
                  statusFilter === f.id
                    ? f.alert 
                      ? 'bg-amber-600 text-white border border-amber-700 shadow-xs font-black ring-1 ring-amber-400' 
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : f.alert
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 font-extrabold hover:bg-amber-200 dark:hover:bg-amber-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={f.label}
              >
                {f.icon}
                <span className="hidden sm:inline ml-1">{f.label}</span>
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
                  <th className="p-3.5">Kapasite</th>
                  <th className="p-3.5">Gecelik Fiyat</th>
                  <th className="p-3.5">Oda Durumu</th>
                  <th className="p-3.5">Konaklayan Misafir</th>
                  <th className="p-3.5">Folio / Adisyon</th>
                  <th className="p-3.5 pr-5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                {(filteredRooms?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Arama kriterlerine uygun oda bulunamadı.
                    </td>
                  </tr>
                ) : (
                  (filteredRooms || []).map(room => {
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
                        <td className="p-3.5">
                          {(() => {
                            const bedDetails = parseBedAndCapacity(room);
                            return (
                              <div className="flex flex-col gap-1.5">
                                {/* YATAKLAR: ÇİFT VE TEK KİŞİLİK İKONLARI İLE */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {Array.from({ length: bedDetails.doubleBeds }).map((_, i) => (
                                    <span 
                                      key={`db-${i}`}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                      title="Çift Kişilik Yatak"
                                    >
                                      <BedDouble className="h-3.5 w-3.5" />
                                    </span>
                                  ))}

                                  {Array.from({ length: bedDetails.singleBeds }).map((_, i) => (
                                    <span 
                                      key={`sb-${i}`}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400"
                                      title={`Tek Kişilik Yatak ${bedDetails.hasBunk ? '(Ranza)' : ''}`}
                                    >
                                      <BedSingle className="h-3.5 w-3.5" />
                                    </span>
                                  ))}

                                  {bedDetails.doubleBeds === 0 && bedDetails.singleBeds === 0 && (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400" title={bedDetails.rawBedInfo || 'Standart Yatak'}>
                                      <Bed className="h-3.5 w-3.5" />
                                    </span>
                                  )}
                                </div>

                                {/* KAPASİTE: YETİŞKİN VE ÇOCUK İKONLARI İLE */}
                                <div className="flex items-center gap-1 flex-wrap">
                                  {/* YETİŞKİN İKONU VE SAYISI */}
                                  {Array.from({ length: bedDetails.adults }).map((_, i) => (
                                    <span 
                                      key={`ad-${i}`}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                      title="Yetişkin Misafir"
                                    >
                                      <User className="h-4 w-4" />
                                    </span>
                                  ))}

                                  {/* ÇOCUK İKONU VE SAYISI */}
                                  {Array.from({ length: bedDetails.children }).map((_, i) => (
                                    <span 
                                      key={`ch-${i}`}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                      title="Çocuk / Bebek"
                                    >
                                      <Baby className="h-4 w-4" />
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
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
                              <option value="vacant">🟢</option>
                              <option value="occupied">🔴</option>
                              <option value="maintenance">🛠️</option>
                              <option value="staff">👤</option>
                              <option value="disabled">⛔</option>
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
                              className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                              title="Detay / Misafirler"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                             {room.status === 'vacant' && (
                              <button
                                onClick={() => setCheckInModalRoom(room)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>{isTr ? "Giriş Ekle" : "Check-In"}</span>
                              </button>
                            )}
                            {room.status === 'occupied' && (
                              <button
                                onClick={() => setCheckOutModalRoom(room)}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>{isTr ? "Çıkış" : "Checkout"}</span>
                              </button>
                            )}
                            {room.status === 'maintenance' && (
                              <button
                                onClick={() => handleQuickStatusChange(room.id, 'vacant')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                title="Odayı Aktifleştir"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>{isTr ? "Aktifleştir" : "Activate"}</span>
                              </button>
                            )}
                            <button
                              onClick={() => openAddOrEditRoomModal(room)}
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
                className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between space-y-3 shadow-xs bg-white dark:bg-slate-900 ${
                  isTodayOut
                    ? 'border-amber-400 dark:border-amber-600/80 border-t-4 border-t-amber-500'
                    : room.status === 'occupied'
                    ? 'border-emerald-200 dark:border-emerald-800/80 border-t-4 border-t-emerald-600'
                    : room.status === 'vacant'
                    ? 'border-slate-200 dark:border-slate-800 border-t-4 border-t-slate-300 dark:border-t-slate-700 hover:border-slate-300'
                    : room.status === 'staff'
                    ? 'border-slate-200 dark:border-slate-800 border-t-4 border-t-purple-500'
                    : 'border-rose-200 dark:border-rose-800/80 border-t-4 border-t-rose-500'
                }`}
              >
                {/* TOP ROOM CARD HEADER */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Oda #{room.room_number}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[130px]" title={room.room_type}>
                        {room.room_type}
                      </span>
                    </div>

                    {/* SPECS BADGES - CLEAN HORIZONTAL BADGES */}
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {(() => {
                        const cardBed = parseBedAndCapacity(room);
                        return (
                          <>
                            {/* YATAKLAR: ÇİFT VE TEK KİŞİLİK İKONLARI İLE */}
                            {Array.from({ length: cardBed.doubleBeds }).map((_, i) => (
                              <span 
                                key={`cdb-${i}`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                title="Çift Kişilik Yatak"
                              >
                                <BedDouble className="h-3.5 w-3.5" />
                              </span>
                            ))}

                            {Array.from({ length: cardBed.singleBeds }).map((_, i) => (
                              <span 
                                key={`csb-${i}`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400"
                                title={`Tek Kişilik Yatak ${cardBed.hasBunk ? '(Ranza)' : ''}`}
                              >
                                <BedSingle className="h-3.5 w-3.5" />
                              </span>
                            ))}

                            {cardBed.doubleBeds === 0 && cardBed.singleBeds === 0 && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400" title={cardBed.rawBedInfo || 'Standart Yatak'}>
                                <Bed className="h-3.5 w-3.5" />
                              </span>
                            )}

                            {/* KAPASİTE: YETİŞKİN VE ÇOCUK İKONLARI İLE */}
                            {Array.from({ length: cardBed.adults }).map((_, i) => (
                              <span 
                                key={`cad-${i}`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                title="Yetişkin Misafir"
                              >
                                <User className="h-4 w-4" />
                              </span>
                            ))}

                            {Array.from({ length: cardBed.children }).map((_, i) => (
                              <span 
                                key={`cch-${i}`}
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                title="Çocuk / Bebek"
                              >
                                <Baby className="h-4 w-4" />
                              </span>
                            ))}
                          </>
                        );
                      })()}

                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 h-6 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                        ₺{(room.price_per_night || 2500).toLocaleString('tr-TR')}/gece
                      </span>
                    </div>
                  </div>

                  {/* QUICK STATUS CHANGE DROPDOWN ON CARD */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isTodayOut && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-600 text-white uppercase tracking-wider flex items-center gap-1 shadow-xs whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5" />
                        Çıkış Günü
                      </span>
                    )}
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickStatusChange(room.id, e.target.value as any)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer border outline-none transition-all max-w-[50px] ${
                        room.status === 'occupied'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                          : room.status === 'vacant'
                          ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                          : room.status === 'maintenance'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                      }`}
                    >
                      <option value="vacant" className="text-slate-900 bg-white">🟢</option>
                      <option value="occupied" className="text-slate-900 bg-white">🔴</option>
                      <option value="maintenance" className="text-slate-900 bg-white">🛠️</option>
                      <option value="staff" className="text-slate-900 bg-white">👤</option>
                      <option value="disabled" className="text-slate-900 bg-white">⛔</option>
                    </select>
                  </div>
                </div>

                {/* GUEST INFO IF OCCUPIED */}
                {room.status === 'occupied' && room.current_guest && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {room.current_guest.first_name} {room.current_guest.last_name}
                        </span>
                      </div>
                      {room.current_guest.discount_rate > 0 && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                          %{room.current_guest.discount_rate} İndirim
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p className="flex justify-between">
                        <span>Giriş - Çıkış:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatDisplayDate(room.current_guest.check_in_date)} ➔ {formatDisplayDate(room.current_guest.check_out_date)}
                        </span>
                      </p>
                      {Array.isArray(room.additional_guests) && room.additional_guests.length > 0 && (
                        <p className="flex justify-between">
                          <span>Ek Misafir:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            +{room.additional_guests.length} Kişi
                          </span>
                        </p>
                      )}
                    </div>

                    {/* FOLIO HARCAMA HESABI */}
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-slate-400">Adisyon Borcu</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          ₺{folioAmount.toLocaleString('tr-TR')}
                        </p>
                      </div>

                      <button
                        onClick={() => setAddExpenseModalRoom(room)}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adisyon Ekle</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTES IF MAINTENANCE/STAFF */}
                {(room.status === 'maintenance' || room.status === 'staff') && (
                  <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <span>{room.notes || "Oda bakım veya teknik servise alınmıştır."}</span>
                    </p>
                    {room.status === 'maintenance' && (
                      <button
                        onClick={() => handleQuickStatusChange(room.id, 'vacant')}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{isTr ? "Aktifleştir" : "Activate"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomDetailModal(room)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    title="Detay / Misafirler"
                  >
                    <Info className="h-4 w-4 text-slate-500" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAddOrEditRoomModal(room)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Oda Ayarları"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Odayı Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  </div>

                   {room.status === 'vacant' && (
                    <button
                      onClick={() => setCheckInModalRoom(room)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{isTr ? "Giriş Ekle" : "Check-In"}</span>
                    </button>
                  )}

                  {room.status === 'occupied' && (
                    <button
                      onClick={() => setCheckOutModalRoom(room)}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>{isTr ? "Çıkış" : "Checkout"}</span>
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

      {/* VIEW MODE 3: DETAILED IN-HOUSE & BOOKED GUESTS ROSTER */}
      {activeViewMode === 'guests' && (
        <HotelGuestsTab
          calculateAgeBreakdownStats={calculateAgeBreakdownStats}
          guestListCategoryFilter={guestListCategoryFilter}
          setGuestListCategoryFilter={setGuestListCategoryFilter}
          guestListSearch={guestListSearch}
          setGuestListSearch={setGuestListSearch}
          handlePrintKbsManifest={handlePrintKbsManifest}
          setIsAgePolicyModalOpen={setIsAgePolicyModalOpen}
          formatDisplayDate={formatDisplayDate}
          setInspectGuestModal={setInspectGuestModal}
          setCheckOutModalRoom={setCheckOutModalRoom}
        />
      )}

      {/* VIEW MODE 4: ONLINE WEB RESERVATIONS DASHBOARD */}
      {activeViewMode === 'online_reservations' && (
        <HotelOnlineBookingsTab
          onlineReservations={onlineReservations}
          loadingReservations={loadingReservations}
          fetchOnlineReservations={fetchOnlineReservations}
          onlineReservationSearch={onlineReservationSearch}
          setOnlineReservationSearch={setOnlineReservationSearch}
          onlineReservationFilter={onlineReservationFilter}
          setOnlineReservationFilter={setOnlineReservationFilter}
          formatThousand={formatThousand}
          formatDisplayDate={formatDisplayDate}
          isTr={isTr}
          rooms={rooms}
          setSelectedOnlineResModal={setSelectedOnlineResModal}
          handleCheckInOnlineReservation={handleCheckInOnlineReservation}
          handleConfirmOnlineReservation={handleConfirmOnlineReservation}
          handleAcknowledgeOnlineReservation={handleAcknowledgeOnlineReservation}
          handleCancelOnlineReservation={handleCancelOnlineReservation}
          setActiveViewMode={setActiveViewMode}
          setSelectedRoomDetailModal={setSelectedRoomDetailModal}
        />
      )}

      {/* MODAL: AGE CATEGORY DRILLDOWN MODAL */}
      <HotelAgeCategoryDrilldownModal
        selectedAgeCategoryModal={selectedAgeCategoryModal}
        onClose={() => setSelectedAgeCategoryModal(null)}
        formatDisplayDate={formatDisplayDate}
        setInspectGuestModal={setInspectGuestModal}
      />

      {/* MODAL: INSPECT GUEST FULL DOSSIER */}
      <HotelInspectGuestModal
        inspectGuestModal={inspectGuestModal}
        onClose={() => setInspectGuestModal(null)}
        formatDisplayDate={formatDisplayDate}
        setAddExpenseModalRoom={setAddExpenseModalRoom}
        setCheckOutModalRoom={setCheckOutModalRoom}
        setSelectedAgeCategoryModal={setSelectedAgeCategoryModal}
      />

      {/* MODAL: CALENDAR RESERVATION DETAIL POPUP */}
      <HotelReservationDetailModal
        selectedReservationModal={selectedReservationModal}
        onClose={() => setSelectedReservationModal(null)}
        formatDisplayDate={formatDisplayDate}
        calculateAgeDetails={calculateAgeDetails}
        onSaveReservation={handleSaveReservationRevision}
      />

      {/* MODAL: ROOM DETAIL & FULL GUEST MANIFEST */}
      <HotelRoomDetailModal
        selectedRoomDetailModal={selectedRoomDetailModal}
        onClose={() => setSelectedRoomDetailModal(null)}
        formatDisplayDate={formatDisplayDate}
        parseBedAndCapacity={parseBedAndCapacity}
        handlePrintKbsManifest={handlePrintKbsManifest}
        setCheckInModalRoom={setCheckInModalRoom}
        setCheckOutModalRoom={setCheckOutModalRoom}
        openAddOrEditRoomModal={openAddOrEditRoomModal}
        onReviseRoomGuests={handleReviseRoomGuests}
        onEditReservation={(room, res) => setSelectedReservationModal({ room, res })}
      />

      {/* MODAL: ADD / EDIT ROOM */}
      <HotelRoomEditModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        editingRoom={editingRoom}
        roomForm={roomForm}
        setRoomForm={setRoomForm}
        bedConfig={bedConfig}
        setBedConfig={setBedConfig}
        handleSubmitRoom={handleSaveRoom}
        handleImageFileUpload={handleImageFileUpload}
        formatThousand={formatThousand}
        parseThousand={parseThousand}
        isTr={isTr}
      />

      {/* MODAL: CHECK-IN GUEST */}
      <HotelCheckInModal
        checkInModalRoom={checkInModalRoom}
        setCheckInModalRoom={setCheckInModalRoom}
        rooms={rooms}
        guestForm={guestForm}
        setGuestForm={setGuestForm}
        handleExecuteCheckIn={handleExecuteCheckIn}
        handleAdminCheckInChange={handleAdminCheckInChange}
        calculateAgeDetails={calculateAgeDetails}
        getNextDayString={getNextDayString}
        handleAddAdditionalGuestField={handleAddAdditionalGuestField}
        handleRemoveAdditionalGuestField={handleRemoveAdditionalGuestField}
      />

      {/* MODAL: CHECK-OUT & FOLIO RECEIPT */}
      <HotelFolioModal
        checkOutModalRoom={checkOutModalRoom}
        onCloseCheckOutModal={() => setCheckOutModalRoom(null)}
        computeRoomFolioDetails={computeRoomFolioDetails}
        checkoutPaymentMethod={checkoutPaymentMethod}
        setCheckoutPaymentMethod={setCheckoutPaymentMethod}
        handlePrintFolio={handlePrintFolio}
        handleExecuteCheckOut={handleExecuteCheckOut}
        setAddExpenseModalRoom={setAddExpenseModalRoom}
        addExpenseModalRoom={addExpenseModalRoom}
        manualExpense={manualExpense}
        setManualExpense={setManualExpense}
        handleAddExpenseToFolio={handleAddExpenseToFolio}
      />

      {/* MODAL: AGE DISCOUNT & PRICING POLICY SETTINGS */}
      <HotelAgePolicyModal
        isOpen={isAgePolicyModalOpen}
        onClose={() => setIsAgePolicyModalOpen(false)}
        ageDiscountPolicy={ageDiscountPolicy}
        saveAgePolicy={saveAgePolicy}
      />
      {/* MODAL: COMPLETED CHECKOUT & DETAILED CUSTOMER STATEMENT */}
      <HotelCheckoutReceiptModal
        completedCheckoutData={completedCheckoutData}
        onClose={() => setCompletedCheckoutData(null)}
        handlePrintFolio={handlePrintFolio}
      />

      {/* MODAL: ONLINE RESERVATION DETAIL MODAL */}
      <HotelOnlineBookingDetailModal
        selectedOnlineResModal={selectedOnlineResModal}
        onClose={() => setSelectedOnlineResModal(null)}
        isTr={isTr}
        formatThousand={formatThousand}
        formatDisplayDate={formatDisplayDate}
        handleCheckInOnlineReservation={handleCheckInOnlineReservation}
        handleConfirmOnlineReservation={handleConfirmOnlineReservation}
        handleCancelOnlineReservation={handleCancelOnlineReservation}
        handleSaveOnlineReservationRevision={handleSaveOnlineReservationRevision}
      />

      {/* MODAL: ASSIGN ROOM SELECTOR FOR ONLINE RESERVATION */}
      <HotelAssignRoomModal
        assignRoomModalRes={assignRoomModalRes}
        onClose={() => setAssignRoomModalRes(null)}
        rooms={rooms}
        selectedTargetRoomId={selectedTargetRoomId}
        setSelectedTargetRoomId={setSelectedTargetRoomId}
        formatThousand={formatThousand}
        handleCheckInOnlineReservation={handleCheckInOnlineReservation}
      />
    </div>
  );
};

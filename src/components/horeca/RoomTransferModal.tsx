import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  X, 
  User, 
  CreditCard, 
  Receipt, 
  Printer, 
  Clock, 
  Calendar, 
  Sparkles,
  Coffee,
  AlertCircle
} from "lucide-react";
import { api } from "../../services/api";
import { HotelRoom } from "./HotelRoomManagement";

interface RoomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string | null;
  cart: Array<{
    id: any;
    name: string;
    price: any;
    quantity: number;
    note?: string;
  }>;
  totalAmount: number;
  storeId?: number;
  storeName?: string;
  lang?: string;
  onConfirmTransfer: (room: HotelRoom, notes: string, printSlip: boolean) => Promise<void>;
}

export const RoomTransferModal: React.FC<RoomTransferModalProps> = ({
  isOpen,
  onClose,
  tableName,
  cart,
  totalAmount,
  storeId,
  storeName = "LookPrice Horeca",
  lang = "tr",
  onConfirmTransfer
}) => {
  const isTr = lang === "tr";
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [transferNotes, setTransferNotes] = useState("");
  const [printSlipOnTransfer, setPrintSlipOnTransfer] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load rooms from localStorage and API
  useEffect(() => {
    if (!isOpen) return;

    const storageKey = `hotel_rooms_${storeId || 'default'}`;
    const localData = localStorage.getItem(storageKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRooms(parsed);
          // Pre-select first occupied room if available
          const firstOccupied = parsed.find(r => r.status === 'occupied');
          if (firstOccupied) {
            setSelectedRoomId(firstOccupied.id);
          } else if (parsed.length > 0) {
            setSelectedRoomId(parsed[0].id);
          }
          return;
        }
      } catch (e) {
        console.error("Failed to parse local hotel rooms", e);
      }
    }

    // Fallback: fetch branding from server
    api.getBranding(storeId).then((res) => {
      if (res && res.hotel_rooms && Array.isArray(res.hotel_rooms)) {
        setRooms(res.hotel_rooms);
        const firstOccupied = res.hotel_rooms.find((r: HotelRoom) => r.status === 'occupied');
        if (firstOccupied) {
          setSelectedRoomId(firstOccupied.id);
        } else if (res.hotel_rooms.length > 0) {
          setSelectedRoomId(res.hotel_rooms[0].id);
        }
      }
    }).catch(() => {});
  }, [isOpen, storeId]);

  // Set default notes when modal opens
  useEffect(() => {
    if (isOpen) {
      const summaryItems = cart.map(i => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ');
      const extraCount = cart.length > 3 ? ` ve ${cart.length - 3} kalem daha` : '';
      setTransferNotes(
        tableName 
          ? `${tableName} Adisyonu (${summaryItems}${extraCount})`
          : `Restoran / Bar Satışı (${summaryItems}${extraCount})`
      );
    }
  }, [isOpen, tableName, cart]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rooms
      .filter(room => {
        if (!q) return true;
        const numMatch = room.room_number?.toLowerCase().includes(q);
        const typeMatch = room.room_type?.toLowerCase().includes(q);
        const guestNameMatch = room.current_guest 
          ? `${room.current_guest.first_name} ${room.current_guest.last_name}`.toLowerCase().includes(q)
          : false;
        const tcMatch = room.current_guest?.identity_no?.toLowerCase().includes(q);
        return numMatch || typeMatch || guestNameMatch || tcMatch;
      })
      .sort((a, b) => {
        // Show occupied first
        if (a.status === 'occupied' && b.status !== 'occupied') return -1;
        if (a.status !== 'occupied' && b.status === 'occupied') return 1;
        return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
      });
  }, [rooms, searchQuery]);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedRoom) return;
    try {
      setIsProcessing(true);
      await onConfirmTransfer(selectedRoom, transferNotes, printSlipOnTransfer);
      onClose();
    } catch (e: any) {
      alert(e.message || (isTr ? "Odaya transfer esnasında hata oluştu." : "Error transferring bill to room."));
    } finally {
      setIsProcessing(false);
    }
  };

  const getBoardLabel = (board?: string) => {
    switch (board) {
      case 'AI': return isTr ? 'Her Şey Dahil (AI)' : 'All-Inclusive';
      case 'UAI': return isTr ? 'Ultra Her Şey Dahil' : 'Ultra All-Inclusive';
      case 'HB': return isTr ? 'Yarım Pansiyon (HB)' : 'Half Board';
      case 'FB': return isTr ? 'Tam Pansiyon (FB)' : 'Full Board';
      case 'BB': return isTr ? 'Oda Kahvaltı (BB)' : 'Bed & Breakfast';
      case 'RO': return isTr ? 'Sadece Oda (RO)' : 'Room Only';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950/15 rounded-2xl border border-slate-950/10">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full">
                  {isTr ? "Otel Folio Entegrasyonu" : "Hotel Folio Integration"}
                </span>
                <span className="text-xs font-black text-slate-900/80">
                  {tableName || (isTr ? "Hızlı Satış" : "Direct Sale")}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight mt-0.5">
                {isTr ? "Masa Adisyonunu Odaya Transfer Et" : "Transfer Table Bill to Room"}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Strip */}
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/50 p-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {cart.length} {isTr ? "Kalem Sipariş" : "Order Items"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isTr ? "Aktarılacak Tutar:" : "Transfer Amount:"}
            </span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-400">
              {totalAmount.toFixed(2)} ₺
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Room Search Filter */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isTr ? "Oda no (örn: 101), misafir adı veya oda tipi ara..." : "Search room number, guest name, or type..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Rooms Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>{isTr ? "Konaklayan Odalar" : "Available Rooms"} ({filteredRooms.length})</span>
              <span>{isTr ? "Dolu Odalar Önceliklidir" : "Occupied First"}</span>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {isTr ? "Arama kriterine uygun oda bulunamadı." : "No matching rooms found."}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isTr ? "Lütfen 'Otel & Oda Yönetimi' sekmesinden oda tanımlandığından emin olun." : "Please ensure rooms are created in Hotel Management tab."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredRooms.map((room) => {
                  const isSelected = selectedRoomId === room.id;
                  const isOccupied = room.status === 'occupied';
                  const guestName = room.current_guest 
                    ? `${room.current_guest.first_name} ${room.current_guest.last_name}`
                    : (isTr ? "Misafir Girişi Yok" : "No Guest Checked-in");
                  const board = room.current_guest?.board_type ? getBoardLabel(room.current_guest.board_type) : '';
                  const currentFolioTotal = room.folio?.total_amount || 0;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer text-left relative flex flex-col justify-between ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {isTr ? `Oda ${room.room_number}` : `Room ${room.room_number}`}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                              isOccupied 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {isOccupied ? (isTr ? '🟢 Dolu' : 'Occupied') : (isTr ? 'Boş' : 'Vacant')}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                            {room.room_type}
                          </span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Guest Details */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{guestName}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          {board ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold truncate">{board}</span>
                          ) : (
                            <span>{room.bed_info || ''}</span>
                          )}
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {isTr ? 'Folio:' : 'Folio:'} {currentFolioTotal.toFixed(2)} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transfer Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isTr ? "Adisyon / Folio Açıklaması" : "Transfer / Folio Note"}
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder={isTr ? "Masa adisyon notu..." : "Order notes..."}
            />
          </div>

          {/* Selected Room Calculation Preview */}
          {selectedRoom && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {isTr ? `Seçilen Oda (${selectedRoom.room_number}) Mevcut Bakiyesi:` : `Current Balance:`}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {(selectedRoom.folio?.total_amount || 0).toFixed(2)} ₺
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {isTr ? "Aktarılacak Masa Adisyonu:" : "Amount to Add:"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  + {totalAmount.toFixed(2)} ₺
                </span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-slate-900 dark:text-white">
                  {isTr ? "Yeni Oda Folio Toplamı:" : "New Room Balance:"}
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-base">
                  {((selectedRoom.folio?.total_amount || 0) + totalAmount).toFixed(2)} ₺
                </span>
              </div>
            </div>
          )}

          {/* Print Slip Option Checkbox */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="chk_print_slip"
              checked={printSlipOnTransfer}
              onChange={(e) => setPrintSlipOnTransfer(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer ml-1"
            />
            <label htmlFor="chk_print_slip" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTr ? "İmza için 'Oda Harcama & Adisyon Fişi' yazdır" : "Print room charge slip for guest signature"}</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            {isTr ? "İptal" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedRoom || isProcessing}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>
                  {isTr 
                    ? `Odaya Aktar & Masayı Kapat (${totalAmount.toFixed(2)} ₺)` 
                    : `Charge Room & Close (${totalAmount.toFixed(2)} ₺)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

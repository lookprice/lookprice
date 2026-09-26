import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Banknote,
  CheckCircle2,
  Building2
} from "lucide-react";
import { HotelRoom } from "../hotel/hotelTypes";

interface CafeRoomDetailModalProps {
  room: HotelRoom | null;
  onClose: () => void;
  onBookRoom: (room: HotelRoom) => void;
  searchCheckIn?: string;
  searchCheckOut?: string;
  getRoomBoardList?: (room: HotelRoom, dateStr: string) => any[];
  isAvailable?: boolean;
}

export const CafeRoomDetailModal: React.FC<CafeRoomDetailModalProps> = ({
  room,
  onClose,
  onBookRoom,
  searchCheckIn,
  searchCheckOut,
  getRoomBoardList,
  isAvailable = true
}) => {
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);

  if (!room) return null;

  const galleryPhotos = (room.images && room.images.length > 0)
    ? room.images
    : [room.cover_image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80"];
  const currentPhotoIndex = activeDetailImageIndex % galleryPhotos.length;

  const boardList = (getRoomBoardList && searchCheckIn) ? getRoomBoardList(room, searchCheckIn) : [];
  const cheapestBoard = boardList.length > 0 ? boardList.reduce((min, b) => b.price < min.price ? b : min, boardList[0]) : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full border border-stone-200 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto relative">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 pr-10">
          <div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase rounded-lg">
              Oda #{room.room_number} • {room.room_type}
            </span>
            <h3 className="text-xl font-serif font-black text-stone-900 mt-1">
              Oda Özellikleri & Fotoğraf Galerisi
            </h3>
          </div>
        </div>

        {/* MAIN GALLERY SLIDER */}
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

        {/* ROOM SPECIFICATIONS & DESCRIPTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-amber-600" />
              <span>Kapasite & Yatak Düzeni</span>
            </h4>
            <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300 font-bold">
              <div className="flex justify-between">
                <span className="text-stone-400">Konaklama Kapasitesi:</span>
                <span>Maksimum {room.capacity} Yetişkin / Çocuk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Yatak Tipi:</span>
                <span>{room.bed_info || "Çift Kişilik King Yatak"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Tarih Durumu:</span>
                <span className={isAvailable ? "text-emerald-700 dark:text-emerald-400 font-black" : "text-rose-600 font-black"}>
                  {isAvailable ? "Müsait (Rezervasyona Açık)" : (room.status === 'maintenance' ? 'Bakımda' : 'Seçili Tarihte Dolu')}
                </span>
              </div>
              {searchCheckIn && searchCheckOut && (
                <div className="flex justify-between text-[11px] pt-1 border-t border-stone-200 dark:border-stone-700">
                  <span className="text-stone-400">Seçili Tarih:</span>
                  <span className="text-stone-800 dark:text-stone-200">{searchCheckIn} ➔ {searchCheckOut}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>Pansiyon Fiyat Seçenekleri</span>
            </h4>
            <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 font-bold">
              {boardList.length > 0 ? (
                boardList.map((opt) => (
                  <div key={opt.key} className="flex justify-between items-center py-0.5">
                    <span className="text-stone-500 flex items-center gap-1">
                      <span>{opt.label}:</span>
                      {opt.isSpecial && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 rounded font-bold">
                          Özel Fiyat
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {opt.isSpecial && opt.standardPrice !== opt.price && (
                        <span className="text-[10px] text-stone-400 line-through">
                          ₺{opt.standardPrice.toLocaleString('tr-TR')}
                        </span>
                      )}
                      <span className={opt.isSpecial ? "text-amber-600 dark:text-amber-400 font-black" : "text-stone-900 dark:text-white font-black"}>
                        ₺{opt.price.toLocaleString('tr-TR')} / Gece
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span className="text-stone-400">Oda & Kahvaltı (BB):</span>
                  <span className="text-amber-700 font-black">₺{(room.price_per_night || 2500).toLocaleString('tr-TR')} / Gece</span>
                </div>
              )}

              {room.non_refundable_discount && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-black pt-1 border-t border-stone-200 dark:border-stone-700 text-[11px]">
                  <span>Esnek İptalsiz İndirim:</span>
                  <span>%{room.non_refundable_discount} Ek İndirim Uygulanır</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        {room.description && (
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 text-xs text-stone-700 leading-relaxed font-medium">
            <p className="font-bold text-amber-900 mb-1">Oda Tanımı & Detaylar:</p>
            {room.description}
          </div>
        )}

        {/* AMENITIES TAGS */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">Oda İçi Sunulan Olanaklar</h4>
            <div className="flex flex-wrap gap-1.5">
              {room.amenities.map((amenity, idx) => (
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
            <span className="block text-[10px] font-black uppercase text-stone-400">
              {cheapestBoard ? 'En Uygun Pansiyon Fiyatı' : 'Başlangıç Fiyatı'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-700">
                ₺{(cheapestBoard ? cheapestBoard.price : (room.price_per_night || 2500)).toLocaleString('tr-TR')}
              </span>
              <span className="text-xs text-stone-500 font-bold">'den başlayan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onBookRoom(room)}
            disabled={!isAvailable}
            className={`px-6 py-3 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              isAvailable 
                ? "bg-amber-600 hover:bg-amber-700 text-white active:scale-95" 
                : "bg-stone-300 text-stone-500 cursor-not-allowed"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isAvailable ? "Bu Odada Konakla & Rezerve Et" : "Seçili Tarihte Dolu"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

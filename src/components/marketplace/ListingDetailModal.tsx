import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Building2, 
  PhoneCall, 
  Phone, 
  ExternalLink 
} from "lucide-react";
import { getListingIntent } from "../../utils/marketplace";

interface ListingDetailModalProps {
  selectedListing: any;
  handleCloseModal: () => void;
  activeDetailImageIndex: number;
  setActiveDetailImageIndex: (index: number | ((prev: number) => number)) => void;
  formatCategory: (listing: any) => string;
  formatLocation: (listing: any) => string;
  getSquareMeters: (listing: any) => string | null;
  formatTitleDeedType: (val: any) => string;
  formatFuelType: (val: any) => string;
  formatTransmission: (val: any) => string;
}

export const ListingDetailModal = ({
  selectedListing,
  handleCloseModal,
  activeDetailImageIndex,
  setActiveDetailImageIndex,
  formatCategory,
  formatLocation,
  getSquareMeters,
  formatTitleDeedType,
  formatFuelType,
  formatTransmission
}: ListingDetailModalProps) => {
  if (!selectedListing) return null;

  const modalImages: string[] = [];
  if (Array.isArray(selectedListing.images) && selectedListing.images.length > 0) {
    modalImages.push(...selectedListing.images.filter((i: any) => typeof i === "string" && i.trim()));
  }
  if (selectedListing.image_url && !modalImages.includes(selectedListing.image_url)) {
    modalImages.unshift(selectedListing.image_url);
  }

  const currentImg = modalImages[activeDetailImageIndex] || selectedListing.image_url;
  const intent = getListingIntent(selectedListing);
  const sec = selectedListing.sector_data || {};

  const formatDescriptionText = (rawStr?: string) => {
    if (!rawStr) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawStr, "text/html");
      const text = doc.body.textContent || doc.body.innerText || "";
      return text.replace(/\n\s*\n/g, "\n\n").trim();
    } catch (e) {
      return rawStr.replace(/<[^>]*>?/gm, "").trim();
    }
  };

  const cleanedDesc = formatDescriptionText(selectedListing.description);

  return (
    <div 
      onClick={handleCloseModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto cursor-pointer animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white text-slate-800 border border-slate-200/90 rounded-3xl p-5 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto my-auto cursor-default"
      >
        
        {/* Close Button */}
        <button 
          onClick={handleCloseModal}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-rose-100 border border-slate-200 transition cursor-pointer shadow-xs"
          title="Kapat (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Title */}
        <div className="mb-4 pr-12">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {selectedListing.store_name}
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-extrabold">
              {formatCategory(selectedListing)}
            </span>
            {selectedListing.listing_type === 'real_estate' && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                intent === 'kiralik'
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}>
                {intent === 'kiralik' ? '🔑 KİRALIK' : '🏷️ SATILIK'}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
            {selectedListing.title}
          </h2>
        </div>

        {/* Main Photo Canvas & Thumbnails */}
        <div className="space-y-3 mb-6">
          <div className="relative h-[80vh] min-h-[480px] max-h-[82vh] md:aspect-[16/9] md:h-auto md:min-h-0 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-inner group select-none touch-pan-y animate-scale-up">
            <AnimatePresence initial={false} mode="wait">
              <motion.img 
                key={currentImg}
                src={currentImg} 
                alt={selectedListing.title} 
                className="w-full h-full object-cover cursor-grab active:cursor-grabbing pointer-events-auto"
                referrerPolicy="no-referrer"
                onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }}
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.4, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_e, { offset, velocity }) => {
                  const swipe = offset.x;
                  const speed = velocity.x;
                  if (Math.abs(swipe) > 40 || Math.abs(speed) > 400) {
                    if (swipe > 0 || speed > 400) {
                      setActiveDetailImageIndex(prev => prev === 0 ? modalImages.length - 1 : prev - 1);
                    } else {
                      setActiveDetailImageIndex(prev => prev === modalImages.length - 1 ? 0 : prev + 1);
                    }
                  }
                }}
              />
            </AnimatePresence>
            
            {/* Subtle Swipe Guide & Image Counter Overlay */}
            {modalImages.length > 1 && (
              <>
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/75 text-white/90 rounded-full text-[10px] font-bold border border-white/10 backdrop-blur-md shadow-md flex items-center gap-1.5 pointer-events-none">
                  <span>👈 Sağa / Sola Kaydırın 👉</span>
                </div>

                <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/80 text-white rounded-lg text-xs font-black border border-white/20 backdrop-blur-md shadow-md pointer-events-none">
                  {activeDetailImageIndex + 1} / {modalImages.length}
                </div>

                {/* Dot Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 pointer-events-none">
                  {modalImages.slice(0, 10).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeDetailImageIndex
                          ? "w-5 bg-amber-400"
                          : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                  {modalImages.length > 10 && (
                    <span className="text-[9px] text-white/60 font-bold ml-0.5">+{modalImages.length - 10}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          {modalImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {modalImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDetailImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    idx === activeDetailImageIndex 
                      ? "border-emerald-500 scale-105 shadow-md shadow-emerald-500/20" 
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Banner */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xs">
          <div>
            <span className="text-xs text-amber-900/70 font-bold uppercase block mb-0.5">
              {intent === 'kiralik' ? 'Aylık Kira Bedeli' : 'Satış Fiyatı'}
            </span>
            <div className="text-2xl md:text-3xl font-black text-emerald-700 flex items-baseline gap-2">
              <span>{Math.round(Number(selectedListing.price) || 0).toLocaleString('tr-TR')}</span>
              <span className="text-lg text-slate-800">{selectedListing.currency || 'TL'}</span>
              {intent === 'kiralik' && <span className="text-xs text-slate-500 font-normal">/ Aylık</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
              <MapPin className="w-4 h-4 text-rose-500" />
              {formatLocation(selectedListing)}
            </span>
          </div>
        </div>

        {/* Detailed Specs Grid */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            İlan Özellikleri & Detaylar
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedListing.listing_type === 'real_estate' ? (
              (() => {
                const isLand = sec.type === 'land' || 
                  sec.property_type === 'land' || 
                  selectedListing.type === 'land' || 
                  (selectedListing.category || '').toLowerCase().includes('land') || 
                  (selectedListing.category || '').toLowerCase().includes('arsa') || 
                  (selectedListing.category || '').toLowerCase().includes('tarla') ||
                  (selectedListing.title || '').toLowerCase().includes('arsa') ||
                  (selectedListing.title || '').toLowerCase().includes('tarla');

                if (isLand) {
                  return (
                    <>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Mülk Tipi</span>
                        <span className="text-xs font-black text-slate-900">{formatCategory(selectedListing)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Arsa Alanı</span>
                        <span className="text-xs font-black text-emerald-700">
                          {(() => {
                            const sqVal = getSquareMeters(selectedListing);
                            if (!sqVal) return 'Belirtilmedi';
                            return `${sqVal} m²`;
                          })()}
                        </span>
                      </div>
                      {(() => {
                        const isRent = selectedListing.listing_intent === 'rent' || selectedListing.intent === 'rent' || sec.listing_intent === 'rent' || sec.intent === 'rent' || selectedListing.fihrist_type === 'kiralik';
                        if (isRent) return null;
                        const titleDeedType = selectedListing.kocan_type || selectedListing.kktc_title_type || sec.kocan_type || sec.kktc_title_type || sec.deed_type || sec.kocan;
                        if (!titleDeedType) return null;
                        return (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Koçan / Tapu</span>
                            <span className="text-xs font-black text-amber-800">{formatTitleDeedType(titleDeedType)}</span>
                          </div>
                        );
                      })()}
                      {(sec.island || sec.plot) && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Ada / Parsel</span>
                          <span className="text-xs font-black text-slate-900">{sec.island || '---'} / {sec.plot || '---'}</span>
                        </div>
                      )}
                      {sec.kaks && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Emsal / KAKS</span>
                          <span className="text-xs font-black text-slate-900">{sec.kaks}</span>
                        </div>
                      )}
                      {sec.gabari && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Gabari / Kat Sınırı</span>
                          <span className="text-xs font-black text-slate-900">{sec.gabari}</span>
                        </div>
                      )}
                      {sec.elektrik_var !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Elektrik Altyapısı</span>
                          <span className="text-xs font-black text-emerald-700">{sec.elektrik_var ? 'Altyapı Var' : 'Yok'}</span>
                        </div>
                      )}
                      {sec.su_var !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Su Altyapısı</span>
                          <span className="text-xs font-black text-emerald-700">{sec.su_var ? 'Altyapı Var' : 'Yok'}</span>
                        </div>
                      )}
                      {sec.yol_var !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Kadastro Yolu</span>
                          <span className="text-xs font-black text-emerald-700">{sec.yol_var ? 'Kadastro Yolu Var' : 'Yok'}</span>
                        </div>
                      )}
                      {sec.trafo_bedeli !== undefined && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Trafo Bedeli</span>
                          <span className="text-xs font-black text-slate-900">{sec.trafo_bedeli ? 'Ödendi' : 'Ödenmedi'}</span>
                        </div>
                      )}
                    </>
                  );
                }

                return (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mülk Tipi</span>
                      <span className="text-xs font-black text-slate-900">{formatCategory(selectedListing)}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Oda Sayısı</span>
                      <span className="text-xs font-black text-blue-700">{selectedListing.room_count || sec.rooms || sec.oda || 'Belirtilmedi'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Metrekare (Net)</span>
                      <span className="text-xs font-black text-emerald-700">
                        {(() => {
                          const sqVal = getSquareMeters(selectedListing);
                          if (!sqVal) return 'Belirtilmedi';
                          return `${sqVal} m²`;
                        })()}
                      </span>
                    </div>
                    {(() => {
                      const isRent = selectedListing.listing_intent === 'rent' || selectedListing.intent === 'rent' || sec.listing_intent === 'rent' || sec.intent === 'rent' || selectedListing.fihrist_type === 'kiralik';
                      if (isRent) return null;
                      const titleDeedType = selectedListing.kocan_type || selectedListing.kktc_title_type || sec.kocan_type || sec.kktc_title_type || sec.deed_type || sec.kocan;
                      if (!titleDeedType) return null;
                      return (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Koçan / Tapu</span>
                          <span className="text-xs font-black text-amber-800">{formatTitleDeedType(titleDeedType)}</span>
                        </div>
                      );
                    })()}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Eşya Durumu</span>
                      <span className="text-xs font-black text-slate-900">{sec.furnished ? 'Eşyalı' : 'Eşyasız'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bulunduğu Kat</span>
                      <span className="text-xs font-black text-slate-900">{sec.floor || 'Giriş / Bahçe'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Isınma / Soğutma</span>
                      <span className="text-xs font-black text-slate-900">{sec.heating || 'Klima'}</span>
                    </div>
                    {sec.deposit && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Depozito</span>
                        <span className="text-xs font-black text-purple-700">{sec.deposit}</span>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Marka</span>
                  <span className="text-xs font-black text-slate-900">{selectedListing.brand || 'Belirtilmedi'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Model Yılı</span>
                  <span className="text-xs font-black text-blue-700">{selectedListing.year || sec.year || 'Belirtilmedi'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kilometre (KM)</span>
                  <span className="text-xs font-black text-emerald-700">
                    {selectedListing.mileage ? Math.round(Number(selectedListing.mileage)).toLocaleString('tr-TR') + ' KM' : 'Sıfır'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Yakıt Tipi</span>
                  <span className="text-xs font-black text-amber-800">
                    {formatFuelType(
                      selectedListing.fuel_type || 
                      selectedListing.fuel || 
                      sec.fuel_type || 
                      sec.fuel || 
                      sec.yakit
                    )}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vites Tipi</span>
                  <span className="text-xs font-black text-slate-900">
                    {formatTransmission(
                      selectedListing.transmission || 
                      selectedListing.vites || 
                      sec.transmission || 
                      sec.vites || 
                      'automatic'
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description Block */}
        {cleanedDesc && (
          <div className="mb-6 bg-slate-50/90 p-4 md:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">İlan Açıklaması</h4>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
              {cleanedDesc}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              const rawPhone = selectedListing.store_phone || sec.phone || "905330000000";
              window.open(`https://wa.me/${rawPhone.replace(/\D/g, "")}`, "_blank");
            }}
            className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>WhatsApp İletişim</span>
          </button>

          <a
            href={`tel:${(selectedListing.store_phone || sec.phone || "").replace(/\D/g, "")}`}
            className="py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
          >
            <Phone className="w-4 h-4" />
            <span>Hemen Ara</span>
          </a>

          <Link
            to={`/s/${selectedListing.store_slug}/p/${selectedListing.barcode || selectedListing.id}`}
            target="_blank"
            className="py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs text-center rounded-xl flex items-center justify-center gap-2 shadow-md transition"
          >
            <span>Mağaza Sayfasına Git</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};

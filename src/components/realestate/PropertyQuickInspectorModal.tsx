import React, { useState } from "react";
import {
  X,
  MapPin,
  Bed,
  Maximize,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  Edit2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Layers,
  Share2
} from "lucide-react";

interface PropertyQuickInspectorModalProps {
  property: any;
  storeSlug?: string;
  onClose: () => void;
  onEditProperty?: (property: any) => void;
  onScheduleTour?: (property: any) => void;
}

export const PropertyQuickInspectorModal: React.FC<PropertyQuickInspectorModalProps> = ({
  property,
  storeSlug,
  onClose,
  onEditProperty,
  onScheduleTour
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  if (!property) return null;

  const images: string[] = Array.isArray(property.images) && property.images.length > 0
    ? property.images.filter(Boolean)
    : property.image_url
      ? [property.image_url]
      : [];

  const totalImages = images.length;
  const safeIdx = totalImages > 0 ? ((activeImgIdx % totalImages) + totalImages) % totalImages : 0;

  const isRent = property.listing_intent === "rent" || property.sector_data?.listing_intent === "rent";
  const currencySymbol =
    property.currency === "GBP"
      ? "£"
      : property.currency === "USD"
      ? "$"
      : property.currency === "EUR"
      ? "€"
      : property.currency || "₺";

  const formattedPrice = (() => {
    const raw = Number(String(property.price || 0).replace(/[^0-9.-]+/g, ""));
    if (isNaN(raw) || raw === 0) return `${currencySymbol}${property.price || 0}`;
    return `${currencySymbol}${new Intl.NumberFormat("tr-TR").format(raw)}`;
  })();

  const refNo = property.reference_no || `#${property.id}`;
  const region = property.kktc_region || property.location || "KKTC";
  const fullLocation =
    property.kktc_region && property.location && property.kktc_region !== property.location
      ? `${property.kktc_region} / ${property.location}`
      : region;

  const sector = property.sector_data || {};
  const deedType = property.kktc_deed_type || sector.kktc_deed_type || property.deed_status || "Belirtilmedi";
  const roomCount = property.room_count || sector.room_count || "-";
  const netArea = property.area || property.net_area || sector.net_area || 0;
  const grossArea = property.gross_area || sector.gross_area || 0;
  const buildingAge = property.building_age ?? sector.building_age ?? "-";
  const floorNumber = property.floor_number ?? sector.floor_number ?? "-";
  const heating = property.heating || sector.heating || "-";
  const isFurnished = Boolean(property.furnished || sector.furnished);

  const webUrl = storeSlug
    ? `/${storeSlug}?product=re_${property.id}`
    : `/?product=re_${property.id}`;

  const handleShareWhatsApp = () => {
    const fullWebUrl = typeof window !== "undefined" ? `${window.location.origin}${webUrl}` : webUrl;
    const text = `*${property.title}*\nREF: ${refNo}\nBölge: ${fullLocation}\nFiyat: ${formattedPrice}\nOda: ${roomCount} | Alan: ${netArea} m²\n\nİlan Detayı: ${fullWebUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[100050] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Header (Rule 11 High Contrast) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                isRent ? "bg-sky-500 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              {isRent ? "KİRALIK" : "SATILIK"}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-[11px] font-black shrink-0">
              REF: {refNo}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <MapPin className="w-3 h-3 text-indigo-400" />
              {fullLocation}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="Müşteri vitrin sayfasında yeni sekmede aç"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Web'de Gör</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Title & Price Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  {fullLocation}
                </span>
                {property.branch_name && (
                  <span>• Şube: {property.branch_name}</span>
                )}
                {(property.consultant_name || property.agent_name) && (
                  <span>• Danışman: {property.consultant_name || property.agent_name}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                İLAN BEDELİ
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 font-mono">
                {formattedPrice}
              </div>
            </div>
          </div>

          {/* Interactive Photo Gallery & Specs Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Left: Photo Carousel (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-2">
              <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                {totalImages > 0 ? (
                  <img
                    src={images[safeIdx]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                    <Building2 className="w-8 h-8" />
                    <span className="text-xs font-bold">Görsel Bulunmuyor</span>
                  </div>
                )}

                {totalImages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImgIdx((prev) => (prev - 1 + totalImages) % totalImages)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center border border-white/20 cursor-pointer transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImgIdx((prev) => (prev + 1) % totalImages)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center border border-white/20 cursor-pointer transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono font-black border border-white/15">
                      {safeIdx + 1} / {totalImages}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {totalImages > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {images.slice(0, 10).map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIdx(idx)}
                      className={`w-12 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                        idx === safeIdx
                          ? "border-indigo-600 ring-1 ring-indigo-600"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Technical Specs Bento (5 cols) */}
            <div className="md:col-span-5 grid grid-cols-2 gap-2 content-start">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Oda Sayısı</span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                  <Bed className="w-3.5 h-3.5 text-indigo-600" />
                  {roomCount}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Metrekare</span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                  <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                  {netArea} m² {grossArea ? `/ ${grossArea} m²` : ""}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Koçan / Tapu</span>
                <span className="text-xs font-black text-slate-900 truncate block mt-0.5">
                  {deedType}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Eşya Durumu</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {isFurnished ? "Eşyalı" : "Eşyasız"}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Bina Yaşı / Kat</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  Yaş: {buildingAge} • Kat: {floorNumber}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Isıtma / Cephe</span>
                <span className="text-xs font-black text-slate-900 truncate block mt-0.5">
                  {heating} {property.aspect ? `• ${property.aspect}` : ""}
                </span>
              </div>

              {/* Pipeline Status Pill */}
              <div className="col-span-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-500 block">
                    Güncel Pipeline Durumu
                  </span>
                  <span className="text-xs font-black text-indigo-950">
                    {sector.pipeline_stage === "planned"
                      ? "1. Geziler (Planlanan Gösterim)"
                      : sector.pipeline_stage === "analysis"
                      ? "2. Analiz (Değerlendirme)"
                      : sector.pipeline_stage === "negotiation"
                      ? "3. Pazarlık / Teklif"
                      : sector.pipeline_stage === "negative"
                      ? "4. Olumsuz (Arşiv)"
                      : sector.pipeline_stage === "closed"
                      ? "5. Başarılı (Kapandı)"
                      : "Aktif Portföy"}
                  </span>
                </div>
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              </div>
            </div>
          </div>

          {/* Description Box */}
          {property.description && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400">
                Portföy Açıklaması & Detaylar
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {property.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onEditProperty && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditProperty(property);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Portföyü Düzenle</span>
              </button>
            )}

            {onScheduleTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onScheduleTour(property);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Yeni Gezi Planla</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Paylaş</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-black cursor-pointer transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

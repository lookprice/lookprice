import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  MapPin,
  FolderLock,
  Eye,
  FileSignature,
  Award,
  Share2,
  Printer,
  Calendar,
  Layout,
  Edit2,
  Trash2,
  Building2,
  User,
  Ruler,
  Compass,
  Check,
  ShieldAlert,
  Handshake,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  X,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { RealEstateViewMode } from "./types";
import { formatNumberVal, unescapeHtmlManual } from "./RealEstatePrintPoster";

interface RealEstateCardProps {
  property: any;
  viewMode: RealEstateViewMode;
  storeSlug?: string;
  onOpenContract: (p: any) => void;
  onOpenTapu: (p: any) => void;
  onOpenSocialShare: (p: any) => void;
  onPrint: (p: any) => void;
  onOpenTour: (p: any) => void;
  onGoToPipeline: () => void;
  onEdit: (p: any) => void;
  onDelete: (id: any) => void;
  onViewDocs: (p: any) => void;
  onOpenFixtureVault?: (p: any) => void;
  onOpenCommission?: (p: any) => void;
}

/**
 * Strips primitive OS/browser emojis from titles & descriptions per AGENTS.md Rule 25 & Rule 33
 */
const stripAntiqueEmojis = (text?: string): string => {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const RealEstateCard: React.FC<RealEstateCardProps> = ({
  property,
  viewMode,
  storeSlug,
  onOpenContract,
  onOpenTapu,
  onOpenSocialShare,
  onPrint,
  onOpenTour,
  onGoToPipeline,
  onEdit,
  onDelete,
  onViewDocs,
  onOpenFixtureVault,
  onOpenCommission
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [menuOpenUpwards, setMenuOpenUpwards] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const images: string[] = Array.isArray(property.images) && property.images.length > 0
    ? property.images.filter(Boolean)
    : property.image_url
    ? [property.image_url]
    : [];

  const totalImages = images.length;
  const safeImageIdx = totalImages > 0 ? currentImageIdx % totalImages : 0;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCurrentImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCurrentImageIdx((prev) => (prev + 1) % totalImages);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalImages <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (totalImages <= 1 || touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 35) {
      e.stopPropagation();
      if (deltaX < 0) {
        setCurrentImageIdx((prev) => (prev + 1) % totalImages);
      } else {
        setCurrentImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
      }
    }
  };

  useEffect(() => {
    if (!isActionsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionsMenuOpen]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft" && totalImages > 1) {
        setCurrentImageIdx((prev) => (prev - 1 + totalImages) % totalImages);
      } else if (e.key === "ArrowRight" && totalImages > 1) {
        setCurrentImageIdx((prev) => (prev + 1) % totalImages);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, totalImages]);

  // Direct link to this property on the store's public website
  const resolvedSlug =
    storeSlug ||
    (typeof window !== "undefined"
      ? window.location.pathname.match(/\/(?:dashboard|store|s)\/([^/?#]+)/)?.[1] || ""
      : "");
  const cleanPropId = String(property.id).replace(/^re_/, "");
  const webProductUrl = resolvedSlug
    ? `/s/${resolvedSlug}/p/re_${cleanPropId}?product=re_${cleanPropId}`
    : `/p/re_${cleanPropId}?product=re_${cleanPropId}`;

  const isFurnished = Boolean(
    property.furnished === true ||
    property.furnished === "true" ||
    property.furnished === "esyali" ||
    property.furnished === "furnished" ||
    property.sector_data?.furnished === true ||
    property.sector_data?.furnished === "esyali"
  );

  const currencySymbol =
    property.currency === "GBP"
      ? "£"
      : property.currency === "USD"
      ? "$"
      : property.currency === "EUR"
      ? "€"
      : "₺";

  const cleanTitle = stripAntiqueEmojis(property.title) || property.title || "İsimsiz Portföy";
  const cleanDescription = property.description
    ? stripAntiqueEmojis(unescapeHtmlManual(property.description))
    : "";

  const statusLabel =
    property.status === "optioned"
      ? "OPSİYONLU"
      : property.status === "sold"
      ? "SATILDI"
      : property.status === "rented"
      ? "KİRALANDI"
      : property.listing_intent === "rent"
      ? "KİRALIK"
      : "SATILIK";

  const statusBadgeClass =
    property.status === "optioned"
      ? "bg-amber-600 text-white"
      : property.status === "sold"
      ? "bg-rose-600 text-white"
      : property.status === "rented"
      ? "bg-sky-700 text-white"
      : property.listing_intent === "rent"
      ? "bg-sky-600 text-white"
      : "bg-emerald-600 text-white";

  const scopeLabel =
    property.sharing_scope === "private"
      ? "Kişisel"
      : property.sharing_scope === "branch_private"
      ? "Ofise Özel"
      : "Ortak Havuz";

  const locationText =
    property.kktc_region ||
    property.location ||
    property.address ||
    property.sector_data?.location ||
    "KKTC";

  const docCount = Array.isArray(property.documents) ? property.documents.length : 0;
  const fixturePhotoCount = Array.isArray(property.fixture_photos) ? property.fixture_photos.length : 0;
  const externalPartner = property.sector_data?.commission_pool?.stakeholders?.find(
    (s: any) => s.is_external && s.payout_status !== "cancelled"
  );

  const handleToggleActionsMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isActionsMenuOpen && typeof window !== "undefined") {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Only open upwards if near the bottom of the screen AND there is plenty of room above (below top header)
      setMenuOpenUpwards(spaceBelow < 320 && spaceAbove > 360);
    }
    setIsActionsMenuOpen((prev) => !prev);
  };

  /**
   * Shared Action Buttons: ONLY Kalem (Edit) + Collapsible Actions Menu (•••)
   * Used identically in both List and Grid views.
   */
  const renderActionControls = () => (
    <div className="flex items-center gap-1 shrink-0" ref={menuRef}>
      {/* ONLY Kalem (Edit) Icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(property);
        }}
        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
        title="Portföyü Düzenle"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {/* Collapsible Operations Menu (Açılır-Kapanır İşlemler Listesi) */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleActionsMenu}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center relative shrink-0 ${
            isActionsMenuOpen
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
          }`}
          title="İşlemler Menüsü"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
          {(fixturePhotoCount > 0 || docCount > 0) && !isActionsMenuOpen && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 border border-white" />
          )}
        </button>

        {isActionsMenuOpen && (
          <div
            className={`absolute right-0 ${
              menuOpenUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } w-56 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-100`}
          >
            {/* Direct Web Storefront Product Page Link */}
            <a
              href={webProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                setIsActionsMenuOpen(false);
              }}
              className="w-full px-3 py-2 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-950 flex items-center justify-between text-left cursor-pointer border-b border-indigo-100"
            >
              <span className="flex items-center gap-2 font-black">
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Web'de Gör (Vitrin)</span>
              </span>
              <ExternalLink className="w-3 h-3 text-indigo-600 shrink-0" />
            </a>

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                onOpenContract(property);
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
            >
              <FileSignature className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span>Sözleşme Oluştur</span>
            </button>

            {onOpenCommission && (
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen(false);
                  onOpenCommission(property);
                }}
                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Handshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Paydaş & Hakediş</span>
                </span>
                {externalPartner && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-black">
                    %{externalPartner.percentage}
                  </span>
                )}
              </button>
            )}

            {property.listing_intent === "rent" && isFurnished && onOpenFixtureVault && (
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen(false);
                  onOpenFixtureVault(property);
                }}
                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Eşyalar (Demirbaş)</span>
                </span>
                {fixturePhotoCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded text-[10px] font-black">
                    {fixturePhotoCount}
                  </span>
                )}
              </button>
            )}

            {property.listing_intent !== "rent" && (
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen(false);
                  onOpenTapu(property);
                }}
                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tapu Süreç Takibi</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                onOpenTour(property);
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Yer Gösterme / Tur Planla</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                onGoToPipeline();
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
            >
              <Layout className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>CRM Pipeline'a Git</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                onOpenSocialShare(property);
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Sosyal Medya Paylaşım</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                onPrint(property);
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>A4 Vitrin Afişi Yazdır</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                if (docCount > 0) {
                  onViewDocs(property);
                } else {
                  toast.info("Bu gayrimenkule ait henüz yüklenmiş resmî evrak bulunmuyor.");
                }
              }}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FolderLock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Resmî Evraklar</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{docCount}</span>
            </button>

            <a
              href={`/mulk-takip/${property.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsActionsMenuOpen(false)}
              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer text-emerald-700"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Mülk Sahibi Canlı Takip</span>
            </a>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={() => {
                setIsActionsMenuOpen(false);
                if (window.confirm("Bu gayrimenkulü silmek istediğinize emin misiniz?")) {
                  onDelete(property.id);
                }
              }}
              className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Portföyü Sil</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // GRID MODE (Izgara Görünümü — Interactive Image Carousel + Web'de Gör + Kalem + Açılır-Kapanır İşlemler Listesi)
  if (viewMode === "grid") {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs flex flex-col justify-between transition-all relative ${
          isActionsMenuOpen ? "z-40" : "z-0"
        }`}
      >
        <div>
          <div
            className="w-full h-44 sm:h-48 bg-slate-100 relative overflow-hidden rounded-t-xl group select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {totalImages > 0 ? (
              <img
                src={images[safeImageIdx]}
                alt={`${cleanTitle} - Görsel ${safeImageIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Home className="w-8 h-8 stroke-[1.5]" />
              </div>
            )}

            {/* Top Left: Status + Ref Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 z-10 pointer-events-none">
              <span className={`font-black text-[9px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${statusBadgeClass}`}>
                {statusLabel}
              </span>
              {property.reference_no && (
                <span className="font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900/85 text-white">
                  {property.reference_no}
                </span>
              )}
            </div>

            {/* Top Right: Direct "Web'de Gör" Badge on Image */}
            <a
              href={webProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/85 hover:bg-indigo-600 text-white text-[9.5px] font-black shadow-sm transition-colors cursor-pointer"
              title="Web sitesinde ürün sayfasını yeni sekmede aç"
            >
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              <span>Web'de Gör</span>
            </a>

            {/* Prev / Next Image Carousel Buttons (when multiple photos exist) */}
            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90"
                  title="Önceki Fotoğraf"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-90"
                  title="Sonraki Fotoğraf"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Bottom Left Image Counter + Dots */}
                <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-slate-950/80 text-white px-2 py-0.5 rounded-md text-[9.5px] font-mono font-black">
                  <span>
                    {safeImageIdx + 1}/{totalImages}
                  </span>
                  <div className="flex items-center gap-1">
                    {images.slice(0, 6).map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIdx(dotIdx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                          safeImageIdx === dotIdx ? "bg-white scale-125" : "bg-white/40 hover:bg-white/75"
                        }`}
                        aria-label={`Görsel ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Bottom Right: Price Badge */}
            <div className="absolute bottom-2 right-2 z-10 bg-slate-950/90 text-white px-2 py-0.5 rounded-md font-mono font-black text-xs">
              {currencySymbol}{formatNumberVal(property.price)}
            </div>
          </div>

          <div className="p-2.5 space-y-1.5">
            <h4
              onClick={() => onEdit(property)}
              className="font-black text-xs text-slate-950 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug cursor-pointer"
              title={cleanTitle}
            >
              {cleanTitle}
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-600">
              <span>{locationText}</span>
              {property.room_count && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-800">{property.room_count}</span>
                </>
              )}
              {property.square_meters && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{formatNumberVal(property.square_meters)} m²</span>
                </>
              )}
              {property.listing_intent === "rent" && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-indigo-700">{isFurnished ? "Eşyalı" : "Eşyasız"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-2.5 py-2 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-[10px] font-bold text-slate-600 truncate">
              {property.responsible_agent || property.branch_name || "Merkez Ofis"}
            </span>
            {externalPartner && (
              <button
                type="button"
                onClick={() => onOpenCommission && onOpenCommission(property)}
                className="px-1.5 py-0.2 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[9px] font-black shrink-0 cursor-pointer"
                title="Paydaş & Hakediş Detayı"
              >
                Paydaş: {externalPartner.name} (%{externalPartner.percentage})
              </button>
            )}
            {docCount > 0 && (
              <button
                type="button"
                onClick={() => onViewDocs(property)}
                className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black shrink-0 cursor-pointer"
              >
                Evrak ({docCount})
              </button>
            )}
          </div>
          {renderActionControls()}
        </div>
      </div>
    );
  }

  // LIST MODE (Kompakt Liste Görünümü — Maksimum Portföy Başlık Alanı + Web'de Gör + Sadece Kalem ve ••• İşlemler Menüsü)
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all relative ${
        isActionsMenuOpen ? "z-40" : "z-0"
      }`}
    >
      <div className="p-2 sm:p-2.5 flex items-start sm:items-center gap-2.5">
        {/* Compact Thumbnail — Opens Full-Screen Lightbox if images exist */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (totalImages > 0) {
              setIsLightboxOpen(true);
            } else {
              setIsDetailsExpanded((prev) => !prev);
            }
          }}
          className="w-16 h-16 sm:w-20 sm:h-16 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 cursor-pointer border border-slate-200/80 group select-none"
          title={totalImages > 0 ? "Tam ekran fotoğraf galerisini açmak için tıklayın" : "Detay künyesini açmak için tıklayın"}
        >
          {totalImages > 0 ? (
            <img
              src={images[0]}
              alt={cleanTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Home className="w-5 h-5 stroke-[1.5]" />
            </div>
          )}

          {/* Micro Status Tag */}
          <span
            className={`absolute top-1 left-1 font-black text-[8px] px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase leading-none ${statusBadgeClass}`}
          >
            {statusLabel}
          </span>

          {/* Subtle Photo Count Badge (Full-Screen Lightbox Trigger Indicator) */}
          {totalImages > 1 && (
            <span className="absolute bottom-1 right-1 bg-slate-950/75 text-white text-[8px] font-mono font-black px-1 py-0.2 rounded leading-tight inline-flex items-center gap-0.5">
              <Maximize2 className="w-2 h-2" />
              <span>{totalImages}</span>
            </span>
          )}
        </div>

        {/* Center Info Column — Full Horizontal Room for Portfolio Title & Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Top Line: Portfolio Title (Full Width, 1-2 lines, clearly readable on mobile & desktop) */}
          <h4
            onClick={() => setIsDetailsExpanded((prev) => !prev)}
            className="font-black text-xs sm:text-[13px] text-slate-950 hover:text-indigo-600 transition-colors line-clamp-2 sm:line-clamp-1 leading-snug cursor-pointer"
            title={cleanTitle}
          >
            {cleanTitle}
          </h4>

          {/* Bottom Line: Price + REF + Location + Room/m² + Web'de Gör + Docs */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-600 leading-tight">
            {/* Price highlighted first so it never squeezes the title */}
            <span className="font-mono font-black text-xs sm:text-[13px] text-indigo-700">
              {currencySymbol}{formatNumberVal(property.price)}
            </span>

            <span className="text-slate-300">·</span>

            {property.reference_no && (
              <span className="font-mono font-black text-[9.5px] text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                {property.reference_no}
              </span>
            )}

            <span className="text-slate-800 font-extrabold inline-flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
              <span>{locationText}</span>
            </span>

            {property.room_count && (
              <>
                <span className="text-slate-300">·</span>
                <span className="font-extrabold text-slate-900">{property.room_count}</span>
              </>
            )}

            {property.square_meters && (
              <>
                <span className="text-slate-300 hidden xs:inline">·</span>
                <span className="hidden xs:inline">{formatNumberVal(property.square_meters)} m²</span>
              </>
            )}

            {property.listing_intent === "rent" ? (
              <>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className={`hidden sm:inline font-extrabold ${isFurnished ? "text-indigo-700" : "text-amber-700"}`}>
                  {isFurnished ? "Eşyalı" : "Eşyasız"}
                </span>
              </>
            ) : property.kktc_title_type ? (
              <>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="hidden sm:inline text-indigo-700 font-extrabold">{property.kktc_title_type}</span>
              </>
            ) : null}

            {/* Direct "Web'de Gör" Quick Link Pill */}
            <a
              href={webProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[9px] font-black cursor-pointer transition-colors"
              title="Müşteriye göstermek için web sitesindeki ilan sayfasını yeni sekmede aç"
            >
              <ExternalLink className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
              <span>Web'de Gör</span>
            </a>

            {externalPartner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenCommission) onOpenCommission(property);
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-[9px] font-black cursor-pointer"
                title="Paydaş & Hakediş Detayı"
              >
                <Handshake className="w-2.5 h-2.5 text-amber-700" />
                <span>Paydaş: {externalPartner.name} (%{externalPartner.percentage})</span>
              </button>
            )}

            {docCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocs(property);
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black cursor-pointer"
                title="Yüklü resmî evrakları görüntüle"
              >
                <FolderLock className="w-2.5 h-2.5 text-emerald-600" />
                <span>Evrak ({docCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Action Cluster: ONLY Kalem (Edit) + ••• (Açılır-Kapanır İşlemler Listesi) */}
        {renderActionControls()}
      </div>

      {/* Collapsible Detail & Description Accordion (Opens when operator clicks row title) */}
      {isDetailsExpanded && (
        <div className="px-2.5 pb-2.5 pt-2 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-2 text-[11px] animate-in fade-in duration-100">
          <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] font-bold text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-slate-800">
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>{property.branch_name || "Merkez Ofis"}</span>
              </span>
              <span>·</span>
              <span>{scopeLabel}</span>
              {property.square_meters && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Ruler className="w-3 h-3 text-slate-400" />
                    <span>
                      {formatNumberVal(property.square_meters)} m² Net
                      {property.sqm_gross ? ` / ${formatNumberVal(property.sqm_gross)} m² Brüt` : ""}
                    </span>
                  </span>
                </>
              )}
              {property.facade && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Compass className="w-3 h-3 text-slate-400" />
                    <span>{property.facade} Cephe</span>
                  </span>
                </>
              )}
              {property.block_plot && (
                <>
                  <span>·</span>
                  <span>Ada/Parsel: {property.block_plot}</span>
                </>
              )}
            </div>

            {property.responsible_agent && (
              <span className="text-indigo-700 font-black uppercase inline-flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                <span>Danışman: {property.responsible_agent}</span>
              </span>
            )}
          </div>

          {cleanDescription && (
            <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 bg-white p-2 rounded-lg border border-slate-200/80">
              {cleanDescription}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div
              onClick={() => {
                if (docCount > 0) {
                  onViewDocs(property);
                } else {
                  toast.info("Bu gayrimenkule ait henüz yüklenmiş bir resmî evrak yok.");
                }
              }}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100"
            >
              <FolderLock className="w-3 h-3 text-amber-500" />
              <span>Resmî Evraklar:</span>
              {docCount > 0 ? (
                <span className="text-emerald-700 font-black flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Yüklü ({docCount} adet) — Görüntüle</span>
                </span>
              ) : (
                <span className="text-slate-400">Yüklenmemiş</span>
              )}
            </div>

            <a
              href={webProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>Web Sitesinde Ürünü Aç</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal for Row View */}
      {isLightboxOpen && totalImages > 0 && (
        <div
          className="fixed inset-0 z-[100060] bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between gap-3 pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {property.reference_no && (
                  <span className="font-mono font-black text-[10px] bg-white/15 text-white px-2 py-0.5 rounded">
                    {property.reference_no}
                  </span>
                )}
                <span className="font-mono font-black text-xs text-emerald-400">
                  {currencySymbol}{formatNumberVal(property.price)}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  ({safeImageIdx + 1} / {totalImages})
                </span>
              </div>
              <h3 className="font-black text-xs sm:text-sm text-white truncate mt-0.5">
                {cleanTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Image Stage with Prev/Next Controls */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[safeImageIdx]}
              alt={`${cleanTitle} - ${safeImageIdx + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />

            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xl cursor-pointer transition-transform active:scale-95"
                  title="Önceki Fotoğraf"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xl cursor-pointer transition-transform active:scale-95"
                  title="Sonraki Fotoğraf"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { RealEstateViewMode } from "./types";
import { formatNumberVal, unescapeHtmlManual } from "./RealEstatePrintPoster";

interface RealEstateCardProps {
  property: any;
  viewMode: RealEstateViewMode;
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
  onOpenContract,
  onOpenTapu,
  onOpenSocialShare,
  onPrint,
  onOpenTour,
  onGoToPipeline,
  onEdit,
  onDelete,
  onViewDocs,
  onOpenFixtureVault
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Compact Grid Mode (When user switches to 3-column grid)
  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs overflow-hidden flex flex-col justify-between transition-all">
        <div>
          <div className="w-full h-36 bg-slate-100 relative overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={cleanTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Home className="w-8 h-8 stroke-[1.5]" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <span className={`font-black text-[9px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${statusBadgeClass}`}>
                {statusLabel}
              </span>
              {property.reference_no && (
                <span className="font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900/85 text-white">
                  {property.reference_no}
                </span>
              )}
            </div>
            <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white px-2 py-0.5 rounded-md font-mono font-black text-xs">
              {currencySymbol}{formatNumberVal(property.price)}
            </div>
          </div>

          <div className="p-2.5 space-y-1.5">
            <h4
              onClick={() => onEdit(property)}
              className="font-black text-xs text-slate-950 hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
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

        <div className="px-2.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-slate-500 truncate">
            {property.responsible_agent || property.branch_name || "Merkez Ofis"}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onOpenContract(property)}
              className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Sözleşme Oluştur"
            >
              <FileSignature className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(property)}
              className="p-1.5 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              title="Düzenle"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: ULTRA-COMPACT HIGH-DENSITY ROW MODE (LookPrice %80 Zoom Minimalist Broker Standard)
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all">
      {/* Main Compact Row */}
      <div className="p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3">
        {/* Compact Thumbnail (Left) */}
        <div
          onClick={() => setIsDetailsExpanded(prev => !prev)}
          className="w-16 h-16 sm:w-20 sm:h-16 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 cursor-pointer border border-slate-200/80"
          title="Detayları ve açıklamayı görmek için tıklayın"
        >
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={cleanTitle}
              className="w-full h-full object-cover"
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
        </div>

        {/* Center Info Column (2 Clean High-Density Lines, Zero Description Clutter) */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Line 1: REF + Region + Key Specs + Scope + Docs */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-slate-600 leading-none">
            {property.reference_no && (
              <span className="font-mono font-black text-[9.5px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {property.reference_no}
              </span>
            )}

            <span className="text-slate-800 font-extrabold flex items-center gap-0.5 truncate max-w-[140px] sm:max-w-[220px]">
              <MapPin className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
              <span className="truncate">{locationText}</span>
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

            <span className="text-slate-300 hidden md:inline">·</span>
            <span className="hidden md:inline text-emerald-700 font-extrabold">{scopeLabel}</span>

            {property.responsible_agent && (
              <>
                <span className="text-slate-300 hidden lg:inline">·</span>
                <span className="hidden lg:inline-flex items-center gap-0.5 text-slate-700 font-bold">
                  <User className="w-2.5 h-2.5 text-slate-400" />
                  <span>{property.responsible_agent}</span>
                </span>
              </>
            )}

            {docCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocs(property);
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-black cursor-pointer"
                title="Yüklü resmî evrakları görüntüle"
              >
                <FolderLock className="w-2.5 h-2.5 text-emerald-600" />
                <span>Evrak ({docCount})</span>
              </button>
            )}
          </div>

          {/* Line 2: Clean Corporate Title (Emoji-Free) */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              onClick={() => setIsDetailsExpanded(prev => !prev)}
              className="font-extrabold text-xs sm:text-[13px] text-slate-950 hover:text-indigo-600 transition-colors truncate cursor-pointer"
              title={cleanTitle}
            >
              {cleanTitle}
            </h4>
          </div>
        </div>

        {/* Right Column: Price + Compact Action Triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Price */}
          <div className="text-right pr-1">
            <span className="block text-xs sm:text-sm font-black text-indigo-700 font-mono whitespace-nowrap leading-tight">
              {currencySymbol}{formatNumberVal(property.price)}
            </span>
            <span className="block text-[9px] font-bold text-slate-400 uppercase hidden sm:block leading-none">
              {property.branch_name || "Merkez"}
            </span>
          </div>

          {/* Primary Action 1: Contract */}
          <button
            type="button"
            onClick={() => onOpenContract(property)}
            className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer shrink-0"
            title="Sözleşme / Resmi Hizmet Oluştur"
          >
            <FileSignature className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action 2: Eşyalar (if furnished rent) or Tapu (if sale) */}
          {property.listing_intent === "rent" && isFurnished && onOpenFixtureVault ? (
            <button
              type="button"
              onClick={() => onOpenFixtureVault(property)}
              className="p-1.5 bg-sky-600 text-white hover:bg-sky-700 rounded-lg transition-all relative cursor-pointer shrink-0"
              title="Eşyalar (Demirbaş Tutanak & Fotoğraflar)"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {fixturePhotoCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                  {fixturePhotoCount}
                </span>
              )}
            </button>
          ) : property.listing_intent !== "rent" ? (
            <button
              type="button"
              onClick={() => onOpenTapu(property)}
              className="hidden sm:flex p-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all cursor-pointer shrink-0"
              title="Tapu Süreç & Randevu Takipçisi"
            >
              <Award className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Primary Action 3: Fast Edit */}
          <button
            type="button"
            onClick={() => onEdit(property)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
            title="Portföyü Düzenle"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Expandable Details Toggle (Description & Full Specs) */}
          <button
            type="button"
            onClick={() => setIsDetailsExpanded(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
              isDetailsExpanded
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title={isDetailsExpanded ? "Detay Künyesini Gizle" : "Açıklama ve Detay Künyesini Aç"}
          >
            {isDetailsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Compact Dropdown Menu for Secondary Operations (Replaces 9 cluttered buttons) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsActionsMenuOpen(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 shrink-0 ${
                isActionsMenuOpen
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
              title="Tüm Portföy İşlemleri"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isActionsMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-100">
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
                    onOpenContract(property);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                  <span>Sözleşme Oluştur</span>
                </button>

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
      </div>

      {/* Collapsible Detail & Description Accordion (Only open when operator clicks row title or Chevron) */}
      {isDetailsExpanded && (
        <div className="px-2.5 pb-2.5 pt-2 border-t border-slate-100 bg-slate-50/70 rounded-b-xl space-y-2 text-[11px] animate-in fade-in duration-100">
          {/* Full Specs & Address Line */}
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
              <span className="text-indigo-700 font-black uppercase">
                Danışman: {property.responsible_agent}
              </span>
            )}
          </div>

          {/* Clean Description */}
          {cleanDescription && (
            <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3 bg-white p-2 rounded-lg border border-slate-200/80">
              {cleanDescription}
            </p>
          )}

          {/* Quick Inline Action Bar inside Expanded View */}
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

            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => onOpenTour(property)}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>Gezi Planla</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenSocialShare(property)}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3 h-3 text-indigo-600" />
                <span>Paylaş</span>
              </button>
              <button
                type="button"
                onClick={() => onPrint(property)}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3 text-slate-600" />
                <span>Afiş Yazdır</span>
              </button>
              <a
                href={`/mulk-takip/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-emerald-600" />
                <span>Mülk Takip</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

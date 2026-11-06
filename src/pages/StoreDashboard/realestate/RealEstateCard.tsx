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
  MoreHorizontal
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
  const externalPartner = property.sector_data?.commission_pool?.stakeholders?.find((s: any) => s.is_external);

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
          onClick={(e) => {
            e.stopPropagation();
            setIsActionsMenuOpen(prev => !prev);
          }}
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
          <div className="absolute right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 text-xs font-bold text-slate-800 animate-in fade-in zoom-in-95 duration-100">
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

  // GRID MODE (Izgara Görünümü — Clean Card + Kalem + Açılır-Kapanır İşlemler Listesi)
  if (viewMode === "grid") {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs flex flex-col justify-between transition-all relative">
        <div>
          <div className="w-full h-36 bg-slate-100 relative overflow-hidden rounded-t-xl">
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
          <div className="flex items-center gap-1.5 min-w-0">
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

  // LIST MODE (Kompakt Liste Görünümü — Maksimum Portföy Başlık Alanı + Sadece Kalem ve ••• İşlemler Menüsü)
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all relative">
      <div className="p-2 sm:p-2.5 flex items-start sm:items-center gap-2.5">
        {/* Compact Thumbnail (Left) */}
        <div
          onClick={() => setIsDetailsExpanded(prev => !prev)}
          className="w-16 h-16 sm:w-20 sm:h-16 rounded-lg bg-slate-100 relative overflow-hidden shrink-0 cursor-pointer border border-slate-200/80"
          title="Detay künyesini açmak için tıklayın"
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

        {/* Center Info Column — Full Horizontal Room for Portfolio Title & Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Top Line: Portfolio Title (Full Width, 1-2 lines, clearly readable on mobile & desktop) */}
          <h4
            onClick={() => setIsDetailsExpanded(prev => !prev)}
            className="font-black text-xs sm:text-[13px] text-slate-950 hover:text-indigo-600 transition-colors line-clamp-2 sm:line-clamp-1 leading-snug cursor-pointer"
            title={cleanTitle}
          >
            {cleanTitle}
          </h4>

          {/* Bottom Line: Price + REF + Location + Room/m² + Docs */}
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

      {/* Collapsible Detail & Description Accordion (Opens when operator clicks row title or thumbnail) */}
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
          </div>
        </div>
      )}
    </div>
  );
};

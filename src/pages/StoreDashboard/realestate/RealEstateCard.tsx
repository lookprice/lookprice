import React from "react";
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
  Trash2
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
}

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
  onViewDocs
}) => {
  return (
    <div 
      className={`bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group relative ${
        viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-col sm:flex-row'
      }`}
    >
      {/* Image Banner */}
      <div className={`${viewMode === 'grid' ? 'w-full h-48' : 'w-full sm:w-64 h-64 shrink-0'} bg-slate-100 relative overflow-hidden`}>
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Home className="w-12 h-12 stroke-[1.25]" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className={`font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg tracking-wide ${
            property.status === 'optioned' ? 'bg-amber-600 text-white' :
            property.status === 'sold' ? 'bg-rose-600 text-white' :
            property.status === 'rented' ? 'bg-sky-700 text-white' :
            property.listing_intent === 'rent' ? 'bg-sky-600 text-white' :
            'bg-emerald-600 text-white'
          }`}>
            {property.status === 'optioned' ? '✍ OPSİYONLU' :
             property.status === 'sold' ? '✅ SATILDI' :
             property.status === 'rented' ? '🔑 KİRALANDI' :
             property.listing_intent === 'rent' ? '🔑 KİRALIK' : '🏠 SATILIK'}
          </span>
        </div>

        {/* Diagonal Banner for SOLD/RENTED */}
        {(property.status === 'sold' || property.status === 'rented') && (
          <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-10 pointer-events-none">
            <div className={`absolute top-0 right-0 w-[170px] py-1 text-center text-[10px] font-black tracking-[0.2em] text-white shadow-lg transform translate-x-[45px] translate-y-[25px] rotate-45 uppercase ${
              property.status === 'sold' ? 'bg-rose-600/90' : 'bg-sky-700/90'
            }`}>
              {property.status === 'sold' ? 'SATILDI' : 'KİRALANDI'}
            </div>
          </div>
        )}
      </div>

      {/* Content body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Branch and Scope Info */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-black border-b border-dashed border-slate-100 pb-2 mb-1">
            <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              🏢 {property.branch_name || 'Merkez Ofis'}
            </span>
            <span className={`px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
              property.sharing_scope === 'private' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              property.sharing_scope === 'branch_private' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
              'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {property.sharing_scope === 'private' ? '🔑 Kişisel' :
               property.sharing_scope === 'branch_private' ? '🔒 Ofise Özel' :
               '🌐 Ortak Havuz'}
            </span>
            {property.is_trade_in_available && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg uppercase tracking-wider">
                🔄 Takaslı
              </span>
            )}
          </div>

          <div>
            {property.reference_no && (
              <div className="text-[9.5px] font-black tracking-widest text-slate-500 mb-1 font-mono uppercase bg-slate-100 inline-block px-1.5 py-0.5 rounded-full border border-slate-200 shadow-sm leading-none">
                REF: {property.reference_no}
              </div>
            )}
            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {property.title}
            </h4>
            <p className="text-slate-400 text-[10px] font-bold flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 inline text-slate-400" />
                {property.location} {property.kktc_region ? `• Bölge: ${property.kktc_region}` : ""}
              </span>
              {property.responsible_agent && (
                <span className="text-indigo-600 font-extrabold text-[9px] uppercase">
                  👤 Danışman: {property.responsible_agent}
                </span>
              )}
            </p>
          </div>

          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
            {property.description ? 
              unescapeHtmlManual(property.description)
              : "Açıklama girilmemiş..."
            }
          </p>

          {/* Regional Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {property.listing_intent !== 'rent' && property.kktc_title_type && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                📜 {property.kktc_title_type}
              </span>
            )}
            {property.listing_intent === 'rent' && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-extrabold border border-amber-100">
                🛋️ {property.furnished ? 'Tam Eşyalı' : 'Eşyasız'}
              </span>
            )}
            {property.block_plot && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-extrabold border border-slate-250">
                📍 Ada/Parsel {property.block_plot}
              </span>
            )}
            {property.room_count && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                🚪 Oda: {property.room_count}
              </span>
            )}
            {property.square_meters && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                📐 {formatNumberVal(property.square_meters)} m² Net {property.sqm_gross ? `/ ${formatNumberVal(property.sqm_gross)} m² Brüt` : ''}
              </span>
            )}
            {property.in_gated_community && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                🏡 Site İçi {property.dues ? `• ${formatNumberVal(property.dues)} ${property.dues_currency || 'GBP'} Aidat` : ''}
              </span>
            )}
            {property.facade && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                🧭 {property.facade} Cephe
              </span>
            )}
          </div>

          {/* Safe Document Icon indicators */}
          <div 
            onClick={() => {
              if (property.documents && property.documents.length > 0) {
                onViewDocs(property);
              } else {
                toast.info("Bu gayrimenkule ait henüz yüklenmiş bir resmî evrak yok. Yeni bir Sözleşme oluşturup kaydederek buraya ekleyebilirsiniz.");
              }
            }}
            className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 cursor-pointer transition-all active:scale-[0.99]"
            title={property.documents && property.documents.length > 0 ? "Resmî evrakları ve sözleşmeleri hızlıca görüntülemek için tıklayın" : ""}
          >
            <div className="flex items-center gap-1.5">
              <FolderLock className="w-3.5 h-3.5 text-amber-500" />
              <span>Resmî Evraklar:</span>
              {property.documents && property.documents.length > 0 ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                  ✔ Yüklü ({property.documents.length} adet)
                </span>
              ) : (
                <span className="text-slate-400 font-medium">Yüklenmemiş</span>
              )}
            </div>
            {property.documents && property.documents.length > 0 && (
              <span className="text-indigo-600 font-black text-[9px] uppercase tracking-tight flex items-center gap-0.5">
                GÖRÜNTÜLE ➔
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col space-y-3">
          {/* Price and Standard Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-slate-900">
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">İLAN BEDELİ</span>
              <span className="text-base font-black text-indigo-600">
                {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺'}{formatNumberVal(property.price)}
              </span>
            </div>

            <div className="flex gap-1.5 items-center flex-wrap shrink-0 sm:justify-end">
              <a
                href={`/mulk-takip/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all shadow active:scale-95 border border-emerald-200 shrink-0"
                title="Mülk Sahibi Canlı Takip & İstatistik Ekranı"
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                onClick={() => onOpenContract(property)}
                className="flex items-center justify-center p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow active:scale-95 border border-slate-950 shrink-0"
                title="Sözleşme / Resmi Hizmet Oluştur"
              >
                <FileSignature className="w-4 h-4" />
              </button>
              {property.listing_intent !== "rent" && (
                <button
                  onClick={() => onOpenTapu(property)}
                  className="flex items-center justify-center p-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-all shadow active:scale-95 border border-amber-600 shrink-0"
                  title="Tapu Süreç & Randevu Takipçisi"
                >
                  <Award className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => onOpenSocialShare(property)}
                className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all shadow active:scale-95 border border-indigo-100 shrink-0"
                title="Sosyal Medya Afiş & Paylaşım Sihirbazı"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onPrint(property)}
                className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                title="Poster Yazdır"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onOpenTour(property)}
                className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                title="Temsilci Keşif / Gösterim Turu Planla"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button 
                onClick={onGoToPipeline}
                className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all shadow active:scale-95 border border-indigo-200 shrink-0"
                title="CRM Pipeline & Süreç Yönetimine Git"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onEdit(property)}
                className="flex items-center justify-center p-2.5 text-slate-750 hover:bg-slate-100 rounded-xl transition-all border border-transparent shrink-0"
                title="Düzenle"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Bu gayrimenkulü silmek istediğinize emin misiniz?')) {
                    onDelete(property.id);
                  }
                }}
                className="flex items-center justify-center p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent shrink-0"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

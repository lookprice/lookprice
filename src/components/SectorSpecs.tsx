import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SectorSpecsProps {
  sector: string;
  data: any;
  onStartTour?: () => void;
  category?: string;
  name?: string;
  description?: string;
}

export const SectorSpecs: React.FC<SectorSpecsProps> = ({
  sector,
  data,
  onStartTour,
  category,
  name = "",
  description = "",
}) => {
  if (!data || typeof data !== "object") return null;
  const { lang } = useLanguage();

  const getZoningStatus = (title: string, desc: string) => {
    const text = `${title} ${desc}`.toLowerCase();
    if (text.includes("sanayi imarlı") || text.includes("sanayi imar")) {
      return { tr: "Sanayi İmarlı", en: "Industrial Zoned" };
    }
    if (text.includes("ticari imarlı") || text.includes("ticari imar")) {
      return { tr: "Ticari İmarlı", en: "Commercial Zoned" };
    }
    if (text.includes("turizm imarlı") || text.includes("turizm imar") || text.includes("turistik imar")) {
      return { tr: "Turizm İmarlı", en: "Tourism Zoned" };
    }
    if (text.includes("imarsız") || text.includes("tarla") || text.includes("imar izni yok") || text.includes("imar yok")) {
      return { tr: "İmarsız (Tarla / Tarım Vasıflı)", en: "Unzoned (Agricultural Land)" };
    }
    if (text.includes("imarlı") || text.includes("imarli") || text.includes("konut imar")) {
      return { tr: "Konut İmarlı", en: "Residential Zoned" };
    }
    return { tr: "İmarlı (Arsa Vasıflı)", en: "Zoned (Building Land)" };
  };

  const renderAutomotive = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.hp && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "BEYGİR GÜCÜ" : "HORSEPOWER"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {data.hp} HP
          </p>
        </div>
      )}
      {data.engine && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "MOTOR" : "ENGINE"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {data.engine}
          </p>
        </div>
      )}
      {data.transmission && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "ŞANZIMAN" : "TRANSMISSION"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {data.transmission}
          </p>
        </div>
      )}
      {data.fuel && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "YAKIT" : "FUEL"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {data.fuel}
          </p>
        </div>
      )}
      {data.mileage !== undefined && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "KİLOMETRE" : "MILEAGE"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {Number(data.mileage).toLocaleString()} KM
          </p>
        </div>
      )}
      {data.acceleration && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "0-100 KM/S" : "0-100 KM/H"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {data.acceleration}s
          </p>
        </div>
      )}
    </div>
  );

  const renderFashion = () => (
    <div className="grid grid-cols-2 gap-3">
      {data.material && (
        <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 group hover:border-pink-300 transition-all">
          <p className="text-[8px] font-semibold text-pink-400 tracking-wide mb-1">
            {lang === "tr" ? "KUMAŞ / MATERYAL" : "MATERIAL"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-pink-600 transition-colors uppercase">
            {data.material}
          </p>
        </div>
      )}
      {data.fit && (
        <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 group hover:border-pink-300 transition-all">
          <p className="text-[8px] font-semibold text-pink-400 tracking-wide mb-1">
            {lang === "tr" ? "KESİM / KALIP" : "FIT"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-pink-600 transition-colors uppercase">
            {data.fit}
          </p>
        </div>
      )}
      {data.collection && (
        <div className="col-span-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 group hover:border-amber-500/30 transition-all">
          <p className="text-[8px] font-semibold text-slate-500 tracking-wide mb-1">
            {lang === "tr" ? "KOLEKSİYON" : "COLLECTION"}
          </p>
          <p className="text-sm font-semibold text-amber-500 group-hover:text-amber-400 transition-colors uppercase">
            {data.collection}
          </p>
        </div>
      )}
    </div>
  );

  const renderRealEstate = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {/* Imar Durumu/Zoning Status (Zorunlu Arsa Detayı) */}
      {(category === "land" || name.toLowerCase().includes("imar") || description.toLowerCase().includes("imar")) && (
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-150 group hover:border-indigo-300 transition-all col-span-2 shadow-sm">
          <p className="text-[8px] font-black text-indigo-600 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "İMAR / VASIF DURUMU" : "ZONING & LAND USE"}
          </p>
          <p className="text-sm font-black text-indigo-950 transition-colors uppercase">
            {(() => {
              const status = getZoningStatus(name, description);
              return lang === "tr" ? status.tr : status.en;
            })()}
          </p>
        </div>
      )}

      {data.subtype && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ALT TİP" : "SUBTYPE"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.subtype}
          </p>
        </div>
      )}

      {data.square_meters && (
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group hover:border-emerald-300 transition-all">
          <p className="text-[8px] font-black text-emerald-500 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "NET METREKARE" : "NET AREA"}
          </p>
          <p className="text-sm font-black text-emerald-900 transition-colors uppercase">
            {data.square_meters} m²
          </p>
        </div>
      )}
      {data.sqm_gross && data.listing_intent !== 'rent' && (
        <div className="p-4 bg-emerald-55/50 rounded-2xl border border-emerald-100 group hover:border-emerald-300 transition-all">
          <p className="text-[8px] font-black text-emerald-500 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "BRÜT METREKARE" : "GROSS AREA"}
          </p>
          <p className="text-sm font-black text-emerald-900 transition-colors uppercase">
            {data.sqm_gross} m²
          </p>
        </div>
      )}
      {(data.room_count || data.rooms) && category !== "land" && (
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group hover:border-emerald-300 transition-all">
          <p className="text-[8px] font-black text-emerald-500 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ODA SAYISI" : "ROOM COUNT"}
          </p>
          <p className="text-sm font-black text-emerald-950 transition-colors uppercase">
            {data.room_count || data.rooms}
          </p>
        </div>
      )}
      {(data.city || data.kktc_region || data.location) && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ŞEHİR / BÖLGE" : "CITY / REGION"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.kktc_region || data.location || data.city} {data.district ? `/ ${data.district}` : ''}
          </p>
        </div>
      )}
      {data.island && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ADA / PARSEL" : "ISLAND / PLOT"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.island} / {data.plot || '---'}
          </p>
        </div>
      )}
      {data.kktc_title_type && data.listing_intent !== "rent" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "KOÇAN TİPİ" : "TITLE TYPE"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.kktc_title_type}
          </p>
        </div>
      )}

      {data.listing_intent === "rent" && data.deposit !== undefined && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 group hover:border-amber-300 transition-all">
          <p className="text-[8px] font-black text-amber-600 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "DEPOZİTO TUTARI" : "DEPOSIT AMOUNT"}
          </p>
          <p className="text-sm font-black text-amber-950 transition-colors uppercase">
            {data.deposit > 0 ? (
              `${data.currency === 'GBP' ? '£' : data.currency === 'USD' ? '$' : data.currency === 'EUR' ? '€' : '₺'}${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(data.deposit)}`
            ) : (
              lang === "tr" ? "Depozito Yok" : "No Deposit"
            )}
          </p>
        </div>
      )}

      {data.listing_intent === "rent" && data.billing_period && (
        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 group hover:border-sky-300 transition-all">
          <p className="text-[8px] font-black text-sky-600 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ÖDEME PERİYODU" : "PAYMENT PERIOD"}
          </p>
          <p className="text-sm font-black text-sky-950 transition-colors uppercase">
            {data.billing_period === 'yearly' ? (lang === "tr" ? 'Yıllık' : 'Yearly') : (lang === "tr" ? 'Aylık' : 'Monthly')}
          </p>
        </div>
      )}

      {data.building_age && category !== "land" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "BİNA YAŞI" : "BUILDING AGE"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.building_age}
          </p>
        </div>
      )}
      {data.floor && category !== "land" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "BULUNDUĞU KAT" : "PROPERTY FLOOR"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.floor} {data.total_floors ? `/ ${data.total_floors}` : ''}
          </p>
        </div>
      )}
      {data.facade && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "CEPHE" : "FACADE"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.facade}
          </p>
        </div>
      )}
      {data.heating && category !== "land" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ISITMA SİSTEMİ" : "HEATING"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.heating}
          </p>
        </div>
      )}
      {data.furnished !== undefined && category !== "land" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "EŞYA DURUMU" : "FURNISHED STATUS"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.furnished ? (lang === "tr" ? "Eşyalı" : "Furnished") : (lang === "tr" ? "Boş / Eşyasız" : "Unfurnished")}
          </p>
        </div>
      )}
      {data.in_gated_community !== undefined && category !== "land" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "SİTE İÇİ" : "GATED COMMUNITY"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.in_gated_community ? (lang === "tr" ? "Evet / Site İçi" : "Yes / Gated") : (lang === "tr" ? "Hayır" : "No")}
          </p>
        </div>
      )}
      {data.dues && category !== "land" ? (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "AİDAT TUTARI" : "DUES FEE"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.dues} {data.dues_currency || 'GBP'}
          </p>
        </div>
      ) : null}
    </div>
  );

  const renderTech = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.cpu && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">
            {lang === "tr" ? "İŞLEMCİ" : "CPU"}
          </p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">
            {data.cpu}
          </p>
        </div>
      )}
      {data.ram && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">
            RAM
          </p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">
            {data.ram}
          </p>
        </div>
      )}
      {data.storage && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">
            {lang === "tr" ? "DEPOLAMA" : "STORAGE"}
          </p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">
            {data.storage}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
        {lang === "tr" ? "TEKNİK VERİ SAYFASI" : "TECHNICAL DATA SHEET"}
        <div className="flex-1 h-[1px] bg-slate-100" />
      </h4>
      {sector === "automotive" && renderAutomotive()}
      {sector === "fashion" && renderFashion()}
      {sector === "tech" && renderTech()}
      {sector === "real_estate" && renderRealEstate()}
      {sector === "general" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div
              key={key}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm font-semibold text-slate-900 uppercase">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

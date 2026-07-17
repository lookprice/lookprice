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

  const getFuelLabel = (fuel: string) => {
    const labels: any = {
      gasoline: { tr: 'Benzin', en: 'Gasoline' },
      diesel: { tr: 'Dizel', en: 'Diesel' },
      lpg: { tr: 'LPG', en: 'LPG' },
      hybrid: { tr: 'Hibrit', en: 'Hybrid' },
      gasoline_hybrid: { tr: 'Hibrit (Benzin)', en: 'Hybrid (Gasoline)' },
      diesel_hybrid: { tr: 'Hibrit (Dizel)', en: 'Hybrid (Diesel)' },
      electric: { tr: 'Elektrik', en: 'Electric' }
    };
    return labels[fuel]?.[lang] || fuel;
  };

  const getTransmissionLabel = (val: string) => {
    const labels: any = {
      manual: { tr: 'Manuel', en: 'Manual' },
      automatic: { tr: 'Otomatik', en: 'Automatic' },
      semi_automatic: { tr: 'Yarı Otomatik', en: 'Semi-Auto' },
      dual_clutch: { tr: 'Çift Kavrama', en: 'Dual Clutch' }
    };
    return labels[val]?.[lang] || val;
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
            {getTransmissionLabel(data.transmission)}
          </p>
        </div>
      )}
      {data.fuel && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "YAKIT" : "FUEL"}
          </p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
            {getFuelLabel(data.fuel)}
          </p>
        </div>
      )}
      {data.is_trade_in_available !== undefined && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">
            {lang === "tr" ? "TAKAS" : "TRADE-IN"}
          </p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${data.is_trade_in_available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">
              {data.is_trade_in_available ? (lang === "tr" ? "KABUL EDİLİYOR" : "ACCEPTED") : (lang === "tr" ? "YOK" : "NONE")}
            </p>
          </div>
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
      {data.paint_report && (
        <div className="col-span-full mt-4">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {lang === "tr" ? "EKSPERTİZ / KAPORTA DURUMU" : "EXPERTISE / BODY CONDITION"}
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {(() => {
              const report = typeof data.paint_report === 'string' ? JSON.parse(data.paint_report) : data.paint_report;
              const partsDefinition = [
                { id: 'hood', label: lang === 'tr' ? 'Kaput' : 'Hood' },
                { id: 'roof', label: lang === 'tr' ? 'Tavan' : 'Roof' },
                { id: 'trunk', label: lang === 'tr' ? 'Bagaj' : 'Trunk' },
                { id: 'fender_fl', label: lang === 'tr' ? 'Sol Ön Çam.' : 'Front-Left Fender' },
                { id: 'fender_fr', label: lang === 'tr' ? 'Sağ Ön Çam.' : 'Front-Right Fender' },
                { id: 'door_fl', label: lang === 'tr' ? 'Sol Ön Kapı' : 'Front-Left Door' },
                { id: 'door_fr', label: lang === 'tr' ? 'Sağ Ön Kapı' : 'Front-Right Door' },
                { id: 'door_rl', label: lang === 'tr' ? 'Sol Arka Kapı' : 'Rear-Left Door' },
                { id: 'door_rr', label: lang === 'tr' ? 'Sağ Arka Kapı' : 'Rear-Right Door' },
                { id: 'fender_rl', label: lang === 'tr' ? 'Sol Arka Çam.' : 'Rear-Left Fender' },
                { id: 'fender_rr', label: lang === 'tr' ? 'Sağ Arka Çam.' : 'Rear-Right Fender' }
              ];

              return partsDefinition.map(p => {
                const status = report[p.id] || 'original';
                const statusLabels: any = {
                  original: { tr: 'Orijinal', en: 'Original', color: 'bg-emerald-500' },
                  painted: { tr: 'Boyalı', en: 'Painted', color: 'bg-amber-500' },
                  replaced: { tr: 'Değişen', en: 'Replaced', color: 'bg-rose-500' }
                };
                const label = statusLabels[status] || statusLabels.original;

                return (
                  <div key={p.id} className="p-2.5 bg-white border border-slate-100 rounded-xl flex flex-col gap-1 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-500 truncate">{p.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${label.color}`} />
                      <span className="text-[10px] font-black uppercase text-slate-700">{lang === 'tr' ? label.tr : label.en}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
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

      {data.is_trade_in_available !== undefined && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "TAKAS DURUMU" : "TRADE-IN STATUS"}
          </p>
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
            <span className={`w-1.5 h-1.5 rounded-full ${data.is_trade_in_available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>{data.is_trade_in_available ? (lang === 'tr' ? 'Takasa Uygun' : 'Available') : (lang === 'tr' ? 'Takasa Kapalı' : 'None')}</span>
          </div>
        </div>
      )}

      {data.kktc_sub_region && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ALT BÖLGE" : "SUB-REGION"}
          </p>
          <p className="text-sm font-black text-indigo-950 transition-colors uppercase">
            {data.kktc_sub_region}
          </p>
        </div>
      )}

      {data.trafo_bedeli !== undefined && data.listing_intent !== "rent" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "TRAFO BEDELİ" : "TRANSFORMER FEE"}
          </p>
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
            <span className={`w-1.5 h-1.5 rounded-full ${data.trafo_bedeli ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{data.trafo_bedeli ? (lang === 'tr' ? 'Ödendi' : 'Paid') : (lang === 'tr' ? 'Ödenmedi / Ödenecek' : 'Not Paid')}</span>
          </div>
        </div>
      )}

      {data.kdv_status && data.listing_intent !== "rent" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "KDV DURUMU" : "VAT STATUS"}
          </p>
          <p className="text-sm font-black text-slate-900 transition-colors uppercase">
            {data.kdv_status === 'paid' ? (lang === 'tr' ? 'Ödendi' : 'Paid') : (lang === 'tr' ? 'Ödenecek' : 'To Be Paid')}
          </p>
        </div>
      )}

      {data.cati_terasi !== undefined && data.listing_intent !== "rent" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-black text-slate-400 tracking-widest mb-1 uppercase">
            {lang === "tr" ? "ÇATI TERASI" : "ROOF TERRACE"}
          </p>
          <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
            <span className={`w-1.5 h-1.5 rounded-full ${data.cati_terasi ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span>{data.cati_terasi ? (lang === 'tr' ? 'Var' : 'Available') : (lang === 'tr' ? 'Yok' : 'None')}</span>
          </div>
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
            {data.billing_period === 'yearly' ? (lang === "tr" ? 'Yıllık' : 'Yearly') :
             data.billing_period === '3-monthly' ? (lang === "tr" ? '3 Aylık' : '3-Monthly') :
             data.billing_period === '6-monthly' ? (lang === "tr" ? '6 Aylık' : '6-Monthly') :
             (lang === "tr" ? 'Aylık' : 'Monthly')}
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

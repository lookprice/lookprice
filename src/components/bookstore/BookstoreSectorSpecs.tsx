import React, { useState } from "react";
import { 
  BookOpen, 
  Award,
  Quote,
  Flame,
  Star
} from "lucide-react";

interface BookstoreSectorSpecsProps {
  editingProduct: any;
  isTr: boolean;
  branding?: any;
  selectedBookBadges?: string[];
  setSelectedBookBadges?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const BookstoreSectorSpecs: React.FC<BookstoreSectorSpecsProps> = ({
  editingProduct,
  isTr,
  selectedBookBadges,
  setSelectedBookBadges
}) => {
  const [sectorData, setSectorData] = useState<any>(() => {
    const raw = editingProduct?.sector_data;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch (e) { return {}; }
    }
    return raw || {};
  });

  React.useEffect(() => {
    if (selectedBookBadges) {
      const hasWeekly = selectedBookBadges.some((s: string) => s.toLowerCase() === "featured_week");
      if (sectorData.is_weekly_pick !== hasWeekly || sectorData.is_featured_weekly !== hasWeekly) {
        setSectorData((prev: any) => ({
          ...prev,
          is_weekly_pick: hasWeekly,
          is_featured_weekly: hasWeekly
        }));
      }
    }
  }, [selectedBookBadges]);

  const updateField = (key: string, val: any) => {
    setSectorData((prev: any) => ({ ...prev, [key]: val }));
  };

  const isWeeklyPick = Boolean(
    selectedBookBadges
      ? selectedBookBadges.some((s: string) => s.toLowerCase() === "featured_week")
      : (sectorData.is_weekly_pick || sectorData.is_featured_weekly || editingProduct?.is_weekly_pick || editingProduct?.is_featured_weekly)
  );

  return (
    <div className="p-2 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1.5">
      <input type="hidden" name="sector_data" value={JSON.stringify(sectorData)} />

      {/* BAŞLIK VE HAFTANIN ESERİ (MANŞET) TOGGLE BAR - TEK ENTEGRE SATIR */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isTr ? "Yayın & Edebi Künye" : "Publishing & Literary Specs"}</span>
        </span>

        {/* HAFTANIN ESERİ (MANŞET VİTRİNİ) - YÜKSEK KONTRASTLI, ANINDA FARK EDİLEN VİTRİN SEÇİCİ */}
        <label
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-black cursor-pointer transition-all select-none shadow-2xs ${
            isWeeklyPick
              ? "bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-500/20"
              : "bg-white text-slate-700 border-slate-300 hover:border-amber-400"
          }`}
          title={isTr ? "Ana sayfa manşet vitrininde ve hareketli afiş kolajında öne çıkarır" : "Highlight in weekly picks carousel"}
        >
          <Flame className={`w-3.5 h-3.5 ${isWeeklyPick ? "text-slate-950 fill-slate-950" : "text-amber-500"}`} />
          <span className="text-[10px] tracking-wide uppercase font-black">
            {isTr ? "Haftanın Eseri (Manşet Vitrini)" : "Weekly Featured Pick"}
          </span>
          <input
            type="checkbox"
            checked={isWeeklyPick}
            onChange={(e) => {
              const val = e.target.checked;
              if (setSelectedBookBadges) {
                setSelectedBookBadges(prev => {
                  const alreadyHas = prev.some(b => b.toLowerCase() === "featured_week");
                  if (val && !alreadyHas) {
                    return [...prev, "featured_week"];
                  } else if (!val && alreadyHas) {
                    return prev.filter(b => b.toLowerCase() !== "featured_week");
                  }
                  return prev;
                });
              }
              updateField("is_weekly_pick", val);
              updateField("is_featured_weekly", val);
            }}
            className="sr-only"
          />
          <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ml-0.5 ${
            isWeeklyPick ? "bg-slate-950 text-amber-400" : "bg-slate-200 text-slate-600"
          }`}>
            {isWeeklyPick ? (isTr ? "AÇIK" : "ON") : (isTr ? "KAPALI" : "OFF")}
          </span>
        </label>
      </div>

      {/* 1. SATIR: YAYINCILIK BİLGİLERİ (8 KOLONLU TEK MİKRO GRID) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
        <div className="space-y-0.5 sm:col-span-2 lg:col-span-2">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Çevirmen" : "Translator"}
          </label>
          <input
            type="text"
            placeholder={isTr ? "örn: Hasan Ali Ediz" : "Translator"}
            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5"
            value={sectorData.translator || ""}
            onChange={(e) => updateField("translator", e.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Orijinal Dil" : "Lang"}
          </label>
          <input
            type="text"
            placeholder="Türkçe"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5"
            value={sectorData.language || "Türkçe"}
            onChange={(e) => updateField("language", e.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Basım Yılı" : "Year"}
          </label>
          <input
            type="number"
            placeholder="2024"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5 text-center"
            value={sectorData.publication_year || ""}
            onChange={(e) => updateField("publication_year", e.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Baskı No" : "Edition"}
          </label>
          <input
            type="text"
            placeholder="1. Baskı"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5 text-center"
            value={sectorData.edition || ""}
            onChange={(e) => updateField("edition", e.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Sayfa" : "Pages"}
          </label>
          <input
            type="number"
            placeholder="384"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5 text-center"
            value={sectorData.page_count || ""}
            onChange={(e) => updateField("page_count", e.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Kapak / Cilt" : "Cover"}
          </label>
          <select
            className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5 cursor-pointer"
            value={sectorData.cover_type || "Karton Kapak"}
            onChange={(e) => updateField("cover_type", e.target.value)}
          >
            <option value="Karton Kapak">{isTr ? "Karton" : "Paperback"}</option>
            <option value="Sert Kapak">{isTr ? "Sert (Ciltli)" : "Hardcover"}</option>
            <option value="Deri Cilt">{isTr ? "Deri" : "Leather"}</option>
            <option value="Kutulu Set">{isTr ? "Kutulu" : "Boxed"}</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            {isTr ? "Ebat" : "Dimensions"}
          </label>
          <input
            type="text"
            placeholder="13.5x21"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5 text-center"
            value={sectorData.dimensions || "13.5 x 21 cm"}
            onChange={(e) => updateField("dimensions", e.target.value)}
          />
        </div>
      </div>

      {/* 2. SATIR: EDEBİ VURGULAR (OKUR PUANI + SPOT ALINTI + ÖDÜL) - TEK KOMPAKT SATIR */}
      <div className="flex flex-col sm:flex-row gap-1.5 items-center pt-0.5">
        <div className="w-full sm:w-20 shrink-0 space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            <span>{isTr ? "Puan" : "Rating"}</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="5"
            placeholder="4.8"
            className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 text-center h-6.5"
            value={sectorData.rating || "4.8"}
            onChange={(e) => updateField("rating", e.target.value)}
          />
        </div>

        <div className="w-full sm:flex-1 space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
            <Quote className="w-2.5 h-2.5 text-indigo-500" />
            <span>{isTr ? "Kitaptan Çarpıcı Alıntı (Spot)" : "Quote (Spot)"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "«İnsanın canı acır bazen, ama yaşam devam eder.»" : "Quote..."}
            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-medium italic text-slate-900 outline-none focus:border-indigo-600 h-6.5"
            value={sectorData.featured_quote || ""}
            onChange={(e) => updateField("featured_quote", e.target.value)}
          />
        </div>

        <div className="w-full sm:flex-1 space-y-0.5">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-0.5">
            <Award className="w-2.5 h-2.5 text-amber-500" />
            <span>{isTr ? "Ödüller / Başarılar" : "Awards"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "Nobel Edebiyat Ödülü 1982 / Yılın Kitabı" : "Awards..."}
            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 h-6.5"
            value={sectorData.awards || ""}
            onChange={(e) => updateField("awards", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

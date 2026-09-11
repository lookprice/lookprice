import React, { useState } from "react";
import { 
  BookOpen, 
  FileText, 
  Languages, 
  Bookmark, 
  Sparkles,
  Info
} from "lucide-react";

interface BookstoreSectorSpecsProps {
  editingProduct: any;
  isTr: boolean;
  branding?: any;
}

export const BookstoreSectorSpecs: React.FC<BookstoreSectorSpecsProps> = ({
  editingProduct,
  isTr,
  branding
}) => {
  const [sectorData, setSectorData] = useState<any>(() => {
    const raw = editingProduct?.sector_data;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch (e) { return {}; }
    }
    return raw || {};
  });

  const updateField = (key: string, val: any) => {
    setSectorData((prev: any) => ({ ...prev, [key]: val }));
  };

  // Sync back hidden input string for form submission
  return (
    <div className="p-5 bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-purple-950/20 rounded-3xl border-2 border-indigo-200/80 shadow-sm space-y-5">
      {/* Hidden input to pass sector_data safely to FormData / POST / PUT */}
      <input type="hidden" name="sector_data" value={JSON.stringify(sectorData)} />

      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
              <span>{isTr ? "Kitap ve Eser Özel Nitelikleri" : "Book & Literature Attributes"}</span>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-black rounded-full uppercase tracking-widest">
                KİTAP MİMARİSİ
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 font-medium">
              {isTr 
                ? "Netflix formatındaki vitrinde, arka kapak animasyonunda ve detay modallarında sergilenecek yayıncılık bilgileri." 
                : "Publishing details shown in Netflix rows, flip animation, and detail modals."}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isTr ? "Gelişmiş Kitap Formu" : "Advanced Book Form"}</span>
        </div>
      </div>

      {/* Unified Fields Notification Banner */}
      <div className="flex items-center gap-2 p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          {isTr 
            ? "Yazar (Eser Sahibi) ve Yayınevi bilgileri yukarıdaki «Kategoriler & Marka» bölümünde, Barkod / ISBN ise «Temel Kimlik & Barkod» alanında tekilleştirilmiştir."
            : "Author, Publisher, and Barcode/ISBN are unified in the primary product identity and category fields above."}
        </span>
      </div>

      {/* HAFTANIN ESERİ (WEEKLY PICK) VİTRİN TİK ALANI */}
      <div className="p-3.5 bg-gradient-to-r from-red-950/30 via-slate-900/40 to-amber-950/30 border border-red-500/30 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shadow-red-600/30 shrink-0">
            🔥
          </div>
          <div>
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{isTr ? "Haftanın Eseri (Manşet & Banner'da Göster)" : "Featured Weekly Pick"}</span>
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-extrabold rounded-md border border-red-500/30">
                MANŞET VİTRİNİ
              </span>
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isTr 
                ? "İşaretlendiğinde, ana sayfa üstündeki dinamik «Haftanın Eserleri» hareketli afiş kolajında öne çıkarılır." 
                : "When checked, this book appears in the dynamic 'Weekly Picks' animated hero carousel on the homepage."}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={!!(sectorData.is_weekly_pick || sectorData.is_featured_weekly)}
            onChange={(e) => {
              updateField("is_weekly_pick", e.target.checked);
              updateField("is_featured_weekly", e.target.checked);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      </div>

      {/* Row 1: Çevirmen, Orijinal Dil, Basım Yılı, Baskı Sayısı */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Çevirmen / Derleyen */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Languages className="w-3 h-3 text-indigo-600" />
            <span>{isTr ? "Çevirmen / Derleyen" : "Translator"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "örn: Hasan Ali Ediz" : "Translator name"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.translator || ""}
            onChange={(e) => updateField("translator", e.target.value)}
          />
        </div>

        {/* Orijinal Dil */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Orijinal Dili" : "Original Lang"}
          </label>
          <input
            type="text"
            placeholder="Türkçe / Rusça / İngilizce"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.language || "Türkçe"}
            onChange={(e) => updateField("language", e.target.value)}
          />
        </div>

        {/* Basım Yılı */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Basım Yılı" : "Pub. Year"}
          </label>
          <input
            type="number"
            placeholder="2024"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.publication_year || ""}
            onChange={(e) => updateField("publication_year", e.target.value)}
          />
        </div>

        {/* Baskı / Basım Sayısı */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Baskı Sayısı" : "Edition"}
          </label>
          <input
            type="text"
            placeholder="12. Baskı"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.edition || ""}
            onChange={(e) => updateField("edition", e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Sayfa Sayısı, Cilt Tipi, Ebat / Boyut, Kağıt Cinsi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sayfa Sayısı */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Sayfa Sayısı" : "Page Count"}
          </label>
          <input
            type="number"
            placeholder="384"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.page_count || ""}
            onChange={(e) => updateField("page_count", e.target.value)}
          />
        </div>

        {/* Cilt / Kapak Tipi */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Kapak / Cilt Tipi" : "Cover Type"}
          </label>
          <select
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs appearance-none"
            value={sectorData.cover_type || "Karton Kapak"}
            onChange={(e) => updateField("cover_type", e.target.value)}
          >
            <option value="Karton Kapak">{isTr ? "Karton Kapak (Ciltsiz)" : "Paperback"}</option>
            <option value="Sert Kapak">{isTr ? "Ciltli (Sert Kapak)" : "Hardcover"}</option>
            <option value="Deri Cilt">{isTr ? "Özel Deri Cilt" : "Leather Bound"}</option>
            <option value="Kutulu Özel Set">{isTr ? "Kutulu Özel Set" : "Boxed Set"}</option>
            <option value="E-Kitap">{isTr ? "Dijital E-Kitap" : "E-Book"}</option>
          </select>
        </div>

        {/* Ebat */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Ebat / Boyut" : "Dimensions"}
          </label>
          <input
            type="text"
            placeholder="13.5 x 21 cm"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.dimensions || "13.5 x 21 cm"}
            onChange={(e) => updateField("dimensions", e.target.value)}
          />
        </div>

        {/* Kağıt Cinsi */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            {isTr ? "Kağıt Cinsi" : "Paper Type"}
          </label>
          <input
            type="text"
            placeholder="2. Hamur / Enso Kitap Kağıdı"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.paper_type || "2. Hamur"}
            onChange={(e) => updateField("paper_type", e.target.value)}
          />
        </div>
      </div>

      {/* Row 3: Okur Puanı, Alıntı, Ödüller */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Müşteri Puanı / Rating */}
        <div className="space-y-1 sm:max-w-[140px]">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <span>⭐ {isTr ? "Okur Puanı" : "Rating"}</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="5"
            placeholder="4.9"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.rating || "4.8"}
            onChange={(e) => updateField("rating", e.target.value)}
          />
        </div>

        {/* Alıntı */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-purple-600" />
            <span>{isTr ? "Kitaptan Çarpıcı Alıntı" : "Featured Quote"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "«İnsanın canı acır bazen, ama yaşam devam eder.»" : "Quote from book"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-medium italic text-slate-900 text-xs shadow-2xs"
            value={sectorData.featured_quote || ""}
            onChange={(e) => updateField("featured_quote", e.target.value)}
          />
        </div>

        {/* Ödüller */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{isTr ? "Ödüller / Başarılar" : "Awards & Honors"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "Nobel Edebiyat Ödülü / Yılın Kitabı" : "Awards"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.awards || ""}
            onChange={(e) => updateField("awards", e.target.value)}
          />
        </div>
      </div>

      {/* Row 4: Arka Kapak Yazısı / Kitap Özeti (Arka Kapak Animasyonu için Temel Metin) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isTr ? "Kitap Arka Kapak Metni & Detaylı Özeti" : "Book Synopsis & Back Cover Text"}</span>
          </label>
          <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
            {isTr ? "✨ Kart Dönüşü ve Detay Ekranında Gösterilir" : "Rendered on Flip Card & Modal"}
          </span>
        </div>
        <textarea
          rows={3}
          placeholder={isTr ? "Kitabın arka kapağındaki etkileyici tanıtım yazısını, roman konusunu veya editör notunu girin..." : "Enter back cover text..."}
          className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900 text-xs shadow-2xs leading-relaxed"
          value={sectorData.synopsis || ""}
          onChange={(e) => updateField("synopsis", e.target.value)}
        />
      </div>

      {/* Row 5: Kitap Alıntısı veya Editörün Notu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-purple-600" />
            <span>{isTr ? "Kitaptan Çarpıcı Alıntı (Spot)" : "Featured Quote"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "«İnsanın canı acır bazen, ama yaşam devam eder.»" : "Quote from book"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-medium italic text-slate-900 text-xs shadow-2xs"
            value={sectorData.featured_quote || ""}
            onChange={(e) => updateField("featured_quote", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{isTr ? "Ödüller / Başarılar" : "Awards & Honors"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "Nobel Edebiyat Ödülü 1982 / Yılın Kitabı" : "Awards"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.awards || ""}
            onChange={(e) => updateField("awards", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  User, 
  Building2, 
  Barcode, 
  FileText, 
  Languages, 
  Calendar, 
  MapPin, 
  Bookmark, 
  Sparkles,
  Info,
  DollarSign
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

      {/* Row 1: ISBN, Yazar, Yayınevi, Çevirmen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* ISBN / Barkod */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Barcode className="w-3 h-3 text-indigo-600" />
            <span>ISBN / Standart Kod</span>
          </label>
          <input
            type="text"
            placeholder="örn: 978-605-241-607-5"
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.isbn || ""}
            onChange={(e) => updateField("isbn", e.target.value)}
          />
        </div>

        {/* Yazar */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-indigo-600" />
            <span>{isTr ? "Eser Sahibi / Yazar" : "Author"}</span>
          </label>
          <input
            type="text"
            name="author"
            placeholder={isTr ? "örn: Fyodor Dostoyevski" : "Author name"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            defaultValue={editingProduct?.author || sectorData.author || ""}
            onChange={(e) => updateField("author", e.target.value)}
          />
        </div>

        {/* Yayınevi / Marka */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3 text-indigo-600" />
            <span>{isTr ? "Yayınevi / Yayıncı" : "Publisher"}</span>
          </label>
          <input
            type="text"
            name="brand"
            placeholder={isTr ? "örn: Can Yayınları, İş Bankası" : "Publisher"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            defaultValue={editingProduct?.brand || sectorData.publisher || ""}
            onChange={(e) => updateField("publisher", e.target.value)}
          />
        </div>

        {/* Çevirmen / Derleyen */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Languages className="w-3 h-3 text-indigo-600" />
            <span>{isTr ? "Çevirmen (Opsiyonel)" : "Translator"}</span>
          </label>
          <input
            type="text"
            placeholder={isTr ? "örn: Hasan Ali Ediz" : "Translator name"}
            className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
            value={sectorData.translator || ""}
            onChange={(e) => updateField("translator", e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Sayfa Sayısı, Baskı Sayısı, Basım Yılı, Cilt Tipi */}
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
      </div>

      {/* Row 3: Orijinal Dil, Kitap Boyutu (Ebat), Kağıt Cinsi, Puan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* Müşteri Puanı / Rating */}
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <span>⭐ {isTr ? "Okur Puanı (1-5)" : "Rating"}</span>
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

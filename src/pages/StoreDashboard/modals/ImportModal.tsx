import React from "react";
import { motion } from "motion/react";
import { X, Upload, FileUp, Image as ImageIcon, Download, Sparkles, Layers } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportModalProps {
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  isImporting: boolean;
  importFile: File | null;
  importColumns: string[];
  mapping: any;
  setMapping: (m: any) => void;
  convertCurrency: boolean;
  setConvertCurrency: (c: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImport: (e: React.FormEvent) => void;
  t: any;
  lang: string;
}

export const ImportModal = ({
  showImportModal,
  setShowImportModal,
  isImporting,
  importFile,
  importColumns,
  mapping,
  setMapping,
  convertCurrency,
  setConvertCurrency,
  handleFileSelect,
  handleImport,
  t,
  lang
}: ImportModalProps) => {
  if (!showImportModal) return null;

  const isTr = lang === "tr";

  const fieldLabels: Record<string, { label: string; required?: boolean; isImage?: boolean }> = {
    barcode: { label: isTr ? "Barkod / Ürün Kodu *" : "Barcode / SKU *", required: true },
    name: { label: isTr ? "Ürün Adı *" : "Product Name *", required: true },
    price: { label: isTr ? "Satış Fiyatı *" : "Sale Price *", required: true },
    stock_quantity: { label: isTr ? "Stok Miktarı" : "Stock Quantity" },
    category: { label: isTr ? "Ana Kategori" : "Category" },
    sub_category: { label: isTr ? "Alt Kategori" : "Sub Category" },
    brand: { label: isTr ? "Marka / Yayınevi" : "Brand / Publisher" },
    author: { label: isTr ? "Yazar / Model" : "Author / Model" },
    unit: { label: isTr ? "Birim (Adet, Kg vb.)" : "Unit" },
    description: { label: isTr ? "Ürün Açıklaması" : "Description" },
    image_url: { label: isTr ? "1. Ana Ürün Resmi (Link)" : "1. Main Image URL", isImage: true },
    image_url_2: { label: isTr ? "2. Ekstra Resim Linki" : "2. Extra Image URL", isImage: true },
    image_url_3: { label: isTr ? "3. Ekstra Resim Linki" : "3. Extra Image URL", isImage: true },
    image_url_4: { label: isTr ? "4. Ekstra Resim Linki" : "4. Extra Image URL", isImage: true },
    image_url_5: { label: isTr ? "5. Ekstra Resim Linki" : "5. Extra Image URL", isImage: true },
    variant_name: { label: isTr ? "Varyant Adı / Seçeneği (örn: Siyah / M, 256GB)" : "Variant Name / Option" },
    variant_barcode: { label: isTr ? "Varyant Barkodu / Özel SKU" : "Variant Barcode / SKU" },
    variant_price: { label: isTr ? "Varyant Satış Fiyatı" : "Variant Sale Price" },
    variant_stock: { label: isTr ? "Varyant Stok Miktarı" : "Variant Stock Quantity" },
    variant_color: { label: isTr ? "Varyant Rengi" : "Variant Color" },
    variant_size: { label: isTr ? "Varyant Bedeni / Numarası" : "Variant Size / Number" },
    variant_image: { label: isTr ? "Varyant Özel Resim Linki" : "Variant Image URL" }
  };

  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      {
        "Barkod": "8690000000001",
        "Ürün Adı": "Örnek Kablosuz Kulaklık Pro",
        "Kategori": "Elektronik",
        "Alt Kategori": "Ses Sistemleri",
        "Marka": "LookTech",
        "Satış Fiyatı": 1499.90,
        "Stok Miktarı": 25,
        "Birim": "Adet",
        "Varyant Adı / Seçeneği": "",
        "Varyant Barkodu": "",
        "Varyant Satış Fiyatı": "",
        "Varyant Stok Miktarı": "",
        "Varyant Rengi": "",
        "Varyant Bedeni": "",
        "Açıklama": "Yüksek ses kalitesi ve aktif gürültü engelleme özellikli bluetooth kulaklık.",
        "Ana Resim Linki": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        "Ek Resim 2": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
        "Ek Resim 3": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
        "Ek Resim 4": "",
        "Ek Resim 5": ""
      },
      {
        "Barkod": "8690000000002",
        "Ürün Adı": "Örnek Pamuklu Polo Tişört",
        "Kategori": "Giyim",
        "Alt Kategori": "Tişört",
        "Marka": "LookStyle",
        "Satış Fiyatı": 599.90,
        "Stok Miktarı": 30,
        "Birim": "Adet",
        "Varyant Adı / Seçeneği": "Siyah / S",
        "Varyant Barkodu": "8690000000021",
        "Varyant Satış Fiyatı": 599.90,
        "Varyant Stok Miktarı": 10,
        "Varyant Rengi": "Siyah",
        "Varyant Bedeni": "S",
        "Açıklama": "%100 organik pamuk kumaş, slim fit polo tişört.",
        "Ana Resim Linki": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "Ek Resim 2": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
        "Ek Resim 3": "",
        "Ek Resim 4": "",
        "Ek Resim 5": ""
      },
      {
        "Barkod": "8690000000002",
        "Ürün Adı": "Örnek Pamuklu Polo Tişört",
        "Kategori": "Giyim",
        "Alt Kategori": "Tişört",
        "Marka": "LookStyle",
        "Satış Fiyatı": 599.90,
        "Stok Miktarı": 30,
        "Birim": "Adet",
        "Varyant Adı / Seçeneği": "Siyah / M",
        "Varyant Barkodu": "8690000000022",
        "Varyant Satış Fiyatı": 599.90,
        "Varyant Stok Miktarı": 12,
        "Varyant Rengi": "Siyah",
        "Varyant Bedeni": "M",
        "Açıklama": "%100 organik pamuk kumaş, slim fit polo tişört.",
        "Ana Resim Linki": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "Ek Resim 2": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
        "Ek Resim 3": "",
        "Ek Resim 4": "",
        "Ek Resim 5": ""
      },
      {
        "Barkod": "8690000000002",
        "Ürün Adı": "Örnek Pamuklu Polo Tişört",
        "Kategori": "Giyim",
        "Alt Kategori": "Tişört",
        "Marka": "LookStyle",
        "Satış Fiyatı": 599.90,
        "Stok Miktarı": 30,
        "Birim": "Adet",
        "Varyant Adı / Seçeneği": "Beyaz / L",
        "Varyant Barkodu": "8690000000023",
        "Varyant Satış Fiyatı": 599.90,
        "Varyant Stok Miktarı": 8,
        "Varyant Rengi": "Beyaz",
        "Varyant Bedeni": "L",
        "Açıklama": "%100 organik pamuk kumaş, slim fit polo tişört.",
        "Ana Resim Linki": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "Ek Resim 2": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
        "Ek Resim 3": "",
        "Ek Resim 4": "",
        "Ek Resim 5": ""
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Urun_Sablonu" : "Products_Template");
    XLSX.writeFile(wb, isTr ? "Ornek_Toplu_Urun_Sablonu.xlsx" : "Sample_Product_Import_Template.xlsx");
  };

  const standardKeys = ["barcode", "name", "price", "stock_quantity", "category", "sub_category", "brand", "author", "unit", "description"];
  const imageKeys = ["image_url", "image_url_2", "image_url_3", "image_url_4", "image_url_5"];
  const variantKeys = ["variant_name", "variant_barcode", "variant_price", "variant_stock", "variant_color", "variant_size", "variant_image"];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
      >
        <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              {t.importProducts || (isTr ? "Excel İle Toplu Ürün & Çoklu Görsel / Varyant Aktar" : "Bulk Product & Multi-Image / Variant Import")}
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isTr ? "Ana görsel, 4 adet ekstra resim ve beden/renk varyant sütunlarını eşleştirebilirsiniz." : "Map main image, up to 4 extra image links, and variant/option columns."}
            </p>
          </div>
          <button type="button" onClick={() => setShowImportModal(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleImport} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between gap-2 bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5">
            <div className="flex items-center gap-2 text-xs text-indigo-950 font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                {isTr 
                  ? "Varyant ve çoklu resim destekli örnek Excel şablonunu indirip doldurabilirsiniz." 
                  : "Download the sample Excel template with variants and multiple image columns."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="px-3 py-1.5 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-[11px] font-black flex items-center gap-1.5 shrink-0 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTr ? "Örnek Şablon İndir" : "Sample Excel"}</span>
            </button>
          </div>

          {!importFile ? (
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/40 transition-all">
              <Upload className="h-8 w-8 text-indigo-500 mb-1.5" />
              <span className="text-xs sm:text-sm font-black text-slate-700">{t.selectFile || (isTr ? "Excel Dosyası Seçin (.xlsx, .xls)" : "Select Excel File (.xlsx, .xls)")}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{isTr ? "Sütunlar otomatik olarak algılanır" : "Columns are automatically detected"}</span>
              <input type="file" onChange={handleFileSelect} className="hidden" accept=".xlsx,.xls,.csv" />
            </label>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileUp className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-emerald-950 truncate">{importFile.name}</span>
              </div>
              <label className="text-xs font-black text-indigo-600 hover:underline cursor-pointer shrink-0 ml-2">
                {t.change || (isTr ? "Dosya Değiştir" : "Change File")}
                <input type="file" onChange={handleFileSelect} className="hidden" accept=".xlsx,.xls,.csv" />
              </label>
            </div>
          )}

          {importColumns.length > 0 && (
            <div className="space-y-4">
              {/* 1. Standart Ürün Sütunları */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  {t.columnMapping || (isTr ? "1. Temel Ürün Bilgisi Sütun Eşleştirme" : "1. Product Information Columns")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {standardKeys.map((key) => {
                    const meta = fieldLabels[key] || { label: key };
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className={`text-[11px] font-bold ${meta.required ? "text-slate-900" : "text-slate-600"}`}>
                          {meta.label}
                        </span>
                        <select 
                          value={mapping[key] || ""}
                          onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                          className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                        >
                          <option value="">{t.selectColumn || (isTr ? "-- Sütun Seç --" : "-- Select Column --")}</option>
                          {importColumns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Çoklu Ürün Resim Linki Sütunları */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-200/70 pb-1.5">
                  <p className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isTr ? "2. Ürün Görselleri & Ekstra Resim Link Sütunları" : "2. Product Images & Extra Image Link Columns"}</span>
                  </p>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {isTr ? "Çoklu Galeri Desteği" : "Multi-Gallery"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isTr 
                    ? "Excel dosyanızdaki ana görsel ve ekstra resim linki sütunlarını seçin. Ayrıca tek bir hücre içinde virgül (,) veya noktalı virgül (;) ile ayrılmış birden fazla resim linki varsa otomatik olarak ayrıştırılır." 
                    : "Select main image and extra image URL columns. Multiple URLs separated by comma or semicolon within a single cell are also supported."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {imageKeys.map((key) => {
                    const meta = fieldLabels[key] || { label: key };
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-indigo-950">
                          {meta.label}
                        </span>
                        <select 
                          value={mapping[key] || ""}
                          onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                          className="p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-600 outline-none"
                        >
                          <option value="">{t.selectColumn || (isTr ? "-- Sütun Seç (İsteğe Bağlı) --" : "-- Optional Column --")}</option>
                          {importColumns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Varyant Sütun Eşleştirmesi */}
              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-200/70 pb-1.5">
                  <p className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isTr ? "3. Varyant & Seçenek Sütun Eşleştirmesi (Beden, Renk, Seçenekler)" : "3. Variant & Options Column Mapping"}</span>
                  </p>
                  <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                    {isTr ? "Varyant Matrisi" : "Variants"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isTr 
                    ? "Excel dosyanızda varyantlı ürünler (farklı renk, beden veya seçenekler) varsa ilgili sütunları seçin. Aynı ürünün farklı varyantları aynı ana barkod veya ürün adı altında otomatik olarak birleştirilip tek bir ana ürün altına varyant matrisi olarak eklenir." 
                    : "If your Excel file contains variant products, map the variant columns below. Variants sharing the same parent barcode or name will automatically be grouped into a single product."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {variantKeys.map((key) => {
                    const meta = fieldLabels[key] || { label: key };
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-amber-950">
                          {meta.label}
                        </span>
                        <select 
                          value={mapping[key] || ""}
                          onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                          className="p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:border-amber-600 outline-none"
                        >
                          <option value="">{t.selectColumn || (isTr ? "-- Sütun Seç (İsteğe Bağlı) --" : "-- Optional Column --")}</option>
                          {importColumns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input 
                  type="checkbox" 
                  id="import_convert_currency"
                  checked={convertCurrency} 
                  onChange={(e) => setConvertCurrency(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="import_convert_currency" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {t.convertCurrency || (isTr ? "Dövizli Fiyatları Mağaza Ana Para Birimine Otomatik Çevir" : "Convert Currency Automatically")}
                </label>
              </div>
            </div>
          )}

          <div className="pt-2 sticky bottom-0 bg-white">
            <button 
              type="submit" 
              disabled={isImporting || !importFile}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (t.importing || (isTr ? "Ürünler ve Görseller Aktarılıyor..." : "Importing...")) : (t.startImport || (isTr ? "İçe Aktarmayı Başlat" : "Start Import"))}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


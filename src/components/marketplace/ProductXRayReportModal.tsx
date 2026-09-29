import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  Download, 
  Activity, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Store, 
  Globe, 
  ShoppingBag, 
  Barcode, 
  DollarSign, 
  Package
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ProductXRayReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  lang: string;
  storeName?: string;
}

export const ProductXRayReportModal: React.FC<ProductXRayReportModalProps> = ({
  isOpen,
  onClose,
  products = [],
  lang,
  storeName = "Mağaza"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const isTr = lang === 'tr';

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesBarcode = (p.barcode || '').toString().toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBarcode && !matchesSku) return false;
      }

      if (channelFilter === 'hepsiburada') {
        if (!p.is_hepsiburada_active) return false;
      } else if (channelFilter === 'amazon') {
        const cleanAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') ? String(p.amazon_asin).trim() : null;
        if (!p.is_amazon_active || !cleanAsin) return false;
      } else if (channelFilter === 'trendyol') {
        if (!p.is_trendyol_active) return false;
      } else if (channelFilter === 'n11') {
        if (!p.is_n11_active) return false;
      } else if (channelFilter === 'pazarama') {
        if (!p.is_pazarama_active) return false;
      } else if (channelFilter === 'web') {
        if (!p.is_web_sale) return false;
      }

      return true;
    });
  }, [products, searchTerm, channelFilter]);

  const metrics = useMemo(() => {
    let totalProducts = products.length;
    let webActive = 0;
    let hbActive = 0;
    let amzActive = 0;
    let tyActive = 0;
    let n11Active = 0;
    let totalStockQty = 0;

    products.forEach(p => {
      if (p.is_web_sale) webActive++;
      if (p.is_hepsiburada_active) hbActive++;
      const cleanAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') ? String(p.amazon_asin).trim() : null;
      if (p.is_amazon_active && cleanAsin) amzActive++;
      if (p.is_trendyol_active) tyActive++;
      if (p.is_n11_active) n11Active++;

      const qty = parseFloat(p.stock_quantity || 0);
      totalStockQty += qty;
    });

    return { totalProducts, webActive, hbActive, amzActive, tyActive, n11Active, totalStockQty };
  }, [products]);

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredProducts.map((p, idx) => {
        let mpData: any = p.marketplace_data;
        if (typeof mpData === 'string') {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};

        const hbPrice = mpData?.hepsiburada?.price || p.price;
        const amzPrice = mpData?.amazon?.price || p.price;
        const tyPrice = mpData?.trendyol?.price || p.price;

        return {
          "Sıra": idx + 1,
          "Ürün Adı": p.name || "",
          "Barkod": p.barcode || "",
          "SKU / Kod": p.sku || p.product_code || "",
          "Reel Stok Miktarı": parseFloat(p.stock_quantity || 0),
          "Birim": p.unit || "Adet",
          "Alış Maliyeti (Ort.)": parseFloat(p.cost_price || 0),
          "Web Satış Bedeli": parseFloat(p.price || 0),
          "Hepsiburada Durum": p.is_hepsiburada_active ? "Aktif (Satışta)" : "Pasif",
          "Hepsiburada SKU": p.hepsiburada_sku || "",
          "Hepsiburada Fiyat (₺)": parseFloat(hbPrice || p.price || 0),
          "Hepsiburada Stok": p.is_hepsiburada_active ? parseFloat(p.stock_quantity || 0) : 0,
          "Amazon Durum": (p.is_amazon_active && p.amazon_asin) ? "Aktif (Satışta)" : "Pasif",
          "Amazon ASIN": p.amazon_asin || "",
          "Amazon Fiyat (₺)": parseFloat(amzPrice || p.price || 0),
          "Amazon Stok": (p.is_amazon_active && p.amazon_asin) ? parseFloat(p.stock_quantity || 0) : 0,
          "Trendyol Durum": p.is_trendyol_active ? "Aktif (Satışta)" : "Pasif",
          "Trendyol Fiyat (₺)": parseFloat(tyPrice || p.price || 0),
          "Trendyol Stok": p.is_trendyol_active ? parseFloat(p.stock_quantity || 0) : 0,
          "N11 Durum": p.is_n11_active ? "Aktif (Satışta)" : "Pasif",
          "N11 Stok": p.is_n11_active ? parseFloat(p.stock_quantity || 0) : 0,
          "Pazarama Durum": p.is_pazarama_active ? "Aktif (Satışta)" : "Pasif",
          "Kategori": p.category || ""
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ürün Röntgeni Raporu");
      XLSX.writeFile(wb, `Urun_Rontgeni_Raporu_${storeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(isTr ? "Ürün Röntgeni ve Kanal Fiyat/Stok raporu Excel olarak indirildi!" : "Product X-Ray channel report downloaded successfully!");
    } catch (e: any) {
      toast.error(isTr ? "Excel dışa aktarma hatası: " + e.message : "Export error: " + e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {isTr ? "Çok Kanallı Ürün Röntgeni & Kanal Senaryo Raporu" : "Multi-Channel Product X-Ray Report"}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {isTr ? `${storeName} mağazasının tüm kanallardaki (Web, HB, Amazon, Trendyol, N11, Pazarama) reel stok ve kanal satış fiyatı röntgeni.` : `Complete stock and channel sales pricing audit across all sales channels.`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{isTr ? "Excel İndir (.xlsx)" : "Export Excel"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4 sm:p-5 bg-indigo-50/40 dark:bg-slate-950/40 border-b border-indigo-100 dark:border-slate-800 shrink-0">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{isTr ? "Toplam Ürün" : "Total Products"}</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{metrics.totalProducts}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{isTr ? "Web'de Aktif" : "Web Active"}</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{metrics.webActive}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Hepsiburada</span>
            <span className="text-lg font-black text-orange-600 dark:text-orange-400 mt-0.5 block">{metrics.hbActive}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Amazon TR</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{metrics.amzActive}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Trendyol</span>
            <span className="text-lg font-black text-orange-500 dark:text-orange-300 mt-0.5 block">{metrics.tyActive}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">N11</span>
            <span className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5 block">{metrics.n11Active}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">{isTr ? "Listelenen Kayıt" : "Filtered Count"}</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{filteredProducts.length}</span>
          </div>
        </div>

        {/* TOOLBAR & SEARCH */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isTr ? "Ürün adı, barkod veya SKU ile ara..." : "Search product name, barcode or SKU..."}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-bold border border-transparent focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'web', 'hepsiburada', 'amazon', 'trendyol', 'n11', 'pazarama'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  channelFilter === ch 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ch === 'all' ? (isTr ? "Tüm Kanallar" : "All Channels") : ch}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold">{isTr ? "Kriterlere uygun ürün bulunamadı." : "No products found matching criteria."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                    <th className="p-3">#</th>
                    <th className="p-3">{isTr ? "Ürün Adı & Barkod" : "Product Name & Barcode"}</th>
                    <th className="p-3 text-center">{isTr ? "Reel Stok" : "Stock Qty"}</th>
                    <th className="p-3 text-right">{isTr ? "Maliyet" : "Cost"}</th>
                    <th className="p-3 text-right">{isTr ? "Web Fiyatı" : "Web Price"}</th>
                    <th className="p-3 text-center">Hepsiburada (Fiyat / Stok)</th>
                    <th className="p-3 text-center">Amazon TR (Fiyat / Stok)</th>
                    <th className="p-3 text-center">Trendyol (Fiyat / Stok)</th>
                    <th className="p-3 text-center">N11 (Fiyat / Stok)</th>
                    <th className="p-3 text-center">Pazarama (Fiyat / Stok)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredProducts.map((p, idx) => {
                    let mpData: any = p.marketplace_data;
                    if (typeof mpData === 'string') {
                      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
                    }
                    mpData = mpData || {};

                    const cleanAmzAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') ? String(p.amazon_asin).trim() : null;
                    const isAmzLive = Boolean(p.is_amazon_active && cleanAmzAsin);
                    const isHbLive = Boolean(p.is_hepsiburada_active);
                    const isTyLive = Boolean(p.is_trendyol_active);
                    const isN11Live = Boolean(p.is_n11_active);
                    const isPzrLive = Boolean(p.is_pazarama_active);
                    const isWebLive = Boolean(p.is_web_sale);

                    const stockQty = parseFloat(p.stock_quantity || 0);
                    const webPrice = parseFloat(p.price || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-black text-slate-900 dark:text-white max-w-xs truncate">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Barcode className="h-3 w-3" />
                            <span>{p.barcode || p.sku || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-md font-black text-xs ${
                            stockQty <= 0 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {stockQty} {p.unit || 'Adet'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-600 dark:text-slate-300">
                          {Number(p.cost_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="p-3 text-right font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          <div className="text-[9px] font-bold text-slate-400">
                            {isWebLive ? (isTr ? "Web'de Aktif" : "Web Live") : (isTr ? "Web Pasif" : "Web Off")}
                          </div>
                        </td>
                        
                        {/* Hepsiburada */}
                        <td className="p-3 text-center">
                          {isHbLive ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-300 rounded-md text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3 text-orange-600 shrink-0" />
                                <span>{webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                              <div className="text-[9px] font-bold text-emerald-700">Stok: {stockQty}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                          )}
                          <div className="text-[8px] font-mono text-slate-400 mt-0.5 truncate max-w-[100px] mx-auto">
                            {p.hepsiburada_sku || '-'}
                          </div>
                        </td>

                        {/* Amazon TR */}
                        <td className="p-3 text-center">
                          {isAmzLive ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3 text-amber-600 shrink-0" />
                                <span>{webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                              <div className="text-[9px] font-bold text-emerald-700">Stok: {stockQty}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                          )}
                          <div className="text-[8px] font-mono text-slate-400 mt-0.5 truncate max-w-[100px] mx-auto" title={cleanAmzAsin || ''}>
                            {cleanAmzAsin || '-'}
                          </div>
                        </td>

                        {/* Trendyol */}
                        <td className="p-3 text-center">
                          {isTyLive ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-md text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3 text-orange-500 shrink-0" />
                                <span>{webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                              <div className="text-[9px] font-bold text-emerald-700">Stok: {stockQty}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                          )}
                        </td>

                        {/* N11 */}
                        <td className="p-3 text-center">
                          {isN11Live ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded-md text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3 text-red-500 shrink-0" />
                                <span>{webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                              <div className="text-[9px] font-bold text-emerald-700">Stok: {stockQty}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                          )}
                        </td>

                        {/* Pazarama */}
                        <td className="p-3 text-center">
                          {isPzrLive ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[10px] font-black">
                                <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                                <span>{webPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                              </span>
                              <div className="text-[9px] font-bold text-emerald-700">Stok: {stockQty}</div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Pasif</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-500">
            {isTr ? `Toplam ${filteredProducts.length} ürün listeleniyor.` : `Showing ${filteredProducts.length} products.`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {isTr ? "Kapat" : "Close"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductXRayReportModal;

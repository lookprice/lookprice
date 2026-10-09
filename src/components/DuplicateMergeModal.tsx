import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  Package,
  Barcode as BarcodeIcon,
  Hash,
  Filter,
  Check,
  Zap
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

interface ProductItem {
  id: number;
  name: string;
  barcode: string;
  product_code?: string;
  sku?: string;
  stock_quantity: number;
  cost_price?: number;
  cost_currency?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  category?: string;
  brand?: string;
}

interface DuplicateCandidate {
  target: ProductItem;
  source: ProductItem;
  reason: string;
  confidence: number;
}

interface DuplicateMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMergedSuccess: () => void;
  storeId?: number;
  initialSelectedIds?: number[];
  allStoreProducts?: ProductItem[];
}

export const DuplicateMergeModal: React.FC<DuplicateMergeModalProps> = ({
  isOpen,
  onClose,
  onMergedSuccess,
  storeId,
  initialSelectedIds,
  allStoreProducts
}) => {
  const [activeTab, setActiveTab] = useState<"candidates" | "manual">("candidates");
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergingId, setMergingId] = useState<number | null>(null);
  const [autoMerging, setAutoMerging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Manual pair selection states
  const [targetProduct, setTargetProduct] = useState<ProductItem | null>(null);
  const [sourceProduct, setSourceProduct] = useState<ProductItem | null>(null);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);
  const [isSearchingSource, setIsSearchingSource] = useState(false);
  const [targetResults, setTargetResults] = useState<ProductItem[]>([]);
  const [sourceResults, setSourceResults] = useState<ProductItem[]>([]);
  const [manualMerging, setManualMerging] = useState(false);

  // Store products cache for instant search
  const [cachedProducts, setCachedProducts] = useState<ProductItem[]>(allStoreProducts || []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.getDuplicateCandidates(storeId);
      let list: DuplicateCandidate[] = res.candidates || res.data?.candidates || [];

      // If operator explicitly selected 2 items from table
      if (initialSelectedIds && initialSelectedIds.length === 2) {
        const id1 = initialSelectedIds[0];
        const id2 = initialSelectedIds[1];
        const existingIdx = list.findIndex(c => 
          (c.target.id === id1 && c.source.id === id2) || 
          (c.target.id === id2 && c.source.id === id1)
        );

        if (existingIdx >= 0) {
          // Move to top
          const matched = list.splice(existingIdx, 1)[0];
          list.unshift(matched);
          setTargetProduct(matched.target);
          setSourceProduct(matched.source);
        } else {
          // Check local cache first or fetch the two products directly and synthesize a candidate pair
          try {
            let p1 = (allStoreProducts || []).find(p => p.id === id1);
            let p2 = (allStoreProducts || []).find(p => p.id === id2);

            if (!p1 || !p2) {
              const [p1Res, p2Res] = await Promise.all([
                api.get(`/api/store/products/${id1}?storeId=${storeId || ''}`),
                api.get(`/api/store/products/${id2}?storeId=${storeId || ''}`)
              ]);
              p1 = p1 || (p1Res.data || p1Res);
              p2 = p2 || (p2Res.data || p2Res);
            }

            if (p1 && p2) {
              const p1IsReal = p1.barcode && !/^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(p1.barcode);
              const p2IsReal = p2.barcode && !/^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(p2.barcode);
              
              let target = p1;
              let source = p2;
              if (p2IsReal && !p1IsReal) {
                target = p2;
                source = p1;
              } else if (Number(p2.stock_quantity) > Number(p1.stock_quantity) && (!p1IsReal || p2IsReal)) {
                target = p2;
                source = p1;
              }

              list.unshift({
                target,
                source,
                reason: "Tablodan Seçilen 2 Özel Ürün Eşleşmesi",
                confidence: 100
              });
              setTargetProduct(target);
              setSourceProduct(source);
            }
          } catch (e) {
            console.warn("Could not fetch selected items for merge:", e);
          }
        }
      }

      setCandidates(list);
    } catch (err: any) {
      console.error("Duplicate candidates fetch error:", err);
      toast.error(err.response?.data?.error || "Mükerrer ürünler taranamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Load store products for manual search
  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
      if (!allStoreProducts || allStoreProducts.length === 0) {
        api.get(`/api/store/products?storeId=${storeId || ''}&limit=1000`)
          .then((res: any) => {
            const prods = Array.isArray(res) ? res : res.data || res.products || [];
            if (Array.isArray(prods)) setCachedProducts(prods);
          })
          .catch(() => {});
      } else {
        setCachedProducts(allStoreProducts);
      }
    }
  }, [isOpen, storeId]);

  // Target product live search
  useEffect(() => {
    if (!targetSearchQuery.trim()) {
      setTargetResults([]);
      return;
    }
    const q = targetSearchQuery.trim().toLowerCase();
    const matches = cachedProducts.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.product_code && p.product_code.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 8);
    setTargetResults(matches);
  }, [targetSearchQuery, cachedProducts]);

  // Source product live search
  useEffect(() => {
    if (!sourceSearchQuery.trim()) {
      setSourceResults([]);
      return;
    }
    const q = sourceSearchQuery.trim().toLowerCase();
    const matches = cachedProducts.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.product_code && p.product_code.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 8);
    setSourceResults(matches);
  }, [sourceSearchQuery, cachedProducts]);

  // Filtered candidate list based on instant search bar
  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidates;
    const q = searchTerm.trim().toLowerCase();
    return candidates.filter(item => {
      const matchTarget = (item.target.name && item.target.name.toLowerCase().includes(q)) ||
                          (item.target.barcode && item.target.barcode.toLowerCase().includes(q)) ||
                          (item.target.product_code && item.target.product_code.toLowerCase().includes(q)) ||
                          (item.target.sku && item.target.sku.toLowerCase().includes(q)) ||
                          (item.target.brand && item.target.brand.toLowerCase().includes(q)) ||
                          (item.target.category && item.target.category.toLowerCase().includes(q));
      
      const matchSource = (item.source.name && item.source.name.toLowerCase().includes(q)) ||
                          (item.source.barcode && item.source.barcode.toLowerCase().includes(q)) ||
                          (item.source.product_code && item.source.product_code.toLowerCase().includes(q)) ||
                          (item.source.sku && item.source.sku.toLowerCase().includes(q)) ||
                          (item.source.brand && item.source.brand.toLowerCase().includes(q)) ||
                          (item.source.category && item.source.category.toLowerCase().includes(q));

      const matchReason = item.reason && item.reason.toLowerCase().includes(q);

      return matchTarget || matchSource || matchReason;
    });
  }, [candidates, searchTerm]);

  if (!isOpen) return null;

  const handleMergeSingle = async (sourceId: number, targetId: number) => {
    if (sourceId === targetId) {
      toast.error("Aynı ürün kendi kendisiyle birleştirilemez.");
      return;
    }
    setMergingId(sourceId);
    try {
      await api.mergeProducts(sourceId, targetId, storeId);
      toast.success("Ürünler başarıyla birleştirildi ve envanter güncellendi.");
      // Remove candidate from local state immediately
      setCandidates(prev => prev.filter(c => c.source.id !== sourceId && c.target.id !== sourceId));
      setCachedProducts(prev => prev.filter(p => p.id !== sourceId));
      onMergedSuccess();
    } catch (err: any) {
      console.error("Merge error:", err);
      toast.error(err.response?.data?.error || "Birleştirme işlemi başarısız oldu.");
    } finally {
      setMergingId(null);
    }
  };

  const handleExecuteManualMerge = async () => {
    if (!targetProduct || !sourceProduct) {
      toast.error("Lütfen birleştirilecek ana ürünü ve mükerrer ürünü seçiniz.");
      return;
    }
    if (targetProduct.id === sourceProduct.id) {
      toast.error("Aynı ürün kendi kendisiyle birleştirilemez.");
      return;
    }

    setManualMerging(true);
    try {
      await api.mergeProducts(sourceProduct.id, targetProduct.id, storeId);
      toast.success(`'${sourceProduct.name}' ürünü başarıyla '${targetProduct.name}' kartına aktarıldı!`);
      setCandidates(prev => prev.filter(c => c.source.id !== sourceProduct.id && c.target.id !== sourceProduct.id));
      setCachedProducts(prev => prev.filter(p => p.id !== sourceProduct.id));
      setTargetProduct(null);
      setSourceProduct(null);
      setTargetSearchQuery("");
      setSourceSearchQuery("");
      onMergedSuccess();
    } catch (err: any) {
      console.error("Manual merge error:", err);
      toast.error(err.response?.data?.error || "Birleştirme işlemi başarısız oldu.");
    } finally {
      setManualMerging(false);
    }
  };

  const handleAutoMergeAll = async () => {
    setAutoMerging(true);
    try {
      const res = await api.autoMergeDuplicates(storeId);
      const count = res.data?.mergedCount || 0;
      if (count > 0) {
        toast.success(`${count} adet mükerrer ürün başarıyla birleştirildi!`);
        onMergedSuccess();
        fetchCandidates();
      } else {
        toast("Otomatik birleştirilecek yüksek güvenilirlikli mükerrer kayıt bulunamadı.");
      }
    } catch (err: any) {
      console.error("Auto merge error:", err);
      toast.error(err.response?.data?.error || "Otomatik birleştirme sırasında hata oluştu.");
    } finally {
      setAutoMerging(false);
    }
  };

  const handleSwapCandidate = (index: number) => {
    setCandidates(prev => {
      const copy = [...prev];
      const current = copy[index];
      copy[index] = {
        ...current,
        target: current.source,
        source: current.target
      };
      return copy;
    });
  };

  const handleSwapManual = () => {
    const temp = targetProduct;
    setTargetProduct(sourceProduct);
    setSourceProduct(temp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Envanter Temizliği & Mükerrer Ürün Birleştirme
                </h3>
                {candidates.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {candidates.length} Tespit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Geçici barkod, aynı model veya ürün koduna sahip mükerrer stok kartlarını tek bir ana kartta birleştirir.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchCandidates}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Yeniden Tara"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("candidates")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "candidates"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Otomatik Önerilenler ({candidates.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "manual"
                  ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Manuel 2 Ürün Seçerek Birleştir
            </button>
          </div>

          {activeTab === "candidates" && candidates.length > 0 && (
            <button
              onClick={handleAutoMergeAll}
              disabled={autoMerging || loading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              {autoMerging ? "Birleştiriliyor..." : "Tümünü Otomatik Birleştir"}
            </button>
          )}
        </div>

        {/* TAB 1: AUTOMATIC CANDIDATES LIST WITH INSTANT SEARCH */}
        {activeTab === "candidates" && (
          <>
            {/* Search and Filters Bar */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Mükerrer adaylar içinde ara (Örn: Samsung, 870, 880609, MZ-77E1T0BW, SSD)..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-hidden transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 font-bold shrink-0">
                Gösterilen: <strong className="text-slate-900">{filteredCandidates.length}</strong> / {candidates.length}
              </div>
            </div>

            {/* Candidate Cards List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/50">
              {loading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Envanter taranıyor, mükerrer ürünler tespit ediliyor...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="py-16 text-center max-w-md mx-auto">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-xs">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">
                    {searchTerm ? "Aramaya Uygun Mükerrer Eşleşme Bulunamadı" : "Tebrikler! Envanteriniz Tertemiz"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {searchTerm 
                      ? "Aradığınız terimle eşleşen mükerrer aday bulunamadı. Üstteki 'Manuel 2 Ürün Seçerek Birleştir' sekmesinden istediğiniz 2 ürünü seçebilirsiniz."
                      : "Mağazanızda birleştirilmeyi bekleyen mükerrer veya çakışan ürün kartı bulunmamaktadır."}
                  </p>
                </div>
              ) : (
                filteredCandidates.map((item, idx) => {
                  const combinedStock = Number(item.target.stock_quantity || 0) + Number(item.source.stock_quantity || 0);
                  const isRealTargetBarcode = item.target.barcode && !/^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(item.target.barcode);
                  const isRealSourceBarcode = item.source.barcode && !/^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(item.source.barcode);

                  return (
                    <div
                      key={`${item.target.id}-${item.source.id}`}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-all"
                    >
                      {/* Reason Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                            {item.reason}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            Güvenilirlik: %{item.confidence}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSwapCandidate(idx)}
                          className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                          title="Ana Ürün ile Birleştirilecek Ürünün Yerini Değiştir"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-indigo-600" />
                          Yönü Değiştir
                        </button>
                      </div>

                      {/* Compare Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                        {/* Target: Ana / Kalıcı Ürün */}
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                                👑 Ana Kart (Kalıcı Ürün)
                              </span>
                              <span className="text-[11px] font-black text-slate-700">
                                ID: #{item.target.id}
                              </span>
                            </div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mb-2" title={item.target.name}>
                              {item.target.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-slate-800">{item.target.barcode || "—"}</span>
                                  {isRealTargetBarcode && (
                                    <span className="text-[9px] font-bold px-1 bg-blue-100 text-blue-700 rounded">EAN</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">MODEL / SKU</span>
                                <span className="font-mono font-bold text-slate-800">{item.target.product_code || item.target.sku || "—"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">MEVCUT STOK</span>
                                <span className={`font-bold ${item.target.stock_quantity > 0 ? "text-emerald-700" : "text-slate-700"}`}>
                                  {item.target.stock_quantity} Adet
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">SATIŞ FİYATI</span>
                                <span className="font-bold text-slate-800">
                                  {item.target.price ? `${Number(item.target.price).toFixed(2)} ${item.target.currency || "USD"}` : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Source: Kaynak / Silinecek Ürün */}
                        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                                🔄 Mükerrer / Aktarılacak (Silinecek)
                              </span>
                              <span className="text-[11px] font-black text-slate-700">
                                ID: #{item.source.id}
                              </span>
                            </div>
                            <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 mb-2" title={item.source.name}>
                              {item.source.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-slate-800">{item.source.barcode || "—"}</span>
                                  {isRealSourceBarcode && (
                                    <span className="text-[9px] font-bold px-1 bg-blue-100 text-blue-700 rounded">EAN</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">MODEL / SKU</span>
                                <span className="font-mono font-bold text-slate-800">{item.source.product_code || item.source.sku || "—"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">AKTARILACAK STOK</span>
                                <span className="font-bold text-amber-700">
                                  +{item.source.stock_quantity} Adet
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold">SATIŞ FİYATI</span>
                                <span className="font-bold text-slate-800">
                                  {item.source.price ? `${Number(item.source.price).toFixed(2)} ${item.source.currency || "USD"}` : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-600 font-medium">
                          Birleştirme sonrası ana stok: <strong className="text-emerald-700 font-black">{combinedStock} Adet</strong> ({item.target.barcode || item.source.barcode} barkoduyla korunur)
                        </div>
                        <button
                          onClick={() => handleMergeSingle(item.source.id, item.target.id)}
                          disabled={mergingId === item.source.id || autoMerging}
                          className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          {mergingId === item.source.id ? "Birleştiriliyor..." : "Bu 2 Ürünü Birleştir"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: MANUAL 2-PRODUCT SELECTION & MERGE */}
        {activeTab === "manual" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Manuel Birleştirme Talimatı:</strong> Aşağıdaki arama kutularından birleştirmek istediğiniz <strong>Ana Ürün (Kalıcı Kart)</strong> ve <strong>Mükerrer Ürün (Silinecek ve Stoku Aktarılacak Kart)</strong>'ı seçiniz. Birleştir tuşuna bastığınızda tüm fatura hareketleri, satışlar ve stoklar tek kartta toplanır.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* TARGET PRODUCT SELECTOR (KEEPER) */}
              <div className="p-4 bg-white rounded-xl border-2 border-emerald-300 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-xs font-black uppercase text-emerald-800">
                      Ana Kart (Kalıcı Olacak Ürün)
                    </h4>
                  </div>
                  {targetProduct && (
                    <button
                      onClick={() => setTargetProduct(null)}
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Değiştir
                    </button>
                  )}
                </div>

                {!targetProduct ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={targetSearchQuery}
                        onChange={(e) => setTargetSearchQuery(e.target.value)}
                        placeholder="Ana ürün ara (Barkod, Samsung 870, MZ-77E...)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-hidden"
                      />
                    </div>

                    {targetResults.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white shadow-lg">
                        {targetResults.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setTargetProduct(p);
                              setTargetSearchQuery("");
                              setTargetResults([]);
                            }}
                            className="w-full p-2.5 text-left hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Barkod: {p.barcode || "—"} | Kod: {p.product_code || p.sku || "—"}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-emerald-700 block">{p.stock_quantity} Adet</span>
                              <span className="text-[10px] text-slate-500">{p.price} {p.currency || 'USD'}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                    <div className="font-bold text-xs text-slate-900 line-clamp-2">
                      {targetProduct.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                        <span className="font-mono font-bold text-slate-800">{targetProduct.barcode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MODEL / SKU</span>
                        <span className="font-mono font-bold text-slate-800">{targetProduct.product_code || targetProduct.sku || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MEVCUT STOK</span>
                        <span className="font-bold text-emerald-700">{targetProduct.stock_quantity} Adet</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">FİYAT</span>
                        <span className="font-bold text-slate-800">{targetProduct.price} {targetProduct.currency || "USD"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SOURCE PRODUCT SELECTOR (DUPLICATE TO BE MERGED) */}
              <div className="p-4 bg-white rounded-xl border-2 border-amber-300 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs font-black uppercase text-amber-800">
                      Mükerrer Kart (Silinip Aktarılacak)
                    </h4>
                  </div>
                  {sourceProduct && (
                    <button
                      onClick={() => setSourceProduct(null)}
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Değiştir
                    </button>
                  )}
                </div>

                {!sourceProduct ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={sourceSearchQuery}
                        onChange={(e) => setSourceSearchQuery(e.target.value)}
                        placeholder="Mükerrer ürün ara (Barkod, Samsung 870, 280609...)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-hidden"
                      />
                    </div>

                    {sourceResults.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white shadow-lg">
                        {sourceResults.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSourceProduct(p);
                              setSourceSearchQuery("");
                              setSourceResults([]);
                            }}
                            className="w-full p-2.5 text-left hover:bg-amber-50/80 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Barkod: {p.barcode || "—"} | Kod: {p.product_code || p.sku || "—"}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-amber-700 block">+{p.stock_quantity} Adet</span>
                              <span className="text-[10px] text-slate-500">{p.price} {p.currency || 'USD'}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                    <div className="font-bold text-xs text-slate-900 line-clamp-2">
                      {sourceProduct.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                        <span className="font-mono font-bold text-slate-800">{sourceProduct.barcode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MODEL / SKU</span>
                        <span className="font-mono font-bold text-slate-800">{sourceProduct.product_code || sourceProduct.sku || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">AKTARILACAK STOK</span>
                        <span className="font-bold text-amber-700">+{sourceProduct.stock_quantity} Adet</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">FİYAT</span>
                        <span className="font-bold text-slate-800">{sourceProduct.price} {sourceProduct.currency || "USD"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Swap & Action Bar */}
            {targetProduct && sourceProduct && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSwapManual}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Ana Ürün ile Mükerrer Ürünün Yerini Değiştir"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                    Yönü Değiştir
                  </button>
                  <div className="text-xs text-slate-600">
                    Birleştirme Sonrası Toplam Stok: <strong className="text-emerald-700 text-sm font-black">{Number(targetProduct.stock_quantity || 0) + Number(sourceProduct.stock_quantity || 0)} Adet</strong>
                  </div>
                </div>

                <button
                  onClick={handleExecuteManualMerge}
                  disabled={manualMerging}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Layers className="w-4 h-4" />
                  {manualMerging ? "Birleştiriliyor..." : "Seçilen Bu 2 Ürünü Birleştir"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fatura, stok ve satış kayıtları kaybolmadan ana karta aktarılır.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

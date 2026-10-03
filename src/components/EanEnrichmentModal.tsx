import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight,
  Search,
  Barcode as BarcodeIcon,
  Zap,
  Check,
  Package,
  Layers
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

export interface EanEnrichmentCandidate {
  id: number;
  name: string;
  currentBarcode: string;
  suggestedEan: string;
  source: "product_code_cross" | "supplier_invoice_cross" | "marketplace_catalog" | "gemini_catalog_lookup";
  confidence: number;
  reason: string;
  matchedModel?: string;
  modelCode?: string;
  product_code?: string;
  sku?: string;
  brand?: string;
  category?: string;
  stock_quantity: number;
  price?: number;
  image_url?: string;
}

interface EanEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId?: number;
}

export const EanEnrichmentModal: React.FC<EanEnrichmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storeId
}) => {
  const [candidates, setCandidates] = useState<EanEnrichmentCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [autoApplying, setAutoApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res: any = await api.getEanEnrichmentCandidates(storeId);
      if (res?.error) {
        throw new Error(res.error);
      }
      const list: EanEnrichmentCandidate[] = res?.candidates || res?.data?.candidates || [];
      setCandidates(list);
    } catch (err: any) {
      console.error("EAN candidates fetch error:", err);
      toast.error(err.response?.data?.error || err.message || "EAN adayları taranamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen, storeId]);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidates;
    const q = searchTerm.trim().toLowerCase();
    return candidates.filter(item => 
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.currentBarcode && item.currentBarcode.toLowerCase().includes(q)) ||
      (item.suggestedEan && item.suggestedEan.toLowerCase().includes(q)) ||
      (item.matchedModel && item.matchedModel.toLowerCase().includes(q)) ||
      (item.product_code && item.product_code.toLowerCase().includes(q)) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.reason && item.reason.toLowerCase().includes(q))
    );
  }, [candidates, searchTerm]);

  if (!isOpen) return null;

  const handleApplySingle = async (productId: number, newEan: string) => {
    setApplyingId(productId);
    try {
      const res: any = await api.applyEanEnrichment(productId, newEan, storeId);
      if (res?.error) {
        throw new Error(res.error);
      }
      toast.success(res?.message || res?.data?.message || "Barkod başarıyla güncellendi.");
      setCandidates(prev => prev.filter(c => c.id !== productId));
      onSuccess();
    } catch (err: any) {
      console.error("Apply EAN error:", err);
      toast.error(err.response?.data?.error || err.message || "Barkod güncelleme başarısız oldu.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleAutoApplyAll = async () => {
    setAutoApplying(true);
    try {
      const res: any = await api.autoApplyEanEnrichment(storeId);
      if (res?.error) {
        throw new Error(res.error);
      }
      const count = res?.appliedCount ?? res?.data?.appliedCount ?? 0;
      if (count > 0) {
        toast.success(`${count} adet ürünün geçici barkodu gerçek üretici EAN-13 barkoduna dönüştürüldü!`);
        onSuccess();
        fetchCandidates();
      } else {
        toast.info("Otomatik güncellenecek doğrulanmış EAN kaydı bulunamadı.");
      }
    } catch (err: any) {
      console.error("Auto apply EAN error:", err);
      toast.error(err.response?.data?.error || err.message || "Toplu barkod güncelleme sırasında hata oluştu.");
    } finally {
      setAutoApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-200">
              <BarcodeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  EAN Barkod Zenginleştirme & Doğrulama Sihirbazı
                </h3>
                {candidates.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    {candidates.length} Aday
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Geçici/dahili barkodlu ürünlerinizi pazar yeri, fatura ve katalog eşleşmeleriyle gerçek üretici EAN-13 kodlarına terfi ettirir.
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

        {/* Security Banner & Action Bar */}
        <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Doğrulanmış standart barkodlara dokunulmaz. Sadece geçici/dahili barkodlar güvenle güncellenir.
            </span>
          </div>

          {candidates.length > 0 && (
            <button
              onClick={handleAutoApplyAll}
              disabled={autoApplying || loading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              {autoApplying ? "Güncelleniyor..." : "Tüm Doğrulanmış EAN'leri Güncelle"}
            </button>
          )}
        </div>

        {/* Instant Search Bar */}
        <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı, barkod, model veya EAN ile ara..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-hidden transition-all"
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

        {/* Candidates List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Geçici barkodlu ürünler taranıyor, orijinal EAN kodları sorgulanıyor...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-xs">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">
                {searchTerm ? "Aramaya Uygun EAN Adayı Bulunamadı" : "Tebrikler! Tüm Barkodlarınız Orijinal"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchTerm 
                  ? "Aradığınız terimle eşleşen aday bulunamadı."
                  : "Mağazanızdaki ürünlerde çözümlenmemiş geçici barkod bulunmamaktadır. Tüm ürünleriniz doğrulanmış EAN kodlarına sahiptir."}
              </p>
            </div>
          ) : (
            filteredCandidates.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-xs transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                      {item.reason}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      %{item.confidence} Eşleşme {(item.matchedModel || item.modelCode) ? `- Model: ${item.matchedModel || item.modelCode}` : ""}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: #{item.id}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900">Bulunan Ürün:</span> {item.name}{" "}
                  <span className="text-amber-700 font-semibold">(Mevcut Dahili Barkod: <span className="font-mono">{item.currentBarcode || "Yok"}</span>)</span>{" "}
                  <span className="mx-1">➡️</span>{" "}
                  <span className="text-emerald-700 font-bold">Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN: <span className="font-mono underline">{item.suggestedEan}</span></span>{" "}
                  <span className="text-blue-700 font-bold">(%{item.confidence} Eşleşme{(item.matchedModel || item.modelCode) ? ` - Model: ${item.matchedModel || item.modelCode}` : ""})</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {item.category && <span>Kategori: <strong className="text-slate-700">{item.category}</strong></span>}
                      {item.brand && <span>Marka: <strong className="text-slate-700">{item.brand}</strong></span>}
                      {(item.matchedModel || item.modelCode || item.product_code) && <span>Model Kodu: <strong className="text-slate-900 font-mono">{item.matchedModel || item.modelCode || item.product_code}</strong></span>}
                      <span>Stok: <strong className="text-slate-700">{item.stock_quantity} Adet</strong></span>
                      {item.price && <span>Fiyat: <strong className="text-slate-700">{item.price} TL</strong></span>}
                    </div>
                  </div>

                  {/* Barcode Transformation Badge */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
                    <div className="text-center">
                      <span className="text-[9px] font-bold text-amber-700 block uppercase">Mevcut Dahili Barkod</span>
                      <span className="font-mono font-bold text-xs text-amber-900 line-through opacity-70">
                        {item.currentBarcode || "Yok"}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                    <div className="text-center">
                      <span className="text-[9px] font-bold text-emerald-700 block uppercase flex items-center justify-center gap-1">
                        <span>Gerçek EAN-13</span>
                        <span className="px-1 bg-emerald-100 text-emerald-800 rounded font-black text-[8px]">Orijinal</span>
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        {item.suggestedEan}
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplySingle(item.id, item.suggestedEan)}
                      disabled={applyingId === item.id || autoApplying}
                      className="ml-2 px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {applyingId === item.id ? "..." : "Onayla & Güncelle"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Güncelleme sonrası fatura ve stok hareketleri korunarak yeni EAN koduna bağlanır.</span>
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

import React, { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, CheckCircle, AlertCircle, RefreshCw, Layers, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { api } from "../services/api";
import { toast } from "react-hot-toast";

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
}

export const DuplicateMergeModal: React.FC<DuplicateMergeModalProps> = ({
  isOpen,
  onClose,
  onMergedSuccess,
  storeId
}) => {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergingId, setMergingId] = useState<number | null>(null);
  const [autoMerging, setAutoMerging] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.getDuplicateCandidates(storeId);
      setCandidates(res.data?.candidates || []);
    } catch (err: any) {
      console.error("Duplicate candidates fetch error:", err);
      toast.error(err.response?.data?.error || "Mükerrer ürünler taranamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCandidates();
    }
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const handleMergeSingle = async (sourceId: number, targetId: number) => {
    setMergingId(sourceId);
    try {
      await api.mergeProducts(sourceId, targetId, storeId);
      toast.success("Ürünler başarıyla birleştirildi ve envanter güncellendi.");
      // Remove candidate from local state immediately
      setCandidates(prev => prev.filter(c => c.source.id !== sourceId && c.target.id !== sourceId));
      onMergedSuccess();
    } catch (err: any) {
      console.error("Merge error:", err);
      toast.error(err.response?.data?.error || "Birleştirme işlemi başarısız oldu.");
    } finally {
      setMergingId(null);
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

  const handleSwapTargetSource = (index: number) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Envanter Temizliği & Mükerrer Ürün Birleştirme
                </h3>
                {candidates.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {candidates.length} Eşleşme
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Geçici barkod veya aynı ürün koduna sahip mükerrer stok kartlarını tek bir ana kartta birleştirir.
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
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        {candidates.length > 0 && (
          <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Birleştirme işlemi stok hareketlerini, faturaları ve siparişleri koruyarak ana karta aktarır.
              </span>
            </div>
            <button
              onClick={handleAutoMergeAll}
              disabled={autoMerging || loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {autoMerging ? "Birleştiriliyor..." : "Tümünü Otomatik Birleştir"}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Envanter taranıyor, mükerrer ürünler tespit ediliyor...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 mb-1">
                Tebrikler! Envanteriniz Tertemiz
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mağazanızda birleştirilmeyi bekleyen mükerrer veya çakışan ürün kartı bulunmamaktadır. Tüm stok kartlarınız düzenli görünmektedir.
              </p>
            </div>
          ) : (
            candidates.map((item, idx) => (
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
                    onClick={() => handleSwapTargetSource(idx)}
                    className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors"
                    title="Ana Ürün ile Birleştirilecek Ürünün Yerini Değiştir"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Yönü Ters Çevir
                  </button>
                </div>

                {/* Compare Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  {/* Target: Ana / Kalıcı Ürün */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Ana Kart (Kalıcı Ürün)
                      </span>
                      <span className="text-[11px] font-black text-slate-700">
                        ID: #{item.target.id}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 line-clamp-1 mb-1" title={item.target.name}>
                      {item.target.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                        <span className="font-mono font-bold text-slate-800">{item.target.barcode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">ÜRÜN / MODEL KODU</span>
                        <span className="font-mono font-bold text-slate-800">{item.target.product_code || item.target.sku || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MEVCUT STOK</span>
                        <span className={`font-bold ${item.target.stock_quantity > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                          {item.target.stock_quantity} Adet
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MALİYET</span>
                        <span className="font-bold text-slate-800">
                          {item.target.cost_price ? `${Number(item.target.cost_price).toFixed(2)} ${item.target.cost_currency || "TRY"}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Source: Kaynak / Silinecek Ürün */}
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                        Mükerrer / Geçici Kart (Silinecek)
                      </span>
                      <span className="text-[11px] font-black text-slate-700">
                        ID: #{item.source.id}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900 line-clamp-1 mb-1" title={item.source.name}>
                      {item.source.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">BARKOD</span>
                        <span className="font-mono font-bold text-slate-800">{item.source.barcode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">ÜRÜN / MODEL KODU</span>
                        <span className="font-mono font-bold text-slate-800">{item.source.product_code || item.source.sku || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">AKTARILACAK STOK</span>
                        <span className="font-bold text-amber-700">
                          +{item.source.stock_quantity} Adet
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">MALİYET</span>
                        <span className="font-bold text-slate-800">
                          {item.source.cost_price ? `${Number(item.source.cost_price).toFixed(2)} ${item.source.cost_currency || "TRY"}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Birleştirme sonrası toplam stok: <strong className="text-slate-800 font-bold">{Number(item.target.stock_quantity || 0) + Number(item.source.stock_quantity || 0)} Adet</strong>
                  </div>
                  <button
                    onClick={() => handleMergeSingle(item.source.id, item.target.id)}
                    disabled={mergingId === item.source.id || autoMerging}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {mergingId === item.source.id ? "Birleştiriliyor..." : "Bu Ürünü Birleştir"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

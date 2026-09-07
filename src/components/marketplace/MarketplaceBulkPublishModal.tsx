import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Store, 
  ArrowRight, 
  Loader2, 
  Check, 
  Sparkles,
  Percent,
  TrendingUp,
  Package
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface MarketplaceBulkPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  selectedProductIds?: number[];
  storeBranding: any;
  currentStoreId?: number;
  onSuccess?: () => void;
  lang?: string;
}

export const MarketplaceBulkPublishModal: React.FC<MarketplaceBulkPublishModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProductIds = [],
  storeBranding,
  currentStoreId,
  onSuccess,
  lang = 'tr'
}) => {
  const isTr = lang === 'tr';
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  if (!isOpen) return null;

  // Filter target products
  const targetProducts = selectedProductIds.length > 0
    ? products.filter(p => selectedProductIds.includes(p.id))
    : products;

  const validProducts = targetProducts.filter(p => p.barcode && String(p.barcode).trim().length > 0);
  const invalidProducts = targetProducts.filter(p => !p.barcode || String(p.barcode).trim().length === 0);

  const hbSettings = storeBranding?.hepsiburada_settings || {};
  const isHbConfigured = !!(hbSettings.apiKey && hbSettings.apiSecret && hbSettings.merchantId);
  const commissionRate = Number(hbSettings.defaultCommissionRate || 18);
  const fixedFee = Number(hbSettings.defaultFixedFee || 20);

  const calculateSamplePrice = (rawPrice: number) => {
    const p = Number(rawPrice) || 0;
    if (p <= 0) return 0;
    const divisor = 1 - (commissionRate / 100);
    return Number(((p + fixedFee) / (divisor > 0 ? divisor : 1)).toFixed(2));
  };

  const handleStartBulkPublish = async () => {
    if (validProducts.length === 0) {
      toast.error(isTr ? "İlana açılacak geçerli barkoda sahip ürün bulunamadı!" : "No valid products with barcodes found!");
      return;
    }

    try {
      setIsPublishing(true);
      setPublishResult(null);

      const targetIds = validProducts.map(p => p.id);
      const res = await api.bulkPublishHepsiburadaProducts(targetIds, currentStoreId);
      
      setPublishResult(res.data || res);
      toast.success(
        isTr 
          ? `Hepsiburada'ya ${res.data?.syncedCount || validProducts.length} adet ürün başarıyla gönderildi!` 
          : `Successfully published ${res.data?.syncedCount || validProducts.length} products to Hepsiburada!`
      );
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Bulk publish error:", error);
      toast.error(error.response?.data?.error || (isTr ? "Toplu ürün aktarımı sırasında bir hata oluştu" : "Bulk publish failed"));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs text-white shadow-inner">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {isTr ? "Hepsiburada'da Toplu İlan Aç & Güncelle" : "Bulk Publish to Hepsiburada"}
              </h3>
              <p className="text-xs text-orange-100 font-medium">
                {selectedProductIds.length > 0 
                  ? (isTr ? `Seçili ${selectedProductIds.length} adet ürün işleme alınacak` : `${selectedProductIds.length} selected products`)
                  : (isTr ? `Tüm katalogdaki ${products.length} ürün taranıyor` : `Scanning all ${products.length} products`)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Connection Status Notice */}
          {!isHbConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  {isTr ? "Hepsiburada API Bilgileri Eksik veya Henüz Kaydedilmedi" : "Hepsiburada API Credentials Missing"}
                </p>
                <p className="text-amber-800">
                  {isTr 
                    ? "Ürünlerinizi Hepsiburada'ya göndermeden önce Ayarlar > E-Mağazalar sekmesinden Merchant ID, API Key ve Secret Key bilgilerinizi kaydedin." 
                    : "Please configure your Hepsiburada API keys in Settings > E-Stores tab before publishing."}
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {isTr ? "Hedef Ürün Sayısı" : "Target Count"}
              </p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {targetProducts.length}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                {isTr ? "✓ İlana Hazır (Barkodlu)" : "✓ Ready to Publish"}
              </p>
              <p className="text-xl font-black text-emerald-800 mt-1">
                {validProducts.length}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                {isTr ? "! Barkodsuz (Atlanacak)" : "! Missing Barcode"}
              </p>
              <p className="text-xl font-black text-rose-800 mt-1">
                {invalidProducts.length}
              </p>
            </div>
          </div>

          {/* Commission & Pricing Calculation Preview */}
          <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-orange-950">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                {isTr ? "Net Kâr Koruma & Fiyat Formülü" : "Margin Protection Formula"}
              </span>
              <span className="text-[11px] text-orange-800 bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200">
                %{commissionRate} {isTr ? "Komisyon" : "Commission"} + {fixedFee} TL {isTr ? "Kargo/Hizmet" : "Fee"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isTr 
                ? "Ürünler Hepsiburada'ya iletilirken web fiyatınıza komisyon ve sabit maliyet eklenerek kârınız eksiksiz korunur."
                : "Prices sent to Hepsiburada are automatically adjusted to protect your exact net profit."}
            </p>
            {validProducts.length > 0 && (
              <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{isTr ? "Örnek Ürün:" : "Sample:"} {validProducts[0].name}</span>
                <span className="font-black text-slate-900">
                  {Number(validProducts[0].price || 0).toLocaleString('tr-TR')} TL ➔ <span className="text-orange-600 font-extrabold">{calculateSamplePrice(validProducts[0].price).toLocaleString('tr-TR')} TL</span> (HB)
                </span>
              </div>
            )}
          </div>

          {/* Skipped / Warning Products List */}
          {invalidProducts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {isTr ? "Barkodu Olmadığı İçin Gönderilmeyecek Ürünler" : "Skipped Products (Missing Barcode)"}
              </p>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-1 text-xs">
                {invalidProducts.map(p => (
                  <div key={p.id} className="py-1.5 px-2 flex items-center justify-between text-slate-700">
                    <span className="truncate max-w-[280px] font-medium">{p.name}</span>
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {isTr ? "Barkod Yok" : "No Barcode"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Summary if Available */}
          {publishResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>{isTr ? "İlan Gönderimi Başarılı" : "Listing Import Completed"}</span>
              </div>
              <p className="text-xs text-emerald-800">
                {publishResult.message || `${publishResult.syncedCount || validProducts.length} adet ürün Hepsiburada Listing API'sine iletildi.`}
              </p>
              {publishResult.trackingId && (
                <p className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 p-2 rounded-lg break-all">
                  Tracking ID: {publishResult.trackingId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {isTr ? "Vazgeç / Kapat" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleStartBulkPublish}
            disabled={isPublishing || validProducts.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isTr ? "Hepsiburada'ya Gönderiliyor..." : "Publishing..."}</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>{isTr ? `${validProducts.length} Ürünü Hepsiburada'da Satışa Aç` : `Publish ${validProducts.length} to Hepsiburada`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

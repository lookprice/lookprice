import React from "react";
import { motion } from "motion/react";
import { X, Printer, AlertCircle, Gift, Clock, Truck, CheckCircle2, FileText } from "lucide-react";
import ShippingSlip from "../../../components/ShippingSlip";
import { api } from "../../../services/api";

interface SaleDetailsModalProps {
  showSaleDetailsModal: boolean;
  setShowSaleDetailsModal: (show: boolean) => void;
  selectedSale: any;
  handlePrint: () => void;
  shippingSlipRef: React.RefObject<HTMLDivElement | null>;
  handleSaleSuccess?: (id?: number) => void;
  branding: any;
  translations: any;
  lang: string;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  showSaleDetailsModal,
  setShowSaleDetailsModal,
  selectedSale,
  handlePrint,
  shippingSlipRef,
  handleSaleSuccess,
  branding,
  translations: t,
  lang
}) => {
  if (!showSaleDetailsModal || !selectedSale) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t.saleDetails}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              #{selectedSale.id} • {new Date(selectedSale.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer" title={t.print || "Yazdır"}>
              <Printer className="h-5 w-5 text-gray-400" />
            </button>
            <button onClick={() => setShowSaleDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div style={{ display: 'none' }}>
            <ShippingSlip ref={shippingSlipRef} sale={selectedSale} store={branding} />
          </div>
          {(selectedSale.status === 'cancelled' || selectedSale.cancellation_reason || selectedSale.cancel_reason) && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-rose-700">
                  {lang === 'tr' ? 'İptal Edilmiş Satış' : 'Cancelled Sale'}
                </p>
                <p className="text-xs font-bold text-rose-900">
                  <span className="font-bold text-rose-600">{lang === 'tr' ? 'İptal Sebebi:' : 'Cancellation Reason:'} </span>
                  {selectedSale.cancellation_reason || selectedSale.cancel_reason || selectedSale.notes || (lang === 'tr' ? 'Neden belirtilmedi' : 'No reason provided')}
                </p>
              </div>
            </div>
          )}
          {(selectedSale.notes?.toLowerCase().includes('ikram') || selectedSale.notes?.toLowerCase().includes('i̇kram') || (selectedSale.items && selectedSale.items.some((i: any) => Number(i.unit_price) === 0 || i.product_name?.toLowerCase().includes('ikram') || i.note?.toLowerCase().includes('ikram')))) && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
              <Gift className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  {lang === 'tr' ? 'İkram Tanımlı Sipariş / Adisyon' : 'Complimentary (Treat) Order'}
                </p>
                <p className="text-xs font-bold text-emerald-900">
                  <span className="font-bold text-emerald-700">{lang === 'tr' ? 'İkram / Kişi / Kurum Bilgisi:' : 'Treat Recipient Note:'} </span>
                  {selectedSale.notes || (lang === 'tr' ? 'İkram olarak uygulandı' : 'Applied as complimentary')}
                </p>
              </div>
            </div>
          )}
          <div className="p-4 bg-indigo-600 rounded-2xl text-white">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.total?.toUpperCase() || 'TOTAL'}</span>
              <span className="text-xl font-bold">{Number(selectedSale.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.slice(0, 3)}</span>
            </div>
          </div>
          
          {/* Display items */}
          <div className="space-y-4">
            {(selectedSale.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} x {Number(item.unit_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.slice(0, 3)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.slice(0, 3)}</p>
              </div>
            ))}
          </div>
        
          {/* Status Update Actions for Web Sales */}
          {selectedSale.status !== 'cancelled' && (
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {['pending', 'processing'].includes(selectedSale.status) && (
                  <button 
                    onClick={async () => {
                      try {
                        await api.prepareSale(selectedSale.id, selectedSale.store_id);
                        if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                        else window.location.reload();
                      } catch (e: any) { alert(e.message || "Hata"); }
                    }}
                    className="px-3 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {lang === 'tr' ? 'Hazırlanıyor Olarak İşaretle' : 'Mark as Preparing'}
                  </button>
                )}
                {['pending', 'processing', 'preparing'].includes(selectedSale.status) && (
                  <button 
                    onClick={async () => {
                      try {
                        await api.updateSaleStatus(selectedSale.id, { status: 'shipped' }, selectedSale.store_id);
                        if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                        else window.location.reload();
                      } catch (e: any) { alert(e.message || "Hata"); }
                    }}
                    className="px-3 py-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    {lang === 'tr' ? 'Kargoya Verildi Yap' : 'Mark as Shipped'}
                  </button>
                )}
                {['pending', 'processing', 'preparing', 'shipped'].includes(selectedSale.status) && (
                  <button 
                    onClick={async () => {
                      try {
                        await api.deliverSale(selectedSale.id, selectedSale.store_id);
                        if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                        else window.location.reload();
                      } catch (e: any) { alert(e.message || "Hata"); }
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'tr' ? 'Teslim Edildi Yap' : 'Mark as Delivered'}
                  </button>
                )}
              </div>

              {/* Create Invoice Button or Invoice Badge */}
              {!selectedSale.sales_invoice_id ? (
                <button 
                  onClick={async () => {
                    try {
                      const res = await api.createSaleInvoice(selectedSale.id, selectedSale.store_id);
                      if (res.error) throw new Error(res.error);
                      alert(lang === 'tr' ? 'Satış faturası başarıyla oluşturuldu.' : 'Invoice created successfully.');
                      if (handleSaleSuccess) handleSaleSuccess(selectedSale.id);
                      else window.location.reload();
                    } catch (e: any) { alert(e.message || "Hata"); }
                  }}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {lang === 'tr' ? 'Satış Faturasına Dönüştür' : 'Convert to Invoice'}
                </button>
              ) : (
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === 'tr' ? 'Faturalandı:' : 'Invoiced:'} #{selectedSale.sales_invoice_number}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

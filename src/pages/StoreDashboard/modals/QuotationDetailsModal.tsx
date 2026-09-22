import React from "react";
import { motion } from "motion/react";
import { X, Download } from "lucide-react";

interface QuotationDetailsModalProps {
  showQuotationDetailsModal: boolean;
  setShowQuotationDetailsModal: (show: boolean) => void;
  selectedQuotationDetails: any;
  onDownloadQuotationPDF: (q: any) => void;
  numberToTurkishWords: (n: number, currency?: string) => string;
  quotationPrintRef: React.RefObject<HTMLDivElement | null>;
  translations: any;
  lang: string;
}

export const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({
  showQuotationDetailsModal,
  setShowQuotationDetailsModal,
  selectedQuotationDetails,
  onDownloadQuotationPDF,
  numberToTurkishWords,
  quotationPrintRef,
  translations: t,
  lang
}) => {
  if (!showQuotationDetailsModal || !selectedQuotationDetails) return null;

  const isTr = lang === 'tr';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">{t.quotationDetails || "Teklif Detayları"}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => onDownloadQuotationPDF(selectedQuotationDetails)} 
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {isTr ? 'İndir' : 'Download'}
            </button>
            <button 
              onClick={() => setShowQuotationDetailsModal(false)} 
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6 max-h-[75vh] overflow-y-auto" ref={quotationPrintRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.customer || "Müşteri"}</p>
              <p className="text-lg font-bold text-slate-900">{selectedQuotationDetails.customer_name}</p>
              {selectedQuotationDetails.customer_title && <p className="text-sm text-slate-500">{selectedQuotationDetails.customer_title}</p>}
            </div>
            <div className="space-y-2 text-right">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Teklif Bilgileri' : 'Quotation Info'}</p>
              <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Teklif No:' : 'Quote No:'}</span> #{selectedQuotationDetails.id}</p>
              <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Tarih:' : 'Date:'}</span> {new Date(selectedQuotationDetails.created_at).toLocaleDateString('tr-TR')}</p>
              <p className="text-sm text-slate-600">
                <span className="font-bold">{t.validUntil || "Geçerlilik"}:</span> {
                  selectedQuotationDetails.expiry_date 
                    ? new Date(selectedQuotationDetails.expiry_date).toLocaleDateString('tr-TR')
                    : new Date(new Date(selectedQuotationDetails.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')
                }
              </p>
              <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {selectedQuotationDetails.currency}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{t.product || "Ürün"}</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{t.quantity || "Miktar"}</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{t.unitPrice || "Birim Fiyat"}</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">KDV</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{t.total || "Toplam"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selectedQuotationDetails.items || []).map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900 truncate max-w-[150px] md:max-w-[250px]" title={item.product_name}>{item.product_name}</div>
                      <div className="text-xs text-slate-400">#{item.product_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">{Math.floor(Number(item.quantity))}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-right">
                      {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 text-center">
                      %{item.tax_rate || 20}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                      {Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotationDetails.currency?.slice(0, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
              {selectedQuotationDetails.notes && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t.notes || "Notlar"}</p>
                  <p className="text-sm text-slate-700">{selectedQuotationDetails.notes}</p>
                </div>
              )}
            </div>
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                <span>{selectedQuotationDetails.is_tax_inclusive ? (t.grandTotal || "Genel Toplam") : (isTr ? "Toplam (Vergi Hariç)" : "Total (Excl. Tax)")}</span>
                <span className="text-indigo-600 text-lg font-bold">
                  {(() => {
                    const sub = (selectedQuotationDetails.items || []).reduce((s: any, i: any) => s + Number(i.total_price), 0);
                    return sub.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
                  })()} {selectedQuotationDetails.currency?.slice(0, 3)}
                </span>
              </div>
              {selectedQuotationDetails.is_tax_inclusive ? (
                <div className="text-[10px] text-right text-slate-400 font-bold italic">
                  {isTr ? "* Fiyatlara KDV dahildir." : "* Prices include VAT."}
                </div>
              ) : (
                <div className="text-[10px] text-right text-indigo-500 font-bold italic">
                  {isTr ? "* Fiyatlara KDV dahil değildir." : "* Prices exclude VAT."}
                </div>
              )}
              <div className="text-[10px] text-right text-slate-500 font-bold italic pt-2">
                 {isTr ? 'Yalnızca:' : 'Only:'} {(() => {
                   const sub = (selectedQuotationDetails.items || []).reduce((s: any, i: any) => s + Number(i.total_price), 0);
                   return numberToTurkishWords(sub, selectedQuotationDetails.currency);
                 })()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { numberToTurkishWords } from '../../../../lib/invoiceUtils';

interface SalesInvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  isTr: boolean;
  invoiceRef: React.RefObject<HTMLDivElement>;
  handlePrint: () => void;
}

export const SalesInvoiceDetailsModal: React.FC<SalesInvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isTr,
  invoiceRef,
  handlePrint
}) => {
  if (!isOpen || !invoice) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-slate-900">{isTr ? 'Fatura Detayı' : 'Invoice Details'}</h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint} 
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
              >
                <Printer className="h-4 w-4" />
                {isTr ? 'Yazdır' : 'Print'}
              </button>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <div id="print-invoice-wrapper" ref={invoiceRef} className="print-section bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</p>
                <p className="text-lg font-bold text-slate-900">{invoice.customer_name || invoice.company_title || invoice.sale_customer_name}</p>
                <p className="text-sm text-slate-500">{invoice.customer_address || invoice.company_address}</p>
                <p className="text-sm text-slate-500">{invoice.customer_phone || invoice.company_phone}</p>
                <p className="text-sm text-slate-500">{invoice.tax_number}</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Fatura Bilgileri' : 'Invoice Info'}</p>
                <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Fatura No:' : 'Inv No:'}</span> {invoice.invoice_number}</p>
                <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Tarih:' : 'Date:'}</span> {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {invoice.currency} {invoice.exchange_rate !== 1 && `(Kur: ${invoice.exchange_rate})`}</p>
                <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Ödeme:' : 'Payment:'}</span> {invoice.payment_method}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{isTr ? 'Ürün' : 'Product'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{isTr ? 'Miktar' : 'Qty'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{isTr ? 'KDV %' : 'VAT %'}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{isTr ? 'Toplam' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoice.items || []).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{item.product_name}</div>
                        <div className="text-xs text-slate-400">{item.barcode}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{Math.floor(Number(item.quantity))}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">
                        {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">%{item.tax_rate}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">
                        {(Number(item.total_price) + Number(item.tax_amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="flex-1">
                {invoice.notes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">{isTr ? 'NOTLAR' : 'NOTES'}</p>
                    <p className="text-sm text-slate-700">{invoice.notes}</p>
                  </div>
                )}
                <div className="text-xs text-slate-400 font-bold italic">
                  {isTr ? 'Yalnızca:' : 'Only:'} {numberToTurkishWords(Number(invoice.grand_total), invoice.currency)}
                </div>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isTr ? 'Ara Toplam' : 'Subtotal'}</span>
                  <span className="font-medium">{Number(invoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{isTr ? 'KDV Toplam' : 'VAT Total'}</span>
                  <span className="font-medium">{Number(invoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-slate-200 pt-2">
                  <span>{isTr ? 'Genel Toplam' : 'Grand Total'}</span>
                  <span className="text-indigo-600 font-semibold">{Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

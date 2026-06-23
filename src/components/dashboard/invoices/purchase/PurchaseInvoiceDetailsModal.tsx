import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  Calendar, 
  Hash, 
  Package, 
  User as UserIcon, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';

interface PurchaseInvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  isTr: boolean;
  handleViewHtml?: (id: number) => void;
}

export const PurchaseInvoiceDetailsModal: React.FC<PurchaseInvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isTr,
  handleViewHtml
}) => {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-600" />
              {isTr ? "Fatura Detayları" : "Invoice Details"}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
              {invoice.invoice_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
             {handleViewHtml && (
                <button
                  onClick={() => handleViewHtml(invoice.id)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {isTr ? "E-FATURA GÖRSELİ" : "E-INVOICE VIEW"}
                </button>
             )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden group">
                <Building2 className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-200/50 group-hover:scale-110 transition-transform duration-500" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{isTr ? "SATICI (TEDARİKÇİ)" : "SUPPLIER"}</label>
                <p className="text-lg font-black text-slate-900 tracking-tight relative z-10">{invoice.company_name}</p>
                <div className="mt-4 space-y-2 relative z-10">
                   <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                     <Hash className="h-4 w-4 text-indigo-400" />
                     {invoice.tax_number || '-'} {invoice.tax_office ? ` / ${invoice.tax_office}` : ''}
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{isTr ? "FATURA TARİHİ" : "INVOICE DATE"}</label>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-indigo-400" />
                       {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                    </p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{isTr ? "ÖDEME ŞEKLİ" : "PAYMENT"}</label>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase">
                       <CreditCard className="h-4 w-4 text-indigo-400" />
                       {invoice.payment_method === 'cash' ? (isTr ? 'Nakit' : 'Cash') : (isTr ? 'Vadeli' : 'Term')}
                    </p>
                 </div>
                 {invoice.is_expense && invoice.expense_center && (
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 col-span-2">
                       <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 block">{isTr ? "GİDER YERİ" : "EXPENSE CENTER"}</label>
                       <p className="text-sm font-black text-amber-700 flex items-center gap-2 uppercase">
                          <CheckCircle2 className="h-4 w-4" />
                          {invoice.expense_center}
                       </p>
                    </div>
                 )}
              </div>
            </div>

            <div className="flex flex-col justify-between">
               <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest">{isTr ? "MATRAH" : "SUBTOTAL"}</span>
                      <span className="text-sm font-medium">{Number(invoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-[10px] font-black uppercase tracking-widest">{isTr ? "KDV TOPLAM" : "VAT TOTAL"}</span>
                      <span className="text-sm font-medium">{Number(invoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                       <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{isTr ? "GENEL TOPLAM" : "TOTAL"}</span>
                       <span className="text-3xl font-semibold tracking-tighter">{Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400 uppercase">{invoice.currency}</span></span>
                    </div>
                  </div>
               </div>

               <div className="mt-6 p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{isTr ? "NOTLAR" : "NOTES"}</label>
                  <p className="text-sm font-medium text-slate-600 italic">
                    {invoice.notes || (isTr ? "Not eklenmemiş." : "No notes.")}
                  </p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isTr ? "KALEM DETAYLARI" : "ITEM DETAILS"}</h4>
             <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest">
                         <th className="p-4 font-bold">{isTr ? "ÜRÜN / HİZMET" : "PRODUCT"}</th>
                         <th className="p-4 font-bold text-center">{isTr ? "MİKTAR" : "QTY"}</th>
                         <th className="p-4 font-bold text-right">{isTr ? "BİRİM FİYAT" : "UNIT PRICE"}</th>
                         <th className="p-4 font-bold text-center">{isTr ? "KDV %" : "VAT %"}</th>
                         <th className="p-4 font-bold text-right">{isTr ? "TOPLAM" : "TOTAL"}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {invoice.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                           <td className="p-4">
                              <p className="text-sm font-black text-slate-900 tracking-tight">{item.product_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{item.barcode || '-'}</p>
                           </td>
                           <td className="p-4 text-center font-medium text-slate-700 text-sm">
                              {Number(item.quantity).toLocaleString('tr-TR')}
                           </td>
                           <td className="p-4 text-right font-medium text-slate-700 text-sm">
                              {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                           </td>
                           <td className="p-4 text-center font-medium text-indigo-600 text-sm">
                              %{Number(item.tax_rate)}
                           </td>
                           <td className="p-4 text-right font-semibold text-slate-800 text-sm">
                              {(Number(item.quantity) * Number(item.unit_price) * (1 + Number(item.tax_rate) / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
           <button
             onClick={onClose}
             className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all shadow-sm"
           >
             {isTr ? "Kapat" : "Close"}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

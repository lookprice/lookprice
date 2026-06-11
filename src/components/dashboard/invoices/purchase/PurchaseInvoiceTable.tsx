import React from 'react';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';

interface PurchaseInvoiceTableProps {
  invoices: any[];
  loading: boolean;
  isTr: boolean;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  lastEditedId: number | null;
  handleViewDetails: (inv: any) => void;
  handleEdit: (id: number) => void;
  handleDelete: (id: number) => void;
  handleUpdateTicariStatus: (id: number, status: 'APPROVED' | 'REJECTED') => void;
  handleUpdatePaymentStatus: (id: number, status: 'paid' | 'unpaid') => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const PurchaseInvoiceTable: React.FC<PurchaseInvoiceTableProps> = ({
  invoices,
  loading,
  isTr,
  selectedIds,
  setSelectedIds,
  lastEditedId,
  handleViewDetails,
  handleEdit,
  handleDelete,
  handleUpdateTicariStatus,
  handleUpdatePaymentStatus,
  page,
  totalPages,
  setPage
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
              <th className="p-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={invoices.length > 0 && selectedIds.length === invoices.length}
                  onChange={() => {
                    if (selectedIds.length === invoices.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(invoices.map((inv: any) => inv.id));
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
              </th>
              <th className="p-4 font-bold">{isTr ? "Tarih" : "Date"}</th>
              <th className="p-4 font-bold">{isTr ? "Fatura No" : "Inv No"}</th>
              <th className="p-4 font-bold">{isTr ? "İrsaliye No" : "Waybill"}</th>
              <th className="p-4 font-bold">{isTr ? "Satıcı" : "Supplier"}</th>
              <th className="p-4 font-bold">{isTr ? "Vergi No" : "Tax No"}</th>
              <th className="p-4 font-bold text-right">{isTr ? "Matrah" : "Subtotal"}</th>
              <th className="p-4 font-bold text-right">{isTr ? "KDV" : "VAT"}</th>
              <th className="p-4 font-bold text-right">{isTr ? "Toplam" : "Total"}</th>
              <th className="p-4 font-bold text-center">{isTr ? "Döviz" : "Curr"}</th>
              <th className="p-4 font-bold text-center">{isTr ? "Ödeme" : "Payment"}</th>
              <th className="p-4 font-bold text-right">{isTr ? "İşlemler" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-slate-400">
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-slate-400 font-medium">
                  {isTr ? "Fatura bulunamadı" : "No invoices found"}
                </td>
              </tr>
            ) : (
              invoices.map((invoice: any) => (
                <tr 
                  key={invoice.id} 
                  className={`hover:bg-slate-50/50 transition-colors ${
                    invoice.is_read === false ? 'font-bold bg-indigo-50/30' : ''
                  } ${
                    lastEditedId === invoice.id ? 'bg-indigo-100/50 ring-1 ring-inset ring-indigo-200' : ''
                  }`}
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(invoice.id)}
                      onChange={() => {
                        setSelectedIds(prev => prev.includes(invoice.id) ? prev.filter(i => i !== invoice.id) : [...prev, invoice.id]);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-900">
                    {invoice.invoice_number}
                    {invoice.e_document_type && (
                       <div className="text-[9px] text-indigo-600 font-bold mt-0.5">{invoice.e_document_type}</div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {invoice.waybill_number || '-'}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-700">
                    <div>{invoice.company_name}</div>
                    {invoice.is_expense && (
                      <div className="mt-1">
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                          {isTr ? `GİDER: ${invoice.expense_category || 'DİĞER'}` : `EXPENSE: ${invoice.expense_category || 'OTHER'}`}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {invoice.tax_number || '-'}
                  </td>
                  <td className="p-4 text-xs text-slate-600 text-right font-medium">
                    {Number(invoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs text-slate-600 text-right font-medium">
                    {Number(invoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-900 text-right">
                    {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs text-slate-500 text-center font-bold">
                    {invoice.currency}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleUpdatePaymentStatus(invoice.id, invoice.payment_status === 'paid' ? 'unpaid' : 'paid')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                        invoice.payment_status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}
                    >
                      {invoice.payment_status === 'paid' ? (isTr ? 'Ödendi' : 'Paid') : (isTr ? 'Ödenmedi' : 'Unpaid')}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      {invoice.ticari_status === 'PENDING' && (
                        <div className="flex gap-1 mr-2 px-2 border-r border-slate-100">
                          <button
                            onClick={() => handleUpdateTicariStatus(invoice.id, 'APPROVED')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={isTr ? "Ticari Faturayı Kabul Et" : "Approve Commercial Invoice"}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateTicariStatus(invoice.id, 'REJECTED')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isTr ? "Ticari Faturayı Reddet" : "Reject Commercial Invoice"}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => handleViewDetails(invoice)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Prev
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

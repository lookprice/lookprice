import React, { useState } from 'react';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  Barcode
} from 'lucide-react';
import { api } from '../../../../services/api';

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
  handleViewHtml?: (id: number, inv?: any) => void;
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
  handleViewHtml,
  handleUpdateTicariStatus,
  handleUpdatePaymentStatus,
  page,
  totalPages,
  setPage
}) => {
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);
  const [itemsCache, setItemsCache] = useState<Record<number, any[]>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const toggleRow = async (inv: any) => {
    const isExpanded = expandedRowIds.includes(inv.id);
    if (isExpanded) {
      setExpandedRowIds(prev => prev.filter(id => id !== inv.id));
      return;
    }

    setExpandedRowIds(prev => [...prev, inv.id]);

    // Check if items already present on inv or in cache
    if ((!inv.items || inv.items.length === 0) && !itemsCache[inv.id]) {
      try {
        setLoadingRowId(inv.id);
        const detail = await api.getPurchaseInvoice(inv.id);
        if (detail && detail.items) {
          setItemsCache(prev => ({ ...prev, [inv.id]: detail.items }));
        }
      } catch (err) {
        console.error("Alış faturası kalemleri getirilemedi:", err);
      } finally {
        setLoadingRowId(null);
      }
    }
  };

  const formatCurrency = (amount: any, curr: string = 'TRY') => {
    const num = Number(amount) || 0;
    const symbol = curr === 'TRY' ? '₺' : curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr;
    return `${num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
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
              <th className="px-2 py-4 text-center w-8">
                <span className="sr-only">Detay</span>
              </th>
              <th className="p-4 font-bold">{isTr ? "Tarih" : "Date"}</th>
              <th className="p-4 font-bold">{isTr ? "Fatura No" : "Inv No"}</th>
              <th className="p-4 font-bold">{isTr ? "Satıcı" : "Supplier"}</th>
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
                <td colSpan={11} className="p-12 text-center text-slate-400">
                  <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-12 text-center text-slate-400 font-medium">
                  {isTr ? "Fatura bulunamadı" : "No invoices found"}
                </td>
              </tr>
            ) : (
              invoices.map((invoice: any) => {
                const isExpanded = expandedRowIds.includes(invoice.id);
                const items = itemsCache[invoice.id] || invoice.items || [];
                const isRowLoading = loadingRowId === invoice.id;

                return (
                  <React.Fragment key={invoice.id}>
                    <tr 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        invoice.is_read === false ? 'font-bold bg-indigo-50/30' : ''
                      } ${
                        lastEditedId === invoice.id ? 'bg-indigo-100/50 ring-1 ring-inset ring-indigo-200' : ''
                      } ${
                        isExpanded ? 'bg-indigo-50/20' : ''
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
                      <td className="px-2 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(invoice)}
                          title={isExpanded ? (isTr ? "Kalemleri Gizle" : "Hide Items") : (isTr ? "Kalemleri Göster" : "Show Items")}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isExpanded 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                              : 'bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                           {invoice.is_read === false && (
                             <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={isTr ? "Yeni (Okunmadı)" : "New (Unread)"}></span>
                           )}
                           <span>{invoice.invoice_number}</span>
                        </div>
                        {invoice.e_document_type && (
                           <div className="flex items-center gap-2 mt-0.5">
                             <div className="text-[9px] text-indigo-600 font-bold uppercase">{invoice.e_document_type}</div>
                             {invoice.e_document_type?.toUpperCase() === 'TICARIFATURA' && invoice.status?.toUpperCase() === 'APPROVED' && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">{isTr ? 'Kabul Edildi' : 'Approved'}</span>
                             )}
                             {invoice.e_document_type?.toUpperCase() === 'TICARIFATURA' && invoice.status?.toUpperCase() === 'REJECTED' && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">{isTr ? 'Reddedildi' : 'Rejected'}</span>
                             )}
                             {invoice.e_document_type?.toUpperCase() === 'TICARIFATURA' && invoice.status?.toLowerCase() === 'pending' && (() => {
                               const arrivalDate = new Date(invoice.created_at || invoice.invoice_date);
                               const diffDays = (new Date().getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24);
                               return diffDays > 8;
                             })() && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider" title={isTr ? "8 günlük süreyi aştığı için yasal olarak otomatik kabul edilmiştir." : "Auto accepted legally over 8 days limit."}>{isTr ? 'Oto Kabul (8 Gün)' : 'Auto Accepted'}</span>
                             )}
                           </div>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-700">
                        <div>{invoice.company_name || invoice.supplier_name || '-'}</div>
                        {invoice.is_expense && (
                          <div className="mt-1">
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                              {isTr ? `GİDER: ${invoice.expense_category || 'DİĞER'}` : `EXPENSE: ${invoice.expense_category || 'OTHER'}`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-600 text-right font-medium">
                        {Number(invoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs text-slate-600 text-right font-medium">
                        {Number(invoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-800 text-right">
                        {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-xs text-slate-500 text-center font-bold">
                        {invoice.currency}
                      </td>
                      <td className="p-4 text-center">
                        {invoice.payment_method && invoice.payment_method !== 'term' && invoice.payment_method !== 'vadeli' ? (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100">
                            {isTr ? 'Ödendi' : 'Paid'}
                          </span>
                        ) : (
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
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          {(() => {
                            if (invoice.status?.toLowerCase() !== 'pending' || invoice.e_document_type?.toUpperCase() !== 'TICARIFATURA') return false;
                            const arrivalDate = new Date(invoice.created_at || invoice.invoice_date);
                            const diffDays = (new Date().getTime() - arrivalDate.getTime()) / (1000 * 3600 * 24);
                            return diffDays <= 8;
                          })() && (
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
                            title={isTr ? "Kayıt Detayları" : "Details"}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {handleViewHtml && (
                            <button 
                              onClick={() => handleViewHtml(invoice.id, invoice)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title={isTr ? "Fatura Görselini Aç (HTML)" : "View Invoice HTML"}
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(invoice.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title={isTr ? "Düzenle" : "Edit"}
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

                    {/* EXPANDED ACCORDION ROW: Fatura Kalemleri & Ürün Listesi */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-indigo-100">
                        <td colSpan={11} className="p-0">
                          <div className="p-4 md:p-5 m-2.5 my-2 bg-white rounded-xl border border-indigo-100/90 shadow-sm">
                            {/* Drawer Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <span>{isTr ? 'Alış Faturası Kalemleri & Ürün Detayları' : 'Purchase Invoice Items & Details'}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {items.length} {isTr ? 'Kalem' : 'Lines'}
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {isTr ? `Fatura No: #${invoice.invoice_number}` : `Invoice: #${invoice.invoice_number}`}
                                    {invoice.company_name || invoice.supplier_name ? ` • ${invoice.company_name || invoice.supplier_name}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Metadata Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                {invoice.ettn && (
                                  <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-200 font-mono text-[10px]">
                                    ETTN: {invoice.ettn}
                                  </span>
                                )}
                                {invoice.waybill_number && (
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-medium text-[10px]">
                                    {isTr ? 'İrsaliye:' : 'Waybill:'} {invoice.waybill_number}
                                  </span>
                                )}
                                {invoice.tax_number && (
                                  <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-200 font-medium text-[10px]">
                                    VKN/TC: {invoice.tax_number}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Items Table */}
                            {isRowLoading ? (
                              <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                {isTr ? 'Kalemler yükleniyor...' : 'Loading items...'}
                              </div>
                            ) : items.length === 0 ? (
                              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                                <Package className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                                {isTr ? 'Bu alış faturasında kayıtlı ürün kalemi bulunmuyor.' : 'No items recorded in this purchase invoice.'}
                              </div>
                            ) : (
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-100/70 text-slate-600 font-bold border-y border-slate-200 text-[10px] uppercase tracking-wider">
                                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                                      <th className="py-2.5 px-3">{isTr ? 'Ürün / Hizmet Açıklaması' : 'Product / Service'}</th>
                                      <th className="py-2.5 px-3 text-right w-24">{isTr ? 'Miktar' : 'Qty'}</th>
                                      <th className="py-2.5 px-3 text-right w-28">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                                      <th className="py-2.5 px-3 text-center w-20">{isTr ? 'KDV %' : 'VAT %'}</th>
                                      <th className="py-2.5 px-3 text-right w-28">{isTr ? 'KDV Tutarı' : 'VAT Amt'}</th>
                                      <th className="py-2.5 px-3 text-right w-32">{isTr ? 'Satır Toplamı' : 'Line Total'}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {items.map((item: any, idx: number) => {
                                      const qty = Number(item.quantity) || 0;
                                      const unitPrice = Number(item.unit_price) || 0;
                                      const taxRate = Number(item.tax_rate) || 0;
                                      const taxAmt = Number(item.tax_amount) || ((qty * unitPrice * taxRate) / 100);
                                      const lineTotal = Number(item.total_price) || (qty * unitPrice);

                                      return (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                            {idx + 1}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <div className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                                              <span>{item.product_name || item.name || '-'}</span>
                                              {item.variant_name && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-semibold">
                                                  {item.variant_name}
                                                </span>
                                              )}
                                              {item.barcode && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                  <Barcode className="w-3 h-3 text-slate-400" />
                                                  {item.barcode}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                                            {qty.toLocaleString('tr-TR')}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                            {formatCurrency(unitPrice, invoice.currency)}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] border border-indigo-100">
                                              %{taxRate}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                            {formatCurrency(taxAmt, invoice.currency)}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                            {formatCurrency(lineTotal, invoice.currency)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Bottom Note & Mini Financial Summary */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="text-slate-500 text-[11px] max-w-xl">
                                {invoice.notes ? (
                                  <div className="flex items-start gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <span><strong className="text-slate-700">{isTr ? 'Fatura Notu:' : 'Note:'}</strong> {invoice.notes}</span>
                                  </div>
                                ) : (
                                  <span className="italic text-slate-400">{isTr ? 'Ek açıklama bulunmuyor' : 'No extra notes'}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'Matrah' : 'Subtotal'}</span>
                                  <span className="font-mono font-bold text-slate-700">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'KDV Toplamı' : 'VAT Total'}</span>
                                  <span className="font-mono font-bold text-indigo-700">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'Genel Toplam' : 'Grand Total'}</span>
                                  <span className="font-mono font-black text-slate-900">{formatCurrency(invoice.grand_total, invoice.currency)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
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

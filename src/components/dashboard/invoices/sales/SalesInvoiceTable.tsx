import React from 'react';
import { 
  Building2, 
  User as UserIcon, 
  Eye, 
  Edit, 
  Trash2, 
  Printer, 
  FileSearch, 
  CloudUpload, 
  XCircle, 
  RefreshCw,
  Truck
} from 'lucide-react';

interface SalesInvoiceTableProps {
  invoices: any[];
  loading: boolean;
  isTr: boolean;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  lastEditedId: number | null;
  branding: any;
  handleSendToGIB: (id: number) => void;
  handleCancelGIB: (id: number) => void;
  handleCheckEInvoiceStatus: (id: number) => void;
  handleViewHtml: (id: number) => void;
  handleEdit: (id: number) => void;
  handleViewDetails: (inv: any, print?: boolean) => void;
  handleDelete: (id: number) => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  handleOpenWaybillModal?: (id: number) => void;
}

export const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({
  invoices,
  loading,
  isTr,
  selectedIds,
  setSelectedIds,
  lastEditedId,
  branding,
  handleSendToGIB,
  handleCancelGIB,
  handleCheckEInvoiceStatus,
  handleViewHtml,
  handleEdit,
  handleViewDetails,
  handleDelete,
  page,
  totalPages,
  setPage,
  handleOpenWaybillModal
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-3 py-4 text-center w-12">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === invoices.length && invoices.length > 0}
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
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Tarih' : 'Date'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Fatura No' : 'Invoice No'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Durum' : 'Status'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Matrah' : 'Subtotal'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'KDV' : 'VAT'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isTr ? 'Döviz' : 'Curr'}</th>
              <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'İşlemler' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center text-slate-400 text-sm font-medium">
                  {isTr ? "Fatura bulunamadı" : "No invoices found"}
                </td>
              </tr>
            ) : (
              invoices.map((inv: any) => {
                const isQueued = ['QUEUED', 'Kuyrukta', 'İşleniyor'].includes(inv.integration_status);
                const isRejected = ['REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED'].includes(inv.integration_status);
                const isApproved = ['APPROVED', 'Onaylandı', 'Başarılı', '1300'].includes(inv.integration_status) || 
                                  (inv.document_number && /^(GIB|GEA|EFA)/i.test(inv.document_number) && !isRejected);

                return (
                  <tr 
                    key={inv.id} 
                    className={`transition-colors group ${
                      lastEditedId === inv.id ? 'bg-indigo-100/50 ring-1 ring-inset ring-indigo-300' :
                      isApproved ? 'bg-emerald-50' : 
                      isQueued ? 'bg-amber-50' : 
                      isRejected ? 'bg-rose-50' : 
                      'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => {
                          setSelectedIds(prev => prev.includes(inv.id) ? prev.filter(i => i !== inv.id) : [...prev, inv.id]);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-500">
                      {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-bold text-slate-900">#{inv.invoice_number}</div>
                      {inv.document_number && (
                         <div className="text-[10px] text-indigo-600 font-black tracking-widest mt-0.5">{inv.document_number}</div>
                      )}
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.payment_method}</div>
                    </td>
                    <td className="px-3 py-4 w-[120px]">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        inv.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        inv.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status === 'draft' ? (isTr ? 'Taslak' : 'Draft') :
                         inv.status === 'approved' ? (isTr ? 'Onaylandı' : 'Approved') :
                         inv.status === 'cancelled' ? (isTr ? 'İptal' : 'Cancelled') :
                         inv.status}
                      </span>
                      {(() => {
                        let computedDocType = null;
                        const profile = (inv.invoice_profile || "").toUpperCase();
                        const type = (inv.invoice_type || "").toUpperCase();
                        
                        if (['TEMELFATURA', 'TICARIFATURA', 'TEMEL', 'TICARI'].includes(profile) || 
                            ['TEMELFATURA', 'TICARIFATURA', 'TEMEL', 'TICARI'].includes(type) ||
                            (inv.e_document_type === 'E-FATURA')) {
                          computedDocType = 'E-FATURA';
                        } else if (profile === 'EARSIVFATURA' || profile === 'EARSIV' || 
                                   type === 'EARSIVFATURA' || type === 'EARSIV' ||
                                   (inv.e_document_type === 'E-ARŞİV' || inv.e_document_type === 'E-ARSIV')) {
                          computedDocType = 'E-ARŞİV';
                        }

                        if (!computedDocType) return null;
                        
                        const isEFatura = computedDocType === 'E-FATURA';

                        return (
                          <div className="flex flex-col gap-1 mt-1 font-sans">
                            <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border w-fit ${
                              isEFatura ? 'border-purple-200 bg-purple-50 text-purple-700' : 
                              'border-blue-200 bg-blue-50 text-blue-700'
                            }`}>
                              {computedDocType}
                            </div>
                            {(inv.integration_status || isApproved) && (
                              <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border w-fit ${
                                isQueued ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                isApproved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                isRejected ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                'border-slate-200 bg-slate-50 text-slate-700'
                              }`}>
                                {isQueued ? (isTr ? 'GİB KUYRUĞUNDA' : 'QUEUED') :
                                 isApproved ? (isTr ? 'GİB ONAYLI' : 'APPROVED') : 
                                 isRejected ? (isTr ? 'REDDEDİLDİ/İPTAL' : 'REJECTED/CANCELLED') :
                                 inv.integration_status}
                              </div>
                            )}
                            {inv.waybill_number && (
                              <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-100">
                                <span className="text-[8px] font-black tracking-wider text-slate-400 uppercase">
                                  {isTr ? 'SEVK İRSALİYESİ' : 'WAYBILL'}
                                </span>
                                <div className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest border border-indigo-200 bg-indigo-50 text-indigo-700">
                                  {inv.waybill_number}
                                </div>
                                {inv.waybill_status && (
                                  <div className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight border w-fit ${
                                    inv.waybill_status === 'SUCCESS' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                                    inv.waybill_status === 'QUEUED' ? 'border-amber-200 bg-amber-50 text-amber-600' :
                                    inv.waybill_status === 'ERROR' ? 'border-rose-200 bg-rose-50 text-rose-600' :
                                    'border-slate-200 bg-slate-50 text-slate-600'
                                  }`}>
                                    {inv.waybill_status === 'SUCCESS' ? (isTr ? 'BAŞARILI' : 'SUCCESS') :
                                     inv.waybill_status === 'QUEUED' ? (isTr ? 'İLETİLİYOR' : 'QUEUED') :
                                     inv.waybill_status === 'ERROR' ? (isTr ? 'HATA' : 'ERROR') :
                                     inv.waybill_status}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        {inv.company_id ? <Building2 className="h-3.5 w-3.5 text-indigo-500" /> : <UserIcon className="h-3.5 w-3.5 text-slate-400" />}
                        <div className="text-sm font-medium text-slate-700">{inv.customer_name || inv.company_title || inv.sale_customer_name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-medium text-slate-700">
                        {Number(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-medium text-slate-600">
                        {Number(inv.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-semibold text-slate-800">
                        {Number(inv.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-black text-slate-400">
                      {inv.currency}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {branding?.einvoice_settings?.is_active && inv.status !== 'draft' && !isApproved && !isQueued && !isRejected && (
                          <button 
                            onClick={() => handleSendToGIB(inv.id)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                            title={isTr ? "GİB'e Gönder" : "Push to Document Integrator"}
                          >
                            <CloudUpload className="h-4 w-4" />
                          </button>
                        )}
                        {(isApproved || isQueued) && (
                          <button 
                            onClick={() => handleCancelGIB(inv.id)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            title={isTr ? "E-Arşiv İptal Et" : "Cancel E-Archive Invoice"}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {isRejected && (
                          <div className="p-2 text-rose-500" title={inv.integration_message || (isTr ? "Faturalama hatası / İptal edildi" : "Invoicing error / Cancelled")}>
                            <XCircle className="h-4 w-4" />
                          </div>
                        )}
                        {isQueued && branding?.einvoice_settings?.is_active && (
                          <button 
                            onClick={() => handleCheckEInvoiceStatus(inv.id)}
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                            title={isTr ? "GİB Durumunu Sorgula" : "Check Integrator Status"}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        {branding?.einvoice_settings?.is_active && inv.status !== 'draft' && (
                          <button 
                            onClick={() => handleOpenWaybillModal && handleOpenWaybillModal(inv.id)}
                            className={`p-2 rounded-xl transition-all ${
                              inv.waybill_status === 'SUCCESS' ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' :
                              inv.waybill_status === 'QUEUED' ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' :
                              inv.waybill_status === 'ERROR' ? 'text-red-500 hover:text-red-700 hover:bg-red-50' :
                              'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50'
                            }`}
                            title={isTr ? "e-İrsaliye İşlemleri (Taşıma / Sevk)" : "e-Waybill Actions"}
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewHtml(inv.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title={isTr ? "E-Fatura Görselini Aç" : "View E-Invoice HTML"}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(inv.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(inv)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title={isTr ? "Sistem Kayıt Detayları" : "Internal System Details"}
                        >
                          <FileSearch className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(inv, true)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title={isTr ? "Yazdır / PDF" : "Print / PDF"}
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
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

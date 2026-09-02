import React, { useState } from 'react';
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
  Truck, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronRight,
  Package,
  Barcode,
  Receipt,
  FileText,
  Loader2,
  Layers
} from 'lucide-react';
import { api } from '../../../../services/api';

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
  handleOpenWaybillModal?: (inv: any) => void;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  products?: any[];
  onEditProduct?: (item: any) => void;
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
  handleOpenWaybillModal,
  page,
  totalPages,
  setPage,
  products = [],
  onEditProduct
}) => {
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);
  const [itemsCache, setItemsCache] = useState<Record<number, any[]>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const isGapStore = 
    branding?.slug?.toLowerCase() === 'gap' || 
    branding?.store_name?.toUpperCase().includes('GAP');

  const isPortfolio = !isGapStore && (branding?.store_type === 'real_estate' || branding?.store_type === 'motor_vehicle' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive');

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
        const detail = await api.getSalesInvoice(inv.id);
        if (detail && detail.items) {
          setItemsCache(prev => ({ ...prev, [inv.id]: detail.items }));
        }
      } catch (err) {
        console.error("Kalemler getirilemedi:", err);
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
            <tr className="bg-slate-50/50">
              <th className="px-3 py-4 text-center w-10">
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
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
              </th>
              <th className="px-2 py-4 text-center w-8">
                <span className="sr-only">Detay</span>
              </th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Tarih' : 'Date'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Fatura No' : 'Invoice No'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[110px]">{isTr ? 'Durum' : 'Status'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Matrah' : 'Subtotal'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{isTr ? 'KDV' : 'VAT'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{isTr ? 'Döviz' : 'Curr'}</th>
              <th className="px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{isTr ? 'İşlemler' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center">
                  <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-12 text-center text-slate-400 text-sm font-medium">
                  {isTr ? "Fatura bulunamadı" : "No invoices found"}
                </td>
              </tr>
            ) : (
              invoices.map((inv: any) => {
                const intStatus = (inv.integration_status || '').toUpperCase();
                const isQueued = ['QUEUED', 'KUYRUKTA', 'İŞLENİYOR', 'İLETİLİYOR'].includes(intStatus);
                const isRejected = ['REJECTED', 'HATA', 'İPTAL', 'İPTAL EDİLDİ', 'HATALI', 'CANCELLED', 'ERROR'].includes(intStatus);
                const isApproved = ['APPROVED', 'ONAYLANDI', 'BAŞARILI', '1300', 'SUCCESS'].includes(intStatus) || 
                                  (inv.document_number && !isRejected);
                const isUnknown = !intStatus || intStatus === 'UNKNOWN' || intStatus === 'BILINMIYOR';
                const isExpanded = expandedRowIds.includes(inv.id);
                const items = inv.items && inv.items.length > 0 ? inv.items : (itemsCache[inv.id] || []);
                const isRowLoading = loadingRowId === inv.id;

                return (
                  <React.Fragment key={inv.id}>
                    <tr 
                      className={`transition-colors group ${
                        lastEditedId === inv.id ? 'bg-indigo-100/50 ring-1 ring-inset ring-indigo-300' :
                        isExpanded ? 'bg-indigo-50/40 border-l-2 border-l-indigo-600' :
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
                      <td className="px-2 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(inv)}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            isExpanded 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={isExpanded ? (isTr ? "Ürün Kalemlerini Gizle" : "Hide Items") : (isTr ? "Ürün Kalemlerini Göster" : "Show Items")}
                        >
                          {isRowLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : isExpanded ? (
                            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-xs font-bold text-slate-500">
                        {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleRow(inv)}
                            className="hover:text-indigo-600 hover:underline text-left font-bold"
                          >
                            #{inv.invoice_number}
                          </button>
                          {(inv.gi_invoice_type === 'IADE' || inv.invoice_type === 'IADE') && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              - İADE -
                            </span>
                          )}
                          {items && items.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Package className="w-3 h-3 text-slate-400" />
                              {items.length} {isTr ? 'kalem' : 'items'}
                            </span>
                          )}
                        </div>
                        {inv.document_number && (
                           <div className="text-[10px] text-indigo-600 font-bold tracking-widest mt-0.5">{inv.document_number}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.payment_method}</div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex justify-center mb-1">
                          {inv.status === 'draft' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              {isTr ? 'TASLAK' : 'DRAFT'}
                            </div>
                          ) : inv.status === 'approved' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                              <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                              {isTr ? 'ONAYLI' : 'APPROVED'}
                            </div>
                          ) : inv.status === 'cancelled' ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              {isTr ? 'İPTAL' : 'CANCELLED'}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600">{inv.status}</span>
                          )}
                        </div>
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
                              {(inv.integration_status || isApproved || isUnknown) && (
                                <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border w-fit ${
                                  isQueued ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                  isApproved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                  isRejected ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                  'border-slate-200 bg-slate-100 text-slate-600'
                                }`}>
                                  {isQueued ? (isTr ? 'GİB KUYRUĞUNDA' : 'QUEUED') :
                                   isApproved ? (isTr ? 'GİB ONAYLI' : 'APPROVED') : 
                                   isRejected ? (isTr ? 'REDDEDİLDİ/İPTAL' : 'REJECTED/CANCELLED') :
                                   isUnknown ? (inv.document_number ? (isTr ? 'GİB\'E İLETİLDİ' : 'SENT TO GIB') : (isTr ? 'GÖNDERİLMEDİ' : 'NOT SENT')) :
                                   inv.integration_status}
                                </div>
                              )}
                              {inv.waybill_number && (
                                <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-100">
                                  <span className="text-[8px] font-bold tracking-wider text-slate-400 uppercase">
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
                        <div className="text-sm font-medium text-slate-700 font-mono tabular-nums">
                          {Number(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="text-sm font-medium text-slate-600 font-mono tabular-nums">
                          {Number(inv.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="text-sm font-medium text-slate-800 font-mono tabular-nums">
                          {Number(inv.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-xs font-bold text-slate-400">
                        {inv.currency}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {!isPortfolio && branding?.einvoice_settings?.is_active && inv.status !== 'draft' && !isApproved && !isQueued && !isRejected && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleSendToGIB(inv.id)}
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                title={isTr ? "GİB'e Gönder (E-Fatura/Arşiv)" : "Push to Document Integrator (Invoice)"}
                              >
                                <CloudUpload className="h-4 w-4" />
                              </button>
                              {branding?.einvoice_settings?.is_ewaybill_active && (
                                <button 
                                  onClick={() => handleOpenWaybillModal && handleOpenWaybillModal(inv)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  title={isTr ? "Sevk İrsaliyesi Oluştur" : "Create Shipment Waybill"}
                                >
                                  <Truck className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                          {!isPortfolio && (isApproved || isQueued) && (
                            <button 
                              onClick={() => handleCancelGIB(inv.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                              title={isTr ? "E-Arşiv İptal Et" : "Cancel E-Archive Invoice"}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {!isPortfolio && isRejected && (
                            <div className="p-2 text-rose-500" title={inv.integration_message || (isTr ? "Faturalama hatası / İptal edildi" : "Invoicing error / Cancelled")}>
                              <XCircle className="h-4 w-4" />
                            </div>
                          )}
                          {!isPortfolio && isQueued && branding?.einvoice_settings?.is_active && (
                            <button 
                              onClick={() => handleCheckEInvoiceStatus(inv.id)}
                              className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                              title={isTr ? "GİB Durumunu Sorgula" : "Check Integrator Status"}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}

                          {!isPortfolio && (
                            <button 
                              onClick={() => handleViewHtml(inv.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title={isTr ? "E-Fatura Görselini Aç" : "View E-Invoice HTML"}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
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
                                    <span>{isTr ? 'Fatura Kalemleri & Ürün Detayları' : 'Invoice Items & Details'}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {items.length} {isTr ? 'Kalem' : 'Lines'}
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {isTr ? `Fatura No: #${inv.invoice_number}` : `Invoice: #${inv.invoice_number}`}
                                    {inv.customer_name || inv.company_title ? ` • ${inv.customer_name || inv.company_title}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Metadata Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                {inv.ettn && (
                                  <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-200 font-mono text-[10px]">
                                    ETTN: {inv.ettn}
                                  </span>
                                )}
                                {inv.waybill_number && (
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-medium text-[10px]">
                                    {isTr ? 'İrsaliye:' : 'Waybill:'} {inv.waybill_number}
                                  </span>
                                )}
                                {inv.tax_number && (
                                  <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-200 font-medium text-[10px]">
                                    VKN/TC: {inv.tax_number}
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
                                {isTr ? 'Bu faturada kayıtlı ürün kalemi bulunmuyor.' : 'No items recorded in this invoice.'}
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
                                              <button 
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if(onEditProduct) onEditProduct(item);
                                                }}
                                                className={`text-left hover:text-indigo-600 transition-colors ${onEditProduct ? 'cursor-pointer underline decoration-indigo-200 decoration-dashed underline-offset-4' : ''}`}
                                              >
                                                {item.product_name || item.name || '-'}
                                              </button>
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
                                            {formatCurrency(unitPrice, inv.currency)}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] border border-indigo-100">
                                              %{taxRate}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                            {formatCurrency(taxAmt, inv.currency)}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                            {formatCurrency(lineTotal, inv.currency)}
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
                                {inv.notes ? (
                                  <div className="flex items-start gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                    <span><strong className="text-slate-700">{isTr ? 'Fatura Notu:' : 'Note:'}</strong> {inv.notes}</span>
                                  </div>
                                ) : (
                                  <span className="italic text-slate-400">{isTr ? 'Ek açıklama bulunmuyor' : 'No extra notes'}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'Matrah' : 'Subtotal'}</span>
                                  <span className="font-mono font-bold text-slate-700">{formatCurrency(inv.total_amount, inv.currency)}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'KDV Toplamı' : 'VAT Total'}</span>
                                  <span className="font-mono font-bold text-indigo-700">{formatCurrency(inv.tax_amount, inv.currency)}</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{isTr ? 'Genel Toplam' : 'Grand Total'}</span>
                                  <span className="font-mono font-black text-slate-900">{formatCurrency(inv.grand_total, inv.currency)}</span>
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

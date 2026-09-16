import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  MoreVertical
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
  handleMarketplaceShip?: (inv: any) => void;
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
  handleMarketplaceShip,
  page,
  totalPages,
  setPage,
  products = [],
  onEditProduct
}) => {
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);
  const [itemsCache, setItemsCache] = useState<Record<number, any[]>>({});
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Close open action menu on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (openActionMenuId !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('.action-menu-dropdown') && !target.closest('.action-menu-trigger')) {
          setOpenActionMenuId(null);
        }
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openActionMenuId]);

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
            <tr className="bg-slate-50/70 border-b border-slate-200">
              <th className="px-3 py-2.5 text-center w-10">
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
              <th className="px-2 py-2.5 text-center w-8">
                <span className="sr-only">Detay</span>
              </th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isTr ? 'Tarih' : 'Date'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isTr ? 'Fatura No' : 'Invoice No'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-[110px]">{isTr ? 'Durum' : 'Status'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px]">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{isTr ? 'Matrah' : 'Subtotal'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{isTr ? 'KDV' : 'VAT'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">{isTr ? 'Döviz' : 'Curr'}</th>
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-[100px]">{isTr ? 'İşlemler' : 'Actions'}</th>
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
              invoices.map((inv: any, idx: number) => {
                const intStatus = (inv.integration_status || '').toUpperCase();
                const isQueued = ['QUEUED', 'KUYRUKTA', 'İŞLENİYOR', 'İLETİLİYOR'].includes(intStatus);
                const isRejected = ['REJECTED', 'HATA', 'İPTAL', 'İPTAL EDİLDİ', 'HATALI', 'CANCELLED', 'ERROR'].includes(intStatus);
                const isUnknown = !intStatus || intStatus === 'UNKNOWN' || intStatus === 'BILINMIYOR';
                const isApproved = ['APPROVED', 'ONAYLANDI', 'BAŞARILI', '1300', 'SUCCESS'].includes(intStatus) || 
                                  (inv.document_number && !isRejected && !isUnknown);
                const isExpanded = expandedRowIds.includes(inv.id);
                const items = inv.items && inv.items.length > 0 ? inv.items : (itemsCache[inv.id] || []);
                const isRowLoading = loadingRowId === inv.id;

                return (
                  <React.Fragment key={inv.id}>
                    <tr 
                      className={`transition-colors group ${
                        lastEditedId === inv.id ? 'bg-indigo-100/50 ring-1 ring-inset ring-indigo-300' :
                        isExpanded ? 'bg-indigo-50/40 border-l-2 border-l-indigo-600' :
                        isApproved ? 'bg-emerald-50/50' : 
                        isQueued ? 'bg-amber-50/50' : 
                        isRejected ? 'bg-rose-50/50' : 
                        'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(inv.id)}
                          onChange={() => {
                            setSelectedIds(prev => prev.includes(inv.id) ? prev.filter(i => i !== inv.id) : [...prev, inv.id]);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(inv)}
                          className={`p-1 rounded-lg transition-all duration-200 ${
                            isExpanded 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={isExpanded ? (isTr ? "Ürün Kalemlerini Gizle" : "Hide Items") : (isTr ? "Ürün Kalemlerini Göster" : "Show Items")}
                        >
                          {isRowLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-3 py-2.5 max-w-[170px]">
                        <div className="text-xs font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => toggleRow(inv)}
                            className="font-mono text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md border border-indigo-200/70 truncate max-w-[155px] transition-colors cursor-pointer"
                            title={`#${inv.invoice_number}`}
                          >
                            #{inv.invoice_number}
                          </button>
                          {(inv.gi_invoice_type === 'IADE' || inv.invoice_type === 'IADE') && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              - İADE -
                            </span>
                          )}
                          {items && items.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Package className="w-2.5 h-2.5 text-slate-400" />
                              {items.length} {isTr ? 'kalem' : 'items'}
                            </span>
                          )}
                        </div>
                        {inv.document_number && (
                           <div className="text-[9px] text-indigo-600 font-bold tracking-widest mt-0.5">{inv.document_number}</div>
                        )}
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.payment_method}</div>
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex justify-center mb-0.5">
                          {inv.status === 'draft' ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                              <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                              {isTr ? 'TASLAK' : 'DRAFT'}
                            </div>
                          ) : inv.status === 'approved' ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                              {isTr ? 'ONAYLI' : 'APPROVED'}
                            </div>
                          ) : inv.status === 'cancelled' ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                              <XCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                              {isTr ? 'İPTAL' : 'CANCELLED'}
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-600">{inv.status}</span>
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
                            <div className="flex flex-col gap-0.5 mt-0.5 font-sans items-center">
                              <div className={`inline-flex px-1.5 py-0.2 rounded text-[8px] font-bold tracking-widest border w-fit ${
                                isEFatura ? 'border-purple-200 bg-purple-50 text-purple-700' : 
                                'border-blue-200 bg-blue-50 text-blue-700'
                              }`}>
                                {computedDocType}
                              </div>
                              {(inv.integration_status || isApproved || isUnknown) && (
                                <div className={`inline-flex px-1.5 py-0.2 rounded text-[8px] font-bold tracking-widest border w-fit ${
                                  isQueued ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                  isApproved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                  isRejected ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                  'border-slate-200 bg-slate-100 text-slate-600'
                                }`}>
                                  {isQueued ? (isTr ? 'GİB KUYRUK' : 'QUEUED') :
                                   isApproved ? (isTr ? 'GİB ONAY' : 'APPROVED') : 
                                   isRejected ? (isTr ? 'REDDEDİLDİ' : 'REJECTED') :
                                   isUnknown ? (inv.document_number ? (isTr ? 'GİB\'E GİTTİ' : 'SENT') : (isTr ? 'GÖNDERİLMEDİ' : 'NOT SENT')) :
                                   inv.integration_status}
                                </div>
                              )}
                              {inv.waybill_number && (
                                <div className="flex flex-col gap-0.5 mt-0.5 pt-0.5 border-t border-slate-100 items-center">
                                  <div className="inline-flex px-1 py-0.2 rounded text-[8px] font-black tracking-widest border border-indigo-200 bg-indigo-50 text-indigo-700">
                                    {inv.waybill_number}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-1.5">
                          {inv.company_id || (inv.tax_number && inv.tax_number.length === 10 && inv.tax_number !== '11111111111') ? (
                            <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          ) : (
                            <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div 
                              className="text-xs font-semibold text-slate-800 max-w-[180px] sm:max-w-[220px] lg:max-w-[280px] truncate"
                              title={`${inv.customer_name || inv.company_title || inv.sale_customer_name || '-'}${inv.tax_number ? ` (VKN/TC: ${inv.tax_number})` : ''}${inv.address ? ` - ${inv.address}` : ''}`}
                            >
                              {inv.customer_name || inv.company_title || inv.sale_customer_name || '-'}
                            </div>
                            {inv.tax_number && inv.tax_number !== '11111111111' && (
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <span className="font-semibold text-slate-500">VKN/TC:</span> {inv.tax_number}
                                {inv.tax_office && <span className="truncate max-w-[100px]">({inv.tax_office})</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-700 font-mono tabular-nums">
                          {Number(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-600 font-mono tabular-nums">
                          {Number(inv.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                          {Number(inv.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-500 whitespace-nowrap">
                        {inv.currency}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Action 1: HTML Preview */}
                          {!isPortfolio && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHtml(inv.id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-indigo-200"
                              title={isTr ? "E-Fatura Görselini Aç (HTML)" : "View E-Invoice HTML"}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick Action 2: Print / PDF */}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(inv, true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-emerald-200"
                            title={isTr ? "Yazdır / PDF" : "Print / PDF"}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Collapsible Actions Dropdown Menu Trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(openActionMenuId === inv.id ? null : inv.id);
                              }}
                              className={`action-menu-trigger p-1.5 rounded-lg transition-all flex items-center gap-1 border ${
                                openActionMenuId === inv.id
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 bg-white border-slate-200 shadow-2xs'
                              }`}
                              title={isTr ? "Tüm İşlemler Menüsü" : "All Actions Menu"}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold hidden sm:inline-block pr-0.5">{isTr ? 'İşlem' : 'More'}</span>
                            </button>

                            {/* Dropdown Popup Menu */}
                            {openActionMenuId === inv.id && (
                              <div 
                                className={`action-menu-dropdown absolute right-0 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 ${
                                  idx >= invoices.length - 2 ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    {inv.invoice_number || (isTr ? 'Fatura İşlemleri' : 'Invoice Actions')}
                                  </span>
                                  {inv.currency && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                      {inv.currency}
                                    </span>
                                  )}
                                </div>

                                <div className="py-1">
                                  {/* View HTML */}
                                  {!isPortfolio && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleViewHtml(inv.id);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span>{isTr ? "E-Fatura Görselini Aç" : "View E-Invoice HTML"}</span>
                                    </button>
                                  )}

                                  {/* Print / PDF */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleViewDetails(inv, true);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{isTr ? "Yazdır & PDF Oluştur" : "Print & PDF"}</span>
                                  </button>

                                  {/* System Record Details */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleViewDetails(inv);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <FileSearch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{isTr ? "Sistem Kayıt Detayları" : "System Details"}</span>
                                  </button>
                                </div>

                                {/* GİB & Entegratör İşlemleri */}
                                {(!isPortfolio && branding?.einvoice_settings?.is_active) && (
                                  <div className="py-1 border-t border-slate-100 bg-slate-50/50">
                                    {inv.status !== 'draft' && !isApproved && !isQueued && !isRejected && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenActionMenuId(null);
                                            handleSendToGIB(inv.id);
                                          }}
                                          className="w-full px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <CloudUpload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                          <span>{isTr ? "GİB'e Gönder (E-Fatura)" : "Push to GİB"}</span>
                                        </button>
                                        {branding?.einvoice_settings?.is_ewaybill_active && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null);
                                              handleOpenWaybillModal && handleOpenWaybillModal(inv);
                                            }}
                                            className="w-full px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                          >
                                            <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                            <span>{isTr ? "Sevk İrsaliyesi Oluştur" : "Create Shipment Waybill"}</span>
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {(isApproved || isQueued) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          handleCancelGIB(inv.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        <span>{isTr ? "E-Arşiv İptal Et" : "Cancel E-Archive"}</span>
                                      </button>
                                    )}

                                    {isQueued && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          handleCheckEInvoiceStatus(inv.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>{isTr ? "GİB Durumunu Sorgula" : "Check GİB Status"}</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Marketplace Ship */}
                                {inv.invoice_type === 'marketplace' && handleMarketplaceShip && (
                                  <div className="py-1 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null);
                                        handleMarketplaceShip(inv);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>{isTr ? "Kargo Bildirimi Yap" : "Marketplace Ship"}</span>
                                    </button>
                                  </div>
                                )}

                                {/* Edit & Delete */}
                                <div className="py-1 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleEdit(inv.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <span>{isTr ? "Faturayı Düzenle" : "Edit Invoice"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDelete(inv.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>{isTr ? "Faturayı Sil" : "Delete Invoice"}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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

import React, { useEffect, useState, useRef } from 'react';
import { X, Package, ArrowUpCircle, ArrowDownCircle, FileDown, FileText, ExternalLink, Loader2, Receipt } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { translations } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

import { PurchaseInvoiceDetailsModal } from './dashboard/invoices/purchase/PurchaseInvoiceDetailsModal';
import { SalesInvoiceDetailsModal } from './dashboard/invoices/sales/SalesInvoiceDetailsModal';
import { SalesInvoiceHtmlModal } from './dashboard/invoices/sales/SalesInvoiceHtmlModal';

interface Movement {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  source: string;
  description: string;
  unit_price?: number;
  customer_info?: string;
  currency?: string;
  created_at: string;
  invoice_id?: number | null;
  invoice_type?: 'purchase' | 'sales' | null;
  invoice_number?: string | null;
}

interface ProductMovementModalProps {
  product: any;
  onClose: () => void;
  branding: any;
}

const ProductMovementModal = ({ product, onClose, branding }: ProductMovementModalProps) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const t = translations[lang].dashboard;
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Invoice view states
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<any>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState<any>(null);
  const [showSalesDetails, setShowSalesDetails] = useState(false);

  // HTML e-invoice preview modal state
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);

  // Print ref for sales invoice
  const salesInvoiceRef = useRef<HTMLDivElement>(null);
  const handlePrintSales = useReactToPrint({ contentRef: salesInvoiceRef });

  useEffect(() => {
    api.get(`/api/store/products/${product.id}/movements`)
      .then(data => {
        if (Array.isArray(data)) {
          setMovements(data);
        } else {
          console.error("Expected array but got:", data);
          setMovements([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [product.id]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.download(`/api/store/products/${product.id}/movements/export?lang=${lang}`, `${lang === 'tr' ? 'hareketler' : 'movements'}_${product.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error(err);
      toast.error(lang === 'tr' ? 'Dışa aktarma başarısız oldu' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getInvoiceDetailsFromMovement = (m: Movement) => {
    let type: 'purchase' | 'sales' | null = m.invoice_type || null;
    let number: string | null = m.invoice_number || null;
    const desc = m.description || '';

    if (!type) {
      if (m.source === 'purchase_invoice' || /alış faturası|fatura girişi|e-fatura içe|e-fatura detay/i.test(desc)) {
        type = 'purchase';
      } else if (m.source === 'sales_invoice' || /satış faturası/i.test(desc)) {
        type = 'sales';
      }
    }

    if (!number) {
      const match = desc.match(/(?:Faturası?|Girişi|Sorgulama|Aktarma|Güncellendi)?:\s*([A-Za-z0-9\-_]+)/i);
      if (match) {
        number = match[1].trim();
      }
    }

    const hasInvoice = Boolean(m.invoice_id || (type && number) || m.source === 'purchase_invoice' || m.source === 'sales_invoice');
    return { type, number, hasInvoice };
  };

  const handleViewPurchaseHtml = async (invoiceId: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    try {
      const res = await api.getPurchaseInvoiceHtml(invoiceId);
      if (res?.html) {
        setHtmlContent(res.html);
      } else {
        toast.error(isTr ? 'Fatura görseli bulunamadı.' : 'Invoice HTML not found.');
        setShowHtmlModal(false);
      }
    } catch (err: any) {
      toast.error(err.message || (isTr ? 'Görsel yüklenemedi' : 'Failed to load preview'));
      setShowHtmlModal(false);
    } finally {
      setHtmlLoading(false);
    }
  };

  const handleOpenInvoice = async (m: Movement) => {
    const { type, number } = getInvoiceDetailsFromMovement(m);
    if (!type && !m.invoice_id) return;

    setLoadingInvoiceId(m.id);
    try {
      if (type === 'purchase' || (!type && m.source === 'purchase_invoice')) {
        let inv: any = null;
        if (m.invoice_id) {
          try {
            inv = await api.getPurchaseInvoice(m.invoice_id);
          } catch (e) {
            console.warn("Direct purchase invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getPurchaseInvoices(undefined, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getPurchaseInvoice(match.id);
          }
        }

        if (inv && !inv.error && inv.id) {
          setSelectedPurchaseInvoice(inv);
          setShowPurchaseDetails(true);
        } else {
          toast.error(isTr ? 'Alış faturası bulunamadı.' : 'Purchase invoice not found.');
        }
      } else if (type === 'sales' || (!type && m.source === 'sales_invoice')) {
        let inv: any = null;
        if (m.invoice_id) {
          try {
            inv = await api.getSalesInvoice(m.invoice_id);
          } catch (e) {
            console.warn("Direct sales invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getSalesInvoices(undefined, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getSalesInvoice(match.id);
          }
        }

        if (inv && !inv.error && inv.id) {
          setSelectedSalesInvoice(inv);
          setShowSalesDetails(true);
        } else {
          toast.error(isTr ? 'Satış faturası bulunamadı.' : 'Sales invoice not found.');
        }
      }
    } catch (err: any) {
      console.error("Open invoice error:", err);
      toast.error(err.message || (isTr ? 'Fatura açılırken hata oluştu.' : 'Failed to load invoice.'));
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-slate-900">{product.name} - {isTr ? 'Hareket Geçmişi' : 'Movement History'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {product.barcode && (
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {product.barcode}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {isTr ? 'Mevcut Stok:' : 'Current Stock:'} <span className="font-bold text-slate-700">{product.stock_quantity ?? 0} {product.unit || ''}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExport}
                disabled={exporting || movements.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                <FileDown className="h-4 w-4" />
                {exporting ? (isTr ? 'İndiriliyor...' : 'Downloading...') : 'Excel'}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-slate-500">{t.loading}</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-12 text-slate-400">{isTr ? 'Hareket bulunamadı' : 'No movements found'}</div>
            ) : (
              <div className="space-y-4">
                {movements.map(m => {
                  const { type: invType, number: invNumber, hasInvoice } = getInvoiceDetailsFromMovement(m);
                  return (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition-colors gap-3">
                      <div className="flex items-start gap-3.5">
                        {m.type === 'in' ? (
                          <ArrowUpCircle className="h-8 w-8 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{m.description}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(m.created_at).toLocaleString(isTr ? 'tr-TR' : 'en-US')} - {t.statements.source}: {t.sources[m.source] || m.source}
                          </div>
                          {(m.customer_info || m.unit_price != null) && (
                            <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                              {m.customer_info && (
                                <span><span className="font-medium text-slate-500">{t.statements.customerSupplier}:</span> {m.customer_info}</span>
                              )}
                              {m.unit_price != null && (
                                <span><span className="font-medium text-slate-500">{t.statements.unitPrice}:</span> {Number(m.unit_price).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {m.currency || branding?.default_currency || 'TRY'}</span>
                              )}
                            </div>
                          )}

                          {hasInvoice && (
                            <div className="pt-1.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(m)}
                                disabled={loadingInvoiceId === m.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs border ${
                                  invType === 'purchase'
                                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
                                }`}
                                title={isTr ? 'Fatura detaylarını ürün penceresinden çıkmadan görüntüleyin' : 'View invoice details directly'}
                              >
                                {loadingInvoiceId === m.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-current" />
                                )}
                                <span>
                                  {invType === 'purchase'
                                    ? (isTr ? 'Alış Faturasını Aç' : 'Open Purchase Invoice')
                                    : (isTr ? 'Satış Faturasını Aç' : 'Open Sales Invoice')}
                                  {invNumber ? ` (${invNumber})` : ''}
                                </span>
                                <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 shrink-0">
                        <span className="text-xs text-slate-400 font-medium sm:hidden">{isTr ? 'Miktar' : 'Quantity'}</span>
                        <div className={`font-black text-base sm:text-lg ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.type === 'in' ? '+' : '-'}{Math.floor(Number(m.quantity))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Invoice Details Modal */}
      <PurchaseInvoiceDetailsModal 
        isOpen={showPurchaseDetails}
        onClose={() => setShowPurchaseDetails(false)}
        invoice={selectedPurchaseInvoice}
        isTr={isTr}
        handleViewHtml={handleViewPurchaseHtml}
      />

      {/* Sales Invoice Details Modal */}
      <SalesInvoiceDetailsModal 
        isOpen={showSalesDetails}
        onClose={() => setShowSalesDetails(false)}
        invoice={selectedSalesInvoice}
        isTr={isTr}
        invoiceRef={salesInvoiceRef}
        handlePrint={handlePrintSales}
      />

      {/* E-Invoice HTML Preview Modal */}
      <SalesInvoiceHtmlModal 
        isOpen={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        htmlContent={htmlContent}
        htmlLoading={htmlLoading}
        isTr={isTr}
      />
    </>
  );
};

export default ProductMovementModal;

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, QrCode, Globe, Check, Copy, Printer, Download, 
  Scan, FileDown, History, Plus, Edit2, Trash2, 
  DollarSign, ChevronRight, PlusCircle, MinusCircle,
  FileText, Clock, AlertCircle, Search, Building, Users, Eye, EyeOff
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ShippingSlip from "../../components/ShippingSlip";
import { MultiImageUploader } from "../../components/MultiImageUploader";

interface DashboardModalsProps {
  // Common
  branding: any;
  translations: any;
  lang: string;

  // QR Modal
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  scanUrl: string;
  publicUrl: string;
  isPortfolio: boolean;
  handlePrintQR: () => void;
  qrPrintRef: React.RefObject<HTMLDivElement | null>;

  // Purchase Invoice Details
  showPurchaseInvoiceDetailsModal: boolean;
  setShowPurchaseInvoiceDetailsModal: (show: boolean) => void;
  selectedPurchaseInvoice: any;

  // Sale Details Modal
  showSaleDetailsModal: boolean;
  setShowSaleDetailsModal: (show: boolean) => void;
  selectedSale: any;
  handlePrint: () => void;
  shippingSlipRef: React.RefObject<HTMLDivElement | null>;

  // Quotation Details Modal
  showQuotationDetailsModal: boolean;
  setShowQuotationDetailsModal: (show: boolean) => void;
  selectedQuotationDetails: any;
  onDownloadQuotationPDF: (q: any) => void;
  numberToTurkishWords: (n: number, currency?: string) => string;
  quotationPrintRef: React.RefObject<HTMLDivElement | null>;

  // Daily Report Modal
  showDailyReportModal: boolean;
  setShowDailyReportModal: (show: boolean) => void;
  dailyReportData: { summary: any[], details: any[] };
  reportStartDate: string;
  setReportStartDate: (d: string) => void;
  reportEndDate: string;
  setReportEndDate: (d: string) => void;
  fetchDailySalesReport: () => void;
  reportLoading: boolean;
  handleDownloadDailyReportExcel: () => void;

  // Transaction Modal
  showTransactionModal: boolean;
  setShowTransactionModal: (show: boolean) => void;
  selectedCompany: any;
  companyTransactions: any[];
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  transactionStartDate: string;
  setTransactionStartDate: (d: string) => void;
  transactionEndDate: string;
  setTransactionEndDate: (d: string) => void;
  handleFetchTransactions: (id: number) => void;
  transactionLoading: boolean;
  handleExportTransactionsPDF: () => void;
  openingBalances: Record<string, number>;
  companies: any[];
  setShowAddTransactionModal: (show: boolean) => void;
  handleEditTransaction: (id: number, data: any) => void;
  handleDeleteTransaction: (id: number) => void;

  // Add Transaction Modal
  showAddTransactionModal: boolean;
  newTransactionType: 'credit' | 'debt';
  setNewTransactionType: (t: 'credit' | 'debt') => void;
  newTransactionAmount: string;
  setNewTransactionAmount: (a: string) => void;
  newTransactionCurrency: string;
  setNewTransactionCurrency: (c: string) => void;
  newTransactionExchangeRate: string;
  setNewTransactionExchangeRate: (r: string) => void;
  newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term';
  setNewTransactionPaymentMethod: (m: 'cash' | 'credit_card' | 'bank' | 'term') => void;
  newTransactionDescription: string;
  setNewTransactionDescription: (d: string) => void;
  newTransactionDate: string;
  setNewTransactionDate: (d: string) => void;
  handleAddTransaction: (e: React.FormEvent) => void;

  // Sale Modal (Confirm Sale from Quotation)
  showSaleModal: boolean;
  setShowSaleModal: (show: boolean) => void;
  selectedQuotation: any;
  handleConfirmSale: (e: React.FormEvent) => void;
  isConfirmingSale: boolean;
  dueDate: string;
  setDueDate: (d: string) => void;
  saleNotes: string;
  setSaleNotes: (n: string) => void;
  createCompanyFromSale: boolean;
  setCreateCompanyFromSale: (c: boolean) => void;

  // Bulk Price Modal
  showBulkPriceModal: boolean;
  setShowBulkPriceModal: (show: boolean) => void;
  bulkPriceForm: any;
  setBulkPriceForm: (f: any) => void;
  handleBulkPriceSubmit: (e: React.FormEvent) => void;
  products: any[];

  // Missing Modals Props
  showProductModal?: boolean;
  setShowProductModal?: (show: boolean) => void;
  editingProduct?: any;
  setEditingProduct?: (p: any) => void;
  handleAddProduct?: (e: React.FormEvent) => void;

  showCompanyModal?: boolean;
  setShowCompanyModal?: (show: boolean) => void;
  editingCompany?: any;
  setEditingCompany?: (c: any) => void;
  handleAddCompany?: (e: React.FormEvent) => void;

  showUserModal?: boolean;
  setShowUserModal?: (show: boolean) => void;
  handleAddUser?: (e: React.FormEvent) => void;

  showQuotationModal?: boolean;
  setShowQuotationModal?: (show: boolean) => void;
  editingQuotation?: any;
  setEditingQuotation?: (q: any) => void;
  quotationItems?: any[];
  setQuotationItems?: any;
  handleAddQuotation?: (e: React.FormEvent) => void;
  isTaxInclusive?: boolean;
  setIsTaxInclusive?: (b: boolean) => void;
  quotationNotes?: string;
  setQuotationNotes?: (notes: string) => void;
  showQuickProductModal?: boolean;
  setShowQuickProductModal?: (b: boolean) => void;
  quickProductForm?: any;
  setQuickProductForm?: any;
  handleQuickAddProduct?: (e: React.FormEvent) => void;
}

export const DashboardModals = (props: DashboardModalsProps) => {
  const {
    branding, translations: t, lang,
    showQrModal, setShowQrModal, scanUrl, publicUrl, isPortfolio, handlePrintQR, qrPrintRef,
    showPurchaseInvoiceDetailsModal, setShowPurchaseInvoiceDetailsModal, selectedPurchaseInvoice,
    showSaleDetailsModal, setShowSaleDetailsModal, selectedSale, handlePrint, shippingSlipRef,
    showQuotationDetailsModal, setShowQuotationDetailsModal, selectedQuotationDetails, onDownloadQuotationPDF, numberToTurkishWords, quotationPrintRef,
    showDailyReportModal, setShowDailyReportModal, dailyReportData, reportStartDate, setReportStartDate, reportEndDate, setReportEndDate, fetchDailySalesReport, reportLoading, handleDownloadDailyReportExcel,
    showTransactionModal, setShowTransactionModal, selectedCompany, companyTransactions, selectedCurrency, setSelectedCurrency, transactionStartDate, setTransactionStartDate, transactionEndDate, setTransactionEndDate, handleFetchTransactions, transactionLoading, handleExportTransactionsPDF, openingBalances, companies, setShowAddTransactionModal, handleEditTransaction, handleDeleteTransaction,
    showAddTransactionModal, newTransactionType, setNewTransactionType, newTransactionAmount, setNewTransactionAmount, newTransactionCurrency, setNewTransactionCurrency, newTransactionExchangeRate, setNewTransactionExchangeRate, newTransactionPaymentMethod, setNewTransactionPaymentMethod, newTransactionDescription, setNewTransactionDescription, newTransactionDate, setNewTransactionDate, handleAddTransaction,
    showSaleModal, setShowSaleModal, selectedQuotation, handleConfirmSale, isConfirmingSale, dueDate, setDueDate, saleNotes, setSaleNotes, createCompanyFromSale, setCreateCompanyFromSale,
    showBulkPriceModal, setShowBulkPriceModal, bulkPriceForm, setBulkPriceForm, handleBulkPriceSubmit, products,
    
    // Missing Modals Props
    showProductModal, setShowProductModal, editingProduct, setEditingProduct, handleAddProduct,
    showCompanyModal, setShowCompanyModal, editingCompany, setEditingCompany, handleAddCompany,
    showUserModal, setShowUserModal, handleAddUser,
    showQuotationModal, setShowQuotationModal, editingQuotation, setEditingQuotation, quotationItems = [], setQuotationItems, handleAddQuotation, isTaxInclusive = false, setIsTaxInclusive, quotationNotes, setQuotationNotes,
    showQuickProductModal, setShowQuickProductModal, quickProductForm, setQuickProductForm, handleQuickAddProduct
  } = props;

  const [copied, setCopied] = useState(false);
  const isTr = lang === 'tr';

  // Local state for missing modals
  const [showPassword, setShowPassword] = useState(false);
  const [compSearch, setCompSearch] = useState("");
  const [prodSearch, setProdSearch] = useState("");

  const [productImageUrl, setProductImageUrl] = useState("");
  React.useEffect(() => {
    if (showProductModal) {
      setProductImageUrl(editingProduct?.image_url || "");
    } else {
      setProductImageUrl("");
    }
  }, [showProductModal, editingProduct]);

  return (
    <AnimatePresence>
      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden"
          >
            <div className="p-4 sm:p-8 text-center flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="text-left">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">{t.storeQR}</h3>
                  <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{t.shareWithCustomers}</p>
                </div>
                <button onClick={() => setShowQrModal(false)} className="p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all">
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 sm:p-8 rounded-[1.5rem] inline-block w-full max-w-[280px] mb-6 shadow-inner border border-gray-100">
                <div ref={qrPrintRef} className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center">
                  <div className="mb-4 text-center">
                    <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tighter">
                      {branding.store_name || branding.name || "LookPrice"}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.storeQR || "Mağaza QR Kodu"}</p>
                  </div>
                  <QRCodeSVG 
                    value={scanUrl}
                    size={200}
                    style={{ width: '100%', height: 'auto', maxWidth: '240px' }}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: branding.logo_url || "",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                  <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    lookprice.net
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.website?.toUpperCase() || 'WEBSITE'}</p>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <Globe className="h-5 w-5 text-indigo-500 shrink-0" />
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:underline truncate flex-1 text-left">
                      {publicUrl}
                    </a>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
                    >
                      {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {!isPortfolio && (
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.barcodeScanner?.toUpperCase()}</p>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <Scan className="h-5 w-5 text-slate-500 shrink-0" />
                      <a href={scanUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-600 hover:underline truncate flex-1 text-left">
                        {scanUrl}
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(scanUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"
                      >
                        {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handlePrintQR} className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
                    <Printer className="h-5 w-5" />
                    <span>{t.print}</span>
                  </button>
                  <button 
                    onClick={() => {
                      const svg = qrPrintRef.current?.querySelector('svg');
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL("image/png");
                          const downloadLink = document.createElement("a");
                          downloadLink.download = "Store_QR.png";
                          downloadLink.href = pngFile;
                          downloadLink.click();
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                      }
                    }}
                    className="flex items-center justify-center space-x-2 p-4 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Download className="h-5 w-5" />
                    <span>{t.download}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Purchase Invoice Details Modal */}
      {showPurchaseInvoiceDetailsModal && selectedPurchaseInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.purchaseDetails || "Alış Faturası Detayları"}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  #{selectedPurchaseInvoice.invoice_number || selectedPurchaseInvoice.id} • {new Date(selectedPurchaseInvoice.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                </p>
              </div>
              <button 
                onClick={() => setShowPurchaseInvoiceDetailsModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.total?.toUpperCase() || 'TOTAL'}</span>
                  <span className="text-xl font-black">
                    {Number(selectedPurchaseInvoice.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.supplier || "Tedarikçi"}</p>
                <p className="text-sm font-bold text-gray-900">{selectedPurchaseInvoice.supplier_name || selectedPurchaseInvoice.company_title}</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.products || "Ürünler"}</p>
                {(selectedPurchaseInvoice.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {Number(item.unit_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">
                      {Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedPurchaseInvoice.currency?.slice(0, 3)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showSaleDetailsModal && selectedSale && (
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
                <button onClick={handlePrint} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <Printer className="h-5 w-5 text-gray-400" />
                </button>
                <button onClick={() => setShowSaleDetailsModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div style={{ display: 'none' }}>
                <ShippingSlip ref={shippingSlipRef} sale={selectedSale} store={branding} />
              </div>
              <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.total?.toUpperCase() || 'TOTAL'}</span>
                  <span className="text-xl font-black">{Number(selectedSale.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.slice(0, 3)}</span>
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
                    <p className="text-sm font-black text-gray-900">{Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {selectedSale.currency?.slice(0, 3)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quotation Details Modal */}
      {showQuotationDetailsModal && selectedQuotationDetails && (
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
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
                >
                  <Download className="h-4 w-4" />
                  {isTr ? 'İndir' : 'Download'}
                </button>
                <button 
                  onClick={() => setShowQuotationDetailsModal(false)} 
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
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
                    <span className="text-indigo-600 text-lg font-black">
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
      )}

      {/* Daily Report Modal */}
      {showDailyReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.dailySalesReport}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{branding.store_name}</p>
              </div>
              <button onClick={() => setShowDailyReportModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.startDate}</label>
                  <input 
                    type="date" 
                    value={reportStartDate} 
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.endDate}</label>
                  <input 
                    type="date" 
                    value={reportEndDate} 
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" 
                  />
                </div>
                <button 
                  onClick={fetchDailySalesReport}
                  disabled={reportLoading}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {reportLoading ? t.loading : t.getReport}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['cash', 'credit_card', 'bank', 'term'].map((method) => {
                  const data = (dailyReportData.summary || []).find(d => d.payment_method === method) || { total_amount: 0, transaction_count: 0 };
                  return (
                    <div key={method} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t[method] || method}</span>
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg">
                          {data.transaction_count} {t.transactionCount}
                        </span>
                      </div>
                      <p className="text-xl font-black text-gray-900">
                        {Number(data.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TOPLAM GENEL' : 'GRAND TOTAL'}</p>
                    <p className="text-3xl font-black">
                      {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{t.transactionCount}</p>
                    <p className="text-xl font-black">
                      {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.transaction_count), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button 
                onClick={handleDownloadDailyReportExcel}
                disabled={!dailyReportData.details || dailyReportData.details.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <FileDown className="h-5 w-5" /> {lang === 'tr' ? 'Excel İndir' : 'Download Excel'}
              </button>
              <button 
                onClick={() => setShowDailyReportModal(false)}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {t.close || 'Kapat'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedCompany && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCompany.title || selectedCompany.name}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.accountTransactions}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAddTransactionModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t.newTransaction || "Yeni Hareket"}
                </button>
                <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(selectedCompany.balances || {}).length > 0 ? (
                    Object.keys(selectedCompany.balances).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))
                  ) : (
                    <option value={branding.default_currency || 'TRY'}>{branding.default_currency || 'TRY'}</option>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.startDate}</label>
                <input 
                  type="date" 
                  value={transactionStartDate}
                  onChange={(e) => setTransactionStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.endDate}</label>
                <input 
                  type="date" 
                  value={transactionEndDate}
                  onChange={(e) => setTransactionEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={() => handleFetchTransactions(selectedCompany.id)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
              >
                <History className={`h-4 w-4 ${transactionLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleExportTransactionsPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
              >
                <FileDown className="h-4 w-4" />
                {t.pdfStatement || "PDF Ekstre"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const filteredTransactions = companyTransactions.filter(tx => (tx.currency || 'TRY') === selectedCurrency);
                const currentBalance = Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances?.[selectedCurrency] || 0);
                return (
                  <>
                    <div className="flex flex-wrap gap-2 pb-2">
                      {Object.entries((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances || {}).map(([curr, bal]) => {
                        const nBal = Number(bal);
                        const isSelected = curr === selectedCurrency;
                        return (
                          <button
                            key={curr}
                            onClick={() => setSelectedCurrency(curr)}
                            className={`flex items-center gap-3 pl-4 pr-3 py-2 rounded-2xl border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex flex-col items-start leading-none gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                {curr}
                              </span>
                              <span className="text-sm font-black tabular-nums">
                                {Math.abs(nBal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                              </span>
                            </div>
                            <div className={`flex flex-col items-center justify-center p-1.5 rounded-lg ${
                              isSelected ? 'bg-white/20' : nBal > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              <span className="text-[8px] font-black uppercase leading-none">
                                {nBal > 0 ? (isTr ? 'B' : 'D') : (isTr ? 'A' : 'C')}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg">
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">{t.statements.balance.toUpperCase()}</p>
                        <p className="text-2xl font-black">
                          {currentBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency.slice(0, 3)}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.statements.debt.toUpperCase()}</p>
                        <p className="text-2xl font-black text-red-600">
                          {filteredTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency.slice(0, 3)}
                        </p>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.statements.credit.toUpperCase()}</p>
                        <p className="text-2xl font-black text-green-600">
                          {filteredTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency.slice(0, 3)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {transactionLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                          <p className="text-gray-500 font-medium">{t.loading}</p>
                        </div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">{isTr ? 'Hareket bulunmuyor' : 'No transactions found'}</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.statements.date}</th>
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.statements.description}</th>
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.debt}</th>
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.credit}</th>
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.statements.balance}</th>
                                <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{isTr ? 'İşlem' : 'Action'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                let runningBalance = openingBalances[selectedCurrency] || 0;
                                return filteredTransactions.map((tx: any) => {
                                  const amount = Number(tx.amount);
                                  if (tx.type === 'debt') runningBalance += amount;
                                  else runningBalance -= amount;

                                  return (
                                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-all group">
                                      <td className="py-4 px-4">
                                        <p className="text-xs font-bold text-gray-900">{new Date(tx.transaction_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</p>
                                      </td>
                                      <td className="py-4 px-4">
                                        <p className="text-xs font-bold text-gray-700">{tx.description}</p>
                                      </td>
                                      <td className="py-4 px-4 text-right">
                                        {tx.type === 'debt' ? (
                                          <span className="text-xs font-black text-red-600">
                                            {amount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-4 px-4 text-right">
                                        {tx.type === 'credit' ? (
                                          <span className="text-xs font-black text-green-600">
                                            {amount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-4 px-4 text-right">
                                        <span className={`text-xs font-black ${runningBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                          {runningBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => {
                                              const newDesc = prompt(isTr ? 'Yeni açıklama:' : 'New description:', tx.description);
                                              const newAmount = prompt(isTr ? 'Yeni tutar:' : 'New amount:', tx.amount);
                                              if (newDesc !== null && newAmount !== null) {
                                                handleEditTransaction(tx.id, { description: newDesc, amount: Number(newAmount), type: tx.type });
                                              }
                                            }}
                                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteTransaction(tx.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && selectedCompany && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-900">{t.addNewTransaction}</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedCompany.title || selectedCompany.name}</p>
              </div>
              <button onClick={() => setShowAddTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTransactionType('credit')}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    newTransactionType === 'credit' 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'bg-white border-gray-100 text-gray-600'
                  }`}
                >
                  {isTr ? 'Tahsilat (Giriş)' : 'Collection (In)'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewTransactionType('debt')}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    newTransactionType === 'debt' 
                      ? 'bg-red-600 border-red-600 text-white' 
                      : 'bg-white border-gray-100 text-gray-600'
                  }`}
                >
                  {isTr ? 'Ödeme (Çıkış)' : 'Payment (Out)'}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isTr ? 'Tutar' : 'Amount'}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required 
                    value={newTransactionAmount}
                    onChange={(e) => setNewTransactionAmount(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" 
                    placeholder="0.00"
                  />
                  <select
                    value={newTransactionCurrency}
                    onChange={(e) => setNewTransactionCurrency(e.target.value)}
                    className="w-24 px-2 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {newTransactionCurrency !== (branding?.default_currency || 'TRY') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">{isTr ? 'Döviz Kuru' : 'Exchange Rate'}</label>
                  <input 
                    type="text" 
                    required 
                    value={newTransactionExchangeRate}
                    onChange={(e) => setNewTransactionExchangeRate(e.target.value.replace(',', '.'))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" 
                    placeholder="1.00"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{t.paymentMethod || 'Ödeme Yöntemi'}</label>
                <select
                  value={newTransactionPaymentMethod}
                  onChange={(e) => setNewTransactionPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                >
                  <option value="cash">{t.cash}</option>
                  <option value="credit_card">{t.credit_card}</option>
                  <option value="bank">{t.bank}</option>
                  <option value="term">{t.term}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{t.statements.description}</label>
                <textarea 
                  required
                  value={newTransactionDescription}
                  onChange={(e) => setNewTransactionDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" 
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{t.statements.date}</label>
                <input 
                  type="date" 
                  required
                  value={newTransactionDate}
                  onChange={(e) => setNewTransactionDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
              >
                {t.save}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && selectedQuotation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">{t.convertToSale}</h3>
              <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleConfirmSale} className="p-6 space-y-5">
              <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.amount}</span>
                  <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-lg">#{selectedQuotation.id}</span>
                </div>
                <p className="text-2xl font-black">
                  {Number(selectedQuotation.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedQuotation.currency}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isTr ? "Vade Tarihi" : "Due Date"}</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="date" 
                      required 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.notes}</label>
                  <textarea 
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" 
                    rows={3}
                    placeholder={isTr ? "Fatura notları (opsiyonel)..." : "Invoice notes (optional)..."}
                  />
                </div>

                {selectedQuotation.customer_name && !selectedQuotation.company_id && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        createCompanyFromSale ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200 group-hover:border-indigo-300'
                      }`}>
                        {createCompanyFromSale && <Check className="h-4 w-4 text-white" />}
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={createCompanyFromSale}
                          onChange={(e) => setCreateCompanyFromSale(e.target.checked)}
                        />
                      </div>
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-tighter">
                        {isTr ? "Müşteriyi Cari Kart Olarak Kaydet" : "Register Customer as Company Chart"}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isConfirmingSale}
                  className="flex-[2] px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isConfirmingSale ? t.loading : t.confirm}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  {isTr ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-11">
                  Product_Pricing / Global_Action
                </p>
              </div>
              <button 
                onClick={() => setShowBulkPriceModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleBulkPriceSubmit} className="p-8 space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4">
                <div className="p-2 bg-amber-100 rounded-xl shrink-0 h-fit">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-tighter mb-1">
                    {isTr ? 'Önemli Uyarı' : 'Important Note'}
                  </p>
                  <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
                    {isTr 
                      ? 'Bu işlem seçilen tüm ürünlerin fiyatlarını kalıcı olarak değiştirecektir. Değişiklikler geri alınamaz.'
                      : 'This action will permanently change prices of selected products. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Hedef Ürünler' : 'Target Products'}</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none"
                      value={bulkPriceForm.target}
                      onChange={(e) => setBulkPriceForm({...bulkPriceForm, target: e.target.value})}
                    >
                      <option value="all">{isTr ? 'Tüm Ürünler' : 'All Products'}</option>
                      <option value="selected">{isTr ? 'Seçili Ürünler' : 'Selected Products'}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'İşlem Tipi' : 'Action Type'}</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none"
                      value={bulkPriceForm.direction}
                      onChange={(e) => setBulkPriceForm({...bulkPriceForm, direction: e.target.value})}
                    >
                      <option value="increase">{isTr ? 'Fiyat Artışı (+)' : 'Price Increase (+)'}</option>
                      <option value="decrease">{isTr ? 'Fiyat İndirimi (-)' : 'Price Discount (-)'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Değer Tipi' : 'Value Type'}</label>
                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setBulkPriceForm({...bulkPriceForm, type: 'percent'})}
                         className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
                           bulkPriceForm.type === 'percent' 
                             ? 'bg-slate-900 text-white' 
                             : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                         }`}
                       >
                         {isTr ? 'Yüzde (%)' : 'Percent (%)'}
                       </button>
                       <button
                         type="button"
                         onClick={() => setBulkPriceForm({...bulkPriceForm, type: 'amount'})}
                         className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase transition-all ${
                           bulkPriceForm.type === 'amount' 
                             ? 'bg-slate-900 text-white' 
                             : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                         }`}
                       >
                         {isTr ? 'Miktar (₺)' : 'Amount ($)'}
                       </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Değişim Oranı / Miktarı' : 'Change Rate / Amount'}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-black text-slate-900"
                        value={bulkPriceForm.value}
                        onChange={(e) => setBulkPriceForm({...bulkPriceForm, value: e.target.value})}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                        {bulkPriceForm.type === 'percent' ? '%' : branding.default_currency || 'TRY'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Yuvarlama Seçenekleri' : 'Rounding Options'}</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none"
                    value={bulkPriceForm.rounding}
                    onChange={(e) => setBulkPriceForm({...bulkPriceForm, rounding: e.target.value})}
                  >
                    <option value="none">{isTr ? 'Yuvarlama Yapma' : 'No Rounding'}</option>
                    <option value="up">{isTr ? 'Yukarı Yuvarla (.00)' : 'Round Up (.00)'}</option>
                    <option value="down">{isTr ? 'Aşağı Yuvarla (.00)' : 'Round Down (.00)'}</option>
                    <option value="smart">{isTr ? 'Psikolojik Fiyatlama (.99)' : 'Psychological Pricing (.99)'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowBulkPriceModal(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                >
                  {isTr ? 'Güncellemeyi Uygula' : 'Apply Update'}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {showQuickProductModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-sm font-black uppercase tracking-wider">{isTr ? 'Kataloğa Hızlı Ekle' : 'Catalog Quick Add'}</h3>
              <button
                type="button"
                onClick={() => setShowQuickProductModal && setShowQuickProductModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleQuickAddProduct) handleQuickAddProduct(e);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Ürün Adı *' : 'Product Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isTr ? "örn: Profa Kiremit" : "e.g., Tile Brick"}
                  value={quickProductForm?.name || ""}
                  onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'KDV Dahil Fiyat *' : 'VAT Incl. Price *'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={quickProductForm?.price || ""}
                    onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'KDV Oranı (%)' : 'VAT Rate (%)'}</label>
                  <input
                    type="number"
                    required
                    value={quickProductForm?.tax_rate || "20"}
                    onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Barkod / Kod' : 'Barcode / Code'}</label>
                <input
                  type="text"
                  placeholder={isTr ? "Barkod numarasını girin veya okutun" : "Enter barcode"}
                  value={quickProductForm?.barcode || ""}
                  onChange={(e) => setQuickProductForm && setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickProductModal && setShowQuickProductModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {isTr ? 'Ekle' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Main Quotation Creation / Editing Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shadow-md">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {editingQuotation ? (isTr ? 'Teklifi Düzenle' : 'Edit Quotation') : (isTr ? 'Yeni Teklif Oluştur' : 'Create New Quotation')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isTr ? 'Tüm cari teklif proforma işlemlerinizi yönetin.' : 'Manage all quotation and proforma actions.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setShowQuotationModal) setShowQuotationModal(false);
                  if (setEditingQuotation) setEditingQuotation(null);
                  if (setQuotationItems) setQuotationItems([]);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleAddQuotation) handleAddQuotation(e);
              }}
              className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden bg-slate-50/25"
            >
              {/* Form Settings Panels */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 md:col-span-7 border-r border-slate-100">
                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs shadow-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-extrabold">{isTr ? 'Fiyatlandırma Parametresi' : 'Pricing Parameter'}</p>
                    <p className="mt-0.5 leading-relaxed text-[11px] text-amber-700">
                      {isTr 
                        ? 'Fiyatların vergi dahil veya hariç olacağını belirleyin. Notlarınız otomatik güncellenecektir.' 
                        : 'Choose whether prices are tax inclusive or exclusive. Your notes will update automatically.'}
                    </p>
                  </div>
                </div>

                {/* Customer Info Subsection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    {isTr ? 'Cari / Müşteri Bilgileri' : 'Client / Customer Info'}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Cari Hesap Seç' : 'Select Customer Account'}
                      </label>
                      <select
                        name="company_id"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        defaultValue={editingQuotation?.company_id || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = companies?.find(c => String(c.id) === val);
                          if (selected) {
                            const nameInput = document.getElementById('quote_customer_name') as HTMLInputElement;
                            const taxNum = document.getElementById('quote_tax_number') as HTMLInputElement;
                            const taxOff = document.getElementById('quote_tax_office') as HTMLInputElement;
                            const repInput = document.getElementById('quote_customer_title') as HTMLInputElement;
                            if (nameInput) nameInput.value = selected.title || "";
                            if (taxNum) taxNum.value = selected.tax_number || "";
                            if (taxOff) taxOff.value = selected.tax_office || "";
                            if (repInput) repInput.value = selected.representative || "";
                          }
                        }}
                      >
                        <option value="">{isTr ? '-- Yeni Cari / Manuel Giriş --' : '-- New Client / Manual Input --'}</option>
                        {companies?.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title} {c.balance ? `(${Number(c.balance).toLocaleString('tr-TR')} ${c.currency})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Müşteri Adı *' : 'Customer Name *'}
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        id="quote_customer_name"
                        required
                        placeholder={isTr ? "Müşteri veya firma adı" : "Customer or company label"}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.customer_name || ""}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Yetkili / Unvan' : 'Representative / Title'}
                      </label>
                      <input
                        type="text"
                        name="customer_title"
                        id="quote_customer_title"
                        placeholder={isTr ? "İletişim kişisi unvanı" : "Contact person's title"}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.customer_title || ""}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Vergi Dairesi' : 'Tax Office'}
                      </label>
                      <input
                        type="text"
                        name="tax_office"
                        id="quote_tax_office"
                        placeholder={isTr ? "Daire adı" : "Office name"}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.tax_office || ""}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Vergi Numarası VKN' : 'Tax Number'}
                      </label>
                      <input
                        type="text"
                        name="tax_number"
                        id="quote_tax_number"
                        placeholder={isTr ? "vkn / kimlik no" : "vkn / id no"}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.tax_number || ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Quotation Financials & Settings Subsection */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    {isTr ? 'Akçeli Koşullar' : 'Financial Terms'}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Para Birimi' : 'Currency'}
                      </label>
                      <select
                        name="currency"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        defaultValue={editingQuotation?.currency || branding?.default_currency || "TRY"}
                      >
                        <option value="TRY">TRY (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CHF">CHF (₣)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Döviz Kuru' : 'Exchange Rate'}
                      </label>
                      <input
                        type="text"
                        name="exchange_rate"
                        placeholder="1.00"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.exchange_rate || "1"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Ödeme Yöntemi' : 'Payment Method'}
                      </label>
                      <select
                        name="payment_method"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        defaultValue={editingQuotation?.payment_method || "bank"}
                      >
                        <option value="cash">{isTr ? 'Nakit Ödeme' : 'Cash'}</option>
                        <option value="credit_card">{isTr ? 'Kredi Kartı' : 'Credit Card'}</option>
                        <option value="bank">{isTr ? 'Banka Havalesi / EFT' : 'Bank Transfer'}</option>
                        <option value="term">{isTr ? 'Vadeli Ödeme' : 'Term Sale'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                        {isTr ? 'Geçerlilik Tarihi (Vade)' : 'Expiry Date / Due'}
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900 shadow-sm"
                        defaultValue={editingQuotation?.expiry_date ? new Date(editingQuotation.expiry_date).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <input
                      type="checkbox"
                      id="tax_inclusive_checkbox"
                      checked={isTaxInclusive}
                      onChange={(e) => {
                        if (setIsTaxInclusive) setIsTaxInclusive(e.target.checked);
                      }}
                      className="h-5 w-5 text-indigo-600 border-gray-305 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="tax_inclusive_checkbox" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                      {isTr ? 'Birim Fiyatlara KDV / Vergiler Dahildir.' : 'Prices Include VAT / Taxes.'}
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {isTr ? 'Ek Notlar (Teklif Metni)' : 'Quotation Notes'}
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800 shadow-sm"
                      value={quotationNotes || ""}
                      onChange={(e) => {
                        if (setQuotationNotes) setQuotationNotes(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Items List & Catalog Integration Panel */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50 md:col-span-5 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                      {isTr ? 'Teklif Kalemleri *' : 'Quotation Items *'}
                    </h4>

                    {/* Integrated Product Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={isTr ? "Ürün adı veya barkod ara..." : "Search catalog..."}
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all text-xs font-bold text-slate-700 shadow-sm"
                      />
                      
                      {prodSearch.trim() !== "" && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-100 p-2">
                          {products?.filter(p => 
                            p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                            p.barcode?.toLowerCase().includes(prodSearch.toLowerCase())
                          ).slice(0, 8).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const exist = quotationItems?.findIndex(item => item.product_id === p.id);
                                if (exist > -1 && setQuotationItems) {
                                  const updated = [...quotationItems];
                                  updated[exist].quantity += 1;
                                  updated[exist].total_price = updated[exist].quantity * updated[exist].unit_price;
                                  setQuotationItems(updated);
                                } else if (setQuotationItems) {
                                  setQuotationItems([...quotationItems, {
                                    product_id: p.id,
                                    product_name: p.name,
                                    barcode: p.barcode,
                                    quantity: 1,
                                    unit_price: Number(p.price),
                                    tax_rate: Number(p.tax_rate ?? 20),
                                    total_price: Number(p.price)
                                  }]);
                                }
                                setProdSearch("");
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-xl flex justify-between items-center text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                {p.barcode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{p.barcode}</p>}
                              </div>
                              <span className="text-[10px] font-black bg-indigo-55 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-xl whitespace-nowrap">
                                {Number(p.price).toLocaleString('tr-TR')} {p.currency}
                              </span>
                            </button>
                          ))}
                          {products?.filter(p => 
                            p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                            p.barcode?.toLowerCase().includes(prodSearch.toLowerCase())
                          ).length === 0 && (
                            <p className="p-4 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl">
                              {isTr ? 'Uyuşan ürün bulunamadı.' : 'No matched products found.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Quick Product Trigger button */}
                  {setShowQuickProductModal && (
                    <button
                      type="button"
                      onClick={() => setShowQuickProductModal(true)}
                      className="w-full flex items-center justify-center p-3 bg-white hover:bg-white text-indigo-600 border border-slate-200 shadow-sm rounded-2xl text-xs font-extrabold transition-all outline-none"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isTr ? "Kataloğa Hızlı Ürün Ekle" : "Add Non-Listed Item to Catalog"}
                    </button>
                  )}

                  {/* Renders Quotation Items Table */}
                  <div className="space-y-3">
                    {quotationItems?.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3 relative group">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-850 leading-tight">{item.product_name}</p>
                            {item.barcode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.barcode}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (setQuotationItems) {
                                setQuotationItems(quotationItems.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-405 font-black uppercase tracking-wider block">{isTr ? 'Miktar' : 'Qty'}</span>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-2 py-0.5 h-8 justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  if (setQuotationItems) {
                                    const updated = [...quotationItems];
                                    updated[idx].quantity = Math.max(1, updated[idx].quantity - 1);
                                    updated[idx].total_price = updated[idx].quantity * updated[idx].unit_price;
                                    setQuotationItems(updated);
                                  }
                                }}
                                className="text-slate-500 hover:text-indigo-600 font-extrabold"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-slate-800">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (setQuotationItems) {
                                    const updated = [...quotationItems];
                                    updated[idx].quantity += 1;
                                    updated[idx].total_price = updated[idx].quantity * updated[idx].unit_price;
                                    setQuotationItems(updated);
                                  }
                                }}
                                className="text-slate-500 hover:text-indigo-600 font-extrabold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-405 font-black uppercase tracking-wider block">{isTr ? 'Birim Fiyat' : 'Price'}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => {
                                if (setQuotationItems) {
                                  const updated = [...quotationItems];
                                  updated[idx].unit_price = Number(e.target.value);
                                  updated[idx].total_price = updated[idx].quantity * updated[idx].unit_price;
                                  setQuotationItems(updated);
                                }
                              }}
                              className="w-full text-xs font-black text-slate-800 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl h-8 text-center"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-405 font-black uppercase tracking-wider block">{isTr ? 'KDV %' : 'Tax %'}</span>
                            <input
                              type="number"
                              value={item.tax_rate ?? 20}
                              onChange={(e) => {
                                if (setQuotationItems) {
                                  const updated = [...quotationItems];
                                  updated[idx].tax_rate = Number(e.target.value);
                                  setQuotationItems(updated);
                                }
                              }}
                              className="w-full text-xs font-black text-slate-800 px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl h-8 text-center"
                            />
                          </div>
                        </div>

                        <div className="text-right text-xs font-black text-indigo-600/90 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {isTr ? 'Satır Toplamı: ' : 'Cost total: '}
                          {Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                    {quotationItems?.length === 0 && (
                      <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                        <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-xs font-extrabold mt-2 leading-tight">
                          {isTr ? 'Henüz teklif kalemi eklemediniz.' : 'No items added. Find items above to append.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Costs Totals Box */}
                <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                  <div className="flex justify-between items-center text-slate-700 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider">{isTr ? 'Genel Toplam' : 'Quotation Grand Cost'}</span>
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {Number(quotationItems?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (setShowQuotationModal) setShowQuotationModal(false);
                        if (setEditingQuotation) setEditingQuotation(null);
                        if (setQuotationItems) setQuotationItems([]);
                      }}
                      className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={quotationItems?.length === 0}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-100"
                    >
                      {isTr ? 'Teklifi Kaydet' : 'Save Quotation'}
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">
                  {editingProduct ? (isTr ? 'Ürünü Düzenle' : 'Edit Product') : (isTr ? 'Yeni Ürün Kaydet' : 'Create New Product')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isTr ? 'Stok listenize yeni ürün veya hizmet tanımlayın.' : 'Define new product or service in inventory.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setShowProductModal) setShowProductModal(false);
                  if (setEditingProduct) setEditingProduct(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white border-0 outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleAddProduct) handleAddProduct(e);
              }}
              className="flex-1 overflow-y-auto p-8 space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Barkod / Ürün Kodu *' : 'Barcode / SKU *'}</label>
                  <input
                    type="text"
                    name="barcode"
                    required
                    placeholder={isTr ? "Barkod girin veya okutun..." : "SKO code..."}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.barcode || ""}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Ürün / Hizmet Adı *' : 'Product / Service Name *'}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={isTr ? "örn: Alçıpan Profili" : "Product name"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-extrabold text-slate-900"
                    defaultValue={editingProduct?.name || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Kategori' : 'Category'}</label>
                  <input
                    type="text"
                    name="category"
                    placeholder={isTr ? "örn: İnşaat, Yapı Çelikleri" : "Category"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.category || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Marka / Üretici' : 'Brand'}</label>
                  <input
                    type="text"
                    name="brand"
                    placeholder={isTr ? "örn: Knauf, Gap" : "Brand name"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.brand || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Ürün Tipi' : 'Product Type'}</label>
                  <select
                    name="product_type"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                    defaultValue={editingProduct?.product_type || "product"}
                  >
                    <option value="product">{isTr ? 'Fiziksel Ürün (Stoklu)' : 'Physical Product'}</option>
                    <option value="service">{isTr ? 'Hizmet / Servis (Stoksuz)' : 'Service / Labor'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Birim' : 'Unit'}</label>
                  <input
                    type="text"
                    name="unit"
                    placeholder={isTr ? "örn: Adet, Palet, Kg, Mt" : "Unit abbreviation"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
                    defaultValue={editingProduct?.unit || "Adet"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Maliyet Fiyatı' : 'Cost Price'}</label>
                  <input
                    type="text"
                    name="cost_price"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.cost_price || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Maliyet Para Birimi' : 'Cost Currency'}</label>
                  <select
                    name="cost_currency"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-750 appearance-none text-xs h-[50px]"
                    defaultValue={editingProduct?.cost_currency || branding?.default_currency || "TRY"}
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Satış Fiyatı *' : 'Sales Price *'}</label>
                  <input
                    type="text"
                    name="price"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-black text-slate-900"
                    defaultValue={editingProduct?.price || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Alternatif Satış Fiyatı (Nakit Fiyatı vb)' : 'Backup Sales Price'}</label>
                  <input
                    type="text"
                    name="price_2"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.price_2 || ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Satış Para Birimi' : 'Sales Price Currency'}</label>
                  <select
                    name="currency"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-750 appearance-none text-xs h-[50px]"
                    defaultValue={editingProduct?.currency || branding?.default_currency || "TRY"}
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Varsayılan KDV %' : 'VAT %'}</label>
                  <select
                    name="tax_rate"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                    defaultValue={editingProduct?.tax_rate !== undefined ? String(editingProduct.tax_rate) : "20"}
                  >
                    <option value="20">%20</option>
                    <option value="10">%10</option>
                    <option value="1">%1</option>
                    <option value="0">%0 (KDV Muaf)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Mevcut Stok Miktarı' : 'Stock Quantity'}</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Kritik Stok Seviyesi' : 'Min Stock Level'}</label>
                  <input
                    type="number"
                    name="min_stock_level"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                    defaultValue={editingProduct?.min_stock_level !== undefined ? String(editingProduct.min_stock_level) : "5"}
                  />
                </div>

                <div className="space-y-1.5 col-span-2 bg-slate-50 p-4 rounded-3xl border border-slate-150">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {isTr ? 'Ürün Görseli (Canlı Fotoğraf veya URL)' : 'Product Image (Live Photo or URL)'}
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Image Preview */}
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-cover bg-center">
                      {productImageUrl ? (
                        <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">{isTr ? 'Görsel Yok' : 'Blank'}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="text"
                        name="image_url"
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-xs text-slate-750"
                        value={productImageUrl}
                        onChange={(e) => setProductImageUrl(e.target.value)}
                      />
                      
                      <div className="pt-1">
                        <MultiImageUploader 
                          onImagesUploaded={(urls) => {
                            if (urls && urls.length > 0) {
                              setProductImageUrl(urls[0]);
                            }
                          }} 
                          lang={lang} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Ürün Detaylı Açıklaması' : 'Detailed Description'}</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder={isTr ? "Ürün teknik özellikleri ve detayları" : "Detailed specs"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                    defaultValue={editingProduct?.description || ""}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                <input
                  type="checkbox"
                  name="is_web_sale"
                  id="prod_is_web_sale"
                  className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  defaultChecked={editingProduct?.is_web_sale !== false}
                />
                <label htmlFor="prod_is_web_sale" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  {isTr ? 'Bu Ürün Mağaza Web Sitesinde Vitrinde Yayınlansın' : 'Publish product in public store showcase page'}
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (setShowProductModal) setShowProductModal(false);
                    if (setEditingProduct) setEditingProduct(null);
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {isTr ? 'Ürünü Kaydet' : 'Save Product Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Company Add / Edit Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white animate-fade-in">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">
                  {editingCompany ? (isTr ? 'Cari Cari Düzenle' : 'Edit Client Account') : (isTr ? 'Yeni Cari Hesap (Müşteri/Tedarikçi) Kaydet' : 'Add Client Account')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isTr ? 'Müşteri, satıcı ve diğer tedarikçi cari kayıtlarını yönetin.' : 'Manage customers suppliers accounting.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setShowCompanyModal) setShowCompanyModal(false);
                  if (setEditingCompany) setEditingCompany(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleAddCompany) handleAddCompany(e);
              }}
              className="flex-1 overflow-y-auto p-8 space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Cari Hesap / Ticari Ünvan *' : 'Company / Business Title *'}</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder={isTr ? "örn: Akdeniz İnşaat Ltd." : "Company business name"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-extrabold text-slate-900"
                    defaultValue={editingCompany?.title || ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'İlgili Kişi / Temsilci' : 'Contact Person'}</label>
                    <input
                      type="text"
                      name="representative"
                      placeholder={isTr ? "örn: Ahmet Yılmaz" : "Representative contact"}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                      defaultValue={editingCompany?.representative || ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Cari Para Birimi' : 'Client Account Currency'}</label>
                    <select
                      name="currency"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-705 appearance-none text-xs h-[50px]"
                      defaultValue={editingCompany?.currency || branding?.default_currency || "TRY"}
                    >
                      <option value="TRY">TRY (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</label>
                    <input
                      type="text"
                      name="tax_office"
                      placeholder={isTr ? "Lefkoşa Vergi Dairesi" : "Tax location"}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                      defaultValue={editingCompany?.tax_office || ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Vergi Numarası VKN / KKTC VKN' : 'Tax / Registration No'}</label>
                    <input
                      type="text"
                      name="tax_number"
                      placeholder="0123456789"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                      defaultValue={editingCompany?.tax_number || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'E-Posta Adresi' : 'Email Address'}</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="info@example.com"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900"
                      defaultValue={editingCompany?.email || ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Telefon Numarası' : 'Phone Number'}</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+90533..."
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-750"
                      defaultValue={editingCompany?.phone || ""}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Adres / Lokasyon' : 'Physical Address'}</label>
                  <textarea
                    name="address"
                    rows={2}
                    placeholder={isTr ? "Cari firmanın fiziki adresi" : "Address details"}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                    defaultValue={editingCompany?.address || ""}
                  />
                </div>

                {!editingCompany && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isTr ? 'Açılış Devir Bakiyesi (Borç ise eksi girin)' : 'Opening Devir Balance'}</label>
                    <input
                      type="number"
                      step="0.01"
                      name="opening_balance"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                      defaultValue="0"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (setShowCompanyModal) setShowCompanyModal(false);
                    if (setEditingCompany) setEditingCompany(null);
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {isTr ? 'Cariyi Kaydet' : 'Save Client Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* User Account Add Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-sm font-black uppercase tracking-wider">{isTr ? 'Personel / Kullanıcı Hesabı Ekle' : 'Add User Account'}</h3>
              <button
                type="button"
                onClick={() => setShowUserModal && setShowUserModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors text-white border-0 outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (handleAddUser) handleAddUser(e);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Kullanıcı Giriş Adı *' : 'Username *'}</label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="örn: ahmet_yilmaz"
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Kullanıcı Adı E-Posta *' : 'Email Address *'}</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="ahmet@firma.com"
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Giriş Şifresi *' : 'Password *'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Kullanıcı Yetki Rolü' : 'Role Authorization'}</label>
                <select
                  name="role"
                  className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none h-[40px]"
                  defaultValue="editor"
                >
                  <option value="storeadmin">{isTr ? 'Mağaza Yöneticisi (Store Admin)' : 'Store Admin'}</option>
                  <option value="editor">{isTr ? 'Editör / Tezgahtar (Editor)' : 'Editor / Sales'}</option>
                  <option value="viewer">{isTr ? 'Sadece İzleyici (Viewer)' : 'Viewer Only'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Adı Soyadı' : 'Full Name'}</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ahmet Yılmaz"
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{isTr ? 'Telefon No' : 'Phone'}</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+90548..."
                    className="w-full px-4 py-2 text-xs bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal && setShowUserModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  {isTr ? 'Kullanıcı Ekle' : 'Add User Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </AnimatePresence>
  );
};

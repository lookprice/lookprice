import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Save, 
  Search, 
  Package, 
  Plus, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { AutocompleteSelect } from '../../../AutocompleteSelect';
import { numberToTurkishWords } from '../../../../lib/invoiceUtils';

interface SalesInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  editingInvoiceId: number | null;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  
  // Selection
  customers: any[];
  companies: any[];
  customerId: string;
  setCustomerId: (id: string) => void;
  companyId: string;
  setCompanyId: (id: string) => void;
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  
  // Basic Info
  invoiceNumber: string;
  setInvoiceNumber: (val: string) => void;
  waybillNumber: string;
  setWaybillNumber: (val: string) => void;
  invoiceDate: string;
  setInvoiceDate: (val: string) => void;
  invoiceTime: string;
  setInvoiceTime: (val: string) => void;
  invoiceProfile: string;
  setInvoiceProfile: (val: string) => void;
  eDocumentType: string | null;
  setEDocumentType: (val: string | null) => void;
  giInvoiceType: string;
  setGiInvoiceType: (val: string) => void;
  exemptionReasonCode: string;
  setExemptionReasonCode: (val: string) => void;
  withholdingTaxCode: string;
  setWithholdingTaxCode: (val: string) => void;
  isReturn: boolean;
  setIsReturn: (val: boolean) => void;
  returnInvoiceNumber: string;
  setReturnInvoiceNumber: (val: string) => void;
  returnInvoiceDate: string;
  setReturnInvoiceDate: (val: string) => void;
  isTaxInclusive: boolean;
  setIsTaxInclusive: (val: boolean) => void;
  
  // Customer Details
  editTaxOffice: string;
  setEditTaxOffice: (val: string) => void;
  editTaxNumber: string;
  setEditTaxNumber: (val: string) => void;
  handleCheckTaxpayer: () => void;
  isCheckingTaxpayer: boolean;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  editAddress: string;
  setEditAddress: (val: string) => void;
  selectedCompany: any;
  selectedCustomer: any;
  isNewCustomer: boolean;
  
  // Products
  productSearch: string;
  setProductSearch: (val: string) => void;
  showProductDropdown: boolean;
  setShowProductDropdown: (val: boolean) => void;
  filteredProducts: any[];
  handleAddProduct: (p: any) => void;
  setShowQuickProductModal: (val: boolean) => void;
  setQuickProductForm: (form: any) => void;
  
  // Payment & Currency
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  currency: string;
  setCurrency: (val: string) => void;
  exchangeRate: string;
  setExchangeRate: (val: string) => void;
  branding: any;
  
  // Items
  items: any[];
  updateItem: (idx: number, field: string, val: any) => void;
  removeItem: (idx: number) => void;
  
  // Totals & Notes
  notes: string;
  setNotes: (val: string) => void;
  totals: {
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
  };
  onQuickCariAdd?: (searchStr: string) => void;
  status: 'draft' | 'approved' | 'cancelled';
  setStatus: (val: 'draft' | 'approved' | 'cancelled') => void;
}

export const SalesInvoiceFormModal: React.FC<SalesInvoiceFormModalProps> = ({
  isOpen,
  onClose,
  isTr,
  editingInvoiceId,
  handleSubmit,
  isSubmitting,
  customers,
  companies,
  customerId,
  setCustomerId,
  companyId,
  setCompanyId,
  customerSearch,
  setCustomerSearch,
  invoiceNumber,
  setInvoiceNumber,
  waybillNumber,
  setWaybillNumber,
  invoiceDate,
  setInvoiceDate,
  invoiceTime,
  setInvoiceTime,
  invoiceProfile,
  setInvoiceProfile,
  eDocumentType,
  setEDocumentType,
  giInvoiceType,
  setGiInvoiceType,
  exemptionReasonCode,
  setExemptionReasonCode,
  withholdingTaxCode,
  setWithholdingTaxCode,
  isReturn,
  setIsReturn,
  returnInvoiceNumber,
  setReturnInvoiceNumber,
  returnInvoiceDate,
  setReturnInvoiceDate,
  isTaxInclusive,
  setIsTaxInclusive,
  editTaxOffice,
  setEditTaxOffice,
  editTaxNumber,
  setEditTaxNumber,
  handleCheckTaxpayer,
  isCheckingTaxpayer,
  customerEmail,
  setCustomerEmail,
  editAddress,
  setEditAddress,
  selectedCompany,
  selectedCustomer,
  isNewCustomer,
  productSearch,
  setProductSearch,
  showProductDropdown,
  setShowProductDropdown,
  filteredProducts,
  handleAddProduct,
  setShowQuickProductModal,
  setQuickProductForm,
  paymentMethod,
  setPaymentMethod,
  currency,
  setCurrency,
  exchangeRate,
  setExchangeRate,
  branding,
  items,
  updateItem,
  removeItem,
  notes,
  setNotes,
  totals,
  onQuickCariAdd,
  status,
  setStatus
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[96rem] max-h-[96vh] flex flex-col overflow-hidden border border-slate-300"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {editingInvoiceId ? (isTr ? "Faturayı Düzenle" : "Edit Invoice") : (isTr ? "Yeni Satış Faturası" : "New Sales Invoice")}
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider ${
                      (invoiceProfile === 'TICARIFATURA' || invoiceProfile === 'TEMELFATURA' || eDocumentType === 'E-FATURA')
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    }`}>
                      {invoiceProfile || (eDocumentType === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA')}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isTr ? "RESMİ SATIŞ VE E-FATURA YÖNETİM PANELİ" : "OFFICIAL SALES & E-INVOICE MANAGEMENT"}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
              {/* Upper Section: Customer Details & Invoice Parameters Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                
                {/* Left Card: Customer / Cari Selection & Contact Info */}
                <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                      {isTr ? '1. Müşteri / Cari Bilgileri' : '1. Customer / Account Info'}
                    </span>
                    {(selectedCompany || selectedCustomer) && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedCompany ? (isTr ? 'Kurumsal Cari' : 'Company') : (isTr ? 'Bireysel Müşteri' : 'Individual')}
                      </span>
                    )}
                  </div>

                  <AutocompleteSelect
                    label={isTr ? 'Müşteri / Cari Arama' : 'Search Customer / Account'}
                    items={[
                      ...customers.map(c => ({ ...c, display: c.name || c.full_name || c.customer_name || c.email, type: 'customer' })),
                      ...companies.map(c => ({ ...c, display: c.title || c.company_title || c.name, type: 'company' }))
                    ]}
                    displayField="display"
                    secondaryField="phone"
                    value={customerSearch}
                    onSelect={(item) => {
                      if (!item) {
                        setCustomerId('');
                        setCompanyId('');
                        setCustomerSearch('');
                        setEditTaxNumber('');
                        setEditTaxOffice('');
                        setEditAddress('');
                        setCustomerEmail('');
                        return;
                      }
                      if (item.type === 'customer') {
                        setCustomerId(item.id);
                        setCompanyId('');
                        setEditTaxNumber(item.tax_number || '');
                        setEditTaxOffice(item.tax_office || '');
                        setEditAddress(item.address || '');
                        setCustomerEmail(item.email || '');
                      } else {
                        setCompanyId(item.id);
                        setCustomerId('');
                        setEditTaxNumber(item.tax_number || '');
                        setEditTaxOffice(item.tax_office || '');
                        setEditAddress(item.address || '');
                        setCustomerEmail(item.email || '');
                      }
                      setCustomerSearch(item.display);
                    }}
                    type="all-accounts"
                    lang={isTr ? 'tr' : 'en'}
                    placeholder={isTr ? 'Ünvan, isim veya telefon ile arayın...' : 'Search by title, name or phone...'}
                    onQuickAdd={onQuickCariAdd}
                  />

                  {/* Compact Customer Tax & Contact Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Vergi / TC No' : 'Tax / ID No'}</label>
                      <div className="flex gap-1">
                        <input 
                          type="text"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                          value={editTaxNumber}
                          onChange={(e) => setEditTaxNumber(e.target.value)}
                          placeholder={isTr ? "Vergi / TC" : "Tax/ID"}
                        />
                        <button
                          type="button"
                          onClick={handleCheckTaxpayer}
                          disabled={isCheckingTaxpayer || !editTaxNumber}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-40 shrink-0"
                          title={isTr ? "GİB Mükellef Kontrolü" : "Check GIB Taxpayer"}
                        >
                          {isCheckingTaxpayer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isTr ? "GİB" : "GIB")}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={editTaxOffice}
                        onChange={(e) => setEditTaxOffice(e.target.value)}
                        placeholder={isTr ? "Vergi dairesi" : "Tax office"}
                      />
                    </div>

                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'E-Posta' : 'Email'}</label>
                      <input 
                        type="email"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="ornek@firma.com"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Fatura Adresi' : 'Billing Address'}</label>
                        {selectedCompany?.delivery_address && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditAddress(selectedCompany.address || "")}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                                editAddress === selectedCompany.address
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isTr ? "Fatura Adresi" : "Billing"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditAddress(selectedCompany.delivery_address || "")}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                                editAddress === selectedCompany.delivery_address
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {isTr ? "Sevk Adresi" : "Delivery"}
                            </button>
                          </div>
                        )}
                      </div>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 transition-all"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder={isTr ? "Cadde, Mahalle, İlçe, Şehir..." : "Street, District, City..."}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Card: Invoice Details, Dates & Scenario Matrix */}
                <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span>
                      {isTr ? '2. Belge, Tarih ve Senaryo Ayarları' : '2. Document & Scenario Settings'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">{isTr ? 'KDV:' : 'VAT:'}</span>
                      <button
                        type="button"
                        onClick={() => setIsTaxInclusive(!isTaxInclusive)}
                        className={`px-2 py-0.5 text-[10px] font-black rounded border transition-all ${
                          isTaxInclusive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }`}
                      >
                        {isTaxInclusive ? (isTr ? "KDV DAHİL" : "INCL.") : (isTr ? "KDV HARİÇ" : "EXCL.")}
                      </button>
                      <button
                        type="button"
                        onClick={() => { 
                          const nextReturn = !isReturn;
                          setIsReturn(nextReturn);
                          if (nextReturn) setGiInvoiceType('IADE');
                          else if (giInvoiceType === 'IADE') setGiInvoiceType('SATIS');
                        }}
                        className={`px-2 py-0.5 text-[10px] font-black rounded border transition-all ${
                          isReturn 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isReturn ? (isTr ? "İADE FATURASI" : "RETURN") : (isTr ? "SATIŞ" : "SALE")}
                      </button>
                    </div>
                  </div>

                  {/* Primary 4-Field Top Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Fatura No' : 'Invoice No'}</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="SATIŞ-0001"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'İrsaliye No' : 'Waybill No'}</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={waybillNumber}
                        onChange={(e) => setWaybillNumber(e.target.value)}
                        placeholder="İRS-0001"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Tarih' : 'Date'}</label>
                      <input 
                        type="date"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Saat' : 'Time'}</label>
                      <input 
                        type="time"
                        step="1"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={invoiceTime}
                        onChange={(e) => setInvoiceTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Secondary 3-Field Row: Scenario, GIB Type, Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {isTr ? 'Fatura Senaryosu' : 'Scenario'}
                        </label>
                        {eDocumentType && (
                          <span className={`text-[8px] font-black px-1 rounded ${
                            eDocumentType === 'E-FATURA' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {eDocumentType}
                          </span>
                        )}
                      </div>
                      <select 
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={invoiceProfile || (eDocumentType === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA')}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setInvoiceProfile(val);
                          if (val === 'TICARIFATURA' || val === 'TEMELFATURA') {
                            setEDocumentType('E-FATURA');
                          } else if (val === 'EARSIVFATURA') {
                            setEDocumentType('E-ARŞİV');
                          }
                        }}
                      >
                        <option value="TICARIFATURA">{isTr ? "Ticari Fatura (E-Fatura)" : "Commercial (E-Invoice)"}</option>
                        <option value="TEMELFATURA">{isTr ? "Temel Fatura (E-Fatura)" : "Basic (E-Invoice)"}</option>
                        <option value="EARSIVFATURA">{isTr ? "E-Arşiv Fatura" : "E-Archive"}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'GİB Tipi' : 'GİB Type'}</label>
                      <select 
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={giInvoiceType}
                        onChange={(e: any) => setGiInvoiceType(e.target.value)}
                      >
                        <option value="SATIS">{isTr ? "Satış" : "Sales"}</option>
                        <option value="IADE">{isTr ? "İade" : "Return"}</option>
                        <option value="TEVKIFAT">{isTr ? "Tevkifat" : "Withholding"}</option>
                        <option value="ISTISNA">{isTr ? "İstisna" : "Exemption"}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Kayıt Durumu' : 'Status'}</label>
                      <select 
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 transition-all"
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                      >
                        <option value="draft">{isTr ? "Taslak (Kayıtlı)" : "Draft"}</option>
                        <option value="approved">{isTr ? "Onaylandı" : "Approved"}</option>
                        <option value="cancelled">{isTr ? "İptal Edildi" : "Cancelled"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Return or Exception Special Fields */}
                  {giInvoiceType === 'IADE' && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-rose-700 uppercase tracking-wider">{isTr ? 'İade Edilen Fatura No' : 'Return Inv No'}</label>
                        <input 
                          type="text"
                          required
                          maxLength={16}
                          className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs font-bold text-slate-800 focus:border-rose-500"
                          value={returnInvoiceNumber}
                          onChange={(e) => setReturnInvoiceNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          placeholder="ABC2026000001234"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-rose-700 uppercase tracking-wider">{isTr ? 'İade Edilen Fatura Tarihi' : 'Return Date'}</label>
                        <input 
                          type="date"
                          required
                          className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs font-bold text-slate-800 focus:border-rose-500"
                          value={returnInvoiceDate}
                          onChange={(e) => setReturnInvoiceDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {giInvoiceType === 'ISTISNA' && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                      <label className="text-[10px] font-black text-rose-700 uppercase tracking-wider">{isTr ? 'İstisna Muafiyet Kodu' : 'Exemption Code'}</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs font-bold text-slate-800 focus:border-rose-500"
                        value={exemptionReasonCode}
                        onChange={(e) => setExemptionReasonCode(e.target.value)}
                        placeholder="351, 301, vb..."
                      />
                    </div>
                  )}

                  {giInvoiceType === 'TEVKIFAT' && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                      <label className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{isTr ? 'Tevkifat Kodu' : 'Withholding Code'}</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800 focus:border-amber-500"
                        value={withholdingTaxCode}
                        onChange={(e) => setWithholdingTaxCode(e.target.value)}
                        placeholder="601, 602, vb..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. PRODUCT ADDITION BAR - High-Contrast, Eye-Catching & Distinct Section */}
              <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl p-3 sm:p-4 shadow-lg text-white space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-indigo-500 rounded text-white">
                      <Package className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                      {isTr ? '3. Faturaya Ürün / Hizmet Kalemi Ekle' : '3. Add Product / Service Item'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300">
                    <span className="hidden sm:inline text-slate-400">{isTr ? 'Seçili Kalem:' : 'Items:'} <strong className="text-white">{items.length}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center pt-1">
                  {/* Search input with live dropdown */}
                  <div className="lg:col-span-7 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                    <input 
                      type="text" 
                      placeholder={isTr ? "Ürün adı, barkod veya stok kodu yazarak arayın..." : "Search by product name, barcode or SKU..."}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm font-bold border-2 border-transparent focus:border-amber-400 focus:outline-none shadow-inner"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    
                    {showProductDropdown && productSearch && (
                      <div className="absolute z-[120] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 text-slate-800">
                        <div className="p-1 border-b border-slate-100 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickProductForm({ name: productSearch, price: "", tax_rate: "20", category: "", sub_category: "", type: "product" }); 
                              setShowQuickProductModal(true);
                              setShowProductDropdown(false);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {isTr ? `Hızlı Ürün Tanımla: "${productSearch}"` : `Quick Add Product: "${productSearch}"`}
                          </button>
                        </div>
                        {filteredProducts.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between group"
                            onClick={() => handleAddProduct(p)}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-slate-100 rounded group-hover:bg-indigo-100 transition-colors">
                                <Package className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">{p.name}</div>
                                <div className="text-[9px] text-slate-400">{p.barcode || p.sku || '-'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-indigo-600">
                                {Number(p.price).toLocaleString('tr-TR')} {p.currency || branding?.default_currency || 'TRY'}
                              </div>
                              <div className="text-[9px] font-semibold text-slate-400">{isTr ? 'Stok' : 'Stock'}: {p.stock ?? '-'}</div>
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-500">
                            {isTr ? "Eşleşen başka ürün bulunamadı." : "No matching products found."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment & Currency Controls embedded inside high-contrast bar */}
                  <div className="lg:col-span-5 flex items-center gap-2">
                    <div className="flex-1">
                      <select 
                        className="w-full px-2.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold focus:border-indigo-400 focus:outline-none"
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">{isTr ? 'Nakit Ödeme' : 'Cash'}</option>
                        <option value="credit_card">{isTr ? 'Kredi Kartı' : 'Credit Card'}</option>
                        <option value="bank">{isTr ? 'Banka / Havale' : 'Bank Transfer'}</option>
                        <option value="term">{isTr ? 'Vadeli / Açık Hesap' : 'Term Account'}</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <select 
                        className="px-2.5 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-black focus:border-indigo-400 focus:outline-none"
                        value={currency}
                        onChange={(e) => {
                          const newCurrency = e.target.value;
                          setCurrency(newCurrency);
                          if (newCurrency === (branding?.default_currency || 'TRY')) {
                            setExchangeRate("1");
                          } else {
                            const rate = branding?.currency_rates?.[newCurrency];
                            setExchangeRate(rate ? String(rate) : "");
                          }
                        }}
                      >
                        <option value="TRY">TRY (₺)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>

                      {currency !== (branding?.default_currency || 'TRY') && (
                        <input
                          type="text"
                          placeholder={isTr ? "Döviz Kuru" : "Rate"}
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value.replace(',', '.'))}
                          className="w-20 px-2 py-2.5 bg-slate-800 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold text-center focus:border-amber-400 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ITEMS TABLE - Compact & Clean Grid */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">{isTr ? 'Ürün / Hizmet Açıklaması' : 'Product / Description'}</th>
                        <th className="py-2.5 px-2 text-center w-24">{isTr ? 'Miktar' : 'Qty'}</th>
                        <th className="py-2.5 px-2 text-right w-32">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                        <th className="py-2.5 px-2 text-center w-20">{isTr ? 'KDV %' : 'VAT %'}</th>
                        <th className="py-2.5 px-3 text-right w-36">{isTr ? 'Tutar' : 'Total'}</th>
                        <th className="py-2.5 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-semibold">
                            {isTr ? "Henüz ürün eklenmedi. Yukarıdaki arama çubuğundan ürün ekleyebilirsiniz." : "No items added yet. Search products above."}
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-800">{item.product_name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{item.barcode || item.sku || ''}</div>
                            </td>
                            <td className="py-2 px-2">
                              <input 
                                type="text"
                                inputMode="numeric"
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-800 focus:bg-white focus:border-indigo-500 font-mono tabular-nums text-xs"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <div className="relative">
                                <input 
                                  type="text"
                                  className="w-full pl-2 pr-6 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-800 focus:bg-white focus:border-indigo-500 font-mono tabular-nums text-xs"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 font-sans">{currency}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <input 
                                type="text"
                                className="w-full px-1 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-800 focus:bg-white focus:border-indigo-500 font-mono tabular-nums text-xs"
                                value={Math.floor(Number(item.tax_rate) || 0)}
                                onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                              {(isTaxInclusive 
                                ? ((Number(String(item.quantity).replace(',', '.')) || 0) * (Number(String(item.unit_price).replace(',', '.')) || 0))
                                : ((Number(String(item.quantity).replace(',', '.')) || 0) * (Number(String(item.unit_price).replace(',', '.')) || 0)) * (1 + (Number(item.tax_rate) || 0) / 100)
                              ).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-sans font-normal">{currency}</span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button 
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                title={isTr ? "Kalemi Sil" : "Delete Item"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. NOTES & SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1 items-stretch">
                {/* Notes Column */}
                <div className="md:col-span-6 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isTr ? 'Fatura Açıklaması / Notlar' : 'Invoice Notes'}</label>
                  <textarea 
                    className="flex-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 transition-all min-h-[70px] resize-none"
                    placeholder={isTr ? "Fatura üzerinde yer alacak ek not veya banka IBAN bilgileri..." : "Additional notes or bank info..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Financial Summary Column */}
                <div className="md:col-span-6 bg-slate-900 rounded-xl p-3.5 text-white shadow-md border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs opacity-80 pb-2 border-b border-slate-800">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-400">{isTr ? 'Ara Toplam (Matrah):' : 'Subtotal:'}</span>
                      <span className="font-mono font-bold">{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-400">{isTr ? 'KDV Toplamı:' : 'VAT Total:'}</span>
                      <span className="font-mono font-bold">{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block">{isTr ? 'ÖDENECEK GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                      <span className="text-[10px] text-slate-400 italic">
                        {isTr ? 'Yalnız: ' : 'Only: '} {numberToTurkishWords(totals.grandTotal, currency)}
                      </span>
                    </div>
                    <div className="text-right flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                        {totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-indigo-400 font-sans">{currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Bottom Action Bar */}
            <div className="px-5 py-3 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="text-xs text-slate-500 hidden sm:block">
                {items.length > 0 ? (
                  <span>{items.length} {isTr ? 'kalem ürün hazırlandı.' : 'items prepared.'}</span>
                ) : (
                  <span>{isTr ? 'Faturayı kaydetmek için ürün ekleyin.' : 'Add items to save.'}</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all uppercase tracking-wider"
                >
                  {isTr ? "Kapat" : "Close"}
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isTr ? "Faturayı Kaydet" : "Save Invoice"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


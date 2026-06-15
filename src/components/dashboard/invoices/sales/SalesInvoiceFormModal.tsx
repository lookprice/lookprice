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
  invoiceProfile: string;
  setInvoiceProfile: (val: string) => void;
  giInvoiceType: string;
  setGiInvoiceType: (val: string) => void;
  exemptionReasonCode: string;
  setExemptionReasonCode: (val: string) => void;
  withholdingTaxCode: string;
  setWithholdingTaxCode: (val: string) => void;
  isReturn: boolean;
  setIsReturn: (val: boolean) => void;
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
  invoiceProfile,
  setInvoiceProfile,
  giInvoiceType,
  setGiInvoiceType,
  exemptionReasonCode,
  setExemptionReasonCode,
  withholdingTaxCode,
  setWithholdingTaxCode,
  isReturn,
  setIsReturn,
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[95%] lg:max-w-[90rem] my-auto overflow-hidden border border-slate-200"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[92vh]">
            <div className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingInvoiceId ? (isTr ? "Faturayı Düzenle" : "Edit Invoice") : (isTr ? "Yeni Satış Faturası" : "New Sales Invoice")}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                    {isTr ? "RESMİ SATIŞ BELGESİ OLUŞTUR" : "CREATE OFFICIAL SALES DOCUMENT"}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Main Header Info Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <AutocompleteSelect
                      label={isTr ? 'Müşteri / Cari Seçimi' : 'Customer / Company Selection'}
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
                      placeholder={isTr ? 'Müşteri veya Cari arayın...' : 'Search Customer or Company...'}
                      onQuickAdd={onQuickCariAdd}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Fatura No' : 'Invoice No'}</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="SATIŞ-0001"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'İrsaliye No' : 'Waybill No'}</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                        value={waybillNumber}
                        onChange={(e) => setWaybillNumber(e.target.value)}
                        placeholder="İRS-0001"
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-3xl border-2 border-slate-100">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Fatura Tarihi' : 'Invoice Date'}</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-bold text-slate-700"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Dosya Profili' : 'File Profile'}</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-bold text-slate-700"
                      value={invoiceProfile}
                      onChange={(e) => setInvoiceProfile(e.target.value)}
                    >
                      <option value="TEMELFATURA">{isTr ? "Temel Fatura" : "Basic"}</option>
                      <option value="TICARIFATURA">{isTr ? "Ticari Fatura" : "Commercial"}</option>
                      <option value="EARSIVFATURA">{isTr ? "E-Arşiv" : "E-Archive"}</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'GİB Tipi' : 'GİB Type'}</label>
                      <select 
                        className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-bold text-slate-700"
                        value={giInvoiceType}
                        onChange={(e: any) => setGiInvoiceType(e.target.value)}
                      >
                        <option value="SATIS">{isTr ? "Satış" : "Sales"}</option>
                        <option value="IADE">{isTr ? "İade" : "Return"}</option>
                        <option value="TEVKIFAT">{isTr ? "Tevkifat" : "Withh."}</option>
                        <option value="ISTISNA">{isTr ? "İstisna" : "Exempt."}</option>
                      </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Durum' : 'Status'}</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 transition-all font-bold text-slate-700"
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                    >
                      <option value="draft">{isTr ? "Taslak" : "Draft"}</option>
                      <option value="approved">{isTr ? "Onaylandı" : "Approved"}</option>
                      <option value="cancelled">{isTr ? "İptal" : "Cancelled"}</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Vergi Ayarı' : 'Tax Setting'}</label>
                     <div className="flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => setIsTaxInclusive(true)}
                         className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${isTaxInclusive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                       >
                         {isTr ? "Dahil" : "Incl."}
                       </button>
                       <button
                         type="button"
                         onClick={() => setIsTaxInclusive(false)}
                         className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${!isTaxInclusive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                       >
                         {isTr ? "Hariç" : "Excl."}
                       </button>
                     </div>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{isTr ? 'Fatura Tipi' : 'Type'}</label>
                    <div className="flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => { setIsReturn(false); if(giInvoiceType === 'IADE') setGiInvoiceType('SATIS'); }}
                         className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${!isReturn ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`}
                       >
                         {isTr ? "SATIŞ" : "SALE"}
                       </button>
                       <button
                         type="button"
                         onClick={() => { setIsReturn(true); setGiInvoiceType('IADE'); }}
                         className={`flex-1 py-3 text-xs font-bold rounded-xl border-2 transition-all ${isReturn ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200'}`}
                       >
                         {isTr ? "İADE" : "RETURN"}
                       </button>
                    </div>
                  </div>

                  {giInvoiceType === 'ISTISNA' && (
                    <div className="lg:col-span-2 space-y-3">
                       <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-2">{isTr ? 'İstisna Muafiyet Kodu' : 'Exemption Code'}</label>
                       <input 
                         type="text"
                         className="w-full px-4 py-3 bg-rose-50 border-2 border-rose-100 rounded-2xl focus:border-rose-500 focus:bg-white transition-all font-bold text-slate-700"
                         value={exemptionReasonCode}
                         onChange={(e) => setExemptionReasonCode(e.target.value)}
                         placeholder="351, 301, vb..."
                       />
                    </div>
                  )}

                  {giInvoiceType === 'TEVKIFAT' && (
                    <div className="lg:col-span-2 space-y-3">
                       <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2">{isTr ? 'Tevkifat Kodu' : 'Withholding Code'}</label>
                       <input 
                         type="text"
                         className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-100 rounded-2xl focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-700"
                         value={withholdingTaxCode}
                         onChange={(e) => setWithholdingTaxCode(e.target.value)}
                         placeholder="601, 602, vb..."
                       />
                    </div>
                  )}
                </div>
              </div>

              {/* Company Tax Info Display & Edit */}
              {(selectedCompany || selectedCustomer || isNewCustomer) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-indigo-50/30 border-2 border-indigo-100/50 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Ünvan' : 'Title'}</p>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder={isTr ? "Ünvan giriniz..." : "Enter title..."}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</p>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                      value={editTaxOffice}
                      onChange={(e) => setEditTaxOffice(e.target.value)}
                      placeholder={isTr ? "Vergi dairesi..." : "Tax office..."}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Vergi / TC No' : 'Tax / ID No'}</p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                        value={editTaxNumber}
                        onChange={(e) => setEditTaxNumber(e.target.value)}
                        placeholder={isTr ? "Vergi veya TC no..." : "Tax or ID number..."}
                      />
                      <button
                        type="button"
                        onClick={handleCheckTaxpayer}
                        disabled={isCheckingTaxpayer}
                        className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                        title={isTr ? "GİB Mükellef Kontrolü" : "Check GIB Taxpayer"}
                      >
                        {isCheckingTaxpayer ? <Loader2 className="h-4 w-4 animate-spin" /> : (isTr ? "SORGULA" : "CHECK")}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'E-Posta' : 'Email'}</p>
                    <input 
                      type="email"
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={isTr ? "Müşteri e-postası..." : "Customer email..."}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Adres' : 'Address'}</p>
                    <textarea 
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-slate-600 focus:border-indigo-500 transition-all min-h-[60px]"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder={isTr ? "Adres bilgisi..." : "Address info..."}
                    />
                  </div>
                </motion.div>
              )}

              {/* Product Search & Items Table */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                  <div className="flex-1 w-full space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Ürün Ekle' : 'Add Product'}</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder={isTr ? "Ürün adı veya barkod ara..." : "Search product or barcode..."}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                      />
                      
                      {showProductDropdown && productSearch && (
                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                          <div className="p-1.5 border-b border-slate-100 mb-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickProductModal(true);
                                setShowProductDropdown(false);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {isTr ? `Hızlı Ürün Ekle: "${productSearch}"` : `Quick Add Product: "${productSearch}"`}
                            </button>
                          </div>
                          {filteredProducts.map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-between group"
                              onClick={() => handleAddProduct(p)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                  <Package className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-700">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{p.barcode}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-indigo-600">{Number(p.price).toLocaleString('tr-TR')} {p.currency || branding?.default_currency || 'TRY'}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Stok' : 'Stock'}: {p.stock}</div>
                              </div>
                            </button>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div className="p-4 text-center">
                              <p className="text-sm text-slate-500 mb-1">{isTr ? "Eşleşen başka ürün bulunamadı." : "No other matching products found."}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="space-y-4 flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Ödeme' : 'Payment'}</label>
                      <select 
                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">{isTr ? 'Nakit' : 'Cash'}</option>
                        <option value="credit_card">{isTr ? 'Kredi Kartı' : 'Credit Card'}</option>
                        <option value="bank">{isTr ? 'Havale/EFT' : 'Bank Transfer'}</option>
                        <option value="term">{isTr ? 'Vadeli' : 'Term'}</option>
                      </select>
                    </div>
                    <div className="space-y-4 flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Döviz' : 'Currency'}</label>
                      <div className="flex gap-2">
                        <select 
                          className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            if (e.target.value === (branding?.default_currency || 'TRY')) {
                              setExchangeRate("1");
                            }
                          }}
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        {currency !== (branding?.default_currency || 'TRY') && (
                          <input
                            type="text"
                            placeholder={isTr ? "Kur" : "Rate"}
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value.replace(',', '.'))}
                            className="w-24 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-slate-100 rounded-[2rem] overflow-x-auto bg-slate-50/30">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-100/50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{isTr ? 'Ürün' : 'Product'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">{isTr ? 'Adet' : 'Qty'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-40">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">{isTr ? 'KDV %' : 'VAT %'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-44">{isTr ? 'Toplam' : 'Total'}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                            {isTr ? "Henüz ürün eklenmedi" : "No products added yet"}
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="bg-white/50 hover:bg-white transition-colors group">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-700">{item.product_name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.barcode}</div>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                inputMode="numeric"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-4">
                              <div className="relative">
                                <input 
                                  type="text"
                                  className="w-full pl-2 pr-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-700 text-xs focus:bg-white transition-all"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400">{currency}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                value={Math.floor(Number(item.tax_rate) || 0)}
                                onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-black text-slate-900">
                                {(isTaxInclusive 
                                  ? ((Number(String(item.quantity).replace(',', '.')) || 0) * (Number(String(item.unit_price).replace(',', '.')) || 0))
                                  : ((Number(String(item.quantity).replace(',', '.')) || 0) * (Number(String(item.unit_price).replace(',', '.')) || 0)) * (1 + (Number(item.tax_rate) || 0) / 100)
                                ).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{currency}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura Notları' : 'Invoice Notes'}</label>
                  <textarea 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 min-h-[160px]"
                    placeholder={isTr ? "Fatura üzerine eklenecek notlar..." : "Notes to be added on the invoice..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-xs font-bold uppercase tracking-widest">{isTr ? 'ARA TOPLAM' : 'SUBTOTAL'}</span>
                      <span className="font-bold">{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                      <span className="text-xs font-bold uppercase tracking-widest">{isTr ? 'KDV TOPLAM' : 'VAT TOTAL'}</span>
                      <span className="font-bold">{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div className="space-y-2">
                      <span className="text-sm font-black uppercase tracking-[0.2em] block">{isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                      <div className="text-[10px] font-bold text-indigo-300 italic">
                        {isTr ? 'Yalnız: ' : 'Only: '} {numberToTurkishWords(totals.grandTotal, currency)}
                      </div>
                    </div>
                    <div className="text-right flex items-baseline gap-2">
                      <div className="text-4xl font-black tracking-tighter whitespace-nowrap">{totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-sm font-bold opacity-40 uppercase tracking-widest">{currency}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                {isTr ? "İptal" : "Cancel"}
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {isTr ? "Faturayı Kaydet" : "Save Invoice"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

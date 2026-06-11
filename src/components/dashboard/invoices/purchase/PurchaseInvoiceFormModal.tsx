import React from 'react';
import { 
  X, 
  Save, 
  Building2, 
  Calendar, 
  Hash, 
  Package, 
  Plus, 
  Trash2, 
  CreditCard, 
  Percent, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PurchaseInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTr: boolean;
  editingInvoiceId: number | null;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  companies: any[];
  companyId: string;
  setCompanyId: (val: string) => void;
  companySearch: string;
  setCompanySearch: (val: string) => void;
  invoiceNumber: string;
  setInvoiceNumber: (val: string) => void;
  waybillNumber: string;
  setWaybillNumber: (val: string) => void;
  invoiceDate: string;
  setInvoiceDate: (val: string) => void;
  isExpense: boolean;
  setIsExpense: (val: boolean) => void;
  expenseCategory: string;
  setExpenseCategory: (val: string) => void;
  expenseCenter: string;
  setExpenseCenter: (val: string) => void;
  isTaxInclusive: boolean;
  setIsTaxInclusive: (val: boolean) => void;
  items: any[];
  updateItem: (index: number, field: string, value: any) => void;
  removeItem: (index: number) => void;
  productSearch: string;
  setProductSearch: (val: string) => void;
  showProductDropdown: boolean;
  setShowProductDropdown: (val: boolean) => void;
  filteredProducts: any[];
  handleAddProduct: (product: any) => void;
  setShowQuickProductModal: (val: boolean) => void;
  paymentMethod: 'term' | 'cash' | 'credit_card' | 'bank';
  setPaymentMethod: (val: any) => void;
  currency: string;
  setCurrency: (val: string) => void;
  exchangeRate: string;
  setExchangeRate: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  totals: any;
  branding: any;
}

export const PurchaseInvoiceFormModal: React.FC<PurchaseInvoiceFormModalProps> = ({
  isOpen,
  onClose,
  isTr,
  editingInvoiceId,
  handleSubmit,
  isSubmitting,
  companies,
  companyId,
  setCompanyId,
  companySearch,
  setCompanySearch,
  invoiceNumber,
  setInvoiceNumber,
  waybillNumber,
  setWaybillNumber,
  invoiceDate,
  setInvoiceDate,
  isExpense,
  setIsExpense,
  expenseCategory,
  setExpenseCategory,
  expenseCenter,
  setExpenseCenter,
  isTaxInclusive,
  setIsTaxInclusive,
  items,
  updateItem,
  removeItem,
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
  notes,
  setNotes,
  totals,
  branding
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {editingInvoiceId ? <Save className="h-5 w-5 text-indigo-600" /> : <Plus className="h-5 w-5 text-indigo-600" />}
              {editingInvoiceId ? (isTr ? "Faturayı Düzenle" : "Edit Invoice") : (isTr ? "Yeni Alış Faturası" : "New Purchase Invoice")}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
              {isTr ? "Fatura Bilgilerini Girin" : "Enter Invoice Details"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5 md:col-span-2 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Building2 className="h-3 w-3" />
                {isTr ? "SATICI (CARİ)" : "SUPPLIER (COMPANY)"}
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none"
              >
                <option value="">{isTr ? "Cari Seçin..." : "Select Company..."}</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title} {c.tax_number ? `(${c.tax_number})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Hash className="h-3 w-3" />
                {isTr ? "FATURA NO" : "INVOICE NO"}
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Calendar className="h-3 w-3" />
                {isTr ? "FATURA TARİHİ" : "INVOICE DATE"}
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isTr ? "KALEMLER" : "ITEMS"}</h4>
              <div className="flex items-center gap-4">
                {isExpense && (
                  <div className="flex items-center gap-2">
                    <select
                      value={expenseCenter}
                      onChange={(e) => setExpenseCenter(e.target.value)}
                      className="text-xs font-bold px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg outline-none"
                    >
                      <option value="">{isTr ? "Gider Yeri Seçin" : "Select Expense Center"}</option>
                      <option value="showroom">Showroom</option>
                      <option value="service">Servis / Atölye</option>
                      <option value="office">Ofis / İdari</option>
                      <option value="marketing">Pazarlama / Reklam</option>
                      <option value="personnel">Personel</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isExpense} 
                    onChange={(e) => setIsExpense(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-black text-slate-600 group-hover:text-amber-600 transition-colors">{isTr ? "GİDER OLARAK İŞLE" : "MARK AS EXPENSE"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={isTaxInclusive} 
                    onChange={(e) => setIsTaxInclusive(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors">{isTr ? "FİYATLAR KDV DAHİL" : "PRICES VAT INCLUSIVE"}</span>
                </label>
              </div>
            </div>

            <div className="relative">
              <div className="relative group">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder={isTr ? "Ürün adı veya barkod ile ara..." : "Search by product name or barcode..."}
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              
              <AnimatePresence>
                {showProductDropdown && productSearch.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20 max-h-64 overflow-y-auto"
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-slate-400 font-bold">{isTr ? "Ürün bulunamadı" : "No products found"}</p>
                        <button 
                          type="button"
                          onClick={() => setShowQuickProductModal(true)}
                          className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all"
                        >
                          + {isTr ? "YENİ ÜRÜN OLUŞTUR" : "CREATE NEW PRODUCT"}
                        </button>
                      </div>
                    ) : (
                      filteredProducts.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                        >
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-900 tracking-tight">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{p.barcode || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-600">{Number(p.cost_price || p.price).toLocaleString()} {p.currency}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest text-right">STOK: {p.stock_quantity}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-2 pl-4 text-left">{isTr ? "ÜRÜN / HİZMET" : "PRODUCT / SERVICE"}</th>
                    <th className="pb-2 text-center w-24">{isTr ? "MİKTAR" : "QTY"}</th>
                    <th className="pb-2 text-right w-32">{isTr ? "BİRİM FİYAT" : "UNIT PRICE"}</th>
                    <th className="pb-2 text-center w-20">{isTr ? "KDV %" : "VAT %"}</th>
                    <th className="pb-2 text-right w-32">{isTr ? "TOPLAM" : "TOTAL"}</th>
                    <th className="pb-2 pr-4 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                     const qty = Number(String(item.quantity).replace(',','.')) || 0;
                     const price = Number(String(item.unit_price).replace(',','.')) || 0;
                     const tax = Number(String(item.tax_rate).replace(',','.')) || 0;
                     const total = isTaxInclusive ? (qty * price) : (qty * price * (1 + tax / 100));

                     return (
                       <tr key={index} className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl">
                         <td className="py-4 pl-4 rounded-l-xl">
                           <p className="text-sm font-black text-slate-900 tracking-tight">{item.product_name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{item.barcode || '-'}</p>
                         </td>
                         <td className="py-4">
                           <input
                             type="text"
                             inputMode="numeric"
                             value={item.quantity}
                             onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                             className="w-20 mx-auto block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                           />
                         </td>
                         <td className="py-4">
                           <input
                             type="text"
                             value={item.unit_price}
                             onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                             className="w-28 ml-auto block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                           />
                         </td>
                         <td className="py-4 px-2">
                           <input
                             type="text"
                             maxLength={2}
                             value={item.tax_rate}
                             onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                             className="w-12 mx-auto block px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                           />
                         </td>
                         <td className="py-4 text-right pr-4 font-black text-slate-900 text-sm">
                           {total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </td>
                         <td className="py-4 pr-4 rounded-r-xl">
                           <button
                             type="button"
                             onClick={() => removeItem(index)}
                             className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </td>
                       </tr>
                     );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{isTr ? "HENÜZ ÜRÜN EKLENMEMİŞ" : "NO ITEMS ADDED YET"}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <CreditCard className="h-3 w-3" />
                    {isTr ? "ÖDEME ŞEKLİ" : "PAYMENT METHOD"}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  >
                    <option value="term">{isTr ? "Açık Hesap (Vadeli)" : "Term / Account"}</option>
                    <option value="cash">{isTr ? "Nakit" : "Cash"}</option>
                    <option value="bank">{isTr ? "Banka Havalesi / EFT" : "Bank Transfer"}</option>
                    <option value="credit_card">{isTr ? "Kredi Kartı" : "Credit Card"}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                      {isTr ? "BİRİM" : "CURRENCY"}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                      {isTr ? "KUR" : "RATE"}
                    </label>
                    <input
                      type="text"
                      value={exchangeRate}
                      disabled={currency === 'TRY'}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isTr ? "FATURA NOTLARI" : "INVOICE NOTES"}</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isTr ? "Opsiyonel notlar..." : "Optional notes..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 space-y-6 text-white h-fit shadow-2xl shadow-slate-900/40">
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{isTr ? "MATRAH" : "SUBTOTAL"}</span>
                  <span className="text-sm font-bold text-slate-200">{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{isTr ? "KDV TOPLAM" : "VAT TOTAL"}</span>
                  <span className="text-sm font-bold text-slate-200">{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] block">{isTr ? "GENEL TOPLAM" : "GRAND TOTAL"}</span>
                    <span className="text-3xl font-black tracking-tighter block">{totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span className="text-lg font-black text-slate-500 mb-1 ml-2">{currency}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    {isTr ? "FATURAYI KAYDET" : "SAVE INVOICE"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

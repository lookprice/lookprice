import React, { useState } from "react";
import { motion } from "motion/react";
import { X, AlertCircle, Search, Plus, Trash2, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface QuotationModalProps {
  showQuotationModal: boolean;
  setShowQuotationModal: (show: boolean) => void;
  editingQuotation: any;
  setEditingQuotation: (q: any) => void;
  handleAddQuotation?: (e: React.FormEvent) => void;
  isTr: boolean;
  branding: any;
  translations: any;
  companies: any[];
  products: any[];
  quotationItems: any[];
  setQuotationItems: (items: any[]) => void;
  isTaxInclusive: boolean;
  setIsTaxInclusive: (tax: boolean) => void;
  quotationNotes: string;
  setQuotationNotes: (notes: string) => void;
  setShowQuickProductModal?: (b: boolean) => void;
}

export const QuotationModal = ({
  showQuotationModal,
  setShowQuotationModal,
  editingQuotation,
  setEditingQuotation,
  handleAddQuotation,
  isTr,
  branding,
  translations: t,
  companies = [],
  products = [],
  quotationItems = [],
  setQuotationItems,
  isTaxInclusive = false,
  setIsTaxInclusive,
  quotationNotes,
  setQuotationNotes,
  setShowQuickProductModal,
}: QuotationModalProps) => {
  const [prodSearch, setProdSearch] = useState("");
  const [compList, setCompList] = useState(companies);
  const [currCompanyId, setCurrCompanyId] = useState(editingQuotation?.company_id || "");
  const [savingCari, setSavingCari] = useState(false);

  React.useEffect(() => {
    if (companies) {
      setCompList(companies);
    }
  }, [companies]);

  React.useEffect(() => {
    setCurrCompanyId(editingQuotation?.company_id || "");
  }, [editingQuotation]);

  const handleSaveAsCari = async () => {
    const nameInput = document.getElementById("quote_customer_name") as HTMLInputElement;
    const taxNum = document.getElementById("quote_tax_number") as HTMLInputElement;
    const taxOff = document.getElementById("quote_tax_office") as HTMLInputElement;
    const repInput = document.getElementById("quote_customer_title") as HTMLInputElement;

    const nameVal = nameInput?.value?.trim();
    if (!nameVal) {
      toast.error(isTr ? "Müşteri adı boş olamaz" : "Customer name is required");
      return;
    }

    setSavingCari(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/store/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: nameVal,
          representative: repInput?.value?.trim() || undefined,
          tax_office: taxOff?.value?.trim() || undefined,
          tax_number: taxNum?.value?.trim() || undefined,
          currency: branding?.default_currency || "TRY",
          status: 'active'
        })
      });
      if (!res.ok) {
        throw new Error(isTr ? "Kaydedilirken hata oluştu" : "Save failed");
      }
      const newCari = await res.json();
      
      setCompList(prev => [...prev, newCari]);
      setCurrCompanyId(String(newCari.id));
      
      const selectElement = document.getElementById("quote_company_id") as HTMLSelectElement;
      if (selectElement) selectElement.value = String(newCari.id);
      
      toast.success(isTr ? "Yeni Cari hesabı başarıyla kaydedildi ve seçildi!" : "New Cari account successfully registered and selected!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCari(false);
    }
  };

  if (!showQuotationModal) return null;

  return (
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
              {editingQuotation ? (isTr ? "Teklifi Düzenle" : "Edit Quotation") : (isTr ? "Yeni Teklif Oluştur" : "Create New Quotation")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isTr ? "Tüm cari teklif proforma işlemlerinizi yönetin." : "Manage all quotation and proforma actions."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowQuotationModal(false);
              setEditingQuotation(null);
              setQuotationItems([]);
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
                <p className="font-extrabold">{isTr ? "Fiyatlandırma Parametresi" : "Pricing Parameter"}</p>
                <p className="mt-0.5 leading-relaxed text-[11px] text-amber-700">
                  {isTr
                    ? "Fiyatların vergi dahil veya hariç olacağını belirleyin. Notlarınız otomatik güncellenecektir."
                    : "Choose whether prices are tax inclusive or exclusive. Your notes will update automatically."}
                </p>
              </div>
            </div>

            {/* Customer Info Subsection */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                {isTr ? "Cari / Müşteri Bilgileri" : "Client / Customer Info"}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5 relative">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {isTr ? "Cari Hesap Seç" : "Select Customer Account"}
                    </label>
                    {!currCompanyId && (
                      <button
                        type="button"
                        disabled={savingCari}
                        onClick={handleSaveAsCari}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 rounded-xl transition-all flex items-center gap-1 border border-indigo-100 font-sans"
                      >
                        <Plus className="h-3 w-3" />
                        {savingCari ? (isTr ? "Kaydediliyor..." : "Saving...") : (isTr ? "+ Cariyi Kaydet" : "+ Save as Registered Cari")}
                      </button>
                    )}
                  </div>
                  <select
                    name="company_id"
                    id="quote_company_id"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none shadow-sm font-sans"
                    value={currCompanyId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrCompanyId(val);
                      const selected = compList?.find((c) => String(c.id) === val);
                      if (selected) {
                        const nameInput = document.getElementById("quote_customer_name") as HTMLInputElement;
                        const taxNum = document.getElementById("quote_tax_number") as HTMLInputElement;
                        const taxOff = document.getElementById("quote_tax_office") as HTMLInputElement;
                        const repInput = document.getElementById("quote_customer_title") as HTMLInputElement;
                        if (nameInput) nameInput.value = selected.title || "";
                        if (taxNum) taxNum.value = selected.tax_number || "";
                        if (taxOff) taxOff.value = selected.tax_office || "";
                        if (repInput) repInput.value = selected.representative || "";
                      }
                    }}
                  >
                    <option value="">{isTr ? "-- Yeni Cari / Manuel Giriş --" : "-- New Client / Manual Input --"}</option>
                    {compList?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.balance ? `(${Number(c.balance).toLocaleString("tr-TR")} ${c.currency || 'TRY'})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isTr ? "Müşteri Adı *" : "Customer Name *"}
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
                    {isTr ? "Yetkili / Unvan" : "Representative / Title"}
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
                    {isTr ? "Vergi Dairesi" : "Tax Office"}
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
                    {isTr ? "Vergi Numarası VKN" : "Tax Number"}
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
                {isTr ? "Akçeli Koşullar" : "Financial Terms"}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isTr ? "Para Birimi" : "Currency"}
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
                    {isTr ? "Döviz Kuru" : "Exchange Rate"}
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
                    {isTr ? "Ödeme Yöntemi" : "Payment Method"}
                  </label>
                  <select
                    name="payment_method"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none shadow-sm"
                    defaultValue={editingQuotation?.payment_method || "bank"}
                  >
                    <option value="cash">{isTr ? "Nakit Ödeme" : "Cash"}</option>
                    <option value="credit_card">{isTr ? "Kredi Kartı" : "Credit Card"}</option>
                    <option value="bank">{isTr ? "Banka Havalesi / EFT" : "Bank Transfer"}</option>
                    <option value="term">{isTr ? "Vadeli Ödeme" : "Term Sale"}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isTr ? "Geçerlilik Tarihi (Vade)" : "Expiry Date / Due"}
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-900 shadow-sm"
                    defaultValue={
                      editingQuotation?.expiry_date
                        ? new Date(editingQuotation.expiry_date).toISOString().split("T")[0]
                        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                    }
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
                  {isTr ? "Birim Fiyatlara KDV / Vergiler Dahildir." : "Prices Include VAT / Taxes."}
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Ek Notlar (Teklif Metni)" : "Quotation Notes"}
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
                  {isTr ? "Teklif Kalemleri *" : "Quotation Items *"}
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
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-25 max-h-52 overflow-y-auto divide-y divide-slate-100 p-2">
                      {setShowQuickProductModal && (
                        <div className="p-1 border-b border-slate-100 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuickProductModal(true);
                              setProdSearch("");
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 transition-all shadow-xs"
                          >
                            <Plus className="h-3 w-3" />
                            {isTr ? `Hızlı Ürün Ekle: "${prodSearch}"` : `Quick Add Product: "${prodSearch}"`}
                          </button>
                        </div>
                      )}
                      {products
                        ?.filter(
                          (p) =>
                            p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                            p.barcode?.toLowerCase().includes(prodSearch.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((p) => (
                           <button
                             key={p.id}
                             type="button"
                             onClick={() => {
                               const exist = quotationItems?.findIndex((item) => item.product_id === p.id);
                               if (exist > -1 && setQuotationItems) {
                                 const updated = [...quotationItems];
                                 updated[exist].quantity += 1;
                                 updated[exist].total_price = updated[exist].quantity * updated[exist].unit_price;
                                 setQuotationItems(updated);
                               } else if (setQuotationItems) {
                                 setQuotationItems([
                                   ...quotationItems,
                                   {
                                     product_id: p.id,
                                     product_name: p.name,
                                     barcode: p.barcode,
                                     quantity: 1,
                                     unit_price: Number(p.price),
                                     tax_rate: Number(p.tax_rate ?? 20),
                                     total_price: Number(p.price),
                                   },
                                 ]);
                               }
                               setProdSearch("");
                             }}
                             className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors rounded-xl flex justify-between items-center text-xs"
                           >
                             <div>
                               <p className="font-bold text-slate-800">{p.name}</p>
                               {p.barcode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{p.barcode}</p>}
                             </div>
                             <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-xl whitespace-nowrap">
                               {Number(p.price).toLocaleString("tr-TR")} {p.currency}
                             </span>
                           </button>
                         ))}
                       {products?.filter(
                         (p) =>
                           p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                           p.barcode?.toLowerCase().includes(prodSearch.toLowerCase())
                       ).length === 0 && (
                         <div className="p-4 text-center">
                           <p className="text-xs text-slate-500">{isTr ? "Başka uyuşan ürün bulunamadı." : "No other matched products found."}</p>
                         </div>
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
                        <p className="text-xs font-bold text-slate-800 leading-tight">{item.product_name}</p>
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
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isTr ? "Miktar" : "Qty"}</span>
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
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isTr ? "Birim Fiyat" : "Price"}</span>
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
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isTr ? "KDV %" : "Tax %"}</span>
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
                      {isTr ? "Satır Toplamı: " : "Cost total: "}
                      {Number(item.total_price || item.quantity * item.unit_price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                {quotationItems?.length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-slate-400 text-xs font-extrabold mt-2 leading-tight">
                      {isTr ? "Henüz teklif kalemi eklemediniz." : "No items added. Find items above to append."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Costs Totals Box */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
              <div className="flex justify-between items-center text-slate-700 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider">{isTr ? "Genel Toplam" : "Quotation Grand Cost"}</span>
                <span className="text-xl font-black text-slate-900 leading-none">
                  {Number(quotationItems?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuotationModal(false);
                    setEditingQuotation(null);
                    setQuotationItems([]);
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
                  {isTr ? "Teklifi Kaydet" : "Save Quotation"}
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

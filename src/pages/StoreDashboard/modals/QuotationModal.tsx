import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Search, Plus, Trash2, FileText, ChevronRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
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

  const totalLinesAmount = quotationItems?.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || 0;
  const currencySymbol = branding?.default_currency || "TRY";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] max-h-[820px] min-h-[580px] flex flex-col overflow-hidden font-sans"
      >
        {/* Futuristic Minimalist Header */}
        <div className="h-14 px-5 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium tracking-tight text-white uppercase">
                  {editingQuotation ? (isTr ? "Teklifi Düzenle" : "Edit Quotation") : (isTr ? "Yeni Teklif Oluştur" : "Create New Quotation")}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wider">
                  Lookprice Proforma
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isTr ? "Hızlı teklif oluşturma, cari eşleme ve anlık kalem yönetimi" : "Fast quotation engine, cari linking & live item dispatch"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">{isTr ? "Kalem Sayısı:" : "Items:"}</span>
              <span className="font-mono font-medium text-indigo-400">{quotationItems?.length || 0}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">{isTr ? "Canlı Tutar:" : "Total:"}</span>
              <span className="font-mono font-medium text-emerald-400">
                {totalLinesAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {currencySymbol}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQuotationModal(false);
                setEditingQuotation(null);
                setQuotationItems([]);
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Grid - Single Screen Viewport Architecture */}
        <form
          onSubmit={(e) => {
            if (handleAddQuotation) handleAddQuotation(e);
          }}
          className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
        >
          {/* Left Column (5 Cols) - Cari & Financial Parameters */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-between p-3.5 border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden space-y-2.5">
            {/* Box 1: Cari & Müşteri */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  {isTr ? "Cari / Müşteri Bilgileri" : "Client / Customer"}
                </span>
                {!currCompanyId && (
                  <button
                    type="button"
                    disabled={savingCari}
                    onClick={handleSaveAsCari}
                    className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800/50"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    {savingCari ? (isTr ? "Kaydediliyor..." : "Saving...") : (isTr ? "Cari Olarak Kaydet" : "Save as Cari")}
                  </button>
                )}
              </div>

              {/* Cari Selector */}
              <div>
                <select
                  name="company_id"
                  id="quote_company_id"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"
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
                  <option value="">{isTr ? "⚡ Hızlı Giriş / Yeni Müşteri (Seçimsiz)" : "⚡ Quick Entry / New Client"}</option>
                  {compList?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.balance ? `(${Number(c.balance).toLocaleString("tr-TR")} ${c.currency || 'TRY'})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Müşteri / Ünvan *" : "Customer Title *"}
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    id="quote_customer_name"
                    required
                    placeholder={isTr ? "Örn: ABC Ltd. Şti." : "Company Name"}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none"
                    defaultValue={editingQuotation?.customer_name || ""}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Yetkili Kişi" : "Contact Person"}
                  </label>
                  <input
                    type="text"
                    name="customer_title"
                    id="quote_customer_title"
                    placeholder={isTr ? "Örn: Ahmet Yılmaz" : "Authorized Person"}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none"
                    defaultValue={editingQuotation?.customer_title || ""}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Vergi Dairesi" : "Tax Office"}
                  </label>
                  <input
                    type="text"
                    name="tax_office"
                    id="quote_tax_office"
                    placeholder={isTr ? "Vergi Dairesi" : "Tax Office"}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none"
                    defaultValue={editingQuotation?.tax_office || ""}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Vergi No / VKN" : "Tax / VKN"}
                  </label>
                  <input
                    type="text"
                    name="tax_number"
                    id="quote_tax_number"
                    placeholder={isTr ? "10 veya 11 hane" : "Tax ID / VKN"}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none font-mono"
                    defaultValue={editingQuotation?.tax_number || ""}
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Finansal Koşullar & Vade */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isTr ? "Ticari & Finansal Koşullar" : "Commercial Terms"}
              </span>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Para Birimi" : "Currency"}
                  </label>
                  <select
                    name="currency"
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 outline-none"
                    defaultValue={editingQuotation?.currency || branding?.default_currency || "TRY"}
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (₣)</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Döviz Kuru" : "Rate"}
                  </label>
                  <input
                    type="text"
                    name="exchange_rate"
                    placeholder="1.00"
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-slate-100 outline-none text-center"
                    defaultValue={editingQuotation?.exchange_rate || "1"}
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Ödeme Şekli" : "Payment"}
                  </label>
                  <select
                    name="payment_method"
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                    defaultValue={editingQuotation?.payment_method || "bank"}
                  >
                    <option value="cash">{isTr ? "Nakit" : "Cash"}</option>
                    <option value="credit_card">{isTr ? "K.Kartı" : "Card"}</option>
                    <option value="bank">{isTr ? "Havale/EFT" : "Transfer"}</option>
                    <option value="term">{isTr ? "Vadeli" : "Term"}</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {isTr ? "Vade Tarihi" : "Due Date"}
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none"
                    defaultValue={
                      editingQuotation?.expiry_date
                        ? new Date(editingQuotation.expiry_date).toISOString().split("T")[0]
                        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                    }
                  />
                </div>
              </div>

              {/* KDV Dahil / Hariç Futuristic Toggle Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (setIsTaxInclusive) setIsTaxInclusive(!isTaxInclusive);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-xs font-semibold ${
                    isTaxInclusive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tax_inclusive_checkbox"
                      checked={isTaxInclusive}
                      onChange={(e) => {
                        if (setIsTaxInclusive) setIsTaxInclusive(e.target.checked);
                      }}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                    />
                    <span>{isTr ? "Birim Fiyatlara KDV Dahildir" : "Prices Include VAT"}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                    isTaxInclusive ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}>
                    {isTaxInclusive ? (isTr ? "DAHİL" : "INCL") : (isTr ? "+ KDV HARİÇ" : "+ EXCL")}
                  </span>
                </button>
              </div>
            </div>

            {/* Box 3: Notlar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 shadow-xs space-y-1">
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {isTr ? "Teklif Notları & Teslimat Şartları" : "Quotation Terms & Delivery Notes"}
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder={isTr ? "Teklife özel teslimat, garanti veya geçerlilik notları..." : "Special delivery notes or terms..."}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none resize-none h-14"
                value={quotationNotes || ""}
                onChange={(e) => {
                  if (setQuotationNotes) setQuotationNotes(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Right Column (7 Cols) - Quotation Items & Action Command Center */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-between p-3.5 overflow-hidden">
            {/* Catalog Search & Fast Append Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder={isTr ? "Katalogdan ürün veya barkod ara..." : "Search catalog or barcode..."}
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none shadow-xs"
                  />

                  {prodSearch.trim() !== "" && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
                      {setShowQuickProductModal && (
                        <div className="p-1 mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuickProductModal(true);
                              setProdSearch("");
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
                          >
                            <Plus className="h-3 w-3" />
                            {isTr ? `Hızlı Ürün Tanımla: "${prodSearch}"` : `Quick Add Product: "${prodSearch}"`}
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
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors rounded-lg flex justify-between items-center text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                              {p.barcode && <p className="text-[10px] text-slate-400 font-mono">#{p.barcode}</p>}
                            </div>
                            <span className="text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200/50 shrink-0">
                              {Number(p.price).toLocaleString("tr-TR")} {p.currency || currencySymbol}
                            </span>
                          </button>
                        ))}
                      {products?.filter(
                        (p) =>
                          p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                          p.barcode?.toLowerCase().includes(prodSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center">
                          <p className="text-xs text-slate-400">{isTr ? "Uyuşan ürün bulunamadı." : "No matching products."}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {setShowQuickProductModal && (
                  <button
                    type="button"
                    onClick={() => setShowQuickProductModal(true)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-medium transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isTr ? "Hızlı Ürün" : "Quick Item"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* High-Density Futuristic Items Table */}
            <div className="flex-1 my-2 overflow-y-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
              <div className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700/80 px-3 py-1.5 grid grid-cols-12 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 z-10">
                <span className="col-span-5">{isTr ? "Kalem / Ürün Adı" : "Item / Product"}</span>
                <span className="col-span-2 text-center">{isTr ? "Miktar" : "Qty"}</span>
                <span className="col-span-2 text-right">{isTr ? "B.Fiyat" : "Price"}</span>
                <span className="col-span-1 text-center">{isTr ? "KDV" : "VAT"}</span>
                <span className="col-span-2 text-right pr-6">{isTr ? "Tutar" : "Total"}</span>
              </div>

              <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
                {quotationItems?.map((item, idx) => (
                  <div key={idx} className="px-3 py-1.5 grid grid-cols-12 items-center text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Item Name */}
                    <div className="col-span-5 pr-2 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">{item.product_name}</p>
                      {item.barcode && <span className="text-[9px] font-mono text-slate-400">#{item.barcode}</span>}
                    </div>

                    {/* Qty Controls */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 h-6">
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
                          className="px-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-mono font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {item.quantity}
                        </span>
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
                          className="px-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2 text-right">
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
                        className="w-20 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-medium text-slate-800 dark:text-slate-200 text-right outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* VAT Rate */}
                    <div className="col-span-1 text-center">
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
                        className="w-10 px-1 py-0.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-center text-slate-700 dark:text-slate-300 outline-none"
                      />
                    </div>

                    {/* Row Total & Trash Button */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100 text-xs">
                        {Number(item.total_price || item.quantity * item.unit_price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (setQuotationItems) {
                            setQuotationItems(quotationItems.filter((_, i) => i !== idx));
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!quotationItems || quotationItems.length === 0) && (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isTr ? "Henüz teklif kalemi eklenmedi" : "No items added yet"}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                      {isTr ? "Üstteki arama alanından katalogdaki ürünleri seçebilir veya hızlı kalem ekleyebilirsiniz." : "Search catalogue items above or add custom quick items."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions & Totals Cockpit */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {isTr ? "Teklif Genel Tutarı:" : "Total Quotation:"}
                </span>
                <span className="text-xl font-mono font-medium text-slate-900 dark:text-white leading-none">
                  {totalLinesAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  <span className="text-xs font-sans font-medium ml-1 text-indigo-600 dark:text-indigo-400">{currencySymbol}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {isTaxInclusive ? (isTr ? "(KDV Dahil)" : "(VAT Included)") : (isTr ? "(+ KDV)" : "(+ VAT)")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuotationModal(false);
                    setEditingQuotation(null);
                    setQuotationItems([]);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-xs transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!quotationItems || quotationItems.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isTr ? "Teklifi Kaydet" : "Save Quotation"}</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};


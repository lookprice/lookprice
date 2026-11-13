import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  Package,
  Receipt,
  Search,
  Plus,
  BookmarkCheck,
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  Link2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../services/api";
import { formatDateTR } from "../../../../utils/formatUtils";

export interface ExpenseCenterOption {
  id?: number;
  key: string;
  name: string;
}

interface PurchaseInvoiceApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
  isTr: boolean;
  products: any[];
  expenseCenters: ExpenseCenterOption[];
  onAddExpenseCenter: (name: string) => Promise<ExpenseCenterOption | null>;
  handleViewHtml?: (id: number, inv?: any) => void;
  storeId?: number;
  onApproved: () => Promise<void> | void;
}

interface LineDecisionState {
  itemId: number;
  action: "match" | "create" | "skip";
  targetProductId: number | null;
  searchQuery: string;
  pickerOpen: boolean;
  createName: string;
  createBarcode: string;
  createProductCode: string;
  createCostPrice: string;
  createSellPrice: string;
  reserveEnabled: boolean;
  reservedQuantity: string;
  reservedFor: string;
}

const EXPENSE_CATEGORIES = [
  { value: "ELEKTRIK", tr: "Elektrik", en: "Electricity" },
  { value: "SU", tr: "Su", en: "Water" },
  { value: "DOGALGAZ", tr: "Doğalgaz / Isınma", en: "Gas / Heating" },
  { value: "TELEKOM", tr: "İnternet / İletişim", en: "Internet / Telecom" },
  { value: "AKARYAKIT", tr: "Akaryakıt / Ulaşım", en: "Fuel / Transport" },
  { value: "KARGO", tr: "Kargo / Nakliye", en: "Cargo / Freight" },
  { value: "KIRA", tr: "Kira / Aidat", en: "Rent / Dues" },
  { value: "HIZMET", tr: "Genel Hizmet / Danışmanlık", en: "Service / Consulting" },
  { value: "OFIS", tr: "Ofis / Kırtasiye / Sarf", en: "Office / Consumables" },
  { value: "diger", tr: "Diğer Gider", en: "Other Expense" },
];

export const PurchaseInvoiceApprovalModal: React.FC<PurchaseInvoiceApprovalModalProps> = ({
  isOpen,
  onClose,
  invoice,
  isTr,
  products,
  expenseCenters,
  onAddExpenseCenter,
  handleViewHtml,
  storeId,
  onApproved,
}) => {
  const [mode, setMode] = useState<"stock" | "expense">("stock");
  const [expenseCategory, setExpenseCategory] = useState<string>("diger");
  const [expenseCenter, setExpenseCenter] = useState<string>("office");
  const [rememberSupplierExpense, setRememberSupplierExpense] = useState<boolean>(false);
  const [addingCenter, setAddingCenter] = useState<boolean>(false);
  const [newCenterName, setNewCenterName] = useState<string>("");
  const [savingCenter, setSavingCenter] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [decisions, setDecisions] = useState<Record<number, LineDecisionState>>({});

  useEffect(() => {
    if (!isOpen || !invoice) return;

    const suggestExpense = Boolean(invoice.is_expense || invoice.suggested_is_expense);
    setMode(suggestExpense ? "expense" : "stock");
    setExpenseCategory(invoice.expense_category || "diger");
    setExpenseCenter(
      invoice.expense_center ||
        expenseCenters?.[0]?.key ||
        "office"
    );
    setRememberSupplierExpense(false);
    setAddingCenter(false);
    setNewCenterName("");

    const initialMap: Record<number, LineDecisionState> = {};
    const invItems = Array.isArray(invoice.items) ? invoice.items : [];
    for (const item of invItems) {
      const hasMatched = Boolean(item.product_id);
      const hasSuggested = Boolean(item.suggested_product_id);
      const isFeeHint = String(item.match_note || "").toLowerCase().includes("hizmet");

      let defaultAction: "match" | "create" | "skip" = "create";
      let defaultTargetId: number | null = null;
      if (hasMatched) {
        defaultAction = "match";
        defaultTargetId = Number(item.product_id);
      } else if (hasSuggested) {
        defaultAction = "match";
        defaultTargetId = Number(item.suggested_product_id);
      } else if (isFeeHint) {
        defaultAction = "skip";
      }

      const unitPrice = Number(item.unit_price || 0);
      const taxRate = Number(item.tax_rate ?? 20);
      const suggestedSell = unitPrice > 0 ? (unitPrice * (1 + taxRate / 100) * 1.25).toFixed(2) : "";
      const existingResQty = Number(item.reserved_quantity || 0);

      initialMap[item.id] = {
        itemId: item.id,
        action: defaultAction,
        targetProductId: defaultTargetId,
        searchQuery: "",
        pickerOpen: false,
        createName: item.product_name || "",
        createBarcode: item.barcode || "",
        createProductCode: item.product_code || "",
        createCostPrice: unitPrice > 0 ? unitPrice.toFixed(2) : "0",
        createSellPrice: suggestedSell,
        reserveEnabled: existingResQty > 0,
        reservedQuantity: existingResQty > 0 ? String(existingResQty) : String(item.quantity || 1),
        reservedFor: item.reserved_for || "",
      };
    }
    setDecisions(initialMap);
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const invItems = Array.isArray(invoice.items) ? invoice.items : [];

  const updateDecision = (itemId: number, patch: Partial<LineDecisionState>) => {
    setDecisions((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  };

  const handleSaveNewCenter = async () => {
    const trimmed = newCenterName.trim();
    if (!trimmed) return;
    setSavingCenter(true);
    try {
      const created = await onAddExpenseCenter(trimmed);
      if (created?.key) {
        setExpenseCenter(created.key);
        setNewCenterName("");
        setAddingCenter(false);
      }
    } finally {
      setSavingCenter(false);
    }
  };

  const handleConfirm = async () => {
    if (mode === "expense") {
      if (!expenseCenter) {
        toast.error(isTr ? "Lütfen bir gider yeri seçin." : "Please select an expense center.");
        return;
      }
    } else {
      for (const item of invItems) {
        const d = decisions[item.id];
        if (!d) continue;
        if (d.action === "match" && !d.targetProductId) {
          toast.error(
            isTr
              ? `"${item.product_name}" kalemi için envanter ürünü seçin veya Yeni Ürün / Hizmet seçin.`
              : `Select a product for "${item.product_name}".`
          );
          return;
        }
        if (d.action === "create" && !d.createName.trim()) {
          toast.error(isTr ? "Yeni açılacak ürün için isim girin." : "Enter name for new product.");
          return;
        }
        if ((d.action === "match" || d.action === "create") && d.reserveEnabled) {
          const rq = Number(String(d.reservedQuantity).replace(",", ".")) || 0;
          if (rq <= 0 || !d.reservedFor.trim()) {
            toast.error(
              isTr
                ? `"${item.product_name}" kaleminde Rezerve için miktar ve "Kime?" bilgisini girin.`
                : `Enter quantity and recipient for reserve on "${item.product_name}".`
            );
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const payload =
        mode === "expense"
          ? {
              mode: "expense",
              expense_category: expenseCategory || "diger",
              expense_center: expenseCenter,
              remember_supplier_expense: rememberSupplierExpense,
            }
          : {
              mode: "stock",
              remember_supplier_expense: false,
              items: invItems.map((item: any) => {
                const d = decisions[item.id];
                const resQty =
                  d?.reserveEnabled && (d.action === "match" || d.action === "create")
                    ? Math.max(0, Number(String(d.reservedQuantity).replace(",", ".")) || 0)
                    : 0;
                return {
                  itemId: item.id,
                  action: d?.action || "skip",
                  targetProductId: d?.action === "match" ? d.targetProductId : null,
                  createProductData:
                    d?.action === "create"
                      ? {
                          name: d.createName.trim(),
                          barcode: d.createBarcode.trim() || null,
                          product_code: d.createProductCode.trim() || null,
                          cost_price: Number(String(d.createCostPrice).replace(",", ".")) || 0,
                          price: Number(String(d.createSellPrice).replace(",", ".")) || 0,
                        }
                      : undefined,
                  reserved_quantity: resQty,
                  reserved_for: resQty > 0 ? d?.reservedFor?.trim() || "" : "",
                };
              }),
            };

      const res = await api.approvePurchaseInvoiceOperator(invoice.id, payload, storeId);
      if (res?.error || !res?.success) {
        throw new Error(res?.error || (isTr ? "Onay işlemi tamamlanamadı." : "Approval failed."));
      }

      toast.success(
        res.message ||
          (mode === "expense"
            ? isTr
              ? "Fatura gider olarak onaylandı."
              : "Invoice approved as expense."
            : isTr
              ? "Fatura stoklara ve rezervelere işlendi."
              : "Invoice approved and stocked.")
      );
      await onApproved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "İşlem sırasında hata oluştu." : "Error occurred."));
    } finally {
      setSubmitting(false);
    }
  };

  const matchCount = invItems.filter((i: any) => decisions[i.id]?.action === "match").length;
  const createCount = invItems.filter((i: any) => decisions[i.id]?.action === "create").length;
  const skipCount = invItems.filter((i: any) => decisions[i.id]?.action === "skip").length;
  const reservedLineCount = invItems.filter(
    (i: any) =>
      (decisions[i.id]?.action === "match" || decisions[i.id]?.action === "create") &&
      decisions[i.id]?.reserveEnabled
  ).length;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* High-Contrast Dark Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                {isTr ? "OPERATÖR ONAYI BEKLİYOR" : "OPERATOR REVIEW"}
              </span>
              {(invoice.is_out_of_sequence || invoice.is_prev_month_carryover) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white">
                  <AlertTriangle className="w-3 h-3" />
                  {invoice.is_prev_month_carryover
                    ? isTr
                      ? "Önceki Ay Devir"
                      : "Prev Month"
                    : isTr
                      ? "Ara Tarihli"
                      : "Backdated"}
                </span>
              )}
              <span className="text-xs font-mono text-slate-300">
                {invoice.invoice_number || invoice.document_number}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white truncate mt-1">
              {invoice.company_name || invoice.supplier_name || (isTr ? "Tedarikçi" : "Supplier")}
              <span className="ml-2 text-xs font-normal text-slate-300">
                • {formatDateTR(invoice.invoice_date)} •{" "}
                {Number(invoice.grand_total || 0).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                {invoice.currency || "TRY"}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {handleViewHtml && (
              <button
                type="button"
                onClick={() => handleViewHtml(invoice.id, invoice)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">{isTr ? "E-Fatura HTML" : "HTML"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Banner */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMode("stock")}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "stock"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>{isTr ? "Stoklu Alım Onayı" : "Approve to Stock"}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("expense")}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "expense"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>{isTr ? "Gider Olarak Onayla" : "Approve as Expense"}</span>
            </button>
          </div>

          {invoice.suggested_is_expense && (
            <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                {isTr
                  ? "Sistem ön uyarısı: Bu fatura büyük ihtimalle gider/hizmet faturasıdır."
                  : "System hint: Likely an expense invoice."}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white text-slate-900">
          {mode === "expense" ? (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                {isTr
                  ? "Bu fatura Gider Faturası olarak onaylanacaktır. Kalemlerden hiçbir ürün kartı açılmaz ve envanter stoklarına ekleme yapılmaz."
                  : "No products will be created or stocked for this expense invoice."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    {isTr ? "Gider Kategorisi" : "Expense Category"}
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {isTr ? c.tr : c.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      {isTr ? "Gider Yeri" : "Expense Center"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddingCenter((v) => !v)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {isTr ? "Yeni Gider Yeri" : "New"}
                    </button>
                  </div>
                  <select
                    value={expenseCenter}
                    onChange={(e) => setExpenseCenter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {expenseCenters.map((ec) => (
                      <option key={ec.key} value={ec.key}>
                        {ec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {addingCenter && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={newCenterName}
                    onChange={(e) => setNewCenterName(e.target.value)}
                    placeholder={isTr ? "Örn: Depo, Araç Filo, Yemekhane..." : "New expense center name"}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={savingCenter || !newCenterName.trim()}
                    onClick={handleSaveNewCenter}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {savingCenter ? "..." : isTr ? "Ekle & Seç" : "Add"}
                  </button>
                </div>
              )}

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberSupplierExpense}
                  onChange={(e) => setRememberSupplierExpense(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">
                    {isTr
                      ? "Bu tedarikçiyi gider carisi olarak hatırla"
                      : "Remember this supplier as expense"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isTr
                      ? "İşaretlerseniz bu VKN/cari'den gelecek sonraki faturalar varsayılan olarak gider önerisiyle gelir."
                      : "Future invoices from this supplier will suggest this expense setting."}
                  </div>
                </div>
              </label>

              {invItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {isTr ? `Fatura Satırları (${invItems.length})` : `Invoice Lines (${invItems.length})`}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {invItems.map((item: any, i: number) => (
                      <div key={item.id || i} className="px-3 py-2 flex items-center justify-between text-xs gap-2">
                        <span className="font-medium text-slate-800 truncate">{item.product_name}</span>
                        <span className="font-mono text-slate-600 shrink-0">
                          {Number(item.quantity || 0)} x {Number(item.unit_price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {invItems.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  {isTr ? "Bu faturada onaylanacak kalem bulunamadı." : "No invoice items found."}
                </div>
              ) : (
                invItems.map((item: any, idx: number) => {
                  const d = decisions[item.id];
                  if (!d) return null;

                  const matchedProductObj = d.targetProductId
                    ? products.find((p: any) => Number(p.id) === Number(d.targetProductId))
                    : null;

                  const searchLower = (d.searchQuery || "").trim().toLocaleLowerCase("tr-TR");
                  const filteredCandidates = d.pickerOpen
                    ? products
                        .filter((p: any) => {
                          if (!searchLower) return true;
                          const nm = (p.name || "").toLocaleLowerCase("tr-TR");
                          const bc = (p.barcode || "").toLocaleLowerCase("tr-TR");
                          const cd = (p.product_code || p.sku || "").toLocaleLowerCase("tr-TR");
                          return nm.includes(searchLower) || bc.includes(searchLower) || cd.includes(searchLower);
                        })
                        .slice(0, 12)
                    : [];

                  return (
                    <div
                      key={item.id || idx}
                      className={`rounded-xl border p-3 transition-all ${
                        d.action === "skip"
                          ? "bg-slate-50/70 border-slate-200"
                          : d.reserveEnabled
                            ? "bg-amber-50/30 border-amber-300"
                            : "bg-white border-slate-200"
                      }`}
                    >
                      {/* Top row: Item info + Qty + Action tabs */}
                      <div className="flex flex-wrap items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                            <span className="text-xs font-semibold text-slate-900">{item.product_name}</span>
                            {item.barcode && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-mono">
                                {item.barcode}
                              </span>
                            )}
                            {item.product_code && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-mono">
                                Kod: {item.product_code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">
                              {Number(item.quantity || 0).toLocaleString("tr-TR")} {item.unit_code || "Adet"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {Number(item.unit_price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}{" "}
                              {invoice.currency || "TRY"}
                            </span>
                            {item.match_note && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium">
                                {item.match_note}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compact 3-way Action Pill */}
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateDecision(item.id, {
                                action: "match",
                                pickerOpen: !d.targetProductId,
                              })
                            }
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              d.action === "match"
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Link2 className="w-3 h-3" />
                            {isTr ? "Eşleştir" : "Match"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDecision(item.id, { action: "create", pickerOpen: false })}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              d.action === "create"
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            {isTr ? "Yeni Aç" : "Create"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateDecision(item.id, {
                                action: "skip",
                                pickerOpen: false,
                                reserveEnabled: false,
                              })
                            }
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              d.action === "skip"
                                ? "bg-slate-800 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            {isTr ? "Atla / Hizmet" : "Skip"}
                          </button>
                        </div>
                      </div>

                      {/* Mode-specific details */}
                      {d.action === "match" && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {matchedProductObj ? (
                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold">{matchedProductObj.name}</span>
                                <span className="text-[10px] font-mono text-emerald-700">
                                  (Stok: {matchedProductObj.stock_quantity ?? 0})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateDecision(item.id, { pickerOpen: !d.pickerOpen })}
                                  className="ml-1 px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                                >
                                  {isTr ? "Değiştir" : "Change"}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateDecision(item.id, { pickerOpen: true })}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                              >
                                {isTr ? "Envanterden Ürün Seç..." : "Pick Inventory Product..."}
                              </button>
                            )}

                            {/* Inline Rezerve Toggle & Bounded Fields */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDecision(item.id, {
                                    reserveEnabled: !d.reserveEnabled,
                                    reservedQuantity: d.reservedQuantity || String(item.quantity || 1),
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                  d.reserveEnabled
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                                }`}
                              >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                {isTr ? "Rezerve" : "Reserve"}
                              </button>

                              {d.reserveEnabled && (
                                <>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="1"
                                    value={d.reservedQuantity}
                                    onChange={(e) =>
                                      updateDecision(item.id, { reservedQuantity: e.target.value })
                                    }
                                    className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                                    title={isTr ? "Rezerve Miktarı" : "Reserved Qty"}
                                  />
                                  <input
                                    type="text"
                                    value={d.reservedFor}
                                    onChange={(e) =>
                                      updateDecision(item.id, { reservedFor: e.target.value })
                                    }
                                    placeholder={isTr ? "Kime? (Müşteri / Firma)" : "For whom?"}
                                    className="w-48 sm:w-56 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {d.pickerOpen && (
                            <div className="p-2.5 bg-slate-900 text-white rounded-xl border border-slate-700 space-y-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={d.searchQuery}
                                  onChange={(e) => updateDecision(item.id, { searchQuery: e.target.value })}
                                  placeholder={isTr ? "Ürün adı, kod veya barkod ara..." : "Search product..."}
                                  className="w-full pl-8 pr-8 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => updateDecision(item.id, { pickerOpen: false })}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950">
                                {filteredCandidates.length === 0 ? (
                                  <div className="p-2.5 text-center text-[11px] text-slate-400">
                                    {isTr ? "Eşleşen envanter ürünü bulunamadı." : "No products found."}
                                  </div>
                                ) : (
                                  filteredCandidates.map((p: any) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() =>
                                        updateDecision(item.id, {
                                          targetProductId: p.id,
                                          pickerOpen: false,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-950/80 flex items-center justify-between gap-2 cursor-pointer"
                                    >
                                      <div className="min-w-0">
                                        <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {p.barcode || "-"} • Stok: {p.stock_quantity ?? 0}
                                        </div>
                                      </div>
                                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-semibold shrink-0">
                                        {isTr ? "Seç" : "Select"}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {d.action === "create" && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={d.createName}
                              onChange={(e) => updateDecision(item.id, { createName: e.target.value })}
                              placeholder={isTr ? "Yeni Ürün Adı" : "New Product Name"}
                              className="flex-1 min-w-[200px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                            />
                            <input
                              type="text"
                              value={d.createBarcode}
                              onChange={(e) => updateDecision(item.id, { createBarcode: e.target.value })}
                              placeholder={isTr ? "Barkod (Oto)" : "Barcode"}
                              className="w-36 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                            />
                            <input
                              type="text"
                              value={d.createProductCode}
                              onChange={(e) => updateDecision(item.id, { createProductCode: e.target.value })}
                              placeholder={isTr ? "Ürün Kodu" : "Code"}
                              className="w-28 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={d.createSellPrice}
                              onChange={(e) => updateDecision(item.id, { createSellPrice: e.target.value })}
                              placeholder={isTr ? "Satış Fiyatı" : "Price"}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                              title={isTr ? "Önerilen Satış Fiyatı" : "Sell Price"}
                            />
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                updateDecision(item.id, {
                                  reserveEnabled: !d.reserveEnabled,
                                  reservedQuantity: d.reservedQuantity || String(item.quantity || 1),
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                d.reserveEnabled
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                              }`}
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              {isTr ? "Rezerve" : "Reserve"}
                            </button>

                            {d.reserveEnabled && (
                              <>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="1"
                                  value={d.reservedQuantity}
                                  onChange={(e) =>
                                    updateDecision(item.id, { reservedQuantity: e.target.value })
                                  }
                                  className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-semibold text-slate-900"
                                />
                                <input
                                  type="text"
                                  value={d.reservedFor}
                                  onChange={(e) =>
                                    updateDecision(item.id, { reservedFor: e.target.value })
                                  }
                                  placeholder={isTr ? "Kime? (Müşteri / Firma)" : "For whom?"}
                                  className="w-48 sm:w-56 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-600">
            {mode === "stock" ? (
              <>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {isTr ? `Eşleşen: ${matchCount}` : `Matched: ${matchCount}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {isTr ? `Yeni Kart: ${createCount}` : `Create: ${createCount}`}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {isTr ? `Atlanan: ${skipCount}` : `Skipped: ${skipCount}`}
                </span>
                {reservedLineCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                    {isTr ? `Rezerve: ${reservedLineCount} satır` : `Reserved: ${reservedLineCount}`}
                  </span>
                )}
              </>
            ) : (
              <span>
                {isTr ? "Gider Yeri:" : "Expense Center:"}{" "}
                <strong className="text-slate-900">
                  {expenseCenters.find((c) => c.key === expenseCenter)?.name || expenseCenter}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {isTr ? "Vazgeç" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 ${
                mode === "expense"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {mode === "expense"
                  ? isTr
                    ? "Gider Olarak Onayla"
                    : "Approve Expense"
                  : isTr
                    ? "Stokları & Eşleşmeleri Onayla"
                    : "Approve & Stock"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

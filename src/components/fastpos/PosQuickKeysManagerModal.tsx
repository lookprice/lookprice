import React, { useState, useRef, useMemo } from "react";
import { motion } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Zap,
  Calculator,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  PosQuickKey,
  QuickKeyColor,
  QuickKeysPlacement,
  QUICK_KEY_COLOR_MAP,
  QUICK_KEY_PRESETS,
} from "./PosQuickKeysBar";

interface FiscalDeptOption {
  id: number;
  name?: string;
  vatRate: number;
}

interface PosQuickKeysManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  quickKeys: PosQuickKey[];
  placement: QuickKeysPlacement;
  allProducts: any[];
  fiscalDepartments?: FiscalDeptOption[];
  onSaveConfig: (keys: PosQuickKey[], nextPlacement: QuickKeysPlacement) => void;
  onOpenNumpad?: (config: {
    title: string;
    subtitle?: string;
    initialValue: string;
    allowDecimal?: boolean;
    unitSuffix?: string;
    onConfirm: (val: string) => void;
  }) => void;
}

const COLORS: Array<{ id: QuickKeyColor; label: string }> = [
  { id: "indigo", label: "Mor/Mavi" },
  { id: "emerald", label: "Yeşil" },
  { id: "amber", label: "Turuncu" },
  { id: "sky", label: "Açık Mavi" },
  { id: "rose", label: "Kırmızı" },
  { id: "slate", label: "Koyu Gri" },
];

const parsePriceValue = (raw: string | number): number => {
  const num = parseFloat(String(raw ?? "").replace(",", "."));
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100) / 100;
};

const parseVatValue = (raw: string | number, fallback = 20): number => {
  const cleaned = String(raw ?? "").replace("%", "").replace(",", ".").trim();
  if (cleaned === "") return fallback;
  const num = parseFloat(cleaned);
  if (Number.isNaN(num) || !Number.isFinite(num)) return fallback;
  return Math.min(100, Math.max(0, Math.round(num * 100) / 100));
};

interface QuickKeyRowProps {
  item: PosQuickKey;
  idx: number;
  totalCount: number;
  isEditing: boolean;
  lang: string;
  onMove: (idx: number, delta: -1 | 1) => void;
  onEdit: (item: PosQuickKey) => void;
  onDelete: (id: string) => void;
  onInlineUpdate: (id: string, patch: Partial<PosQuickKey>) => void;
  onOpenNumpad?: PosQuickKeysManagerModalProps["onOpenNumpad"];
}

const QuickKeyRow: React.FC<QuickKeyRowProps> = ({
  item,
  idx,
  totalCount,
  isEditing,
  lang,
  onMove,
  onEdit,
  onDelete,
  onInlineUpdate,
  onOpenNumpad,
}) => {
  const [rowPrice, setRowPrice] = useState<string>(String(item.price ?? 0));
  const [rowTax, setRowTax] = useState<string>(String(item.tax_rate ?? 20));

  React.useEffect(() => {
    setRowPrice(String(item.price ?? 0));
    setRowTax(String(item.tax_rate ?? 20));
  }, [item.id, item.price, item.tax_rate]);

  const theme = QUICK_KEY_COLOR_MAP[item.color || "indigo"] || QUICK_KEY_COLOR_MAP.indigo;

  const commitInlinePrice = (valStr: string) => {
    const nextPrice = parsePriceValue(valStr);
    setRowPrice(String(nextPrice));
    if (nextPrice !== Number(item.price || 0) || item.askPrice) {
      onInlineUpdate(item.id, { price: nextPrice, askPrice: false });
    }
  };

  const commitInlineTax = (valStr: string) => {
    const nextTax = parseVatValue(valStr, Number(item.tax_rate ?? 20));
    setRowTax(String(nextTax));
    if (nextTax !== Number(item.tax_rate ?? 20)) {
      onInlineUpdate(item.id, { tax_rate: nextTax });
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
        isEditing ? "bg-indigo-50/70 border-indigo-400" : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${theme.badge}`}>
          #{idx + 1}
        </span>
        <span className="text-xs font-black text-slate-900 truncate">{item.label}</span>
      </div>

      {/* Inline Price + Custom VAT Controls */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {item.askPrice ? (
          <button
            type="button"
            onClick={() => onInlineUpdate(item.id, { askPrice: false })}
            className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-[11px] font-black text-amber-950 cursor-pointer"
            title={lang === "tr" ? "Sabit fiyata çevirmek için tıklayın" : "Switch to fixed price"}
          >
            {lang === "tr" ? "Numpad Sor (Sabitle)" : "Ask ₺"}
          </button>
        ) : (
          <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-indigo-500">
            <input
              type="text"
              inputMode="decimal"
              value={rowPrice}
              onChange={(e) => setRowPrice(e.target.value)}
              onBlur={() => commitInlinePrice(rowPrice)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitInlinePrice(rowPrice);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              aria-label={`${item.label} fiyat`}
              className="w-16 px-1.5 py-1 text-xs font-black text-slate-900 text-right outline-none bg-transparent"
            />
            <span className="text-[11px] font-bold text-slate-500 pr-1">₺</span>
            {onOpenNumpad && (
              <button
                type="button"
                onClick={() =>
                  onOpenNumpad({
                    title: item.label,
                    subtitle: lang === "tr" ? "Yeni Hızlı Tuş Fiyatı" : "New Quick Key Price",
                    initialValue: rowPrice || "0",
                    allowDecimal: true,
                    unitSuffix: "₺",
                    onConfirm: (val) => commitInlinePrice(val),
                  })
                }
                className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                title={lang === "tr" ? "Numpad ile Fiyat Değiştir" : "Edit Price via Numpad"}
              >
                <Calculator className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Inline Custom VAT Input */}
        <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-indigo-500">
          <span className="text-[10px] font-black text-slate-500 pl-1.5">KDV %</span>
          <input
            type="text"
            inputMode="decimal"
            value={rowTax}
            onChange={(e) => setRowTax(e.target.value)}
            onBlur={() => commitInlineTax(rowTax)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitInlineTax(rowTax);
                (e.target as HTMLInputElement).blur();
              }
            }}
            aria-label={`${item.label} KDV`}
            className="w-10 px-1 py-1 text-xs font-black text-slate-900 text-center outline-none bg-transparent"
          />
        </div>

        <button
          type="button"
          disabled={idx === 0}
          onClick={() => onMove(idx, -1)}
          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
          title="Yukarı Taşı"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={idx === totalCount - 1}
          onClick={() => onMove(idx, 1)}
          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
          title="Aşağı Taşı"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
          title="Detaylı Düzenle"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 cursor-pointer"
          title="Sil"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const PosQuickKeysManagerModal: React.FC<PosQuickKeysManagerModalProps> = ({
  isOpen,
  onClose,
  lang,
  quickKeys,
  placement,
  allProducts,
  fiscalDepartments,
  onSaveConfig,
  onOpenNumpad,
}) => {
  const [keys, setKeys] = useState<PosQuickKey[]>(quickKeys);
  const [localPlacement, setLocalPlacement] = useState<QuickKeysPlacement>(placement);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("0");
  const [askPrice, setAskPrice] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState("20");
  const [color, setColor] = useState<QuickKeyColor>("indigo");
  const [unitLabel, setUnitLabel] = useState("Adet");
  const [productId, setProductId] = useState<string>("");

  const wasOpenRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const vatRateOptions = useMemo(() => {
    const base = [0, 1, 5, 8, 10, 16, 18, 20];
    const fromDepts = Array.isArray(fiscalDepartments)
      ? fiscalDepartments.map((d) => Number(d.vatRate)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 100)
      : [];
    return Array.from(new Set([...base, ...fromDepts])).sort((a, b) => a - b);
  }, [fiscalDepartments]);

  const resetForm = () => {
    setEditingId(null);
    setLabel("");
    setPrice("0");
    setAskPrice(false);
    setTaxRateInput("20");
    setColor("indigo");
    setUnitLabel("Adet");
    setProductId("");
  };

  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setKeys(quickKeys);
      setLocalPlacement(placement);
      resetForm();
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [isOpen, quickKeys, placement]);

  if (!isOpen) return null;

  const buildItemFromForm = (targetId: string | null): PosQuickKey | null => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const numericPrice = askPrice ? 0 : parsePriceValue(price);
    const numericTax = parseVatValue(taxRateInput, 20);
    return {
      id: targetId || `qk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: trimmed,
      price: numericPrice,
      askPrice,
      tax_rate: numericTax,
      color,
      unitLabel: unitLabel.trim() || "Adet",
      productId: productId ? Number(productId) : null,
    };
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const nextItem = buildItemFromForm(editingId);
    if (!nextItem) return;

    const nextList = editingId
      ? keys.map((k) => (k.id === editingId ? nextItem : k))
      : [...keys, nextItem];
    setKeys(nextList);
    onSaveConfig(nextList, localPlacement);
    toast.success(
      editingId
        ? (lang === "tr" ? `"${nextItem.label}" güncellendi ve kaydedildi.` : `"${nextItem.label}" updated.`)
        : (lang === "tr" ? `"${nextItem.label}" eklendi ve kaydedildi.` : `"${nextItem.label}" added.`)
    );
    resetForm();
  };

  const handleInlineUpdate = (id: string, patch: Partial<PosQuickKey>) => {
    const nextList = keys.map((k) => (k.id === id ? { ...k, ...patch } : k));
    setKeys(nextList);
    if (editingId === id) {
      if (patch.price !== undefined) setPrice(String(patch.price));
      if (patch.askPrice !== undefined) setAskPrice(Boolean(patch.askPrice));
      if (patch.tax_rate !== undefined) setTaxRateInput(String(patch.tax_rate));
    }
    onSaveConfig(nextList, localPlacement);
    toast.success(lang === "tr" ? "Hızlı tuş güncellendi." : "Quick key updated.");
  };

  const handleEdit = (item: PosQuickKey) => {
    setEditingId(item.id);
    setLabel(item.label);
    setPrice(String(item.price ?? 0));
    setAskPrice(Boolean(item.askPrice));
    setTaxRateInput(String(item.tax_rate ?? 20));
    setColor(item.color || "indigo");
    setUnitLabel(item.unitLabel || "Adet");
    setProductId(item.productId ? String(item.productId) : "");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 30);
  };

  const handleDelete = (id: string) => {
    const nextList = keys.filter((k) => k.id !== id);
    setKeys(nextList);
    onSaveConfig(nextList, localPlacement);
    if (editingId === id) resetForm();
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= keys.length) return;
    const nextList = [...keys];
    const [removed] = nextList.splice(index, 1);
    nextList.splice(target, 0, removed);
    setKeys(nextList);
    onSaveConfig(nextList, localPlacement);
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = QUICK_KEY_PRESETS[presetKey];
    if (!preset) return;
    const existingLabels = new Set(keys.map((k) => k.label.toLowerCase()));
    const fresh = preset.keys
      .filter((k) => !existingLabels.has(k.label.toLowerCase()))
      .map((k) => ({ ...k, id: `${k.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` }));
    const nextList = [...keys, ...fresh];
    setKeys(nextList);
    onSaveConfig(nextList, localPlacement);
  };

  const handleChangePlacement = (nextP: QuickKeysPlacement) => {
    setLocalPlacement(nextP);
    onSaveConfig(keys, nextP);
  };

  const handleDoneAndClose = () => {
    if (editingId) {
      const committed = buildItemFromForm(editingId);
      if (committed) {
        const nextList = keys.map((k) => (k.id === editingId ? committed : k));
        setKeys(nextList);
        onSaveConfig(nextList, localPlacement);
      }
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {lang === "tr" ? "Hızlı Tuş Yönetimi & Ekran Konumu" : "Quick Keys & Placement Manager"}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === "tr"
                  ? "Barkodsuz sık satılan ürünler oluşturun, fiyat ve KDV oranlarını doğrudan revize edin."
                  : "Create, edit, reorder and move quick shortcut buttons across the POS screen."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDoneAndClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Screen Placement Control */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Hızlı Tuş Panelinin Ekrandaki Yeri" : "Quick Keys Screen Placement"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "grid_top" as const, label: "Ürün Izgarası Üstü" },
                  { id: "grid_bottom" as const, label: "Ürün Izgarası Altı" },
                  { id: "cart_top" as const, label: "Sağ Sepet Üstü" },
                  { id: "hidden" as const, label: "Gizle" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChangePlacement(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                      localPlacement === opt.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Sector Starter Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-indigo-50/60 border border-indigo-200 rounded-xl">
            <span className="text-[11px] font-black text-indigo-950">
              {lang === "tr" ? "Hazır Sektör Tuş Takımı Ekle:" : "Add Starter Preset:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(QUICK_KEY_PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleApplyPreset(k)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Create / Edit Key Form (Compact Bounded Inputs AGENTS.md §13) */}
          <form ref={formRef} onSubmit={handleSaveItem} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase">
                {editingId
                  ? (lang === "tr" ? "Hızlı Tuşu Güncelle" : "Edit Quick Key")
                  : (lang === "tr" ? "Yeni Hızlı Tuş Oluştur" : "Add Quick Key")}
              </h4>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {lang === "tr" ? "Vazgeç" : "Cancel Edit"}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2.5">
              <div className="flex-1 min-w-[170px] space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Buton Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Fotokopi, Yiyecek & İçecek"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="w-36 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Fiyat (₺)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={askPrice}
                    value={askPrice ? "" : price}
                    placeholder={askPrice ? "Kasada sor" : "0.00"}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-l-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-200"
                  />
                  {onOpenNumpad && !askPrice && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenNumpad({
                          title: `${label || "Hızlı Tuş"} — Fiyat`,
                          initialValue: price || "0",
                          allowDecimal: true,
                          unitSuffix: "₺",
                          onConfirm: (val) => {
                            setPrice(val);
                            if (editingId) {
                              handleInlineUpdate(editingId, { price: parsePriceValue(val), askPrice: false });
                            }
                          },
                        })
                      }
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-r-lg border border-slate-800 cursor-pointer"
                      title="Dokunmatik Numpad ile Gir"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Custom / Free-Entry VAT % Input (AGENTS.md §13) */}
              <div className="w-24 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">KDV %</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={taxRateInput}
                    placeholder="20"
                    onChange={(e) => setTaxRateInput(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-l-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                  {onOpenNumpad ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenNumpad({
                          title: `${label || "Hızlı Tuş"} — KDV Oranı`,
                          initialValue: taxRateInput || "20",
                          allowDecimal: true,
                          unitSuffix: "%",
                          onConfirm: (val) => setTaxRateInput(String(parseVatValue(val, 20))),
                        })
                      }
                      className="px-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-r-lg border border-slate-800 cursor-pointer"
                      title="Numpad ile Özel KDV Gir"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="px-1.5 py-1.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-xs font-bold text-slate-600">%</span>
                  )}
                </div>
              </div>

              <div className="w-28 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Renk</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as QuickKeyColor)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                >
                  {COLORS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic KDV Quick Presets (includes store fiscal departments + regional rates) */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] font-black text-slate-500 mr-1">
                {lang === "tr" ? "Hızlı KDV:" : "Quick VAT:"}
              </span>
              {vatRateOptions.map((rate) => {
                const isSelected = parseVatValue(taxRateInput, -1) === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTaxRateInput(String(rate))}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    %{rate}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={askPrice}
                  onChange={(e) => setAskPrice(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <span>Kasada basıldığında Numpad açıp fiyat sor (Açık tutar / Manav / Fotokopi)</span>
              </label>

              {allProducts.length > 0 && (
                <select
                  value={productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setProductId(pid);
                    const found = allProducts.find((p) => String(p.id) === pid);
                    if (found) {
                      if (!label.trim()) setLabel(found.name);
                      setPrice(String(found.price || 0));
                      if (found.tax_rate !== undefined && found.tax_rate !== null) {
                        setTaxRateInput(String(found.tax_rate));
                      }
                    }
                  }}
                  className="max-w-[230px] px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 outline-none"
                >
                  <option value="">Katalog Ürününe Bağla (Opsiyonel)</option>
                  {allProducts.slice(0, 120).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Number(p.price || 0).toFixed(2)} ₺)
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                className="ml-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {editingId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingId ? "Güncelle" : "Ekle & Kaydet"}</span>
              </button>
            </div>
          </form>

          {/* 4. Active Quick Keys List with Inline Price/VAT & Reorder */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Tanımlı Hızlı Tuşlar ({keys.length}) — Fiyat veya KDV’yi satırdan doğrudan güncelleyebilirsiniz
            </h4>
            {keys.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
                Henüz hızlı tuş tanımlanmadı. Yukarıdaki formdan veya sektör şablonlarından tek tıkla ekleyin.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {keys.map((item, idx) => (
                  <QuickKeyRow
                    key={item.id}
                    item={item}
                    idx={idx}
                    totalCount={keys.length}
                    isEditing={editingId === item.id}
                    lang={lang}
                    onMove={handleMove}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onInlineUpdate={handleInlineUpdate}
                    onOpenNumpad={onOpenNumpad}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleDoneAndClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            {lang === "tr" ? "Kapat ve POS'a Dön" : "Done"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

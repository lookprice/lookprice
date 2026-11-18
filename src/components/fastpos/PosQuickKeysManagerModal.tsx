import React, { useState } from "react";
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
import {
  PosQuickKey,
  QuickKeyColor,
  QuickKeysPlacement,
  QUICK_KEY_COLOR_MAP,
  QUICK_KEY_PRESETS,
} from "./PosQuickKeysBar";

interface PosQuickKeysManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  quickKeys: PosQuickKey[];
  placement: QuickKeysPlacement;
  allProducts: any[];
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

export const PosQuickKeysManagerModal: React.FC<PosQuickKeysManagerModalProps> = ({
  isOpen,
  onClose,
  lang,
  quickKeys,
  placement,
  allProducts,
  onSaveConfig,
  onOpenNumpad,
}) => {
  const [keys, setKeys] = useState<PosQuickKey[]>(quickKeys);
  const [localPlacement, setLocalPlacement] = useState<QuickKeysPlacement>(placement);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("0");
  const [askPrice, setAskPrice] = useState(false);
  const [taxRate, setTaxRate] = useState(20);
  const [color, setColor] = useState<QuickKeyColor>("indigo");
  const [unitLabel, setUnitLabel] = useState("Adet");
  const [productId, setProductId] = useState<string>("");

  React.useEffect(() => {
    if (isOpen) {
      setKeys(quickKeys);
      setLocalPlacement(placement);
      resetForm();
    }
  }, [isOpen, quickKeys, placement]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setLabel("");
    setPrice("0");
    setAskPrice(false);
    setTaxRate(20);
    setColor("indigo");
    setUnitLabel("Adet");
    setProductId("");
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    const numericPrice = askPrice ? 0 : Math.max(0, parseFloat(String(price).replace(",", ".")) || 0);
    const nextItem: PosQuickKey = {
      id: editingId || `qk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: trimmed,
      price: numericPrice,
      askPrice,
      tax_rate: taxRate,
      color,
      unitLabel: unitLabel.trim() || "Adet",
      productId: productId ? Number(productId) : null,
    };

    const nextList = editingId
      ? keys.map((k) => (k.id === editingId ? nextItem : k))
      : [...keys, nextItem];
    setKeys(nextList);
    onSaveConfig(nextList, localPlacement);
    resetForm();
  };

  const handleEdit = (item: PosQuickKey) => {
    setEditingId(item.id);
    setLabel(item.label);
    setPrice(String(item.price ?? 0));
    setAskPrice(Boolean(item.askPrice));
    setTaxRate(Number(item.tax_rate ?? 20));
    setColor(item.color || "indigo");
    setUnitLabel(item.unitLabel || "Adet");
    setProductId(item.productId ? String(item.productId) : "");
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
                  ? "Barkodsuz sık satılan ürünler oluşturun, sırasını ve ekrandaki konumunu dilediğiniz gibi değiştirin."
                  : "Create, edit, reorder and move quick shortcut buttons across the POS screen."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
          <form onSubmit={handleSaveItem} className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
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
                          onConfirm: (val) => setPrice(val),
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

              <div className="w-20 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">KDV %</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value={1}>%1</option>
                  <option value={10}>%10</option>
                  <option value={20}>%20</option>
                  <option value={0}>%0</option>
                </select>
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
                      if (found.tax_rate !== undefined) setTaxRate(Number(found.tax_rate));
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

          {/* 4. Active Quick Keys List with Reorder */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Tanımlı Hızlı Tuşlar ({keys.length}) — Sırasını Oklarla Değiştirebilirsiniz
            </h4>
            {keys.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold">
                Henüz hızlı tuş tanımlanmadı. Yukarıdaki formdan veya sektör şablonlarından tek tıkla ekleyin.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {keys.map((item, idx) => {
                  const theme = QUICK_KEY_COLOR_MAP[item.color || "indigo"] || QUICK_KEY_COLOR_MAP.indigo;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${theme.badge}`}>
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-900 truncate">{item.label}</span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {item.askPrice ? "Numpad ile Sor" : `${Number(item.price || 0).toFixed(2)} ₺`}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                          KDV %{item.tax_rate}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === keys.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            {lang === "tr" ? "Kapat ve POS'a Dön" : "Done"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

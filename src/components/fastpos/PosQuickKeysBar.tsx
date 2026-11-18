import React from "react";
import { Zap, Plus, Settings2, ArrowUp, ArrowDown, PanelRight } from "lucide-react";

export type QuickKeysPlacement = "grid_top" | "grid_bottom" | "cart_top" | "hidden";
export type QuickKeyColor = "indigo" | "emerald" | "amber" | "rose" | "sky" | "slate";

export interface PosQuickKey {
  id: string;
  label: string;
  price: number;
  askPrice?: boolean;
  tax_rate: number;
  color: QuickKeyColor;
  productId?: number | null;
  unitLabel?: string;
}

export const QUICK_KEY_COLOR_MAP: Record<
  QuickKeyColor,
  { bg: string; hover: string; border: string; text: string; badge: string }
> = {
  indigo: {
    bg: "bg-indigo-50",
    hover: "hover:bg-indigo-100",
    border: "border-indigo-200",
    text: "text-indigo-950",
    badge: "bg-indigo-600 text-white",
  },
  emerald: {
    bg: "bg-emerald-50",
    hover: "hover:bg-emerald-100",
    border: "border-emerald-200",
    text: "text-emerald-950",
    badge: "bg-emerald-600 text-white",
  },
  amber: {
    bg: "bg-amber-50",
    hover: "hover:bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-950",
    badge: "bg-amber-600 text-white",
  },
  rose: {
    bg: "bg-rose-50",
    hover: "hover:bg-rose-100",
    border: "border-rose-200",
    text: "text-rose-950",
    badge: "bg-rose-600 text-white",
  },
  sky: {
    bg: "bg-sky-50",
    hover: "hover:bg-sky-100",
    border: "border-sky-200",
    text: "text-sky-950",
    badge: "bg-sky-600 text-white",
  },
  slate: {
    bg: "bg-slate-100",
    hover: "hover:bg-slate-200",
    border: "border-slate-300",
    text: "text-slate-900",
    badge: "bg-slate-800 text-white",
  },
};

export const QUICK_KEY_PRESETS: Record<string, { label: string; keys: PosQuickKey[] }> = {
  stationery: {
    label: "Kırtasiye",
    keys: [
      { id: "qk_photocopy", label: "Fotokopi", price: 3, askPrice: false, tax_rate: 20, color: "indigo", unitLabel: "Sayfa" },
      { id: "qk_color_print", label: "Renkli Çıktı", price: 10, askPrice: false, tax_rate: 20, color: "sky", unitLabel: "Sayfa" },
      { id: "qk_spiral", label: "Spiral Cilt", price: 45, askPrice: false, tax_rate: 20, color: "amber", unitLabel: "Adet" },
      { id: "qk_bag", label: "Alışveriş Poşeti", price: 0.5, askPrice: false, tax_rate: 20, color: "slate", unitLabel: "Adet" },
      { id: "qk_open_item", label: "Açık Kırtasiye Tutarı", price: 0, askPrice: true, tax_rate: 20, color: "emerald", unitLabel: "Tutar" },
    ],
  },
  bakery_grocery: {
    label: "Fırın & Manav",
    keys: [
      { id: "qk_bread", label: "Ekmek", price: 12.5, askPrice: false, tax_rate: 1, color: "amber", unitLabel: "Adet" },
      { id: "qk_simit", label: "Simit / Poğaça", price: 20, askPrice: false, tax_rate: 10, color: "rose", unitLabel: "Adet" },
      { id: "qk_greens", label: "Yeşillik / Demet", price: 15, askPrice: false, tax_rate: 1, color: "emerald", unitLabel: "Demet" },
      { id: "qk_weight_open", label: "Açık Tartı / Manav", price: 0, askPrice: true, tax_rate: 1, color: "sky", unitLabel: "Tutar" },
      { id: "qk_bag_bakery", label: "Poşet", price: 0.5, askPrice: false, tax_rate: 20, color: "slate", unitLabel: "Adet" },
    ],
  },
  cafe_buffet: {
    label: "Kafe & Büfe",
    keys: [
      { id: "qk_food_bev", label: "Yiyecek & İçecek", price: 0, askPrice: true, tax_rate: 10, color: "indigo", unitLabel: "Tutar" },
      { id: "qk_tea", label: "Çay", price: 25, askPrice: false, tax_rate: 10, color: "amber", unitLabel: "Bardak" },
      { id: "qk_water", label: "Su 0.5L", price: 15, askPrice: false, tax_rate: 1, color: "sky", unitLabel: "Adet" },
      { id: "qk_package", label: "Paket / Servis", price: 20, askPrice: false, tax_rate: 10, color: "emerald", unitLabel: "Adet" },
    ],
  },
};

interface PosQuickKeysBarProps {
  lang: string;
  quickKeys: PosQuickKey[];
  placement: QuickKeysPlacement;
  onTriggerKey: (key: PosQuickKey) => void;
  onOpenManager: () => void;
  onChangePlacement: (next: QuickKeysPlacement) => void;
}

export const PosQuickKeysBar: React.FC<PosQuickKeysBarProps> = ({
  lang,
  quickKeys,
  placement,
  onTriggerKey,
  onOpenManager,
  onChangePlacement,
}) => {
  if (placement === "hidden") return null;

  return (
    <div className="bg-white px-2.5 py-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
            <Zap className="w-3 h-3" />
          </span>
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
            {lang === "tr" ? "Hızlı Tuşlar (Barkodsuz)" : "Quick Keys (No Barcode)"}
          </span>
          <span className="text-[10px] font-bold text-slate-400">({quickKeys.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick inline placement cycle buttons */}
          <button
            type="button"
            onClick={() => onChangePlacement("grid_top")}
            title={lang === "tr" ? "Ürün Listesi Üstüne Yerleştir" : "Place Top"}
            className={`p-1 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
              placement === "grid_top"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onChangePlacement("grid_bottom")}
            title={lang === "tr" ? "Ürün Listesi Altına Yerleştir" : "Place Bottom"}
            className={`p-1 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
              placement === "grid_bottom"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onChangePlacement("cart_top")}
            title={lang === "tr" ? "Sepet Üstüne Yerleştir" : "Place Above Cart"}
            className={`p-1 rounded-md border text-[10px] font-bold cursor-pointer transition-all ${
              placement === "cart_top"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <PanelRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={onOpenManager}
            className="ml-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all"
          >
            <Settings2 className="w-3 h-3" />
            <span>{lang === "tr" ? "Tuşları Düzenle" : "Manage Keys"}</span>
          </button>
        </div>
      </div>

      {quickKeys.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-dashed border-slate-300">
          <span className="text-[11px] font-semibold text-slate-600">
            {lang === "tr"
              ? "Fotokopi, Yiyecek & İçecek, Poşet gibi barkodsuz sık satılan kısayollarınızı ekleyin."
              : "Add one-tap quick keys for items without barcodes."}
          </span>
          <button
            type="button"
            onClick={onOpenManager}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{lang === "tr" ? "Hızlı Tuş Oluştur / Şablon Yükle" : "Create Quick Keys"}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
          {quickKeys.map((qk) => {
            const theme = QUICK_KEY_COLOR_MAP[qk.color || "indigo"] || QUICK_KEY_COLOR_MAP.indigo;
            return (
              <button
                key={qk.id}
                type="button"
                onClick={() => onTriggerKey(qk)}
                className={`px-2.5 py-1.5 rounded-xl border ${theme.bg} ${theme.hover} ${theme.border} ${theme.text} flex items-center gap-1.5 text-left transition-all active:scale-95 cursor-pointer shadow-2xs`}
              >
                <span className="text-xs font-black leading-none">{qk.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none ${theme.badge}`}>
                  {qk.askPrice ? (lang === "tr" ? "Tutar Sor" : "Ask ₺") : `${Number(qk.price || 0).toFixed(2)} ₺`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

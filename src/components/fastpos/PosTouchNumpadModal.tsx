import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, Delete, CheckCircle2, Calculator } from "lucide-react";

export interface TouchNumpadConfig {
  title: string;
  subtitle?: string;
  initialValue: string;
  allowDecimal?: boolean;
  unitSuffix?: string;
  quickFillAmount?: number;
  quickFillLabel?: string;
  presetDeltas?: number[];
  onConfirm: (value: string) => void;
}

interface PosTouchNumpadModalProps {
  config: TouchNumpadConfig | null;
  lang: string;
  onClose: () => void;
}

export const PosTouchNumpadModal: React.FC<PosTouchNumpadModalProps> = ({
  config,
  lang,
  onClose,
}) => {
  const [display, setDisplay] = useState("0");
  const [freshStart, setFreshStart] = useState(true);

  useEffect(() => {
    if (config) {
      const cleaned = String(config.initialValue ?? "0").replace(",", ".").trim();
      setDisplay(cleaned === "" ? "0" : cleaned);
      setFreshStart(true);
    }
  }, [config]);

  const appendChar = (ch: string) => {
    if (!config) return;
    if (ch === "." || ch === ",") {
      if (!config.allowDecimal) return;
      if (freshStart) {
        setDisplay("0.");
        setFreshStart(false);
        return;
      }
      if (display.includes(".")) return;
      setDisplay((prev) => `${prev}.`);
      return;
    }

    if (freshStart) {
      setDisplay(ch === "00" ? "0" : ch);
      setFreshStart(false);
      return;
    }

    setDisplay((prev) => {
      if (prev === "0" && (ch === "0" || ch === "00")) return "0";
      if (prev === "0") return ch;
      if (prev.length >= 12) return prev;
      return `${prev}${ch}`;
    });
  };

  const handleBackspace = () => {
    setFreshStart(false);
    setDisplay((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setDisplay("0");
    setFreshStart(false);
  };

  const handleDelta = (delta: number) => {
    const current = parseFloat(display.replace(",", ".")) || 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setDisplay(config?.allowDecimal ? String(next) : String(Math.round(next)));
    setFreshStart(false);
  };

  const handleConfirm = () => {
    if (!config) return;
    const num = parseFloat(display.replace(",", "."));
    const normalized = Number.isNaN(num) ? "0" : config.allowDecimal ? String(num) : String(Math.max(0, num));
    config.onConfirm(normalized);
    onClose();
  };

  // Physical keyboard support while Touch Numpad is open
  useEffect(() => {
    if (!config) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        appendChar(e.key);
      } else if (e.key === "." || e.key === ",") {
        e.preventDefault();
        appendChar(".");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [config, display, freshStart]);

  if (!config) return null;

  const deltas = config.presetDeltas || (config.allowDecimal ? [5, 10, 50, 100] : [1, 2, 5, 10]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        className="bg-white text-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Dark Contrast Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-white truncate">{config.title}</h3>
              {config.subtitle && (
                <p className="text-[10px] text-slate-300 truncate">{config.subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Numeric Display */}
          <div className="px-3.5 py-2.5 bg-slate-100 border-2 border-indigo-500 rounded-xl flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500">
              {freshStart ? (lang === "tr" ? "YENİ DEĞER GİRİN" : "TYPE NEW VALUE") : (lang === "tr" ? "GİRİLEN" : "ENTERED")}
            </span>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span
                className={`text-2xl font-mono font-black tracking-tight truncate ${
                  freshStart ? "text-indigo-700 bg-indigo-100/80 px-1.5 rounded" : "text-slate-950"
                }`}
              >
                {display}
              </span>
              {config.unitSuffix && (
                <span className="text-xs font-black text-slate-600">{config.unitSuffix}</span>
              )}
            </div>
          </div>

          {/* Quick Fill Remaining (Split Payment) or Quick Increments */}
          {typeof config.quickFillAmount === "number" && config.quickFillAmount > 0 && (
            <button
              type="button"
              onClick={() => {
                setDisplay(config.quickFillAmount!.toFixed(2));
                setFreshStart(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 text-xs font-black cursor-pointer transition-all"
            >
              {config.quickFillLabel || `Kalan Tutarı Tamamla (${config.quickFillAmount.toFixed(2)} ₺)`}
            </button>
          )}

          <div className="grid grid-cols-4 gap-1.5">
            {deltas.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDelta(d)}
                className="py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-black cursor-pointer active:scale-95"
              >
                +{d}
              </button>
            ))}
          </div>

          {/* Tactile Keypad */}
          <div className="grid grid-cols-4 gap-2">
            {["7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => appendChar(d)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-lg font-black cursor-pointer active:scale-95 shadow-2xs"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center cursor-pointer active:scale-95"
              title="Sil"
            >
              <Delete className="w-5 h-5" />
            </button>

            {["4", "5", "6"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => appendChar(d)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-lg font-black cursor-pointer active:scale-95 shadow-2xs"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-sm font-black cursor-pointer active:scale-95"
            >
              C
            </button>

            {["1", "2", "3"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => appendChar(d)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-lg font-black cursor-pointer active:scale-95 shadow-2xs"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black cursor-pointer active:scale-95"
            >
              {lang === "tr" ? "İptal" : "Cancel"}
            </button>

            <button
              type="button"
              onClick={() => appendChar("0")}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-lg font-black cursor-pointer active:scale-95 shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => appendChar("00")}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-base font-black cursor-pointer active:scale-95 shadow-2xs"
            >
              00
            </button>
            <button
              type="button"
              disabled={!config.allowDecimal}
              onClick={() => appendChar(".")}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-300 text-slate-900 text-xl font-black cursor-pointer active:scale-95 disabled:opacity-40 shadow-2xs"
            >
              ,
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === "tr" ? "Tamam" : "OK"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

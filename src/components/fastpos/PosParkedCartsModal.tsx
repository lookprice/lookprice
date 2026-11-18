import React, { useState } from "react";
import { motion } from "motion/react";
import { X, PauseCircle, Play, Trash2, Edit2, Check, Layers } from "lucide-react";

export interface ParkedCartEntry {
  id: string;
  label: string;
  parkedAt: string;
  items: any[];
  total: number;
  paymentMethod: "cash" | "credit_card" | "room";
  tableName?: string | null;
}

interface PosParkedCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  parkedCarts: ParkedCartEntry[];
  currentCartCount: number;
  onRestoreReplaceOrSwap: (entry: ParkedCartEntry, swapCurrent: boolean) => void;
  onMergeIntoCurrent: (entry: ParkedCartEntry) => void;
  onDeleteParked: (id: string) => void;
  onRenameParked: (id: string, newLabel: string) => void;
}

export const PosParkedCartsModal: React.FC<PosParkedCartsModalProps> = ({
  isOpen,
  onClose,
  lang,
  parkedCarts,
  currentCartCount,
  onRestoreReplaceOrSwap,
  onMergeIntoCurrent,
  onDeleteParked,
  onRenameParked,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!isOpen) return null;

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
        className="bg-white text-slate-900 rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <PauseCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {lang === "tr" ? `Askıdaki Müşteri Sepetleri (${parkedCarts.length})` : `Parked Customer Carts (${parkedCarts.length})`}
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === "tr"
                  ? "Beklemeye aldığınız müşterinin sepetini tek dokunuşla kasaya geri alın."
                  : "Resume a parked sale with one tap."}
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

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {parkedCarts.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
              <PauseCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                {lang === "tr" ? "Şu anda askıda bekleyen müşteri sepeti yok." : "No parked carts."}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === "tr"
                  ? 'Sepet panelindeki "Beklet" tuşuna basarak aktif satışı askıya alabilirsiniz.'
                  : 'Use the "Park" button in the cart panel to hold an active sale.'}
              </p>
            </div>
          ) : (
            parkedCarts.map((entry) => {
              const isEditing = editingId === entry.id;
              const timeStr = new Date(entry.parkedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const preview = entry.items
                .slice(0, 3)
                .map((it) => `${it.name} x${it.quantity}`)
                .join(", ") + (entry.items.length > 3 ? ` +${entry.items.length - 3}` : "");

              return (
                <div
                  key={entry.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editText.trim()) {
                                onRenameParked(entry.id, editText.trim());
                                setEditingId(null);
                              }
                            }}
                            className="px-2 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-bold text-slate-900 outline-none w-48"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editText.trim()) onRenameParked(entry.id, editText.trim());
                              setEditingId(null);
                            }}
                            className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{entry.label}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(entry.id);
                              setEditText(entry.label);
                            }}
                            className="p-0.5 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Müşteri Notunu Değiştir"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {timeStr}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            {entry.items.length} kalem
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{preview}</p>
                    </div>

                    <span className="text-sm font-black text-slate-900 shrink-0">
                      {Number(entry.total || 0).toFixed(2)} ₺
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => onDeleteParked(entry.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>

                    {currentCartCount > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onMergeIntoCurrent(entry)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Aktif Sepetle Birleştir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRestoreReplaceOrSwap(entry, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Mevcutu Beklet & Bunu Aç</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRestoreReplaceOrSwap(entry, false)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Sepete Geri Al</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

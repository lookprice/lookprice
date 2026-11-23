import React, { useState } from "react";
import { ArrowRightLeft, ClipboardCheck, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import type { WarehouseConfigData } from "./WarehouseConfigPanel";

interface Props {
  storeId: number;
  targetStoreId: number;
  locations: any[];
  products: any[];
  movements: any[];
  config: WarehouseConfigData;
  onRefresh: () => Promise<void>;
}

export const QuickMoveCountPanel: React.FC<Props> = ({ storeId, targetStoreId, locations, products, movements, config, onRefresh }) => {
  const [mode, setMode] = useState<"move" | "count">("move");
  const [busy, setBusy] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // Move state
  const [prodCode, setProdCode] = useState("");
  const [prodId, setProdId] = useState("");
  const [fromLocId, setFromLocId] = useState("");
  const [fromLocCode, setFromLocCode] = useState("");
  const [toLocId, setToLocId] = useState("");
  const [toLocCode, setToLocCode] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  // Count state
  const [cntLocId, setCntLocId] = useState("");
  const [cntLocCode, setCntLocCode] = useState("");
  const [cntQty, setCntQty] = useState("");
  const [cntReason, setCntReason] = useState(config.discrepancy_reasons[0] || "Raf Sayımı");

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.moveBinStock({
        target_store_id: targetStoreId,
        product_id: prodId ? Number(prodId) : undefined,
        product_barcode: prodCode.trim() || undefined,
        from_location_id: fromLocId ? Number(fromLocId) : undefined,
        from_location_barcode: fromLocCode.trim() || undefined,
        to_location_id: toLocId ? Number(toLocId) : undefined,
        to_location_barcode: toLocCode.trim() || undefined,
        quantity: Number(qty) || 0,
        note: note.trim()
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`Taşındı: ${res.from} → ${res.to} (${res.quantity})`);
      setQty("1");
      setNote("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Taşıma başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const handleCount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.adjustBinCount({
        target_store_id: targetStoreId,
        product_id: prodId ? Number(prodId) : undefined,
        product_barcode: prodCode.trim() || undefined,
        location_id: cntLocId ? Number(cntLocId) : undefined,
        location_barcode: cntLocCode.trim() || undefined,
        counted_quantity: Number(cntQty),
        reason: cntReason,
        note: note.trim()
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`Sayım işlendi (Önceki: ${res.old_quantity} → Yeni: ${res.counted_quantity})`);
      setCntQty("");
      setNote("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Sayım güncellenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const matchedProducts = prodCode.trim()
    ? products.filter(p =>
        String(p.barcode || "").includes(prodCode.trim()) ||
        String(p.name || "").toLowerCase().includes(prodCode.toLowerCase())
      ).slice(0, 15)
    : products.slice(0, 15);

  return (
    <div className="space-y-2.5">
      {/* Compact Mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5 max-w-sm">
        <button
          type="button"
          onClick={() => setMode("move")}
          className={`h-9 px-3 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 border cursor-pointer ${
            mode === "move" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Raftan Rafa Taşı</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("count")}
          className={`h-9 px-3 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 border cursor-pointer ${
            mode === "count" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Hızlı Raf Sayımı</span>
        </button>
      </div>

      {mode === "move" ? (
        <form onSubmit={handleMove} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="block text-[10px] text-slate-500">Ürün Barkodu Okut / Ara</label>
              <input
                type="text"
                value={prodCode}
                onChange={e => setProdCode(e.target.value)}
                placeholder="Barkod okutun..."
                className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 font-mono"
              />
            </div>
            <div className="space-y-0.5">
              <label className="block text-[10px] text-slate-500">veya Listeden Ürün</label>
              <select value={prodId} onChange={e => setProdId(e.target.value)} className="w-full h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                <option value="">Seçiniz...</option>
                {matchedProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500">Kaynak Raf</label>
              <div className="flex gap-1.5">
                <select value={fromLocId} onChange={e => setFromLocId(e.target.value)} className="flex-1 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                  <option value="">Seçin...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.full_path} ({l.full_code})</option>)}
                </select>
                <input
                  type="text"
                  value={fromLocCode}
                  onChange={e => setFromLocCode(e.target.value)}
                  placeholder="Raf kodu"
                  className="w-24 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500">Hedef Raf</label>
              <div className="flex gap-1.5">
                <select value={toLocId} onChange={e => setToLocId(e.target.value)} className="flex-1 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                  <option value="">Seçin...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.full_path} ({l.full_code})</option>)}
                </select>
                <input
                  type="text"
                  value={toLocCode}
                  onChange={e => setToLocCode(e.target.value)}
                  placeholder="Raf kodu"
                  className="w-24 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-24 space-y-0.5">
              <label className="block text-[10px] text-slate-500">Miktar</label>
              <input type="number" min={0.01} step="any" required value={qty} onChange={e => setQty(e.target.value)} className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
            </div>
            <div className="flex-1 min-w-[140px] space-y-0.5">
              <label className="block text-[10px] text-slate-500">Not (Opsiyonel)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Kısa açıklama" className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
            </div>
            <button type="submit" disabled={busy} className="h-10 px-5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Taşı</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCount} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500">Sayılan Raf</label>
              <div className="flex gap-1.5">
                <select value={cntLocId} onChange={e => setCntLocId(e.target.value)} className="flex-1 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                  <option value="">Seçin...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.full_path} ({l.full_code})</option>)}
                </select>
                <input
                  type="text"
                  value={cntLocCode}
                  onChange={e => setCntLocCode(e.target.value)}
                  placeholder="Raf kodu"
                  className="w-24 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-500">Ürün Barkodu / Seçimi</label>
              <div className="flex gap-1.5">
                <input type="text" value={prodCode} onChange={e => setProdCode(e.target.value)} placeholder="Barkod..." className="w-36 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 font-mono" />
                <select value={prodId} onChange={e => setProdId(e.target.value)} className="flex-1 h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                  <option value="">Ürün...</option>
                  {matchedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-24 space-y-0.5">
              <label className="block text-[10px] text-slate-500">Sayılan Adet</label>
              <input type="number" min={0} step="any" required value={cntQty} onChange={e => setCntQty(e.target.value)} className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
            </div>
            <div className="w-44 space-y-0.5">
              <label className="block text-[10px] text-slate-500">Neden</label>
              <select value={cntReason} onChange={e => setCntReason(e.target.value)} className="w-full h-10 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
                <option value="Raf Sayımı">Raf Sayımı</option>
                {config.discrepancy_reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[120px] space-y-0.5">
              <label className="block text-[10px] text-slate-500">Not</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full h-10 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
            </div>
            <button type="submit" disabled={busy} className="h-10 px-5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Güncelle</span>
            </button>
          </div>
        </form>
      )}

      {/* Collapsible Audit Movements Log */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLog(!showLog)}
          className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
        >
          <span>Son Raf Hareketleri ({movements.length})</span>
          {showLog ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        {showLog && (
          <div className="border-t border-slate-100 divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {movements.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Hareket kaydı yok.</div>
            ) : (
              movements.map(m => (
                <div key={m.id} className="px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900">{m.product_name}</span>
                    <span className="text-slate-500 ml-2">
                      {m.from_code ? `${m.from_code} → ` : ""}{m.to_code || "Çıkış"}
                    </span>
                    <span className="text-slate-400 ml-2">{m.movement_type}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 tabular-nums shrink-0">{m.quantity}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

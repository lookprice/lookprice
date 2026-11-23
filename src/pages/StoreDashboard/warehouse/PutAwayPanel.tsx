import React, { useState } from "react";
import { Check, ChevronDown, ChevronRight, Plus, Clock, AlertTriangle, Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import type { WarehouseConfigData } from "./WarehouseConfigPanel";

interface Props {
  storeId: number;
  targetStoreId: number;
  queue: any[];
  locations: any[];
  products: any[];
  config: WarehouseConfigData;
  onRefresh: () => Promise<void>;
}

interface SplitRow {
  location_id: string;
  location_barcode: string;
  packs: string;
  quantity: string;
  is_damaged: boolean;
  reason: string;
}

export const PutAwayPanel: React.FC<Props> = ({ storeId, targetStoreId, queue, locations, products, config, onRefresh }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Quick manual inbound collapsible
  const [showManualIn, setShowManualIn] = useState(false);
  const [inSearch, setInSearch] = useState("");
  const [inProductId, setInProductId] = useState<string>("");
  const [inQty, setInQty] = useState("1");
  const [inDamaged, setInDamaged] = useState("0");
  const [inNote, setInNote] = useState("");
  const [inBusy, setInBusy] = useState(false);

  const placeableLocations = locations.filter(l => l.system_role !== "RECEIVING" && l.system_role !== "DAMAGED");

  const openSplitFor = (item: any) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setSetAsDefault(!item.default_location_id);
    setSplits([
      {
        location_id: item.default_location_id ? String(item.default_location_id) : "",
        location_barcode: "",
        packs: "",
        quantity: String(item.quantity),
        is_damaged: false,
        reason: config.discrepancy_reasons[0] || "Hasarlı / Kırık"
      }
    ]);
  };

  const quickPutToDefault = async (item: any) => {
    if (!item.default_location_id) {
      openSplitFor(item);
      return;
    }
    setBusyId(item.id);
    try {
      const res = await api.submitPutAway({
        target_store_id: item.store_id,
        product_id: item.product_id,
        variant_key: item.variant_key || "",
        placements: [{ location_id: Number(item.default_location_id), quantity: Number(item.quantity) }]
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`${item.product_name} → ${item.default_location_code || "Önerilen raf"}`);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "İstifleme başarısız.");
    } finally {
      setBusyId(null);
    }
  };

  const submitSplit = async (item: any) => {
    const valid = splits
      .map(s => ({
        location_id: s.location_id ? Number(s.location_id) : undefined,
        location_barcode: s.location_barcode.trim() || undefined,
        quantity: Number(s.quantity) || 0,
        is_damaged: s.is_damaged,
        reason: s.is_damaged ? s.reason : undefined
      }))
      .filter(s => s.quantity > 0 && (s.is_damaged || s.location_id || s.location_barcode));

    if (valid.length === 0) {
      toast.error("En az bir hedef raf ve miktar girin.");
      return;
    }

    setBusyId(item.id);
    try {
      const res = await api.submitPutAway({
        target_store_id: item.store_id,
        product_id: item.product_id,
        variant_key: item.variant_key || "",
        placements: valid,
        set_as_default: setAsDefault
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success("İstifleme tamamlandı.");
      setExpandedId(null);
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "İstifleme hatası.");
    } finally {
      setBusyId(null);
    }
  };

  const handleManualInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProd = products.find(p =>
      String(p.id) === inProductId || (inSearch.trim() && String(p.barcode || "").trim() === inSearch.trim())
    );
    if (!matchedProd && !inSearch.trim()) {
      toast.error("Ürün seçin veya barkod okutun.");
      return;
    }
    setInBusy(true);
    try {
      const res = await api.manualWarehouseInbound({
        target_store_id: targetStoreId,
        product_id: matchedProd ? Number(matchedProd.id) : undefined,
        product_barcode: matchedProd ? matchedProd.barcode : inSearch.trim(),
        quantity: Number(inQty) || 0,
        damaged_qty: Number(inDamaged) || 0,
        note: inNote.trim() || "Depo Mal Kabul"
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(res.routedToReceiving ? "Mal Kabul Alanına (RECEIVING) alındı." : "Stoğa eklendi.");
      setInSearch("");
      setInProductId("");
      setInQty("1");
      setInDamaged("0");
      setInNote("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Mal kabul hatası.");
    } finally {
      setInBusy(false);
    }
  };

  const filteredProducts = inSearch.trim()
    ? products.filter(p =>
        String(p.name || "").toLowerCase().includes(inSearch.toLowerCase()) ||
        String(p.barcode || "").includes(inSearch.trim())
      ).slice(0, 12)
    : products.slice(0, 12);

  return (
    <div className="space-y-2">
      {/* Compact Header Strip + Collapsible Manual Inbound */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-600 tabular-nums">
          Bekleyen: <strong className="text-slate-900">{queue.length}</strong> kalem
        </span>
        <button
          type="button"
          onClick={() => setShowManualIn(!showManualIn)}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 border cursor-pointer ${
            showManualIn ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          <span>Mal Kabul Girişi</span>
        </button>
      </div>

      {showManualIn && (
        <form onSubmit={handleManualInbound} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[170px] space-y-0.5">
            <label className="block text-[10px] text-slate-500">Barkod / Ürün Ara</label>
            <input
              type="text"
              value={inSearch}
              onChange={e => setInSearch(e.target.value)}
              placeholder="Barkod okut veya ürün ara..."
              className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
            />
          </div>
          <div className="w-48 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Ürün Seç</label>
            <select
              value={inProductId}
              onChange={e => setInProductId(e.target.value)}
              className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
            >
              <option value="">Seçiniz...</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
              ))}
            </select>
          </div>
          <div className="w-20 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Sağlam</label>
            <input type="number" min={0} value={inQty} onChange={e => setInQty(e.target.value)} className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          <div className="w-20 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Hasarlı</label>
            <input type="number" min={0} value={inDamaged} onChange={e => setInDamaged(e.target.value)} className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          <div className="w-32 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Not</label>
            <input type="text" value={inNote} onChange={e => setInNote(e.target.value)} placeholder="İrsaliye no" className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
          </div>
          <button type="submit" disabled={inBusy} className="h-9 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer">
            {inBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Kabul Et"}
          </button>
        </form>
      )}

      {/* Put-Away Queue List */}
      {queue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
          İstif bekleyen ürün yok.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
          {queue.map(item => {
            const isOpen = expandedId === item.id;
            const upp = Math.max(1, Number(item.units_per_pack || 1));
            const isOverdue = Boolean(item.is_overdue);

            return (
              <div key={item.id} className="p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-900 truncate">{item.product_name}</span>
                      <span className={`text-[11px] tabular-nums inline-flex items-center gap-0.5 shrink-0 ${isOverdue ? "text-rose-600 font-medium" : "text-slate-500"}`}>
                        {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {item.hours_waiting}s
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="font-mono">{item.barcode}</span>
                      <span>{item.store_name}</span>
                      {item.default_location_code && (
                        <span className="text-indigo-700">Öneri: {item.default_location_code}</span>
                      )}
                      {upp > 1 && <span>1 {item.pack_unit_label || "Koli"} = {upp}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-slate-900 tabular-nums mr-1">
                      {item.quantity} {item.unit || "Adet"}
                    </span>
                    {item.default_location_id && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => quickPutToDefault(item)}
                        className="h-8 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        {busyId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Önerilen Rafa</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openSplitFor(item)}
                      className="h-8 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Raf Seç</span>
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Placement / Split Form */}
                {isOpen && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {splits.map((row, idx) => (
                      <div key={idx} className="flex flex-wrap items-end gap-1.5">
                        {!row.is_damaged ? (
                          <>
                            <div className="flex-1 min-w-[150px] space-y-0.5">
                              <label className="block text-[10px] text-slate-500">Hedef Raf</label>
                              <select
                                value={row.location_id}
                                onChange={e => setSplits(prev => prev.map((r, i) => i === idx ? { ...r, location_id: e.target.value } : r))}
                                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                              >
                                <option value="">Raf seçin...</option>
                                {placeableLocations.map(l => (
                                  <option key={l.id} value={l.id}>{l.full_path} ({l.full_code})</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-32 space-y-0.5">
                              <label className="block text-[10px] text-slate-500">veya Raf Barkod</label>
                              <input
                                type="text"
                                value={row.location_barcode}
                                onChange={e => setSplits(prev => prev.map((r, i) => i === idx ? { ...r, location_barcode: e.target.value } : r))}
                                placeholder="D1-R01-A"
                                className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 min-w-[160px] space-y-0.5">
                            <label className="block text-[10px] text-rose-600">Hasar / Karantina Nedeni</label>
                            <select
                              value={row.reason}
                              onChange={e => setSplits(prev => prev.map((r, i) => i === idx ? { ...r, reason: e.target.value } : r))}
                              className="w-full h-9 px-2 text-xs bg-rose-50 border border-rose-200 rounded text-rose-900"
                            >
                              {config.discrepancy_reasons.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        )}

                        {upp > 1 && (
                          <div className="w-16 space-y-0.5">
                            <label className="block text-[10px] text-slate-500">{item.pack_unit_label || "Koli"}</label>
                            <input
                              type="number"
                              min={0}
                              value={row.packs}
                              onChange={e => {
                                const pk = e.target.value;
                                const calc = pk ? String(Number(pk) * upp) : row.quantity;
                                setSplits(prev => prev.map((r, i) => i === idx ? { ...r, packs: pk, quantity: calc } : r));
                              }}
                              className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                            />
                          </div>
                        )}

                        <div className="w-20 space-y-0.5">
                          <label className="block text-[10px] text-slate-500">Adet</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={row.quantity}
                            onChange={e => setSplits(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))}
                            className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                          />
                        </div>

                        <label className="h-9 inline-flex items-center gap-1 text-[11px] text-rose-700 cursor-pointer px-1">
                          <input
                            type="checkbox"
                            checked={row.is_damaged}
                            onChange={e => setSplits(prev => prev.map((r, i) => i === idx ? { ...r, is_damaged: e.target.checked } : r))}
                          />
                          <span>Hasarlı</span>
                        </label>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSplits(prev => [...prev, { location_id: "", location_barcode: "", packs: "", quantity: "0", is_damaged: false, reason: config.discrepancy_reasons[0] || "Hasarlı" }])}
                          className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Rafa Böl</span>
                        </button>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={setAsDefault} onChange={e => setSetAsDefault(e.target.checked)} />
                          <span>Varsayılan raf yap</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => submitSplit(item)}
                        className="h-9 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Yerleştir</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Truck,
  Check,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import type { WarehouseConfigData } from "./WarehouseConfigPanel";

interface Props {
  storeId: number;
  stores: any[];
  config: WarehouseConfigData;
  onRefresh: () => Promise<void>;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Talep", cls: "text-amber-700" },
  accepted: { label: "Onaylandı", cls: "text-indigo-700" },
  preparing: { label: "Toplanıyor (Rezerve)", cls: "text-indigo-700" },
  shipped: { label: "Yolda", cls: "text-sky-700" },
  completed: { label: "Teslim Alındı", cls: "text-emerald-700" },
  cancelled: { label: "İptal", cls: "text-rose-600" }
};

export const PickListAndTransfersPanel: React.FC<Props> = ({ storeId, stores, config, onRefresh }) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [replenishment, setReplenishment] = useState<{ source_store: any; suggestions: any[] }>({ source_store: null, suggestions: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "all">("active");
  const [showReplenish, setShowReplenish] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pickData, setPickData] = useState<Record<number, any[]>>({});
  const [pickSelection, setPickSelection] = useState<Record<number, { location_id: string; shipped_qty: string }>>({});
  const [receiveDraft, setReceiveDraft] = useState<Record<number, { received_qty: string; damaged_qty: string; reason: string }>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [trRes, repRes] = await Promise.all([
        api.getStockTransfers(storeId, true),
        api.getWarehouseReplenishment(storeId)
      ]);
      setTransfers(Array.isArray(trRes) ? trRes : []);
      if (repRes && Array.isArray(repRes.suggestions)) {
        setReplenishment(repRes);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const toggleExpand = async (tr: any) => {
    if (expandedId === tr.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(tr.id);

    // Load sorted Pick List for preparing/pending, or initialize receive draft for shipped
    if (tr.status === "pending" || tr.status === "preparing") {
      try {
        const res = await api.getWarehousePickList(tr.id, storeId);
        if (res?.items) {
          setPickData(prev => ({ ...prev, [tr.id]: res.items }));
          const nextSel: Record<number, any> = {};
          res.items.forEach((it: any) => {
            nextSel[it.id] = {
              location_id: it.suggested_location_id ? String(it.suggested_location_id) : "",
              shipped_qty: String(it.requested_qty ?? it.quantity ?? 0)
            };
          });
          setPickSelection(prev => ({ ...prev, ...nextSel }));
        }
      } catch {}
    } else if (tr.status === "shipped") {
      const nextRec: Record<number, any> = {};
      (tr.items || []).forEach((it: any) => {
        nextRec[it.id] = {
          received_qty: String(it.shipped_qty ?? it.quantity ?? 0),
          damaged_qty: "0",
          reason: config.discrepancy_reasons[0] || "Hasarlı / Kırık"
        };
      });
      setReceiveDraft(prev => ({ ...prev, ...nextRec }));
    }
  };

  const transition = async (tr: any, status: string, extra?: any) => {
    setBusyId(tr.id);
    try {
      const res = await api.updateTransferStatusRich(tr.id, { status, lang: "tr", ...(extra || {}) }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(
        status === "preparing"
          ? "Stok rezerve edildi, toplama başladı."
          : status === "shipped"
            ? "Sevkiyat çıkış yapıldı."
            : status === "completed"
              ? (res.has_discrepancy ? "Fark/hasar kaydı ile teslim alındı." : "Transfer teslim alındı.")
              : "Transfer iptal edildi."
      );
      await load();
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "İşlem başarısız.");
    } finally {
      setBusyId(null);
    }
  };

  const createReplenishTransfer = async (s: any) => {
    if (!replenishment.source_store || !s.source_product_id) {
      toast.error("Kaynak depoda bu ürün kartı bulunamadı.");
      return;
    }
    setBusyId(-s.product_id);
    try {
      const res = await api.createStockTransfer({
        from_store_id: replenishment.source_store.id,
        to_store_id: s.store_id,
        notes: `Otomatik İkmal Talebi (Min: ${s.min_stock_level})`,
        status: "pending",
        items: [{
          product_id: s.source_product_id,
          barcode: s.barcode,
          product_name: s.product_name,
          quantity: s.suggested_qty
        }]
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`${s.store_name} için ikmal talebi oluşturuldu.`);
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Talep oluşturulamadı.");
    } finally {
      setBusyId(null);
    }
  };

  const visibleTransfers = filter === "active"
    ? transfers.filter(t => !["completed", "cancelled"].includes(t.status))
    : transfers;

  return (
    <div className="space-y-2.5">
      {/* Compact Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-slate-200 bg-white overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`px-2.5 py-1.5 cursor-pointer ${filter === "active" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Aktif ({transfers.filter(t => !["completed", "cancelled"].includes(t.status)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1.5 cursor-pointer ${filter === "all" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Tümü ({transfers.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowReplenish(!showReplenish)}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 border cursor-pointer ${
            showReplenish ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>İkmal Önerileri ({replenishment.suggestions.length})</span>
        </button>
      </div>

      {/* Collapsible Replenishment Suggestions */}
      {showReplenish && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-700 flex items-center justify-between">
            <span>Kritik Stok Altı Ürünler (Kaynak: {replenishment.source_store?.name || "-"})</span>
            <button type="button" onClick={() => setShowReplenish(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </div>
          {replenishment.suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">Kritik stok uyarısı yok.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {replenishment.suggestions.map(s => (
                <div key={`${s.store_id}-${s.product_id}`} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{s.product_name}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {s.store_name}: <strong className="text-rose-600">{s.current_stock}</strong> / Min {s.min_stock_level} • Depo: {s.source_stock}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === -s.product_id || Number(s.source_stock) <= 0}
                    onClick={() => createReplenishTransfer(s)}
                    className="h-7 px-2.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>+{s.suggested_qty} Talep Et</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfers List */}
      {loading ? (
        <div className="p-6 flex items-center justify-center text-xs text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      ) : visibleTransfers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
          Görüntülenecek sevkiyat/transfer yok.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
          {visibleTransfers.map(tr => {
            const isOpen = expandedId === tr.id;
            const st = STATUS_LABELS[tr.status] || { label: tr.status, cls: "text-slate-600" };
            const pickItems = pickData[tr.id] || tr.items || [];

            return (
              <div key={tr.id} className="p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(tr)}
                    className="flex items-center gap-1.5 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        #{tr.id} • {tr.from_store_name} → {tr.to_store_name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className={`font-medium ${st.cls}`}>{st.label}</span>
                        <span className="tabular-nums">{(tr.items || []).length} kalem</span>
                        {tr.has_discrepancy && <span className="text-rose-600 font-medium">Farklı Teslim</span>}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {tr.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === tr.id}
                          onClick={() => transition(tr, "preparing")}
                          className="h-8 px-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
                        >
                          Hazırla (Rezerve)
                        </button>
                        <button
                          type="button"
                          disabled={busyId === tr.id}
                          onClick={() => transition(tr, "cancelled")}
                          className="h-8 px-2 rounded border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                        >
                          İptal
                        </button>
                      </>
                    )}
                    {tr.status === "preparing" && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpand(tr)}
                          className="h-8 px-2.5 rounded border border-slate-200 bg-white text-slate-800 text-xs font-medium cursor-pointer"
                        >
                          Toplama Listesi
                        </button>
                        <button
                          type="button"
                          disabled={busyId === tr.id}
                          onClick={() => transition(tr, "cancelled")}
                          className="h-8 px-2 rounded border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs cursor-pointer"
                        >
                          İptal
                        </button>
                      </>
                    )}
                    {tr.status === "shipped" && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(tr)}
                        className="h-8 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                      >
                        Teslim Al
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Pick List (Preparing) */}
                {isOpen && (tr.status === "preparing" || tr.status === "pending") && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded">
                      {pickItems.map((it: any) => {
                        const sel = pickSelection[it.id] || {
                          location_id: it.suggested_location_id ? String(it.suggested_location_id) : "",
                          shipped_qty: String(it.requested_qty ?? it.quantity ?? 0)
                        };
                        const bins: any[] = Array.isArray(it.available_bins) ? it.available_bins : [];

                        return (
                          <div key={it.id} className="p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900 truncate">{it.product_name}</div>
                              <div className="text-[11px] text-indigo-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{it.suggested_location_path || "Genel Alan"}</span>
                              </div>
                            </div>

                            {bins.length > 0 && (
                              <select
                                value={sel.location_id}
                                onChange={e => setPickSelection(prev => ({ ...prev, [it.id]: { ...sel, location_id: e.target.value } }))}
                                className="w-44 h-8 px-2 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-900"
                              >
                                {bins.map((b: any) => (
                                  <option key={b.location_id} value={b.location_id}>
                                    {b.full_code} {b.system_role === "RECEIVING" ? "(Cross-Dock)" : ""} ({b.quantity})
                                  </option>
                                ))}
                              </select>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">Sevk:</span>
                              <input
                                type="number"
                                min={0}
                                value={sel.shipped_qty}
                                onChange={e => setPickSelection(prev => ({ ...prev, [it.id]: { ...sel, shipped_qty: e.target.value } }))}
                                className="w-16 h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {tr.status === "preparing" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={busyId === tr.id}
                          onClick={() => {
                            const shippedItems = pickItems.map((it: any) => {
                              const sel = pickSelection[it.id];
                              return {
                                item_id: it.id,
                                product_id: it.product_id,
                                shipped_qty: sel ? Number(sel.shipped_qty) : Number(it.requested_qty ?? it.quantity),
                                picked_from_location_id: sel?.location_id ? Number(sel.location_id) : null
                              };
                            });
                            transition(tr, "shipped", { shippedItems });
                          }}
                          className="h-9 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {busyId === tr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                          <span>Toplandı & Sevk Et</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Receipt & Discrepancy Panel (Shipped) */}
                {isOpen && tr.status === "shipped" && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded">
                      {(tr.items || []).map((it: any) => {
                        const d = receiveDraft[it.id] || {
                          received_qty: String(it.shipped_qty ?? it.quantity ?? 0),
                          damaged_qty: "0",
                          reason: config.discrepancy_reasons[0] || "Hasarlı / Kırık"
                        };
                        const expected = Number(it.shipped_qty ?? it.quantity ?? 0);
                        const hasDiff = Number(d.received_qty) !== expected || Number(d.damaged_qty) > 0;

                        return (
                          <div key={it.id} className="p-2 flex flex-wrap items-end justify-between gap-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900 truncate">{it.product_name}</div>
                              <div className="text-[11px] text-slate-500 tabular-nums">Sevk: {expected}</div>
                            </div>
                            <div className="w-18 space-y-0.5">
                              <label className="block text-[10px] text-slate-500">Sağlam</label>
                              <input
                                type="number"
                                min={0}
                                value={d.received_qty}
                                onChange={e => setReceiveDraft(prev => ({ ...prev, [it.id]: { ...d, received_qty: e.target.value } }))}
                                className="w-16 h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                              />
                            </div>
                            <div className="w-18 space-y-0.5">
                              <label className="block text-[10px] text-rose-600">Hasarlı</label>
                              <input
                                type="number"
                                min={0}
                                value={d.damaged_qty}
                                onChange={e => setReceiveDraft(prev => ({ ...prev, [it.id]: { ...d, damaged_qty: e.target.value } }))}
                                className="w-16 h-8 px-2 text-xs bg-rose-50 border border-rose-200 rounded text-rose-900 tabular-nums"
                              />
                            </div>
                            {hasDiff && (
                              <div className="w-40 space-y-0.5">
                                <label className="block text-[10px] text-rose-600">Fark / Hasar Nedeni</label>
                                <select
                                  value={d.reason}
                                  onChange={e => setReceiveDraft(prev => ({ ...prev, [it.id]: { ...d, reason: e.target.value } }))}
                                  className="w-full h-8 px-2 text-[11px] bg-rose-50 border border-rose-200 rounded text-rose-900"
                                >
                                  {config.discrepancy_reasons.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={busyId === tr.id}
                        onClick={() => {
                          const receivedItems = (tr.items || []).map((it: any) => {
                            const d = receiveDraft[it.id];
                            return {
                              item_id: it.id,
                              product_id: it.product_id,
                              received_qty: d ? Number(d.received_qty) : Number(it.shipped_qty ?? it.quantity),
                              damaged_qty: d ? Number(d.damaged_qty) : 0,
                              discrepancy_reason: d?.reason || ""
                            };
                          });
                          transition(tr, "completed", { receivedItems });
                        }}
                        className="h-9 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {busyId === tr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Teslimatı Onayla</span>
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

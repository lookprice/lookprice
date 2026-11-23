import React, { useEffect, useState } from "react";
import { MapPin, Save, Loader2, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

interface Props {
  productId: number;
  storeId: number;
  isTr?: boolean;
}

export const ProductPlacementSection: React.FC<Props> = ({ productId, storeId, isTr = true }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [locationsByStore, setLocationsByStore] = useState<Record<number, any[]>>({});
  const [openSettingId, setOpenSettingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { min_stock_level: string; default_location_id: string; units_per_pack: string; pack_unit_label: string }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [plRes, locRes] = await Promise.all([
        api.getProductPlacement(productId, storeId),
        api.getWarehouseLocations(undefined, storeId)
      ]);
      if (plRes?.branches) {
        setData(plRes);
        const initDrafts: Record<number, any> = {};
        plRes.branches.forEach((b: any) => {
          initDrafts[b.store_id] = {
            min_stock_level: b.min_stock_level !== null && b.min_stock_level !== undefined ? String(b.min_stock_level) : "",
            default_location_id: b.default_location_id ? String(b.default_location_id) : "",
            units_per_pack: String(b.units_per_pack || 1),
            pack_unit_label: b.pack_unit_label || "Koli"
          };
        });
        setDrafts(initDrafts);
      }
      if (Array.isArray(locRes)) {
        const map: Record<number, any[]> = {};
        locRes.forEach((l: any) => {
          if (l.system_role === "DAMAGED" || l.system_role === "RECEIVING") return;
          const sid = Number(l.store_id);
          if (!map[sid]) map[sid] = [];
          map[sid].push(l);
        });
        setLocationsByStore(map);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
  }, [productId, storeId]);

  const handleSaveBranchSetting = async (targetStoreId: number) => {
    const d = drafts[targetStoreId];
    if (!d) return;
    setSavingId(targetStoreId);
    try {
      const res = await api.saveProductBranchSettings(productId, {
        target_store_id: targetStoreId,
        min_stock_level: d.min_stock_level === "" ? null : Number(d.min_stock_level),
        default_location_id: d.default_location_id ? Number(d.default_location_id) : null,
        units_per_pack: Math.max(1, Number(d.units_per_pack) || 1),
        pack_unit_label: d.pack_unit_label || "Koli"
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(isTr ? "Şube raf ayarları kaydedildi." : "Saved.");
      await load();
      setOpenSettingId(null);
    } catch (err: any) {
      toast.error(err?.message || "Hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-xs text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{isTr ? "Lokasyonlar yükleniyor..." : "Loading..."}</span>
      </div>
    );
  }

  if (!data?.branches) {
    return (
      <div className="py-6 text-center text-xs text-slate-500">
        {isTr ? "Yerleşim bilgisi bulunamadı." : "No placement data."}
      </div>
    );
  }

  const totalPhysical = data.branches.reduce((a: number, b: any) => a + Number(b.physical_qty || 0), 0);
  const totalReserved = data.branches.reduce((a: number, b: any) => a + Number(b.reserved_qty || 0), 0);
  const totalAvailable = data.branches.reduce((a: number, b: any) => a + Number(b.available_qty || 0), 0);
  const totalDamaged = data.branches.reduce((a: number, b: any) => a + Number(b.damaged_qty || 0), 0);

  return (
    <div className="space-y-2">
      {/* Compact Totals Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <span className="text-slate-600">Fiziki: <strong className="text-slate-900">{totalPhysical}</strong></span>
          <span className="text-slate-600">Rezerve: <strong className="text-amber-700">{totalReserved}</strong></span>
          <span className="text-slate-600">Kullanılabilir: <strong className="text-emerald-700">{totalAvailable}</strong></span>
          {totalDamaged > 0 && <span className="text-slate-600">Hasarlı: <strong className="text-rose-700">{totalDamaged}</strong></span>}
          <span className="text-slate-600">Online Havuz: <strong className="text-indigo-700">{data.online_available_total ?? totalAvailable}</strong></span>
        </div>
        <button
          type="button"
          onClick={load}
          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          title="Yenile"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Per-Branch Rows (Mobile-Friendly Stack + Desktop Table Density) */}
      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
        {data.branches.map((b: any) => {
          const isOpen = openSettingId === b.store_id;
          const d = drafts[b.store_id] || { min_stock_level: "", default_location_id: "", units_per_pack: "1", pack_unit_label: "Koli" };
          const storeLocs = locationsByStore[b.store_id] || [];

          return (
            <div key={b.store_id} className="p-2.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-slate-900 truncate">{b.store_name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {b.branch_type === "WAREHOUSE" ? (b.is_central_warehouse ? "Merkez Depo" : "Depo") : (b.is_hq ? "Merkez" : "Şube")}
                  </span>
                  {b.is_below_min && (
                    <span className="text-[10px] font-medium text-rose-600">Kritik (&lt;{b.min_stock_level})</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="text-slate-700">{b.physical_qty}</span>
                  {b.reserved_qty > 0 && <span className="text-amber-700">-{b.reserved_qty} rez</span>}
                  <span className={`font-semibold ${b.available_qty > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                    = {b.available_qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenSettingId(isOpen ? null : b.store_id)}
                    className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <span>Ayar</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Exact Shelf Breadcrumbs */}
              {Array.isArray(b.locations) && b.locations.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                  {b.locations.map((loc: any, idx: number) => (
                    <span key={`${loc.location_id}-${idx}`} className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className={loc.system_role === "DAMAGED" ? "text-rose-600" : loc.system_role === "RECEIVING" ? "text-amber-700" : "text-slate-700"}>
                        {loc.full_path}
                      </span>
                      <span className="font-mono text-slate-900 tabular-nums">({loc.quantity})</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Collapsible Branch Settings */}
              {isOpen && (
                <div className="pt-2 mt-1 border-t border-slate-100 flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[160px] space-y-0.5">
                    <label className="block text-[10px] text-slate-500">Varsayılan Raf</label>
                    <select
                      value={d.default_location_id}
                      onChange={e => setDrafts(prev => ({ ...prev, [b.store_id]: { ...d, default_location_id: e.target.value } }))}
                      className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                    >
                      <option value="">Seçilmedi</option>
                      {storeLocs.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.full_path} ({l.full_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[10px] text-slate-500">Min Stok</label>
                    <input
                      type="number"
                      min={0}
                      value={d.min_stock_level}
                      onChange={e => setDrafts(prev => ({ ...prev, [b.store_id]: { ...d, min_stock_level: e.target.value } }))}
                      className="w-20 h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[10px] text-slate-500">Koli İçi</label>
                    <input
                      type="number"
                      min={1}
                      value={d.units_per_pack}
                      onChange={e => setDrafts(prev => ({ ...prev, [b.store_id]: { ...d, units_per_pack: e.target.value } }))}
                      className="w-20 h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[10px] text-slate-500">Birim</label>
                    <input
                      type="text"
                      value={d.pack_unit_label}
                      onChange={e => setDrafts(prev => ({ ...prev, [b.store_id]: { ...d, pack_unit_label: e.target.value } }))}
                      className="w-20 h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveBranchSetting(b.store_id)}
                    disabled={savingId === b.store_id}
                    className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    {savingId === b.store_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Kaydet</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

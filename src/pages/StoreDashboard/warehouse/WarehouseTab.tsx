import React, { useCallback, useEffect, useState } from "react";
import {
  Warehouse,
  RefreshCw,
  Plus,
  Check,
  X,
  Edit3,
  Loader2,
  Sliders,
  Layers,
  PackageCheck,
  Truck,
  ArrowRightLeft,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { LocationTreePanel } from "./LocationTreePanel";
import { PutAwayPanel } from "./PutAwayPanel";
import { PickListAndTransfersPanel } from "./PickListAndTransfersPanel";
import { QuickMoveCountPanel } from "./QuickMoveCountPanel";
import { WarehouseConfigPanel, type WarehouseConfigData } from "./WarehouseConfigPanel";

interface Props {
  storeId: number;
  products: any[];
  onRefreshDashboard?: () => void;
}

const DEFAULT_CFG: WarehouseConfigData = {
  code_separator: "-",
  location_types: [
    { key: "ZONE", label: "Bölge / Alan", prefix: "B" },
    { key: "FLOOR", label: "Kat", prefix: "K" },
    { key: "AISLE", label: "Koridor", prefix: "KOR" },
    { key: "RACK", label: "Raf Ünitesi", prefix: "R" },
    { key: "CABINET", label: "Dolap", prefix: "D" },
    { key: "DRAWER", label: "Çekmece", prefix: "C" },
    { key: "SHELF", label: "Raf / Göz", prefix: "G" },
    { key: "DISPLAY", label: "Reyon", prefix: "RY" }
  ],
  location_tags: ["Kırılabilir", "Ağır Yük", "Yüksek Değer"],
  discrepancy_reasons: ["Hasarlı / Kırık", "Eksik Teslimat", "Ambalaj Bozuk", "Yanlış Ürün"],
  pack_unit_labels: ["Koli", "Paket", "Kutu", "Palet", "Adet"],
  label_format: "80mm",
  default_receiving_sla_hours: 24
};

type SubTab = "putaway" | "picklist" | "locations" | "move" | "stores" | "config";

export default function WarehouseTab({ storeId, products, onRefreshDashboard }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("putaway");
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(storeId);
  const [locations, setLocations] = useState<any[]>([]);
  const [putawayQueue, setPutawayQueue] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [config, setConfig] = useState<WarehouseConfigData>(DEFAULT_CFG);

  // Collapsible New/Edit Warehouse or Store form inside "stores" sub-tab
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [stForm, setStForm] = useState({
    name: "",
    branch_type: "WAREHOUSE",
    is_central_warehouse: false,
    use_bin_locations: true,
    has_pos: false,
    allow_direct_sales: false,
    include_in_online_stock: false,
    sell_receiving_stock: false,
    receiving_sla_hours: "24"
  });
  const [savingStore, setSavingStore] = useState(false);

  const loadAll = useCallback(async (targetId?: number) => {
    setLoading(true);
    try {
      const [cfgRes, storesRes] = await Promise.all([
        api.getWarehouseConfig(storeId),
        api.getWarehouseStores(storeId)
      ]);
      if (cfgRes && !cfgRes.error && cfgRes.location_types) setConfig(cfgRes);
      const list = Array.isArray(storesRes) ? storesRes : [];
      setStores(list);

      const resolvedTarget = targetId || (list.some(s => Number(s.id) === selectedStoreId)
        ? selectedStoreId
        : (list.find(s => s.branch_type === "WAREHOUSE")?.id || list[0]?.id || storeId));
      setSelectedStoreId(Number(resolvedTarget));

      const [locsRes, putRes, movRes] = await Promise.all([
        api.getWarehouseLocations(Number(resolvedTarget), storeId),
        api.getPutAwayQueue(undefined, storeId),
        api.getWarehouseMovements({ targetStoreId: Number(resolvedTarget), limit: 40 }, storeId)
      ]);
      setLocations(Array.isArray(locsRes) ? locsRes : []);
      setPutawayQueue(Array.isArray(putRes) ? putRes : []);
      setMovements(Array.isArray(movRes) ? movRes : []);
    } catch (err: any) {
      toast.error(err?.message || "Depo verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedStoreId]);

  useEffect(() => {
    loadAll();
  }, [storeId]);

  const handleSelectStore = async (nextId: number) => {
    setSelectedStoreId(nextId);
    const [locsRes, movRes] = await Promise.all([
      api.getWarehouseLocations(nextId, storeId),
      api.getWarehouseMovements({ targetStoreId: nextId, limit: 40 }, storeId)
    ]);
    setLocations(Array.isArray(locsRes) ? locsRes : []);
    setMovements(Array.isArray(movRes) ? movRes : []);
  };

  const openCreateWarehouse = () => {
    setEditingStoreId(null);
    setStForm({
      name: "",
      branch_type: "WAREHOUSE",
      is_central_warehouse: !stores.some(s => s.is_central_warehouse),
      use_bin_locations: true,
      has_pos: false,
      allow_direct_sales: false,
      include_in_online_stock: false,
      sell_receiving_stock: false,
      receiving_sla_hours: String(config.default_receiving_sla_hours || 24)
    });
    setShowStoreForm(true);
  };

  const openEditStore = (s: any) => {
    setEditingStoreId(Number(s.id));
    setStForm({
      name: s.name || "",
      branch_type: s.branch_type || "STORE",
      is_central_warehouse: Boolean(s.is_central_warehouse),
      use_bin_locations: Boolean(s.use_bin_locations),
      has_pos: Boolean(s.has_pos),
      allow_direct_sales: Boolean(s.allow_direct_sales),
      include_in_online_stock: Boolean(s.include_in_online_stock),
      sell_receiving_stock: Boolean(s.sell_receiving_stock),
      receiving_sla_hours: String(s.receiving_sla_hours || 24)
    });
    setShowStoreForm(true);
  };

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stForm.name.trim()) return;
    setSavingStore(true);
    try {
      const payload = {
        ...stForm,
        name: stForm.name.trim(),
        receiving_sla_hours: Math.max(1, Number(stForm.receiving_sla_hours) || 24)
      };
      const res = editingStoreId
        ? await api.updateWarehouseStore(editingStoreId, payload, storeId)
        : await api.createWarehouseStore(payload, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(editingStoreId ? "Güncellendi." : "Yeni depo/şube oluşturuldu.");
      setShowStoreForm(false);
      await loadAll(res?.id ? Number(res.id) : undefined);
      onRefreshDashboard?.();
    } catch (err: any) {
      toast.error(err?.message || "Kaydedilemedi.");
    } finally {
      setSavingStore(false);
    }
  };

  const overdueCount = putawayQueue.filter(i => i.is_overdue).length;

  const navTabs: Array<{ id: SubTab; label: string; icon: any; count?: number; alert?: boolean }> = [
    { id: "putaway", label: "İstif", icon: PackageCheck, count: putawayQueue.length, alert: overdueCount > 0 },
    { id: "picklist", label: "Toplama", icon: Truck },
    { id: "locations", label: "Raflar", icon: Layers, count: locations.filter(l => l.system_role === "STANDARD").length },
    { id: "move", label: "Taşı/Say", icon: ArrowRightLeft },
    { id: "stores", label: "Depolar", icon: Building2, count: stores.length },
    { id: "config", label: "Ayarlar", icon: Sliders }
  ];

  return (
    <div className="space-y-2.5 pb-12">
      {/* Single Compact Integrated Module Bar (AGENTS.md §12 - Zero double header, zero bloat) */}
      <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Warehouse className="w-4 h-4 text-slate-700 shrink-0" />
          <select
            value={selectedStoreId}
            onChange={e => handleSelectStore(Number(e.target.value))}
            className="h-8 px-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-900 max-w-[200px] sm:max-w-[260px]"
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.branch_type === "WAREHOUSE" ? "Depo" : "Şube"})
              </option>
            ))}
          </select>
        </div>

        {/* Horizontally scrollable compact mobile-first tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full">
          {navTabs.map(t => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] font-mono tabular-nums ${
                    active ? "text-slate-200" : t.alert ? "text-rose-600 font-semibold" : "text-slate-500"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => loadAll(selectedStoreId)}
            className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 inline-flex items-center justify-center shrink-0 cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tab Views */}
      {subTab === "putaway" && (
        <PutAwayPanel
          storeId={storeId}
          targetStoreId={selectedStoreId}
          queue={putawayQueue}
          locations={locations}
          products={products}
          config={config}
          onRefresh={() => loadAll(selectedStoreId)}
        />
      )}

      {subTab === "picklist" && (
        <PickListAndTransfersPanel
          storeId={storeId}
          stores={stores}
          config={config}
          onRefresh={() => loadAll(selectedStoreId)}
        />
      )}

      {subTab === "locations" && (
        <LocationTreePanel
          storeId={storeId}
          targetStoreId={selectedStoreId}
          locations={locations}
          config={config}
          onRefresh={() => loadAll(selectedStoreId)}
        />
      )}

      {subTab === "move" && (
        <QuickMoveCountPanel
          storeId={storeId}
          targetStoreId={selectedStoreId}
          locations={locations}
          products={products}
          movements={movements}
          config={config}
          onRefresh={() => loadAll(selectedStoreId)}
        />
      )}

      {subTab === "stores" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Şube & Depolar ({stores.length})</span>
            <button
              type="button"
              onClick={openCreateWarehouse}
              className="h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Depo / Şube Ekle</span>
            </button>
          </div>

          {showStoreForm && (
            <form onSubmit={saveStore} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[160px] space-y-0.5">
                  <label className="block text-[10px] text-slate-500">Ad *</label>
                  <input
                    type="text"
                    required
                    value={stForm.name}
                    onChange={e => setStForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Örn: Ana Depo"
                    className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                  />
                </div>
                <div className="w-32 space-y-0.5">
                  <label className="block text-[10px] text-slate-500">Tip</label>
                  <select
                    value={stForm.branch_type}
                    onChange={e => {
                      const t = e.target.value;
                      setStForm(f => ({
                        ...f,
                        branch_type: t,
                        has_pos: t !== "WAREHOUSE",
                        allow_direct_sales: t !== "WAREHOUSE",
                        use_bin_locations: t === "WAREHOUSE" ? true : f.use_bin_locations
                      }));
                    }}
                    className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900"
                  >
                    <option value="WAREHOUSE">Depo</option>
                    <option value="STORE">Mağaza / Şube</option>
                  </select>
                </div>
                <div className="w-20 space-y-0.5">
                  <label className="block text-[10px] text-slate-500">SLA (s)</label>
                  <input
                    type="number"
                    min={1}
                    value={stForm.receiving_sla_hours}
                    onChange={e => setStForm(f => ({ ...f, receiving_sla_hours: e.target.value }))}
                    className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={stForm.use_bin_locations} onChange={e => setStForm(f => ({ ...f, use_bin_locations: e.target.checked }))} />
                  <span>Raf Adresleme</span>
                </label>
                {stForm.branch_type === "WAREHOUSE" && (
                  <>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={stForm.is_central_warehouse} onChange={e => setStForm(f => ({ ...f, is_central_warehouse: e.target.checked }))} />
                      <span>Merkez Depo</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={stForm.include_in_online_stock} onChange={e => setStForm(f => ({ ...f, include_in_online_stock: e.target.checked }))} />
                      <span>Online Stoğa Dahil</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={stForm.sell_receiving_stock} onChange={e => setStForm(f => ({ ...f, sell_receiving_stock: e.target.checked }))} />
                      <span>Mal Kabul Stoğu Satılabilir</span>
                    </label>
                  </>
                )}
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={stForm.has_pos} onChange={e => setStForm(f => ({ ...f, has_pos: e.target.checked }))} />
                  <span>POS / Kasa Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-1.5">
                <button type="button" onClick={() => setShowStoreForm(false)} className="h-8 px-3 rounded border border-slate-200 text-xs text-slate-600 cursor-pointer">Vazgeç</button>
                <button type="submit" disabled={savingStore} className="h-8 px-4 rounded bg-indigo-600 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer">
                  {savingStore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          )}

          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
            {stores.map(s => (
              <div key={s.id} className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{s.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {s.branch_type === "WAREHOUSE" ? (s.is_central_warehouse ? "Merkez Depo" : "Depo") : (s.parent_id ? "Şube" : "Merkez")}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 tabular-nums">
                    <span>Raf: {s.use_bin_locations ? `Aktif (${s.custom_location_count || 0})` : "Kapalı"}</span>
                    <span>POS: {s.has_pos ? "Açık" : "Yok"}</span>
                    {Number(s.receiving_pending_skus || 0) > 0 && (
                      <span className={Number(s.receiving_overdue_skus || 0) > 0 ? "text-rose-600 font-medium" : "text-amber-700"}>
                        İstif Bekleyen: {s.receiving_pending_skus}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { handleSelectStore(Number(s.id)); setSubTab("locations"); }}
                    className="h-7 px-2.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] cursor-pointer"
                  >
                    Raflar
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditStore(s)}
                    className="h-7 px-2 rounded border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "config" && (
        <WarehouseConfigPanel
          storeId={storeId}
          config={config}
          onSaved={next => {
            setConfig(next);
            loadAll(selectedStoreId);
          }}
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Save,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
  SlidersHorizontal,
  ClipboardCheck,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

interface Props {
  productId: number;
  storeId: number;
  isTr?: boolean;
  onPlacementChanged?: () => void;
}

type PanelMode = "move" | "count" | "settings" | null;

function stripStorePrefix(fullPath: string, storeName: string): string {
  if (!fullPath) return "";
  const prefix = `${storeName} > `;
  return fullPath.startsWith(prefix) ? fullPath.slice(prefix.length) : fullPath;
}

export const ProductPlacementSection: React.FC<Props> = ({
  productId,
  storeId,
  isTr = true,
  onPlacementChanged
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [locationsByStore, setLocationsByStore] = useState<Record<number, any[]>>({});
  const [openPanel, setOpenPanel] = useState<{ storeId: number; mode: PanelMode } | null>(null);

  // Rules / Defaults settings draft
  const [drafts, setDrafts] = useState<
    Record<number, { min_stock_level: string; default_location_id: string; units_per_pack: string; pack_unit_label: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // Direct Move / Assign draft per branch
  const [moveDrafts, setMoveDrafts] = useState<
    Record<number, { from_location_id: string; to_location_id: string; quantity: string; set_as_default: boolean }>
  >({});
  const [movingId, setMovingId] = useState<number | null>(null);

  // Direct Count Adjust draft per branch
  const [countDrafts, setCountDrafts] = useState<
    Record<number, { location_id: string; counted_quantity: string; reason: string }>
  >({});
  const [countingId, setCountingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [plRes, locRes] = await Promise.all([
        api.getProductPlacement(productId, storeId),
        api.getWarehouseLocations(undefined, storeId)
      ]);

      const locMap: Record<number, any[]> = {};
      if (Array.isArray(locRes)) {
        locRes.forEach((l: any) => {
          const sid = Number(l.store_id);
          if (!locMap[sid]) locMap[sid] = [];
          locMap[sid].push(l);
        });
        setLocationsByStore(locMap);
      }

      if (plRes?.branches) {
        setData(plRes);
        const initDrafts: Record<number, any> = {};
        const initMoves: Record<number, any> = {};
        const initCounts: Record<number, any> = {};

        plRes.branches.forEach((b: any) => {
          const sid = Number(b.store_id);
          const allLocs = locMap[sid] || [];
          const targetLocs = allLocs.filter((l: any) => l.system_role !== "RECEIVING");
          const standardLocs = targetLocs.filter((l: any) => l.system_role === "STANDARD");

          initDrafts[sid] = {
            min_stock_level: b.min_stock_level !== null && b.min_stock_level !== undefined ? String(b.min_stock_level) : "",
            default_location_id: b.default_location_id ? String(b.default_location_id) : "",
            units_per_pack: String(b.units_per_pack || 1),
            pack_unit_label: b.pack_unit_label || "Koli"
          };

          const occupiedBins = Array.isArray(b.locations)
            ? b.locations.filter((l: any) => l.system_role !== "DAMAGED" && Math.max(0, Number(l.quantity || 0) - Number(l.reserved_quantity || 0)) > 0)
            : [];
          const primarySrc = occupiedBins[0];
          const srcId = primarySrc ? String(primarySrc.location_id) : "__AUTO__";
          const srcAvail = primarySrc
            ? Math.max(0, Number(primarySrc.quantity || 0) - Number(primarySrc.reserved_quantity || 0))
            : Math.max(0, Number(b.available_qty || 0));

          const suggestedDest =
            standardLocs.find((l: any) => String(l.id) !== srcId) ||
            targetLocs.find((l: any) => String(l.id) !== srcId && l.system_role !== "DAMAGED");

          initMoves[sid] = {
            from_location_id: srcId,
            to_location_id: suggestedDest ? String(suggestedDest.id) : "",
            quantity: srcAvail > 0 ? String(srcAvail) : "1",
            set_as_default: true
          };

          const firstBinOrStd = b.locations?.[0]?.location_id || standardLocs[0]?.id || targetLocs[0]?.id || "";
          const currentCountQty = b.locations?.[0]?.quantity ?? b.physical_qty ?? 0;
          initCounts[sid] = {
            location_id: firstBinOrStd ? String(firstBinOrStd) : "",
            counted_quantity: String(currentCountQty),
            reason: ""
          };
        });

        setDrafts(initDrafts);
        setMoveDrafts(initMoves);
        setCountDrafts(initCounts);
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

  const togglePanel = (sid: number, mode: PanelMode) => {
    setOpenPanel((prev) => (prev && prev.storeId === sid && prev.mode === mode ? null : { storeId: sid, mode }));
  };

  const handleOpenMoveFromBin = (b: any, bin?: any) => {
    const sid = Number(b.store_id);
    const allLocs = (locationsByStore[sid] || []).filter((l: any) => l.system_role !== "RECEIVING");
    const standardLocs = allLocs.filter((l: any) => l.system_role === "STANDARD");

    const srcId = bin ? String(bin.location_id) : "__AUTO__";
    const avail = bin
      ? Math.max(0, Number(bin.quantity || 0) - Number(bin.reserved_quantity || 0))
      : Math.max(0, Number(b.available_qty || 0));
    const dest =
      standardLocs.find((l: any) => String(l.id) !== srcId) ||
      allLocs.find((l: any) => String(l.id) !== srcId && l.system_role !== "DAMAGED");

    setMoveDrafts((prev) => ({
      ...prev,
      [sid]: {
        from_location_id: srcId,
        to_location_id: dest ? String(dest.id) : prev[sid]?.to_location_id || "",
        quantity: avail > 0 ? String(avail) : "1",
        set_as_default: true
      }
    }));
    setOpenPanel({ storeId: sid, mode: "move" });
  };

  const handleMoveStock = async (b: any) => {
    const sid = Number(b.store_id);
    const m = moveDrafts[sid];
    if (!m) return;
    if (!m.to_location_id) {
      toast.error(isTr ? "Lütfen hedef raf seçin." : "Select target shelf.");
      return;
    }
    const qty = Number(m.quantity || 0);
    if (qty <= 0) {
      toast.error(isTr ? "Taşınacak adet 0'dan büyük olmalıdır." : "Quantity must be > 0.");
      return;
    }

    const destLoc = (locationsByStore[sid] || []).find((l: any) => String(l.id) === String(m.to_location_id));
    const shouldSetDefault = Boolean(m.set_as_default && destLoc && destLoc.system_role === "STANDARD");

    setMovingId(sid);
    try {
      const payload: any = {
        target_store_id: sid,
        product_id: b.product_id || productId,
        product_barcode: data?.product?.barcode || undefined,
        to_location_id: Number(m.to_location_id),
        quantity: qty,
        set_as_default: shouldSetDefault
      };
      if (m.from_location_id && m.from_location_id !== "__AUTO__") {
        payload.from_location_id = Number(m.from_location_id);
      }

      const res = await api.moveBinStock(payload, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(isTr ? `${qty} adet başarıyla rafa yerleştirildi.` : "Stock moved.");
      await load();
      setOpenPanel(null);
      onPlacementChanged?.();
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Raf taşıma işlemi başarısız." : "Move failed."));
    } finally {
      setMovingId(null);
    }
  };

  const handleCountAdjust = async (b: any) => {
    const sid = Number(b.store_id);
    const c = countDrafts[sid];
    if (!c || !c.location_id) {
      toast.error(isTr ? "Lütfen sayım yapılacak rafı seçin." : "Select shelf.");
      return;
    }
    const counted = Number(c.counted_quantity);
    if (isNaN(counted) || counted < 0) {
      toast.error(isTr ? "Geçerli bir sayım adedi girin." : "Invalid quantity.");
      return;
    }

    setCountingId(sid);
    try {
      const res = await api.adjustBinCount(
        {
          target_store_id: sid,
          product_id: b.product_id || productId,
          product_barcode: data?.product?.barcode || undefined,
          location_id: Number(c.location_id),
          counted_quantity: counted,
          reason: c.reason || (isTr ? "Ürün kartından sayım düzeltmesi" : "Count adjust from product card")
        },
        storeId
      );
      if (res?.error) throw new Error(res.error);
      toast.success(isTr ? `Raf sayımı güncellendi (Yeni şube toplamı: ${res.new_store_total}).` : "Count updated.");
      await load();
      setOpenPanel(null);
      onPlacementChanged?.();
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Sayım güncellenemedi." : "Failed."));
    } finally {
      setCountingId(null);
    }
  };

  const handleSaveBranchSetting = async (targetStoreId: number) => {
    const d = drafts[targetStoreId];
    if (!d) return;
    setSavingId(targetStoreId);
    try {
      const res = await api.saveProductBranchSettings(
        productId,
        {
          target_store_id: targetStoreId,
          min_stock_level: d.min_stock_level === "" ? null : Number(d.min_stock_level),
          default_location_id: d.default_location_id ? Number(d.default_location_id) : null,
          units_per_pack: Math.max(1, Number(d.units_per_pack) || 1),
          pack_unit_label: d.pack_unit_label || "Koli"
        },
        storeId
      );
      if (res?.error) throw new Error(res.error);
      toast.success(isTr ? "Mal kabul & uyarı kuralları kaydedildi." : "Saved.");
      await load();
      setOpenPanel(null);
      onPlacementChanged?.();
    } catch (err: any) {
      toast.error(err?.message || (isTr ? "Hata oluştu." : "Error."));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex items-center justify-center text-xs text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{isTr ? "Raf ve yerleşim bilgileri yükleniyor..." : "Loading..."}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <span className="text-slate-600">
            {isTr ? "Fiziki:" : "Physical:"} <strong className="text-slate-900">{totalPhysical}</strong>
          </span>
          <span className="text-slate-600">
            {isTr ? "Rezerve:" : "Reserved:"} <strong className="text-amber-700">{totalReserved}</strong>
          </span>
          <span className="text-slate-600">
            {isTr ? "Kullanılabilir:" : "Available:"} <strong className="text-emerald-700">{totalAvailable}</strong>
          </span>
          {totalDamaged > 0 && (
            <span className="text-slate-600">
              {isTr ? "Hasarlı:" : "Damaged:"} <strong className="text-rose-700">{totalDamaged}</strong>
            </span>
          )}
          <span className="text-slate-600">
            {isTr ? "Online Havuz:" : "Online Pool:"}{" "}
            <strong className="text-indigo-700">{data.online_available_total ?? totalAvailable}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded cursor-pointer transition-colors"
          title={isTr ? "Yenile" : "Refresh"}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isTr ? "Yenile" : "Refresh"}</span>
        </button>
      </div>

      {/* Per-Branch Rows */}
      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
        {data.branches.map((b: any) => {
          const sid = Number(b.store_id);
          const activeMode = openPanel?.storeId === sid ? openPanel.mode : null;
          const d = drafts[sid] || { min_stock_level: "", default_location_id: "", units_per_pack: "1", pack_unit_label: "Koli" };
          const m = moveDrafts[sid] || { from_location_id: "__AUTO__", to_location_id: "", quantity: "1", set_as_default: true };
          const c = countDrafts[sid] || { location_id: "", counted_quantity: "0", reason: "" };

          const allStoreLocs = locationsByStore[sid] || [];
          const assignableLocs = allStoreLocs.filter((l: any) => l.system_role !== "RECEIVING");
          const standardLocs = assignableLocs.filter((l: any) => l.system_role === "STANDARD");
          const defaultSettingLocs = assignableLocs.filter((l: any) => l.system_role !== "DAMAGED");

          const hasCustomPlacement = Array.isArray(b.locations) && b.locations.some((l: any) => l.system_role === "STANDARD");
          const hasAnyStock = Number(b.physical_qty || 0) > 0;
          const moveLabel = hasCustomPlacement
            ? (isTr ? "Raf Değiştir" : "Move Shelf")
            : (isTr ? "Rafa Koy" : "Assign Shelf");

          // Source options for Move panel
          const sourceBins = Array.isArray(b.locations)
            ? b.locations.filter((l: any) => l.system_role !== "DAMAGED" && Math.max(0, Number(l.quantity || 0) - Number(l.reserved_quantity || 0)) > 0)
            : [];

          return (
            <div key={sid} className="p-2.5 sm:p-3 space-y-2">
              {/* Header: Branch Name + Totals + Clear Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-900 truncate">{b.store_name}</span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase">
                    {b.branch_type === "WAREHOUSE"
                      ? (b.is_central_warehouse ? "Merkez Depo" : "Depo")
                      : (b.is_hq ? "Merkez" : "Şube")}
                  </span>
                  {b.is_below_min && (
                    <span className="text-[10px] font-medium text-rose-600 inline-flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Kritik (&lt;{b.min_stock_level})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                  <span className="text-slate-600 mr-1">
                    {b.physical_qty}
                    {b.reserved_qty > 0 && <span className="text-amber-700 ml-1">-{b.reserved_qty} rez</span>}
                    <span className={`ml-1 font-semibold ${b.available_qty > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                      = {b.available_qty}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => togglePanel(sid, "move")}
                    className={`h-7 px-2 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                      activeMode === "move"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    }`}
                    title={isTr ? "Bu şubedeki stoğu rafa koy veya başka rafa taşı" : "Move stock to another shelf"}
                  >
                    <ArrowRightLeft className="w-3 h-3 shrink-0" />
                    <span>{moveLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePanel(sid, "count")}
                    className={`h-7 px-2 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                      activeMode === "count"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                    }`}
                    title={isTr ? "Bu şubedeki raf sayımını doğrudan düzelt" : "Adjust shelf count"}
                  >
                    <ClipboardCheck className="w-3 h-3 shrink-0" />
                    <span>{isTr ? "Sayım" : "Count"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePanel(sid, "settings")}
                    className={`h-7 px-2 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                      activeMode === "settings"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200"
                    }`}
                    title={isTr ? "Varsayılan mal kabul rafı, kritik stok ve koli ayarları" : "Default shelf & alert rules"}
                  >
                    <SlidersHorizontal className="w-3 h-3 shrink-0" />
                    <span>{isTr ? "Oto. Kurallar" : "Rules"}</span>
                  </button>
                </div>
              </div>

              {/* Exact Active Shelf Address(es) */}
              <div className="space-y-1">
                {Array.isArray(b.locations) && b.locations.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {b.locations.map((loc: any, idx: number) => {
                      const cleanPath = stripStorePrefix(loc.full_path, b.store_name);
                      const avail = Math.max(0, Number(loc.quantity || 0) - Number(loc.reserved_quantity || 0));
                      return (
                        <div
                          key={`${loc.location_id}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 rounded bg-slate-50/80 border border-slate-100 text-[11px]"
                        >
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                loc.system_role === "DAMAGED"
                                  ? "text-rose-500"
                                  : loc.system_role === "RECEIVING"
                                  ? "text-amber-600"
                                  : loc.system_role === "STANDARD"
                                  ? "text-indigo-600"
                                  : "text-slate-400"
                              }`}
                            />
                            <span
                              className={`font-medium truncate ${
                                loc.system_role === "DAMAGED"
                                  ? "text-rose-700"
                                  : loc.system_role === "RECEIVING"
                                  ? "text-amber-800"
                                  : "text-slate-800"
                              }`}
                              title={loc.full_path}
                            >
                              {cleanPath}
                            </span>
                            {loc.full_code && (
                              <span className="font-mono text-[10px] text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">
                                {loc.full_code}
                              </span>
                            )}
                            {loc.system_role === "DEFAULT" && (
                              <span className="text-[10px] text-slate-500">
                                ({isTr ? "Özel rafa atanmamış" : "Unassigned"})
                              </span>
                            )}
                            {loc.system_role === "RECEIVING" && (
                              <span className="text-[10px] text-amber-700">
                                ({isTr ? "Mal kabulde bekliyor" : "In receiving"})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 tabular-nums">
                            <span className="font-mono font-semibold text-slate-900">
                              {Number(loc.quantity || 0)} {data?.product?.unit || "Adet"}
                            </span>
                            {Number(loc.reserved_quantity || 0) > 0 && (
                              <span className="text-[10px] text-amber-700">
                                ({Number(loc.reserved_quantity)} rez.)
                              </span>
                            )}
                            {loc.system_role !== "DAMAGED" && avail > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenMoveFromBin(b, loc)}
                                className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              >
                                {isTr ? "Taşı →" : "Move →"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : hasAnyStock ? (
                  <div className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-amber-50/60 border border-amber-200/70 text-[11px]">
                    <span className="text-amber-900 inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        {isTr
                          ? `Genel Alan (${b.physical_qty} adet — henüz özel bir rafa yerleştirilmedi)`
                          : `General Area (${b.physical_qty} — not assigned to a shelf)`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenMoveFromBin(b)}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer shrink-0"
                    >
                      {isTr ? "Rafa Yerleştir →" : "Assign →"}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{isTr ? "Bu şubede/depoda fiziki stok yok (0)." : "No stock in this branch."}</span>
                  </div>
                )}

                {b.default_location_path && (
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 pl-0.5">
                    <span>{isTr ? "Oto. Mal Kabul Rafı:" : "Default Put-Away:"}</span>
                    <span className="font-medium text-slate-700">
                      {stripStorePrefix(b.default_location_path, b.store_name)}
                    </span>
                    {b.default_location_code && (
                      <span className="font-mono text-slate-500">({b.default_location_code})</span>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL A: Direct Move / Assign Shelf */}
              {activeMode === "move" && (
                <div className="p-2.5 mt-1 bg-indigo-50/40 border border-indigo-200/80 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-950">
                      {isTr ? "Stok Rafa Yerleştir / Raf Değiştir" : "Move Stock Between Shelves"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isTr ? "Mevcut fiziki stoğu seçilen rafa anında taşır" : "Moves physical stock immediately"}
                    </span>
                  </div>

                  {standardLocs.length === 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      {isTr
                        ? "Bu şube/depo için henüz özel raf ağacı oluşturulmamış. Önce 'Depo & Raf > Lokasyon Ağacı' ekranından raf/göz tanımlayın."
                        : "No custom shelves created for this branch yet."}
                    </div>
                  )}

                  {!hasAnyStock && sourceBins.length === 0 ? (
                    <div className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded px-2 py-1.5 flex items-center justify-between gap-2">
                      <span>
                        {isTr
                          ? "Taşınabilir stok yok (0). Stok girişi için 'Sayım' butonunu kullanabilirsiniz."
                          : "No stock to move. Use Count Adjust to set stock."}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePanel(sid, "count")}
                        className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer shrink-0"
                      >
                        {isTr ? "Sayım Aç →" : "Open Count →"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[160px] space-y-0.5">
                          <label className="block text-[10px] font-medium text-slate-600">
                            {isTr ? "Kaynak Raf" : "From Shelf"}
                          </label>
                          {sourceBins.length > 0 ? (
                            <select
                              value={m.from_location_id}
                              onChange={(e) => {
                                const nextFrom = e.target.value;
                                const bin = sourceBins.find((x: any) => String(x.location_id) === nextFrom);
                                const avail = bin
                                  ? Math.max(1, Number(bin.quantity || 0) - Number(bin.reserved_quantity || 0))
                                  : 1;
                                setMoveDrafts((prev) => ({
                                  ...prev,
                                  [sid]: { ...m, from_location_id: nextFrom, quantity: String(avail) }
                                }));
                              }}
                              className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                            >
                              {sourceBins.map((l: any) => {
                                const avail = Math.max(0, Number(l.quantity || 0) - Number(l.reserved_quantity || 0));
                                return (
                                  <option key={l.location_id} value={String(l.location_id)}>
                                    {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code}) • Mevcut: {avail}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <div className="h-8 px-2 flex items-center text-xs bg-white border border-slate-200 rounded text-slate-700">
                              {isTr ? `Genel Alan (Mevcut: ${b.available_qty})` : `General Area (${b.available_qty})`}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-[180px] space-y-0.5">
                          <label className="block text-[10px] font-medium text-slate-600">
                            {isTr ? "Hedef Raf" : "Target Shelf"}
                          </label>
                          <select
                            value={m.to_location_id}
                            onChange={(e) =>
                              setMoveDrafts((prev) => ({
                                ...prev,
                                [sid]: { ...m, to_location_id: e.target.value }
                              }))
                            }
                            className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                          >
                            <option value="">{isTr ? "-- Hedef Raf Seçin --" : "-- Select Target --"}</option>
                            {standardLocs
                              .filter((l: any) => String(l.id) !== String(m.from_location_id))
                              .map((l: any) => (
                                <option key={l.id} value={String(l.id)}>
                                  {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code})
                                </option>
                              ))}
                            {assignableLocs
                              .filter((l: any) => l.system_role !== "STANDARD" && String(l.id) !== String(m.from_location_id))
                              .map((l: any) => (
                                <option key={l.id} value={String(l.id)}>
                                  {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code})
                                  {l.system_role === "DAMAGED" ? " [Hasarlı]" : ""}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[10px] font-medium text-slate-600">
                            {isTr ? "Adet" : "Qty"}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={m.quantity}
                            onChange={(e) =>
                              setMoveDrafts((prev) => ({
                                ...prev,
                                [sid]: { ...m, quantity: e.target.value }
                              }))
                            }
                            className="w-20 h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900 tabular-nums"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMoveStock(b)}
                          disabled={movingId === sid || !m.to_location_id}
                          className="h-8 px-3 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          {movingId === sid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                          <span>{isTr ? "Rafa Taşı" : "Move"}</span>
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={m.set_as_default}
                          onChange={(e) =>
                            setMoveDrafts((prev) => ({
                              ...prev,
                              [sid]: { ...m, set_as_default: e.target.checked }
                            }))
                          }
                          className="h-3.5 w-3.5 rounded text-indigo-600"
                        />
                        <span>
                          {isTr
                            ? "Bu rafı bu ürünün Varsayılan Mal Kabul Rafı olarak da kaydet"
                            : "Also set as default shelf for future put-away"}
                        </span>
                      </label>
                    </>
                  )}
                </div>
              )}

              {/* PANEL B: Count Adjust */}
              {activeMode === "count" && (
                <div className="p-2.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-900">
                      {isTr ? "Raf Sayım Düzeltmesi" : "Shelf Count Adjustment"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isTr ? "Seçilen raftaki fiziki adedi doğrudan günceller" : "Sets physical count on selected shelf"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[180px] space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Sayım Yapılan Raf" : "Shelf"}
                      </label>
                      <select
                        value={c.location_id}
                        onChange={(e) => {
                          const locId = e.target.value;
                          const matched = b.locations?.find((l: any) => String(l.location_id) === locId);
                          setCountDrafts((prev) => ({
                            ...prev,
                            [sid]: {
                              ...c,
                              location_id: locId,
                              counted_quantity: matched ? String(matched.quantity || 0) : c.counted_quantity
                            }
                          }));
                        }}
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                      >
                        <option value="">{isTr ? "-- Raf Seçin --" : "-- Select --"}</option>
                        {standardLocs.map((l: any) => (
                          <option key={l.id} value={String(l.id)}>
                            {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code})
                          </option>
                        ))}
                        {assignableLocs
                          .filter((l: any) => l.system_role !== "STANDARD")
                          .map((l: any) => (
                            <option key={l.id} value={String(l.id)}>
                              {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Sayılan Adet" : "Counted Qty"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={c.counted_quantity}
                        onChange={(e) =>
                          setCountDrafts((prev) => ({
                            ...prev,
                            [sid]: { ...c, counted_quantity: e.target.value }
                          }))
                        }
                        className="w-24 h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900 tabular-nums"
                      />
                    </div>

                    <div className="flex-1 min-w-[140px] space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Not / Sebep (İsteğe bağlı)" : "Reason (Opt)"}
                      </label>
                      <input
                        type="text"
                        value={c.reason}
                        onChange={(e) =>
                          setCountDrafts((prev) => ({
                            ...prev,
                            [sid]: { ...c, reason: e.target.value }
                          }))
                        }
                        placeholder={isTr ? "Örn: Raf sayımı" : "Cycle count"}
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCountAdjust(b)}
                      disabled={countingId === sid || !c.location_id}
                      className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      {countingId === sid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isTr ? "Sayımı Uygula" : "Save Count"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL C: Auto Put-Away & Alert Rules (formerly confusing "Ayar >") */}
              {activeMode === "settings" && (
                <div className="p-2.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-900">
                      {isTr ? "Mal Kabul & Stok Uyarı Kuralları" : "Put-Away & Alert Rules"}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {isTr
                        ? "Bu kurallar mevcut raftaki stoğu taşımaz; yeni mal kabul/transferde önerilecek varsayılan rafı ve kritik stok uyarısını belirler."
                        : "Sets default shelf suggested on inbound receiving and low-stock alert threshold."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[180px] space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Varsayılan Mal Kabul Rafı" : "Default Put-Away Shelf"}
                      </label>
                      <select
                        value={d.default_location_id}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [sid]: { ...d, default_location_id: e.target.value } }))
                        }
                        className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                      >
                        <option value="">{isTr ? "Seçilmedi" : "None"}</option>
                        {defaultSettingLocs.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            {stripStorePrefix(l.full_path, b.store_name)} ({l.full_code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Kritik Stok" : "Min Stock"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={d.min_stock_level}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [sid]: { ...d, min_stock_level: e.target.value } }))
                        }
                        className="w-20 h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900 tabular-nums"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Koli İçi" : "Pack Qty"}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={d.units_per_pack}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [sid]: { ...d, units_per_pack: e.target.value } }))
                        }
                        className="w-20 h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900 tabular-nums"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-slate-600">
                        {isTr ? "Paket Birimi" : "Pack Unit"}
                      </label>
                      <input
                        type="text"
                        value={d.pack_unit_label}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [sid]: { ...d, pack_unit_label: e.target.value } }))
                        }
                        className="w-24 h-8 px-2 text-xs bg-white border border-slate-200 rounded text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveBranchSetting(sid)}
                      disabled={savingId === sid}
                      className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      {savingId === sid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>{isTr ? "Kuralları Kaydet" : "Save Rules"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

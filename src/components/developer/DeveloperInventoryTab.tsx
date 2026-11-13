import React from "react";
import {
  Building2,
  Edit3,
  Grid,
  Layers,
  ListFilter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import {
  formatGbp,
  getSectionBandTheme,
  getStatusBadgeMeta,
  InventoryViewMode
} from "./developerProjectUtils";

interface DeveloperInventoryTabProps {
  projects: any[];
  activeProjectDetail: any;
  activeProjectId: number;
  selectedProjectUnits: any[];
  filteredUnits: any[];
  unitTypeGroups: any[];
  unitTypeScopedUnits: any[];
  blockStackingMatrix: any[];
  availableBlocks: string[];
  availableUnitTypes: string[];
  inventoryViewMode: InventoryViewMode;
  setInventoryViewMode: (m: InventoryViewMode) => void;
  unitBlockFilter: string;
  setUnitBlockFilter: (v: string) => void;
  unitTypeFilter: string;
  setUnitTypeFilter: (v: string) => void;
  unitStatusFilter: string;
  setUnitStatusFilter: (v: string) => void;
  unitSearch: string;
  setUnitSearch: (v: string) => void;
  setSelectedPropertyTypeKey: (v: string) => void;
  onReturnToPortfolio: () => void;
  isBatchGeneratorOpen: boolean;
  setIsBatchGeneratorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddUnitOpen: boolean;
  setIsAddUnitOpen: React.Dispatch<React.SetStateAction<boolean>>;
  generatingBatch: boolean;
  batchForm: any;
  setBatchForm: React.Dispatch<React.SetStateAction<any>>;
  newUnitForm: any;
  setNewUnitForm: React.Dispatch<React.SetStateAction<any>>;
  isAddingCustomBlock: boolean;
  setIsAddingCustomBlock: React.Dispatch<React.SetStateAction<boolean>>;
  newCustomBlockName: string;
  setNewCustomBlockName: (v: string) => void;
  onConfirmAddCustomBlock: (targetProjId: number, onSelectBlock?: (blk: string) => void) => void;
  onBatchGenerateUnits: (e: React.FormEvent) => void;
  onAddUnit: (e: React.FormEvent) => void;
  revisingUnit: any | null;
  setRevisingUnit: React.Dispatch<React.SetStateAction<any | null>>;
  renderUnitRevisionForm: () => React.ReactNode;
  revisingGroup: any | null;
  setRevisingGroup: React.Dispatch<React.SetStateAction<any | null>>;
  savingUnitRevision: boolean;
  onSaveGroupBulkRevision: (e: React.FormEvent) => void;
  onDeleteUnit: (unitId: number, unitNoLabel?: string) => void;
  onDeleteUnitGroup: (unitIds: number[], groupLabel: string) => void;
  onUnitStatusChange: (unitId: number, newStatus: string) => void;
  editingUnitPrices: Record<number, number>;
  setEditingUnitPrices: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onUnitPriceSave: (unitId: number) => void;
}

export const DeveloperInventoryTab: React.FC<DeveloperInventoryTabProps> = ({
  projects,
  activeProjectDetail,
  activeProjectId,
  selectedProjectUnits,
  filteredUnits,
  unitTypeGroups,
  unitTypeScopedUnits,
  blockStackingMatrix,
  availableBlocks,
  availableUnitTypes,
  inventoryViewMode,
  setInventoryViewMode,
  unitBlockFilter,
  setUnitBlockFilter,
  unitTypeFilter,
  setUnitTypeFilter,
  unitStatusFilter,
  setUnitStatusFilter,
  unitSearch,
  setUnitSearch,
  setSelectedPropertyTypeKey,
  onReturnToPortfolio,
  isBatchGeneratorOpen,
  setIsBatchGeneratorOpen,
  isAddUnitOpen,
  setIsAddUnitOpen,
  generatingBatch,
  batchForm,
  setBatchForm,
  newUnitForm,
  setNewUnitForm,
  isAddingCustomBlock,
  setIsAddingCustomBlock,
  newCustomBlockName,
  setNewCustomBlockName,
  onConfirmAddCustomBlock,
  onBatchGenerateUnits,
  onAddUnit,
  revisingUnit,
  setRevisingUnit,
  renderUnitRevisionForm,
  revisingGroup,
  setRevisingGroup,
  savingUnitRevision,
  onSaveGroupBulkRevision,
  onDeleteUnit,
  onDeleteUnitGroup,
  onUnitStatusChange,
  editingUnitPrices,
  setEditingUnitPrices,
  onUnitPriceSave
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2.5">
      {/* STEP-BY-STEP INVENTORY FILTER & VIEW BAR */}
      <div className="space-y-2 pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onReturnToPortfolio}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-medium cursor-pointer whitespace-nowrap"
            >
              ← Proje Portföyüne Dön
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              {[
                { id: "grouped_types", label: "Tip & Grup", icon: ListFilter },
                { id: "block_matrix", label: "Blok & Kat Şeması", icon: Grid },
                { id: "table_list", label: `Kapı No Listesi (${filteredUnits.length})`, icon: Layers }
              ].map((vm) => {
                const VIcon = vm.icon;
                const active = inventoryViewMode === vm.id;
                return (
                  <button
                    key={vm.id}
                    type="button"
                    onClick={() => setInventoryViewMode(vm.id as InventoryViewMode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-700 hover:text-slate-950 hover:bg-white/70"
                    }`}
                  >
                    <VIcon className="w-3 h-3 shrink-0" />
                    <span>{vm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={unitBlockFilter}
              onChange={(e) => setUnitBlockFilter(e.target.value)}
              className="w-28 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-medium text-slate-900 outline-none shrink-0 cursor-pointer"
            >
              <option value="all">Tüm Bloklar</option>
              {availableBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="relative shrink-0">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Kapı no, tip, cephe..."
                className="pl-6 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-normal text-slate-900 outline-none w-32"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeProjectDetail) {
                  setBatchForm((prev: any) => ({ ...prev, project_id: activeProjectDetail.id }));
                }
                setIsBatchGeneratorOpen((prev) => !prev);
                setIsAddUnitOpen(false);
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Building2 className="w-3 h-3 shrink-0" />
              <span>+ Seri Üret</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeProjectDetail) {
                  setNewUnitForm((prev: any) => ({ ...prev, project_id: activeProjectDetail.id }));
                }
                setIsAddUnitOpen((prev) => !prev);
                setIsBatchGeneratorOpen(false);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span>+ Ünite</span>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE DROPDOWNS: 1. MÜLK TİPİ -> 2. DURUM */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-medium uppercase text-slate-600 whitespace-nowrap">
                Mülk Tipi:
              </label>
              <select
                value={unitTypeFilter}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setUnitTypeFilter(nextType);
                  if (nextType && nextType !== "all") {
                    setSelectedPropertyTypeKey(nextType);
                  }
                  setRevisingUnit(null);
                }}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
              >
                {availableUnitTypes.map((ut) => (
                  <option key={ut} value={ut}>
                    {ut} ({selectedProjectUnits.filter((u) => String(u.unit_type || "").trim() === ut).length} Kapı No)
                  </option>
                ))}
                <option value="all">Tüm Tipler ({selectedProjectUnits.length} Kapı No)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-medium uppercase text-slate-600 whitespace-nowrap">
                Durum:
              </label>
              <select
                value={unitStatusFilter}
                onChange={(e) => setUnitStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer outline-none focus:border-indigo-600"
              >
                <option value="available">
                  Müsait ({unitTypeScopedUnits.filter((u) => u.status === "available").length})
                </option>
                <option value="negotiation">
                  Sonuçlanmakta ({unitTypeScopedUnits.filter((u) => u.status === "negotiation").length})
                </option>
                <option value="optioned">
                  Opsiyonlu ({unitTypeScopedUnits.filter((u) => u.status === "optioned").length})
                </option>
                <option value="sold">
                  Satıldı ({unitTypeScopedUnits.filter((u) => u.status === "sold").length})
                </option>
                <option value="all">Tümü ({unitTypeScopedUnits.length})</option>
              </select>
            </div>
          </div>

          <div className="text-[10px] font-normal text-slate-500">
            Seçili tip & statü korunarak işlem yapılır · Silmek için çöp kutusuna tıklayın
          </div>
        </div>
      </div>

      {/* SMART BATCH SERIES GENERATOR */}
      {isBatchGeneratorOpen && (
        <form
          onSubmit={onBatchGenerateUnits}
          className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div>
              <span className="text-xs font-semibold text-indigo-950">
                {activeProjectDetail?.name} — Otomatik Blok, Kat & Kapı No Serisi Üretici
              </span>
              <p className="text-[10px] text-slate-600">
                Blok, kat aralığı, kat başına kapı adedi ve kat/köşe şerefiye kurallarını girerek tüm bağımsız bölümleri tek tıkla oluşturun.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBatchGeneratorOpen(false)}
              className="text-slate-500 hover:text-slate-950 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Kapat</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">Proje</label>
              <select
                value={batchForm.project_id}
                onChange={(e) => setBatchForm({ ...batchForm, project_id: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[9px] text-slate-700 uppercase font-medium">
                  Blok Adı
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomBlock((prev) => !prev)}
                  className="text-[9px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  {isAddingCustomBlock ? "Listeden Seç" : "+ Yeni Blok Ekle"}
                </button>
              </div>
              {isAddingCustomBlock ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newCustomBlockName}
                    onChange={(e) => setNewCustomBlockName(e.target.value)}
                    placeholder="Yeni Blok (Örn: D Blok)"
                    className="flex-1 min-w-0 px-2 py-1 bg-white border border-indigo-400 rounded text-xs text-slate-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onConfirmAddCustomBlock(
                        Number(batchForm.project_id || activeProjectId),
                        (blk) => {
                          const prefixGuess = blk.split(" ")[0]?.replace(/[^A-Za-z0-9]/g, "") || "A";
                          setBatchForm((prev: any) => ({
                            ...prev,
                            block_name: blk,
                            door_prefix: prefixGuess
                          }));
                        }
                      )
                    }
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium cursor-pointer shrink-0"
                  >
                    Ekle
                  </button>
                </div>
              ) : (
                <select
                  value={
                    availableBlocks.includes(batchForm.block_name)
                      ? batchForm.block_name
                      : availableBlocks[0] || batchForm.block_name
                  }
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW_BLOCK__") {
                      setIsAddingCustomBlock(true);
                      return;
                    }
                    const blk = e.target.value;
                    const prefixGuess = blk.split(" ")[0]?.replace(/[^A-Za-z0-9]/g, "") || "A";
                    setBatchForm({
                      ...batchForm,
                      block_name: blk,
                      door_prefix: prefixGuess
                    });
                  }}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium cursor-pointer"
                >
                  {!availableBlocks.includes(batchForm.block_name) && batchForm.block_name && (
                    <option value={batchForm.block_name}>{batchForm.block_name}</option>
                  )}
                  {availableBlocks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__ADD_NEW_BLOCK__">+ Yeni Blok Adı Ekle...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Kapı No Öneki (C-101)
              </label>
              <input
                type="text"
                value={batchForm.door_prefix}
                onChange={(e) => setBatchForm({ ...batchForm, door_prefix: e.target.value })}
                placeholder="C"
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">Ünite Tipi</label>
              <input
                type="text"
                list="project-unit-types-list"
                value={batchForm.unit_type}
                onChange={(e) => setBatchForm({ ...batchForm, unit_type: e.target.value })}
                placeholder="1+1 Loft Penthouse"
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              />
              <datalist id="project-unit-types-list">
                {availableUnitTypes.map((ut) => (
                  <option key={ut} value={ut} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Kat Aralığı (Başlangıç - Bitiş)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={batchForm.start_floor}
                  onChange={(e) => setBatchForm({ ...batchForm, start_floor: Number(e.target.value) })}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
                  title="Başlangıç Katı (0 = Zemin)"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={batchForm.end_floor}
                  onChange={(e) => setBatchForm({ ...batchForm, end_floor: Number(e.target.value) })}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
                  title="Bitiş Katı"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Kattaki Daire Adedi
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={batchForm.units_per_floor}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, units_per_floor: Number(e.target.value) })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 items-end">
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Brüt / Net / Teras m²
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={batchForm.gross_sqm}
                  onChange={(e) => setBatchForm({ ...batchForm, gross_sqm: Number(e.target.value) })}
                  className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
                  title="Brüt m²"
                />
                <input
                  type="number"
                  value={batchForm.net_sqm}
                  onChange={(e) => setBatchForm({ ...batchForm, net_sqm: Number(e.target.value) })}
                  className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
                  title="Net m²"
                />
                <input
                  type="number"
                  value={batchForm.terrace_sqm}
                  onChange={(e) => setBatchForm({ ...batchForm, terrace_sqm: Number(e.target.value) })}
                  className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
                  title="Teras m²"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Baz Fiyat (GBP £)
              </label>
              <input
                type="number"
                value={batchForm.base_price}
                onChange={(e) => setBatchForm({ ...batchForm, base_price: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Kat Şerefiye Artışı (+£/Kat)
              </label>
              <input
                type="number"
                value={batchForm.floor_price_increment}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, floor_price_increment: Number(e.target.value) })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-emerald-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Köşe Cephe Farkı (+£)
              </label>
              <input
                type="number"
                value={batchForm.corner_price_bonus}
                onChange={(e) =>
                  setBatchForm({ ...batchForm, corner_price_bonus: Number(e.target.value) })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Manzara & Konum Değişkeni
              </label>
              <input
                type="text"
                value={batchForm.view_direction}
                onChange={(e) => setBatchForm({ ...batchForm, view_direction: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={generatingBatch}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
              >
                {generatingBatch ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {Math.max(1, batchForm.end_floor - batchForm.start_floor + 1) *
                    Math.max(1, batchForm.units_per_floor)}{" "}
                  Ünite Üret
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SINGLE UNIT ADD DRAWER */}
      {isAddUnitOpen && (
        <form
          onSubmit={onAddUnit}
          className="p-2.5 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end"
        >
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Proje</label>
            <select
              value={newUnitForm.project_id}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, project_id: Number(e.target.value) })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[9px] text-slate-700 uppercase font-medium">Blok Adı</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomBlock((prev) => !prev)}
                className="text-[9px] font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                {isAddingCustomBlock ? "Seç" : "+ Ekle"}
              </button>
            </div>
            {isAddingCustomBlock ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newCustomBlockName}
                  onChange={(e) => setNewCustomBlockName(e.target.value)}
                  placeholder="Yeni Blok"
                  className="flex-1 min-w-0 px-2 py-1 bg-white border border-indigo-400 rounded text-xs text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() =>
                    onConfirmAddCustomBlock(
                      Number(newUnitForm.project_id || activeProjectId),
                      (blk) => setNewUnitForm((prev: any) => ({ ...prev, block_name: blk }))
                    )
                  }
                  className="px-1.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-medium cursor-pointer"
                >
                  Ekle
                </button>
              </div>
            ) : (
              <select
                value={newUnitForm.block_name}
                onChange={(e) => {
                  if (e.target.value === "__ADD_NEW_BLOCK__") {
                    setIsAddingCustomBlock(true);
                    return;
                  }
                  setNewUnitForm({ ...newUnitForm, block_name: e.target.value });
                }}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium cursor-pointer"
              >
                {!availableBlocks.includes(newUnitForm.block_name) && newUnitForm.block_name && (
                  <option value={newUnitForm.block_name}>{newUnitForm.block_name}</option>
                )}
                {availableBlocks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="__ADD_NEW_BLOCK__">+ Yeni Blok Ekle...</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Kapı No</label>
            <input
              type="text"
              value={newUnitForm.unit_number}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_number: e.target.value })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-semibold"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Ünite Tipi</label>
            <input
              type="text"
              list="project-unit-types-list"
              value={newUnitForm.unit_type}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, unit_type: e.target.value })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Kat & Konum</label>
            <input
              type="text"
              value={newUnitForm.floor_level}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, floor_level: e.target.value })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Manzara / Cephe</label>
            <input
              type="text"
              value={newUnitForm.view_direction}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, view_direction: e.target.value })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
            />
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Brüt / Net m²</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={newUnitForm.gross_sqm}
                onChange={(e) => setNewUnitForm({ ...newUnitForm, gross_sqm: Number(e.target.value) })}
                className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
              <input
                type="number"
                value={newUnitForm.net_sqm}
                onChange={(e) => setNewUnitForm({ ...newUnitForm, net_sqm: Number(e.target.value) })}
                className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] text-slate-700 uppercase font-medium">Fiyat (GBP £)</label>
            <input
              type="number"
              value={newUnitForm.price}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, price: Number(e.target.value) })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-semibold"
            />
          </div>
          <div className="flex gap-1">
            <button
              type="submit"
              className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setIsAddUnitOpen(false)}
              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-medium flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* UNIT REVISION DRAWER */}
      {revisingUnit && renderUnitRevisionForm()}

      {/* GROUP BULK REVISION DRAWER */}
      {revisingGroup && (
        <form
          onSubmit={onSaveGroupBulkRevision}
          className="p-3 bg-amber-50/80 text-slate-900 rounded-xl border border-amber-300 space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
            <span className="text-xs font-semibold text-amber-950">
              Toplu Grup Revizyonu: {revisingGroup.title} ({revisingGroup.unitIds.length} Bağımsız Bölüm)
            </span>
            <button
              type="button"
              onClick={() => setRevisingGroup(null)}
              className="text-slate-600 hover:text-slate-950 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Kapat</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Blok Adını Değiştir
              </label>
              <input
                type="text"
                placeholder="Değiştirmek için yazın"
                value={revisingGroup.block_name}
                onChange={(e) => setRevisingGroup({ ...revisingGroup, block_name: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Ünite Tipini Değiştir
              </label>
              <input
                type="text"
                value={revisingGroup.unit_type}
                onChange={(e) => setRevisingGroup({ ...revisingGroup, unit_type: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Manzara / Cephe Değiştir
              </label>
              <input
                type="text"
                placeholder="Örn: Tam Deniz & Havuz"
                value={revisingGroup.view_direction}
                onChange={(e) =>
                  setRevisingGroup({ ...revisingGroup, view_direction: e.target.value })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Sabit Fiyat Ata (GBP £)
              </label>
              <input
                type="number"
                placeholder="Boş bırakılırsa değişmez"
                value={revisingGroup.price}
                onChange={(e) => setRevisingGroup({ ...revisingGroup, price: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-700 uppercase font-medium">
                Toplu Statü Ata
              </label>
              <select
                value={revisingGroup.status}
                onChange={(e) => setRevisingGroup({ ...revisingGroup, status: e.target.value })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              >
                <option value="">Mevcut Statüleri Koru</option>
                <option value="available">Tümü Müsait</option>
                <option value="negotiation">Tümü Sonuçlanmakta (Sözleşme)</option>
                <option value="optioned">Tümü Opsiyonlu</option>
                <option value="sold">Tümü Satıldı</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={savingUnitRevision}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Grubu Revize Et & Drive'a İşle
            </button>
          </div>
        </form>
      )}

      {filteredUnits.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-8 text-center space-y-2.5">
          <p className="text-xs font-medium text-slate-700">
            Seçili mülk tipi ve durum filtresine uygun bağımsız bölüm bulunamadı.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {unitStatusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setUnitStatusFilter("all")}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Bu Mülk Tipinde Tüm Durumları Göster
              </button>
            )}
            {unitTypeFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setUnitTypeFilter("all");
                  setUnitStatusFilter("all");
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-medium cursor-pointer transition-colors"
              >
                Tüm Tipleri Göster
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: TİP & GRUP ÖZETİ */}
          {inventoryViewMode === "grouped_types" && (
            <div className="space-y-3">
              <div className="space-y-3.5">
                {unitTypeGroups.map((grp, gIdx) => {
                  const theme = getSectionBandTheme(gIdx);
                  return (
                    <div
                      key={grp.key}
                      className={`rounded-xl border border-l-4 overflow-hidden shadow-2xs transition-all ${theme.cardBg}`}
                    >
                      <div
                        className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${theme.headerBg}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${theme.badgeBg}`}>
                            TİP GRUBU #{gIdx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium ${theme.subBadgeBg}`}
                          >
                            {grp.project_name}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-950">{grp.unit_type}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-[10px] font-medium text-slate-800">
                            {grp.total} Bağımsız Bölüm
                          </span>
                          <span className="text-[11px] text-slate-700 font-normal">
                            • Alan: <strong className="text-slate-950 font-medium">{grp.grossSqm} m² Brüt</strong> /{" "}
                            {grp.netSqm} m² Net (+{grp.terraceSqm} m² Teras)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200/90 text-right">
                            <span className="text-[9px] font-medium text-slate-500 uppercase mr-1.5">
                              Fiyat Aralığı:
                            </span>
                            <span className="text-xs font-semibold text-slate-950 font-mono">
                              {grp.minPrice === grp.maxPrice
                                ? formatGbp(grp.minPrice)
                                : `${formatGbp(grp.minPrice)} – ${formatGbp(grp.maxPrice)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                        <div className="lg:col-span-5 space-y-2">
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-medium">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg py-1 shadow-2xs">
                              {grp.available} Müsait
                            </div>
                            <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-lg py-1 shadow-2xs">
                              {grp.negotiation} Sonuçlanmakta
                            </div>
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg py-1 shadow-2xs">
                              {grp.optioned} Opsiyonlu
                            </div>
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg py-1 shadow-2xs">
                              {grp.sold} Satıldı
                            </div>
                          </div>

                          <div className={`rounded-xl p-2.5 border text-[11px] space-y-1 shadow-2xs ${theme.innerBoxBg}`}>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-medium text-slate-700">Bloklar:</span>
                              <span className="text-slate-950 font-medium">
                                {Array.from(grp.blocks).join(", ")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-medium text-slate-700">Kat Değişkenleri:</span>
                              <span className="text-slate-800 font-normal">
                                {Array.from(grp.floors).join(" · ")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-medium text-slate-700">Manzara & Cephe:</span>
                              <span className="text-indigo-900 font-normal">
                                {Array.from(grp.views).join(" | ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`lg:col-span-7 rounded-xl p-2.5 border shadow-2xs ${theme.innerBoxBg}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-medium uppercase text-slate-700">
                              Bağımsız Bölüm Kapı Numaraları ({grp.units.length} Adet — Revize İçin Tıklayın / Silin)
                            </span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Kapı No (Kat) · Sil
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {grp.units.map((u: any) => {
                              const meta = getStatusBadgeMeta(u.status);
                              return (
                                <div
                                  key={u.id}
                                  className={`inline-flex items-center rounded-lg border overflow-hidden shadow-2xs ${meta.chipBg}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setRevisingUnit({ ...u })}
                                    title={`${u.block_name} | Kapı: ${u.unit_number} | Kat: ${u.floor_level} | Manzara: ${u.view_direction} | Fiyat: ${formatGbp(u.price)} (${meta.label})`}
                                    className="px-2.5 py-1 text-[10px] font-mono font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap hover:opacity-85 transition-opacity"
                                  >
                                    <span>{u.unit_number}</span>
                                    <span className="opacity-80 text-[9px] font-sans">
                                      ({u.floor_level?.split(" ")[0]})
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteUnit(u.id, u.unit_number);
                                    }}
                                    title={`Kapı No ${u.unit_number} Bağımsız Bölümünü Sil`}
                                    className="px-1.5 py-1 border-l border-current/20 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`px-3.5 py-2 border-t flex flex-wrap items-center justify-between gap-2 ${theme.footerBg}`}
                      >
                        <span className="text-[10px] font-normal text-slate-600">
                          Grup #{gIdx + 1} • {grp.unit_type} ({grp.total} Bağımsız Bölüm)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setRevisingGroup({
                                title: `${grp.project_name} — ${grp.unit_type}`,
                                unitIds: grp.units.map((u: any) => u.id),
                                block_name: "",
                                unit_type: grp.unit_type,
                                view_direction: "",
                                floor_level: "",
                                status: "",
                                price: ""
                              })
                            }
                            className="px-2.5 py-1 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-300 rounded-lg text-[10px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Grubu Toplu Revize Et</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDeleteUnitGroup(
                                grp.units.map((u: any) => u.id),
                                grp.unit_type
                              )
                            }
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-[10px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Grubun Kapı Nolarını Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: BLOK & KAT MATRİSİ */}
          {inventoryViewMode === "block_matrix" && (
            <div className="space-y-3.5">
              {blockStackingMatrix.map((blk, bIdx) => {
                const blockTheme = getSectionBandTheme(bIdx);
                return (
                  <div
                    key={bIdx}
                    className={`rounded-xl border border-l-4 overflow-hidden shadow-2xs ${blockTheme.cardBg}`}
                  >
                    <div
                      className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${blockTheme.headerBg}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${blockTheme.badgeBg}`}>
                          BLOK #{bIdx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-medium ${blockTheme.subBadgeBg}`}
                        >
                          {blk.projectName}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-950">{blk.blockTitle}</h4>
                      </div>
                      <span className="text-[11px] font-normal text-slate-700">
                        Kat Kesiti & Bağımsız Bölüm Kapı No Şeması ({blk.floors.length} Kat)
                      </span>
                    </div>

                    <div className="p-3 space-y-2.5">
                      {blk.floors.map((fl: any, fIdx: number) => {
                        const floorTheme = getSectionBandTheme(bIdx + fIdx);
                        return (
                          <div
                            key={fIdx}
                            className={`grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center p-2.5 rounded-xl border border-l-4 ${floorTheme.cardBg}`}
                          >
                            <div
                              className={`lg:col-span-2 px-2.5 py-2 rounded-lg border text-center ${floorTheme.subBadgeBg}`}
                            >
                              <div className="text-[9px] font-medium uppercase opacity-80">
                                Kat / Kot #{fIdx + 1}
                              </div>
                              <div className="text-xs font-semibold text-slate-950 mt-0.5">
                                {fl.floorName}
                              </div>
                            </div>

                            <div className="lg:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                              {fl.units.map((u: any) => {
                                const meta = getStatusBadgeMeta(u.status);
                                return (
                                  <div
                                    key={u.id}
                                    className="rounded-lg border border-slate-200/90 p-2 flex flex-col justify-between gap-1.5 hover:border-indigo-500 transition-all bg-white shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono text-xs font-semibold text-slate-950 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                        Kapı: {u.unit_number}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${meta.pillBg}`}
                                      >
                                        {meta.label}
                                      </span>
                                    </div>

                                    <div>
                                      <div className="text-[11px] font-medium text-slate-900">
                                        {u.unit_type}
                                      </div>
                                      <div
                                        className="text-[10px] text-slate-500 truncate"
                                        title={u.view_direction}
                                      >
                                        {u.view_direction}
                                      </div>
                                      <div className="text-[10px] text-slate-600 font-mono">
                                        {u.gross_sqm} m² Brüt / {u.net_sqm} m² Net
                                      </div>
                                    </div>

                                    <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between">
                                      <span className="text-xs font-semibold text-slate-950 font-mono">
                                        {formatGbp(u.price)}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setRevisingUnit({ ...u })}
                                          className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-medium cursor-pointer whitespace-nowrap"
                                        >
                                          Revize Et
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDeleteUnit(u.id, u.unit_number)}
                                          className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[9px] font-medium cursor-pointer flex items-center gap-0.5 whitespace-nowrap transition-colors"
                                          title={`Kapı No ${u.unit_number} Sil`}
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                          <span>Sil</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 3: DETAYLI TABLO */}
          {inventoryViewMode === "table_list" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="py-2 px-2.5 rounded-tl-lg">Proje</th>
                    <th className="py-2 px-2.5">Blok & Bağımsız Kapı No</th>
                    <th className="py-2 px-2.5">Ünite Tipi</th>
                    <th className="py-2 px-2.5">Alan (Brüt / Net)</th>
                    <th className="py-2 px-2.5">Kat, Konum & Manzara</th>
                    <th className="py-2 px-2.5">Liste Fiyatı (GBP)</th>
                    <th className="py-2 px-2.5">Statü</th>
                    <th className="py-2 px-2.5 text-right rounded-tr-lg">Revizyon, Durum & Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {filteredUnits.map((unit, uIdx) => {
                    const editedPrice = editingUnitPrices[unit.id];
                    const meta = getStatusBadgeMeta(unit.status);
                    const rowTheme = getSectionBandTheme(uIdx);
                    return (
                      <tr key={unit.id} className={`transition-colors ${rowTheme.rowBg}`}>
                        <td className="py-2 px-2.5 font-medium text-slate-900 whitespace-nowrap">
                          {unit.project_name}
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                              {unit.unit_number}
                            </span>
                            <span className="text-slate-800 font-normal">{unit.block_name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium ${rowTheme.subBadgeBg}`}
                          >
                            {unit.unit_type}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-normal font-mono tabular-nums whitespace-nowrap">
                          {unit.gross_sqm} m² / {unit.net_sqm} m²{" "}
                          <span className="text-[10px] text-slate-500">(+{unit.terrace_sqm}m²)</span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700">
                          <span className="font-medium text-slate-900">{unit.floor_level}</span> •{" "}
                          <span>{unit.view_direction}</span>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">£</span>
                            <input
                              type="number"
                              value={editedPrice !== undefined ? editedPrice : Number(unit.price)}
                              onChange={(e) =>
                                setEditingUnitPrices((prev) => ({
                                  ...prev,
                                  [unit.id]: Number(e.target.value)
                                }))
                              }
                              className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-950 font-mono tabular-nums"
                            />
                            {editedPrice !== undefined && editedPrice !== Number(unit.price) && (
                              <button
                                type="button"
                                onClick={() => onUnitPriceSave(unit.id)}
                                className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-semibold cursor-pointer whitespace-nowrap"
                              >
                                Kaydet
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium text-[10px] border ${meta.pillBg}`}
                          >
                            {meta.label}
                          </span>
                          {unit.optioned_client_name && (
                            <div className="text-[9px] text-slate-600 font-normal mt-0.5">
                              {unit.optioned_client_name}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setRevisingUnit({ ...unit })}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              title="Blok, Kapı No, Tip, Kat, Manzara ve Fiyatı Revize Et"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Revize Et</span>
                            </button>
                            <select
                              value={unit.status}
                              onChange={(e) => onUnitStatusChange(unit.id, e.target.value)}
                              className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-medium text-slate-800 cursor-pointer"
                            >
                              <option value="available">Müsait Yap</option>
                              <option value="negotiation">Sonuçlanmakta</option>
                              <option value="optioned">Opsiyona Al</option>
                              <option value="sold">Satıldı İşaretle</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => onDeleteUnit(unit.id, unit.unit_number)}
                              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded text-[10px] font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors"
                              title={`Kapı No ${unit.unit_number} Bağımsız Bölümünü Sil`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

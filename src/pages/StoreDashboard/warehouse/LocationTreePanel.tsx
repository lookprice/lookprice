import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  LayoutTemplate,
  Printer,
  Trash2,
  Edit3,
  Check,
  X,
  Package,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";
import type { WarehouseConfigData } from "./WarehouseConfigPanel";

interface Props {
  storeId: number;
  targetStoreId: number;
  locations: any[];
  config: WarehouseConfigData;
  onRefresh: () => Promise<void>;
}

// Pure offline SVG Code39-style barcode generator (zero CDN/external dependency)
function buildBarcodeSvg(value: string): string {
  const clean = String(value || "LOC").toUpperCase().replace(/[^A-Z0-9\-\.\$\/\+\%\s]/g, "");
  const patterns: Record<string, string> = {
    "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
    "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
    "A": "wnnnnwnnw", "B": "nnwnnwnnw", "C": "wnwnnwnnn", "D": "nnnnwwnnw", "E": "wnnnwwnnn",
    "F": "nnwnwwnnn", "G": "nnnnnwwnw", "H": "wnnnnwwnn", "I": "nnwnnwwnn", "J": "nnnnwwwnn",
    "K": "wnnnnnnww", "L": "nnwnnnnww", "M": "wnwnnnnwn", "N": "nnnnwnnww", "O": "wnnnwnnwn",
    "P": "nnwnwnnwn", "Q": "nnnnnnwww", "R": "wnnnnnwwn", "S": "nnwnnnwwn", "T": "nnnnwnwwn",
    "U": "wwnnnnnnw", "V": "nwwnnnnnw", "W": "wwwnnnnnn", "X": "nwnnwnnnw", "Y": "wwnnwnnnn",
    "Z": "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
    "$": "nwnwnwnnn", "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn"
  };
  const encoded = `*${clean}*`;
  let x = 4;
  const rects: string[] = [];
  for (const ch of encoded) {
    const pat = patterns[ch] || patterns["-"];
    for (let i = 0; i < pat.length; i++) {
      const w = pat[i] === "w" ? 3 : 1.2;
      if (i % 2 === 0) {
        rects.push(`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="38" fill="#000"/>`);
      }
      x += w;
    }
    x += 1.5;
  }
  const totalW = Math.ceil(x + 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} 38" style="width:100%;max-width:220px;height:38px;">${rects.join("")}</svg>`;
}

export const LocationTreePanel: React.FC<Props> = ({ storeId, targetStoreId, locations, config, onRefresh }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Collapsible active tool panel: "" | "add" | "bulk" | "template" | "edit"
  const [openTool, setOpenTool] = useState<"" | "add" | "bulk" | "template" | "edit">("");
  const [busy, setBusy] = useState(false);

  // Add form state
  const [addParentId, setAddParentId] = useState<string>("");
  const [addType, setAddType] = useState<string>(config.location_types[0]?.key || "SHELF");
  const [addName, setAddName] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addSellable, setAddSellable] = useState(false);
  const [addSortOrder, setAddSortOrder] = useState("0");
  const [addTags, setAddTags] = useState<string[]>([]);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState("SHELF");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editSellable, setEditSellable] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);

  // Bulk generate state
  const [bulkParentId, setBulkParentId] = useState<string>("");
  const [bulkType, setBulkType] = useState<string>("RACK");
  const [bulkNamePrefix, setBulkNamePrefix] = useState("Raf");
  const [bulkCodePrefix, setBulkCodePrefix] = useState("R");
  const [bulkStart, setBulkStart] = useState("1");
  const [bulkEnd, setBulkEnd] = useState("5");
  const [bulkSubBins, setBulkSubBins] = useState("A,B,C");

  // Selection for label printing
  const [selectedForPrint, setSelectedForPrint] = useState<Record<number, boolean>>({});

  const selectedLoc = useMemo(() => locations.find(l => Number(l.id) === Number(selectedLocId)) || null, [locations, selectedLocId]);

  const childrenMap = useMemo(() => {
    const map: Record<string, any[]> = { root: [] };
    for (const loc of locations) {
      const pKey = loc.parent_id ? String(loc.parent_id) : "root";
      if (!map[pKey]) map[pKey] = [];
      map[pKey].push(loc);
    }
    return map;
  }, [locations]);

  useEffect(() => {
    if (!selectedLocId && locations.length > 0) {
      setSelectedLocId(Number(locations[0].id));
    } else if (selectedLocId && !locations.some(l => Number(l.id) === Number(selectedLocId))) {
      setSelectedLocId(locations[0] ? Number(locations[0].id) : null);
    }
  }, [locations, selectedLocId]);

  useEffect(() => {
    if (!selectedLocId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoadingItems(true);
    api.getLocationItems(selectedLocId, true, storeId)
      .then(res => {
        if (!cancelled) setItems(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingItems(false);
      });
    return () => { cancelled = true; };
  }, [selectedLocId, storeId, locations]);

  const openEditFor = (loc: any) => {
    setSelectedLocId(Number(loc.id));
    setEditName(loc.name || "");
    setEditCode(loc.code || "");
    setEditType(loc.location_type || "SHELF");
    setEditSortOrder(String(loc.sort_order ?? 0));
    setEditSellable(Boolean(loc.is_sellable));
    setEditTags(Array.isArray(loc.tags) ? loc.tags : []);
    setOpenTool("edit");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setBusy(true);
    try {
      const res = await api.createWarehouseLocation({
        target_store_id: targetStoreId,
        parent_id: addParentId ? Number(addParentId) : null,
        location_type: addType,
        name: addName.trim(),
        code: addCode.trim() || undefined,
        is_sellable: addSellable,
        sort_order: Number(addSortOrder) || 0,
        tags: addTags
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success("Lokasyon eklendi.");
      setAddName("");
      setAddCode("");
      setAddTags([]);
      if (addParentId) setExpanded(prev => ({ ...prev, [Number(addParentId)]: true }));
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Lokasyon eklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoc || !editName.trim()) return;
    setBusy(true);
    try {
      const res = await api.updateWarehouseLocation(Number(selectedLoc.id), {
        name: editName.trim(),
        code: editCode.trim(),
        location_type: editType,
        sort_order: Number(editSortOrder) || 0,
        is_sellable: editSellable,
        tags: editTags
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success("Lokasyon ve alt yollar güncellendi.");
      setOpenTool("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Güncellenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (loc: any) => {
    setBusy(true);
    try {
      const res = await api.deleteWarehouseLocation(Number(loc.id), storeId);
      if (res?.error) throw new Error(res.error);
      toast.success("Lokasyon silindi.");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Silinemedi.");
    } finally {
      setBusy(false);
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.bulkGenerateLocations({
        target_store_id: targetStoreId,
        parent_id: bulkParentId ? Number(bulkParentId) : null,
        location_type: bulkType,
        name_prefix: bulkNamePrefix,
        code_prefix: bulkCodePrefix,
        start_num: Number(bulkStart) || 1,
        end_num: Number(bulkEnd) || 5,
        sub_bins: bulkSubBins
      }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`${res.created_count || 0} lokasyon oluşturuldu.`);
      setOpenTool("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Toplu üretim başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const handleTemplate = async (template: string) => {
    setBusy(true);
    try {
      const res = await api.applyLocationTemplate({ target_store_id: targetStoreId, template }, storeId);
      if (res?.error) throw new Error(res.error);
      toast.success(`Şablon uygulandı (${res.created_count || 0} lokasyon).`);
      setOpenTool("");
      await onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Şablon uygulanamadı.");
    } finally {
      setBusy(false);
    }
  };

  const handlePrintLabels = () => {
    const picked = locations.filter(l => selectedForPrint[l.id]);
    const list = picked.length > 0 ? picked : (selectedLoc ? [selectedLoc] : locations.filter(l => l.system_role === "STANDARD").slice(0, 24));
    if (list.length === 0) {
      toast.error("Yazdırılacak lokasyon bulunamadı.");
      return;
    }

    const fmt = config.label_format || "80mm";
    const isA4 = fmt === "a4_3x8";
    const pageCss = isA4
      ? `@page { size: A4 portrait; margin: 6mm; } .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; } .lbl { border: 1px solid #cbd5e1; padding: 3mm; text-align: center; break-inside: avoid; height: 32mm; display: flex; flex-direction: column; justify-content: center; }`
      : `@page { size: ${fmt === "58mm" ? "58mm" : "80mm"} auto; margin: 2mm; } .grid { display: flex; flex-direction: column; gap: 4mm; } .lbl { border-bottom: 1px dashed #94a3b8; padding: 3mm 1mm; text-align: center; page-break-after: always; }`;

    const cards = list.map(loc => `
      <div class="lbl">
        <div class="code">${String(loc.full_code || loc.code || "").replace(/</g, "&lt;")}</div>
        <div class="bc">${buildBarcodeSvg(loc.barcode || loc.full_code)}</div>
        <div class="path">${String(loc.full_path || loc.name || "").replace(/</g, "&lt;")}</div>
      </div>
    `).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; color: #0f172a; }
      ${pageCss}
      .code { font-size: ${fmt === "58mm" ? "13px" : "16px"}; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 2px; }
      .bc { margin: 2px auto; }
      .path { font-size: ${fmt === "58mm" ? "9px" : "10px"}; color: #334155; word-break: break-word; }
    </style></head><body><div class="grid">${cards}</div></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    }
  };

  const renderNode = (loc: any, depth = 0) => {
    const kids = childrenMap[String(loc.id)] || [];
    const isExp = expanded[loc.id] ?? depth < 1;
    const isSel = Number(selectedLocId) === Number(loc.id);
    const isSys = loc.system_role !== "STANDARD";

    return (
      <div key={loc.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 text-xs border-b border-slate-100 cursor-pointer transition-colors ${
            isSel ? "bg-indigo-50 text-slate-900" : "hover:bg-slate-50 text-slate-800"
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => setSelectedLocId(Number(loc.id))}
        >
          <input
            type="checkbox"
            checked={Boolean(selectedForPrint[loc.id])}
            onClick={e => e.stopPropagation()}
            onChange={e => setSelectedForPrint(prev => ({ ...prev, [loc.id]: e.target.checked }))}
            className="w-3.5 h-3.5 rounded border-slate-300 shrink-0"
          />
          {kids.length > 0 ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setExpanded(prev => ({ ...prev, [loc.id]: !isExp })); }}
              className="p-0.5 text-slate-500 hover:text-slate-900 shrink-0"
            >
              {isExp ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <span className="font-mono text-[10px] text-slate-500 shrink-0">{loc.code}</span>
          <span className={`truncate flex-1 ${isSys ? "font-medium text-indigo-700" : ""}`}>{loc.name}</span>

          <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{Number(loc.total_qty || 0)}</span>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setAddParentId(String(loc.id));
              setOpenTool("add");
            }}
            className="p-1 text-slate-400 hover:text-indigo-600 shrink-0"
            title="Alt Raf Ekle"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); openEditFor(loc); }}
            className="p-1 text-slate-400 hover:text-slate-800 shrink-0"
            title="Düzenle"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          {!isSys && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); handleDelete(loc); }}
              className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
              title="Sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {kids.length > 0 && isExp && kids.map(k => renderNode(k, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Compact Collapsible Action Strip */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpenTool(openTool === "add" ? "" : "add")}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 border cursor-pointer ${
            openTool === "add" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ekle</span>
        </button>
        <button
          type="button"
          onClick={() => setOpenTool(openTool === "bulk" ? "" : "bulk")}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 border cursor-pointer ${
            openTool === "bulk" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Toplu Raf</span>
        </button>
        <button
          type="button"
          onClick={() => setOpenTool(openTool === "template" ? "" : "template")}
          className={`h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 border cursor-pointer ${
            openTool === "template" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Şablon</span>
        </button>
        <button
          type="button"
          onClick={handlePrintLabels}
          className="h-8 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 border bg-white text-slate-800 border-slate-200 hover:bg-slate-50 cursor-pointer ml-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Etiket ({config.label_format})</span>
        </button>
      </div>

      {/* Collapsible Drawer: ADD LOCATION */}
      {openTool === "add" && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-end gap-2">
          <div className="w-40 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Üst Lokasyon</label>
            <select value={addParentId} onChange={e => setAddParentId(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
              <option value="">Ana Kök</option>
              {locations.filter(l => l.system_role === "STANDARD").map(l => (
                <option key={l.id} value={l.id}>{l.full_path}</option>
              ))}
            </select>
          </div>
          <div className="w-32 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Tip</label>
            <select value={addType} onChange={e => setAddType(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
              {config.location_types.map(lt => (
                <option key={lt.key} value={lt.key}>{lt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px] space-y-0.5">
            <label className="block text-[10px] text-slate-500">Ad *</label>
            <input type="text" required value={addName} onChange={e => setAddName(e.target.value)} placeholder="Örn: 1. Alan Sağ" className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
          </div>
          <div className="w-24 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Kısa Kod</label>
            <input type="text" value={addCode} onChange={e => setAddCode(e.target.value)} placeholder="A1S" maxLength={12} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase" />
          </div>
          <div className="w-16 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Sıra</label>
            <input type="number" value={addSortOrder} onChange={e => setAddSortOrder(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          <label className="h-8 inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer px-1">
            <input type="checkbox" checked={addSellable} onChange={e => setAddSellable(e.target.checked)} className="rounded border-slate-300" />
            <span>Reyon</span>
          </label>
          <button type="submit" disabled={busy} className="h-8 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Ekle</span>
          </button>
          <button type="button" onClick={() => setOpenTool("")} className="h-8 px-2 text-slate-500 hover:text-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
        </form>
      )}

      {/* Collapsible Drawer: EDIT LOCATION */}
      {openTool === "edit" && selectedLoc && (
        <form onSubmit={handleUpdate} className="bg-white border border-indigo-200 rounded-lg p-2.5 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[140px] space-y-0.5">
            <label className="block text-[10px] text-slate-500">Lokasyon Adı</label>
            <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
          </div>
          <div className="w-24 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Kod</label>
            <input type="text" required value={editCode} onChange={e => setEditCode(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase" />
          </div>
          <div className="w-28 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Tip</label>
            <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
              {config.location_types.map(lt => <option key={lt.key} value={lt.key}>{lt.label}</option>)}
            </select>
          </div>
          <div className="w-16 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Sıra</label>
            <input type="number" value={editSortOrder} onChange={e => setEditSortOrder(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          {config.location_tags.length > 0 && (
            <div className="w-full flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500">Etiket:</span>
              {config.location_tags.map(tag => {
                const active = editTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setEditTags(prev => active ? prev.filter(x => x !== tag) : [...prev, tag])}
                    className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                      active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
          <label className="h-8 inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" checked={editSellable} onChange={e => setEditSellable(e.target.checked)} />
            <span>Reyon</span>
          </label>
          <button type="submit" disabled={busy} className="h-8 px-3 rounded bg-slate-900 text-white text-xs font-medium cursor-pointer ml-auto">Güncelle</button>
          <button type="button" onClick={() => setOpenTool("")} className="h-8 px-2 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </form>
      )}

      {/* Collapsible Drawer: BULK GENERATE */}
      {openTool === "bulk" && (
        <form onSubmit={handleBulk} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-end gap-2">
          <div className="w-40 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Üst Lokasyon</label>
            <select value={bulkParentId} onChange={e => setBulkParentId(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
              <option value="">Ana Kök</option>
              {locations.filter(l => l.system_role === "STANDARD").map(l => <option key={l.id} value={l.id}>{l.full_path}</option>)}
            </select>
          </div>
          <div className="w-24 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Ad Öneki</label>
            <input type="text" value={bulkNamePrefix} onChange={e => setBulkNamePrefix(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
          </div>
          <div className="w-16 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Kod</label>
            <input type="text" value={bulkCodePrefix} onChange={e => setBulkCodePrefix(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 uppercase" />
          </div>
          <div className="w-16 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Başla</label>
            <input type="number" min={1} value={bulkStart} onChange={e => setBulkStart(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          <div className="w-16 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Bitiş</label>
            <input type="number" min={1} value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 tabular-nums" />
          </div>
          <div className="w-28 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Alt Gözler</label>
            <input type="text" value={bulkSubBins} onChange={e => setBulkSubBins(e.target.value)} placeholder="A,B,C" className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900" />
          </div>
          <div className="w-28 space-y-0.5">
            <label className="block text-[10px] text-slate-500">Tip</label>
            <select value={bulkType} onChange={e => setBulkType(e.target.value)} className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900">
              {config.location_types.map(lt => <option key={lt.key} value={lt.key}>{lt.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={busy} className="h-8 px-3 rounded bg-indigo-600 text-white text-xs font-medium cursor-pointer">Oluştur</button>
          <button type="button" onClick={() => setOpenTool("")} className="h-8 px-2 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </form>
      )}

      {/* Collapsible Drawer: STARTER TEMPLATES */}
      {openTool === "template" && (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={() => handleTemplate("warehouse_standard")} className="h-8 px-3 rounded border border-slate-200 hover:bg-slate-50 text-xs text-slate-800 cursor-pointer">
            Standart Depo (Alan › Koridor › Raf)
          </button>
          <button type="button" disabled={busy} onClick={() => handleTemplate("store_showroom")} className="h-8 px-3 rounded border border-slate-200 hover:bg-slate-50 text-xs text-slate-800 cursor-pointer">
            Mağaza / Showroom (Kat › Reyon › Raf)
          </button>
          <button type="button" disabled={busy} onClick={() => handleTemplate("cabinet_drawer")} className="h-8 px-3 rounded border border-slate-200 hover:bg-slate-50 text-xs text-slate-800 cursor-pointer">
            Dolap / Çekmece (Dolap › Çekmece)
          </button>
          <button type="button" onClick={() => setOpenTool("")} className="ml-auto p-1 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Split View: Tree (Left) + Items in Bin (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Lokasyon Ağacı ({locations.length})</span>
            <span className="tabular-nums">Adet</span>
          </div>
          <div className="max-h-[460px] overflow-y-auto">
            {(childrenMap.root || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">Lokasyon yok.</div>
            ) : (
              (childrenMap.root || []).map(l => renderNode(l, 0))
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{selectedLoc ? selectedLoc.full_path : "Lokasyon seçin"}</div>
              {selectedLoc && (
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {selectedLoc.full_code} • Barkod: {selectedLoc.barcode}
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{items.length} kalem</span>
          </div>

          <div className="flex-1 max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {loadingItems ? (
              <div className="p-6 flex items-center justify-center text-xs text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Yükleniyor...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5">
                <Package className="w-5 h-5 text-slate-300" />
                <span>Bu lokasyonda ürün yok.</span>
              </div>
            ) : (
              items.map(it => (
                <div key={`${it.id}-${it.location_id}`} className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{it.product_name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                      <span className="font-mono">{it.barcode}</span>
                      <span className="truncate">{it.full_code}</span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums shrink-0">
                    <div className="font-semibold text-slate-900">{it.quantity} {it.unit || "Adet"}</div>
                    {Number(it.reserved_quantity || 0) > 0 && (
                      <div className="text-[10px] text-amber-700">{it.reserved_quantity} rez</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

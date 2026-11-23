import React, { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

export interface WarehouseConfigData {
  code_separator: string;
  location_types: Array<{ key: string; label: string; prefix: string }>;
  location_tags: string[];
  discrepancy_reasons: string[];
  pack_unit_labels: string[];
  label_format: "58mm" | "80mm" | "a4_3x8";
  default_receiving_sla_hours: number;
}

interface Props {
  storeId: number;
  config: WarehouseConfigData;
  onSaved: (next: WarehouseConfigData) => void;
}

export const WarehouseConfigPanel: React.FC<Props> = ({ storeId, config, onSaved }) => {
  const [draft, setDraft] = useState<WarehouseConfigData>(config);
  const [saving, setSaving] = useState(false);
  const [openSec, setOpenSec] = useState<string>("types");

  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypePrefix, setNewTypePrefix] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newPackUnit, setNewPackUnit] = useState("");

  const toggle = (key: string) => setOpenSec(prev => (prev === key ? "" : key));

  const addType = () => {
    const label = newTypeLabel.trim();
    if (!label) return;
    const key = label
      .replace(/ğ/gi, "g").replace(/ü/gi, "u").replace(/ş/gi, "s")
      .replace(/ı/gi, "i").replace(/İ/gi, "I").replace(/ö/gi, "o").replace(/ç/gi, "c")
      .toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 24);
    const prefix = (newTypePrefix.trim() || key.slice(0, 2)).toUpperCase().slice(0, 6);
    if (draft.location_types.some(t => t.key === key)) {
      toast.error("Bu tip zaten mevcut.");
      return;
    }
    setDraft(d => ({ ...d, location_types: [...d.location_types, { key, label, prefix }] }));
    setNewTypeLabel("");
    setNewTypePrefix("");
  };

  const addListItem = (field: "location_tags" | "discrepancy_reasons" | "pack_unit_labels", val: string, clear: () => void) => {
    const clean = val.trim();
    if (!clean) return;
    if (draft[field].includes(clean)) return;
    setDraft(d => ({ ...d, [field]: [...d[field], clean] }));
    clear();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.saveWarehouseConfig(draft, storeId);
      if (res?.error) throw new Error(res.error);
      onSaved(res.config || draft);
      toast.success("Depo değişkenleri kaydedildi.");
    } catch (err: any) {
      toast.error(err?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Compact General Settings Row */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-end gap-3">
        <div className="space-y-0.5">
          <label className="block text-[11px] text-slate-600">Kod Ayırıcı</label>
          <select
            value={draft.code_separator}
            onChange={e => setDraft(d => ({ ...d, code_separator: e.target.value }))}
            className="w-20 h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
          >
            <option value="-">Tire (-)</option>
            <option value="/">Eğik (/)</option>
            <option value=".">Nokta (.)</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="block text-[11px] text-slate-600">Etiket Boyutu</label>
          <select
            value={draft.label_format}
            onChange={e => setDraft(d => ({ ...d, label_format: e.target.value as any }))}
            className="w-28 h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
          >
            <option value="58mm">58mm Termal</option>
            <option value="80mm">80mm Termal</option>
            <option value="a4_3x8">A4 (3×8)</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="block text-[11px] text-slate-600">Mal Kabul SLA (Saat)</label>
          <input
            type="number"
            min={1}
            max={720}
            value={draft.default_receiving_sla_hours}
            onChange={e => setDraft(d => ({ ...d, default_receiving_sla_hours: Math.max(1, Number(e.target.value) || 24) }))}
            className="w-20 h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 tabular-nums"
          />
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      {/* Accordion 1: Location Types */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle("types")}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-slate-900 hover:bg-slate-50 cursor-pointer"
        >
          <span>Lokasyon Tipleri ({draft.location_types.length})</span>
          {openSec === "types" ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        {openSec === "types" && (
          <div className="p-2.5 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <input
                type="text"
                value={newTypeLabel}
                onChange={e => setNewTypeLabel(e.target.value)}
                placeholder="Tip adı (örn: Askılık, Soğuk Oda)"
                className="flex-1 min-w-[150px] h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
              />
              <input
                type="text"
                value={newTypePrefix}
                onChange={e => setNewTypePrefix(e.target.value)}
                placeholder="Önek"
                maxLength={6}
                className="w-20 h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 uppercase"
              />
              <button
                type="button"
                onClick={addType}
                className="h-9 px-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md max-h-56 overflow-y-auto">
              {draft.location_types.map((lt, idx) => (
                <div key={lt.key} className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-slate-500 w-10 shrink-0">{lt.prefix}</span>
                    <span className="text-slate-900 truncate">{lt.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, location_types: d.location_types.filter((_, i) => i !== idx) }))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Location Tags */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle("tags")}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-slate-900 hover:bg-slate-50 cursor-pointer"
        >
          <span>Lokasyon Etiketleri / Özellikleri ({draft.location_tags.length})</span>
          {openSec === "tags" ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        {openSec === "tags" && (
          <div className="p-2.5 border-t border-slate-100 space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("location_tags", newTag, () => setNewTag("")))}
                placeholder="Örn: Soğuk Zincir, Tehlikeli Madde"
                className="flex-1 h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
              />
              <button
                type="button"
                onClick={() => addListItem("location_tags", newTag, () => setNewTag(""))}
                className="h-9 px-3 rounded-md bg-indigo-600 text-white text-xs font-medium cursor-pointer"
              >
                Ekle
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {draft.location_tags.map((t, idx) => (
                <div key={t} className="px-2.5 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-800">{t}</span>
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, location_tags: d.location_tags.filter((_, i) => i !== idx) }))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Discrepancy / Damage Reasons */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle("reasons")}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-slate-900 hover:bg-slate-50 cursor-pointer"
        >
          <span>Fark & Hasar Nedenleri ({draft.discrepancy_reasons.length})</span>
          {openSec === "reasons" ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        {openSec === "reasons" && (
          <div className="p-2.5 border-t border-slate-100 space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("discrepancy_reasons", newReason, () => setNewReason("")))}
                placeholder="Yeni neden ekle"
                className="flex-1 h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
              />
              <button
                type="button"
                onClick={() => addListItem("discrepancy_reasons", newReason, () => setNewReason(""))}
                className="h-9 px-3 rounded-md bg-indigo-600 text-white text-xs font-medium cursor-pointer"
              >
                Ekle
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {draft.discrepancy_reasons.map((r, idx) => (
                <div key={r} className="px-2.5 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-800">{r}</span>
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, discrepancy_reasons: d.discrepancy_reasons.filter((_, i) => i !== idx) }))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 4: Pack Unit Labels */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle("packs")}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-slate-900 hover:bg-slate-50 cursor-pointer"
        >
          <span>Koli / Paket Birimleri ({draft.pack_unit_labels.length})</span>
          {openSec === "packs" ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>
        {openSec === "packs" && (
          <div className="p-2.5 border-t border-slate-100 space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newPackUnit}
                onChange={e => setNewPackUnit(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addListItem("pack_unit_labels", newPackUnit, () => setNewPackUnit("")))}
                placeholder="Örn: Sandık, Bağ, Rulo"
                className="flex-1 h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900"
              />
              <button
                type="button"
                onClick={() => addListItem("pack_unit_labels", newPackUnit, () => setNewPackUnit(""))}
                className="h-9 px-3 rounded-md bg-indigo-600 text-white text-xs font-medium cursor-pointer"
              >
                Ekle
              </button>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {draft.pack_unit_labels.map((u, idx) => (
                <div key={u} className="px-2.5 py-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-800">{u}</span>
                  <button
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, pack_unit_labels: d.pack_unit_labels.filter((_, i) => i !== idx) }))}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { Edit3, Save, Trash2, X } from "lucide-react";

export interface ProjectFormState {
  name: string;
  folder_prefix: string;
  region: string;
  sub_region: string;
  concept_tagline: string;
  completion_date: string;
  construction_progress: number;
  total_units: number;
  available_units: number;
  starting_price: number;
  down_payment_percent: number;
  installment_months: number;
  annual_rental_yield_percent: number;
  capital_appreciation_percent: number;
  cover_image: string;
  payment_notes: string;
}

interface DeveloperProjectEditFormProps {
  titleLabel: string;
  projectForm: ProjectFormState;
  setProjectForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const DeveloperProjectEditForm: React.FC<DeveloperProjectEditFormProps> = ({
  titleLabel,
  projectForm,
  setProjectForm,
  onSubmit,
  onClose
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="p-3 bg-indigo-50/90 text-slate-900 rounded-xl border-2 border-indigo-400 space-y-2.5 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
        <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>{titleLabel}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Kapat</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Proje Adı *</label>
          <input
            type="text"
            required
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            placeholder="Örn: Santorini Villas"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Klasör Kodu</label>
          <input
            type="text"
            value={projectForm.folder_prefix}
            onChange={(e) => setProjectForm({ ...projectForm, folder_prefix: e.target.value })}
            placeholder="Örn: 11. Santorini Homes"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Bölge</label>
          <input
            type="text"
            value={projectForm.sub_region}
            onChange={(e) => setProjectForm({ ...projectForm, sub_region: e.target.value })}
            placeholder="Esentepe / Tatlısu"
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Başlangıç Fiyatı (GBP £)
          </label>
          <input
            type="number"
            value={projectForm.starting_price}
            onChange={(e) =>
              setProjectForm({ ...projectForm, starting_price: Number(e.target.value) || 0 })
            }
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-semibold"
          />
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Peşinat % / Taksit (Ay)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={projectForm.down_payment_percent}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  down_payment_percent: Number(e.target.value) || 35
                })
              }
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              title="Peşinat %"
            />
            <input
              type="number"
              value={projectForm.installment_months}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  installment_months: Number(e.target.value) || 36
                })
              }
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              title="Faizsiz Vade (Ay)"
            />
          </div>
        </div>
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Teslim & İnşaat %
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={projectForm.completion_date}
              onChange={(e) => setProjectForm({ ...projectForm, completion_date: e.target.value })}
              className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
              placeholder="Q4 2027"
            />
            <input
              type="number"
              value={projectForm.construction_progress}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  construction_progress: Number(e.target.value) || 0
                })
              }
              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-emerald-800 font-semibold"
              title="İnşaat %"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={projectForm.concept_tagline}
          onChange={(e) => setProjectForm({ ...projectForm, concept_tagline: e.target.value })}
          placeholder="Proje Konsept Özeti"
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
        />
        <input
          type="text"
          value={projectForm.payment_notes}
          onChange={(e) => setProjectForm({ ...projectForm, payment_notes: e.target.value })}
          placeholder="Ödeme Planı Açıklaması"
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={projectForm.cover_image}
            onChange={(e) => setProjectForm({ ...projectForm, cover_image: e.target.value })}
            placeholder="Kapak Görseli URL"
            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </form>
  );
};

interface DeveloperUnitRevisionFormProps {
  revisingUnit: any;
  setRevisingUnit: React.Dispatch<React.SetStateAction<any | null>>;
  activePropertyTypeKey: string;
  availableBlocks: string[];
  savingUnitRevision: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteUnit: (unitId: number, unitNoLabel?: string) => void;
}

export const DeveloperUnitRevisionForm: React.FC<DeveloperUnitRevisionFormProps> = ({
  revisingUnit,
  setRevisingUnit,
  activePropertyTypeKey,
  availableBlocks,
  savingUnitRevision,
  onSubmit,
  onDeleteUnit
}) => {
  if (!revisingUnit) return null;
  return (
    <form
      onSubmit={onSubmit}
      className="p-3 bg-indigo-50/80 text-slate-900 rounded-xl border border-indigo-300 space-y-2.5 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-xs font-medium">
            Kapı No: {revisingUnit.unit_number}
          </span>
          <span className="text-xs font-semibold text-slate-900">
            Bağımsız Bölüm & Blok Revizyonu ({revisingUnit.unit_type || activePropertyTypeKey})
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">
            · Kaydedildiğinde aynı ekran ve statüde kalır
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onDeleteUnit(revisingUnit.id, revisingUnit.unit_number)}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-rose-300 whitespace-nowrap"
          >
            <Trash2 className="w-3 h-3" />
            <span>Kapı Numarasını Sil</span>
          </button>
          <button
            type="button"
            onClick={() => setRevisingUnit(null)}
            className="text-slate-600 hover:text-slate-950 text-xs font-medium flex items-center gap-1 cursor-pointer px-1.5 py-1 rounded hover:bg-white/70"
          >
            <X className="w-3.5 h-3.5" />
            <span>Kapat</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Blok Adı</label>
          <input
            type="text"
            required
            list="project-blocks-datalist"
            value={revisingUnit.block_name || ""}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, block_name: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium"
          />
          <datalist id="project-blocks-datalist">
            {availableBlocks.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Bağımsız Kapı No
          </label>
          <input
            type="text"
            required
            value={revisingUnit.unit_number || ""}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, unit_number: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-medium"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Ünite Tipi</label>
          <input
            type="text"
            required
            value={revisingUnit.unit_type || ""}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, unit_type: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">Kat / Kot</label>
          <input
            type="text"
            value={revisingUnit.floor_level || ""}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, floor_level: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Manzara & Cephe
          </label>
          <input
            type="text"
            value={revisingUnit.view_direction || ""}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, view_direction: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Konum / Aks (Köşe/Orta)
          </label>
          <input
            type="text"
            value={revisingUnit.position_tag || "Panoramik Aks"}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, position_tag: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
          />
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Brüt / Net / Teras m²
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={revisingUnit.gross_sqm || 0}
              onChange={(e) =>
                setRevisingUnit({ ...revisingUnit, gross_sqm: Number(e.target.value) })
              }
              className="w-12 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              title="Brüt m²"
            />
            <input
              type="number"
              value={revisingUnit.net_sqm || 0}
              onChange={(e) =>
                setRevisingUnit({ ...revisingUnit, net_sqm: Number(e.target.value) })
              }
              className="w-12 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              title="Net m²"
            />
            <input
              type="number"
              value={revisingUnit.terrace_sqm || 0}
              onChange={(e) =>
                setRevisingUnit({ ...revisingUnit, terrace_sqm: Number(e.target.value) })
              }
              className="w-10 px-1 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-normal"
              title="Teras m²"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Liste Fiyatı (GBP £)
          </label>
          <input
            type="number"
            value={revisingUnit.price || 0}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, price: Number(e.target.value) })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-950 font-mono font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-1">
        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Bağımsız Bölüm Satış Statüsü
          </label>
          <select
            value={revisingUnit.status || "available"}
            onChange={(e) => setRevisingUnit({ ...revisingUnit, status: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-900"
          >
            <option value="available">MÜSAİT (Satışa Açık)</option>
            <option value="negotiation">SONUÇLANMAKTA (Sözleşme / Kaparo Aşamasında)</option>
            <option value="optioned">OPSİYONLU (Rezerve)</option>
            <option value="sold">SATILDI (Sözleşmesi Tamamlandı)</option>
          </select>
        </div>

        <div>
          <label className="block text-[9px] text-slate-700 uppercase font-medium">
            Alıcı / Sözleşme Notu (Opsiyonel)
          </label>
          <input
            type="text"
            placeholder="Örn: Avukat sözleşme onayı bekleniyor / Müşteri Adı"
            value={revisingUnit.optioned_client_name || ""}
            onChange={(e) =>
              setRevisingUnit({ ...revisingUnit, optioned_client_name: e.target.value })
            }
            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onDeleteUnit(revisingUnit.id, revisingUnit.unit_number)}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sil</span>
          </button>
          <button
            type="submit"
            disabled={savingUnitRevision}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {savingUnitRevision
                ? "Kaydediliyor..."
                : "Revizyonu Kaydet & Drive'a İşle"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

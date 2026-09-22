import React from "react";
import { MapPin } from "lucide-react";
import { AutocompleteSelect } from "../../AutocompleteSelect";
import { RealEstateProperty } from "../../../types";
import { api } from "../../../services/api";

interface RealEstateOwnerLocationTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
  contacts: any[];
  setContacts: React.Dispatch<React.SetStateAction<any[]>>;
  branches: any[];
  consultants: any[];
  storeId?: number;
  standardizeOwnerPhone: (phone: string) => string;
}

export const RealEstateOwnerLocationTab: React.FC<RealEstateOwnerLocationTabProps> = ({
  formData,
  setFormData,
  contacts,
  setContacts,
  branches,
  consultants,
  storeId,
  standardizeOwnerPhone
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <span className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5 tracking-wide">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          2. Mülk Sahibi, Konum Adresi & Şube Ataması
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          CRM & Portföy Güvenliği
        </span>
      </div>

      {/* Owner Autocomplete & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-amber-50/40 p-2 rounded-lg border border-amber-200/70">
        <div>
          <AutocompleteSelect
            items={contacts}
            displayField="name"
            secondaryField="phone"
            type="customer"
            lang="tr"
            value={formData.owner_info?.fullName || ""}
            placeholder="Mülk sahibi arayın..."
            label="Mülk Sahibi (Ad Soyad)"
            onSelect={(selectedContact) => {
              if (selectedContact) {
                setFormData({
                  ...formData,
                  owner_info: {
                    fullName: selectedContact.name,
                    phone: selectedContact.phone || ""
                  }
                });
              } else {
                setFormData({
                  ...formData,
                  owner_info: { fullName: "", phone: "" }
                });
              }
            }}
            onQuickAdd={async (searchVal) => {
              try {
                const newContact = {
                  name: searchVal,
                  phone: "",
                  type: "owner" as const,
                  notes: "Portföy ekranından hızlı eklendi."
                };
                await api.addRealEstateContact(newContact, storeId);
                const res = await api.getRealEstateContacts(undefined, storeId);
                setContacts(Array.isArray(res) ? res : []);
                const saved = Array.isArray(res)
                  ? res.find(
                      (c) =>
                        c.name.toLowerCase().trim() === searchVal.toLowerCase().trim()
                    )
                  : null;
                setFormData({
                  ...formData,
                  owner_info: {
                    fullName: searchVal,
                    phone: saved?.phone || ""
                  }
                });
              } catch (err) {
                console.error("Quick add failed", err);
              }
            }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
            Mülk Sahibi (Telefon)
          </label>
          <input
            type="tel"
            placeholder="+90 533 123 4567"
            className="w-full px-2 py-1 h-8 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-amber-500 shadow-2xs"
            value={formData.owner_info?.phone || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                owner_info: { ...formData.owner_info, phone: e.target.value } as any
              })
            }
            onBlur={(e) => {
              const normalized = standardizeOwnerPhone(e.target.value);
              setFormData({
                ...formData,
                owner_info: { ...formData.owner_info, phone: normalized } as any
              });
            }}
          />
        </div>
      </div>

      {/* Address / Land Plot Coordinates */}
      {formData.type !== "land" ? (
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
            Portföy Açık Adres Bilgisi *
          </label>
          <input
            type="text"
            className="w-full px-2 py-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
            placeholder="Örn: Girne Merkez, Atatürk Caddesi No: 42 Daire: 5..."
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
          {[
            { label: "Mahalle / Köy *", key: "mahalle", placeholder: "Alsancak" },
            { label: "Ada *", key: "ada", placeholder: "142" },
            { label: "Parsel *", key: "parsel", placeholder: "12" },
            { label: "Pafta", key: "pafta", placeholder: "XI-4" }
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                {field.label}
              </label>
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full px-2 py-1 h-7.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                value={(formData as any)[field.key] || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [field.key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Branch & Consultant assignment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
            Yetkili Şube
          </label>
          <select
            className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            value={formData.authorized_branch_id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const branch = branches.find((b) => b.id === id);
              setFormData({
                ...formData,
                authorized_branch_id: id,
                branch_name: branch?.name || ""
              });
            }}
          >
            <option value="">Şube Seçiniz (Merkez)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
            Sorumlu Danışman
          </label>
          <select
            className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            value={formData.responsible_consultant_id || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const consultant = consultants.find((c) => c.id === id);
              setFormData({
                ...formData,
                responsible_consultant_id: id,
                responsible_agent: consultant?.name || ""
              });
            }}
          >
            <option value="">Danışman Seçiniz</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
            Paylaşım Durumu
          </label>
          <select
            className="w-full px-2 py-1 h-7.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            value={formData.sharing_scope || "shared_pool"}
            onChange={(e) =>
              setFormData({ ...formData, sharing_scope: e.target.value as any })
            }
          >
            <option value="shared_pool">🌐 Ortak Havuz (Tüm Şubeler)</option>
            <option value="branch_private">🔒 Şube İçi Özel</option>
            <option value="private">🔑 Danışmana Özel</option>
          </select>
        </div>
      </div>
    </div>
  );
};

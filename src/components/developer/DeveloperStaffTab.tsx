import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { getSectionBandTheme } from "./developerProjectUtils";

export interface StaffFormState {
  full_name: string;
  title_role: string;
  department: string;
  email: string;
  phone: string;
  assigned_regions: string;
  permissions: {
    can_manage_projects: boolean;
    can_upload_media: boolean;
    can_manage_prices: boolean;
    can_manage_users: boolean;
  };
}

interface DeveloperStaffTabProps {
  companyDisplayName: string;
  internalStaff: any[];
  filteredStaff: any[];
  staffDeptFilter: string;
  setStaffDeptFilter: (dept: string) => void;
  isNewStaffOpen: boolean;
  setIsNewStaffOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newStaffForm: StaffFormState;
  setNewStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>;
  onCreateInternalStaff: (e: React.FormEvent) => void;
  onToggleStaffPermission: (
    staffMember: any,
    permKey: "can_manage_projects" | "can_upload_media" | "can_manage_prices" | "can_manage_users"
  ) => void;
  onDeleteInternalStaff: (id: number) => void;
}

export const DeveloperStaffTab: React.FC<DeveloperStaffTabProps> = ({
  companyDisplayName,
  internalStaff,
  filteredStaff,
  staffDeptFilter,
  setStaffDeptFilter,
  isNewStaffOpen,
  setIsNewStaffOpen,
  newStaffForm,
  setNewStaffForm,
  onCreateInternalStaff,
  onToggleStaffPermission,
  onDeleteInternalStaff
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            {companyDisplayName} — Ekip & Kullanıcı Yetkileri ({internalStaff.length})
          </h3>
          <p className="text-[11px] text-slate-500">
            Teknik, Satış, PR ve Yönetim ekibiniz için kullanıcı tanımlayın ve erişim yetkilerini belirleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-[10px] font-semibold uppercase text-slate-500 whitespace-nowrap">
            Departman:
          </label>
          <select
            value={staffDeptFilter}
            onChange={(e) => setStaffDeptFilter(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 cursor-pointer outline-none"
          >
            <option value="all">Tüm Departmanlar ({internalStaff.length})</option>
            <option value="Yönetim">Yönetim</option>
            <option value="Teknik & Mimari">Teknik & Mimari</option>
            <option value="Satış">Satış</option>
            <option value="PR & Pazarlama">PR & Pazarlama</option>
          </select>

          <button
            type="button"
            onClick={() => setIsNewStaffOpen((prev) => !prev)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kullanıcı Ekle</span>
          </button>
        </div>
      </div>

      {isNewStaffOpen && (
        <form
          onSubmit={onCreateInternalStaff}
          className="p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-300 space-y-2.5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <input
              type="text"
              required
              placeholder="Ad Soyad *"
              value={newStaffForm.full_name}
              onChange={(e) => setNewStaffForm({ ...newStaffForm, full_name: e.target.value })}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
            />
            <select
              value={newStaffForm.department}
              onChange={(e) => {
                const dept = e.target.value;
                setNewStaffForm({
                  ...newStaffForm,
                  department: dept,
                  permissions: {
                    can_manage_projects: dept === "Yönetim" || dept === "Teknik & Mimari",
                    can_upload_media: true,
                    can_manage_prices: dept === "Yönetim" || dept === "Satış",
                    can_manage_users: dept === "Yönetim"
                  }
                });
              }}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
            >
              <option value="Yönetim">Yönetim</option>
              <option value="Teknik & Mimari">Teknik & Mimari</option>
              <option value="Satış">Satış</option>
              <option value="PR & Pazarlama">PR & Pazarlama</option>
            </select>
            <input
              type="text"
              placeholder="Görev / Unvan"
              value={newStaffForm.title_role}
              onChange={(e) => setNewStaffForm({ ...newStaffForm, title_role: e.target.value })}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
            />
            <input
              type="email"
              placeholder="Kurumsal E-Posta *"
              value={newStaffForm.email}
              onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Sorumlu Projeler / Alan"
                value={newStaffForm.assigned_regions}
                onChange={(e) =>
                  setNewStaffForm({ ...newStaffForm, assigned_regions: e.target.value })
                }
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer shrink-0 whitespace-nowrap"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-200 text-[10px] font-semibold uppercase">
              <th className="py-2 px-2.5 rounded-tl-lg">Ad Soyad & E-Posta</th>
              <th className="py-2 px-2.5">Departman & Görev</th>
              <th className="py-2 px-2.5">Sorumlu Alan</th>
              <th className="py-2 px-2.5 text-center">Proje & Klasör</th>
              <th className="py-2 px-2.5 text-center">Medya & Plan Yükleme</th>
              <th className="py-2 px-2.5 text-center">Fiyat & Stok</th>
              <th className="py-2 px-2.5 text-center">Ekip Yönetimi</th>
              <th className="py-2 px-2.5 text-right rounded-tr-lg">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {filteredStaff.map((st, stIdx) => {
              const rowTheme = getSectionBandTheme(stIdx);
              const perms = st.permissions || {
                can_manage_projects:
                  st.department === "Yönetim" || st.department === "Teknik & Mimari",
                can_upload_media: true,
                can_manage_prices: st.department === "Yönetim" || st.department === "Satış",
                can_manage_users: st.department === "Yönetim"
              };
              return (
                <tr key={st.id} className={`transition-colors ${rowTheme.rowBg}`}>
                  <td className="py-2 px-2.5">
                    <div className="font-semibold text-slate-900">{st.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{st.email}</div>
                  </td>
                  <td className="py-2 px-2.5">
                    <span
                      className={`px-2 py-0.5 border rounded text-[10px] font-medium ${rowTheme.subBadgeBg}`}
                    >
                      {st.department}
                    </span>
                    <div className="text-[11px] font-normal text-slate-700 mt-0.5">
                      {st.title_role}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-[11px] text-slate-700 font-normal">
                    {st.assigned_regions}
                  </td>
                  {(
                    [
                      "can_manage_projects",
                      "can_upload_media",
                      "can_manage_prices",
                      "can_manage_users"
                    ] as const
                  ).map((permKey) => {
                    const enabled = Boolean(perms[permKey]);
                    return (
                      <td key={permKey} className="py-2 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleStaffPermission(st, permKey)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer border whitespace-nowrap transition-colors ${
                            enabled
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-white text-slate-400 border-slate-200"
                          }`}
                        >
                          {enabled ? "Yetkili" : "Kapalı"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-2 px-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteInternalStaff(st.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Kullanıcıyı Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

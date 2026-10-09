import React from "react";
import { Hotel, BookOpen } from "lucide-react";

interface MultiTenancyLicensesTabProps {
  configForm: any;
  setConfigForm: React.Dispatch<React.SetStateAction<any>>;
}

export const MultiTenancyLicensesTab: React.FC<MultiTenancyLicensesTabProps> = ({
  configForm,
  setConfigForm
}) => {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plan & Expiry */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            Abonelik & Lisans Süresi
          </h4>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Abonelik Paketi
            </label>
            <select
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              value={configForm.plan || "free"}
              onChange={(e) => setConfigForm({ ...configForm, plan: e.target.value })}
            >
              <option value="free">Free / Standart</option>
              <option value="basic">Basic (Temel)</option>
              <option value="pro">Pro (Gelişmiş)</option>
              <option value="enterprise">Enterprise (Sınırsız)</option>
              <option value="vip">VIP Özel Akredite</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Bitiş Tarihi
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                value={configForm.subscription_end || ""}
                onChange={(e) =>
                  setConfigForm({ ...configForm, subscription_end: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setFullYear(d.getFullYear() + 1);
                  setConfigForm({
                    ...configForm,
                    subscription_end: d.toISOString().split("T")[0]
                  });
                }}
                className="px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg shrink-0"
              >
                +1 Yıl
              </button>
            </div>
          </div>
        </div>

        {/* Sektörel Modül Lisansları */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <h4 className="text-xs font-black text-slate-900 dark:text-white">
            Sektörel Yetki & Lisans Anahtarları
          </h4>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Hotel className="h-4 w-4 text-amber-500" /> Otel & Rezervasyon Vitrini
              </span>
              <input
                type="checkbox"
                checked={Boolean(configForm.hotel_module_enabled)}
                onChange={(e) =>
                  setConfigForm({ ...configForm, hotel_module_enabled: e.target.checked })
                }
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-rose-500" /> BookLP Sinematik Kitapçı
              </span>
              <input
                type="checkbox"
                checked={Boolean(configForm.bookstore_module_enabled)}
                onChange={(e) =>
                  setConfigForm({
                    ...configForm,
                    bookstore_module_enabled: e.target.checked
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* Limit Sayıları */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <h4 className="text-xs font-black text-slate-900 dark:text-white">
          Maksimum Envanter & Kullanıcı Limitleri
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Ürün
            </label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
              value={configForm.max_products || 100}
              onChange={(e) =>
                setConfigForm({ ...configForm, max_products: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Emlak
            </label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
              value={configForm.max_properties || 20}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  max_properties: Number(e.target.value)
                })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Araç
            </label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
              value={configForm.max_vehicles || 20}
              onChange={(e) =>
                setConfigForm({ ...configForm, max_vehicles: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Personel
            </label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
              value={configForm.max_users || 5}
              onChange={(e) =>
                setConfigForm({ ...configForm, max_users: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Max Müşteri
            </label>
            <input
              type="number"
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
              value={configForm.max_customers || 50}
              onChange={(e) =>
                setConfigForm({
                  ...configForm,
                  max_customers: Number(e.target.value)
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

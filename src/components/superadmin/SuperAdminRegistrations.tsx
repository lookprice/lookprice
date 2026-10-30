import React from "react";
import {
  Package,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";

interface SuperAdminRegistrationsProps {
  registrationRequests: any[];
  st: any;
  handleApproveRegistration: (id: number) => void;
  handleRejectRegistration: (id: number) => void;
  handleDeleteRegistrationRequest: (id: number) => void;
}

export const SuperAdminRegistrations: React.FC<SuperAdminRegistrationsProps> = ({
  registrationRequests,
  st,
  handleApproveRegistration,
  handleRejectRegistration,
  handleDeleteRegistrationRequest,
}) => {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-500" /> {st.registrationRequests}{" "}
          ({registrationRequests.length})
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Sisteme yeni dahil olmak isteyen mağaza başvuruları
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3.5 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                BAŞVURU SAHİBİ
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                İLETİŞİM
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                MAĞAZA DETAYI
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                DURUM
              </th>
              <th className="px-3.5 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                {st.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {registrationRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                >
                  Henüz yeni bir başvuru bulunmuyor.
                </td>
              </tr>
            ) : (
              registrationRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0">
                        {(req.store_name || "LP").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                          {req.store_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          @{req.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center text-[11px] text-slate-700 dark:text-slate-200 font-medium">
                        <Mail className="h-3 w-3 mr-1 text-slate-400" />{" "}
                        {req.admin_email}
                      </div>
                      <div className="flex items-center text-[10px] text-slate-400 font-mono">
                        <Phone className="h-2.5 w-2.5 mr-1" />{" "}
                        {req.phone || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />{" "}
                        {req.address || "N/A"}
                      </div>
                      <div className="flex items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-tighter">
                        <Globe className="h-2.5 w-2.5 mr-1" /> {req.country} /{" "}
                        {req.language}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        req.status === "pending"
                          ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 animate-pulse"
                          : req.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {req.status === "pending"
                        ? "Onay Bekliyor"
                        : req.status === "approved"
                        ? "Onaylandı"
                        : "Reddedildi"}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveRegistration(req.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-all cursor-pointer"
                            title="Onayla"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectRegistration(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                            title="Reddet"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteRegistrationRequest(req.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

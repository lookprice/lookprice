import React from "react";
import {
  Search,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  Trash2,
  MessageCircle,
  User,
} from "lucide-react";
import { Lead } from "../../types/superadmin";

interface SuperAdminLeadsProps {
  leads: Lead[];
  leadSearchTerm: string;
  setLeadSearchTerm: (term: string) => void;
  leadFilter: string;
  setLeadFilter: (filter: any) => void;
  st: any;
  setSelectedLead: (lead: Lead) => void;
  handleDeleteLead: (id: number) => void;
}

const getSectorBadge = (type?: string) => {
  switch (type) {
    case "motor_vehicle":
      return {
        label: "Otomotiv (AutoLP)",
        bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      };
    case "real_estate":
      return {
        label: "Emlak (REstateLP)",
        bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    case "restaurant":
    case "cafe_restaurant":
      return {
        label: "HoReCa (HoReCaLP)",
        bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      };
    case "corporate_website":
      return {
        label: "Kurumsal Web (WebLP)",
        bg: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      };
    case "product":
    default:
      return {
        label: "Perakende (ShopLP)",
        bg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      };
  }
};

export const SuperAdminLeads: React.FC<SuperAdminLeadsProps> = ({
  leads,
  leadSearchTerm,
  setLeadSearchTerm,
  leadFilter,
  setLeadFilter,
  st,
  setSelectedLead,
  handleDeleteLead,
}) => {
  const filteredLeads = leads.filter((l) => {
    const leadSearchTerms = leadSearchTerm
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    const matchesSearch =
      leadSearchTerms.length === 0 ||
      leadSearchTerms.every(
        (term) =>
          (l.store_name && l.store_name.toLowerCase().includes(term)) ||
          (l.name && l.name.toLowerCase().includes(term)) ||
          (l.company_title && l.company_title.toLowerCase().includes(term)) ||
          (l.phone && l.phone.toLowerCase().includes(term)) ||
          (l.email && l.email.toLowerCase().includes(term))
      );
    const matchesFilter = leadFilter === "all" || l.status === leadFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />{" "}
            {st.newLeads} ({filteredLeads.length})
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Satış hunisindeki potansiyel müşteri adayları ve demo talepleri
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="İsim, mağaza, telefon, e-posta..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={leadSearchTerm}
              onChange={(e) => setLeadSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-auto px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="new">Yeni</option>
            <option value="contacted">İletişime Geçildi</option>
            <option value="demo">Demo Yapıldı</option>
            <option value="sold">Satış Tamamlandı</option>
            <option value="lost">Kaybedildi</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3.5 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {st.customerStore}
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {st.contact}
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {st.status}
              </th>
              <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {st.probability}
              </th>
              <th className="px-3.5 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                {st.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filteredLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 font-medium"
                >
                  {st.noLeads}
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const sector = getSectorBadge(lead.store_type);
                const rawPhone = lead.phone
                  ? lead.phone.replace(/[^0-9]/g, "")
                  : "";
                const waPhone = rawPhone.startsWith("0")
                  ? "90" + rawPhone.substring(1)
                  : rawPhone.startsWith("90")
                  ? rawPhone
                  : rawPhone
                  ? "90" + rawPhone
                  : "";

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                          {(lead.store_name || lead.name || "LP")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                            {lead.store_name}
                          </p>
                          {lead.name && (
                            <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              <User className="h-3 w-3 shrink-0" />
                              <span>{lead.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${sector.bg}`}
                            >
                              {sector.label}
                            </span>
                            {lead.company_title && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {lead.company_title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="space-y-1">
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center text-[11px] font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Numarayı Ara"
                            >
                              <Phone className="h-3 w-3 mr-1 text-emerald-600" />
                              <span>{lead.phone}</span>
                            </a>
                            {waPhone && (
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                  `Merhaba ${
                                    lead.name ? `${lead.name} Bey/Hanım` : ""
                                  }, LookPrice demo ve sektörel paket talebiniz hakkında size ulaşıyoruz.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded text-[9px] font-black border border-emerald-200 dark:border-emerald-800"
                              >
                                <MessageCircle className="h-2.5 w-2.5" />
                                WP
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Telefon belirtilmedi
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <Mail className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-indigo-600"
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center text-[10px] text-slate-400 font-mono">
                          <Calendar className="h-2.5 w-2.5 mr-1 shrink-0" />{" "}
                          {new Date(lead.created_at).toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          lead.status === "new"
                            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            : lead.status === "contacted"
                            ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : lead.status === "demo"
                            ? "bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : lead.status === "sold"
                            ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {lead.status === "new"
                          ? "Yeni"
                          : lead.status === "contacted"
                          ? "Görüşülüyor"
                          : lead.status === "demo"
                          ? "Demo Yapıldı"
                          : lead.status === "sold"
                          ? "Tamamlandı"
                          : "Kaybedildi"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="w-20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            %{lead.probability}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              lead.probability > 70
                                ? "bg-emerald-500"
                                : lead.probability > 40
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${lead.probability}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all cursor-pointer"
                          title={st.manageLead}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

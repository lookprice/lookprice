import React from "react";
import { Search, Filter, TrendingUp, Mail, Phone, ExternalLink, Calendar, Trash2 } from "lucide-react";
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

export const SuperAdminLeads: React.FC<SuperAdminLeadsProps> = ({
  leads,
  leadSearchTerm,
  setLeadSearchTerm,
  leadFilter,
  setLeadFilter,
  st,
  setSelectedLead,
  handleDeleteLead
}) => {
  const filteredLeads = leads.filter(l => {
    const leadSearchTerms = leadSearchTerm.toLowerCase().split(' ').filter(Boolean);
    const matchesSearch = leadSearchTerms.length === 0 || leadSearchTerms.every(term => 
      l.store_name.toLowerCase().includes(term) ||
      l.company_title?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term)
    );
    const matchesFilter = leadFilter === 'all' || l.status === leadFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" /> {st.newLeads}
          </h2>
          <p className="text-xs text-gray-500 font-medium">Satış hunisindeki potansiyel müşteri adayları</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Talep ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
              value={leadSearchTerm}
              onChange={e => setLeadSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="w-full md:w-auto p-2 border border-gray-200 rounded-xl text-sm font-medium"
            value={leadFilter}
            onChange={e => setLeadFilter(e.target.value)}
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
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.customerStore}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.contact}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.status}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{st.probability}</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{st.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                  {st.noLeads}
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {lead.store_name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{lead.store_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{lead.company_title || 'Şahıs/Bireysel'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-600 font-medium">
                        <Mail className="h-3 w-3 mr-1.5 text-gray-400" /> {lead.email}
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400 font-mono">
                        <Calendar className="h-3 w-3 mr-1.5" /> {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      lead.status === 'new' ? 'bg-indigo-50 text-indigo-700' :
                      lead.status === 'contacted' ? 'bg-amber-50 text-amber-700' :
                      lead.status === 'sold' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {lead.status === 'new' ? 'Yeni' :
                       lead.status === 'contacted' ? 'Görüşülüyor' :
                       lead.status === 'demo' ? 'Demo' :
                       lead.status === 'sold' ? 'Tamamlandı' : 'Kaybedildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-400">%{lead.probability}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            lead.probability > 70 ? 'bg-emerald-500' : 
                            lead.probability > 40 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${lead.probability}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title={st.manageLead}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
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

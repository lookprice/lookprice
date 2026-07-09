import React from "react";
import { Search, Filter, Download, Database, Users, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { Store } from "../../types/superadmin";

interface SuperAdminStoresTableProps {
  stores: Store[];
  storeSearchTerm: string;
  setStoreSearchTerm: (term: string) => void;
  storeFilter: 'all' | 'active' | 'expired';
  setStoreFilter: (filter: 'all' | 'active' | 'expired') => void;
  exportStoresToExcel: () => void;
  st: any;
  setSelectedStore: (store: Store) => void;
  setEditingStore: (store: Store) => void;
  setStoreToDelete: (store: Store) => void;
}

export const SuperAdminStoresTable: React.FC<SuperAdminStoresTableProps> = ({
  stores,
  storeSearchTerm,
  setStoreSearchTerm,
  storeFilter,
  setStoreFilter,
  exportStoresToExcel,
  st,
  setSelectedStore,
  setEditingStore,
  setStoreToDelete
}) => {
  const filteredStores = stores.filter(s => {
    const storeSearchTerms = storeSearchTerm.toLowerCase().split(' ').filter(Boolean);
    const matchesSearch = storeSearchTerms.length === 0 || storeSearchTerms.every(term => 
      s.name.toLowerCase().includes(term) ||
      s.slug.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
    const matchesFilter = storeFilter === 'all' || 
      (storeFilter === 'active' && new Date(s.subscription_end) > new Date()) ||
      (storeFilter === 'expired' && new Date(s.subscription_end) <= new Date());
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{st.allStores}</h2>
            <p className="text-xs text-gray-500 font-medium">Sistemdeki tüm kayıtlı mağazaların listesi</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder={st.searchStore}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
              value={storeSearchTerm}
              onChange={e => setStoreSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-bold bg-white text-gray-700"
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value as any)}
          >
            <option value="all">Filtrele: Tümü</option>
            <option value="active">Sadece Aktifler</option>
            <option value="expired">Süresi Dolanlar</option>
          </select>
          <button 
            onClick={exportStoresToExcel}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all bg-white"
          >
            <Download className="h-4 w-4" /> Excel Aktar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">MAĞAZA KİMLİĞİ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">İLETİŞİM & PLAN</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">LİMİTLER</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">BİTİŞ TARİHİ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">DURUM</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">{st.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredStores.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                  Kayıtlı mağaza bulunamadı.
                </td>
              </tr>
            ) : (
              filteredStores.map(store => {
                const isExpired = new Date(store.subscription_end) <= new Date();
                return (
                  <tr key={store.id} className="hover:bg-indigo-50/20 transition-all group border-l-4 border-l-transparent hover:border-l-indigo-600">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {store.logo_url ? (
                          <img 
                            src={store.logo_url} 
                            alt={store.name} 
                            className="h-10 w-10 object-contain rounded-lg border bg-white p-0.5" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                            {store.name.substring(0,2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight flex items-center gap-1.5">
                            {store.name}
                            {store.parent_id && <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">ŞUBE</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">@{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-gray-600 font-bold">
                          {store.admin_email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            store.plan === 'enterprise' ? 'bg-indigo-600 text-white shadow-sm' :
                            store.plan === 'pro' ? 'bg-amber-100 text-amber-700' :
                            store.plan === 'basic' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {store.plan}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users className="h-3 w-3 text-indigo-400" />
                          <span className="font-bold">{store.max_users || 5}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Database className="h-3 w-3 text-indigo-400" />
                          <span className="font-bold">{store.max_products || 100}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-xs font-mono font-bold ${isExpired ? 'text-red-500' : 'text-gray-900'}`}>
                        {new Date(store.subscription_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {isExpired ? (
                          <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest inline-flex items-center w-fit">
                            SÜRESİ DOLMUŞ
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest inline-flex items-center w-fit">
                            AKTİF
                          </span>
                        )}
                        {store.is_approved && (
                          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tight ml-2">
                            ✓ Mağaza Onaylı
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedStore(store)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={st.viewDetails}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setEditingStore(store)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title={st.edit}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setStoreToDelete(store)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title={st.delete}
                        >
                          <Trash2 className="h-4 w-4" />
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

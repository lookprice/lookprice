import React from "react";
import { Search, Filter, Download, Database, Users, ChevronRight, Edit2, Trash2, Building2 } from "lucide-react";
import { Store } from "../../types/superadmin";
import StoreLogo from "../StoreLogo";

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
  onToggleHotel?: (store: Store) => void;
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
  setStoreToDelete,
  onToggleHotel
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
    <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2.5 rounded-2xl shadow-xs">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{st.allStores}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sistemdeki tüm kayıtlı mağazaların listesi</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder={st.searchStore}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20"
              value={storeSearchTerm}
              onChange={e => setStoreSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value as any)}
          >
            <option value="all">Filtrele: Tümü</option>
            <option value="active">Sadece Aktifler</option>
            <option value="expired">Süresi Dolanlar</option>
          </select>
          <button 
            onClick={exportStoresToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-800"
          >
            <Download className="h-4 w-4 text-slate-500" /> Excel Aktar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">MAĞAZA KİMLİĞİ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">İLETİŞİM & PLAN</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">LİMİTLER</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">BİTİŞ TARİHİ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DURUM</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">{st.action}</th>
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
                        <StoreLogo logoUrl={store.logo_url} storeName={store.name} size="sm" />
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            store.plan === 'enterprise' ? 'bg-indigo-600 text-white shadow-sm' :
                            store.plan === 'pro' ? 'bg-amber-100 text-amber-700' :
                            store.plan === 'basic' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {store.plan}
                          </span>
                          {store.store_type === 'cafe_restaurant' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleHotel && onToggleHotel(store);
                              }}
                              className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1 transition-all cursor-pointer border ${
                                store.hotel_module_enabled
                                  ? 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400 font-black shadow-xs'
                                  : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                              }`}
                              title={store.hotel_module_enabled ? "Otel & Oda Konsepti Aktif (Pasife almak için tıklayın)" : "Sadece Restoran/Kafe (Otel modülünü aktif etmek için tıklayın)"}
                            >
                              <span>🏨</span>
                              <span>{store.hotel_module_enabled ? 'Otel Konsepti (Aktif)' : 'Otel Pasif'}</span>
                            </button>
                          )}
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
                        {store.store_type === 'cafe_restaurant' && onToggleHotel && (
                          <button 
                            onClick={() => onToggleHotel(store)}
                            className={`p-2 rounded-lg transition-all ${
                              store.hotel_module_enabled 
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                                : 'text-gray-400 hover:text-amber-600 hover:bg-slate-100'
                            }`}
                            title={store.hotel_module_enabled ? "Otel Konseptini Pasife Al" : "Otel Konseptini Aktif Et"}
                          >
                            <Building2 className="h-4 w-4" />
                          </button>
                        )}
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

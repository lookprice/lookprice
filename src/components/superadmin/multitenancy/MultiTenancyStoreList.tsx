import React from "react";
import { Search, ExternalLink, BookOpen, Hotel, Utensils, Home, Car, Store as StoreIcon } from "lucide-react";
import StoreLogo from "../../StoreLogo";
import { Store } from "../../../types/superadmin";

interface MultiTenancyStoreListProps {
  filteredStores: Store[];
  selectedStoreId: number | null;
  setSelectedStoreId: (id: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  getSectorBadge: (storeType: string, isHotel?: boolean, isBook?: boolean) => React.ReactNode;
}

export const MultiTenancyStoreList: React.FC<MultiTenancyStoreListProps> = ({
  filteredStores,
  selectedStoreId,
  setSelectedStoreId,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  getSectorBadge
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mağaza adı, @slug veya e-posta ara..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Mağaza Listesi ({filteredStores.length})</span>
          <select
            className="bg-transparent border-0 text-slate-600 dark:text-slate-400 font-bold focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Sadece Aktifler</option>
            <option value="expired">Süresi Dolanlar</option>
          </select>
        </div>
      </div>

      {/* Tenant Cards List */}
      <div className="mt-3 space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 no-scrollbar">
        {filteredStores.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            Filtrelere uygun mağaza bulunamadı.
          </div>
        ) : (
          filteredStores.map((store) => {
            const isSelected = store.id === selectedStoreId;
            const isExpired = new Date(store.subscription_end) <= new Date();
            const isHotel = Boolean(store.hotel_module_enabled || (store.branding as any)?.hotel_module_enabled);
            const isBook = Boolean(store.bookstore_module_enabled || (store.branding as any)?.bookstore_module_enabled);

            return (
              <div
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500/80 shadow-sm"
                    : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StoreLogo
                      logoUrl={store.logo_url || (store.branding as any)?.logo_url}
                      storeName={store.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {store.name}
                      </h2>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        @{store.slug}
                      </p>
                    </div>
                  </div>

                  {/* Plan & Status */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        store.plan === "enterprise"
                          ? "bg-purple-600 text-white"
                          : store.plan === "pro"
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {store.plan}
                    </span>
                    {isExpired && (
                      <span className="text-[9px] font-extrabold text-rose-500">
                        Süre Doldu
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>{getSectorBadge(store.store_type || "product", isHotel, isBook)}</div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/magaza/${store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Canlı Vitrini Yeni Sekmede Aç"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

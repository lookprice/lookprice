import React from "react";
import { Search, ExternalLink, BookOpen, Hotel, Utensils, Home, Car, Store as StoreIcon, ShieldCheck, Sparkles, Globe, LayoutDashboard } from "lucide-react";
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
  tenantTypeFilter: "all" | "live" | "demo";
  setTenantTypeFilter: (type: "all" | "live" | "demo") => void;
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
  tenantTypeFilter,
  setTenantTypeFilter,
  getSectorBadge
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs">
      <div className="space-y-3">
        {/* Segmented Switch: Tümü / Canlı Müşteri / Demo Vitrin */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setTenantTypeFilter("all")}
            className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              tenantTypeFilter === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setTenantTypeFilter("live")}
            className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              tenantTypeFilter === "live"
                ? "bg-emerald-600 text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3 w-3" /> Canlı Müşteri
          </button>
          <button
            type="button"
            onClick={() => setTenantTypeFilter("demo")}
            className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              tenantTypeFilter === "demo"
                ? "bg-amber-600 text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3 w-3" /> Demo Vitrin
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mağaza adı, @slug veya domain ara..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Mağazalar ({filteredStores.length})</span>
          <select
            className="bg-transparent border-0 text-slate-600 dark:text-slate-400 font-bold focus:outline-none cursor-pointer text-xs"
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
      <div className="mt-3 space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto pr-1 no-scrollbar">
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
            const isDemoStore = store.slug.toLowerCase().includes("demo") || store.name.toLowerCase().includes("(demo)");

            return (
              <div
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative ${
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {store.name}
                        </h2>
                        {isDemoStore ? (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            DEMO
                          </span>
                        ) : (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            CANLI
                          </span>
                        )}
                      </div>
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

                {/* Meta details footer */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {getSectorBadge(store.store_type || (store.branding as any)?.store_type || (store.branding as any)?.page_layout_settings?.sector, isHotel, isBook)}
                    {(store as any).custom_domain && (
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[120px]">
                        {(store as any).custom_domain}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/s/${store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Web Sitesi / Vitrini Aç"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={`/dashboard/${store.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Mağaza Paneline Git"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
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

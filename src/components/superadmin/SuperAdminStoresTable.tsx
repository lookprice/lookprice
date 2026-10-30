import React, { useState, useMemo } from "react";
import {
  Search,
  Download,
  Building2,
  Mail,
  Phone,
  Globe,
  ChevronRight,
  Edit2,
  Trash2,
  LayoutDashboard,
  Layers,
  Store as StoreIcon,
  FlaskConical,
  GitBranch,
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Store } from "../../types/superadmin";
import { formatDateTR } from "../../utils/formatUtils";
import { isSystemDemoStore } from "./SuperAdminStats";

export type StoreSegmentType = "commercial" | "branches" | "demos" | "all";

interface SuperAdminStoresTableProps {
  stores: Store[];
  storeSearchTerm: string;
  setStoreSearchTerm: (term: string) => void;
  storeFilter: string;
  setStoreFilter: (filter: any) => void;
  exportStoresToExcel: () => void;
  st: any;
  setSelectedStore: (store: Store) => void;
  setEditingStore: (store: Store) => void;
  setStoreToDelete: (store: Store) => void;
  onToggleHotel?: (store: Store) => void;
  onToggleBookstore?: (store: Store) => void;
  onNavigateToMultiTenancy?: (store: Store) => void;
  activeSegment?: StoreSegmentType;
  onSelectSegment?: (segment: StoreSegmentType) => void;
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
  onToggleHotel,
  onToggleBookstore,
  onNavigateToMultiTenancy,
  activeSegment: externalSegment,
  onSelectSegment: externalSetSegment,
}) => {
  const [internalSegment, setInternalSegment] = useState<StoreSegmentType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("superAdminStoreSegment");
      if (saved && ["commercial", "branches", "demos", "all"].includes(saved)) {
        return saved as StoreSegmentType;
      }
    }
    return "commercial";
  });

  const activeSegment = externalSegment || internalSegment;
  const handleSegmentChange = (seg: StoreSegmentType) => {
    setInternalSegment(seg);
    if (typeof window !== "undefined") {
      localStorage.setItem("superAdminStoreSegment", seg);
    }
    externalSetSegment?.(seg);
  };

  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "expiry_asc" | "id_desc">("name");

  // Map parent stores and branch counts
  const { parentMap, branchCountMap } = useMemo(() => {
    const pMap = new Map<number, Store>();
    const bCount = new Map<number, number>();
    stores.forEach((s) => {
      pMap.set(Number(s.id), s);
      if (s.parent_id) {
        const pid = Number(s.parent_id);
        bCount.set(pid, (bCount.get(pid) || 0) + 1);
      }
    });
    return { parentMap: pMap, branchCountMap: bCount };
  }, [stores]);

  // Segment counts
  const segmentCounts = useMemo(() => {
    const commercial = stores.filter((s) => !isSystemDemoStore(s));
    const demos = stores.filter((s) => isSystemDemoStore(s));
    const branches = commercial.filter(
      (s) => Boolean(s.parent_id) || (branchCountMap.get(s.id) || 0) > 0
    );
    return {
      commercial: commercial.length,
      branches: branches.length,
      demos: demos.length,
      all: stores.length,
    };
  }, [stores, branchCountMap]);

  // Base stores for current segment
  const segmentedStores = useMemo(() => {
    if (activeSegment === "commercial") {
      return stores.filter((s) => !isSystemDemoStore(s));
    }
    if (activeSegment === "branches") {
      return stores.filter(
        (s) =>
          !isSystemDemoStore(s) &&
          (Boolean(s.parent_id) || (branchCountMap.get(s.id) || 0) > 0)
      );
    }
    if (activeSegment === "demos") {
      return stores.filter((s) => isSystemDemoStore(s));
    }
    return stores;
  }, [stores, activeSegment, branchCountMap]);

  // Sector counts within the active segment
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: segmentedStores.length,
      product: 0,
      cafe_restaurant: 0,
      real_estate: 0,
      motor_vehicle: 0,
      corporate_website: 0,
    };
    segmentedStores.forEach((s) => {
      const t = s.store_type || "product";
      if (t === "cafe_restaurant") counts.cafe_restaurant++;
      else if (t === "real_estate") counts.real_estate++;
      else if (t === "motor_vehicle") counts.motor_vehicle++;
      else if (t === "corporate_website" || t === "portfolio")
        counts.corporate_website++;
      else counts.product++;
    });
    return counts;
  }, [segmentedStores]);

  const filteredStores = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const searchTerms = storeSearchTerm.toLowerCase().split(" ").filter(Boolean);

    const list = segmentedStores.filter((s) => {
      // Search match
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every(
          (term) =>
            (s.name && s.name.toLowerCase().includes(term)) ||
            (s.slug && s.slug.toLowerCase().includes(term)) ||
            (s.admin_email && s.admin_email.toLowerCase().includes(term)) ||
            (s.phone && s.phone.toLowerCase().includes(term)) ||
            ((s as any).custom_domain &&
              String((s as any).custom_domain).toLowerCase().includes(term))
        );

      if (!matchesSearch) return false;

      // Sector match
      const t = s.store_type || "product";
      if (sectorFilter !== "all") {
        if (sectorFilter === "corporate_website") {
          if (t !== "corporate_website" && t !== "portfolio") return false;
        } else if (sectorFilter === "product") {
          if (
            [
              "cafe_restaurant",
              "real_estate",
              "motor_vehicle",
              "corporate_website",
              "portfolio",
            ].includes(t)
          )
            return false;
        } else if (t !== sectorFilter) {
          return false;
        }
      }

      // Status / Subscription match
      const endDate = s.subscription_end ? new Date(s.subscription_end) : null;
      const isExpired = !endDate || endDate < now;
      const isExpiringSoon =
        endDate && endDate >= now && endDate <= thirtyDaysFromNow;

      if (storeFilter === "active" && isExpired) return false;
      if (storeFilter === "expired" && !isExpired) return false;
      if (storeFilter === "expiring_soon" && !isExpiringSoon) return false;

      return true;
    });

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "expiry_asc") {
        const da = a.subscription_end
          ? new Date(a.subscription_end).getTime()
          : 0;
        const db = b.subscription_end
          ? new Date(b.subscription_end).getTime()
          : 0;
        return da - db;
      }
      if (sortBy === "id_desc") {
        return (b.id || 0) - (a.id || 0);
      }
      // Group branches right under their parent when sorting by name in branches mode
      return (a.name || "").localeCompare(b.name || "", "tr");
    });
  }, [segmentedStores, storeSearchTerm, sectorFilter, storeFilter, sortBy]);

  const getSectorMeta = (store: Store) => {
    const type = store.store_type || "product";
    if (type === "cafe_restaurant") {
      return {
        label: "horecaLP",
        sub: store.hotel_module_enabled ? "Kafe & Otel" : "Kafe & Restoran",
        cls: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70",
        dot: "bg-amber-500",
      };
    }
    if (type === "real_estate") {
      return {
        label: "REstateLP",
        sub: "Gayrimenkul",
        cls: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70",
        dot: "bg-emerald-500",
      };
    }
    if (type === "motor_vehicle") {
      return {
        label: "AutoLP",
        sub: "Otomotiv",
        cls: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/70",
        dot: "bg-blue-500",
      };
    }
    if (type === "corporate_website" || type === "portfolio") {
      return {
        label: "WebLP",
        sub: "Kurumsal Web",
        cls: "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/70",
        dot: "bg-violet-500",
      };
    }
    return {
      label: "shopLP",
      sub: store.bookstore_module_enabled ? "Kitap & Perakende" : "Perakende & E-Mağaza",
      cls: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/70",
      dot: "bg-indigo-500",
    };
  };

  const getDaysRemainingInfo = (subscriptionEnd?: string, isDemo?: boolean) => {
    if (!subscriptionEnd) {
      return {
        days: -999,
        label: "Süre Tanımsız",
        badgeCls:
          "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    }
    const now = new Date();
    const end = new Date(subscriptionEnd);
    const diffDays = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (isDemo && diffDays > 0) {
      return {
        days: diffDays,
        label: `Demo (${diffDays}g)`,
        badgeCls:
          "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      };
    }
    if (diffDays < 0) {
      return {
        days: diffDays,
        label: `${Math.abs(diffDays)}g Geçti`,
        badgeCls:
          "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    }
    if (diffDays <= 30) {
      return {
        days: diffDays,
        label: `${diffDays} Gün Kaldı`,
        badgeCls:
          "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      };
    }
    return {
      days: diffDays,
      label: `${diffDays} Gün Kaldı`,
      badgeCls:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    };
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Cockpit Control Bar: Primary Segment Tabs + Search & Export */}
      <div className="p-3 sm:p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Segment Switcher (Ticari vs Şube vs Demo) */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSegmentChange("commercial")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeSegment === "commercial"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <StoreIcon className="h-3.5 w-3.5" />
              <span>Ticari Müşteriler</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  activeSegment === "commercial"
                    ? "bg-white/20 text-white"
                    : "bg-slate-300/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {segmentCounts.commercial}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentChange("branches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeSegment === "branches"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Şubeli Yapılar</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  activeSegment === "branches"
                    ? "bg-white/20 text-white"
                    : "bg-slate-300/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {segmentCounts.branches}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentChange("demos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeSegment === "demos"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Sistem & Sektör Demoları</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  activeSegment === "demos"
                    ? "bg-white/20 text-white"
                    : "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                }`}
              >
                {segmentCounts.demos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentChange("all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                activeSegment === "all"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Tümü ({segmentCounts.all})</span>
            </button>
          </div>

          {/* Right Controls: Search + Subscription Filter + Sort + Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Firma, @slug, domain, e-posta..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                value={storeSearchTerm}
                onChange={(e) => setStoreSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              title="Abonelik & Hesap Durumu"
            >
              <option value="all">Durum: Tümü</option>
              <option value="active">✅ Aktif Abonelik</option>
              <option value="expiring_soon">⏳ Yaklaşan (&lt;30 Gün)</option>
              <option value="expired">🚨 Süresi Dolmuş</option>
            </select>

            <select
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              title="Sıralama Ölçütü"
            >
              <option value="name">Sırala: Firma Adı (A-Z)</option>
              <option value="expiry_asc">Sırala: Kalan Süre (Azalan)</option>
              <option value="id_desc">Sırala: Son Eklenenler</option>
            </select>

            <button
              type="button"
              onClick={exportStoresToExcel}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Mevcut Mağaza Listesini Excel Olarak İndir"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Sector Quick-Filter Pills + Result Count */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: "all", label: "Tüm Sektörler", count: sectorCounts.all },
              {
                id: "product",
                label: "🛍️ shopLP (Perakende)",
                count: sectorCounts.product,
              },
              {
                id: "cafe_restaurant",
                label: "☕ horecaLP (Kafe/Otel)",
                count: sectorCounts.cafe_restaurant,
              },
              {
                id: "real_estate",
                label: "🏠 REstateLP (Emlak)",
                count: sectorCounts.real_estate,
              },
              {
                id: "motor_vehicle",
                label: "🚗 AutoLP (Otomotiv)",
                count: sectorCounts.motor_vehicle,
              },
              {
                id: "corporate_website",
                label: "🌐 WebLP (Kurumsal)",
                count: sectorCounts.corporate_website,
              },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSectorFilter(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  sectorFilter === sec.id
                    ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                    : "bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/70 hover:border-slate-300"
                }`}
              >
                <span>{sec.label}</span>
                <span className="text-[10px] font-extrabold opacity-75">
                  ({sec.count})
                </span>
              </button>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Gösterilen:{" "}
            <span className="text-slate-900 dark:text-white font-black">
              {filteredStores.length}
            </span>{" "}
            kayıt
          </div>
        </div>
      </div>

      {/* Viewport-Contained High-Density Cockpit Table */}
      <div className="overflow-x-auto max-h-[calc(100vh-285px)] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Firma & Domain Kimliği
              </th>
              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sektör & Modüller
              </th>
              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Yönetici & İletişim
              </th>
              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Plan, Döviz & Kota
              </th>
              <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Muhasebe & Süre
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Kokpit Erişimi & Yönetim
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filteredStores.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-semibold"
                >
                  Seçili filtre kriterlerine uygun firma veya mağaza kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              filteredStores.map((store) => {
                const isDemo = isSystemDemoStore(store);
                const sector = getSectorMeta(store);
                const subInfo = getDaysRemainingInfo(
                  store.subscription_end,
                  isDemo
                );
                const parentStore = store.parent_id
                  ? parentMap.get(Number(store.parent_id))
                  : null;
                const childCount = branchCountMap.get(store.id) || 0;
                const customDomain = (store as any).custom_domain;
                const isRetailStore = ![
                  "cafe_restaurant",
                  "real_estate",
                  "motor_vehicle",
                  "corporate_website",
                  "portfolio",
                ].includes(store.store_type || "product");

                const rawPhone = store.phone
                  ? store.phone.replace(/[^0-9]/g, "")
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
                    key={store.id}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* 1. Firma & Domain Kimliği */}
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-[11px] text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
                          {store.logo_url ? (
                            <img
                              src={store.logo_url}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            (store.name || "LP").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {store.name}
                            </span>
                            {isDemo ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                DEMO
                              </span>
                            ) : parentStore ? (
                              <span
                                className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                title={`Ana Mağaza: ${parentStore.name}`}
                              >
                                ↳ Şube ({parentStore.name})
                              </span>
                            ) : childCount > 0 ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                ANA MERKEZ ({childCount} Şube)
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              @{store.slug}
                            </span>
                            {customDomain && (
                              <a
                                href={`https://${customDomain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold hover:underline"
                              >
                                <Globe className="h-2.5 w-2.5" />
                                {customDomain}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Sektör & Modüller */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${sector.cls}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${sector.dot}`}
                            />
                            {sector.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {sector.sub}
                          </span>
                        </div>

                        {/* Interactive Concept Toggles right inside the cell */}
                        <div className="flex items-center gap-1">
                          {store.store_type === "cafe_restaurant" &&
                            onToggleHotel && (
                              <button
                                type="button"
                                onClick={() => onToggleHotel(store)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                                  store.hotel_module_enabled
                                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                                }`}
                                title={
                                  store.hotel_module_enabled
                                    ? "Otel Konsepti Aktif (Kapatmak için tıklayın)"
                                    : "Otel Konseptini Aktif Et"
                                }
                              >
                                <Building2 className="h-2.5 w-2.5" />
                                Otel: {store.hotel_module_enabled ? "AÇIK" : "KAPALI"}
                              </button>
                            )}
                          {isRetailStore && onToggleBookstore && (
                            <button
                              type="button"
                              onClick={() => onToggleBookstore(store)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                                store.bookstore_module_enabled
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-400"
                              }`}
                              title={
                                store.bookstore_module_enabled
                                  ? "Kitap Konsepti Aktif (Kapatmak için tıklayın)"
                                  : "Kitap Konseptini Aktif Et"
                              }
                            >
                              <span>📚</span>
                              Kitap:{" "}
                              {store.bookstore_module_enabled ? "AÇIK" : "KAPALI"}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Yönetici & İletişim */}
                    <td className="px-3 py-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-200 font-medium truncate max-w-[190px]">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{store.admin_email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            <Phone className="h-2.5 w-2.5 mr-1 text-slate-400" />
                            {store.phone || "—"}
                          </span>
                          {waPhone && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-black hover:bg-emerald-100"
                              title="WhatsApp ile İletişime Geç"
                            >
                              WP
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. Plan, Döviz & Kota */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              store.plan === "enterprise"
                                ? "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                                : store.plan === "pro"
                                ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                                : store.plan === "basic"
                                ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {store.plan || "FREE"}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {store.default_currency || "TRY"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Kota:{" "}
                          <b className="text-slate-700 dark:text-slate-200">
                            {store.max_users || 5}
                          </b>{" "}
                          Kul. /{" "}
                          <b className="text-slate-700 dark:text-slate-200">
                            {store.max_products || 100}
                          </b>{" "}
                          Kayıt
                        </div>
                      </div>
                    </td>

                    {/* 5. Muhasebe & Süre */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border w-fit ${subInfo.badgeCls}`}
                        >
                          {subInfo.days < 0 ? (
                            <AlertTriangle className="h-2.5 w-2.5" />
                          ) : subInfo.days <= 30 ? (
                            <Clock className="h-2.5 w-2.5" />
                          ) : (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          )}
                          {subInfo.label}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                          Bitiş: {formatDateTR(store.subscription_end)}
                        </span>
                      </div>
                    </td>

                    {/* 6. Kokpit Erişimi & Yönetim */}
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/dashboard/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-extrabold transition-all inline-flex items-center gap-1"
                          title="Mağaza Yönetim Panelini Aç"
                        >
                          <LayoutDashboard className="h-3 w-3" />
                          <span>Panel</span>
                        </a>

                        <a
                          href={`/s/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-extrabold transition-all inline-flex items-center gap-1"
                          title="Müşteri Web Sitesini / Vitrini Aç"
                        >
                          <Globe className="h-3 w-3" />
                          <span>Vitrin</span>
                        </a>

                        {onNavigateToMultiTenancy && (
                          <button
                            type="button"
                            onClick={() => onNavigateToMultiTenancy(store)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Şube & Multi-Tenancy Yapılandırması"
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          title={st.viewDetails || "Detaylar"}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingStore(store)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-all cursor-pointer"
                          title="Hesap, Kota & Abonelik Düzenle"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setStoreToDelete(store)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                          title={st.delete || "Mağazayı Sil"}
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

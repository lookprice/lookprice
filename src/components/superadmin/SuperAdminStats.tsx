import React, { useState, useMemo } from "react";
import {
  Store as StoreIcon,
  Activity,
  Scan,
  Database,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Link2,
  Copy,
  Check,
  Archive,
  Building2,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Inbox,
  Clock
} from "lucide-react";
import { Store } from "../../types/superadmin";

export const isSystemDemoStore = (store: Partial<Store>): boolean => {
  const slug = (store.slug || "").toLowerCase();
  const name = (store.name || "").toLowerCase();
  if (
    slug.endsWith("-demo") ||
    slug.includes("-demo-") ||
    slug.startsWith("demo-") ||
    slug === "akdeniz-hukuk" ||
    name.includes("(demo)") ||
    name.includes("demo mağaza") ||
    name.includes("demo vitrin")
  ) {
    return true;
  }
  return false;
};

interface SuperAdminStatsProps {
  stats: {
    totalStores: number;
    activeStores: number;
    totalScans: number;
    scansLast24h: number;
  };
  stores?: Store[];
  leadsCount?: number;
  pendingRegistrationsCount?: number;
  onOpenRequestsTab?: () => void;
  activeSegment?: string;
  onSelectSegment?: (segment: "commercial" | "branches" | "demos" | "all") => void;
  supabaseStatus?: {
    overallStatus: "healthy" | "warning" | "restricted";
    database: {
      sizeMB: number;
      limitMB: number;
      percentage: number;
    };
    storage: {
      status: string;
      fileCount: number;
      sizeMB: number;
      limitMB: number;
      percentage: number;
      errorMessage: string | null;
    };
    proxyMode: {
      active: boolean;
      description: string;
    };
    checkedAt: string;
  };
  checkingSupabase?: boolean;
  onRefreshSupabaseStatus?: () => void;
  drive5TBStatus?: {
    connected: boolean;
    email?: string | null;
    quota?: {
      limitTB: string;
      usageGB: string;
    } | null;
    redirectUri?: string;
    lastBackupAt?: string | null;
    lastBackupFileName?: string | null;
    lastBackupWebViewLink?: string | null;
    lastArchiveAt?: string | null;
    lastArchivedMediaCount?: number;
    lastArchivedInvoicesCount?: number;
    lastFreedKB?: number;
  };
  backingUpDrive5TB?: boolean;
  archivingDrive5TB?: boolean;
  onConnectDrive5TB?: () => void;
  onTriggerDrive5TBBackup?: () => void;
  onTriggerDrive5TBArchive?: () => void;
  st: any;
}

export const SuperAdminStats: React.FC<SuperAdminStatsProps> = ({
  stats,
  stores = [],
  leadsCount = 0,
  pendingRegistrationsCount = 0,
  onOpenRequestsTab,
  activeSegment,
  onSelectSegment,
  supabaseStatus,
  checkingSupabase,
  onRefreshSupabaseStatus,
  drive5TBStatus,
  backingUpDrive5TB,
  archivingDrive5TB,
  onConnectDrive5TB,
  onTriggerDrive5TBBackup,
  onTriggerDrive5TBArchive,
}) => {
  const [copiedUri, setCopiedUri] = useState(false);
  const [showInfraDrawer, setShowInfraDrawer] = useState(false);

  const computed = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const demoStores = stores.filter((s) => isSystemDemoStore(s));
    const commercialStores = stores.filter((s) => !isSystemDemoStore(s));
    const commercialMainStores = commercialStores.filter((s) => !s.parent_id);
    const commercialBranches = commercialStores.filter((s) => Boolean(s.parent_id));

    const activeCommercial = commercialStores.filter(
      (s) => s.subscription_end && new Date(s.subscription_end) >= now
    );
    const expiringSoonCommercial = commercialStores.filter((s) => {
      if (!s.subscription_end) return false;
      const end = new Date(s.subscription_end);
      return end >= now && end <= thirtyDaysFromNow;
    });
    const expiredCommercial = commercialStores.filter(
      (s) => !s.subscription_end || new Date(s.subscription_end) < now
    );

    return {
      totalCommercial: commercialStores.length,
      commercialMainCount: commercialMainStores.length,
      commercialBranchCount: commercialBranches.length,
      demoCount: demoStores.length,
      activeCommercialCount: activeCommercial.length,
      expiringSoonCount: expiringSoonCommercial.length,
      expiredCommercialCount: expiredCommercial.length,
    };
  }, [stores]);

  const fallbackRedirectUri =
    drive5TBStatus?.redirectUri ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/api/superadmin/drive-5tb/callback`
      : "https://lookprice.net/api/superadmin/drive-5tb/callback");

  const handleCopyUri = () => {
    navigator.clipboard.writeText(fallbackRedirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2500);
  };

  const dbPercentage = supabaseStatus?.database?.percentage ?? 0;
  const totalRequests = leadsCount + pendingRegistrationsCount;

  return (
    <div className="space-y-2.5 mb-3">
      {/* High-Density 6-Card Cockpit Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Ticari Müşteriler (Aktif Firmalar) */}
        <button
          type="button"
          onClick={() => onSelectSegment?.("commercial")}
          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
            activeSegment === "commercial"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-950/90 dark:border-indigo-500/60 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider ${
                activeSegment === "commercial"
                  ? "text-indigo-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Ticari Firmalar
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                activeSegment === "commercial"
                  ? "bg-white/10 text-indigo-300"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              <StoreIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-xl font-black tracking-tight ${
                activeSegment === "commercial"
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {stores.length > 0 ? computed.totalCommercial : stats.totalStores}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                activeSegment === "commercial"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {computed.activeCommercialCount} Aktif
            </span>
          </div>
        </button>

        {/* 2. Çok Şubeli Yapılar */}
        <button
          type="button"
          onClick={() => onSelectSegment?.("branches")}
          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
            activeSegment === "branches"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-950/90 dark:border-indigo-500/60 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider ${
                activeSegment === "branches"
                  ? "text-amber-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Şubeli Yapılar
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                activeSegment === "branches"
                  ? "bg-white/10 text-amber-300"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-xl font-black tracking-tight ${
                activeSegment === "branches"
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {computed.commercialBranchCount}
            </span>
            <span
              className={`text-[10px] font-semibold ${
                activeSegment === "branches"
                  ? "text-slate-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {computed.commercialMainCount} Ana Merkez
            </span>
          </div>
        </button>

        {/* 3. Sistem & Sektör Demoları */}
        <button
          type="button"
          onClick={() => onSelectSegment?.("demos")}
          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
            activeSegment === "demos"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-indigo-950/90 dark:border-indigo-500/60 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider ${
                activeSegment === "demos"
                  ? "text-purple-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Demo Vitrinler
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                activeSegment === "demos"
                  ? "bg-white/10 text-purple-300"
                  : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-xl font-black tracking-tight ${
                activeSegment === "demos"
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {computed.demoCount}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                activeSegment === "demos"
                  ? "bg-purple-500/20 text-purple-200"
                  : "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
              }`}
            >
              İzole Vitrin
            </span>
          </div>
        </button>

        {/* 4. Muhasebe & Süre Radarı */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hesap & Süre Radarı
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {computed.expiringSoonCount}
              </span>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                &lt;30 Gün
              </span>
            </div>
            {computed.expiredCommercialCount > 0 ? (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                {computed.expiredCommercialCount} Süresi Doldu
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Tümü Güncel
              </span>
            )}
          </div>
        </div>

        {/* 5. Canlı Trafik & Talepler */}
        <button
          type="button"
          onClick={onOpenRequestsTab}
          className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Talepler & QR Trafik
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Inbox className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {totalRequests}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Talep/Başvuru
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              {stats.scansLast24h || 0} QR/24s
            </span>
          </div>
        </button>

        {/* 6. Bulut & 5TB Yedekleme Sağlığı (Toggle Drawer) */}
        <button
          type="button"
          onClick={() => setShowInfraDrawer((prev) => !prev)}
          className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
            showInfraDrawer
              ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-700 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/60"
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                showInfraDrawer
                  ? "text-emerald-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              Bulut & 5TB Drive
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  supabaseStatus?.overallStatus === "restricted"
                    ? "bg-rose-500 animate-ping"
                    : "bg-emerald-500"
                }`}
              />
              {showInfraDrawer ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-300" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span
              className={`text-sm font-black tracking-tight ${
                showInfraDrawer
                  ? "text-white"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              DB %{dbPercentage}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                drive5TBStatus?.connected
                  ? showInfraDrawer
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
              }`}
            >
              {drive5TBStatus?.connected ? "5TB Aktif" : "Detay ▾"}
            </span>
          </div>
        </button>
      </div>

      {/* Collapsible Cloud & 5TB Google Drive Infrastructure Drawer */}
      {showInfraDrawer && supabaseStatus && (
        <div
          className={`p-4 rounded-xl border transition-all shadow-sm ${
            supabaseStatus.overallStatus === "restricted"
              ? "bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-800"
              : supabaseStatus.overallStatus === "warning"
              ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  supabaseStatus.overallStatus === "restricted"
                    ? "bg-red-100 text-red-700"
                    : supabaseStatus.overallStatus === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {supabaseStatus.overallStatus === "restricted" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Supabase & 5TB Google Drive Altyapı Kontrol Merkezi
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                    {supabaseStatus.overallStatus === "restricted"
                      ? "Kısıtlama Uyarısı"
                      : "Tüm Servisler Aktif"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {supabaseStatus.proxyMode.description}
                </p>
              </div>
            </div>

            {onRefreshSupabaseStatus && (
              <button
                onClick={onRefreshSupabaseStatus}
                disabled={checkingSupabase}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${checkingSupabase ? "animate-spin" : ""}`}
                />
                {checkingSupabase ? "Kontrol Ediliyor..." : "Durumu Yenile"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* PostgreSQL DB Size */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <Database className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />{" "}
                  PostgreSQL Boyutu
                </span>
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                  {supabaseStatus.database.sizeMB} / {supabaseStatus.database.limitMB} MB
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${
                    supabaseStatus.database.percentage > 80
                      ? "bg-red-500"
                      : supabaseStatus.database.percentage > 60
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, supabaseStatus.database.percentage)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Doluluk: %{supabaseStatus.database.percentage}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Güvenli
                </span>
              </div>
            </div>

            {/* Supabase Storage */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />{" "}
                  Medya & Storage
                </span>
                <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                  {supabaseStatus.storage.sizeMB} / {supabaseStatus.storage.limitMB} MB
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, supabaseStatus.storage.percentage)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>{supabaseStatus.storage.fileCount} dosya</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Egress Koruma
                </span>
              </div>
            </div>

            {/* 5TB Google Drive */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CloudUpload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                    5TB Google Drive Yedekleme & Soğuk Arşiv
                  </span>
                  {drive5TBStatus?.email && (
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                      {drive5TBStatus.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyUri}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title={fallbackRedirectUri}
                  >
                    {copiedUri ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" /> URI Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> OAuth URI
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {drive5TBStatus?.quota ? (
                    <span>
                      Kullanılan: <b>{drive5TBStatus.quota.usageGB} GB</b> /{" "}
                      {drive5TBStatus.quota.limitTB} TB
                    </span>
                  ) : (
                    <span>Otomatik JSON Snapshot & Soğuk Medya Arşivi</span>
                  )}
                  {drive5TBStatus?.lastBackupAt && (
                    <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      • Son Yedek:{" "}
                      {new Date(drive5TBStatus.lastBackupAt).toLocaleString("tr-TR")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {drive5TBStatus?.connected && onTriggerDrive5TBBackup && (
                    <button
                      onClick={onTriggerDrive5TBBackup}
                      disabled={backingUpDrive5TB}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <CloudUpload
                        className={`h-3 w-3 ${backingUpDrive5TB ? "animate-bounce" : ""}`}
                      />
                      {backingUpDrive5TB ? "Yedekleniyor..." : "Şimdi Yedekle"}
                    </button>
                  )}
                  {drive5TBStatus?.connected && onTriggerDrive5TBArchive && (
                    <button
                      onClick={onTriggerDrive5TBArchive}
                      disabled={archivingDrive5TB}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Archive
                        className={`h-3 w-3 ${archivingDrive5TB ? "animate-spin" : ""}`}
                      />
                      {archivingDrive5TB ? "Arşivleniyor..." : "Soğuk Arşivle"}
                    </button>
                  )}
                  {onConnectDrive5TB && (
                    <button
                      onClick={onConnectDrive5TB}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    >
                      <Link2 className="h-3 w-3" />
                      {drive5TBStatus?.connected ? "Hesap Değiştir" : "5TB Drive Bağla"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { Store, Activity, Scan, Users, Database, HardDrive, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, CloudUpload, Link2, Copy, Check, Archive } from "lucide-react";

interface SuperAdminStatsProps {
  stats: {
    totalStores: number;
    activeStores: number;
    totalScans: number;
    scansLast24h: number;
  };
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
  supabaseStatus,
  checkingSupabase,
  onRefreshSupabaseStatus,
  drive5TBStatus,
  backingUpDrive5TB,
  archivingDrive5TB,
  onConnectDrive5TB,
  onTriggerDrive5TBBackup,
  onTriggerDrive5TBArchive,
  st
}) => {
  const [copiedUri, setCopiedUri] = useState(false);
  const expectedRedirectUri =
    drive5TBStatus?.redirectUri ||
    (typeof window !== "undefined" ? `${window.location.origin}/api/google-drive/callback` : "https://enrakipsiz.com/api/google-drive/callback");

  const handleCopyRedirectUri = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(expectedRedirectUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    }
  };
  return (
    <div className="space-y-6 mb-8">
      {/* 4 Main Stat Cards - Apple/Mercedes Glassmorphic Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl group-hover:scale-105 transition-transform">
              <Store className="h-5 w-5 text-slate-900 dark:text-white" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-800/60">
              SİSTEM GENELİ
            </span>
          </div>
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{st.totalStores}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{stats.totalStores}</p>
            <span className="text-xs font-semibold text-slate-400">MAĞAZA</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800/60">
              YAYINDA
            </span>
          </div>
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{st.activeStores}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{stats.activeStores}</p>
            <span className="text-xs font-semibold text-slate-400">AKTİF</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl group-hover:scale-105 transition-transform">
              <Scan className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-200/60 dark:border-amber-800/60">
              ETKİLEŞİM
            </span>
          </div>
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOPLAM QR TARAMA</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{stats.totalScans}</p>
            <span className="text-xs font-semibold text-slate-400">TARAMA</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-200/60 dark:border-rose-800/60">
              SON 24 SAAT
            </span>
          </div>
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">CANLI TRAFİK</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{stats.scansLast24h}</p>
            <span className="text-xs font-semibold text-slate-400">TARAMA</span>
          </div>
        </div>
      </div>

      {/* Supabase & Database Quota & Health Monitor */}
      {supabaseStatus && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Supabase & 5 TB Google Drive Bulut Kota Monitörü</h3>
                  {supabaseStatus.overallStatus === "healthy" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      SAĞLIKLI
                    </span>
                  )}
                  {supabaseStatus.overallStatus === "warning" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      KOTA UYARISI
                    </span>
                  )}
                  {supabaseStatus.overallStatus === "restricted" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      KISITLANDI
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anlık veritabanı boyutu, dosya depolama kullanımı, sıfır egress kalkanı ve 5 TB Google Drive yedekleme kasası
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {supabaseStatus.checkedAt && (
                <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                  Son kontrol: {new Date(supabaseStatus.checkedAt).toLocaleTimeString("tr-TR")}
                </span>
              )}
              <button
                onClick={onRefreshSupabaseStatus}
                disabled={checkingSupabase}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${checkingSupabase ? "animate-spin text-indigo-400" : ""}`} />
                {checkingSupabase ? "Kontrol..." : "Yenile"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
            {/* Database Storage Card */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  PostgreSQL Veritabanı
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  %{supabaseStatus.database.percentage}
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-extrabold text-white">
                  {supabaseStatus.database.sizeMB} <span className="text-xs font-medium text-slate-400">MB</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Limit: {supabaseStatus.database.limitMB} MB
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    supabaseStatus.database.percentage > 80 ? "bg-rose-500" : supabaseStatus.database.percentage > 50 ? "bg-amber-400" : "bg-indigo-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, supabaseStatus.database.percentage))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Ücretsiz planda 500 MB limit bulunmaktadır. Veritabanınız güvendedir.
              </p>
            </div>

            {/* Supabase Storage Bucket Card */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-emerald-400" />
                  Depolama (lookdocu)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  %{supabaseStatus.storage.percentage}
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-extrabold text-white">
                  {supabaseStatus.storage.sizeMB} <span className="text-xs font-medium text-slate-400">MB</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {supabaseStatus.storage.fileCount} Görsel
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    supabaseStatus.storage.percentage > 80 ? "bg-rose-500" : supabaseStatus.storage.percentage > 50 ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, supabaseStatus.storage.percentage))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {supabaseStatus.storage.status === "active" ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 inline" /> Depolama servisi erişilebilir.
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">
                    {supabaseStatus.storage.errorMessage || "Depolama servisinde uyarı mevcut."}
                  </span>
                )}
              </p>
            </div>

            {/* Egress / CDN Proxy Shield Card */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Sıfır Egress Kalkanı
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  KORUMA AKTİF
                </span>
              </div>
              <p className="text-xs font-extrabold text-white mb-1">
                RAM & Yerel Disk Proxy
              </p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Tüm görsel ve API istekleri sunucu RAM önbelleği (<code className="text-cyan-300 font-mono bg-slate-900 px-1 py-0.5 rounded">/api/storage/*</code>) üzerinden sunularak Supabase Egress kotasını korur.
              </p>
            </div>

            {/* 5 TB Google Drive Cloud Vault Card */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-amber-500/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <CloudUpload className="h-4 w-4 text-amber-400" />
                    5 TB Google Drive Kasa
                  </span>
                  {drive5TBStatus?.connected ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      BAĞLI
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HAZIR
                    </span>
                  )}
                </div>

                {drive5TBStatus?.connected ? (
                  <div className="space-y-1 mb-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-white">
                        {drive5TBStatus.quota?.usageGB || "0.0"} <span className="text-xs font-medium text-slate-400">GB</span>
                      </span>
                      <span className="text-[11px] text-amber-300 font-semibold">
                        Kapasite: {drive5TBStatus.quota?.limitTB || "5.00"} TB
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      Hesap: <span className="text-white font-semibold">{drive5TBStatus.email || "lookprice.me@gmail.com"}</span>
                    </p>
                    {drive5TBStatus.lastBackupAt && (
                      <p className="text-[10px] text-emerald-400 truncate">
                        Son Yedek: {new Date(drive5TBStatus.lastBackupAt).toLocaleString("tr-TR")}
                      </p>
                    )}
                    {drive5TBStatus.lastArchiveAt && (
                      <p className="text-[10px] text-cyan-300 truncate">
                        Arşiv: {drive5TBStatus.lastArchivedInvoicesCount || 0} Fatura • {drive5TBStatus.lastArchivedMediaCount || 0} Medya
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-2.5 space-y-1.5">
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Google AI Pro <strong className="text-white">5 TB Drive</strong> hesabınızı bağlayarak tüm mağaza, ürün ve fatura veritabanını tek tıkla yedekleyin.
                    </p>
                    <div className="flex items-center justify-between gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1">
                      <span className="text-[10px] font-mono text-amber-300 truncate" title={expectedRedirectUri}>
                        {expectedRedirectUri}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRedirectUri}
                        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 border border-slate-600 transition-colors"
                        title="Google Cloud Console Redirect URI Kopyala"
                      >
                        {copiedUri ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-amber-400" />}
                        {copiedUri ? "Kopyalandı" : "URI"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onConnectDrive5TB}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition-all border border-slate-600"
                  >
                    <Link2 className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="truncate">{drive5TBStatus?.connected ? "Hesap" : "5 TB Drive Bağla"}</span>
                  </button>
                  {drive5TBStatus?.connected && (
                    <button
                      type="button"
                      onClick={onTriggerDrive5TBBackup}
                      disabled={backingUpDrive5TB || archivingDrive5TB}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition-all disabled:opacity-50"
                    >
                      <CloudUpload className={`h-3 w-3 shrink-0 ${backingUpDrive5TB ? "animate-bounce" : ""}`} />
                      <span className="truncate">{backingUpDrive5TB ? "Yedek..." : "Şimdi Yedekle"}</span>
                    </button>
                  )}
                </div>
                {drive5TBStatus?.connected && onTriggerDrive5TBArchive && (
                  <button
                    type="button"
                    onClick={onTriggerDrive5TBArchive}
                    disabled={archivingDrive5TB || backingUpDrive5TB}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-extrabold transition-all disabled:opacity-50"
                  >
                    <Archive className={`h-3.5 w-3.5 text-cyan-400 ${archivingDrive5TB ? "animate-spin" : ""}`} />
                    {archivingDrive5TB ? "Fatura & Medya Arşivleniyor..." : "Fatura Arşivle & DB Hafiflet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


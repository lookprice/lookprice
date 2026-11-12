import React, { useState, useEffect } from "react";
import {
  Cloud,
  CheckCircle2,
  XCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Clock,
  ShieldCheck,
  FolderSync,
  Save,
  HardDrive
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

interface SettingsIntegrationsTabProps {
  t: any;
  isTr: boolean;
}

export const SettingsIntegrationsTab: React.FC<SettingsIntegrationsTabProps> = ({ t, isTr }) => {
  const [driveConnected, setDriveConnected] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [storeType, setStoreType] = useState<string>("general");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const [driveConfig, setDriveConfig] = useState({
    drive_email: "",
    drive_folder_url: "",
    cron_enabled: true,
    cron_schedule: "daily_0300",
    last_cron_backup_at: "",
    backup_history: [] as any[]
  });

  useEffect(() => {
    fetchDriveStatus();
  }, []);

  const fetchDriveStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/google-drive/settings");
      if (res && !res.error) {
        setDriveConnected(Boolean(res.connected));
        setOauthConnected(Boolean(res.oauth_connected));
        setStoreType(res.store_type || "general");
        setDriveConfig({
          drive_email: res.drive_email || "",
          drive_folder_url: res.drive_folder_url || "",
          cron_enabled: res.cron_enabled !== undefined ? Boolean(res.cron_enabled) : true,
          cron_schedule: res.cron_schedule || "daily_0300",
          last_cron_backup_at: res.last_cron_backup_at || "",
          backup_history: Array.isArray(res.backup_history) ? res.backup_history : []
        });
      }
    } catch (err) {
      console.error("Failed to fetch Google Drive status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.post("/api/google-drive/settings", {
        drive_email: driveConfig.drive_email,
        drive_folder_url: driveConfig.drive_folder_url,
        cron_enabled: driveConfig.cron_enabled,
        cron_schedule: driveConfig.cron_schedule
      });
      if (res && res.success) {
        setDriveConnected(true);
        toast.success(
          isTr
            ? "Google Drive hesabı ve otomatik Cron yedekleme ayarları kaydedildi."
            : "Google Drive account and Cron backup settings saved."
        );
        await fetchDriveStatus();
      } else {
        toast.error(res?.error || (isTr ? "Ayarlar kaydedilemedi." : "Failed to save settings."));
      }
    } catch {
      toast.error(isTr ? "Ayarlar kaydedilirken hata oluştu." : "Error saving settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRunCronNow = async () => {
    try {
      setRunningCron(true);
      const res = await api.post("/api/google-drive/run-cron-now", {});
      if (res && res.success) {
        toast.success(
          isTr
            ? "Cron yedekleme ve sıfır-egress medya arşivleme işlemi tamamlandı."
            : "Cron backup and zero-egress media archiving completed."
        );
        await fetchDriveStatus();
      } else {
        toast.error(res?.error || (isTr ? "Cron yedekleme hatası." : "Cron backup failed."));
      }
    } catch {
      toast.error(isTr ? "Yedekleme tetiklenemedi." : "Failed to trigger backup.");
    } finally {
      setRunningCron(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const res = await api.get("/api/google-drive/auth-url");
      if (res && res.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          res.url,
          "Google Drive Auth",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        const checkWindowClosed = setInterval(() => {
          if (authWindow && authWindow.closed) {
            clearInterval(checkWindowClosed);
            fetchDriveStatus();
          }
        }, 1000);
      } else {
        toast.error(res?.error || (isTr ? "Bağlantı URL'si alınamadı." : "Failed to get auth URL."));
      }
    } catch {
      toast.error(isTr ? "Bir hata oluştu." : "An error occurred.");
    }
  };

  const handleDisconnectDrive = async () => {
    if (
      !window.confirm(
        isTr
          ? "Google Drive bağlantısını kesmek istediğinize emin misiniz?"
          : "Are you sure you want to disconnect Google Drive?"
      )
    )
      return;

    try {
      setLoading(true);
      const res = await api.post("/api/google-drive/disconnect", {});
      if (res && res.success) {
        setDriveConnected(false);
        setOauthConnected(false);
        toast.success(isTr ? "Google Drive bağlantısı kesildi." : "Google Drive disconnected.");
      } else {
        toast.error(res?.error || (isTr ? "İşlem başarısız." : "Operation failed."));
      }
    } catch {
      toast.error(isTr ? "Bir hata oluştu." : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "xls" | "pdf", targetType: "products" | "real_estate" | "developer_projects") => {
    const key = `${targetType}_${format}`;
    try {
      setExportingType(key);
      const res = await api.post("/api/google-drive/export", { format, targetType });
      if (res && res.success) {
        toast.success(res.message || (isTr ? "Yedekleme başarılı!" : "Backup successful!"));
        await fetchDriveStatus();
      } else {
        toast.error(res?.error || (isTr ? "Yedekleme başarısız." : "Backup failed."));
      }
    } catch {
      toast.error(isTr ? "Yedekleme sırasında hata oluştu." : "Error during backup.");
    } finally {
      setExportingType(null);
    }
  };

  const isDevProject = storeType === "developer_project";

  return (
    <div className="space-y-4">
      {/* MAIN GOOGLE DRIVE & CRON BACKUP SYSTEM CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isTr ? "Google Drive Yedekleme Sistemi (Otomatik Cron)" : "Google Drive Backup System (Automated Cron)"}
                </h3>
                {driveConfig.cron_enabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    <Clock className="w-3 h-3" />
                    <span>{isTr ? "Cron Yedekleme Aktif" : "Cron Backup Active"}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isTr
                  ? "Projeleriniz, medya dosyalarınız, fiyat listeleriniz ve veritabanı kayıtlarınız belirlediğiniz Google Drive hesabına arka planda Cron ile otomatik yedeklenir."
                  : "Your projects, media files, price lists and database records are automatically backed up via scheduled Cron to your configured Google Drive account."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isTr ? "Kontrol ediliyor..." : "Checking..."}</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{oauthConnected ? (isTr ? "OAuth Hesabını Yenile" : "Refresh OAuth") : (isTr ? "Google OAuth ile Bağla" : "Connect via Google OAuth")}</span>
                </button>
                {driveConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectDrive}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isTr ? "Bağlantıyı Kes" : "Disconnect"}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* SUPABASE ZERO-EGRESS & HIGH-DATA-TRANSFER PROTECTION POLICY BANNER */}
        <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black uppercase tracking-wide text-amber-300">
                  {isTr
                    ? "Supabase Veri Harcama (Egress) Koruması & Medya Önbellek Politikası"
                    : "Supabase Zero-Egress & Media Cache Protection Policy"}
                </h4>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {isTr ? "Aktif — Sıfır Supabase Kota Tüketimi" : "Active — Zero Supabase Bandwidth"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {isTr
                  ? "LookPrice sistemindeki yüksek veri harcamasını önleyen koruma mimarisi bu hesapta da tam kapasite devrededir. Yüklenen tüm proje görselleri, kat planları, PDF kataloglar ve videolar yerel önbellek (/api/storage) üzerinden sunulur ve Cron ile doğrudan Google Drive kasasına arşivlenir; Supabase trafik/egress kısıtlamalarından kesinlikle etkilenmez."
                  : "All project images, floor plans, PDFs and videos are served via local zero-egress storage (/api/storage) and offloaded via Cron to Google Drive without consuming Supabase bandwidth."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRunCronNow}
              disabled={runningCron}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FolderSync className={`w-3.5 h-3.5 ${runningCron ? "animate-spin" : ""}`} />
              <span>{runningCron ? (isTr ? "Cron Çalışıyor..." : "Running Cron...") : (isTr ? "Şimdi Cron Yedeği Al" : "Run Cron Backup Now")}</span>
            </button>
          </div>
        </div>

        {/* GOOGLE DRIVE ACCOUNT, TARGET FOLDER & CRON SCHEDULE DEFINITION FORM */}
        <form onSubmit={handleSaveDriveConfig} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isTr ? "Google Drive Hesap Tanımı & Cron Zamanlayıcı Ayarları" : "Google Drive Account & Cron Scheduler Settings"}</span>
            </h4>
            {driveConfig.last_cron_backup_at && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {isTr ? "Son Cron Yedeği: " : "Last Cron Backup: "}
                {new Date(driveConfig.last_cron_backup_at).toLocaleString("tr-TR")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                {isTr ? "Yedekleme Google Drive E-Posta Hesabı" : "Backup Google Drive Email"}
              </label>
              <input
                type="email"
                placeholder="archive@firmaadi.com"
                value={driveConfig.drive_email}
                onChange={e => setDriveConfig({ ...driveConfig, drive_email: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                {isTr ? "Hedef Google Drive Klasör Linki / ID" : "Target Google Drive Folder URL / ID"}
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveConfig.drive_folder_url}
                onChange={e => setDriveConfig({ ...driveConfig, drive_folder_url: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                {isTr ? "Otomatik Cron Yedekleme Periyodu" : "Automated Cron Schedule"}
              </label>
              <select
                value={driveConfig.cron_schedule}
                onChange={e => setDriveConfig({ ...driveConfig, cron_schedule: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="daily_0300">{isTr ? "Her Gece 03:00 (Günlük Tam Yedek)" : "Every Night at 03:00 (Daily)"}</option>
                <option value="every_6h">{isTr ? "Her 6 Saatte Bir (Günde 4 Kez Cron)" : "Every 6 Hours"}</option>
                <option value="hourly">{isTr ? "Her Saat Başı (Yoğun Operasyon)" : "Every Hour"}</option>
              </select>
            </div>

            <div className="flex items-end justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer py-1.5">
                <input
                  type="checkbox"
                  checked={driveConfig.cron_enabled}
                  onChange={e => setDriveConfig({ ...driveConfig, cron_enabled: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{isTr ? "Otomatik Cron Aktif" : "Auto Cron Enabled"}</span>
              </label>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? (isTr ? "Kaydediliyor..." : "Saving...") : (isTr ? "Ayarları Kaydet" : "Save Settings")}</span>
              </button>
            </div>
          </div>
        </form>

        {/* MANUAL & INSTANT EXPORT CARDS (EXCEL / PDF) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isDevProject && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isTr ? "Proje, Ünite & Medya Envanteri" : "Projects, Units & Media Vault"}</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  Drive Aktarımı
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isTr
                  ? "Tüm inşaat projelerini, ünite stok/fiyat listelerini ve medya klasör yapısını Google Drive'a aktarın."
                  : "Export all developer projects, unit prices and media structure to Google Drive."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExport("xls", "developer_projects")}
                  disabled={!!exportingType}
                  className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {exportingType === "developer_projects_xls" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Excel (XLSX)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("pdf", "developer_projects")}
                  disabled={!!exportingType}
                  className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {exportingType === "developer_projects_pdf" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>PDF Rapor</span>
                </button>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isTr ? "Ürün & Stok Yedeği" : "Products & Stock Backup"}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isTr
                ? "Kayıtlı ürün ve stok envanterinizi Excel veya PDF formatında Google Drive hesabınıza yedekleyin."
                : "Backup your product inventory to Google Drive in Excel or PDF format."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("xls", "products")}
                disabled={!!exportingType}
                className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {exportingType === "products_xls" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf", "products")}
                disabled={!!exportingType}
                className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {exportingType === "products_pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isTr ? "Gayrimenkul Portföy Yedeği" : "Real Estate Portfolio Backup"}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isTr
                ? "Gayrimenkul portföy kayıtlarınızı Excel veya PDF formatında Google Drive hesabınıza yedekleyin."
                : "Backup your real estate portfolio listings to Google Drive."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("xls", "real_estate")}
                disabled={!!exportingType}
                className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {exportingType === "real_estate_xls" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf", "real_estate")}
                disabled={!!exportingType}
                className="flex-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {exportingType === "real_estate_pdf" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* RECENT CRON BACKUP HISTORY LOGS */}
        {driveConfig.backup_history.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
              {isTr ? "Son Çalışan Otomatik Cron Yedekleme Kayıtları" : "Recent Automated Cron Backup Logs"}
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              {driveConfig.backup_history.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="px-3 py-2 bg-slate-50/60 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">{item.scope}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                      {item.policy || "Zero-Egress"}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

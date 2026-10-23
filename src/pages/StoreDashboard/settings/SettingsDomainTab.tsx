import React, { useState } from "react";
import { motion } from "motion/react";
import { Globe, RefreshCw, Settings, CheckCircle2, Wrench, Copy, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { api } from "../../../services/api";

interface SettingsDomainTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  currentUser: any;
  currentStoreId?: number;
  onSaveBranding: () => void;
  cfStatus: any;
  setCfStatus: (status: any) => void;
  cfNameServers: string[];
  setCfNameServers: (ns: string[]) => void;
  cfConfigured: boolean;
  setCfConfigured: (conf: boolean) => void;
  showManualCf: boolean;
  setShowManualCf: (val: boolean) => void;
  manualCfToken: string;
  setManualCfToken: (val: string) => void;
  manualCfAccount: string;
  setManualCfAccount: (val: string) => void;
  manualCfEmail: string;
  setManualCfEmail: (val: string) => void;
  loadingCf: boolean;
  setLoadingCf: (val: boolean) => void;
  handleConnectCloudflare: () => Promise<void>;
  handleManualSave: () => Promise<void>;
  fetchCfStatus: () => Promise<void>;
}

export const SettingsDomainTab = ({
  branding,
  onBrandingChange,
  lang,
  currentUser,
  currentStoreId,
  cfStatus,
  setCfStatus,
  cfNameServers,
  cfConfigured,
  setCfConfigured,
  showManualCf,
  setShowManualCf,
  manualCfToken,
  setManualCfToken,
  manualCfAccount,
  setManualCfAccount,
  manualCfEmail,
  setManualCfEmail,
  loadingCf,
  setLoadingCf,
  handleConnectCloudflare,
  handleManualSave,
  fetchCfStatus,
}: SettingsDomainTabProps) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isSuperAdmin = currentUser?.role === "superadmin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Başlık */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {lang === "tr" ? "Özel Alan Adı (Domain) Yönetimi" : "Custom Domain Management"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {lang === "tr" 
                ? "Mağazanızı kendi alan adınız üzerinden yayınlayın (Örn: magazaniz.com)" 
                : "Publish your store on your custom domain (e.g., yourdomain.com)"}
            </p>
          </div>
        </div>

        {/* Alan Adı Giriş Alanı */}
        <div className="space-y-4 mb-8">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
            {lang === "tr" ? "Bağlanacak Alan Adınız (Domain)" : "Your Custom Domain"}
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-slate-900 dark:text-white font-mono placeholder:font-sans placeholder:font-normal"
              value={branding?.custom_domain || ""}
              onChange={(e) => onBrandingChange("custom_domain", e.target.value.trim().toLowerCase())}
              placeholder="ornekdomain.com veya www.ornekdomain.com"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
            {lang === "tr"
              ? "Alan adınızı yukarıya yazdıktan sonra aşağıdaki 2 yöntemden dilediğinizi seçerek bağlantıyı tamamlayabilirsiniz."
              : "Enter your domain above and choose either method below to complete the connection."}
          </p>
        </div>

        {/* Mevcut Durum Kartı (Varsa) */}
        {cfStatus && (
          <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === "tr" ? "Bağlantı Durumu:" : "Connection Status:"}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    cfStatus.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : cfStatus.status === "manual"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                  }`}
                >
                  {cfStatus.status === "active"
                    ? (lang === "tr" ? "Aktif & Bağlı" : "Active")
                    : cfStatus.status === "manual"
                    ? (lang === "tr" ? "DNS Yönlendirmesi Bekleniyor" : "DNS Pointing")
                    : (lang === "tr" ? "Doğrulama Bekleniyor" : "Pending")}
                </span>
              </div>
              <button
                onClick={async () => {
                  if (!confirm(lang === "tr" ? "DNS kayıtları kontrol edilip onarılsın mı?" : "Check and repair DNS records?")) return;
                  setLoadingCf(true);
                  try {
                    await api.post(`/api/store/domain/fix?storeId=${currentStoreId}`, {});
                    alert(lang === "tr" ? "DNS kayıtları güncellendi." : "DNS records updated.");
                    fetchCfStatus();
                  } catch (e: any) {
                    alert(e.message);
                  } finally {
                    setLoadingCf(false);
                  }
                }}
                disabled={loadingCf}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{lang === "tr" ? "Durumu Kontrol Et / Onar" : "Check / Repair"}</span>
              </button>
            </div>

            {/* NS Listesi (Eğer Cloudflare NS Yöntemi Kullanıldıysa) */}
            {cfNameServers && cfNameServers.length > 0 && cfStatus.status !== "active" && (
              <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2 mt-2">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  {lang === "tr" ? "Domain Sağlayıcınızda Güncellenecek NS Adresleri:" : "Nameservers to Update in Your Registrar:"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {cfNameServers.map((ns, idx) => (
                    <div
                      key={idx}
                      onClick={() => copyToClipboard(ns, `ns-${idx}`)}
                      className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400">NS {idx + 1}:</span>
                        <code className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{ns}</code>
                      </div>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2 YÖNTEMLİ BAĞLANTI SEÇENEKLERİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Yöntem 1: Hızlı DNS Kaydı (Önerilen) */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-800/20 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {lang === "tr" ? "Yöntem 1: Hızlı DNS Kaydı" : "Method 1: Fast DNS Pointing"}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {lang === "tr" ? "Tavsiye Edilen (NS Değişmez)" : "Recommended (No NS change)"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === "tr"
                  ? "Domain sağlayıcınızın (GoDaddy, Natro, Turhost vb.) DNS ekranına aşağıdaki 2 kaydı ekleyin. E-postalarınız veya diğer kayıtlarınız bozulmaz."
                  : "Add these 2 records in your domain registrar DNS settings. Your email or other services will not be affected."}
              </p>

              {/* DNS Kayıtları Tablosu */}
              <div className="space-y-2 pt-1">
                <div
                  onClick={() => copyToClipboard("216.24.57.1", "a-record")}
                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">A Kaydı (Apex / @)</span>
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">216.24.57.1</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    {copiedKey === "a-record" ? "Kopyalandı!" : <Copy className="h-3.5 w-3.5" />}
                  </span>
                </div>

                <div
                  onClick={() => copyToClipboard("lookprice-2bpv.onrender.com", "cname-record")}
                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">CNAME Kaydı (www)</span>
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      lookprice-2bpv.onrender.com
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    {copiedKey === "cname-record" ? "Kopyalandı!" : <Copy className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualSave}
              disabled={loadingCf || !branding?.custom_domain}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingCf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{lang === "tr" ? "DNS Kayıtlarını Girdim, Domaini Bağla" : "I Added DNS Records, Connect"}</span>
            </button>
          </div>

          {/* Yöntem 2: Cloudflare SaaS Otomatik NS Yönlendirmesi */}
          <div className="bg-gradient-to-br from-slate-50 to-sky-50/30 dark:from-slate-800/60 dark:to-slate-800/20 p-5 rounded-2xl border border-sky-100 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-600 text-white rounded-xl">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === "tr" ? "Yöntem 2: Otomatik Cloudflare" : "Method 2: Auto Cloudflare"}
                  </h4>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    {lang === "tr" ? "Tam NS Yönetimi & Otomatik SSL" : "Full NS Management & SSL"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === "tr"
                  ? "Sistemimiz LookPrice Cloudflare SaaS altyapısı üzerinden domaininize özel 2 adet Name Server oluşturur. Çıkan NS adreslerini domain firmanıza yapıştırmanız yeterlidir."
                  : "Our system creates 2 custom Nameservers via LookPrice Cloudflare SaaS. You just paste them into your domain provider."}
              </p>

              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-sky-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {lang === "tr" ? "Nasıl Yapılır?" : "How it works:"}
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                  <li>{lang === "tr" ? "Aşağıdaki butona basın." : "Click the button below."}</li>
                  <li>{lang === "tr" ? "Oluşan 2 adet NS adresini kopyalayın." : "Copy the 2 generated NS addresses."}</li>
                  <li>{lang === "tr" ? "Domain firmanızın NS bölümüne kaydedin." : "Paste into your domain registrar NS section."}</li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleConnectCloudflare}
              disabled={loadingCf || !branding?.custom_domain}
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingCf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              <span>{lang === "tr" ? "Cloudflare ile Otomatik NS Al & Bağla" : "Auto Generate Cloudflare NS"}</span>
            </button>
          </div>
        </div>

        {/* SADECE SÜPER ADMİN: PLATFORM CLOUDFLARE API YAPILANDIRMASI */}
        {isSuperAdmin && (
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Süper Admin Özel: Platform Cloudflare Altyapı Anahtarları
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualCf(!showManualCf)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showManualCf ? "Gizle" : (cfConfigured ? "Anahtarları Düzenle" : "Anahtarları Gir")}
              </button>
            </div>

            {showManualCf && (
              <div className="mt-4 p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-3">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  * <strong>Önemli Not:</strong> Bu bilgiler mağaza veya domain sahibine ait değildir. LookPrice platformunun merkezi Cloudflare hesabına ait API anahtarlarıdır. Mağaza sahipleri bu alanı göremez.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Cloudflare Email (Global Key için)
                    </label>
                    <input
                      type="email"
                      placeholder="admin@lookprice.net"
                      value={manualCfEmail}
                      onChange={(e) => setManualCfEmail(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Cloudflare API Token / Global Key
                    </label>
                    <input
                      type="password"
                      placeholder="API Token veya Global Key"
                      value={manualCfToken}
                      onChange={(e) => setManualCfToken(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Cloudflare Account ID
                    </label>
                    <input
                      type="text"
                      placeholder="Cloudflare Hesap ID"
                      value={manualCfAccount}
                      onChange={(e) => setManualCfAccount(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

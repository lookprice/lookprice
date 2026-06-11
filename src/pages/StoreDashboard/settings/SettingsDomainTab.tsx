import React from "react";
import { motion } from "motion/react";
import { Globe, RefreshCw, Settings, CheckCircle2, Wrench } from "lucide-react";
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
  onSaveBranding,
  cfStatus,
  setCfStatus,
  cfNameServers,
  setCfNameServers,
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {lang === "tr" ? "Özel Alan Adı (Domain) Ayarları" : "Custom Domain Settings"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {lang === "tr" ? "Mağazanızı kendi alan adınız üzerinden yayınlayın" : "Publish your store on your own domain"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {lang === "tr" ? "Alan Adınız" : "Your Domain Name"}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all font-bold text-sm text-slate-900"
                  value={branding?.custom_domain || ""}
                  onChange={(e) => {
                    onBrandingChange("custom_domain", e.target.value);
                  }}
                  placeholder="Örn: shop.magazam.com"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic ml-1">
              {lang === "tr"
                ? "* Domaininizi bağlamak için aşağıdaki otomatik sistemi kullanın. SSL sertifikanız otomatik olarak oluşturulacaktır."
                : "* Use the automated system below to connect your domain. Your SSL certificate will be created automatically."}
            </p>

            {/* Cloudflare SaaS Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {lang === "tr" ? "Cloudflare SaaS Otomatik SSL & Domain Bağlantısı" : "Cloudflare SaaS Auto SSL & Domain Connection"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {lang === "tr" ? "Sıfır manuel işlem ile domaininizi bağlayın" : "Connect your domain with zero manual effort"}
                  </p>
                </div>
              </div>

              {!cfStatus ? (
                <div className="space-y-4">
                  {cfConfigured && !showManualCf ? (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900">
                            {lang === "tr" ? "Cloudflare Sistemi Hazır" : "Cloudflare System Ready"}
                          </p>
                          <p className="text-[10px] text-green-700">
                            {lang === "tr"
                              ? "Sistem anahtarları aktif. Mağaza için özel anahtar gerekmez."
                              : "System keys are active. No store-specific keys needed."}
                          </p>
                        </div>
                      </div>
                      {currentUser?.role === "superadmin" && (
                        <button
                          onClick={() => setShowManualCf(true)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {lang === "tr" ? "Manuel Gir" : "Manual Entry"}
                        </button>
                      )}
                    </div>
                  ) : (
                    (currentUser?.role === "superadmin" || !cfConfigured) && (
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            {lang === "tr" ? "Cloudflare API Bilgileri" : "Cloudflare API Credentials"}
                          </p>
                          {cfConfigured && (
                            <button
                              onClick={() => setShowManualCf(false)}
                              className="text-[10px] font-bold text-indigo-600"
                            >
                              {lang === "tr" ? "Vazgeç" : "Cancel"}
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-indigo-700 ml-1">
                              Cloudflare Email (Required for Global API Key)
                            </label>
                            <input
                              type="email"
                              placeholder="Örn: user@example.com"
                              value={manualCfEmail}
                              onChange={(e) => setManualCfEmail(e.target.value)}
                              className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white mb-2"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-indigo-700 ml-1">
                              Cloudflare API Token / Global Key
                            </label>
                            <input
                              type="password"
                              placeholder="Örn: 1234567890abcdef..."
                              value={manualCfToken}
                              onChange={(e) => setManualCfToken(e.target.value)}
                              className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-indigo-700 ml-1">Cloudflare Account ID</label>
                            <input
                              type="text"
                              placeholder="Örn: a1b2c3d4e5f6..."
                              value={manualCfAccount}
                              onChange={(e) => setManualCfAccount(e.target.value)}
                              className="w-full p-2.5 text-[11px] border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={handleConnectCloudflare}
                      disabled={loadingCf || !branding?.custom_domain}
                      className="py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loadingCf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                      <span>{lang === "tr" ? "Cloudflare ile Otomatik Bağla" : "Auto Connect with Cloudflare"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">{lang === "tr" ? "Durum:" : "Status:"}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
                          cfStatus.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {cfStatus.status}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(lang === "tr" ? "DNS kayıtları onarılsın mı? (Error 1000 hatasını çözer)" : "Repair DNS records? (Fixes Error 1000)")) return;
                        setLoadingCf(true);
                        try {
                          await api.post(`/api/store/domain/fix?storeId=${currentStoreId}`, {});
                          alert(
                            lang === "tr"
                              ? "DNS kayıtları onarıldı ve Gri Bulut moduna alındı."
                              : "DNS records repaired and set to Grey Cloud."
                          );
                          fetchCfStatus();
                        } catch (e: any) {
                          alert(e.message);
                        } finally {
                          setLoadingCf(false);
                        }
                      }}
                      disabled={loadingCf}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Wrench className="h-3 w-3" />
                      {lang === "tr" ? "DNS Onar" : "Fix DNS"}
                    </button>
                  </div>

                  {cfNameServers && cfNameServers.length > 0 && cfStatus.status !== "active" && (
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                      <p className="text-xs font-bold text-indigo-900">
                        {lang === "tr" ? "Domaininizi Bağlamak İçin Name Serverları Güncelleyin" : "Update Name Servers to Connect Your Domain"}
                      </p>
                      <p className="text-[10px] text-indigo-600 leading-relaxed">
                        {lang === "tr"
                          ? "Domaininizi aldığınız panelden aşağıdaki Name Server (NS) adreslerini tanımlayın. Bu işlemden sonra domaininiz otomatik olarak aktif olacaktır."
                          : "Set the following Name Server (NS) addresses in your domain registrar panel. Your domain will be activated automatically after this."}
                      </p>
                      <div className="space-y-2 pt-2">
                        {cfNameServers.map((ns, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100"
                          >
                            <span className="text-[10px] font-bold text-slate-500">NS {idx + 1}:</span>
                            <code
                              className="font-mono font-bold text-indigo-600 select-all cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(ns);
                                alert(lang === "tr" ? "Kopyalandı!" : "Copied!");
                              }}
                            >
                              {ns}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cfStatus.status === "active" && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-900">
                        {lang === "tr" ? "Domaininiz başarıyla bağlandı ve aktif!" : "Your domain is successfully connected and active!"}
                      </p>
                    </div>
                  )}

                  {cfStatus.status === "manual" && (
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                        <p className="text-xs font-bold text-indigo-900">{lang === "tr" ? "Domain Kaydedildi" : "Domain Saved"}</p>
                      </div>
                      <p className="text-[10px] text-indigo-600 leading-relaxed">
                        {lang === "tr"
                          ? "Domaininiz sisteme kaydedildi. Şimdi domain panelinizden A kaydını 216.24.57.1 IP adresine yönlendirdiğinizden emin olun."
                          : "Your domain has been saved. Please ensure you have pointed the A record to 216.24.57.1 in your domain panel."}
                      </p>
                      <button onClick={() => setCfStatus(null)} className="text-[10px] font-bold text-indigo-600 underline">
                        {lang === "tr" ? "Ayarları Sıfırla" : "Reset Settings"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

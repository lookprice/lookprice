import React, { useState, useEffect } from "react";
import { Database, Download } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../services/api";
import { toast } from "sonner";

interface SettingsIntegrationsTabProps {
  lang: string;
}

export const SettingsIntegrationsTab = ({ lang }: SettingsIntegrationsTabProps) => {
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [isGoogleDriveExporting, setIsGoogleDriveExporting] = useState(false);

  useEffect(() => {
    api.getGoogleDriveSettings()
      .then(res => {
        if (res) {
          setIsGoogleDriveConnected(res.connected);
        }
      })
      .catch(console.error);
  }, []);

  const handleConnectGoogleDrive = async () => {
    try {
      const res = await api.getGoogleDriveAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        res.url,
        "Google Drive Bağlantısı",
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      const checkPopup = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          const verifyRes = await api.getGoogleDriveSettings();
          setIsGoogleDriveConnected(verifyRes.connected);
        }
      }, 1000);
    } catch (error) {
      toast.error("Bağlantı URL'i alınamadı");
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    if (!window.confirm("Google Drive bağlantısını kesmek istediğinize emin misiniz?")) return;
    try {
      await api.disconnectGoogleDrive();
      setIsGoogleDriveConnected(false);
      toast.success("Google Drive bağlantısı kesildi.");
    } catch (error) {
      toast.error("Çıkış başarısız oldu.");
    }
  };

  const handleExportGoogleDrive = async (targetType: string, format: string) => {
    setIsGoogleDriveExporting(true);
    try {
      const res = await api.exportToGoogleDrive({ targetType, format });
      if (res && (res.success || res.message)) {
        toast.success(res.message || 'Yedekleme başarıyla tamamlandı!');
      } else if (res && res.error) {
        toast.error(res.error || 'Yedekleme sırasında hata oluştu.');
      } else {
        toast.error('Yedekleme sırasında hata oluştu.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Yedekleme sırasında hata oluştu.');
    } finally {
      setIsGoogleDriveExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Google Drive Yedekleme Sistemi</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Bulut sürücünüzü bağlayıp verilerinizi otomatik/manuel yedekleyin.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isGoogleDriveConnected ? (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest rounded-lg border border-emerald-200">
                Drive Bağlı
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                Bağlı Değil
              </span>
            )}
          </div>
        </div>

        {isGoogleDriveConnected ? (
          <div className="space-y-6 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => handleExportGoogleDrive('products', 'xls')}
                disabled={isGoogleDriveExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportGoogleDrive('products', 'pdf')}
                disabled={isGoogleDriveExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-center font-bold text-slate-700">Ürünler<br/>(PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportGoogleDrive('real_estate', 'xls')}
                disabled={isGoogleDriveExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <Download className="h-6 w-6 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportGoogleDrive('real_estate', 'pdf')}
                disabled={isGoogleDriveExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-rose-300 transition-all cursor-pointer disabled:opacity-50 group"
              >
                <Download className="h-6 w-6 text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-center font-bold text-slate-700">Emlak Portföy<br/>(PDF)</span>
              </button>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={handleDisconnectGoogleDrive}
                className="px-6 py-2.5 bg-white text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:shadow-sm font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Bağlantıyı Kes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                className="px-8 py-3.5 bg-[#4285F4] text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 font-bold text-sm tracking-wide transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Database className="h-4 w-4" />
                <span>Google Drive Hesabı Bağla</span>
              </button>
            </div>

            {/* Google Cloud Redirect URI Help Information Card */}
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-600 space-y-3">
              <div className="font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <span>🔑 Google Cloud Console - Yetkilendirilmiş Yönlendirme Listesi</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Google Drive bağlantısının sorunsuz kurulabilmesi için kullandığınız Google Cloud projesinde 
                aşağıdaki <strong>Yönlendirme URI'sini (Authorized Redirect URI)</strong> tanımlamanız gerekir. 
                Aksi takdirde <code>redirect_uri_mismatch (hata 400)</code> alırsınız.
              </p>
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tanımlanması Gereken Callback URL:</span>
                  <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-800 text-[11px] overflow-x-auto justify-between">
                    <span className="break-all select-all">{`${window.location.origin}/api/google-drive/callback`}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/google-drive/callback`);
                        toast.success("Callback URL panoya kopyalandı!");
                      }}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded font-sans font-bold hover:bg-blue-100 text-[10px] shrink-0 cursor-pointer"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                  <span>• Google Cloud Console &gt; API'ler ve Hizmetler &gt; Kimlik Bilgileri alanına gidin.</span>
                  <span>• OAuth 2.0 İstemci Kimliğinizi düzenleyin ve "Yetkilendirilmiş yönlendirme URI'leri" kısmına ekleyin.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

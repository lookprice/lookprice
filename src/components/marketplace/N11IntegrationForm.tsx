import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCheck, 
  Save, 
  Eye, 
  EyeOff 
} from "lucide-react";

interface N11IntegrationFormProps {
  lang: string;
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  t: any;
  n11AppKey: string;
  setN11AppKey: (val: string) => void;
  n11AppSecret: string;
  setN11AppSecret: (val: string) => void;
  isN11Connected: boolean;
  handleTestN11: () => void;
  handleSyncN11Orders: () => void;
  handleDisconnectN11: () => void;
  handleSaveN11Settings: () => void;
  n11Sync: { isSyncing: boolean };
}

export const N11IntegrationForm: React.FC<N11IntegrationFormProps> = ({
  lang,
  branding,
  onBrandingChange,
  t,
  n11AppKey,
  setN11AppKey,
  n11AppSecret,
  setN11AppSecret,
  isN11Connected,
  handleTestN11,
  handleSyncN11Orders,
  handleDisconnectN11,
  handleSaveN11Settings,
  n11Sync
}) => {
  const [showN11Secret, setShowN11Secret] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="n11-integration-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200/70 flex items-center justify-center font-black text-red-600 text-xs tracking-tighter">
            N11
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.n11Integration || "N11 Entegrasyonu"}</h3>
            <p className="text-xs text-slate-500">{t.n11IntegrationDesc || "N11 SOAP Web Servisi bağlantısı"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isN11Connected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              <span>{lang === 'tr' ? 'N11 Hesabı Bağlı' : 'N11 Connected'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.n11AppKey || "N11 App Key"}</label>
          <input 
            type="text" 
            id="n11-app-key-input"
            name="n11_app_key_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={n11AppKey}
            onChange={(e) => {
              const val = e.target.value;
              setN11AppKey(val);
              onBrandingChange('n11_settings', {
                ...(branding.n11_settings || {}),
                appKey: val,
                appSecret: n11AppSecret
              });
            }}
            placeholder="N11 App Key"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.n11AppSecret || "N11 App Secret"}</label>
          <div className="relative">
            <input 
              type={showN11Secret ? "text" : "password"} 
              id="n11-app-secret-input"
              name="n11_app_secret_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={n11AppSecret}
              onChange={(e) => {
                const val = e.target.value;
                setN11AppSecret(val);
                onBrandingChange('n11_settings', {
                  ...(branding.n11_settings || {}),
                  appKey: n11AppKey,
                  appSecret: val
                });
              }}
              placeholder="N11 App Secret"
            />
            <button
              type="button"
              onClick={() => setShowN11Secret(!showN11Secret)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showN11Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestN11}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSyncN11Orders}
            disabled={n11Sync.isSyncing}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
            <span>{n11Sync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isN11Connected && (
            <button 
              type="button"
              onClick={handleDisconnectN11}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {t.disconnect || "Bağlantıyı Kes"}
            </button>
          )}

          <button 
            type="button"
            onClick={handleSaveN11Settings}
            id="n11-save-connect-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
          >
            {isN11Connected ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? '✓ N11 Hesabı Bağlı (Güncelle)' : '✓ N11 Connected (Update)'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-300" />
                <span>{lang === 'tr' ? 'N11 Hesabını Bağla' : 'Connect N11'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

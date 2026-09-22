import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  CheckCheck, 
  Save, 
  Eye, 
  EyeOff 
} from "lucide-react";

interface PazaramaIntegrationFormProps {
  lang: string;
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  t: any;
  pzApiKey: string;
  setPzApiKey: (val: string) => void;
  pzApiSecret: string;
  setPzApiSecret: (val: string) => void;
  pzMerchantId: string;
  setPzMerchantId: (val: string) => void;
  isPzConnected: boolean;
  handleTestPz: () => void;
  handleSyncPzOrders: () => void;
  handleDisconnectPz: () => void;
  handleSavePzSettings: () => void;
  setSelectedMappingMarketplace: (m: any) => void;
  setCategoryMappingModalOpen: (open: boolean) => void;
  pzSync: { isSyncing: boolean };
}

export const PazaramaIntegrationForm: React.FC<PazaramaIntegrationFormProps> = ({
  lang,
  branding,
  onBrandingChange,
  t,
  pzApiKey,
  setPzApiKey,
  pzApiSecret,
  setPzApiSecret,
  pzMerchantId,
  setPzMerchantId,
  isPzConnected,
  handleTestPz,
  handleSyncPzOrders,
  handleDisconnectPz,
  handleSavePzSettings,
  setSelectedMappingMarketplace,
  setCategoryMappingModalOpen,
  pzSync
}) => {
  const [showPzSecret, setShowPzSecret] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="pz-integration-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center font-black text-blue-600 text-xs tracking-tighter">
            PZ
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{lang === 'tr' ? 'Pazarama Entegrasyonu' : 'Pazarama Integration'}</h3>
            <p className="text-xs text-slate-500">{lang === 'tr' ? 'İş Bankası Pazarama API bağlantısı' : 'Isbank Pazarama API connection'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isPzConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              <span>{lang === 'tr' ? 'Pazarama Hesabı Bağlı' : 'Pazarama Connected'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama API Key</label>
          <input 
            type="text" 
            id="pz-api-key-input"
            name="pz_api_key_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={pzApiKey}
            onChange={(e) => {
              const val = e.target.value;
              setPzApiKey(val);
              onBrandingChange('pazarama_settings', {
                ...(branding.pazarama_settings || {}),
                apiKey: val,
                apiSecret: pzApiSecret,
                merchantId: pzMerchantId
              });
            }}
            placeholder="API Key"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama API Secret</label>
          <div className="relative">
            <input 
              type={showPzSecret ? "text" : "password"} 
              id="pz-api-secret-input"
              name="pz_api_secret_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={pzApiSecret}
              onChange={(e) => {
                const val = e.target.value;
                setPzApiSecret(val);
                onBrandingChange('pazarama_settings', {
                  ...(branding.pazarama_settings || {}),
                  apiKey: pzApiKey,
                  apiSecret: val,
                  merchantId: pzMerchantId
                });
              }}
              placeholder="API Secret"
            />
            <button
              type="button"
              onClick={() => setShowPzSecret(!showPzSecret)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showPzSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pazarama Merchant ID</label>
          <input 
            type="text" 
            id="pz-merchant-id-input"
            name="pz_merchant_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={pzMerchantId}
            onChange={(e) => {
              const val = e.target.value;
              setPzMerchantId(val);
              onBrandingChange('pazarama_settings', {
                ...(branding.pazarama_settings || {}),
                apiKey: pzApiKey,
                apiSecret: pzApiSecret,
                merchantId: val
              });
            }}
            placeholder="Satıcı Kodu"
          />
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestPz}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSyncPzOrders}
            disabled={pzSync.isSyncing}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${pzSync.isSyncing ? 'animate-spin' : ''}`} />
            <span>{pzSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setSelectedMappingMarketplace('pazarama');
              setCategoryMappingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isPzConnected && (
            <button 
              type="button"
              onClick={handleDisconnectPz}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {t.disconnect || "Bağlantıyı Kes"}
            </button>
          )}

          <button 
            type="button"
            onClick={handleSavePzSettings}
            id="pz-save-connect-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
          >
            {isPzConnected ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? '✓ Pazarama Hesabı Bağlı (Güncelle)' : '✓ Pazarama Connected (Update)'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-300" />
                <span>{lang === 'tr' ? 'Pazarama Hesabını Bağla' : 'Connect Pazarama'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

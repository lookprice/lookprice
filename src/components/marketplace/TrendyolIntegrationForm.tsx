import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Store, 
  Eye, 
  EyeOff, 
  CheckCheck, 
  Save 
} from "lucide-react";

interface TrendyolIntegrationFormProps {
  lang: string;
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  t: any;
  tyApiKey: string;
  setTyApiKey: (val: string) => void;
  tyApiSecret: string;
  setTyApiSecret: (val: string) => void;
  tyMerchantId: string;
  setTyMerchantId: (val: string) => void;
  isTyConnected: boolean;
  tyLiveCount: number;
  tyErrCount: number;
  handleTestTy: () => void;
  handleSyncTyOrders: () => void;
  handleDisconnectTy: () => void;
  handleSaveTySettings: () => void;
  setListingsModalTab: (tab: any) => void;
  setShowListingsModal: (show: boolean) => void;
  setSelectedMappingMarketplace: (m: any) => void;
  setCategoryMappingModalOpen: (open: boolean) => void;
  tySync: { isSyncing: boolean };
}

export const TrendyolIntegrationForm: React.FC<TrendyolIntegrationFormProps> = ({
  lang,
  branding,
  onBrandingChange,
  t,
  tyApiKey,
  setTyApiKey,
  tyApiSecret,
  setTyApiSecret,
  tyMerchantId,
  setTyMerchantId,
  isTyConnected,
  tyLiveCount,
  tyErrCount,
  handleTestTy,
  handleSyncTyOrders,
  handleDisconnectTy,
  handleSaveTySettings,
  setListingsModalTab,
  setShowListingsModal,
  setSelectedMappingMarketplace,
  setCategoryMappingModalOpen,
  tySync
}) => {
  const [showTySecret, setShowTySecret] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="ty-integration-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center font-black text-orange-600 text-xs tracking-tighter">
            TY
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.trendyolIntegration || "Trendyol Entegrasyonu"}</h3>
            <p className="text-xs text-slate-500">{t.trendyolIntegrationDesc || "Trendyol Marketplace API sipariş ve ürün yönetimi"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isTyConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              <span>{lang === 'tr' ? 'Trendyol Hesabı Bağlı' : 'Trendyol Connected'}</span>
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
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolApiKey || "API Key"}</label>
          <input 
            type="text" 
            id="ty-api-key-input"
            name="ty_api_key_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={tyApiKey}
            onChange={(e) => {
              const val = e.target.value;
              setTyApiKey(val);
              onBrandingChange('trendyol_settings', {
                ...(branding.trendyol_settings || {}),
                apiKey: val,
                apiSecret: tyApiSecret,
                merchantId: tyMerchantId
              });
            }}
            placeholder="API Key"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolApiSecret || "API Secret"}</label>
          <div className="relative">
            <input 
              type={showTySecret ? "text" : "password"} 
              id="ty-api-secret-input"
              name="ty_api_secret_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={tyApiSecret}
              onChange={(e) => {
                const val = e.target.value;
                setTyApiSecret(val);
                onBrandingChange('trendyol_settings', {
                  ...(branding.trendyol_settings || {}),
                  apiKey: tyApiKey,
                  apiSecret: val,
                  merchantId: tyMerchantId
                });
              }}
              placeholder="API Secret"
            />
            <button
              type="button"
              onClick={() => setShowTySecret(!showTySecret)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showTySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t.trendyolMerchantId || "Satıcı ID (Supplier ID)"}</label>
          <input 
            type="text" 
            id="ty-merchant-id-input"
            name="ty_merchant_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={tyMerchantId}
            onChange={(e) => {
              const val = e.target.value;
              setTyMerchantId(val);
              onBrandingChange('trendyol_settings', {
                ...(branding.trendyol_settings || {}),
                apiKey: tyApiKey,
                apiSecret: tyApiSecret,
                merchantId: val
              });
            }}
            placeholder="Satıcı ID"
          />
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestTy}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSyncTyOrders}
            disabled={tySync.isSyncing}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${tySync.isSyncing ? 'animate-spin' : ''}`} />
            <span>{tySync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setListingsModalTab('trendyol');
              setShowListingsModal(true);
            }}
            id="ty-view-listings-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 shadow-xs transition-colors cursor-pointer"
            title={lang === 'tr' ? "Trendyol'da Satışta Olan ve Hata Alan Ürünleri Listele" : "List active and failed Trendyol products"}
          >
            <Store className="h-3.5 w-3.5 text-amber-600" />
            <span>{lang === 'tr' ? 'İlanlar & Hatalar' : 'Listings & Errors'}</span>
            {tyLiveCount > 0 && (
              <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                {tyLiveCount}
              </span>
            )}
            {tyErrCount > 0 && (
              <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                {tyErrCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              setSelectedMappingMarketplace('trendyol');
              setCategoryMappingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isTyConnected && (
            <button 
              type="button"
              onClick={handleDisconnectTy}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {t.disconnect || "Bağlantıyı Kes"}
            </button>
          )}

          <button 
            type="button"
            onClick={handleSaveTySettings}
            id="ty-save-connect-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
          >
            {isTyConnected ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? '✓ Trendyol Hesabı Bağlı (Güncelle)' : '✓ Trendyol Connected (Update)'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-300" />
                <span>{lang === 'tr' ? 'Trendyol Hesabını Bağla' : 'Connect Trendyol'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

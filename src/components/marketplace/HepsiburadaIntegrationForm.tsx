import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Store, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  HelpCircle,
  Info,
  CheckCheck,
  Save
} from "lucide-react";
import { toast } from "sonner";

interface HepsiburadaIntegrationFormProps {
  lang: string;
  currentStoreId?: number;
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  t: any;
  hbMerchantId: string;
  setHbMerchantId: (val: string) => void;
  hbApiSecret: string;
  setHbApiSecret: (val: string) => void;
  hbApiKey: string;
  setHbApiKey: (val: string) => void;
  hbDefaultCargoCompany: string;
  setHbDefaultCargoCompany: (val: string) => void;
  hbAutoSyncOrders: boolean;
  setHbAutoSyncOrders: (val: boolean) => void;
  hbAutoStockSync: boolean;
  setHbAutoStockSync: (val: boolean) => void;
  hbIsTestMode: boolean;
  setHbIsTestMode: (val: boolean) => void;
  hbDefaultDispatchTime: number;
  setHbDefaultDispatchTime: (val: number) => void;
  isHbConnected: boolean;
  hbLiveCount: number;
  hbErrCount: number;
  hbMatching: boolean;
  handleTestHb: () => void;
  handleSyncHbOrders: () => void;
  handleMatchHbListings: () => void;
  handleFetchHbCategories: () => void;
  handleDisconnectHb: () => void;
  handleSaveHbSettings: () => void;
  setListingsModalTab: (tab: any) => void;
  setShowListingsModal: (show: boolean) => void;
  setSelectedMappingMarketplace: (m: any) => void;
  setCategoryMappingModalOpen: (open: boolean) => void;
  hbSync: { isSyncing: boolean };
}

export const HepsiburadaIntegrationForm: React.FC<HepsiburadaIntegrationFormProps> = ({
  lang,
  currentStoreId,
  branding,
  onBrandingChange,
  t,
  hbMerchantId,
  setHbMerchantId,
  hbApiSecret,
  setHbApiSecret,
  hbApiKey,
  setHbApiKey,
  hbDefaultCargoCompany,
  setHbDefaultCargoCompany,
  hbAutoSyncOrders,
  setHbAutoSyncOrders,
  hbAutoStockSync,
  setHbAutoStockSync,
  hbIsTestMode,
  setHbIsTestMode,
  hbDefaultDispatchTime,
  setHbDefaultDispatchTime,
  isHbConnected,
  hbLiveCount,
  hbErrCount,
  hbMatching,
  handleTestHb,
  handleSyncHbOrders,
  handleMatchHbListings,
  handleFetchHbCategories,
  handleDisconnectHb,
  handleSaveHbSettings,
  setListingsModalTab,
  setShowListingsModal,
  setSelectedMappingMarketplace,
  setCategoryMappingModalOpen,
  hbSync
}) => {
  const [showHbSecret, setShowHbSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="hb-integration-card">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/70 flex items-center justify-center font-black text-orange-600 text-xs tracking-tighter">
            HB
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900">{t.hepsiburadaIntegration || "Hepsiburada Entegrasyonu"}</h3>
              <span className="text-[10px] text-slate-400 font-mono">Merchant API v3</span>
            </div>
            <p className="text-xs text-slate-500">{t.hepsiburadaIntegrationDesc || "Katalog, sipariş ve anlık stok senkronizasyonu"}</p>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex items-center space-x-2">
          {isHbConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold" id="hb-connected-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              <span>{lang === 'tr' ? 'HB Hesabı Bağlı' : 'HB Account Connected'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium" id="hb-disconnected-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Merchant ID */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {t.hepsiburadaMerchantId || "Hepsiburada Merchant ID (Mağaza ID)"}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input 
            type="text" 
            id="hb-merchant-id-input"
            name="hb_merchant_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={hbMerchantId}
            onChange={(e) => {
              const val = e.target.value;
              setHbMerchantId(val);
              onBrandingChange('hepsiburada_settings', {
                ...(branding.hepsiburada_settings || {}),
                merchantId: val,
                apiSecret: hbApiSecret,
                apiKey: hbApiKey || "lookprice_dev"
              });
            }}
            placeholder="örn. ea3f02b7-ef8c-439b-ac03-9e2ed38a4deb"
          />
        </div>

        {/* API Secret */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {t.hepsiburadaApiSecret || "Hepsiburada API Secret (Password)"}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input 
              type={showHbSecret ? "text" : "password"} 
              id="hb-api-secret-input"
              name="hb_api_secret_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={hbApiSecret}
              onChange={(e) => {
                const val = e.target.value;
                setHbApiSecret(val);
                onBrandingChange('hepsiburada_settings', {
                  ...(branding.hepsiburada_settings || {}),
                  merchantId: hbMerchantId,
                  apiSecret: val,
                  apiKey: hbApiKey || "lookprice_dev"
                });
              }}
              placeholder="Hepsiburada API Şifresi"
            />
            <button
              type="button"
              onClick={() => setShowHbSecret(!showHbSecret)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showHbSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* API Key (Optional) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {t.hepsiburadaApiKey || "API Kullanıcı Adı (Opsiyonel)"}
          </label>
          <input 
            type="text" 
            id="hb-api-key-input"
            name="hb_api_key_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={hbApiKey}
            onChange={(e) => {
              const val = e.target.value;
              setHbApiKey(val);
              onBrandingChange('hepsiburada_settings', {
                ...(branding.hepsiburada_settings || {}),
                merchantId: hbMerchantId,
                apiSecret: hbApiSecret,
                apiKey: val || "lookprice_dev"
              });
            }}
            placeholder="lookprice_dev"
          />
        </div>

        {/* Cargo Company */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {t.hepsiburadaDefaultCargo || "Varsayılan Kargo Şirketi"}
          </label>
          <select 
            value={hbDefaultCargoCompany}
            onChange={(e) => setHbDefaultCargoCompany(e.target.value)}
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs text-slate-900 transition-colors"
          >
            <option value="Hepsijet">HepsiJet</option>
            <option value="YurticiKargo">Yurtiçi Kargo</option>
            <option value="ArasKargo">Aras Kargo</option>
            <option value="MNGKargo">MNG Kargo</option>
            <option value="PTTKargo">PTT Kargo</option>
            <option value="Sendeo">Sendeo</option>
            <option value="HorozLojistik">Horoz Lojistik</option>
          </select>
        </div>
      </div>

      {/* Operational Strip: Dispatch & Automations */}
      <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox"
              checked={hbAutoSyncOrders}
              onChange={(e) => setHbAutoSyncOrders(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 h-3.5 w-3.5"
            />
            <span className="font-medium text-slate-700">{lang === 'tr' ? 'Otomatik Sipariş Çekme' : 'Auto Sync Orders'}</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox"
              checked={hbAutoStockSync}
              onChange={(e) => setHbAutoStockSync(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-800 h-3.5 w-3.5"
            />
            <span className="font-medium text-slate-700">{lang === 'tr' ? 'Anlık Stok Eşitleme' : 'Real-time Stock'}</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input 
              type="checkbox"
              checked={hbIsTestMode}
              onChange={(e) => setHbIsTestMode(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span className="font-medium text-slate-700">{lang === 'tr' ? 'Test Modu' : 'Test Mode'}</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 text-[11px]">{lang === 'tr' ? 'Kargoya Verme:' : 'Dispatch:'}</span>
          <select 
            value={hbDefaultDispatchTime}
            onChange={(e) => setHbDefaultDispatchTime(Number(e.target.value))}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
          >
            <option value={1}>1 Gün</option>
            <option value={2}>2 Gün</option>
            <option value={3}>3 Gün</option>
          </select>
        </div>
      </div>

      {/* Webhook Quick Copy Strip */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200/60 text-[11px]">
        <span className="text-slate-500 font-mono truncate">
          {window.location.origin}/api/integrations/hepsiburada/webhook/{currentStoreId || 1}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/api/integrations/hepsiburada/webhook/${currentStoreId || 1}`);
            setCopiedWebhook(true);
            toast.success(lang === 'tr' ? 'Webhook URL kopyalandı!' : 'Webhook URL copied!');
            setTimeout(() => setCopiedWebhook(false), 2500);
          }}
          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium px-2 py-0.5 rounded bg-white border border-slate-200/80 cursor-pointer shrink-0"
        >
          {copiedWebhook ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
          <span>{copiedWebhook ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? 'Webhook Kopyala' : 'Copy Webhook')}</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestHb}
            id="hb-test-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSyncHbOrders}
            disabled={hbSync.isSyncing}
            id="hb-sync-orders-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${hbSync.isSyncing ? 'animate-spin' : ''}`} />
            <span>{hbSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Canlı Çek' : 'Sync Orders')}</span>
          </button>

          <button 
            type="button"
            onClick={handleMatchHbListings}
            disabled={hbMatching}
            id="hb-match-listings-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <Layers className={`h-3.5 w-3.5 ${hbMatching ? 'animate-spin' : ''}`} />
            <span>{hbMatching ? (lang === 'tr' ? 'Eşleştiriliyor...' : 'Matching...') : (lang === 'tr' ? 'HB Ürünlerini Çek & Eşle' : 'Match HB Listings')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setListingsModalTab('hepsiburada');
              setShowListingsModal(true);
            }}
            id="hb-view-listings-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <Store className="h-3.5 w-3.5 text-orange-600" />
            <span>{lang === 'tr' ? 'İlanlar & Hatalar' : 'Listings & Errors'}</span>
            {hbLiveCount > 0 && (
              <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                {hbLiveCount}
              </span>
            )}
            {hbErrCount > 0 && (
              <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                {hbErrCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              setSelectedMappingMarketplace('hepsiburada');
              setCategoryMappingModalOpen(true);
            }}
            id="hb-category-mapping-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
          </button>

          <button 
            type="button"
            onClick={handleFetchHbCategories}
            id="hb-categories-guide-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{lang === 'tr' ? 'Kategori Rehberi' : 'Category Guide'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isHbConnected && (
            <button 
              type="button"
              onClick={handleDisconnectHb}
              id="hb-disconnect-btn"
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {t.disconnect || "Bağlantıyı Kes"}
            </button>
          )}

          <button 
            type="button"
            onClick={handleSaveHbSettings}
            id="hb-save-connect-btn"
            className={`inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isHbConnected
                ? 'bg-slate-900 hover:bg-black text-white border border-slate-800'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            {isHbConnected ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? '✓ HB Hesabı Bağlı (Güncelle)' : '✓ HB Connected (Update)'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-300" />
                <span>{lang === 'tr' ? 'Hepsiburada Hesabını Bağla' : 'Connect Hepsiburada'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

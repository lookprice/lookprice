import React, { useState } from "react";
import { 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  UploadCloud, 
  HelpCircle, 
  CheckCheck, 
  Save, 
  Eye, 
  EyeOff 
} from "lucide-react";

interface AmazonIntegrationFormProps {
  lang: string;
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  t: any;
  amazonAppId: string;
  setAmazonAppId: (val: string) => void;
  amazonClientId: string;
  setAmazonClientId: (val: string) => void;
  amazonClientSecret: string;
  setAmazonClientSecret: (val: string) => void;
  amazonRefreshToken: string;
  setAmazonRefreshToken: (val: string) => void;
  amazonSellerId: string;
  setAmazonSellerId: (val: string) => void;
  amazonIsSandbox: boolean;
  setAmazonIsSandbox: (val: boolean) => void;
  isAmazonConnected: boolean;
  testingAmazon: boolean;
  amazonSync: { isSyncing: boolean };
  amazonMatching: boolean;
  bulkSyncingAmazon: boolean;
  handleTestAmazon: () => void;
  handleSyncOrders: () => void;
  handleMatchAmazonListings: () => void;
  handleBulkSyncAmazon: () => void;
  handleDisconnectAmazon: () => void;
  handleSaveAmazonSettings: () => void;
  setShowAmazonGuideModal: (show: boolean) => void;
  setSelectedMappingMarketplace: (m: any) => void;
  setCategoryMappingModalOpen: (open: boolean) => void;
}

export const AmazonIntegrationForm: React.FC<AmazonIntegrationFormProps> = ({
  lang,
  branding,
  onBrandingChange,
  t,
  amazonAppId,
  setAmazonAppId,
  amazonClientId,
  setAmazonClientId,
  amazonClientSecret,
  setAmazonClientSecret,
  amazonRefreshToken,
  setAmazonRefreshToken,
  amazonSellerId,
  setAmazonSellerId,
  amazonIsSandbox,
  setAmazonIsSandbox,
  isAmazonConnected,
  testingAmazon,
  amazonSync,
  amazonMatching,
  bulkSyncingAmazon,
  handleTestAmazon,
  handleSyncOrders,
  handleMatchAmazonListings,
  handleBulkSyncAmazon,
  handleDisconnectAmazon,
  handleSaveAmazonSettings,
  setShowAmazonGuideModal,
  setSelectedMappingMarketplace,
  setCategoryMappingModalOpen
}) => {
  const [showAmazonSecret, setShowAmazonSecret] = useState(false);
  const [showAmazonRefresh, setShowAmazonRefresh] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="amazon-integration-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center font-black text-amber-700 text-xs tracking-tighter">
            AMZ
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.amazonIntegration || "Amazon SP-API Entegrasyonu"}</h3>
            <p className="text-xs text-slate-500">{t.amazonIntegrationDesc || "Selling Partner API ile sipariş ve envanter"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAmazonConnected ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
              <span>{lang === 'tr' ? 'Amazon Hesabı Bağlı' : 'Amazon Connected'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/70 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{lang === 'tr' ? 'Bağlantı Yapılmadı' : 'Not Connected'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sandbox & Production Environment Selector */}
      <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${amazonIsSandbox ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {amazonIsSandbox ? (lang === 'tr' ? 'SP-API Sandbox (Test) Modu Aktif' : 'SP-API Sandbox Mode Active') : (lang === 'tr' ? 'Canlı (Production) Modu Aktif' : 'Live Production Mode Active')}
            </span>
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              {amazonIsSandbox 
                ? (lang === 'tr' ? "Uygulamanız Amazon Portal'da 'Status: Sandbox' durumunda iken test uç noktalarını kullanır. Canlı satışa geçtiğinizde canlı moda alınız." : "Uses test endpoints while your app status is Sandbox. Switch to production when published.")
                : (lang === 'tr' ? "Canlı Amazon.com.tr (EU Endpoint) mağaza verileri ve siparişleri işlenir." : "Live Amazon.com.tr marketplace data & orders are processed.")}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const newVal = !amazonIsSandbox;
                setAmazonIsSandbox(newVal);
                onBrandingChange('amazon_settings', {
                  ...(branding.amazon_settings || {}),
                  appId: amazonAppId,
                  clientId: amazonClientId,
                  clientSecret: amazonClientSecret,
                  refresh_token: amazonRefreshToken,
                  sellerId: amazonSellerId,
                  isSandbox: newVal
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                amazonIsSandbox 
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {amazonIsSandbox ? (lang === 'tr' ? '✓ Sandbox Aktif' : '✓ Sandbox Active') : (lang === 'tr' ? 'Sandbox Moduna Al' : 'Switch to Sandbox')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAmazonIsSandbox(false);
                onBrandingChange('amazon_settings', {
                  ...(branding.amazon_settings || {}),
                  appId: amazonAppId,
                  clientId: amazonClientId,
                  clientSecret: amazonClientSecret,
                  refresh_token: amazonRefreshToken,
                  sellerId: amazonSellerId,
                  isSandbox: false
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                !amazonIsSandbox 
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {!amazonIsSandbox ? (lang === 'tr' ? '✓ Canlı (Prod) Aktif' : '✓ Live Active') : (lang === 'tr' ? 'Canlı Moda Geç' : 'Switch to Live')}
            </button>
          </div>
        </div>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* LWA Client ID */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>LWA Client Identifier (Client ID)</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">amzn1.application-oa2-client...</span>
          </div>
          <input 
            type="text" 
            id="amz-client-id-input"
            name="amz_client_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={amazonClientId}
            onChange={(e) => {
              const val = e.target.value;
              setAmazonClientId(val);
              onBrandingChange('amazon_settings', {
                ...(branding.amazon_settings || {}),
                appId: amazonAppId,
                clientId: val,
                clientSecret: amazonClientSecret,
                refresh_token: amazonRefreshToken,
                sellerId: amazonSellerId,
                isSandbox: amazonIsSandbox
              });
            }}
            placeholder="amzn1.application-oa2-client.61775aeb..."
          />
        </div>

        {/* LWA Client Secret */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>LWA Client Secret</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">amzn1.oa2-cs.v1...</span>
          </div>
          <div className="relative">
            <input 
              type={showAmazonSecret ? "text" : "password"} 
              id="amz-client-secret-input"
              name="amz_client_secret_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={amazonClientSecret}
              onChange={(e) => {
                const val = e.target.value;
                setAmazonClientSecret(val);
                onBrandingChange('amazon_settings', {
                  ...(branding.amazon_settings || {}),
                  appId: amazonAppId,
                  clientId: amazonClientId,
                  clientSecret: val,
                  refresh_token: amazonRefreshToken,
                  sellerId: amazonSellerId,
                  isSandbox: amazonIsSandbox
                });
              }}
              placeholder="amzn1.oa2-cs.v1.c2384dd..."
            />
            <button
              type="button"
              onClick={() => setShowAmazonSecret(!showAmazonSecret)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showAmazonSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* SP-API Refresh Token */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>SP-API Refresh Token</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const appId = amazonAppId || "amzn1.sp.solution.d6950e6e-a94f-4d43-a258-a6e0cbd2d3e9";
                  const statePayload = btoa(JSON.stringify({ slug: branding?.slug || "gap", storeId: branding?.id || 1 }));
                  const oauthUrl = `https://sellercentral.amazon.com.tr/apps/authorize/consent?application_id=${encodeURIComponent(appId)}&state=${encodeURIComponent(statePayload)}&version=beta`;
                  window.open(oauthUrl, '_blank', 'width=700,height=750');
                }}
                className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Seller Central üzerinden tek tıkla OAuth yetkilendirmesi başlat"
              >
                <span>⚡ Tek Tıkla Amazon'dan Al (OAuth)</span>
              </button>
              <span className="text-[10px] text-indigo-600 font-medium cursor-pointer hover:underline" onClick={() => setShowAmazonGuideModal(true)}>
                Nasıl Alınır?
              </span>
            </div>
          </div>
          <div className="relative">
            <input 
              type={showAmazonRefresh ? "text" : "password"} 
              id="amz-refresh-token-input"
              name="amz_refresh_token_no_autofill"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              className="w-full h-9 px-3 pr-8 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
              value={amazonRefreshToken}
              onChange={(e) => {
                const val = e.target.value;
                setAmazonRefreshToken(val);
                onBrandingChange('amazon_settings', {
                  ...(branding.amazon_settings || {}),
                  appId: amazonAppId,
                  clientId: amazonClientId,
                  clientSecret: amazonClientSecret,
                  refresh_token: val,
                  sellerId: amazonSellerId,
                  isSandbox: amazonIsSandbox
                });
              }}
              placeholder="Atzr|IQEBLzAtAhUA..."
            />
            <button
              type="button"
              onClick={() => setShowAmazonRefresh(!showAmazonRefresh)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              tabIndex={-1}
            >
              {showAmazonRefresh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Amazon Seller ID (Merchant Token) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>{t.amazonSellerId || "Amazon Satıcı Kimliği (Seller ID / Merchant Token)"}</span>
            </label>
            <span className="text-[10px] text-slate-400">Seller Central &gt; Hesap Bilgileri</span>
          </div>
          <input 
            type="text" 
            id="amz-seller-id-input"
            name="amz_seller_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={amazonSellerId}
            onChange={(e) => {
              const val = e.target.value;
              setAmazonSellerId(val);
              onBrandingChange('amazon_settings', {
                ...(branding.amazon_settings || {}),
                appId: amazonAppId,
                clientId: amazonClientId,
                clientSecret: amazonClientSecret,
                refresh_token: amazonRefreshToken,
                sellerId: val,
                isSandbox: amazonIsSandbox
              });
            }}
            placeholder="Örn: A3J..."
          />
        </div>

        {/* Amazon App ID (Solution ID) */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>Amazon App ID (Solution ID)</span>
              <span className="text-[10px] text-slate-400 font-normal">(İsteğe Bağlı / Referans)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">amzn1.sp.solution...</span>
          </div>
          <input 
            type="text" 
            id="amz-app-id-input"
            name="amz_app_id_no_autofill"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs font-mono text-slate-900 transition-colors"
            value={amazonAppId}
            onChange={(e) => {
              const val = e.target.value;
              setAmazonAppId(val);
              onBrandingChange('amazon_settings', {
                ...(branding.amazon_settings || {}),
                appId: val,
                clientId: amazonClientId,
                clientSecret: amazonClientSecret,
                refresh_token: amazonRefreshToken,
                sellerId: amazonSellerId,
                isSandbox: amazonIsSandbox
              });
            }}
            placeholder="amzn1.sp.solution.201c524b-1384-4d46-8d65-acfcef0e4c24"
          />
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestAmazon}
            disabled={testingAmazon}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Amazon SP-API Bağlantısını Ve İzinlerini Test Et"
          >
            <CheckCircle2 className={`h-3.5 w-3.5 text-indigo-600 ${testingAmazon ? 'animate-spin' : ''}`} />
            <span>{testingAmazon ? (lang === 'tr' ? 'Test Ediliyor...' : 'Testing...') : (lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test Connection')}</span>
          </button>

          <button 
            type="button"
            onClick={handleSyncOrders}
            disabled={amazonSync.isSyncing}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${amazonSync.isSyncing ? 'animate-spin' : ''}`} />
            <span>{amazonSync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
          </button>

          <button 
            type="button"
            onClick={handleMatchAmazonListings}
            disabled={amazonMatching}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Amazon İlanlarını Paneldeki Ürünler ile Eşleştir veya Eksikleri Aktar"
          >
            <Layers className={`h-3.5 w-3.5 text-amber-700 ${amazonMatching ? 'animate-spin' : ''}`} />
            <span>{amazonMatching ? (lang === 'tr' ? 'Eşleştiriliyor...' : 'Matching...') : (lang === 'tr' ? 'İlanları Eşleştir' : 'Match Listings')}</span>
          </button>

          <button 
            type="button"
            onClick={handleBulkSyncAmazon}
            disabled={bulkSyncingAmazon}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Tüm Ürünlerin Stok ve Fiyatlarını Amazon SP-API ile Eşitle"
          >
            <UploadCloud className={`h-3.5 w-3.5 text-emerald-600 ${bulkSyncingAmazon ? 'animate-spin' : ''}`} />
            <span>{bulkSyncingAmazon ? (lang === 'tr' ? 'Güncelleniyor...' : 'Syncing...') : (lang === 'tr' ? 'Stok & Fiyat Gönder' : 'Push Inventory')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setSelectedMappingMarketplace('amazon');
              setCategoryMappingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowAmazonGuideModal(true)}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>{lang === 'tr' ? 'SP-API Kurulum Rehberi' : 'SP-API Setup Guide'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isAmazonConnected && (
            <button 
              type="button"
              onClick={handleDisconnectAmazon}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {t.disconnect || "Bağlantıyı Kes"}
            </button>
          )}

          <button 
            type="button"
            onClick={handleSaveAmazonSettings}
            id="amazon-save-connect-btn"
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs transition-all cursor-pointer"
          >
            {isAmazonConnected ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'tr' ? '✓ Amazon Hesabı Bağlı (Güncelle)' : '✓ Amazon Connected (Update)'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-300" />
                <span>{lang === 'tr' ? 'Amazon Hesabını Kaydet' : 'Save Amazon Settings'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [showAdvancedCentralKeys, setShowAdvancedCentralKeys] = useState(false);

  const handleStartOAuth = () => {
    const appId = amazonAppId || "amzn1.sp.solution.d6950e6e-a94f-4d43-a258-a6e0cbd2d3e9";
    const statePayload = btoa(JSON.stringify({ slug: branding?.slug || "gap", storeId: branding?.id || 1 }));
    const oauthUrl = `https://sellercentral.amazon.com.tr/apps/authorize/consent?application_id=${encodeURIComponent(appId)}&state=${encodeURIComponent(statePayload)}&version=beta`;
    window.open(oauthUrl, 'AmazonOAuthPopup', 'width=720,height=760');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4" id="amazon-integration-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center font-black text-amber-700 text-xs tracking-tighter">
            AMZ
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.amazonIntegration || "Amazon SP-API Entegrasyonu"}</h3>
            <p className="text-xs text-slate-500">{t.amazonIntegrationDesc || "LookPrice Merkezi SP-API OAuth 2.0 ile sipariş ve envanter yönetimi"}</p>
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

      {/* Primary 1-Click OAuth Banner for Stores */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              LookPrice Merkezi OAuth 2.0
            </span>
            <span className="text-xs font-bold text-white">
              {lang === 'tr' ? 'Tek Tıkla Mağaza Yetkilendirmesi' : '1-Click Store OAuth Authorization'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed max-w-2xl">
            {lang === 'tr'
              ? "Seller Central üzerinde uygulama açmanıza veya API anahtarı oluşturmanıza gerek yoktur. Sağdaki butona tıklayarak Amazon mağazanızdan LookPrice entegratör uygulamasına onay verdiğinizde Satıcı Kimliğiniz (Seller ID) ve Yetki Anahtarınız (Refresh Token) otomatik olarak tanımlanır."
              : "No developer app setup required. Click the button to authorize LookPrice in Seller Central and automatically link your Seller ID and Refresh Token."}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartOAuth}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>⚡ {isAmazonConnected ? (lang === 'tr' ? 'Amazon OAuth Yetkisini Yenile' : 'Renew Amazon OAuth') : (lang === 'tr' ? 'Amazon İle Tek Tıkla Bağlan (OAuth)' : 'Connect with Amazon (OAuth)')}</span>
          </button>
        </div>
      </div>

      {/* Store Specific OAuth Fields (Auto-filled via OAuth or Editable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Amazon Seller ID (Merchant Token) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>{t.amazonSellerId || "Mağaza Satıcı Kimliği (Seller ID / Merchant Token)"}</span>
            </label>
            <span className="text-[10px] text-emerald-600 font-medium">OAuth ile Otomatik Gelir</span>
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
            placeholder="Örn: A2M0PNCK7GMIY6 (OAuth sonrası otomatik dolar)"
          />
        </div>

        {/* SP-API Refresh Token */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <span>Mağaza Yetki Anahtarı (OAuth Refresh Token)</span>
            </label>
            <span className="text-[10px] text-emerald-600 font-medium">OAuth ile Otomatik Gelir</span>
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
              placeholder="Atzr|IQEBLzAtAhUA... (OAuth sonrası otomatik dolar)"
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
      </div>

      {/* Collapsible Advanced / Central LookPrice SP-API App Credentials */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/40">
        <button
          type="button"
          onClick={() => setShowAdvancedCentralKeys(!showAdvancedCentralKeys)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-700">
              {lang === 'tr' ? '⚙️ Gelişmiş: LookPrice Merkezi Entegratör (SP-API) Parametreleri' : '⚙️ Advanced: LookPrice Central Integrator Parameters'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
              {lang === 'tr' ? 'Merkezi Sistem Tarafından Yönetilir' : 'Managed Centrally'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {showAdvancedCentralKeys ? (lang === 'tr' ? 'Gizle ▲' : 'Hide ▲') : (lang === 'tr' ? 'Göster ▼' : 'Show ▼')}
          </span>
        </button>

        {showAdvancedCentralKeys && (
          <div className="p-3.5 border-t border-slate-200/80 bg-white space-y-3.5">
            {/* Sandbox & Production Environment Selector */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${amazonIsSandbox ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {amazonIsSandbox ? 'SP-API Sandbox (Test) Modu' : 'Canlı (Production) Modu Aktif'}
                </span>
              </div>
              <div className="flex items-center gap-2">
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
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer border ${
                    amazonIsSandbox ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {amazonIsSandbox ? '✓ Sandbox Aktif' : 'Sandbox Moduna Al'}
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
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer border ${
                    !amazonIsSandbox ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  {!amazonIsSandbox ? '✓ Canlı (Prod) Aktif' : 'Canlı Moda Geç'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* LWA Client ID */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  LookPrice LWA Client ID
                </label>
                <input 
                  type="text" 
                  id="amz-client-id-input"
                  name="amz_client_id_no_autofill"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-8.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
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
                  placeholder="Merkezi sistemden otomatik alınır"
                />
              </div>

              {/* LWA Client Secret */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  LookPrice LWA Client Secret
                </label>
                <div className="relative">
                  <input 
                    type={showAmazonSecret ? "text" : "password"} 
                    id="amz-client-secret-input"
                    name="amz_client_secret_no_autofill"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full h-8.5 px-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
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
                    placeholder="Merkezi sistemden otomatik alınır"
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

              {/* Amazon App ID (Solution ID) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  LookPrice SP-API App ID (Solution ID)
                </label>
                <input 
                  type="text" 
                  id="amz-app-id-input"
                  name="amz_app_id_no_autofill"
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full h-8.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
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
                  placeholder="amzn1.sp.solution.d6950e6e-a94f-4d43-a258-a6e0cbd2d3e9"
                />
              </div>
            </div>
          </div>
        )}
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

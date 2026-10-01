import React, { useState } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCheck, 
  Save, 
  Eye, 
  EyeOff,
  Store,
  Layers,
  Loader2
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
  n11ShipmentTemplate: string;
  setN11ShipmentTemplate: (val: string) => void;
  n11PreparingDay: number;
  setN11PreparingDay: (val: number) => void;
  testingN11?: boolean;
  n11LiveCount?: number;
  n11ErrCount?: number;
  handleTestN11: () => void;
  handleSyncN11Orders: (days?: number) => void;
  handleDisconnectN11: () => void;
  handleSaveN11Settings: () => void;
  setListingsModalTab?: (tab: any) => void;
  setShowListingsModal?: (show: boolean) => void;
  setSelectedMappingMarketplace?: (m: any) => void;
  setCategoryMappingModalOpen?: (open: boolean) => void;
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
  n11ShipmentTemplate,
  setN11ShipmentTemplate,
  n11PreparingDay,
  setN11PreparingDay,
  testingN11 = false,
  n11LiveCount = 0,
  n11ErrCount = 0,
  handleTestN11,
  handleSyncN11Orders,
  handleDisconnectN11,
  handleSaveN11Settings,
  setListingsModalTab,
  setShowListingsModal,
  setSelectedMappingMarketplace,
  setCategoryMappingModalOpen,
  n11Sync
}) => {
  const [showN11Secret, setShowN11Secret] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string | number>("routine");

  const mappedCatCount = Object.keys(branding.n11_settings?.categoryMappings || {}).length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4" id="n11-integration-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200/70 flex items-center justify-center font-black text-red-600 text-xs tracking-tighter">
            N11
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t.n11Integration || "N11 Entegrasyonu"}</h3>
            <p className="text-xs text-slate-500">{t.n11IntegrationDesc || "N11 SOAP Web Servisi & Ürün/Kategori Kataloğu"}</p>
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

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {lang === 'tr' ? 'N11 Teslimat Şablonu (Kargo Şablon Adı)' : 'N11 Delivery Template'}
          </label>
          <input 
            type="text" 
            id="n11-shipment-template-input"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs text-slate-900 transition-colors"
            value={n11ShipmentTemplate}
            onChange={(e) => {
              const val = e.target.value;
              setN11ShipmentTemplate(val);
              onBrandingChange('n11_settings', {
                ...(branding.n11_settings || {}),
                shipmentTemplate: val
              });
            }}
            placeholder={lang === 'tr' ? "Örn: Alıcı Öder, Mağaza Öder veya YurtiçiKargo" : "e.g. Alıcı Öder"}
          />
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            {lang === 'tr' 
              ? "N11 Mağaza panelinizdeki kargo şablonu adı ile BİREBİR AYNI olmalıdır." 
              : "Must exactly match the shipment template name in your N11 merchant panel."}
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {lang === 'tr' ? 'Kargoya Hazırlama Süresi (Hazırlık Günü)' : 'Preparing Days (Shipment Lead Time)'}
          </label>
          <select 
            id="n11-preparing-day-select"
            className="w-full h-9 px-3 bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 rounded-lg text-xs text-slate-900 cursor-pointer transition-colors"
            value={n11PreparingDay}
            onChange={(e) => {
              const val = Number(e.target.value);
              setN11PreparingDay(val);
              onBrandingChange('n11_settings', {
                ...(branding.n11_settings || {}),
                preparingDay: val
              });
            }}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day} {lang === 'tr' ? 'İş Günü' : 'Business Day(s)'}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            {lang === 'tr' 
              ? "Ürünün sipariş alındıktan sonra kargoya verilme süresidir." 
              : "The time required to ship the product after receiving an order."}
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleTestN11}
            disabled={testingN11}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {testingN11 ? (
              <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>{testingN11 ? (lang === 'tr' ? 'Test Ediliyor...' : 'Testing...') : (lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test API')}</span>
          </button>

          <div className="inline-flex items-center border border-slate-200/90 rounded-lg overflow-hidden shadow-xs h-8.5 bg-white">
            <select
              value={selectedDays}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDays(val === "routine" ? "routine" : Number(val));
              }}
              disabled={n11Sync.isSyncing}
              className="h-full px-2 bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer border-r border-slate-100"
              title={lang === 'tr' ? "Senkronize edilecek gün sayısı" : "Sync period in days"}
            >
              <option value="routine">{lang === 'tr' ? 'Anlık Siparişler (Rutin Yeni)' : 'Instant Orders (Routine New)'}</option>
              <option value={1}>{lang === 'tr' ? 'Son 1 Gün' : 'Last 1 Day'}</option>
              <option value={3}>{lang === 'tr' ? 'Son 3 Gün (Test)' : 'Last 3 Days (Test)'}</option>
              <option value={5}>{lang === 'tr' ? 'Son 5 Gün' : 'Last 5 Days'}</option>
              <option value={15}>{lang === 'tr' ? 'Son 15 Gün' : 'Last 15 Days'}</option>
              <option value={30}>{lang === 'tr' ? 'Son 30 Gün' : 'Last 30 Days'}</option>
            </select>

            <button 
              type="button"
              onClick={() => handleSyncN11Orders(selectedDays === "routine" ? undefined : Number(selectedDays))}
              disabled={n11Sync.isSyncing}
              className="inline-flex items-center gap-1.5 h-full px-3 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${n11Sync.isSyncing ? 'animate-spin' : ''}`} />
              <span>{n11Sync.isSyncing ? t.loading : (lang === 'tr' ? 'Siparişleri Çek' : 'Sync Orders')}</span>
            </button>
          </div>

          {setListingsModalTab && setShowListingsModal && (
            <button 
              type="button"
              onClick={() => {
                setListingsModalTab('n11');
                setShowListingsModal(true);
              }}
              id="n11-view-listings-btn"
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-900 border border-red-200/90 shadow-xs transition-colors cursor-pointer"
              title={lang === 'tr' ? "N11'de Satışta Olan ve Hata Alan Ürünleri Listele" : "List active and failed N11 products"}
            >
              <Store className="h-3.5 w-3.5 text-red-600" />
              <span>{lang === 'tr' ? 'İlanlar & Hatalar' : 'Listings & Errors'}</span>
              {n11LiveCount > 0 && (
                <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                  {n11LiveCount}
                </span>
              )}
              {n11ErrCount > 0 && (
                <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                  {n11ErrCount}
                </span>
              )}
            </button>
          )}

          {setSelectedMappingMarketplace && setCategoryMappingModalOpen && (
            <button 
              type="button"
              onClick={() => {
                setSelectedMappingMarketplace('n11');
                setCategoryMappingModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{lang === 'tr' ? 'Kategori & Nitelik Eşle' : 'Category Mapping'}</span>
              {mappedCatCount > 0 && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md border border-slate-200">
                  {mappedCatCount}
                </span>
              )}
            </button>
          )}
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

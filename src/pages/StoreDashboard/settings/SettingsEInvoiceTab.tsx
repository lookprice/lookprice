import React, { useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../services/api";

interface SettingsEInvoiceTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
}

export const SettingsEInvoiceTab = ({
  branding,
  onBrandingChange,
  lang
}: SettingsEInvoiceTabProps) => {
  const [testingEInvoice, setTestingEInvoice] = useState(false);

  const handleTestEInvoice = async () => {
    setTestingEInvoice(true);
    try {
      const res = await api.testEInvoiceConnection();
      if (res.error) throw new Error(res.error);
      alert(res.message || (lang === 'tr' ? "Bağlantı başarılı!" : "Connection successful!"));
    } catch (error: any) {
      alert(error.message || (lang === 'tr' ? "Bağlantı hatası!" : "Connection error!"));
    } finally {
      setTestingEInvoice(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{lang === 'tr' ? 'Resmi Belge & E-Fatura' : 'Official Docs & E-Invoice'}</h3>
            <p className="text-xs text-slate-500 mt-1">{lang === 'tr' ? 'E-Fatura sistemini açıp kapatın ve entegratör ayarlarınızı yapın.' : 'Enable/disable e-invoice system and configure your integrator.'}</p>
          </div>
        </div>

        {/* Toggle System */}
        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <h4 className="font-bold text-slate-800 font-sans">{lang === 'tr' ? 'E-Fatura Sistemi Aktif' : 'E-Invoice System Active'}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">{lang === 'tr' ? 'Eğer bu ülkede/mağazada e-fatura kullanmıyorsanız kapalı tutun.' : 'Keep this disabled if you do not use e-invoices in your country/store.'}</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding?.einvoice_settings?.is_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
            onClick={() => {
              const currentParams = branding?.einvoice_settings || { provider: 'none' };
              onBrandingChange('einvoice_settings', { ...currentParams, is_active: !currentParams.is_active });
            }}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding?.einvoice_settings?.is_active ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
          </button>
        </div>

        {branding?.einvoice_settings?.is_active && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'Entegratör (Servis Sağlayıcı)' : 'Integrator (Provider)'}</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-medium cursor-pointer"
                value={branding.einvoice_settings.provider || 'none'}
                onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, provider: e.target.value })}
              >
                <option value="none">-- {lang === 'tr' ? 'Seçiniz' : 'Select'} --</option>
                <option value="mysoft">MySoft</option>
                <option value="diyalogo">Diyalogo (Yakında)</option>
              </select>
            </div>
            
            {branding.einvoice_settings.provider === 'mysoft' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'MySoft Kimlik Bilgileri' : 'MySoft Credentials'}</h4>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">MySoft E-Fatura API URL (Opsiyonel)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                    placeholder="https://edocumentapi.mysoft.com.tr/api"
                    value={branding.einvoice_settings.api_url || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_url: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'tr' 
                      ? 'Önemli: iysapi.mysoft.com.tr adresi IYS izinleri içindir, e-fatura için kullanılamaz. Özel bir adresiniz yoksa boş bırakın.' 
                      : 'Important: iysapi.mysoft.com.tr is for IYS permissions, not for e-invoice. Leave blank if you don\'t have a custom address.'}
                  </p>
                </div>

                {/* User & Auth */}
                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Kullanıcı Adı' : 'MySoft Username'}</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                     placeholder="Kullanıcı adınızı girin"
                     value={branding.einvoice_settings.username || ''}
                     onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, username: e.target.value })}
                   />
                 </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{lang === 'tr' ? 'MySoft Şifre' : 'MySoft Password'}</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                    placeholder="••••••••"
                    value={branding.einvoice_settings.password || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, password: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleTestEInvoice}
                    disabled={testingEInvoice}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer ${testingEInvoice ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:shadow-md active:scale-95'}`}
                  >
                    {testingEInvoice ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {lang === 'tr' ? 'Bağlantı Test Ediliyor...' : 'Testing Connection...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        {lang === 'tr' ? 'Bağlantıyı Test Et' : 'Test Connection'}
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma Resmi VKN / TCKN (10/11 Hane) *</label>
                    <input 
                      type="text" 
                      maxLength={11}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold border-indigo-200 ring-2 ring-indigo-500/5"
                      placeholder="Örn: 1234567890"
                      value={branding.einvoice_settings.vkn || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, vkn: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Firma Resmi Vergi Dairesi</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                      placeholder="Örn: Kadıköy"
                      value={branding.einvoice_settings.tax_office || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tax_office: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Kullanıcı ID (Tenant ID)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                      placeholder="Örn: 210"
                      value={branding.einvoice_settings.tenant_id || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tenant_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Connector GUID (MySoft)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                      placeholder="Örn: 00000000-0000-0000-0000-000000000000"
                      value={branding.einvoice_settings.connector_guid || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, connector_guid: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv UUID (GİB)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm font-sans font-semibold"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={branding.einvoice_settings.earchive_uuid || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_uuid: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Token / API Key (Statik)</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                    placeholder="Statik bir tokeniniz varsa girin (Opsiyonel)"
                    value={branding.einvoice_settings.api_token || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_token: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'GİB Etiket (Alias) Posta Kutuları' : 'GIB URN Alias Mailboxes'}</h4>
                  <p className="text-xs text-slate-500 mb-4">{lang === 'tr' ? 'Fatura paketlerinin (UBL) içine yazılacak resmi GİB gönderici ve alıcı etiketleriniz.' : 'Official URNs injected into the invoice XML payload.'}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Gönderici Birim Alias (GB)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                    placeholder="urn:mail:faturagb@firma.com"
                    value={branding.einvoice_settings.sender_alias || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, sender_alias: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Posta Kutusu Alias (PK)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                    placeholder="urn:mail:faturapk@firma.com"
                    value={branding.einvoice_settings.receiver_alias || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, receiver_alias: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Kullanıcı Adı</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm"
                    placeholder="gapbilisim"
                    value={branding.einvoice_settings.earchive_username || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_username: e.target.value })}
                  />
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">{lang === 'tr' ? 'Fatura Ön Ek (Seri) Ayarları' : 'Invoice Prefix Series'}</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Fatura Ön Eki (Örn: GAP)</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                    placeholder="GAP"
                    value={branding.einvoice_settings.einvoice_prefix || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, einvoice_prefix: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Arşiv Ön Eki (Örn: GEA)</label>
                  <input 
                    type="text" 
                    maxLength={3}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none text-sm uppercase"
                    placeholder="GEA"
                    value={branding.einvoice_settings.earchive_prefix || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_prefix: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

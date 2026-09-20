import React, { useState } from "react";
import { Building2, RefreshCw, FileCheck2, ShieldCheck, Tag, Key, Save, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../services/api";

interface SettingsEInvoiceTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  onSaveBranding?: () => void;
  savingBranding?: boolean;
}

export const SettingsEInvoiceTab = ({
  branding,
  onBrandingChange,
  lang,
  onSaveBranding,
  savingBranding
}: SettingsEInvoiceTabProps) => {
  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const [testingEInvoice, setTestingEInvoice] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'integrator' | 'gib' | 'prefixes'>('integrator');

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

  const isActive = !!branding?.einvoice_settings?.is_active;
  const isEWaybillActive = !!branding?.einvoice_settings?.is_ewaybill_active;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-4 pb-12"
    >
      {/* Top Header Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{txt('Resmi Belge & E-Fatura / E-İrsaliye', 'Official Docs & E-Invoice / E-Waybill', 'Επίσημα Έγγραφα & Ηλ. Τιμολόγιο')}</span>
              {isActive && (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {txt('Sistem Aktif', 'System Active', 'Ενεργό')}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {txt('GİB e-Fatura, e-Arşiv ve e-İrsaliye entegratör kimlik ve seri ayarları.', 'GIB e-Invoice, e-Archive & e-Waybill integrator credentials & prefixes.', 'Ρυθμίσεις e-Invoice & e-Archive.')}
            </p>
          </div>
        </div>

        {onSaveBranding && (
          <button
            type="button"
            onClick={onSaveBranding}
            disabled={savingBranding}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ml-auto"
          >
            {savingBranding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{txt('Kaydediliyor...', 'Saving...', 'Aποθήκευση...')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{txt('Ayarları Kaydet', 'Save Settings', 'Αποθήκευση')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* System Toggle Toggles Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{txt('E-Fatura Sistemi Aktif', 'E-Invoice System Active', 'Ενεργό Ηλ. Τιμολόγιο')}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{txt('Resmi GİB faturalandırma modülünü etkinleştirir.', 'Enables official GIB invoicing module.', 'Ενεργοποιεί την επίσημη τιμολόγηση.')}</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            onClick={() => {
              const currentParams = branding?.einvoice_settings || { provider: 'none' };
              onBrandingChange('einvoice_settings', { ...currentParams, is_active: !currentParams.is_active });
            }}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{txt('E-İrsaliye Sistemi Aktif', 'E-Waybill System Active', 'Ενεργό Ηλ. Δελτίο')}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{txt('Sevk irsaliyesi resmi belgelendirme modülü.', 'Shipment waybill official document module.', 'Ενεργοποιεί το δελτίο αποστολής.')}</p>
          </div>
          <button
            type="button"
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isEWaybillActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            onClick={() => {
              const currentParams = branding?.einvoice_settings || { provider: 'none' };
              onBrandingChange('einvoice_settings', { ...currentParams, is_ewaybill_active: !currentParams.is_ewaybill_active });
            }}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isEWaybillActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Main Form Area (If Active) */}
      {isActive && (
        <div className="space-y-3">
          {/* Sub-Nav Pill Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSubTab('integrator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'integrator'
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>{txt('Entegratör', 'Integrator', 'Πάροχος')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('gib')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'gib'
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{txt('GİB Kutusu', 'GIB Aliases', 'GIB Ταχυδρομείο')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('prefixes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeSubTab === 'prefixes'
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{txt('Seriler', 'Series', 'Σειρές')}</span>
              </button>
            </div>

            {branding?.einvoice_settings?.provider === 'mysoft' && (
              <button
                type="button"
                onClick={handleTestEInvoice}
                disabled={testingEInvoice}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shadow-2xs cursor-pointer border shrink-0 ${
                  testingEInvoice
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingEInvoice ? 'animate-spin' : ''}`} />
                <span>{testingEInvoice ? txt('Test Ediliyor...', 'Testing...', 'Δοκιμή...') : txt('Bağlantıyı Test Et', 'Test Connection', 'Δοκιμή Σύνδεσης')}</span>
              </button>
            )}
          </div>

          {/* SUB-TAB 1: INTEGRATOR & CREDENTIALS */}
          {activeSubTab === 'integrator' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('Entegratör Servis Sağlayıcı', 'Integrator Provider', 'Πάροχος')}
                  </label>
                  <select 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                    value={branding.einvoice_settings?.provider || 'none'}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, provider: e.target.value })}
                  >
                    <option value="none">-- {txt('Seçiniz', 'Select', 'Επιλέξτε')} --</option>
                    <option value="mysoft">MySoft (Resmi Entegratör)</option>
                    <option value="diyalogo">{txt('Diyalogo (Yakında)', 'Diyalogo (Coming Soon)', 'Diyalogo (Σύντομα)')}</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    MySoft E-Fatura API URL (Opsiyonel)
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                    placeholder="https://edocumentapi.mysoft.com.tr/api"
                    value={branding.einvoice_settings?.api_url || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_url: e.target.value })}
                  />
                </div>
              </div>

              {branding.einvoice_settings?.provider === 'mysoft' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {txt('Kullanıcı Adı', 'Username', 'Όνομα Χρήστη')}
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                      placeholder="MySoft Kullanıcı Adı"
                      value={branding.einvoice_settings?.username || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {txt('Şifre', 'Password', 'Κωδικός')}
                    </label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                      placeholder="••••••••"
                      value={branding.einvoice_settings?.password || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Resmi VKN / TCKN *
                    </label>
                    <input 
                      type="text" 
                      maxLength={11}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                      placeholder="10 veya 11 Hane"
                      value={branding.einvoice_settings?.vkn || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, vkn: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Vergi Dairesi
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                      placeholder="Örn: Kadıköy V.D."
                      value={branding.einvoice_settings?.tax_office || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tax_office: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tenant ID (User ID)
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                      placeholder="Örn: 210"
                      value={branding.einvoice_settings?.tenant_id || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, tenant_id: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Connector GUID
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                      placeholder="GUID Numarası"
                      value={branding.einvoice_settings?.connector_guid || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, connector_guid: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      E-Arşiv UUID (GİB)
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                      placeholder="UUID Numarası"
                      value={branding.einvoice_settings?.earchive_uuid || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_uuid: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Statik Token / API Key
                    </label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                      placeholder="Statik Token (Opsiyonel)"
                      value={branding.einvoice_settings?.api_token || ''}
                      onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, api_token: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: GIB POSTA KUTULARI (GB/PK) */}
          {activeSubTab === 'gib' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {txt('GİB Etiket (Alias) URN Posta Kutuları', 'GIB Mailbox URN Aliases', 'GIB Ταχυδρομεία')}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {txt('Fatura UBL paketine işlenecek resmi GİB gönderici (GB) ve alıcı (PK) adresleri.', 'Official GIB URN addresses embedded into invoice UBL XML data.', 'Επίσημες διευθύνσεις GIB.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('Gönderici Birim Alias (GB)', 'Sender Unit Alias (GB)', 'Alias Αποστολέα (GB)')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                    placeholder="urn:mail:faturagb@firma.com"
                    value={branding.einvoice_settings?.sender_alias || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, sender_alias: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('Posta Kutusu Alias (PK)', 'Mailbox Alias (PK)', 'Alias Ταχυδρομείου (PK)')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                    placeholder="urn:mail:faturapk@firma.com"
                    value={branding.einvoice_settings?.receiver_alias || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, receiver_alias: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('E-Arşiv Kullanıcı Adı', 'E-Archive Username', 'Όνομα Ε-Αρχείου')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none"
                    placeholder="E-Arşiv Kullanıcı Adı"
                    value={branding.einvoice_settings?.earchive_username || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_username: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: PREFIXES & SERIES */}
          {activeSubTab === 'prefixes' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {txt('Resmi Fatura Seri & Ön Ek Kodları', 'Invoice Prefix Series Codes', 'Σειρές & Προθέματα Τιμολογίων')}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {txt('GİB tarafından firmanıza tanımlanan 3 haneli seri harf kodları (Örn: GAP, GEA).', '3-letter series codes allocated by GIB (e.g. GAP, GEA).', '3-ψήφιοι κωδικοί σειρών GIB.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('E-Fatura Ön Eki (3 Harf)', 'E-Invoice Prefix (3 Chars)', 'Πρόθεμα Ηλ. Τιμολογίου')}
                  </label>
                  <input 
                    type="text" 
                    maxLength={3}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase outline-none"
                    placeholder="GAP"
                    value={branding.einvoice_settings?.einvoice_prefix || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, einvoice_prefix: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {txt('E-Arşiv Ön Eki (3 Harf)', 'E-Archive Prefix (3 Chars)', 'Πρόθεμα Ηλ. Αρχείου')}
                  </label>
                  <input 
                    type="text" 
                    maxLength={3}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase outline-none"
                    placeholder="GEA"
                    value={branding.einvoice_settings?.earchive_prefix || ''}
                    onChange={(e) => onBrandingChange('einvoice_settings', { ...branding.einvoice_settings, earchive_prefix: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

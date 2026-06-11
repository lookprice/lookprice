import React from "react";
import { CreditCard, Truck, Building2, Cpu } from "lucide-react";
import { motion } from "motion/react";

interface SettingsPosTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
}

export const SettingsPosTab = ({
  branding,
  onBrandingChange,
  lang
}: SettingsPosTabProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Online Payment Gateways */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Gateways'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{lang === 'tr' ? 'Online Tahsilat Seçenekleri' : 'Online Collection Options'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cash on Delivery */}
          <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-sans">{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Nakit veya Kart' : 'Cash or Card'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), cod_enabled: !branding.payment_settings?.cod_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.payment_settings?.cod_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.cod_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
            </button>
          </div>

          {/* Bank Transfer */}
          <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">{lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer / EFT'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'IBAN ile Ödeme' : 'Payment via IBAN'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_transfer_enabled: !branding.payment_settings?.bank_transfer_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.payment_settings?.bank_transfer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.bank_transfer_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>
            {branding.payment_settings?.bank_transfer_enabled && (
              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'BANKA HESAP BİLGİLERİ' : 'BANK ACCOUNT DETAILS'}</label>
                <textarea 
                  className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none"
                  placeholder={lang === 'tr' ? 'IBAN, Banka Adı ve Alıcı ismini buraya yazın...' : 'Write IBAN, Bank Name and Receiver name here...'}
                  value={branding.payment_settings?.bank_details || ''}
                  onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), bank_details: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">PayPal</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>
            {branding.payment_settings?.paypal_enabled && (
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">PayPal Client ID</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none font-sans"
                    value={branding.payment_settings?.paypal_client_id || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_client_id: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payoneer */}
          <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Payoneer</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Global Ödeme' : 'Global Payment'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_enabled: !branding.payment_settings?.payoneer_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.payment_settings?.payoneer_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.payoneer_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>
            {branding.payment_settings?.payoneer_enabled && (
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payoneer Account Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none font-sans"
                    value={branding.payment_settings?.payoneer_email || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), payoneer_email: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Iyzico */}
          <div className={`p-5 rounded-2xl border transition-all ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans">Iyzico Sanal POS</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{lang === 'tr' ? 'Güvenli Kredi Kartı' : 'Secure Credit Card'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.payment_settings?.iyzico_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>
            {branding.payment_settings?.iyzico_enabled && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none font-sans"
                    value={branding.payment_settings?.iyzico_api_key || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/5 outline-none font-sans"
                    value={branding.payment_settings?.iyzico_secret_key || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_secret_key: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'Mod' : 'Mode'}</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    value={branding.payment_settings?.iyzico_sandbox ? 'true' : 'false'}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_sandbox: e.target.value === 'true' })}
                  >
                    <option value="true">Sandbox (Test)</option>
                    <option value="false">Production (Live)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POS Bridge Configuration */}
      <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-slate-900 rounded-2xl text-indigo-400 border border-slate-800">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white leading-tight tracking-tight font-sans">POS Köprüsü</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Cihaz Entegrasyonu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onBrandingChange('pos_bridge_enabled', !branding.pos_bridge_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${branding.pos_bridge_enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${branding.pos_bridge_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${branding.pos_bridge_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Köprü IP Adresi</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="192.168.1.XX"
                  value={branding.pos_bridge_ip || ''}
                  onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Port</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500:/50 transition-all font-sans"
                placeholder="8080"
                value={branding.pos_bridge_port || ''}
                onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed font-sans">
                  {lang === 'tr' 
                    ? 'LookPrice POS Köprüsü, yerel ağınızdaki fiziksel POS cihazları ile bulut sistemi arasında güvenli bir bağlantı kurar. Bu ayar aktif olduğunda, yapılan satışlar otomatik olarak fiziksel terminale gönderilir.'
                    : 'LookPrice POS Bridge establishes a secure connection between physical POS devices on your local network and the cloud system.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

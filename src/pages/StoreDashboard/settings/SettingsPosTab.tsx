import React, { useState } from "react";
import { CreditCard, Truck, Building2, Cpu, Hotel, Banknote, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { HotelUpgradeModal } from "../../../components/modals/HotelUpgradeModal";

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
  const [isHotelUpgradeModalOpen, setIsHotelUpgradeModalOpen] = useState(false);
  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Hotel & Room Module Toggle (Horeca Only) */}
      {isCafeRestaurant && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-indigo-800/80 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-800/60 rounded-2xl text-amber-400 border border-indigo-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-white leading-tight tracking-tight">Otel & Oda Adisyonu Entegrasyonu</h3>
                  {!branding.hotel_license_enabled && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                      {lang === 'tr' ? '🔒 Üst Paket Gerekir' : '🔒 Upgrade Required'}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${branding.hotel_module_enabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                    {branding.hotel_module_enabled ? 'Otel & Restoran Hibrit (Aktif)' : 'Sadece Restoran / Kafe'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 font-medium mt-1">
                  Butik otel & restoran karma işletmeleri için oda yönetimi, restorandan odaya adisyon aktarımı, oda doluluğu ve yaşa göre otomatik indirim desteği.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!branding.hotel_license_enabled && (
                <button
                  type="button"
                  onClick={() => setIsHotelUpgradeModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {lang === 'tr' ? 'Paket Yükselt' : 'Upgrade'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!branding.hotel_module_enabled && !branding.hotel_license_enabled) {
                    setIsHotelUpgradeModalOpen(true);
                    return;
                  }
                  onBrandingChange('hotel_module_enabled', !branding.hotel_module_enabled);
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.hotel_module_enabled ? 'bg-amber-400' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-slate-950 transition-transform ${branding.hotel_module_enabled ? 'translate-x-[1.5rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      <HotelUpgradeModal
        isOpen={isHotelUpgradeModalOpen}
        onClose={() => setIsHotelUpgradeModalOpen(false)}
        lang={lang}
        storeName={branding.store_name || branding.name}
      />

      {/* Online Payment Gateways & Reservation Methods */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                  {lang === 'tr' ? 'Ödeme Yöntemleri' : 'Payment Gateways'}
                </h3>
                {(isCafeRestaurant || branding.hotel_module_enabled) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    {lang === 'tr' ? 'Rezervasyon & Adisyon' : 'Booking & POS'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {lang === 'tr' ? 'Online Tahsilat & Web Sitesi Seçenekleri' : 'Online Collection & Storefront Options'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Cash on Delivery / Pay at Hotel */}
          {(() => {
            const isCodActive = branding.payment_settings?.cod_enabled !== false && branding.payment_settings?.hotel_pay_at_hotel_enabled !== false;
            return (
              <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isCodActive ? 'bg-amber-50/30 border-amber-200/70 shadow-xs' : 'bg-slate-50/50 border-slate-100 opacity-80'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl border ${isCodActive ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {(isCafeRestaurant || branding.hotel_module_enabled) ? <Banknote className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        {(isCafeRestaurant || branding.hotel_module_enabled)
                          ? (lang === 'tr' ? 'Otelde / Kapıda Ödeme (Resepsiyon)' : 'Pay at Hotel / Cash on Delivery (Front Desk)')
                          : (lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery')}
                      </h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isCodActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {isCodActive ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {(isCafeRestaurant || branding.hotel_module_enabled)
                        ? (lang === 'tr' ? 'Otel rezervasyonlarında girişte resepsiyonda veya sipariş tesliminde nakit/kart ile tahsilat.' : 'Cash or card collection at front desk check-in or delivery.')
                        : (lang === 'tr' ? 'Nakit veya POS Cihazı ile Kapıda Ödeme' : 'Cash or Card on Delivery')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isCodActive;
                    onBrandingChange('payment_settings', {
                      ...(branding.payment_settings || {}),
                      cod_enabled: nextVal,
                      hotel_pay_at_hotel_enabled: nextVal
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCodActive ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCodActive ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
            );
          })()}

          {/* 2. Bank Transfer / EFT */}
          {(() => {
            const isBankActive = branding.payment_settings?.bank_transfer_enabled !== false && branding.payment_settings?.hotel_bank_transfer_enabled !== false;
            return (
              <div className={`p-5 rounded-2xl border transition-all ${isBankActive ? 'bg-indigo-50/30 border-indigo-200/70 shadow-xs' : 'bg-slate-50/50 border-slate-100 opacity-80'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border ${isBankActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 font-sans">
                          {lang === 'tr' ? 'Banka Havalesi / EFT' : 'Bank Transfer / EFT'}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isBankActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {isBankActive ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        {(isCafeRestaurant || branding.hotel_module_enabled)
                          ? (lang === 'tr' ? 'IBAN ile Ödeme (Web sitesi oda rezervasyonu ön ödemeleri ve online siparişler için)' : 'Payment via IBAN (For room reservations & online orders)')
                          : (lang === 'tr' ? 'IBAN ile Ödeme' : 'Payment via IBAN')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isBankActive;
                      onBrandingChange('payment_settings', {
                        ...(branding.payment_settings || {}),
                        bank_transfer_enabled: nextVal,
                        hotel_bank_transfer_enabled: nextVal
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isBankActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBankActive ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
                  </button>
                </div>
                {isBankActive && (
                  <div className="mt-4 space-y-2 border-t border-indigo-100/80 pt-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                      <span>{lang === 'tr' ? 'BANKA HESAP VE IBAN BİLGİLERİ' : 'BANK ACCOUNT & IBAN DETAILS'}</span>
                      <span className="text-[9px] text-indigo-600 font-bold lowercase">(web sitesinde misafirlere gösterilir)</span>
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                      placeholder={lang === 'tr' ? 'Örn: Ziraat Bankası - TR12 0001 0000 0000 0000 0000 00 - Alıcı: İşletme Adı (Açıklamaya Sipariş / Rezervasyon Kodunu Yazınız)' : 'e.g. Bank Name - IBAN - Account Name...'}
                      value={branding.payment_settings?.bank_details || branding.payment_settings?.hotel_bank_details || ''}
                      onChange={(e) => onBrandingChange('payment_settings', {
                        ...(branding.payment_settings || {}),
                        bank_details: e.target.value,
                        hotel_bank_details: e.target.value
                      })}
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Direct Credit Card (Online / Sanal POS) */}
          {(() => {
            const isCardActive = branding.payment_settings?.credit_card_enabled !== false && branding.payment_settings?.hotel_credit_card_enabled !== false;
            return (
              <div className={`p-5 rounded-2xl border transition-all ${isCardActive ? 'bg-blue-50/30 border-blue-200/70 shadow-xs' : 'bg-slate-50/50 border-slate-100 opacity-80'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl border ${isCardActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 font-sans">
                          {lang === 'tr' ? 'Kredi Kartı (Online / Sanal POS)' : 'Credit Card (Online Virtual POS)'}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isCardActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {isCardActive ? (lang === 'tr' ? 'Aktif' : 'Active') : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-normal mt-0.5">
                        {lang === 'tr'
                          ? 'Web sitenizde kredi kartı ile güvenli online ödeme seçeneğini etkinleştirin veya kapatın.'
                          : 'Enable or disable secure online credit card payments on your website.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !isCardActive;
                      onBrandingChange('payment_settings', {
                        ...(branding.payment_settings || {}),
                        credit_card_enabled: nextVal,
                        hotel_credit_card_enabled: nextVal
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCardActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCardActive ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
                  </button>
                </div>
              </div>
            );
          })()}

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
                <h3 className="text-xl font-black text-white leading-tight tracking-tight font-sans">{txt('POS Köprüsü', 'POS Bridge', 'Γέφυρα POS')}</h3>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{txt('Köprü IP Adresi', 'Bridge IP Address', 'Διεύθυνση IP Γέφυρας')}</label>
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

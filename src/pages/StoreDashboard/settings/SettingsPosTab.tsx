import React, { useState } from "react";
import { CreditCard, Truck, Building2, Cpu, Banknote, Scan, ExternalLink, Copy, Check } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
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
  const [copiedScanUrl, setCopiedScanUrl] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'hotel' | 'bridge' | 'kiosk'>('payment');
  
  const txt = (tr: string, en: string, el: string) => (lang === "tr" ? tr : lang === "el" ? el : en);
  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const isPortfolio = branding?.store_type === 'portfolio' || branding?.store_type === 'automotive' || branding?.page_layout_settings?.sector === 'portfolio' || branding?.page_layout_settings?.sector === 'automotive';

  const slug = branding.slug || "";
  const scanUrl = `${window.location.origin}/scan/${slug}`;

  const subNavItems = [
    { id: 'payment', label: txt('Ödeme', 'Payment', 'Πληρωμές'), icon: CreditCard, show: true },
    { id: 'hotel', label: txt('Otel/Oda', 'Hotel/Room', 'Ξενοδοχείο'), icon: Building2, show: isCafeRestaurant },
    { id: 'bridge', label: txt('POS Köprü', 'POS Bridge', 'Γέφυρα POS'), icon: Cpu, show: true },
    { id: 'kiosk', label: txt('Fiyat Gör', 'Price Check', 'Έλεγχος Τιμών'), icon: Scan, show: !isPortfolio && !isCafeRestaurant },
  ].filter(i => i.show);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Top Header & Micro Navigation Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-900/60 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isCafeRestaurant ? 'Horeca POS' : 'POS & Tahsilat'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight tracking-tight mt-0.5">
                {txt('Adisyon & POS Yapılandırması', 'POS & Payment Configuration', 'Ρυθμίσεις POS & Πληρωμών')}
              </h2>
            </div>
          </div>
        </div>

        {/* Micro Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubTab(item.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <HotelUpgradeModal
        isOpen={isHotelUpgradeModalOpen}
        onClose={() => setIsHotelUpgradeModalOpen(false)}
        lang={lang}
        storeName={branding.store_name || branding.name}
      />

      {/* SUBTAB 1: PAYMENT GATEWAYS */}
      {activeSubTab === 'payment' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {txt('Ödeme Yöntemleri ve Sanal POS Entegrasyonları', 'Payment Gateways & Options', 'Τρόποι Πληρωμής')}
            </h3>

            {/* COD */}
            {(() => {
              const isCodActive = branding.payment_settings?.cod_enabled !== false && branding.payment_settings?.hotel_pay_at_hotel_enabled !== false;
              return (
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCodActive ? 'bg-amber-50/40 border-amber-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${isCodActive ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {(isCafeRestaurant || branding.hotel_module_enabled) ? <Banknote className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {(isCafeRestaurant || branding.hotel_module_enabled)
                            ? txt('Otelde / Kapıda Ödeme', 'Pay at Front Desk / Delivery', 'Πληρωμή στη ρεσεψιόν')
                            : txt('Kapıda Ödeme', 'Cash on Delivery', 'Πληρωμή κατά την παράδοση')}
                        </h4>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isCodActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {isCodActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {txt('Teslimat esnasında veya resepsiyonda nakit/kart ile tahsilat.', 'Collect cash or card on delivery or check-in.', 'Είπραξη με αντικαταβολή ή στη ρεσεψιόν.')}
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
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCodActive ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isCodActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                  </button>
                </div>
              );
            })()}

            {/* Bank Transfer */}
            {(() => {
              const isBankActive = branding.payment_settings?.bank_transfer_enabled !== false && branding.payment_settings?.hotel_bank_transfer_enabled !== false;
              return (
                <div className={`p-4 rounded-xl border transition-all ${isBankActive ? 'bg-indigo-50/40 border-indigo-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${isBankActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {txt('Banka Havalesi / EFT (IBAN)', 'Bank Transfer / EFT', 'Τραπεζική Κατάθεση')}
                          </h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isBankActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {isBankActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {txt('Müşterilere hesap numaralarınızı sunarak havale ile tahsilat yapın.', 'Display IBAN info to receive bank transfers.', 'Πληρωμή μέσω IBAN.')}
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
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isBankActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isBankActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                    </button>
                  </div>
                  {isBankActive && (
                    <div className="mt-3 space-y-1.5 border-t border-indigo-100 pt-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {txt('BANKA HESAP VE IBAN BİLGİLERİ', 'BANK ACCOUNT & IBAN DETAILS', 'ΣΤΟΙΧΕΙΑ ΤΡΑΠΕΖΗΣ')}
                      </label>
                      <textarea 
                        className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                        placeholder={txt('Ziraat Bankası - TR12 0001 0000 0000 0000 0000 00 - Alıcı: İşletme Adı', 'Bank Name - IBAN - Account Name...', 'Όνομα Τράπεζας - IBAN...')}
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

            {/* Direct Credit Card */}
            {(() => {
              const isCardActive = branding.payment_settings?.credit_card_enabled !== false && branding.payment_settings?.hotel_credit_card_enabled !== false;
              return (
                <div className={`p-4 rounded-xl border transition-all ${isCardActive ? 'bg-blue-50/40 border-blue-200/80' : 'bg-slate-50/50 border-slate-200 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${isCardActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {txt('Kredi Kartı (Online / Sanal POS)', 'Credit Card (Online Virtual POS)', 'Πιστωτική Κάρτα')}
                          </h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isCardActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {isCardActive ? txt('Aktif', 'Active', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {txt('Web sitenizde güvenli kredi kartı ödemesini etkinleştirin.', 'Enable secure online credit card collection.', 'Ενεργοποίηση πληρωμών με κάρτα.')}
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
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${isCardActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isCardActive ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Iyzico POS */}
            <div className={`p-4 rounded-xl border transition-all ${branding.payment_settings?.iyzico_enabled ? 'bg-blue-50/40 border-blue-200/80' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-200 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Iyzico Sanal POS</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{txt('Türkiye Sanal POS Gateway', 'TR Virtual POS Gateway', 'TR Virtual POS')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_enabled: !branding.payment_settings?.iyzico_enabled })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.payment_settings?.iyzico_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branding.payment_settings?.iyzico_enabled ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
              {branding.payment_settings?.iyzico_enabled && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">API Key</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none"
                      value={branding.payment_settings?.iyzico_api_key || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Secret Key</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none"
                      value={branding.payment_settings?.iyzico_secret_key || ''}
                      onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), iyzico_secret_key: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className={`p-4 rounded-xl border transition-all ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-50/40 border-indigo-200/80' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PayPal Express</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{txt('Uluslararası Ödeme', 'Global Checkout', 'Διεθνείς Πληρωμές')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_enabled: !branding.payment_settings?.paypal_enabled })}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.payment_settings?.paypal_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branding.payment_settings?.paypal_enabled ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
              {branding.payment_settings?.paypal_enabled && (
                <div className="mt-3 pt-3 border-t border-indigo-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">PayPal Client ID</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none"
                    value={branding.payment_settings?.paypal_client_id || ''}
                    onChange={(e) => onBrandingChange('payment_settings', { ...(branding.payment_settings || {}), paypal_client_id: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 2: HOTEL & ROOM (HORECA) */}
      {activeSubTab === 'hotel' && isCafeRestaurant && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-900 text-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-indigo-800/80 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-800/60 rounded-2xl text-amber-400 border border-indigo-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-white leading-tight">Otel & Oda Adisyon Entegrasyonu</h3>
                    {!branding.hotel_license_enabled && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
                        {txt('🔒 Üst Paket', '🔒 Upgrade Required', '🔒 Απαιτείται αναβάθμιση')}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${branding.hotel_module_enabled ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      {branding.hotel_module_enabled ? txt('Aktif (Hibrit)', 'Active (Hybrid)', 'Ενεργό') : txt('Pasif', 'Inactive', 'Ανενεργό')}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium mt-1">
                    {txt('Otel misafirleri için adisyonu odaya kaydetme ve resepsiyon senkronizasyonu.', 'Transfer restaurant tab to hotel rooms automatically.', 'Μεταφορά λογαριασμού στο δωμάτιο.')}
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
                    {txt('Yükselt', 'Upgrade', 'Αναβάθμιση')}
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
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.hotel_module_enabled ? 'bg-amber-400' : 'bg-slate-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${branding.hotel_module_enabled ? 'translate-x-[1.4rem]' : 'translate-x-[0.2rem]'}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 3: POS BRIDGE */}
      {activeSubTab === 'bridge' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-slate-950 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-900 rounded-xl text-indigo-400 border border-slate-800">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{txt('Fiziksel POS Köprüsü (Local Bridge)', 'POS Hardware Bridge', 'Γέφυρα POS')}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{txt('Yerel Ağ Cihaz Bağlantısı', 'Local Network Hardware Connection', 'Τοπικό Δίκτυο')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBrandingChange('pos_bridge_enabled', !branding.pos_bridge_enabled)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${branding.pos_bridge_enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${branding.pos_bridge_enabled ? 'translate-x-[1.3rem]' : 'translate-x-[0.2rem]'}`} />
              </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all ${branding.pos_bridge_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{txt('Köprü IP Adresi', 'Bridge IP Address', 'IP Γέφυρας')}</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 outline-none"
                  placeholder="192.168.1.XX"
                  value={branding.pos_bridge_ip || ''}
                  onChange={(e) => onBrandingChange('pos_bridge_ip', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Port</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 outline-none"
                  placeholder="8080"
                  value={branding.pos_bridge_port || ''}
                  onChange={(e) => onBrandingChange('pos_bridge_port', e.target.value)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 4: KIOSK & PRICE CHECK */}
      {activeSubTab === 'kiosk' && !isPortfolio && !isCafeRestaurant && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                <Scan className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {txt("Mağaza İçi 'Fiyat Gör' QR & Barkod Kiosk", "In-Store Price Check Kiosk", "Έλεγχος Τιμών QR & Barkod")}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {txt('Müşteri Self-Servis Fiyat Tarayıcı', 'Customer Self-Service Price Scanner', 'Self-Service Έλεγχος')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <QRCodeSVG 
                  value={scanUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                />
                <span className="mt-2 text-[10px] font-mono font-bold text-slate-500 truncate max-w-[160px]">
                  {scanUrl}
                </span>
              </div>

              <div className="md:col-span-2 space-y-3">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {txt("Müşterileriniz mağaza reyonlarındaki QR kodu okutarak barkod ile fiyat ve stok sorgular.", "Customers scan this QR code in-store to check prices.", "Οι πελάτες σαρώνουν το QR code για να δουν τις τιμές.")}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-indigo-600 font-bold truncate">
                    {scanUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(scanUrl);
                      setCopiedScanUrl(true);
                      setTimeout(() => setCopiedScanUrl(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedScanUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{copiedScanUrl ? txt('Kopyalandı', 'Copied', 'Αντιγράφηκε') : txt('Kopyala', 'Copy', 'Αντιγραφή')}</span>
                  </button>
                </div>

                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{txt("Sayfayı Canlı Aç", "Open Scanner", "Άνοιγμα")}</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

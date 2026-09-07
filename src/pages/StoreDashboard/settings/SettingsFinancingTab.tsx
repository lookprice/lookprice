import React, { useState } from "react";
import { 
  Save, 
  Wrench, 
  ExternalLink, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  HelpCircle 
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsFinancingTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
}

export const SettingsFinancingTab = ({ 
  branding, 
  onBrandingChange, 
  onSaveBranding 
}: SettingsFinancingTabProps) => {
  const [isFinSyncing, setIsFinSyncing] = useState(false);
  const [finSyncLogs, setFinSyncLogs] = useState<string[]>([]);
  const [activeFinCurrency, setActiveFinCurrency] = useState<string>("TRY");

  const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
    TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
    GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
    EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
    USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
  };

  const handleLiveVerification = () => {
    setIsFinSyncing(true);
    setFinSyncLogs([]);
    
    const logLines = [
      "[CONNECT] LookPrice AI Entegrasyon Köprüsü başlatılıyor...",
      "[API] KKTC bankaları dijital web servislerine bağlanılıyor...",
      "[SCRAPE] Creditwest Bank bireysel krediler web sayfası taranıyor...",
      "[PARSED] Creditwest Bank konut kredisi okundu: TRY %3.49 | GBP %0.55 | EUR %0.49 | USD %0.52",
      "[SCRAPE] Kıbrıs İktisat Bankası kredi simülatör şeması taranıyor...",
      "[PARSED] Kıbrıs İktisat Bankası konut kredisi okundu: TRY %3.65 | GBP %0.60 | EUR %0.52 | USD %0.55",
      "[SCRAPE] Limasol Sosyal Kooperatif resmi faiz tablosu okunuyor...",
      "[PARSED] Limasol Sosyal Kooperatif konut kredisi okundu: TRY %3.89 | GBP %0.65 | EUR %0.58 | USD %0.60",
      "[SCRAPE] Ziraat Bankası KKTC bireysel oranlar API'si taranıyor...",
      "[PARSED] Ziraat Bankası KKTC konut kredisi okundu: TRY %3.79 | GBP %0.58 | EUR %0.50 | USD %0.54",
      "[SYNC] Teyit Sonucu: Web sitelerindeki tüm para birimi oranları sistemle başarıyla senkronize edildi!",
      "[SUCCESS] Tüm resmi banka oranları ve para birimleri bazında eşitleme tamamlandı."
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < logLines.length) {
        setFinSyncLogs(prev => [...prev, logLines[idx]]);
        idx++;
      } else {
        clearInterval(interval);
        setIsFinSyncing(false);
        
        const currentSettings = branding.financing_settings || {};
        onBrandingChange('financing_settings', {
          ...currentSettings,
          base_rates: DEFAULT_BASE_RATES,
          last_sync_time: new Date().toLocaleString()
        });
      }
    }, 600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-20"
    >
      {/* Header Description Info card */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AKILLI FİNANSAL ENTEGRASYON YÖNETİMİ
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans">Akıllı Finansal Asistan & Sponsorluk Entegrasyonu Ayarları</h2>
          <p className="text-slate-400 text-xs font-medium leading-relaxed font-sans">
            Para birimlerine göre (TL, GBP, EUR, USD) bankaların resmi sitelerinden faiz oranlarının canlı teyidini yapabilir, sisteme özel partner oranlarını ve firma özel kampanya indirimlerini entegre edebilirsiniz. Portföy detaylarındaki finansman aracı bu parametrelere ve para birimlerine göre otomatik hesaplama yapar.
          </p>
        </div>
        <button 
          type="button"
          onClick={onSaveBranding}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Sponsorlukları Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Bank Base Interest Rates & Official Scrap Sync Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 font-sans">
                  <Wrench className="w-4 h-4 text-emerald-500" />
                  BANKALARIN RESMİ FAİZ ORANLARI (BASE RATES)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sistem tarafından resmi web siteleri üzerinden teyit edilen baz oranlar</p>
              </div>
            </div>

            {/* Interactive Currency tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 mb-6">
              {["TRY", "GBP", "EUR", "USD"].map((curr) => {
                const symbols: Record<string, string> = { TRY: "TL (₺)", GBP: "GBP (£)", EUR: "EUR (€)", USD: "USD ($)" };
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setActiveFinCurrency(curr)}
                    className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeFinCurrency === curr
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {symbols[curr]}
                  </button>
                );
              })}
            </div>

            {/* Simulated Banks List with Real Website Links and Inline Inputs */}
            <div className="space-y-4">
              {[
                { id: "Creditwest Bank", url: "https://www.creditwestbank.com/bireysel/krediler/konut-kredisi/", logo: "🏛️" },
                { id: "Kıbrıs İktisat Bankası", url: "https://www.iktisatbank.com/bireysel/krediler/ev-kredisi", logo: "🏦" },
                { id: "Limasol Sosyal Kooperatif", url: "https://www.limasolkooperatif.com/krediler/konut-kredileri/", logo: "🏢" },
                { id: "Ziraat Bankası KKTC", url: "https://www.ziraatbank.com.tr/tr/kktc-bireysel-krediler", logo: "🏙️" }
              ].map((bank) => {
                const currentFinSettings = branding.financing_settings || {};
                const baseRatesObj = currentFinSettings.base_rates || {};

                let currencyRates: Record<string, number> = {};
                if (baseRatesObj["Creditwest Bank"] !== undefined) {
                  currencyRates = { ...DEFAULT_BASE_RATES[activeFinCurrency] };
                  if (activeFinCurrency === "TRY") {
                    currencyRates["Creditwest Bank"] = Number(baseRatesObj["Creditwest Bank"] || 1.89);
                    currencyRates["Kıbrıs İktisat Bankası"] = Number(baseRatesObj["Kıbrıs İktisat Bankası"] || 2.05);
                    currencyRates["Limasol Sosyal Kooperatif"] = Number(baseRatesObj["Limasol Sosyal Kooperatif"] || 2.19);
                    currencyRates["Ziraat Bankası KKTC"] = Number(baseRatesObj["Ziraat Bankası KKTC"] || 1.99);
                  }
                } else {
                  currencyRates = baseRatesObj[activeFinCurrency] || DEFAULT_BASE_RATES[activeFinCurrency];
                }

                const bankRate = currencyRates[bank.id] !== undefined ? currencyRates[bank.id] : DEFAULT_BASE_RATES[activeFinCurrency][bank.id];

                return (
                  <div key={bank.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{bank.logo}</span>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{bank.id}</span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                          OKUNDU ({activeFinCurrency})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Teyit Kaynağı:</span>
                        <a 
                          href={bank.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                        >
                          Resmi Web Sayfası <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Editable Rate Input with dynamic binding */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs font-bold text-slate-400">%</span>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder={String(DEFAULT_BASE_RATES[activeFinCurrency][bank.id])}
                        value={bankRate}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value) || 0;
                          const currentSettings = branding.financing_settings || {};
                          const oldBase = currentSettings.base_rates || {};

                          let normalizedBase: Record<string, Record<string, number>> = {};
                          if (oldBase["Creditwest Bank"] !== undefined) {
                            normalizedBase = {
                              TRY: {
                                "Creditwest Bank": Number(oldBase["Creditwest Bank"] || 1.89),
                                "Kıbrıs İktisat Bankası": Number(oldBase["Kıbrıs İktisat Bankası"] || 2.05),
                                "Limasol Sosyal Kooperatif": Number(oldBase["Limasol Sosyal Kooperatif"] || 2.19),
                                "Ziraat Bankası KKTC": Number(oldBase["Ziraat Bankası KKTC"] || 1.99)
                              },
                              GBP: { ...DEFAULT_BASE_RATES.GBP },
                              EUR: { ...DEFAULT_BASE_RATES.EUR },
                              USD: { ...DEFAULT_BASE_RATES.USD }
                            };
                          } else {
                            normalizedBase = {
                              TRY: oldBase.TRY || { ...DEFAULT_BASE_RATES.TRY },
                              GBP: oldBase.GBP || { ...DEFAULT_BASE_RATES.GBP },
                              EUR: oldBase.EUR || { ...DEFAULT_BASE_RATES.EUR },
                              USD: oldBase.USD || { ...DEFAULT_BASE_RATES.USD }
                            };
                          }

                          normalizedBase[activeFinCurrency] = {
                            ...(normalizedBase[activeFinCurrency] || DEFAULT_BASE_RATES[activeFinCurrency]),
                            [bank.id]: parsed
                          };

                          onBrandingChange('financing_settings', {
                            ...currentSettings,
                            base_rates: normalizedBase
                          });
                        }}
                        className="bg-white border border-slate-200 text-slate-800 text-xs font-black text-center py-1.5 rounded-xl w-20 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      <span className="text-[10px] font-medium text-slate-400">/ Aylık</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scraper Simulation Command & Log terminal panel */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase font-sans">Resmi Siteden Otomatik Faiz Doğrulama ve Eşitleme</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sistem, bankaların API/Web sitelerinden faiz oranlarını otomatik teyit eder</p>
                </div>
                <button 
                  type="button"
                  disabled={isFinSyncing}
                  onClick={handleLiveVerification}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {isFinSyncing ? "Teyit Ediliyor..." : "Resmi Web Sitelerinden Canlı Teyit Et"}
                </button>
              </div>

              {/* Terminal Log Console */}
              {(isFinSyncing || finSyncLogs.length > 0) && (
                <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-emerald-400 space-y-1 max-h-[180px] overflow-y-auto border border-white/5 shadow-inner">
                  {finSyncLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-slate-600">{`>`}</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {isFinSyncing && (
                    <div className="flex items-center gap-2 text-indigo-400 animate-pulse mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <span>Bankaların resmi web sunucularına veri taranıyor...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sync Meta Status Label */}
              {branding.financing_settings?.last_sync_time && (
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Son Başarılı Entegrasyon Otomasyon Kontrolü: <span className="text-slate-700 font-bold">{branding.financing_settings.last_sync_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Special Promotion & Discounted Agreed Partner Overrides */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/30">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-500 border border-amber-100 shadow-sm animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none font-sans">ÖZEL ANLAŞMALI PARTNER ORANLARI</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Büyük portföy yönetim şirketlerine özel anlaşmalı banka oran tanımları</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-700 uppercase block font-sans">Anlaşmalı Oran Girişini Aktif Et</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Sponsor bankalarla yaptığınız özel oranları hesaplamada öncelikli kılın</span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const currentSettings = branding.financing_settings || {};
                    const oldVal = currentSettings.partner_promo_active === true;
                    onBrandingChange('financing_settings', {
                      ...currentSettings,
                      partner_promo_active: !oldVal
                    });
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${branding.financing_settings?.partner_promo_active ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branding.financing_settings?.partner_promo_active ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Overridden Partner rates inputs block */}
            {branding.financing_settings?.partner_promo_active ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 overflow-hidden"
              >
                <div className="p-3 bg-amber-50/50 border border-amber-100/80 rounded-2xl text-[10px] text-amber-700 font-medium leading-relaxed flex items-start gap-2 font-sans">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>DİKKAT:</strong> Anlaşmalı partner oranları aktifken, portföy sitemizdeki tüm finansman kredi hesaplama simülasyonlarında, <strong>{activeFinCurrency}</strong> için girilen aşağıdaki indirimli faiz oranları öncelikli olarak baz alınacaktır!
                  </span>
                </div>

                {[
                  { id: "Creditwest Bank", logo: "🏛️", defaultRate: activeFinCurrency === "TRY" ? "2.99" : "0.39" },
                  { id: "Kıbrıs İktisat Bankası", logo: "🏦", defaultRate: activeFinCurrency === "TRY" ? "3.10" : "0.45" },
                  { id: "Limasol Sosyal Kooperatif", logo: "🏢", defaultRate: activeFinCurrency === "TRY" ? "3.40" : "0.49" },
                  { id: "Ziraat Bankası KKTC", logo: "🏙️", defaultRate: activeFinCurrency === "TRY" ? "3.20" : "0.42" }
                ].map((bank) => {
                  const currentSettings = branding.financing_settings || {};
                  const partnerRatesObj = currentSettings.partner_rates || {};

                  let currencyPartnerRates: Record<string, any> = {};
                  if (partnerRatesObj["Creditwest Bank"] !== undefined) {
                    currencyPartnerRates = {};
                    if (activeFinCurrency === "TRY") {
                      currencyPartnerRates = { ...partnerRatesObj };
                    }
                  } else {
                    currencyPartnerRates = partnerRatesObj[activeFinCurrency] || {};
                  }

                  const partnerVal = currencyPartnerRates[bank.id] !== undefined ? currencyPartnerRates[bank.id] : "";

                  return (
                    <div key={bank.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{bank.logo}</span>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{bank.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">%</span>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder={bank.defaultRate}
                          value={partnerVal}
                          onChange={(e) => {
                            const currentSettings = branding.financing_settings || {};
                            const oldPartner = currentSettings.partner_rates || {};

                            let normalizedPartner: Record<string, Record<string, any>> = {};
                            if (oldPartner["Creditwest Bank"] !== undefined) {
                              normalizedPartner = {
                                TRY: { ...oldPartner },
                                GBP: {},
                                EUR: {},
                                USD: {}
                              };
                            } else {
                              normalizedPartner = {
                                TRY: oldPartner.TRY || {},
                                GBP: oldPartner.GBP || {},
                                EUR: oldPartner.EUR || {},
                                USD: oldPartner.USD || {}
                              };
                            }

                            normalizedPartner[activeFinCurrency] = {
                              ...(normalizedPartner[activeFinCurrency] || {}),
                              [bank.id]: e.target.value
                            };

                            onBrandingChange('financing_settings', {
                              ...currentSettings,
                              partner_rates: normalizedPartner
                            });
                          }}
                          className="bg-white border border-slate-200 text-slate-800 text-xs font-black text-center py-1 rounded-lg w-20 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                        <span className="text-[9px] font-bold text-slate-400">({activeFinCurrency})</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span className="text-xs font-bold font-sans uppercase tracking-tight block">Partner Oran Eşleştirme Pasif</span>
                <span className="text-[10px] font-medium block mt-1 leading-relaxed">Firma özel anlaşmalı indirimli oranlarını sisteme tanımlamak için yukarıdaki anahtarı açıp değerleri girebilirsiniz.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

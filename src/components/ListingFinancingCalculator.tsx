import React, { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Store as StoreInfo } from "../types";

interface ListingFinancingCalculatorProps {
  price: number;
  currency: string;
  lang: string;
  store: StoreInfo | null;
  defaultOpen?: boolean;
}

export const ListingFinancingCalculator: React.FC<ListingFinancingCalculatorProps> = ({
  price,
  currency,
  lang,
  store,
  defaultOpen = false,
}) => {
  const [downpaymentPercent, setDownpaymentPercent] = useState(30);
  const [termMonths, setTermMonths] = useState(36);
  const [selectedBank, setSelectedBank] = useState<string>("Creditwest Bank");
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const activeCurrency = (currency || "GBP").trim().toUpperCase();

  // Dynamic rates fetched from the store's financing settings or back to standards
  const currentFinSettings = store?.financing_settings || {};
  const baseRatesObj = currentFinSettings.base_rates || {};
  const partnerRatesObj = currentFinSettings.partner_rates || {};
  const promoActive = currentFinSettings.partner_promo_active === true;

  const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
    TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
    GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
    EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
    USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
  };

  // Resolve base rates for product's specific active currency
  let currencyBase: Record<string, number> = {};
  if (baseRatesObj["Creditwest Bank"] !== undefined) {
    // Legacy single structure, assume TRY
    currencyBase = activeCurrency === "TRY" 
      ? {
          "Creditwest Bank": Number(baseRatesObj["Creditwest Bank"] || 1.89),
          "Kıbrıs İktisat Bankası": Number(baseRatesObj["Kıbrıs İktisat Bankası"] || 2.05),
          "Limasol Sosyal Kooperatif": Number(baseRatesObj["Limasol Sosyal Kooperatif"] || 2.19),
          "Ziraat Bankası KKTC": Number(baseRatesObj["Ziraat Bankası KKTC"] || 1.99)
        }
      : DEFAULT_BASE_RATES[activeCurrency] || DEFAULT_BASE_RATES.GBP;
  } else {
    currencyBase = baseRatesObj[activeCurrency] || DEFAULT_BASE_RATES[activeCurrency] || DEFAULT_BASE_RATES.GBP;
  }

  // Resolve partner rates for product's specific active currency
  let currencyPartner: Record<string, any> = {};
  if (partnerRatesObj["Creditwest Bank"] !== undefined) {
    currencyPartner = activeCurrency === "TRY" ? { ...partnerRatesObj } : {};
  } else {
    currencyPartner = partnerRatesObj[activeCurrency] || {};
  }

  const getEffectiveRate = (bankName: string, defaultRate: number) => {
    if (promoActive && currencyPartner[bankName] !== undefined && currencyPartner[bankName] !== "") {
      return parseFloat(String(currencyPartner[bankName]));
    }
    return currencyBase[bankName] !== undefined ? parseFloat(String(currencyBase[bankName])) : defaultRate;
  };

  const isOverridden = (bankName: string) => {
    return promoActive && currencyPartner[bankName] !== undefined && currencyPartner[bankName] !== "";
  };

  const banks = [
    { name: "Creditwest Bank", rate: getEffectiveRate("Creditwest Bank", DEFAULT_BASE_RATES[activeCurrency]?.["Creditwest Bank"] || 0.55), logo: "🏛️", isOverridden: isOverridden("Creditwest Bank") },
    { name: "Kıbrıs İktisat Bankası", rate: getEffectiveRate("Kıbrıs İktisat Bankası", DEFAULT_BASE_RATES[activeCurrency]?.["Kıbrıs İktisat Bankası"] || 0.60), logo: "🏦", isOverridden: isOverridden("Kıbrıs İktisat Bankası") },
    { name: "Limasol Sosyal Kooperatif", rate: getEffectiveRate("Limasol Sosyal Kooperatif", DEFAULT_BASE_RATES[activeCurrency]?.["Limasol Sosyal Kooperatif"] || 0.65), logo: "🏢", isOverridden: isOverridden("Limasol Sosyal Kooperatif") },
    { name: "Ziraat Bankası KKTC", rate: getEffectiveRate("Ziraat Bankası KKTC", DEFAULT_BASE_RATES[activeCurrency]?.["Ziraat Bankası KKTC"] || 0.58), logo: "🏙️", isOverridden: isOverridden("Ziraat Bankası KKTC") }
  ];

  const activeBank = banks.find(b => b.name === selectedBank) || banks[0];
  const interestRate = activeBank.rate;

  const downpayment = Math.round((price * downpaymentPercent) / 100);
  const loanAmount = price - downpayment;

  const monthlyPayment = useMemo(() => {
    if (interestRate <= 0) return loanAmount / termMonths;
    const i = interestRate / 100;
    const n = termMonths;
    const monthly =
      (loanAmount * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    return isNaN(monthly) || !isFinite(monthly) ? 0 : Math.round(monthly);
  }, [loanAmount, interestRate, termMonths]);

  const totalPayment = monthlyPayment * termMonths + downpayment;

  return (
    <div className="bg-slate-50 border border-slate-100/80 rounded-3xl mt-8 mb-8 overflow-hidden transition-all duration-500">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">
              {lang === "tr"
                ? "Resmi Banka Kredisi & Finansman Asistanı"
                : "Official Bank Loan & Financing Assistant"}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {lang === "tr"
                ? "Canlı Teyitli Faiz Oranları & Özel Oranlar"
                : "Live Verified Rates & Partner Deals"}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-500">
          <div className="space-y-6">
            
            {/* Interactive Bank Selection List */}
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                {lang === "tr" ? "TEYİTLİ BANKALAR (FAİZ ORANI CANLI SEÇİM)" : "VERIFIED BANKS (SELECT LIVE INTEREST RATE)"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {banks.map((bank) => (
                  <button
                    key={bank.name}
                    type="button"
                    onClick={() => setSelectedBank(bank.name)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${selectedBank === bank.name ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/25" : "bg-white border-slate-100 hover:border-slate-300"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{bank.logo}</span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-extrabold text-slate-700 block truncate uppercase leading-tight">{bank.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none mt-0.5 block">{lang === 'tr' ? 'Aylık Faiz' : 'Monthly'}: %{bank.rate}</span>
                      </div>
                    </div>
                    {bank.isOverridden && (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-700 text-[8px] font-black uppercase rounded block tracking-wider leading-none">
                        {lang === 'tr' ? 'Özel' : 'Promo'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders and Metrics inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>
                    {lang === "tr" ? "Peşinat" : "Downpayment"} ({downpaymentPercent}
                    %)
                  </span>
                  <span className="text-slate-900">
                    {Math.round(downpayment || 0).toLocaleString('tr-TR')} {currency}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={downpaymentPercent}
                  onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2.5">
                  <span>{lang === "tr" ? "Vade" : "Term"}</span>
                  <span className="text-slate-900">
                    {termMonths} {lang === "tr" ? "Ay" : "Months"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[12, 24, 36, 48].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTermMonths(m)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${termMonths === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                    >
                      {m} {lang === "tr" ? "Ay" : "M"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Final dynamic result card with active rates summary */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-4 shadow-sm relative overflow-hidden">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {lang === "tr" ? "AYLIK TAKSİT" : "MONTHLY PAYMENT"}
                </p>
                <p className="text-base font-black text-indigo-600 tracking-tight">
                  {Math.round(monthlyPayment || 0).toLocaleString('tr-TR')} {currency}
                </p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {lang === "tr" ? "KREDİ TUTARI" : "LOAN AMOUNT"}
                </p>
                <p className="text-base font-black text-slate-800 tracking-tight">
                  {Math.round(loanAmount || 0).toLocaleString('tr-TR')} {currency}
                </p>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-3 flex flex-wrap justify-between items-center text-xs font-bold text-slate-500 gap-2">
                <span className="flex items-center gap-1">
                  {lang === "tr" ? "Toplam Geri Ödeme" : "Total Repayment"}:
                  <span className="text-slate-950 font-black">{Math.round(totalPayment || 0).toLocaleString('tr-TR')} {currency}</span>
                </span>
                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black uppercase">
                  % {interestRate} {lang === 'tr' ? 'Faiz Oranı' : 'Interest Rate'} / {activeBank.name}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Percent, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { MarketplaceType } from './types';

interface CommissionSettingsBarProps {
  activeMarketplace: MarketplaceType;
  activeMarketplaceTitle: string;
  defaultCommissionRates: Record<MarketplaceType, number>;
  setDefaultCommissionRates: React.Dispatch<React.SetStateAction<Record<MarketplaceType, number>>>;
  defaultFixedFees: Record<MarketplaceType, number>;
  setDefaultFixedFees: React.Dispatch<React.SetStateAction<Record<MarketplaceType, number>>>;
  calculateSimulatedPrice: (basePrice: number, commissionRate: number, fixedFee: number) => number;
  lang?: string;
}

export const CommissionSettingsBar: React.FC<CommissionSettingsBarProps> = ({
  activeMarketplace,
  activeMarketplaceTitle,
  defaultCommissionRates,
  setDefaultCommissionRates,
  defaultFixedFees,
  setDefaultFixedFees,
  calculateSimulatedPrice,
  lang = 'tr',
}) => {
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [showPricingFormulaInfo, setShowPricingFormulaInfo] = useState(false);

  return (
    <div className="border-b border-slate-700 bg-slate-900 text-white">
      <div 
        onClick={() => setIsCommissionOpen(!isCommissionOpen)}
        className="px-4 py-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-between cursor-pointer select-none transition-all hover:bg-slate-800"
      >
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          <Percent className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-black uppercase text-amber-400 tracking-wide whitespace-nowrap">
            {activeMarketplaceTitle} {lang === 'tr' ? 'Fiyat & Komisyon Stratejisi' : 'Pricing Strategy'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-200 font-mono whitespace-nowrap border border-white/10">
            {lang === 'tr' ? 'Genel:' : 'Def:'} %{defaultCommissionRates[activeMarketplace] ?? 18} + {defaultFixedFees[activeMarketplace] ?? 20} TL
          </span>
          <span className="hidden md:inline text-[10px] text-amber-300 font-mono whitespace-nowrap">
            (1.000 TL Web ➔ {calculateSimulatedPrice(1000, defaultCommissionRates[activeMarketplace] ?? 18, defaultFixedFees[activeMarketplace] ?? 20).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL)
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 pl-2">
          <span className="text-[10px] text-slate-300 font-medium">
            {isCommissionOpen ? (lang === 'tr' ? 'Formülü Gizle' : 'Hide') : (lang === 'tr' ? 'Formülü Düzenle' : 'Edit')}
          </span>
          {isCommissionOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-amber-300" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-amber-300" />
          )}
        </div>
      </div>

      {isCommissionOpen && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-700/80 space-y-2 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-300">
                {lang === 'tr' 
                  ? 'Pazaryeri komisyon ve kargo kesintisi yapıldığında kasanıza net fiyatın kalması için fiyat ters marjla otomatik yükseltilir.'
                  : 'Prices are marked up dynamically so your net profit remains equal to your store price.'}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase">{lang === 'tr' ? 'Komisyon:' : 'Comm:'}</span>
                <div className="flex items-center bg-slate-900/90 rounded px-1.5 py-0.5 border border-white/20">
                  <span className="text-[10px] font-bold text-amber-400 mr-0.5">%</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={defaultCommissionRates[activeMarketplace] ?? 18}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDefaultCommissionRates((prev) => ({ ...prev, [activeMarketplace]: isNaN(v) ? 0 : v }));
                    }}
                    className="w-10 bg-transparent text-[11px] font-black text-white focus:outline-hidden text-right"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase">{lang === 'tr' ? 'Sabit Gider:' : 'Fixed:'}</span>
                <div className="flex items-center bg-slate-900/90 rounded px-1.5 py-0.5 border border-white/20">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultFixedFees[activeMarketplace] ?? 20}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDefaultFixedFees((prev) => ({ ...prev, [activeMarketplace]: isNaN(v) ? 0 : v }));
                    }}
                    className="w-10 bg-transparent text-[11px] font-black text-white focus:outline-hidden text-right"
                  />
                  <span className="text-[10px] font-bold text-slate-300 ml-0.5">TL</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPricingFormulaInfo(!showPricingFormulaInfo)}
                className="text-[10px] px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-slate-200 border border-white/20 flex items-center gap-1 cursor-pointer transition-all"
              >
                <Info className="h-3 w-3 text-amber-300" />
                <span>{showPricingFormulaInfo ? (lang === 'tr' ? 'Kapat' : 'Hide') : (lang === 'tr' ? 'Detay' : 'Details')}</span>
              </button>
            </div>
          </div>

          {showPricingFormulaInfo && (
            <div className="pt-2 border-t border-white/10 text-[10px] grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-200">
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
                <p className="font-bold text-white flex items-center gap-1">
                  <span className="text-amber-400">📐</span> {lang === 'tr' ? 'Ters Marj Formülü:' : 'Formula:'}
                </p>
                <div className="font-mono text-[10px] bg-slate-950/80 p-1.5 rounded text-emerald-400 border border-white/10 overflow-x-auto">
                  Fiyat_Pazaryeri = (Fiyat_Web + Sabit_Gider) / (1 - (Komisyon_Oranı / 100))
                </div>
              </div>

              <div className="bg-white/5 p-2 rounded-lg border border-white/10 space-y-0.5">
                <p className="font-bold text-white flex items-center gap-1">
                  <span className="text-amber-400">💡</span> {lang === 'tr' ? 'Kategori Bazlı Özel Komisyon:' : 'Category Overrides:'}
                </p>
                <p className="text-[10px] text-slate-300">
                  {lang === 'tr' 
                    ? 'Aşağıdaki her kategori satırından özel komisyon (%) ve sabit pay (TL) tanımlayabilirsiniz. Boş bırakılanlar bu genel oranları kullanır.'
                    : 'You can set category-specific rates on individual rows below. Empty rows automatically inherit defaults.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

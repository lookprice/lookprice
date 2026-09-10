import React from 'react';
import { Percent, FileSpreadsheet, CreditCard } from 'lucide-react';

interface SalesInvoiceStatsProps {
  isTr: boolean;
  totalCalculatedTax: number;
  totalSalesAmount: number;
  totalGrandTotal: number;
  branding: any;
}

export const SalesInvoiceStats: React.FC<SalesInvoiceStatsProps> = ({
  isTr,
  totalCalculatedTax,
  totalSalesAmount,
  totalGrandTotal,
  branding
}) => {
  const currency = branding?.default_currency || 'TRY';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider truncate">{isTr ? "HESAPLANAN VERGİ" : "CALCULATED TAX"}</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {totalCalculatedTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 ml-2">
          <Percent className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">{isTr ? "SATIŞ MATRAHI" : "SALES SUBTOTAL"}</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {totalSalesAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 ml-2">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-indigo-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-indigo-50/30">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider truncate">{isTr ? "GENEL TOPLAM" : "GRAND TOTAL"}</p>
          <p className="text-sm sm:text-base font-black text-indigo-950 tracking-tight mt-0.5 truncate">
            {totalGrandTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 ml-2 shadow-xs">
          <CreditCard className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

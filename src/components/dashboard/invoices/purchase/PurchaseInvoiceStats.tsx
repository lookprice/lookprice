import React from 'react';
import { Percent, TrendingUp, CreditCard, Package } from 'lucide-react';

interface PurchaseInvoiceStatsProps {
  isTr: boolean;
  totalDeductibleTax: number;
  totalPurchaseAmount: number;
  totalExpenseAmount: number;
  totalGrandTotal: number;
  branding: any;
}

export const PurchaseInvoiceStats: React.FC<PurchaseInvoiceStatsProps> = ({
  isTr,
  totalDeductibleTax,
  totalPurchaseAmount,
  totalExpenseAmount,
  totalGrandTotal,
  branding
}) => {
  const currency = branding?.default_currency || 'TRY';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider truncate">{isTr ? "KDV TOPLAM" : "TOTAL TAX"}</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {totalDeductibleTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 ml-2">
          <Percent className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">{isTr ? "ALIŞ MATRAH" : "PURCHASE MATRAH"}</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {totalPurchaseAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 ml-2">
          <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider truncate">{isTr ? "GİDERLER" : "EXPENSES"}</p>
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5 truncate">
            {totalExpenseAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 ml-2">
          <CreditCard className="h-4 w-4" />
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
          <Package className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

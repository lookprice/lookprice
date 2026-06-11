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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Percent className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{isTr ? "KDV TOPLAM" : "TOTAL TAX"}</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {totalDeductibleTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-xl">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{isTr ? "ALIŞ MATRAH" : "PURCHASE MATRAH"}</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {totalPurchaseAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-rose-50 rounded-xl">
          <CreditCard className="h-6 w-6 text-rose-600" />
        </div>
        <div>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{isTr ? "GİDERLER" : "EXPENSES"}</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {totalExpenseAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-slate-950 rounded-xl shadow-lg shadow-slate-200">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{isTr ? "GENEL TOPLAM" : "GRAND TOTAL"}</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {totalGrandTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>
    </div>
  );
};

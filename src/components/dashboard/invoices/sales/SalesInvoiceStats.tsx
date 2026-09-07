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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <Percent className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{isTr ? "Hesaplanan Vergi" : "Calculated Tax"}</p>
          <p className="text-2xl font-semibold text-slate-800">
            {totalCalculatedTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-xl">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{isTr ? "Toplam Satış Matrahı" : "Total Sales Subtotal"}</p>
          <p className="text-2xl font-semibold text-slate-800">
            {totalSalesAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-xl">
          <CreditCard className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{isTr ? "Toplam Genel Toplam" : "Total Grand Total"}</p>
          <p className="text-2xl font-semibold text-slate-800">
            {totalGrandTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency })}
          </p>
        </div>
      </div>
    </div>
  );
};

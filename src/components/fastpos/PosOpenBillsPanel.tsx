import React from "react";
import { Coffee, Printer, UserCheck } from "lucide-react";

export interface PosOpenBillsPanelProps {
  lang: string;
  pendingSales: any[];
  handlePrintTableBill: (sale: any) => void;
  setSelectedTable: (table: string) => void;
  setActiveSaleId: (id: number | null) => void;
  setCart: (cart: any[]) => void;
}

export const PosOpenBillsPanel: React.FC<PosOpenBillsPanelProps> = ({
  lang,
  pendingSales,
  handlePrintTableBill,
  setSelectedTable,
  setActiveSaleId,
  setCart
}) => {
  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-rose-500" />
          <h3 className="font-extrabold text-sm text-slate-800">
            {lang === 'tr' ? 'Açık Adisyonlar' : 'Open Bills'}
          </h3>
        </div>
        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-md text-xs font-black">
          {pendingSales.length} {lang === 'tr' ? 'Masa' : 'Tables'}
        </span>
      </div>

      {/* Scrollable Live List of Open Bills */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {pendingSales.map((sale) => (
          <div key={sale.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between transition-all shadow-2xs">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">{sale.customer_name || 'Masa'}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  {sale.items.length} Kalem
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                {sale.notes || (lang === 'tr' ? 'Sipariş bekliyor' : 'Order pending')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-black text-sm text-indigo-600">
                {parseFloat(sale.total_amount).toFixed(2)} ₺
              </span>
              <button
                type="button"
                onClick={() => handlePrintTableBill(sale)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1 border border-slate-200"
                title={lang === 'tr' ? 'Termal Adisyon Fişi Yazdır' : 'Print Thermal Bill'}
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
              </button>
              <button
                onClick={() => {
                  const tableName = sale.customer_name || 'Masa';
                  setSelectedTable(tableName);
                  setActiveSaleId(sale.id);
                  const mappedCart = sale.items.map((it: any) => {
                    const fullName = it.product_name || '';
                    const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                    const cleanName = match ? match[1].trim() : fullName;
                    const parsedNote = match ? match[2].trim() : '';
                    return {
                      id: it.product_id,
                      name: cleanName,
                      note: parsedNote,
                      price: it.unit_price.toString(),
                      quantity: it.quantity,
                      barcode: it.barcode || '',
                      currency: sale.currency || 'TRY'
                    };
                  });
                  setCart(mappedCart);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {lang === 'tr' ? 'Adisyona Git →' : 'View Bill →'}
              </button>
            </div>
          </div>
        ))}

        {pendingSales.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12 text-center px-4">
            <Coffee className="h-10 w-10 mb-2 opacity-20 text-rose-500" />
            <p className="text-xs font-bold text-slate-500">{lang === 'tr' ? 'Şu an açık adisyon yok' : 'No open bills currently'}</p>
            <p className="text-[11px] text-slate-400 mt-1">{lang === 'tr' ? 'Sol taraftan bir masa seçerek sipariş başlatabilirsiniz.' : 'Select a table on left to start order.'}</p>
          </div>
        )}
      </div>

      {/* Bottom Garson Masası Quick Order trigger */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
        <button
          onClick={() => {
            setSelectedTable(lang === 'tr' ? 'Garson Masası' : (lang === 'el' ? 'Τραπέζι Σερβιτόρου' : 'Waiter Table'));
            const garsonSale = pendingSales.find(s => 
              s.restaurant_table_id === null || 
              s.customer_name?.toLowerCase().includes('garson') || 
              s.customer_name === 'Masa Siparişi' || 
              s.notes?.toLowerCase().includes('garson')
            );
            if (garsonSale) {
              setActiveSaleId(garsonSale.id);
              const mappedCart = garsonSale.items.map((it: any) => {
                const fullName = it.product_name || '';
                const match = fullName.match(/(.+?)\s*\((.+?)\)$/);
                const cleanName = match ? match[1].trim() : fullName;
                const parsedNote = match ? match[2].trim() : '';
                return {
                  id: it.product_id,
                  name: cleanName,
                  note: parsedNote,
                  price: it.unit_price.toString(),
                  quantity: it.quantity,
                  barcode: it.barcode || '',
                  currency: garsonSale.currency || 'TRY'
                };
              });
              setCart(mappedCart);
            } else {
              setActiveSaleId(null);
              setCart([]);
            }
          }}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer px-3"
        >
          <UserCheck className="h-4 w-4 text-amber-300 shrink-0" />
          <span className="truncate">{lang === 'tr' ? 'Garson Masası (Hızlı Ayakta Satış)' : 'Quick Walk-up Order'}</span>
        </button>
      </div>
    </div>
  );
};

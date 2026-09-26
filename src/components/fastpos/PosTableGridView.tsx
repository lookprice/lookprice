import React, { useState, useMemo } from "react";
import { Coffee, CheckCircle2, TrendingUp, UserCheck, Users } from "lucide-react";
import { TableGrid } from "../TableGrid";
import { getStoreWaiters } from "../../utils/staffHelpers";

export interface PosTableGridViewProps {
  lang: string;
  pendingSales: any[];
  allTables: any[];
  branding: any;
  storeId: number;
  tablesRefreshTrigger: number;
  setSelectedTable: (table: string) => void;
  setActiveSaleId: (id: number | null) => void;
  setCart: (cart: any[]) => void;
}

export const PosTableGridView: React.FC<PosTableGridViewProps> = ({
  lang,
  pendingSales,
  allTables,
  branding,
  storeId,
  tablesRefreshTrigger,
  setSelectedTable,
  setActiveSaleId,
  setCart
}) => {
  const [selectedWaiterFilter, setSelectedWaiterFilter] = useState<string>('all');
  
  const waiters = useMemo(() => {
    return getStoreWaiters(branding).filter(w => w.active);
  }, [branding]);

  const filteredPendingSales = useMemo(() => {
    if (selectedWaiterFilter === 'all') return pendingSales;
    return pendingSales.filter(s => {
      const notes = s.notes || '';
      const cName = s.customer_name || '';
      return notes.toLowerCase().includes(selectedWaiterFilter.toLowerCase()) ||
             cName.toLowerCase().includes(selectedWaiterFilter.toLowerCase());
    });
  }, [pendingSales, selectedWaiterFilter]);

  const tableCount = allTables.length > 0 ? allTables.length : (branding?.page_layout_settings?.table_count || 12);
  const occupiedCount = filteredPendingSales.length;
  const emptyCount = Math.max(0, tableCount - occupiedCount);
  const activeTotal = filteredPendingSales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);

  return (
    <>
      {/* Ultra-compact single line summary bar */}
      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
            <Coffee className="h-3 w-3 text-rose-600" />
            <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Dolu:' : 'Occupied:'}</span>
            <span className="font-extrabold">{occupiedCount} / {tableCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Boş:' : 'Empty:'}</span>
            <span className="font-extrabold">{emptyCount} / {tableCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-xs">
          <TrendingUp className="h-3 w-3 text-indigo-200" />
          <span className="text-indigo-100 font-medium">{lang === 'tr' ? 'Aktif Toplam:' : 'Active:'}</span>
          <span>{activeTotal.toFixed(2)} ₺</span>
        </div>
      </div>

      {/* Waiter Quick Filter Toolbar */}
      {waiters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedWaiterFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
              selectedWaiterFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>{lang === 'tr' ? 'Tüm Garsonlar' : 'All Waiters'}</span>
          </button>

          {waiters.map(w => {
            const isSel = selectedWaiterFilter === w.name;
            const wSales = pendingSales.filter(s => (s.notes || '').includes(w.name) || (s.customer_name || '').includes(w.name));
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWaiterFilter(isSel ? 'all' : w.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isSel
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                <UserCheck className="w-3 h-3 text-indigo-400" />
                <span>{w.name}</span>
                {wSales.length > 0 && (
                  <span className={`text-[10px] px-1 py-0.1 rounded-full font-black ${
                    isSel ? 'bg-white text-indigo-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {wSales.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Grid container taking maximum height */}
      <div className="flex-1 overflow-y-auto bg-white/60 border border-slate-200 rounded-xl p-2 min-h-0 shadow-2xs">
        <TableGrid 
          storeId={storeId} 
          refreshTrigger={tablesRefreshTrigger}
          pendingSales={filteredPendingSales}
          onTableSelect={(table) => {
            setSelectedTable(table.table_number);
            if (table.status === 'occupied') {
              const normalizeName = (str: string) => str ? str.toLowerCase().replace(/\s+/g, '') : '';
              let sale = null;

              if (table.isGarsonTable || table.id === -999 || (table.table_number === 'Garson Masası' || table.table_number === 'Waiter Table' || table.table_number === 'Τραπέζι Σερβιτόρου')) {
                sale = pendingSales.find(s => 
                  s.restaurant_table_id === null || 
                  s.customer_name?.toLowerCase().includes('garson') || 
                  s.customer_name === 'Masa Siparişi' || 
                  s.notes?.toLowerCase().includes('garson')
                );
              } else {
                sale = pendingSales.find(s => {
                  if (s.restaurant_table_id === table.id) return true;
                  const sName = normalizeName(s.customer_name);
                  const tNum = normalizeName(table.table_number);
                  return sName === tNum || sName === `masa${tNum}` || sName.includes(`masa${tNum}`) || sName === `table${tNum}`;
                });
              }

              if (sale) {
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
              } else {
                setActiveSaleId(null);
                setCart([]);
              }
            } else {
              setActiveSaleId(null);
              setCart([]);
            }
          }}
        />
      </div>
    </>
  );
};

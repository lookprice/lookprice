import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export interface Table {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied';
  isGarsonTable?: boolean;
  orderCount?: number;
  totalAmount?: number;
}

interface TableGridProps {
  storeId: number;
  onTableSelect: (table: Table) => void;
  refreshTrigger?: number;
  pendingSales?: any[];
}

export const TableGrid = ({ storeId, onTableSelect, refreshTrigger, pendingSales = [] }: TableGridProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.getRestaurantTables(storeId);
        if (Array.isArray(res)) {
            setTables(res);
        }
      } catch (e) {
        console.error("Error fetching tables:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [storeId, refreshTrigger]);

  if (loading) return <div className="text-center p-4 font-bold text-slate-500">Masalar yükleniyor...</div>;

  // Find unassigned or Garson pending sales
  const garsonSales = pendingSales.filter(s => 
    s.restaurant_table_id === null || 
    s.customer_name?.toLowerCase().includes('garson') || 
    s.customer_name === 'Masa Siparişi' ||
    s.notes?.toLowerCase().includes('garson')
  );

  const garsonTotal = garsonSales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
  const garsonCount = garsonSales.length;

  const garsonTableObj: Table = {
    id: -999,
    table_number: 'Garson Masası',
    status: garsonCount > 0 ? 'occupied' : 'empty',
    isGarsonTable: true,
    orderCount: garsonCount,
    totalAmount: garsonTotal
  };

  const allDisplayTables = [garsonTableObj, ...tables];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {allDisplayTables.map((table) => {
        if (table.isGarsonTable) {
          return (
            <motion.button
              key="garson-virtual-table"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTableSelect(table)}
              className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all relative ${
                table.status === 'occupied'
                  ? 'border-amber-400 bg-amber-50/90 text-amber-900 shadow-md shadow-amber-500/10 ring-2 ring-amber-300'
                  : 'border-slate-200 bg-slate-50/90 text-slate-700 hover:border-amber-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <UserCheck className="h-7 w-7" />
              </div>
              <span className="font-extrabold text-base tracking-tight">{table.table_number}</span>
              
              {table.status === 'occupied' ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-black bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-lg">
                    {table.orderCount} Sipariş ({table.totalAmount?.toFixed(2)} ₺)
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Adisyonu İncele / Kapat</span>
                </div>
              ) : (
                <span className="text-xs bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-md font-bold">
                  Ayakta / Masa Seçilmemiş
                </span>
              )}
            </motion.button>
          );
        }

        return (
          <motion.button
            key={table.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTableSelect(table)}
            className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
              table.status === 'empty'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <Coffee className="h-8 w-8" />
            <span className="font-bold text-lg">{table.table_number}</span>
            {table.status === 'empty' && (
              <span className="text-xs bg-emerald-100 px-2 py-1 rounded-md">Adisyon Aç</span>
            )}
            {table.status === 'occupied' && (
              <span className="text-xs bg-rose-100 px-2 py-1 rounded-md">Dolu</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Coffee, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const t = (tr: string, en: string, el: string) => {
    if (lang === 'tr') return tr;
    if (lang === 'el') return el;
    return en;
  };
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

  if (loading) return <div className="text-center p-4 font-bold text-slate-500">{t('Masalar yükleniyor...', 'Loading tables...', 'Φόρτωση τραπεζιών...')}</div>;

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
    table_number: t('Garson Masası', 'Waiter Table', 'Τραπέζι Σερβιτόρου'),
    status: garsonCount > 0 ? 'occupied' : 'empty',
    isGarsonTable: true,
    orderCount: garsonCount,
    totalAmount: garsonTotal
  };

  const allDisplayTables = [garsonTableObj, ...tables];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 p-2">
      {allDisplayTables.map((table) => {
        if (table.isGarsonTable) {
          return (
            <motion.button
              key="garson-virtual-table"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTableSelect(table)}
              className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-between gap-2 transition-all relative cursor-pointer min-h-[105px] ${
                table.status === 'occupied'
                  ? 'border-amber-400 bg-amber-50/90 text-amber-900 shadow-sm ring-2 ring-amber-300'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-sm tracking-tight">{table.table_number}</span>
              </div>
              
              {table.status === 'occupied' ? (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  <span className="text-[11px] font-black bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-md w-full truncate">
                    {table.orderCount} {t('Sipariş', 'Orders', 'Παραγγελίες')} ({table.totalAmount?.toFixed(2)} ₺)
                  </span>
                  <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-wider">{t('Adisyonu İncele', 'View Bill', 'Προβολή Λογαριασμού')}</span>
                </div>
              ) : (
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                  {t('Ayakta / Masa Seçilmemiş', 'Walk-up / No Table', 'Όρθιοι / Χωρίς Τραπέζι')}
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
            className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-between gap-2 transition-all cursor-pointer min-h-[105px] ${
              table.status === 'empty'
                ? 'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800'
                : 'border-rose-300 bg-rose-50 text-rose-800 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <Coffee className={`h-5 w-5 ${table.status === 'empty' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span className="font-extrabold text-base tracking-tight">{table.table_number}</span>
            </div>
            {table.status === 'empty' && (
              <span className="text-[11px] bg-emerald-100/90 text-emerald-800 font-bold px-2.5 py-0.5 rounded-md border border-emerald-200/60">{t('Adisyon Aç', 'Open Bill', 'Άνοιγμα Λογαριασμού')}</span>
            )}
            {table.status === 'occupied' && (
              <span className="text-[11px] bg-rose-200/80 text-rose-900 font-extrabold px-2.5 py-0.5 rounded-md border border-rose-300">{t('Dolu / İncele', 'Occupied / View', 'Κατειλημμένο / Προβολή')}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

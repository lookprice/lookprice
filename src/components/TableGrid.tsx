import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Coffee } from 'lucide-react';
import { api } from '../services/api';

interface Table {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied';
}

interface TableGridProps {
  storeId: number;
  onTableSelect: (table: Table) => void;
  refreshTrigger?: number;
}

export const TableGrid = ({ storeId, onTableSelect, refreshTrigger }: TableGridProps) => {
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

  if (loading) return <div className="text-center p-4">Yükleniyor...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {tables.map((table) => (
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
      ))}
    </div>
  );
};

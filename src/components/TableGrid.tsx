import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, UserCheck, Tag, X, Check, Trash2, Sparkles, Edit3, Search } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export interface Table {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied';
  isGarsonTable?: boolean;
  orderCount?: number;
  totalAmount?: number;
  nickname?: string;
}

interface TableGridProps {
  storeId: number;
  onTableSelect: (table: Table) => void;
  refreshTrigger?: number;
  pendingSales?: any[];
}

export const getStoredTableNicknames = (storeId: number): Record<string, string> => {
  try {
    const raw = localStorage.getItem(`horeca_table_nicknames_${storeId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveTableNickname = (storeId: number, tableNumber: string, nickname: string) => {
  try {
    const cleanNum = tableNumber.replace(/^Masa\s+/i, '').trim();
    const current = getStoredTableNicknames(storeId);
    if (!nickname || nickname.trim() === '') {
      delete current[cleanNum];
      delete current[tableNumber];
    } else {
      current[cleanNum] = nickname.trim();
    }
    localStorage.setItem(`horeca_table_nicknames_${storeId}`, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(`table-nicknames-updated-${storeId}`));
  } catch (e) {
    console.error("Error saving table nickname:", e);
  }
};

export const clearStoredTableNickname = (storeId: number, tableNumber: string) => {
  try {
    const cleanNum = tableNumber.replace(/^Masa\s+/i, '').trim();
    const current = getStoredTableNicknames(storeId);
    delete current[cleanNum];
    delete current[tableNumber];
    localStorage.setItem(`horeca_table_nicknames_${storeId}`, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(`table-nicknames-updated-${storeId}`));
  } catch (e) {
    console.error("Error clearing table nickname:", e);
  }
};

export const transferStoredTableNickname = (storeId: number, fromTable: string, toTable: string) => {
  try {
    const cleanFrom = fromTable.replace(/^Masa\s+/i, '').trim();
    const cleanTo = toTable.replace(/^Masa\s+/i, '').trim();
    const current = getStoredTableNicknames(storeId);
    const existingNick = current[cleanFrom] || current[fromTable];
    if (existingNick) {
      current[cleanTo] = existingNick;
      delete current[cleanFrom];
      delete current[fromTable];
      localStorage.setItem(`horeca_table_nicknames_${storeId}`, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent(`table-nicknames-updated-${storeId}`));
    }
  } catch (e) {
    console.error("Error transferring table nickname:", e);
  }
};

export const TableGrid = ({ storeId, onTableSelect, refreshTrigger, pendingSales = [] }: TableGridProps) => {
  const { lang } = useLanguage();
  const t = (tr: string, en: string, el: string) => {
    if (lang === 'tr') return tr;
    if (lang === 'el') return el;
    return en;
  };
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Nickname Modal State
  const [nicknameModalTable, setNicknameModalTable] = useState<Table | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

  // Long-press timer ref & pressing state for touch feedback
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const [pressingTableId, setPressingTableId] = useState<number | null>(null);

  // Load nicknames
  useEffect(() => {
    const loadNicks = () => {
      setNicknames(getStoredTableNicknames(storeId));
    };
    loadNicks();
    const handleUpdated = () => loadNicks();
    window.addEventListener(`table-nicknames-updated-${storeId}`, handleUpdated);
    return () => {
      window.removeEventListener(`table-nicknames-updated-${storeId}`, handleUpdated);
    };
  }, [storeId]);

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

  const handleOpenNicknameModal = (table: Table, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const cleanNum = table.table_number.replace(/^Masa\s+/i, '').trim();
    const currentNick = nicknames[cleanNum] || nicknames[table.table_number] || '';
    setNicknameModalTable(table);
    setNicknameInput(currentNick);
  };

  const handleSaveNickname = () => {
    if (!nicknameModalTable) return;
    saveTableNickname(storeId, nicknameModalTable.table_number, nicknameInput);
    setNicknameModalTable(null);
  };

  const handleClearNickname = () => {
    if (!nicknameModalTable) return;
    clearStoredTableNickname(storeId, nicknameModalTable.table_number);
    setNicknameModalTable(null);
  };

  // Touch Long-Press handlers (optimized for touch screens: ~1100ms with haptic vibration)
  const startLongPress = (table: Table) => {
    isLongPressRef.current = false;
    setPressingTableId(table.id);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setPressingTableId(null);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([40, 60, 40]); } catch (err) {}
      }
      handleOpenNicknameModal(table);
    }, 1100);
  };

  const cancelLongPress = () => {
    setPressingTableId(null);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTableClick = (table: Table) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onTableSelect(table);
  };

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

  const quickPresets = [
    'Selçuk Bey',
    'Ahmet Bey',
    'Mehmet Bey',
    'VIP Grup',
    'Balkon Köşe',
    'Bahçe 4\'lü',
    'Mavi Gömlekli',
    'Aile Masası',
    'Toplantı',
    'Rezervasyon'
  ];

  const filteredTables = allDisplayTables.filter((table) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanNum = table.table_number.replace(/^Masa\s+/i, '').trim();
    const nick = (nicknames[cleanNum] || nicknames[table.table_number] || '').toLowerCase();
    return table.table_number.toLowerCase().includes(q) || cleanNum.includes(q) || nick.includes(q);
  });

  return (
    <>
      {/* Quick Search & Hint Toolbar */}
      <div className="px-2 pt-1 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 mb-1">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('Masa no veya takma ad ara (Örn: Selçuk, 5, VIP)...', 'Search table or nickname (e.g. Selçuk, 5)...', 'Αναζήτηση τραπεζιού...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100/90 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold bg-amber-50/80 border border-amber-200/80 px-2.5 py-1 rounded-lg">
          <Tag className="h-3 w-3 text-amber-600 shrink-0" />
          <span>{t('Masa İsimlendirme: Çift tıkla veya basılı tut', 'Table Nickname: Double-click or Long-press', 'Ορισμός ονόματος: Διπλό κλικ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 p-1.5 select-none">
        {filteredTables.length === 0 ? (
          <div className="col-span-full py-6 text-center text-slate-400 text-xs font-bold">
            {t('Aramanıza uygun masa bulunamadı.', 'No tables found matching your search.', 'Δεν βρέθηκαν τραπέζια.')}
          </div>
        ) : filteredTables.map((table) => {
          const cleanNum = table.table_number.replace(/^Masa\s+/i, '').trim();
          const tableNick = nicknames[cleanNum] || nicknames[table.table_number] || '';
          const isPressing = pressingTableId === table.id;

          if (table.isGarsonTable) {
            return (
              <motion.button
                key="garson-virtual-table"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTableSelect(table)}
                className={`p-2 sm:p-2.5 rounded-xl border-2 flex flex-col items-center justify-between gap-1 transition-all relative cursor-pointer min-h-[68px] sm:min-h-[72px] shadow-2xs ${
                  table.status === 'occupied'
                    ? 'border-amber-400 bg-amber-50/90 text-amber-900 ring-1 ring-amber-300'
                    : 'border-amber-200 bg-amber-50/50 text-amber-900 hover:border-amber-400 hover:bg-amber-50/90'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full justify-center">
                  <div className="p-1 rounded-md bg-amber-100 text-amber-800 shrink-0">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">{table.table_number}</span>
                </div>
                
                {table.status === 'occupied' ? (
                  <div className="w-full flex items-center justify-center">
                    <span className="text-[10px] font-black bg-amber-200/90 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300/80 w-full truncate text-center">
                      {table.orderCount} {t('Sipariş', 'Orders', 'Παρ.')} ({table.totalAmount?.toFixed(2)} ₺)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-0.5 bg-amber-100/70 text-amber-800 rounded border border-amber-300/60 w-full text-center">
                    <UserCheck className="h-3 w-3 text-amber-700" />
                  </div>
                )}
              </motion.button>
            );
          }

          return (
            <motion.div
              key={table.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onTouchStart={() => startLongPress(table)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onClick={() => handleTableClick(table)}
              onDoubleClick={(e) => handleOpenNicknameModal(table, e as any)}
              className={`p-2 sm:p-2.5 rounded-xl border-2 flex flex-col items-center justify-between gap-1 transition-all cursor-pointer min-h-[68px] sm:min-h-[72px] relative group select-none ${
                isPressing
                  ? 'ring-4 ring-amber-400 border-amber-500 scale-98 bg-amber-50'
                  : table.status === 'empty'
                    ? 'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 shadow-2xs'
                    : 'border-rose-300 bg-rose-50 hover:bg-rose-100/80 text-rose-900 shadow-xs'
              }`}
            >
              {/* Touch Long-Press Progress / Active Indicator */}
              {isPressing && (
                <div className="absolute inset-x-2 top-1 h-1 bg-amber-300 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 animate-pulse w-full" />
                </div>
              )}

              {/* Quick Tag Edit Button in Top-Right Corner */}
              <button
                type="button"
                title={t('Masa Takma Adı / Nickname Ata (Çift Tıkla veya Basılı Tut)', 'Assign Table Nickname (Double-click or Long-press)', 'Ορισμός ψευδωνύμου τραπεζιού')}
                onClick={(e) => handleOpenNicknameModal(table, e)}
                className={`absolute top-1 right-1 p-0.5 rounded transition-all z-10 cursor-pointer ${
                  tableNick 
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-2xs' 
                    : 'bg-white/70 text-slate-400 hover:text-indigo-600 hover:bg-white opacity-0 group-hover:opacity-100'
                }`}
              >
                <Tag className="h-3 w-3" />
              </button>

              {/* Table Title Header */}
              <div className="flex items-center gap-1">
                <Coffee className={`h-3.5 w-3.5 shrink-0 ${table.status === 'empty' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span className="font-black text-xs sm:text-sm tracking-tight truncate">{table.table_number}</span>
              </div>

              {/* Prominent Nickname Badge if defined */}
              {tableNick && (
                <div 
                  onClick={(e) => handleOpenNicknameModal(table, e)}
                  title={t('Takma adı düzenle', 'Edit nickname', 'Επεξεργασία ψευδωνύμου')}
                  className="w-full flex items-center justify-center gap-1 px-1 py-0.2 rounded bg-amber-100/95 text-amber-900 border border-amber-300 text-[9.5px] font-bold truncate shadow-2xs hover:bg-amber-200 transition-colors"
                >
                  <Tag className="h-2 w-2 shrink-0 text-amber-700" />
                  <span className="truncate">{tableNick}</span>
                </div>
              )}

              {/* Table Status Badge */}
              {table.status === 'empty' && (
                <span className="text-[10px] bg-emerald-100/90 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200/60 text-center w-full truncate">
                  {t('Boş', 'Empty', 'Άδειο')}
                </span>
              )}
              {table.status === 'occupied' && (
                <span className="text-[10px] bg-rose-200/90 text-rose-950 font-extrabold px-1.5 py-0.5 rounded border border-rose-300 text-center w-full truncate">
                  {table.totalAmount && table.totalAmount > 0 ? `${table.totalAmount.toFixed(2)} ₺` : t('Dolu', 'Occupied', 'Dolu')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Temporary Table Nickname Modal */}
      <AnimatePresence>
        {nicknameModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {nicknameModalTable.table_number} — {t('Geçici Masa Takma Adı', 'Table Nickname / Note', 'Ψευδώνυμο Τραπεζιού')}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {t('Hesap kapatılana kadar masayı kolayca tanımanızı sağlar', 'Helps identify the table until the bill is closed', 'Βοηθά στην αναγνώριση του τραπεζιού')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNicknameModalTable(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Input field */}
              <div className="space-y-3 mb-4">
                <label className="block text-xs font-bold text-slate-700">
                  {t('Masa Takma Adı / Müşteri Notu (Örn: Selçuk Bey, VIP Köşe):', 'Table Nickname / Note (e.g. Selçuk Bey, VIP Corner):', 'Ψευδώνυμο / Σημείωση:')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder={t('Örn: Selçuk Bey, Mavi Gömlekli...', 'e.g. Selçuk Bey, Blue Shirt...', 'π.χ. Selçuk Bey...')}
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNickname();
                      if (e.key === 'Escape') setNicknameModalTable(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                  {nicknameInput && (
                    <button
                      type="button"
                      onClick={() => setNicknameInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{t('Hızlı Seçenekler:', 'Quick Suggestions:', 'Γρήγορες επιλογές:')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNicknameInput(preset)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                        nicknameInput === preset
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-100 hover:bg-amber-50 hover:border-amber-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {nicknames[nicknameModalTable.table_number.replace(/^Masa\s+/i, '').trim()] || nicknames[nicknameModalTable.table_number] ? (
                  <button
                    type="button"
                    onClick={handleClearNickname}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('İsmi Kaldır', 'Remove Name', 'Διαγραφή')}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNicknameModalTable(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Vazgeç', 'Cancel', 'Ακύρωση')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>{t('Kaydet', 'Save', 'Αποθήκευση')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

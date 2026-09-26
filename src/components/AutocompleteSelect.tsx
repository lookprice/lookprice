import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building2, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeSearch } from '../lib/searchUtils';

interface AutocompleteSelectProps {
  items: any[];
  onSelect: (item: any) => void;
  onQuickAdd?: (search: string) => void;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  label?: string;
  displayField: string;
  secondaryField?: string;
  type: 'customer' | 'product' | 'company' | 'all-accounts';
  lang: 'tr' | 'en';
  value: string;
}

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  items,
  onSelect,
  onQuickAdd,
  onSearchChange,
  placeholder,
  label,
  displayField,
  secondaryField,
  type,
  lang,
  value
}) => {
  const [search, setSearch] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTr = lang === 'tr';

  // Synchronize internal search state when external value changes
  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant real-time relevance-weighted search filtering
  const filteredItems = React.useMemo(() => {
    const rawSearch = normalizeSearch(search || '').trim();
    if (!rawSearch) return items;

    const searchTerms = rawSearch.split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return items;

    const scoredItems: { item: any; score: number }[] = [];

    for (const item of items) {
      if (!item) continue;
      const titleTarget = normalizeSearch(item[displayField] || item.title || item.company_title || item.full_name || [item.name, item.surname].filter(Boolean).join(' ') || item.name || '');
      const taxTarget = normalizeSearch(String(item.tax_number || item.tc_id || item.vkn || ''));
      const phoneTarget = normalizeSearch(String(item.phone || item.tel || item.gsm || ''));
      const emailTarget = normalizeSearch(String(item.email || ''));
      const codeTarget = normalizeSearch(String(item.code || item.barcode || item.customer_code || item.company_code || ''));
      const cityTarget = normalizeSearch(String(item.city || item.district || item.tax_office || ''));

      const searchableFields = [titleTarget, taxTarget, phoneTarget, emailTarget, codeTarget, cityTarget].filter(Boolean);
      const combinedCleanText = searchableFields.join(' ');

      // Every search term must be found in the clean actual data fields
      const matchesAll = searchTerms.every(term => combinedCleanText.includes(term));
      if (!matchesAll) continue;

      let score = 0;
      // High score for exact or start-of-title matches
      if (titleTarget === rawSearch) {
        score += 10000;
      } else if (titleTarget.startsWith(rawSearch)) {
        score += 5000;
      } else {
        const words = titleTarget.split(/\s+/);
        if (words.some(w => w.startsWith(rawSearch))) {
          score += 3000;
        } else if (titleTarget.includes(rawSearch)) {
          score += 1500;
        }
      }

      if (taxTarget === rawSearch) {
        score += 8000;
      } else if (taxTarget.startsWith(rawSearch)) {
        score += 4000;
      } else if (taxTarget.includes(rawSearch)) {
        score += 2000;
      }

      if (codeTarget.startsWith(rawSearch)) score += 3000;
      if (phoneTarget.includes(rawSearch)) score += 1000;
      if (emailTarget.includes(rawSearch)) score += 800;
      if (cityTarget.includes(rawSearch)) score += 400;

      scoredItems.push({ item, score });
    }

    // Sort by relevance score descending
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.map(si => si.item);
  }, [items, search, displayField]);

  const getIcon = (itemType?: string) => {
    const activeType = itemType || type;
    if (activeType === 'product' || activeType === 'part' || activeType === 'labor') return <Package className="h-4 w-4 text-slate-400" />;
    if (activeType === 'company') return <Building2 className="h-4 w-4 text-indigo-600" />;
    return <User className="h-4 w-4 text-emerald-600" />;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
    setShowDropdown(true);
  };

  const handleClear = () => {
    setSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
    onSelect(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {getIcon()}
        </div>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal"
          placeholder={placeholder}
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200/80 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
            title={isTr ? "Temizle" : "Clear"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {onQuickAdd && search.trim() !== "" && (
              <div className="p-2 bg-indigo-50/70 border-b border-indigo-100">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onQuickAdd(search);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-700 hover:bg-indigo-50 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                  {isTr ? `Hızlı Yeni Ekle: "${search}"` : `Quick Add New: "${search}"`}
                </button>
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="py-1">
                {filteredItems.map((item, idx) => {
                  const uniqueKey = `${item.type || 'item'}-${item.id || ''}-${item.tax_number || ''}-${idx}`;
                  const title = item[displayField] || item.title || item.company_title || item.full_name || [item.name, item.surname].filter(Boolean).join(' ') || item.name || '';
                  const subInfo = (secondaryField && item[secondaryField]) || item.secondary_info || '';

                  return (
                    <button
                      key={uniqueKey}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/80 transition-colors flex items-center gap-3 group border-b border-slate-50 last:border-0 cursor-pointer"
                      onClick={() => {
                        onSelect(item);
                        const selectedTitle = item[displayField] || item.title || item.company_title || item.name || '';
                        setSearch(selectedTitle);
                        if (onSearchChange) {
                          onSearchChange(selectedTitle);
                        }
                        setShowDropdown(false);
                      }}
                    >
                      <div className="p-2 bg-slate-100 group-hover:bg-white group-hover:shadow-xs rounded-xl transition-all shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-black text-slate-800 group-hover:text-indigo-900 truncate">
                            {title}
                          </div>
                          {item.type && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider shrink-0 ${
                              item.type === 'company' 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {item.type === 'company' ? (isTr ? 'KURUMSAL' : 'CORP') : (isTr ? 'BİREYSEL' : 'INDIV')}
                            </span>
                          )}
                        </div>
                        {subInfo ? (
                          <div className="text-[10px] text-slate-500 font-bold truncate mt-0.5">
                            {subInfo}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-bold">
                  {isTr ? `"${search}" ile eşleşen cari hesap bulunamadı` : `No records matching "${search}"`}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building2, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { normalizeSearch } from '../lib/searchUtils';

interface AutocompleteSelectProps {
  items: any[];
  onSelect: (item: any) => void;
  onQuickAdd?: (search: string) => void;
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

  useEffect(() => {
    setSearch(value);
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
    const rawSearch = normalizeSearch(search).trim();
    if (!rawSearch) return items;

    const searchTerms = rawSearch.split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return items;

    const scoredItems: { item: any; score: number }[] = [];

    for (const item of items) {
      const mainVal = normalizeSearch(item[displayField] || item.title || item.company_title || item.full_name || [item.name, item.surname].filter(Boolean).join(' ') || '');
      const secVal = secondaryField ? normalizeSearch(item[secondaryField] || item.secondary_info || '') : '';
      const taxVal = normalizeSearch(item.tax_number || item.tc_id || '');
      const phoneVal = normalizeSearch(item.phone || '');
      const emailVal = normalizeSearch(item.email || '');

      const combinedText = `${mainVal} ${secVal} ${taxVal} ${phoneVal} ${emailVal}`;

      // Every search term must be matched
      const matchesAll = searchTerms.every(term => combinedText.includes(term));
      if (!matchesAll) continue;

      let score = 0;
      // High score for exact or start-of-title matches
      if (mainVal === rawSearch) {
        score += 1000;
      } else if (mainVal.startsWith(rawSearch)) {
        score += 500;
      } else if (mainVal.includes(rawSearch)) {
        score += 200;
      } else {
        // Individual word start matches
        const words = mainVal.split(/\s+/);
        if (words.some(w => w.startsWith(rawSearch))) {
          score += 150;
        }
      }

      if (taxVal && taxVal.includes(rawSearch)) score += 100;
      if (phoneVal && phoneVal.includes(rawSearch)) score += 80;
      if (emailVal && emailVal.includes(rawSearch)) score += 60;

      scoredItems.push({ item, score });
    }

    // Sort by relevance score descending
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.map(si => si.item);
  }, [items, search, displayField, secondaryField]);

  const getIcon = (itemType?: string) => {
    const activeType = itemType || type;
    if (activeType === 'product' || activeType === 'part' || activeType === 'labor') return <Package className="h-4 w-4 text-slate-400" />;
    if (activeType === 'company') return <Building2 className="h-4 w-4 text-indigo-600" />;
    return <User className="h-4 w-4 text-emerald-600" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
            // Optional: If we want to allow typing freely but still trigger selection logic
            // onSelect({ [displayField]: e.target.value, isFreeText: true });
          }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold text-slate-700 outline-none"
          placeholder={placeholder}
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onSelect(null);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (search.length > 0 || filteredItems.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {onQuickAdd && search.trim() !== "" && (
              <div className="p-2 bg-indigo-50/50 border-b border-indigo-100/50">
                <button
                  type="button"
                  onClick={() => {
                    onQuickAdd(search);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 animate-pulse" />
                  {isTr ? `Hızlı Yeni Ekle: "${search}"` : `Quick Add New: "${search}"`}
                </button>
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="py-2">
                {filteredItems.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center gap-3 group border-b border-slate-50 last:border-0"
                    onClick={() => {
                      onSelect(item);
                      setSearch(item[displayField] || item.name || item.title || '');
                      setShowDropdown(false);
                    }}
                  >
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-slate-800 truncate">
                          {item[displayField] || item.title || item.company_title || item.full_name || [item.name, item.surname].filter(Boolean).join(' ') || ''}
                        </div>
                        {item.type && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider shrink-0 ${
                            item.type === 'company' 
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.type === 'company' ? (isTr ? 'KURUMSAL' : 'CORP') : (isTr ? 'BİREYSEL' : 'INDIV')}
                          </span>
                        )}
                      </div>
                      {(secondaryField && item[secondaryField]) || item.secondary_info ? (
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item[secondaryField] || item.secondary_info}
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {isTr ? 'Sonuç bulunamadı' : 'No results found'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

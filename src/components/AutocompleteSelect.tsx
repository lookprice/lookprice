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

  // Synchronize internal search state when external value changes, resolving technical IDs if passed
  useEffect(() => {
    const rawVal = value || '';
    if (rawVal && (/^(comp|cust)_\d+$/.test(rawVal) || /^\d+$/.test(rawVal))) {
      const matched = items.find(
        (it) =>
          it &&
          (String(it.id) === rawVal ||
            String(it.value) === rawVal ||
            `comp_${it.id}` === rawVal ||
            `cust_${it.id}` === rawVal)
      );
      if (matched) {
        const resolvedTitle =
          matched[displayField] ||
          matched.label ||
          matched.display ||
          matched.title ||
          matched.company_title ||
          matched.full_name ||
          [matched.name, matched.surname].filter(Boolean).join(' ') ||
          matched.name ||
          '';
        setSearch(resolvedTitle);
        return;
      }
    }
    setSearch(rawVal);
  }, [value, items, displayField]);

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
      const rawObj = item.raw || item;
      const titleTarget = normalizeSearch(
        item[displayField] ||
          item.label ||
          item.display ||
          rawObj.title ||
          rawObj.company_title ||
          rawObj.full_name ||
          [rawObj.name, rawObj.surname].filter(Boolean).join(' ') ||
          rawObj.name ||
          ''
      );
      const taxTarget = normalizeSearch(String(rawObj.tax_number || rawObj.tc_id || rawObj.vkn || ''));
      const phoneTarget = normalizeSearch(String(rawObj.phone || rawObj.tel || rawObj.gsm || ''));
      const emailTarget = normalizeSearch(String(rawObj.email || ''));
      const codeTarget = normalizeSearch(String(rawObj.code || rawObj.barcode || rawObj.customer_code || rawObj.company_code || ''));
      const cityTarget = normalizeSearch(String(rawObj.city || rawObj.district || rawObj.tax_office || ''));

      const searchableFields = [titleTarget, taxTarget, phoneTarget, emailTarget, codeTarget, cityTarget].filter(Boolean);
      const combinedCleanText = searchableFields.join(' ');

      // Every search term must be found in the clean actual data fields
      const matchesAll = searchTerms.every(term => combinedCleanText.includes(term));
      if (!matchesAll) continue;

      let score = 0;
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
        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {getIcon()}
        </div>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs font-normal text-slate-800 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200/80 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
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
            className="absolute z-[120] left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
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
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  {isTr ? `Hızlı Yeni Ekle: "${search}"` : `Quick Add New: "${search}"`}
                </button>
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="py-1">
                {filteredItems.map((item, idx) => {
                  const rawObj = item.raw || item;
                  const uniqueKey = `${item.type || 'item'}-${item.id || ''}-${rawObj.tax_number || ''}-${idx}`;
                  const title =
                    item[displayField] ||
                    item.label ||
                    item.display ||
                    rawObj.title ||
                    rawObj.company_title ||
                    rawObj.full_name ||
                    [rawObj.name, rawObj.surname].filter(Boolean).join(' ') ||
                    rawObj.name ||
                    '';
                  const subInfo =
                    (secondaryField && item[secondaryField]) ||
                    item.secondary_info ||
                    [
                      rawObj.tax_number || rawObj.tc_id ? `VKN/TC: ${rawObj.tax_number || rawObj.tc_id}` : '',
                      rawObj.phone ? `Tel: ${rawObj.phone}` : ''
                    ]
                      .filter(Boolean)
                      .join(' • ');

                  return (
                    <button
                      key={uniqueKey}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/70 transition-colors flex items-center gap-2.5 group border-b border-slate-50 last:border-0 cursor-pointer"
                      onClick={() => {
                        onSelect(item);
                        const selectedTitle =
                          item[displayField] ||
                          item.label ||
                          item.display ||
                          rawObj.title ||
                          rawObj.company_title ||
                          rawObj.name ||
                          '';
                        setSearch(selectedTitle);
                        if (onSearchChange) {
                          onSearchChange(selectedTitle);
                        }
                        setShowDropdown(false);
                      }}
                    >
                      <div className="p-1.5 bg-slate-100 group-hover:bg-white group-hover:shadow-xs rounded-lg transition-all shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium text-slate-800 group-hover:text-indigo-900 truncate">
                            {title}
                          </div>
                          {item.type && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wide shrink-0 ${
                              item.type === 'company' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {item.type === 'company' ? (isTr ? 'KURUMSAL' : 'CORP') : (isTr ? 'BİREYSEL' : 'INDIV')}
                            </span>
                          )}
                        </div>
                        {subInfo ? (
                          <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
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
                <p className="text-xs text-slate-400 font-normal">
                  {isTr ? `"${search}" ile eşleşen kayıt bulunamadı` : `No records matching "${search}"`}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

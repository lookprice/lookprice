import React, { useState, useRef, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  ListPlus, 
  ListCollapse, 
  Sparkles,
  Check,
  X,
  LayoutGrid
} from 'lucide-react';
import { TableManagerState, MetadataLayoutMode, TablePreset } from '@/hooks/useTableManager';

interface TableManagerProps {
  manager: TableManagerState;
  presets?: TablePreset[];
  lang?: string;
  title?: string;
  className?: string;
  allRowIds?: (string | number)[];
}

export const TableManager: React.FC<TableManagerProps> = ({
  manager,
  presets,
  lang = 'tr',
  title,
  className = '',
  allRowIds = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const defaultPresets: TablePreset[] = presets || [
    {
      id: 'compact',
      label: lang === 'tr' ? 'Ultra Sade' : 'Minimal',
      columns: ['product', 'price', 'stock', 'actions'],
      metadataMode: 'expandable'
    },
    {
      id: 'standard',
      label: lang === 'tr' ? 'Standart' : 'Standard',
      columns: ['barcode', 'image', 'product', 'price', 'cost', 'stock', 'actions'],
      metadataMode: 'inline'
    },
    {
      id: 'detailed',
      label: lang === 'tr' ? 'Detaylı / Geniş' : 'Detailed',
      columns: ['barcode', 'image', 'product', 'branch', 'price', 'cost', 'stock', 'actions'],
      metadataMode: 'nested'
    }
  ];

  const hasHiddenColumns = manager.visibleColumnCount < manager.totalColumnCount;
  const isExpandableMode = manager.metadataMode === 'expandable';
  const hasExpandedRows = Object.values(manager.expandedRows).some(Boolean);

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={containerRef}>
      {/* Quick Expand / Collapse All for Expandable Mode */}
      {isExpandableMode && allRowIds.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (hasExpandedRows) {
              manager.collapseAllRows();
            } else {
              manager.expandAllRows(allRowIds);
            }
          }}
          className="os-btn-secondary p-2 text-slate-600 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 hover:border-indigo-200 shadow-xs flex items-center gap-1 text-xs font-semibold cursor-pointer"
          title={hasExpandedRows ? (lang === 'tr' ? 'Tüm Alt Satırları Daralt' : 'Collapse All Rows') : (lang === 'tr' ? 'Tüm Alt Satırları Genişlet' : 'Expand All Rows')}
        >
          {hasExpandedRows ? (
            <>
              <ListCollapse className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">{lang === 'tr' ? 'Tümünü Daralt' : 'Collapse All'}</span>
            </>
          ) : (
            <>
              <ListPlus className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">{lang === 'tr' ? 'Tümünü Genişlet' : 'Expand All'}</span>
            </>
          )}
        </button>
      )}

      {/* Main Table Manager Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer select-none shadow-xs ${
          isOpen || hasHiddenColumns || manager.metadataMode !== 'inline'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
        title={title || (lang === 'tr' ? 'Tablo Görünümü & Sütun Yöneticisi' : 'Table View & Column Manager')}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span className="hidden sm:inline">
          {lang === 'tr' ? 'Görünüm' : 'View'}
        </span>
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100/80 text-indigo-900">
          {manager.visibleColumnCount}/{manager.totalColumnCount}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900">
                {lang === 'tr' ? 'Tablo & Sütun Düzeni' : 'Table & Column Layout'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{lang === 'tr' ? 'Hızlı Şablonlar' : 'Presets'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {defaultPresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => manager.applyPreset(preset.id)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-[11px] font-semibold text-slate-700 text-center transition-all active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata Display Mode (Grouping & Nested Rows) */}
          <div className="mb-3 p-2 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>{lang === 'tr' ? 'Kategori & Ek Bilgi Gösterimi' : 'Metadata & Tag Layout'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => manager.setMetadataMode('inline')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium text-left flex items-center justify-between border transition-all ${
                  manager.metadataMode === 'inline'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{lang === 'tr' ? 'Satır İçi (Inline)' : 'Inline Tags'}</span>
                {manager.metadataMode === 'inline' && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => manager.setMetadataMode('expandable')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium text-left flex items-center justify-between border transition-all ${
                  manager.metadataMode === 'expandable'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{lang === 'tr' ? 'Açılır Alt Satır' : 'Expandable Row'}</span>
                {manager.metadataMode === 'expandable' && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => manager.setMetadataMode('nested')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium text-left flex items-center justify-between border transition-all ${
                  manager.metadataMode === 'nested'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{lang === 'tr' ? 'Sürekli Alt Satır' : 'Always Nested'}</span>
                {manager.metadataMode === 'nested' && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => manager.setMetadataMode('hidden')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium text-left flex items-center justify-between border transition-all ${
                  manager.metadataMode === 'hidden'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{lang === 'tr' ? 'Gizle (Minimal)' : 'Hide Tags'}</span>
                {manager.metadataMode === 'hidden' && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
              </button>
            </div>
          </div>

          {/* Column Toggle Checklist */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{lang === 'tr' ? 'Sütunları Aç / Kapat' : 'Toggle Columns'}</span>
              <span className="text-[9px] font-medium text-slate-400">
                {manager.visibleColumnCount} / {manager.totalColumnCount} {lang === 'tr' ? 'aktif' : 'active'}
              </span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {manager.columns.map(col => {
                const isVisible = manager.isColumnVisible(col.id);
                return (
                  <label
                    key={col.id}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      col.required
                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        : isVisible
                        ? 'hover:bg-slate-100 text-slate-800'
                        : 'hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      {col.label}
                      {col.required && (
                        <span className="text-[9px] text-slate-400 italic">
                          ({lang === 'tr' ? 'Zorunlu' : 'Required'})
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      disabled={col.required}
                      checked={isVisible}
                      onChange={() => manager.toggleColumn(col.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer / Reset */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={manager.resetToDefaults}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'tr' ? 'Varsayılana Sıfırla' : 'Reset to Default'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all"
            >
              {lang === 'tr' ? 'Uygula' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

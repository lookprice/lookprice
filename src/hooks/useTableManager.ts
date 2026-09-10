import { useState, useEffect, useCallback, useMemo } from 'react';

export type MetadataLayoutMode = 'inline' | 'expandable' | 'nested' | 'hidden';

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible?: boolean;
  required?: boolean;
  category?: 'primary' | 'pricing' | 'inventory' | 'metadata' | 'actions';
}

export interface TablePreset {
  id: string;
  label: string;
  columns: string[];
  metadataMode: MetadataLayoutMode;
}

export interface UseTableManagerOptions {
  tableKey: string;
  columns: ColumnDefinition[];
  defaultMetadataMode?: MetadataLayoutMode;
  presets?: TablePreset[];
}

export interface TableManagerState {
  visibleColumns: Record<string, boolean>;
  metadataMode: MetadataLayoutMode;
  expandedRows: Record<string | number, boolean>;
  isColumnVisible: (columnId: string) => boolean;
  toggleColumn: (columnId: string) => void;
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  setMetadataMode: (mode: MetadataLayoutMode) => void;
  toggleRowExpansion: (rowId: string | number) => void;
  isRowExpanded: (rowId: string | number) => boolean;
  expandAllRows: (rowIds: (string | number)[]) => void;
  collapseAllRows: () => void;
  applyPreset: (presetId: string) => void;
  resetToDefaults: () => void;
  visibleColumnCount: number;
  totalColumnCount: number;
  columns: ColumnDefinition[];
}

export function useTableManager({
  tableKey,
  columns,
  defaultMetadataMode = 'inline',
  presets = []
}: UseTableManagerOptions): TableManagerState {
  const storageKeyCols = `lp_table_${tableKey}_cols`;
  const storageKeyMeta = `lp_table_${tableKey}_meta`;

  // Initialize column states from localStorage or defaults
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKeyCols);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure required columns are always visible
        columns.forEach(col => {
          if (col.required) {
            parsed[col.id] = true;
          } else if (parsed[col.id] === undefined) {
            parsed[col.id] = col.defaultVisible !== false;
          }
        });
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load table column preferences', e);
    }

    const initial: Record<string, boolean> = {};
    columns.forEach(col => {
      initial[col.id] = col.defaultVisible !== false;
    });
    return initial;
  });

  // Initialize metadata layout mode
  const [metadataMode, setMetadataModeState] = useState<MetadataLayoutMode>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMeta) as MetadataLayoutMode;
      if (saved && ['inline', 'expandable', 'nested', 'hidden'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return defaultMetadataMode;
  });

  // Expanded row tracking for expandable mode
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});

  // Persist column changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyCols, JSON.stringify(visibleColumns));
    } catch (e) {
      // ignore
    }
  }, [visibleColumns, storageKeyCols]);

  // Persist metadata mode
  useEffect(() => {
    try {
      localStorage.setItem(storageKeyMeta, metadataMode);
    } catch (e) {
      // ignore
    }
  }, [metadataMode, storageKeyMeta]);

  const isColumnVisible = useCallback((columnId: string): boolean => {
    const colDef = columns.find(c => c.id === columnId);
    if (colDef?.required) return true;
    return visibleColumns[columnId] !== false;
  }, [columns, visibleColumns]);

  const toggleColumn = useCallback((columnId: string) => {
    const colDef = columns.find(c => c.id === columnId);
    if (colDef?.required) return;

    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  }, [columns]);

  const setColumnVisibility = useCallback((columnId: string, visible: boolean) => {
    const colDef = columns.find(c => c.id === columnId);
    if (colDef?.required) return;

    setVisibleColumns(prev => ({
      ...prev,
      [columnId]: visible
    }));
  }, [columns]);

  const setMetadataMode = useCallback((mode: MetadataLayoutMode) => {
    setMetadataModeState(mode);
  }, []);

  const toggleRowExpansion = useCallback((rowId: string | number) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  }, []);

  const isRowExpanded = useCallback((rowId: string | number): boolean => {
    if (metadataMode === 'nested') return true;
    if (metadataMode === 'hidden' || metadataMode === 'inline') return false;
    return !!expandedRows[rowId];
  }, [metadataMode, expandedRows]);

  const expandAllRows = useCallback((rowIds: (string | number)[]) => {
    const next: Record<string | number, boolean> = {};
    rowIds.forEach(id => {
      next[id] = true;
    });
    setExpandedRows(next);
  }, []);

  const collapseAllRows = useCallback(() => {
    setExpandedRows({});
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const nextCols: Record<string, boolean> = {};
    columns.forEach(col => {
      if (col.required) {
        nextCols[col.id] = true;
      } else {
        nextCols[col.id] = preset.columns.includes(col.id);
      }
    });

    setVisibleColumns(nextCols);
    if (preset.metadataMode) {
      setMetadataModeState(preset.metadataMode);
    }
  }, [presets, columns]);

  const resetToDefaults = useCallback(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach(col => {
      initial[col.id] = col.defaultVisible !== false;
    });
    setVisibleColumns(initial);
    setMetadataModeState(defaultMetadataMode);
    setExpandedRows({});
  }, [columns, defaultMetadataMode]);

  const visibleColumnCount = useMemo(() => {
    return columns.filter(c => c.required || visibleColumns[c.id] !== false).length;
  }, [columns, visibleColumns]);

  return {
    visibleColumns,
    metadataMode,
    expandedRows,
    isColumnVisible,
    toggleColumn,
    setColumnVisibility,
    setMetadataMode,
    toggleRowExpansion,
    isRowExpanded,
    expandAllRows,
    collapseAllRows,
    applyPreset,
    resetToDefaults,
    visibleColumnCount,
    totalColumnCount: columns.length,
    columns
  };
}

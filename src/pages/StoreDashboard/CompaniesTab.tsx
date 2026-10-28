import React, { useState, useDeferredValue, useEffect, useCallback, useMemo } from "react";
import { normalizeSearch } from "../../lib/searchUtils";
import { api } from "../../services/api";
import { formatDateTR } from "../../utils/formatUtils";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Download,
  Trash2,
  Edit2,
  FileCheck,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Filter,
  Building2,
  ShieldCheck,
  MessageSquare,
  Calendar,
  Eye,
  FolderArchive
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface CompaniesTabProps {
  companies: any[];
  isViewer: boolean;
  onViewTransactions: (company: any) => void;
  onEdit: (company: any) => void;
  onDelete: (id: any) => void;
  onExportReport: () => void;
  includeZero: boolean;
  onIncludeZeroChange: (val: boolean) => void;
  defaultCurrency?: string;
  branding?: any;
  onNewCompany?: () => void;
  onRefresh?: () => void;
  initialOpenRecon?: boolean;
  initialReconFilter?: 'all' | 'confirmed' | 'disputed' | 'pending';
}

const CompaniesTab = ({ 
  companies, 
  isViewer, 
  onViewTransactions, 
  onEdit,
  onDelete,
  onExportReport,
  includeZero,
  onIncludeZeroChange,
  defaultCurrency = 'TRY',
  branding,
  onNewCompany,
  onRefresh,
  initialOpenRecon,
  initialReconFilter
}: CompaniesTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const isTr = lang === 'tr';
  const storeId = companies[0]?.store_id || branding?.id || 1;
  const [search, setSearch] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlQ = urlParams.get('q') || urlParams.get('search');
      if (urlQ) return urlQ;
      const sId = companies[0]?.store_id || branding?.id || 1;
      return localStorage.getItem(`companies_search_${sId}`) || "";
    } catch {
      return "";
    }
  });
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    try {
      if (search) {
        localStorage.setItem(`companies_search_${storeId}`, search);
      } else {
        localStorage.removeItem(`companies_search_${storeId}`);
      }
    } catch {}
  }, [search, storeId]);

  const [showReconHistory, setShowReconHistory] = useState(false);

  useEffect(() => {
    if (initialOpenRecon) {
      setShowReconHistory(true);
      if (initialReconFilter) {
        setReconStatusFilter(initialReconFilter);
      }
    }
  }, [initialOpenRecon, initialReconFilter]);

  // Reconciliation Control Center States
  const [reconViewMode, setReconViewMode] = useState<'active' | 'archived'>('active');
  const [reconStatusFilter, setReconStatusFilter] = useState<'all' | 'confirmed' | 'disputed' | 'pending'>('all');
  const [reconCompanyFilter, setReconCompanyFilter] = useState<string>('ALL');
  const [reconPeriodFilter, setReconPeriodFilter] = useState<string>('ALL');
  const [reconSearch, setReconSearch] = useState<string>('');
  const [isLoadingRecons, setIsLoadingRecons] = useState<boolean>(false);
  const [editingDisputeId, setEditingDisputeId] = useState<number | string | null>(null);
  const [editingDisputeText, setEditingDisputeText] = useState<string>('');
  const [selectedReconDetail, setSelectedReconDetail] = useState<any | null>(null);
  const [recentlyCreatedRecon, setRecentlyCreatedRecon] = useState<{ id: number | string; link: string; companyTitle: string; periodMonthName: string; balance: number; currency: string } | null>(null);
  const [copiedBannerLink, setCopiedBannerLink] = useState<boolean>(false);

  const getLocalReconciliations = useCallback(() => {
    try {
      const mergedMap = new Map<string, any>();
      const storeList = JSON.parse(localStorage.getItem(`storeReconciliations_${storeId}`) || '[]');
      if (Array.isArray(storeList)) {
        storeList.forEach((item: any) => {
          if (item && item.id) mergedMap.set(String(item.id), item);
        });
      }
      // Also scan any standalone recon_* keys so no legacy record is ever lost
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('recon_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || 'null');
            if (item && item.id && (!item.storeId || Number(item.storeId) === Number(storeId))) {
              const existing = mergedMap.get(String(item.id));
              if (!existing || (item.status !== 'pending' && existing.status === 'pending')) {
                mergedMap.set(String(item.id), item);
              }
            }
          } catch {
            // ignore malformed
          }
        }
      }
      return Array.from(mergedMap.values()).sort((a, b) => Number(b.id) - Number(a.id));
    } catch {
      return [];
    }
  }, [storeId]);

  const [reconciliations, setReconciliations] = useState<any[]>(() => getLocalReconciliations());

  const syncAndLoadReconciliations = useCallback(async () => {
    setIsLoadingRecons(true);
    try {
      const localItems = getLocalReconciliations();
      let serverItems: any[] = [];

      if (localItems.length > 0) {
        const syncRes = await api.syncReconciliations(localItems, storeId);
        if (syncRes && Array.isArray(syncRes.reconciliations)) {
          serverItems = syncRes.reconciliations;
        }
      } else {
        const listRes = await api.getReconciliations(storeId);
        if (listRes && Array.isArray(listRes.reconciliations)) {
          serverItems = listRes.reconciliations;
        }
      }

      if (serverItems.length > 0) {
        setReconciliations(serverItems);
        try {
          localStorage.setItem(`storeReconciliations_${storeId}`, JSON.stringify(serverItems));
        } catch {
          // ignore storage quota
        }
      } else if (localItems.length > 0) {
        setReconciliations(localItems);
      }
    } catch (e) {
      console.error("Failed to sync/load reconciliations from server:", e);
      setReconciliations(getLocalReconciliations());
    } finally {
      setIsLoadingRecons(false);
    }
  }, [storeId, getLocalReconciliations]);

  useEffect(() => {
    syncAndLoadReconciliations();
  }, [syncAndLoadReconciliations]);

  useEffect(() => {
    const handleOpenReconCenter = (ev: any) => {
      const detail = ev?.detail;
      if (detail && detail.reconObj) {
        const r = detail.reconObj;
        const link = detail.link || `${window.location.origin}/reconciliation/${r.id}`;
        setReconciliations(prev => {
          const filtered = prev.filter(item => String(item.id) !== String(r.id));
          return [r, ...filtered];
        });
        setReconViewMode('active');
        setReconStatusFilter('all');
        setReconCompanyFilter('ALL');
        setReconPeriodFilter('ALL');
        setSelectedReconDetail(r);
        setRecentlyCreatedRecon({
          id: r.id,
          link,
          companyTitle: r.companyTitle || '',
          periodMonthName: r.periodMonthName || '',
          balance: Number(r.balance || 0),
          currency: r.currency || defaultCurrency || 'TRY'
        });
        setShowReconHistory(true);
        syncAndLoadReconciliations();
      } else {
        setShowReconHistory(true);
        syncAndLoadReconciliations();
      }
    };
    window.addEventListener('open-recon-center', handleOpenReconCenter);
    return () => window.removeEventListener('open-recon-center', handleOpenReconCenter);
  }, [defaultCurrency, syncAndLoadReconciliations]);

  useEffect(() => {
    try {
      const pendingRaw = sessionStorage.getItem('pendingOpenReconCenter');
      if (pendingRaw) {
        sessionStorage.removeItem('pendingOpenReconCenter');
        const parsed = JSON.parse(pendingRaw);
        if (parsed && parsed.reconObj) {
          const r = parsed.reconObj;
          const link = parsed.link || `${window.location.origin}/reconciliation/${r.id}`;
          setReconciliations(prev => {
            const filtered = prev.filter(item => String(item.id) !== String(r.id));
            return [r, ...filtered];
          });
          setReconViewMode('active');
          setReconStatusFilter('all');
          setReconCompanyFilter('ALL');
          setReconPeriodFilter('ALL');
          setSelectedReconDetail(r);
          setRecentlyCreatedRecon({
            id: r.id,
            link,
            companyTitle: r.companyTitle || '',
            periodMonthName: r.periodMonthName || '',
            balance: Number(r.balance || 0),
            currency: r.currency || defaultCurrency || 'TRY'
          });
          setShowReconHistory(true);
          syncAndLoadReconciliations();
        }
      }
    } catch {}
  }, [defaultCurrency, syncAndLoadReconciliations]);

  const handleRefreshRecons = () => {
    syncAndLoadReconciliations();
  };

  const handleUpdateReconItem = async (reconId: number | string, updates: { status?: string; disputeNote?: string; isArchived?: boolean; archiveNote?: string; notes?: string }) => {
    try {
      // Optimistic update
      setReconciliations(prev => {
        const next = prev.map(r => String(r.id) === String(reconId) ? {
          ...r,
          ...updates,
          archivedAt: updates.isArchived === true ? new Date().toISOString() : (updates.isArchived === false ? null : r.archivedAt),
          updatedAt: new Date().toISOString()
        } : r);
        try {
          localStorage.setItem(`storeReconciliations_${storeId}`, JSON.stringify(next));
          const updatedItem = next.find(r => String(r.id) === String(reconId));
          if (updatedItem) localStorage.setItem(`recon_${reconId}`, JSON.stringify(updatedItem));
        } catch {}
        return next;
      });

      const res = await api.updateReconciliation(reconId, updates, storeId);
      if (res && res.reconciliation) {
        setReconciliations(prev => {
          const next = prev.map(r => String(r.id) === String(reconId) ? res.reconciliation : r);
          try {
            localStorage.setItem(`storeReconciliations_${storeId}`, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to update reconciliation:", e);
    }
  };

  const handleBulkArchiveCompleted = async (onlyConfirmed = true) => {
    const targetList = reconciliations.filter(r => !r.isArchived && (onlyConfirmed ? r.status === 'confirmed' : (r.status === 'confirmed' || r.status === 'disputed')));
    if (targetList.length === 0) {
      alert(isTr ? 'Arşivlenecek tamamlanmış (onaylı) mutabakat kaydı bulunamadı.' : 'No completed reconciliations found to archive.');
      return;
    }
    try {
      setIsLoadingRecons(true);
      const ids = targetList.map(r => r.id);
      await api.bulkArchiveReconciliations({ ids, onlyConfirmed }, storeId);
      await syncAndLoadReconciliations();
    } catch (e) {
      console.error("Error bulk archiving:", e);
    } finally {
      setIsLoadingRecons(false);
    }
  };

  // Distinct periods and companies in reconciliations for filter selectors
  const reconPeriods = useMemo(() => {
    const set = new Set<string>();
    reconciliations.forEach(r => {
      if (r.periodMonthName) set.add(r.periodMonthName);
    });
    return Array.from(set);
  }, [reconciliations]);

  const reconCompaniesList = useMemo(() => {
    const map = new Map<string, { title: string; count: number; archivedCount: number; confirmedCount: number; disputedCount: number; pendingCount: number }>();
    reconciliations.forEach(r => {
      const key = (r.companyTitle || 'Bilinmeyen Cari').trim();
      const existing = map.get(key) || { title: key, count: 0, archivedCount: 0, confirmedCount: 0, disputedCount: 0, pendingCount: 0 };
      existing.count += 1;
      if (r.isArchived) existing.archivedCount += 1;
      const st = r.status || 'pending';
      if (st === 'confirmed') existing.confirmedCount += 1;
      else if (st === 'disputed') existing.disputedCount += 1;
      else existing.pendingCount += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [reconciliations]);

  // Filtered reconciliations according to active/archive tab, status, cari, period, and search
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(r => {
      const isArch = Boolean(r.isArchived);
      if (reconViewMode === 'active' && isArch) return false;
      if (reconViewMode === 'archived' && !isArch) return false;

      const st = r.status || 'pending';
      if (reconStatusFilter !== 'all' && st !== reconStatusFilter) return false;

      if (reconCompanyFilter !== 'ALL' && (r.companyTitle || '').trim() !== reconCompanyFilter) return false;
      if (reconPeriodFilter !== 'ALL' && (r.periodMonthName || '') !== reconPeriodFilter) return false;

      if (reconSearch.trim()) {
        const q = normalizeSearch(reconSearch);
        const matchTitle = normalizeSearch(r.companyTitle || '').includes(q);
        const matchTax = String(r.taxNumber || '').includes(q);
        const matchId = String(r.id || '').includes(q);
        const matchPeriod = normalizeSearch(r.periodMonthName || '').includes(q);
        const matchNote = normalizeSearch(r.disputeNote || '').includes(q);
        if (!matchTitle && !matchTax && !matchId && !matchPeriod && !matchNote) return false;
      }
      return true;
    });
  }, [reconciliations, reconViewMode, reconStatusFilter, reconCompanyFilter, reconPeriodFilter, reconSearch]);

  // Summary KPI counters
  const reconStats = useMemo(() => {
    const scopeList = reconciliations.filter(r => reconViewMode === 'archived' ? Boolean(r.isArchived) : !r.isArchived);
    const total = scopeList.length;
    const confirmed = scopeList.filter(r => r.status === 'confirmed').length;
    const disputed = scopeList.filter(r => r.status === 'disputed').length;
    const pending = scopeList.filter(r => !r.status || r.status === 'pending').length;
    const totalArchived = reconciliations.filter(r => Boolean(r.isArchived)).length;
    const totalActive = reconciliations.filter(r => !r.isArchived).length;
    return { total, confirmed, disputed, pending, totalArchived, totalActive };
  }, [reconciliations, reconViewMode]);

  const [isMerging, setIsMerging] = useState(false);
  const handleMergeDuplicates = async () => {
    if (!window.confirm(isTr 
      ? "Aynı Vergi Kimlik Numarası (VKN/TCKN) veya eşleşen unvana sahip mükerrer cari hesaplar tek bir ana cari kartı altında birleştirilecek, tüm faturalar ve hesap hareketleri konsolide edilecektir. Onaylıyor musunuz?" 
      : "Duplicate accounts sharing the same Tax ID (VKN/TCKN) or title will be consolidated into a single primary account with all invoices and transactions merged. Proceed?")) {
      return;
    }
    try {
      setIsMerging(true);
      const res: any = await api.mergeDuplicateCompanies(storeId);
      if (res && res.success) {
        if (res.mergedCount > 0) {
          alert(isTr 
            ? `İşlem tamamlandı! ${res.mergedCount} adet mükerrer cari hesap başarıyla tekilleştirildi ve tüm hareketleri konsolide edildi.` 
            : `Consolidation complete! Successfully merged ${res.mergedCount} duplicate accounts.`);
        } else {
          alert(isTr 
            ? "Mükerrer cari hesap bulunamadı. Tüm VKN/TCKN ve unvan kayıtlarınız tekil ve düzenlidir." 
            : "No duplicate accounts found. All accounts and Tax IDs are unique.");
        }
      }
      onRefresh?.();
    } catch (e: any) {
      console.error("Merge error:", e);
      alert(isTr ? `Birleştirme hatası: ${e.message || 'Bilinmeyen hata'}` : `Merge error: ${e.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const filteredCompanies = companies.filter(c => {
    const searchTerms = normalizeSearch(deferredSearch).split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 ? true : searchTerms.every(term => 
      normalizeSearch(c.title).includes(term) || (c.tax_number || "").includes(term)
    );
    
    const hasBalance = Object.values(c.balances || {}).some(bal => Number(bal) !== 0);
    
    if (!includeZero && !hasBalance) {
      return false;
    }
    
    return matchesSearch;
  });

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchCompany}
            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                try {
                  localStorage.removeItem(`companies_search_${storeId}`);
                } catch {}
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title={isTr ? "Aramayı Temizle" : "Clear search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {onNewCompany && !isViewer && (
            <button 
              onClick={onNewCompany}
              className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t.registerCompany}</span>
            </button>
          )}
          <button 
            onClick={() => {
              handleRefreshRecons();
              setShowReconHistory(true);
            }}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <History className="h-4 w-4" />
            {isTr ? 'Mutabakat Geçmişi & Durum Takibi' : 'Reconciliation History & Status'}
          </button>
          {!isViewer && (
            <button
              onClick={handleMergeDuplicates}
              disabled={isMerging}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer shadow-xs active:scale-95"
              title={isTr ? "Aynı VKN/TCKN ve unvana sahip mükerrer cari hesapları ve hareketlerini tek bir çatı altında birleştirir" : "Consolidate duplicate accounts with same Tax ID/VKN"}
            >
              <Layers className={`h-4 w-4 text-emerald-600 ${isMerging ? 'animate-spin' : ''}`} />
              <span>{isMerging ? (isTr ? "Konsolide Ediliyor..." : "Merging...") : (isTr ? "Mükerrer Carileri Birleştir (VKN)" : "Merge Duplicates")}</span>
            </button>
          )}
          <button 
            onClick={onExportReport}
            className="flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {t.export}
          </button>
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 transition-all cursor-pointer"
                checked={includeZero}
                onChange={(e) => onIncludeZeroChange(e.target.checked)}
              />
            </div>
            <span className="ml-2 text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{t.showZeroBalance}</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">{t.companyTitle}</th>
                <th className="py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">{t.taxInfo}</th>
                <th className="py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">{t.contactPerson}</th>
                <th className="py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">{t.balance}</th>
                <th className="py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                    {t.noCompanies || "Kayıtlı cari hesap bulunamadı."}
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-medium text-sm shrink-0 border border-slate-200">
                          {c.title ? c.title.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-[13px] tracking-tight truncate max-w-[220px]" title={c.title}>{c.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{c.phone || c.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-medium text-slate-800">{c.tax_office || '-'}</p>
                      <p className="text-xs font-mono text-slate-500">{c.tax_number || '-'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {c.contact_person || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {c.balances && Object.keys(c.balances).length > 0 ? (
                          Object.entries(c.balances || {}).map(([currency, bal]) => {
                            const numBal = Number(bal);
                            if (numBal === 0) return null;
                            const isDebt = numBal > 0;
                            return (
                              <div key={currency} className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border transition-all ${isDebt ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                <div className="flex flex-col items-end leading-none">
                                  <span className="text-xs font-medium font-mono tabular-nums">
                                    {Math.abs(numBal).toLocaleString(isTr ? 'tr-TR' : 'en-US')}
                                  </span>
                                  <span className="text-[8px] font-medium uppercase tracking-widest opacity-70">
                                    {isDebt ? t.statements.debt : t.statements.credit}
                                  </span>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded md text-[10px] font-medium ${isDebt ? 'bg-rose-600/10' : 'bg-emerald-600/10'}`}>
                                  {currency.substring(0, 3)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border bg-slate-50 border-slate-100 text-slate-400 opacity-60">
                            <span className="text-xs font-medium font-mono">0</span>
                            <div className="px-1.5 py-0.5 rounded md text-[10px] font-medium bg-slate-200">
                              {defaultCurrency}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onViewTransactions(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.viewTransactions}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const reconId = Date.now();
                              const curr = defaultCurrency || 'TRY';
                              const currentStoreId = c.store_id || branding?.id || storeId || 1;
                              
                              // Fetch all transactions to calculate dynamic carry-over and period details
                              let allTransactions: any[] = [];
                              try {
                                const res = await api.getCompanyTransactions(c.id, "", "", currentStoreId);
                                allTransactions = res.transactions || res || [];
                              } catch (e) {
                                console.error("Error fetching transactions for reconciliation:", e);
                              }

                              const today = new Date();
                              const currentYear = today.getFullYear();
                              const currentMonth = today.getMonth(); // 0-indexed

                              let targetMonth = currentMonth - 1;
                              let targetYear = currentYear;
                              if (targetMonth < 0) {
                                targetMonth = 11;
                                targetYear = currentYear - 1;
                              }

                              const targetStart = new Date(targetYear, targetMonth, 1);
                              const targetEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

                              const formatDate = (d: Date) => formatDateTR(d);

                              const monthNamesTr = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                              const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                              const periodMonthName = isTr ? `${monthNamesTr[targetMonth]} ${targetYear}` : `${monthNamesEn[targetMonth]} ${targetYear}`;

                              // Filter transactions for this specific currency
                              const currencyTxs = allTransactions.filter((tx: any) => (tx.currency || 'TRY') === curr);

                              // Sort transactions by date ascending for correct running balance math
                              currencyTxs.sort((a: any, b: any) => new Date(a.transaction_date || a.date).getTime() - new Date(b.transaction_date || b.date).getTime());

                              // Calculate Carry-Over Balance (transactions before targetStart)
                              const carryTxs = currencyTxs.filter((tx: any) => {
                                const d = new Date(tx.transaction_date || tx.date);
                                return d < targetStart;
                              });

                              const carryOverBalance = carryTxs.reduce((sum: number, tx: any) => {
                                const amt = Number(tx.amount || 0);
                                return sum + (tx.type === 'debt' ? amt : -amt);
                              }, 0);

                              // Calculate Period Transactions (transactions inside targetMonth)
                              const periodTxs = currencyTxs.filter((tx: any) => {
                                const d = new Date(tx.transaction_date || tx.date);
                                return d >= targetStart && d <= targetEnd;
                              });

                              let runningBalance = carryOverBalance;
                              const formattedPeriodTxs = periodTxs.map((tx: any) => {
                                const amt = Number(tx.amount || 0);
                                const isDebt = tx.type === 'debt';
                                runningBalance += isDebt ? amt : -amt;
                                return {
                                  date: formatDate(new Date(tx.transaction_date || tx.date)),
                                  description: tx.description || (tx.type === 'debt' ? (isTr ? 'Satış Faturası' : 'Sales Invoice') : (isTr ? 'Ödeme / Tahsilat' : 'Payment / Collection')),
                                  debt: isDebt ? amt : 0,
                                  credit: !isDebt ? amt : 0,
                                  balance: runningBalance
                                };
                              });

                              // BA/BS calculation: USD/EUR/TRY invoices in target period whose TRY equivalent excluding VAT is >= 5000 TL
                              const babsInvoices = periodTxs.filter((tx: any) => {
                                const desc = (tx.description || '').toLowerCase();
                                const isInvoice = desc.includes('fatura') || desc.includes('invoice');
                                if (!isInvoice) return false;
                                const amt = Number(tx.amount || 0);
                                const rate = tx.exchange_rate ? Number(tx.exchange_rate) : (tx.currency === 'USD' ? 33 : tx.currency === 'EUR' ? 36 : 1);
                                const amtTry = amt * rate;
                                const exclVatTry = amtTry / 1.2;
                                return exclVatTry >= 5000;
                              });

                              const babsInvoiceCount = babsInvoices.length;
                              const babsTotalSum = babsInvoices.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

                              const rawStoreName = (branding?.legal_name || branding?.einvoice_settings?.title || branding?.store_name || branding?.name || branding?.title || '').trim();
                              const finalStoreName = rawStoreName && !rawStoreName.toLowerCase().includes('lookprice') 
                                ? rawStoreName 
                                : (branding?.store_type === 'motor_vehicle' || branding?.store_type === 'automotive' 
                                    ? 'Seçkin Otomotiv' 
                                    : (branding?.store_type === 'real_estate' ? 'Seçkin Emlak' : 'Seçkin Mağaza'));
                              
                              const finalStoreAddress = (
                                branding?.legal_address || 
                                branding?.einvoice_settings?.address || 
                                branding?.address || 
                                branding?.location || 
                                (branding?.city ? `${branding.city}, Türkiye` : '')
                              ).trim();

                              const finalStoreTaxOffice = (
                                branding?.legal_tax_office || 
                                branding?.einvoice_settings?.tax_office || 
                                branding?.tax_office || 
                                ''
                              ).trim();

                              const finalStoreTaxNumber = (
                                branding?.legal_tax_number || 
                                branding?.einvoice_settings?.vkn || 
                                branding?.tax_id || 
                                branding?.tax_number || 
                                branding?.vkn || 
                                ''
                              ).trim();

                              const reconObj = {
                                id: reconId,
                                storeId: currentStoreId || 1,
                                companyId: c.id,
                                storeName: finalStoreName,
                                storeAddress: finalStoreAddress,
                                storeTaxOffice: finalStoreTaxOffice,
                                storeTaxNumber: finalStoreTaxNumber,
                                companyTitle: c.title,
                                companyAddress: c.address || 'Firma Adresi Belirtilmemiş',
                                taxOffice: c.tax_office,
                                taxNumber: c.tax_number,
                                currency: curr,
                                balance: runningBalance,
                                carryOverBalance: carryOverBalance,
                                startDate: formatDate(targetStart),
                                periodMonthName: periodMonthName,
                                transactions: formattedPeriodTxs,
                                babsInvoiceCount: babsInvoiceCount,
                                babsTotalSum: babsTotalSum,
                                date: formatDate(today),
                                status: 'pending',
                                isArchived: false,
                                notes: `${curr} Cari Hesap Mutabakatı`
                              };

                              const existing = JSON.parse(localStorage.getItem(`storeReconciliations_${currentStoreId}`) || '[]');
                              localStorage.setItem(`storeReconciliations_${currentStoreId}`, JSON.stringify([reconObj, ...existing]));
                              localStorage.setItem(`recon_${reconId}`, JSON.stringify(reconObj));

                              try {
                                await api.createReconciliation(reconObj, currentStoreId || 1);
                              } catch (dbErr) {
                                console.warn("Could not persist reconciliation to DB immediately, cached locally:", dbErr);
                              }

                              const link = `${window.location.origin}/reconciliation/${reconId}`;
                              navigator.clipboard.writeText(link);
                              setReconciliations(prev => [reconObj, ...prev.filter(item => String(item.id) !== String(reconId))]);
                              setReconViewMode('active');
                              setReconStatusFilter('all');
                              setReconCompanyFilter('ALL');
                              setReconPeriodFilter('ALL');
                              setSelectedReconDetail(reconObj);
                              setRecentlyCreatedRecon({
                                id: reconId,
                                link,
                                companyTitle: c.title,
                                periodMonthName: periodMonthName,
                                balance: runningBalance,
                                currency: curr
                              });
                              setShowReconHistory(true);
                              alert(isTr 
                                ? `🔗 Dijital Mutabakat Linki Oluşturuldu & Panoya Kopyalandı!\n\n${link}\n\nMüşterinize/Tedarikçinize WhatsApp üzerinden ileterek online onay alabilirsiniz. Şimdi "Dijital Mutabakat Geçmişi & Canlı Durum Takibi" ekranına yönlendiriliyorsunuz.`
                                : `Digital Reconciliation Link created & copied!\n\n${link}\n\nRedirecting to Digital Reconciliation History & Live Status Tracking.`);
                              handleRefreshRecons();
                            } catch (err) {
                              console.error("Failed to create reconciliation link:", err);
                              alert(isTr ? 'Mutabakat linki oluşturulurken bir hata oluştu.' : 'Failed to create reconciliation link.');
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-emerald-200 cursor-pointer"
                          title={isTr ? 'Dijital Mutabakat Gönder' : 'Send Digital Reconciliation'}
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                        </button>
                        {!isViewer && (
                          <>
                            <button 
                              onClick={() => onEdit(c)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-amber-200 cursor-pointer"
                              title={t.edit}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => onDelete(c.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-slate-200/60 bg-slate-50/50 hover:border-rose-200 cursor-pointer"
                              title={t.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {filteredCompanies.length} {t.companies}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t.prev}
              </button>
              <div className="text-xs font-medium text-slate-600 tabular-nums">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official Digital Reconciliation Control Center & Archive Vault Modal */}
      {showReconHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-800/20 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Futuristic Minimalist Dark Header */}
            <div className="px-3 py-2.5 sm:px-5 sm:py-3.5 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <h3 className="text-xs sm:text-sm font-medium tracking-tight text-white">
                      {isTr ? 'Dijital Mutabakat Takibi' : 'Digital Reconciliation'}
                    </h3>
                    <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-medium uppercase tracking-wider">
                      {isTr ? 'Resmi Evrak' : 'Official'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Active vs Archive Mode Switcher */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setReconViewMode('active')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      reconViewMode === 'active'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span className="hidden sm:inline">{isTr ? 'Canlı Takip' : 'Active'}</span>
                    <span className={`px-1 rounded text-[9px] font-mono ${reconViewMode === 'active' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {reconStats.totalActive}
                    </span>
                  </button>
                  <button
                    onClick={() => setReconViewMode('archived')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                      reconViewMode === 'archived'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <FolderArchive className="w-3 h-3" />
                    <span className="hidden sm:inline">{isTr ? 'Resmi Arşiv' : 'Archive Vault'}</span>
                    <span className={`px-1 rounded text-[9px] font-mono ${reconViewMode === 'archived' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {reconStats.totalArchived}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleRefreshRecons}
                  disabled={isLoadingRecons}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all cursor-pointer"
                  title={isTr ? 'Canlı Durumları Senkronize Et' : 'Sync Live Status'}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRecons ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                <button 
                  onClick={() => setShowReconHistory(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Newly Created Reconciliation Operator Notification Banner */}
            {recentlyCreatedRecon && (
              <div className="px-5 py-3 bg-emerald-950 text-white border-b border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
                        {isTr ? '🔗 Dijital Mutabakat Linki Oluşturuldu & Panoya Kopyalandı!' : '🔗 Digital Reconciliation Link Created & Copied!'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-medium truncate max-w-[260px]">
                        {recentlyCreatedRecon.companyTitle} ({recentlyCreatedRecon.periodMonthName})
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 font-mono truncate mt-0.5">
                      {recentlyCreatedRecon.link}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(recentlyCreatedRecon.link);
                      setCopiedBannerLink(true);
                      setTimeout(() => setCopiedBannerLink(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-950 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedBannerLink ? (isTr ? 'Kopyalandı ✓' : 'Copied ✓') : (isTr ? 'Linki Kopyala' : 'Copy Link')}</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      isTr
                        ? `Sayın ${recentlyCreatedRecon.companyTitle},\n\n${recentlyCreatedRecon.periodMonthName} dönemi cari hesap ve BA/BS dijital mutabakat mektubunuz hazırlanmıştır. Aşağıdaki resmi bağlantı üzerinden inceleyerek online onaylayabilirsiniz:\n\n${recentlyCreatedRecon.link}`
                        : `Dear ${recentlyCreatedRecon.companyTitle},\n\nYour digital reconciliation statement for ${recentlyCreatedRecon.periodMonthName} is ready. Please review and confirm online via the link below:\n\n${recentlyCreatedRecon.link}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isTr ? 'WhatsApp ile Gönder' : 'Send via WhatsApp'}</span>
                  </a>
                  <button
                    onClick={() => setRecentlyCreatedRecon(null)}
                    className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                    title={isTr ? 'Bildirimi Kapat' : 'Dismiss'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Status Filter & KPI Bar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setReconStatusFilter('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    reconStatusFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{isTr ? 'Tümü' : 'All'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${reconStatusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {reconStats.total}
                  </span>
                </button>

                <button
                  onClick={() => setReconStatusFilter('confirmed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    reconStatusFilter === 'confirmed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Onaylandı (Mutabık)' : 'Confirmed'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${reconStatusFilter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-200/70 text-emerald-900'}`}>
                    {reconStats.confirmed}
                  </span>
                </button>

                <button
                  onClick={() => setReconStatusFilter('disputed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    reconStatusFilter === 'disputed'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Red / İtiraz Edildi' : 'Rejected / Disputed'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${reconStatusFilter === 'disputed' ? 'bg-white/20 text-white' : 'bg-rose-200/70 text-rose-900'}`}>
                    {reconStats.disputed}
                  </span>
                </button>

                <button
                  onClick={() => setReconStatusFilter('pending')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    reconStatusFilter === 'pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Bekliyor' : 'Pending'}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${reconStatusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-200/70 text-amber-900'}`}>
                    {reconStats.pending}
                  </span>
                </button>
              </div>

              {/* Search, Cari Filter, Period Filter & Bulk Archive Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reconSearch}
                    onChange={(e) => setReconSearch(e.target.value)}
                    placeholder={isTr ? 'Cari, VKN, Belge No ara...' : 'Search company, Tax ID, ID...'}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <select
                  value={reconCompanyFilter}
                  onChange={(e) => setReconCompanyFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 max-w-[200px] truncate cursor-pointer"
                >
                  <option value="ALL">{isTr ? 'Tüm Cariler' : 'All Companies'} ({reconCompaniesList.length})</option>
                  {reconCompaniesList.map(c => (
                    <option key={c.title} value={c.title}>
                      {c.title} ({c.count})
                    </option>
                  ))}
                </select>

                <select
                  value={reconPeriodFilter}
                  onChange={(e) => setReconPeriodFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 max-w-[150px] cursor-pointer"
                >
                  <option value="ALL">{isTr ? 'Tüm Dönemler' : 'All Periods'}</option>
                  {reconPeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {reconViewMode === 'active' && reconStats.confirmed > 0 && (
                  <button
                    onClick={() => handleBulkArchiveCompleted(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer"
                    title={isTr ? 'Onaylanan tüm mutabakatları cari arşivine kaldır' : 'Archive all confirmed reconciliations'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{isTr ? `Onaylananları Arşivle (${reconStats.confirmed})` : `Archive Confirmed (${reconStats.confirmed})`}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Workspace Body: Left Cari Sidebar + Right High-Density Table */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-100/50">
              
              {/* Left Sidebar: Cari Folder Tree (For quick Cari-based archive & active navigation) */}
              {reconCompaniesList.length > 0 && (
                <div className="w-full md:w-60 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 max-h-36 md:max-h-none overflow-y-auto">
                  <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-100/80 sticky top-0 z-10">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {reconViewMode === 'archived'
                        ? (isTr ? 'Cari Arşiv Klasörleri' : 'Archived by Company')
                        : (isTr ? 'Cari Mutabakat Klasörleri' : 'Accounts Directory')}
                    </span>
                    {reconCompanyFilter !== 'ALL' && (
                      <button
                        onClick={() => setReconCompanyFilter('ALL')}
                        className="text-[10px] font-medium text-indigo-600 hover:underline cursor-pointer"
                      >
                        {isTr ? 'Sıfırla' : 'Reset'}
                      </button>
                    )}
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setReconCompanyFilter('ALL')}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        reconCompanyFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <span className="truncate">{isTr ? 'Tüm Cari Hesaplar' : 'All Accounts'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${reconCompanyFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {reconciliations.filter(r => reconViewMode === 'archived' ? Boolean(r.isArchived) : !r.isArchived).length}
                      </span>
                    </button>

                    {reconCompaniesList.map(comp => {
                      const modeCount = reconciliations.filter(
                        r => (r.companyTitle || '').trim() === comp.title && (reconViewMode === 'archived' ? Boolean(r.isArchived) : !r.isArchived)
                      ).length;
                      if (modeCount === 0 && reconCompanyFilter !== comp.title) return null;
                      const isSelected = reconCompanyFilter === comp.title;
                      return (
                        <button
                          key={comp.title}
                          onClick={() => setReconCompanyFilter(comp.title)}
                          className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-white hover:shadow-2xs border border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium leading-tight">{comp.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] opacity-80">
                              {comp.confirmedCount > 0 && <span className={isSelected ? 'text-emerald-200' : 'text-emerald-600'}>✓{comp.confirmedCount}</span>}
                              {comp.disputedCount > 0 && <span className={isSelected ? 'text-rose-200' : 'text-rose-600'}>!{comp.disputedCount}</span>}
                              {comp.pendingCount > 0 && <span className={isSelected ? 'text-amber-200' : 'text-amber-600'}>⏳{comp.pendingCount}</span>}
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                            {modeCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Right Content Area: High-Density Official Reconciliations Table */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {filteredReconciliations.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 my-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      {reconViewMode === 'archived' ? <FolderArchive className="w-6 h-6" /> : <History className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {reconViewMode === 'archived'
                          ? (isTr ? 'Bu filtrede arşivlenmiş resmi mutabakat evrakı bulunmuyor.' : 'No archived reconciliation documents found for this filter.')
                          : (isTr ? 'Gösterilecek aktif dijital mutabakat kaydı bulunamadı.' : 'No active digital reconciliation records found.')}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {reconViewMode === 'archived'
                          ? (isTr ? 'Canlı takip ekranında tamamlanan veya onaylanan mutabakatları "Arşivle" butonuna tıklayarak bu resmi arşive aktarabilirsiniz.' : 'Archive completed reconciliations from the active view to store them here by company.')
                          : (isTr ? 'Cari hesaplar listesindeki yeşil onay (Dijital Mutabakat Gönder) ikonuna tıklayarak resmi mutabakat belgesi üretebilirsiniz.' : 'Click the green check icon on any company row to generate an official reconciliation link.')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] font-medium uppercase tracking-wider">
                            <th className="py-2.5 px-3.5">{isTr ? 'Evrak No & Tarih' : 'Doc ID & Date'}</th>
                            <th className="py-2.5 px-3.5">{isTr ? 'Dönem' : 'Period'}</th>
                            <th className="py-2.5 px-3.5">{isTr ? 'Cari Hesap / Vergi No' : 'Company / Tax ID'}</th>
                            <th className="py-2.5 px-3.5 text-right">{isTr ? 'Mutabakat Bakiyesi' : 'Balance'}</th>
                            <th className="py-2.5 px-3.5 text-center">{isTr ? 'BA/BS' : 'BA/BS'}</th>
                            <th className="py-2.5 px-3.5">{isTr ? 'Süreç Durumu (Tam Kontrol)' : 'Status & Control'}</th>
                            <th className="py-2.5 px-3.5 text-right">{isTr ? 'Evrak & Arşiv İşlemleri' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredReconciliations.map((recon: any) => {
                            const status = recon.status || 'pending';
                            const isConfirmed = status === 'confirmed';
                            const isDisputed = status === 'disputed';
                            const isArchived = Boolean(recon.isArchived);
                            const bal = Number(recon.balance || 0);
                            const isDebt = bal > 0;
                            const curr = recon.currency || 'TRY';

                            return (
                              <React.Fragment key={recon.id}>
                                <tr className={`hover:bg-slate-50/90 transition-colors ${isArchived ? 'bg-amber-50/20' : ''}`}>
                                  {/* Doc ID & Date */}
                                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-medium text-slate-900 text-[11px]">#{String(recon.id).slice(-6)}</span>
                                      {isArchived && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-medium uppercase">
                                          {isTr ? 'Arşiv' : 'Archived'}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 block font-medium">
                                      {recon.date || (recon.createdAt ? formatDateTR(recon.createdAt) : '-')}
                                    </span>
                                  </td>

                                  {/* Period */}
                                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium text-[11px]">
                                      <Calendar className="w-3 h-3" />
                                      {recon.periodMonthName || (isTr ? 'Cari Dönem' : 'Period')}
                                    </span>
                                  </td>

                                  {/* Company Title & Tax ID */}
                                  <td className="py-2.5 px-3.5">
                                    <button
                                      onClick={() => setReconCompanyFilter(recon.companyTitle)}
                                      className="font-medium text-slate-900 hover:text-indigo-600 text-left block truncate max-w-[230px] cursor-pointer"
                                      title={recon.companyTitle}
                                    >
                                      {recon.companyTitle}
                                    </button>
                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                      {recon.taxNumber ? <span>VKN: {recon.taxNumber}</span> : <span>{recon.taxOffice || '-'}</span>}
                                      {recon.responderName && (
                                        <span className="text-indigo-600 font-sans font-medium">• {recon.responderName}</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Balance */}
                                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                    <div className="font-mono font-medium text-slate-900 text-xs">
                                      {Math.abs(bal).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}
                                    </div>
                                    <span className={`text-[9px] font-medium uppercase px-1.5 py-0.2 rounded ${
                                      bal === 0 ? 'bg-slate-100 text-slate-600' : isDebt ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>
                                      {bal === 0 ? (isTr ? 'SIFIR' : 'ZERO') : isDebt ? (isTr ? 'BORÇ (B)' : 'DEBT') : (isTr ? 'ALACAK (A)' : 'CREDIT')}
                                    </span>
                                  </td>

                                  {/* BA/BS */}
                                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                    <span className="text-[11px] font-mono font-medium text-slate-700 block">
                                      {recon.babsInvoiceCount || 0} {isTr ? 'Fatura' : 'Inv.'}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500">
                                      {Number(recon.babsTotalSum || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { maximumFractionDigits: 0 })} {curr}
                                    </span>
                                  </td>

                                  {/* Status Badge + Operator Direct Status Switcher */}
                                  <td className="py-2.5 px-3.5">
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={status}
                                        disabled={isViewer}
                                        onChange={(e) => {
                                          const newSt = e.target.value;
                                          if (newSt === 'disputed' && !recon.disputeNote) {
                                            setEditingDisputeId(recon.id);
                                            setEditingDisputeText(recon.disputeNote || '');
                                          }
                                          handleUpdateReconItem(recon.id, { status: newSt });
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                                          isConfirmed
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                            : isDisputed
                                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                                              : 'bg-amber-50 text-amber-800 border-amber-300'
                                        }`}
                                      >
                                        <option value="pending">⏳ {isTr ? 'Bekliyor' : 'Pending'}</option>
                                        <option value="confirmed">✓ {isTr ? 'Onaylandı (Mutabık)' : 'Confirmed'}</option>
                                        <option value="disputed">✕ {isTr ? 'Red / İtiraz Edildi' : 'Rejected / Disputed'}</option>
                                      </select>

                                      <button
                                        onClick={() => {
                                          if (editingDisputeId === recon.id) {
                                            setEditingDisputeId(null);
                                          } else {
                                            setEditingDisputeId(recon.id);
                                            setEditingDisputeText(recon.disputeNote || '');
                                          }
                                        }}
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          recon.disputeNote
                                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
                                        }`}
                                        title={isTr ? 'Mutabakat / İtiraz Notu Ekle veya Düzenle' : 'Add/Edit Note'}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {recon.disputeNote && editingDisputeId !== recon.id && (
                                      <p className="text-[10px] text-rose-600 font-semibold mt-1 max-w-[240px] truncate" title={recon.disputeNote}>
                                        {isTr ? 'Not: ' : 'Note: '}{recon.disputeNote}
                                      </p>
                                    )}
                                  </td>

                                  {/* Actions: Preview, Copy Link, Open Official Portal, Archive / Unarchive */}
                                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => setSelectedReconDetail(selectedReconDetail?.id === recon.id ? null : recon)}
                                        className={`p-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                          selectedReconDetail?.id === recon.id
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                        title={isTr ? 'Evrak Detayını İncele' : 'Inspect Document'}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          const link = `${window.location.origin}/reconciliation/${recon.id}`;
                                          navigator.clipboard.writeText(link);
                                          alert(isTr ? '🔗 Resmi mutabakat linki panoya kopyalandı!' : 'Official reconciliation link copied!');
                                        }}
                                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer"
                                        title={isTr ? 'Mutabakat Linkini Kopyala' : 'Copy Link'}
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>

                                      <a
                                        href={`/reconciliation/${recon.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                                        title={isTr ? 'Resmi Evrak Portalını Yeni Sekmede Aç / Yazdır' : 'Open Official Portal / Print'}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>

                                      {!isViewer && (
                                        isArchived ? (
                                          <button
                                            onClick={() => handleUpdateReconItem(recon.id, { isArchived: false })}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                                            title={isTr ? 'Arşivden Geri Çağır (Canlı Listeye Al)' : 'Restore from Archive'}
                                          >
                                            <ArchiveRestore className="w-3.5 h-3.5" />
                                            <span>{isTr ? 'Arşivden Çağır' : 'Restore'}</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleUpdateReconItem(recon.id, { isArchived: true })}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                                            title={isTr ? 'Tamamlanan Evrakı Cari Arşivine Kaldır' : 'Move to Official Company Archive'}
                                          >
                                            <Archive className="w-3.5 h-3.5" />
                                            <span>{isTr ? 'Arşivle' : 'Archive'}</span>
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Inline Dispute / Operator Note Editor Row */}
                                {editingDisputeId === recon.id && (
                                  <tr className="bg-slate-50">
                                    <td colSpan={7} className="px-4 py-2.5">
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <span className="text-[11px] font-medium text-slate-700 shrink-0">
                                          {isTr ? 'Süreç / İtiraz Açıklaması:' : 'Process / Dispute Note:'}
                                        </span>
                                        <input
                                          type="text"
                                          value={editingDisputeText}
                                          onChange={(e) => setEditingDisputeText(e.target.value)}
                                          placeholder={isTr ? 'Mutabakat notu veya red/itiraz gerekçesi giriniz...' : 'Enter reconciliation note or dispute reason...'}
                                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                                        />
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => {
                                              handleUpdateReconItem(recon.id, { disputeNote: editingDisputeText });
                                              setEditingDisputeId(null);
                                            }}
                                            className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                                          >
                                            {isTr ? 'Kaydet' : 'Save'}
                                          </button>
                                          <button
                                            onClick={() => setEditingDisputeId(null)}
                                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                                          >
                                            {isTr ? 'Kapat' : 'Cancel'}
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* Inline Official Document Quick Preview Drawer */}
                                {selectedReconDetail?.id === recon.id && (
                                  <tr className="bg-indigo-50/40 border-y border-indigo-100">
                                    <td colSpan={7} className="p-4">
                                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                          <div>
                                            <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-600 block">
                                              {isTr ? 'Resmi Mutabakat Evrak Özeti' : 'Official Reconciliation Summary'}
                                            </span>
                                            <h5 className="text-sm font-medium text-slate-900">
                                              {recon.companyTitle} — {recon.periodMonthName} (#{recon.id})
                                            </h5>
                                          </div>
                                          <div className="flex items-center gap-3 text-xs">
                                            <div className="px-3 py-1 rounded-lg bg-slate-100 font-mono">
                                              <span className="text-slate-500 mr-1">{isTr ? 'Önceki Ay Devri:' : 'Carry-Over:'}</span>
                                              <span className="font-medium text-slate-900">
                                                {Number(recon.carryOverBalance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}
                                              </span>
                                            </div>
                                            <div className="px-3 py-1 rounded-lg bg-indigo-50 font-mono">
                                              <span className="text-indigo-600 mr-1">{isTr ? 'Dönem Sonu Net Bakiye:' : 'Closing Balance:'}</span>
                                              <span className="font-medium text-indigo-950">
                                                {Number(recon.balance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {Array.isArray(recon.transactions) && recon.transactions.length > 0 ? (
                                          <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-lg">
                                            <table className="w-full text-left border-collapse text-[11px]">
                                              <thead>
                                                <tr className="bg-slate-50 text-slate-500 font-medium uppercase text-[9px]">
                                                  <th className="py-1.5 px-2.5">{isTr ? 'Tarih' : 'Date'}</th>
                                                  <th className="py-1.5 px-2.5">{isTr ? 'Açıklama' : 'Description'}</th>
                                                  <th className="py-1.5 px-2.5 text-right">{isTr ? 'Borç' : 'Debit'}</th>
                                                  <th className="py-1.5 px-2.5 text-right">{isTr ? 'Alacak' : 'Credit'}</th>
                                                  <th className="py-1.5 px-2.5 text-right">{isTr ? 'Bakiye' : 'Balance'}</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 font-mono">
                                                {recon.transactions.map((tx: any, i: number) => (
                                                  <tr key={i}>
                                                    <td className="py-1 px-2.5 text-slate-600">{tx.date || '-'}</td>
                                                    <td className="py-1 px-2.5 font-sans text-slate-800">{tx.description || '-'}</td>
                                                    <td className="py-1 px-2.5 text-right text-rose-600">
                                                      {Number(tx.debt || 0) > 0 ? Number(tx.debt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="py-1 px-2.5 text-right text-emerald-600">
                                                      {Number(tx.credit || 0) > 0 ? Number(tx.credit).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="py-1 px-2.5 text-right font-medium text-slate-900">
                                                      {Number(tx.balance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-slate-500 italic">
                                            {isTr ? 'Bu dönemde ek cari hareket bulunmamaktadır (Devir bakiyesi üzerinden mutabakat).' : 'No additional period transactions.'}
                                          </p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isTr 
                    ? 'Resmi evrak statüsündeki tüm mutabakat kayıtları veritabanında kalıcı olarak saklanır ve silinmeye karşı korumalıdır.' 
                    : 'All reconciliation documents are permanently stored in the database and protected against accidental deletion.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReconHistory(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl cursor-pointer transition-all"
                >
                  {isTr ? 'Kapat' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;

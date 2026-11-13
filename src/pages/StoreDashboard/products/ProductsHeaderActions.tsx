import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Sparkles, 
  Layers, 
  Activity,
  MoreHorizontal,
  ChevronDown,
  Unlink
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

interface ProductsHeaderActionsProps {
  t: any;
  lang: string;
  isViewer: boolean;
  isCafe: boolean;
  selectedIds: number[];
  selectedVariantCount?: number;
  handleBulkClearVariantsSelected?: () => void;
  onAddNew: () => void;
  onImport: () => void;
  onExportReport: () => void;
  onOpenXRay: () => void;
  showXRay?: boolean;
  handleBulkDeleteSelected: () => void;
  handleSyncNamesFromInvoices: () => void;
  isFixingNames: boolean;
  setIsMergeModalOpen: (open: boolean) => void;
  setIsEanModalOpen?: (open: boolean) => void;
  setIsAiMenuModalOpen: (open: boolean) => void;
  driveConnected: boolean;
  isBackupLoading: boolean;
  setIsBackupLoading: (loading: boolean) => void;
  isBookstore?: boolean;
  onRefresh?: () => void;
  currentStoreId?: number;
}

export const ProductsHeaderActions: React.FC<ProductsHeaderActionsProps> = ({
  t,
  lang,
  isViewer,
  isCafe,
  selectedIds,
  selectedVariantCount = 0,
  handleBulkClearVariantsSelected,
  onAddNew,
  onImport,
  onExportReport,
  onOpenXRay,
  showXRay = false,
  handleBulkDeleteSelected,
  setIsMergeModalOpen,
  setIsAiMenuModalOpen,
  isBookstore,
  onRefresh,
  currentStoreId,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 w-full pb-2 border-b border-slate-200/70 select-none">
      {/* Title Section (Compact single-line) */}
      <div className="flex items-center space-x-2 min-w-0 shrink-0">
        <div className="bg-indigo-600 rounded-full h-5 sm:h-6 w-1 shrink-0" />
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase truncate">
          {t.products || "ÜRÜNLER"}
        </h2>
      </div>

      {/* Action Buttons: Strictly single-line layout (flex-nowrap) */}
      <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
        {/* Selection Actions (Bulk Convert Single, Delete & Merge 2) */}
        {selectedIds.length > 0 && !isViewer && (
          <div className="flex items-center gap-1 shrink-0">
            {selectedVariantCount > 0 && handleBulkClearVariantsSelected && (
              <button
                type="button"
                onClick={handleBulkClearVariantsSelected}
                className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white rounded-lg transition-all border border-amber-200 font-semibold flex items-center gap-1 shadow-2xs text-[11px] cursor-pointer active:scale-95 shrink-0"
                title={lang === 'tr' ? "Seçilen ürünlerin varyantlarını kaldırıp tekil ürüne çevir" : "Remove variants from selected products"}
              >
                <Unlink className="h-3.5 w-3.5" />
                <span>Tekil Yap ({selectedVariantCount})</span>
              </button>
            )}

            {selectedIds.length === 2 && (
              <button 
                type="button"
                onClick={() => setIsMergeModalOpen(true)}
                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg transition-all border border-indigo-200 font-semibold flex items-center gap-1 shadow-2xs text-[11px] cursor-pointer active:scale-95 shrink-0"
                title={lang === 'tr' ? "Seçilen 2 Ürünü Birleştir" : "Merge Selected 2 Products"}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Birleştir (2)</span>
              </button>
            )}

            <button 
              type="button"
              onClick={handleBulkDeleteSelected}
              className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-200 font-semibold flex items-center gap-1 shadow-2xs text-[11px] cursor-pointer active:scale-95 shrink-0"
              title={lang === 'tr' ? "Seçilenleri Sil" : "Delete Selected"}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Sil ({selectedIds.length})</span>
            </button>
          </div>
        )}

        {/* Primary Action Button: Always Visible & Open */}
        {!isViewer && (
          <button 
            type="button"
            onClick={onAddNew}
            className="px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
            title={t.addEntry || "Yeni Ürün Ekle"}
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Yeni Ürün</span>
            <span className="sm:hidden">Yeni</span>
          </button>
        )}

        {/* Desktop Secondary Buttons: Single line, compact, with clean text & icons */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {!isViewer && (
            <button 
              type="button"
              onClick={() => setIsMergeModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-black transition-all active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title={lang === 'tr' ? "Mükerrer Ürünleri Birleştir" : "Merge Duplicates"}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Birleştir</span>
            </button>
          )}

          {showXRay && (
            <button
              type="button"
              onClick={onOpenXRay}
              className="px-2.5 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer font-black text-xs shrink-0"
              title={lang === 'tr' ? "Çok Kanallı Ürün Röntgeni" : "Product X-Ray"}
            >
              <Activity className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span className="hidden md:inline">Röntgen</span>
            </button>
          )}

          {isCafe && !isViewer && (
            <button
              type="button"
              onClick={() => setIsAiMenuModalOpen(true)}
              className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200 active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer font-black text-xs shrink-0"
              title={lang === 'tr' ? "Yapay Zeka ile Menü Oku (Görselden)" : "Scan Menu with AI"}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Menü Tara</span>
            </button>
          )}

          {isBookstore && !isViewer && (
            <button
              type="button"
              onClick={async () => {
                const promise = api.bulkEnrichBooks(currentStoreId);
                toast.promise(promise, {
                  loading: lang === 'tr' ? 'Kitaplar eşleştiriliyor...' : 'Matching books...',
                  success: (res: any) => {
                    if (onRefresh) onRefresh();
                    return res.message || (lang === 'tr' ? 'Eşleştirme tamamlandı!' : 'Matching completed!');
                  },
                  error: lang === 'tr' ? 'Eşleştirme başarısız oldu.' : 'Enrichment failed.'
                });
              }}
              className="px-2.5 py-1.5 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all border border-violet-200 active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer font-black text-xs shrink-0"
              title={lang === 'tr' ? "Kitapları Eşleştir" : "Match Books"}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0" />
              <span>Eşleştir</span>
            </button>
          )}

          {!isViewer && (
            <button 
              type="button"
              onClick={onImport}
              className="p-1.5 lg:px-2.5 lg:py-1.5 text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-lg transition-all border border-slate-200 active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
              title={t.importBtn || "Excel İçe Aktar"}
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden lg:inline">İçe Aktar</span>
            </button>
          )}

          <button 
            type="button"
            onClick={onExportReport}
            className="p-1.5 lg:px-2.5 lg:py-1.5 text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-lg transition-all border border-slate-200 active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
            title={t.report || "Excel Raporu İndir"}
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden lg:inline">Dışa Aktar</span>
          </button>
        </div>

        {/* Mobile Dropdown Popover: Condenses all secondary actions into 1 compact button so top bar stays strictly single-line */}
        <div className="relative sm:hidden shrink-0" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all shadow-2xs flex items-center gap-0.5 cursor-pointer text-xs font-bold"
            title="Diğer Ürün İşlemleri"
          >
            <MoreHorizontal className="h-4 w-4 text-slate-600" />
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="p-1 space-y-0.5">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMergeModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-amber-800 hover:bg-amber-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Mükerrer Birleştir</span>
                  </button>
                )}

                {showXRay && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenXRay();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-indigo-700 hover:bg-indigo-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Ürün Röntgeni</span>
                  </button>
                )}

                {isCafe && !isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiMenuModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Yapay Zeka ile Menü Oku</span>
                  </button>
                )}

                {isBookstore && !isViewer && (
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      const promise = api.bulkEnrichBooks(currentStoreId);
                      toast.promise(promise, {
                        loading: 'Kitaplar eşleştiriliyor...',
                        success: (res: any) => {
                          if (onRefresh) onRefresh();
                          return res.message || 'Eşleştirme tamamlandı!';
                        },
                        error: 'Eşleştirme başarısız oldu.'
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-violet-700 hover:bg-violet-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                    <span>Kitapları Eşleştir</span>
                  </button>
                )}
              </div>

              <div className="p-1 space-y-0.5">
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => {
                      onImport();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>Excel İçe Aktar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onExportReport();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Excel Raporu İndir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

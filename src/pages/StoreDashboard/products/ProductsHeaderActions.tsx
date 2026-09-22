import React from "react";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Sparkles, 
  Tag, 
  Cloud 
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

interface ProductsHeaderActionsProps {
  t: any;
  lang: string;
  isViewer: boolean;
  isCafe: boolean;
  selectedIds: number[];
  onAddNew: () => void;
  onImport: () => void;
  onExportReport: () => void;
  handleBulkDeleteSelected: () => void;
  handleSyncNamesFromInvoices: () => void;
  isFixingNames: boolean;
  setIsMergeModalOpen: (open: boolean) => void;
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
  onAddNew,
  onImport,
  onExportReport,
  handleBulkDeleteSelected,
  handleSyncNamesFromInvoices,
  isFixingNames,
  setIsMergeModalOpen,
  setIsAiMenuModalOpen,
  driveConnected,
  isBackupLoading,
  setIsBackupLoading,
  isBookstore,
  onRefresh,
  currentStoreId,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="bg-indigo-600 rounded-full h-8 sm:h-9 w-1 shrink-0" />
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
          {t.products || "ÜRÜNLER"}
        </h2>
      </div>

      {/* Action icons sitting right next to the title on the right */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isViewer && (
          <div className="flex items-center gap-1.5">
            {isCafe && (
              <button
                type="button"
                onClick={() => setIsAiMenuModalOpen(true)}
                className="os-btn-secondary p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={lang === 'tr' ? "Yapay Zeka ile Menü Oku (Görselden)" : "Scan Menu with AI (From Image)"}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-bold hidden md:inline whitespace-nowrap">
                  {lang === 'tr' ? "Menü Tara" : "AI Menu"}
                </span>
              </button>
            )}
            <button 
              type="button"
              onClick={onImport}
              className="os-btn-secondary p-2 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs cursor-pointer"
              title={t.importBtn}
            >
              <Upload className="h-4 w-4" />
            </button>
            <button 
              type="button"
              onClick={onAddNew}
              className="os-btn-primary p-2 text-white rounded-lg transition-all border border-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs cursor-pointer"
              title={t.addEntry}
            >
              <Plus className="h-4 w-4" />
            </button>

            {selectedIds.length > 0 && (
              <button 
                type="button"
                onClick={handleBulkDeleteSelected}
                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-200 hover:border-rose-700 active:scale-95 font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300 shadow-xs text-xs cursor-pointer"
                title={lang === 'tr' ? "Seçilenleri Sil" : "Delete Selected"}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-[10px] tracking-tight uppercase hidden xs:inline sm:inline">
                  {lang === 'tr' ? `SİL (${selectedIds.length})` : `DEL (${selectedIds.length})`}
                </span>
              </button>
            )}
          </div>
        )}
        <button 
          type="button"
          onClick={onExportReport}
          className="os-btn-secondary p-2 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs cursor-pointer"
          title={t.report}
        >
          <Download className="h-4 w-4" />
        </button>

        {!isViewer && (
          <>
            <button 
              type="button"
              onClick={handleSyncNamesFromInvoices}
              disabled={isFixingNames}
              className="os-btn-secondary p-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200 hover:border-indigo-300 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={lang === 'tr' ? "Ürün İsimlerini Faturalarla Eşitle / Orijinal İsimleri Çek" : "Sync Product Names from Invoices"}
            >
              <Tag className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="text-[11px] font-bold text-indigo-900 hidden lg:inline whitespace-nowrap">
                {lang === 'tr' ? "İsimleri Eşitle" : "Sync Names"}
              </span>
            </button>
            {isBookstore && (
              <button
                type="button"
                onClick={async () => {
                  const promise = api.bulkEnrichBooks(currentStoreId);
                  toast.promise(promise, {
                    loading: lang === 'tr' ? 'Kitaplar Google Books ve Yapay Zeka ile eşleştiriliyor...' : 'Matching books with Google Books and AI...',
                    success: (res: any) => {
                      if (onRefresh) onRefresh();
                      return res.message || (lang === 'tr' ? 'Eşleştirme tamamlandı!' : 'Matching completed!');
                    },
                    error: lang === 'tr' ? 'Eşleştirme başarısız oldu.' : 'Enrichment failed.'
                  });
                }}
                className="os-btn-secondary p-2 text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all border border-violet-200 hover:border-violet-300 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={lang === 'tr' ? "Google Books & Yapay Zeka ile Barkodlu Kitapları Toplu Eşleştir" : "Bulk Match Books with Google Books & AI"}
              >
                <Sparkles className="h-4 w-4 text-violet-600 shrink-0" />
                <span className="text-[11px] font-bold text-violet-900 hidden lg:inline whitespace-nowrap">
                  {lang === 'tr' ? "Kitapları Eşleştir" : "Match Books"}
                </span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => setIsMergeModalOpen(true)}
              className="os-btn-secondary p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all border border-amber-200 hover:border-amber-300 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
              title={lang === 'tr' ? "Mükerrer Ürünleri Birleştir / Envanter Temizliği" : "Merge Duplicate Products / Clean Inventory"}
            >
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-[11px] font-bold text-amber-900 hidden lg:inline whitespace-nowrap">
                {lang === 'tr' ? "Temizle" : "Clean"}
              </span>
            </button>
          </>
        )}

        {driveConnected && (
          <button 
            type="button"
            onClick={async () => {
              setIsBackupLoading(true);
              const promise = api.exportToGoogleDrive({ targetType: 'products', format: 'xls' });
              toast.promise(promise, {
                loading: 'Ürün şeması Google Drive\'a yedekleniyor...',
                success: 'Ürün şeması Excel formatında Google Drive\'a başarıyla kaydoldu!',
                error: 'Google Drive yedeklemesi başarısız oldu.'
              });
              try {
                await promise;
              } catch (e) {
                console.error(e);
              } finally {
                setIsBackupLoading(false);
              }
            }}
            disabled={isBackupLoading}
            className="os-btn-secondary p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
            title={lang === 'tr' ? "Google Drive'a Yedekle" : "Backup to Google Drive"}
          >
            <Cloud className="h-4 w-4 text-emerald-600" />
          </button>
        )}
      </div>
    </div>
  );
};

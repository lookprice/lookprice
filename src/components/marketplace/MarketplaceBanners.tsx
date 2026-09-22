import React from 'react';
import { CheckCircle2, Clock, RefreshCw, X } from 'lucide-react';
import { ListingStatus } from './marketplaceTypes';

interface MarketplaceBannersProps {
  isTr: boolean;
  matchResult: any | null;
  onClearMatchResult: () => void;
  selectedStatus: ListingStatus;
  isCheckingBulkPending: boolean;
  onCheckBulkPending: () => void;
}

export const MarketplaceBanners: React.FC<MarketplaceBannersProps> = ({
  isTr,
  matchResult,
  onClearMatchResult,
  selectedStatus,
  isCheckingBulkPending,
  onCheckBulkPending,
}) => {
  return (
    <>
      {/* Match Result Banner */}
      {matchResult && (
        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 text-xs text-orange-900 dark:text-orange-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              <strong>{isTr ? "HB Eşleştirme Sonucu:" : "HB Sync Result:"}</strong> {matchResult.message} (Toplam: {matchResult.totalListings}, Eşleşen: {matchResult.matchedCount}, Yeni İçe Aktarılan: {matchResult.importedCount})
            </span>
          </div>
          <button 
            type="button"
            onClick={onClearMatchResult}
            className="text-orange-600 hover:text-orange-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};

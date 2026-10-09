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
  if (!matchResult) return null;

  const isAmazon = matchResult.marketplaceKey === 'amazon';
  const title = isAmazon 
    ? (isTr ? "Amazon Eşleştirme Sonucu:" : "Amazon Sync Result:")
    : (isTr ? "HB Eşleştirme Sonucu:" : "HB Sync Result:");

  const bgClasses = isAmazon
    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
    : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/60 text-orange-900 dark:text-orange-200";

  const iconColor = isAmazon ? "text-amber-600" : "text-orange-600";

  return (
    <>
      {/* Match Result Banner */}
      <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${bgClasses}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${iconColor}`} />
          <span>
            <strong>{title}</strong> {matchResult.message} (Toplam: {matchResult.totalListings ?? 0}, Eşleşen: {matchResult.matchedCount ?? 0}, Yeni İçe Aktarılan: {matchResult.importedCount ?? 0})
          </span>
        </div>
        <button 
          type="button"
          onClick={onClearMatchResult}
          className={`${iconColor} hover:opacity-75 p-1 cursor-pointer`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
};


import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Package, 
  UploadCloud, 
  StopCircle 
} from 'lucide-react';
import { MarketplaceKey, ListingStatus, MarketplaceMetrics, MARKETPLACES } from './marketplaceTypes';

interface MarketplaceMetricsBarProps {
  isTr: boolean;
  selectedMarketplace: MarketplaceKey;
  selectedStatus: ListingStatus;
  setSelectedStatus: (status: ListingStatus) => void;
  metrics: MarketplaceMetrics;
  selectedIds: number[];
  isMatchingListings: boolean;
  isCheckingBulkPending: boolean;
  isSyncingOrders: boolean;
  isBulkPublishing: boolean;
  onMatchListings: (importMissing?: boolean) => void;
  onCheckBulkPending: () => void;
  onSyncOrders: () => void;
  onSyncAmazon: () => void;
  onBulkPublish: () => void;
  onBulkUnpublish: () => void;
}

export const MarketplaceMetricsBar: React.FC<MarketplaceMetricsBarProps> = ({
  isTr,
  selectedMarketplace,
  selectedStatus,
  setSelectedStatus,
  metrics,
  selectedIds,
  isMatchingListings,
  isCheckingBulkPending,
  isSyncingOrders,
  isBulkPublishing,
  onMatchListings,
  onCheckBulkPending,
  onSyncOrders,
  onSyncAmazon,
  onBulkPublish,
  onBulkUnpublish,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-xs'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isTr ? "Tümü" : "All"} ({metrics.total})
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('active')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            selectedStatus === 'active'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {isTr ? "Satışta" : "Active"}
          <span className="bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {metrics.active}
          </span>
        </button>

        {metrics.pending > 0 && (
          <button
            type="button"
            onClick={() => setSelectedStatus('pending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              selectedStatus === 'pending'
                ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {isTr ? "Onay Bekliyor" : "Pending"}
            <span className="bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {metrics.pending}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSelectedStatus('error')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            selectedStatus === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {isTr ? "Hatalı" : "Errors"}
          <span className="bg-rose-200/60 dark:bg-rose-800/60 text-rose-900 dark:text-rose-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {metrics.errors}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('inactive')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            selectedStatus === 'inactive'
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 shadow-xs'
              : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isTr ? "Pasif" : "Inactive"} ({metrics.inactive})
        </button>
      </div>

      {/* Quick Actions for Selected Marketplace */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {(selectedMarketplace === 'hepsiburada' || selectedMarketplace === 'all') && (
          <>
            <button
              type="button"
              onClick={() => onMatchListings(false)}
              disabled={isMatchingListings}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              title={isTr ? "Hepsiburada satıcı hesabınızdaki tüm canlı ürünleri çekip mağazadaki ürünlerle eşleştirir" : "Fetch active Hepsiburada listings and match with local products"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMatchingListings ? 'animate-spin' : ''}`} />
              <span>{isMatchingListings ? (isTr ? "Eşleştiriliyor..." : "Matching...") : (isTr ? "HB Eşleştir" : "Match HB")}</span>
            </button>

            <button
              type="button"
              onClick={onCheckBulkPending}
              disabled={isCheckingBulkPending}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs border border-amber-500 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              title={isTr ? "Onay bekleyen tüm ürünleri Hepsiburada ile canlı sorgulayıp eşleştirir" : "Check and resolve all pending products with Hepsiburada"}
            >
              <Clock className={`w-3.5 h-3.5 ${isCheckingBulkPending ? 'animate-spin' : ''}`} />
              <span>{isCheckingBulkPending ? (isTr ? "Sorgulanıyor..." : "Checking...") : (isTr ? "Onayları Canlı Sorgula" : "Check Pending")}</span>
            </button>

            <button
              type="button"
              onClick={onSyncOrders}
              disabled={isSyncingOrders}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              title={isTr ? "Canlı Hepsiburada siparişlerini çek" : "Sync recent Hepsiburada orders"}
            >
              <Package className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} />
              <span>{isSyncingOrders ? (isTr ? "Çekiliyor..." : "Syncing...") : (isTr ? "HB Sipariş Çek" : "Sync Orders")}</span>
            </button>
          </>
        )}

        {selectedMarketplace === 'amazon' && (
          <button
            type="button"
            onClick={onSyncAmazon}
            disabled={isMatchingListings}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            title={isTr ? "Amazon TR hesabınızdaki aktif ürünleri çekip mağaza ürünleri ile eşleştirir" : "Fetch active Amazon TR listings"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isMatchingListings ? 'animate-spin' : ''}`} />
            <span>{isMatchingListings ? (isTr ? "Çekiliyor..." : "Syncing...") : (isTr ? "Amazon Eşleştir" : "Sync Amazon")}</span>
          </button>
        )}

        {/* Bulk Publish & Unpublish Buttons */}
        {selectedIds.length > 0 && (() => {
          const targetMp = selectedMarketplace === 'all' ? 'hepsiburada' : selectedMarketplace;
          const targetConfig = MARKETPLACES.find(m => m.key === targetMp) || MARKETPLACES[0];
          const mpName = selectedMarketplace === 'all' ? 'Pazaryeri' : targetConfig.name;

          return (
            <>
              <button
                type="button"
                onClick={onBulkPublish}
                disabled={isBulkPublishing}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isTr ? `Satışa Aç (${selectedIds.length})` : `Publish (${selectedIds.length})`}</span>
              </button>

              <button
                type="button"
                onClick={onBulkUnpublish}
                disabled={isBulkPublishing}
                className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                title={isTr ? `Seçilen ürünleri ${mpName}'da yayından kaldır / satışa kapat` : `Unpublish selected from ${mpName}`}
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>{isTr ? `Yayından Kaldır (${selectedIds.length})` : `Unpublish (${selectedIds.length})`}</span>
              </button>
            </>
          );
        })()}
      </div>
    </div>
  );
};

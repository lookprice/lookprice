import React from 'react';
import { Package } from 'lucide-react';
import { MarketplaceKey } from './marketplaceTypes';
import { MarketplaceProductRow } from './MarketplaceProductRow';

interface MarketplaceListingsTableProps {
  products: any[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  selectedMarketplace: MarketplaceKey;
  isTr: boolean;
  copiedBarcode: string | null;
  onCopyBarcode: (bc: string) => void;
  onCheckHbStatus: (productId: number) => void;
  checkingStatusId: number | null;
  publishingId: number | null;
  onPublishSingle: (product: any, mpKey: MarketplaceKey) => void;
  onUnpublishSingle: (product: any, mpKey: MarketplaceKey) => void;
  onEditProduct?: (product: any) => void;
  isProductActive: (p: any, mpKey: MarketplaceKey) => boolean;
  isProductPending: (p: any, mpKey: MarketplaceKey) => boolean;
  getProductError: (p: any, mpKey: MarketplaceKey) => string | null;
}

export const MarketplaceListingsTable: React.FC<MarketplaceListingsTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  selectedMarketplace,
  isTr,
  copiedBarcode,
  onCopyBarcode,
  onCheckHbStatus,
  checkingStatusId,
  publishingId,
  onPublishSingle,
  onUnpublishSingle,
  onEditProduct,
  isProductActive,
  isProductPending,
  getProductError,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {isTr ? "Filtrelere Uygun Ürün Bulunamadı" : "No products match criteria"}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {isTr 
            ? "Arama kriterlerinizi veya durum filtresini değiştirerek tekrar deneyebilirsiniz."
            : "Try clearing search or switching status filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-xs bg-white dark:bg-slate-900 w-full">
      <table className="w-full text-left text-xs min-w-[700px]">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            <th className="py-3 px-4 w-10 text-center">
              <input 
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === products.length}
                onChange={onToggleSelectAll}
                aria-label={isTr ? "Tümünü Seç" : "Select All"}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
            </th>
            <th className="py-3 px-4">{isTr ? "Ürün & Barkod" : "Product & Barcode"}</th>
            <th className="py-3 px-4">{isTr ? "Fiyat & Stok" : "Price & Stock"}</th>
            <th className="py-3 px-4">{isTr ? "Pazaryeri Durumu" : "Marketplace Status"}</th>
            <th className="py-3 px-4 text-right">{isTr ? "İlan Linki & İşlemler" : "Direct Link & Actions"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {products.map(p => (
            <MarketplaceProductRow
              key={p.id}
              product={p}
              isSelected={selectedIds.includes(p.id)}
              onToggleSelect={onToggleSelect}
              selectedMarketplace={selectedMarketplace}
              isTr={isTr}
              copiedBarcode={copiedBarcode}
              onCopyBarcode={onCopyBarcode}
              onCheckHbStatus={onCheckHbStatus}
              checkingStatusId={checkingStatusId}
              publishingId={publishingId}
              onPublishSingle={onPublishSingle}
              onUnpublishSingle={onUnpublishSingle}
              onEditProduct={onEditProduct}
              isProductActive={isProductActive}
              isProductPending={isProductPending}
              getProductError={getProductError}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

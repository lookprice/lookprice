import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductTableRow } from "./ProductTableRow";

interface ProductsTableProps {
  products: any[];
  paginatedProducts: any[];
  filteredProducts: any[];
  loading: boolean;
  isViewer: boolean;
  isCafe: boolean;
  isCafeRestaurant?: boolean;
  isShopLp: boolean;
  isBookstore: boolean;
  showStoreName?: boolean;
  tableManager: any;
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  toggleSelectAll: () => void;
  highlightedProductId: number | null;
  openActionMenuId: number | null;
  setOpenActionMenuId: (id: number | null) => void;
  badgePopoverProductId: number | null;
  setBadgePopoverProductId: (id: number | null) => void;
  handleToggleBookBadge: (e: React.MouseEvent, p: any, badgeId: string) => void;
  hasProductBadgeLocal: (p: any, badgeId: string) => boolean;
  getProductBadgesLocal: (p: any) => string[];
  getIsBestseller: (p: any) => boolean;
  calculateProfitMargin: (p: any) => any;
  getHepsiburadaUrl: (p: any) => string | null;
  isHepsiburadaPending: (p: any) => boolean;
  getTrendyolUrl: (p: any) => string | null;
  getN11Url: (p: any) => string | null;
  getAmazonUrl: (p: any) => string | null;
  getPazaramaUrl: (p: any) => string | null;
  connectedMarketplaces: any;
  setShowMarketplaceListingsModal: (show: boolean) => void;
  setMarketplaceModalTab: (tab: any) => void;
  setMarketplaceModalStatus: (status: any) => void;
  handleAutoFindImages: (params: any) => void;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  setRecipeProduct: (p: any) => void;
  setSharingProduct: (p: any) => void;
  setSelectedProduct: (p: any) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  lang: string;
  t: any;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  paginatedProducts,
  filteredProducts,
  loading,
  isViewer,
  isCafe,
  isCafeRestaurant,
  isShopLp,
  isBookstore,
  showStoreName,
  tableManager,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  highlightedProductId,
  openActionMenuId,
  setOpenActionMenuId,
  badgePopoverProductId,
  setBadgePopoverProductId,
  handleToggleBookBadge,
  hasProductBadgeLocal,
  getProductBadgesLocal,
  getIsBestseller,
  calculateProfitMargin,
  getHepsiburadaUrl,
  isHepsiburadaPending,
  getTrendyolUrl,
  getN11Url,
  getAmazonUrl,
  getPazaramaUrl,
  connectedMarketplaces,
  setShowMarketplaceListingsModal,
  setMarketplaceModalTab,
  setMarketplaceModalStatus,
  handleAutoFindImages,
  onEdit,
  onDelete,
  setRecipeProduct,
  setSharingProduct,
  setSelectedProduct,
  page,
  setPage,
  totalPages,
  lang,
  t,
}) => {
  return (
    <div className="os-panel overflow-hidden">
      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {!isViewer && (
                <th className="pl-3 py-2 w-8">
                  <input 
                    type="checkbox" 
                    className="h-3.5 w-3.5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {tableManager.metadataMode === 'expandable' && (
                <th className="w-7 py-2 px-1 text-center text-[10px] text-slate-400 font-bold">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {!isCafe && tableManager.isColumnVisible('barcode') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.barcode}</th>
              )}
              <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.productName}</th>
              {showStoreName && tableManager.isColumnVisible('branch') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.branch}</th>
              )}
              {tableManager.isColumnVisible('price') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.price}</th>
              )}
              {tableManager.isColumnVisible('cost') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.cost}</th>
              )}
              {tableManager.isColumnVisible('stock') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.stock}</th>
              )}
              {tableManager.isColumnVisible('actions') && (
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(loading && products.length === 0) ? (
              <tr>
                <td colSpan={10} className="px-3.5 py-8 text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2 shadow-xs"></div>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{t.loading}</p>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3.5 py-10 text-center text-slate-400 text-[11px] font-bold uppercase tracking-wider italic">
                  {t.noProducts}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => (
                <ProductTableRow
                  key={p.id}
                  product={p}
                  isViewer={isViewer}
                  isCafe={isCafe}
                  isCafeRestaurant={isCafeRestaurant}
                  isShopLp={isShopLp}
                  isBookstore={isBookstore}
                  showStoreName={showStoreName}
                  tableManager={tableManager}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                  highlightedProductId={highlightedProductId}
                  openActionMenuId={openActionMenuId}
                  setOpenActionMenuId={setOpenActionMenuId}
                  badgePopoverProductId={badgePopoverProductId}
                  setBadgePopoverProductId={setBadgePopoverProductId}
                  handleToggleBookBadge={handleToggleBookBadge}
                  hasProductBadgeLocal={hasProductBadgeLocal}
                  getProductBadgesLocal={getProductBadgesLocal}
                  getIsBestseller={getIsBestseller}
                  calculateProfitMargin={calculateProfitMargin}
                  getHepsiburadaUrl={getHepsiburadaUrl}
                  isHepsiburadaPending={isHepsiburadaPending}
                  getTrendyolUrl={getTrendyolUrl}
                  getN11Url={getN11Url}
                  getAmazonUrl={getAmazonUrl}
                  getPazaramaUrl={getPazaramaUrl}
                  connectedMarketplaces={connectedMarketplaces}
                  setShowMarketplaceListingsModal={setShowMarketplaceListingsModal}
                  setMarketplaceModalTab={setMarketplaceModalTab}
                  setMarketplaceModalStatus={setMarketplaceModalStatus}
                  handleAutoFindImages={handleAutoFindImages}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  setRecipeProduct={setRecipeProduct}
                  setSharingProduct={setSharingProduct}
                  setSelectedProduct={setSelectedProduct}
                  lang={lang}
                  t={t}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {filteredProducts.length} {lang === 'tr' ? 'ürün' : 'products'}
          </p>
          <div className="flex items-center space-x-1.5">
            <button 
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all active:scale-90 disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="text-xs font-semibold text-slate-700 tabular-nums flex items-center">
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded shadow-2xs">
                {page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
              </span>
            </div>

            <button 
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all active:scale-90 disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

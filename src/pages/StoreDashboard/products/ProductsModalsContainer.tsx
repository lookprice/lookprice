import React from "react";
import { ProductMovementModal } from "@/components/ProductMovementModal";
import { RecipeModal } from "@/pages/StoreDashboard/modals/RecipeModal";
import { ProductSocialMediaShareModal } from "@/components/ProductSocialMediaShareModal";
import { DuplicateMergeModal } from "@/components/DuplicateMergeModal";
import { EanEnrichmentModal } from "@/components/EanEnrichmentModal";
import { SectorTaxonomyModal } from "@/components/SectorTaxonomyModal";
import AiMenuScanModal from "@/pages/StoreDashboard/modals/AiMenuScanModal";
import { MarketplaceBulkPublishModal } from "@/components/marketplace/MarketplaceBulkPublishModal";
import { MarketplaceListingsModal } from "@/components/marketplace/MarketplaceListingsModal";
import { ProductXRayReportModal } from "@/components/marketplace/ProductXRayReportModal";
import { MarketplaceModalTab, MarketplaceModalStatus } from "./types";
import { resolveDomainId } from "@/utils/sectorCapability";
import { getConnectedMarketplaces } from "@/utils/marketplaceEStores";

interface ProductsModalsContainerProps {
  products: any[];
  selectedProduct: any;
  setSelectedProduct: (p: any) => void;
  recipeProduct: any;
  setRecipeProduct: (p: any) => void;
  sharingProduct: any;
  setSharingProduct: (p: any) => void;
  isMergeModalOpen: boolean;
  setIsMergeModalOpen: (open: boolean) => void;
  isEanModalOpen?: boolean;
  setIsEanModalOpen?: (open: boolean) => void;
  isTaxonomyModalOpen?: boolean;
  setIsTaxonomyModalOpen?: (open: boolean) => void;
  isAiMenuModalOpen: boolean;
  setIsAiMenuModalOpen: (open: boolean) => void;
  showBulkPublishModal: boolean;
  setShowBulkPublishModal: (show: boolean) => void;
  showXRayModal: boolean;
  setShowXRayModal: (show: boolean) => void;
  selectedIds: number[];
  showMarketplaceListingsModal: boolean;
  setShowMarketplaceListingsModal: (show: boolean) => void;
  marketplaceModalTab: MarketplaceModalTab;
  marketplaceModalStatus: MarketplaceModalStatus;
  branding?: any;
  currentStoreId?: number;
  onRefresh?: () => void;
  onEdit: (product: any) => void;
  lang: string;
}

export const ProductsModalsContainer: React.FC<ProductsModalsContainerProps> = ({
  products,
  selectedProduct,
  setSelectedProduct,
  recipeProduct,
  setRecipeProduct,
  sharingProduct,
  setSharingProduct,
  isMergeModalOpen,
  setIsMergeModalOpen,
  isEanModalOpen,
  setIsEanModalOpen,
  isTaxonomyModalOpen,
  setIsTaxonomyModalOpen,
  isAiMenuModalOpen,
  setIsAiMenuModalOpen,
  showBulkPublishModal,
  setShowBulkPublishModal,
  showXRayModal,
  setShowXRayModal,
  selectedIds,
  showMarketplaceListingsModal,
  setShowMarketplaceListingsModal,
  marketplaceModalTab,
  marketplaceModalStatus,
  branding,
  currentStoreId,
  onRefresh,
  onEdit,
  lang,
}) => {
  const domainId = resolveDomainId(branding);
  const isShopLpOnly = (domainId === 'RETAIL' || branding?.store_type === 'shop' || branding?.store_type === 'retail') && domainId !== 'HORECA' && domainId !== 'HOTEL' && domainId !== 'BOOKSTORE' && domainId !== 'REAL_ESTATE' && domainId !== 'AUTOMOTIVE';
  const estores = getConnectedMarketplaces(branding);
  const hasMarketplaceApi = estores.hasAnyConnected || !!branding?.marketplace_settings;

  return (
    <>
      {selectedProduct && (
        <ProductMovementModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {recipeProduct && (
        <RecipeModal
          product={recipeProduct}
          products={products}
          onClose={() => setRecipeProduct(null)}
          lang={lang}
        />
      )}

      {sharingProduct && (
        <ProductSocialMediaShareModal
          isOpen={!!sharingProduct}
          onClose={() => setSharingProduct(null)}
          product={sharingProduct}
          branding={branding}
        />
      )}

      {isMergeModalOpen && (
        <DuplicateMergeModal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          onMergedSuccess={() => {
            if (onRefresh) onRefresh();
          }}
          storeId={currentStoreId}
          initialSelectedIds={selectedIds}
          allStoreProducts={products}
        />
      )}

      {isEanModalOpen && setIsEanModalOpen && (
        <EanEnrichmentModal
          isOpen={isEanModalOpen}
          onClose={() => setIsEanModalOpen(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
          storeId={currentStoreId}
        />
      )}

      {isTaxonomyModalOpen && setIsTaxonomyModalOpen && (
        <SectorTaxonomyModal
          isOpen={isTaxonomyModalOpen}
          onClose={() => setIsTaxonomyModalOpen(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
          storeId={currentStoreId}
          storeName={branding?.name || branding?.store_name}
        />
      )}

      {isAiMenuModalOpen && (
        <AiMenuScanModal
          isOpen={isAiMenuModalOpen}
          onClose={() => setIsAiMenuModalOpen(false)}
          lang={lang}
          storeId={currentStoreId}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {showBulkPublishModal && isShopLpOnly && hasMarketplaceApi && (
        <MarketplaceBulkPublishModal
          isOpen={showBulkPublishModal}
          onClose={() => setShowBulkPublishModal(false)}
          products={products}
          selectedProductIds={selectedIds}
          storeBranding={branding}
          currentStoreId={currentStoreId}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
          lang={lang}
        />
      )}

      {showMarketplaceListingsModal && isShopLpOnly && hasMarketplaceApi && (
        <MarketplaceListingsModal
          isOpen={showMarketplaceListingsModal}
          onClose={() => setShowMarketplaceListingsModal(false)}
          products={products}
          storeBranding={branding}
          currentStoreId={currentStoreId}
          initialMarketplace={marketplaceModalTab as any}
          initialStatus={marketplaceModalStatus as any}
          onRefresh={() => {
            if (onRefresh) onRefresh();
          }}
          onEditProduct={(product) => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('returnToMarketplaceModal', 'true');
            }
            setShowMarketplaceListingsModal(false);
            onEdit(product);
          }}
          lang={lang}
        />
      )}

      {showXRayModal && isShopLpOnly && hasMarketplaceApi && (
        <ProductXRayReportModal
          isOpen={showXRayModal}
          onClose={() => setShowXRayModal(false)}
          products={products}
          lang={lang}
          storeName={branding?.store_name || branding?.name || "Mağaza"}
          branding={branding}
        />
      )}
    </>
  );
};

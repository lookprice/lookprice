import React from "react";
import { ProductMovementModal } from "@/components/ProductMovementModal";
import { RecipeModal } from "@/pages/StoreDashboard/modals/RecipeModal";
import { ProductSocialMediaShareModal } from "@/components/ProductSocialMediaShareModal";
import { DuplicateMergeModal } from "@/components/DuplicateMergeModal";
import AiMenuScanModal from "@/pages/StoreDashboard/modals/AiMenuScanModal";
import { MarketplaceBulkPublishModal } from "@/components/marketplace/MarketplaceBulkPublishModal";
import { MarketplaceListingsModal } from "@/components/marketplace/MarketplaceListingsModal";
import { MarketplaceModalTab, MarketplaceModalStatus } from "./types";

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
  isAiMenuModalOpen: boolean;
  setIsAiMenuModalOpen: (open: boolean) => void;
  showBulkPublishModal: boolean;
  setShowBulkPublishModal: (show: boolean) => void;
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
  isAiMenuModalOpen,
  setIsAiMenuModalOpen,
  showBulkPublishModal,
  setShowBulkPublishModal,
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

      {showBulkPublishModal && (
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

      {showMarketplaceListingsModal && (
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
            setShowMarketplaceListingsModal(false);
            onEdit(product);
          }}
          lang={lang}
        />
      )}
    </>
  );
};

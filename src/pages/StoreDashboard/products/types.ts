export interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onDeleteAll: () => void;
  onBulkDelete?: (ids: number[]) => void;
  onEdit: (product: any) => void;
  onAddNew: () => void;
  onImport: () => void;
  onDelete: (id: number) => void;
  onExportReport: () => void;
  onApplyTaxRule?: (category: string, taxRate: number) => void;
  onBulkPriceUpdate?: () => void;
  onBulkRecalculatePrice2?: () => void;
  onBulkAdd?: (products: any[]) => void;
  onBulkRename?: (renames: { id: number; name: string }[]) => void;
  onReformatNames?: () => void;
  onShowQr: () => void;
  branding?: any;
  showStoreName?: boolean;
  currentStoreId?: number;
  includeBranches?: boolean;
  propertiesCount?: number;
  onSwitchTab?: (tab: string) => void;
  isCafeRestaurant?: boolean;
  onRefresh?: () => void;
}

export type MarketplaceFilterType = 'all' | 'listed' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama' | 'errors' | 'not_listed';
export type MarketplaceModalTab = 'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';
export type MarketplaceModalStatus = 'all' | 'active' | 'pending' | 'error' | 'inactive';

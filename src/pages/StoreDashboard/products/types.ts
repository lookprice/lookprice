export interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onDeleteAll: () => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkWebSale?: (ids: number[], isWebSale: boolean) => Promise<any> | void;
  onBulkCategoryAssign?: (ids: number[], category: string, subCategory?: string, updateSubCategory?: boolean) => Promise<any> | void;
  onEdit: (product: any) => void;
  onOpenPlacement?: (product: any) => void;
  onAddNew: () => void;
  onImport: () => void;
  onDelete: (id: number) => void;
  onExportReport: (customIncludeZeroStock?: boolean, customProducts?: any[]) => void;
  onApplyTaxRule?: (category: string, taxRate: number) => void;
  onBulkPriceUpdate?: () => void;
  onBulkRecalculatePrice2?: () => void;
  onBulkAdd?: (products: any[]) => void;
  onBulkRename?: (renames: { id: number; name: string }[]) => void;
  onReformatNames?: () => void;
  onShowQr: () => void;
  branding?: any;
  setBranding?: (branding: any) => void;
  showStoreName?: boolean;
  currentStoreId?: number;
  includeBranches?: boolean;
  branches?: any[];
  setIncludeBranches?: (val: boolean) => void;
  propertiesCount?: number;
  onSwitchTab?: (tab: string) => void;
  isCafeRestaurant?: boolean;
  onRefresh?: () => void;
}

export type ShowcaseFilterType = 'all' | 'web_active' | 'web_passive';
export type MarketplaceFilterType = 'all' | 'listed' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama' | 'errors' | 'not_listed';
export type MarketplaceModalTab = 'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';
export type MarketplaceModalStatus = 'all' | 'active' | 'pending' | 'error' | 'inactive';

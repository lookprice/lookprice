export type MarketplaceType = 'hepsiburada' | 'trendyol' | 'amazon' | 'pazarama';

export interface LocalCategoryItem {
  key: string;
  mainCategory: string;
  subCategory?: string;
  isSubCategory: boolean;
  productCount: number;
}

export const PRODUCT_FIELD_OPTIONS = [
  { value: '$product.brand', label: 'Ürün Markası (Brand / Marka)' },
  { value: '$product.name', label: 'Ürün Adı (Product Name)' },
  { value: '$product.barcode', label: 'Barkod / SKU (Barcode)' },
  { value: '$product.description', label: 'Ürün Açıklaması (Description)' },
  { value: '$product.category', label: 'Mağaza Kategorisi' },
  { value: '$product.sub_category', label: 'Alt Kategori' },
  { value: '$product.variant_color', label: 'Varyant Rengi (Color Swatch)' },
  { value: '$product.variant_size', label: 'Varyant Bedeni / Ölçüsü (Size)' },
  { value: '$product.tax_rate', label: 'KDV Oranı (%)' },
  { value: '$product.price', label: 'Satış Fiyatı (Price)' }
];

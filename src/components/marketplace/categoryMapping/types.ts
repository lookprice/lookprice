export type MarketplaceType = 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';

export interface LocalCategoryItem {
  key: string;
  mainCategory: string;
  subCategory?: string;
  isSubCategory: boolean;
  productCount: number;
}

export const PRODUCT_FIELD_OPTIONS = [
  { value: '$product.brand', label: 'Ürün Markası (Brand / Marka)' },
  { value: '$product.color', label: 'Ürün Rengi (Color / Renk)' },
  { value: '$product.warranty_months', label: 'Garanti Süresi (Ay - Örn: 24)' },
  { value: '$product.warranty_type', label: 'Garanti Tipi (Distribütör / İthalatçı)' },
  { value: '$product.origin_country', label: 'Menşei Ülke (Origin - Örn: TR, CN)' },
  { value: '$product.material', label: 'Materyal / Malzeme (Material)' },
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


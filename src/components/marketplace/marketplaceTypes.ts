import React from 'react';
import { getMarketplaceListingUrl, getMarketplaceMerchantPortalUrl } from '../../utils/marketplaceUrls';

export type MarketplaceKey = 'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';
export type ListingStatus = 'all' | 'active' | 'error' | 'inactive' | 'pending';

export interface MarketplaceConfig {
  key: MarketplaceKey;
  name: string;
  shortName: string;
  color: string;
  bgLight: string;
  borderColor: string;
  activeBadgeBg: string;
  activeBadgeText: string;
  activeField: string;
  errorField: string;
  lastSyncField: string;
  skuField: string;
  merchantPortalUrl: string;
  getListingUrl: (p: any) => string;
  getMerchantUrl: (p: any) => string;
}

export const MARKETPLACES: MarketplaceConfig[] = [
  {
    key: 'hepsiburada',
    name: 'Hepsiburada',
    shortName: 'HB',
    color: 'text-orange-600',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    activeBadgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    activeBadgeText: 'HB SATIŞTA',
    activeField: 'is_hepsiburada_active',
    errorField: 'hepsiburada_last_error',
    lastSyncField: 'hepsiburada_last_sync',
    skuField: 'hepsiburada_sku',
    merchantPortalUrl: 'https://merchant.hepsiburada.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('hepsiburada', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('hepsiburada', p)
  },
  {
    key: 'trendyol',
    name: 'Trendyol',
    shortName: 'TY',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    activeBadgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    activeBadgeText: 'TY SATIŞTA',
    activeField: 'is_trendyol_active',
    errorField: 'trendyol_last_error',
    lastSyncField: 'trendyol_last_sync',
    skuField: 'trendyol_id',
    merchantPortalUrl: 'https://partner.trendyol.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('trendyol', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('trendyol', p)
  },
  {
    key: 'n11',
    name: 'N11',
    shortName: 'N11',
    color: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    activeBadgeBg: 'bg-red-100 text-red-800 border-red-200',
    activeBadgeText: 'N11 SATIŞTA',
    activeField: 'is_n11_active',
    errorField: 'n11_last_error',
    lastSyncField: 'n11_last_sync',
    skuField: 'n11_id',
    merchantPortalUrl: 'https://so.n11.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('n11', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('n11', p)
  },
  {
    key: 'amazon',
    name: 'Amazon TR',
    shortName: 'AMZ',
    color: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    activeBadgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    activeBadgeText: 'AMAZON SATIŞTA',
    activeField: 'is_amazon_active',
    errorField: 'amazon_last_error',
    lastSyncField: 'amazon_last_sync',
    skuField: 'amazon_asin',
    merchantPortalUrl: 'https://sellercentral.amazon.com.tr/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('amazon', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('amazon', p)
  },
  {
    key: 'pazarama',
    name: 'Pazarama',
    shortName: 'PZR',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    activeBadgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    activeBadgeText: 'PAZARAMA SATIŞTA',
    activeField: 'is_pazarama_active',
    errorField: 'pazarama_last_error',
    lastSyncField: 'pazarama_last_sync',
    skuField: 'pazarama_id',
    merchantPortalUrl: 'https://satici.pazarama.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('pazarama', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('pazarama', p)
  }
];

export interface MarketplaceMetrics {
  total: number;
  active: number;
  errors: number;
  inactive: number;
  pending: number;
}

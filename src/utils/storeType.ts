import { Store as StoreInfo } from "../types";

export type StoreType = "real_estate" | "automotive" | "product" | "cafe_restaurant";

export const getStoreType = (store: StoreInfo | null): StoreType => {
  if (!store) return "product";

  const s = store as any;
  const storeType = s.store_type || s.branding?.store_type;
  const sector = s.sector || s.page_layout_settings?.sector || s.branding?.page_layout_settings?.sector || s.branding?.sector;

  if (
    storeType === "cafe_restaurant" || 
    sector === "cafe_restaurant"
  ) {
    return "cafe_restaurant";
  }

  if (
    storeType === "real_estate" || 
    storeType === "portfolio" ||
    sector === "real_estate" ||
    sector === "portfolio"
  ) {
    return "real_estate";
  }

  if (
    storeType === "motor_vehicle" || 
    storeType === "automotive" || 
    sector === "motor_vehicle" || 
    sector === "automotive"
  ) {
    return "automotive";
  }

  return "product";
};

export const isPortfolioStore = (store: StoreInfo | null): boolean => {
  const type = getStoreType(store);
  return type === "real_estate" || type === "automotive";
};

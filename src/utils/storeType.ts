import { Store as StoreInfo } from "../types";

export type StoreType = "real_estate" | "automotive" | "product";

export const getStoreType = (store: StoreInfo | null): StoreType => {
  if (!store) return "product";

  const s = store as any;
  const storeType = s.store_type;
  const sector = s.sector || s.page_layout_settings?.sector || s.branding?.page_layout_settings?.sector;

  if (
    storeType === "real_estate" || 
    sector === "real_estate"
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

import { Store as StoreInfo } from "../types";
export * from "./sectorCapability";
import { resolveDomainId, hasSectorCapability } from "./sectorCapability";

export type StoreType = "real_estate" | "automotive" | "product" | "cafe_restaurant";

export const getStoreType = (store: StoreInfo | null): StoreType => {
  if (!store) return "product";
  const domain = resolveDomainId(store);
  if (domain === "REAL_ESTATE") return "real_estate";
  if (domain === "AUTOMOTIVE") return "automotive";
  if (domain === "HORECA" || domain === "HOTEL") return "cafe_restaurant";
  return "product";
};

export const isPortfolioStore = (store: StoreInfo | null): boolean => {
  const domain = resolveDomainId(store);
  return domain === "REAL_ESTATE" || domain === "AUTOMOTIVE";
};

export const isBookstoreStore = (store: StoreInfo | null): boolean => {
  return resolveDomainId(store) === "BOOKSTORE";
};


import { Store as StoreInfo } from "../types";

export type StoreType = "real_estate" | "automotive" | "product" | "cafe_restaurant";

export const getStoreType = (store: StoreInfo | null): StoreType => {
  if (!store) return "product";

  const s = store as any;
  const rawStoreType = (s.store_type || s.branding?.store_type || "").toString().toLowerCase().trim();
  const rawSector = (s.sector || s.page_layout_settings?.sector || s.branding?.page_layout_settings?.sector || s.branding?.sector || "").toString().toLowerCase().trim();
  const rawSubSector = (s.sub_sector || s.branding?.sub_sector || "").toString().toLowerCase().trim();

  // HorecaLP / Cafe / Restaurant / Hotel detection
  if (
    rawStoreType === "cafe_restaurant" ||
    rawStoreType === "horeca" ||
    rawStoreType === "horecalp" ||
    rawStoreType === "restaurant" ||
    rawStoreType === "cafe" ||
    rawStoreType === "hotel" ||
    rawStoreType === "otel" ||
    rawSector === "cafe_restaurant" ||
    rawSector === "horeca" ||
    rawSector === "horecalp" ||
    rawSector === "restaurant" ||
    rawSector === "cafe" ||
    rawSector === "hotel" ||
    rawSubSector === "cafe_restaurant" ||
    rawSubSector === "horeca" ||
    rawSubSector === "horecalp" ||
    rawSubSector === "restaurant" ||
    rawSubSector === "hotel" ||
    s.hotel_module_enabled === true ||
    s.branding?.hotel_module_enabled === true ||
    s.branding?.digital_menu_settings?.theme !== undefined
  ) {
    return "cafe_restaurant";
  }

  if (
    rawStoreType === "real_estate" || 
    rawStoreType === "portfolio" ||
    rawStoreType === "emlak" ||
    rawSector === "real_estate" ||
    rawSector === "portfolio" ||
    rawSector === "emlak" ||
    rawSubSector === "real_estate"
  ) {
    return "real_estate";
  }

  if (
    rawStoreType === "motor_vehicle" || 
    rawStoreType === "automotive" || 
    rawStoreType === "oto" ||
    rawStoreType === "galeri" ||
    rawSector === "motor_vehicle" || 
    rawSector === "automotive" ||
    rawSubSector === "automotive" ||
    rawSubSector === "motor_vehicle"
  ) {
    return "automotive";
  }

  return "product";
};

export const isPortfolioStore = (store: StoreInfo | null): boolean => {
  const type = getStoreType(store);
  return type === "real_estate" || type === "automotive";
};

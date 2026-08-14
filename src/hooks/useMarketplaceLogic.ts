import { useState } from "react";

export type MainTab = "real_estate" | "vehicle";
export type ViewMode = "rich" | "list";

export const useMarketplaceLogic = () => {
  // State definitions extracted from Marketplace.tsx
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [portalNews, setPortalNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [mainTab, setMainTab] = useState<MainTab>("real_estate");
  const [reFihristTab, setReFihristTab] = useState<string>("satilik");
  const [vehFihristTab, setVehFihristTab] = useState<string>("latest");
  const [rePropertyType, setRePropertyType] = useState<string>("all");
  const [reSubPropertyTypes, setReSubPropertyTypes] = useState<string[]>([]);
  const [reSubRegions, setReSubRegions] = useState<string[]>([]);
  const [reRooms, setReRooms] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("rich");
  
  const [activeSubSector, setActiveSubSector] = useState<string>("all");
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<string>("all");
  const [activeVehicleBrand, setActiveVehicleBrand] = useState<string>("all");
  const [activeVehicleModel, setActiveVehicleModel] = useState<string>("all");
  const [activeVehicleFuel, setActiveVehicleFuel] = useState<string>("all");
  const [activeVehicleTransmission, setActiveVehicleTransmission] = useState<string>("all");
  const [activeVehicleYear, setActiveVehicleYear] = useState<string>("all");
  const [activeVehicleBodyType, setActiveVehicleBodyType] = useState<string>("all");
  const [activeVehicleTradeIn, setActiveVehicleTradeIn] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [reRegion, setReRegion] = useState<string>("all");
  const [reType, setReType] = useState<string>("all");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("enrakipsiz_theme");
    return saved ? saved === "dark" : true;
  });

  const reSubPropertyType = reSubPropertyTypes.length > 0 ? reSubPropertyTypes[0] : "all";
  const setReSubPropertyType = (val: string) => {
    if (!val || val === "all") setReSubPropertyTypes([]);
    else setReSubPropertyTypes([val]);
  };

  const reSubRegion = reSubRegions.length > 0 ? reSubRegions[0] : "all";
  const setReSubRegion = (val: string) => {
    if (!val || val === "all") setReSubRegions([]);
    else setReSubRegions([val]);
  };

  return {
    isFilterDrawerOpen, setIsFilterDrawerOpen,
    listings, setListings,
    portalNews, setPortalNews,
    loading, setLoading,
    searchQuery, setSearchQuery,
    mainTab, setMainTab,
    reFihristTab, setReFihristTab,
    vehFihristTab, setVehFihristTab,
    rePropertyType, setRePropertyType,
    reSubPropertyTypes, setReSubPropertyTypes,
    reSubPropertyType, setReSubPropertyType,
    reSubRegions, setReSubRegions,
    reSubRegion, setReSubRegion,
    reRooms, setReRooms,
    activeTags, setActiveTags,
    viewMode, setViewMode,
    activeSubSector, setActiveSubSector,
    activeVehicleCategory, setActiveVehicleCategory,
    activeVehicleBrand, setActiveVehicleBrand,
    activeVehicleModel, setActiveVehicleModel,
    activeVehicleFuel, setActiveVehicleFuel,
    activeVehicleTransmission, setActiveVehicleTransmission,
    activeVehicleYear, setActiveVehicleYear,
    activeVehicleBodyType, setActiveVehicleBodyType,
    activeVehicleTradeIn, setActiveVehicleTradeIn,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    minYear, setMinYear,
    maxYear, setMaxYear,
    reRegion, setReRegion,
    reType, setReType,
    isDarkMode, setIsDarkMode
  };
};

import { useState, useEffect } from "react";

export const useDashboardController = (user: any) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(`storeDashboardTab_${user.store_id || 'admin'}`) || "products";
  });

  useEffect(() => {
    localStorage.setItem(`storeDashboardTab_${user.store_id || 'admin'}`, activeTab);
  }, [activeTab, user.store_id]);

  const [branding, setBranding] = useState<any>({
    name: "LookPrice",
    store_name: "LookPrice",
    primary_color: "#4f46e5",
    logo_url: "",
    favicon_url: "",
    default_currency: "TRY",
    default_language: "tr",
    payment_settings: {},
    amazon_settings: {},
    n11_settings: {},
    hepsiburada_settings: {},
    trendyol_settings: {},
    pazarama_settings: {},
    custom_domain: ""
  });

  return {
    activeTab,
    setActiveTab,
    branding,
    setBranding
  };
};

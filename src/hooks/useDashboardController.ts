import { useState, useEffect } from "react";

export const useDashboardController = (user: any) => {
  const storeId = user?.store_id || 'admin';
  const storeKey = `storeDashboardTab_${storeId}`;

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) return tabParam;

      const savedTab = localStorage.getItem(storeKey) || localStorage.getItem('storeDashboardTab_last');
      if (savedTab) return savedTab;
    }
    return "system_cockpit";
  });

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(`storeDashboardTab_${user?.store_id || 'admin'}`, activeTab);
      localStorage.setItem('storeDashboardTab_last', activeTab);

      if (typeof window !== "undefined" && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") !== activeTab) {
          url.searchParams.set("tab", activeTab);
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [activeTab, user?.store_id]);

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

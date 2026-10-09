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
      if (savedTab && savedTab !== 'system_cockpit') return savedTab;
    }
    return "fast-pos";
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

  const [branding, setBranding] = useState<any>(() => {
    let initialBranding = {
      name: "Rodel Investment",
      store_name: "Rodel Investment",
      primary_color: "#4f46e5",
      logo_url: "",
      favicon_url: "",
      default_currency: "TRY",
      default_language: "tr",
      whatsapp_number: "905488902309",
      phone: "+90 548 890 23 09",
      payment_settings: {},
      amazon_settings: {},
      n11_settings: {},
      hepsiburada_settings: {},
      trendyol_settings: {},
      pazarama_settings: {},
      custom_domain: ""
    };

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`store_branding_${storeId}`) || localStorage.getItem('store_branding_admin');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.whatsapp_number === "905428655000" || !parsed.whatsapp_number) {
            parsed.whatsapp_number = "905488902309";
          }
          if (parsed.phone === "+905428655000" || !parsed.phone) {
            parsed.phone = "+90 548 890 23 09";
          }
          initialBranding = { ...initialBranding, ...parsed };
        }
      } catch (e) {
        // ignore
      }
    }
    return initialBranding;
  });

  useEffect(() => {
    if (branding) {
      if (branding.whatsapp_number === "905428655000") {
        setBranding((prev: any) => ({ ...prev, whatsapp_number: "905488902309" }));
      }
      if (branding.phone === "+905428655000") {
        setBranding((prev: any) => ({ ...prev, phone: "+90 548 890 23 09" }));
      }
      localStorage.setItem(`store_branding_${storeId}`, JSON.stringify(branding));
    }
  }, [branding, storeId]);

  return {
    activeTab,
    setActiveTab,
    branding,
    setBranding
  };
};

import { useState, useEffect, useRef } from "react";

const createPlaceholderBranding = (slugValue?: string) => ({
  id: undefined as number | undefined,
  name: "",
  store_name: "",
  slug: slugValue || "",
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
  custom_domain: "",
  __isHydrating: true
});

const readScopedTab = (tabKey: string, hasSlug: boolean) => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) return tabParam;

    const savedTab = localStorage.getItem(tabKey) || (!hasSlug ? localStorage.getItem("storeDashboardTab_last") : null);
    if (savedTab && savedTab !== "system_cockpit") return savedTab;
  }
  return "fast-pos";
};

const readScopedBranding = (brandingKey: string, normalizedSlug: string, allowAdminFallback: boolean) => {
  const placeholder = createPlaceholderBranding(normalizedSlug);
  if (typeof window === "undefined") return placeholder;

  try {
    const saved =
      localStorage.getItem(brandingKey) ||
      (allowAdminFallback ? localStorage.getItem("store_branding_admin") : null);

    if (saved) {
      const parsed = JSON.parse(saved);
      const parsedSlug = String(parsed?.slug || "").trim().toLowerCase();
      if (normalizedSlug && parsedSlug !== normalizedSlug) {
        return placeholder;
      }
      if (parsed.whatsapp_number === "905428655000" || !parsed.whatsapp_number) {
        parsed.whatsapp_number = "905488902309";
      }
      if (parsed.phone === "+905428655000" || !parsed.phone) {
        parsed.phone = "+90 548 890 23 09";
      }
      return { ...placeholder, ...parsed, __isHydrating: false };
    }
  } catch {
    // ignore corrupted cache
  }
  return placeholder;
};

export const useDashboardController = (user: any, slug?: string) => {
  const normalizedSlug = slug ? slug.trim().toLowerCase() : "";
  const cacheScope = normalizedSlug ? `slug_${normalizedSlug}` : String(user?.store_id || "admin");
  const tabKey = `storeDashboardTab_${cacheScope}`;
  const brandingKey = `store_branding_${cacheScope}`;
  const allowAdminFallback = !normalizedSlug && !user?.store_id;

  const [activeTab, setActiveTab] = useState(() => readScopedTab(tabKey, Boolean(normalizedSlug)));
  const [branding, setBranding] = useState<any>(() => readScopedBranding(brandingKey, normalizedSlug, allowAdminFallback));

  const hydratedScopeRef = useRef(cacheScope);

  useEffect(() => {
    if (hydratedScopeRef.current !== cacheScope) {
      hydratedScopeRef.current = cacheScope;
      const nextTab = readScopedTab(tabKey, Boolean(normalizedSlug));
      const nextBranding = readScopedBranding(brandingKey, normalizedSlug, allowAdminFallback);
      setActiveTab(nextTab);
      setBranding(nextBranding);
      return;
    }

    if (activeTab) {
      localStorage.setItem(tabKey, activeTab);
      if (!normalizedSlug) {
        localStorage.setItem("storeDashboardTab_last", activeTab);
      }

      if (typeof window !== "undefined" && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("tab") !== activeTab) {
          url.searchParams.set("tab", activeTab);
          window.history.replaceState({}, "", url.toString());
        }
      }
    }
  }, [activeTab, cacheScope, tabKey, brandingKey, normalizedSlug, allowAdminFallback]);

  useEffect(() => {
    if (!branding || hydratedScopeRef.current !== cacheScope) return;
    if (branding.__isHydrating) return;

    const brandingSlug = String(branding.slug || "").trim().toLowerCase();
    if (normalizedSlug && brandingSlug !== normalizedSlug) return;

    if (branding.whatsapp_number === "905428655000") {
      setBranding((prev: any) => ({ ...prev, whatsapp_number: "905488902309" }));
      return;
    }
    if (branding.phone === "+905428655000") {
      setBranding((prev: any) => ({ ...prev, phone: "+90 548 890 23 09" }));
      return;
    }
    try {
      localStorage.setItem(brandingKey, JSON.stringify(branding));
    } catch {
      // ignore storage quota errors
    }
  }, [branding, brandingKey, cacheScope, normalizedSlug]);

  return {
    activeTab,
    setActiveTab,
    branding,
    setBranding
  };
};

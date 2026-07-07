
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { Product, Store as StoreInfo, BlogPost } from "../types";

export interface BasketItem extends Product {
  quantity: number;
}

export const useStoreShowcase = (customSlug?: string) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = customSlug || urlSlug;
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [radarNews, setRadarNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [storeRes, productsRes, radarNewsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug),
          api.getPublicRadarNews(slug).catch((err: any) => {
            console.error("Failed to load radar news:", err);
            return [];
          })
        ]);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        // Layout parsing logic
        let parsedLayout = storeRes.page_layout;
        if (typeof parsedLayout === "string" && parsedLayout) {
          try {
            parsedLayout = JSON.parse(parsedLayout);
          } catch (e) {
            parsedLayout = null;
          }
        }

        if (parsedLayout) {
          storeRes.page_layout_full = parsedLayout;
          const defaultSectionIds = ['hero', 'search', 'stats', 'portfolio', 'news', 'blog', 'team', 'financing', 'calculator', 'map', 'social'];
          
          if (parsedLayout && typeof parsedLayout === "object" && !Array.isArray(parsedLayout)) {
            if (Array.isArray(parsedLayout.sections)) {
              storeRes.page_layout = parsedLayout.sections.map((s: any) => ({
                id: s.id || s.type,
                type: s.type || s.id,
                enabled: s.enabled !== false
              }));
            } else {
              storeRes.page_layout = defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
            }
          } else if (Array.isArray(parsedLayout)) {
            storeRes.page_layout = parsedLayout.map((s: any) => ({
              id: s.id || s.type,
              type: s.type || s.id,
              enabled: s.enabled !== false
            }));
          } else {
            storeRes.page_layout = defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
          }
        } else {
          storeRes.page_layout = [];
        }

        if (typeof storeRes.menu_links === "string") {
          try {
            storeRes.menu_links = JSON.parse(storeRes.menu_links);
          } catch (e) {
            storeRes.menu_links = [];
          }
        }
        
        storeRes.currency = storeRes.default_currency || "TRY";
        setStore(storeRes);
        setProducts(productsRes.filter((p: Product) => p.is_web_sale !== false));
        
        // Filter radar news by sector
        const currentSector = storeRes.store_type === 'motor_vehicle' || storeRes.store_type === 'automotive' ? 'automotive' : 'real_estate';
        const filteredNews = Array.isArray(radarNewsRes) 
          ? radarNewsRes.filter((n: any) => {
              if (!n.sector) return true;
              return n.sector === currentSector || 
                     (currentSector === 'automotive' && n.sector === 'motor_vehicle');
            })
          : [];
        setRadarNews(filteredNews);
        
        document.title = storeRes.name || "Store";
      } catch (err: any) {
        setError(err.message || t.dashboard.storeLoadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  return { slug, store, products, radarNews, loading, error, t, lang };
};

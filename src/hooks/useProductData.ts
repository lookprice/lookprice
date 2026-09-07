import { useState, useCallback, useEffect } from "react";
import { api } from "../services/api";
import { Product } from "../types";

export const useProductData = (user: any, slug: string | undefined, includeBranches: boolean) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(() => {
    return user?.store_id || undefined;
  });

  const fetchData = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      let targetStoreId = user?.store_id;
      
      if (slug) {
        // Resolve target store from slug if present (e.g. /dashboard/GAP)
        const storeInfo = await api.getBranding(undefined, slug);
        if (storeInfo && storeInfo.id) {
          targetStoreId = storeInfo.id;
        } else if (storeInfo && storeInfo.error) {
          console.error("Store branding error:", storeInfo.error);
          if (!background) setLoading(false);
          return;
        }
      } else if (user?.role === 'superadmin' && !user?.store_id) {
        if (!background) setLoading(false);
        return;
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        console.warn("No target store ID found for products fetch");
        if (!background) setLoading(false);
        return;
      }
      
      setCurrentStoreId(targetStoreId);
      console.log("Fetching products for store:", targetStoreId);

      const productsRes = await api.getProducts("", targetStoreId, includeBranches);
      console.log("API products response:", productsRes);
      
      if (Array.isArray(productsRes)) {
        setProducts(productsRes);
      } else {
        console.warn("getProducts returned non-array:", productsRes);
      }
    } catch (error) {
      console.error("Fetch products error in useProductData:", error);
    } finally {
      if (!background) setLoading(false);
    }
  }, [includeBranches, user?.role, user?.store_id, slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, setProducts, loading, setLoading, fetchData, currentStoreId };
};

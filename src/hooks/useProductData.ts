import { useState, useCallback, useEffect } from "react";
import { api } from "../services/api";
import { Product } from "../types";

export const useProductData = (user: any, slug: string | undefined, includeBranches: boolean) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(user.store_id);

  const fetchData = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      let targetStoreId = user.store_id;
      
      if (user.role === 'superadmin') {
        if (slug) {
          const storeInfo = await api.getBranding(undefined, slug);
          if (storeInfo && storeInfo.id) {
            targetStoreId = storeInfo.id;
          } else if (storeInfo && storeInfo.error) {
            console.error("Store branding error:", storeInfo.error);
            if (!background) setLoading(false);
            return;
          }
        } else {
          return;
        }
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        console.error("No target store ID found");
        if (!background) setLoading(false);
        return;
      }
      
      setCurrentStoreId(targetStoreId);

      const productsRes = await api.getProducts("", targetStoreId, includeBranches);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      if (!background) setLoading(false);
    }
  }, [includeBranches, user.role, user.store_id, slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, setProducts, loading, setLoading, fetchData, currentStoreId };
};

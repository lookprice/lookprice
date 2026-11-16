import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "../services/api";
import { Product } from "../types";

export const useProductData = (user: any, slug: string | undefined, includeBranches: boolean) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(() => {
    return slug ? undefined : (user?.store_id || undefined);
  });

  const fetchSeqRef = useRef(0);
  const lastSlugRef = useRef(slug);

  useEffect(() => {
    if (lastSlugRef.current !== slug) {
      lastSlugRef.current = slug;
      setProducts([]);
      setHasLoadedOnce(false);
      setLoading(true);
      setCurrentStoreId(slug ? undefined : (user?.store_id || undefined));
    }
  }, [slug, user?.store_id]);

  const fetchData = useCallback(async (background = false) => {
    const seq = ++fetchSeqRef.current;
    try {
      if (!background && !hasLoadedOnce) setLoading(true);

      let targetStoreId: number | undefined = slug ? undefined : (user?.store_id || undefined);

      if (slug) {
        const storeInfo = await api.getBranding(undefined, slug);
        if (fetchSeqRef.current !== seq) return;

        if (storeInfo && storeInfo.id) {
          targetStoreId = storeInfo.id;
        } else if (storeInfo && storeInfo.error) {
          console.error("Store branding error:", storeInfo.error);
          setCurrentStoreId(undefined);
          setProducts([]);
          if (!background) setLoading(false);
          return;
        }
      } else if (user?.role === "superadmin" && !targetStoreId) {
        if (!background) setLoading(false);
        return;
      }

      if (targetStoreId === undefined || targetStoreId === null) {
        console.warn("No target store ID found for products fetch");
        if (!background) setLoading(false);
        return;
      }

      if (fetchSeqRef.current !== seq) return;
      setCurrentStoreId(targetStoreId);

      const productsRes = await api.getProducts("", targetStoreId, includeBranches);
      if (fetchSeqRef.current !== seq) return;

      if (Array.isArray(productsRes)) {
        setProducts(productsRes);
      } else {
        console.warn("getProducts returned non-array:", productsRes);
      }
    } catch (error) {
      console.error("Fetch products error in useProductData:", error);
    } finally {
      if (fetchSeqRef.current === seq) {
        setHasLoadedOnce(true);
        if (!background) setLoading(false);
      }
    }
  }, [includeBranches, user?.role, user?.store_id, slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, setProducts, loading, setLoading, fetchData, currentStoreId };
};

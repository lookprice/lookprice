import { useState, useCallback } from "react";
import { api } from "../services/api";

export const useSaleData = (currentStoreId: number | undefined, salesStatusFilter: string, salesStartDate: string, salesEndDate: string) => {
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      setSalesLoading(true);
      const res = await api.getSales(salesStatusFilter, salesStartDate, salesEndDate, currentStoreId);
      setSales(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch sales error:", error);
    } finally {
      setSalesLoading(false);
    }
  }, [salesStatusFilter, salesStartDate, salesEndDate, currentStoreId]);

  return { sales, setSales, salesLoading, setSalesLoading, fetchSales };
};

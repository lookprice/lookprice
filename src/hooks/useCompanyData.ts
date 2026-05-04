import { useState, useCallback } from "react";
import { api } from "../services/api";

export const useCompanyData = (currentStoreId: number | undefined, includeZeroBalance: boolean, transactionStartDate: string, transactionEndDate: string) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyTransactions, setCompanyTransactions] = useState<any[]>([]);
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({});
  const [transactionLoading, setTransactionLoading] = useState(false);

  const fetchCompanies = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      // Always fetch all companies so that autocomplete in Quote/POS forms works for 0-balance customers.
      // The Companies tab does client-side filtering based on includeZeroBalance anyway.
      const res = await api.getCompanies(true, currentStoreId);
      setCompanies(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch companies error:", error);
    }
  }, [currentStoreId]);

  const handleFetchTransactions = async (companyId: number, targetStoreId: number | undefined) => {
    try {
      setTransactionLoading(true);
      const res = await api.getCompanyTransactions(companyId, transactionStartDate, transactionEndDate, targetStoreId);
      if (res.transactions) {
        setCompanyTransactions(res.transactions);
        setOpeningBalances(res.opening_balances || {});
      } else {
        setCompanyTransactions(res);
        setOpeningBalances({});
      }
    } catch (error) {
      console.error("Fetch transactions error:", error);
    } finally {
      setTransactionLoading(false);
    }
  };

  return { companies, setCompanies, companyTransactions, setCompanyTransactions, openingBalances, setOpeningBalances, transactionLoading, setTransactionLoading, fetchCompanies, handleFetchTransactions };
};

import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Quotation } from '../types';

export const useQuotationData = (currentStoreId: number | undefined, quotationSearch: string, quotationStatusFilter: string) => {
  const [quotationList, setQuotationList] = useState<Quotation[]>([]);

  const fetchQuotations = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      const data = await api.getQuotations(quotationSearch, quotationStatusFilter, currentStoreId);
      setQuotationList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    }
  }, [currentStoreId, quotationSearch, quotationStatusFilter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotationList, setQuotationList, fetchQuotations };
};

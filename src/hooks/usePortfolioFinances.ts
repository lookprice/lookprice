import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface PortfolioTransaction {
  id: number;
  store_id: number;
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  property_id?: number | null;
  property_title?: string | null;
  description?: string;
  payment_method?: string;
  reference_no?: string;
  contact_name?: string;
  created_at?: string;
  updated_at?: string;
}

export const usePortfolioFinances = (storeId?: number) => {
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.getPortfolioTransactions(storeId);
      if (Array.isArray(res)) {
        setTransactions(res);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching portfolio transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const addTransaction = async (data: Omit<PortfolioTransaction, 'id' | 'store_id'>) => {
    try {
      const res = await api.addPortfolioTransaction({ ...data, store_id: storeId }, storeId);
      if (res && res.error) {
        throw new Error(res.error);
      }
      if (res && res.id) {
        setTransactions(prev => [res, ...prev.filter(t => t.id !== res.id)]);
      }
      await fetchTransactions();
      return res;
    } catch (error) {
      console.error('Error saving portfolio transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: number, data: Partial<PortfolioTransaction>) => {
    try {
      const res = await api.updatePortfolioTransaction(id, { ...data, store_id: storeId }, storeId);
      if (res && res.error) {
        throw new Error(res.error);
      }
      if (res && res.id) {
        setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...res } : t)));
      }
      await fetchTransactions();
      return res;
    } catch (error) {
      console.error('Error updating portfolio transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await api.deletePortfolioTransaction(id, storeId);
      if (res && res.error) {
        throw new Error(res.error);
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting portfolio transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
};


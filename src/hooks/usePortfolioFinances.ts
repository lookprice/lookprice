import { useState, useEffect } from 'react';
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
  created_at?: string;
}

export const usePortfolioFinances = (storeId?: number) => {
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.getPortfolioTransactions();
      setTransactions(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Error fetching portfolio transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (data: Omit<PortfolioTransaction, 'id' | 'store_id'>) => {
    try {
      const res = await api.addPortfolioTransaction({ ...data, store_id: storeId });
      if (res && res.error) {
        throw new Error(res.error);
      }
      await fetchTransactions();
      return res;
    } catch (error) {
      console.error('Error saving portfolio transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await api.deletePortfolioTransaction(id);
      await fetchTransactions();
    } catch (error) {
      console.error('Error deleting portfolio transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [storeId]);

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    deleteTransaction
  };
};

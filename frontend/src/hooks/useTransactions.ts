import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';

export function useTransactions(filters: {
  accountNumber: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filters.accountNumber) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    axios
      .get('/transactions', {
        params: {
          accountNumber: filters.accountNumber,
          status: filters.status,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page: 0,
          size: 50,
        },
      })
      .then((response) => {
        setTransactions(response.data.content || []);
        setError(null);
      })
      .catch(() => setError('Unable to load transactions'))
      .finally(() => setLoading(false));
  }, [filters.accountNumber, filters.status, filters.fromDate, filters.toDate]);

  return { transactions, loading, error };
}

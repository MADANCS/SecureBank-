import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';

export type TxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;

interface TxStatusResult {
  status: TxStatus;
  polling: boolean;
}

/**
 * Polls the /api/transactions/{id}/status endpoint every 1.5 seconds
 * until the transaction reaches a terminal state (COMPLETED / FAILED).
 */
export function useTransactionStatus(transactionId: string | number | null): TxStatusResult {
  const [status, setStatus] = useState<TxStatus>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!transactionId) return;

    setStatus('PENDING');
    setPolling(true);

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/transactions/${transactionId}/status`);
        const newStatus: TxStatus = res.data.status;
        setStatus(newStatus);

        // Stop polling once we hit a terminal state
        if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
          clearInterval(interval);
          setPolling(false);
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
        setStatus('FAILED');
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [transactionId]);

  return { status, polling };
}

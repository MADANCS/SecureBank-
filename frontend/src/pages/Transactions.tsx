import { useEffect, useState } from 'react';
import TransactionTable from '../components/TransactionTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import transactionService from '../api/transactionService';
import { Transaction } from '../types/index';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState('');

  const fetchTransactions = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.getTransactions(pageNum, pageSize);
      setTransactions(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(pageNum);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = async () => {
    try {
      setMessage('Generating statement...');
      const blob = await transactionService.exportTransactions('PDF');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bank-statement-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Statement downloaded successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to fetch statement';
      setMessage(`Error: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
        <p className="mt-2 text-slate-600">Review transfers with filters, export statements, and monitor payment activity.</p>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          className="rounded-2xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition font-medium"
          onClick={downloadStatement}
          disabled={loading}
        >
          Download PDF Statement
        </button>
        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}
      </div>

      {error ? (
        <ErrorState
          title="Failed to Load Transactions"
          message={error}
          onRetry={() => fetchTransactions(1)}
          icon="error"
        />
      ) : loading ? (
        <LoadingState />
      ) : transactions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-slate-600">No transactions found.</p>
        </div>
      ) : (
        <>
          <TransactionTable transactions={transactions} />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchTransactions(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchTransactions(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

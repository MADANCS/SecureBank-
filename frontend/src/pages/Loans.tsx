import { useEffect, useState } from 'react';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import loanService from '../api/loanService';
import { LoanApplication, LoanApplicationRequest, LoanSummary } from '../types/index';

export default function Loans() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [form, setForm] = useState<LoanApplicationRequest>({
    amount: 100000,
    loanType: 'PERSONAL',
    tenure: 12,
    description: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchLoans();
    fetchSummary();
  }, []);

  const fetchLoans = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await loanService.getLoanApplications(pageNum, 5);
      setApplications(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(pageNum);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to load loan applications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      // getLoanSummary may not be available; skip silently if not
      const data = await loanService.getLoanSummary();
      setSummary(data);
    } catch (err) {
      // Summary endpoint may not exist in this build — non-blocking
      console.warn('Loan summary not available:', err);
    }
  };

  const handleApplyForLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.amount <= 0 || form.tenure <= 0) {
      setError('Please enter valid amount and tenure');
      return;
    }

    try {
      setSubmitting(true);
      const response = await loanService.applyForLoan(form);
      const appId = (response as any).id ?? (response as any).loanApplicationId ?? 'submitted';
      setSuccess(`Loan application submitted! Application ID: ${appId}`);
      setForm({ amount: 100000, loanType: 'PERSONAL', tenure: 12, description: '' });
      setTimeout(() => {
        setSuccess('');
        fetchLoans(1);
        fetchSummary();
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to submit loan application';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Loan Applications</h2>
        <p className="mt-2 text-slate-600">Apply for a loan, track approval status, and manage EMI payments.</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <ErrorState
          title="Error"
          message={error}
          onRetry={() => setError('')}
          icon="error"
        />
      )}

      {success && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <div className="flex gap-4">
            <div className="text-2xl">✅</div>
            <p className="font-semibold text-green-900">{success}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Active Loans</p>
            <p className="mt-2 text-2xl font-bold">{summary.activeLoans}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Total Outstanding</p>
            <p className="mt-2 text-2xl font-bold">₹{summary.totalOutstanding.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Next EMI Date</p>
            <p className="mt-2 text-lg font-bold">{new Date(summary.nextEmiDate).toLocaleDateString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Next EMI Amount</p>
            <p className="mt-2 text-2xl font-bold">₹{summary.nextEmiAmount.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Apply for Loan Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Apply for Loan</h3>
          <form onSubmit={handleApplyForLoan} className="space-y-4">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Loan Type *</span>
              <select
                value={form.loanType}
                onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                disabled={submitting}
              >
                <option value="PERSONAL">Personal Loan</option>
                <option value="HOME">Home Loan</option>
                <option value="AUTO">Auto Loan</option>
                <option value="EDUCATIONAL">Educational Loan</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Loan Amount (₹) *</span>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="100000"
                step="10000"
                min="10000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                disabled={submitting}
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Tenure (months) *</span>
              <input
                type="number"
                value={form.tenure}
                onChange={(e) => setForm({ ...form, tenure: parseInt(e.target.value) || 0 })}
                placeholder="12"
                step="1"
                min="6"
                max="240"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                disabled={submitting}
                required
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-medium">Description (Optional)</span>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Purpose of the loan..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none resize-none"
                disabled={submitting}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 font-medium transition"
            >
              {submitting ? 'Applying...' : 'Apply for Loan'}
            </button>
          </form>
        </div>

        {/* Loan Applications List */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Your Loans</h3>
          {loading ? (
            <LoadingState />
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              No loan applications found. Apply for a loan to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((loan) => (
                <div key={loan.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{(loan as any).loanType} Loan</p>
                      <p className="text-sm text-slate-600">Application ID: {loan.id}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      loan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      loan.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Amount</p>
                      <p className="font-semibold">₹{Number((loan as any).principalAmount ?? loan.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Tenure</p>
                      <p className="font-semibold">{(loan as any).tenureMonths ?? loan.tenure} months</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <p className="text-slate-600">Rate</p>
                      <p className="font-semibold">{Number((loan as any).interestRate ?? loan.interestRate ?? 0).toFixed(2)}% p.a.</p>
                    </div>
                  </div>
                  {loan.status === 'ACTIVE' && (
                    <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600">EMI Amount</p>
                        <p className="font-semibold">₹{Number((loan as any).emiAmount ?? loan.emiAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Applied Date</p>
                        <p className="font-semibold">{(loan as any).createdAt ? new Date((loan as any).createdAt).toLocaleDateString('en-IN') : (loan.appliedDate ? new Date(loan.appliedDate).toLocaleDateString('en-IN') : '—')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchLoans(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchLoans(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import paymentService from '../api/paymentService';
import { Payment, RecurringPayment, PaymentRequest, RecurringPaymentRequest, Account } from '../types/index';
import { useQuery } from '@tanstack/react-query';
import accountService from '../api/accountService';

type PaymentTab = 'payments' | 'recurring';

export default function Payments() {
  const [activeTab, setActiveTab] = useState<PaymentTab>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state for one-time payment
  const [paymentForm, setPaymentForm] = useState<PaymentRequest & { fromAccount: string }>({
    fromAccount: '',
    toAccount: '', // Used as biller/payee reference
    amount: 0,
    method: 'NET_BANKING',
    description: '',
  });

  // Form state for recurring payment
  const [recurringForm, setRecurringForm] = useState<RecurringPaymentRequest & { fromAccount: string }>({
    fromAccount: '',
    toAccount: '',
    amount: 0,
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const { data: accounts = [] as Account[], isLoading: loadingAccounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  // Sync first account into both forms once loaded
  useEffect(() => {
    if (accounts.length > 0) {
      if (!paymentForm.fromAccount)   setPaymentForm(f => ({ ...f, fromAccount: accounts[0].accountNumber }));
      if (!recurringForm.fromAccount) setRecurringForm(f => ({ ...f, fromAccount: accounts[0].accountNumber }));
    }
  }, [accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPayments(page);
      setPayments(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getRecurringPayments();
      setRecurringPayments(response.content || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch recurring payments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const actualFromAccount = paymentForm.fromAccount || accounts[0]?.accountNumber;
      if (!actualFromAccount || !paymentForm.toAccount || paymentForm.amount <= 0) {
        setError('Please fill all required fields with valid values');
        setSubmitting(false);
        return;
      }

      await paymentService.createPayment({ ...paymentForm, fromAccount: actualFromAccount });
      setSuccess('Payment created successfully');
      setPaymentForm(f => ({
        ...f,
        toAccount: '',
        amount: 0,
        method: 'BILL_PAYMENT',
        description: '',
      }));
      fetchPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRecurringPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const actualFromAccount = recurringForm.fromAccount || accounts[0]?.accountNumber;
      if (!actualFromAccount || !recurringForm.toAccount || recurringForm.amount <= 0 || !recurringForm.startDate) {
        setError('Please fill all required fields with valid values');
        setSubmitting(false);
        return;
      }

      await paymentService.createRecurringPayment({ ...recurringForm, fromAccount: actualFromAccount });
      setSuccess('Recurring payment created successfully');
      setRecurringForm(f => ({
        ...f,
        toAccount: '',
        amount: 0,
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().slice(0, 10),
        description: '',
      }));
      fetchRecurringPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create recurring payment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRecurring = async (recurringId: string) => {
    try {
      setError(null);
      setSuccess(null);
      await paymentService.cancelRecurringPayment(recurringId);
      setSuccess('Recurring payment cancelled successfully');
      fetchRecurringPayments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel recurring payment';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Payments</h2>
        <p className="mt-2 text-slate-600">Make one-time payments or set up recurring payments for bills and transfers.</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <ErrorState
          title="Error"
          message={error}
          onRetry={() => setError(null)}
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

      {/* Tab Navigation */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-2">
        {(['payments', 'recurring'] as PaymentTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'payments') {
                fetchPayments();
              } else {
                fetchRecurringPayments();
              }
            }}
            className={
              `px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            {tab === 'payments' ? 'One-Time Payments' : 'Recurring Payments'}
          </button>
        ))}
      </div>

      {/* One-Time Payments Tab */}
      {activeTab === 'payments' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Payment Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Create Payment</h3>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">From Account *</span>
                <select
                  value={paymentForm.fromAccount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, fromAccount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={loadingAccounts || submitting}
                  required
                >
                  {accounts.length === 0 && <option value="">No accounts available</option>}
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.accountNumber}>
                      {a.accountNumber} (₹{Number(a.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Biller / Reference *</span>
                <input
                  type="text"
                  value={paymentForm.toAccount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, toAccount: e.target.value })
                  }
                  placeholder="Recipient account ID"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Amount (?) *</span>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="1000"
                  step="100"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Payment Method *</span>
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, method: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                >
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="WALLET">Wallet</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Description (Optional)</span>
                <textarea
                  value={paymentForm.description || ''}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, description: e.target.value })
                  }
                  placeholder="Payment purpose..."
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
                {submitting ? 'Processing...' : 'Create Payment'}
              </button>
            </form>
          </div>

          {/* Payment History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            {loading ? (
              <LoadingState />
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                No payments found. Create a payment to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{payment.method}</p>
                        <p className="text-sm text-slate-600">
                          {payment.payerAccount} → {payment.payeeAccount}
                        </p>
                      </div>
                      <span
                        className={
                          `text-xs px-3 py-1 rounded-full font-medium ${
                            payment.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`
                        }
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Amount</p>
                        <p className="font-semibold">₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Date</p>
                        <p className="font-semibold">{(payment as any).createdAt ? new Date((payment as any).createdAt).toLocaleDateString('en-IN') : '—'}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Reference</p>
                        <p className="font-semibold text-xs truncate">{(payment as any).reference ?? payment.method}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50 transition text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recurring Payments Tab */}
      {activeTab === 'recurring' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recurring Payment Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Set Up Recurring</h3>
            <form onSubmit={handleCreateRecurringPayment} className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">From Account *</span>
                <select
                  value={recurringForm.fromAccount}
                  onChange={(e) => setRecurringForm({ ...recurringForm, fromAccount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={loadingAccounts || submitting}
                  required
                >
                  {accounts.length === 0 && <option value="">No accounts available</option>}
                  {accounts.map((a: any) => (
                    <option key={a.id} value={a.accountNumber}>
                      {a.accountNumber} (₹{Number(a.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Biller / Reference *</span>
                <input
                  type="text"
                  value={recurringForm.toAccount}
                  onChange={(e) =>
                    setRecurringForm({ ...recurringForm, toAccount: e.target.value })
                  }
                  placeholder="Recipient account ID"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Amount (?) *</span>
                <input
                  type="number"
                  value={recurringForm.amount}
                  onChange={(e) =>
                    setRecurringForm({ ...recurringForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="1000"
                  step="100"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Frequency *</span>
                <select
                  value={recurringForm.frequency}
                  onChange={(e) =>
                    setRecurringForm({ ...recurringForm, frequency: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  disabled={submitting}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Description (Optional)</span>
                <textarea
                  value={recurringForm.description || ''}
                  onChange={(e) =>
                    setRecurringForm({ ...recurringForm, description: e.target.value })
                  }
                  placeholder="Payment purpose..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none resize-none"
                  disabled={submitting}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                {submitting ? 'Setting Up...' : 'Set Up Recurring'}
              </button>
            </form>
          </div>

          {/* Recurring Payments List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Active Recurring Payments</h3>
            {loading ? (
              <LoadingState />
            ) : recurringPayments.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                No recurring payments set up. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {recurringPayments.map((recurring) => (
                  <div
                    key={recurring.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{(recurring as any).billType ?? recurring.frequency} Schedule</p>
                        <p className="text-sm text-slate-600">
                          Ref: {(recurring as any).reference ?? (recurring as any).toAccount}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          recurring.status === 'ACTIVE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}

                      >
                        {recurring.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Amount</p>
                        <p className="font-semibold">₹{Number(recurring.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Frequency</p>
                        <p className="font-semibold">{recurring.frequency}</p>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-600">Next Due</p>
                        <p className="font-semibold">{(recurring as any).nextExecutionAt ? new Date((recurring as any).nextExecutionAt).toLocaleDateString('en-IN') : (recurring.nextDueDate ? new Date(recurring.nextDueDate).toLocaleDateString('en-IN') : '—')}</p>
                      </div>
                    </div>

                    {recurring.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancelRecurring(recurring.id)}
                        className="w-full mt-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                      >
                        Cancel Recurring
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

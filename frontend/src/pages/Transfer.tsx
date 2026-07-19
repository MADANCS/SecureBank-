import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OtpModal from '../components/OtpModal';
import TransactionPinModal from '../components/TransactionPinModal';
import RazorpayCheckout, { type RazorpayResponse } from '../components/RazorpayCheckout';
import { ErrorState } from '../components/ErrorState';
import transactionService from '../api/transactionService';
import accountService from '../api/accountService';
import instance from '../api/axiosInstance';
import { useTransactionStatus } from '../hooks/useTransactionStatus';
import { bulkUploadTransactions, downloadBulkTemplate } from '../api/newFeaturesService';
import type { Account } from '../types/index';

const CATEGORIES = ['FOOD', 'RENT', 'SALARY', 'EMI', 'UTILITIES', 'ENTERTAINMENT', 'HEALTHCARE', 'TRANSPORT', 'SHOPPING', 'OTHER'] as const;

// ─── Status Timeline ─────────────────────────────────────────────────────────
function StatusTimeline({ status }: { status: string | null }) {
  const steps = ['PENDING', 'PROCESSING', 'COMPLETED'];
  const isFailed = status === 'FAILED';
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">Transfer Progress</p>
      <div className="relative flex items-center justify-between">
        {steps.map((step, i) => {
          const isActive = status === step;
          const past = steps.indexOf(status ?? '') > i;
          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500
                ${isFailed ? 'border-red-300 bg-red-100 text-red-500'
                  : status === 'COMPLETED' ? 'border-green-500 bg-green-500 text-white'
                  : isActive ? 'border-blue-500 bg-blue-500 text-white animate-pulse'
                  : past ? 'border-blue-400 bg-blue-100 text-blue-600'
                  : 'border-slate-300 bg-white text-slate-400'}`}>
                {status === 'COMPLETED' ? '✓' : i + 1}
              </div>
              <p className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : past || status === 'COMPLETED' ? 'text-slate-700' : 'text-slate-400'}`}>{step}</p>
              {i < steps.length - 1 && (
                <div className={`absolute top-5 h-0.5 w-[calc(33%-2.5rem)]
                  ${past || status === 'COMPLETED' ? 'bg-blue-500' : 'bg-slate-200'}`}
                  style={{ left: `${i === 0 ? 'calc(16.5% + 1.25rem)' : 'calc(50% + 1.25rem)'}` }} />
              )}
            </div>
          );
        })}
      </div>
      {isFailed && <p className="mt-4 text-center text-sm font-medium text-red-600">❌ Transfer failed. Funds have not been debited.</p>}
    </div>
  );
}

// ─── Razorpay Order state ─────────────────────────────────────────────────────
interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface TransferForm {
  fromAccount: string;
  toAccount: string;
  amount: string;
  description: string;
  category: string;
}

export default function Transfer() {
  const queryClient = useQueryClient();
  const username = localStorage.getItem('username') ?? 'User';

  const [form, setForm] = useState<TransferForm>({ fromAccount: '', toAccount: '', amount: '', description: '', category: 'OTHER' });
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | number | null>(null);
  const [razorpayUnavailable, setRazorpayUnavailable] = useState(false);

  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);
  const [paymentMode, setPaymentMode] = useState<'direct' | 'razorpay'>('razorpay');
  const [showPinModal, setShowPinModal] = useState(false);

  // Bulk Upload State
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Carries the verified PIN from the PIN modal to OTP completion for >=10k transfers
  const verifiedPinRef = useRef<string>('');

  const { data: accounts = [] as Account[], isLoading: loadingAccounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
  });

  // Sync first account into form once loaded
  useEffect(() => {
    if (accounts.length > 0 && !form.fromAccount) {
      setForm(f => ({ ...f, fromAccount: accounts[0].accountNumber }));
    }
  }, [accounts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const { status: txStatus, polling } = useTransactionStatus(pendingTxId);
  const isComplete = txStatus === 'COMPLETED';
  const isFailed = txStatus === 'FAILED';

  // ── Form validation ──────────────────────────────────────────────────────────
  const validate = (): { ok: boolean; amount: number; fromAccount: string } => {
    const fromAccount = form.fromAccount || accounts[0]?.accountNumber;
    if (!fromAccount || !form.toAccount || !form.amount) {
      setError('Please fill all required fields.');
      return { ok: false, amount: 0, fromAccount: '' };
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return { ok: false, amount: 0, fromAccount: '' };
    }
    return { ok: true, amount, fromAccount };
  };

  // ── SUBMIT: decide Razorpay vs direct ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingTxId(null);

    const { ok, amount, fromAccount } = validate();
    if (!ok) return;

    if (paymentMode === 'razorpay') {
      // Razorpay handles its own authentication — skip PIN/OTP for all amounts
      await openRazorpayCheckout(amount, fromAccount);
    } else {
      // Direct transfers always require Transaction PIN now
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = async (verifiedPin: string) => {
    setShowPinModal(false);
    verifiedPinRef.current = verifiedPin;
    const amount = parseFloat(form.amount);
    if (amount >= 10000) {
      // Direct transfers >= 10k require BOTH PIN and OTP
      setShowOtp(true);
    } else {
      await processDirectTransfer(undefined, undefined, verifiedPin);
    }
  };

  // ── Open Razorpay modal ──────────────────────────────────────────────────────
  const openRazorpayCheckout = async (amount: number, fromAccount: string) => {
    try {
      setSubmitting(true);
      setError('');
      const res = await instance.post('/razorpay/create-order', { amount });

      // Backend signals Razorpay is not configured — fall back to direct transfer
      if (res.data?.razorpay_unavailable) {
        setRazorpayUnavailable(true);
        setPaymentMode('direct');
        // Auto-execute the direct transfer seamlessly
        await processDirectTransfer(undefined, fromAccount);
        return;
      }

      setRazorpayOrder(res.data);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.razorpay_unavailable) {
        // 503 path: Razorpay keys not valid, switch to direct
        setRazorpayUnavailable(true);
        setPaymentMode('direct');
        await processDirectTransfer(undefined, fromAccount);
      } else {
        setError(data?.reason ?? data?.error ?? 'Failed to create payment order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Called when Razorpay checkout succeeds ────────────────────────────────────
  const handleRazorpaySuccess = async (response: RazorpayResponse) => {
    setRazorpayOrder(null);
    try {
      setSubmitting(true);
      const fromAccount = form.fromAccount || accounts[0]?.accountNumber;
      const res = await instance.post('/razorpay/verify-and-transfer', {
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        fromAccount,
        toAccount: form.toAccount,
        amount:    parseFloat(form.amount),
      });
      setPendingTxId(res.data.transactionId);
      setIdempotencyKey(crypto.randomUUID());
      setForm(f => ({ ...f, toAccount: '', amount: '', description: '', category: 'OTHER' }));
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['accounts'] }), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Payment was captured but transfer failed. Please contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Direct transfer (no Razorpay) ────────────────────────────────────────────
  const processDirectTransfer = async (otp?: string, fromAccountOverride?: string, transactionPin?: string) => {
    try {
      setSubmitting(true);
      const fromAccount = fromAccountOverride ?? form.fromAccount ?? accounts[0]?.accountNumber;
      if (!fromAccount) { setError('No source account available.'); return; }
      const response = await transactionService.createTransaction({
        fromAccount,
        toAccount: form.toAccount,
        amount: parseFloat(form.amount),
        description: form.description || form.category,
        idempotencyKey,
        ...(otp ? { otp } : {}),
        ...(transactionPin ? { transactionPin } : {}),
      });
      const txId = (response as any).id ?? (response as any).transactionId;
      setPendingTxId(txId);
      setIdempotencyKey(crypto.randomUUID());
      setForm(f => ({ ...f, toAccount: '', amount: '', description: '', category: 'OTHER' }));
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['accounts'] }), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async (otp: string) => {
    setShowOtp(false);
    await processDirectTransfer(otp, undefined, verifiedPinRef.current);
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile) return;
    setSubmitting(true);
    setBulkResult(null);
    setError('');
    try {
      const res = await bulkUploadTransactions(bulkFile);
      setBulkResult(res.data);
      setBulkFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Bulk upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Fund Transfer</h2>
            <p className="mt-1 text-slate-500">
              {paymentMode === 'razorpay'
                ? '💳 Payments are processed securely via Razorpay.'
                : '🔁 Direct bank-to-bank transfer.'}
            </p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('single')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}>Single</button>
              <button onClick={() => setActiveTab('bulk')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'bulk' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}>Bulk CSV</button>
            </div>
            {accounts[0] && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Available Balance</p>
                <p className="text-lg font-bold text-slate-900">₹{accounts[0].balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay unavailable info banner */}
      {razorpayUnavailable && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Razorpay not available in this environment</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Your transfer has been switched to <strong>Direct</strong> bank transfer mode automatically.
              To enable Razorpay, set valid <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_ID</code> and <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_SECRET</code> environment variables.
            </p>
          </div>
          <button onClick={() => setRazorpayUnavailable(false)} className="ml-auto text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Error */}
      {error && <ErrorState title="Transfer Error" message={error} onRetry={() => setError('')} icon="error" />}

      {/* Status Tracker */}
      {pendingTxId && (
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            {polling && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            <p className="font-semibold text-slate-800">
              {isComplete ? '✅ Transfer Successful!' : isFailed ? '❌ Transfer Failed' : '⏳ Processing Transfer...'}
            </p>
          </div>
          <p className="text-sm text-slate-500 mb-1">Transaction ID: <code className="bg-slate-100 px-1 rounded">{pendingTxId}</code></p>
          <StatusTimeline status={txStatus} />
          {(isComplete || isFailed) && (
            <button
              onClick={() => setPendingTxId(null)}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Make Another Transfer
            </button>
          )}
        </div>
      )}

      {/* Transfer Form or Bulk Upload */}
      {!pendingTxId && activeTab === 'single' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* Payment Mode Toggle */}
          <div className="mb-6 flex items-center gap-3">
            <p className="text-sm font-medium text-slate-600">Payment Mode:</p>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button type="button"
                onClick={() => setPaymentMode('razorpay')}
                className={`px-4 py-2 text-sm font-semibold transition ${paymentMode === 'razorpay' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                💳 Razorpay
              </button>
              <button type="button"
                onClick={() => setPaymentMode('direct')}
                className={`px-4 py-2 text-sm font-semibold transition ${paymentMode === 'direct' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                🔁 Direct
              </button>
            </div>
            {paymentMode === 'razorpay' && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ Secured by Razorpay
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* From Account */}
              <label className="space-y-1.5 text-sm text-slate-700">
                <span className="font-medium">From Account *</span>
                <select
                  value={form.fromAccount}
                  onChange={e => setForm({ ...form, fromAccount: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  disabled={loadingAccounts || submitting}
                  required
                >
                  {accounts.length === 0 && <option value="">No accounts available</option>}
                  {accounts.map((a: Account) => (
                    <option key={a.id} value={a.accountNumber}>
                      {a.accountNumber} — {a.accountType} (₹{Number(a.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </label>

              {/* To Account */}
              <label className="space-y-1.5 text-sm text-slate-700">
                <span className="font-medium">To Account *</span>
                <input
                  type="text"
                  value={form.toAccount}
                  onChange={e => setForm({ ...form, toAccount: e.target.value })}
                  placeholder="Enter recipient account number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  disabled={submitting}
                  required
                />
              </label>

              {/* Amount */}
              <label className="space-y-1.5 text-sm text-slate-700">
                <span className="font-medium">Amount (₹) *</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  disabled={submitting}
                  required
                />
                {parseFloat(form.amount) >= 10000 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span>⚠️</span> OTP verification required for amounts ≥ ₹10,000
                  </p>
                )}
              </label>

              {/* Category */}
              <label className="space-y-1.5 text-sm text-slate-700">
                <span className="font-medium">Category</span>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  disabled={submitting}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              {/* Description */}
              <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Description (Optional)</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Rent payment, Loan repayment"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-400 focus:outline-none disabled:opacity-50"
                  disabled={submitting}
                />
              </label>
            </div>

            <p className="text-xs text-slate-400">
              🔑 Idempotency Key: <code>{idempotencyKey.slice(0, 18)}…</code> — Safe to retry if network fails.
            </p>

            <button
              type="submit"
              disabled={loadingAccounts || submitting}
              className={`rounded-2xl px-8 py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed
                ${paymentMode === 'razorpay' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-700'}`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {paymentMode === 'razorpay' ? 'Opening Razorpay...' : 'Initiating...'}
                </span>
              ) : paymentMode === 'razorpay' ? '💳 Pay via Razorpay' : '🔁 Send Direct Transfer'}
            </button>
          </form>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {!pendingTxId && activeTab === 'bulk' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Bulk CSV Transfer</h3>
            <button onClick={downloadBulkTemplate} className="text-sm font-medium text-blue-600 hover:text-blue-700">📥 Download Template</button>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
            <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
          </div>
          <button onClick={handleBulkSubmit} disabled={!bulkFile || submitting} className="w-full rounded-2xl px-8 py-3 bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-50">
            {submitting ? 'Uploading...' : 'Process Bulk Transfer'}
          </button>

          {bulkResult && (
            <div className={`mt-4 p-4 rounded-xl border ${bulkResult.failed > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <h4 className="font-bold mb-2">Upload Results</h4>
              <p className="text-sm">Total: {bulkResult.total} | <span className="text-emerald-600 font-bold">Success: {bulkResult.succeeded}</span> | <span className="text-red-600 font-bold">Failed: {bulkResult.failed}</span></p>
              {bulkResult.errors?.length > 0 && (
                <ul className="mt-3 text-xs text-red-600 space-y-1 bg-white p-3 rounded border border-red-100 max-h-40 overflow-y-auto">
                  {bulkResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Razorpay Checkout (rendered when order is ready) */}
      {razorpayOrder && (
        <RazorpayCheckout
          orderId={razorpayOrder.orderId}
          amount={razorpayOrder.amount}
          currency={razorpayOrder.currency}
          keyId={razorpayOrder.keyId}
          description={form.description || `Transfer to ${form.toAccount}`}
          username={username}
          onSuccess={handleRazorpaySuccess}
          onDismiss={() => { setRazorpayOrder(null); setSubmitting(false); }}
        />
      )}

      <OtpModal
        visible={showOtp}
        onClose={() => setShowOtp(false)}
        onSubmit={submitOtp}
        amount={parseFloat(form.amount) || 0}
      />
      
      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        amount={parseFloat(form.amount) || 0}
      />
    </div>
  );
}

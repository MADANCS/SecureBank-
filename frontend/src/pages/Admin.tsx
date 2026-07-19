import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import instance from '../api/axiosInstance';
import { verifyKycDocument } from '../api/newFeaturesService';
import accountService from '../api/accountService';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  kycStatus: string;
  active: boolean;
  accounts?: string[];
}
interface LoanApp {
  id: string;
  accountNumber: string;
  applicantUsername?: string;
  username?: string;
  principalAmount?: number;
  amount?: number;
  loanType?: string;
  status: string;
}
interface KycDoc {
  id: string;
  userId: string;
  username?: string;
  documentType: string;
  verificationStatus?: string;
  status?: string;
  uploadedAt?: string;
}
type AdminTab = 'accounts' | 'provision' | 'closures' | 'loans' | 'kyc';

interface ProvisionResult {
  accountNumber: string;
  accountType: string;
  username: string;
  email: string;
  balance: number;
  initialDeposit: number;
  transactionRef: string | null;
  provisionedAt: string;
}

interface ClosureReq {
  id: number;
  accountNumber: string;
  requestedBy: string;
  reason: string;
  status: string;
  requestedAt: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    VERIFIED: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
    DISBURSED: 'bg-blue-100 text-blue-700',
  };
  const cls = colors[value] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${ok ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {ok ? '✓ ' : '✗ '}{msg}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState<AdminTab>('accounts');
  const qc = useQueryClient();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // Form state
  const [createUser, setCreateUser] = useState('');
  const [createType, setCreateType] = useState('SAVINGS');
  const [depAcc, setDepAcc] = useState('');
  const [depAmt, setDepAmt] = useState('');
  const [busy, setBusy] = useState(false);

  // Provision state
  const [provUser, setProvUser] = useState('');
  const [provType, setProvType] = useState('SAVINGS');
  const [provDeposit, setProvDeposit] = useState('');
  const [provBusy, setProvBusy] = useState(false);
  const [provResult, setProvResult] = useState<ProvisionResult | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await instance.get('/admin/users');
      return res.data ?? [];
    },
    retry: 1,
  });

  const { data: loans = [], isLoading: loansLoading } = useQuery<LoanApp[]>({
    queryKey: ['adminLoans'],
    queryFn: async () => {
      const res = await instance.get('/loans/admin');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: tab === 'loans',
    retry: 1,
  });

  const { data: kycDocs = [], isLoading: kycLoading } = useQuery<KycDoc[]>({
    queryKey: ['kycPending'],
    queryFn: async () => {
      const res = await instance.get('/v1/kyc/pending');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: tab === 'kyc',
    retry: 1,
  });

  const { data: closureReqs = [], isLoading: closuresLoading } = useQuery<ClosureReq[]>({
    queryKey: ['closureReqs'],
    queryFn: async () => {
      const res = await instance.get('/v1/account-closure/pending');
      // The API returns a pageable object with 'content' array
      return res.data?.content ?? [];
    },
    enabled: tab === 'closures',
    retry: 1,
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleProvision = async () => {
    if (!provUser) return notify('Select a user', false);
    setProvBusy(true);
    try {
      const result = await accountService.adminProvisionAccount(provUser, provType, Number(provDeposit) || 0);
      setProvResult(result as ProvisionResult);
      setProvUser('');
      setProvDeposit('');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      notify(`Account ${result.accountNumber} provisioned for ${result.username}`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? e?.message ?? 'Provision failed', false);
    } finally { setProvBusy(false); }
  };

  const handleCreateAccount = async () => {
    if (!createUser) return notify('Select a user first', false);
    setBusy(true);
    try {
      await accountService.adminCreateAccount(createUser, createType);
      setCreateUser('');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      notify(`${createType} account created for ${createUser}`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? e?.message ?? 'Failed to create account', false);
    } finally { setBusy(false); }
  };

  const handleDeposit = async () => {
    if (!depAcc.trim() || !depAmt || Number(depAmt) <= 0)
      return notify('Select an account and enter a valid amount', false);
    setBusy(true);
    try {
      const res = await accountService.adminDepositFunds(depAcc.trim(), Number(depAmt));
      setDepAcc('');
      setDepAmt('');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      notify(`₹${depAmt} deposited. New balance: ₹${(res as any)?.balance ?? '?'}`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? e?.message ?? 'Deposit failed', false);
    } finally { setBusy(false); }
  };

  const handleLoan = async (id: string, action: 'approve' | 'reject') => {
    try {
      await instance.post(`/loans/admin/${id}/${action}`);
      qc.invalidateQueries({ queryKey: ['adminLoans'] });
      notify(`Loan ${action}d`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? `Failed to ${action} loan`, false);
    }
  };

  const handleKyc = async (id: string, approved: boolean) => {
    try {
      await verifyKycDocument(Number(id), approved);
      qc.invalidateQueries({ queryKey: ['kycPending'] });
      notify(`KYC ${approved ? 'approved' : 'rejected'}`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? 'KYC action failed', false);
    }
  };

  const handleClosure = async (id: number, approve: boolean) => {
    try {
      await instance.post(`/v1/account-closure/${id}/review`, { approve, note: 'Reviewed by admin' });
      qc.invalidateQueries({ queryKey: ['closureReqs'] });
      notify(`Closure request ${approve ? 'approved' : 'rejected'}`);
    } catch (e: any) {
      notify(e?.response?.data?.message ?? 'Failed to process closure request', false);
    }
  };

  // Non-admin users that have at least one account
  const depositableAccounts = users
    .filter(u => u.role !== 'ROLE_ADMIN' && u.accounts && u.accounts.length > 0)
    .flatMap(u => (u.accounts ?? []).map(acc => ({ label: `${u.username} · ${acc}`, value: acc })));

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'accounts',  label: 'Accounts',  icon: '🏦' },
    { id: 'provision', label: 'Provision', icon: '⚡' },
    { id: 'closures',  label: 'Closures',  icon: '🚫' },
    { id: 'loans',     label: 'Loans',     icon: '📋' },
    { id: 'kyc',       label: 'KYC',       icon: '🔍' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-sm text-slate-500 mt-1">Manage accounts, loans and KYC</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── ACCOUNTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Create Account */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-xl">🏦</div>
                <div>
                  <h2 className="font-semibold text-slate-900">Create Account</h2>
                  <p className="text-xs text-slate-500">Open a new bank account for a user</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">User</label>
                  <select
                    value={createUser}
                    onChange={e => setCreateUser(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Choose user —</option>
                    {users.filter(u => u.role !== 'ROLE_ADMIN').map(u => (
                      <option key={u.id} value={u.username}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Account Type</label>
                  <select
                    value={createType}
                    onChange={e => setCreateType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SAVINGS">Savings</option>
                    <option value="CURRENT">Current</option>
                    <option value="FIXED">Fixed Deposit</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={busy || !createUser}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {busy ? 'Creating…' : '+ Create Account'}
              </button>
            </div>

            {/* Deposit Money */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-xl">💰</div>
                <div>
                  <h2 className="font-semibold text-slate-900">Deposit Money</h2>
                  <p className="text-xs text-slate-500">Credit funds directly to a user's account</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Select Account</label>
                  <select
                    value={depAcc}
                    onChange={e => setDepAcc(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Pick an account —</option>
                    {depositableAccounts.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {depAcc && (
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    {depAcc}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={depAmt}
                    onChange={e => setDepAmt(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleDeposit}
                disabled={busy || !depAcc || !depAmt || Number(depAmt) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {busy ? 'Processing…' : 'Deposit Funds'}
              </button>
            </div>
          </div>

          {/* Users & Accounts table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">All Users & Accounts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Overview of all registered users and their accounts</p>
            </div>
            {usersLoading ? (
              <div className="p-10 flex justify-center">
                <span className="h-7 w-7 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Username', 'Email', 'Role', 'KYC', 'Status', 'Accounts'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 font-medium text-slate-900">{user.username}</td>
                        <td className="px-5 py-3 text-slate-500">{user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.role === 'ADMIN' || user.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3"><Badge value={user.kycStatus} /></td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold ${user.active ? 'text-green-600' : 'text-red-500'}`}>
                            {user.active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">
                          {user.accounts && user.accounts.length > 0
                            ? user.accounts.map(acc => (
                              <div key={acc} className="flex items-center gap-2 group">
                                <span>{acc}</span>
                                <button
                                  onClick={() => { setDepAcc(acc); setTab('accounts'); notify(`Selected ${acc}`, true); }}
                                  className="opacity-0 group-hover:opacity-100 text-emerald-600 text-xs underline transition-opacity"
                                  title="Use for deposit"
                                >use</button>
                              </div>
                            ))
                            : <span className="text-slate-400 italic">No accounts</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROVISION TAB ──────────────────────────────────────────────────────── */}
      {tab === 'provision' && (
        <div className="space-y-6">
          {/* Receipt modal */}
          {provResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5 text-white">
                  <div className="text-3xl mb-2">✅</div>
                  <h2 className="text-lg font-bold">Account Provisioned!</h2>
                  <p className="text-emerald-100 text-sm mt-0.5">Account created and funded successfully</p>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    ['Account Number', provResult.accountNumber],
                    ['Account Type',   provResult.accountType],
                    ['Owner',          `${provResult.username} (${provResult.email})`],
                    ['Opening Balance', `₹${Number(provResult.balance).toLocaleString('en-IN')}`],
                    ['Initial Deposit', `₹${Number(provResult.initialDeposit).toLocaleString('en-IN')}`],
                    ['Txn Reference',  provResult.transactionRef ?? 'N/A'],
                    ['Provisioned At', new Date(provResult.provisionedAt).toLocaleString('en-IN')],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className="text-slate-900 font-semibold font-mono text-right max-w-[55%] break-all">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setProvResult(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
                  >Close</button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(provResult.accountNumber); notify('Copied!'); }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                  >📋 Copy Account No.</button>
                </div>
              </div>
            </div>
          )}

          {/* Main provision card */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-6 py-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                  <div>
                    <h2 className="text-lg font-bold">Quick Provision</h2>
                    <p className="text-violet-200 text-sm">Create account + fund in one step</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* User */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">
                    👤 Select User
                  </label>
                  <select
                    value={provUser}
                    onChange={e => setProvUser(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:outline-none transition-colors"
                  >
                    <option value="">— Choose a customer —</option>
                    {users.filter(u => u.role !== 'ROLE_ADMIN').map(u => (
                      <option key={u.id} value={u.username}>
                        {u.username} · {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">
                    🏦 Account Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: 'SAVINGS', label: 'Savings', icon: '💰', color: 'emerald' },
                      { val: 'CURRENT', label: 'Current', icon: '🔄', color: 'blue' },
                      { val: 'FIXED',   label: 'Fixed FD', icon: '🔒', color: 'amber' },
                    ].map(({ val, label, icon, color }) => (
                      <button
                        key={val}
                        onClick={() => setProvType(val)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          provType === val
                            ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Initial Deposit */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">
                    💵 Initial Deposit (₹) <span className="text-slate-400 normal-case font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={provDeposit}
                      onChange={e => setProvDeposit(e.target.value)}
                      className="w-full border-2 border-slate-200 focus:border-violet-500 rounded-xl pl-8 pr-4 py-3 text-sm bg-slate-50 focus:outline-none transition-colors"
                    />
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex gap-2 mt-2">
                    {[1000, 5000, 10000, 50000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setProvDeposit(String(amt))}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 font-medium transition-colors"
                      >
                        ₹{(amt/1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary preview */}
                {provUser && (
                  <div className="bg-gradient-to-br from-slate-50 to-violet-50 border border-violet-100 rounded-2xl p-4 text-sm space-y-1.5">
                    <p className="font-semibold text-slate-700 mb-2">📋 Preview</p>
                    <div className="flex justify-between text-slate-600">
                      <span>User</span>
                      <span className="font-semibold text-slate-900">{provUser}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Account Type</span>
                      <span className="font-semibold text-slate-900">{provType}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Opening Balance</span>
                      <span className="font-semibold text-emerald-700">
                        ₹{Number(provDeposit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleProvision}
                  disabled={provBusy || !provUser}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  {provBusy
                    ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>Provisioning…</span>
                    : '⚡ Provision Account'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLOSURES TAB ──────────────────────────────────────────────────────── */}
      {tab === 'closures' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Account Closure Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">Review and approve requests to close accounts</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              {closureReqs.length} Pending
            </span>
          </div>
          {closuresLoading ? (
            <div className="p-12 flex justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            </div>
          ) : closureReqs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3">🚫</div>
              <p className="font-medium">No closure requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {closureReqs.map(req => (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">User</p>
                      <p className="text-sm font-medium text-slate-800">{req.requestedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Account</p>
                      <p className="font-mono text-xs text-slate-700">{req.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Reason</p>
                      <p className="text-sm text-slate-700 truncate" title={req.reason}>{req.reason || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                      <Badge value={req.status} />
                    </div>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleClosure(req.id, true)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                      >Approve Closure</button>
                      <button
                        onClick={() => handleClosure(req.id, false)}
                        className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold transition-colors"
                      >Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LOANS TAB ────────────────────────────────────────────────────────── */}
      {tab === 'loans' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Loan Applications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Approve or reject pending applications</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              {loans.filter(l => l.status === 'PENDING').length} Pending
            </span>
          </div>
          {loansLoading ? (
            <div className="p-12 flex justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            </div>
          ) : loans.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium">No loan applications found</p>
              <p className="text-xs mt-1">Applications will appear here when users apply for loans</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {loans.map(loan => (
                <div key={loan.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Applicant</p>
                      <p className="text-sm font-medium text-slate-800">{loan.applicantUsername ?? loan.username ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Account</p>
                      <p className="font-mono text-xs text-slate-700">{loan.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Amount</p>
                      <p className="text-sm font-semibold text-slate-800">₹{(loan.principalAmount ?? loan.amount ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Type</p>
                      <p className="text-sm text-slate-700">{loan.loanType ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                      <Badge value={loan.status} />
                    </div>
                  </div>
                  {loan.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleLoan(loan.id, 'approve')}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                      >Approve</button>
                      <button
                        onClick={() => handleLoan(loan.id, 'reject')}
                        className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                      >Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── KYC TAB ──────────────────────────────────────────────────────────── */}
      {tab === 'kyc' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">KYC Verifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Review and verify user identity documents</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              {kycDocs.filter(d => (d.verificationStatus ?? d.status) === 'PENDING').length} Pending
            </span>
          </div>
          {kycLoading ? (
            <div className="p-12 flex justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
            </div>
          ) : kycDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No KYC documents pending</p>
              <p className="text-xs mt-1">Documents will appear here when users submit them</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kycDocs.map(doc => {
                const status = doc.verificationStatus ?? doc.status ?? 'PENDING';
                return (
                  <div key={doc.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">User</p>
                        <p className="text-sm font-medium text-slate-800">{doc.username ?? doc.userId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Document</p>
                        <p className="text-sm text-slate-700">{doc.documentType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                        <Badge value={status} />
                      </div>
                    </div>
                    {status === 'PENDING' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleKyc(doc.id, true)}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                        >Approve</button>
                        <button
                          onClick={() => handleKyc(doc.id, false)}
                          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                        >Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

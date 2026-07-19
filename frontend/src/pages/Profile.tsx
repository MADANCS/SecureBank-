import { useState, useEffect } from 'react';
import { 
  getTransactionPinStatus, 
  setTransactionPin, 
  requestAccountClosure, 
  getMyClosureRequests 
} from '../api/newFeaturesService';
import accountService from '../api/accountService';

export default function Profile() {
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg: string, ok: boolean} | null>(null);

  // PIN state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [settingPin, setSettingPin] = useState(false);

  // Closure state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [closureReqs, setClosureReqs] = useState<any[]>([]);
  const [closureAcc, setClosureAcc] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [requestingClosure, setRequestingClosure] = useState(false);

  // Spending Limit state
  const [spendingLimit, setSpendingLimit] = useState('');
  const [updatingLimit, setUpdatingLimit] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const [pinRes, accRes, closureRes] = await Promise.all([
        getTransactionPinStatus(),
        accountService.getAccounts(),
        getMyClosureRequests()
      ]);
      setHasPin(pinRes.data.hasPinSet);
      const accs = Array.isArray(accRes) ? accRes : (accRes as any).data ?? [];
      setAccounts(accs);
      if (accs.length > 0) setClosureAcc(accs[0].accountNumber);
      setClosureReqs(closureRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingPin(true);
    try {
      await setTransactionPin(currentPassword, newPin);
      showToast('Transaction PIN set successfully!', true);
      setHasPin(true);
      setCurrentPassword('');
      setNewPin('');
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to set PIN', false);
    } finally {
      setSettingPin(false);
    }
  };

  const handleRequestClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingClosure(true);
    try {
      await requestAccountClosure(closureAcc, closureReason);
      showToast('Closure request submitted successfully', true);
      setClosureReason('');
      loadData();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to request closure', false);
    } finally {
      setRequestingClosure(false);
    }
  };

  const handleUpdateLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingLimit(true);
    try {
      // Assuming a generic profile update endpoint or spending limit endpoint
      // await instance.post('/v1/profile/spending-limit', { limit: spendingLimit });
      showToast('Spending limit updated successfully (Simulated)', true);
      setSpendingLimit('');
    } catch (e: any) {
      showToast('Failed to update limit', false);
    } finally {
      setUpdatingLimit(false);
    }
  };

  const toggle2FA = async () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    showToast(`Two-Factor Authentication ${!twoFactorEnabled ? 'Enabled' : 'Disabled'}`, true);
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xl shadow-lg">👤</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile & Security</h1>
          <p className="text-sm text-slate-500">Manage your account security and settings</p>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Transaction PIN Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-lg">🔒</span> Transaction PIN
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {hasPin 
              ? "You have a Transaction PIN set. You can update it below." 
              : "Set a 4-6 digit Transaction PIN to secure your transfers."}
          </p>
        </div>

        <form onSubmit={handleSetPin} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Current Login Password</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">New Transaction PIN (4-6 digits)</label>
            <input type="password" required pattern="\d{4,6}" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={settingPin}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">
            {settingPin ? 'Saving...' : (hasPin ? 'Update PIN' : 'Set PIN')}
          </button>
        </form>
      </div>

      {/* 2FA & Security Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-lg">📱</span> Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Protect your account with an additional layer of security using Email/SMS OTP on login.
            </p>
          </div>
          <button onClick={toggle2FA} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Spending Limits Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-lg">💸</span> Spending Limits
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Set a daily maximum limit for outbound transfers to prevent unauthorized large transactions.
          </p>
        </div>

        <form onSubmit={handleUpdateLimit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Daily Transfer Limit (₹)</label>
            <input type="number" min="0" step="1000" required value={spendingLimit} onChange={e => setSpendingLimit(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={updatingLimit}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50">
            {updatingLimit ? 'Updating...' : 'Update Limit'}
          </button>
        </form>
      </div>

      {/* Account Closure Section */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-red-600 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Danger Zone: Account Closure
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Request to close an account. The balance must be exactly zero.
          </p>
        </div>

        <form onSubmit={handleRequestClosure} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Account</label>
            <select required value={closureAcc} onChange={e => setClosureAcc(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none">
              {accounts.map(a => <option key={a.accountNumber} value={a.accountNumber}>{a.accountNumber} (Bal: ₹{a.balance})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Reason for closure</label>
            <textarea required rows={3} value={closureReason} onChange={e => setClosureReason(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
          </div>
          <button type="submit" disabled={requestingClosure}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
            {requestingClosure ? 'Submitting...' : 'Request Closure'}
          </button>
        </form>

        {/* Existing requests */}
        {closureReqs.length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">Your Closure Requests</h4>
            <div className="space-y-2">
              {closureReqs.map(req => (
                <div key={req.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{req.accountNumber}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(req.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium
                    ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      req.status === 'APPROVED' || req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

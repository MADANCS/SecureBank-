import { useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../api/newFeaturesService';
import { useEffect } from 'react';

interface Prefs {
  emailOnLogin: boolean;
  smsOnLogin: boolean;
  emailOnLargeTransaction: boolean;
  smsOnLargeTransaction: boolean;
  largeTransactionThreshold: number;
  lowBalanceAlert: boolean;
  lowBalanceThreshold: number;
  inAppNotifications: boolean;
  emailOnAccountFreeze: boolean;
}

const defaultPrefs: Prefs = {
  emailOnLogin: true, smsOnLogin: false,
  emailOnLargeTransaction: true, smsOnLargeTransaction: true,
  largeTransactionThreshold: 10000, lowBalanceAlert: true,
  lowBalanceThreshold: 1000, inAppNotifications: true,
  emailOnAccountFreeze: true,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getNotificationPreferences()
      .then(r => setPrefs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      setToast('Preferences saved!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to save. Please try again.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg">🔔</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notification Settings</h1>
          <p className="text-sm text-slate-500">Control how and when SecureBank alerts you</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${toast.includes('Failed') ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast}
        </div>
      )}

      {/* Login Alerts */}
      <Section title="🔐 Login Alerts" desc="Get notified every time someone signs into your account">
        <Toggle label="Email on every login" checked={prefs.emailOnLogin} onChange={() => toggle('emailOnLogin')} />
        <Toggle label="SMS on every login" checked={prefs.smsOnLogin} onChange={() => toggle('smsOnLogin')} />
      </Section>

      {/* Transaction Alerts */}
      <Section title="💸 Transaction Alerts" desc="Alerts for large outgoing transactions">
        <Toggle label="Email on large transactions" checked={prefs.emailOnLargeTransaction} onChange={() => toggle('emailOnLargeTransaction')} />
        <Toggle label="SMS on large transactions" checked={prefs.smsOnLargeTransaction} onChange={() => toggle('smsOnLargeTransaction')} />
        <div className="mt-3">
          <label className="text-sm font-medium text-slate-700">Large transaction threshold (₹)</label>
          <input
            type="number" min={100}
            value={prefs.largeTransactionThreshold}
            onChange={e => setPrefs(p => ({ ...p, largeTransactionThreshold: Number(e.target.value) }))}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </Section>

      {/* Low Balance */}
      <Section title="⚠️ Low Balance Alert" desc="Alert when your account balance drops below a threshold">
        <Toggle label="Enable low balance alert" checked={prefs.lowBalanceAlert} onChange={() => toggle('lowBalanceAlert')} />
        {prefs.lowBalanceAlert && (
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">Alert threshold (₹)</label>
            <input
              type="number" min={0}
              value={prefs.lowBalanceThreshold}
              onChange={e => setPrefs(p => ({ ...p, lowBalanceThreshold: Number(e.target.value) }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
      </Section>

      {/* In-App & Account */}
      <Section title="🛡️ Security & Account" desc="In-app and account freeze notifications">
        <Toggle label="In-app notifications (bell icon)" checked={prefs.inAppNotifications} onChange={() => toggle('inAppNotifications')} />
        <Toggle label="Email on account freeze / unfreeze" checked={prefs.emailOnAccountFreeze} onChange={() => toggle('emailOnAccountFreeze')} />
      </Section>

      {/* Save */}
      <button
        id="save-notification-prefs-btn"
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="mb-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1.5">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-violet-500' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

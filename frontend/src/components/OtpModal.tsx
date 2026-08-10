import { useState, useEffect } from 'react';
import instance from '../api/axiosInstance';

interface OtpModalProps {
  visible: boolean;
  onSubmit: (otp: string) => void;
  onClose: () => void;
  amount?: number;
}

export default function OtpModal({ visible, onSubmit, onClose, amount }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const sendOtpRequest = async () => {
    setSendingOtp(true);
    setMsg('');
    try {
      const res = await instance.post('/v1/2fa/send-otp?purpose=TRANSFER');
      if (res.data?.otp) {
        setDevOtp(res.data.otp);
      }
      setMsg(res.data?.message || 'OTP sent successfully!');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setOtp('');
      setDevOtp(null);
      sendOtpRequest();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    try {
      await onSubmit(otp);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Verify Transaction</h3>
          <p className="mt-1 text-sm text-slate-600">
            {amount ? `Enter OTP to confirm transfer of ₹${amount.toFixed(2)}` : 'A one-time password has been generated.'}
          </p>
        </div>

        {/* Development Helper Banner showing OTP */}
        {devOtp && (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-center">
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Development Mode OTP</p>
            <p className="text-2xl font-bold text-blue-600 tracking-widest my-1">{devOtp}</p>
            <p className="text-[11px] text-blue-600">Also published to your 🔔 Notifications feed</p>
          </div>
        )}

        {msg && !devOtp && (
          <p className="text-xs text-center text-slate-500">{msg}</p>
        )}

        <div className="space-y-2">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            maxLength={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-semibold tracking-widest focus:border-slate-400 focus:outline-none"
            disabled={loading}
            autoFocus
          />
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-slate-500">6-digit verification code</span>
            <button
              type="button"
              onClick={sendOtpRequest}
              disabled={sendingOtp}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {sendingOtp ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 text-sm font-medium"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-2xl bg-slate-900 px-5 py-2 text-white hover:bg-slate-800 transition disabled:opacity-50 text-sm font-medium"
            onClick={handleSubmit}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify & Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}


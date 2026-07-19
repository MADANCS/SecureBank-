import { useState } from 'react';

interface OtpModalProps {
  visible: boolean;
  onSubmit: (otp: string) => void;
  onClose: () => void;
  amount?: number;
}

export default function OtpModal({ visible, onSubmit, onClose, amount }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!otp.trim()) {
      return;
    }

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
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold">Verify Transaction</h3>
        <p className="mt-2 text-sm text-slate-600">
          {amount ? `Enter OTP to confirm transfer of ₹${amount.toFixed(2)}` : 'A one-time password was sent to your registered email/SMS.'}
        </p>
        
        <div className="mt-4 space-y-3">
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
          <p className="text-xs text-slate-500 text-center">
            Enter the 6-digit code sent to your registered contact
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 transition disabled:opacity-50 font-medium"
            onClick={handleSubmit}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}

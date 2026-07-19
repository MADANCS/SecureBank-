import { useState } from 'react';
import { verifyTransactionPin } from '../api/newFeaturesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  amount: number;
}

export default function TransactionPinModal({ isOpen, onClose, onSuccess, amount }: Props) {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      await verifyTransactionPin(pin);
      const verifiedPin = pin;
      setPin('');
      onSuccess(verifiedPin); // Pass pin to parent for forwarding to transfer API
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid PIN');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
            🔐
          </div>
          <h2 className="text-lg font-bold text-slate-900">Verify Transaction</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your Transaction PIN to authorize the transfer of <strong className="text-slate-700">₹{amount.toFixed(2)}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              pattern="\d{4,6}"
              maxLength={6}
              required
              autoFocus
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-[1em] font-mono text-xl rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={verifying}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || pin.length < 4}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { Transaction } from '../types/index';

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 font-semibold">
          <tr>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">From Account</th>
            <th className="px-4 py-3">To Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            // Backend uses createdAt, fallback to timestamp or date
            const dateStr = (tx as any).createdAt ?? tx.timestamp ?? tx.date;
            const date = dateStr ? new Date(dateStr) : null;
            const isValidDate = date && !isNaN(date.getTime());
            const description = tx.description || `Transfer: ${tx.fromAccount} → ${tx.toAccount}`;
            return (
              <tr key={tx.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {isValidDate ? date!.toLocaleDateString('en-IN') : '—'} <br />
                  <span className="text-xs text-slate-500">{isValidDate ? date!.toLocaleTimeString('en-IN') : ''}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">{description}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs">{tx.fromAccount}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono text-xs">{tx.toAccount}</td>
                <td className={`px-4 py-3 text-sm font-semibold text-right ${getTypeColor(tx.type ?? 'DEBIT')}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface AccountCardProps {
  accountNumber: string;
  accountType: string;
  balance: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'DORMANT';
}

export default function AccountCard({ 
  accountNumber, 
  accountType, 
  balance,
  status = 'ACTIVE'
}: AccountCardProps) {
  const statusColors = {
    ACTIVE: 'text-green-600 bg-green-50',
    INACTIVE: 'text-yellow-600 bg-yellow-50',
    DORMANT: 'text-red-600 bg-red-50',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{accountType}</div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-900">{accountNumber}</div>
      <div className="mt-4 text-slate-500">Available balance</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">₹ {balance.toFixed(2)}</div>
    </div>
  );
}

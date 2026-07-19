import { useQuery } from '@tanstack/react-query';
import accountService from '../api/accountService';
import transactionService from '../api/transactionService';
import instance from '../api/axiosInstance';

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#8b5cf6','#fb923c','#84cc16','#06b6d4','#a855f7'];

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p className="text-slate-400 text-sm text-center py-8">No spending data yet.</p>;

  let cumulative = 0;
  const radius = 80;
  const cx = 110; const cy = 110;
  const circumference = 2 * Math.PI * radius;

  const segments = entries.map(([label, value], i) => {
    const pct = value / total;
    const offset = circumference * (1 - cumulative);
    cumulative += pct;
    return { label, value, pct, offset, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="220" height="220" viewBox="0 0 220 220" className="flex-shrink-0">
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            cx={cx} cy={cy} r={radius}
            fill="transparent"
            stroke={seg.color}
            strokeWidth="36"
            strokeDasharray={`${seg.pct * circumference} ${circumference}`}
            strokeDashoffset={seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-700 text-sm font-bold" fontSize="13" fontWeight="700">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-900" fontSize="14" fontWeight="800">
          ₹{total.toLocaleString('en-IN')}
        </text>
      </svg>

      <div className="flex-1 space-y-2 w-full">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-slate-600 flex-1 truncate">{seg.label}</span>
            <span className="text-sm font-semibold text-slate-800">₹{seg.value.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 w-10 text-right">{(seg.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Balance Bar ──────────────────────────────────────────────────────────────
function BalanceBar({ balance, max }: { balance: number; max: number }) {
  const pct = max > 0 ? Math.min((balance / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
export default function Analytics() {
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
    refetchInterval: 15000,
  });

  const { data: spendingData, isLoading: loadingSpending } = useQuery({
    queryKey: ['spendingByCategory'],
    queryFn: async () => {
      const res = await instance.get('/transactions/spending-by-category');
      return res.data?.categories as Record<string, number>;
    },
    refetchInterval: 30000,
  });

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const maxBalance = Math.max(...accounts.map(a => a.balance), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Analytics & Insights</h2>
        <p className="mt-1 text-slate-500">Real-time spending breakdown and account performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: '🏦', color: 'from-blue-500 to-indigo-600' },
          { label: 'Accounts', value: accounts.length.toString(), icon: '💳', color: 'from-emerald-500 to-teal-600' },
          { label: 'Active Accounts', value: accounts.filter((a: any) => a.active !== false).length.toString(), icon: '✅', color: 'from-violet-500 to-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-3xl bg-gradient-to-br ${kpi.color} p-5 text-white shadow-lg`}>
            <p className="text-3xl mb-1">{kpi.icon}</p>
            <p className="text-3xl font-bold">{loadingAccounts ? '—' : kpi.value}</p>
            <p className="text-sm text-white/80 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Spending Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          {loadingSpending ? (
            <div className="flex justify-center py-12">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
            </div>
          ) : (
            <DonutChart data={spendingData ?? {}} />
          )}
        </div>

        {/* Account Balance Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Account Balances</h3>
          {loadingAccounts ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No accounts found.</p>
          ) : (
            <div className="space-y-5">
              {accounts.map(acc => (
                <div key={acc.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{acc.accountNumber}</p>
                      <p className="text-xs text-slate-500">{acc.accountType}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <BalanceBar balance={acc.balance} max={maxBalance} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

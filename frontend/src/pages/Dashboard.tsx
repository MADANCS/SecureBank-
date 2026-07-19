import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import AccountCard from '../components/AccountCard';
import NomineeManager from '../components/NomineeManager';
import NotificationPanel from '../components/NotificationPanel';
import { SkeletonCard } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import accountService from '../api/accountService';
import transactionService from '../api/transactionService';
import { useNotifications } from '../hooks/useNotifications';

const QUICK_ACTIONS = [
  { label: 'Transfer', icon: '↗', to: '/transfer', color: 'from-blue-500 to-indigo-600' },
  { label: 'Pay Bills', icon: '🧾', to: '/payments', color: 'from-emerald-500 to-teal-600' },
  { label: 'Loans', icon: '🏦', to: '/loans', color: 'from-violet-500 to-purple-600' },
  { label: 'Analytics', icon: '📊', to: '/analytics', color: 'from-amber-500 to-orange-500' },
];

export default function Dashboard() {
  const username = localStorage.getItem('username') ?? 'User';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const queryClient = useQueryClient();
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState('SAVINGS');
  const [showDeposit, setShowDeposit] = useState<{show: boolean, accountNum: string}>({show: false, accountNum: ''});
  const [depositAmount, setDepositAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateAccount = async () => {
    // Moved to Admin panel
  };

  const handleDeposit = async () => {
    // Moved to Admin panel
  };

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getAccounts(),
    refetchInterval: 10000,
  });

  const {
    data: transactions = [],
    isLoading: txLoading,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => transactionService.getRecentTransactions(5).catch(() => []),
    refetchInterval: 10000,
  });

  const { notifications, connected, error: notificationError } = useNotifications();

  const loading = accountsLoading || txLoading;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (accountsError) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Failed to Load Dashboard"
          message="Unable to fetch account data. Please try again."
          onRetry={() => { refetchAccounts(); refetchTx(); }}
          icon="error"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500 font-medium">{greeting},</p>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{username} 👋</h2>
            <p className="mt-1 text-slate-500 text-sm">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {!accountsLoading && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Portfolio</p>
              <p className="text-3xl font-bold text-slate-900">
                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400 mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={`rounded-2xl bg-gradient-to-br ${action.color} p-4 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-3`}
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="font-semibold text-sm">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Accounts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : accounts.length}</p>
          <p className="text-xs text-slate-400 mt-1">linked accounts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {loading ? '—' : `₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-xs text-slate-400 mt-1">across all accounts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Recent Transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : transactions.length}</p>
          <p className="text-xs text-slate-400 mt-1">last 5 transactions</p>
        </div>
      </div>

      {/* Accounts + Notifications */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Your Accounts</h3>
          </div>
          {accountsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonCard count={2} />
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-500">No accounts found. Please contact support.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 flex flex-col h-full">
                  <AccountCard
                    accountNumber={account.accountNumber}
                    accountType={account.accountType}
                    balance={account.balance}
                    status={account.active === false ? 'INACTIVE' : 'ACTIVE'}
                  />
                  <div className="mt-auto pt-4 flex gap-2 border-t border-slate-100">
                    <div className="flex-1">
                      <NomineeManager accountNumber={account.accountNumber} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <NotificationPanel notifications={notifications} connected={connected} error={notificationError} />
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View All →
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const dateStr = (tx as any).createdAt ?? tx.timestamp;
                const date = dateStr ? new Date(dateStr) : null;
                const isValid = date && !isNaN(date.getTime());
                const isCredit = tx.type === 'CREDIT';
                const isCompleted = tx.status === 'COMPLETED' || tx.status === 'SUCCESS';
                const isFailed = tx.status === 'FAILED';
                const description = tx.description || `${tx.fromAccount} → ${tx.toAccount}`;

                return (
                  <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
                    {/* Icon */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-lg
                      ${isCompleted ? (isCredit ? 'bg-green-100' : 'bg-blue-100') : 'bg-red-100'}`}>
                      {isFailed ? '✗' : isCredit ? '↙' : '↗'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isValid ? date!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {' · '}
                        <span className={`font-medium ${
                          isCompleted ? 'text-green-600' :
                          isFailed ? 'text-red-500' : 'text-yellow-600'
                        }`}>{tx.status}</span>
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '−'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}


    </div>
  );
}

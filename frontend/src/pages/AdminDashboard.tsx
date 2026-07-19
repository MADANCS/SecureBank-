import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [frozenAccounts, setFrozenAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, auditRes, frozenRes] = await Promise.all([
        axios.get('/api/v1/admin/dashboard/stats'),
        axios.get('/api/v1/admin/audit-logs?page=0&size=10'),
        axios.get('/api/v1/admin/accounts?frozen=true')
      ]);

      setStats(statsRes.data);
      setAuditLogs(auditRes.data.content || []);
      setFrozenAccounts(frozenRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} />
        <StatCard label="Total Transactions" value={stats?.totalTransactions || 0} />
        <StatCard label="Active Accounts" value={stats?.activeAccounts || 0} color="green" />
        <StatCard label="Frozen Accounts" value={stats?.frozenAccounts || 0} color="red" />
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Audit Logs</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">IP Address</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{log.username}</td>
                  <td className="px-4 py-2">{log.action}</td>
                  <td className="px-4 py-2">{log.ipAddress}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frozen Accounts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Frozen Accounts</h2>
        {frozenAccounts.length === 0 ? (
          <p className="text-gray-500">No frozen accounts</p>
        ) : (
          <div className="space-y-2">
            {frozenAccounts.map((acc: any) => (
              <div key={acc.id} className="flex justify-between items-center border-l-4 border-red-500 pl-4 py-2">
                <span>{acc.accountNumber}</span>
                <button
                  onClick={() => unfreezeAccount(acc.accountNumber)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Unfreeze
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: any; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

async function unfreezeAccount(accountNumber: string) {
  try {
    await axios.post(`/api/v1/admin/accounts/${accountNumber}/unfreeze`);
    alert('Account unfrozen successfully');
    window.location.reload();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to unfreeze account');
  }
}

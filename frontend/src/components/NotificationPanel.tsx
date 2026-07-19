import { Notification } from '../types/index';

interface NotificationPanelProps {
  notifications: Notification[];
  connected: boolean;
  error: string | null;
}

export default function NotificationPanel({ notifications, connected, error }: NotificationPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-slate-500">Real-time updates for transfers, payments, and approvals.</p>
        </div>
        <div className={`text-sm font-medium ${connected ? 'text-green-600' : 'text-yellow-600'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-yellow-50 p-3 text-sm text-yellow-800">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(notification.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">{notification.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

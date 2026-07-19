import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Payments from './pages/Payments';
import Loans from './pages/Loans';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Signin from './pages/Signin';
import Profile from './pages/Profile';
import KycUpload from './pages/KycUpload';
import NotificationSettings from './pages/NotificationSettings';
import { SessionTimeoutOverlay } from './components/SessionTimeoutOverlay';
import { useNotifications } from './hooks/useNotifications';
import React, { useState } from 'react';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md">{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('accessToken');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return children;
}

// Guard that redirects admin away from customer-only pages
function RequireCustomer({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');
  const location = useLocation();
  if (!token) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return children;
}

// Guard that redirects non-admin away from admin page
function RequireAdmin({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');
  const location = useLocation();
  if (!token) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (role !== 'ROLE_ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Layout (navbar + shell) ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/transfer', label: 'Transfer', icon: '↗' },
  { path: '/transactions', label: 'Transactions', icon: '📋' },
  { path: '/payments', label: 'Payments', icon: '💳' },
  { path: '/loans', label: 'Loans', icon: '🏦' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/kyc', label: 'KYC', icon: '🔍' },
  { path: '/settings', label: 'Settings', icon: '🔔' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/admin', label: 'Admin', icon: '⚙️' },
];

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') ?? '';
  const { notifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg">🏦</span>
            <span className="font-bold text-base text-slate-900 tracking-tight">SecureBank</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto flex-1 justify-center">
            {NAV_ITEMS.filter(({ path }) => {
              const role = localStorage.getItem('role');
              const isAdmin = role === 'ROLE_ADMIN';
              // Admin sees ONLY Dashboard and Admin panel
              if (isAdmin) return ['/dashboard', '/admin'].includes(path);
              // Normal users never see Admin
              return path !== '/admin';
            }).map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + Notifications + Logout */}
          <div className="flex items-center gap-3 flex-shrink-0 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map((n, i) => (
                          <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {username && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/50">
                <span className="text-xs font-medium text-slate-700 capitalize">{username}</span>
              </div>
            )}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </header>

      {/* Session timeout overlay */}
      <ErrorBoundary>
        <SessionTimeoutOverlay />
      </ErrorBoundary>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/signin" element={<Signin />} />

      {/* Protected routes — all wrapped in Layout */}
      <Route
        path="/dashboard"
        element={
          <RequireCustomer>
            <Layout>
              <Dashboard />
            </Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/transfer"
        element={
          <RequireCustomer>
            <Layout><Transfer /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/transactions"
        element={
          <RequireCustomer>
            <Layout><Transactions /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/payments"
        element={
          <RequireCustomer>
            <Layout><Payments /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/loans"
        element={
          <RequireCustomer>
            <Layout><Loans /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireCustomer>
            <Layout><Analytics /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Layout><Admin /></Layout>
          </RequireAdmin>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Layout><Profile /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/kyc"
        element={
          <RequireCustomer>
            <Layout><KycUpload /></Layout>
          </RequireCustomer>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Layout><NotificationSettings /></Layout>
          </RequireAuth>
        }
      />


      {/* Catch-all → redirect to dashboard (auth guard handles the rest) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

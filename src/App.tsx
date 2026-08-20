import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocalAppProvider } from './context/LocalAppProvider';
import { CloudAppProvider } from './context/CloudAppProvider';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import TransactionList from './pages/TransactionList';
import Analysis from './pages/Analysis';
import Budget from './pages/Budget';
import SavingsGoals from './pages/SavingsGoals';
import Shared from './pages/Shared';
import Settings from './pages/Settings';
import CategorySettings from './pages/settings/CategorySettings';
import PaymentMethodSettings from './pages/settings/PaymentMethodSettings';
import RecurringSettings from './pages/settings/RecurringSettings';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';
import AccountSettings from './pages/settings/AccountSettings';
import DataSettings from './pages/settings/DataSettings';
import More from './pages/More';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

function MainRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/savings" element={<SavingsGoals />} />
        <Route path="/shared" element={<Shared />} />
        <Route path="/more" element={<More />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/categories" element={<CategorySettings />} />
        <Route path="/settings/payment-methods" element={<PaymentMethodSettings />} />
        <Route path="/settings/recurring" element={<RecurringSettings />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/settings/account" element={<AccountSettings />} />
        <Route path="/settings/data" element={<DataSettings />} />
      </Route>
    </Routes>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)] text-sm">
      読み込み中…
    </div>
  );
}

function Gate() {
  const { enabled, loading, user, profile } = useAuth();

  if (!enabled) {
    // Firebase 未設定 = この端末だけで動くローカルモード（今まで通り）
    return (
      <LocalAppProvider>
        <MainRoutes />
      </LocalAppProvider>
    );
  }

  if (loading) return <LoadingScreen />;
  if (!user) return <Login />;
  if (!profile) return <LoadingScreen />;
  if (!profile.groupId) return <Onboarding />;

  return (
    <CloudAppProvider groupId={profile.groupId}>
      <MainRoutes />
    </CloudAppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Gate />
      </HashRouter>
    </AuthProvider>
  );
}

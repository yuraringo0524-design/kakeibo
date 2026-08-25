import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import RecurringRunner from './RecurringRunner';
import LocalDataImport from './LocalDataImport';
import UpdateChecker from './UpdateChecker';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

function SyncErrorBanner() {
  const { syncError, dismissSyncError } = useApp();
  if (!syncError) return null;
  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-start gap-2 bg-warn-500 text-white text-xs font-bold px-4 py-2.5"
    >
      <span className="flex-1">{syncError}</span>
      <button onClick={dismissSyncError} aria-label="閉じる" className="shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const hideNav = location.pathname === '/add';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex justify-center">
      <div className="w-full max-w-md min-h-screen relative flex flex-col">
        <RecurringRunner />
        <UpdateChecker />
        <SyncErrorBanner />
        <LocalDataImport />
        <main className={`flex-1 ${hideNav ? '' : 'pb-24'}`}>
          <Outlet />
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

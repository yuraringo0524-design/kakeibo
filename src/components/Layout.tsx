import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const hideNav = location.pathname === '/add';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex justify-center">
      <div className="w-full max-w-md min-h-screen relative flex flex-col">
        <main className={`flex-1 ${hideNav ? '' : 'pb-24'}`}>
          <Outlet />
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}

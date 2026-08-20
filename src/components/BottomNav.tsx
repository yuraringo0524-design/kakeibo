import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ListChecks, PlusCircle, PieChart, Menu } from 'lucide-react';

const items = [
  { to: '/', label: 'ホーム', icon: Home },
  { to: '/transactions', label: '明細', icon: ListChecks },
];
const itemsRight = [
  { to: '/analysis', label: '分析', icon: PieChart },
  { to: '/more', label: 'メニュー', icon: Menu },
];

export default function BottomNav() {
  const navigate = useNavigate();

  const linkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 tap-target rounded-2xl transition-colors ${
      isActive ? 'text-orange-500' : 'text-[var(--text-muted)]'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--nav-bg)] border-t border-[var(--border)] flex items-center px-2 pb-[env(safe-area-inset-bottom)] z-40"
      aria-label="主要ナビゲーション"
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end className={({ isActive }) => linkClass(isActive)}>
          <item.icon size={22} strokeWidth={2.2} />
          <span className="text-[10px] font-bold">{item.label}</span>
        </NavLink>
      ))}

      <div className="flex-1 flex justify-center">
        <button
          onClick={() => navigate('/add')}
          className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="収支を追加"
        >
          <PlusCircle size={30} strokeWidth={2} />
        </button>
      </div>

      {itemsRight.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive)}>
          <item.icon size={22} strokeWidth={2.2} />
          <span className="text-[10px] font-bold">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

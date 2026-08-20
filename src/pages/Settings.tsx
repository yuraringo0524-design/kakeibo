import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader, Card } from '../components/ui';
import {
  Tag,
  CreditCard,
  Repeat,
  Bell,
  UserCircle,
  Database,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';

const items = [
  { to: '/settings/categories', label: 'カテゴリ', desc: '追加・編集・並び替え・削除', icon: Tag },
  { to: '/settings/payment-methods', label: '支払い方法', desc: '残高・利用状況の確認と編集', icon: CreditCard },
  { to: '/settings/recurring', label: '定期取引', desc: '給与・家賃・サブスクなどの自動登録', icon: Repeat },
  { to: '/settings/notifications', label: '通知', desc: '予算到達時の通知しきい値', icon: Bell },
  { to: '/settings/account', label: 'アカウント', desc: 'プロフィール・ログイン', icon: UserCircle },
  { to: '/settings/data', label: 'データ入出力', desc: 'CSVエクスポート・インポート、削除', icon: Database },
];

export default function Settings() {
  const { darkMode, toggleDarkMode } = useApp();
  return (
    <div>
      <PageHeader title="設定" />
      <div className="px-4 pt-3 space-y-2">
        <Card className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/10 shrink-0">
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </span>
          <span className="flex-1 font-bold">ダークモード</span>
          <button
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={darkMode}
            className={`tap-target relative w-12 h-7 rounded-full transition-colors ${
              darkMode ? 'bg-orange-500' : 'bg-black/15 dark:bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </Card>

        {items.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/10 shrink-0">
                <item.icon size={20} className="text-orange-500" />
              </span>
              <span className="flex-1 min-w-0">
                <p className="font-bold">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{item.desc}</p>
              </span>
              <ChevronRight size={18} className="text-[var(--text-muted)] shrink-0" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

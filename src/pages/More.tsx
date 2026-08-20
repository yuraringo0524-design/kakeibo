import { Link } from 'react-router-dom';
import { PageHeader, Card } from '../components/ui';
import { Wallet2, PiggyBank, Users, Settings as SettingsIcon, ChevronRight } from 'lucide-react';

const items = [
  { to: '/budget', label: '予算', desc: '総予算・カテゴリ別予算の確認と編集', icon: Wallet2, color: '#FF8C42' },
  { to: '/savings', label: '貯金目標', desc: '目標の作成・進捗確認', icon: PiggyBank, color: '#4FC1E9' },
  { to: '/shared', label: '共有家計', desc: 'グループ・メンバー・招待の管理', icon: Users, color: '#5AC8E8' },
  { to: '/settings', label: '設定', desc: 'カテゴリ・支払い方法・通知・アカウント', icon: SettingsIcon, color: '#B7ADA3' },
];

export default function More() {
  return (
    <div>
      <PageHeader title="メニュー" />
      <div className="px-4 pt-3 space-y-3">
        {items.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card className="flex items-center gap-3">
              <span
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}22` }}
              >
                <item.icon size={22} color={item.color} />
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

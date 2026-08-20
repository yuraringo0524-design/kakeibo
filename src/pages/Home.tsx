import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, ProgressBar, Segmented } from '../components/ui';
import { formatYen, formatDateJp, displayName } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType } from '../utils/period';
import type { PeriodUnit } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Bell, ChevronRight, Moon, Sun, Users, User } from 'lucide-react';

const periodOptions: { value: PeriodUnit; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
];

export default function Home() {
  const {
    transactions,
    categories,
    budgets,
    users,
    group,
    viewMode,
    setViewMode,
    darkMode,
    toggleDarkMode,
  } = useApp();
  const [unit, setUnit] = useState<PeriodUnit>('month');

  const scopedTx = useMemo(
    () => (viewMode === 'all' ? transactions : transactions.filter((t) => t.userId === viewMode)),
    [transactions, viewMode]
  );

  const now = new Date();
  const range = getPeriodRange(unit, now, 0);
  const prevRange = getPeriodRange(unit, now, -1);
  const current = filterByRange(scopedTx, range);
  const previous = filterByRange(scopedTx, prevRange);

  const income = sumByType(current, 'income');
  const expense = sumByType(current, 'expense');
  const diff = income - expense;
  const prevExpense = sumByType(previous, 'expense');
  const expenseDiff = expense - prevExpense;

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budget = budgets.find((b) => b.month === monthKey);
  const monthRange = getPeriodRange('month', now, 0);
  const monthTx = filterByRange(scopedTx, monthRange);
  const monthExpense = sumByType(monthTx, 'expense');
  const budgetRatio = budget ? monthExpense / budget.totalBudget : 0;
  const budgetRemain = budget ? budget.totalBudget - monthExpense : 0;
  const budgetWarn = budgetRatio >= 0.8;
  const budgetOver = budget ? monthExpense > budget.totalBudget : false;

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    current
      .filter((t) => t.type === 'expense')
      .forEach((t) => map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount));
    return Array.from(map.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        category: categories.find((c) => c.id === categoryId),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [current, categories]);

  const recent = [...scopedTx].slice(0, 5);

  return (
    <div className="pb-4">
      <header className="px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] font-bold">{group.name}</p>
          <h1 className="text-xl font-extrabold">ホーム</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="tap-target flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
            aria-label="ダークモード切替"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/settings/notifications"
            className="tap-target flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
            aria-label="通知設定"
          >
            <Bell size={20} />
          </Link>
        </div>
      </header>

      <div className="px-4 mb-3">
        <Segmented
          options={[
            { value: 'all', label: '全体' },
            ...users.map((u) => ({ value: u.id, label: displayName(u.name) })),
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      <div className="px-4 mb-3">
        <Segmented options={periodOptions} value={unit} onChange={setUnit} />
      </div>

      <div className="px-4">
        <Card className="mb-4">
          <p className="text-xs font-bold text-[var(--text-muted)] mb-2">{range.label}の収支</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-blue-500 font-bold flex items-center gap-1">
                <User size={12} /> 収入
              </p>
              <p className="text-xl font-extrabold text-blue-500 tabular-nums">{formatYen(income)}</p>
            </div>
            <div>
              <p className="text-xs text-orange-500 font-bold">支出</p>
              <p className="text-xl font-extrabold text-orange-500 tabular-nums">{formatYen(expense)}</p>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-muted)]">差額</span>
            <span
              className={`text-lg font-extrabold tabular-nums ${diff >= 0 ? 'text-blue-500' : 'text-warn-500'}`}
            >
              {formatYen(diff)}
            </span>
          </div>
          {unit === 'month' && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              先月比 支出{' '}
              <span className={expenseDiff > 0 ? 'text-warn-500 font-bold' : 'text-blue-500 font-bold'}>
                {expenseDiff > 0 ? '+' : ''}
                {formatYen(expenseDiff)}
              </span>
            </p>
          )}
        </Card>

        <Link to="/budget" className="block mb-4">
          <Card className={budgetOver ? 'ring-2 ring-warn-500' : ''}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold flex items-center gap-1.5">
                {budgetWarn && <span aria-hidden>⚠️</span>}
                今月の予算
              </p>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </div>
            {budget ? (
              <>
                <ProgressBar ratio={budgetRatio} warn={budgetWarn} />
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-[var(--text-muted)]">
                    使用 {formatYen(monthExpense)} / {formatYen(budget.totalBudget)}
                  </span>
                  <span className={`font-bold ${budgetOver ? 'text-warn-500' : 'text-blue-500'}`}>
                    {budgetOver ? '予算超過 ' : '残り '}
                    {formatYen(Math.abs(budgetRemain))}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">予算が未設定です。タップして設定しましょう。</p>
            )}
          </Card>
        </Link>

        <SectionTitle
          action={
            <Link to="/analysis" className="text-xs font-bold text-orange-500 flex items-center">
              分析へ <ChevronRight size={14} />
            </Link>
          }
        >
          カテゴリ別支出
        </SectionTitle>
        <Card className="mb-4">
          {categoryTotals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">この期間の支出はありません</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="amount"
                      nameKey="categoryId"
                      innerRadius={32}
                      outerRadius={54}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryTotals.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.category?.color ?? '#ccc'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5">
                {categoryTotals.slice(0, 4).map((c) => (
                  <li key={c.categoryId} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: c.category?.color }}
                      />
                      <span className="truncate">
                        {c.category?.icon} {c.category?.name}
                      </span>
                    </span>
                    <span className="font-bold tabular-nums shrink-0 ml-2">{formatYen(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <SectionTitle
          action={
            <Link to="/transactions" className="text-xs font-bold text-orange-500 flex items-center">
              一覧へ <ChevronRight size={14} />
            </Link>
          }
        >
          最近の明細
        </SectionTitle>
        <Card className="mb-4 divide-y divide-[var(--border)] p-0">
          {recent.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center">まだ記録がありません</p>
          ) : (
            recent.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const user = users.find((u) => u.id === t.userId);
              return (
                <Link
                  key={t.id}
                  to={`/add?id=${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-black/5 dark:active:bg-white/5"
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ background: `${cat?.color}22` }}
                  >
                    {cat?.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{t.memo || cat?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatDateJp(t.date)} ・ {displayName(user?.name)}
                    </p>
                  </span>
                  <span
                    className={`font-bold tabular-nums shrink-0 ${
                      t.type === 'income' ? 'text-blue-500' : 'text-orange-500'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatYen(t.amount)}
                  </span>
                </Link>
              );
            })
          )}
        </Card>

        <Link
          to="/shared"
          className="flex items-center gap-2 justify-center text-sm font-bold text-[var(--text-muted)] py-2"
        >
          <Users size={16} /> 共有家計を管理する <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

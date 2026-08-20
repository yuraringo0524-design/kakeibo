import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, SectionTitle, Segmented, EmptyState } from '../components/ui';
import { formatYen, formatYenShort } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType } from '../utils/period';
import type { PeriodUnit } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

const periodOptions: { value: PeriodUnit; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
];

export default function Analysis() {
  const { transactions, categories } = useApp();
  const [unit, setUnit] = useState<PeriodUnit>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const now = new Date();

  const range = getPeriodRange(unit, now, 0);
  const prevRange = getPeriodRange(unit, now, -1);
  const current = filterByRange(transactions, range);
  const previous = filterByRange(transactions, prevRange);

  const income = sumByType(current, 'income');
  const expense = sumByType(current, 'expense');
  const prevExpense = sumByType(previous, 'expense');
  const expenseDiffAmount = expense - prevExpense;
  const expenseDiffPct = prevExpense > 0 ? (expenseDiffAmount / prevExpense) * 100 : 0;

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    current.filter((t) => t.type === 'expense').forEach((t) => map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount));
    return Array.from(map.entries())
      .map(([categoryId, amount]) => ({ categoryId, amount, category: categories.find((c) => c.id === categoryId) }))
      .sort((a, b) => b.amount - a.amount);
  }, [current, categories]);

  const insights = useMemo(() => {
    const prevMap = new Map<string, number>();
    previous.filter((t) => t.type === 'expense').forEach((t) => prevMap.set(t.categoryId, (prevMap.get(t.categoryId) ?? 0) + t.amount));
    return categoryTotals
      .map((c) => {
        const prevAmount = prevMap.get(c.categoryId) ?? 0;
        return { ...c, diff: c.amount - prevAmount };
      })
      .filter((c) => Math.abs(c.diff) >= 500)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);
  }, [categoryTotals, previous]);

  // bar chart: last several sub-periods
  const barData = useMemo(() => {
    const n = unit === 'day' ? 7 : unit === 'week' ? 6 : unit === 'month' ? 6 : 4;
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      const r = getPeriodRange(unit, now, -i);
      const txs = filterByRange(transactions, r);
      arr.push({
        label: shortLabel(unit, r.label),
        収入: sumByType(txs, 'income'),
        支出: sumByType(txs, 'expense'),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, transactions]);

  const drilldown = selectedCategory
    ? current.filter((t) => t.type === 'expense' && t.categoryId === selectedCategory)
    : [];

  return (
    <div>
      <PageHeader title="分析" />
      <div className="px-4 pt-3">
        <div className="mb-4">
          <Segmented options={periodOptions} value={unit} onChange={setUnit} />
        </div>

        <Card className="mb-4">
          <p className="text-xs font-bold text-[var(--text-muted)] mb-2">{range.label}</p>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-500 font-bold">収入 {formatYen(income)}</span>
            <span className="text-orange-500 font-bold">支出 {formatYen(expense)}</span>
          </div>
        </Card>

        {insights.length > 0 && (
          <Card className="mb-4 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20">
            <p className="text-xs font-bold text-orange-600 mb-2">気づき</p>
            <ul className="space-y-1.5">
              {insights.map((c) => (
                <li key={c.categoryId} className="text-sm flex items-center gap-1.5">
                  {c.diff > 0 ? (
                    <TrendingUp size={14} className="text-warn-500 shrink-0" />
                  ) : (
                    <TrendingDown size={14} className="text-blue-500 shrink-0" />
                  )}
                  <span>
                    {c.category?.name}が前の期間より
                    <span className={`font-bold ${c.diff > 0 ? 'text-warn-500' : 'text-blue-500'}`}>
                      {' '}
                      {formatYen(Math.abs(c.diff))}
                      {c.diff > 0 ? '増えています' : '減っています'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <SectionTitle>カテゴリ別支出（円グラフ）</SectionTitle>
        <Card className="mb-4">
          {categoryTotals.length === 0 ? (
            <EmptyState icon="📊" text="この期間の支出データがありません" />
          ) : (
            <>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="amount"
                      nameKey="categoryId"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={0}
                      onClick={(d: any) => setSelectedCategory(d.categoryId)}
                    >
                      {categoryTotals.map((entry) => (
                        <Cell
                          key={entry.categoryId}
                          fill={entry.category?.color ?? '#ccc'}
                          opacity={selectedCategory && selectedCategory !== entry.categoryId ? 0.35 : 1}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatYen(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 mt-1">
                {categoryTotals.map((c) => (
                  <li key={c.categoryId}>
                    <button
                      onClick={() => setSelectedCategory((s) => (s === c.categoryId ? null : c.categoryId))}
                      className={`w-full flex items-center justify-between text-sm rounded-xl px-2 py-1.5 ${
                        selectedCategory === c.categoryId ? 'bg-orange-50 dark:bg-orange-500/10' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.category?.color }} />
                        <span className="truncate">
                          {c.category?.icon} {c.category?.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[var(--text-muted)] text-xs">
                          {expense > 0 ? Math.round((c.amount / expense) * 100) : 0}%
                        </span>
                        <span className="font-bold tabular-nums">{formatYen(c.amount)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {selectedCategory && (
          <Card className="mb-4 p-0 divide-y divide-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-muted)] px-4 pt-3 pb-2">
              {categories.find((c) => c.id === selectedCategory)?.name} の明細（{drilldown.length}件）
            </p>
            {drilldown.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-[var(--text-muted)]">
                  {t.date} ・ {t.memo}
                </span>
                <span className="font-bold tabular-nums text-orange-500">{formatYen(t.amount)}</span>
              </div>
            ))}
          </Card>
        )}

        <SectionTitle>収入と支出の推移（棒グラフ）</SectionTitle>
        <Card className="mb-6">
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatYenShort(v)}
                  width={50}
                />
                <Tooltip formatter={(v: any) => formatYen(Number(v))} />
                <Bar dataKey="収入" fill="#4FC1E9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="支出" fill="#FF8C42" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            前の期間比 支出{' '}
            <span className={expenseDiffAmount > 0 ? 'text-warn-500 font-bold' : 'text-blue-500 font-bold'}>
              {expenseDiffAmount > 0 ? '+' : ''}
              {formatYen(expenseDiffAmount)} ({expenseDiffPct > 0 ? '+' : ''}
              {expenseDiffPct.toFixed(1)}%)
            </span>
          </p>
        </Card>
      </div>
    </div>
  );
}

function shortLabel(unit: PeriodUnit, label: string) {
  if (unit === 'month') return label.replace(/^\d+年/, '');
  if (unit === 'year') return label;
  if (unit === 'week') return label.split(' ')[0];
  return label;
}

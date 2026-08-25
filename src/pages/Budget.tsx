import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, SectionTitle, ProgressBar, inputClass } from '../components/ui';
import { formatYen, monthKeyOf } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType, scopeByViewMode } from '../utils/period';
import { Pencil, Check, AlertTriangle } from 'lucide-react';

export default function Budget() {
  const { budgets, categories, transactions, viewMode, setBudget, notificationSettings } = useApp();
  const now = new Date();
  // setMonth() を使うと 3/31 のような月末日でロールオーバーするため monthKeyOf を使う
  const monthKey = monthKeyOf(now, 0);
  const budget = budgets.find((b) => b.month === monthKey);

  const [editing, setEditing] = useState(false);
  const [totalInput, setTotalInput] = useState(String(budget?.totalBudget ?? 200000));
  const [catInputs, setCatInputs] = useState<Record<string, string>>(
    Object.fromEntries((budget?.categoryBudgets ?? []).map((c) => [c.categoryId, String(c.amount)]))
  );

  const range = getPeriodRange('month', now, 0);
  // ホームの「今月の予算」と同じ絞り込み（全体／個人）を適用して、画面ごとに数字が食い違わないようにする
  const scopedTx = useMemo(() => scopeByViewMode(transactions, viewMode), [transactions, viewMode]);
  const monthTx = useMemo(() => filterByRange(scopedTx, range), [scopedTx, range]);
  const monthExpense = sumByType(monthTx, 'expense');
  const totalBudget = budget?.totalBudget ?? 0;
  const remain = totalBudget - monthExpense;
  const ratio = totalBudget > 0 ? monthExpense / totalBudget : 0;
  const warnPct = notificationSettings.thresholds.length ? Math.min(...notificationSettings.thresholds) : 80;

  // 'both' 型のカテゴリも支出に使えるため、予算設定の対象から外さない
  const expenseCategories = categories
    .filter((c) => c.type === 'expense' || c.type === 'both')
    .sort((a, b) => a.order - b.order);

  const categoryUsage = useMemo(() => {
    return (budget?.categoryBudgets ?? []).map((cb) => {
      const used = monthTx
        .filter((t) => t.type === 'expense' && t.categoryId === cb.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const cat = categories.find((c) => c.id === cb.categoryId);
      return { ...cb, used, cat, ratio: cb.amount > 0 ? used / cb.amount : 0 };
    });
  }, [budget, monthTx, categories]);

  function startEdit() {
    setTotalInput(String(budget?.totalBudget ?? 200000));
    setCatInputs(Object.fromEntries((budget?.categoryBudgets ?? []).map((c) => [c.categoryId, String(c.amount)])));
    setEditing(true);
  }

  function toggleCategory(id: string) {
    setCatInputs((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = '0';
      return next;
    });
  }

  function save() {
    const categoryBudgets = Object.entries(catInputs)
      .filter(([, v]) => v !== '')
      .map(([categoryId, v]) => ({ categoryId, amount: Math.max(0, Number(v) || 0) }));
    setBudget(monthKey, Math.max(0, Number(totalInput) || 0), categoryBudgets);
    setEditing(false);
  }

  return (
    <div>
      <PageHeader
        title="予算"
        right={
          <button
            onClick={editing ? save : startEdit}
            className="tap-target px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center gap-1"
          >
            {editing ? (
              <>
                <Check size={16} /> 保存
              </>
            ) : (
              <>
                <Pencil size={14} /> 編集
              </>
            )}
          </button>
        }
      />

      <div className="px-4 pt-3 pb-8">
        <Card className={`mb-4 ${remain < 0 ? 'ring-2 ring-warn-500' : ''}`}>
          <p className="text-xs font-bold text-[var(--text-muted)] mb-2">{range.label}の総予算</p>
          {editing ? (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xl font-extrabold text-[var(--text-muted)]">¥</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className={`${inputClass} text-xl font-extrabold`}
              />
            </div>
          ) : (
            <p className="text-2xl font-extrabold tabular-nums mb-2">{formatYen(totalBudget)}</p>
          )}
          <ProgressBar ratio={ratio} warn={totalBudget > 0 && ratio * 100 >= warnPct} />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-[var(--text-muted)]">使用額 {formatYen(monthExpense)}</span>
            <span className={`font-bold ${remain < 0 ? 'text-warn-500' : 'text-blue-500'}`}>
              {remain < 0 ? '超過 ' : '残り '}
              {formatYen(Math.abs(remain))}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            消化率 {totalBudget > 0 ? `${(ratio * 100).toFixed(0)}%` : '—（総予算が未設定）'}
          </p>
          {totalBudget > 0 && remain < 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-warn-500 text-xs font-bold bg-warn-500/10 rounded-xl px-3 py-2">
              <AlertTriangle size={14} />
              予算を{formatYen(Math.abs(remain))}超過しています
            </div>
          )}
        </Card>

        <SectionTitle>カテゴリ別予算</SectionTitle>
        {editing ? (
          <Card className="mb-4 space-y-3">
            {expenseCategories.map((c) => {
              const checked = c.id in catInputs;
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(c.id)}
                    className={`tap-target shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm ${
                      checked ? 'bg-orange-500 border-orange-500 text-white' : 'border-[var(--border)]'
                    }`}
                    aria-pressed={checked}
                  >
                    {c.icon}
                  </button>
                  <span className="text-sm font-bold flex-1">{c.name}</span>
                  {checked && (
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={catInputs[c.id]}
                      onChange={(e) => setCatInputs((p) => ({ ...p, [c.id]: e.target.value }))}
                      className={`${inputClass} w-28 py-2 text-sm`}
                    />
                  )}
                </div>
              );
            })}
          </Card>
        ) : categoryUsage.length === 0 ? (
          <Card className="mb-4">
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              カテゴリ別予算は未設定です。「編集」から設定できます。
            </p>
          </Card>
        ) : (
          <div className="space-y-3 mb-4">
            {categoryUsage.map((c) => {
              const over = c.used > c.amount;
              const warn = c.amount > 0 && c.ratio * 100 >= warnPct;
              return (
                <Card key={c.categoryId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      {c.cat ? `${c.cat.icon} ${c.cat.name}` : '📦 削除されたカテゴリ'}
                      {warn && <span aria-hidden>⚠️</span>}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {c.amount > 0 ? `${(c.ratio * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                  <ProgressBar ratio={c.ratio} warn={warn} height={8} />
                  <div className="flex justify-between mt-1.5 text-xs">
                    <span className="text-[var(--text-muted)]">
                      {formatYen(c.used)} / {formatYen(c.amount)}
                    </span>
                    <span className={`font-bold ${over ? 'text-warn-500' : 'text-blue-500'}`}>
                      {over ? '超過 ' : '残り '}
                      {formatYen(Math.abs(c.amount - c.used))}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

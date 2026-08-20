import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, SectionTitle, ProgressBar, inputClass } from '../components/ui';
import { formatYen } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType } from '../utils/period';
import { Pencil, Check, AlertTriangle } from 'lucide-react';

function currentMonthKey(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Budget() {
  const { budgets, categories, transactions, setBudget } = useApp();
  const monthKey = currentMonthKey(0);
  const budget = budgets.find((b) => b.month === monthKey);

  const [editing, setEditing] = useState(false);
  const [totalInput, setTotalInput] = useState(String(budget?.totalBudget ?? 200000));
  const [catInputs, setCatInputs] = useState<Record<string, string>>(
    Object.fromEntries((budget?.categoryBudgets ?? []).map((c) => [c.categoryId, String(c.amount)]))
  );

  const now = new Date();
  const range = getPeriodRange('month', now, 0);
  const monthTx = filterByRange(transactions, range);
  const monthExpense = sumByType(monthTx, 'expense');
  const totalBudget = budget?.totalBudget ?? 0;
  const remain = totalBudget - monthExpense;
  const ratio = totalBudget > 0 ? monthExpense / totalBudget : 0;

  const expenseCategories = categories.filter((c) => c.type === 'expense');

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
      .map(([categoryId, v]) => ({ categoryId, amount: Number(v) || 0 }));
    setBudget(monthKey, Number(totalInput) || 0, categoryBudgets);
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
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className={`${inputClass} text-xl font-extrabold`}
              />
            </div>
          ) : (
            <p className="text-2xl font-extrabold tabular-nums mb-2">{formatYen(totalBudget)}</p>
          )}
          <ProgressBar ratio={ratio} warn={ratio >= 0.8} />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-[var(--text-muted)]">使用額 {formatYen(monthExpense)}</span>
            <span className={`font-bold ${remain < 0 ? 'text-warn-500' : 'text-blue-500'}`}>
              {remain < 0 ? '超過 ' : '残り '}
              {formatYen(Math.abs(remain))}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">消化率 {(ratio * 100).toFixed(0)}%</p>
          {remain < 0 && (
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
                  >
                    {c.icon}
                  </button>
                  <span className="text-sm font-bold flex-1">{c.name}</span>
                  {checked && (
                    <input
                      type="number"
                      inputMode="numeric"
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
              const warn = c.ratio >= 0.8;
              return (
                <Card key={c.categoryId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      {c.cat?.icon} {c.cat?.name}
                      {warn && <span aria-hidden>⚠️</span>}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{(c.ratio * 100).toFixed(0)}%</span>
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

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, EmptyState, inputClass } from '../components/ui';
import { formatYen, formatDateFull, displayName } from '../utils/format';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { TransactionType } from '../types';

export default function TransactionList() {
  const { transactions, categories, paymentMethods, users } = useApp();
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState<'all' | TransactionType>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [paymentMethodId, setPaymentMethodId] = useState('all');
  const [userId, setUserId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (type === 'all' ? true : t.type === type))
      .filter((t) => (categoryId === 'all' ? true : t.categoryId === categoryId))
      .filter((t) => (paymentMethodId === 'all' ? true : t.paymentMethodId === paymentMethodId))
      .filter((t) => (userId === 'all' ? true : t.userId === userId))
      .filter((t) => (dateFrom ? t.date >= dateFrom : true))
      .filter((t) => (dateTo ? t.date <= dateTo : true))
      .filter((t) => (amountMin ? t.amount >= Number(amountMin) : true))
      .filter((t) => (amountMax ? t.amount <= Number(amountMax) : true))
      .filter((t) => (keyword ? t.memo.toLowerCase().includes(keyword.toLowerCase()) : true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, type, categoryId, paymentMethodId, userId, dateFrom, dateTo, amountMin, amountMax, keyword]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const activeFilterCount = [
    type !== 'all',
    categoryId !== 'all',
    paymentMethodId !== 'all',
    userId !== 'all',
    !!dateFrom,
    !!dateTo,
    !!amountMin,
    !!amountMax,
  ].filter(Boolean).length;

  function resetFilters() {
    setType('all');
    setCategoryId('all');
    setPaymentMethodId('all');
    setUserId('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  }

  return (
    <div>
      <PageHeader title="明細一覧" />
      <div className="px-4 pt-3">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="メモで検索"
              className={`${inputClass} pl-10`}
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`tap-target relative w-12 flex items-center justify-center rounded-2xl border ${
              activeFilterCount ? 'border-orange-400 text-orange-500' : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
            aria-label="絞り込み"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <Card className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">絞り込み条件</p>
              <button onClick={resetFilters} className="text-xs text-orange-500 font-bold">
                条件をクリア
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={type} onChange={(e) => setType(e.target.value as any)} className={inputClass}>
                <option value="all">収入／支出</option>
                <option value="expense">支出のみ</option>
                <option value="income">収入のみ</option>
              </select>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="all">カテゴリ</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className={inputClass}
              >
                <option value="all">支払い方法</option>
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
                <option value="all">登録者</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {displayName(u.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] mb-1">期間</p>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
                <span className="text-[var(--text-muted)]">〜</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] mb-1">金額範囲</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="最小"
                  className={inputClass}
                />
                <span className="text-[var(--text-muted)]">〜</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="最大"
                  className={inputClass}
                />
              </div>
            </div>
          </Card>
        )}

        <p className="text-xs text-[var(--text-muted)] font-bold mb-2 px-1">{filtered.length}件の明細</p>

        {grouped.length === 0 ? (
          <EmptyState icon="🔍" text="条件に合う明細がありません" />
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, txs]) => {
              const dayIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const dayExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <p className="text-xs font-bold text-[var(--text-muted)]">{formatDateFull(date)}</p>
                    <p className="text-xs font-bold text-[var(--text-muted)]">
                      {dayIncome > 0 && <span className="text-blue-500">+{formatYen(dayIncome)} </span>}
                      {dayExpense > 0 && <span className="text-orange-500">-{formatYen(dayExpense)}</span>}
                    </p>
                  </div>
                  <Card className="p-0 divide-y divide-[var(--border)]">
                    {txs.map((t) => {
                      const cat = categories.find((c) => c.id === t.categoryId);
                      const user = users.find((u) => u.id === t.userId);
                      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId);
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
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              {cat?.name} ・ {pm?.name} ・ {displayName(user?.name)}
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
                    })}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

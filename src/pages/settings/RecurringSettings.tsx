import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader, Card, FormField, inputClass, ConfirmDialog, EmptyState, Segmented } from '../../components/ui';
import { formatYen, formatDateFull, todayStr, displayName } from '../../utils/format';
import { Plus, Trash2, X, Pencil } from 'lucide-react';
import type { RecurringTransaction, Frequency, TransactionType } from '../../types';

const freqLabel: Record<Frequency, string> = { weekly: '毎週', monthly: '毎月', yearly: '毎年' };

export default function RecurringSettings() {
  const { recurring, categories, paymentMethods, users, currentUserId, addRecurring, updateRecurring, deleteRecurring } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '');
  const [memo, setMemo] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [nextDate, setNextDate] = useState(todayStr());
  const [error, setError] = useState('');

  function openNew() {
    setEditTarget(null);
    setType('expense');
    setAmount('');
    setCategoryId(categories.find((c) => c.type === 'expense')?.id ?? '');
    setPaymentMethodId(paymentMethods[0]?.id ?? '');
    setMemo('');
    setFrequency('monthly');
    setNextDate(todayStr());
    setError('');
    setShowForm(true);
  }

  function openEdit(r: RecurringTransaction) {
    setEditTarget(r);
    setType(r.type);
    setAmount(String(r.amount));
    setCategoryId(r.categoryId);
    setPaymentMethodId(r.paymentMethodId);
    setMemo(r.memo);
    setFrequency(r.frequency);
    setNextDate(r.nextDate);
    setError('');
    setShowForm(true);
  }

  function save() {
    if (!amount || Number(amount) <= 0) return setError('金額を正しく入力してください');
    const payload = {
      type,
      amount: Number(amount),
      categoryId,
      paymentMethodId,
      userId: editTarget?.userId ?? currentUserId,
      memo,
      frequency,
      startDate: editTarget?.startDate ?? nextDate,
      nextDate,
      active: editTarget?.active ?? true,
    };
    if (editTarget) updateRecurring(editTarget.id, payload);
    else addRecurring(payload);
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        title="定期取引"
        right={
          <button onClick={openNew} className="tap-target px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center gap-1">
            <Plus size={16} /> 追加
          </button>
        }
      />
      <div className="px-4 pt-3 pb-8">
        {recurring.length === 0 ? (
          <EmptyState icon="🔁" text="定期取引がありません" />
        ) : (
          <div className="space-y-3">
            {recurring.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId);
              const pm = paymentMethods.find((p) => p.id === r.paymentMethodId);
              const user = users.find((u) => u.id === r.userId);
              return (
                <Card key={r.id}>
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${cat?.color}22` }}>
                      {cat?.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{r.memo || cat?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {freqLabel[r.frequency]} ・ {pm?.name} ・ {displayName(user?.name)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">次回予定 {formatDateFull(r.nextDate)}</p>
                    </div>
                    <span className={`font-bold tabular-nums shrink-0 ${r.type === 'income' ? 'text-blue-500' : 'text-orange-500'}`}>
                      {r.type === 'income' ? '+' : '-'}
                      {formatYen(r.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <button
                        onClick={() => updateRecurring(r.id, { active: !r.active })}
                        role="switch"
                        aria-checked={r.active}
                        className={`tap-target relative w-11 h-6 rounded-full transition-colors ${r.active ? 'bg-orange-500' : 'bg-black/15 dark:bg-white/20'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${r.active ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                      {r.active ? '自動登録オン' : '自動登録オフ'}
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)]" aria-label="編集">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="tap-target w-8 h-8 flex items-center justify-center text-warn-500" aria-label="削除">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md sm:max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editTarget ? '定期取引を編集' : '定期取引を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="tap-target" aria-label="閉じる">
                <X size={22} />
              </button>
            </div>
            <div className="mb-4">
              <Segmented
                options={[
                  { value: 'expense' as TransactionType, label: '支出' },
                  { value: 'income' as TransactionType, label: '収入' },
                ]}
                value={type}
                onChange={(v) => {
                  setType(v);
                  setCategoryId(categories.find((c) => c.type === v)?.id ?? '');
                }}
              />
            </div>
            <FormField label="金額" error={error}>
              <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="カテゴリ">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                {categories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </FormField>
            <FormField label="支払い方法">
              <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className={inputClass}>
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="繰り返し">
              <Segmented
                options={[
                  { value: 'weekly' as Frequency, label: '毎週' },
                  { value: 'monthly' as Frequency, label: '毎月' },
                  { value: 'yearly' as Frequency, label: '毎年' },
                ]}
                value={frequency}
                onChange={setFrequency}
              />
            </FormField>
            <FormField label="次回予定日">
              <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="メモ">
              <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputClass} />
            </FormField>
            <button onClick={save} className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 mt-2">
              {editTarget ? '更新する' : '追加する'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="この定期取引を削除しますか？"
        message="削除すると今後の自動登録が行われなくなります。"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteRecurring(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

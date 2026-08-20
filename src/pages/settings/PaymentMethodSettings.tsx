import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader, Card, FormField, inputClass, ConfirmDialog, EmptyState } from '../../components/ui';
import { formatYen, formatDateJp } from '../../utils/format';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { PaymentMethod, PaymentMethodType } from '../../types';

const typeLabel: Record<PaymentMethodType, string> = {
  cash: '現金',
  bank: '銀行口座',
  credit: 'クレジットカード',
  emoney: '電子マネー',
};
const typeIcon: Record<PaymentMethodType, string> = { cash: '💵', bank: '🏦', credit: '💳', emoney: '📲' };
const colors = ['#8A7B6C', '#4FC1E9', '#FF8C42', '#5AC8E8', '#F4A65E'];

export default function PaymentMethodSettings() {
  const { paymentMethods, transactions, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('cash');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState('');

  function openNew() {
    setEditTarget(null);
    setName('');
    setType('cash');
    setBalance('0');
    setColor(colors[0]);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: PaymentMethod) {
    setEditTarget(p);
    setName(p.name);
    setType(p.type);
    setBalance(String(p.balance));
    setColor(p.color);
    setError('');
    setShowForm(true);
  }

  function save() {
    if (!name.trim()) return setError('名称を入力してください');
    const payload = { name: name.trim(), type, icon: typeIcon[type], color, balance: Number(balance) || 0 };
    if (editTarget) updatePaymentMethod(editTarget.id, payload);
    else addPaymentMethod(payload);
    setShowForm(false);
  }

  const history = filterId ? transactions.filter((t) => t.paymentMethodId === filterId).slice(0, 30) : [];

  return (
    <div>
      <PageHeader
        title="支払い方法"
        right={
          <button
            onClick={openNew}
            className="tap-target px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center gap-1"
          >
            <Plus size={16} /> 追加
          </button>
        }
      />
      <div className="px-4 pt-3 pb-8 space-y-3">
        {paymentMethods.map((p) => {
          const used = p.type === 'credit' ? Math.abs(p.balance) : 0;
          return (
            <Card key={p.id}>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${p.color}22` }}>
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{typeLabel[p.type]}</p>
                </div>
                <button onClick={() => openEdit(p)} className="tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)]" aria-label="編集">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteTarget(p)} className="tap-target w-8 h-8 flex items-center justify-center text-warn-500" aria-label="削除">
                  <Trash2 size={15} />
                </button>
              </div>
              {p.type === 'credit' ? (
                <div className="mt-2">
                  <p className="text-xs text-[var(--text-muted)]">今月の利用額</p>
                  <p className="text-lg font-extrabold text-orange-500 tabular-nums">{formatYen(used)}</p>
                  {p.creditLimit && (
                    <p className="text-xs text-[var(--text-muted)]">利用可能額 {formatYen(p.creditLimit - used)}</p>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-[var(--text-muted)]">残高</p>
                  <p className="text-lg font-extrabold tabular-nums">{formatYen(p.balance)}</p>
                </div>
              )}
              <button
                onClick={() => setFilterId((id) => (id === p.id ? null : p.id))}
                className="text-xs font-bold text-orange-500 mt-2"
              >
                {filterId === p.id ? '明細を閉じる' : '利用履歴を見る'}
              </button>
            </Card>
          );
        })}

        {filterId && (
          <Card className="p-0 divide-y divide-[var(--border)]">
            <p className="text-xs font-bold text-[var(--text-muted)] px-4 pt-3 pb-2">
              {paymentMethods.find((p) => p.id === filterId)?.name} の利用履歴
            </p>
            {history.length === 0 ? (
              <EmptyState icon="🧾" text="利用履歴がありません" />
            ) : (
              history.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-[var(--text-muted)]">
                    {formatDateJp(t.date)} ・ {t.memo}
                  </span>
                  <span className={`font-bold tabular-nums ${t.type === 'income' ? 'text-blue-500' : 'text-orange-500'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatYen(t.amount)}
                  </span>
                </div>
              ))
            )}
          </Card>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md sm:max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editTarget ? '支払い方法を編集' : '支払い方法を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="tap-target" aria-label="閉じる">
                <X size={22} />
              </button>
            </div>
            <FormField label="名称" error={error}>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="種別">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(typeLabel) as PaymentMethodType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`tap-target rounded-2xl border py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 ${
                      type === t ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10' : 'border-[var(--border)]'
                    }`}
                  >
                    {typeIcon[t]} {typeLabel[t]}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label={type === 'credit' ? '今月の利用額（マイナス表記）' : '残高'}>
              <input type="number" inputMode="numeric" value={balance} onChange={(e) => setBalance(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="カラー">
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`tap-target w-9 h-9 rounded-full border-2 ${color === c ? 'border-[var(--text)]' : 'border-transparent'}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </FormField>
            <button onClick={save} className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 mt-2">
              {editTarget ? '更新する' : '追加する'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="この支払い方法を削除しますか？"
        message={`「${deleteTarget?.name}」を削除すると元に戻せません。`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deletePaymentMethod(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

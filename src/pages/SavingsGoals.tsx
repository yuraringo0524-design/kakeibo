import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, ProgressBar, EmptyState, FormField, inputClass, ConfirmDialog } from '../components/ui';
import { formatYen, formatDateFull } from '../utils/format';
import { Plus, Trash2, X } from 'lucide-react';
import type { SavingsGoal } from '../types';

const icons = ['🏖️', '📦', '🛟', '🚗', '🏠', '💍', '🎓', '👶', '💻', '✈️'];
const colors = ['#4FC1E9', '#FF8C42', '#5AC8E8', '#F4A65E', '#7FD3EE'];

export default function SavingsGoals() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(icons[0]);
  const [color, setColor] = useState(colors[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  function openNew() {
    setEditTarget(null);
    setName('');
    setIcon(icons[0]);
    setColor(colors[0]);
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setError('');
    setShowForm(true);
  }

  function openEdit(g: SavingsGoal) {
    setEditTarget(g);
    setName(g.name);
    setIcon(g.icon);
    setColor(g.color);
    setTargetAmount(String(g.targetAmount));
    setCurrentAmount(String(g.currentAmount));
    setDeadline(g.deadline);
    setError('');
    setShowForm(true);
  }

  function save() {
    if (!name.trim()) return setError('目標名を入力してください');
    if (!targetAmount || Number(targetAmount) <= 0) return setError('目標金額を正しく入力してください');
    if (!deadline) return setError('期限を選択してください');
    const payload = {
      name: name.trim(),
      icon,
      color,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline,
    };
    if (editTarget) updateSavingsGoal(editTarget.id, payload);
    else addSavingsGoal(payload);
    setShowForm(false);
  }

  return (
    <div>
      <PageHeader
        title="貯金目標"
        right={
          <button
            onClick={openNew}
            className="tap-target px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center gap-1"
          >
            <Plus size={16} /> 追加
          </button>
        }
      />

      <div className="px-4 pt-3 pb-8">
        {savingsGoals.length === 0 ? (
          <EmptyState icon="🎯" text="貯金目標を追加してみましょう" />
        ) : (
          <div className="space-y-3">
            {savingsGoals.map((g) => {
              const ratio = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;
              const remain = Math.max(0, g.targetAmount - g.currentAmount);
              return (
                <Card key={g.id} className="relative">
                  <button
                    onClick={() => openEdit(g)}
                    className="w-full text-left"
                    aria-label={`${g.name}を編集`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${g.color}22` }}
                      >
                        {g.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{g.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">期限 {formatDateFull(g.deadline)}</p>
                      </div>
                      <p className="text-lg font-extrabold" style={{ color: g.color }}>
                        {(ratio * 100).toFixed(0)}%
                      </p>
                    </div>
                    <ProgressBar ratio={ratio} color={g.color} />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="font-bold tabular-nums">
                        {formatYen(g.currentAmount)} <span className="text-[var(--text-muted)] font-normal">/ {formatYen(g.targetAmount)}</span>
                      </span>
                      <span className="text-[var(--text-muted)]">残り {formatYen(remain)}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(g)}
                    className="absolute top-3 right-3 tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)]"
                    aria-label="削除"
                  >
                    <Trash2 size={16} />
                  </button>
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
              <h3 className="font-bold text-lg">{editTarget ? '目標を編集' : '目標を追加'}</h3>
              <button onClick={() => setShowForm(false)} className="tap-target" aria-label="閉じる">
                <X size={22} />
              </button>
            </div>
            <FormField label="目標名">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例）沖縄旅行" className={inputClass} />
            </FormField>
            <FormField label="アイコン">
              <div className="grid grid-cols-5 gap-2">
                {icons.map((i) => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`tap-target rounded-xl border text-xl py-2 ${
                      icon === i ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10' : 'border-[var(--border)]'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
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
            <FormField label="目標金額">
              <input
                type="number"
                inputMode="numeric"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="300000"
                className={inputClass}
              />
            </FormField>
            <FormField label="現在の積立額">
              <input
                type="number"
                inputMode="numeric"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="期限" error={error}>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </FormField>
            <button onClick={save} className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 mt-2">
              {editTarget ? '更新する' : '追加する'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="この貯金目標を削除しますか？"
        message={`「${deleteTarget?.name}」を削除すると元に戻せません。`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteSavingsGoal(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader, Card, Segmented, FormField, inputClass, ConfirmDialog } from '../../components/ui';
import { Plus, GripVertical, Trash2, X, Pencil } from 'lucide-react';
import type { Category, TransactionType } from '../../types';

const icons = ['🍚', '🧴', '🏠', '💡', '📱', '🚃', '🏥', '🍻', '🎮', '📚', '🛡️', '🐷', '📦', '💰', '💻', '🎁', '🐾', '🌱', '🧸', '☕'];
const colors = ['#FF8C42', '#4FC1E9', '#5AC8E8', '#F4A65E', '#E8672A', '#7FD3EE', '#FFB067', '#3AA6C4'];

export default function CategorySettings() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useApp();
  const [tab, setTab] = useState<TransactionType>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(icons[0]);
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState('');

  const list = categories.filter((c) => c.type === tab).sort((a, b) => a.order - b.order);

  function openNew() {
    setEditTarget(null);
    setName('');
    setIcon(icons[0]);
    setColor(colors[0]);
    setError('');
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditTarget(c);
    setName(c.name);
    setIcon(c.icon);
    setColor(c.color);
    setError('');
    setShowForm(true);
  }

  function save() {
    if (!name.trim()) return setError('カテゴリ名を入力してください');
    if (editTarget) updateCategory(editTarget.id, { name: name.trim(), icon, color });
    else addCategory({ name: name.trim(), icon, color, type: tab });
    setShowForm(false);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = list.map((c) => c.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    reorderCategories(ids);
    setDragId(null);
  }

  return (
    <div>
      <PageHeader
        title="カテゴリ設定"
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
        <div className="mb-4">
          <Segmented
            options={[
              { value: 'expense' as TransactionType, label: '支出カテゴリ' },
              { value: 'income' as TransactionType, label: '収入カテゴリ' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        <Card className="p-0 divide-y divide-[var(--border)]">
          {list.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => setDragId(c.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(c.id)}
              className="flex items-center gap-2 px-4 py-3"
            >
              <GripVertical size={16} className="text-[var(--text-muted)] shrink-0 cursor-grab" />
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ background: `${c.color}22` }}
              >
                {c.icon}
              </span>
              <span className="flex-1 text-sm font-bold truncate">{c.name}</span>
              <button onClick={() => openEdit(c)} className="tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)]" aria-label="編集">
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="tap-target w-8 h-8 flex items-center justify-center text-warn-500"
                aria-label="削除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </Card>
        <p className="text-xs text-[var(--text-muted)] mt-2 px-1">項目を長押ししてドラッグすると並び替えできます。</p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md sm:max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editTarget ? 'カテゴリを編集' : 'カテゴリを追加'}</h3>
              <button onClick={() => setShowForm(false)} className="tap-target" aria-label="閉じる">
                <X size={22} />
              </button>
            </div>
            <FormField label="カテゴリ名" error={error}>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
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
              <div className="flex flex-wrap gap-2">
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
        title="このカテゴリを削除しますか？"
        message={`「${deleteTarget?.name}」を使用している明細はカテゴリ未設定のままになります。`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCategory(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

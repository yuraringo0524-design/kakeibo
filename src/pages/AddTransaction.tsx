import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader, Segmented, FormField, inputClass, ConfirmDialog } from '../components/ui';
import { todayStr, displayName, parseDateStr } from '../utils/format';
import { downscaleReceipt } from '../utils/image';
import type { TransactionType } from '../types';
import { Camera, Check, Trash2, X } from 'lucide-react';

export default function AddTransaction() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');
  const {
    categories,
    paymentMethods,
    users,
    currentUserId,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transactions,
  } = useApp();

  const existing = useMemo(
    () => (editId ? transactions.find((t) => t.id === editId) : undefined),
    [editId, transactions]
  );

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [paymentMethodId, setPaymentMethodId] = useState(existing?.paymentMethodId ?? paymentMethods[0]?.id ?? '');
  const [userId, setUserId] = useState(existing?.userId ?? currentUserId);
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [receiptImage, setReceiptImage] = useState<string | null>(existing?.receiptImage ?? null);
  const [attaching, setAttaching] = useState(false);
  const [attached, setAttached] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleCategories = categories
    .filter((c) => c.type === type || c.type === 'both')
    .sort((a, b) => a.order - b.order);

  // 種別を切り替えるとカテゴリが空になる。編集中でも先頭カテゴリを補完しないと、
  // 「カテゴリを選択してください」で保存できないまま詰まる。
  useEffect(() => {
    if (visibleCategories.length && !categoryId) {
      setCategoryId(visibleCategories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories.length]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じ写真を選び直せるようにする
    if (!file) return;

    setAttaching(true);
    setAttached(false);
    setImageWarning(null);

    // 撮影したままのサイズだと localStorage / Firestore の上限に当たって保存が失敗する
    const { dataUrl, warning } = await downscaleReceipt(file);
    if (warning) setImageWarning(warning);
    if (!dataUrl) {
      setAttaching(false);
      return;
    }
    setReceiptImage(dataUrl);
    // OCR は未実装。以前はここで Math.random() の金額を入れたうえで
    // 「OCRで金額・日付・メモを読み取りました」と表示しており、
    // 実在しない金額が家計簿に記録されうる状態だった。金額は自動入力しない。
    setDate((prev) => prev || todayStr());
    setAttaching(false);
    setAttached(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    const amt = Number(amount);
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) {
      e.amount = '金額を正しく入力してください';
    } else if (amt > 1_000_000_000) {
      e.amount = '金額が大きすぎます（10億円未満で入力してください）';
    } else if (!Number.isInteger(amt)) {
      e.amount = '金額は円単位（整数）で入力してください';
    }
    if (!date) e.date = '日付を選択してください';
    else if (!parseDateStr(date)) e.date = '日付の形式が正しくありません';
    if (!categoryId) e.category = 'カテゴリを選択してください';
    if (!paymentMethodId) e.paymentMethod = '支払い方法を選択してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    // 編集で開いたのに対象が見つからない（別端末で削除された等）まま新規登録しない
    if (editId && !existing) {
      setErrors({ amount: 'この明細は見つかりませんでした。削除された可能性があります。' });
      return;
    }
    if (!validate()) return;
    const payload = {
      type,
      amount: Number(amount),
      date,
      categoryId,
      paymentMethodId,
      userId,
      memo,
      receiptImage,
    };
    if (existing) {
      updateTransaction(existing.id, payload);
    } else {
      addTransaction(payload);
    }
    navigate(-1);
  }

  function handleDelete() {
    if (existing) deleteTransaction(existing.id);
    navigate(-1);
  }

  return (
    <div>
      <PageHeader
        title={existing ? '明細を編集' : '明細を追加'}
        right={
          <button
            onClick={() => navigate(-1)}
            className="tap-target flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
        }
      />

      <div className="px-4 pt-4 pb-32">
        <div className="mb-5">
          <Segmented
            options={[
              { value: 'expense' as TransactionType, label: '支出' },
              { value: 'income' as TransactionType, label: '収入' },
            ]}
            value={type}
            onChange={(v) => {
              setType(v);
              setCategoryId('');
            }}
          />
        </div>

        <FormField label="金額" error={errors.amount}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-[var(--text-muted)]">
              ¥
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`${inputClass} pl-9 text-2xl font-extrabold tabular-nums`}
            />
          </div>
        </FormField>

        <FormField label="日付" error={errors.date}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="カテゴリ" error={errors.category}>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`tap-target flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 border transition-colors ${
                  categoryId === c.id
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10'
                    : 'border-[var(--border)]'
                }`}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-[11px] font-bold truncate w-full text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="支払い方法" error={errors.paymentMethod}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {paymentMethods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPaymentMethodId(p.id)}
                className={`tap-target shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 border text-sm font-bold ${
                  paymentMethodId === p.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                <span>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="支払った人／登録者">
          <div className="flex gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setUserId(u.id)}
                className={`tap-target flex-1 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 border text-sm font-bold ${
                  userId === u.id ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10' : 'border-[var(--border)]'
                }`}
              >
                <span>{u.avatarEmoji}</span>
                {displayName(u.name)}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="メモ">
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例）スーパーで食材"
            className={inputClass}
          />
        </FormField>

        <FormField label="レシート">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          {receiptImage ? (
            <div className="relative">
              <img src={receiptImage} alt="レシート" className="w-full max-h-56 object-cover rounded-2xl" />
              <button
                onClick={() => {
                  setReceiptImage(null);
                  setAttached(false);
                  setImageWarning(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                aria-label="レシート画像を削除"
              >
                <X size={16} />
              </button>
              {attaching && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white text-sm font-bold">
                  画像を準備中…
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tap-target w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--border)] py-6 text-[var(--text-muted)]"
            >
              <Camera size={26} />
              <span className="text-sm font-bold">レシートを撮影・添付</span>
            </button>
          )}
          {imageWarning && (
            <p className="text-xs text-warn-500 font-bold mt-2">⚠ {imageWarning}</p>
          )}
          {attached && (
            <p className="text-xs text-blue-500 font-bold mt-2">
              ✓ レシート画像を添付しました。金額・メモはご自身で入力してください。
            </p>
          )}
        </FormField>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex gap-2">
        {existing && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="tap-target w-14 flex items-center justify-center rounded-2xl border border-warn-500 text-warn-500"
            aria-label="削除"
          >
            <Trash2 size={20} />
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="tap-target flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-orange-500 text-white font-bold py-3.5 active:scale-[0.99]"
        >
          <Check size={20} />
          {existing ? '更新する' : '登録する'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="この明細を削除しますか？"
        message="削除すると元に戻せません。よろしいですか？"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

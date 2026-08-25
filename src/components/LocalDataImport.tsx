import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Transaction } from '../types';
import { Upload, X } from 'lucide-react';

const LOCAL_KEY = 'kakeibo-app-state-v1';
const DONE_KEY = 'kakeibo-cloud-import-done';

interface LegacyState {
  transactions?: Transaction[];
  categories?: { id: string; name: string }[];
  paymentMethods?: { id: string; name: string }[];
}

function readLegacy(): LegacyState | null {
  try {
    if (localStorage.getItem(DONE_KEY) === '1') return null;
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyState;
    if (!Array.isArray(parsed.transactions) || parsed.transactions.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* 記録できなくても画面上は閉じる */
  }
}

/**
 * Firebase を有効にした瞬間、それまで localStorage に貯めた家計が画面から消え、
 * 移行手段が無かった。クラウドに切り替わったあと一度だけ、取り込むかどうかを尋ねる。
 */
export default function LocalDataImport() {
  const { mode, categories, paymentMethods, currentUserId, addTransaction } = useApp();
  const legacy = useMemo(() => (mode === 'cloud' ? readLegacy() : null), [mode]);
  const [hidden, setHidden] = useState(false);
  const [importing, setImporting] = useState(false);

  if (mode !== 'cloud' || !legacy || hidden) return null;
  // 取り込み先が揃うまでは出さない（カテゴリ未着だと全部が先頭カテゴリに寄る）
  if (categories.length === 0 || paymentMethods.length === 0) return null;

  const count = legacy.transactions?.length ?? 0;

  function handleImport() {
    setImporting(true);
    // ローカルの id はクラウドの id と一致しないことがあるため、名前で対応付けてから id に落とす
    const catName = new Map((legacy?.categories ?? []).map((c) => [c.id, c.name]));
    const pmName = new Map((legacy?.paymentMethods ?? []).map((p) => [p.id, p.name]));

    (legacy?.transactions ?? []).forEach((t) => {
      const cat =
        categories.find((c) => c.id === t.categoryId) ??
        categories.find((c) => c.name === catName.get(t.categoryId)) ??
        categories[0];
      const pm =
        paymentMethods.find((p) => p.id === t.paymentMethodId) ??
        paymentMethods.find((p) => p.name === pmName.get(t.paymentMethodId)) ??
        paymentMethods[0];
      addTransaction({
        type: t.type,
        amount: t.amount,
        date: t.date,
        categoryId: cat.id,
        paymentMethodId: pm.id,
        userId: currentUserId,
        memo: t.memo ?? '',
        // 画像は Firestore の 1 ドキュメント上限に当たるため引き継がない
        receiptImage: null,
      });
    });

    markDone();
    setHidden(true);
  }

  function handleDismiss() {
    markDone();
    setHidden(true);
  }

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-blue-300 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 p-4">
      <div className="flex items-start gap-2 mb-2">
        <Upload size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold">この端末に{count}件の明細が残っています</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            クラウド共有に切り替わる前に、この端末だけで記録していたデータです。今の家計グループに取り込めます。
            レシート画像は引き継がれません。
          </p>
        </div>
        <button onClick={handleDismiss} aria-label="閉じる" className="shrink-0 text-[var(--text-muted)]">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="tap-target flex-1 rounded-2xl border border-[var(--border)] text-sm font-bold py-2.5"
        >
          取り込まない
        </button>
        <button
          onClick={handleImport}
          disabled={importing}
          className="tap-target flex-1 rounded-2xl bg-blue-500 text-white text-sm font-bold py-2.5 disabled:opacity-60"
        >
          {importing ? '取り込み中…' : `${count}件を取り込む`}
        </button>
      </div>
    </div>
  );
}

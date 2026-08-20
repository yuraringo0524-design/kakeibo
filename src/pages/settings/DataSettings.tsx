import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader, Card, ConfirmDialog } from '../../components/ui';
import { Download, Upload, Trash2, RotateCcw, CircleSlash } from 'lucide-react';

export default function DataSettings() {
  const { transactions, categories, paymentMethods, users, addTransaction, resetDummyData, clearTransactions, mode } =
    useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function exportCsv() {
    const header = ['日付', '種別', '金額', 'カテゴリ', '支払い方法', '登録者', 'メモ'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name ?? '';
      const pm = paymentMethods.find((p) => p.id === t.paymentMethodId)?.name ?? '';
      const user = users.find((u) => u.id === t.userId)?.name ?? '';
      return [t.date, t.type === 'income' ? '収入' : '支出', String(t.amount), cat, pm, user, t.memo];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kakeibo_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const lines = text.split(/\r?\n/).filter(Boolean);
        let count = 0;
        lines.slice(1).forEach((line) => {
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, ''));
          const [date, typeLabel, amountStr, catName, pmName, userName, memo] = cols;
          if (!date || !amountStr) return;
          const category = categories.find((c) => c.name === catName);
          const pm = paymentMethods.find((p) => p.name === pmName);
          const user = users.find((u) => u.name === userName) ?? users[0];
          addTransaction({
            type: typeLabel === '収入' ? 'income' : 'expense',
            amount: Number(amountStr) || 0,
            date,
            categoryId: category?.id ?? categories[0].id,
            paymentMethodId: pm?.id ?? paymentMethods[0].id,
            userId: user.id,
            memo: memo ?? '',
            receiptImage: null,
          });
          count++;
        });
        setMessage(`${count}件の明細をインポートしました。`);
      } catch {
        setMessage('CSVの読み込みに失敗しました。形式をご確認ください。');
      }
      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  return (
    <div>
      <PageHeader title="データ入出力" />
      <div className="px-4 pt-3 pb-8">
        <Card className="mb-4">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <Download size={16} className="text-orange-500" /> CSVエクスポート
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">すべての収入・支出データをCSV形式で書き出します。</p>
          <button onClick={exportCsv} className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3">
            エクスポートする
          </button>
        </Card>

        <Card className="mb-4">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <Upload size={16} className="text-blue-500" /> CSVインポート
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">エクスポートしたCSVファイルから明細を取り込みます。</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
          <button
            onClick={() => fileRef.current?.click()}
            className="tap-target w-full rounded-2xl border border-blue-400 text-blue-600 font-bold py-3"
          >
            ファイルを選択する
          </button>
          {message && <p className="text-xs text-blue-500 font-bold mt-2">{message}</p>}
        </Card>

        <Card className="mb-4">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <CircleSlash size={16} className="text-orange-500" /> 収入・支出を0にする
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            登録済みの収入・支出の明細をすべて削除し、¥0から記録を始められるようにします。カテゴリ・予算・支払い方法・定期取引・貯金目標の設定は残ります。
          </p>
          <button
            onClick={() => setConfirmClear(true)}
            className="tap-target w-full rounded-2xl border border-orange-400 text-orange-600 font-bold py-3"
          >
            0にする
          </button>
        </Card>

        {mode === 'local' && (
          <Card className="mb-4">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <RotateCcw size={16} className="text-[var(--text-muted)]" /> ダミーデータにリセット
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3">お試し用のダミーデータに戻します。編集内容は失われます。</p>
            <button
              onClick={() => setConfirmReset(true)}
              className="tap-target w-full rounded-2xl border border-[var(--border)] font-bold py-3"
            >
              リセットする
            </button>
          </Card>
        )}

        {mode === 'local' && (
          <Card className="border-warn-500/40">
            <p className="font-bold mb-1 flex items-center gap-1.5 text-warn-500">
              <Trash2 size={16} /> すべてのデータを削除
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3">この端末に保存されているすべての家計データを削除します。</p>
            <button
              onClick={() => setConfirmDelete(true)}
              className="tap-target w-full rounded-2xl bg-warn-500 text-white font-bold py-3"
            >
              削除する
            </button>
          </Card>
        )}

        {mode === 'cloud' && (
          <p className="text-xs text-[var(--text-muted)] text-center px-2">
            クラウドモードではパートナーと共有中のデータを保護するため、一括削除機能はこの画面では行えません。ログアウトは「設定 &gt; アカウント」から行えます。
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="収入・支出を0にしますか？"
        message="登録済みの明細をすべて削除し、¥0の状態から記録を始めます。カテゴリや予算などの設定は残ります。"
        confirmLabel="0にする"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearTransactions();
          setConfirmClear(false);
          setMessage('収入・支出を0にしました。');
          setTimeout(() => setMessage(''), 2500);
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="ダミーデータにリセットしますか？"
        message="現在の編集内容はすべて失われ、最初のお試し用データに戻ります。"
        confirmLabel="リセットする"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDummyData();
          setConfirmReset(false);
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="すべてのデータを削除しますか？"
        message="この操作は元に戻せません。家計データがすべて削除されます。"
        confirmLabel="完全に削除する"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          localStorage.clear();
          location.reload();
        }}
      />
    </div>
  );
}

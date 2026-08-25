import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { planRecurring } from '../utils/recurring';

/**
 * 定期取引（家賃・給与・サブスク）の自動登録。
 * これまで設定画面に「自動登録オン」「次回予定」と表示されるだけで、
 * 明細を生成する処理がどこにも無かった。アプリ起動時に一度だけ、
 * nextDate が今日以前の分をまとめて消化し、nextDate を次回へ進める。
 */
export default function RecurringRunner() {
  const { recurring, addTransaction, updateRecurring } = useApp();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    // クラウドモードでは定期取引の到着前に走らせない
    if (recurring.length === 0) return;

    const { creates, advances } = planRecurring(recurring);
    if (creates.length === 0 && advances.length === 0) {
      ranRef.current = true;
      return;
    }

    ranRef.current = true;
    creates.forEach((t) => addTransaction(t));
    advances.forEach((a) => updateRecurring(a.id, { nextDate: a.nextDate }));
  }, [recurring, addTransaction, updateRecurring]);

  return null;
}

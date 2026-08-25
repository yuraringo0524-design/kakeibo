import type { Frequency, RecurringTransaction, Transaction } from '../types';
import { parseDateStr, toLocalDateStr, todayStr } from './format';

/** 一度の起動で追いつく最大回数。壊れたデータで無限ループしないための安全弁。 */
const MAX_CATCH_UP = 120;

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * 次回発生日を求める。月末日（31日など）が存在しない月では、その月の末日に丸める。
 * anchorDay を基準にするため 1/31 → 2/28 → 3/31 と戻る。
 */
export function nextOccurrence(dateStr: string, frequency: Frequency, anchorDay: number): string | null {
  const d = parseDateStr(dateStr);
  if (!d) return null;

  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
    return toLocalDateStr(d);
  }

  if (frequency === 'monthly') {
    const target = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const day = Math.min(anchorDay, lastDayOfMonth(target.getFullYear(), target.getMonth()));
    return toLocalDateStr(new Date(target.getFullYear(), target.getMonth(), day));
  }

  // yearly
  const year = d.getFullYear() + 1;
  const day = Math.min(anchorDay, lastDayOfMonth(year, d.getMonth()));
  return toLocalDateStr(new Date(year, d.getMonth(), day));
}

function anchorDayOf(r: RecurringTransaction): number {
  const base = parseDateStr(r.startDate) ?? parseDateStr(r.nextDate);
  return base ? base.getDate() : 1;
}

export interface RecurringPlan {
  creates: Array<Omit<Transaction, 'id' | 'createdAt'>>;
  advances: Array<{ id: string; nextDate: string }>;
}

/**
 * active な定期取引のうち nextDate が今日以前のものを消化し、
 * 生成すべき明細と、更新後の nextDate をまとめて返す。
 * 実際の書き込みは呼び出し側（Provider）が行う。
 */
export function planRecurring(
  recurring: RecurringTransaction[],
  today: string = todayStr()
): RecurringPlan {
  const creates: RecurringPlan['creates'] = [];
  const advances: RecurringPlan['advances'] = [];

  for (const r of recurring) {
    if (!r.active) continue;
    if (!parseDateStr(r.nextDate)) continue;
    if (!r.categoryId || !r.paymentMethodId) continue;
    if (!Number.isFinite(r.amount) || r.amount <= 0) continue;

    const anchorDay = anchorDayOf(r);
    let cursor = r.nextDate;
    let guard = 0;

    while (cursor <= today && guard < MAX_CATCH_UP) {
      creates.push({
        type: r.type,
        amount: r.amount,
        date: cursor,
        categoryId: r.categoryId,
        paymentMethodId: r.paymentMethodId,
        userId: r.userId,
        memo: r.memo,
        receiptImage: null,
      });
      const next = nextOccurrence(cursor, r.frequency, anchorDay);
      if (!next || next <= cursor) break; // 前に進まないなら中断（無限ループ防止）
      cursor = next;
      guard += 1;
    }

    if (cursor !== r.nextDate) advances.push({ id: r.id, nextDate: cursor });
  }

  return { creates, advances };
}

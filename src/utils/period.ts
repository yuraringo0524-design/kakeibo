import type { PeriodUnit, Transaction } from '../types';
import { parseDateStr } from './format';

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // week starts Monday
  const res = new Date(d);
  res.setDate(d.getDate() - diff);
  res.setHours(0, 0, 0, 0);
  return res;
}

export interface PeriodRange {
  start: Date;
  end: Date; // inclusive
  label: string;
}

export function getPeriodRange(unit: PeriodUnit, anchor: Date, offset: number): PeriodRange {
  const d = new Date(anchor);
  let start: Date;
  let end: Date;
  let label: string;

  if (unit === 'day') {
    start = new Date(d);
    start.setDate(start.getDate() + offset);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    label = `${start.getMonth() + 1}月${start.getDate()}日`;
  } else if (unit === 'week') {
    const base = startOfWeek(d);
    base.setDate(base.getDate() + offset * 7);
    start = base;
    end = new Date(base);
    end.setDate(end.getDate() + 6);
    label = `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;
  } else if (unit === 'month') {
    const y = d.getFullYear();
    const m = d.getMonth() + offset;
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
    label = `${start.getFullYear()}年${start.getMonth() + 1}月`;
  } else {
    const y = d.getFullYear() + offset;
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
    label = `${y}年`;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end, label };
}

export function inRange(dateStr: string, range: PeriodRange): boolean {
  const d = parseDateStr(dateStr);
  if (!d) return false;
  const t = d.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export function filterByRange(transactions: Transaction[], range: PeriodRange): Transaction[] {
  return transactions.filter((t) => inRange(t.date, range));
}

export function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0);
}

/** viewMode（'all' か userId）で明細を絞り込む。全画面で同じ規則を使うための共通関数。 */
export function scopeByViewMode(transactions: Transaction[], viewMode: string): Transaction[] {
  return viewMode === 'all' ? transactions : transactions.filter((t) => t.userId === viewMode);
}

/** 明細を日付降順（同日は登録日時の新しい順）で並べる。比較関数は必ず 0 を返しうる形にする。 */
export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    const ca = a.createdAt ?? '';
    const cb = b.createdAt ?? '';
    if (ca !== cb) return ca < cb ? 1 : -1;
    return 0;
  });
}

export const periodUnitLabel: Record<PeriodUnit, string> = {
  day: '日',
  week: '週',
  month: '月',
  year: '年',
};

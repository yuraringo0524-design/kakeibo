/** Date を端末のローカル日付（YYYY-MM-DD）に変換する。toISOString() は UTC なので使わない。 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD をローカルタイムの Date として解釈する。new Date('YYYY-MM-DD') は UTC 解釈になるため使わない。 */
export function parseDateStr(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatYen(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const sign = n < 0 ? '-' : '';
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString('ja-JP')}`;
}

export function formatYenShort(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(n);
  if (abs >= 10000) {
    const man = n / 10000;
    return `¥${(Math.round(man * 10) / 10).toLocaleString('ja-JP')}万`;
  }
  return formatYen(n);
}

export function formatDateJp(dateStr: string): string {
  const d = parseDateStr(dateStr);
  if (!d) return dateStr || '日付なし';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatDateFull(dateStr: string): string {
  const d = parseDateStr(dateStr);
  if (!d) return dateStr || '日付なし';
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`;
}

/** 今日の日付（端末のローカルタイム基準）。 */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** anchor から offset か月ずらした月キー（YYYY-MM）。setMonth() の月末ロールオーバーを避ける。 */
export function monthKeyOf(anchor: Date, offset = 0): string {
  const d = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function displayName(name: string | undefined | null): string {
  return name && name.trim() ? name : '名前未設定';
}

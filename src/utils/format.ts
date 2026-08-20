export function formatYen(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}¥${Math.abs(Math.round(amount)).toLocaleString('ja-JP')}`;
}

export function formatYenShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000) {
    const man = amount / 10000;
    return `¥${(Math.round(man * 10) / 10).toLocaleString('ja-JP')}万`;
  }
  return formatYen(amount);
}

export function formatDateJp(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${weekdays[d.getDay()]})`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function displayName(name: string | undefined | null): string {
  return name && name.trim() ? name : '名前未設定';
}

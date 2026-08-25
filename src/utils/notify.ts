const STORAGE_PREFIX = 'kakeibo-notified-';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/** 通知許可の要求はユーザー操作（設定トグル）からのみ呼ぶ。 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function firedKey(monthKey: string) {
  return `${STORAGE_PREFIX}${monthKey}`;
}

function readFired(monthKey: string): number[] {
  try {
    const raw = localStorage.getItem(firedKey(monthKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'number') : [];
  } catch {
    return [];
  }
}

function writeFired(monthKey: string, values: number[]) {
  try {
    localStorage.setItem(firedKey(monthKey), JSON.stringify(values));
  } catch {
    /* 保存できなくても通知自体は出す */
  }
}

/**
 * 予算の消化率がしきい値に到達したら通知する。
 * 通知設定のしきい値はこれまで保存されるだけで、どこからも参照されていなかった。
 * 同じ月・同じしきい値では 1 回しか鳴らさない。
 */
export function maybeNotifyBudget(params: {
  monthKey: string;
  ratioPct: number;
  thresholds: number[];
  pushEnabled: boolean;
}): void {
  const { monthKey, ratioPct, thresholds, pushEnabled } = params;
  if (!pushEnabled) return;
  if (!Number.isFinite(ratioPct)) return;
  if (notificationPermission() !== 'granted') return;

  const already = readFired(monthKey);
  const due = thresholds
    .filter((t) => Number.isFinite(t) && ratioPct >= t && !already.includes(t))
    .sort((a, b) => b - a);
  if (due.length === 0) return;

  const top = due[0];
  try {
    new Notification('ふたり家計簿', {
      body:
        top >= 100
          ? `今月の予算を超過しました（消化率 ${Math.round(ratioPct)}%）`
          : `今月の予算の ${top}% を使いました（消化率 ${Math.round(ratioPct)}%）`,
      tag: `budget-${monthKey}-${top}`,
    });
  } catch {
    /* 通知の生成に失敗しても記録だけ進めて鳴り続けないようにする */
  }
  writeFired(monthKey, [...already, ...due]);
}

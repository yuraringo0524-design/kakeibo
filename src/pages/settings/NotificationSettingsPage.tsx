import { useApp } from '../../context/AppContext';
import { PageHeader, Card, FormField } from '../../components/ui';
import { Bell } from 'lucide-react';

const options = [50, 80, 90, 100, 110];

export default function NotificationSettingsPage() {
  const { notificationSettings, updateNotificationSettings } = useApp();

  function toggle(v: number) {
    const has = notificationSettings.thresholds.includes(v);
    const next = has
      ? notificationSettings.thresholds.filter((t) => t !== v)
      : [...notificationSettings.thresholds, v].sort((a, b) => a - b);
    updateNotificationSettings({ thresholds: next });
  }

  return (
    <div>
      <PageHeader title="通知設定" />
      <div className="px-4 pt-3 pb-8">
        <Card className="mb-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/5 dark:bg-white/10">
            <Bell size={20} className="text-orange-500" />
          </span>
          <span className="flex-1 font-bold">プッシュ通知</span>
          <button
            onClick={() => updateNotificationSettings({ pushEnabled: !notificationSettings.pushEnabled })}
            role="switch"
            aria-checked={notificationSettings.pushEnabled}
            className={`tap-target relative w-12 h-7 rounded-full transition-colors ${
              notificationSettings.pushEnabled ? 'bg-orange-500' : 'bg-black/15 dark:bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                notificationSettings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </Card>

        <FormField label="予算の通知しきい値（複数選択可）">
          <div className="grid grid-cols-3 gap-2">
            {options.map((v) => {
              const active = notificationSettings.thresholds.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggle(v)}
                  className={`tap-target rounded-2xl border py-3 text-sm font-bold ${
                    active
                      ? v >= 100
                        ? 'border-warn-500 bg-warn-500/10 text-warn-500'
                        : 'border-orange-400 bg-orange-50 dark:bg-orange-500/10 text-orange-600'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {v}%
                </button>
              );
            })}
          </div>
        </FormField>
        <p className="text-xs text-[var(--text-muted)] px-1">
          選択した割合に予算の消化率が到達すると通知します。100%を超える設定は予算超過の警告として扱われます。
        </p>
      </div>
    </div>
  );
}

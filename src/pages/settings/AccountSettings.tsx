import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, FormField, inputClass } from '../../components/ui';
import { LogOut, ShieldCheck, WifiOff } from 'lucide-react';
import { displayName } from '../../utils/format';

export default function AccountSettings() {
  const { users, currentUserId, updateUserName, mode, signOutUser } = useApp();
  const { user: authUser } = useAuth();
  const me = users.find((u) => u.id === currentUserId)!;
  const [name, setName] = useState(me.name);
  const email = mode === 'cloud' ? authUser?.email ?? '' : 'この端末だけのローカルモードです';
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader title="アカウント" />
      <div className="px-4 pt-3 pb-8">
        <Card className="mb-4 flex items-center gap-3">
          <span className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: `${me.color}22` }}>
            {me.avatarEmoji}
          </span>
          <div>
            <p className="font-bold">{displayName(me.name)}</p>
            <p className="text-xs text-[var(--text-muted)]">{email}</p>
          </div>
        </Card>

        <FormField label="表示名">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </FormField>
        <button
          onClick={() => {
            if (!name.trim()) return;
            updateUserName(currentUserId, name.trim());
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 mb-2"
        >
          保存する
        </button>
        {saved && <p className="text-xs text-blue-500 font-bold text-center mb-4">保存しました</p>}

        {mode === 'cloud' ? (
          <Card className="mb-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-muted)]">
              データはクラウドに安全に保存され、機種変更時も引き継げます。パートナーとのデータはリアルタイムで同期されます。
            </p>
          </Card>
        ) : (
          <Card className="mb-4 flex items-start gap-3">
            <WifiOff size={20} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-muted)]">
              現在はこの端末だけに保存されるお試しモードです。パートナーとリアルタイムで共有するには、クラウド連携の設定が必要です。
            </p>
          </Card>
        )}

        {mode === 'cloud' && (
          <button
            onClick={() => signOutUser()}
            className="tap-target w-full rounded-2xl border border-warn-500 text-warn-500 font-bold py-3.5 flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> ログアウト
          </button>
        )}
      </div>
    </div>
  );
}

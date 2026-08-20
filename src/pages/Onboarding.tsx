import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inputClass } from '../components/ui';
import { Users, UserPlus, LogOut } from 'lucide-react';

export default function Onboarding() {
  const { createGroup, joinGroup, signOutUser, error, clearError, profile } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('ふたりの家計');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await createGroup(groupName.trim());
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!inviteCode.trim()) return;
    setSubmitting(true);
    try {
      await joinGroup(inviteCode.trim());
    } catch {
      /* error は AuthContext 側に反映 */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center text-blue-500 mb-3">
            <Users size={26} />
          </div>
          <h1 className="text-lg font-extrabold">ようこそ、{profile?.displayName || 'あなた'}さん</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 text-center">
            家計グループを新しく作るか、パートナーの招待コードで参加してください。
          </p>
        </div>

        <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 text-sm font-bold py-2 rounded-full tap-target ${
              tab === 'create' ? 'bg-[var(--card)] text-orange-600 shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            新しく作る
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 text-sm font-bold py-2 rounded-full tap-target ${
              tab === 'join' ? 'bg-[var(--card)] text-orange-600 shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            招待コードで参加
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="家計グループ名"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={submitting}
              className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 disabled:opacity-60"
            >
              {submitting ? '作成中…' : 'グループを作成する'}
            </button>
            <p className="text-xs text-[var(--text-muted)] text-center">
              作成後、招待コードをパートナーに共有して参加してもらえます。
            </p>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="例）KAKEI-XXXX"
              className={`${inputClass} font-mono tracking-wider`}
            />
            {error && <p className="text-xs text-warn-500 font-bold flex items-center gap-1">⚠ {error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="tap-target w-full rounded-2xl bg-blue-500 text-white font-bold py-3.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <UserPlus size={18} />
              {submitting ? '参加中…' : '参加する'}
            </button>
          </form>
        )}

        <button
          onClick={() => signOutUser()}
          className="tap-target w-full mt-8 flex items-center justify-center gap-1.5 text-sm font-bold text-[var(--text-muted)]"
        >
          <LogOut size={16} /> 別のアカウントでログイン
        </button>
      </div>
    </div>
  );
}

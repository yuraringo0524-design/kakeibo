import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inputClass } from '../components/ui';
import { Users, UserPlus, LogOut, Mail, Check, X } from 'lucide-react';

export default function Onboarding() {
  const { createGroup, pendingInvitations, acceptInvitation, declineInvitation, signOutUser, error, clearError, profile } =
    useAuth();
  const [groupName, setGroupName] = useState('ふたりの家計');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await createGroup(groupName.trim());
    } catch {
      /* error は AuthContext 側に反映される */
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAccept(invitation: (typeof pendingInvitations)[number]) {
    clearError();
    setRespondingId(invitation.id);
    try {
      await acceptInvitation(invitation);
    } catch {
      /* error は AuthContext 側に反映される */
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDecline(invitation: (typeof pendingInvitations)[number]) {
    setRespondingId(invitation.id);
    try {
      await declineInvitation(invitation);
    } finally {
      setRespondingId(null);
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
            家計グループを新しく作るか、届いている招待に応じてください。
          </p>
        </div>

        {pendingInvitations.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Mail size={13} /> 届いている招待
            </p>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="card p-4">
                  <p className="font-bold text-sm mb-3">{inv.groupName} から招待されています</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecline(inv)}
                      disabled={respondingId === inv.id}
                      className="tap-target flex-1 flex items-center justify-center gap-1 rounded-2xl border border-[var(--border)] font-bold text-sm py-2.5 disabled:opacity-60"
                    >
                      <X size={15} /> 辞退
                    </button>
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={respondingId === inv.id}
                      className="tap-target flex-1 flex items-center justify-center gap-1 rounded-2xl bg-blue-500 text-white font-bold text-sm py-2.5 disabled:opacity-60"
                    >
                      <Check size={15} /> {respondingId === inv.id ? '参加中…' : '参加する'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-warn-500 font-bold flex items-center gap-1 mt-2">⚠ {error}</p>}
          </div>
        )}

        <p className="text-xs font-bold text-[var(--text-muted)] mb-2">新しく家計グループを作る</p>
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
            className="tap-target w-full flex items-center justify-center gap-1.5 rounded-2xl bg-orange-500 text-white font-bold py-3.5 disabled:opacity-60"
          >
            <UserPlus size={18} />
            {submitting ? '作成中…' : 'グループを作成する'}
          </button>
          <p className="text-xs text-[var(--text-muted)] text-center">
            作成後、「共有家計」画面からパートナーのメールアドレスで招待できます。
          </p>
        </form>

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

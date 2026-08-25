import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, SectionTitle, ConfirmDialog, inputClass } from '../components/ui';
import { formatYen, displayName } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType } from '../utils/period';
import { Mail, Crown, UserMinus, X, Check, Pencil, Cloud, WifiOff } from 'lucide-react';
import type { AppUser } from '../types';

export default function Shared() {
  const {
    group,
    users,
    currentUserId,
    transactions,
    invitePartnerByEmail,
    cancelInvitation,
    outgoingInvitations,
    removeMember,
    updateUserName,
    mode,
  } = useApp();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 非 null アサーション + filter(Boolean) では型が絞れず、users に居ない memberId で undefined が漏れる
  const members = group.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is AppUser => Boolean(u));
  const isAdmin = group.adminId === currentUserId;

  const range = getPeriodRange('month', new Date(), 0);
  const monthTx = filterByRange(transactions, range);

  const perMember = useMemo(
    () =>
      members.map((m) => {
        const tx = monthTx.filter((t) => t.userId === m.id);
        return { user: m, income: sumByType(tx, 'income'), expense: sumByType(tx, 'expense') };
      }),
    [members, monthTx]
  );

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteError('');
    setInviting(true);
    try {
      await invitePartnerByEmail(email);
      setInviteMsg(`${email} に招待を送りました。`);
      setInviteEmail('');
      setTimeout(() => setInviteMsg(''), 3000);
    } catch (e) {
      setInviteError(e instanceof Error && e.message ? '招待に失敗しました。' : '招待に失敗しました。');
    } finally {
      setInviting(false);
    }
  }

  function startEditName(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  function saveEditName() {
    if (editingId && editingName.trim()) {
      updateUserName(editingId, editingName.trim());
    }
    setEditingId(null);
  }

  return (
    <div>
      <PageHeader title="共有家計" />
      <div className="px-4 pt-3 pb-8">
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-[var(--text-muted)]">家計グループ</p>
            {mode === 'cloud' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-full px-2 py-0.5">
                <Cloud size={11} /> リアルタイム同期中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/10 rounded-full px-2 py-0.5">
                <WifiOff size={11} /> この端末のみ
              </span>
            )}
          </div>
          <p className="text-lg font-extrabold">{group.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            メンバー {members.length}人（パートナー利用を想定）
          </p>
        </Card>

        <SectionTitle>{range.label}の内訳（メンバー別）</SectionTitle>
        <Card className="mb-4 divide-y divide-[var(--border)] p-0">
          {perMember.map(({ user, income, expense }) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ background: `${user.color}22` }}
              >
                {user.avatarEmoji}
              </span>
              <span className="flex-1 min-w-0">
                <p className="text-sm font-bold flex items-center gap-1 truncate">
                  {displayName(user.name)}
                  {user.id === group.adminId && <Crown size={12} className="text-orange-500" />}
                  {user.id === currentUserId && (
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">（あなた）</span>
                  )}
                </p>
              </span>
              <span className="text-right shrink-0">
                <p className="text-xs text-blue-500 font-bold">+{formatYen(income)}</p>
                <p className="text-xs text-orange-500 font-bold">-{formatYen(expense)}</p>
              </span>
            </div>
          ))}
        </Card>

        <SectionTitle>メンバー管理</SectionTitle>
        <Card className="mb-4 divide-y divide-[var(--border)] p-0">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-base">{m.avatarEmoji}</span>
              {editingId === m.id ? (
                <>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditName()}
                    placeholder="名前を入力"
                    className={`${inputClass} flex-1 py-1.5 text-sm`}
                  />
                  <button
                    onClick={saveEditName}
                    className="tap-target flex items-center gap-1 text-xs font-bold text-orange-500 shrink-0"
                  >
                    <Check size={16} /> 保存
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-bold truncate">
                    <span className={m.name ? '' : 'text-[var(--text-muted)] font-normal'}>{displayName(m.name)}</span>
                    {m.id === currentUserId && (
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">（あなた）</span>
                    )}
                  </span>
                  <button
                    onClick={() => startEditName(m.id, m.name)}
                    className="tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)] shrink-0"
                    aria-label={`${displayName(m.name)}の名前を編集`}
                  >
                    <Pencil size={14} />
                  </button>
                  {isAdmin && m.id !== currentUserId && (
                    <button
                      onClick={() => setRemoveTarget(m.id)}
                      className="tap-target flex items-center gap-1 text-xs font-bold text-warn-500 shrink-0"
                    >
                      <UserMinus size={14} /> 削除
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </Card>
        <p className="text-xs text-[var(--text-muted)] mb-4 px-1">
          鉛筆アイコンから、あなた自身やパートナーの表示名を自由に入力・変更できます。
        </p>

        {isAdmin && (
          <>
            <SectionTitle>パートナーを招待</SectionTitle>
            <Card className="mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">
                {mode === 'cloud'
                  ? 'パートナーのメールアドレスを入力すると招待が届きます。パートナーがこのアプリでアカウント作成・ログイン後、届いた招待から「参加する」を押すと家計データがリアルタイムで共有されます。'
                  : 'この端末だけに保存されるお試しモードです。メールアドレスを入力するとデモとしてメンバーが追加されます。'}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="partner@example.com"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="tap-target w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 disabled:opacity-60"
                  aria-label="招待する"
                >
                  <Mail size={18} />
                </button>
              </div>
              {inviteError && <p className="text-xs text-warn-500 font-bold mt-1.5">⚠ {inviteError}</p>}
              {inviteMsg && <p className="text-xs text-blue-500 font-bold mt-1.5">{inviteMsg}</p>}

              {mode === 'cloud' && outgoingInvitations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                  <p className="text-xs font-bold text-[var(--text-muted)]">招待中</p>
                  {outgoingInvitations.map((email) => (
                    <div key={email} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{email}</span>
                      <button
                        onClick={() => cancelInvitation(email)}
                        aria-label={`${email} への招待を取り消す`}
                        className="tap-target w-8 h-8 flex items-center justify-center text-[var(--text-muted)] shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {mode === 'local' && (
          <p className="text-xs text-[var(--text-muted)] text-center px-4">
            実際にパートナーの端末とリアルタイムで共有するには、クラウド連携（Firebase）の設定が必要です。
          </p>
        )}
        {mode === 'cloud' && (
          <p className="text-xs text-[var(--text-muted)] text-center px-4">
            片方が登録・編集した内容は自動的にもう片方の端末にもリアルタイムで反映されます。
          </p>
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="メンバーを削除しますか？"
        message="このメンバーは家計グループから削除され、今後の同期対象から外れます。"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) removeMember(removeTarget);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

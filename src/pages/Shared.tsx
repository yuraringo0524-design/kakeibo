import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, SectionTitle, ConfirmDialog, inputClass } from '../components/ui';
import { formatYen, displayName } from '../utils/format';
import { getPeriodRange, filterByRange, sumByType } from '../utils/period';
import { Copy, Crown, UserPlus, UserMinus, Check, Pencil, Cloud, WifiOff } from 'lucide-react';

export default function Shared() {
  const { group, users, currentUserId, transactions, addMember, removeMember, updateUserName, mode } = useApp();
  const [copied, setCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const members = group.memberIds.map((id) => users.find((u) => u.id === id)!).filter(Boolean);
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

  function handleCopy() {
    navigator.clipboard?.writeText(group.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleJoin() {
    if (!inviteInput.trim()) return;
    addMember(`招待メンバー(${inviteInput.trim().slice(0, 6)})`);
    setJoinMsg('招待コードを承認し、メンバーを追加しました。');
    setInviteInput('');
    setTimeout(() => setJoinMsg(''), 2500);
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
                以下の招待コードをパートナーに共有してください。
                {mode === 'cloud' && 'パートナーがこのアプリでログイン後、「招待コードで参加」からこのコードを入力すると、家計データがリアルタイムで共有されます。'}
              </p>
              <div className="flex items-center gap-2">
                <div className={`${inputClass} flex-1 flex items-center justify-between font-mono tracking-wider`}>
                  {group.inviteCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="tap-target w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0"
                  aria-label="招待コードをコピー"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              {copied && <p className="text-xs text-blue-500 font-bold mt-1.5">コピーしました</p>}
            </Card>
          </>
        )}

        {mode === 'local' ? (
          <>
            <SectionTitle>招待コードで参加（デモ）</SectionTitle>
            <Card className="mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">
                パートナーから受け取った招待コードを入力してグループに参加します。
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="例）KAKEI-XXXX"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={handleJoin}
                  className="tap-target w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0"
                  aria-label="参加する"
                >
                  <UserPlus size={18} />
                </button>
              </div>
              {joinMsg && <p className="text-xs text-blue-500 font-bold mt-1.5">{joinMsg}</p>}
            </Card>
            <p className="text-xs text-[var(--text-muted)] text-center px-4">
              現在はこの端末だけに保存されるお試しモードです。実際にパートナーの端末とリアルタイムで共有するには、クラウド連携（Firebase）の設定が必要です。
            </p>
          </>
        ) : (
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

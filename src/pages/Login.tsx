import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inputClass } from '../components/ui';
import { Wallet } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError('');
    clearError();
    if (!email || !password) {
      setFieldError('メールアドレスとパスワードを入力してください');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setFieldError('表示名を入力してください');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName.trim());
      } else {
        await signIn(email, password);
      }
    } catch {
      /* エラーは AuthContext 側の error に反映される */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
            <Wallet size={30} />
          </div>
          <h1 className="text-xl font-extrabold">ふたりの家計簿</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">パートナーと家計をリアルタイムで共有</p>
        </div>

        <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 text-sm font-bold py-2 rounded-full tap-target ${
              mode === 'signin' ? 'bg-[var(--card)] text-orange-600 shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 text-sm font-bold py-2 rounded-full tap-target ${
              mode === 'signup' ? 'bg-[var(--card)] text-orange-600 shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名（例：あなたの名前）"
              className={inputClass}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（6文字以上）"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className={inputClass}
          />
          {(fieldError || error) && (
            <p className="text-xs text-warn-500 font-bold flex items-center gap-1">⚠ {fieldError || error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="tap-target w-full rounded-2xl bg-orange-500 text-white font-bold py-3.5 disabled:opacity-60"
          >
            {submitting ? '処理中…' : mode === 'signup' ? '登録してはじめる' : 'ログイン'}
          </button>
        </form>

        <p className="text-xs text-[var(--text-muted)] text-center mt-6">
          登録後、家計グループを新しく作成するか、パートナーから受け取った招待コードで参加できます。
        </p>
      </div>
    </div>
  );
}

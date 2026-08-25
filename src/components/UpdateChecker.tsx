import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5分ごと

/**
 * GitHub Pages は index.html に Cache-Control: max-age=600 を強制し、
 * カスタムヘッダーの設定もできない。特にスマホのブラウザはこれより長くキャッシュを
 * 保持することがあり、デプロイ後もユーザーが古いバンドルを開き続けてしまう。
 * 定期的に index.html をキャッシュ無視で取得し、埋め込まれたビルドIDが変わっていたら
 * 更新を促す（手動でのキャッシュ削除を不要にする）。
 */
export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    async function check() {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const base = import.meta.env.BASE_URL || '/';
        const res = await fetch(`${base}index.html?_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        const match = text.match(/data-build-id="([^"]+)"/);
        if (match && match[1] && match[1] !== __BUILD_ID__) {
          setUpdateAvailable(true);
        }
      } catch {
        /* オフライン等での失敗は無視し、次の周期に任せる */
      } finally {
        checkingRef.current = false;
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    // アプリをバックグラウンドから復帰したとき（スマホでよくある操作）にも確認する
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  function reload() {
    // location.reload() はブラウザによって HTTP キャッシュから返ることがあるため、
    // クエリを変えて確実に新しい URL として取得させる
    window.location.href = `${window.location.pathname}?_=${Date.now()}${window.location.hash}`;
  }

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center gap-2 bg-blue-500 text-white text-xs font-bold px-4 py-2.5"
    >
      <RefreshCw size={14} className="shrink-0" />
      <span className="flex-1">新しいバージョンがあります</span>
      <button onClick={reload} className="shrink-0 underline underline-offset-2">
        今すぐ更新
      </button>
      <button onClick={() => setDismissed(true)} aria-label="閉じる" className="shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

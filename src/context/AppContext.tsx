// ページ側は引き続きこのパスから useApp をインポートする。
// 実際のデータの出所（この端末だけのローカルモード／Firebaseのクラウドモード）は
// App.tsx が LocalAppProvider か CloudAppProvider のどちらを使うかで切り替える。
export { useApp } from './appContextCore';
export type { AppContextValue, AppState } from './appContextCore';

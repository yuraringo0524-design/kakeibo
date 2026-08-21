# ふたり家計簿

二人で使う家計簿アプリです。

🔗 **公開URL: <https://yuraringo0524-design.github.io/kakeibo/>**

## 現在の状態

Firebase(認証・データ同期)が未設定のため、現在は**ローカルモード**で動作しています。ローカルモードでは、データはブラウザ(端末)ごとに保存され、他の人とは共有されません。

Firebaseを設定すると、ログインが必須になり、招待コードでつながった二人だけがリアルタイムでデータを共有できる**クラウドモード**に切り替わります。設定方法は `.env.example` を参照してください。

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run lint     # Lint
```

## デプロイ

`main` ブランチへのpushで GitHub Actions が自動的にビルドし、GitHub Pages へ公開します(`.github/workflows/deploy.yml`)。

## 技術スタック

- React + TypeScript + Vite
- Tailwind CSS
- Firebase (Authentication / Firestore) ※クラウドモード時
- react-router-dom / recharts / lucide-react

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages は index.html に Cache-Control: max-age=600 を強制でき、
// カスタムヘッダーも設定できない。ビルドごとに一意な ID を index.html の
// script タグと JS バンドルの両方へ埋め込み、UpdateChecker が両者を突き合わせて
// 「配信中の index.html は取得できたが中身が古い」を検知できるようにする。
const buildId = String(Date.now())

function buildIdPlugin(): Plugin {
  return {
    name: 'inject-build-id',
    transformIndexHtml(html) {
      return html.replace(
        '<script type="module"',
        `<script type="module" data-build-id="${buildId}"`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/kakeibo/',
  plugins: [react(), buildIdPlugin()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})

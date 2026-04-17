import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 設定：
// - base 必須與 GitHub Pages 路徑一致：
//   專案頁網址為 https://<user>.github.io/xiao-dong-xi-game/
// - 打包輸出到 docs/，對應 repo Settings → Pages → main / docs
export default defineConfig({
  plugins: [react()],
  base: '/xiao-dong-xi-game/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});

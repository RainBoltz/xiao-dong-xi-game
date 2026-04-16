import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 設定：React 插件 + 預設開發伺服器
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});

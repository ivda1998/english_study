import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages는 https://<user>.github.io/english_study/ 로 서비스되므로 base 경로가 필요하다.
// 로컬 개발/테스트에서는 '/' 를 쓴다.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/english_study/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
}));

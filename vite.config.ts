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
  build: {
    // 6주 30일 콘텐츠를 번들에 함께 넣는다. 첫 방문 이후에는 네트워크 없이도
    // 학습이 이어지므로, 한 번 크게 받는 편이 매일 조각을 받는 것보다 낫다.
    chunkSizeWarningLimit: 800,
  },
}));

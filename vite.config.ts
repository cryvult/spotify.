import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // Ścieżki względne: zbudowana aplikacja działa także w podkatalogu,
  // np. https://<użytkownik>.github.io/<repozytorium>/ (GitHub Pages).
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Testy integracyjne renderują całą aplikację, więc dajemy im więcej czasu.
    testTimeout: 15000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // falha se a porta estiver ocupada, em vez de subir em outra e o e2e testar outro app
    strictPort: true,
    // Em desenvolvimento, /api vai para a API local (apps/api)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/testes/configuracao.ts'],
  },
})

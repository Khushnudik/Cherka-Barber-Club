import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repository under /Cherka-Barber-Club/.
  // Keep the root path in local development.
  base: command === 'serve' ? '/' : '/Cherka-Barber-Club/',
  plugins: [react()],
}))

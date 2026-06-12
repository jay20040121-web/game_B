import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isDesktopBuild = process.env.VITE_DESKTOP === '1'
  const isItchBuild = process.env.npm_lifecycle_event === 'build:itch'

  return {
    plugins: [react()],
    base: command === 'serve' ? '/' : (isDesktopBuild || isItchBuild ? './' : '/game_B/'),
    server: {
      port: 3000,
      open: true
    },
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isDesktopBuild = process.env.VITE_DESKTOP === '1'
  const isItchBuild = process.env.npm_lifecycle_event === 'build:itch'
  const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop()
  const webBase = githubRepositoryName ? `/${githubRepositoryName}/` : '/game_B/'

  return {
    plugins: [react()],
    base: command === 'serve' ? '/' : (isDesktopBuild || isItchBuild ? './' : webBase),
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

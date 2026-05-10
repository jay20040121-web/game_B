import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import http from 'node:http'

const require = createRequire(import.meta.url)
const electronPath = require('electron')
const vitePort = 3000
const viteUrl = `http://127.0.0.1:${vitePort}`

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume()
          if (res.statusCode && res.statusCode < 500) {
            resolve()
            return
          }
          retry()
        })
        .on('error', retry)
    }

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`))
        return
      }
      setTimeout(tick, 500)
    }

    tick()
  })
}

const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BROWSER: 'none'
  }
})

let electron = null

const cleanup = () => {
  if (electron && !electron.killed) {
    electron.kill()
  }
  if (vite && !vite.killed) {
    vite.kill()
  }
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

vite.on('exit', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1)
  }
})

waitForServer(viteUrl)
  .then(() => {
    electron = spawn(electronPath, ['.'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: viteUrl
      }
    })

    electron.on('exit', (code) => {
      cleanup()
      process.exit(code ?? 0)
    })
  })
  .catch((error) => {
    console.error(error)
    cleanup()
    process.exit(1)
  })

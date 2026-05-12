import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { screen } from 'electron'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const distPath = path.resolve(__dirname, '..', 'dist')
const indexHtmlPath = path.resolve(__dirname, '..', 'dist', 'index.html')
const authPopupHostnames = new Set([
  'accounts.google.com',
  'gamea-42ecd.firebaseapp.com'
])

function isAuthPopupUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && authPopupHostnames.has(parsed.hostname)
  } catch {
    return false
  }
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://localhost')
      const decodedPath = decodeURIComponent(requestUrl.pathname)
      const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
      const targetPath = path.resolve(distPath, `.${requestedPath}`)
      const relativePath = path.relative(distPath, targetPath)

      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      const filePath = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()
        ? targetPath
        : indexHtmlPath
      const ext = path.extname(filePath).toLowerCase()

      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      })
      fs.createReadStream(filePath).pipe(res)
    } catch (error) {
      console.error('Desktop static server error:', error)
      res.writeHead(500)
      res.end('Internal Server Error')
    }
  })
}

function listenStaticServer(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, 'localhost', () => {
      server.off('error', reject)
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind desktop static server'))
        return
      }
      resolve(`http://localhost:${address.port}`)
    })
  })
}

async function startStaticServer() {
  const server = createStaticServer()
  const url = await listenStaticServer(server, 0)
  return { server, url }
}

function getDesktopSavePath() {
  return path.join(app.getPath('userData'), 'pixel_monster_save.json')
}

function readDesktopSave() {
  try {
    const savePath = getDesktopSavePath()
    if (!fs.existsSync(savePath)) return null
    return fs.readFileSync(savePath, 'utf8')
  } catch (error) {
    console.error('Failed to read desktop save:', error)
    return null
  }
}

function writeDesktopSave(saveText) {
  try {
    const savePath = getDesktopSavePath()
    fs.mkdirSync(path.dirname(savePath), { recursive: true })
    fs.writeFileSync(savePath, saveText || '', 'utf8')
    return true
  } catch (error) {
    console.error('Failed to write desktop save:', error)
    return false
  }
}

function clearDesktopSave() {
  try {
    const savePath = getDesktopSavePath()
    if (fs.existsSync(savePath)) {
      fs.unlinkSync(savePath)
    }
    return true
  } catch (error) {
    console.error('Failed to clear desktop save:', error)
    return false
  }
}

async function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const startHeight = Math.max(698, Math.min(workAreaSize.height, Math.floor(workAreaSize.width * 620 / 320)))
  const startWidth = Math.round(startHeight * 320 / 620)
  const packagedServer = devServerUrl ? null : await startStaticServer()

  const win = new BrowserWindow({
    width: startWidth,
    height: startHeight,
    minWidth: 320,
    minHeight: 620,
    backgroundColor: '#000000',
    icon: path.resolve(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.removeMenu()
  win.setAspectRatio(320 / 620)

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    packagedServer?.server.close()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || isAuthPopupUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 480,
          height: 720,
          parent: win,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
          }
        }
      }
    }

    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (devServerUrl) {
    win.loadURL(devServerUrl)
    win.webContents.openDevTools({ mode: 'detach' })
    return
  }

  win.loadURL(packagedServer.url)
}

ipcMain.handle('desktop:set-content-size', (event, { width, height }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  const safeWidth = Math.max(320, Math.round(width || 320))
  const safeHeight = Math.max(620, Math.round(height || 620))
  const bounds = win.getBounds()
  const contentBounds = win.getContentBounds()
  const frameWidth = Math.max(0, bounds.width - contentBounds.width)
  const frameHeight = Math.max(0, bounds.height - contentBounds.height)
  win.setSize(safeWidth + frameWidth, safeHeight + frameHeight)
  return true
})

ipcMain.handle('desktop:apply-scale-preset', (event, { scale }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return false
  const safeScale = Number.isFinite(scale) ? Math.max(1, scale) : 1
  const safeWidth = Math.max(320, Math.round(safeScale * 320))
  const safeHeight = Math.max(620, Math.round(safeScale * 620))
  const bounds = win.getBounds()
  const contentBounds = win.getContentBounds()
  const frameWidth = Math.max(0, bounds.width - contentBounds.width)
  const frameHeight = Math.max(0, bounds.height - contentBounds.height)
  win.setSize(safeWidth + frameWidth, safeHeight + frameHeight)
  win.center()
  return { width: safeWidth, height: safeHeight }
})

ipcMain.on('desktop-save:load-sync', (event) => {
  event.returnValue = readDesktopSave()
})

ipcMain.handle('desktop-save:set', (_event, saveText) => {
  return writeDesktopSave(saveText)
})

ipcMain.handle('desktop-save:clear', () => {
  return clearDesktopSave()
})

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

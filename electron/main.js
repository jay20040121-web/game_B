import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const indexHtmlPath = path.resolve(__dirname, '..', 'dist', 'index.html')

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const startHeight = Math.max(698, Math.min(workAreaSize.height, Math.floor(workAreaSize.width * 620 / 320)))
  const startWidth = Math.round(startHeight * 320 / 620)

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

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (devServerUrl) {
    win.loadURL(devServerUrl)
    win.webContents.openDevTools({ mode: 'detach' })
    return
  }

  win.loadFile(indexHtmlPath)
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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

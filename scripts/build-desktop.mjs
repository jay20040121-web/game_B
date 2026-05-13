import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const packager = require('electron-packager')
const vitePackageJson = require.resolve('vite/package.json')
const viteBin = path.resolve(path.dirname(vitePackageJson), 'bin', 'vite.js')
const appName = '像素怪獸'
const releaseDir = path.resolve(process.cwd(), 'release')
const stagingDir = path.join(releaseDir, '.desktop-build')
const appDir = path.join(stagingDir, appName)
const publishedAppDir = path.join(releaseDir, appName)

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env
      }
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} exited with code ${code}`))
      }
    })
  })
}

await run(process.execPath, [viteBin, 'build'], { VITE_DESKTOP: '1' })
await fs.mkdir(releaseDir, { recursive: true })
await fs.rm(stagingDir, { recursive: true, force: true })
await fs.mkdir(stagingDir, { recursive: true })

const packagedAppPaths = await packager({
  dir: process.cwd(),
  out: stagingDir,
  name: appName,
  platform: 'win32',
  arch: 'x64',
  overwrite: true,
  prune: true,
  asar: true,
  icon: path.resolve(process.cwd(), 'electron', 'icon.ico'),
  executableName: appName,
  appBundleId: 'com.pixelmonster.gameb',
  appVersion: '1.0.0',
  buildVersion: '1.0.0',
  appCopyright: 'Copyright (c) 2026',
  win32metadata: {
    CompanyName: 'Pixel Monster Game',
    FileDescription: appName,
    OriginalFilename: `${appName}.exe`,
    ProductName: appName,
    InternalName: appName
  },
  ignore: [
    /^\/release($|\/)/,
    /^\/.git($|\/)/,
    /^\/.github($|\/)/,
    /^\/.gitignore$/,
    /^\/node_modules($|\/)/,
    /^\/public($|\/)/,
    /^\/src($|\/)/,
    /^\/scripts($|\/)/,
    /^\/local-assets($|\/)/,
    /^\/backups($|\/)/,
    /^\/AGENTS\.md$/,
    /^\/PROJECT_INDEX\.md$/,
    /^\/package-lock\.json$/,
    /^\/postcss\.config\.js$/,
    /^\/tailwind\.config\.js$/,
    /^\/vite\.config\.js$/,
    /^\/啟動遊戲\.bat$/
  ]
})

const packagedAppPath = packagedAppPaths[0]
if (path.resolve(packagedAppPath) !== appDir) {
  await fs.rm(appDir, { recursive: true, force: true })
  await fs.rename(packagedAppPath, appDir)
}

try {
  await fs.rm(publishedAppDir, { recursive: true, force: true })
  await fs.cp(appDir, publishedAppDir, { recursive: true })
} catch (error) {
  console.warn(`Skipped updating ${publishedAppDir} because it is locked: ${error.message}`)
}

console.log(`Desktop package ready: ${publishedAppDir}`)

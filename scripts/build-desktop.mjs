import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const packager = require('electron-packager')
const vitePackageJson = require.resolve('vite/package.json')
const viteBin = path.resolve(path.dirname(vitePackageJson), 'bin', 'vite.js')

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

await packager({
  dir: process.cwd(),
  out: 'release',
  platform: 'win32',
  arch: 'x64',
  overwrite: true,
  prune: true,
  asar: true,
  icon: path.resolve(process.cwd(), 'electron', 'icon.ico'),
  executableName: 'Pixel Monster Game',
  appBundleId: 'com.pixelmonster.gameb',
  appCopyright: 'Copyright (c) 2026',
  ignore: [
    /^\/release($|\/)/,
    /^\/.git($|\/)/,
    /^\/node_modules\/electron-packager($|\/)/,
    /^\/node_modules\/electron-builder($|\/)/
  ]
})

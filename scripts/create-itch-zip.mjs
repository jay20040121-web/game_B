import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const releaseDir = path.join(rootDir, 'release')
const outputPath = path.join(releaseDir, 'pixel-monster-itch-html5.zip')

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i += 1) {
  let value = i
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
  }
  crcTable[i] = value >>> 0
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { dosDate, dosTime }
}

async function listFiles(absoluteDir, relativeDir = '') {
  const files = []
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true })
  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry.name)
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, relativePath))
    } else if (entry.isFile()) {
      files.push({ absolutePath, relativePath })
    }
  }
  return files
}

await fs.access(path.join(distDir, 'index.html'))
await fs.mkdir(releaseDir, { recursive: true })
await fs.rm(outputPath, { force: true })

const files = await listFiles(distDir)
const outputParts = []
const centralParts = []
let offset = 0

for (const file of files) {
  const data = await fs.readFile(file.absolutePath)
  const name = Buffer.from(file.relativePath, 'utf8')
  const stat = await fs.stat(file.absolutePath)
  const { dosDate, dosTime } = dosDateTime(stat.mtime)
  const crc = crc32(data)

  const localHeader = Buffer.alloc(30)
  localHeader.writeUInt32LE(0x04034b50, 0)
  localHeader.writeUInt16LE(20, 4)
  localHeader.writeUInt16LE(0x0800, 6)
  localHeader.writeUInt16LE(0, 8)
  localHeader.writeUInt16LE(dosTime, 10)
  localHeader.writeUInt16LE(dosDate, 12)
  localHeader.writeUInt32LE(crc, 14)
  localHeader.writeUInt32LE(data.length, 18)
  localHeader.writeUInt32LE(data.length, 22)
  localHeader.writeUInt16LE(name.length, 26)
  localHeader.writeUInt16LE(0, 28)

  outputParts.push(localHeader, name, data)

  const centralHeader = Buffer.alloc(46)
  centralHeader.writeUInt32LE(0x02014b50, 0)
  centralHeader.writeUInt16LE(20, 4)
  centralHeader.writeUInt16LE(20, 6)
  centralHeader.writeUInt16LE(0x0800, 8)
  centralHeader.writeUInt16LE(0, 10)
  centralHeader.writeUInt16LE(dosTime, 12)
  centralHeader.writeUInt16LE(dosDate, 14)
  centralHeader.writeUInt32LE(crc, 16)
  centralHeader.writeUInt32LE(data.length, 20)
  centralHeader.writeUInt32LE(data.length, 24)
  centralHeader.writeUInt16LE(name.length, 28)
  centralHeader.writeUInt16LE(0, 30)
  centralHeader.writeUInt16LE(0, 32)
  centralHeader.writeUInt16LE(0, 34)
  centralHeader.writeUInt16LE(0, 36)
  centralHeader.writeUInt32LE(0, 38)
  centralHeader.writeUInt32LE(offset, 42)
  centralParts.push(centralHeader, name)

  offset += localHeader.length + name.length + data.length
}

const centralOffset = offset
const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
const endHeader = Buffer.alloc(22)
endHeader.writeUInt32LE(0x06054b50, 0)
endHeader.writeUInt16LE(0, 4)
endHeader.writeUInt16LE(0, 6)
endHeader.writeUInt16LE(files.length, 8)
endHeader.writeUInt16LE(files.length, 10)
endHeader.writeUInt32LE(centralSize, 12)
endHeader.writeUInt32LE(centralOffset, 16)
endHeader.writeUInt16LE(0, 20)

await fs.writeFile(outputPath, Buffer.concat([...outputParts, ...centralParts, endHeader]))

const stat = await fs.stat(outputPath)
console.log(`Itch ZIP ready: ${outputPath} (${stat.size} bytes, ${files.length} files)`)

// 构建前强制清空 dist 目录
// 背景：Windows 下若 dist 被占用（编辑器/Xftp 上传锁定）时，
// Vite 的 emptyOutDir 可能静默失败，导致旧 chunk 累积、体积膨胀。
// 这里显式 rmSync 递归删除，确保每次构建从干净状态开始。
import { rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')

if (existsSync(distDir)) {
  try {
    rmSync(distDir, { recursive: true, force: true })
    console.log('[clean-dist] 已清空 dist 目录')
  } catch (e) {
    console.error('[clean-dist] 清空失败（可能被占用），请关闭占用 dist 的程序后重试:', e.message)
    process.exit(1)
  }
} else {
  console.log('[clean-dist] dist 目录不存在，跳过')
}

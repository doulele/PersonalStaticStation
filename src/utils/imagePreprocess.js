/**
 * 图片预处理工具 — 裁剪 + 增强，提升 tesseract.js OCR 识别率
 *
 * 核心流程：
 *   loadImage → cropCanvas → resizeCanvas → grayscale → sharpen → contrastEnhance → binarize → toBlob
 *
 * 优化策略（按可控程度排序）：
 *   1. 灰度化 — 去除彩色噪声，统一通道
 *   2. USM 锐化 — 增强文字/数字边缘，对抗手机拍照的模糊
 *   3. 对比度拉伸 — 让浅色文字更暗、背景更亮
 *   4. 二值化(OTSU) — 最终转换为纯黑白，tesseract 识别纯黑白远好于灰度
 */

/** 加载图片（支持 dataURL / blobURL / File） */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = typeof src === 'string' ? src : URL.createObjectURL(src)
  })
}

/**
 * 从原始图片 src 按 cropRect（0~1 比例坐标）裁剪并预处理
 * @param {string|File} src        - 图片源（dataURL / blob / File）
 * @param {{x:number,y:number,w:number,h:number}} cropRect - 裁剪区域（相对于原图 0~1）
 * @param {object} opts
 * @param {number} [opts.maxWidth=1200]   - 预处理后最大宽度（tesseract 推荐 ≤1500）
 * @param {boolean} [opts.grayscale=true] - 灰度化
 * @param {boolean} [opts.sharpen=true]   - USM 锐化（增强文字边缘）
 * @param {number} [opts.contrast=1.4]    - 对比度增强倍数（1=不变，1.2~1.8 是合适范围）
 * @param {number} [opts.brightness=0]    - 亮度偏移（-50~50）
 * @param {boolean} [opts.binarize=true]  - OTSU 二值化（纯黑白，tesseract 最优输入）
 * @returns {Promise<Blob>} PNG blob（二值化后 PNG 更优）
 */
export async function cropAndPreprocess(src, cropRect, opts = {}) {
  const {
    maxWidth = 1200,
    grayscale = true,     // 默认灰度化（去除拍照随机色彩噪声）
    sharpen = false,      // 默认不锐化（可能放大噪声）
    contrast = 1.0,       // 默认不调对比度（保留原始灰度层次）
    brightness = 0,
    binarize = false,     // 默认不二值化（OTSU 在复杂票面背景上容易过黑或过白）
  } = opts

  const img = await loadImage(src)
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  // 将 0~1 比例映射到原始像素坐标
  const sx = Math.round(cropRect.x * iw)
  const sy = Math.round(cropRect.y * ih)
  const sw = Math.round(cropRect.w * iw)
  const sh = Math.round(cropRect.h * ih)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 输出尺寸：等比缩放到 maxWidth 以内
  const scale = Math.min(1, maxWidth / sw)
  const cw = Math.max(1, Math.round(sw * scale))
  const ch = Math.max(1, Math.round(sh * scale))
  canvas.width = cw
  canvas.height = ch

  // 高质量缩放
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)

  // 获取像素
  const imageData = ctx.getImageData(0, 0, cw, ch)
  const pixels = imageData.data

  // 1) 灰度化 — 所有后续步骤的基础
  if (grayscale) {
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2])
      pixels[i] = pixels[i + 1] = pixels[i + 2] = gray
    }
  }

  // 2) USM 锐化 — 增强文字边缘，对抗拍照模糊
  //    核心：原图 + (原图 - 模糊图) * amount
  if (sharpen) {
    applySharpen(imageData, cw, ch, { amount: 1.2 }) // amount 1.0~1.5 安全范围
  }

  // 3) 对比度增强 + 亮度调整
  //    简单线性公式：new = (old - 128) * contrast + 128 + brightness
  if (contrast !== 1 || brightness !== 0) {
    for (let i = 0; i < pixels.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        pixels[i + c] = clamp((pixels[i + c] - 128) * contrast + 128 + brightness)
      }
    }
  }

  // 4) OTSU 二值化 — 纯黑白，tesseract 最高识别率
  if (binarize) {
    applyOtsu(imageData, cw, ch)
  }

  ctx.putImageData(imageData, 0, 0)

  // 二值化后用 PNG 输出（无损），非二值化用 JPEG 节省体积
  const format = binarize ? 'image/png' : 'image/jpeg'
  const quality = binarize ? 1 : 0.9
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), format, quality)
  })
}

// ==================== 图像处理算法 ====================

/**
 * USM (Unsharp Mask) 锐化
 * 公式：sharpened = original + (original - blurred) * amount
 * 使用最简单的 3×3 均值模糊作为低通滤波
 */
function applySharpen(imageData, w, h, { amount = 1.0 } = {}) {
  const src = new Uint8ClampedArray(imageData.data)
  const pixels = imageData.data

  // 3×3 均值模糊核（近似 Gaussian）
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += src[((y + dy) * w + (x + dx)) * 4 + c]
          }
        }
        const blurred = sum / 9
        const sharp = src[idx + c] + (src[idx + c] - blurred) * amount
        pixels[idx + c] = clamp(sharp)
      }
    }
  }
}

/**
 * OTSU 全局阈值二值化
 * 自动计算最优阈值，将图像转为纯 0（黑）或 255（白）
 */
function applyOtsu(imageData, w, h) {
  const pixels = imageData.data
  const gray = new Uint8Array(w * h)

  // 提取灰度（取 R 通道，因已灰度化三者相同）
  for (let i = 0; i < w * h; i++) {
    gray[i] = pixels[i * 4]
  }

  // 计算直方图
  const hist = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++

  // OTSU 算法
  const total = gray.length
  let sumB = 0, wB = 0
  const sumTotal = hist.reduce((s, v, i) => s + v * i, 0)
  let maxVariance = 0, threshold = 128

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sumTotal - sumB) / wF
    const variance = wB * wF * (mB - mF) ** 2
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  // 应用阈值：≤threshold → 0（黑/文字），>threshold → 255（白/背景）
  for (let i = 0; i < pixels.length; i += 4) {
    const v = gray[i / 4] <= threshold ? 0 : 255
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v
  }
}

/** 仅预处理（不裁剪），适用于整图 OCR */
export async function preprocessFull(src, opts = {}) {
  const img = await loadImage(src)
  return cropAndPreprocess(src, {
    x: 0, y: 0, w: 1, h: 1,
  }, opts)
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)))
}

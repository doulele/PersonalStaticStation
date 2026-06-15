/**
 * 图片预处理工具 — 提升 OCR 识别准确率
 * 针对彩票号码图片优化：灰度化 → 对比度增强 → 锐化 → 二值化
 */

/**
 * 对图片进行 OCR 预处理，返回增强后的 base64
 * @param {string} dataUrl - 原始图片 data URL
 * @returns {Promise<string>} 增强后的 data URL
 */
export async function preprocessForOCR(dataUrl, options = {}) {
  const { binarize = false } = options  // 二值化默认关闭，避免丢失号码对比度信息
  const img = await loadImage(dataUrl)

  const iw = img.naturalWidth
  const ih = img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = iw
  canvas.height = ih
  const ctx = canvas.getContext('2d')

  // 绘制原图
  ctx.drawImage(img, 0, 0, iw, ih)
  let imageData = ctx.getImageData(0, 0, iw, ih)

  // 1) 灰度化
  toGrayscale(imageData)

  // 2) 对比度拉伸（CLAHE 简化版：截断 + 拉伸）
  contrastStretch(imageData, 2, 98)

  // 3) 锐化（Unsharp Mask 简化版）
  unsharpMask(imageData, iw, ih, 1.2, 1)

  // 4) 自适应二值化 — 默认关闭，对彩票彩色号码反而降低识别率
  if (binarize) {
    adaptiveThreshold(imageData, iw, ih)
  }

  ctx.putImageData(imageData, 0, 0)

  // 返回 PNG 无损格式，避免 JPEG 压缩伪影干扰 OCR
  return canvas.toDataURL('image/png')
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/**
 * 灰度化：加权平均法
 */
function toGrayscale(imageData) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
    // alpha 保持不变
  }
}

/**
 * 对比度拉伸：将像素分布映射到 0-255
 * @param {number} lowPct - 低百分位（低于此值的像素映射到0）
 * @param {number} highPct - 高百分位（高于此值的像素映射到255）
 */
function contrastStretch(imageData, lowPct = 2, highPct = 98) {
  const data = imageData.data
  const len = data.length / 4

  // 构建亮度直方图
  const hist = new Uint32Array(256)
  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]]++
  }

  // 找到 lowPct 和 highPct 对应的灰度值
  const total = len
  let sum = 0
  let lowVal = 0
  let highVal = 255

  for (let i = 0; i < 256; i++) {
    sum += hist[i]
    if (sum / total * 100 >= lowPct) {
      lowVal = i
      break
    }
  }

  sum = 0
  for (let i = 255; i >= 0; i--) {
    sum += hist[i]
    if (sum / total * 100 >= (100 - highPct)) {
      highVal = i
      break
    }
  }

  // 如果对比度已经很好，跳过
  if (highVal - lowVal < 30) return

  // 线性拉伸
  const range = highVal - lowVal
  if (range <= 0) return

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(((data[i] - lowVal) / range) * 255)
    const clamped = Math.max(0, Math.min(255, v))
    data[i] = data[i + 1] = data[i + 2] = clamped
  }
}

/**
 * 简化版 Unsharp Mask 锐化
 * 通过拉普拉斯算子增强边缘
 */
function unsharpMask(imageData, w, h, amount = 1.0, radius = 1) {
  const src = new Uint8ClampedArray(imageData.data)
  const data = imageData.data

  // 拉普拉斯核: [0,-1,0; -1,4,-1; 0,-1,0]
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const idx = (y * w + x) * 4

      const center = src[idx]
      const left = src[idx - 4]
      const right = src[idx + 4]
      const top = src[idx - w * 4]
      const bottom = src[idx + w * 4]

      // 拉普拉斯边缘检测
      const laplacian = 4 * center - left - right - top - bottom

      // 原始 + amount * 边缘
      const sharpened = center + amount * laplacian

      const clamped = Math.max(0, Math.min(255, Math.round(sharpened)))
      data[idx] = data[idx + 1] = data[idx + 2] = clamped
    }
  }
}

/**
 * 自适应二值化：基于局部均值的阈值处理
 * 让文字区域更清晰地呈现黑白
 */
function adaptiveThreshold(imageData, w, h) {
  const src = new Uint8ClampedArray(imageData.data)
  const data = imageData.data
  const blockSize = Math.max(8, Math.floor(Math.min(w, h) / 40)) // 自适应块大小
  const C = 8 // 阈值偏移

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // 计算局部均值
      const x0 = Math.max(0, x - Math.floor(blockSize / 2))
      const y0 = Math.max(0, y - Math.floor(blockSize / 2))
      const x1 = Math.min(w - 1, x + Math.floor(blockSize / 2))
      const y1 = Math.min(h - 1, y + Math.floor(blockSize / 2))

      let sum = 0
      let count = 0
      for (let by = y0; by <= y1; by++) {
        for (let bx = x0; bx <= x1; bx++) {
          sum += src[(by * w + bx) * 4]
          count++
        }
      }
      const mean = sum / count

      const pixel = src[idx]
      const threshold = mean - C

      if (pixel > threshold) {
        data[idx] = data[idx + 1] = data[idx + 2] = 255
      } else {
        data[idx] = data[idx + 1] = data[idx + 2] = 0
      }
    }
  }
}

<template>
  <div>
    <!-- 导出选项弹窗 -->
    <el-dialog v-model="visible" title="📤 导出分享" :width="dialogWidth" class="export-dialog">
      <div class="export-options">
        <div class="export-option" @click="copyText">
          <div class="option-icon copy-icon">📋</div>
          <div class="option-info">
            <span class="option-title">复制文字</span>
            <span class="option-desc">一键复制纯文本行程到剪贴板</span>
          </div>
        </div>
        <div class="export-option" :class="{ disabled: exportingImg }" @click="exportImage">
          <div class="option-icon img-icon">🖼️</div>
          <div class="option-info">
            <span class="option-title">生成图片</span>
            <span class="option-desc">捕获完整行程生成长图</span>
          </div>
          <span v-if="exportingImg" class="exporting-spin">⏳</span>
        </div>
        <div class="export-option" :class="{ disabled: exportingPdf }" @click="exportPDF">
          <div class="option-icon pdf-icon">📄</div>
          <div class="option-info">
            <span class="option-title">导出PDF</span>
            <span class="option-desc">生成A4格式PDF文档</span>
          </div>
          <span v-if="exportingPdf" class="exporting-spin">⏳</span>
        </div>
      </div>
      <div v-if="copySuccess" class="copy-success">✅ 已复制到剪贴板</div>
      <div v-if="isWeChat" class="wechat-hint">
        💡 微信中可生成图片后<span class="highlight">长按保存</span>
      </div>
    </el-dialog>

    <!-- 图片预览弹窗（微信中用于长按保存） -->
    <!-- 使用自定义 overlay 而非 el-dialog，避免 Element Plus 的 modal 遮罩层拦截微信长按手势 -->
    <Teleport to="body">
      <div v-if="showPreview" class="preview-overlay" @click.self="showPreview = false">
        <div class="preview-panel">
          <!-- 顶部栏 -->
          <div class="preview-topbar">
            <span class="preview-topbar-title">{{ previewTitle }}</span>
            <button class="preview-close-btn" @click="showPreview = false">✕</button>
          </div>
          <!-- 内容区 -->
          <div class="preview-container">
            <img
              v-if="previewImgSrc"
              :src="previewImgSrc"
              class="preview-img"
              alt="行程预览"
            />
            <iframe v-else-if="previewPdfSrc" :src="previewPdfSrc" class="preview-pdf" />
            <div v-else class="preview-loading">正在生成...</div>
          </div>
          <!-- 提示文字 -->
          <div class="preview-tips" v-if="isWeChat && previewImgSrc">
            👆 长按上方图片即可保存到相册或分享给朋友
          </div>
          <div class="preview-tips" v-else-if="isWeChat && previewPdfSrc">
            💡 请使用其他浏览器打开此页面以保存PDF，或点击"生成图片"后长按保存
          </div>
          <!-- 底部按钮 -->
          <div class="preview-actions">
            <el-button v-if="previewImgSrc && !isWeChat" type="primary" @click="downloadPreviewImg">保存图片</el-button>
            <el-button v-if="previewPdfSrc && !isWeChat" type="primary" @click="downloadPreviewPdf">下载PDF</el-button>
            <el-button @click="showPreview = false">关闭</el-button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const store = useStore()
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
const copySuccess = ref(false)
const exportingImg = ref(false)
const exportingPdf = ref(false)

// 图片/PDF 预览
const showPreview = ref(false)
const previewTitle = ref('')
const previewImgSrc = ref('')
const previewPdfSrc = ref('')
let previewBlob = null // 保存当前生成的 blob 用于下载

const timelineNodes = computed(() => store.state.plan.timelineNodes)
const planResult = computed(() => store.state.plan.planResult)

// ===== 弹窗宽度（响应式，手机端不超过屏幕） =====
const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '420px'
  return window.innerWidth < 480 ? '92vw' : '420px'
})

// ===== 检测是否微信浏览器 =====
const isWeChat = computed(() => {
  return /micromessenger/i.test(navigator.userAgent)
})

// ===== 构建纯文本行程 =====
function buildTextContent() {
  const lines = []
  const name = planResult.value?.summary?.attractionName || '旅行攻略'
  lines.push(`🏖️ ${name}`)
  lines.push('='.repeat(40))
  const days = planResult.value?.summary?.totalDays || 1
  const spots = planResult.value?.summary?.spotsCount || 0
  const foods = planResult.value?.summary?.foodsCount || 0
  const budget = planResult.value?.summary?.totalBudget || 0
  lines.push(`📅 共${days}天 | 🎫 ${spots}个景点 | 🍽️ ${foods}家美食`)
  lines.push(`💰 预估总预算: ¥${budget}`)
  lines.push('')

  const weather = store.state.plan.weatherData
  if (weather?.now) {
    lines.push(`🌤️ 天气: ${weather.now} ${weather.temp || ''}°C`)
  }
  if (weather?.daily?.length) {
    lines.push('📆 未来天气:')
    weather.daily.forEach(d => {
      lines.push(`  ${d.date || ''} ${d.dayWeather || ''} ${d.tempLow || ''}~${d.tempHigh || ''}°C`)
    })
  }
  lines.push('')

  let currentDay = 0
  for (const node of timelineNodes.value) {
    if (node.type === 'day_header') {
      currentDay = node.day
      lines.push(`\n📌 ${node.title}`)
      lines.push('-'.repeat(30))
      continue
    }
    if (node.type === 'hotel') {
      lines.push(`🏨 ${node.startTime} ${node.role === 'start' ? '出发' : '入住'} - ${node.data?.name || ''}`)
    } else if (node.type === 'spot') {
      const dur = node.stayDuration ? ` (${node.stayDuration}分钟)` : ''
      lines.push(`📍 ${node.startTime} ${node.data?.name || ''}${dur}`)
    } else if (node.type === 'food') {
      const meal = node.mealType === 'lunch' ? '午餐' : node.mealType === 'dinner' ? '晚餐' : '用餐'
      lines.push(`🍽️ ${node.startTime} [${meal}] ${node.data?.name || ''} ¥${node.data?.price_per_person || node.data?.avgPrice || 0}/人`)
    }
  }

  const notes = store.state.plan.nodeNotes
  if (notes && Object.keys(notes).length > 0) {
    lines.push('\n📝 备注:')
    for (const node of timelineNodes.value) {
      if (node.type === 'spot' && notes[node.id]) {
        lines.push(`  📍 ${node.data?.name || ''}: ${notes[node.id]}`)
      }
    }
  }

  lines.push('')
  lines.push('-- 由 AI 旅行规划助手生成 --')
  return lines.join('\n')
}

// ===== 复制文字（兼容微信的 fallback） =====
function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.style.top = '-9999px'
  ta.style.opacity = '0'
  ta.style.pointerEvents = 'none'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try {
    document.execCommand('copy')
    return true
  } catch {
    return false
  } finally {
    document.body.removeChild(ta)
  }
}

async function copyText() {
  try {
    const text = buildTextContent()
    // 优先尝试现代 clipboard API（需要 HTTPS 或 localhost）
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      copySuccess.value = true
      setTimeout(() => { copySuccess.value = false }, 2000)
      return
    }
    // 微信或非安全上下文：使用 fallback
    const ok = fallbackCopy(text)
    if (ok) {
      copySuccess.value = true
      setTimeout(() => { copySuccess.value = false }, 2000)
    } else {
      ElMessage.warning('复制失败，请手动选择文字复制')
    }
  } catch {
    // Clipboard API 失败，尝试 fallback
    try {
      const ok = fallbackCopy(buildTextContent())
      if (ok) {
        copySuccess.value = true
        setTimeout(() => { copySuccess.value = false }, 2000)
      } else {
        ElMessage.warning('复制失败，请手动选择文字复制')
      }
    } catch {
      ElMessage.warning('复制失败，请手动选择文字复制')
    }
  }
}

// ===== 捕获完整内容区域 =====
async function captureFullElement(el) {
  const html2canvas = (await import('html2canvas')).default

  // 收集需要临时隐藏的元素（backdrop-filter 等 html2canvas 不支持）
  const backdropEls = el.querySelectorAll('[style*="backdrop-filter"], .result-actions')
  const origDisplays = []
  backdropEls.forEach(e => {
    origDisplays.push({ el: e, display: e.style.display })
    e.style.display = 'none'
  })

  const origOverflow = el.style.overflow
  const origHeight = el.style.height
  const origMaxHeight = el.style.maxHeight

  // 临时展开全部内容
  el.style.overflow = 'visible'
  el.style.height = 'auto'
  el.style.maxHeight = 'none'
  void el.offsetHeight // 强制回流

  let canvas
  try {
    canvas = await html2canvas(el, {
      backgroundColor: '#f8fafc',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight
    })
  } finally {
    // 恢复样式
    el.style.overflow = origOverflow
    el.style.height = origHeight
    el.style.maxHeight = origMaxHeight
    // 恢复被隐藏的元素
    origDisplays.forEach(({ el: e, display }) => {
      e.style.display = display
    })
  }
  return canvas
}

// ===== 下载文件名 =====
const downloadFileName = computed(() => {
  const name = planResult.value?.summary?.attractionName || '旅行攻略'
  return `${name}_${new Date().toISOString().slice(0, 10)}`
})

// ===== 尝试下载（桌面端），微信中不触发下载 =====
function tryDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  if (isWeChat.value) {
    // 微信中不自动下载，改为预览
    return url
  }
  // 桌面端尝试下载
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
  return null
}

// ===== 生成图片 =====
async function exportImage() {
  if (exportingImg.value) return
  exportingImg.value = true
  try {
    const el = document.querySelector('.result-timeline-area')
    if (!el) {
      ElMessage.warning('未找到可导出的内容')
      return
    }
    const canvas = await captureFullElement(el)

    // 转 blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })

    previewBlob = blob
    previewImgSrc.value = URL.createObjectURL(blob)
    previewPdfSrc.value = ''
    previewTitle.value = '📸 行程预览（长按保存）'
    showPreview.value = true

    // 非微信环境尝试直接下载
    if (!isWeChat.value) {
      tryDownload(blob, `${downloadFileName.value}.png`)
    }
  } catch (err) {
    console.error('导出图片失败:', err)
    ElMessage.warning('图片生成失败，请使用"复制文字"方式导出')
  } finally {
    exportingImg.value = false
  }
}

// ===== 导出 PDF =====
async function exportPDF() {
  if (exportingPdf.value) return
  exportingPdf.value = true
  try {
    const el = document.querySelector('.result-timeline-area')
    if (!el) {
      ElMessage.warning('未找到可导出的内容')
      return
    }
    const canvas = await captureFullElement(el)
    const { jsPDF } = await import('jspdf')

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageHeight = 297
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = position - pageHeight
      pdf.addPage()
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const blob = pdf.output('blob')
    previewBlob = blob

    if (isWeChat.value) {
      // 微信中无法直接下载 PDF，生成图片预览代替
      previewPdfSrc.value = ''
      previewImgSrc.value = URL.createObjectURL(await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png')
      }))
      previewTitle.value = '📄 PDF已生成（请长按保存图片，或使用其他浏览器下载PDF）'
      showPreview.value = true
      ElMessage.info('微信中可长按保存预览图片，或复制链接到浏览器打开下载PDF')
    } else {
      // 桌面端：显示图片预览 + 提供 PDF 下载
      const pdfUrl = URL.createObjectURL(blob)
      previewPdfSrc.value = pdfUrl
      previewImgSrc.value = ''
      previewTitle.value = '📄 PDF预览'
      showPreview.value = true
      tryDownload(blob, `${downloadFileName.value}.pdf`)
    }
  } catch (err) {
    console.error('导出PDF失败:', err)
    ElMessage.warning('PDF生成失败，请使用"复制文字"方式导出')
  } finally {
    exportingPdf.value = false
  }
}

// ===== 预览弹窗中的下载按钮 =====
function downloadPreviewImg() {
  if (!previewBlob) return
  const url = URL.createObjectURL(previewBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${downloadFileName.value}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
  ElMessage.success('图片已保存')
}

function downloadPreviewPdf() {
  if (!previewBlob) return
  const url = URL.createObjectURL(previewBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${downloadFileName.value}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
  ElMessage.success('PDF已下载')
}
</script>

<style lang="scss" scoped>
.export-options { display: flex; flex-direction: column; gap: 10px; }
.export-option {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 12px;
  cursor: pointer; transition: all 0.2s;
  position: relative;
  &:hover { border-color: #6366f1; background: #f8fafc; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(99,102,241,0.1); }
  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
.option-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
.option-info { display: flex; flex-direction: column; gap: 3px; }
.option-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.option-desc { font-size: 12px; color: #94a3b8; }
.exporting-spin {
  position: absolute;
  right: 16px;
  font-size: 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.copy-success {
  margin-top: 12px; padding: 8px 12px;
  background: #f0fdf4; border-radius: 8px;
  text-align: center; font-size: 13px; color: #059669; font-weight: 500;
}

// ===== 微信提示 =====
.wechat-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  text-align: center;
  .highlight {
    color: #d97706;
    font-weight: 600;
  }
}

// ===== 预览自定义 Overlay（替代 el-dialog，避免微信长按被 modal 遮罩拦截） =====
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  touch-action: manipulation;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  width: 92vw;
  max-width: 500px;
  max-height: 92vh;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
  pointer-events: auto;
}

.preview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.preview-topbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.preview-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  line-height: 1;

  &:hover { background: #e2e8f0; color: #334155; }
  &:active { background: #cbd5e1; }
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 16px;
  pointer-events: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
}

.preview-img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  // === 微信长按保存的关键 CSS ===
  -webkit-touch-callout: default !important;
  user-select: auto !important;
  -webkit-user-select: auto !important;
  pointer-events: auto !important;
  touch-action: manipulation;
  -webkit-user-drag: auto;
}

.preview-pdf {
  width: 100%;
  min-height: 60vh;
  border: none;
  border-radius: 8px;
}

.preview-loading {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.preview-tips {
  margin: 0 16px 8px;
  padding: 10px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  color: #1e40af;
  font-weight: 500;
  flex-shrink: 0;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px 16px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

// 导出弹窗在手机端不超宽
::deep(.export-dialog) {
  .el-dialog {
    max-width: 100vw;
    margin: 0 auto;
  }
  .el-dialog__body {
    padding: 14px 12px;
  }
  .el-dialog__header {
    padding: 14px 12px 8px;
  }
}

// 响应式
@media (max-width: 768px) {
  .export-options { gap: 8px; }
  .export-option {
    gap: 10px; padding: 12px;
  }
  .option-icon { font-size: 24px; }
  .option-title { font-size: 14px; }
  .option-desc { font-size: 11px; }

  .preview-panel {
    width: 96vw;
    max-height: 88vh;
  }
  .preview-container {
    max-height: none;
  }
  .preview-pdf {
    height: 50vh;
  }
}

@media (max-width: 374px) {
  .export-option {
    padding: 10px; gap: 8px;
  }
  .option-icon { font-size: 22px; }
  .option-title { font-size: 13px; }
  .option-desc { font-size: 10px; }
}
</style>

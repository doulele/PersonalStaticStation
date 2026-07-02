<template>
  <el-dialog v-model="visible" title="📤 导出分享" width="420px" :close-on-click-modal="false">
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
  </el-dialog>
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

const timelineNodes = computed(() => store.state.plan.timelineNodes)
const planResult = computed(() => store.state.plan.planResult)

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

  // 获取天气信息
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

  // 备注
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

// ===== 复制文字 =====
async function copyText() {
  try {
    const text = buildTextContent()
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ===== 捕获完整内容区域（非仅视口） =====
async function captureFullElement(el) {
  const html2canvas = (await import('html2canvas')).default
  const origOverflow = el.style.overflow
  const origHeight = el.style.height
  const origMaxHeight = el.style.maxHeight

  // 临时展开全部内容
  el.style.overflow = 'visible'
  el.style.height = 'auto'
  el.style.maxHeight = 'none'

  // 强制回流
  el.offsetHeight

  let canvas
  try {
    canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    })
  } finally {
    // 恢复原始样式
    el.style.overflow = origOverflow
    el.style.height = origHeight
    el.style.maxHeight = origMaxHeight
  }
  return canvas
}

// ===== 生成图片（完整长图） =====
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
    const link = document.createElement('a')
    link.download = `${planResult.value?.summary?.attractionName || '旅行攻略'}_${new Date().toISOString().slice(0, 10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('长图已生成并下载')
  } catch (err) {
    console.error('导出图片失败:', err)
    ElMessage.warning('图片生成失败，请使用"复制文字"方式导出')
  } finally {
    exportingImg.value = false
  }
}

// ===== 导出 PDF（html2canvas 截图 + jspdf） =====
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

    const imgWidth = 210 // A4 width mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pdf = new jsPDF('p', 'mm', 'a4')

    // 如果图片高度超过一页，分页
    const pageHeight = 297 // A4 height mm
    let heightLeft = imgHeight
    let position = 0 // 页内偏移（mm）

    pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = position - pageHeight // 下一页偏上
      pdf.addPage()
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const title = planResult.value?.summary?.attractionName || '旅行攻略'
    pdf.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`)
    ElMessage.success('PDF 已生成并下载')
  } catch (err) {
    console.error('导出PDF失败:', err)
    ElMessage.warning('PDF生成失败，请使用"复制文字"方式导出')
  } finally {
    exportingPdf.value = false
  }
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
</style>

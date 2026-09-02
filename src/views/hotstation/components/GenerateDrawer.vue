<template>
  <el-drawer
    :model-value="modelValue"
    :size="drawerWidth"
    :title="`内容生成 · ${event?.title || ''}`"
    append-to-body
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="hs-drawer" data-hs-drawer>
      <!-- AI 消耗提示 -->
      <div v-if="isAdmin" class="ai-cost-banner">
        <el-icon><Lightning /></el-icon>
        <span>以下生成 / 语感提取由 DeepSeek 大模型实时执行，将消耗 Token 配额</span>
      </div>
      <!-- 四层配置 -->
      <el-collapse v-model="activeCollapse">
        <!-- 第一层：输出模式 -->
        <el-collapse-item name="mode">
          <template #title><span class="layer-title">① 输出模式</span></template>
          <div class="mode-grid">
            <div
              v-for="m in MODES"
              :key="m.key"
              class="mode-item"
              :class="{ active: form.mode === m.key }"
              @click="form.mode = m.key"
            >
              <div class="mode-name">{{ m.name }}</div>
              <div class="mode-desc">{{ m.desc }}</div>
              <div class="mode-len">{{ m.len }}</div>
            </div>
          </div>
        </el-collapse-item>

        <!-- 第二层：风格坐标轴 -->
        <el-collapse-item name="style">
          <template #title><span class="layer-title">② 风格坐标轴</span></template>
          <div class="axis-row">
            <span class="axis-label axis-left">冷静客观</span>
            <el-slider v-model="form.style.temperature" :min="0" :max="100" />
            <span class="axis-label axis-right">活泼吐槽</span>
          </div>
          <div class="axis-desc">X 轴 · 表达温度：{{ temperatureDesc }}</div>
          <div class="axis-row" style="margin-top: 6px">
            <span class="axis-label axis-left">极简干货</span>
            <el-slider v-model="form.style.density" :min="0" :max="100" />
            <span class="axis-label axis-right">故事煽情</span>
          </div>
          <div class="axis-desc">Y 轴 · 叙事密度：{{ densityDesc }}</div>
          <div class="persona-tip" v-if="persona">
            当前风格接近：<b>{{ persona.label }}</b>（{{ persona.desc }}）
          </div>
        </el-collapse-item>

        <!-- 第三层：平台适配 -->
        <el-collapse-item name="platform">
          <template #title><span class="layer-title">③ 平台适配</span></template>
          <el-radio-group v-model="form.platform" class="platform-group">
            <el-radio-button v-for="p in PLATFORMS" :key="p" :label="p">{{ p }}</el-radio-button>
          </el-radio-group>
        </el-collapse-item>

        <!-- 第四层：高级锚点 -->
        <el-collapse-item name="anchors">
          <template #title><span class="layer-title">④ 高级锚点</span></template>
          <div class="anchor-block">
            <div class="anchor-title">语感克隆 <span class="anchor-tip">粘贴 2-5 条目标博主标题，每行一条</span></div>
            <el-input
              v-model="form.anchors.titlesText"
              type="textarea"
              :rows="3"
              placeholder="例如：&#10;为什么年轻人开始反向消费？&#10;2026年，普通人最后的机会"
              resize="none"
            />
            <el-button v-if="isAdmin" size="small" type="primary" plain :loading="extracting" style="margin-top: 8px" @click="extractFormula">
              提取标题公式
            </el-button>
            <div v-if="formula" class="formula-result">
              <div class="formula-title"><el-icon style="margin-right: 4px"><TrendCharts /></el-icon>标题公式</div>
              <div>{{ formula.formula }}</div>
              <div class="formula-note">语感特征：{{ formula.style_note }}</div>
            </div>
          </div>
          <div class="anchor-block">
            <div class="anchor-title">参考样稿 <span class="anchor-tip">粘贴完整参考文章，提取语感特征</span></div>
            <el-input
              v-model="form.anchors.sample"
              type="textarea"
              :rows="3"
              placeholder="粘贴一篇你喜欢的文章全文…"
              resize="none"
            />
            <el-button v-if="isAdmin" size="small" type="primary" plain :loading="extractingSample" style="margin-top: 8px" @click="extractSample">
              提取语感特征
            </el-button>
            <div v-if="form.anchors.styleNote" class="formula-result">
              <div class="formula-title"><el-icon style="margin-right: 4px"><EditPen /></el-icon>语感特征</div>
              <div>{{ form.anchors.styleNote }}</div>
            </div>
          </div>
          <div class="anchor-block">
            <div class="anchor-title">受众指定 <span class="anchor-tip">如：写给理财小白 / 面向大学生</span></div>
            <el-input v-model="form.anchors.audience" placeholder="例如：写给理财小白" clearable />
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 生成/预览 -->
      <div class="drawer-footer">
        <div v-if="!isAdmin" class="admin-only-tip"><el-icon style="margin-right: 4px"><Lock /></el-icon>该功能为主编工作台专属，登录后即可使用</div>
        <el-button
          type="primary"
          size="large"
          class="gen-btn"
          :disabled="!isAdmin || generating"
          :loading="generating"
          @click="doGenerate"
        >
          {{ generating ? `生成中（5-15秒）…` : '确认生成' }}
        </el-button>
      </div>

      <!-- 结果区 -->
      <div v-if="result" class="result-area" data-hs-result>
        <el-tabs v-model="resultTab">
          <el-tab-pane label="纯文本提示词" name="text">
            <pre class="result-text">{{ result.content }}</pre>
          </el-tab-pane>
          <el-tab-pane v-if="form.mode === 'video'" label="分镜表格" name="table">
            <el-table :data="tableRows" border size="small" max-height="360">
              <el-table-column prop="num" label="#" width="44" />
              <el-table-column prop="画面" label="画面" min-width="140" />
              <el-table-column prop="旁白" label="旁白" min-width="200" />
              <el-table-column prop="字幕" label="字幕" min-width="140" />
              <el-table-column prop="时长" label="时长" width="64" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="精简复制版" name="plain">
            <pre class="result-text">{{ plainText }}</pre>
          </el-tab-pane>
        </el-tabs>
        <div class="result-actions">
          <el-button type="primary" plain @click="copyResult"><el-icon style="margin-right: 4px"><CopyDocument /></el-icon>一键复制</el-button>
          <el-tag v-if="result.tokens" size="small" type="info">消耗 {{ result.tokens }} tokens</el-tag>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'
import { generate, extractTitleFormula, extractSampleStyle } from '@/api/hotstation'
import { TrendCharts, EditPen, Lock, CopyDocument, Lightning } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  event: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const store = useStore()
const isAdmin = computed(() => store.getters['auth/isLoggedIn'])

const MODES = [
  { key: 'brief', name: '资讯快报', desc: '纯文本短文', len: '~300字' },
  { key: 'deep', name: '深度长文', desc: '结构化长文', len: '2000-3000字' },
  { key: 'video', name: '短视频脚本', desc: '分镜表格', len: '60-120秒' },
  { key: 'xhs', name: '小红书笔记', desc: '图文种草', len: '~500字' },
  { key: 'podcast', name: '播客双人对谈', desc: '分角色台本', len: '5-8分钟' }
]
const PLATFORMS = ['公众号', '知乎', 'B站专栏', '小红书', '抖音']

const PERSONAS = [
  { x: 80, y: 80, label: '半佛仙人', desc: '吐槽+故事' },
  { x: 20, y: 20, label: '人民日报评论', desc: '客观+干货' },
  { x: 20, y: 80, label: '罗翔说刑法', desc: '冷静+故事' },
  { x: 50, y: 50, label: '回形针', desc: '中庸+干货' },
  { x: 90, y: 30, label: '毕导', desc: '活泼+干货' },
  { x: 10, y: 90, label: '李诞脱口秀', desc: '吐槽+煽情' },
  { x: 60, y: 15, label: '虎嗅', desc: '中性+干货' },
  { x: 30, y: 40, label: '三联生活周刊', desc: '温和+故事' }
]

const activeCollapse = ref(['mode'])
const form = ref({
  mode: 'brief',
  style: { temperature: 50, density: 50 },
  platform: '公众号',
  anchors: { titlesText: '', sample: '', audience: '', styleNote: '' }
})
const formula = ref(null)
const extracting = ref(false)
const extractingSample = ref(false)
const generating = ref(false)
const result = ref(null)
const resultTab = ref('text')

const drawerWidth = computed(() => (window.innerWidth < 768 ? '100%' : '560px'))

const persona = computed(() => {
  const { temperature, density } = form.value.style
  let best = null
  let bestDist = Infinity
  for (const p of PERSONAS) {
    const d = Math.sqrt((p.x - temperature) ** 2 + (p.y - density) ** 2)
    if (d < bestDist) { bestDist = d; best = p }
  }
  return best
})

const temperatureDesc = computed(() => {
  const t = form.value.style.temperature
  if (t < 25) return '冷静客观，措辞中性'
  if (t < 50) return '温和克制，适当留白'
  if (t < 75) return '轻松自然，带点网感'
  return '活泼吐槽，情绪饱满'
})
const densityDesc = computed(() => {
  const d = form.value.style.density
  if (d < 25) return '极简干货，信息密度高'
  if (d < 50) return '干货为主，少量故事点缀'
  if (d < 75) return '故事穿插，深入浅出'
  return '故事煽情，情绪驱动'
})

const tableRows = computed(() => {
  if (form.value.mode !== 'video' || !result.value) return []
  const lines = result.value.content.split('\n').filter(l => l.trim().startsWith('|'))
  const header = lines[0]
  if (!header) return []
  const cols = header.split('|').filter(c => c.trim()).map(c => c.trim())
  const rows = []
  lines.slice(2).forEach((l, i) => {
    const cells = l.split('|').filter(c => c.trim()).map(c => c.trim())
    const row = { num: i + 1 }
    cols.forEach((c, ci) => { row[c] = cells[ci] || '' })
    rows.push(row)
  })
  return rows
})

const plainText = computed(() => {
  if (!result.value) return ''
  return result.value.content
    .replace(/[#*`>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
})

async function extractFormula() {
  const titles = form.value.anchors.titlesText.split('\n').map(t => t.trim()).filter(Boolean)
  if (titles.length < 2) return ElMessage.warning('请至少粘贴 2 条标题')
  extracting.value = true
  try {
    const res = await extractTitleFormula(titles)
    formula.value = res.data
    if (formula.value.temperature_hint !== undefined) form.value.style.temperature = formula.value.temperature_hint
    if (formula.value.density_hint !== undefined) form.value.style.density = formula.value.density_hint
    ElMessage.success('标题公式提取完成')
  } catch (e) {
    ElMessage.error(e.message || '提取失败')
  } finally {
    extracting.value = false
  }
}

async function extractSample() {
  if (!form.value.anchors.sample) return ElMessage.warning('请先粘贴参考文章')
  extractingSample.value = true
  try {
    const res = await extractSampleStyle(form.value.anchors.sample)
    form.value.anchors.styleNote = res.data.style_note || res.data.styleNote || JSON.stringify(res.data)
    ElMessage.success('语感特征提取完成')
  } catch (e) {
    ElMessage.error(e.message || '提取失败')
  } finally {
    extractingSample.value = false
  }
}

async function doGenerate() {
  if (!props.event) return
  generating.value = true
  result.value = null
  try {
    const res = await generate({
      eventId: props.event.id,
      mode: form.value.mode,
      styleConfig: { temperature: form.value.style.temperature, density: form.value.style.density },
      platform: form.value.platform,
      anchors: {
        styleNote: form.value.anchors.styleNote,
        audience: form.value.anchors.audience,
        titles: form.value.anchors.titlesText.split('\n').filter(Boolean)
      }
    })
    result.value = { content: res.data.content, tokens: res.data.totalTokens }
    resultTab.value = 'text'
    ElMessage.success('生成完成')
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  } finally {
    generating.value = false
  }
}

function copyResult() {
  const text = resultTab.value === 'plain' ? plainText.value : result.value.content
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制到剪贴板'))
}

watch(() => props.modelValue, v => {
  if (v) { result.value = null; form.value.mode = 'brief' }
})
</script>

<style lang="scss">
/* 生成抽屉样式（非 scoped + append-to-body，自带 CSS 变量兜底，自动适配深浅色） */
[data-hs-drawer] {
  --hs-bg: var(--surface-bg);
  --hs-surface: var(--el-bg-color);
  --hs-border: var(--surface-border);
  --hs-text: var(--heading-color);
  --hs-text-2: var(--muted-color);
  --hs-text-3: var(--muted-color-light);
  --hs-accent: var(--nav-active-color);
  --hs-pill-bg: var(--toggle-bg);
  --hs-pill-border: var(--toggle-border);
  --hs-pill-text: var(--muted-color);
  --hs-track: var(--surface-border);
  --hs-dot: var(--muted-color-light);
  --hs-dot-active: var(--nav-active-color);

  display: flex; flex-direction: column; gap: 12px; height: 100%; overflow-y: auto;
}
.layer-title { font-weight: 600; font-size: 14px; }
.mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.mode-item {
  border: 1px solid var(--hs-border);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-item:hover { border-color: var(--hs-accent); }
.mode-item.active { border-color: var(--hs-accent); background: var(--toggle-hover-bg); }
.mode-name { font-weight: 600; font-size: 13px; }
.mode-desc { font-size: 12px; color: var(--hs-text-3); margin: 2px 0; }
.mode-len { font-size: 11px; color: var(--hs-accent); }
.axis-row { display: flex; align-items: center; gap: 8px; }
.axis-row .el-slider { flex: 1; }
.axis-label { font-size: 12px; color: var(--hs-text-3); white-space: nowrap; }
.axis-desc { font-size: 12px; color: var(--hs-text-2); text-align: center; }
.persona-tip {
  margin-top: 8px; padding: 8px 12px;
  background: var(--toggle-hover-bg); border-radius: 8px;
  font-size: 13px; color: var(--toggle-color);
}
.platform-group { display: flex; flex-wrap: wrap; gap: 8px; }
.anchor-block { margin-bottom: 12px; }
.anchor-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.anchor-tip { font-size: 12px; color: var(--hs-text-3); font-weight: 400; }
.formula-result {
  margin-top: 8px; padding: 10px;
  background: var(--tag-bg); border: 1px solid var(--tag-color); border-radius: 8px;
  font-size: 13px; color: var(--tag-color); line-height: 1.6;
}
.formula-title { font-weight: 600; margin-bottom: 4px; }
.formula-note { margin-top: 4px; font-size: 12px; color: var(--hs-text-3); }
.drawer-footer { padding-top: 8px; }
.admin-only-tip {
  font-size: 13px; color: var(--tag-color);
  text-align: center; margin-bottom: 8px;
}
.ai-cost-banner {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 12px; line-height: 1.5; color: var(--tag-color);
  background: color-mix(in srgb, var(--tag-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--tag-color) 22%, transparent);
  border-radius: 6px; padding: 7px 10px; margin-bottom: 12px;
}
.ai-cost-banner .el-icon { margin-top: 2px; }
.gen-btn { width: 100%; }
.result-area { margin-top: 12px; }
.result-text {
  white-space: pre-wrap;
  font-size: 13px; line-height: 1.7;
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: 8px;
  padding: 12px;
  max-height: 50vh; overflow: auto;
  margin: 0; font-family: inherit;
  color: var(--hs-text-2);
}
.result-actions { margin-top: 10px; display: flex; align-items: center; gap: 10px; }

@media (max-width: 768px) {
  .mode-grid { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="overview-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <div class="page-title-wrap">
        <h1 class="page-title">技能全景</h1>
        <span class="page-sub">指纹 × 地图 · 能力分析</span>
      </div>
      <!-- 统计概览 -->
      <div class="stats">
        <div class="stat-item">
          <b>{{ stats.total }}</b><span>总节点</span>
        </div>
        <div class="stat-item">
          <b>{{ stats.learned }}</b><span>已掌握</span>
        </div>
        <div class="stat-item">
          <b>{{ stats.percent }}%</b><span>掌握率</span>
        </div>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="view-tab"
        :class="{ active: view === t.key }"
        @click="switchView(t.key)"
      >
        <span class="view-tab-icon">{{ t.icon }}</span>
        <span class="view-tab-name">{{ t.name }}</span>
        <span class="view-tab-desc">{{ t.desc }}</span>
      </button>
    </div>

    <!-- 图谱视图：螺旋指纹 -->
    <div v-if="view === 'spiral'" class="panel">
      <div class="panel-head">
        <p class="panel-desc">{{ viewDetail }}</p>
        <div class="panel-controls">
          <el-checkbox v-model="showEdges" size="small">依赖连线</el-checkbox>
          <el-checkbox v-model="showBg" size="small">指纹背景</el-checkbox>
        </div>
      </div>
      <p class="chart-tip">● 彩色 = 已掌握　○ 灰色 = 未点亮（点击节点开始学习）</p>
      <div v-loading="loadingNodes" ref="graphRef" class="chart graph-chart"></div>
    </div>

    <!-- 雷达视图 -->
    <div v-else-if="view === 'radar'" class="panel">
      <div class="panel-head">
        <p class="panel-desc">15 个知识分类的能力分布，直观对比各方向掌握程度。</p>
      </div>
      <div v-loading="loadingRadar" ref="radarRef" class="chart radar-chart"></div>
    </div>

    <!-- 成长曲线视图 -->
    <div v-else class="panel">
      <div class="panel-head">
        <p class="panel-desc">点亮节点与答题量的时间趋势。</p>
        <el-radio-group v-model="range" size="small" @change="loadGrowth">
          <el-radio-button value="week">近 7 天</el-radio-button>
          <el-radio-button value="month">近 30 天</el-radio-button>
        </el-radio-group>
      </div>
      <div v-loading="loadingGrowth" ref="growthRef" class="chart growth-chart"></div>
    </div>

    <!-- 知识点学习卡片 -->
    <KnowledgeCard
      v-model:visible="cardVisible"
      :node-id="currentNodeId"
      :all-nodes="nodes"
      @learned="onLearned"
      @switch-node="onSwitchNode"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import * as echarts from 'echarts'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getNodes, getRadar, getGrowth } from '@/api/knowledgeGraph'
import { CATEGORIES } from '../data/categories'
import KnowledgeCard from '../components/KnowledgeCard.vue'

const router = useRouter()
const store = useStore()

const graphRef = ref(null)
const radarRef = ref(null)
const growthRef = ref(null)
const view = ref('spiral')
const showEdges = ref(true)
const showBg = ref(true)
const range = ref('week')
const loadingNodes = ref(false)
const loadingRadar = ref(false)
const loadingGrowth = ref(false)

const nodes = ref([])
const cardVisible = ref(false)
const currentNodeId = ref('')

let graphChart = null
let radarChart = null
let growthChart = null
let themeObserver = null
let sizeObserver = null

// ================= 常量 =================
const catById = new Map(CATEGORIES.map(c => [c.id, c]))
const catColor = cid => catById.get(cid)?.color || '#6366f1'

const TABS = [
  { key: 'spiral', icon: '🌀', name: '螺旋指纹', desc: '旋涡式脉络' },
  { key: 'radar', icon: '📊', name: '能力雷达', desc: '分类对比' },
  { key: 'growth', icon: '📈', name: '成长曲线', desc: '时间趋势' }
]
const viewDetail = '节点沿螺旋臂从中心旋出，弧线如指纹脊线。'

// ================= 数据 =================
const learnedIds = computed(() => store.getters['frontendDev/learnedIds'])

const stats = computed(() => {
  const total = nodes.value.length
  const learned = nodes.value.filter(n => learnedIds.value.includes(n.id)).length
  return { total, learned, percent: total ? Math.round(learned / total * 100) : 0 }
})

const edges = computed(() => {
  const ids = new Set(nodes.value.map(n => n.id))
  return nodes.value.flatMap(n =>
    (n.deps || []).filter(d => ids.has(d)).map(d => ({ source: d, target: n.id }))
  )
})

// 各分类末端节点（sort 最大者），作为螺旋臂最外端，锚定分类标签（朝外避免重叠）
const catTailIds = computed(() => {
  const tails = new Map()
  nodes.value.forEach(n => {
    const cur = tails.get(n.cat)
    if (!cur || (n.sort || 0) > (cur.sort || 0)) tails.set(n.cat, n)
  })
  return new Set([...tails.values()].map(n => n.id))
})

async function loadNodes() {
  loadingNodes.value = true
  try {
    const res = await getNodes() // 不带 cat → 全量
    if (res.success) nodes.value = res.data || []
  } finally {
    loadingNodes.value = false
  }
}

// ================= 布局算法（容器中心像素坐标） =================
function getSize(el) {
  const w = el?.offsetWidth || 1000
  const h = el?.offsetHeight || 640
  return { w, h, cx: w / 2, cy: h / 2, radius: Math.min(w, h) / 2 * 0.86 }
}

// 螺旋臂扭转幅度（单位：个扇区宽度），值越大弧线越弯，螺旋感越强
const SPIRAL_TWIST = 1.5

function spiralLayout() {
  const { cx, cy, radius } = getSize(graphRef.value)
  const n = CATEGORIES.length
  const angleStep = (Math.PI * 2) / n
  const inner = radius * 0.14
  const outer = radius * 0.70
  const map = {}
  // 每个分类一条螺旋臂，从中心向外沿弧线弯曲（指纹斗形纹涡旋感）
  CATEGORIES.forEach((c, ci) => {
    const catNodes = nodes.value.filter(x => x.cat === c.id).sort((a, b) => (a.sort || 0) - (b.sort || 0))
    const baseAngle = -Math.PI / 2 + ci * angleStep
    catNodes.forEach((node, j) => {
      const frac = catNodes.length > 1 ? j / (catNodes.length - 1) : 0
      const r = inner + (outer - inner) * frac
      const angle = baseAngle + frac * angleStep * SPIRAL_TWIST
      map[node.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle, r }
    })
  })
  return map
}

// 螺旋臂弧线采样点（布局与背景共用，保证节点落在弧线上）
function armArcPoints(cx, cy, radius, baseAngle, inner = 0.14, outer = 0.70, samples = 20) {
  const angleStep = (Math.PI * 2) / CATEGORIES.length
  const pts = []
  for (let s = 0; s <= samples; s++) {
    const t = s / samples
    const r = radius * (inner + (outer - inner) * t)
    const a = baseAngle + t * angleStep * SPIRAL_TWIST
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

// 标签径向朝外定位（屏幕坐标：sin 正值为下方）
function outwardPosition(angle) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  if (Math.abs(c) >= Math.abs(s)) return c >= 0 ? 'right' : 'left'
  return s >= 0 ? 'bottom' : 'top'
}

// ================= 图谱渲染 =================
function isDark() { return document.documentElement.classList.contains('dark-mode') }

function buildGraphOption(posMap) {
  const dark = isDark()
  const { w } = getSize(graphRef.value)
  const compact = w < 600
  const tiny = w < 400
  const sizeScale = tiny ? 0.55 : compact ? 0.75 : 1
  const dimFill = dark ? '#475569' : '#cbd5e1'
  const links = showEdges.value ? edges.value.map(e => ({
    source: e.source,
    target: e.target,
    lineStyle: { color: dark ? '#3b3b5e' : '#cbd5e1', width: 1, curveness: 0.2, opacity: 0.6 }
  })) : []

  const graphic = showBg.value ? buildBg(dark) : [] // 指纹背景

  return {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: p => {
        if (p.dataType !== 'node') return ''
        const d = p.data
        return `<b>${d.name}</b><br/>分类：${catById.get(d.catId)?.name || d.catId}<br/>难度：Lv${d.level}<br/>状态：${d.learned ? '✅ 已掌握' : '○ 未点亮'}`
      }
    },
    graphic,
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: true,
      labelLayout: { hideOverlap: true },
      data: nodes.value.map(n => {
        const p = posMap[n.id]
        const c = catColor(n.cat)
        const learned = learnedIds.value.includes(n.id)
        const baseSize = nodes.value.length > 300 ? 5 + n.level * 1.5 : nodes.value.length > 150 ? 7 + n.level * 2 : 9 + n.level * 3
        const size = Math.max(3, Math.round(baseSize * sizeScale))
        return {
          id: n.id,
          name: n.name,
          x: p.x,
          y: p.y,
          symbolSize: size,
          itemStyle: {
            // 已掌握 = 分类色实心点亮；未掌握 = 柔和灰点（去掉彩色描边，避免“空心环”感）
            color: learned ? c : dimFill,
            borderWidth: 0,
            shadowBlur: learned ? (compact ? 5 : 9) : 0,
            shadowColor: c + '55',
            opacity: learned ? 1 : 0.9
          },
          label: {
            // 螺旋：仅末端节点显示分类名（朝外避免重叠）
            show: view.value === 'spiral' && catTailIds.value.has(n.id),
            formatter: catById.get(n.cat)?.name || '',
            // 按角度朝外
            position: outwardPosition(p.angle || 0),
            distance: tiny ? 6 : compact ? 8 : 10,
            fontSize: compact ? 10 : 12,
            // 文字颜色与所属分类节点颜色一致
            color: c,
            fontWeight: 600
          },
          catId: n.cat,
          level: n.level,
          learned
        }
      }),
      links,
      emphasis: { focus: 'adjacency', lineStyle: { width: 2 } }
    }]
  }
}

// m：roam 跟随矩阵 [a,b,c,d,e,f]（null=未缩放），使背景与节点同步缩放/平移
function buildBg(dark, m = null) {
  const { cx, cy, radius } = getSize(graphRef.value)
  const tr = (x, y) => m ? [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]] : [x, y]
  const scale = m ? Math.hypot(m[0], m[1]) : 1
  const g = []
  if (view.value === 'spiral') {
    const ringColor = dark ? 'rgba(148,163,184,0.09)' : 'rgba(100,116,139,0.11)'
    const arcColor = dark ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.16)'
    const [ocx, ocy] = tr(cx, cy)
    // 同心圆（加密，营造斗形纹涡旋中心）
    for (let r = radius * 0.10; r <= radius * 0.86; r += radius * 0.09) {
      g.push({ type: 'circle', shape: { cx: ocx, cy: ocy, r: r * scale }, style: { fill: 'none', stroke: ringColor, lineWidth: 1 } })
    }
    // 15 条螺旋弧线（与节点臂对齐，同向弯曲 → 指纹斗形纹）
    const angleStep = (Math.PI * 2) / CATEGORIES.length
    for (let i = 0; i < CATEGORIES.length; i++) {
      const baseAngle = -Math.PI / 2 + i * angleStep
      const pts = armArcPoints(cx, cy, radius, baseAngle).map(([x, y]) => tr(x, y))
      g.push({ type: 'polyline', shape: { points: pts }, style: { stroke: arcColor, lineWidth: 1.4, fill: 'none' } })
    }
    // 中心原点
    g.push({ type: 'circle', shape: { cx: ocx, cy: ocy, r: 5 * scale }, style: { fill: 'transparent', stroke: dark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.35)', lineWidth: 1.5 } })
  }
  return g
}

// 背景 roam 跟随矩阵（与 graph 的 view 坐标系变换保持一致，null=未缩放）
let bgRoamMatrix = null

function onGraphRoam(params) {
  if (!showBg.value) return
  if (!bgRoamMatrix) bgRoamMatrix = [1, 0, 0, 1, 0, 0]
  if (params.zoom != null && params.zoom !== 1) {
    // 以 (originX, originY) 为中心缩放：M' = T(o)·S(z)·T(-o)·M
    const z = params.zoom, ox = params.originX, oy = params.originY
    const m = bgRoamMatrix
    bgRoamMatrix = [z * m[0], z * m[1], z * m[2], z * m[3], ox * (1 - z) + z * m[4], oy * (1 - z) + z * m[5]]
  } else if (params.dx || params.dy) {
    bgRoamMatrix[4] += params.dx
    bgRoamMatrix[5] += params.dy
  }
  graphChart.setOption({ graphic: { elements: buildBg(isDark(), bgRoamMatrix) } })
}

function renderGraph() {
  if (!graphRef.value || !nodes.value.length) return
  if (!graphChart) graphChart = echarts.init(graphRef.value)
  const posMap = spiralLayout()
  try {
    graphChart.setOption(buildGraphOption(posMap), true)
  } catch (e) {
    console.error('[技能全景] 图谱渲染失败', e)
  }
  bgRoamMatrix = null
  graphChart.off('graphRoam')
  graphChart.on('graphRoam', onGraphRoam)
  graphChart.off('click')
  graphChart.on('click', params => {
    if (params.dataType === 'node' && params.data?.id) {
      currentNodeId.value = params.data.id
      cardVisible.value = true
    }
  })
}

// ================= 雷达渲染 =================
async function loadRadar() {
  loadingRadar.value = true
  try {
    const res = await getRadar()
    if (!res.success || !radarRef.value) return
    const data = res.data || {}
    if (!radarChart) radarChart = echarts.init(radarRef.value)
    radarChart.setOption({
      tooltip: {},
      radar: {
        indicator: CATEGORIES.map(c => ({ name: c.name, max: 100 })),
        radius: '65%',
        axisName: { color: isDark() ? '#94a3b8' : '#475569', fontSize: 12 },
        splitArea: { areaStyle: { color: isDark() ? ['#1e1e2e', '#232338'] : ['#fff', '#f8fafc'] } },
        splitLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } },
        axisLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } }
      },
      series: [{
        type: 'radar',
        data: [{
          value: CATEGORIES.map(c => data[c.id]?.percent || 0),
          name: '能力分布',
          areaStyle: { color: 'rgba(99, 102, 241, 0.3)' },
          lineStyle: { color: '#6366f1', width: 2 },
          itemStyle: { color: '#8b5cf6' }
        }]
      }]
    }, true)
  } finally {
    loadingRadar.value = false
  }
}

// ================= 成长曲线 =================
async function loadGrowth() {
  loadingGrowth.value = true
  try {
    const res = await getGrowth(range.value)
    if (!res.success || !growthRef.value) return
    const data = res.data || []
    if (!growthChart) growthChart = echarts.init(growthRef.value)
    growthChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['点亮节点', '答题数'], top: 10, left: 'center', itemGap: 20, textStyle: { color: isDark() ? '#94a3b8' : '#475569' } },
      grid: { left: 50, right: 30, top: 50, bottom: 40 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.date.slice(5)),
        axisLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } },
        axisLabel: { color: isDark() ? '#94a3b8' : '#64748b' }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } },
        axisLabel: { color: isDark() ? '#94a3b8' : '#64748b' }
      },
      series: [
        { name: '点亮节点', type: 'line', smooth: true, data: data.map(d => d.learned), itemStyle: { color: '#6366f1' }, areaStyle: { color: 'rgba(99,102,241,0.15)' } },
        { name: '答题数', type: 'line', smooth: true, data: data.map(d => d.answered), itemStyle: { color: '#22c55e' } }
      ]
    }, true)
  } finally {
    loadingGrowth.value = false
  }
}

// ================= 交互 =================
function switchView(key) {
  view.value = key
  nextTick(async () => {
    if (key === 'spiral') {
      renderGraph()
    } else if (key === 'radar') {
      // DOM 为条件渲染，首次切换时懒加载
      await loadRadar()
      radarChart?.resize()
    } else {
      await loadGrowth()
      growthChart?.resize()
    }
  })
}

function onLearned() {
  store.dispatch('frontendDev/loadProgress')
  renderGraph()
}

function onSwitchNode(id) {
  currentNodeId.value = id
}

function goBack() { router.push('/study/frontend-dev') }

watch([showEdges, showBg], () => renderGraph())
watch(() => nodes.value.length, () => renderGraph())
// 掌握状态变化 → 图谱实时重绘（点亮/熄灭）
watch(learnedIds, () => renderGraph(), { deep: true })

// ================= 生命周期 =================
onMounted(async () => {
  store.dispatch('frontendDev/loadProgress')
  await nextTick()
  // 默认视图为图谱，仅预加载节点数据；雷达/曲线切换时懒加载
  await loadNodes()
  renderGraph()

  // 主题切换自动重渲染（雷达/曲线仅在已加载时刷新）
  themeObserver = new MutationObserver(() => {
    if (view.value === 'spiral') renderGraph()
    else if (view.value === 'radar') { if (radarChart) loadRadar() }
    else if (growthChart) loadGrowth()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // 容器尺寸变化（图谱为像素布局，需整体重算）
  sizeObserver = new ResizeObserver(() => {
    if (view.value === 'spiral') renderGraph()
    else if (view.value === 'radar') radarChart?.resize()
    else growthChart?.resize()
  })
  if (graphRef.value) sizeObserver.observe(graphRef.value)
  if (radarRef.value) sizeObserver.observe(radarRef.value)
  if (growthRef.value) sizeObserver.observe(growthRef.value)
  // 窗口级兜底（雷达/曲线 DOM 为条件渲染，切回时 resize）
  window.addEventListener('resize', handleWindowResize)
})

function handleWindowResize() {
  if (view.value === 'spiral') renderGraph()
  else if (view.value === 'radar') radarChart?.resize()
  else growthChart?.resize()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  themeObserver?.disconnect()
  sizeObserver?.disconnect()
  graphChart?.dispose()
  radarChart?.dispose()
  growthChart?.dispose()
})
</script>

<style lang="scss" scoped>
.overview-page {
  padding: 32px 24px 60px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.page-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  &:hover { background: #f1f5f9; color: #0f172a; }
}

.page-title-wrap { display: flex; align-items: baseline; gap: 10px; min-width: 0; }

.chart-tip {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 8px;
  padding: 6px 10px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 6px;
  line-height: 1.4;
}
.page-title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
.page-sub { font-size: 13px; color: #94a3b8; }

.stats {
  margin-left: auto;
  display: flex;
  gap: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 18px;
}
.stat-item {
  text-align: center;
  b { display: block; font-size: 18px; color: #0f172a; line-height: 1.2; }
  span { font-size: 11px; color: #64748b; }
}

.view-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.view-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover { border-color: #6366f1; transform: translateY(-1px); }
  &.active {
    border-color: #6366f1;
    background: #eef2ff;
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.18);
  }
}
.view-tab-icon { font-size: 16px; }
.view-tab-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.view-tab-desc { font-size: 12px; color: #64748b; }

.panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 20px 20px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
  min-height: 24px;
  flex-wrap: wrap;
}
.panel-desc { font-size: 13px; color: #64748b; margin: 0; line-height: 1.6; }
.panel-controls { display: flex; gap: 16px; flex-shrink: 0; }

.chart { width: 100%; }
.graph-chart { height: 640px; }
.radar-chart { height: 520px; }
.growth-chart { height: 360px; }

@media (max-width: 768px) {
  .overview-page { padding: 16px 12px 40px; }
  .page-top { flex-wrap: wrap; gap: 10px; }
  .stats { margin-left: 0; width: 100%; justify-content: space-around; gap: 8px; padding: 8px 0; }
  .view-tabs { flex-direction: column; }
  .view-tab { border-radius: 12px; }
  .graph-chart { height: 480px; }
  .radar-chart { height: 360px; }
  .growth-chart { height: 300px; }
  .page-sub { display: none; }
  .panel-desc { display: none; }
  .panel { padding: 12px 10px 16px; }
  .chart-tip { font-size: 11px; padding: 5px 8px; margin-bottom: 6px; }
}

@media (max-width: 480px) {
  .overview-page { padding: 12px 8px 32px; }
  .graph-chart { height: 420px; }
  .radar-chart { height: 320px; }
  .view-tab-desc { display: none; }
  .panel { padding: 10px 8px 14px; }
  .chart-tip { font-size: 10px; padding: 4px 6px; }
}
</style>

<style lang="scss">
html.dark-mode .overview-page {
  .page-title { color: #e2dee9; }
  .page-sub { color: #64748b; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .stats { background: #1e1e2e; border-color: #2d2d4a; }
  .stat-item b { color: #e2dee9; }
  .stat-item span { color: #94a3b8; }
  .view-tab { background: #1e1e2e; border-color: #2d2d4a;
    &:hover { border-color: #6366f1; }
    &.active { background: #232347; border-color: #6366f1; }
    .view-tab-name { color: #e2dee9; }
    .view-tab-desc { color: #94a3b8; }
  }
  .panel { background: #1e1e2e; border-color: #2d2d4a; }
  .panel-desc { color: #94a3b8; }
  .chart-tip { background: rgba(148, 163, 184, 0.12); }
}
</style>

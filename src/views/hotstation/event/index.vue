<template>
  <div class="hs-detail-page" data-hs-detail-page>
    <div v-if="!event" class="detail-loading"><el-skeleton :rows="8" animated /></div>

    <template v-else>
      <!-- 头部 -->
      <div class="d-head">
        <el-button text class="d-back" @click="router.push('/hotstation/curation')">← 返回信息流</el-button>
        <div class="d-title-row">
          <h1 class="d-title">{{ event.title }}</h1>
          <span v-if="event.is_verified" class="verified-stamp" title="同一事实已被 ≥3 个高权重信源交叉验证">◆ 多方核实</span>
          <el-tag size="small" :type="statusType">{{ statusName }}</el-tag>
        </div>
        <div class="d-keywords">
          <el-tag v-for="kw in event.keywords || []" :key="kw" size="small" type="info" effect="plain">{{ kw }}</el-tag>
        </div>
        <div class="d-actions">
          <el-button
            v-if="event.status === 'pending'"
            type="primary"
            @click="doTrack(true)"
          ><el-icon style="margin-right: 4px"><View /></el-icon>追踪此事件</el-button>
          <el-button v-else-if="event.status === 'tracking'" type="warning" plain @click="doTrack(false)">
            结束追踪
          </el-button>
          <el-button type="primary" @click="openGenerate"><el-icon style="margin-right: 4px"><EditPen /></el-icon>生成文章/脚本</el-button>
        </div>
      </div>

      <!-- 雷达图 + 摘要 -->
      <div class="d-grid-2">
        <div class="d-card radar-card">
          <div class="d-card-title">事件雷达图</div>
          <div ref="radarRef" class="radar-chart"></div>
        </div>
        <div class="d-card summary-card">
          <div class="d-card-title">核心事实</div>
          <p class="d-summary">{{ event.verified_fact || event.summary || '暂无摘要' }}</p>
          <div class="d-nutrition">
            <div class="nut-row">
              <span class="nut-label"><el-icon><DataAnalysis /></el-icon>事实密度</span>
              <el-progress :percentage="event.nutrition.factDensity" :show-text="false" :stroke-width="8" />
              <span class="nut-val">{{ event.nutrition.factDensity }}%</span>
            </div>
            <div class="nut-row">
              <span class="nut-label"><el-icon><ChatDotRound /></el-icon>观点占比</span>
              <el-progress :percentage="event.nutrition.opinionRatio" :show-text="false" :stroke-width="8" type="line" />
              <span class="nut-val">{{ event.nutrition.opinionRatio }}%</span>
            </div>
            <div class="nut-inline">
              <span class="nut-chip"><el-icon><RefreshRight /></el-icon>重复度 {{ event.nutrition.repeat }}</span>
              <span class="nut-chip"><el-icon><ScaleToOriginal /></el-icon>立场 {{ event.nutrition.lean }}</span>
              <span class="nut-chip"><el-icon><TrendCharts /></el-icon>热度 {{ event.heat_score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间线河流图 -->
      <div class="d-card">
        <div class="d-card-title">时间线河流图 <span class="d-card-tip">主航道为官方/主流事实节点，支流为讨论与辟谣</span></div>
        <div ref="timelineRef" class="timeline-chart"></div>
        <div v-if="!event.timeline.length" class="no-timeline">暂无时间线节点，等待新报道入库</div>
      </div>

      <!-- 报道全文 -->
      <div v-if="event.timeline.length" class="d-card">
        <div class="d-card-title"><el-icon style="margin-right: 4px"><Document /></el-icon>报道全文（{{ event.timeline.length }}）</div>
        <div v-for="r in event.timeline" :key="r.id" class="report-item">
          <div class="report-meta">
            <el-tag size="small" :type="r.isHighWeight ? 'primary' : 'info'">{{ r.source }}</el-tag>
            <span class="report-time">{{ formatTime(r.time) }}</span>
            <el-tag v-if="r.isHighWeight" size="small" type="success" effect="plain">高权重</el-tag>
          </div>
          <a v-if="r.url" class="report-link" :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
          <div v-else class="report-link">{{ r.title }}</div>
          <p class="report-content">{{ r.content }}</p>
        </div>
      </div>

      <!-- 观点 -->
      <div class="d-card">
        <div class="d-card-title"><el-icon style="margin-right: 4px"><Promotion /></el-icon>各方声音（{{ event.opinions.length }}）</div>
        <el-radio-group v-model="stanceFilter" size="small" class="stance-filter">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="support">支持派</el-radio-button>
          <el-radio-button value="oppose">反对派</el-radio-button>
          <el-radio-button value="neutral">中立派</el-radio-button>
        </el-radio-group>
        <div v-for="(g, gi) in groupedOpinions" :key="gi" class="stance-group">
          <div class="stance-head">{{ STANCE_NAMES[g.stance] }}</div>
          <div v-for="(op, oi) in g.items" :key="oi" class="opinion-item">
            <span class="op-source">[{{ op.source || '未知来源' }}]</span>
            <span class="op-content">{{ op.content }}</span>
          </div>
        </div>
        <div v-if="!groupedOpinions.length" class="no-opinion">暂无观点</div>
        <div v-if="event.emotions.length" class="emotions-block">
          <div class="stance-head"><el-icon style="margin-right: 4px"><ChatLineSquare /></el-icon>网民情绪</div>
          <div v-for="(e, i) in event.emotions" :key="i" class="emotion-item">{{ e }}</div>
        </div>
      </div>

      <!-- 白皮书 -->
      <div v-if="event.whitepaper" class="d-card wp-card">
        <div class="d-card-title"><el-icon style="margin-right: 4px"><DocumentChecked /></el-icon>尘埃落定 · 白皮书
          <el-tag size="small" :type="wpStatusType" style="margin-left: 8px">{{ wpStatusName }}</el-tag>
        </div>
        <div class="wp-stats">
          <span>共 {{ wp.timeline?.length || 0 }} 个时间节点</span>
          <span>核实事实 {{ wp.verifiedFacts?.length || 0 }} 条</span>
          <span>立场汇总 {{ wp.finalStances?.length || 0 }} 条</span>
          <span v-if="wp.dataConflicts?.length">辟谣记录 {{ wp.dataConflicts.length }} 条</span>
        </div>
      </div>

      <!-- 主编已生成 -->
      <div class="d-card">
        <div class="d-card-title" style="cursor: pointer" @click="showGens = !showGens">
          <el-icon style="margin-right: 4px"><Reading /></el-icon>主编已生成的精选内容（{{ generations.length }}）
          <el-icon :class="{ rotated: showGens }"><ArrowDown /></el-icon>
        </div>
        <template v-if="showGens">
          <div v-for="g in generations" :key="g.id" class="gen-item">
            <div class="gen-meta">
              <el-tag size="small">{{ MODE_NAMES[g.mode] || g.mode }}</el-tag>
              <span v-if="g.platform" class="gen-platform">平台：{{ g.platform }}</span>
              <span class="gen-time">{{ formatTime(g.created_at) }}</span>
              <span v-if="g.tokens_used" class="gen-tokens">{{ g.tokens_used }} tokens</span>
            </div>
            <pre class="gen-content">{{ g.result_content }}</pre>
            <el-button size="small" plain @click="copyGen(g)"><el-icon style="margin-right: 4px"><CopyDocument /></el-icon>复制</el-button>
          </div>
          <el-empty v-if="!generations.length" description="暂无已生成内容" :image-size="60" />
        </template>
      </div>
    </template>

    <!-- 生成抽屉 -->
    <GenerateDrawer v-model="drawerVisible" :event="event" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { ArrowDown, View, EditPen, DataAnalysis, ChatDotRound, RefreshRight, ScaleToOriginal, TrendCharts, Promotion, ChatLineSquare, DocumentChecked, Reading, CopyDocument, Document } from '@element-plus/icons-vue'
import GenerateDrawer from '../components/GenerateDrawer.vue'
import { getEventDetail, toggleTrack, getGenerations } from '@/api/hotstation'

const route = useRoute()
const router = useRouter()

const event = ref(null)
const radarRef = ref(null)
const timelineRef = ref(null)
const radarChart = ref(null)
const timelineChart = ref(null)
const stanceFilter = ref('all')
const showGens = ref(false)
const generations = ref([])
const drawerVisible = ref(false)

const STANCE_NAMES = { support: '支持派', oppose: '反对派', neutral: '中立派' }
const MODE_NAMES = { brief: '资讯快报', deep: '深度长文', video: '短视频脚本', xhs: '小红书笔记', podcast: '播客双人对谈' }

const statusName = computed(() => ({ pending: '孕育中', tracking: '追踪中', archived: '已归档' })[event.value?.status] || '')
const statusType = computed(() => ({ pending: 'info', tracking: 'primary', archived: 'warning' })[event.value?.status] || 'info')
const wp = computed(() => event.value?.whitepaper || null)
const wpStatusName = computed(() => ({ draft: '草稿·待审阅', published: '已发布', archived: '已存档' })[wp.value?.status] || '')
const wpStatusType = computed(() => ({ draft: 'warning', published: 'success', archived: 'info' })[wp.value?.status] || 'info')

const groupedOpinions = computed(() => {
  const list = (event.value?.opinions || []).filter(o => stanceFilter.value === 'all' || o.stance === stanceFilter.value)
  const groups = []
  for (const stance of ['support', 'oppose', 'neutral']) {
    const items = list.filter(o => (o.stance || 'neutral') === stance)
    if (items.length) groups.push({ stance, items })
  }
  return groups
})

async function load() {
  try {
    const res = await getEventDetail(route.params.id)
    if (!res.data) { ElMessage.error('事件不存在'); return }
    event.value = res.data
    await nextTick()
    initRadar()
    initTimeline()
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  }
}

function initRadar() {
  if (!radarRef.value) return
  radarChart.value?.dispose()
  radarChart.value = echarts.init(radarRef.value)
  const isDark = document.documentElement.classList.contains('dark-mode')
  radarChart.value.setOption({
    backgroundColor: 'transparent',
    radar: {
      indicator: (event.value.radar || []).map(r => ({ name: r.name, max: 100 })),
      radius: '70%',
      splitNumber: 4,
      axisName: { color: isDark ? '#94a3b8' : '#606266', fontSize: 12 },
      splitLine: { lineStyle: { color: isDark ? '#2d2d4a' : '#e4e7ed' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: isDark ? '#2d2d4a' : '#e4e7ed' } }
    },
    series: [{
      type: 'radar',
      data: [{ value: (event.value.radar || []).map(r => r.value), name: '事件画像' }],
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color: isDark ? '#a78bfa' : '#6366f1', width: 2 },
      itemStyle: { color: isDark ? '#a78bfa' : '#6366f1' },
      areaStyle: { color: isDark ? 'rgba(167, 139, 250, 0.12)' : 'rgba(99, 102, 241, 0.08)' }
    }]
  })
}

function initTimeline() {
  if (!timelineRef.value) return
  timelineChart.value?.dispose()
  timelineChart.value = echarts.init(timelineRef.value)
  const isDark = document.documentElement.classList.contains('dark-mode')
  const tl = event.value.timeline || []
  const TRACKS = { official: 2, community: 1, rumor_refute: 0 }
  const seriesMap = { official: [], community: [], rumor_refute: [] }
  tl.forEach(n => {
    const t = n.nodeType in TRACKS ? n.nodeType : 'community'
    seriesMap[t].push([new Date(n.time).getTime(), TRACKS[t]])
  })
  const colorMap = {
    official: { main: isDark ? '#a78bfa' : '#6366f1', name: '官方/主流' },
    community: { main: isDark ? '#4ade80' : '#67c23a', name: '网友讨论' },
    rumor_refute: { main: isDark ? '#f87171' : '#f56c6c', name: '谣言/辟谣' }
  }
  timelineChart.value.setOption({
    backgroundColor: 'transparent',
    grid: { left: 50, right: 16, top: 30, bottom: 40 },
    tooltip: {
      trigger: 'item',
      formatter: p => {
        const n = tl[p.dataIndex]
        return `<b>${n.time?.slice(0, 16)}</b><br/>${n.source}<br/>${n.title || ''}`
      }
    },
    xAxis: {
      type: 'time',
      axisLabel: { color: isDark ? '#94a3b8' : '#606266' },
      axisLine: { lineStyle: { color: isDark ? '#2d2d4a' : '#e4e7ed' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ['谣言/辟谣', '网友讨论', '官方/主流'],
      axisLabel: { color: isDark ? '#94a3b8' : '#606266' },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: Object.keys(seriesMap).map(k => ({
      name: colorMap[k].name,
      type: 'scatter',
      data: seriesMap[k],
      symbolSize: 10,
      itemStyle: { color: colorMap[k].main, opacity: 0.85 },
      connectNulls: true,
      markLine: undefined
    }))
  })
}

async function doTrack(tracking) {
  try {
    await toggleTrack(event.value.id, tracking)
    ElMessage.success(tracking ? '已开启追踪' : '已结束追踪')
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

function openGenerate() {
  drawerVisible.value = true
}

async function loadGenerations() {
  try {
    const res = await getGenerations(route.params.id)
    generations.value = res.data
  } catch { generations.value = [] }
}

function copyGen(g) {
  navigator.clipboard.writeText(g.result_content).then(() => ElMessage.success('已复制'))
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const onResize = () => { radarChart.value?.resize(); timelineChart.value?.resize() }

onMounted(() => {
  load()
  loadGenerations()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  radarChart.value?.dispose()
  timelineChart.value?.dispose()
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

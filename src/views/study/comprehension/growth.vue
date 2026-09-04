<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">成长看板</h1>
      <span v-if="growth" class="page-sub">累计测评 {{ growth.assessedCount }} 次</span>
    </div>

    <div v-if="loading" class="cp-loading">加载成长数据…</div>
    <template v-else-if="growth">
      <!-- 健康概览 -->
      <section class="cp-health-row">
        <div class="cp-health-card">
          <div class="cp-health-ring" :style="{ '--pct': growth.health.indexScore }">
            <div class="cp-health-ring-in"><b>{{ growth.health.indexScore }}</b><span>理解力指数</span></div>
          </div>
          <div class="cp-health-text">
            <div class="cp-health-stab">近 14 天打卡 {{ growth.health.stabilityText }}</div>
            <div v-if="growth.health.focus && growth.health.focus.dim" class="cp-health-focus">
              🎯 近一个月发力：{{ growth.health.focus.dim }}（{{ growth.health.focus.from }} → {{ growth.health.focus.to }}）
            </div>
          </div>
        </div>
        <div class="cp-stat" v-for="s in statCards" :key="s.label">
          <b>{{ s.value }}</b>
          <span>{{ s.label }}</span>
        </div>
      </section>

      <!-- 能力曲线 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">能力等级变化（每次测评）</h4>
        <div v-if="!growth.curve.length" class="cp-panel-empty">完成测评后，这里会出现你的成长曲线。</div>
        <div v-else ref="curveEl" class="cp-curve"></div>
      </section>

      <!-- 打卡热力 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">近 90 天投入热力</h4>
        <div class="cp-heat">
          <div v-for="(h, i) in heatCells" :key="i" class="cp-heat-cell" :class="'l' + Math.min(h.count, 3)"
            :title="h.date + '：训练/打卡 ' + h.count + ' 次'">
          </div>
        </div>
        <div class="cp-heat-legend">
          <span class="cp-heat-cell l0"></span><em>无</em>
          <span class="cp-heat-cell l1"></span><em>训练</em>
          <span class="cp-heat-cell l2"></span><em>打卡</em>
          <span class="cp-heat-cell l3"></span><em>两者</em>
        </div>
      </section>

      <!-- 题型正确率 -->
      <section v-if="growth.kindStats.length" class="cp-panel">
        <h4 class="cp-panel-title">各题型表现</h4>
        <div v-for="k in growth.kindStats" :key="k.kind" class="cp-kind-row">
          <span class="cp-kind-name">{{ kindName(k.kind) }}</span>
          <div class="cp-kind-track">
            <i :style="{ width: k.accuracy + '%', background: k.accuracy >= 80 ? 'var(--cp-ok)' : k.accuracy >= 60 ? 'var(--cp-warn)' : 'var(--cp-bad)' }"></i>
          </div>
          <span class="cp-kind-num">{{ k.accuracy }}%</span>
          <span class="cp-kind-total">{{ k.total }} 题</span>
        </div>
      </section>

      <!-- 里程碑 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">成长里程碑</h4>
        <div v-if="!growth.milestones.length" class="cp-panel-empty">坚持训练，里程碑会在这里被点亮。</div>
        <div v-else class="cp-mile">
          <div v-for="m in growth.milestones" :key="m.time" class="cp-mile-item">
            <span class="cp-mile-dot" :class="m.type"></span>
            <div class="cp-mile-body">
              <b>{{ m.title }}</b>
              <span class="cp-mile-time">{{ fmtTime(m.time) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 测评历史 -->
      <section v-if="assessList.length" class="cp-panel">
        <h4 class="cp-panel-title">测评历史</h4>
        <div class="cp-assess-list">
          <div v-for="a in assessList" :key="a.id" class="cp-assess-row" @click="$router.push('/study/comprehension/report/' + a.id)">
            <span class="cp-assess-date">{{ (a.finishedAt || '').slice(0, 10) }}</span>
            <span v-for="d in DIM_META" :key="d.id" class="cp-assess-lv" :style="{ color: d.color }">
              {{ d.id }} L{{ a.levels[d.id] ?? 0 }}
            </span>
            <el-icon class="cp-assess-go"><ArrowRight /></el-icon>
          </div>
        </div>
      </section>
    </template>
    <el-empty v-else-if="!loading" description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getGrowth, getAssessments } from '@/api/comprehension'
import { DIM_META, KIND_NAME } from './cp-meta'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')
const loading = ref(true)
const growth = ref(null)
const assessList = ref([])
const curveEl = ref(null)
let chart = null

const statCards = computed(() => {
  const h = (growth.value && growth.value.health) || {}
  const ks = (growth.value && growth.value.kindStats) || []
  const total = ks.reduce((s, k) => s + k.total, 0)
  return [
    { label: '总训练题', value: total },
    { label: '错题待巩固', value: 0, hidden: true },
    { label: '累计测评', value: (growth.value && growth.value.assessedCount) || 0 },
    { label: '里程碑', value: (growth.value && growth.value.milestones.length) || 0 }
  ].filter((s) => !s.hidden)
})

const heatCells = computed(() => {
  const arr = (growth.value && growth.value.heat) || []
  const map = {}
  arr.forEach((h) => { map[h.date] = h.count })
  const out = []
  // 按自然日从旧到新填充（90 格）
  const d = new Date()
  d.setDate(d.getDate() - 89)
  for (let i = 0; i < 90; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({ date: key, count: map[key] || 0 })
    d.setDate(d.getDate() + 1)
  }
  return out
})

function kindName(k) { return KIND_NAME[k] || k }

function fmtTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const COLORS = { D1: '#4f7df9', D2: '#14b8a6', D3: '#f59e0b', D4: '#ec4899' }

/** 读取 CSS 变量实际色值（echarts canvas 不解析 var()） */
function cv(name, fallback = '') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
let themeObserver = null

function renderCurve() {
  if (!chart && curveEl.value) chart = echarts.init(curveEl.value)
  if (!chart) return
  const curve = growth.value.curve
  const dates = curve.map((c) => c.date.slice(5))
  const line = cv('--cp-line', '#e2e8f0')
  const sub = cv('--cp-sub', '#7d7a96')
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: cv('--cp-card', '#fff'),
      borderColor: line,
      textStyle: { color: cv('--cp-ink', '#303133') }
    },
    legend: { data: DIM_META.map((m) => m.name), textStyle: { color: sub }, top: 0 },
    grid: { left: 36, right: 20, top: 42, bottom: 26 },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: line } }, axisLabel: { color: sub } },
    yAxis: { type: 'value', min: 0, max: 5, interval: 1, splitLine: { lineStyle: { color: line } }, axisLabel: { color: sub } },
    series: DIM_META.map((m) => ({
      name: m.name,
      type: 'line',
      smooth: true,
      data: curve.map((c) => c[m.id]),
      symbolSize: 6,
      lineStyle: { width: 2.5, color: COLORS[m.id] },
      itemStyle: { color: COLORS[m.id] }
    }))
  })
}

const onResize = () => chart && chart.resize()

onMounted(async () => {
  try {
    const res = await getGrowth()
    if (res.success) growth.value = res.data
    const res2 = await getAssessments()
    if (res2.success) assessList.value = (res2.data && res2.data.list) || []
  } finally {
    loading.value = false
    await nextTick()
    if (growth.value && growth.value.curve.length) {
      renderCurve()
      window.addEventListener('resize', onResize)
      // 主题切换（html.dark-mode class 变化）时按新配色重绘
      themeObserver = new MutationObserver(() => { renderCurve() })
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (themeObserver) { themeObserver.disconnect(); themeObserver = null }
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style lang="scss" scoped>
.cp-page { min-height: 100vh; padding: 18px 22px 60px; max-width: 1020px; margin: 0 auto; color: var(--cp-ink); }
.page-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  .back-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--cp-card); border: 1px solid var(--cp-line); color: var(--cp-ink); border-radius: 10px; padding: 7px 12px; font-size: 13px; cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } }
  .page-title { font-size: 20px; margin: 0; }
  .page-sub { font-size: 12.5px; color: var(--cp-sub); }
}
.cp-loading { padding: 60px 0; text-align: center; color: var(--cp-sub); }

.cp-health-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 16px; }
.cp-health-card { flex: 1.4; min-width: 300px; display: flex; align-items: center; gap: 18px; background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 18px 20px; box-shadow: var(--cp-shadow);
  .cp-health-ring { --pct: 0; width: 92px; height: 92px; border-radius: 50%; background: conic-gradient(var(--cp-accent) calc(var(--pct) * 1%), var(--cp-accent-softer) 0); display: flex; align-items: center; justify-content: center; flex: none;
    .cp-health-ring-in { width: 70px; height: 70px; border-radius: 50%; background: var(--cp-card); display: flex; flex-direction: column; align-items: center; justify-content: center;
      b { font-size: 20px; color: var(--cp-accent-strong); }
      span { font-size: 10.5px; color: var(--cp-sub); } } }
  .cp-health-text { font-size: 13px; color: var(--cp-sub); line-height: 1.9;
    .cp-health-stab { font-weight: 600; color: var(--cp-ink); font-size: 14.5px; }
    .cp-health-focus { margin-top: 4px; } } }
.cp-stat { flex: 1; min-width: 110px; background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 16px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; box-shadow: var(--cp-shadow);
  b { font-size: 21px; color: var(--cp-accent-strong); }
  span { font-size: 12px; color: var(--cp-sub); } }

.cp-panel { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 18px 20px; box-shadow: var(--cp-shadow); margin-bottom: 16px; }
.cp-panel-title { margin: 0 0 14px; font-size: 15px; }
.cp-panel-empty { color: var(--cp-sub); font-size: 13.5px; padding: 20px 0; text-align: center; }
.cp-curve { width: 100%; height: 300px; }

/* 热力 */
.cp-heat { display: grid; grid-template-columns: repeat(18, 1fr); gap: 5px; }
.cp-heat-cell { aspect-ratio: 1; border-radius: 3px; background: var(--cp-card-2); border: 1px solid var(--cp-line);
  &.l1 { background: rgba(109, 93, 252, 0.3); border-color: transparent; }
  &.l2 { background: rgba(109, 93, 252, 0.55); border-color: transparent; }
  &.l3 { background: var(--cp-accent); border-color: transparent; } }
.cp-heat-legend { display: flex; align-items: center; gap: 6px; margin-top: 12px; justify-content: flex-end; font-size: 12px; color: var(--cp-sub);
  em { font-style: normal; margin-right: 10px; }
  .cp-heat-cell { width: 13px; aspect-ratio: 1; } }

/* kind */
.cp-kind-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px dashed var(--cp-line);
  &:last-child { border-bottom: none; }
  .cp-kind-name { width: 90px; font-size: 13px; font-weight: 600; }
  .cp-kind-track { flex: 1; height: 9px; border-radius: 6px; background: var(--cp-card-2);
    i { display: block; height: 100%; border-radius: 6px; } }
  .cp-kind-num { width: 44px; text-align: right; font-weight: 700; font-size: 13.5px; }
  .cp-kind-total { width: 60px; text-align: right; font-size: 12px; color: var(--cp-sub); } }

/* 里程碑 */
.cp-mile { display: flex; flex-direction: column; gap: 0; }
.cp-mile-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px;
  &::before { content: ''; position: absolute; left: 6px; top: 14px; bottom: -2px; width: 2px; background: var(--cp-line); }
  &:last-child::before { display: none; }
  .cp-mile-dot { flex: none; width: 13px; height: 13px; border-radius: 50%; margin-top: 3px; z-index: 1;
    background: var(--cp-accent);
    &.checkin { background: var(--cp-d2); }
    &.levelup { background: var(--cp-d3); }
    &.assessment { background: var(--cp-accent); } }
  .cp-mile-body { b { font-size: 14px; display: block; }
    .cp-mile-time { font-size: 12px; color: var(--cp-sub); } } }

/* assess history */
.cp-assess-list { display: flex; flex-direction: column; gap: 8px; }
.cp-assess-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: var(--cp-card-2); border: 1px solid var(--cp-line); border-radius: 10px; padding: 10px 14px; cursor: pointer; transition: border-color 0.15s;
  &:hover { border-color: var(--cp-accent); }
  .cp-assess-date { font-size: 13px; font-weight: 600; min-width: 90px; }
  .cp-assess-lv { font-size: 12.5px; font-weight: 700; }
  .cp-assess-go { margin-left: auto; color: var(--cp-sub); } }

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-health-card { min-width: 0; flex: 1 1 100%; }
  .cp-panel { padding: 16px; }
  .cp-curve { height: 260px; }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-health-card { flex-direction: column; align-items: flex-start; gap: 14px; }
  .cp-stat { min-width: calc(50% - 7px); }
  .cp-heat { gap: 3px; }
  .cp-kind-name { width: 72px; }
  .cp-kind-total { width: auto; }
  .cp-assess-lv { font-size: 12px; }
}
</style>
